const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await require('./local-app.cjs')(page);await page.route(/^https?:/,r=>r.abort());
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    await page.evaluate(()=>{
      VehicleStorage.saveVehicle({id:'car',brand:'ford',modelKey:'focus_4',modelName:'Focus IV',year:2018,mileage:1000});
      VehicleStorage.saveServiceRecord({id:'auto',vehicleId:'car',date:'2026-10-25',mileage:1000,totalPrice:100.25,items:[{id:'c1',categoryId:'custom',label:'Original',price:100.25}]});
      VehicleStorage.saveServiceRecord({id:'manual',vehicleId:'car',date:'2026-10-25',mileage:1000,totalPrice:1000,items:[{id:'c2',categoryId:'custom',label:'Original',price:100}]});
      App.render();App.startEdit('auto');
    });
    const add=async(name,price)=>{await page.locator('#custom-name').fill(name);await page.locator('#custom-price').fill(price);await page.locator('#add-custom-btn').click();};
    assert.equal(await page.locator('#auto-sum').isChecked(),true);
    await add('Added','50.10');assert.equal(await page.locator('#srv-price').inputValue(),'150.35');
    await page.locator('#service-form button[type=submit]').click();await page.reload();
    await page.evaluate(()=>App.startEdit('auto'));assert.equal(await page.locator('#auto-sum').isChecked(),true);assert.equal(await page.locator('#srv-price').inputValue(),'150.35');
    await page.locator('#custom-list [data-remove]').last().click();assert.equal(await page.locator('#srv-price').inputValue(),'100.25');
    await page.evaluate(()=>App.startEdit('manual'));assert.equal(await page.locator('#auto-sum').isChecked(),false);
    await add('Added','50.25');assert.equal(await page.locator('#srv-price').inputValue(),'1050.25');
    await page.locator('#custom-list [data-remove]').last().click();assert.equal(await page.locator('#srv-price').inputValue(),'1000');
    await page.locator('#service-form button[type=submit]').click();await page.reload();await page.evaluate(()=>App.startEdit('manual'));
    assert.equal(await page.locator('#auto-sum').isChecked(),false);assert.equal(await page.locator('#srv-price').inputValue(),'1000');
    await page.locator('#clear-items-btn').click();assert.equal(await page.locator('#srv-price').inputValue(),'900');
    await page.evaluate(()=>{VehicleStorage.saveSettings({autoSum:false});App.resetForm();App.switchTab('form');});
    await add('New custom','49.95');assert.equal(await page.locator('#srv-price').inputValue(),'49.95');
    await page.locator('#auto-sum').check();await page.locator('#srv-price').fill('200');assert.equal(await page.locator('#auto-sum').isChecked(),false);
    await add('New custom 2','10.05');assert.equal(await page.locator('#srv-price').inputValue(),'210.05');
    assert.deepEqual(errors,[]);
    console.log('Custom totals passed: legacy edit inference, saved mode, add/remove/clear, manual-price preservation, disabled preference and decimal amounts.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
