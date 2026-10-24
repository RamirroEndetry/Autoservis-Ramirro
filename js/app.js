/**
 * Servisní kniha vozidel a motocyklů
 * Aplikační logika: garáž, servisní záznamy, náklady, připomínky.
 */

/* ============================== POMOCNÉ FUNKCE ========================== */

const Utils = {
  /** Escapuje text vkládaný do HTML (poznámky, názvy dílen, vlastní úkony). */
  esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  num(value) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  },

  money(value) {
    const n = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  },

  km(value) {
    return Utils.num(value).toLocaleString("cs-CZ") + " km";
  },

  kc(value) {
    return Utils.money(value).toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) + " Kč";
  },

  /** "2026-04-15" -> Date v lokálním čase (bez posunu o časové pásmo). */
  parseDate(value) {
    if (!value) return null;
    const parts = String(value).split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  },

  fmtDate(value, style) {
    const d = Utils.parseDate(value);
    if (!d) return "—";
    return d.toLocaleDateString("cs-CZ", style === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "numeric", month: "numeric", year: "numeric" });
  },

  /** Date -> "RRRR-MM-DD" podle místního času (toISOString posouvá o pásmo). */
  toISODate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  },

  today() {
    return Utils.toISODate(new Date());
  },

  /** Počet celých dní mezi dneškem a datem (kladné = v budoucnu). */
  daysUntil(value) {
    const d = Utils.parseDate(value);
    if (!d) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  },

  addMonths(value, months) {
    const d = Utils.parseDate(value);
    if (!d) return null;
    const out = new Date(d.getTime());
    out.setMonth(out.getMonth() + months);
    return out;
  },

  /** "za 3 měsíce" / "před 12 dny" */
  relative(days) {
    if (days === null) return "";
    const abs = Math.abs(days);
    let text;
    if (abs < 31) text = abs === 1 ? "1 den" : abs + " dní";
    else if (abs < 365) {
      const m = Math.round(abs / 30);
      text = m === 1 ? "1 měsíc" : (m < 5 ? m + " měsíce" : m + " měsíců");
    } else {
      const y = Math.floor(abs / 365);
      const rest = Math.round((abs % 365) / 30);
      text = (y === 1 ? "1 rok" : (y < 5 ? y + " roky" : y + " let"));
      if (rest > 0) text += " a " + rest + " měs.";
    }
    return days >= 0 ? "za " + text : "před " + text;
  },

  /** České skloňování počtu: 1 stroj, 2–4 stroje, 5+ strojů. */
  plural(count, one, few, many) {
    const n = Math.abs(Utils.num(count));
    const word = n === 1 ? one : (n >= 2 && n <= 4 ? few : many);
    return n.toLocaleString("cs-CZ") + " " + word;
  },

  debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      const args = arguments;
      timer = setTimeout(() => fn.apply(null, args), delay);
    };
  },

  /** Bez diakritiky a malými písmeny – pro vyhledávání. */
  norm(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  },

  $(selector) { return document.querySelector(selector); },
  $$(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
};

/* ================================ UI PRVKY ============================== */

const UI = {
  openStack: [],
  closeHandlers: {},

  toast(message, type) {
    const area = document.getElementById("toast-area");
    if (!area) return;
    const el = document.createElement("div");
    el.className = "toast toast-" + (type || "info");
    const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info", warn: "fa-triangle-exclamation" };
    el.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '" aria-hidden="true"></i><span>' + Utils.esc(message) + "</span>";
    area.appendChild(el);
    setTimeout(() => {
      el.classList.add("toast-out");
      setTimeout(() => el.remove(), 300);
    }, 3600);
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    UI.openStack.push({ id: id, lastFocus: document.activeElement });
    el.hidden = false;
    document.body.classList.add("modal-open");
    const focusable = el.querySelector("input:not([type=hidden]):not([hidden]), select, textarea, button");
    if (focusable) setTimeout(() => focusable.focus(), 30);
  },

  closeModal(id) {
    if (id === 'vehicle-modal' && typeof CloudGarage !== 'undefined') CloudGarage.draft = !!CloudGarage.beforeVehicleDraft;
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = true;

    // Umožní dialogům uklidit po sobě bez ohledu na to, čím byly zavřeny.
    if (UI.closeHandlers[id]) {
      const handler = UI.closeHandlers[id];
      delete UI.closeHandlers[id];
      handler();
    }

    const index = UI.openStack.map(s => s.id).lastIndexOf(id);
    if (index >= 0) {
      const entry = UI.openStack.splice(index, 1)[0];
      if (entry.lastFocus && entry.lastFocus.focus) entry.lastFocus.focus();
    }
    if (UI.openStack.length === 0) document.body.classList.remove("modal-open");
  },

  closeTop() {
    if (!UI.openStack.length) return;
    UI.closeModal(UI.openStack[UI.openStack.length - 1].id);
  },

  /** Potvrzovací dialog místo window.confirm. */
  confirm(options) {
    return new Promise(resolve => {
      const modal = document.getElementById("confirm-modal");
      document.getElementById("confirm-title").textContent = options.title || "Potvrzení";
      document.getElementById("confirm-text").textContent = options.text || "";
      const okBtn = document.getElementById("confirm-ok");
      okBtn.textContent = options.confirmLabel || "Potvrdit";
      okBtn.className = "btn " + (options.danger === false ? "btn-primary" : "btn-danger");

      let settled = false;
      const settle = (result) => {
        if (settled) return;
        settled = true;
        okBtn.removeEventListener("click", onOk);
        resolve(result);
      };

      // Zavření jakoukoli cestou (Esc, křížek, kliknutí mimo) = zamítnutí.
      UI.closeHandlers["confirm-modal"] = () => settle(false);

      const onOk = () => {
        settled = true;
        okBtn.removeEventListener("click", onOk);
        delete UI.closeHandlers["confirm-modal"];
        UI.closeModal("confirm-modal");
        resolve(true);
      };

      okBtn.addEventListener("click", onOk);
      UI.openModal("confirm-modal");
    });
  }
};

/* ============================== POZADÍ ================================== */

/**
 * Vesmírné pozadí.
 *
 * Skládá se ze tří vrstev hvězd s různou hloubkou (bližší jsou větší, jasnější
 * a pohybují se rychleji), měkké mlhoviny v barvě aktivní značky a občasné
 * padající hvězdy. Hvězdy se kreslí z předem připravených obrázků, ne přes
 * shadowBlur – kreslení stovek rozmazaných kruhů po každém snímku by zbytečně
 * vytěžovalo procesor.
 */
const Background = {
  canvas: null,
  ctx: null,
  frame: null,
  ready: false,
  enabled: false,

  w: 0,
  h: 0,
  dpr: 1,

  layers: [],
  sprites: [],
  nebula: null,
  accent: "",

  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  meteor: null,
  nextMeteor: 0,
  lastTime: 0,
  sizeRetries: 0,
  sizeTimer: null,
  observer: null,

  /* Vrstvy: podíl hvězd, velikost, jas, rychlost driftu, síla paralaxy */
  LAYERS: [
    { share: 0.56, size: [0.5, 1.0], alpha: [0.20, 0.45], drift: 1.6,  parallax: 0.10, twinkle: [0.25, 0.7] },
    { share: 0.31, size: [0.9, 1.6], alpha: [0.35, 0.70], drift: 4.5,  parallax: 0.35, twinkle: [0.35, 1.0] },
    { share: 0.13, size: [1.5, 2.6], alpha: [0.55, 0.95], drift: 9.0,  parallax: 0.80, twinkle: [0.45, 1.3] }
  ],

  STAR_TINTS: [
    [226, 240, 255],   // bílomodrá – nejčastější
    [226, 240, 255],
    [226, 240, 255],
    [255, 226, 200],   // teplá
    [198, 216, 255]    // studená
  ],

  /* ------------------------------ Řízení ------------------------------ */

  /** Připraví plátno; opakované volání jen přepíná běh animace. */
  start() {
    this.canvas = document.getElementById("bg-canvas");
    if (!this.canvas) return;

    if (!VehicleStorage.getSettings().animations) {
      this.stop();
      return;
    }

    this.canvas.hidden = false;

    if (!this.ready) {
      this.ready = true;
      this.ctx = this.canvas.getContext("2d");
      this.readAccent();
      this.resize();

      const onResize = Utils.debounce(() => {
        this.resize();
        if (!this.enabled) this.drawFrame(0);
      }, 180);

      window.addEventListener("resize", onResize);

      // Zachytí i okamžik, kdy plátno teprve dostane rozměr (stránka otevřená
      // na pozadí, pomalý rozvrh) – na to samotná událost resize nestačí.
      if (typeof ResizeObserver !== "undefined") {
        this.observer = new ResizeObserver(onResize);
        this.observer.observe(this.canvas);
      }

      window.addEventListener("pointermove", e => {
        if (!this.w || !this.h) return;
        this.pointer.tx = (e.clientX / this.w - 0.5) * 2;
        this.pointer.ty = (e.clientY / this.h - 0.5) * 2;
      }, { passive: true });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(this.frame);
          return;
        }
        if (!this.w || !this.h) this.resize();
        if (this.enabled) {
          this.lastTime = 0;
          this.frame = requestAnimationFrame(t => this.loop(t));
        }
      });
    }

    // Při vypnutých animacích v systému zůstane pozadí staticky vykreslené.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.enabled = false;
      cancelAnimationFrame(this.frame);
      this.drawFrame(0);
      return;
    }

    this.enabled = true;
    this.lastTime = 0;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(t => this.loop(t));
  },

  stop() {
    this.enabled = false;
    cancelAnimationFrame(this.frame);
    if (this.canvas) {
      this.canvas.hidden = true;
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  },

  /** Mlhovina přebírá barvu aktivní značky; volá se po přepnutí stroje. */
  refreshAccent() {
    if (!this.ready) return;
    if (this.readAccent()) {
      this.buildNebula();
      if (!this.enabled) this.drawFrame(0);
    }
  },

  readAccent() {
    const value = getComputedStyle(document.body).getPropertyValue("--accent").trim();
    if (!value || value === this.accent) return false;
    this.accent = value;
    return true;
  },

  /** "#rrggbb" -> [r, g, b] */
  rgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return [224, 69, 59];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },

  /* ---------------------------- Sestavení ----------------------------- */

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth || 0;
    const h = this.canvas.clientHeight || window.innerHeight || 0;

    // Plátno ještě nemá rozměr – stránka se teprve rozvrhuje, nebo byla
    // otevřená na pozadí. Zkouší se přes časovač, protože requestAnimationFrame
    // ani ResizeObserver se na skryté stránce nespouštějí a pozadí by tak
    // zůstalo trvale prázdné.
    if (w < 2 || h < 2) {
      if (!this.canvas.hidden && this.sizeRetries < 60) {
        this.sizeRetries++;
        clearTimeout(this.sizeTimer);
        this.sizeTimer = setTimeout(() => this.resize(), 150);
      }
      return;
    }
    this.sizeRetries = 0;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.buildSprites();
    this.buildStars();
    this.buildNebula();
    this.meteor = null;
    this.nextMeteor = 4 + Math.random() * 6;
  },

  /**
   * Předkreslí hvězdu jako měkký kotouček. Kreslí se pak jen drawImage,
   * takže i několik set hvězd zvládne slabší stroj.
   */
  buildSprites() {
    this.sprites = this.STAR_TINTS.map(tint => {
      const r = 16;
      const c = document.createElement("canvas");
      c.width = c.height = r * 2;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      const rgb = tint[0] + "," + tint[1] + "," + tint[2];
      grad.addColorStop(0.0, "rgba(" + rgb + ",1)");
      grad.addColorStop(0.25, "rgba(" + rgb + ",0.65)");
      grad.addColorStop(0.55, "rgba(" + rgb + ",0.18)");
      grad.addColorStop(1.0, "rgba(" + rgb + ",0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, r * 2, r * 2);
      return c;
    });
  },

  buildStars() {
    const total = Math.round(Math.min(340, Math.max(70, (this.w * this.h) / 5200)));
    this.layers = this.LAYERS.map(cfg => {
      const stars = [];
      const count = Math.round(total * cfg.share);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          r: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
          a: cfg.alpha[0] + Math.random() * (cfg.alpha[1] - cfg.alpha[0]),
          sprite: Math.floor(Math.random() * this.sprites.length),
          phase: Math.random() * Math.PI * 2,
          speed: cfg.twinkle[0] + Math.random() * (cfg.twinkle[1] - cfg.twinkle[0])
        });
      }
      return { cfg: cfg, stars: stars };
    });
  },

  /**
   * Mlhovina se kreslí jednou do malého plátna a pak se roztahuje přes celou
   * plochu – zvětšení samo o sobě zajistí měkké rozostření.
   */
  buildNebula() {
    const W = 220;
    const H = Math.max(80, Math.round(W * (this.h / Math.max(this.w, 1))));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");

    const accent = this.rgb(this.accent);
    const blob = (x, y, r, rgb, alpha) => {
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(" + rgb.join(",") + "," + alpha + ")");
      grad.addColorStop(1, "rgba(" + rgb.join(",") + ",0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    };

    // Mléčná dráha – měkký pruh napříč plátnem.
    g.save();
    g.translate(W * 0.5, H * 0.45);
    g.rotate(-0.42);
    const band = g.createLinearGradient(0, -H * 0.34, 0, H * 0.34);
    band.addColorStop(0.00, "rgba(120,150,220,0)");
    band.addColorStop(0.42, "rgba(140,165,225,0.13)");
    band.addColorStop(0.52, "rgba(175,190,240,0.17)");
    band.addColorStop(0.62, "rgba(140,165,225,0.11)");
    band.addColorStop(1.00, "rgba(120,150,220,0)");
    g.fillStyle = band;
    g.fillRect(-W, -H * 0.34, W * 2, H * 0.68);
    g.restore();

    blob(W * 0.16, H * 0.06, W * 0.52, accent, 0.30);
    blob(W * 0.88, H * 0.14, W * 0.44, [70, 105, 200], 0.20);
    blob(W * 0.62, H * 0.72, W * 0.50, [96, 70, 170], 0.15);
    blob(W * 0.05, H * 0.85, W * 0.40, accent, 0.10);
    blob(W * 0.45, H * 0.34, W * 0.30, [180, 200, 255], 0.07);

    this.nebula = c;
  },

  /* ---------------------------- Vykreslení ---------------------------- */

  loop(time) {
    if (!this.enabled) return;
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0.016;
    this.lastTime = time;
    this.drawFrame(dt);
    this.frame = requestAnimationFrame(t => this.loop(t));
  },

  drawFrame(dt) {
    const ctx = this.ctx;
    if (!ctx || !this.w || !this.h) return;

    ctx.clearRect(0, 0, this.w, this.h);

    if (this.nebula) {
      ctx.globalAlpha = 1;
      ctx.drawImage(this.nebula, 0, 0, this.w, this.h);
    }

    // Kurzor posouvá vrstvy s mírným doběhem – jen naznačená hloubka.
    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 2.5);
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 2.5);

    this.drawStars(dt);
    this.updateMeteor(dt);

    ctx.globalAlpha = 1;
  },

  drawStars(dt) {
    const ctx = this.ctx;
    const margin = 24;

    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      const cfg = layer.cfg;
      const stars = layer.stars;
      const ox = -this.pointer.x * cfg.parallax * 14;
      const oy = -this.pointer.y * cfg.parallax * 14;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.x += cfg.drift * dt;
        s.y += cfg.drift * 0.28 * dt;
        if (s.x > this.w + margin) { s.x = -margin; s.y = Math.random() * this.h; }
        if (s.y > this.h + margin) { s.y = -margin; s.x = Math.random() * this.w; }

        s.phase += s.speed * dt;
        const alpha = s.a * (0.68 + 0.32 * Math.sin(s.phase));
        const size = s.r * 4.2;

        ctx.globalAlpha = alpha;
        ctx.drawImage(
          this.sprites[s.sprite],
          s.x + ox - size / 2,
          s.y + oy - size / 2,
          size, size
        );
      }
    }
  },

  /* --------------------------- Padající hvězda ------------------------ */

  updateMeteor(dt) {
    if (!this.enabled) return;

    if (!this.meteor) {
      this.nextMeteor -= dt;
      if (this.nextMeteor <= 0) this.spawnMeteor();
      return;
    }

    const m = this.meteor;
    m.life += dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;

    if (m.life >= m.maxLife || m.x < -300 || m.x > this.w + 300 || m.y > this.h + 300) {
      this.meteor = null;
      this.nextMeteor = 7 + Math.random() * 11;
      return;
    }

    // Náběh a doznění, aby se hvězda neobjevila a nezmizela skokem.
    const t = m.life / m.maxLife;
    const fade = Math.min(1, t / 0.18) * Math.min(1, (1 - t) / 0.35);

    const len = Math.hypot(m.vx, m.vy);
    const tailX = m.x - (m.vx / len) * m.len;
    const tailY = m.y - (m.vy / len) * m.len;

    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
    grad.addColorStop(0, "rgba(190, 215, 255, 0)");
    grad.addColorStop(1, "rgba(235, 245, 255, " + (0.75 * fade).toFixed(3) + ")");

    ctx.globalAlpha = 1;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    ctx.globalAlpha = fade;
    const head = 13;
    ctx.drawImage(this.sprites[0], m.x - head / 2, m.y - head / 2, head, head);
    ctx.globalAlpha = 1;
  },

  spawnMeteor() {
    const toLeft = Math.random() < 0.35;
    const speed = 380 + Math.random() * 260;
    const angle = (toLeft ? Math.PI - 0.55 : 0.55) + (Math.random() - 0.5) * 0.22;

    this.meteor = {
      x: toLeft ? this.w * (0.55 + Math.random() * 0.45) : this.w * Math.random() * 0.55,
      y: -20 + Math.random() * this.h * 0.35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 90 + Math.random() * 90,
      life: 0,
      maxLife: 1.1 + Math.random() * 0.6
    };
  }
};

/* ============================== APLIKACE ================================ */

class App {
  static vehicle = null;
  static records = [];
  static selected = new Map();   // itemId -> cena (číslo nebo null)
  static customItems = [];
  static editingId = null;
  static modalBrand = "audi";
  static itemQuery = "";
  static pendingImportMode = "replace";

  /* ----------------------------- Start ------------------------------- */

  static init() {
    // Public builds never seed private data; existing browser records stay intact.
    VehicleStorage.markInitialized();
    VehicleStorage.migrate();
    this.bindGlobal();
    this.bindHeader();
    this.bindVehicleModal();
    this.bindServiceForm();
    this.bindBackup();
    this.bindSettings();
    Background.start();
    this.render();

  }

  static render() {
    const vehicles = VehicleStorage.getVehicles();
    this.vehicle = VehicleStorage.getActiveVehicle();

    if (!this.vehicle && vehicles.length) {
      this.vehicle = vehicles[0];
      VehicleStorage.setActiveVehicleId(this.vehicle.id);
    }

    document.getElementById("garage-btn-label").textContent = "Garáž (" + vehicles.length + ")";

    const hasVehicle = !!this.vehicle;
    document.getElementById("no-vehicle-state").hidden = hasVehicle;
    document.getElementById("vehicle-hero").hidden = !hasVehicle;
    document.getElementById("workspace").hidden = !hasVehicle;
    document.getElementById("alert-strip").hidden = !hasVehicle;

    if (!hasVehicle) {
      document.body.setAttribute("data-brand", "audi");
      Background.refreshAccent();
      return;
    }

    this.records = VehicleStorage.getServicesForVehicle(this.vehicle.id);
    document.body.setAttribute("data-brand", this.vehicle.brand || "audi");
    Background.refreshAccent();

    this.renderHero();
    this.renderAccordion();
    this.renderTimeline();
    this.renderCosts();
    this.renderPlan();
    this.renderAlerts();
    this.renderWorkshopSuggestions();
    this.updateFormHints();
  }

  /* ------------------------------ Hero -------------------------------- */

  /**
   * Zobrazovaný název stroje. Starší záznamy mají značku zapsanou i v názvu
   * modelu, takže by prosté spojení dalo "Yamaha Yamaha X-Max 250".
   */
  static vehicleName(vehicle) {
    if (vehicle.nickname) return vehicle.nickname;
    const brand = VehicleCatalog.brandName(vehicle.brand, vehicle.brandName);
    const model = (vehicle.modelName || "").trim();
    if (!model) return brand;
    if (Utils.norm(model).indexOf(Utils.norm(brand)) === 0) return model;
    return (brand + " " + model).trim();
  }

  static renderHero() {
    const v = this.vehicle;
    const brand = VehicleCatalog.brand(v.brand);
    const kind = VehicleCatalog.kindOf(v);

    const logo = document.getElementById("hero-logo");
    if (brand && brand.logo) {
      logo.innerHTML = '<img src="' + brand.logo + '" alt="' + Utils.esc(brand.name) + '">';
    } else {
      logo.innerHTML = '<i class="fa-solid ' + (kind === "car" ? "fa-car" : "fa-motorcycle") + '"></i>';
    }

    document.getElementById("hero-title").textContent = this.vehicleName(v);
    document.getElementById("hero-kind").textContent = KIND_LABELS[kind] || "Stroj";
    document.getElementById("hero-year-badge").textContent = v.year || "—";
    document.getElementById("hero-engine").textContent = v.engineName || "Motorizace neuvedena";
    document.getElementById("hero-spz").textContent = v.spz || "bez SPZ";
    document.getElementById("hero-vin").textContent = v.vin || "—";
    document.getElementById("hero-engine-code").textContent = v.engineCode || "—";

    const totalSpend = this.records.reduce((sum, r) => sum + Utils.money(r.totalPrice), 0);
    document.getElementById("stat-mileage").textContent = Utils.km(v.mileage);
    document.getElementById("stat-spend").textContent = Utils.kc(totalSpend);
    document.getElementById("stat-count").textContent = String(this.records.length);
    document.getElementById("stat-last").textContent = this.records.length
      ? Utils.fmtDate(this.records[0].date)
      : "—";

    document.getElementById("tab-history-count").textContent = String(this.records.length);
  }

  /* --------------------------- Upozornění ----------------------------- */

  /** Sestaví seznam blížících se nebo prošlých lhůt. */
  static buildReminders() {
    const v = this.vehicle;
    if (!v) return [];
    const kind = VehicleCatalog.kindOf(v);
    const mileage = Utils.num(v.mileage);
    const out = [];

    // 1) Doklady s pevným datem
    VehicleCatalog.documentsFor(kind).forEach(doc => {
      const value = v[doc.key];
      if (!value) return;
      const days = Utils.daysUntil(value);
      out.push({
        type: "document",
        icon: doc.icon,
        label: doc.label.replace(" platná do", "").replace(" platné do", "").replace(" do", ""),
        detail: Utils.fmtDate(value) + " (" + Utils.relative(days) + ")",
        status: days < 0 ? "overdue" : (days <= 30 ? "soon" : "ok"),
        sort: days
      });
    });

    // 2) Servisní intervaly podle posledního provedení
    VehicleCatalog.planFor(kind).forEach(plan => {
      const last = this.findLastRecordWithItem(plan.itemId);
      const entry = {
        type: "service",
        icon: VehicleCatalog.categoryIcon((VehicleCatalog.findItem(plan.itemId) || {}).categoryId),
        label: plan.label,
        interval: this.formatInterval(plan),
        status: "unknown",
        detail: "zatím neevidováno",
        sort: 99999,
        last: last
      };

      if (last) {
        const parts = [];
        let worst = "ok";
        let sortValue = 99999;

        if (plan.km) {
          const dueKm = Utils.num(last.mileage) + plan.km;
          const remaining = dueKm - mileage;
          parts.push(remaining >= 0
            ? "zbývá " + Utils.km(remaining)
            : "překročeno o " + Utils.km(-remaining));
          if (remaining < 0) worst = "overdue";
          else if (remaining < plan.km * 0.15) worst = "soon";
          sortValue = Math.min(sortValue, Math.round(remaining / 40));
        }

        if (plan.months) {
          const due = Utils.addMonths(last.date, plan.months);
          if (due) {
            const dueIso = Utils.toISODate(due);
            const days = Utils.daysUntil(dueIso);
            parts.push(Utils.fmtDate(dueIso) + " (" + Utils.relative(days) + ")");
            if (days < 0) worst = "overdue";
            else if (days <= 45 && worst !== "overdue") worst = "soon";
            sortValue = Math.min(sortValue, days);
          }
        }

        entry.status = worst;
        entry.detail = parts.join(" · ");
        entry.sort = sortValue;
        entry.lastText = "naposledy " + Utils.fmtDate(last.date) + " při " + Utils.km(last.mileage);
      }

      out.push(entry);
    });

    return out.sort((a, b) => a.sort - b.sort);
  }

  static formatInterval(plan) {
    const parts = [];
    if (plan.km) parts.push(plan.km.toLocaleString("cs-CZ") + " km");
    if (plan.months) parts.push(plan.months + " měs.");
    return parts.join(" / ");
  }

  static findLastRecordWithItem(itemId) {
    for (let i = 0; i < this.records.length; i++) {
      const r = this.records[i];
      if (Array.isArray(r.items) && r.items.some(it => VehicleCatalog.normalizeItemId(it.id) === itemId)) {
        return r;
      }
    }
    return null;
  }

  static renderAlerts() {
    const strip = document.getElementById("alert-strip");
    const urgent = this.buildReminders().filter(r => r.status === "overdue" || r.status === "soon");

    document.getElementById("tab-plan-count").hidden = urgent.length === 0;
    document.getElementById("tab-plan-count").textContent = String(urgent.length);

    if (!urgent.length) {
      strip.hidden = true;
      strip.innerHTML = "";
      return;
    }

    strip.hidden = false;
    strip.innerHTML = urgent.slice(0, 4).map(r =>
      '<button type="button" class="alert alert-' + r.status + '" data-goto-plan>' +
        '<i class="fa-solid ' + r.icon + '" aria-hidden="true"></i>' +
        '<span><strong>' + Utils.esc(r.label) + '</strong>' + Utils.esc(r.detail) + '</span>' +
      "</button>"
    ).join("") + (urgent.length > 4
      ? '<button type="button" class="alert alert-more" data-goto-plan>+' + (urgent.length - 4) + " další</button>"
      : "");

    strip.querySelectorAll("[data-goto-plan]").forEach(btn => {
      btn.addEventListener("click", () => this.switchTab("plan"));
    });
  }

  /* --------------------------- Připomínky ----------------------------- */

  static renderPlan() {
    const v = this.vehicle;
    const kind = VehicleCatalog.kindOf(v);

    // Doklady
    const docs = VehicleCatalog.documentsFor(kind);
    const docList = document.getElementById("documents-list");
    docList.innerHTML = docs.map(doc => {
      const value = v[doc.key];
      const days = value ? Utils.daysUntil(value) : null;
      const status = value === undefined || !value ? "empty" : (days < 0 ? "overdue" : (days <= 30 ? "soon" : "ok"));
      const statusText = {
        empty: "nevyplněno",
        overdue: "propadlo " + Utils.relative(days),
        soon: "končí " + Utils.relative(days),
        ok: "platí " + Utils.relative(days)
      }[status];
      return '<div class="doc-card doc-' + status + '">' +
        '<i class="fa-solid ' + doc.icon + '" aria-hidden="true"></i>' +
        '<div><strong>' + Utils.esc(doc.label) + "</strong>" +
        '<span>' + (value ? Utils.fmtDate(value) : "—") + " · " + statusText + "</span></div>" +
      "</div>";
    }).join("");

    // Intervaly
    const planList = document.getElementById("plan-list");
    const reminders = this.buildReminders().filter(r => r.type === "service");
    if (!reminders.length) {
      planList.innerHTML = '<p class="muted-note">Pro tento druh stroje nejsou definované intervaly.</p>';
      return;
    }
    planList.innerHTML = reminders.map(r =>
      '<div class="plan-row plan-' + r.status + '">' +
        '<span class="plan-icon"><i class="fa-solid ' + r.icon + '" aria-hidden="true"></i></span>' +
        "<div class=\"plan-body\">" +
          "<strong>" + Utils.esc(r.label) + "</strong>" +
          '<span class="plan-detail">' + Utils.esc(r.detail) + "</span>" +
          (r.lastText ? '<span class="plan-last">' + Utils.esc(r.lastText) + "</span>" : "") +
        "</div>" +
        '<span class="plan-interval">' + Utils.esc(r.interval) + "</span>" +
      "</div>"
    ).join("");
  }

  /* ---------------------------- Historie ------------------------------ */

  static renderTimeline() {
    const list = document.getElementById("timeline");

    // Nabídku kategorií je nutné obnovit dřív, než z ní přečteme filtr –
    // po přepnutí stroje se seznam kategorií mění.
    this.fillCategoryFilter();

    const query = Utils.norm(document.getElementById("history-search").value);
    const categoryFilter = document.getElementById("history-filter").value;

    if (!this.records.length) {
      list.innerHTML = '<div class="empty-block">' +
        '<i class="fa-solid fa-clipboard-list" aria-hidden="true"></i>' +
        "<h4>Zatím žádný servisní záznam</h4>" +
        "<p>Přejděte na záložku <strong>Nový záznam</strong> a zapište první údržbu.</p>" +
        '<button type="button" class="btn btn-primary btn-sm" data-action="new-record">Vytvořit záznam</button>' +
        "</div>";
      this.bindTimelineActions();
      return;
    }

    const filtered = this.records.filter(r => {
      if (categoryFilter) {
        const hit = (r.items || []).some(it => (LEGACY_CATEGORY_MAP[it.categoryId] || it.categoryId) === categoryFilter);
        if (!hit) return false;
      }
      if (!query) return true;
      const haystack = Utils.norm([
        r.notes,
        r.workshop,
        r.date,
        (r.items || []).map(i => i.label).join(" "),
        r.oil ? r.oil.viscosity + " " + r.oil.brand : ""
      ].join(" "));
      return haystack.indexOf(query) >= 0;
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-block"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        "<h4>Nic nenalezeno</h4><p>Zkuste jiné hledání nebo zrušte filtr kategorie.</p></div>";
      this.bindTimelineActions();
      return;
    }

    list.innerHTML = filtered.map((r, index) => {
      const prev = filtered[index + 1];
      const delta = prev ? Utils.num(r.mileage) - Utils.num(prev.mileage) : null;
      const items = (r.items || []);

      const tags = items.map(it => {
        const catId = LEGACY_CATEGORY_MAP[it.categoryId] || it.categoryId;
        return '<span class="tag tag-' + Utils.esc(catId) + '">' +
          '<i class="fa-solid ' + VehicleCatalog.categoryIcon(catId) + '" aria-hidden="true"></i>' +
          Utils.esc(it.label) +
          (it.price ? '<b>' + Utils.kc(it.price) + "</b>" : "") +
          "</span>";
      }).join("");

      const oil = r.oil && r.oil.viscosity
        ? '<div class="record-oil"><i class="fa-solid fa-oil-can" aria-hidden="true"></i> ' +
          Utils.esc(r.oil.viscosity) +
          (r.oil.liters ? " · " + Utils.esc(r.oil.liters) : "") +
          (r.oil.brand ? " · " + Utils.esc(r.oil.brand) : "") +
          "</div>"
        : "";

      return '<article class="record" data-id="' + Utils.esc(r.id) + '">' +
        '<span class="record-dot" aria-hidden="true"></span>' +
        '<header class="record-head">' +
          "<div>" +
            '<h4>' + Utils.fmtDate(r.date, "long") + "</h4>" +
            '<p class="record-sub">' +
              '<span><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> ' + Utils.km(r.mileage) + "</span>" +
              (delta !== null && delta > 0 ? '<span class="record-delta">+' + Utils.km(delta) + " od minule</span>" : "") +
              (r.workshop ? '<span><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> ' + Utils.esc(r.workshop) + "</span>" : "") +
            "</p>" +
          "</div>" +
          '<div class="record-price">' + Utils.kc(r.totalPrice) + "</div>" +
        "</header>" +
        (tags ? '<div class="tag-list">' + tags + "</div>" : "") +
        oil +
        (r.notes ? '<p class="record-note">' + Utils.esc(r.notes).replace(/\n/g, "<br>") + "</p>" : "") +
        '<footer class="record-actions">' +
          '<button type="button" class="btn btn-ghost btn-xs" data-edit="' + Utils.esc(r.id) + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Upravit</button>' +
          '<button type="button" class="btn btn-ghost btn-xs" data-print="' + Utils.esc(r.id) + '"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Protokol</button>' +
          '<button type="button" class="btn btn-ghost btn-xs btn-danger-text" data-delete="' + Utils.esc(r.id) + '"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Smazat</button>' +
        "</footer>" +
      "</article>";
    }).join("");

    this.bindTimelineActions();
  }

  static fillCategoryFilter() {
    const select = document.getElementById("history-filter");
    if (select.dataset.filled === this.vehicle.id) return;
    const kind = VehicleCatalog.kindOf(this.vehicle);
    const current = select.value;
    select.innerHTML = '<option value="">Všechny kategorie</option>' +
      VehicleCatalog.categoriesFor(kind).map(c =>
        '<option value="' + c.id + '">' + Utils.esc(c.name) + "</option>"
      ).join("") +
      '<option value="custom">Vlastní úkony</option>';
    select.value = current;
    select.dataset.filled = this.vehicle.id;
  }

  static bindTimelineActions() {
    const list = document.getElementById("timeline");
    list.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => this.startEdit(btn.dataset.edit));
    });
    list.querySelectorAll("[data-print]").forEach(btn => {
      btn.addEventListener("click", () => {
        const record = VehicleStorage.getService(btn.dataset.print);
        if (record) PDFServicePrinter.printSingleProtocol(record, this.vehicle);
      });
    });
    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const record = VehicleStorage.getService(btn.dataset.delete);
        if (!record) return;
        const ok = await UI.confirm({
          title: "Smazat záznam",
          text: "Opravdu smazat servisní záznam z " + Utils.fmtDate(record.date) + "? Tuto akci nelze vrátit zpět.",
          confirmLabel: "Smazat"
        });
        if (!ok) return;
        VehicleStorage.deleteServiceRecord(record.id);
        if (this.editingId === record.id) this.resetForm();
        UI.toast("Záznam byl smazán.", "success");
        this.render();
      });
    });
    const newBtn = list.querySelector('[data-action="new-record"]');
    if (newBtn) newBtn.addEventListener("click", () => this.switchTab("form"));
  }

  /* ----------------------------- Náklady ------------------------------ */

  static renderCosts() {
    const total = this.records.reduce((sum, r) => sum + Utils.money(r.totalPrice), 0);
    const mileages = this.records.map(r => Utils.num(r.mileage)).filter(Boolean);
    const span = mileages.length > 1 ? Math.max.apply(null, mileages) - Math.min.apply(null, mileages) : 0;
    const perKm = span > 0 ? total / span : 0;

    const dates = this.records.map(r => Utils.parseDate(r.date)).filter(Boolean);
    let perYear = 0;
    if (dates.length > 1) {
      const years = (Math.max.apply(null, dates) - Math.min.apply(null, dates)) / (365.25 * 86400000);
      if (years > 0.25) perYear = total / years;
    }

    const summary = [
      { label: "Celkem", value: Utils.kc(total), icon: "fa-coins" },
      { label: "Průměr na záznam", value: Utils.kc(this.records.length ? total / this.records.length : 0), icon: "fa-receipt" },
      { label: "Náklady na km", value: (perKm ? perKm.toFixed(2).replace(".", ",") : "0") + " Kč/km", icon: "fa-road" },
      { label: "Odhad na rok", value: perYear ? Utils.kc(perYear) : "—", icon: "fa-calendar" }
    ];

    document.getElementById("cost-summary").innerHTML = summary.map(s =>
      '<div class="cost-tile"><i class="fa-solid ' + s.icon + '" aria-hidden="true"></i>' +
      "<span>" + s.label + "</span><strong>" + s.value + "</strong></div>"
    ).join("");

    // Po letech
    const byYear = new Map();
    this.records.forEach(r => {
      const d = Utils.parseDate(r.date);
      if (!d) return;
      const y = d.getFullYear();
      byYear.set(y, (byYear.get(y) || 0) + Utils.money(r.totalPrice));
    });
    this.renderBars("cost-by-year",
      Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]).map(e => ({ label: String(e[0]), value: e[1] })));

    // Po kategoriích (z cen jednotlivých úkonů; zbytek jde do "nerozepsáno")
    const byCat = new Map();
    let itemised = 0;
    this.records.forEach(r => {
      (r.items || []).forEach(it => {
        const price = Utils.money(it.price);
        if (!price) return;
        itemised += price;
        const catId = LEGACY_CATEGORY_MAP[it.categoryId] || it.categoryId;
        byCat.set(catId, (byCat.get(catId) || 0) + price);
      });
    });
    const rest = total - itemised;
    const catRows = Array.from(byCat.entries())
      .map(e => ({ label: VehicleCatalog.categoryName(e[0]), value: e[1] }))
      .sort((a, b) => b.value - a.value);
    if (rest > 0) catRows.push({ label: "Nerozepsáno na úkony", value: rest, muted: true });
    this.renderBars("cost-by-category", catRows);
  }

  static renderBars(containerId, rows) {
    const el = document.getElementById(containerId);
    if (!rows.length) {
      el.innerHTML = '<p class="muted-note">Zatím není co zobrazit – doplňte ceny u záznamů.</p>';
      return;
    }
    const max = Math.max.apply(null, rows.map(r => r.value)) || 1;
    el.innerHTML = rows.map(r =>
      '<div class="bar-row' + (r.muted ? " bar-muted" : "") + '">' +
        '<span class="bar-label" title="' + Utils.esc(r.label) + '">' + Utils.esc(r.label) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + Math.max(2, (r.value / max) * 100).toFixed(1) + '%"></span></span>' +
        '<span class="bar-value">' + Utils.kc(r.value) + "</span>" +
      "</div>"
    ).join("");
  }

  /* --------------------------- Formulář ------------------------------- */

  static renderAccordion() {
    const container = document.getElementById("accordion");
    const kind = VehicleCatalog.kindOf(this.vehicle);
    const query = Utils.norm(this.itemQuery);
    const categories = VehicleCatalog.categoriesFor(kind);

    const openStates = {};
    container.querySelectorAll(".acc-item").forEach(el => {
      openStates[el.dataset.category] = el.classList.contains("open");
    });

    let visibleCount = 0;
    const html = categories.map((cat, index) => {
      const items = query
        ? cat.items.filter(i => Utils.norm(i.label).indexOf(query) >= 0 || Utils.norm(cat.name).indexOf(query) >= 0)
        : cat.items;
      if (!items.length) return "";
      visibleCount += items.length;

      const selectedHere = items.filter(i => this.selected.has(i.id)).length;
      const isOpen = query
        ? true
        : (openStates[cat.id] !== undefined ? openStates[cat.id] : (index === 0 || selectedHere > 0));

      return '<section class="acc-item' + (isOpen ? " open" : "") + '" data-category="' + cat.id + '">' +
        '<button type="button" class="acc-head" aria-expanded="' + isOpen + '">' +
          '<span class="acc-title"><i class="fa-solid ' + cat.icon + '" aria-hidden="true"></i>' +
            "<span>" + Utils.esc(cat.name) + '<small>' + Utils.esc(cat.hint) + "</small></span></span>" +
          '<span class="acc-meta">' +
            '<span class="acc-count' + (selectedHere ? " on" : "") + '">' + selectedHere + "</span>" +
            '<i class="fa-solid fa-chevron-down acc-chevron" aria-hidden="true"></i>' +
          "</span>" +
        "</button>" +
        '<div class="acc-body"><div class="item-grid">' +
          items.map(item => {
            const checked = this.selected.has(item.id);
            const price = checked ? this.selected.get(item.id) : null;
            return '<div class="item-card' + (checked ? " checked" : "") + '" data-item="' + item.id + '">' +
              '<label class="item-main">' +
                '<input type="checkbox" data-check="' + item.id + '"' + (checked ? " checked" : "") + ">" +
                "<span>" + Utils.esc(item.label) + "</span>" +
              "</label>" +
              '<div class="item-price">' +
                '<input type="number" min="0" step="0.01" inputmode="decimal" placeholder="Kč" ' +
                  'data-price="' + item.id + '" value="' + (price === null || price === undefined ? "" : price) + '" ' +
                  'aria-label="Cena za ' + Utils.esc(item.label) + '">' +
              "</div>" +
            "</div>";
          }).join("") +
        "</div></div>" +
      "</section>";
    }).join("");

    container.innerHTML = html;
    document.getElementById("accordion-empty").hidden = visibleCount > 0;

    container.querySelectorAll(".acc-head").forEach(head => {
      head.addEventListener("click", () => {
        const section = head.closest(".acc-item");
        const open = section.classList.toggle("open");
        head.setAttribute("aria-expanded", String(open));
      });
    });

    container.querySelectorAll("[data-check]").forEach(input => {
      input.addEventListener("change", () => {
        const id = input.dataset.check;
        if (input.checked) {
          if (!this.selected.has(id)) this.selected.set(id, null);
        } else {
          this.selected.delete(id);
        }
        const card = input.closest(".item-card");
        card.classList.toggle("checked", input.checked);
        const section = card.closest(".acc-item");
        const badge = section.querySelector(".acc-count");
        const count = section.querySelectorAll("[data-check]:checked").length;
        badge.textContent = String(count);
        badge.classList.toggle("on", count > 0);
        if (input.checked) {
          const priceInput = card.querySelector("[data-price]");
          if (priceInput) priceInput.focus();
        }
        this.afterSelectionChange();
      });
    });

    container.querySelectorAll("[data-price]").forEach(input => {
      input.addEventListener("input", () => {
        const id = input.dataset.price;
        const value = input.value === "" ? null : Utils.money(input.value);
        if (!this.selected.has(id)) {
          this.selected.set(id, value);
          const check = container.querySelector('[data-check="' + id + '"]');
          if (check) { check.checked = true; check.dispatchEvent(new Event("change")); }
        }
        this.selected.set(id, value);
        this.recalculateTotal();
        this.updateFormSummary();
      });
    });

    this.afterSelectionChange();
  }

  static afterSelectionChange() {
    const count = this.selected.size + this.customItems.length;
    document.getElementById("selected-count").textContent = count + (count === 1 ? " vybrán" : " vybráno");
    document.getElementById("oil-panel").hidden = !this.selected.has("oil_engine");
    document.getElementById("cabin-panel").hidden = !this.selected.has("oil_cabin_filter");
    this.recalculateTotal();
    this.updateFormSummary();
  }

  static recalculateTotal() {
    if (!document.getElementById("auto-sum").checked) return;
    let sum = 0;
    this.selected.forEach(price => { sum += Utils.money(price); });
    this.customItems.forEach(item => { sum += Utils.money(item.price); });
    const input = document.getElementById("srv-price");
    input.value = sum !== 0 ? Math.round(sum * 100) / 100 : "";
  }

  static updateFormSummary() {
    const count = this.selected.size + this.customItems.length;
    const total = Utils.money(document.getElementById("srv-price").value);
    document.getElementById("form-summary").textContent = count
      ? Utils.plural(count, "úkon", "úkony", "úkonů") + " · " + Utils.kc(total)
      : "Zatím není vybrán žádný úkon.";
  }

  static updateFormHints() {
    const hint = document.getElementById("mileage-hint");
    if (!hint || !this.vehicle) return;
    const last = this.records[0];
    const current = Utils.num(this.vehicle.mileage);
    hint.textContent = last
      ? "Poslední zapsaný stav: " + Utils.km(last.mileage)
      : "Aktuální stav vozidla: " + Utils.km(current);

    const oilSelect = document.getElementById("oil-viscosity");
    const options = VehicleCatalog.oilOptions(this.vehicle);
    const currentValue = oilSelect.value;
    const engine = VehicleCatalog.engine(this.vehicle);

    oilSelect.innerHTML = options.map(o => '<option value="' + Utils.esc(o) + '">' + Utils.esc(o) + "</option>").join("");
    if (options.indexOf(currentValue) >= 0) oilSelect.value = currentValue;
    else if (engine && engine.oilSpec && options.indexOf(engine.oilSpec) >= 0) oilSelect.value = engine.oilSpec;

    document.getElementById("oil-recommend").textContent = engine && engine.oilCapacity
      ? "Náplň dle katalogu: " + engine.oilCapacity
      : "";
    const litersInput = document.getElementById("oil-liters");
    if (!litersInput.value && engine && engine.oilCapacity) litersInput.placeholder = engine.oilCapacity;
  }

  static renderWorkshopSuggestions() {
    const list = document.getElementById("workshop-list");
    const names = Array.from(new Set(
      VehicleStorage.getAllServices().map(s => (s.workshop || "").trim()).filter(Boolean)
    )).sort();
    list.innerHTML = names.map(n => '<option value="' + Utils.esc(n) + '"></option>').join("");
  }

  static renderCustomItems() {
    const list = document.getElementById("custom-list");
    list.innerHTML = this.customItems.map(item =>
      '<span class="chip"><i class="fa-solid fa-wrench" aria-hidden="true"></i>' +
      Utils.esc(item.label) +
      (item.price ? " <b>" + Utils.kc(item.price) + "</b>" : "") +
      '<button type="button" class="chip-remove" data-remove="' + Utils.esc(item.id) + '" aria-label="Odebrat">&times;</button></span>'
    ).join("");

    list.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.customItems = this.customItems.filter(i => i.id !== btn.dataset.remove);
        this.renderCustomItems();
        this.afterSelectionChange();
      });
    });
  }

  static startEdit(recordId) {
    if (typeof CloudGarage !== "undefined") CloudGarage.draft = true;
    const record = VehicleStorage.getService(recordId);
    if (!record) return;

    InvoiceImport.reset();
    this.editingId = record.id;
    document.getElementById("srv-id").value = record.id;
    document.getElementById("srv-date").value = record.date || Utils.today();
    document.getElementById("srv-mileage").value = record.mileage || "";
    document.getElementById("srv-workshop").value = record.workshop || "";
    document.getElementById("srv-notes").value = record.notes || "";
    document.getElementById("auto-sum").checked = false;
    document.getElementById("srv-price").value = record.totalPrice || "";
    document.getElementById("srv-payment-enabled").checked = record.payment?.enabled === true;
    document.getElementById("srv-payment-vs").value = record.payment?.variableSymbol || "";

    this.selected = new Map();
    this.customItems = [];
    (record.items || []).forEach(it => {
      if (it.categoryId === "custom") {
        this.customItems.push({
          id: it.id || VehicleStorage.newId("custom"),
          label: String(it.label || "").replace(/^Vlastní úkon:\s*/i, ""),
          price: Utils.money(it.price)
        });
      } else {
        this.selected.set(VehicleCatalog.normalizeItemId(it.id), it.price === 0 ? null : Utils.money(it.price));
      }
    });

    if (record.oil) {
      document.getElementById("oil-liters").value = record.oil.liters || "";
      document.getElementById("oil-brand").value = record.oil.brand || "";
    }
    if (record.cabin) {
      document.getElementById("cabin-type").value = record.cabin.type || "S aktivním uhlím";
      document.getElementById("cabin-brand").value = record.cabin.brand || "";
    }

    document.getElementById("form-title").textContent = "Úprava záznamu z " + Utils.fmtDate(record.date);
    document.getElementById("tab-form-label").textContent = "Úprava záznamu";
    document.getElementById("submit-label").textContent = "Uložit změny";
    document.getElementById("cancel-edit-btn").hidden = false;

    this.renderAccordion();
    this.renderCustomItems();
    this.updateFormHints();
    if (record.oil && record.oil.viscosity) {
      const select = document.getElementById("oil-viscosity");
      if (!Array.prototype.some.call(select.options, o => o.value === record.oil.viscosity)) {
        select.insertAdjacentHTML("afterbegin", '<option value="' + Utils.esc(record.oil.viscosity) + '">' + Utils.esc(record.oil.viscosity) + "</option>");
      }
      select.value = record.oil.viscosity;
    }
    this.switchTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  static resetForm() {
    if (typeof CloudGarage !== "undefined") CloudGarage.draft = false;
    InvoiceImport.reset();
    this.editingId = null;
    this.selected = new Map();
    this.customItems = [];
    this.itemQuery = "";

    const form = document.getElementById("service-form");
    form.reset();

    // Čte se aktuální stroj z úložiště – formulář se resetuje i při jeho přepnutí.
    const vehicle = VehicleStorage.getActiveVehicle();
    document.getElementById("srv-id").value = "";
    document.getElementById("srv-date").value = Utils.today();
    document.getElementById("srv-mileage").value = vehicle ? Utils.num(vehicle.mileage) || "" : "";
    document.getElementById("auto-sum").checked = VehicleStorage.getSettings().autoSum;
    document.getElementById("item-search").value = "";
    document.getElementById("form-title").textContent = "Nový servisní záznam";
    document.getElementById("tab-form-label").textContent = "Nový záznam";
    document.getElementById("submit-label").textContent = "Uložit záznam";
    document.getElementById("cancel-edit-btn").hidden = true;

    this.renderAccordion();
    this.renderCustomItems();
    this.updateFormHints();
  }

  static collectFormRecord() {
    const date = document.getElementById("srv-date").value;
    const mileage = document.getElementById("srv-mileage").value;

    if (!date) return { error: "Vyplňte datum servisu." };
    if (mileage === "") return { error: "Vyplňte stav tachometru." };
    if (Utils.num(mileage) < 0) return { error: "Stav tachometru nemůže být záporný." };
    if (!this.selected.size && !this.customItems.length && !document.getElementById("srv-notes").value.trim()) {
      return { error: "Vyberte alespoň jeden úkon nebo napište poznámku." };
    }

    const items = [];
    this.selected.forEach((price, itemId) => {
      const meta = VehicleCatalog.findItem(itemId);
      items.push({
        id: itemId,
        categoryId: meta ? meta.categoryId : "custom",
        label: meta ? meta.label : itemId,
        price: Utils.money(price)
      });
    });
    this.customItems.forEach(item => {
      items.push({ id: item.id, categoryId: "custom", label: item.label, price: Utils.money(item.price) });
    });

    const record = {
      id: this.editingId || undefined,
      vehicleId: this.vehicle.id,
      date: date,
      mileage: Utils.num(mileage),
      totalPrice: Utils.money(document.getElementById("srv-price").value),
      workshop: document.getElementById("srv-workshop").value.trim(),
      notes: document.getElementById("srv-notes").value.trim(),
      items: items
    };

    record.payment = {
      enabled: document.getElementById("srv-payment-enabled").checked,
      variableSymbol: document.getElementById("srv-payment-vs").value.trim()
    };
    if (record.payment.enabled) {
      try { PaymentQR.payload(record.totalPrice, record.payment.variableSymbol); }
      catch (error) { return { error: error.message }; }
    }

    if (this.selected.has("oil_engine")) {
      record.oil = {
        viscosity: document.getElementById("oil-viscosity").value,
        liters: document.getElementById("oil-liters").value.trim(),
        brand: document.getElementById("oil-brand").value.trim()
      };
    }
    if (this.selected.has("oil_cabin_filter")) {
      record.cabin = {
        type: document.getElementById("cabin-type").value,
        brand: document.getElementById("cabin-brand").value.trim()
      };
    }

    return { record: record };
  }

  static async submitServiceForm() {
    if (!this.vehicle) {
      UI.toast("Nejprve přidejte stroj do garáže.", "warn");
      return;
    }

    const result = this.collectFormRecord();
    if (result.error) {
      UI.toast(result.error, "error");
      return;
    }

    const last = this.records.filter(r => r.id !== this.editingId)[0];
    if (last && Utils.num(result.record.mileage) < Utils.num(last.mileage)) {
      const ok = await UI.confirm({
        title: "Nižší stav tachometru",
        text: "Zadaný stav " + Utils.km(result.record.mileage) + " je nižší než poslední zapsaný " +
              Utils.km(last.mileage) + ". Opravdu uložit?",
        confirmLabel: "Uložit i tak",
        danger: false
      });
      if (!ok) return;
    }

    VehicleStorage.saveServiceRecord(result.record);
    UI.toast(this.editingId ? "Změny byly uloženy." : "Servisní záznam byl uložen.", "success");
    this.resetForm();
    this.render();
    this.switchTab("history");
  }

  /* ---------------------------- Záložky ------------------------------- */

  static switchTab(name) {
    Utils.$$(".tab").forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    Utils.$$(".tab-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === "panel-" + name);
    });
  }

  /* ------------------------- Modál: stroj ----------------------------- */

  static openVehicleModal(vehicle) {
    if (typeof CloudGarage !== "undefined") { CloudGarage.beforeVehicleDraft = CloudGarage.draft; CloudGarage.draft = true; }
    const isEdit = !!vehicle;
    document.getElementById("vehicle-modal-title").textContent = isEdit ? "Upravit stroj" : "Přidat stroj";
    document.getElementById("veh-id").value = isEdit ? vehicle.id : "";

    this.modalBrand = isEdit ? (vehicle.brand || "audi") : "audi";
    this.renderBrandGrid();
    this.renderDocumentFields(vehicle);

    this.fillModelSelect(isEdit ? vehicle.modelKey : null);
    this.fillYearSelect(isEdit ? vehicle.year : null);
    this.fillEngineSelect(isEdit ? vehicle.engineName : null);

    document.getElementById("veh-engine-code").value = isEdit ? (vehicle.engineCode || "") : "";
    document.getElementById("veh-mileage").value = isEdit ? (vehicle.mileage || "") : "";
    document.getElementById("veh-nickname").value = isEdit ? (vehicle.nickname || "") : "";
    document.getElementById("veh-spz").value = isEdit ? (vehicle.spz || "") : "";
    document.getElementById("veh-vin").value = isEdit ? (vehicle.vin || "") : "";
    document.getElementById("vin-hint").textContent = "";

    UI.openModal("vehicle-modal");
  }

  static renderBrandGrid() {
    const grid = document.getElementById("brand-grid");
    grid.innerHTML = Object.keys(VEHICLE_DB).map(key => {
      const brand = VEHICLE_DB[key];
      const selected = key === this.modalBrand;
      return '<button type="button" class="brand-card' + (selected ? " selected" : "") + '" ' +
        'data-brand="' + key + '" role="radio" aria-checked="' + selected + '">' +
        '<img src="' + brand.logo + '" alt="" aria-hidden="true">' +
        "<span>" + Utils.esc(brand.name) + "</span>" +
        '<small>' + (brand.type === "car" ? "Automobily" : "Motocykly") + "</small>" +
      "</button>";
    }).join("");

    grid.querySelectorAll("[data-brand]").forEach(card => {
      card.addEventListener("click", () => {
        this.modalBrand = card.dataset.brand;
        this.renderBrandGrid();
        this.fillModelSelect();
        this.fillYearSelect();
        this.fillEngineSelect();
        this.renderDocumentFields(null, true);
      });
    });
  }

  static fillModelSelect(selectedKey) {
    const select = document.getElementById("veh-model");
    const brand = VehicleCatalog.brand(this.modalBrand);
    if (!brand) { select.innerHTML = '<option value="">—</option>'; return; }

    const option = k => {
      const m = brand.models[k];
      const years = m.edition ? "" : (m.years ? " (" + m.years[0] + "–" + m.years[1] + ")" : (m.legacy ? " – jiná / neurčená generace" : ""));
      return '<option value="' + k + '">' + Utils.esc(m.name) + years + "</option>";
    };
    const keys = Object.keys(brand.models);
    const sourced = keys.filter(k => brand.models[k].source);
    const reference = keys.filter(k => !brand.models[k].source);
    select.innerHTML = (sourced.length ? '<optgroup label="Nabídky doložené výrobcem / katalogem">' + sourced.map(option).join('') + '</optgroup>' : '') +
      (reference.length ? '<optgroup label="Další modely a ročníky – orientační seznam">' + reference.map(option).join('') + '</optgroup>' : '');
    if (selectedKey && brand.models[selectedKey]) select.value = selectedKey;
  }

  static fillYearSelect(selectedYear) {
    const select = document.getElementById("veh-year");
    const modelKey = document.getElementById("veh-model").value;
    const years = VehicleCatalog.yearsFor(this.modalBrand, modelKey);
    select.innerHTML = years.map(y => '<option value="' + y + '">' + y + "</option>").join("");
    const model = VehicleCatalog.model(this.modalBrand, modelKey);
    if (model && model.edition) {
      const otherYears = [];
      for (let y = new Date().getFullYear(); y >= 1990; y--) {
        if (!years.includes(y)) otherYears.push('<option value="' + y + '">' + y + ' (mimo doloženou nabídku)</option>');
      }
      select.innerHTML += '<optgroup label="Jiný rok – ověřte motor podle technického průkazu">' + otherYears.join('') + '</optgroup>';
    }
    if (selectedYear && years.indexOf(Number(selectedYear)) >= 0) select.value = String(selectedYear);
    else if (selectedYear) {
      if (!Array.from(select.options).some(o => o.value === String(selectedYear))) select.add(new Option(String(selectedYear) + " (uložený rok)", String(selectedYear)));
      select.value = String(selectedYear);
    }
  }

  static fillEngineSelect(selectedName) {
    const select = document.getElementById("veh-engine");
    const modelKey = document.getElementById("veh-model").value;
    const model = VehicleCatalog.model(this.modalBrand, modelKey);
    const customField = document.getElementById("veh-engine-custom-field");
    customField.hidden = true;
    document.getElementById("veh-engine-custom").value = "";
    const sourceEl = document.getElementById("engine-source");
    sourceEl.hidden = true;
    sourceEl.replaceChildren();
    select.innerHTML = '<option value="">Neuvedeno – vyberte motorizaci</option>' +
        (model ? model.engines : []).map(e => '<option value="' + Utils.esc(e.name) + '">' + Utils.esc(e.name) + '</option>').join('') +
        '<option value="__custom__">Jiná motorizace – zadat ručně</option>';
      if (selectedName) {
        const exists = Array.from(select.options).some(o => o.value === selectedName);
        select.value = exists ? selectedName : "__custom__";
        if (!exists) document.getElementById("veh-engine-custom").value = selectedName;
      }
      sourceEl.hidden = false;
      const source = model && model.source && (CATALOGUE_SOURCES[model.source] || FORD_SOURCES[model.source]);
      if (source) {
        sourceEl.append(document.createTextNode(model.edition
          ? 'Doložená nabídka: ' + model.edition + '. U jiného ročníku ověřte motorizaci podle technického průkazu. České verze se mohou lišit. '
          : 'Evropská nabídka pro uvedenou generaci; jednotlivé motory nebyly dostupné ve všech ročnících a českých verzích. '));
        const link = document.createElement('a');
        link.href = source[1]; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = source[0]; sourceEl.append(link);
      } else {
        sourceEl.textContent = 'Původní orientační seznam; všechny varianty nejsou ověřené. Motor a výkon porovnejte s technickým průkazem, případně je zadejte ručně.';
      }
      this.updateEngineHint();
  }

  static updateEngineHint() {
    const modelKey = document.getElementById("veh-model").value;
    const model = VehicleCatalog.model(this.modalBrand, modelKey);
    const name = document.getElementById("veh-engine").value;
    document.getElementById("veh-engine-custom-field").hidden = name !== "__custom__";
    const engine = model ? model.engines.find(e => e.name === name) : null;
    document.getElementById("engine-hint").textContent = engine && engine.oilSpec && engine.oilCapacity
      ? "Doporučený olej: " + engine.oilSpec + " · náplň " + engine.oilCapacity
      : "Motor a výkon vyberte podle technického průkazu. Olej a náplň ověřte v příručce konkrétního vozidla.";
  }

  static renderDocumentFields(vehicle, keepValues) {
    const wrap = document.getElementById("documents-fields");
    const model = VehicleCatalog.model(this.modalBrand, document.getElementById("veh-model").value);
    const brand = VehicleCatalog.brand(this.modalBrand);
    const kind = (model && model.kind) || (brand && brand.type === "moto" ? "motorcycle" : "car");

    const previous = {};
    if (keepValues) {
      wrap.querySelectorAll("input[data-doc]").forEach(i => { previous[i.dataset.doc] = i.value; });
    }

    wrap.innerHTML = VehicleCatalog.documentsFor(kind).map(doc => {
      const value = keepValues ? (previous[doc.key] || "") : (vehicle ? (vehicle[doc.key] || "") : "");
      return '<div class="field"><label for="doc-' + doc.key + '">' +
        '<i class="fa-solid ' + doc.icon + '" aria-hidden="true"></i> ' + Utils.esc(doc.label) + "</label>" +
        '<input type="date" class="form-control" id="doc-' + doc.key + '" data-doc="' + doc.key + '" value="' + Utils.esc(value) + '"></div>';
    }).join("");
  }

  static saveVehicleFromForm() {
    const brandKey = this.modalBrand;
    const brand = VehicleCatalog.brand(brandKey);
    const modelKey = document.getElementById("veh-model").value;
    const model = VehicleCatalog.model(brandKey, modelKey);

    if (!brand || !model) {
      UI.toast("Vyberte značku a model.", "error");
      return;
    }

    const id = document.getElementById("veh-id").value;
    const mileage = Utils.num(document.getElementById("veh-mileage").value);
    let engineName = document.getElementById("veh-engine").value;
    if (engineName === "__custom__") {
      engineName = document.getElementById("veh-engine-custom").value.trim();
      if (!engineName) { UI.toast("Vyplňte vlastní motorizaci.", "warn"); return; }
    }

    const vehicle = {
      id: id || undefined,
      brand: brandKey,
      brandName: brand.name,
      modelKey: modelKey,
      modelName: model.name,
      kind: model.kind,
      year: Utils.num(document.getElementById("veh-year").value),
      engineName: engineName,
      engineCode: document.getElementById("veh-engine-code").value.trim().toUpperCase(),
      nickname: document.getElementById("veh-nickname").value.trim(),
      baseMileage: mileage,
      mileage: mileage,
      spz: document.getElementById("veh-spz").value.trim().toUpperCase(),
      vin: document.getElementById("veh-vin").value.trim().toUpperCase()
    };

    document.querySelectorAll("#documents-fields input[data-doc]").forEach(input => {
      vehicle[input.dataset.doc] = input.value || "";
    });

    const saved = VehicleStorage.saveVehicle(vehicle);
    VehicleStorage.syncVehicleMileage(saved.id);
    if (!id) VehicleStorage.setActiveVehicleId(saved.id);

    UI.closeModal("vehicle-modal");
    UI.toast(id ? "Stroj byl upraven." : "Stroj byl přidán do garáže.", "success");
    this.resetForm();
    this.render();
  }

  /* ------------------------- Modál: garáž ----------------------------- */

  static openGarageModal() {
    const container = document.getElementById("garage-list");
    const vehicles = VehicleStorage.getVehicles();
    const activeId = VehicleStorage.getActiveVehicleId();

    if (!vehicles.length) {
      container.innerHTML = '<p class="muted-note">Garáž je prázdná.</p>';
    } else {
      container.innerHTML = vehicles.map(v => {
        const brand = VehicleCatalog.brand(v.brand);
        const kind = VehicleCatalog.kindOf(v);
        const records = VehicleStorage.getServicesForVehicle(v.id);
        const spend = records.reduce((s, r) => s + Utils.money(r.totalPrice), 0);
        const isActive = v.id === activeId;
        const name = this.vehicleName(v);

        return '<div class="garage-card' + (isActive ? " active" : "") + '">' +
          '<span class="garage-logo">' +
            (brand && brand.logo
              ? '<img src="' + brand.logo + '" alt="">'
              : '<i class="fa-solid ' + (kind === "car" ? "fa-car" : "fa-motorcycle") + '"></i>') +
          "</span>" +
          "<div class=\"garage-info\">" +
            "<strong>" + Utils.esc(name.trim()) + "</strong>" +
            "<span>" + Utils.esc(v.engineName || "") + "</span>" +
            "<span class=\"garage-meta\">" +
              (v.year || "—") + " · " + Utils.esc(v.spz || "bez SPZ") + " · " +
              Utils.km(v.mileage) + " · " + Utils.plural(records.length, "záznam", "záznamy", "záznamů") +
              " · " + Utils.kc(spend) +
            "</span>" +
          "</div>" +
          '<div class="garage-actions">' +
            (isActive
              ? '<span class="pill pill-active">Aktivní</span>'
              : '<button type="button" class="btn btn-primary btn-xs" data-activate="' + Utils.esc(v.id) + '">Aktivovat</button>') +
            '<button type="button" class="btn btn-ghost btn-xs" data-edit-vehicle="' + Utils.esc(v.id) + '" aria-label="Upravit"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" class="btn btn-ghost btn-xs btn-danger-text" data-delete-vehicle="' + Utils.esc(v.id) + '" aria-label="Smazat"><i class="fa-solid fa-trash-can"></i></button>' +
          "</div>" +
        "</div>";
      }).join("");

      container.querySelectorAll("[data-activate]").forEach(btn => {
        btn.addEventListener("click", () => {
          VehicleStorage.setActiveVehicleId(btn.dataset.activate);
          UI.closeModal("garage-modal");
          this.resetForm();
          this.render();
          this.switchTab("history");
        });
      });

      container.querySelectorAll("[data-edit-vehicle]").forEach(btn => {
        btn.addEventListener("click", () => {
          const v = VehicleStorage.getVehicle(btn.dataset.editVehicle);
          UI.closeModal("garage-modal");
          if (v) this.openVehicleModal(v);
        });
      });

      container.querySelectorAll("[data-delete-vehicle]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const v = VehicleStorage.getVehicle(btn.dataset.deleteVehicle);
          if (!v) return;
          const count = VehicleStorage.getServicesForVehicle(v.id).length;
          const ok = await UI.confirm({
            title: "Odebrat stroj",
            text: "Opravdu odebrat " + this.vehicleName(v) +
                  " včetně " + Utils.plural(count, "servisního záznamu", "servisních záznamů", "servisních záznamů") +
                  "? Akci nelze vrátit zpět.",
            confirmLabel: "Odebrat"
          });
          if (!ok) return;
          VehicleStorage.deleteVehicle(v.id);
          UI.toast("Stroj byl odebrán.", "success");
          this.resetForm();
          this.openGarageModal();
          this.render();
        });
      });
    }

    UI.openModal("garage-modal");
  }

  /* ------------------------ Ukázková data ----------------------------- */

  static loadDemoData() {
    const yamaha = VehicleStorage.saveVehicle({
      brand: "yamaha", brandName: "Yamaha",
      modelKey: "xmax_250_2007", modelName: "X-Max 250 (YP250R)", kind: "scooter",
      year: 2007, engineName: "250 cm³ 4T jednoválec, 15,6 kW (G389E)",
      engineCode: "G389E", baseMileage: 24500, mileage: 24500,
      spz: "DEMO", vin: ""
    });

    VehicleStorage.saveServiceRecord({
      vehicleId: yamaha.id,
      date: Utils.today(),
      mileage: 24500,
      totalPrice: 2800,
      workshop: "Svépomocně v garáži",
      notes: "Olej Yamalube 10W-40, filtr HiFlo, nový řemen variátoru i válečky.",
      items: [
        { id: "oil_engine", categoryId: "oil", label: "Motorový olej + olejový filtr", price: 650 },
        { id: "sc_belt", categoryId: "cvt", label: "Řemen variátoru", price: 1450 },
        { id: "sc_rollers", categoryId: "cvt", label: "Válečky variátoru + vodítka", price: 700 }
      ],
      oil: { viscosity: "10W-40 4T JASO MA/MB", liters: "1,2 L", brand: "Yamalube" }
    });

    const octavia = VehicleStorage.saveVehicle({
      brand: "skoda", brandName: "Škoda",
      modelKey: "octavia_2", modelName: "Octavia II (1Z)", kind: "car",
      year: 2008, engineName: "2.0 TDI PD 103 kW 16V (BKD)",
      engineCode: "BKD", baseMileage: 215000, mileage: 215000,
      spz: "DEMO", vin: ""
    });

    VehicleStorage.saveServiceRecord({
      vehicleId: octavia.id,
      date: Utils.today(),
      mileage: 215000,
      totalPrice: 5400,
      workshop: "Autoservis Novák",
      notes: "Olej Castrol 5W-40 505.01, filtr MANN. Zkontrolován stav rozvodů.",
      items: [
        { id: "oil_engine", categoryId: "oil", label: "Motorový olej + olejový filtr", price: 2200 },
        { id: "oil_cabin_filter", categoryId: "oil", label: "Kabinový (pylový) filtr", price: 450 },
        { id: "brake_pads_front", categoryId: "brakes", label: "Přední brzdové destičky", price: 1800 },
        { id: "el_diagnostics", categoryId: "electric", label: "Diagnostika – čtení a mazání chyb", price: 950 }
      ],
      oil: { viscosity: "5W-40 VW 502.00 / 505.01", liters: "3,8 L", brand: "Castrol Edge" },
      cabin: { type: "S aktivním uhlím", brand: "MANN CUK 2939" }
    });

    VehicleStorage.setActiveVehicleId(yamaha.id);
    UI.toast("Ukázková data byla načtena.", "success");
    this.resetForm();
    this.render();
  }

  /* ---------------------------- Události ------------------------------ */

  static bindGlobal() {
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && UI.openStack.length) {
        e.preventDefault();
        UI.closeTop();
      }
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("mousedown", e => {
        if (e.target === overlay) UI.closeModal(overlay.id);
      });
    });

    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => UI.closeModal(btn.dataset.close));
    });

    document.querySelectorAll('[data-action="add-vehicle"]').forEach(btn => {
      btn.addEventListener("click", () => {
        UI.closeModal("garage-modal");
        this.openVehicleModal(null);
      });
    });

    document.querySelectorAll('[data-action="edit-vehicle"]').forEach(btn => {
      btn.addEventListener("click", () => { if (this.vehicle) this.openVehicleModal(this.vehicle); });
    });


    document.querySelectorAll('[data-action="open-backup"]').forEach(btn => {
      btn.addEventListener("click", () => this.openBackupModal());
    });

    const demoBtn = document.querySelector('[data-action="load-demo"]');
    if (demoBtn) demoBtn.addEventListener("click", () => this.loadDemoData());

    Utils.$$(".tab").forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });
  }

  static bindHeader() {
    document.getElementById("garage-btn").addEventListener("click", () => this.openGarageModal());
    document.getElementById("add-vehicle-btn").addEventListener("click", () => this.openVehicleModal(null));
    document.getElementById("backup-btn").addEventListener("click", () => this.openBackupModal());
    document.getElementById("settings-btn").addEventListener("click", () => this.openSettingsModal());
    document.getElementById("edit-vehicle-btn").addEventListener("click", () => {
      if (this.vehicle) this.openVehicleModal(this.vehicle);
    });
    document.getElementById("print-book-btn").addEventListener("click", () => {
      if (!this.vehicle) return;
      PDFServicePrinter.printFullHistory(this.vehicle, this.records);
    });
  }

  static bindVehicleModal() {
    document.getElementById("veh-model").addEventListener("change", () => {
      this.fillYearSelect();
      this.fillEngineSelect();
      this.renderDocumentFields(null, true);
    });
    document.getElementById("veh-engine").addEventListener("change", () => this.updateEngineHint());

    document.getElementById("veh-vin").addEventListener("input", e => {
      const value = e.target.value.trim();
      const hint = document.getElementById("vin-hint");
      if (!value) { hint.textContent = ""; hint.className = "field-hint"; return; }
      if (value.length === 17) { hint.textContent = "Délka VIN je v pořádku."; hint.className = "field-hint ok"; }
      else { hint.textContent = "VIN má obvykle 17 znaků (zadáno " + value.length + ")."; hint.className = "field-hint warn"; }
    });

    document.getElementById("vehicle-form").addEventListener("submit", e => {
      e.preventDefault();
      this.saveVehicleFromForm();
    });
  }

  static bindServiceForm() {
    InvoiceImport.init();
    document.getElementById("service-form").addEventListener("submit", e => {
      e.preventDefault();
      this.submitServiceForm();
    });

    document.getElementById("cancel-edit-btn").addEventListener("click", () => {
      this.resetForm();
      this.switchTab("history");
    });

    document.getElementById("add-custom-btn").addEventListener("click", () => this.addCustomItem());
    document.getElementById("custom-name").addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); this.addCustomItem(); }
    });
    document.getElementById("custom-price").addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); this.addCustomItem(); }
    });

    document.getElementById("auto-sum").addEventListener("change", e => {
      VehicleStorage.saveSettings({ autoSum: e.target.checked });
      const setAuto = document.getElementById("set-autosum");
      if (setAuto) setAuto.checked = e.target.checked;
      this.recalculateTotal();
      this.updateFormSummary();
    });

    document.getElementById("srv-price").addEventListener("input", () => this.updateFormSummary());

    document.getElementById("item-search").addEventListener("input", Utils.debounce(e => {
      this.itemQuery = e.target.value;
      this.renderAccordion();
    }, 180));

    document.getElementById("expand-all-btn").addEventListener("click", () => {
      const sections = Utils.$$("#accordion .acc-item");
      const anyClosed = sections.some(s => !s.classList.contains("open"));
      sections.forEach(s => {
        s.classList.toggle("open", anyClosed);
        s.querySelector(".acc-head").setAttribute("aria-expanded", String(anyClosed));
      });
      document.getElementById("expand-all-btn").textContent = anyClosed ? "Sbalit vše" : "Rozbalit vše";
    });

    document.getElementById("clear-items-btn").addEventListener("click", () => {
      this.selected = new Map();
      this.customItems = [];
      this.renderAccordion();
      this.renderCustomItems();
    });

    document.getElementById("history-search").addEventListener("input", Utils.debounce(() => this.renderTimeline(), 180));
    document.getElementById("history-filter").addEventListener("change", () => this.renderTimeline());
  }

  static addCustomItem() {
    const nameInput = document.getElementById("custom-name");
    const priceInput = document.getElementById("custom-price");
    const label = nameInput.value.trim();

    if (!label) {
      UI.toast("Zadejte popis vlastního úkonu.", "warn");
      nameInput.focus();
      return;
    }

    this.customItems.push({
      id: VehicleStorage.newId("custom"),
      label: label,
      price: Utils.money(priceInput.value)
    });

    nameInput.value = "";
    priceInput.value = "";
    nameInput.focus();
    this.renderCustomItems();
    this.afterSelectionChange();
  }

  /* --------------------------- Záloha --------------------------------- */

  static openBackupModal() {
    const vehicles = VehicleStorage.getVehicles().length;
    const services = VehicleStorage.getAllServices().length;
    const size = new Blob([VehicleStorage.exportBackupData()]).size;

    document.getElementById("backup-stats").innerHTML =
      '<div><strong>' + vehicles + "</strong><span>" + (vehicles === 1 ? "stroj" : (vehicles < 5 ? "stroje" : "strojů")) + "</span></div>" +
      '<div><strong>' + services + "</strong><span>" + (services === 1 ? "záznam" : (services < 5 ? "záznamy" : "záznamů")) + "</span></div>" +
      '<div><strong>' + (size / 1024).toFixed(1).replace(".", ",") + " kB</strong><span>velikost dat</span></div>";

    UI.openModal("backup-modal");
  }

  static bindBackup() {

    document.getElementById("export-btn").addEventListener("click", () => {
      const blob = new Blob([VehicleStorage.exportBackupData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "servisni-kniha-zaloha-" + Utils.today() + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      UI.toast("Záloha byla stažena.", "success");
    });

    const input = document.getElementById("import-input");

    document.getElementById("import-replace-btn").addEventListener("click", () => {
      this.pendingImportMode = "replace";
      input.click();
    });
    document.getElementById("import-merge-btn").addEventListener("click", () => {
      this.pendingImportMode = "merge";
      input.click();
    });

    input.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      const mode = this.pendingImportMode;

      if (mode === "replace") {
        const ok = await UI.confirm({
          title: "Nahradit všechna data",
          text: "Import nahradí všechny současné stroje i servisní záznamy obsahem souboru. Pokračovat?",
          confirmLabel: "Nahradit"
        });
        if (!ok) { input.value = ""; return; }
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const result = VehicleStorage.importBackupData(String(ev.target.result), mode);
        input.value = "";
        if (!result.ok) {
          UI.toast(result.message, "error");
          return;
        }
        UI.closeModal("backup-modal");
        UI.toast(result.message + " (" +
          Utils.plural(result.vehicles, "stroj", "stroje", "strojů") + ", " +
          Utils.plural(result.services, "záznam", "záznamy", "záznamů") + ")", "success");
        this.resetForm();
        this.render();
      };
      reader.onerror = () => UI.toast("Soubor se nepodařilo přečíst.", "error");
      reader.readAsText(file);
    });
  }

  /* -------------------------- Nastavení ------------------------------- */

  static openSettingsModal() {
    const settings = VehicleStorage.getSettings();
    document.getElementById("set-animations").checked = settings.animations;
    document.getElementById("set-autosum").checked = settings.autoSum;
    UI.openModal("settings-modal");
  }

  static bindSettings() {
    document.getElementById("set-animations").addEventListener("change", e => {
      VehicleStorage.saveSettings({ animations: e.target.checked });
      if (e.target.checked) Background.start();
      else Background.stop();
    });

    document.getElementById("set-autosum").addEventListener("change", e => {
      VehicleStorage.saveSettings({ autoSum: e.target.checked });
      document.getElementById("auto-sum").checked = e.target.checked;
      this.recalculateTotal();
      this.updateFormSummary();
    });

    document.getElementById("wipe-btn").addEventListener("click", async () => {
      const ok = await UI.confirm({
        title: "Smazat všechna data",
        text: "Smaže všechny stroje i servisní záznamy také ze společné databáze a ostatních zařízení. Máte staženou zálohu?",
        confirmLabel: "Ano, smazat vše"
      });
      if (!ok) return;
      VehicleStorage.clearAll();
      UI.closeModal("settings-modal");
      UI.toast("Všechna data byla smazána.", "success");
      this.vehicle = null;
      this.records = [];
      this.resetForm();
      this.render();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => CloudGarage.boot());

