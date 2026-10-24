/* Local invoice extraction. Uncertain layouts are always presented for review. */
const InvoiceParser = {
  // PDF text objects are often individual letters, not words. Insert a space
  // only where their rendered positions actually leave a word/column gap.
  textFromItems(items) {
    const lines = [];
    for (const item of items.filter(i => i.str && i.str.trim()).sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
      let line = lines.find(l => Math.abs(l.y - item.transform[5]) < 3);
      if (!line) { line = { y: item.transform[5], items: [] }; lines.push(line); }
      line.items.push(item);
    }
    return lines.map(line => {
      let text = '', previous = null;
      for (const item of line.items.sort((a, b) => a.transform[4] - b.transform[4])) {
        const gap = previous ? item.transform[4] - previous.transform[4] - previous.width : 0;
        const fontSize = Math.abs(item.transform[0]) || item.height || 10;
        if (previous && gap > fontSize * 0.15 && !/\s$/.test(text) && !/^\s/.test(item.str)) text += ' ';
        text += item.str;
        previous = item;
      }
      return text;
    }).join('\n');
  },
  norm(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); },
  money(s) {
    let value = String(s).replace(/[\s\u00a0]/g, '').replace(/Kč|CZK/gi, '');
    if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  },
  parse(text) {
    const rows = [];
    let total = null;
    let pending = null;
    let inTable = false;
    const compact = s => this.norm(s).replace(/\s/g, '');
    const isHeader = s => /zbozi|nazev|oznaceni/.test(s) && /mnozstvi/.test(s) && /brutto/.test(s);
    const structured = text.split(/\r?\n/).some(l => isHeader(compact(l)));
    const foreign = /\b(EUR|USD|GBP|PLN)\b|€|\$/i.test(text);
    // Require decimals or an explicit currency: part numbers must not become prices.
    const amount = /-?(?:\d{1,3}(?:[ \u00a0.]\d{3})+|\d+)[,.]\d{2}(?!\d)|-?(?:\d{1,3}(?:[ \u00a0]\d{3})+|\d+)(?=\s*(?:Kč|CZK)(?![a-z]))/gi;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim().replace(/K\s+č/gi, 'Kč').replace(/C\s*Z\s+K/gi, 'CZK');
      const norm = this.norm(line);
      const key = compact(line);
      if (isHeader(key)) { inTable = true; pending = null; continue; }
      // Dates and reference numbers must never be interpreted as decimal prices.
      const priceLine = line.replace(/\b\d{1,2}\s*\.\s*\d{1,2}\s*\.\s*\d{2,4}\b/g, m => ' '.repeat(m.length));
      const values = Array.from(priceLine.matchAll(amount));
      if (/^(celkem(?::|$)|celkemkuhrade|castkakuhrade|celkemvcetnedph|celkemsdph|celkovacastka)/.test(key)) {
        if (values.length) total = this.money(values[values.length - 1][0]);
        inTable = false; pending = null; continue;
      }
      if (/^(dan%|zakladnisazba|snizenasazba|rekapitulace|soucet|zakladdane)/.test(key)) {
        inTable = false; pending = null; continue;
      }
      // These are annotations about an existing row, not additional charges.
      if (/^(slevazpolozky|predslevou|celkovaposkytnutasleva|zaruka)/.test(key)) { pending = null; continue; }
      if (/datum|vaseobjednavka|zakazka|splatnost|variabilnisymbol/.test(key)) { pending = null; continue; }
      if (structured) {
        if (!inTable) continue;
        const quantity = line.match(/\s+(\d+(?:[,.]\d{1,3})?)\s*(kus|ks|l|kg|bal|sada)\b(?=\s+-?\d)/i);
        if (quantity) {
          pending = null;
          const code = line.slice(0, quantity.index).trim();
          const number = '-?(?:\\d{1,3}(?:[ \\u00a0.]\\d{3})+|\\d+)[,.]\\d{2}';
          const columns = line.slice(quantity.index + quantity[0].length).trim().match(new RegExp(
            '^(' + number + ')\\s+\\d{1,2}(?:[,.]\\d+)?\\s*%?\\s+(' + number + ')\\s+(' + number + ')\\s+(' + number + ')(?:\\s*(?:Kč|CZK))?\\s*$', 'i'));
          // Netto/MJ, Netto, DPH, Brutto. A damaged/incomplete row is not guessed.
          if (!columns || !code) continue;
          const [, net, tax, gross] = columns.slice(1).map(v => this.money(v));
          if (!Number.isFinite(gross) || Math.abs(Math.round((net + tax) * 100) - Math.round(gross * 100)) > 2) continue;
          // Payment/collection instructions printed as zero-value merchandise.
          if (gross === 0 && /^(nva|osobniodber|hotove|platba)/.test(compact(code))) continue;
          pending = { label: code + ' · ' + quantity[1] + ' ' + quantity[2], price: gross };
          rows.push(pending);
        } else if (pending && line && /[a-zA-ZÀ-ž]{3}/.test(line) && !values.length && !/^[\s_\-=]+$/.test(line)) {
          // Suppliers put the human-readable description directly below the SKU.
          pending.label = line + ' (' + pending.label + ')';
          pending = null;
        }
        continue;
      }
      if (!values.length) continue;
      const last = values[values.length - 1];
      if (/celkem k uhrade|castka k uhrade|celkem vcetne dph|celkem s dph|celkova castka/.test(norm)) {
        total = this.money(last[0]);
        continue;
      }
      if (/^(celkem|soucet|zaklad|dph|rekapitulace|zaokrouhleni|uhrazeno|zaloha|zustatek|sazba|cena|datum|faktura|ico|dic|telefon|tel\.|bank|ucet|variabilni|splatnost|dodavatel|odberatel)/.test(norm)) continue;
      const first = values[0];
      let label = line.slice(0, first.index).trim().replace(/[|;]+$/g, '').trim();
      if (!/[a-zA-ZÀ-ž]{3}/.test(label) || /@|https?:/.test(label)) continue;
      // Keep quantity with the label; the price is the row total, never multiplied again.
      if (/^\d+[,.]\d{2}\s*(ks|kus|l|kg|bal|sada)\b/i.test(line.slice(first.index))) {
        const qty = line.slice(first.index).match(/^\d+[,.]\d{2}\s*(ks|kus|l|kg|bal|sada)\b/i);
        label += ' · ' + qty[0];
        if (values.length < 2) continue;
      }
      const price = this.money(last[0]);
      if (Number.isFinite(price)) rows.push({ label, price });
    }
    return { rows, total, foreign, structured };
  }
};

const InvoiceImport = {
  generation: 0,
  rows: [],
  fileName: '',
  init() {
    this.el = id => document.getElementById('invoice-' + id);
    this.el('file').addEventListener('change', () => this.load(this.el('file').files[0]));
    this.el('discard').addEventListener('click', () => this.reset());
    this.el('add-row').addEventListener('click', () => { this.rows.push({ label: '', price: 0 }); this.render(); });
    this.el('apply').addEventListener('click', () => this.apply());
  },
  reset() {
    this.generation++;
    this.rows = [];
    if (!this.el) return;
    this.el('file').value = '';
    this.el('file').disabled = false;
    this.el('review').hidden = true;
    this.el('status').textContent = '';
    this.el('text').textContent = '';
  },
  async script(url) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('Nepodařilo se načíst rozpoznávání. Zkontrolujte internet a zkuste to znovu.')); };
      document.head.appendChild(script);
    });
  },
  async extract(file, status, current) {
    let worker, pdf;
    const ocr = async image => {
      if (!window.Tesseract) await this.script('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      if (!worker) worker = await Tesseract.createWorker('ces+eng', 1, {
        logger: m => { if (current() && m.status === 'recognizing text') status('Rozpoznávám text: ' + Math.round(m.progress * 100) + ' %'); }
      });
      const result = await worker.recognize(image);
      return result.data.text;
    };
    try {
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return await ocr(file);
      const lib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
      if (pdf.numPages > 15) throw new Error('Faktura má více než 15 stran. Nahrajte kratší soubor.');
      const pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        if (!current()) return '';
        status('Čtu stranu ' + n + ' z ' + pdf.numPages + '…');
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        let text = InvoiceParser.textFromItems(content.items);
        if (text.replace(/\s/g, '').length < 40) {
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: Math.min(2, 3000 / Math.max(base.width, base.height)) });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          text = await ocr(canvas);
          canvas.width = canvas.height = 0;
        }
        pages.push(text);
        page.cleanup();
      }
      return pages.join('\n');
    } finally {
      if (worker) await worker.terminate();
      if (pdf) await pdf.destroy();
    }
  },
  async load(file) {
    if (!file) return;
    this.reset();
    const generation = this.generation;
    const current = () => generation === this.generation;
    const status = text => { if (current()) this.el('status').textContent = text; };
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name) || file.size > 20 * 1024 * 1024) {
      status('Vyberte PDF, JPG, PNG nebo WebP do 20 MB.'); return;
    }
    this.el('file').disabled = true;
    status('Načítám fakturu… První rozpoznání může trvat déle.');
    try {
      const text = await this.extract(file, status, current);
      if (!current()) return;
      const result = InvoiceParser.parse(text);
      this.el('text').textContent = text || 'Žádný čitelný text.';
      this.fileName = file.name;
      this.total = result.total;
      this.foreign = result.foreign;
      this.rows = result.rows;
      this.el('warning').textContent = result.foreign
        ? 'Doklad obsahuje cizí měnu. Import do Kč je zablokován; převod kurzem není podporován.'
        : result.structured
          ? 'Načteny ceny Brutto za celé množství včetně DPH. Údaje o cenách před slevou a způsobu platby se nepřidávají jako díly. Zkontrolujte položky a součet proti faktuře.'
          : 'Rozložení tabulky nebylo rozpoznáno. Návrh cen je orientační — zkontrolujte cenu za celé množství včetně DPH. Chybějící položky doplňte a nesprávné odeberte.';
      this.el('review').hidden = false;
      this.render();
      status(this.rows.length ? 'Načteno ' + this.rows.length + ' položek z „' + file.name + '“. Zkontrolujte návrh níže.' : 'Položky se nepodařilo spolehlivě rozpoznat. Můžete je doplnit podle textu níže nebo nahrát čitelnější soubor.');
    } catch (e) {
      if (current()) status(e.name === 'PasswordException' ? 'PDF je chráněné heslem. Nahrajte odemčenou kopii.' : 'Načtení se nezdařilo. ' + e.message);
    } finally {
      if (current()) this.el('file').disabled = false;
    }
  },
  render() {
    const container = this.el('rows');
    container.replaceChildren();
    this.rows.forEach((row, index) => {
      const wrap = document.createElement('div'); wrap.className = 'invoice-row';
      const label = document.createElement('input'); label.className = 'form-control'; label.value = row.label;
      label.setAttribute('aria-label', 'Název a množství položky ' + (index + 1));
      label.addEventListener('input', () => { row.label = label.value; this.summary(); });
      const price = document.createElement('input'); price.className = 'form-control'; price.type = 'number'; price.step = '0.01'; price.value = row.price;
      price.setAttribute('aria-label', 'Cena celkem včetně DPH v Kč, položka ' + (index + 1));
      price.addEventListener('input', () => { row.price = price.value === '' ? NaN : Number(price.value); this.summary(); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-ghost'; remove.textContent = 'Odebrat';
      remove.addEventListener('click', () => { this.rows.splice(index, 1); this.render(); });
      wrap.append(label, price, remove); container.append(wrap);
    });
    this.summary();
  },
  summary() {
    const sum = this.rows.reduce((s, r) => s + (Number.isFinite(r.price) ? Math.round(r.price * 100) : 0), 0) / 100;
    const mismatch = this.total !== null && Math.abs(sum - this.total) > 0.01;
    this.el('total').textContent = 'Součet položek: ' + Utils.kc(sum) + (this.total !== null ? ' · Na dokladu: ' + Utils.kc(this.total) : '') + (mismatch ? ' — Částky se liší. Zkontrolujte DPH, dopravu, slevy a chybějící položky.' : '');
    this.el('apply').disabled = this.foreign || !this.rows.length || this.rows.some(r => !r.label.trim() || !Number.isFinite(r.price));
  },
  apply() {
    this.summary();
    if (this.el('apply').disabled || !App.vehicle) return;
    for (const row of this.rows) App.customItems.push({ id: VehicleStorage.newId('custom'), label: row.label.trim(), price: Math.round(row.price * 100) / 100 });
    const notes = document.getElementById('srv-notes');
    notes.value = [notes.value.trim(), 'Díly z faktury: ' + this.fileName].filter(Boolean).join('\n');
    document.getElementById('auto-sum').checked = true;
    App.renderCustomItems(); App.afterSelectionChange();
    this.reset();
    this.el('status').textContent = 'Díly i ceny jsou přidané. Doplňte datum a tachometr, potom uložte servisní záznam.';
  }
};


