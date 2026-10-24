const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('js/payment.js', 'utf8') + '\nthis.payment = PaymentQR;', ctx);
const payment = ctx.payment;
const expected = 'SPD*1.0*ACC:CZ9555000000000824880004*AM:2538.45*CC:CZK*X-VS:0012605606';
assert.equal(payment.payload(2538.45, '0012605606'), expected);
assert.equal(payment.payload(0.01), 'SPD*1.0*ACC:CZ9555000000000824880004*AM:0.01*CC:CZK');
assert.ok(!payment.payload(9999999.99).includes('X-VS'));
for (const n of [0, -1, NaN, Infinity, '', 0.001, 10000000]) assert.throws(() => payment.payload(n));
for (const vs of ['12345678901', '2026/123', '*ACC:CZ00', '<script>']) assert.throws(() => payment.payload(1, vs));
assert.equal(payment.iban.slice(4, 8), '5500');
assert.equal(payment.iban.slice(8, 14), '000000');
assert.equal(Number(payment.iban.slice(14)), 824880004);
const rearranged = payment.iban.slice(4) + payment.iban.slice(0, 4);
const numeric = rearranged.replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
assert.equal(BigInt(numeric) % 97n, 1n);
console.log('SPAYD: account/IBAN checksum, cents, limits, optional VS and leading zeros OK.');

if (process.argv.includes('--browser')) {
  const {chromium} = require('playwright');
  (async () => {
    const browser = await chromium.launch({channel:'msedge',headless:true});
    try {
      const page = await browser.newPage({viewport:{width:1000,height:1200}});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      // Prove QR generation needs no network; PDF fallback is browser printing.
      await page.route(/^https?:/, route => route.abort());
      await page.goto(pathToFileURL(path.resolve('index.html')).href);
      await page.evaluate(() => {
        const vehicle = VehicleStorage.saveVehicle({brand:'ford', modelKey:'focus_4', modelName:'Focus IV', year:2018, engineName:'1.5 EcoBlue 88 kW', mileage:1000});
        VehicleStorage.setActiveVehicleId(vehicle.id);
        App.render();
      });
      await page.locator('[data-tab=form]').click();
      await page.locator('#srv-date').fill('2026-10-23');
      await page.locator('#srv-mileage').fill('999999');
      await page.locator('#srv-notes').fill('Test platby');
      await page.locator('#auto-sum').uncheck();
      await page.locator('#srv-price').fill('2538.45');
      await page.locator('#srv-payment-enabled').check();
      await page.locator('#srv-payment-vs').fill('0012605606');
      await page.locator('#service-form button[type=submit]').click();
      const saved = await page.evaluate(() => VehicleStorage.getAllServices().find(r => r.notes === 'Test platby'));
      assert.deepEqual(saved.payment, {enabled:true,variableSymbol:'0012605606'});
      await page.reload();
      await page.evaluate(id => App.startEdit(id), saved.id);
      assert.equal(await page.locator('#srv-payment-enabled').isChecked(), true);
      assert.equal(await page.locator('#srv-payment-vs').inputValue(), '0012605606');
      const html = await page.evaluate(id => {
        const r = VehicleStorage.getService(id);
        return PDFServicePrinter.buildProtocol(r, VehicleStorage.getActiveVehicle()).html;
      }, saved.id);
      assert.ok(html.includes('824880004/5500'));
      const preview = await browser.newPage({viewport:{width:900,height:1200}});
      await preview.route(/^https?:/, route => route.abort());
      preview.on('pageerror', e => errors.push(e.message));
      await preview.setContent(html);
      await preview.emulateMedia({media:'print'});
      assert.equal(await preview.locator('.payment').count(), 1);
      await preview.locator('.payment img').evaluate(img => img.decode());
      await preview.screenshot({path:'tests/payment-protocol.png',fullPage:true});
      // Decode a screenshot at actual CSS print size, not the original payload/matrix.
      const screenshot = await preview.locator('.payment img').screenshot();
      await preview.addScriptTag({path:path.resolve('tests/vendor/jsQR.js')});
      const decoded = await preview.evaluate(async data => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        return jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
      }, screenshot.toString('base64'));
      assert.equal(decoded, expected);
      await page.evaluate(() => App.resetForm());
      assert.equal(await page.locator('#srv-payment-enabled').isChecked(), false);
      assert.equal(await page.locator('#srv-payment-vs').inputValue(), '');
      const negative = await page.evaluate(id => {
        const record = VehicleStorage.getService(id), vehicle = VehicleStorage.getActiveVehicle();
        const noQr = PDFServicePrinter.buildProtocol({...record,payment:undefined}, vehicle).html;
        const book = PDFServicePrinter.buildBook(vehicle,[record]).html;
        let blocked = false;
        try { PDFServicePrinter.buildProtocol({...record,totalPrice:0}, vehicle); } catch (_) { blocked = true; }
        return {legacy:noQr.includes('aria-label="QR platba"'),book:book.includes('aria-label="QR platba"'),blocked};
      }, saved.id);
      assert.deepEqual(negative, {legacy:false,book:false,blocked:true});
      assert.deepEqual(errors, []);
      console.log('Browser: save/reload/reset, offline print image decoded independently, old records/book excluded, invalid total blocked.');
    } finally { await browser.close(); }
  })().catch(e => {console.error(e);process.exitCode=1;});
}
