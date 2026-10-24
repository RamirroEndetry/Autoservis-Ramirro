const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/database.js', 'utf8') + fs.readFileSync('js/ford-data.js', 'utf8') + '\nthis.db = VEHICLE_DB; this.catalogue = VehicleCatalog; this.sources = FORD_SOURCES;', context);
const models = Object.values(context.db.ford.models).filter(m => m.source);
assert.ok(models.length >= 20);
for (const model of models) {
  assert.ok(model.engines.length > 0);
  assert.ok(context.sources[model.source]);
  assert.ok(model.years[0] <= model.years[1]);
  assert.equal(new Set(model.engines.map(e => e.name)).size, model.engines.length);
  for (const engine of model.engines) {
    assert.ok(engine.power > 0);
    assert.ok(!engine.oilSpec && !engine.oilCapacity, 'Unverified oil data must not be inferred');
  }
}
assert.ok(context.db.ford.models.focus.legacy);
assert.equal(context.catalogue.engine({brand: 'ford', modelKey: 'focus_4', engineName: ''}), null);
assert.equal(context.catalogue.engine({brand: 'ford', modelKey: 'focus_4', engineName: 'Ručně zadaný motor'}), null);
assert.equal(context.catalogue.engine({brand: 'ford', modelKey: 'focus_4', engineName: '1.5 EcoBlue 88 kW'}).power, 88);
console.log(models.length + ' Ford model phases, ' + models.reduce((s, m) => s + m.engines.length, 0) + ' engine variants; sources and legacy keys OK.');

if (process.argv.includes('--browser')) {
  const { chromium } = require('playwright');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  (async () => {
    const browser = await chromium.launch({channel: 'msedge', headless: true});
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve('index.html')).href);
      await page.locator('#add-vehicle-btn').click();
      await page.locator('#brand-grid [data-brand=ford]').click();
      await page.locator('#veh-model').selectOption('focus_4');
      await page.locator('#veh-year').selectOption('2018');
      await page.locator('#veh-engine').selectOption('1.5 EcoBlue 88 kW');
      assert.equal(await page.locator('#engine-source a').count(), 1);
      assert.ok(!(await page.locator('#engine-hint').textContent()).includes('undefined'));
      await page.locator('#veh-mileage').fill('120000');
      await page.locator('#vehicle-form button[type=submit]').click();
      await page.reload();
      await page.locator('#edit-vehicle-btn').click();
      assert.equal(await page.locator('#veh-engine').inputValue(), '1.5 EcoBlue 88 kW');
      assert.equal(await page.locator('#veh-year').inputValue(), '2018');
      await page.locator('#veh-engine').selectOption('__custom__');
      await page.locator('#veh-engine-custom').fill('Specifická motorizace 99 kW');
      await page.locator('#vehicle-form button[type=submit]').click();
      await page.locator('#edit-vehicle-btn').click();
      assert.equal(await page.locator('#veh-engine').inputValue(), '__custom__');
      assert.equal(await page.locator('#veh-engine-custom').inputValue(), 'Specifická motorizace 99 kW');
      // Previously stored generic Ford must not be assigned the first catalogue engine.
      await page.evaluate(() => App.openVehicleModal({id:'legacy-test',brand:'ford',modelKey:'focus',modelName:'Focus',year:1988,engineName:'',mileage:1000}));
      assert.equal(await page.locator('#veh-model').inputValue(), 'focus');
      assert.equal(await page.locator('#veh-engine').inputValue(), '');
      assert.equal(await page.locator('#veh-year').inputValue(), '1988');
      await page.locator('#brand-grid [data-brand=audi]').click();
      assert.equal(await page.locator('#engine-source').isVisible(), true);
      assert.equal(await page.locator('#veh-engine-custom-field').isVisible(), false);
      assert.ok((await page.locator('#veh-engine option').count()) > 1);
      assert.deepEqual(errors, []);
      console.log('Ford browser: saved engine/year, custom engine, legacy data and existing brands OK.');
    } finally { await browser.close(); }
  })().catch(e => { console.error(e); process.exitCode = 1; });
}
