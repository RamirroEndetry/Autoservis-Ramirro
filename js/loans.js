/* Private lending diary. Amounts are integer haléře; a loan and its payments
   form one conflict-protected record in the existing authenticated payload. */
const LoanBook = {
  all() { return VehicleStorage.getSettings().loans || []; },
  get(id) { return this.all().find(l => l.id === id); },
  cents(value) {
    const text = String(value).trim().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Částka musí mít nejvýše dvě desetinná místa.');
    const n = Math.round(Number(text) * 100);
    if (!Number.isSafeInteger(n) || n <= 0 || n > 999999999) throw new Error('Zadejte částku od 0,01 do 9 999 999,99 Kč.');
    return n;
  },
  date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Utils.toISODate(Utils.parseDate(value)) !== value) throw new Error('Vyplňte platné datum.');
    return value;
  },
  paid(l) { return l.payments.reduce((n,p) => n + p.amountCents, 0); },
  due(l) { return l.amountCents - this.paid(l); },
  status(l) { return !this.due(l) ? 'Splaceno' : l.dueDate && l.dueDate < Utils.today() ? 'Po splatnosti' : l.dueDate === Utils.today() ? 'Splatné dnes' : 'Otevřeno'; },
  write(list) {
    GarageSync.validate({vehicles:[],services:[],settings:{loans:list}});
    VehicleStorage.saveSettings({loans:list});
  },
  save(value) {
    const old = value.id ? this.get(value.id) : null;
    if (value.id && !old) throw new Error('Půjčka už neexistuje.');
    const name = value.name.trim();
    if (!name) throw new Error('Vyplňte jméno dlužníka.');
    const date = this.date(value.date), dueDate = value.dueDate ? this.date(value.dueDate) : '';
    if (dueDate && dueDate < date) throw new Error('Splatnost nesmí předcházet půjčení.');
    if (value.variableSymbol && !/^\d{1,10}$/.test(value.variableSymbol)) throw new Error('Variabilní symbol musí obsahovat 1–10 číslic.');
    const loan = {...old,...value,name,date,dueDate,amountCents:this.cents(value.amount),id:old?.id || VehicleStorage.newId('loan'),payments:old?.payments || [],updatedAt:new Date().toISOString()};
    delete loan.amount;
    if (this.paid(loan) > loan.amountCents) throw new Error('Částka nesmí být nižší než evidované splátky.');
    if (loan.payments.some(p => p.date < date)) throw new Error('Datum půjčky nesmí následovat po splátce.');
    this.write(old ? this.all().map(l => l.id === loan.id ? loan : l) : [...this.all(),loan]);
    return loan;
  },
  addPayment(id, amount, date, note, method) {
    const loan = this.get(id); if (!loan) throw new Error('Půjčka už neexistuje.');
    const amountCents = this.cents(amount); this.date(date);
    if (date < loan.date || date > Utils.today()) throw new Error('Datum přijetí musí být mezi půjčením a dneškem.');
    if (amountCents > this.due(loan)) throw new Error('Splátka převyšuje zbývající dluh.');
    const updated = {...loan,updatedAt:new Date().toISOString(),payments:[...loan.payments,{id:VehicleStorage.newId('repayment'),amountCents,date,note,method}]};
    this.write(this.all().map(l => l.id === id ? updated : l));
  },
  reset() {
    document.getElementById('loan-form').reset(); document.getElementById('loan-id').value='';
    document.getElementById('loan-date').value=Utils.today();
    document.getElementById('loan-editor-title').textContent='Nová půjčka';
    CloudGarage.draft=!!this.previousDraft;
  },
  open() {
    this.previousDraft=CloudGarage.draft; this.reset(); this.render();
    document.getElementById('loans-modal').scrollTop=0;
    UI.closeHandlers['loans-modal']=()=>{CloudGarage.draft=!!this.previousDraft;};
    UI.openModal('loans-modal');
  },
  render() {
    if (!document.getElementById('loans-list')) return;
    const all=this.all(), e=Utils.esc, money=n=>Utils.kc(n/100);
    const outstanding=all.reduce((n,l)=>n+this.due(l),0), received=all.reduce((n,l)=>n+this.paid(l),0);
    const overdue=all.filter(l=>this.due(l)>0 && l.dueDate && l.dueDate<Utils.today());
    document.getElementById('loans-summary').innerHTML=`<div><span>Zbývá vrátit</span><strong>${money(outstanding)}</strong></div><div><span>Po splatnosti · ${overdue.length} půjček</span><strong>${money(overdue.reduce((n,l)=>n+this.due(l),0))}</strong></div><div><span>Vráceno celkem</span><strong>${money(received)}</strong></div>`;
    const q=Utils.norm(document.getElementById('loans-search').value), filter=document.getElementById('loans-filter').value;
    const list=all.filter(l=>Utils.norm([l.name,l.phone,l.email,l.purpose,l.notes].join(' ')).includes(q) && (filter==='all' || filter==='paid' && !this.due(l) || filter==='open' && this.due(l)>0 || filter==='overdue' && overdue.includes(l))).sort((a,b)=>(!this.due(a))-(!this.due(b)) || (a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
    document.getElementById('loans-list').innerHTML=list.map(l=>`<article class="loan-card"><div class="loan-card-heading"><div><h4>${e(l.name)}</h4><p>${e(l.purpose||'Osobní půjčka')}</p></div><span class="pill ${this.status(l)==='Po splatnosti'?'loan-overdue':''}">${this.status(l)}</span></div><p>${e([l.phone,l.email].filter(Boolean).join(' · '))}</p><strong class="loan-balance">${money(this.due(l))} <small>zbývá vrátit</small></strong><p>Půjčeno ${money(l.amountCents)} · Vráceno ${money(this.paid(l))}</p><p>${Utils.fmtDate(l.date)} → ${l.dueDate ? Utils.fmtDate(l.dueDate) : 'Bez termínu splatnosti'}</p>${l.notes?`<p class="loan-note">${e(l.notes)}</p>`:''}<div class="loan-actions"><button class="btn btn-ghost btn-sm" data-loan-edit="${e(l.id)}">Upravit</button><button class="btn btn-ghost btn-sm" data-loan-pdf="${e(l.id)}">PDF / QR platba</button><button class="btn btn-ghost btn-sm" data-loan-delete="${e(l.id)}">Smazat půjčku</button></div><details><summary>Splátky a historie (${l.payments.length})</summary>${l.payments.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>`<div class="loan-payment"><span>${Utils.fmtDate(p.date)} · ${money(p.amountCents)} · ${e(p.method||'')}<br>${e(p.note||'')}</span><button class="btn btn-ghost btn-sm" data-loan-undo="${e(l.id)}" data-payment="${e(p.id)}">Zrušit splátku</button></div>`).join('')||'<p>Zatím žádná přijatá splátka.</p>'}</details>${this.due(l)>0?`<form class="loan-payment-form" data-repay="${e(l.id)}"><h5>Zapsat přijatou splátku</h5><div class="grid-2"><label>Částka (Kč)<input class="form-control" name="amount" inputmode="decimal" required placeholder="0,00"></label><label>Datum přijetí<input class="form-control" name="date" type="date" required min="${e(l.date)}" max="${Utils.today()}" value="${Utils.today()}"></label></div><label>Způsob<select class="form-control" name="method"><option>Převodem</option><option>Hotově</option><option>Jinak</option></select></label><label>Poznámka<input class="form-control" name="note" maxlength="500"></label><button class="btn btn-primary btn-sm">Uložit splátku</button></form>`:''}</article>`).join('')||'<div class="loan-empty"><h4>V půjčkách je přehled</h4><p>Zatím tu není žádná půjčka odpovídající výběru. Novou přidáte ve formuláři.</p></div>';
  },
  document(loan) {
    const p=PDFServicePrinter,e=Utils.esc,money=n=>Utils.kc(n/100), due=this.due(loan);
    const fileName='Prehled-pujcky-'+loan.id+'.pdf';
    const qr=due>0?`<section class="payment avoid-break"><img alt="QR platba zbývající částky" src="${PaymentQR.image(PaymentQR.payload(due/100,loan.variableSymbol))}"><div><h2>Zbývá vrátit ${money(due)}</h2><p>Účet: ${PaymentQR.account}</p><p>IBAN: ${PaymentQR.iban}</p><p>Variabilní symbol: ${e(loan.variableSymbol||'neuveden')}</p></div></section>`:'';
    return {fileName,html:`<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Přehled půjčky</title><style>${p.baseStyles('#287bc1')}</style></head><body>${p.toolbar('Přehled půjčky',fileName)}<main id="sheet" class="sheet"><h1>Přehled půjčky</h1><p>Vystaveno ${Utils.fmtDate(Utils.today())} · Evidence ${e(loan.id)}</p><h2>${e(loan.name)}</h2><p>${e([loan.phone,loan.email].filter(Boolean).join(' · '))}</p><p>${e(loan.purpose||'Osobní půjčka')}</p><p>Půjčeno dne: ${Utils.fmtDate(loan.date)} · Splatnost: ${loan.dueDate?Utils.fmtDate(loan.dueDate):'Dohodou, bez data'}</p><table><tbody><tr><th>Půjčeno</th><td>${money(loan.amountCents)}</td></tr><tr><th>Vráceno</th><td>${money(this.paid(loan))}</td></tr><tr><th>Zbývá vrátit</th><td>${money(due)}</td></tr></tbody></table><h2>Přijaté splátky</h2><table><thead><tr><th>Datum</th><th>Částka</th><th>Způsob</th></tr></thead><tbody>${loan.payments.map(r=>`<tr><td>${Utils.fmtDate(r.date)}</td><td>${money(r.amountCents)}</td><td>${e(r.method||'')}</td></tr>`).join('')||'<tr><td colspan="3">Zatím bez splátek.</td></tr>'}</tbody></table>${qr}<p>Stav evidence ke dni vystavení. Přijetí platby se potvrzuje ručním zápisem do deníku.</p></main>${p.script(fileName)}</body></html>`};
  },
  init() {
    const field=(id,label,type='text',extra='')=>`<div class="field"><label for="loan-${id}">${label}</label><input class="form-control" id="loan-${id}" type="${type}" ${extra}></div>`;
    const modal=document.createElement('div');modal.id='loans-modal';modal.className='modal-overlay';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','loans-title');
    modal.innerHTML=`<div class="modal loan-modal"><div class="modal-head"><div><h3 id="loans-title">Deník půjček</h3><p class="muted-note">Komu jste půjčili. Co se vrátilo. Co ještě čeká.</p></div><button type="button" class="modal-close" data-close="loans-modal" aria-label="Zavřít">&times;</button></div><div id="loans-summary" class="loan-summary"></div><div class="loan-layout"><section><div class="grid-2"><label>Hledat<input id="loans-search" class="form-control" type="search" placeholder="Jméno, kontakt nebo poznámka…"></label><label>Zobrazit<select id="loans-filter" class="form-control"><option value="open">Otevřené půjčky</option><option value="overdue">Po splatnosti</option><option value="paid">Splacené</option><option value="all">Všechny</option></select></label></div><div id="loans-list"></div></section><form id="loan-form"><h4 id="loan-editor-title">Nová půjčka</h4><input id="loan-id" type="hidden">${field('name','Jméno dlužníka *','text','required maxlength="160"')}${field('phone','Telefon','tel','maxlength="60"')}${field('email','E-mail','email','maxlength="254"')}${field('purpose','Na co / označení půjčky','text','maxlength="200"')}${field('amount','Půjčená částka (Kč) *','text','inputmode="decimal" required')}${field('date','Datum půjčení *','date','required')}${field('dueDate','Vrátit do','date')}${field('variableSymbol','Variabilní symbol','text','inputmode="numeric" pattern="[0-9]{1,10}" maxlength="10"')}<div class="field"><label for="loan-notes">Soukromá poznámka</label><textarea id="loan-notes" class="form-control" rows="3" maxlength="4000"></textarea></div><p class="muted-note">Soukromá poznámka a poznámky splátek se do PDF nevkládají. QR používá účet ${PaymentQR.account}. Splátky zapisujte až po přijetí peněz.</p><div class="loan-actions"><button class="btn btn-primary">Uložit půjčku</button><button type="button" id="loan-cancel" class="btn btn-ghost">Zrušit úpravu</button></div></form></div></div>`;
    document.getElementById('private-app').appendChild(modal);
    modal.querySelector('[data-close]').addEventListener('click',()=>UI.closeModal('loans-modal'));
    modal.addEventListener('mousedown',e=>{if(e.target===modal)UI.closeModal('loans-modal');});
    document.getElementById('loans-btn').addEventListener('click',()=>this.open());
    document.getElementById('loan-cancel').addEventListener('click',()=>this.reset());
    for (const id of ['loans-search','loans-filter']) document.getElementById(id).addEventListener('input',()=>{if(modal.querySelector('[data-repay] input[data-dirty]')){UI.toast('Nejdříve uložte rozepsanou splátku nebo zavřete deník.','warn');return;}this.render();});
    modal.addEventListener('input',event=>{if(event.target.closest('form')){CloudGarage.draft=true;if(event.target.closest('[data-repay]'))event.target.dataset.dirty='true';}});
    modal.addEventListener('submit',event=>{
      event.preventDefault();try {
        if ([...modal.querySelectorAll('[data-repay]')].some(f=>f!==event.target && f.querySelector('[data-dirty]'))) throw new Error('Nejdříve uložte rozepsanou splátku.');
        if(event.target.id==='loan-form') { const value=Object.fromEntries(['id','name','phone','email','purpose','amount','date','dueDate','variableSymbol','notes'].map(k=>[k,document.getElementById('loan-'+k).value.trim()]));this.save(value);this.reset(); }
        else {const f=new FormData(event.target);this.addPayment(event.target.dataset.repay,f.get('amount'),f.get('date'),f.get('note'),f.get('method'));CloudGarage.draft=!!this.previousDraft || !!document.getElementById('loan-name').value;}
        this.render();UI.toast('Uloženo. Stav synchronizace najdete v horní liště.','success');
      }catch(error){UI.toast(error.message,'error');}
    });
    modal.addEventListener('click',event=>{
      const button=event.target.closest('[data-loan-edit],[data-loan-delete],[data-loan-pdf],[data-loan-undo]');if(!button)return;
      try {
        const id=button.dataset.loanEdit||button.dataset.loanDelete||button.dataset.loanPdf||button.dataset.loanUndo,loan=this.get(id);if(!loan)throw new Error('Půjčka už neexistuje.');
        if(button.hasAttribute('data-loan-pdf')){const doc=this.document(loan);PDFServicePrinter.openDocument(doc.html,doc.fileName);return;}
        if(button.hasAttribute('data-loan-edit')){if(CloudGarage.draft && !confirm('Nahradit rozepsané změny formuláře?'))return;for(const k of ['id','name','phone','email','purpose','date','dueDate','variableSymbol','notes'])document.getElementById('loan-'+k).value=loan[k]||'';document.getElementById('loan-amount').value=(loan.amountCents/100).toFixed(2);document.getElementById('loan-editor-title').textContent='Upravit půjčku';CloudGarage.draft=true;document.getElementById('loan-name').focus();return;}
        if(button.hasAttribute('data-loan-delete')){if(!confirm('Smazat půjčku '+loan.name+' včetně celé historie splátek?'))return;this.write(this.all().filter(l=>l.id!==id));if(document.getElementById('loan-id').value===id)this.reset();}
        else {if(!confirm('Zrušit chybně zapsanou splátku? Dluh se o ni zvýší.'))return;this.write(this.all().map(l=>l.id===id?{...l,payments:l.payments.filter(p=>p.id!==button.dataset.payment),updatedAt:new Date().toISOString()}:l));}
        this.render();
      }catch(error){UI.toast(error.message,'error');}
    });
  }
};
