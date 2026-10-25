const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({});
vm.runInContext(['database','ford-data','catalogue-data'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+';this.before=JSON.parse(JSON.stringify(VEHICLE_DB));',c);
vm.runInContext(['engine-catalogue-data','engine-catalogue'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+';this.db=VEHICLE_DB;this.E=EngineCatalogue;this.sources=ENGINE_CATALOGUE_SOURCES;this.rows=ENGINE_CATALOGUE_DATA;this.V=VehicleCatalog;',c);
let audited=0,total=0;
for(const [brand,b]of Object.entries(c.db))for(const [key,m]of Object.entries(b.models)){
 const old=c.before[brand].models[key];assert.equal(m.name,old.name);assert.equal(m.kind,old.kind);
 assert.deepEqual(m.years,old.years);
 if(!m.catalogueAudit){assert.equal(brand,'ford');assert.equal(old.engines.length,0);continue;}
 audited++;const engines=c.E.engines(m);total+=engines.length;
 assert.equal(new Set(engines.map(e=>e.name)).size,engines.length,brand+'/'+key);
 if(old.source)for(const e of old.engines)assert.ok(m.engines.some(n=>n.name===e.name&&n.power===e.power),'Preserve manufacturer precision');
 for(const e of engines.filter(e=>e.catalogueOnly)){
  assert.ok(e.power>0&&Number.isFinite(e.power));assert.ok(c.sources[e.source]);assert.ok(!e.oilSpec&&!e.oilCapacity);
  for(const a of e.applications){assert.ok(c.sources[a.source]);assert.match(a.from,/^\d{2}\.\d{4}$/);assert.ok(!a.to||Number(a.to.slice(-4))>=Number(a.from.slice(-4)));
   const raw=c.rows[brand+'/'+key].rows.find(r=>r.vehicleId===a.vehicleId&&r.source===a.source);
   assert.ok(raw);assert.equal(raw.power,e.power);assert.deepEqual([...raw.codes].sort(),[...e.codes]);
  }
 }
}
assert.equal(audited,108);
const golf=c.db.vw.models.golf_6.engines;
const tdi=golf.find(e=>e.name==='2.0 TDI 81 kW (CBDC, CLCA)');assert.ok(tdi);assert.deepEqual([...tdi.codes],['CBDC','CLCA']);assert.equal(tdi.applications[0].from,'10.2008');assert.equal(tdi.applications[0].to,'11.2012');
assert.ok(golf.some(e=>e.name==='1.6 TDI 66 kW (CAYB)'));
assert.ok(!golf.some(e=>/103\/125/.test(e.name)));
assert.ok(c.db.vw.models.transporter_t5.engines.some(e=>e.power===75&&e.codes.includes('BRS')),'BRS is listed separately at 75 kW, not merged with AXB at 77 kW');
const extra=c.db.ford.models.focus_4.catalogueEngines[0];assert.equal(c.V.engine({brand:'ford',modelKey:'focus_4',engineName:extra.name}).power,extra.power);
console.log(`Engine audit: ${audited} model entries, ${total} choices, exact source/code pairing, preserved editions and legacy identities passed.`);
if(process.argv.includes('--browser'))(async()=>{
 const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),path=require('node:path');
 const b=await chromium.launch({channel:'msedge',headless:true});try{
  const p=await b.newPage({viewport:{width:1100,height:950}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await require('./local-app.cjs')(p);await p.route(/^https?:/,r=>r.abort());await p.goto(pathToFileURL(path.resolve('index.html')).href);
  await p.evaluate(()=>App.openVehicleModal(null));await p.locator('#brand-grid [data-brand=vw]').click();await p.locator('#veh-model').selectOption('golf_6');await p.locator('#veh-year').selectOption('2009');
  assert.equal(await p.locator('#veh-engine').inputValue(),'');await p.locator('#veh-engine').selectOption(tdi.name);
  assert.match(await p.locator('#engine-hint').innerText(),/10.2008–11.2012/);assert.equal(await p.locator('#engine-code-options option').count(),2);assert.equal(await p.locator('#veh-engine-code').inputValue(),'','Do not guess the actual code');
  await p.locator('#veh-engine-code').fill('CFFB');assert.match(await p.locator('#engine-hint').innerText(),/není mezi kódy/);
  await p.locator('#veh-engine-code').fill('CBDC');assert.doesNotMatch(await p.locator('#engine-hint').innerText(),/není mezi kódy/);
  await p.locator('#veh-mileage').fill('123000');await p.locator('#vehicle-form button[type=submit]').click();await p.reload();await p.locator('#edit-vehicle-btn').click();
  assert.equal(await p.locator('#veh-engine').inputValue(),tdi.name);assert.equal(await p.locator('#veh-engine-code').inputValue(),'CBDC');
  const backup=await p.evaluate(()=>{const d=VehicleStorage.exportBackupData();VehicleStorage.clearAll();VehicleStorage.importBackupData(d,'replace');return VehicleStorage.getActiveVehicle();});assert.equal(backup.engineName,tdi.name);assert.equal(backup.engineCode,'CBDC');
  await p.evaluate(()=>App.openVehicleModal({id:'old',brand:'vw',modelKey:'golf_6',year:2009,engineName:'2.0 TDI CR 103/125 kW (CFFB, CBBB)',engineCode:'CFFB',mileage:1000}));
  assert.equal(await p.locator('#veh-engine').inputValue(),'__custom__');assert.equal(await p.locator('#veh-engine-custom').inputValue(),'2.0 TDI CR 103/125 kW (CFFB, CBBB)');assert.equal(await p.locator('#veh-engine-code').inputValue(),'CFFB');
  // Every effective model must populate without missing globals, duplicate values or auto-selection.
  for(const [brand,models]of Object.entries(require('../scripts/engine-catalogue-map.cjs')))for(const key of Object.keys(models)){
   const result=await p.evaluate(({brand,key})=>{App.modalBrand=brand;App.fillModelSelect(key);App.fillYearSelect();App.fillEngineSelect();const opts=[...document.querySelector('#veh-engine').options].map(o=>o.value);return {n:opts.length,unique:new Set(opts).size,value:document.querySelector('#veh-engine').value};},{brand,key});
   assert.ok(result.n>2,brand+'/'+key);assert.equal(result.n,result.unique);assert.equal(result.value,'');
  }
  await p.evaluate(()=>{App.modalBrand='vw';App.fillModelSelect('golf_6');App.fillYearSelect(2009);App.fillEngineSelect('2.0 TDI 81 kW (CBDC, CLCA)');});
  await p.locator('#veh-engine-code').fill('CBDC');await p.locator('#vehicle-modal').screenshot({path:'tests/engine-audit.png',animations:'disabled'});await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  console.log('Browser: Golf VI 81 kW, code suggestions, save/reload/backup, legacy edits, all 108 model selectors and mobile passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
