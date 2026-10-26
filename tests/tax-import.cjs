const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync('js/invoice.js','utf8')+';this.parser=InvoiceParser;',context);
// Synthetic rows: multiple quantities, a discount annotation and mixed tax rates.
const invoice=`Zboží Množství Netto/MJ Daň % Netto DPH Brutto
FILTR TEST 2,000 kus 100,00 21 200,00 42,00 242,00 Kč
Sleva z položky: 5,00 % Před slevou: 210,53 254,74 Kč
POLOZKA TEST 1,000 kus 100,00 12 100,00 12,00 112,00 Kč
BEZ DANE TEST 1,000 kus 50,00 0 50,00 0,00 50,00 Kč
Celkem: 350,00 54,00 404,00 Kč`;
const parsed=context.parser.parse(invoice);
assert.equal(parsed.rows.length,3);assert.equal(parsed.total,404);assert.equal(parsed.netTotal,350);
assert.deepEqual(Array.from(parsed.rows,r=>r.net),[200,100,50]);assert.deepEqual(Array.from(parsed.rows,r=>r.gross),[242,112,50]);
assert.equal(context.parser.parse('Filtr test 121,00 Kč').rows[0].net,undefined);
assert.equal(context.parser.parse('Celkem bez DPH 100,00 Kč\nCelkem s DPH 121,00 Kč').netTotal,100);
assert.equal(context.parser.parse(invoice.replace('404,00 Kč','999,00 Kč')).netTotal,null,'Do not trust inconsistent totals');
console.log('Invoice tax: row totals, mixed rates, zero tax, discount exclusion and summary validation passed.');
if(process.argv.includes('--browser'))(async()=>{
 const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
 const b=await chromium.launch({channel:'msedge',headless:true});try{
  const p=await b.newPage({viewport:{width:1100,height:950}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await require('./local-app.cjs')(p);await p.route(/^https?:/,r=>r.abort());await p.goto(pathToFileURL(path.resolve('index.html')).href);
  await p.evaluate(text=>{VehicleStorage.saveVehicle({id:'test',brand:'vw',modelKey:'golf_6',year:2009,mileage:1000});VehicleStorage.setActiveVehicleId('test');App.render();App.switchTab('form');InvoiceImport.extract=async()=>text;},invoice);
  await p.evaluate(()=>InvoiceImport.load({name:'synthetic.pdf',size:100,type:'application/pdf'}));
  await p.locator('#invoice-price-mode').selectOption('net');assert.match(await p.locator('#invoice-total').innerText(),/350/);assert.doesNotMatch(await p.locator('#invoice-total').innerText(),/404/);
  assert.equal(await p.locator('#invoice-rows input[type=number]').first().inputValue(),'200');
  await p.locator('#invoice-rows input[type=number]').first().fill('199.99');await p.locator('#invoice-price-mode').selectOption('gross');assert.equal(await p.locator('#invoice-rows input[type=number]').first().inputValue(),'242');await p.locator('#invoice-price-mode').selectOption('net');assert.equal(await p.locator('#invoice-rows input[type=number]').first().inputValue(),'199.99');
  await p.locator('#invoice-rows input[type=number]').first().fill('200');await p.locator('#srv-notes').fill('Moje poznámka');await p.locator('#invoice-apply').click();
  assert.equal(await p.locator('#srv-price').inputValue(),'350');assert.equal(await p.locator('#srv-notes').inputValue(),'Moje poznámka');
  assert.deepEqual(await p.evaluate(()=>App.customItems.map(r=>r.price)),[200,100,50]);
  await p.evaluate(async()=>{InvoiceImport.extract=async()=> 'Filtr test 121,00 Kč';await InvoiceImport.load({name:'unknown.pdf',size:100});});await p.locator('#invoice-price-mode').selectOption('net');assert.equal(await p.locator('#invoice-apply').isDisabled(),true);assert.equal(await p.locator('#invoice-rows input[type=number]').inputValue(),'');await p.locator('#invoice-rows input[type=number]').fill('100');assert.equal(await p.locator('#invoice-apply').isDisabled(),false);
  await p.locator('#invoice-price-mode').selectOption('gross');assert.equal(await p.locator('#invoice-rows input[type=number]').inputValue(),'121');await p.locator('#invoice-price-mode').selectOption('net');assert.equal(await p.locator('#invoice-rows input[type=number]').inputValue(),'100');
  await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.locator('#invoice-panel').screenshot({path:'tests/tax-import-mobile.png',animations:'disabled'});assert.deepEqual(errors,[]);
  console.log('Invoice tax browser: switching, independent edits, net apply, notes preserved, missing prices blocked, manual fallback and mobile passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

