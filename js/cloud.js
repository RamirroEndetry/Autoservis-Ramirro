/* Supabase auth and durable local queue. Only a verified owner session opens the UI. */
const CloudGarage = {
  ready:false, draft:false, started:false, busy:false, conflict:false, suspended:false,
  cache:null, client:null, user:null, timer:null,
  el(id) { return document.getElementById(id); },
  status(message, kind='pending') {
    this.el('sync-status').textContent = message;
    this.el('cloud-bar').dataset.state = kind;
    this.el('sync-resolve').hidden = !this.conflict;
  },
  gate(message) {
    this.el('auth-gate').hidden = false;
    this.el('private-app').hidden = true;
    this.el('auth-message').textContent = message;
  },
  async boot() {
    this.bind();
    if (!window.supabase || !window.CLOUD_CONFIG) { this.gate('Přihlašování se nenačetlo. Obnovte stránku.'); return; }
    if (!navigator.locks) { this.gate('Použijte aktuální prohlížeč a zabezpečenou adresu HTTPS.'); return; }
    // One writer per browser profile; separate devices use optimistic revisions in SQL.
    navigator.locks.request('autoservis-cloud-ui', {ifAvailable:true}, async lock => {
      if (!lock) { this.gate('Aplikace je otevřená v jiné kartě. Zavřete ji a obnovte tuto stránku.'); return; }
      this.client = window.supabase.createClient(CLOUD_CONFIG.url,CLOUD_CONFIG.key, {
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
        global:{fetch:(url,options={}) => fetch(url,{...options,signal:options.signal || AbortSignal.timeout(20000)})}
      });
      this.client.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') { this.recovery = true; this.gate('Zvolte nové heslo.'); this.el('password-form').hidden = false; this.el('login-form').hidden = true; }
        if (event === 'SIGNED_OUT') { this.ready = false; this.gate('Jste odhlášeni.'); }
      });
      try {
        const {data,error} = await this.client.auth.getSession();
        if (error) throw error;
        if (data.session && !this.recovery) await this.open();
        else if (!this.recovery) this.gate('Přihlaste se ke své soukromé garáži.');
      } catch (_) { this.gate('Připojení se nezdařilo. Zkontrolujte internet a přihlaste se znovu.'); }
      this.el('login-submit').disabled = false;
      await new Promise(() => {});
    }).catch(() => this.gate('Nepodařilo se spustit přihlášení. Obnovte stránku.'));
  },
  async remote() {
    const {data,error} = await this.client.from('garage_state').select('revision,payload').single();
    if (error || !data) throw error || new Error('Přístup ke garáži není povolen.');
    GarageSync.validate(data.payload);
    return data;
  },
  persist(next) {
    // Persist before replacing the in-memory state. Quota errors must never look like success.
    try { localStorage.setItem(this.cacheKey,JSON.stringify(next)); }
    catch (_) { this.status('Nedostatek místa v prohlížeči — změnu se nepodařilo uložit.','error'); throw new Error('Místní uložení selhalo. Stáhněte zálohu a uvolněte místo.'); }
    this.cache = next;
  },
  payload(raw=this.cache.raw) {
    return {vehicles:JSON.parse(raw[STORAGE_KEYS.VEHICLES] || '[]'),services:JSON.parse(raw[STORAGE_KEYS.SERVICES] || '[]'),settings:JSON.parse(raw[STORAGE_KEYS.SETTINGS] || '{}')};
  },
  raw(payload, previous={}) {
    return {...previous,[STORAGE_KEYS.VEHICLES]:JSON.stringify(payload.vehicles),[STORAGE_KEYS.SERVICES]:JSON.stringify(payload.services),[STORAGE_KEYS.SETTINGS]:JSON.stringify(payload.settings),[STORAGE_KEYS.SCHEMA]:'3',[STORAGE_KEYS.INITIALIZED]:'1'};
  },
  dirty() { return !!this.cache && !GarageSync.equal(this.payload(),this.cache.base); },
  async open() {
    const {data,error} = await this.client.auth.getUser();
    if (error || !data.user) throw error || new Error('Přihlášení vypršelo.');
    this.user = data.user;
    const remote = await this.remote(); // Never display cached private data before server authorization.
    this.cacheKey = 'autoservis_cloud_v1_' + this.user.id;
    const stored = localStorage.getItem(this.cacheKey);
    if (stored) {
      const saved = JSON.parse(stored);
      GarageSync.validate(saved.base); GarageSync.validate(this.payload(saved.raw));
      if (!Number.isSafeInteger(saved.revision)) throw new Error('Neplatná místní fronta.');
      this.cache = saved;
    } else this.persist({revision:remote.revision,base:remote.payload,raw:this.raw(remote.payload)});
    VehicleStorage.backend = {
      getItem:key => this.cache.raw[key] ?? null,
      setItem:(key,value) => this.write(key,String(value)),
      removeItem:key => this.write(key,null)
    };
    this.ready = true;
    if (!this.wrapped) {
      for (const name of ['saveVehicle','deleteVehicle','saveServiceRecord','deleteServiceRecord','saveSettings','syncVehicleMileage','importBackupData','clearAll']) {
        const original=VehicleStorage[name];
        VehicleStorage[name]=(...args)=>this.transaction(()=>original.apply(VehicleStorage,args));
      }
      this.wrapped=true;
    }
    if (!this.started) { App.init(); this.started = true; }
    this.el('auth-gate').hidden = true;
    this.el('private-app').hidden = false;
    this.el('account-label').textContent = this.user.email;
    this.el('legacy-import').hidden = !this.legacyAvailable();
    await this.sync(true);
    if (!this.poll) this.poll = setInterval(() => { if (!document.hidden) this.sync(); },15000);
  },
  write(key,value) {
    if (!this.ready || this.conflict || this.suspended) throw new Error('Ukládání je pozastavené. Vyřešte synchronizaci v horní liště.');
    const raw = {...this.cache.raw};
    if (value === null) delete raw[key]; else raw[key] = value;
    if (this.transactionDepth) this.cache={...this.cache,raw};
    else this.persist({...this.cache,raw});
    if (this.dirty()) { this.status('Čeká na uložení do databáze…'); clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(),500); }
  },
  transaction(fn) {
    if (this.transactionDepth) return fn();
    const before=this.cache;
    this.transactionDepth=1;
    try {
      const result=fn();
      GarageSync.validate(this.payload());
      this.persist(this.cache);
      return result;
    } catch(error) {this.cache=before;throw error;}
    finally {this.transactionDepth=0;}
  },
  async sync(force=false) {
    if (!this.ready || this.busy || this.conflict || this.suspended) return;
    if (this.draft) { this.status('Rozpracovaný formulář — nejdřív jej uložte nebo zrušte.'); return; }
    if (!navigator.onLine) { this.status('Bez internetu — změny čekají v tomto prohlížeči.','error'); return; }
    this.busy = true;
    try {
      for (let attempt=0;attempt<3;attempt++) {
        const remote = await this.remote();
        if (!this.ready) return;
        if (this.draft) return; // A form opened during the request must retain its baseline.
        if (!this.dirty()) {
          if (!GarageSync.equal(remote.payload,this.cache.base)) {
            this.persist({revision:remote.revision,base:remote.payload,raw:this.raw(remote.payload,this.cache.raw)});
            App.render();
          }
          this.status('Uloženo v databázi','saved'); return;
        }
        const current = this.payload();
        const merge = GarageSync.merge(this.cache.base,current,remote.payload);
        if (merge.conflicts.length) { this.conflict = true; this.status('Stejný záznam byl změněn i jinde. Místní změny jsou zachované; vyřešte konflikt.','error'); return; }
        const sent = merge.data;
        GarageSync.validate(sent);
        this.status('Ukládám do databáze…');
        const {data,error} = await this.client.rpc('save_garage',{expected_revision:remote.revision,new_payload:sent});
        if (error) { if (error.code === '40001') continue; throw error; }
        if (!this.ready) return;
        if (this.draft) return; // Reconcile the confirmed write after the form is completed.
        GarageSync.validate(data.payload);
        // Keep edits made while the request was in flight; do not reset their baseline incorrectly.
        const next = GarageSync.merge(current,this.payload(),data.payload);
        if (next.conflicts.length) { this.conflict = true; this.status('Během ukládání vznikl konflikt. Stáhněte místní změny a načtěte databázi.','error'); return; }
        const changed = !GarageSync.equal(this.payload(),next.data);
        this.persist({revision:data.revision,base:data.payload,raw:this.raw(next.data,this.cache.raw)});
        if (changed && !this.draft) App.render();
        if (!this.dirty()) { this.status('Uloženo v databázi','saved'); return; }
      }
      this.status('Probíhají další změny — synchronizaci zopakuji.');
    } catch (error) {
      this.status('Nepodařilo se synchronizovat. Změny zůstaly v tomto prohlížeči; zkuste to znovu.','error');
      if (error.code === 'PGRST301' || error.status === 401 || error.code === '42501') {
        this.ready = false; this.gate('Přístup vypršel nebo byl zamítnut. Přihlaste se znovu; místní změny zůstaly zachované.');
      }
    } finally { this.busy = false; }
  },
  download(payload=this.payload(),name='servis-zaloha') {
    const text = JSON.stringify({app:'ServisVozidel',version:3,...payload,exportDate:new Date().toISOString()},null,2);
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download=name+'-'+new Date().toISOString().slice(0,10)+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  },
  legacyAvailable() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES)||'[]').length > 0; } catch (_) { return false; }
  },
  async importLegacy() {
    if (!confirm('Připojit původní auta a servisy z tohoto prohlížeče do soukromé databáze? Původní kopie zůstane zachovaná.')) return;
    const incoming = {vehicles:JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES)||'[]'),services:JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)||'[]'),settings:JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)||'{}')};
    GarageSync.validate(incoming);
    this.download(incoming,'puvodni-garaz');
    const current = this.payload();
    // Same IDs with different data require manual review, not a silent merge/drop.
    for (const collection of ['vehicles','services']) {
      const map=new Map(current[collection].map(v=>[v.id,v]));
      if (incoming[collection].some(v=>map.has(v.id)&&!GarageSync.equal(v,map.get(v.id)))) throw new Error('Záloha obsahuje odlišné verze stejných záznamů. Záloha byla stažena; porovnejte ji před importem.');
    }
    const result=VehicleStorage.importBackupData(JSON.stringify(incoming),'merge');
    if (!result.ok) throw new Error(result.message);
    App.render(); await this.sync();
    this.el('legacy-import').hidden = true;
  },
  async resolve() {
    if (!confirm('Stáhnu zálohu místních změn a nahradím zobrazenou garáž verzí z databáze. Potřebné změny pak můžete znovu zadat. Pokračovat?')) return;
    this.download(this.payload(),'konflikt-mistni-zmeny');
    const remote=await this.remote();
    this.persist({revision:remote.revision,base:remote.payload,raw:this.raw(remote.payload,this.cache.raw)});
    this.conflict=false; this.draft=false; App.resetForm(); App.render(); this.status('Načtena aktuální databáze. Místní verze je ve stažené záloze.','saved');
  },
  async logout() {
    if (this.draft && !confirm('Máte rozpracovaný formulář. Odhlášením se jeho neuložený obsah zahodí. Pokračovat?')) return;
    this.draft=false;
    await this.sync();
    if (this.busy || this.dirty()) { this.status('Nejdřív uložte čekající změny nebo vyřešte konflikt. Zálohu můžete stáhnout.','error'); return; }
    this.ready=false;
    const {error}=await this.client.auth.signOut({scope:'local'});
    if (error) { this.gate('Odhlášení se nezdařilo. Zkuste znovu obnovit stránku.'); return; }
    localStorage.removeItem(this.cacheKey);
    location.reload();
  },
  bind() {
    const action=(id,fn)=>this.el(id).addEventListener('click',()=>Promise.resolve().then(fn).catch(e=>alert(e.message || 'Akce se nezdařila.')));
    this.el('login-form').addEventListener('submit',async e=>{
      e.preventDefault(); if (!this.client) return;
      this.el('login-submit').disabled=true; this.el('auth-message').textContent='Přihlašuji…';
      try {
        const {error}=await this.client.auth.signInWithPassword({email:this.el('login-email').value.trim(),password:this.el('login-password').value});
        this.el('login-password').value='';
        if(error) throw error;
        await this.open();
      } catch (_) { this.gate('Přihlášení nebo načtení garáže se nezdařilo. Zkontrolujte e-mail, heslo a připojení.'); }
      finally {this.el('login-submit').disabled=false;}
    });
    action('forgot-password',async()=>{
      const email=this.el('login-email').value.trim();
      if (!email || !this.el('login-email').checkValidity()) {this.el('auth-message').textContent='Nejdřív vyplňte platný e-mail.';return;}
      const {error}=await this.client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      this.el('auth-message').textContent=error?'Odeslání se nezdařilo. Zkuste později nebo obnovte přístup ve správě Supabase.':'Pokud je e-mail povolený, přijde odkaz pro obnovu hesla.';
    });
    this.el('password-form').addEventListener('submit',async e=>{
      e.preventDefault(); const password=this.el('new-password').value;
      if(password!==this.el('new-password-again').value){this.el('auth-message').textContent='Hesla se neshodují.';return;}
      const {error}=await this.client.auth.updateUser({password});
      if(error){this.el('auth-message').textContent='Heslo se nepodařilo změnit. Zkuste nový odkaz pro obnovu.';return;}
      this.el('password-form').reset(); this.recovery=false; location.replace(location.origin+location.pathname);
    });
    action('cloud-logout',()=>this.logout());
    action('sync-retry',()=>this.sync());
    action('sync-backup',()=>this.download());
    action('sync-resolve',()=>this.resolve());
    action('legacy-import',()=>this.importLegacy());
    document.addEventListener('input',e=>{if(e.target.closest('#service-form, #vehicle-modal')) this.draft=true;},true);
    document.addEventListener('click',e=>{if(e.target.closest('#service-form, #vehicle-modal')) this.draft=true;},true);
    window.addEventListener('online',()=>this.sync());
    window.addEventListener('offline',()=>this.status('Bez internetu — změny čekají v tomto prohlížeči.','error'));
    window.addEventListener('beforeunload',e=>{if(this.dirty()||this.draft){e.preventDefault();e.returnValue='';}});
    window.addEventListener('error',e=>{if(this.ready && e.error) {this.status('Akce se nepodařila. Zkontrolujte data a stáhněte zálohu.','error');}});
  }
};
