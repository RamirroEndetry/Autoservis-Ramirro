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
    if (!el || !el.hidden) return;
    UI.openStack.push({ id: id, lastFocus: document.activeElement });
    el.hidden = false;
    document.body.classList.add("modal-open");
    const focusable = el.querySelector("input:not([type=hidden]):not([hidden]), select, textarea, button");
    if (focusable) setTimeout(() => focusable.focus(), 30);
  },

  closeModal(id) {
    if (id === 'clients-modal' && typeof CloudGarage !== 'undefined') CloudGarage.draft = !!ClientBook.previousDraft;
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
 * Vesmírné pozadí – pohled z nízké oběžné dráhy.
 *
 * Obloha se počítá procedurálně ze šumu: Mléčná dráha s temnými prachovými
 * pásy a slabými emisními mlhovinami, desetitisíce hvězd s reálným rozložením
 * jasu a barev (hustší v rovině galaxie) a okraj planety s atmosférou, nočními
 * světly měst a Sluncem vycházejícím za obzorem.
 *
 * Všechno náročné se spočítá jednou do pomocných pláten. Každý snímek pak
 * stojí jen několik drawImage a pár stovek jasných hvězd, takže animace
 * (pomalá rotace oblohy, paralaxa, meteory, družice) nezatěžuje procesor.
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

  seed: 0,
  perm: null,
  vals: null,

  sky: null,        // { size, fields…, nebula, stars }
  bright: [],       // jednotlivě kreslené jasné hvězdy (souřadnice oblohy)
  sprites: [],
  planet: null,     // { geometrie, texture, canvas }
  flare: null,
  accent: "",

  angle: 0,
  time: 0,
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  scroll: 0,
  scrollTarget: 0,
  meteor: null,
  nextMeteor: 0,
  satellite: null,
  nextSatellite: 0,
  lastTime: 0,
  sizeRetries: 0,
  sizeTimer: null,
  observer: null,

  /* Jedna otáčka oblohy za 50 minut – na okraji obrazovky asi 2 px/s. */
  SPIN: (Math.PI * 2) / 3000,
  BAND_ANGLE: -0.52,

  /* Barvy hvězd podle spektrální třídy (O/B až M) a jejich zastoupení. */
  STAR_TINTS: [
    { rgb: [160, 184, 255], share: 0.07 },
    { rgb: [196, 212, 255], share: 0.15 },
    { rgb: [238, 242, 255], share: 0.25 },
    { rgb: [255, 246, 232], share: 0.22 },
    { rgb: [255, 220, 178], share: 0.20 },
    { rgb: [255, 188, 132], share: 0.11 }
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
      this.initNoise();
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

        // Odlesk na skle přístrojového štítu sleduje kurzor.
        const hero = document.getElementById("vehicle-hero");
        if (hero && !hero.hidden && hero.offsetParent) {
          const box = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", (e.clientX - box.left).toFixed(0) + "px");
          hero.style.setProperty("--my", (e.clientY - box.top).toFixed(0) + "px");
        }
      }, { passive: true });

      // Při posouvání stránky se planeta zvedá rychleji než hvězdy.
      window.addEventListener("scroll", () => {
        this.scrollTarget = window.scrollY || 0;
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

  /** Mlhoviny a atmosféra přebírají odstín aktivní značky; volá se po přepnutí stroje. */
  refreshAccent() {
    if (!this.ready) return;
    if (this.readAccent()) {
      this.paintNebula();
      this.paintPlanet();
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

  /* ------------------------------- Šum -------------------------------- */

  /** Obloha je při každém otevření jiná, ale změna velikosti okna ji nezmění. */
  initNoise() {
    this.seed = (Math.random() * 4294967296) >>> 0;
    const rnd = this.rng(this.seed);
    const perm = new Uint8Array(512);
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = base[i]; base[i] = base[j]; base[j] = t;
    }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
    const vals = new Float32Array(256);
    for (let i = 0; i < 256; i++) vals[i] = rnd();
    this.perm = perm;
    this.vals = vals;
  },

  rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  smooth(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  },

  noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const p = this.perm, r = this.vals;
    const X = xi & 255, Y = yi & 255;
    const a = p[X] + Y, b = p[X + 1] + Y;
    const top = r[p[a]] + (r[p[b]] - r[p[a]]) * u;
    const bot = r[p[a + 1]] + (r[p[b + 1]] - r[p[a + 1]]) * u;
    return top + (bot - top) * v;
  },

  noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const p = this.perm, r = this.vals;
    const X = xi & 255, Y = yi & 255, Z = zi & 255;
    const A = p[X] + Y, B = p[X + 1] + Y;
    const AA = p[A] + Z, AB = p[A + 1] + Z, BA = p[B] + Z, BB = p[B + 1] + Z;
    const x00 = r[p[AA]] + (r[p[BA]] - r[p[AA]]) * u;
    const x10 = r[p[AB]] + (r[p[BB]] - r[p[AB]]) * u;
    const x01 = r[p[AA + 1]] + (r[p[BA + 1]] - r[p[AA + 1]]) * u;
    const x11 = r[p[AB + 1]] + (r[p[BB + 1]] - r[p[AB + 1]]) * u;
    const y0 = x00 + (x10 - x00) * v;
    const y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  },

  /** Součet oktáv šumu, výsledek 0–1. */
  fbm2(x, y, octaves) {
    let sum = 0, amp = 0.5, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise2(x, y);
      norm += amp;
      x = x * 2.03 + 17.1; y = y * 2.03 + 9.7;
      amp *= 0.5;
    }
    return sum / norm;
  },

  fbm3(x, y, z, octaves) {
    let sum = 0, amp = 0.5, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise3(x, y, z);
      norm += amp;
      x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; z = z * 2.03 + 4.3;
      amp *= 0.5;
    }
    return sum / norm;
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
    this.buildSky();
    this.buildPlanet();
    this.buildFlare();
    this.scrollTarget = window.scrollY || 0;
    this.scroll = this.scrollTarget;
    this.meteor = null;
    this.nextMeteor = 5 + Math.random() * 8;
    this.satellite = null;
    this.nextSatellite = 18 + Math.random() * 30;
  },

  /**
   * Předkreslí hvězdu: ostré jádro, slabé halo a u nejjasnějších difrakční
   * kříž, jaký dělá optika dalekohledu. Při běhu se pak kreslí jen drawImage.
   */
  buildSprites() {
    const make = (rgb, spikes) => {
      const size = spikes ? 192 : 64;
      const half = size / 2;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const core = spikes ? half * 0.34 : half;
      const col = rgb.join(",");
      const grad = g.createRadialGradient(half, half, 0, half, half, core);
      grad.addColorStop(0.00, "rgba(255,255,255,1)");
      grad.addColorStop(0.10, "rgba(" + col + ",0.95)");
      grad.addColorStop(0.24, "rgba(" + col + ",0.36)");
      grad.addColorStop(0.55, "rgba(" + col + ",0.07)");
      grad.addColorStop(1.00, "rgba(" + col + ",0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);

      if (spikes) {
        g.globalCompositeOperation = "lighter";
        for (let i = 0; i < 2; i++) {
          g.save();
          g.translate(half, half);
          g.rotate(i * Math.PI / 2);
          const ray = g.createLinearGradient(-half, 0, half, 0);
          ray.addColorStop(0.00, "rgba(" + col + ",0)");
          ray.addColorStop(0.42, "rgba(" + col + ",0.30)");
          ray.addColorStop(0.50, "rgba(255,255,255,0.75)");
          ray.addColorStop(0.58, "rgba(" + col + ",0.30)");
          ray.addColorStop(1.00, "rgba(" + col + ",0)");
          g.fillStyle = ray;
          g.fillRect(-half, -0.7, size, 1.4);
          g.restore();
        }
      }
      return c;
    };

    this.sprites = this.STAR_TINTS.map(t => ({ glow: make(t.rgb, false), spike: make(t.rgb, true) }));
  },

  pickTint(value) {
    let acc = 0;
    for (let i = 0; i < this.STAR_TINTS.length; i++) {
      acc += this.STAR_TINTS[i].share;
      if (value < acc) return i;
    }
    return 2;
  },

  /**
   * Obloha je čtverec větší než úhlopříčka okna, aby se mohla otáčet a posouvat
   * bez prázdných rohů. Pole hustoty se počítají v malém rozlišení (mlhoviny
   * jsou měkké), hvězdy se kreslí v plném.
   */
  buildSky() {
    const margin = 90;
    const size = Math.ceil(Math.hypot(this.w, this.h)) + margin * 2;
    const N = this.w * this.h < 600000 ? 260 : 340;

    const light = new Float32Array(N * N);   // svit Mléčné dráhy
    const warm = new Float32Array(N * N);    // blízkost galaktické výdutě
    const dust = new Float32Array(N * N);    // temné prachové pásy
    const emA = new Float32Array(N * N);     // emisní mlhoviny (odstín značky)
    const emB = new Float32Array(N * N);     // reflexní mlhoviny (modré)

    const ca = Math.cos(this.BAND_ANGLE), sa = Math.sin(this.BAND_ANGLE);

    for (let j = 0; j < N; j++) {
      const v = ((j + 0.5) / N) * 2 - 1;
      for (let i = 0; i < N; i++) {
        const u = ((i + 0.5) / N) * 2 - 1;
        const k = j * N + i;

        const along = u * ca + v * sa;
        let across = -u * sa + v * ca;
        across += (this.fbm2(along * 1.3 + 7.3, 3.1, 3) - 0.5) * 0.36;

        const bulge = Math.exp(-Math.pow((along - 0.16) / 0.52, 2));
        const width = 0.19 + 0.17 * bulge;
        const band = Math.exp(-(across * across) / (width * width));
        const clump = 0.5 + this.fbm2(u * 3.1 + 11, v * 3.1 + 5, 3);
        const density = band * (0.45 + 0.55 * bulge) * clump;

        // Prach: zvlněný šum soustředěný k ose galaxie.
        const wx = u * 4.4 + (this.fbm2(u * 2.1 + 40, v * 2.1 + 3, 2) - 0.5) * 2.4;
        const wy = v * 4.4 + (this.fbm2(u * 2.1 + 9, v * 2.1 + 70, 2) - 0.5) * 2.4;
        const lane = this.smooth(0.47, 0.64, this.fbm2(wx, wy, 5)) *
          Math.exp(-(across * across) / (width * width * 0.42));

        light[k] = density * (1 - 0.9 * lane);
        warm[k] = bulge * band;
        dust[k] = lane * density;

        const e1 = this.fbm2(u * 2.3 + 31, v * 2.3 + 17, 4);
        emA[k] = this.smooth(0.55, 0.80, e1) * (0.12 + 0.9 * band) * (1 - 0.75 * lane);
        const e2 = this.fbm2(u * 1.7 + 90, v * 1.7 + 55, 3);
        emB[k] = this.smooth(0.57, 0.84, e2) * (0.30 + 0.45 * (1 - band));
      }
    }

    const nebula = document.createElement("canvas");
    nebula.width = nebula.height = N;

    this.sky = { size: size, N: N, light: light, warm: warm, dust: dust, emA: emA, emB: emB, nebula: nebula, stars: null };
    this.paintNebula();
    this.buildStars();
  },

  /** Obarví pole do obrázku mlhovin; po změně značky stačí zopakovat jen tohle. */
  paintNebula() {
    const sky = this.sky;
    if (!sky) return;
    const N = sky.N;
    const g = sky.nebula.getContext("2d");
    const img = g.createImageData(N, N);
    const d = img.data;
    const rnd = this.rng(this.seed ^ 0x9E3779B9);

    const ac = this.rgb(this.accent);
    // Vodíková červeň (H-alfa) posunutá k barvě značky.
    const ha = [ac[0] * 0.5 + 105, ac[1] * 0.5 + 22, ac[2] * 0.5 + 40];

    for (let k = 0; k < N * N; k++) {
      const L = sky.light[k], wm = sky.warm[k], du = sky.dust[k], a = sky.emA[k], b = sky.emB[k];
      const gr = 122 + 133 * wm, gg = 140 + 72 * wm, gb = 190 - 30 * wm;
      const n = (rnd() - 0.5) * 1.6;   // jemný šum proti pruhování přechodů
      d[k * 4]     = 2 + L * gr * 0.20 + du * 16 + a * ha[0] * 0.36 + b * 16 + n;
      d[k * 4 + 1] = 3 + L * gg * 0.20 + du * 7  + a * ha[1] * 0.36 + b * 40 + n;
      d[k * 4 + 2] = 7 + L * gb * 0.20 + du * 3  + a * ha[2] * 0.36 + b * 78 + n;
      d[k * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  },

  /**
   * Slabé hvězdy se jednou vykreslí do plátna; jejich hustota sleduje svit
   * Mléčné dráhy, takže pás galaxie tvoří hlavně hvězdy samy. Jasné hvězdy
   * zůstávají jednotlivě, aby se mohly chvět a nést difrakční kříž.
   */
  buildStars() {
    const sky = this.sky;
    const size = sky.size, N = sky.N;
    const scale = Math.min(this.dpr, Math.sqrt(5.2e6) / size);
    const rnd = this.rng(this.seed ^ 0x51ED270B);

    const c = document.createElement("canvas");
    c.width = c.height = Math.round(size * scale);
    const g = c.getContext("2d");
    g.scale(scale, scale);

    const colors = this.STAR_TINTS.map(t => "rgb(" + t.rgb.join(",") + ")");
    const target = Math.round(Math.min(30000, (size * size) / 230));
    let placed = 0, guard = target * 12;

    while (placed < target && guard-- > 0) {
      const x = rnd() * size, y = rnd() * size;
      const k = Math.min(N - 1, Math.floor(y / size * N)) * N + Math.min(N - 1, Math.floor(x / size * N));
      if (rnd() > 0.085 + Math.min(1, sky.light[k]) * 0.9) continue;

      // Mocninné rozdělení jasu: slabých hvězd je řádově víc než jasných.
      const b = Math.pow(rnd(), 3.4);
      // Za prachem hvězdy červenají.
      const tint = sky.dust[k] > 0.12 && rnd() < 0.6 ? 4 + (rnd() < 0.4 ? 1 : 0) : this.pickTint(rnd());
      const r = 0.45 + b * 0.75;

      g.globalAlpha = 0.14 + b * 0.8;
      g.fillStyle = colors[tint];
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      if (b > 0.55) {
        g.globalAlpha = 0.10 + (b - 0.55) * 0.3;
        g.drawImage(this.sprites[tint].glow, x - r * 5, y - r * 5, r * 10, r * 10);
      }
      placed++;
    }
    sky.stars = c;

    const count = Math.round(Math.max(36, Math.min(230, (size * size) / 26000)));
    const half = size / 2;
    this.bright = [];
    for (let i = 0; i < count; i++) {
      const b = Math.pow(rnd(), 2.4);
      this.bright.push({
        x: rnd() * size - half,
        y: rnd() * size - half,
        size: 7 + b * 15,
        a: 0.5 + b * 0.5,
        tint: this.pickTint(rnd()),
        phase: rnd() * Math.PI * 2,
        speed: 0.5 + rnd() * 1.6,
        flicker: 0.10 + rnd() * 0.16,
        spike: b > 0.62
      });
    }
  },

  /* ------------------------------ Planeta ----------------------------- */

  /**
   * Okraj planety při pohledu z oběžné dráhy. Slunce stojí těsně za obzorem,
   * takže je vidět jen úzký osvětlený srpek, soumrak a noční strana se světly
   * měst. Povrch se počítá bod po bodu v polovičním rozlišení; ostrý obrys
   * a atmosféru dodá až vektorové dokreslení.
   */
  buildPlanet() {
    if (!this.w || !this.h) return;

    const R = Math.max(this.w, this.h) * 0.78;
    const cx = this.w * 0.78;
    const cy = this.h + R * 0.80;
    const pad = 110;
    const x0 = Math.max(-pad, cx - R * 1.08);
    const x1 = Math.min(this.w + pad, cx + R * 1.08);
    const y0 = cy - R * 1.08;
    const y1 = this.h + pad;
    const bw = x1 - x0, bh = y1 - y0;

    // Směr ke Slunci: v rovině obrazu vlevo nahoru, převážně za planetou.
    const sdx = -0.30, sdy = -0.954, K = 0.40, LZ = -0.917;

    const t = Math.min(1, Math.sqrt(170000 / (bw * bh)));
    const tw = Math.max(2, Math.ceil(bw * t)), th = Math.max(2, Math.ceil(bh * t));
    const tex = document.createElement("canvas");
    tex.width = tw;
    tex.height = th;
    const tg = tex.getContext("2d");
    const img = tg.createImageData(tw, th);
    const d = img.data;

    for (let j = 0; j < th; j++) {
      const dy = (y0 + (j + 0.5) / t - cy) / R;
      for (let i = 0; i < tw; i++) {
        const dx = (x0 + (i + 0.5) / t - cx) / R;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1.06) continue;

        let nx = dx, ny = dy, nz = 0;
        if (d2 >= 1) { const inv = 1 / Math.sqrt(d2); nx *= inv; ny *= inv; }
        else nz = Math.sqrt(1 - d2);

        const ndl = (nx * sdx + ny * sdy) * K + nz * LZ;
        const day = this.smooth(-0.05, 0.22, ndl);
        const lit = Math.max(0, Math.min(1, ndl / 0.36));

        // Souřadnice na kouli, pootočené kolem svislé osy.
        const ax = nx * 0.82 + nz * 0.57, ay = ny, az = -nx * 0.57 + nz * 0.82;

        const cont = this.fbm3(ax * 2.6 + 3.7, ay * 2.6 + 1.3, az * 2.6 + 8.1, 5);
        const land = this.smooth(0.50, 0.55, cont);
        const warp = this.fbm3(ax * 3 + 20, ay * 3 + 20, az * 3 + 20, 2) - 0.5;
        const cloud = this.smooth(0.47, 0.68,
          this.fbm3(ax * 4.4 + warp * 1.8, ay * 10 + warp, az * 4.4 + warp * 1.8, 4));

        let r, g, b;
        if (day > 0.002) {
          const shallow = this.smooth(0.40, 0.50, cont);
          const high = this.smooth(0.56, 0.70, cont);
          const sr = (6 + 12 * shallow) * (1 - land) + (52 + 84 * high) * land;
          const sg = (28 + 44 * shallow) * (1 - land) + (82 + 30 * high) * land;
          const sb = (68 + 54 * shallow) * (1 - land) + (46 + 30 * high) * land;
          const sun = 0.22 + 1.15 * lit;
          const cw = cloud * 0.93, cs = 242 * (0.30 + 0.9 * lit);
          r = (sr * sun * (1 - cw) + cs * cw) * day;
          g = (sg * sun * (1 - cw) + cs * cw) * day;
          b = (sb * sun * (1 - cw) + (cs + 8) * cw) * day;
          // Soumrak barví mraky a okraj dne do oranžova.
          const dusk = day * (1 - day) * 4;
          r += 235 * dusk * 0.16 * (0.45 + cloud);
          g += 108 * dusk * 0.16 * (0.45 + cloud);
          b += 44 * dusk * 0.16 * (0.45 + cloud);
        } else {
          r = 0; g = 0; b = 0;
        }

        const night = 1 - day;
        if (night > 0.02) {
          r += (2 + 8 * cloud) * night;
          g += (3 + 9 * cloud) * night;
          b += (7 + 13 * cloud) * night;
          if (land > 0.5) {
            const region = this.smooth(0.50, 0.64, this.fbm3(ax * 13 + 60, ay * 13 + 60, az * 13 + 60, 3));
            if (region > 0.01) {
              const dots = this.smooth(0.60, 0.88, this.noise3(ax * 250, ay * 250, az * 250)) +
                0.7 * this.smooth(0.70, 0.92, this.noise3(ax * 85 + 9, ay * 85 + 9, az * 85 + 9));
              const city = region * dots * (1 - cloud * 0.85) * night;
              r += 255 * city * 0.95;
              g += 184 * city * 0.95;
              b += 104 * city * 0.95;
            }
          }
        }

        // Opar atmosféry houstne směrem k okraji kotouče.
        const haze = Math.pow(1 - nz, 4) * (0.08 + 0.92 * day);
        r += 66 * haze; g += 138 * haze; b += 255 * haze;

        const k = (j * tw + i) * 4;
        d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
      }
    }
    tg.putImageData(img, 0, 0);

    this.planet = {
      R: R, cx: cx, cy: cy, x: x0, y: y0, w: bw, h: bh,
      sunX: cx + sdx * R, sunY: cy + sdy * R,
      texture: tex, canvas: null
    };
    this.paintPlanet();
  },

  /** Složí povrch, ostrý obrys a vrstvy atmosféry do výsledného obrázku. */
  paintPlanet() {
    const p = this.planet;
    if (!p) return;

    const scale = Math.min(this.dpr, 1.5);
    const make = () => {
      const c = document.createElement("canvas");
      c.width = Math.max(2, Math.round(p.w * scale));
      c.height = Math.max(2, Math.round(p.h * scale));
      const g = c.getContext("2d");
      g.setTransform(scale, 0, 0, scale, -p.x * scale, -p.y * scale);
      return { c: c, g: g };
    };

    const body = make();
    const g = body.g;
    g.save();
    g.beginPath();
    g.arc(p.cx, p.cy, p.R, 0, Math.PI * 2);
    g.clip();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(p.texture, p.x, p.y, p.w, p.h);
    g.restore();

    // Atmosféra: teplá linka u povrchu, jasný modrobílý okraj a modré halo
    // slábnoucí do vesmíru. Odstín se lehce řídí barvou značky.
    const ac = this.rgb(this.accent);
    const rim = [
      Math.round(ac[0] * 0.22 + 72 * 0.78),
      Math.round(ac[1] * 0.22 + 142 * 0.78),
      Math.round(ac[2] * 0.22 + 255 * 0.78)
    ].join(",");

    const air = make();
    const a = air.g;
    const inner = p.R * 0.984, outer = p.R * 1.075;
    const at = r => (r * p.R - inner) / (outer - inner);
    const halo = a.createRadialGradient(p.cx, p.cy, inner, p.cx, p.cy, outer);
    halo.addColorStop(0, "rgba(255,170,96,0)");
    halo.addColorStop(at(0.9965), "rgba(255,190,130,0.34)");
    halo.addColorStop(at(1.0000), "rgba(214,232,255,0.92)");
    halo.addColorStop(at(1.0040), "rgba(" + rim + ",0.62)");
    halo.addColorStop(at(1.0200), "rgba(" + rim + ",0.20)");
    halo.addColorStop(1, "rgba(" + rim + ",0)");
    a.fillStyle = halo;
    a.fillRect(p.x, p.y, p.w, p.h);

    // Záře je nejsilnější u Slunce a směrem k noční straně slábne.
    a.globalCompositeOperation = "destination-in";
    const mask = a.createRadialGradient(p.sunX, p.sunY, 0, p.sunX, p.sunY, p.R * 1.25);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.22, "rgba(0,0,0,0.78)");
    mask.addColorStop(0.55, "rgba(0,0,0,0.30)");
    mask.addColorStop(1, "rgba(0,0,0,0.09)");
    a.fillStyle = mask;
    a.fillRect(p.x, p.y, p.w, p.h);

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "lighter";
    g.drawImage(air.c, 0, 0);

    p.canvas = body.c;
  },

  /** Záře Slunce vykukujícího zpoza obzoru. */
  buildFlare() {
    const size = 512, half = size / 2;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const glow = g.createRadialGradient(half, half, 0, half, half, half);
    glow.addColorStop(0.00, "rgba(255,255,255,1)");
    glow.addColorStop(0.035, "rgba(255,252,240,0.96)");
    glow.addColorStop(0.09, "rgba(255,232,186,0.46)");
    glow.addColorStop(0.24, "rgba(255,190,120,0.13)");
    glow.addColorStop(0.55, "rgba(140,170,255,0.04)");
    glow.addColorStop(1.00, "rgba(120,150,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, size, size);

    // Jemný vodorovný odlesk objektivu.
    g.globalCompositeOperation = "lighter";
    g.translate(half, half);
    g.scale(1, 0.028);
    const streak = g.createRadialGradient(0, 0, 0, 0, 0, half);
    streak.addColorStop(0, "rgba(255,246,228,0.55)");
    streak.addColorStop(0.5, "rgba(200,215,255,0.14)");
    streak.addColorStop(1, "rgba(200,215,255,0)");
    g.fillStyle = streak;
    g.beginPath();
    g.arc(0, 0, half, 0, Math.PI * 2);
    g.fill();

    this.flare = c;
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
    const sky = this.sky;
    if (!ctx || !sky || !this.w || !this.h) return;

    this.time += dt;
    this.angle += dt * this.SPIN;

    // Kurzor a posun stránky hýbou vrstvami s mírným doběhem – naznačená hloubka.
    this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 2.5);
    this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 2.5);
    this.scroll += (this.scrollTarget - this.scroll) * Math.min(1, dt * 7);
    const scroll = Math.min(this.scroll, 2200);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, this.w, this.h);

    const tx = this.w / 2 - this.pointer.x * 9;
    const ty = this.h / 2 - this.pointer.y * 7 - scroll * 0.02;
    const half = sky.size / 2;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(this.angle);
    ctx.drawImage(sky.nebula, -half, -half, sky.size, sky.size);
    ctx.drawImage(sky.stars, -half, -half, sky.size, sky.size);
    ctx.restore();

    this.drawBright(dt, tx, ty);
    this.updateSatellite(dt);
    this.updateMeteor(dt);

    const p = this.planet;
    if (p && p.canvas) {
      const ox = -this.pointer.x * 16;
      const oy = -this.pointer.y * 10 - Math.min(scroll * 0.045, 95);
      const sx = p.sunX + ox, sy = p.sunY + oy;
      const breath = 1 + 0.035 * Math.sin(this.time * 0.6);
      const span = (this.w + this.h) * 0.31 * breath;

      // Slunce je za planetou: kotouč ho zčásti zakryje, přes obzor přesáhne jen záře.
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.95;
      ctx.drawImage(this.flare, sx - span / 2, sy - span / 2, span, span);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(p.canvas, p.x + ox, p.y + oy, p.w, p.h);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.36;
      const bloom = span * 0.42;
      ctx.drawImage(this.flare, sx - bloom / 2, sy - bloom / 2, bloom, bloom);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.globalAlpha = 1;
  },

  drawBright(dt, tx, ty) {
    const ctx = this.ctx;
    const cos = Math.cos(this.angle), sin = Math.sin(this.angle);
    // Jasné hvězdy jsou „blíž": na kurzor reagují o něco víc než pozadí.
    const px = tx - this.pointer.x * 5, py = ty - this.pointer.y * 4;

    for (let i = 0; i < this.bright.length; i++) {
      const s = this.bright[i];
      const x = px + s.x * cos - s.y * sin;
      const y = py + s.x * sin + s.y * cos;
      if (x < -40 || y < -40 || x > this.w + 40 || y > this.h + 40) continue;

      s.phase += s.speed * dt;
      ctx.globalAlpha = s.a * (1 - s.flicker * (0.5 + 0.5 * Math.sin(s.phase)));
      if (s.spike) {
        const size = s.size * 4.2;
        ctx.drawImage(this.sprites[s.tint].spike, x - size / 2, y - size / 2, size, size);
      } else {
        ctx.drawImage(this.sprites[s.tint].glow, x - s.size / 2, y - s.size / 2, s.size, s.size);
      }
    }
    ctx.globalAlpha = 1;
  },

  /* ------------------------------ Meteor ------------------------------ */

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
      this.nextMeteor = 9 + Math.random() * 16;
      return;
    }

    // Náběh a doznění, aby se stopa neobjevila a nezmizela skokem.
    const t = m.life / m.maxLife;
    const fade = Math.min(1, t / 0.15) * Math.min(1, (1 - t) / 0.45);

    const len = Math.hypot(m.vx, m.vy);
    const tailX = m.x - (m.vx / len) * m.len;
    const tailY = m.y - (m.vy / len) * m.len;

    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
    grad.addColorStop(0, "rgba(160, 200, 255, 0)");
    grad.addColorStop(0.7, "rgba(190, 220, 255, " + (0.28 * fade).toFixed(3) + ")");
    grad.addColorStop(1, "rgba(245, 250, 255, " + (0.9 * fade).toFixed(3) + ")");

    ctx.globalAlpha = 1;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    ctx.globalAlpha = fade;
    const head = 11;
    ctx.drawImage(this.sprites[2].glow, m.x - head / 2, m.y - head / 2, head, head);
    ctx.globalAlpha = 1;
  },

  spawnMeteor() {
    const toLeft = Math.random() < 0.4;
    const speed = 620 + Math.random() * 420;
    const angle = (toLeft ? Math.PI - 0.5 : 0.5) + (Math.random() - 0.5) * 0.3;

    this.meteor = {
      x: toLeft ? this.w * (0.5 + Math.random() * 0.5) : this.w * Math.random() * 0.5,
      y: -20 + Math.random() * this.h * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 110 + Math.random() * 120,
      life: 0,
      maxLife: 0.55 + Math.random() * 0.45
    };
  },

  /* ------------------------------ Družice ----------------------------- */

  /** Občas přeletí družice: klidný bod, který se na chvíli zableskne. */
  updateSatellite(dt) {
    if (!this.enabled) return;

    if (!this.satellite) {
      this.nextSatellite -= dt;
      if (this.nextSatellite <= 0) {
        const fromLeft = Math.random() < 0.5;
        const speed = 46 + Math.random() * 30;
        const slope = (Math.random() - 0.5) * 0.5;
        this.satellite = {
          x: fromLeft ? -10 : this.w + 10,
          y: this.h * (0.08 + Math.random() * 0.45),
          vx: (fromLeft ? 1 : -1) * speed,
          vy: slope * speed,
          flareAt: 0.25 + Math.random() * 0.5
        };
      }
      return;
    }

    const s = this.satellite;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x < -20 || s.x > this.w + 20 || s.y < -20 || s.y > this.h + 20) {
      this.satellite = null;
      this.nextSatellite = 50 + Math.random() * 70;
      return;
    }

    const progress = s.vx > 0 ? s.x / this.w : 1 - s.x / this.w;
    const glint = Math.exp(-Math.pow((progress - s.flareAt) / 0.05, 2));
    const size = 5 + glint * 9;
    this.ctx.globalAlpha = 0.42 + glint * 0.58;
    this.ctx.drawImage(this.sprites[3].glow, s.x - size / 2, s.y - size / 2, size, size);
    this.ctx.globalAlpha = 1;
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
    ClientBook.init();
    LoanBook.init();
    Background.start();
    this.render();
    this.reminderDay = Utils.today();
    if (!this.reminderTimer) {
      this.reminderTimer = setInterval(() => this.refreshReminderDay(), 60000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.refreshReminderDay();
      });
    }

  }

  static render() {
    const vehicles = VehicleStorage.getVehicles();
    this.vehicle = VehicleStorage.getActiveVehicle();

    if (!this.vehicle && vehicles.length) {
      this.vehicle = vehicles[0];
      VehicleStorage.setActiveVehicleId(this.vehicle.id);
    }

    document.getElementById("garage-btn-label").textContent = "Garáž (" + vehicles.length + ")";
    ClientBook.render();
    LoanBook.render();

    const hasVehicle = !!this.vehicle;
    document.getElementById("no-vehicle-state").hidden = hasVehicle;
    document.getElementById("vehicle-hero").hidden = !hasVehicle;
    document.getElementById("workspace").hidden = !hasVehicle;
    document.getElementById("alert-strip").hidden = !hasVehicle;
    document.getElementById("due-panel").hidden = !hasVehicle;
    this.renderSwitcher(vehicles);

    if (!hasVehicle) {
      document.body.setAttribute("data-brand", "audi");
      Background.refreshAccent();
      return;
    }

    this.records = VehicleStorage.getServicesForVehicle(this.vehicle.id);
    document.body.setAttribute("data-brand", this.vehicle.brand || "audi");
    Background.refreshAccent();

    this.markVehicleChange();
    this.renderHero();
    this.renderAccordion();
    this.renderTimeline();
    this.renderCosts();
    this.renderPlan();
    this.renderAlerts();
    this.renderWorkshopSuggestions();
    this.updateFormHints();
  }

  /**
   * Po přepnutí stroje (a při prvním zobrazení) přístroje „ožijí": ručičky
   * projedou celou stupnici a obsah štítu se prolne. Běžné překreslení po
   * uložení záznamu tuhle animaci nespouští.
   */
  static markVehicleChange() {
    const hero = document.getElementById("vehicle-hero");
    if (this.shownVehicleId === this.vehicle.id) {
      hero.classList.remove("sweep");
      return;
    }
    this.shownVehicleId = this.vehicle.id;
    hero.classList.remove("sweep");
    void hero.offsetWidth;
    hero.classList.add("sweep");
    // Třída po doběhnutí zmizí, aby hledání v historii záznamy znovu neanimovalo.
    clearTimeout(this.sweepTimer);
    this.sweepTimer = setTimeout(() => hero.classList.remove("sweep"), 2600);
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
    this.renderStkStatus();

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
    document.getElementById("stat-spend").textContent = Utils.kc(totalSpend);
    document.getElementById("stat-count").textContent = String(this.records.length);
    document.getElementById("stat-last").textContent = this.records.length
      ? Utils.fmtDate(this.records[0].date)
      : "—";

    document.getElementById("tab-history-count").textContent = String(this.records.length);

    this.renderOdometer(v.mileage);
    this.renderGauges();
  }

  /* ------------------------- Přístrojový štít ------------------------- */

  /** Válečkový tachometr – každá číslice ve vlastním okénku. */
  static renderOdometer(mileage) {
    const km = Math.max(0, Math.round(Utils.num(mileage)));
    const digits = String(km).padStart(6, "0").split("");
    const el = document.getElementById("odometer");
    el.setAttribute("aria-label", "Tachometr " + Utils.km(km));
    el.innerHTML = digits.map((d, i) =>
      '<span class="odo-digit' + (i < digits.length - String(km).length ? " odo-lead" : "") + '"><span class="odo-num" style="--i:' + i + '">' + d + "</span></span>"
    ).join("") + '<span class="odo-unit">km</span>';
  }

  /**
   * Budík jako půlkruh: fraction 1 = plná rezerva, 0 = termín je tady.
   * Ručička ukazuje stejně jako palivoměr – vpravo plno, vlevo prázdno.
   */
  static gaugeMarkup(opts) {
    const frac = Math.max(0, Math.min(1, opts.fraction));
    const arc = 251.33;
    const angle = -90 + 180 * frac;
    const ticks = Array.from({ length: 21 }, (_, n) => n / 20).map(t => {
      const a = Math.PI * (1 - t);
      const major = Math.round(t * 20) % 5 === 0;
      const x1 = 100 + Math.cos(a) * 96, y1 = 110 - Math.sin(a) * 96;
      const x2 = 100 + Math.cos(a) * (major ? 87 : 92), y2 = 110 - Math.sin(a) * (major ? 87 : 92);
      return '<line' + (major ? "" : ' class="tick-minor"') + ' x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }).join("");
    return '<svg class="gauge-dial gauge-' + opts.status + '" viewBox="0 0 200 122" aria-hidden="true">' +
        '<g class="gauge-ticks">' + ticks + "</g>" +
        '<path class="gauge-track" d="M20 110 A80 80 0 0 1 180 110"/>' +
        '<path class="gauge-fill" d="M20 110 A80 80 0 0 1 180 110" stroke-dasharray="' + arc + '" stroke-dashoffset="' + (arc * (1 - frac)).toFixed(1) + '"/>' +
        '<g class="gauge-needle" style="transform:rotate(' + angle.toFixed(1) + 'deg)"><line x1="100" y1="110" x2="100" y2="38"/></g>' +
        '<circle class="gauge-hub" cx="100" cy="110" r="7"/>' +
      "</svg>" +
      '<strong class="gauge-value">' + Utils.esc(opts.value) + "</strong>" +
      '<span class="gauge-label">' + Utils.esc(opts.label) + "</span>";
  }

  static renderGauges() {
    const reminders = this.buildReminders();

    // Levý budík: nejbližší servis podle kilometrů
    const byKm = reminders.filter(r => r.kmInterval).sort((a, b) => (a.kmLeft / a.kmInterval) - (b.kmLeft / b.kmInterval))[0];
    const kmEl = document.getElementById("gauge-km");
    kmEl.innerHTML = byKm
      ? this.gaugeMarkup({
          fraction: byKm.kmLeft / byKm.kmInterval,
          status: byKm.kmLeft < 0 ? "overdue" : (byKm.kmLeft < byKm.kmInterval * 0.15 ? "soon" : "ok"),
          value: byKm.kmLeft >= 0 ? Utils.km(byKm.kmLeft) : "−" + Utils.km(-byKm.kmLeft),
          label: (byKm.kmLeft >= 0 ? "do: " : "překročeno: ") + byKm.label.toLowerCase()
        })
      : this.gaugeMarkup({ fraction: 0, status: "empty", value: "—", label: "zapište první servis" });

    // Pravý budík: nejbližší termín podle data (servis nebo doklad)
    const byDate = reminders.filter(r => r.daysInterval && r !== byKm).sort((a, b) => (a.daysLeft / a.daysInterval) - (b.daysLeft / b.daysInterval))[0];
    const timeEl = document.getElementById("gauge-time");
    timeEl.innerHTML = byDate
      ? this.gaugeMarkup({
          fraction: byDate.daysLeft / byDate.daysInterval,
          status: byDate.status === "unknown" ? "ok" : byDate.status,
          value: this.shortDuration(byDate.daysLeft),
          label: (byDate.daysLeft >= 0 ? "do: " : "po termínu: ") + (/^[A-ZÁ-Ž]{2,}$/.test(byDate.label) ? byDate.label : byDate.label.toLowerCase())
        })
      : this.gaugeMarkup({ fraction: 0, status: "empty", value: "—", label: "doplňte datum STK" });
  }

  /** 400 -> "13 měsíců", 20 -> "20 dní", -12 -> "12 dní" */
  static shortDuration(days) {
    const d = Math.abs(days);
    if (d < 60) return Utils.plural(d, "den", "dny", "dní");
    const months = Math.round(d / 30.44);
    if (months < 24) return Utils.plural(months, "měsíc", "měsíce", "měsíců");
    return Utils.plural(Math.round(d / 365.25), "rok", "roky", "let");
  }

  /** Stav stroje pro přepínač, bez přepnutí aktivního stroje. */
  static statusOf(vehicle) {
    const keepVehicle = this.vehicle;
    const keepRecords = this.records;
    this.vehicle = vehicle;
    this.records = VehicleStorage.getServicesForVehicle(vehicle.id);
    const list = this.buildReminders();
    this.vehicle = keepVehicle;
    this.records = keepRecords;
    if (list.some(r => r.status === "overdue")) return "overdue";
    if (list.some(r => r.status === "soon")) return "soon";
    return "ok";
  }

  static renderSwitcher(vehicles) {
    const nav = document.getElementById("vehicle-switcher");
    const activeVehicleId = this.vehicle ? this.vehicle.id : null;
    vehicles = vehicles.filter(v => v.id === activeVehicleId ||
      typeof VehicleOwnership === "undefined" || VehicleOwnership.get(v) !== "client");
    nav.hidden = vehicles.length < 2;
    if (vehicles.length < 2) { nav.innerHTML = ""; return; }

    const activeId = this.vehicle ? this.vehicle.id : null;
    const statusText = { overdue: "něco je po termínu", soon: "blíží se termín", ok: "v pořádku" };
    nav.innerHTML = vehicles.map(v => {
      const brand = VehicleCatalog.brand(v.brand);
      const kind = VehicleCatalog.kindOf(v);
      const status = this.statusOf(v);
      const active = v.id === activeId;
      return '<button type="button" class="switch-item' + (active ? " active" : "") + '" data-switch="' + Utils.esc(v.id) + '"' +
          ' aria-pressed="' + active + '" data-brand="' + Utils.esc(v.brand || "") + '">' +
          '<span class="switch-logo">' +
            (brand && brand.logo ? '<img src="' + brand.logo + '" alt="" width="22" height="22">' : '<i class="fa-solid ' + (kind === "car" ? "fa-car" : "fa-motorcycle") + '" aria-hidden="true"></i>') +
          "</span>" +
          '<span class="switch-text"><strong>' + Utils.esc(this.vehicleName(v)) + "</strong>" +
            "<small>" + Utils.km(v.mileage) + "</small></span>" +
          '<span class="switch-dot dot-' + status + '" title="' + statusText[status] + '"><span class="sr-only">' + statusText[status] + "</span></span>" +
        "</button>";
    }).join("");

    nav.querySelectorAll("[data-switch]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.switch === activeId) return;
        if (typeof CloudGarage !== "undefined" && CloudGarage.draft && !confirm("Opustit rozpracovaný formulář a přepnout vozidlo?")) return;
        VehicleStorage.setActiveVehicleId(btn.dataset.switch);
        this.resetForm();
        this.render();
      });
    });
  }

  /* --------------------------- Upozornění ----------------------------- */

  static stkStatus(vehicle) {
    const days = Utils.daysUntil(vehicle?.stkUntil);
    if (days === null) return {state:'unknown', title:'STK · Datum není vyplněné', detail:'Doplňte platnost STK'};
    const state = days < 0 ? 'overdue' : days <= 30 ? 'soon' : 'ok';
    const detail = days < 0 ? 'PROPADLÁ · ' + Utils.relative(days)
      : days === 0 ? 'KONČÍ DNES'
      : days <= 30 ? 'BRZY KONČÍ · ' + Utils.relative(days)
      : 'Platná · ' + Utils.relative(days);
    return {state, title:'STK do ' + Utils.fmtDate(vehicle.stkUntil), detail};
  }

  static refreshReminderDay() {
    const today = Utils.today();
    if (today === this.reminderDay || document.hidden || document.getElementById('private-app').hidden) return;
    this.reminderDay = today;
    if (!this.vehicle) return;
    this.renderStkStatus();
    this.renderAlerts();
    this.renderPlan();
    if (!document.getElementById('garage-modal').hidden) this.openGarageModal();
  }

  static stkMarkup(vehicle) {
    const status = this.stkStatus(vehicle);
    return '<i class="fa-solid fa-clipboard-check" aria-hidden="true"></i><span><strong>' +
      Utils.esc(status.title) + '</strong><small>' + Utils.esc(status.detail) + '</small></span>';
  }

  static stkCountdown(vehicle) {
    const days = Utils.daysUntil(vehicle?.stkUntil);
    if (days === null) return 'STK · datum není vyplněné';
    if (days < 0) return 'STK · propadlá ' + Utils.relative(days);
    if (days === 0) return 'STK · končí dnes';
    return 'STK · ' + Utils.relative(days);
  }

  static renderStkStatus() {
    const badge = document.getElementById('hero-stk');
    badge.className = 'stk-status stk-' + this.stkStatus(this.vehicle).state;
    badge.innerHTML = this.stkMarkup(this.vehicle);
  }

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
        sort: days,
        daysLeft: days,
        daysInterval: Math.round(((doc.months && doc.months[kind]) || 12) * 30.44)
      });
    });

    // 2) Servisní intervaly podle posledního provedení
    VehicleCatalog.planFor(kind, v).forEach(plan => {
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
          entry.kmLeft = remaining;
          entry.kmInterval = plan.km;
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
            entry.daysLeft = days;
            entry.daysInterval = Math.round(plan.months * 30.44);
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

  static buildFleetDocumentReminders() {
    return VehicleStorage.getVehicles().flatMap(vehicle =>
      VehicleCatalog.documentsFor(VehicleCatalog.kindOf(vehicle)).flatMap(doc => {
        const value = vehicle[doc.key];
        if (!value) return [];
        const days = Utils.daysUntil(value);
        if (days === null || days > 30) return [];
        return [{
          type: "document",
          vehicleId: vehicle.id,
          icon: doc.icon,
          label: this.vehicleName(vehicle) + " · " + doc.label.replace(" platná do", "").replace(" platné do", "").replace(" do", ""),
          detail: Utils.fmtDate(value) + " (" + Utils.relative(days) + ")",
          status: days < 0 ? "overdue" : "soon",
          sort: days
        }];
      })
    );
  }

  /** Kontrolky ve štítu a panel "Na řadě" vedle záložek. */
  static renderDue() {
    const reminders = this.buildReminders();
    const urgent = reminders.filter(r => r.status === "overdue" || r.status === "soon");
    const kind = VehicleCatalog.kindOf(this.vehicle);
    const missingDocs = VehicleCatalog.documentsFor(kind).filter(d => !this.vehicle[d.key]);

    // Kontrolky
    const lamps = urgent.slice(0, 3).map(r =>
      '<button type="button" class="lamp lamp-' + r.status + '" data-goto-plan>' +
        '<i class="lamp-light" aria-hidden="true"></i>' + Utils.esc(r.label) + "</button>");
    if (urgent.length > 3) {
      lamps.push('<button type="button" class="lamp lamp-soon" data-goto-plan><i class="lamp-light" aria-hidden="true"></i>+' + (urgent.length - 3) + " další</button>");
    }
    if (missingDocs.length) {
      lamps.push('<button type="button" class="lamp lamp-info" data-action="edit-vehicle">' +
        '<i class="lamp-light" aria-hidden="true"></i>Doplnit ' +
        Utils.esc(missingDocs.map(d => ({ stkUntil: "STK", emissionUntil: "emise", insuranceUntil: "pojištění", vignetteUntil: "dálniční známku" }[d.key] || d.label)).join(", ")) + "</button>");
    }
    if (!lamps.length) {
      lamps.push('<span class="lamp lamp-ok"><i class="lamp-light" aria-hidden="true"></i>Vše v pořádku</span>');
    }
    document.getElementById("cluster-lamps").innerHTML = lamps.join("");

    // Na řadě: nejdřív to, co má termín, pak souhrn toho, co v knížce chybí
    const known = reminders.filter(r => r.status !== "unknown").slice(0, 5);
    const unknown = reminders.filter(r => r.status === "unknown");
    const valueOf = r => {
      if (r.kmLeft !== undefined && (r.daysLeft === undefined || r.kmLeft / r.kmInterval <= r.daysLeft / r.daysInterval)) {
        return r.kmLeft >= 0 ? "za " + Utils.km(r.kmLeft) : "o " + Utils.km(-r.kmLeft) + " později";
      }
      return r.daysLeft >= 0 ? "za " + this.shortDuration(r.daysLeft) : "před " + this.shortDuration(r.daysLeft);
    };

    let html = known.map(r => {
      const frac = r.kmInterval !== undefined && (r.daysInterval === undefined || r.kmLeft / r.kmInterval <= r.daysLeft / r.daysInterval)
        ? r.kmLeft / r.kmInterval
        : (r.daysInterval ? r.daysLeft / r.daysInterval : 1);
      return '<div class="due-row due-' + r.status + '">' +
        '<span class="due-icon"><i class="fa-solid ' + r.icon + '" aria-hidden="true"></i></span>' +
        '<span class="due-name">' + Utils.esc(r.label) + "</span>" +
        '<span class="due-value">' + Utils.esc(valueOf(r)) + "</span>" +
        '<span class="due-bar" aria-hidden="true"><i style="width:' + (Math.max(0, Math.min(1, frac)) * 100).toFixed(0) + '%"></i></span>' +
      "</div>";
    }).join("");

    if (unknown.length) {
      html += '<p class="due-unknown"><strong>Bez záznamu (' + unknown.length + "):</strong> " +
        Utils.esc(unknown.map(r => r.label).join(", ")) + "</p>";
    }
    if (!html) html = '<p class="muted-note">Pro tento stroj zatím nejsou žádné termíny.</p>';
    document.getElementById("due-list").innerHTML = html;

    Utils.$$("#cluster-lamps [data-goto-plan], #due-panel [data-goto-plan]").forEach(btn => {
      btn.onclick = () => {
        this.switchTab("plan");
        document.getElementById("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    Utils.$$('#cluster-lamps [data-action="edit-vehicle"]').forEach(btn => {
      btn.onclick = () => this.openVehicleModal(this.vehicle);
    });
  }

  static renderAlerts() {
    this.renderDue();
    const strip = document.getElementById("alert-strip");
    const urgent = [
      ...this.buildReminders().filter(r => r.type === "service" && (r.status === "overdue" || r.status === "soon")),
      ...this.buildFleetDocumentReminders()
    ].sort((a, b) => a.sort - b.sort);

    document.getElementById("tab-plan-count").hidden = urgent.length === 0;
    document.getElementById("tab-plan-count").textContent = String(urgent.length);

    if (!urgent.length) {
      strip.hidden = true;
      strip.innerHTML = "";
      return;
    }

    strip.hidden = false;
    strip.innerHTML = urgent.slice(0, 4).map(r =>
      '<button type="button" class="alert alert-' + r.status + '" data-goto-plan data-reminder-vehicle="' + Utils.esc(r.vehicleId || this.vehicle.id) + '">' +
        '<i class="fa-solid ' + r.icon + '" aria-hidden="true"></i>' +
        '<span><strong>' + Utils.esc(r.label) + '</strong>' + Utils.esc(r.detail) + '</span>' +
      "</button>"
    ).join("") + (urgent.length > 4
      ? '<button type="button" class="alert alert-more" data-show-garage>+' + (urgent.length - 4) + " další · otevřít přehled vozidel</button>"
      : "");
    strip.querySelector('[data-show-garage]')?.addEventListener('click', () => {
      document.getElementById('garage-search').value = '';
      document.getElementById('garage-type-filter').value = 'all';
      this.openGarageModal();
    });

    strip.querySelectorAll("[data-goto-plan]").forEach(btn => {
      btn.addEventListener("click", () => {
        const vehicleId = btn.dataset.reminderVehicle;
        if (vehicleId && vehicleId !== VehicleStorage.getActiveVehicleId()) {
          if (CloudGarage.draft && !confirm("Opustit rozpracovaný formulář a přejít na vozidlo s blížícím se termínem?")) return;
          VehicleStorage.setActiveVehicleId(vehicleId);
          this.resetForm();
          this.render();
        }
        this.switchTab("plan");
      });
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
          '<div class="record-price">' + Utils.kc(r.totalPrice) + '<small class="settlement-label">' + ServiceSettlement.summary(r).label + (ServiceSettlement.summary(r).status !== 'unknown' && ServiceSettlement.summary(r).due > 0 ? ' · Zbývá ' + Utils.kc(ServiceSettlement.summary(r).due) : '') + '</small></div>' +
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
      { label: "Náklady na km", value: perKm ? perKm.toFixed(2).replace(".", ",") + " Kč/km" : "—", icon: "fa-road" },
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
    ClientBook.updateSettlementForm();
  }

  static adjustCustomTotal(delta) {
    // A manually agreed price may include work/discounts outside the item list.
    // Change it only by the added/removed custom item, never replace it by a sum.
    if (document.getElementById('auto-sum').checked) return;
    const input = document.getElementById('srv-price');
    input.value = Math.round((Utils.money(input.value) + delta) * 100) / 100;
    ClientBook.updateSettlementForm();
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
        const removed = this.customItems.find(i => i.id === btn.dataset.remove);
        if (removed) this.adjustCustomTotal(-Utils.money(removed.price));
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
    const itemTotal = (record.items || []).reduce((sum, item) => sum + Math.round(Utils.money(item.price) * 100), 0);
    document.getElementById("auto-sum").checked = record.priceMode === 'items' ||
      (!record.priceMode && itemTotal === Math.round(Utils.money(record.totalPrice) * 100));
    document.getElementById("srv-price").value = record.totalPrice || "";
    document.getElementById("srv-payment-enabled").checked = record.payment?.enabled === true;
    document.getElementById("srv-payment-vs").value = record.payment?.variableSymbol || "";
    document.getElementById('srv-settlement').value = ServiceSettlement.summary(record).status;
    ClientBook.paidAtTotal = record.settlement?.paidAmount ?? null;
    document.getElementById('srv-paid').value = record.settlement?.paidAmount ?? '';
    ClientBook.updateSettlementForm();

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
    ClientBook.paidAtTotal = null;
    ClientBook.updateSettlementForm();

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
      priceMode: document.getElementById('auto-sum').checked ? 'items' : 'manual',
      workshop: document.getElementById("srv-workshop").value.trim(),
      notes: document.getElementById("srv-notes").value.trim(),
      items: items
    };

    try { record.settlement = ServiceSettlement.fromForm(record.totalPrice,document.getElementById('srv-settlement').value,document.getElementById('srv-paid').value); }
    catch(error) { return {error:error.message}; }
    record.payment = {
      enabled: document.getElementById("srv-payment-enabled").checked,
      variableSymbol: document.getElementById("srv-payment-vs").value.trim()
    };
    if (record.payment.enabled && ServiceSettlement.summary(record).status !== 'paid') {
      try { PaymentQR.payload(ServiceSettlement.summary(record).due, record.payment.variableSymbol); }
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
    ClientBook.fillSelect(vehicle?.clientId || '');
    document.getElementById("veh-ownership").value = VehicleOwnership.get(vehicle);

    this.modalBrand = isEdit ? (vehicle.brand || "audi") : "audi";
    this.renderBrandGrid();
    this.renderDocumentFields(vehicle);

    this.fillModelSelect(isEdit ? vehicle.modelKey : null);
    this.fillYearSelect(isEdit ? vehicle.year : null);
    document.getElementById("veh-engine-code").value = isEdit ? (vehicle.engineCode || "") : "";
    this.fillEngineSelect(isEdit ? vehicle.engineName : null);

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
    const engineOptions = engines => engines.map(e => '<option value="' + Utils.esc(e.name) + '">' + Utils.esc(e.name) + '</option>').join('');
    select.innerHTML = '<option value="">Neuvedeno – vyberte motorizaci</option>' +
        engineOptions(model ? model.engines : []) +
        (model?.catalogueEngines?.length ? '<optgroup label="Katalog PEMA – ověřte rok, trh a kód vozidla">' + engineOptions(model.catalogueEngines) + '</optgroup>' : '') +
        '<option value="__custom__">Jiná motorizace – zadat ručně</option>';
      if (selectedName) {
        const exists = Array.from(select.options).some(o => o.value === selectedName);
        select.value = exists ? selectedName : "__custom__";
        if (!exists) document.getElementById("veh-engine-custom").value = selectedName;
      }
      sourceEl.hidden = false;
      const source = model && model.source && (CATALOGUE_SOURCES[model.source] || FORD_SOURCES[model.source]);
      if (source) {
        sourceEl.append(document.createTextNode(model.catalogueStatus === 'parts-catalogue'
          ? 'Katalog PEMA pro tuto modelovou řadu. Zahrnuje různé trhy a karoserie; konkrétní motor ověřte podle dokladů vozu. '
          : model.edition
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
    const engine = model ? EngineCatalogue.engines(model).find(e => e.name === name) : null;
    // The manufacturer edition must not be shown as the source of a PEMA alternative.
    document.getElementById('engine-source').hidden = Boolean(engine?.catalogueOnly);
    const codeOptions = document.getElementById('engine-code-options');
    codeOptions.replaceChildren(...(engine?.codes || []).map(code => new Option(code, code)));
    const hint = document.getElementById("engine-hint");
    hint.textContent = engine && engine.oilSpec && engine.oilCapacity
      ? "Doporučený olej: " + engine.oilSpec + " · náplň " + engine.oilCapacity
      : "Motor a výkon vyberte podle technického průkazu. Olej a náplň ověřte v příručce konkrétního vozidla.";
    if (engine?.catalogueOnly) {
      const periods = [...new Set(engine.applications.map(a => a.from + '–' + (a.to || 'dosud')))];
      hint.textContent = 'PEMA – katalog různých trhů a karoserií. Období: ' + periods.join(', ') + '. ' +
        (engine.codes.length ? 'Možné kódy: ' + engine.codes.join(', ') + '. Konkrétní kód zvolte podle vozidla. ' : 'Kód motoru zdroj neuvádí. ') +
        (engine.roundedPower ? 'Výkon v katalogu je zaokrouhlený; přesný údaj převezměte z technického průkazu. ' : '') +
        'Olej a náplň ověřte v příručce vozidla. ';
      const enteredCode = document.getElementById('veh-engine-code').value.trim().toUpperCase();
      if (enteredCode && engine.codes.length && !engine.codes.includes(enteredCode)) {
        hint.prepend(document.createTextNode('Zadaný kód ' + enteredCode + ' není mezi kódy vybrané motorizace. Zkontrolujte jej podle vozidla. '));
      }
      const selectedYear = Number(document.getElementById('veh-year').value);
      if (selectedYear && !engine.applications.some(a => selectedYear >= Number(a.from.slice(-4)) && (!a.to || selectedYear <= Number(a.to.slice(-4))))) {
        hint.prepend(document.createTextNode('Zvolený rok je mimo uvedené katalogové období. '));
      }
      const sources = [...new Set(engine.applications.map(a => a.source))];
      for (const id of sources) {
        const source = ENGINE_CATALOGUE_SOURCES[id];
        const link = document.createElement('a');
        link.href = source[1]; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = source[0]; hint.append(link, document.createTextNode(' '));
      }
    }
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

    vehicle.clientId = document.getElementById('veh-client').value;
    vehicle.ownership = document.getElementById('veh-ownership').value;
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
    const query = Utils.norm(document.getElementById('garage-search').value);
    const ownerFilter = document.getElementById('garage-type-filter').value || 'all';
    const vehicles = VehicleStorage.getVehicles().filter(v =>
      (ownerFilter === 'all' || VehicleOwnership.get(v) === ownerFilter) &&
      Utils.norm([this.vehicleName(v),v.spz,v.vin,ClientBook.name(v)].join(' ')).includes(query)
    );
    const activeId = VehicleStorage.getActiveVehicleId();

    if (!vehicles.length) {
      container.innerHTML = '<p class="muted-note">Žádná odpovídající vozidla.</p>';
    } else {
      container.innerHTML = vehicles.map(v => {
        const brand = VehicleCatalog.brand(v.brand);
        const kind = VehicleCatalog.kindOf(v);
        const records = VehicleStorage.getServicesForVehicle(v.id);
        const spend = records.reduce((s, r) => s + Utils.money(r.totalPrice), 0);
        const isActive = v.id === activeId;
        const ownership = VehicleOwnership.get(v);
        const name = this.vehicleName(v);

        return '<div class="garage-card' + (isActive ? " active" : "") + '" data-ownership="' + ownership + '">' +
          '<span class="garage-logo">' +
            (brand && brand.logo
              ? '<img src="' + brand.logo + '" alt="">'
              : '<i class="fa-solid ' + (kind === "car" ? "fa-car" : "fa-motorcycle") + '"></i>') +
          "</span>" +
          "<div class=\"garage-info\">" +
            "<strong>" + Utils.esc(name.trim()) + "</strong>" +
            "<span>" + Utils.esc(v.engineName || "") + "</span>" +
            '<span class="pill pill-soft">' + VehicleOwnership.label(v) + '</span>' +
            '<span class="stk-countdown stk-' + this.stkStatus(v).state + '">' + Utils.esc(this.stkCountdown(v)) + '</span>' +
            (ownership === 'client' ? '<span>' + Utils.esc(ClientBook.name(v)) + '</span>' : '') +
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
    document.getElementById('hero-stk').addEventListener('click', () => this.switchTab('plan'));
    document.getElementById("garage-btn").addEventListener("click", () => this.openGarageModal());
    document.getElementById("garage-type-filter").addEventListener("change", () => this.openGarageModal());
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
    document.getElementById("veh-engine-code").addEventListener("input", () => this.updateEngineHint());
    document.getElementById("veh-year").addEventListener("change", () => this.updateEngineHint());
    document.getElementById("veh-client").addEventListener("change", e => {
      if (e.target.value) document.getElementById("veh-ownership").value = "client";
    });

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

    document.getElementById("srv-price").addEventListener("input", () => {
      document.getElementById('auto-sum').checked = false;
      this.updateFormSummary();
    });

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
      this.adjustCustomTotal(-this.customItems.reduce((sum,item) => sum + Utils.money(item.price),0));
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
    this.adjustCustomTotal(Utils.money(priceInput.value));

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

document.addEventListener("DOMContentLoaded", () => {
  // Hvězdy běží už za přihlašovací obrazovkou; chyba pozadí nesmí zdržet přihlášení.
  try { Background.start(); } catch (e) { console.warn(e); }
  CloudGarage.boot();
});

