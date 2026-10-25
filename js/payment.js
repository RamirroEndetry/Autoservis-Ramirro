/* Czech QR Platba / SPAYD 1.0. Generated locally; no payment data leaves the app.
 * Format: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 */
class PaymentQR {
  static account = '824880004/5500';
  static iban = 'CZ9555000000000824880004';

  static payload(amount, variableSymbol = '') {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 9999999.99 ||
        Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      throw new Error('Pro QR platbu zadejte kladnou cenu do 9 999 999,99 Kč, nejvýše se dvěma desetinnými místy.');
    }
    const vs = String(variableSymbol).trim();
    if (vs && !/^\d{1,10}$/.test(vs)) {
      throw new Error('Variabilní symbol musí obsahovat nejvýše 10 číslic.');
    }
    return `SPD*1.0*ACC:${this.iban}*AM:${value.toFixed(2)}*CC:CZK` + (vs ? `*X-VS:${vs}` : '');
  }

  static image(payload) {
    if (typeof qrcode !== 'function') throw new Error('Knihovna pro QR platbu není dostupná. Obnovte aplikaci.');
    const qr = qrcode(0, 'M');
    qr.addData(payload, 'Alphanumeric');
    qr.make();
    // Four white modules on all sides, integer-sized pixels, lossless PNG for printing.
    const scale = 8;
    const margin = 4;
    const count = qr.getModuleCount();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = (count + margin * 2) * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
    }
    return canvas.toDataURL('image/png');
  }
}
// Settlement is separate from the optional QR. Missing legacy data stays unknown.
const ServiceSettlement = {
  summary(record) {
    try { return this.validated(record); }
    catch (_) { return {status:'unknown',label:'Zkontrolujte údaje úhrady',paid:0,due:0}; }
  },
  validated(record) {
    const total = Math.round(Number(record.totalPrice || 0) * 100);
    const value = record.settlement;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Celková cena musí být nezáporná částka.');
    if (!value || value.status === 'unknown') return {status:'unknown',label:'Úhrada neuvedena',paid:0,due:total/100};
    const paid = Math.round(Number(value.paidAmount) * 100);
    if (!Number.isSafeInteger(paid) || paid < 0 || paid > total) throw new Error('Uhrazená částka musí být mezi nulou a celkovou cenou.');
    const status = paid === total ? 'paid' : paid === 0 ? 'unpaid' : 'partial';
    return {status,label:{paid:'Zaplaceno',unpaid:'Nezaplaceno',partial:'Částečně zaplaceno'}[status],paid:paid/100,due:(total-paid)/100};
  },
  fromForm(total,status,amount) {
    this.validated({totalPrice:total});
    if (!['unknown','unpaid','partial','paid'].includes(status)) throw new Error('Vyberte stav úhrady.');
    if (status === 'unknown') return {status:'unknown'};
    const paidAmount = status === 'paid' ? Number(total) : status === 'unpaid' ? 0 : Number(String(amount).replace(',','.'));
    if (!Number.isFinite(paidAmount) || Math.abs(paidAmount*100-Math.round(paidAmount*100))>0.000001) throw new Error('Zadejte platnou úhradu s nejvýše dvěma desetinnými místy.');
    const result = this.validated({totalPrice:total,settlement:{status,paidAmount}});
    if(status==='partial' && (result.status!=='partial' || String(amount).trim()==='')) throw new Error('Částečná úhrada musí být větší než nula a menší než cena servisu.');
    return {status:result.status,paidAmount:result.paid};
  }
};
