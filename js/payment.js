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
