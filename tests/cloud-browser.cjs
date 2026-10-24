const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('.'),prefix='/Autoservis-Ramirro/';
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(prefix.length)||'index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.html':'text/html'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
});
const user={id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'},'test'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
let remote={revision:0,payload:{vehicles:[],services:[],settings:{}}}, rejectNetwork=false, loseResponse=false, forcedRace=false;
const clone=x=>JSON.parse(JSON.stringify(x));
async function device(browser){
  const context=await browser.newContext();
  await context.route('https://yxuqdxlstacggptqkacs.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
    if(req.method()==='OPTIONS')return reply({});
    if(url.pathname==='/auth/v1/token'){
      const data=req.postDataJSON();
      if(data.password!=='synthetic-test-password' && !data.refresh_token)return reply({msg:'Invalid login credentials'},400);
      return reply({access_token:jwt,token_type:'bearer',expires_in:3600,refresh_token:'synthetic-refresh',user});
    }
    if(url.pathname==='/auth/v1/user')return reply(user);
    if(url.pathname==='/auth/v1/logout')return reply({});
    if(rejectNetwork)return route.abort();
    if(url.pathname==='/rest/v1/garage_state')return reply(remote);
    if(url.pathname==='/rest/v1/rpc/save_garage'){
      const body=req.postDataJSON();
      if(forcedRace){forcedRace=false;remote.revision++;return reply({code:'40001',message:'revision conflict'},409);}
      if(body.expected_revision!==remote.revision)return reply({code:'40001',message:'revision conflict'},409);
      remote={revision:remote.revision+1,payload:clone(body.new_payload)};
      if(loseResponse){loseResponse=false;return route.abort();}
      return reply(remote);
    }
    return reply({error:'unexpected '+url.pathname},500);
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  assert.equal(await page.locator('#private-app').isVisible(),false);
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill('synthetic-test-password');
  await page.locator('#login-submit').click();
  await page.locator('#private-app').waitFor({state:'visible'});
  await page.waitForFunction(()=>CloudGarage.ready&&!CloudGarage.busy);
  await page.evaluate(()=>{clearInterval(CloudGarage.poll);});
  return {page,context,errors};
}
let base;
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}${prefix}`;
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const a=await device(browser);
    await a.page.evaluate(async()=>{
      VehicleStorage.saveVehicle({id:'car',brand:'ford',modelKey:'focus_4',modelName:'Focus IV',year:2018,mileage:1000,baseMileage:1000});
      clearTimeout(CloudGarage.timer); await CloudGarage.sync();App.render();
    });
    assert.equal(remote.payload.vehicles.length,1);
    const b=await device(browser);assert.equal(await b.page.evaluate(()=>VehicleStorage.getVehicles().length),1);
    // Two separate devices add unrelated services from the same baseline.
    await Promise.all([a.page,b.page].map((p,i)=>p.evaluate(i=>{
      VehicleStorage.saveServiceRecord({id:'srv'+i,vehicleId:'car',date:'2026-10-24',mileage:1000,totalPrice:100+i,items:[],notes:'synthetic',payment:{enabled:true,variableSymbol:'000123'}});clearTimeout(CloudGarage.timer);
    },i)));
    await a.page.evaluate(()=>CloudGarage.sync());await b.page.evaluate(()=>CloudGarage.sync());
    assert.equal(remote.payload.services.length,2);
    await a.page.evaluate(()=>CloudGarage.sync());
    assert.equal(await a.page.evaluate(()=>VehicleStorage.getAllServices().length),2);
    // Retry an optimistic write rejected by the database.
    forcedRace=true;
    await a.page.evaluate(async()=>{VehicleStorage.saveSettings({autoSum:false});clearTimeout(CloudGarage.timer);await CloudGarage.sync();});
    assert.equal(remote.payload.settings.autoSum,false);
    // Server committed but its response was lost: retry must be idempotent.
    loseResponse=true;
    await a.page.evaluate(async()=>{VehicleStorage.saveSettings({animations:false});clearTimeout(CloudGarage.timer);await CloudGarage.sync();});
    await a.page.evaluate(()=>CloudGarage.sync());
    assert.equal(await a.page.evaluate(()=>CloudGarage.dirty()),false);
    // Durable pending writes survive a reload and never claim database success.
    rejectNetwork=true;
    await a.page.evaluate(async()=>{VehicleStorage.saveServiceRecord({id:'offline',vehicleId:'car',date:'2026-10-24',mileage:1000,notes:'offline'});clearTimeout(CloudGarage.timer);await CloudGarage.sync();});
    assert.match(await a.page.locator('#sync-status').innerText(),/Nepodařilo/);
    assert.equal(remote.payload.services.length,2);
    await a.page.reload();assert.equal(await a.page.locator('#private-app').isVisible(),false);
    rejectNetwork=false;await a.page.reload();await a.page.locator('#private-app').waitFor({state:'visible'});
    await a.page.waitForFunction(()=>!CloudGarage.busy&&!CloudGarage.dirty());
    assert.equal(remote.payload.services.length,3);
    await b.page.evaluate(()=>CloudGarage.sync());
    // Editing the same vehicle differently is blocked instead of last-write-wins.
    await a.page.evaluate(()=>{VehicleStorage.saveVehicle({id:'car',nickname:'device A'});clearTimeout(CloudGarage.timer);});
    await b.page.evaluate(()=>{VehicleStorage.saveVehicle({id:'car',nickname:'device B'});clearTimeout(CloudGarage.timer);});
    await a.page.evaluate(()=>CloudGarage.sync());await b.page.evaluate(()=>CloudGarage.sync());
    assert.equal(await b.page.evaluate(()=>CloudGarage.conflict),true);
    assert.equal(remote.payload.vehicles[0].nickname,'device A');
    assert.equal(await b.page.evaluate(()=>VehicleStorage.getVehicle('car').nickname),'device B');
    assert.equal(await b.page.locator('#sync-resolve').isVisible(),true);
    // Second tab cannot race a shared local pending queue.
    const second=await a.context.newPage();await second.goto(base);
    await second.waitForFunction(()=>document.getElementById('auth-message').textContent.includes('jiné kartě'));
    assert.equal(await second.locator('#private-app').isVisible(),false);await second.close();
    // Confirm printed QR and backups still work under authenticated hosting.
    await a.page.evaluate(()=>App.render());
    const pop=a.page.waitForEvent('popup');await a.page.locator('[data-print="srv0"]').click();const popup=await pop;
    await popup.waitForLoadState('domcontentloaded');assert.equal(await popup.locator('.payment img').count(),1);await popup.close();
    const exported=await a.page.evaluate(()=>JSON.parse(VehicleStorage.exportBackupData()));assert.equal(exported.services.length,3);
    // A local storage quota error rolls back the complete multi-key operation.
    const quota=await a.page.evaluate(()=>{
      const before=VehicleStorage.exportBackupData();const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(){throw new Error('quota');};
      let failed=false;try{VehicleStorage.deleteVehicle('car');}catch(_){failed=true;}finally{Storage.prototype.setItem=original;}
      return {failed,unchanged:JSON.parse(before).vehicles.length===VehicleStorage.getVehicles().length,services:VehicleStorage.getAllServices().length};
    });
    assert.deepEqual(quota,{failed:true,unchanged:true,services:3});
    await a.page.evaluate(()=>{CloudGarage.draft=false;});await a.page.locator('#cloud-logout').click();
    await a.page.locator('#auth-gate').waitFor({state:'visible'});assert.equal(await a.page.locator('#private-app').isVisible(),false);
    assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
    await a.page.setViewportSize({width:390,height:844});await a.page.screenshot({path:'tests/cloud-login.png'});
    console.log('Cloud browser tests passed: login gate, two-device merge, CAS retry, lost response, offline recovery, conflict protection, tab lock, QR/export, quota rollback and logout.');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
