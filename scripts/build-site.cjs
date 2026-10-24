// Explicit public-file allowlist. Never copy the workspace or backups wholesale.
const fs = require('node:fs');
const path = require('node:path');
const files = ['index.html', 'style.css', '.nojekyll',
  'js/database.js', 'js/ford-data.js', 'js/catalogue-data.js', 'js/storage.js',
  'js/cloud.js', 'js/cloud-config.js', 'js/sync-model.js', 'js/vendor/supabase.js', 'js/vendor/supabase-LICENSE',
  'js/payment.js', 'js/pdf.js', 'js/invoice.js', 'js/app.js',
  'js/vendor/qrcode.js', 'js/vendor/qrcode-LICENSE',
  ...['audi','favicon','ford','honda','skoda','vw','yamaha'].map(x => `assets/${x}.svg`)];
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'dist');
if (fs.existsSync(target)) throw new Error('dist already exists. Use a fresh build directory.');
for (const file of files) {
  const destination = path.join(target, file);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.copyFileSync(path.join(root, file), destination);
}
if (fs.readFileSync(path.join(target,'index.html'),'utf8').includes('garage-data.js')) throw new Error('Private seed referenced');
console.log(`Public site prepared: ${files.length} allowlisted files.`);
