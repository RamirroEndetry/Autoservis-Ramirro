const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/database.js', 'utf8') + '\nthis.original = JSON.parse(JSON.stringify(VEHICLE_DB));', context);
vm.runInContext(fs.readFileSync('js/ford-data.js', 'utf8') + fs.readFileSync('js/catalogue-data.js', 'utf8') + '\nthis.db = VEHICLE_DB; this.catalogue = VehicleCatalog; this.sources = CATALOGUE_SOURCES;', context);
const brands = ['skoda', 'vw', 'audi', 'yamaha', 'honda'];
for (const brand of brands) {
  const models = context.db[brand].models;
  for (const [key, old] of Object.entries(context.original[brand].models)) {
    assert.equal(models[key].name, old.name, 'Existing model identities must survive');
    assert.equal(models[key].kind, old.kind);
  }
  const sourced = Object.values(models).filter(m => m.source);
  assert.ok(sourced.length >= 4, brand);
  for (const model of sourced) {
    assert.ok(context.sources[model.source]);
    assert.ok(model.engines.length);
    assert.equal(new Set(model.engines.map(e => e.name)).size, model.engines.length);
    assert.ok(model.years[0] <= model.years[1]);
    for (const engine of model.engines) {
      assert.ok(engine.power > 0 && Number.isFinite(engine.power));
      assert.ok(!engine.oilSpec && !engine.oilCapacity);
    }
  }
  const firstKey = Object.keys(models)[0];
  assert.equal(context.catalogue.engine({brand, modelKey: firstKey, engineName: 'neznámý motor'}), null);
  assert.equal(context.catalogue.oilOptions({brand, modelKey: firstKey})[0], 'Dle specifikace konkrétního motoru');
  console.log(`${brand}: ${sourced.length} sourced offers, ${sourced.reduce((n, m) => n + m.engines.length, 0)} engine variants`);
}
const diesel = context.db.skoda.models.fabia_3.engines.filter(e => e.name.startsWith('1.4 TDI'));
assert.deepEqual(Array.from(diesel, e => e.power), [55, 66, 77]);
assert.ok(context.db.honda.models.nc750x_2014.engines.some(e => e.power === 40.3));
assert.ok(context.db.yamaha.models.mt07_2024.engines.some(e => e.power === 54));
assert.ok(context.db.yamaha.models.mt07_2014.engines.some(e => e.power === 55));
assert.equal(context.catalogue.kindOf({brand:'yamaha',modelKey:'xmax300_2024'}), 'scooter');

if (process.argv.includes('--browser')) {
  const {chromium} = require('playwright');
  const {pathToFileURL} = require('node:url');
  const path = require('node:path');
  (async () => {
    const browser = await chromium.launch({channel:'msedge',headless:true});
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve('index.html')).href);
      const cases = [
        ['skoda','fabia_3_2017','1.4 TDI 55 kW','2017'],
        ['vw','golf_4_variant','1.9 TDI 96 kW','2003'],
        ['audi','a4_b9_2019','2.0 35 TFSI (mHEV) 110 kW','2019'],
        ['yamaha','xmax300_2024','292 cm³ jednoválec 20,6 kW','2024'],
        ['honda','nc750x_2014','745 cm³ dvouválec 40,3 kW','2014']
      ];
      for (const [brand, modelKey, engine, year] of cases) {
        await page.evaluate(() => App.openVehicleModal());
        await page.locator(`#brand-grid [data-brand=${brand}]`).click();
        await page.locator('#veh-model').selectOption(modelKey);
        assert.equal(await page.locator('#veh-engine').inputValue(), '', 'No arbitrary first engine');
        await page.locator('#veh-year').selectOption(year);
        await page.locator('#veh-engine').selectOption(engine);
        assert.equal(await page.locator('#engine-source a').count(), 1);
        await page.locator('#veh-mileage').fill('12345');
        await page.locator('#vehicle-form button[type=submit]').click();
        await page.reload();
        await page.locator('#edit-vehicle-btn').click();
        assert.equal(await page.locator('#veh-engine').inputValue(), engine);
        assert.equal(await page.locator('#veh-year').inputValue(), year);
        await page.locator('#veh-engine').selectOption('__custom__');
        assert.equal(await page.locator('#veh-engine-custom-field').isVisible(), true);
        await page.locator('#veh-engine-custom').fill('Vlastní motor 42 kW');
        await page.locator('#vehicle-form button[type=submit]').click();
        await page.reload();
        await page.locator('#edit-vehicle-btn').click();
        assert.equal(await page.locator('#veh-engine').inputValue(), '__custom__');
        assert.equal(await page.locator('#veh-engine-custom').inputValue(), 'Vlastní motor 42 kW');
      }
      // Exercise every legacy model and actual stored names, including corrected Fabia diesels.
      for (const brand of brands) for (const [modelKey, model] of Object.entries(context.original[brand].models)) {
        const engineName = model.engines[model.engines.length - 1].name;
        await page.evaluate(v => App.openVehicleModal(v), {id:'legacy',brand,modelKey,modelName:model.name,year:1988,engineName,mileage:12345});
        const selected = await page.locator('#veh-engine').inputValue();
        const actual = selected === '__custom__' ? await page.locator('#veh-engine-custom').inputValue() : selected;
        assert.equal(actual, engineName, `${brand}/${modelKey}`);
        assert.equal(await page.locator('#veh-year').inputValue(), '1988');
      }
      // An annual source is not a restriction on recording the actual year.
      await page.evaluate(() => App.openVehicleModal({id:'year-test',brand:'yamaha',modelKey:'xmax300_2024',year:2023,engineName:'292 cm³ jednoválec 20,6 kW',mileage:1000}));
      assert.equal(await page.locator('#veh-year').inputValue(), '2023');
      assert.match(await page.locator('#veh-year option:checked').textContent(), /mimo doloženou/);
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await page.screenshot({path:'tests/catalogue-mobile.png',fullPage:true});
      assert.deepEqual(errors, []);
      console.log('Browser: all brands save/reload, custom engines, every legacy model, years and mobile OK.');
    } finally { await browser.close(); }
  })().catch(e => {console.error(e); process.exitCode=1;});
}
