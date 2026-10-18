// init.gs — bootstrap spreadsheet 11 tab (idempotent).
// DSA: map konstanta TABS — init loop O(T)=O(11) konstan — satu kali bootstrap, bukan hot path runtime.
function buildHeaders_(tab) {
  if (!TABS[tab]) throw new Error("TAB_TIDAK_DIKENAL:" + tab);
  return TABS[tab].slice();
}

function initSpreadsheet() {
  var ss = ss_();
  for (var i = 0; i < TAB_ORDER.length; i++) {
    var nama = TAB_ORDER[i];
    var sh = ss.getSheetByName(nama);
    if (!sh) {
      sh = ss.insertSheet(nama);
    }
    var headers = buildHeaders_(nama);
    var lastCol = sh.getLastColumn();
    var needWrite = true;
    if (sh.getLastRow() >= 1 && lastCol >= headers.length) {
      var existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
      needWrite = false;
      for (var c = 0; c < headers.length; c++) {
        if (existing[c] !== headers[c]) {
          needWrite = true;
          break;
        }
      }
    }
    if (needWrite) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    sh.setFrozenRows(1);
  }
  var cfg = ss.getSheetByName("Config");
  if (cfg.getLastRow() <= 1) {
    cfg.getRange(2, 1, CONFIG_SEED.length, 3).setValues(CONFIG_SEED);
  }
  // Keputusan pemilik 2026-10-15: hapus tab bawaan "Sheet1" agar A3 tepat 11 tab bisnis.
  // Hanya nama persis "Sheet1" yang dihapus — tab lain di luar TAB_ORDER tidak disentuh.
  var bawaan = ss.getSheetByName("Sheet1");
  if (bawaan) ss.deleteSheet(bawaan);
  SpreadsheetApp.flush();
  return { tabs: TAB_ORDER.length, ok: true };
}
