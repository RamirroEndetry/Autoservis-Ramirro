/**
 * Servisní kniha vozidel a motocyklů
 * Trvalé úložiště (localStorage) + migrace starších dat.
 */

const STORAGE_KEYS = {
  VEHICLES: "vag_service_vehicles",
  ACTIVE_VEHICLE_ID: "vag_service_active_id",
  SERVICES: "vag_service_records",
  SETTINGS: "vag_service_settings",
  SCHEMA: "vag_service_schema",
  INITIALIZED: "vag_service_initialized"
};

const SCHEMA_VERSION = 3;

class VehicleStorage {
  /* ------------------------------------------------------------------ */
  /* Nízkoúrovňové čtení a zápis                                        */
  /* ------------------------------------------------------------------ */

  static read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Nepodařilo se načíst " + key, e);
      return fallback;
    }
  }

  static write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Nepodařilo se uložit " + key, e);
      return false;
    }
  }

  static newId(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /* ------------------------------------------------------------------ */
  /* Migrace                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Doplní chybějící pole a přepíše stará id úkonů na nová.
   * Spouští se při startu, je idempotentní.
   */
  static migrate() {
    const stored = parseInt(localStorage.getItem(STORAGE_KEYS.SCHEMA) || "1", 10);
    if (stored >= SCHEMA_VERSION) return;

    const vehicles = this.read(STORAGE_KEYS.VEHICLES, []);
    vehicles.forEach(v => {
      if (!v.createdAt) v.createdAt = v.updatedAt || new Date().toISOString();
      if (!v.kind) v.kind = VehicleCatalog.kindOf(v);
      if (VEHICLE_DB[v.brand]) v.brandName = VEHICLE_DB[v.brand].name;
      if (v.baseMileage === undefined) v.baseMileage = parseInt(v.mileage || 0, 10);

      // Starší data měla značku zapsanou i v názvu modelu ("Yamaha X-Max 250"),
      // což vedlo ke zdvojení "Yamaha Yamaha X-Max 250". Sjednotíme podle katalogu.
      const model = VehicleCatalog.model(v.brand, v.modelKey);
      if (model) v.modelName = model.name;
    });
    this.write(STORAGE_KEYS.VEHICLES, vehicles);

    const services = this.read(STORAGE_KEYS.SERVICES, []);
    services.forEach(s => {
      if (!s.createdAt) s.createdAt = s.updatedAt || new Date().toISOString();
      if (Array.isArray(s.items)) {
        s.items = s.items.map(it => {
          if (it.categoryId === "custom") return it;
          const newId = VehicleCatalog.normalizeItemId(it.id);
          const known = VehicleCatalog.findItem(newId);
          return {
            id: newId,
            categoryId: known ? known.categoryId : (LEGACY_CATEGORY_MAP[it.categoryId] || it.categoryId),
            label: known ? known.label : it.label,
            price: it.price || 0
          };
        });
      }
      if (s.filterDetails && s.filterDetails.oilViscosity && !s.oil) {
        s.oil = {
          viscosity: s.filterDetails.oilViscosity,
          liters: s.filterDetails.oilLiters || "",
          brand: ""
        };
      }
    });
    this.write(STORAGE_KEYS.SERVICES, services);

    localStorage.setItem(STORAGE_KEYS.SCHEMA, String(SCHEMA_VERSION));
    console.info("Data migrována na schéma verze " + SCHEMA_VERSION + ".");
  }

  /* ------------------------------------------------------------------ */
  /* Vozidla                                                            */
  /* ------------------------------------------------------------------ */

  static getVehicles() {
    const list = this.read(STORAGE_KEYS.VEHICLES, []);
    return Array.isArray(list) ? list : [];
  }

  static getVehicle(id) {
    return this.getVehicles().find(v => v.id === id) || null;
  }

  /** Uloží vozidlo; při úpravě zachová createdAt i neznámá pole. */
  static saveVehicle(vehicle) {
    const vehicles = this.getVehicles();
    const index = vehicle.id ? vehicles.findIndex(v => v.id === vehicle.id) : -1;

    let record;
    if (index >= 0) {
      record = Object.assign({}, vehicles[index], vehicle);
      record.createdAt = vehicles[index].createdAt || new Date().toISOString();
    } else {
      record = Object.assign({}, vehicle);
      if (!record.id) record.id = this.newId("veh");
      record.createdAt = record.createdAt || new Date().toISOString();
    }
    record.updatedAt = new Date().toISOString();

    if (index >= 0) vehicles[index] = record;
    else vehicles.push(record);

    this.write(STORAGE_KEYS.VEHICLES, vehicles);

    if (!this.getActiveVehicleId()) this.setActiveVehicleId(record.id);
    return record;
  }

  static deleteVehicle(vehicleId) {
    const vehicles = this.getVehicles().filter(v => v.id !== vehicleId);
    this.write(STORAGE_KEYS.VEHICLES, vehicles);

    const services = this.getAllServices().filter(s => s.vehicleId !== vehicleId);
    this.write(STORAGE_KEYS.SERVICES, services);

    if (this.getActiveVehicleId() === vehicleId) {
      this.setActiveVehicleId(vehicles.length ? vehicles[0].id : null);
    }
  }

  static getActiveVehicleId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID) || null;
  }

  static setActiveVehicleId(id) {
    if (id) localStorage.setItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID, id);
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_VEHICLE_ID);
  }

  static getActiveVehicle() {
    const id = this.getActiveVehicleId();
    return id ? this.getVehicle(id) : null;
  }

  /* ------------------------------------------------------------------ */
  /* Servisní záznamy                                                   */
  /* ------------------------------------------------------------------ */

  static getAllServices() {
    const list = this.read(STORAGE_KEYS.SERVICES, []);
    return Array.isArray(list) ? list : [];
  }

  static getService(id) {
    return this.getAllServices().find(s => s.id === id) || null;
  }

  /** Záznamy vozidla seřazené od nejnovějšího. */
  static getServicesForVehicle(vehicleId) {
    return this.getAllServices()
      .filter(s => s.vehicleId === vehicleId)
      .sort((a, b) => {
        const diff = new Date(b.date) - new Date(a.date);
        if (diff !== 0) return diff;
        return (b.mileage || 0) - (a.mileage || 0);
      });
  }

  static saveServiceRecord(record) {
    const services = this.getAllServices();
    const index = record.id ? services.findIndex(s => s.id === record.id) : -1;

    let saved;
    if (index >= 0) {
      saved = Object.assign({}, services[index], record);
      saved.createdAt = services[index].createdAt || new Date().toISOString();
    } else {
      saved = Object.assign({}, record);
      if (!saved.id) saved.id = this.newId("srv");
      saved.createdAt = saved.createdAt || new Date().toISOString();
    }
    saved.updatedAt = new Date().toISOString();

    if (index >= 0) services[index] = saved;
    else services.push(saved);

    this.write(STORAGE_KEYS.SERVICES, services);
    this.syncVehicleMileage(saved.vehicleId);
    return saved;
  }

  static deleteServiceRecord(recordId) {
    const record = this.getService(recordId);
    const services = this.getAllServices().filter(s => s.id !== recordId);
    this.write(STORAGE_KEYS.SERVICES, services);
    if (record) this.syncVehicleMileage(record.vehicleId);
  }

  /**
   * Tachometr vozidla = nejvyšší hodnota ze servisních záznamů,
   * nejméně však ručně zadaný počáteční nájezd.
   */
  static syncVehicleMileage(vehicleId) {
    if (!vehicleId) return;
    const vehicles = this.getVehicles();
    const i = vehicles.findIndex(v => v.id === vehicleId);
    if (i < 0) return;

    const vehicle = vehicles[i];
    const records = this.getServicesForVehicle(vehicleId);
    const maxFromRecords = records.reduce((max, r) => Math.max(max, parseInt(r.mileage || 0, 10)), 0);
    const base = parseInt(vehicle.baseMileage || 0, 10);
    const next = Math.max(maxFromRecords, base);

    if (next !== parseInt(vehicle.mileage || 0, 10)) {
      vehicle.mileage = next;
      vehicle.updatedAt = new Date().toISOString();
      vehicles[i] = vehicle;
      this.write(STORAGE_KEYS.VEHICLES, vehicles);
    }
  }

  /* ------------------------------------------------------------------ */
  /* První spuštění                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Bylo úložiště už někdy použito? Rozlišuje "prázdná garáž, protože ji
   * uživatel vysypal" od "prázdná garáž, protože je to nový prohlížeč".
   */
  static isInitialized() {
    if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === "1") return true;
    // Prázdné pole samo o sobě nestačí – takový klíč umí vytvořit i migrace.
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (raw === null) return false;
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.length > 0;
    } catch (e) {
      return false;
    }
  }

  static markInitialized() {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "1");
  }

  /* ------------------------------------------------------------------ */
  /* Nastavení                                                          */
  /* ------------------------------------------------------------------ */

  static getSettings() {
    return Object.assign({
      autoSum: true,
      animations: true
    }, this.read(STORAGE_KEYS.SETTINGS, {}));
  }

  static saveSettings(patch) {
    const next = Object.assign(this.getSettings(), patch);
    this.write(STORAGE_KEYS.SETTINGS, next);
    return next;
  }

  /* ------------------------------------------------------------------ */
  /* Záloha a obnova                                                    */
  /* ------------------------------------------------------------------ */

  static exportBackupData() {
    return JSON.stringify({
      app: "ServisVozidel",
      version: SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      activeVehicleId: this.getActiveVehicleId(),
      settings: this.getSettings(),
      vehicles: this.getVehicles(),
      services: this.getAllServices()
    }, null, 2);
  }

  /**
   * Obnoví data ze zálohy.
   * @param {string} jsonString obsah souboru
   * @param {"replace"|"merge"} mode  nahradit vše, nebo připojit chybějící
   */
  static importBackupData(jsonString, mode) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      return { ok: false, message: "Soubor není platný JSON." };
    }

    if (!parsed || !Array.isArray(parsed.vehicles)) {
      return { ok: false, message: "V souboru chybí seznam vozidel – nevypadá jako záloha této aplikace." };
    }

    const incomingVehicles = parsed.vehicles.filter(v => v && v.id);
    const incomingServices = Array.isArray(parsed.services) ? parsed.services.filter(s => s && s.id) : [];

    if (mode === "merge") {
      const vehicles = this.getVehicles();
      const services = this.getAllServices();
      const vIds = new Set(vehicles.map(v => v.id));
      const sIds = new Set(services.map(s => s.id));

      incomingVehicles.forEach(v => { if (!vIds.has(v.id)) vehicles.push(v); });
      incomingServices.forEach(s => { if (!sIds.has(s.id)) services.push(s); });

      this.write(STORAGE_KEYS.VEHICLES, vehicles);
      this.write(STORAGE_KEYS.SERVICES, services);
    } else {
      this.write(STORAGE_KEYS.VEHICLES, incomingVehicles);
      this.write(STORAGE_KEYS.SERVICES, incomingServices);
    }

    if (parsed.settings) this.saveSettings(parsed.settings);

    const all = this.getVehicles();
    const wanted = parsed.activeVehicleId && all.some(v => v.id === parsed.activeVehicleId)
      ? parsed.activeVehicleId
      : (all[0] ? all[0].id : null);
    this.setActiveVehicleId(wanted);

    // Data ze starší verze je nutné znovu protáhnout migrací.
    localStorage.setItem(STORAGE_KEYS.SCHEMA, "1");
    this.migrate();

    return {
      ok: true,
      message: mode === "merge" ? "Záloha byla připojena ke stávajícím datům." : "Záloha byla obnovena.",
      vehicles: incomingVehicles.length,
      services: incomingServices.length
    };
  }

  /**
   * Smaže všechna data. Značka o inicializaci zůstává, aby se zabudovaná
   * záloha znovu sama nenačetla proti vůli uživatele.
   */
  static clearAll() {
    Object.keys(STORAGE_KEYS).forEach(k => localStorage.removeItem(STORAGE_KEYS[k]));
    this.markInitialized();
  }
}
