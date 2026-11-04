const fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const {pathToFileURL}=require('url');const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:1000}}), errors=[];page.on('pageerror',e=>errors.push(e.message));
await require('./local-app.cjs')(page);await page.route(/^https?:/,r=>r.abort());await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.locator('#loans-btn').click();
await page.locator('#loan-name').fill('Jan <b>Test</b>');await page.locator('#loan-amount').fill('1000,50');await page.locator('#loan-date').fill('2026-01-01');await page.locator('#loan-dueDate').fill('2026-02-01');await page.locator('#loan-variableSymbol').fill('000123');await page.locator('#loan-notes').fill('PRIVATE NOTE');await page.locator('#loan-form button').first().click();
assert.equal(await page.locator('.loan-card').count(),1);assert.equal(await page.locator('.loan-card h4 b').count(),0);
await page.locator('[data-repay] [name=amount]').fill('250.25');await page.locator('[data-repay] button').click();
assert.equal(await page.evaluate(()=>LoanBook.due(LoanBook.all()[0])),75025);
await page.addScriptTag({path:path.resolve('tests/vendor/jsQR.js')});
const result=await page.evaluate(async()=>{
const loan=LoanBook.all()[0],html=LoanBook.document(loan).html,doc=new DOMParser().parseFromString(html,'text/html'),img=new Image();img.src=doc.querySelector('.payment img').src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return {qr:jsQR(ctx.getImageData(0,0,c.width,c.height).data,c.width,c.height).data,private:html.includes('PRIVATE NOTE')};});
assert.ok(result.qr.includes('*AM:750.25*'));assert.ok(result.qr.includes('*X-VS:000123'));assert.equal(result.private,false);
const checks=await page.evaluate(()=>{const loan=LoanBook.all()[0];let rejects=0;for(const amount of ['-1','1.234','99999'])try{LoanBook.addPayment(loan.id,amount,Utils.today(),'','');}catch(e){rejects++;}const backup=VehicleStorage.exportBackupData();VehicleStorage.saveSettings({loans:[]});const restored=VehicleStorage.importBackupData(backup,'replace');return {rejects,restored:restored.ok,due:LoanBook.due(LoanBook.all()[0])};});assert.deepEqual(checks,{rejects:3,restored:true,due:75025});
await page.evaluate(()=>document.getElementById('loans-modal').scrollTop=0);
await page.screenshot({path:'tests/loans-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'tests/loans-mobile.png',fullPage:true});
await page.locator('#loans-modal [data-close]').click();assert.equal(await page.locator('#loans-modal').isVisible(),false);await page.reload();assert.equal(await page.evaluate(()=>LoanBook.all().length),1);
const merge=await page.evaluate(()=>{const base={vehicles:[],services:[],settings:{loans:LoanBook.all()}},local=GarageSync.clone(base),remote=GarageSync.clone(base);local.settings.loans.push({...local.settings.loans[0],id:'second'});remote.settings.loans[0].notes='remote';return {independent:GarageSync.merge(base,local,remote).conflicts.length,conflicting:(()=>{local.settings.loans[0].notes='local';return GarageSync.merge(base,local,remote).conflicts.length;})()};});assert.deepEqual(merge,{independent:0,conflicting:1});
const final=await page.evaluate(()=>{const l=LoanBook.all()[0];LoanBook.addPayment(l.id,'750.25',Utils.today(),'','Hotově');const paid=LoanBook.get(l.id);const html=LoanBook.document(paid).html;const backup=VehicleStorage.exportBackupData();const empty={vehicles:[],services:[],settings:{}};const replaced=VehicleStorage.importBackupData(JSON.stringify(empty),'replace');const cleared=LoanBook.all().length;VehicleStorage.importBackupData(backup,'replace');return {due:LoanBook.due(paid),qr:html.includes('class="payment avoid-break"'),cleared,restored:LoanBook.all().length};});assert.deepEqual(final,{due:0,qr:false,cleared:0,restored:1});
assert.deepEqual(errors,[]);console.log('Loans: forms, cents, repayments, invalid amounts, decoded QR, privacy, backup restore, sync conflicts, reload and mobile passed.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
