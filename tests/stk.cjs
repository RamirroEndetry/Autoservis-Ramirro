const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await require('./local-app.cjs')(page);await page.route(/^https?:/,r=>r.abort());
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const statuses=await page.evaluate(()=>{
   VehicleStorage.clearAll();
   const days=[31,30,1,0,-1,null];
   return days.map((n,i)=>{const d=new Date();d.setDate(d.getDate()+(n||0));const v={id:'stk-'+i,brand:i===1?'honda':'vw',modelKey:i===1?'cbf_500_2007':'golf_6',modelName:'Golf VI',nickname:'Test '+i,mileage:1000,stkUntil:n===null?'':Utils.toISODate(d)};VehicleStorage.saveVehicle(v);return App.stkStatus(v).state;});
  });
  assert.deepEqual(statuses,['ok','soon','soon','soon','overdue','unknown']);
  await page.evaluate(()=>{VehicleStorage.setActiveVehicleId('stk-0');App.render();App.openGarageModal();});
  assert.equal(await page.locator('.garage-card .stk-countdown').count(),6);
  assert.equal(await page.locator('.garage-card .stk-status').count(),0);
  const positions=await page.locator('.garage-info').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().left));
  assert.ok(positions.every(x=>Math.abs(x-positions[0])<1),'Honda and other brands must align');
  assert.doesNotMatch(await page.locator('.garage-card .stk-countdown').first().innerText(),/\d{1,2}\.\s*\d{1,2}\./);
  assert.equal(await page.locator('.garage-card .stk-overdue').count(),1);
  assert.match(await page.locator('.garage-card .stk-unknown').innerText(),/datum není vyplněné/);
  assert.match(await page.locator('#hero-stk').getAttribute('class'),/stk-ok/);
  assert.match(await page.locator('#alert-strip').innerText(),/STK/);
  assert.equal(await page.evaluate(()=>App.buildFleetDocumentReminders().filter(r=>r.label.includes('STK')).length),4);
  await page.locator('#garage-modal').screenshot({path:'tests/stk-garage.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#garage-modal').screenshot({path:'tests/stk-mobile.png',animations:'disabled'});
  await page.evaluate(()=>UI.closeModal('garage-modal'));await page.locator('#hero-stk').click();assert.equal(await page.locator('.tab.active').getAttribute('data-tab'),'plan');
  await page.evaluate(()=>{document.querySelector('#srv-notes').value='Rozpracovaný text';App.reminderDay='2000-01-01';App.refreshReminderDay();});
  assert.equal(await page.locator('#srv-notes').inputValue(),'Rozpracovaný text');assert.equal(await page.evaluate(()=>App.reminderDay===Utils.today()),true);
  assert.deepEqual(errors,[]);console.log('STK: 31/30/1/0/-1 days and missing date, all garage vehicles, fleet alerts, detail navigation, daily refresh and mobile passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
