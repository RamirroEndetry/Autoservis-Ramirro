const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve('dist');
const prefix = '/Autoservis-Ramirro/';
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  if (!url.pathname.startsWith(prefix)) {res.writeHead(404);return res.end();}
  const relative = url.pathname.slice(prefix.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)] || 'text/plain');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage();
    const errors = [], missing = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {if(r.url().startsWith(base) && r.status() >= 400) missing.push(r.url());});
    await page.goto(base);
    assert.equal(await page.locator('#no-vehicle-state').isVisible(),true);
    assert.equal(await page.evaluate(() => VehicleStorage.getVehicles().length),0);
    assert.equal(await page.locator('[data-action="restore-bundled"]').count(),0);
    const backup = {vehicles:[{id:'host-test',brand:'ford',modelKey:'focus_4',modelName:'Focus IV',year:2018,engineName:'1.5 EcoBlue 88 kW',mileage:1000}],services:[{id:'host-record',vehicleId:'host-test',date:'2026-10-24',mileage:1000,totalPrice:2538.45,items:[],notes:'Synthetic test',payment:{enabled:true,variableSymbol:'000123'}}],activeVehicleId:'host-test'};
    await page.locator('[data-action="open-backup"]').click();
    await page.locator('#import-merge-btn').click();
    await page.locator('#import-input').setInputFiles({name:'test-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await page.waitForFunction(() => VehicleStorage.getVehicles().some(v => v.id === 'host-test'));
    await page.reload();
    assert.equal(await page.evaluate(() => VehicleStorage.getService('host-record').totalPrice),2538.45);
    assert.equal(await page.locator('#no-vehicle-state').isVisible(),false);
    const popupPromise = page.waitForEvent('popup');
    await page.locator('[data-print="host-record"]').click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(await popup.locator('.payment img').count(),1);
    assert.match(await popup.locator('.payment').innerText(),/824880004\/5500/);
    const exported = await page.evaluate(() => JSON.parse(VehicleStorage.exportBackupData()));
    assert.equal(exported.vehicles[0].id,'host-test');
    assert.equal(exported.services[0].payment.variableSymbol,'000123');
    const second = await browser.newPage();
    await second.goto(base);
    assert.equal(await second.evaluate(() => VehicleStorage.getVehicles().length),0,'Isolated browser has no shared records');
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
    console.log('Hosted subpath: empty startup, backup upload/export, reload persistence, print popup and QR, isolated browser, all relative assets OK.');
  } finally {await browser.close();server.close();}
})().catch(e => {console.error(e);server.close();process.exitCode=1;});
