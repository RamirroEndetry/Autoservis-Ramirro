/* Pure three-way merge: preserve unrelated edits, never silently resolve conflicts. */
const GarageSync = {
  clone(value) { return JSON.parse(JSON.stringify(value)); },
  canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(v => this.canonical(v)).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + this.canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  },
  equal(a,b) { return this.canonical(a) === this.canonical(b); },
  validate(data) {
    if (!data || !Array.isArray(data.vehicles) || !Array.isArray(data.services) || !data.settings || Array.isArray(data.settings) || typeof data.settings !== 'object') throw new Error('Neplatný formát garáže.');
    for (const list of [data.vehicles,data.services]) {
      const ids = new Set();
      for (const row of list) {
        if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('Chybějící nebo duplicitní ID záznamu.');
        ids.add(row.id);
      }
    }
    const vehicles = new Set(data.vehicles.map(v => v.id));
    if (data.settings.clients !== undefined) {
      if (!Array.isArray(data.settings.clients)) throw new Error('Neplatný seznam klientů.');
      const ids = new Set();
      for (const c of data.settings.clients) {
        if (!c || typeof c.id !== 'string' || !c.id || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim()) throw new Error('Neplatná nebo duplicitní karta klienta.');
        ids.add(c.id);
      }
    }
    if (data.services.some(s => !vehicles.has(s.vehicleId))) throw new Error('Servisní záznam odkazuje na chybějící vozidlo.');
    return data;
  },
  merge(base, local, remote) {
    const conflicts = [];
    const pick = (b,l,r,label) => {
      if (this.equal(l,b)) return r;
      if (this.equal(r,b) || this.equal(l,r)) return l;
      conflicts.push(label); return l;
    };
    const result = {vehicles:[],services:[],settings:{}};
    for (const collection of ['vehicles','services']) {
      const maps = [base,local,remote].map(d => new Map(d[collection].map(row => [row.id,row])));
      for (const id of new Set(maps.flatMap(m => [...m.keys()]))) {
        const value = pick(...maps.map(m => m.get(id)), collection + ':' + id);
        if (value !== undefined) result[collection].push(value);
      }
    }
    for (const key of new Set([base,local,remote].flatMap(d => Object.keys(d.settings)))) {
      if (key === 'clients') {
        const maps = [base,local,remote].map(d => new Map((d.settings.clients || []).map(c => [c.id,c])));
        result.settings.clients = [];
        for (const id of new Set(maps.flatMap(m => [...m.keys()]))) {
          const client = pick(...maps.map(m => m.get(id)),'clients:' + id);
          if (client !== undefined) result.settings.clients.push(client);
        }
        continue;
      }
      const value = pick(base.settings[key],local.settings[key],remote.settings[key],'settings:' + key);
      if (value !== undefined) result.settings[key] = value;
    }
    // Vehicle deletion vs a newly added service must be a conflict too.
    try { this.validate(result); } catch (_) { conflicts.push('references'); }
    return {data:this.clone(result),conflicts};
  }
};
if (typeof module !== 'undefined') module.exports = GarageSync;
