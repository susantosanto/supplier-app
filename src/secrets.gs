// secrets.gs — akses rahasia via ScriptProperties (tanpa rahasia hardcoded).
// MVP sprint 001: belum ada rahasia yang dipakai; fungsi disiapkan untuk sprint berikut.
function getSecret_(key) {
  if (!key) throw new Error("SECRET_KEY_KOSONG");
  var props = PropertiesService.getScriptProperties();
  var val = props.getProperty(key);
  if (val === null || val === undefined || val === "") {
    throw new Error("SECRET_TIDAK_ADA:" + key);
  }
  return val;
}
