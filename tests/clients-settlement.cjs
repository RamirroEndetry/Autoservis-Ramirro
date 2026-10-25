const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('js/payment.js','utf8')+'\nthis.S=ServiceSettlement',ctx);const S=ctx.S;
assert.equal(S.summary({totalPrice:100}).status,'unknown');
assert.equal(S.summary({totalPrice:-100}).status,'unknown');
assert.throws(()=>S.fromForm(-100,'unknown',''));
assert.equal(S.summary({totalPrice:100.50,settlement:{status:'partial',paidAmount:25.25}}).due,75.25);
assert.equal(S.summary({totalPrice:100,settlement:{status:'paid',paidAmount:100}}).due,0);
assert.equal(S.summary({totalPrice:200,settlement:{status:'paid',paidAmount:100}}).status,'partial');
for(const amount of [-1,101,NaN,Infinity])assert.throws(()=>S.fromForm(100,'partial',amount));
for(const amount of ['',0,100,1.234])assert.throws(()=>S.fromForm(100,'partial',amount));
assert.equal(S.fromForm(0,'paid','').paidAmount,0);
console.log('Settlement: unknown legacy state, partial/full payments, cents and invalid amounts passed.');
if(process.argv.includes('--browser'))(async()=>{
  const {chromium}=require('playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1100,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await require('./local-app.cjs')(page);await page.route(/^https?:/,r=>r.abort());await page.goto(pathToFileURL(path.resolve('index.html')).href);
    await page.locator('#clients-btn').click();await page.locator('#client-name').fill('Testovací klient <b>');await page.locator('#client-phone').fill('123456789');await page.locator('#client-email').fill('test@example.test');await page.locator('#client-notes').fill('<img src=x onerror=alert(1)>');await page.locator('#client-form button[type=submit],#client-form button:not([type])').click();
    const client=await page.evaluate(()=>ClientBook.all()[0]);assert.equal(client.name,'Testovací klient <b>');assert.equal(await page.locator('#clients-list img').count(),0);
    await page.locator('#client-name').fill('Druhý klient');await page.locator('#client-form button:not([type])').click();
    const second=await page.evaluate(()=>ClientBook.all()[1]);
    await page.evaluate(id=>{UI.closeModal('clients-modal');VehicleStorage.saveVehicle({id:'car',brand:'ford',modelKey:'focus_4',modelName:'Focus IV',year:2018,mileage:1000,baseMileage:1000,spz:'TEST123',vin:'SYNTHETIC-VIN',clientId:id});App.render();App.openVehicleModal(VehicleStorage.getVehicle('car'));},client.id);
    await page.locator('#veh-client').selectOption(second.id);await page.locator('#vehicle-form button[type=submit]').click();
    assert.equal(await page.evaluate(()=>VehicleStorage.getVehicle('car').clientId),second.id);
    await page.locator('#garage-btn').click();await page.locator('#garage-search').fill('Druhý');assert.equal(await page.locator('.garage-card').count(),1);await page.locator('#garage-search').fill('SYNTHETIC-VIN');assert.equal(await page.locator('.garage-card').count(),1);
    assert.equal(await page.evaluate(()=>UI.openStack.filter(x=>x.id==='garage-modal').length),1);
    await page.evaluate(()=>{UI.closeModal('garage-modal');VehicleStorage.saveServiceRecord({id:'service',vehicleId:'car',date:'2026-10-25',mileage:1000,totalPrice:1000.50,notes:'Synthetic service',items:[]});App.render();App.startEdit('service');});
    await page.locator('#srv-settlement').selectOption('partial');await page.locator('#srv-paid').fill('250.25');await page.locator('#srv-payment-enabled').check();await page.locator('#service-form button[type=submit]').click();
    let saved=await page.evaluate(()=>VehicleStorage.getService('service'));assert.equal(saved.settlement.paidAmount,250.25);assert.equal(saved.settlement.status,'partial');
    await page.addScriptTag({path:path.resolve('tests/vendor/jsQR.js')});
    const decoded=await page.evaluate(async()=>{
      const html=PDFServicePrinter.buildProtocol(VehicleStorage.getService('service'),VehicleStorage.getVehicle('car')).html;
      const doc=new DOMParser().parseFromString(html,'text/html');const img=new Image();img.src=doc.querySelector('.payment img').src;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const c=canvas.getContext('2d');c.drawImage(img,0,0);return jsQR(c.getImageData(0,0,img.width,img.height).data,img.width,img.height).data;
    });assert.ok(decoded.includes('*AM:750.25*'));
    await page.locator('#clients-btn').click();await page.locator('#clients-search').fill('TEST123');assert.match(await page.locator('#receivable-summary').innerText(),/750,25/);assert.equal(await page.locator('[data-client-service]').count(),1);
    await page.screenshot({path:'tests/clients-overview.png',animations:'disabled'});
    await page.locator('[data-client-service]').click();await page.locator('#srv-settlement').selectOption('paid');await page.locator('#service-form button[type=submit]').click();
    assert.equal(await page.evaluate(()=>PDFServicePrinter.buildProtocol(VehicleStorage.getService('service'),VehicleStorage.getVehicle('car')).html.includes('aria-label="QR platba"')),false);
    await page.evaluate(()=>App.startEdit('service'));await page.locator('#srv-price').fill('1200.50');assert.equal(await page.locator('#srv-settlement').inputValue(),'partial');assert.equal(await page.locator('#srv-paid').inputValue(),'1000.5');
    await page.locator('#service-form button[type=submit]').click();await page.reload();assert.equal(await page.evaluate(()=>ServiceSettlement.summary(VehicleStorage.getService('service')).due),200);
    const restore=await page.evaluate(()=>{const data=VehicleStorage.exportBackupData();VehicleStorage.clearAll();VehicleStorage.importBackupData(data,'replace');return {clients:ClientBook.all().length,linked:!!ClientBook.get(VehicleStorage.getVehicle('car').clientId),paid:VehicleStorage.getService('service').settlement.paidAmount};});
    assert.deepEqual(restore,{clients:2,linked:true,paid:1000.5});
    await page.setViewportSize({width:390,height:844});await page.locator('#clients-btn').click();await page.screenshot({path:'tests/clients-mobile.png',animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);console.log('Clients UI: contacts, escaping, vehicle assignment/search, payment edit, decoded remaining-balance QR, paid QR suppression, total correction, backup restore and mobile passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
