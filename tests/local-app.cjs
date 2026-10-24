// Isolate existing catalogue/QR regression tests from authentication infrastructure.
// This hook exists only in the test runner; no bypass is shipped with the app.
module.exports=async page=>page.addInitScript(()=>{
  document.addEventListener('DOMContentLoaded',event=>{
    event.stopImmediatePropagation();
    document.getElementById('auth-gate').hidden=true;
    document.getElementById('private-app').hidden=false;
    App.init();
  },true);
});
