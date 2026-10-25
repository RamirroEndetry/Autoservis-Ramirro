/* Apply the audited catalogue without rewriting any saved vehicle or record. */
const EngineCatalogue = {
  engines(model) { return [...(model?.engines || []), ...(model?.catalogueEngines || [])]; },
  initialize() {
    Object.assign(CATALOGUE_SOURCES, ENGINE_CATALOGUE_SOURCES);
    for (const [identity, data] of Object.entries(ENGINE_CATALOGUE_DATA)) {
      const [brand, key] = identity.split('/');
      const model = VEHICLE_DB[brand].models[key];
      const groups = new Map();
      for (const row of data.rows) {
        // Keep different code sets separate. Never infer a code for a particular car.
        const codes = [...row.codes].sort();
        const identity = JSON.stringify([row.name, row.fuel, codes]);
        if (!groups.has(identity)) groups.set(identity, {
          name: row.name, power: row.power, fuel: row.fuel, codes,
          source: row.source, applications: [], catalogueOnly: true,
          roundedPower: data.motorcycle
        });
        groups.get(identity).applications.push({from:row.from,to:row.to,source:row.source,body:row.body,vehicleId:row.vehicleId});
      }
      const candidates = [...groups.values()];
      model.catalogueAudit = '2026-10-25';
      model.catalogueSources = [...new Set(data.rows.map(r => r.source))];
      if (!model.source) {
        // Replace the old merged-power seed entries, retaining the model identity.
        model.engines = candidates;
        model.source = model.catalogueSources[0];
        model.catalogueStatus = 'parts-catalogue';
      } else {
        // Manufacturer editions remain exact; external alternatives are a separate group.
        // Motorcycle catalogue powers are rounded, so they must not replace exact specs.
        model.catalogueEngines = candidates;
      }
      // Unique stable option values even where the same power has different engine codes.
      for (const e of candidates) {
        e.name += e.codes.length ? ' (' + e.codes.join(', ') + ')' : '';
        if (data.motorcycle) e.name += ' (katalog, zaokrouhlený výkon)';
      }
    }
  }
};
EngineCatalogue.initialize();
