/**
 * Servisní kniha vozidel a motocyklů
 * Generování tiskových výstupů – servisní protokol a kompletní servisní knížka.
 *
 * Výstup se otevře v novém okně, kde si uživatel vybere tisk nebo stažení PDF.
 */

class PDFServicePrinter {
  static printableNotes(notes) {
    return String(notes || '').split(/\r?\n/)
      .filter(line => !/^\s*Díly z faktury\s*:/i.test(line))
      .join('\n').trim();
  }
  /* ----------------------------- Pomocné ----------------------------- */

  static esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  static num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  static kc(value) {
    return this.num(value).toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) + " Kč";
  }

  static km(value) {
    return this.num(value).toLocaleString("cs-CZ") + " km";
  }

  /** České skloňování počtu. */
  static plural(count, one, few, many) {
    const n = Math.abs(this.num(count));
    return n.toLocaleString("cs-CZ") + " " + (n === 1 ? one : (n >= 2 && n <= 4 ? few : many));
  }

  static date(value, long) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return "—";
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("cs-CZ", long
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "numeric", month: "numeric", year: "numeric" });
  }

  static brandOf(vehicle) {
    const brand = (typeof VehicleCatalog !== "undefined") ? VehicleCatalog.brand(vehicle.brand) : null;
    return {
      name: brand ? brand.name : (vehicle.brandName || vehicle.brand || "Stroj"),
      color: brand ? brand.color : "#e0453b",
      logo: brand ? brand.logo : null
    };
  }

  /** Starší záznamy mají značku i v názvu modelu – nezdvojovat ji. */
  static vehicleTitle(vehicle) {
    const brand = this.brandOf(vehicle);
    const model = (vehicle.modelName || "").trim();
    const base = (!model || model.toLowerCase().indexOf(brand.name.toLowerCase()) === 0)
      ? (model || brand.name)
      : (brand.name + " " + model);
    return vehicle.nickname ? vehicle.nickname + " – " + base : base;
  }

  static categoryName(categoryId) {
    if (typeof VehicleCatalog !== "undefined") return VehicleCatalog.categoryName(categoryId);
    return "Servisní úkon";
  }

  /** Otevře okno s dokumentem; ošetří blokovaná vyskakovací okna. */
  static openDocument(html, fileName) {
    const win = window.open("", "_blank");
    if (!win) {
      if (typeof UI !== "undefined") {
        UI.toast("Prohlížeč zablokoval nové okno. Povolte vyskakovací okna a zkuste to znovu.", "error");
      } else {
        alert("Prohlížeč zablokoval nové okno. Povolte pro tuto stránku vyskakovací okna.");
      }
      return null;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.document.title = fileName;
    return win;
  }

  /* --------------------------- Sdílené styly -------------------------- */

  static baseStyles(accent) {
    return `
      @page { size: A4; margin: 14mm 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #e9edf2;
        color: #14181f;
        font: 13px/1.5 'Segoe UI', Roboto, Arial, sans-serif;
      }
      .toolbar {
        position: sticky; top: 0; z-index: 10;
        background: #14181f; color: #fff;
        padding: 12px 24px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        flex-wrap: wrap;
      }
      .toolbar .label { font-weight: 700; font-size: 15px; }
      .toolbar .hint { font-size: 12px; color: #9aa6b6; }
      .toolbar .actions { display: flex; gap: 10px; }
      .toolbar button {
        border: none; border-radius: 6px; padding: 9px 16px;
        font: 600 13px/1 'Segoe UI', Arial, sans-serif; cursor: pointer;
        display: inline-flex; align-items: center; gap: 7px;
      }
      .btn-pdf { background: #2563eb; color: #fff; }
      .btn-print { background: #16a34a; color: #fff; }
      .btn-pdf:hover { background: #1d4ed8; }
      .btn-print:hover { background: #15803d; }

      .sheet {
        background: #fff;
        max-width: 820px;
        margin: 26px auto;
        padding: 34px 38px 40px;
        border-radius: 6px;
        box-shadow: 0 8px 26px rgba(0,0,0,.14);
      }

      .doc-head {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
        border-bottom: 3px solid ${accent};
        padding-bottom: 16px; margin-bottom: 22px;
      }
      .doc-head h1 { margin: 0; font-size: 21px; letter-spacing: .4px; text-transform: uppercase; }
      .doc-head .sub { color: #5d6b7e; font-size: 12px; margin-top: 4px; }
      .brand-badge {
        background: ${accent}; color: #fff;
        padding: 8px 16px; border-radius: 6px;
        font-weight: 700; font-size: 15px; white-space: nowrap;
      }

      .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
      .card { background: #f6f8fa; border: 1px solid #dde3ea; border-radius: 6px; padding: 15px 17px; }
      .card h3 {
        margin: 0 0 10px; font-size: 11px; letter-spacing: .6px; text-transform: uppercase;
        color: ${accent}; border-bottom: 1px solid #dde3ea; padding-bottom: 6px;
      }
      .card p { margin: 5px 0; font-size: 12.5px; }
      .card p b { display: inline-block; min-width: 118px; color: #46536a; font-weight: 600; }

      h2.section { font-size: 14px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }

      table { width: 100%; border-collapse: collapse; }
      th {
        background: #f1f4f8; color: #34405a; text-align: left;
        padding: 9px 11px; font-size: 11px; text-transform: uppercase; letter-spacing: .4px;
        border-bottom: 2px solid #d7dee7;
      }
      td { padding: 9px 11px; border-bottom: 1px solid #e6ebf1; font-size: 12.5px; vertical-align: top; }
      tbody tr:nth-child(even) { background: #fbfcfd; }
      .right { text-align: right; }
      .cat { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10.5px; background: #eef1f6; color: #46536a; }

      .note {
        background: #fffaf0; border: 1px solid #f5e0b4; color: #6b4d10;
        border-radius: 6px; padding: 12px 15px; font-size: 12.5px; margin-top: 16px;
      }
      .oilbox {
        background: #f0f7ff; border: 1px solid #c6ddf5; color: #16456f;
        border-radius: 6px; padding: 12px 15px; font-size: 12.5px; margin-top: 14px;
      }

      .total {
        margin-top: 20px; background: #14181f; color: #fff;
        border-radius: 6px; padding: 15px 20px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
      }
      .total .amount { font-size: 21px; font-weight: 700; color: #4ade80; }

      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 46px; margin-top: 44px; }
      .payment { display: flex; align-items: center; gap: 18px; margin-top: 22px; border: 1px solid #dde3ea; padding: 12px; background: #fff; color: #14181f; }
      .payment img { width: 48mm; height: 48mm; flex-shrink: 0; }
      .payment h2 { font-size: 16px; margin: 0 0 8px; }
      .payment p { margin: 4px 0; font-size: 12px; overflow-wrap: anywhere; }
      .sig { border-top: 1px dashed #97a3b4; padding-top: 7px; text-align: center; font-size: 11.5px; color: #5d6b7e; }

      .footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #8593a6; text-align: center; }

      .avoid-break, tr, .card, .total, .note, .oilbox, .signatures, .summary {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      @media print {
        body { background: #fff; }
        .no-print { display: none !important; }
        .sheet { max-width: 100%; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
      }
    `;
  }

  static toolbar(title, fileName) {
    return `
      <div class="toolbar no-print">
        <div>
          <div class="label">${this.esc(title)}</div>
          <div class="hint">Uložte jako PDF nebo rovnou vytiskněte.</div>
        </div>
        <div class="actions">
          <button type="button" class="btn-pdf" onclick="downloadPdf()">Stáhnout PDF</button>
          <button type="button" class="btn-print" onclick="window.print()">Vytisknout</button>
        </div>
      </div>
    `;
  }

  static script(fileName) {
    return `
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
      <script>
        function downloadPdf() {
          if (typeof html2pdf === "undefined") {
            alert("Knihovnu pro export PDF se nepodařilo načíst (chybí připojení k internetu).\\n\\nPoužijte tlačítko Vytisknout a zvolte \\"Uložit jako PDF\\".");
            return;
          }
          html2pdf().set({
            margin: [10, 10, 12, 10],
            filename: ${JSON.stringify(fileName)},
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"] }
          }).from(document.getElementById("sheet")).save();
        }
      <\/script>
    `;
  }

  /* ------------------------- Servisní protokol ------------------------ */

  static printSingleProtocol(record, vehicle) {
    try {
      const doc = this.buildProtocol(record, vehicle);
      if (doc) this.openDocument(doc.html, doc.fileName);
    } catch (error) {
      if (typeof UI !== 'undefined') UI.toast('Protokol se nepodařilo vytvořit: ' + error.message, 'error');
      else throw error;
    }
  }

  /** Sestaví HTML protokolu; vrací { html, fileName } nebo null. */
  static buildProtocol(record, vehicle) {
    if (!record || !vehicle) return null;

    const brand = this.brandOf(vehicle);
    const safeSpz = String(vehicle.spz || "protokol").replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
    const fileName = "Servisni-protokol_" + safeSpz + "_" + record.date + ".pdf";

    const items = Array.isArray(record.items) ? record.items : [];
    const itemsHtml = items.length
      ? items.map(item => `
          <tr>
            <td><b>${this.esc(item.label)}</b></td>
            <td><span class="cat">${this.esc(this.categoryName(item.categoryId))}</span></td>
            <td class="right">${item.price ? this.kc(item.price) : "—"}</td>
          </tr>`).join("")
      : '<tr><td colspan="3" style="text-align:center;color:#8593a6;">Bez rozepsaných úkonů</td></tr>';

    const itemsSum = items.reduce((sum, i) => sum + this.num(i.price), 0);
    const rest = this.num(record.totalPrice) - itemsSum;
    let paymentHtml = '';
    const settlement = ServiceSettlement.summary(record);
    if (record.payment && record.payment.enabled === true && settlement.status !== 'paid') {
      const vs = String(record.payment.variableSymbol || '').trim();
      const payload = PaymentQR.payload(settlement.due, vs);
      const image = PaymentQR.image(payload);
      paymentHtml = `<section class="payment avoid-break" aria-label="QR platba">
        <img src="${image}" alt="QR platba na účet ${this.esc(PaymentQR.account)}" width="182" height="182">
        <div><h2>QR platba</h2>
          <p><b>Částka k úhradě:</b> ${this.kc(settlement.due)}</p>
          <p><b>Účet:</b> ${this.esc(PaymentQR.account)}</p>
          <p><b>IBAN:</b> ${this.esc(PaymentQR.iban)}</p>
          <p><b>Variabilní symbol:</b> ${this.esc(vs || 'neuveden')}</p>
          <p>Načtěte QR kód v bankovní aplikaci.</p>
        </div>
      </section>`;
    }

    let oilHtml = "";
    if (record.oil && record.oil.viscosity) {
      const parts = [record.oil.viscosity];
      if (record.oil.liters) parts.push("množství " + record.oil.liters);
      if (record.oil.brand) parts.push(record.oil.brand);
      oilHtml += `<div class="oilbox avoid-break"><b>Motorový olej:</b> ${this.esc(parts.join(" · "))}</div>`;
    }
    if (record.cabin && record.cabin.type) {
      const parts = [record.cabin.type];
      if (record.cabin.brand) parts.push(record.cabin.brand);
      oilHtml += `<div class="oilbox avoid-break"><b>Kabinový filtr:</b> ${this.esc(parts.join(" · "))}</div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Servisní protokol – ${this.esc(vehicle.spz || vehicle.modelName || "")}</title>
<style>${this.baseStyles(brand.color)}</style>
</head>
<body>
${this.toolbar("Servisní protokol", fileName)}

<div class="sheet" id="sheet">
  <div class="doc-head">
    <div>
      <h1>Servisní protokol</h1>
      <div class="sub">Záznam o provedených servisních úkonech</div>
    </div>
    <div class="brand-badge">${this.esc(brand.name)}</div>
  </div>

  <div class="cards">
    <div class="card">
      <h3>Identifikace stroje</h3>
      <p><b>Značka a model</b> ${this.esc(this.vehicleTitle(vehicle))}</p>
      <p><b>Motorizace</b> ${this.esc(vehicle.engineName || "—")}</p>
      <p><b>Rok výroby</b> ${this.esc(vehicle.year || "—")}</p>
      <p><b>SPZ / RZ</b> ${this.esc(vehicle.spz || "—")}</p>
      <p><b>VIN / rám</b> ${this.esc(vehicle.vin || "—")}</p>
      <p><b>Kód motoru</b> ${this.esc(vehicle.engineCode || "—")}</p>
    </div>
    <div class="card">
      <h3>Údaje o servisu</h3>
      <p><b>Datum</b> ${this.date(record.date, true)}</p>
      <p><b>Stav tachometru</b> ${this.km(record.mileage)}</p>
      <p><b>Provedl</b> ${this.esc(record.workshop || "vlastní údržba")}</p>
      <p><b>Počet úkonů</b> ${items.length}</p>
      <p><b>Číslo protokolu</b> ${this.esc(String(record.id || "").slice(-8).toUpperCase())}</p>
    </div>
  </div>

  <h2 class="section">Provedené úkony a vyměněné díly</h2>
  <table>
    <thead>
      <tr><th>Úkon / díl</th><th style="width:170px;">Kategorie</th><th class="right" style="width:110px;">Cena</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  ${oilHtml}

  ${this.printableNotes(record.notes) ? `<div class="note avoid-break"><b>Poznámka:</b><br>${this.esc(this.printableNotes(record.notes)).replace(/\n/g, "<br>")}</div>` : ""}

  <div class="total avoid-break">
    <span>Celková cena servisu (materiál a práce)${rest > 0 ? " – z toho " + this.kc(rest) + " nerozepsáno" : ""}</span>
    <span class="amount">${this.kc(record.totalPrice)}</span>
  </div>

  <div class="signatures avoid-break">
    <div class="sig">Razítko a podpis dílny / mechanika</div>
    <div class="sig">Podpis majitele stroje</div>
  </div>

  <p class="avoid-break"><b>Úhrada:</b> ${this.esc(settlement.label)}${settlement.status !== 'unknown' ? ' · Uhrazeno ' + this.kc(settlement.paid) + ' · Zbývá ' + this.kc(settlement.due) : ''}</p>
  ${paymentHtml}

  <div class="footer">Vygenerováno ${this.date(new Date().toISOString().slice(0, 10), true)} · Digitální servisní kniha</div>
</div>

${this.script(fileName)}
</body>
</html>`;

    return { html: html, fileName: fileName };
  }

  /* ------------------------ Kompletní knížka -------------------------- */

  static printFullHistory(vehicle, records) {
    const doc = this.buildBook(vehicle, records);
    if (doc) this.openDocument(doc.html, doc.fileName);
  }

  /** Sestaví HTML servisní knížky; vrací { html, fileName } nebo null. */
  static buildBook(vehicle, records) {
    if (!vehicle) return null;

    const brand = this.brandOf(vehicle);
    const list = (records || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const safeSpz = String(vehicle.spz || "stroj").replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
    const fileName = "Servisni-knizka_" + safeSpz + ".pdf";

    const total = list.reduce((sum, r) => sum + this.num(r.totalPrice), 0);
    const mileages = list.map(r => this.num(r.mileage)).filter(Boolean);
    const span = mileages.length > 1 ? Math.max.apply(null, mileages) - Math.min.apply(null, mileages) : 0;

    const rowsHtml = list.length
      ? list.map(r => {
          const items = Array.isArray(r.items) ? r.items : [];
          const itemList = items.length
            ? items.map(i => "• " + this.esc(i.label) + (i.price ? " (" + this.kc(i.price) + ")" : "")).join("<br>")
            : "Servisní úkon";
          const oil = r.oil && r.oil.viscosity
            ? '<div style="margin-top:5px;color:#16456f;">Olej: ' + this.esc(r.oil.viscosity) +
              (r.oil.liters ? " · " + this.esc(r.oil.liters) : "") +
              (r.oil.brand ? " · " + this.esc(r.oil.brand) : "") + "</div>"
            : "";
          const note = this.printableNotes(r.notes)
            ? '<div style="margin-top:5px;font-style:italic;color:#6b7788;">' + this.esc(this.printableNotes(r.notes)) + "</div>"
            : "";
          return `<tr>
            <td><b>${this.date(r.date)}</b></td>
            <td>${this.km(r.mileage)}</td>
            <td>${itemList}${oil}${note}</td>
            <td>${this.esc(r.workshop || "vlastní")}</td>
            <td class="right"><b>${r.totalPrice ? this.kc(r.totalPrice) : "—"}</b></td>
          </tr>`;
        }).join("")
      : '<tr><td colspan="5" style="text-align:center;color:#8593a6;padding:22px;">Zatím žádné servisní záznamy</td></tr>';

    const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Servisní knížka – ${this.esc(vehicle.spz || vehicle.modelName || "")}</title>
<style>
${this.baseStyles(brand.color)}
.summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0 6px; }
.summary div { background: #f6f8fa; border: 1px solid #dde3ea; border-radius: 6px; padding: 12px 14px; }
.summary b { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: #6b7788; }
.summary span { font-size: 15px; font-weight: 700; }
</style>
</head>
<body>
${this.toolbar("Digitální servisní knížka", fileName)}

<div class="sheet" id="sheet">
  <div class="doc-head">
    <div>
      <h1>Servisní knížka</h1>
      <div class="sub">Kompletní přehled údržby · vygenerováno ${this.date(new Date().toISOString().slice(0, 10), true)}</div>
    </div>
    <div class="brand-badge">${this.esc(brand.name)}</div>
  </div>

  <div class="cards">
    <div class="card">
      <h3>Stroj</h3>
      <p><b>Značka a model</b> ${this.esc(this.vehicleTitle(vehicle))}</p>
      <p><b>Motorizace</b> ${this.esc(vehicle.engineName || "—")}</p>
      <p><b>Kód motoru</b> ${this.esc(vehicle.engineCode || "—")}</p>
      <p><b>Rok výroby</b> ${this.esc(vehicle.year || "—")}</p>
    </div>
    <div class="card">
      <h3>Evidence</h3>
      <p><b>SPZ / RZ</b> ${this.esc(vehicle.spz || "—")}</p>
      <p><b>VIN / rám</b> ${this.esc(vehicle.vin || "—")}</p>
      <p><b>Stav tachometru</b> ${this.km(vehicle.mileage)}</p>
      <p><b>STK platná do</b> ${vehicle.stkUntil ? this.date(vehicle.stkUntil) : "—"}</p>
    </div>
  </div>

  <div class="summary avoid-break">
    <div><b>Záznamů</b><span>${list.length}</span></div>
    <div><b>Celkem</b><span>${this.kc(total)}</span></div>
    <div><b>Průměr na servis</b><span>${this.kc(list.length ? total / list.length : 0)}</span></div>
    <div><b>Sledované km</b><span>${this.km(span)}</span></div>
  </div>

  <h2 class="section">Přehled servisní historie</h2>
  <table>
    <thead>
      <tr>
        <th style="width:82px;">Datum</th>
        <th style="width:92px;">Tachometr</th>
        <th>Provedené úkony</th>
        <th style="width:118px;">Provedl</th>
        <th class="right" style="width:94px;">Cena</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="total avoid-break">
    <span>Celkové náklady na údržbu (${this.plural(list.length, "záznam", "záznamy", "záznamů")})</span>
    <span class="amount">${this.kc(total)}</span>
  </div>

  <div class="footer">
    Tento dokument je výpisem z osobní digitální servisní knihy a nenahrazuje originální servisní knížku výrobce.
  </div>
</div>

${this.script(fileName)}
</body>
</html>`;

    return { html: html, fileName: fileName };
  }
}

