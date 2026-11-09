// Přiřazení položek faktury k úkonům servisní tabulky (syntetické názvy dílů).
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('js/invoice.js', 'utf8') + ';this.matcher=InvoiceMatcher;', context);
const m = context.matcher;

// Úkony existující jen pro některé druhy strojů (zjednodušený výřez katalogu).
const only = { oil_fuel_filter: ['car'], oil_fuel_filter_moto: ['motorcycle', 'scooter'], trs_gear_oil: ['car'],
  sc_gear_oil: ['scooter'], mc_final_drive: ['motorcycle'], trs_clutch: ['car'], mc_clutch: ['motorcycle'],
  oil_cabin_filter: ['car'], sc_belt: ['scooter'], mc_chain_kit: ['motorcycle'] };
const applies = kind => id => !only[id] || only[id].includes(kind);
const match = (label, kind = 'car') => m.match(label, kind, applies(kind));

const cases = [
  // Olej a filtr – vše do jednoho úkonu
  ['Motorový olej Castrol EDGE 5W-30 LL 5 l (OL-5W30) · 1 kus', 'oil_engine'],
  ['MOTUL 7100 10W-40 4T 1L · 2 kus', 'oil_engine', 'motorcycle'],
  ['Olejový filtr MANN W 712/95 · 1 kus', 'oil_engine'],
  ['Filtr olejový HIFLOFILTRO HF204 · 1 kus', 'oil_engine', 'motorcycle'],
  ['Šroub vypouštěcí olejové vany M14 · 1 kus', 'oil_engine'],
  ['Těsnicí kroužek vypouštěcího šroubu · 1 kus', 'oil_engine'],
  ['Yamalube 10W-40 JASO MA · 1 l', 'oil_engine', 'scooter'],
  // Filtry
  ['Vzduchový filtr BOSCH F 026 400 · 1 kus', 'oil_air_filter'],
  ['Kabinový filtr s aktivním uhlím MANN CUK 2939', 'oil_cabin_filter'],
  ['Pylový filtr FILTRON K 1111', 'oil_cabin_filter'],
  ['Palivový filtr KNECHT KL 228', 'oil_fuel_filter'],
  ['Palivový filtr KNECHT KL 228', 'oil_fuel_filter_moto', 'motorcycle'],
  // Brzdy
  ['Brzdové destičky přední ATE 13.0460 · 1 sada', 'brake_pads_front'],
  ['Sada brzdových destiček, zadní TRW GDB1550', 'brake_pads_rear'],
  ['Brzdový kotouč přední 288 mm · 2 kus', 'brake_discs_front'],
  ['Brzdová kapalina DOT 4 1 l', 'brake_fluid'],
  // Zapalování, řemeny, chlazení
  ['Zapalovací svíčka NGK CR9EH-9 · 4 kus', 'eng_spark_plugs', 'motorcycle'],
  ['Žhavicí svíčka BERU GN 857', 'eng_glow_plugs'],
  ['Sada rozvodového řemene + vodní pumpa CONTITECH', 'eng_timing_belt'],
  ['Chladicí kapalina G12+ 1,5 l', 'eng_coolant'],
  ['Řemen variátoru Dayco 8236K', 'sc_belt', 'scooter'],
  ['Převodový olej 80W-90 0,25 l', 'sc_gear_oil', 'scooter'],
  ['Převodový olej 75W-90 GL4', 'trs_gear_oil'],
  ['Olej do přední vidlice 10W 1 l', 'ch_fork_oil', 'motorcycle'],
  ['Akumulátor VARTA 74 Ah', 'el_battery'],
  ['Lambda sonda BOSCH 0 281 004 148', 'ex_lambda'],
  ['Stěrače Bosch Aerotwin AR 601 S', 'bd_wipers'],
  // Díly, které s tabulkou nesouvisí – ignorovat
  ['Kryt motoru spodní plastový', null],
  ['Víčko nádobky chladicí kapaliny', null],
  ['Uzávěr expanzní nádobky', null],
  ['Hadice chladiče horní', null],
  ['Čidlo tlaku oleje', null],
  ['Těsnění víka ventilů', null],
  ['Olejové čerpadlo', null],
  ['Klips kapoty · 10 kus', null],
  ['Baterie do klíče CR2032', null],
  ['Motorek stěračů', null],
  ['Dobírka / doprava', null],
  // Náprava neuvedená → nehádat
  ['Brzdové destičky TRW GDB1550', null],
  ['Pneumatika 205/55 R16 Michelin', null]
];

for (const [label, expected, kind] of cases) {
  assert.equal(match(label, kind), expected, label + (kind ? ' [' + kind + ']' : ''));
}
console.log('Invoice matching: ' + cases.length + ' part names mapped to service tasks or ignored correctly.');
