/* Contacts live in settings, so existing backups and the protected cloud payload
   retain them without a database migration. Vehicles refer to a stable client ID. */
const ClientBook = {
  all() { const value=VehicleStorage.getSettings().clients; return Array.isArray(value)?value:[]; },
  get(id) { return this.all().find(c=>c.id===id)||null; },
  name(vehicle) { return this.get(vehicle?.clientId)?.name || 'Bez přiřazeného klienta'; },
  save(value) {
    if (!value.name.trim()) throw new Error('Vyplňte jméno klienta.');
    const list=this.all();const old=list.find(c=>c.id===value.id);
    const client={...old,...value,id:old?.id||VehicleStorage.newId('client'),updatedAt:new Date().toISOString()};
    VehicleStorage.saveSettings({clients:old?list.map(c=>c.id===old.id?client:c):[...list,client]});
    return client;
  },
  fillSelect(id='') {
    const select=document.getElementById('veh-client');
    select.innerHTML='<option value="">Bez přiřazeného klienta</option>'+this.all().map(c=>'<option value="'+Utils.esc(c.id)+'">'+Utils.esc(c.name)+'</option>').join('');
    if(id&&!this.get(id)) select.add(new Option('Nedostupná karta klienta',id));
    select.value=id;
  },
  open() {
    this.previousDraft=typeof CloudGarage!=='undefined'&&CloudGarage.draft;
    document.getElementById('client-form').reset();document.getElementById('client-id').value='';
    document.getElementById('client-form-title').textContent='Nový klient';
    this.render();UI.openModal('clients-modal');
  },
  render() {
    const hero=document.getElementById('hero-client');
    if(hero) {
      const vehicle=VehicleStorage.getActiveVehicle();
      hero.textContent=VehicleOwnership.get(vehicle)==='client'?'Klientské vozidlo · '+this.name(vehicle):'Vlastní vozidlo';
    }
    const query=Utils.norm(document.getElementById('clients-search').value);
    const vehicles=VehicleStorage.getVehicles();
    document.getElementById('clients-list').innerHTML=this.all().filter(c=>{
      const cars=vehicles.filter(v=>v.clientId===c.id);
      return Utils.norm([c.name,c.phone,c.email,c.notes,...cars.flatMap(v=>[v.spz,v.vin,App.vehicleName(v)])].join(' ')).includes(query);
    }).map(c=>{
      const cars=vehicles.filter(v=>v.clientId===c.id);
      return '<article class="client-card"><h4>'+Utils.esc(c.name)+'</h4><p>'+Utils.esc([c.phone,c.email].filter(Boolean).join(' · '))+'</p>'+
        (c.notes?'<p class="muted-note">'+Utils.esc(c.notes)+'</p>':'')+
        '<div class="client-vehicles">'+cars.map(v=>'<button type="button" class="btn btn-ghost btn-sm" data-client-car="'+Utils.esc(v.id)+'">'+Utils.esc(App.vehicleName(v)+' · '+(v.spz||'bez SPZ'))+'</button>').join('')+'</div>'+
        (!cars.length?'<p class="muted-note">Vozidlo přiřadíte přes Upravit stroj → Klient.</p>':'')+
        '<button type="button" class="btn btn-ghost btn-sm" data-client-edit="'+Utils.esc(c.id)+'">Upravit klienta</button></article>';
    }).join('')||'<p class="muted-note">Žádní odpovídající klienti.</p>';
    let outstanding=0,unknown=0;
    const debts=VehicleStorage.getAllServices().filter(r=>{
      const state=ServiceSettlement.summary(r);if(state.status==='unknown'){unknown++;return false;}
      outstanding+=state.due;return state.due>0;
    });
    document.getElementById('receivable-summary').textContent='Zbývá uhradit: '+Utils.kc(outstanding)+' · Neuvedený stav: '+unknown+' záznamů';
    document.getElementById('receivable-list').innerHTML=debts.filter(r=>{
      const v=VehicleStorage.getVehicle(r.vehicleId);return Utils.norm([this.name(v),v?.spz,v?.vin,App.vehicleName(v||{})].join(' ')).includes(query);
    }).map(r=>{
      const v=VehicleStorage.getVehicle(r.vehicleId),state=ServiceSettlement.summary(r);
      return '<div class="client-card"><strong>'+Utils.esc(this.name(v))+'</strong><p>'+Utils.esc(App.vehicleName(v||{})+' · '+(v?.spz||'bez SPZ'))+' · '+Utils.fmtDate(r.date)+'</p><p>'+Utils.esc(state.label)+' · Zbývá '+Utils.kc(state.due)+'</p><button type="button" class="btn btn-ghost btn-sm" data-client-service="'+Utils.esc(r.id)+'">Upravit úhradu</button></div>';
    }).join('')||'<p class="muted-note">Žádné odpovídající neuhrazené záznamy. Záznamy bez uvedeného stavu nejsou do součtu zahrnuté.</p>';
  },
  updateSettlementForm() {
    const select=document.getElementById('srv-settlement');
    let status=select.value;
    const total=Utils.money(document.getElementById('srv-price').value);
    if(status==='paid') {
      if(this.paidAtTotal==null) this.paidAtTotal=total;
      else if(total!==this.paidAtTotal) {status='partial';select.value=status;document.getElementById('srv-paid').value=this.paidAtTotal;}
    }
    document.getElementById('srv-paid-field').hidden=status!=='partial';
    try {
      const settlement=ServiceSettlement.fromForm(total,status,document.getElementById('srv-paid').value);
      const state=ServiceSettlement.summary({totalPrice:total,settlement});
      document.getElementById('srv-due').textContent=state.status==='unknown'?'Stav úhrady není evidovaný. QR případně použije celkovou cenu.':state.label+' · Uhrazeno '+Utils.kc(state.paid)+' · Zbývá '+Utils.kc(state.due);
    } catch(e) { document.getElementById('srv-due').textContent=e.message; }
  },
  init() {
    document.getElementById('garage-search').addEventListener('input',()=>App.openGarageModal());
    document.getElementById('clients-btn').addEventListener('click',()=>this.open());
    document.getElementById('clients-search').addEventListener('input',()=>this.render());
    document.getElementById('client-cancel').addEventListener('click',()=>{document.getElementById('client-form').reset();document.getElementById('client-id').value='';document.getElementById('client-form-title').textContent='Nový klient';CloudGarage.draft=!!this.previousDraft;});
    document.getElementById('client-form').addEventListener('submit',e=>{
      e.preventDefault();
      try {
        const value=Object.fromEntries(['id','name','phone','email','notes'].map(k=>[k,document.getElementById('client-'+k).value.trim()]));
        this.save(value);document.getElementById('client-cancel').click();this.render();UI.toast('Klient uložen. Stav synchronizace najdete v horní liště.','success');
      } catch(error){UI.toast(error.message,'error');}
    });
    document.getElementById('clients-modal').addEventListener('click',e=>{
      const edit=e.target.closest('[data-client-edit]'),car=e.target.closest('[data-client-car]'),service=e.target.closest('[data-client-service]');
      if(edit){const c=this.get(edit.dataset.clientEdit);for(const k of ['id','name','phone','email','notes']) document.getElementById('client-'+k).value=c[k]||'';document.getElementById('client-form-title').textContent='Upravit klienta';CloudGarage.draft=true;document.getElementById('client-name').focus();}
      if(car||service){
        if(CloudGarage.draft&&!confirm('Opustit rozpracovaný formulář? Neuložené změny se zahodí.'))return;
        const r=service?VehicleStorage.getService(service.dataset.clientService):null;
        VehicleStorage.setActiveVehicleId(r?r.vehicleId:car.dataset.clientCar);UI.closeModal('clients-modal');App.resetForm();App.render();if(r)App.startEdit(r.id);else App.switchTab('history');
      }
    });
    document.getElementById('srv-settlement').addEventListener('input',()=>{this.paidAtTotal=null;});
    for(const id of ['srv-settlement','srv-paid','srv-price'])document.getElementById(id).addEventListener('input',()=>this.updateSettlementForm());
  }
};
