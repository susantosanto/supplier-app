// db.gs — adapter tipis spreadsheet: baca batch, tulis batch, lock.
function lockWrap_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function readTab_(nama) {
  var sh = ss_().getSheetByName(nama);
  if (!sh) {
    // Toleran spasi tak sengaja pada nama tab (mis. "Toko ").
    var semua = ss_().getSheets();
    for (var s = 0; s < semua.length; s++) {
      if (String(semua[s].getName()).trim() === nama) { sh = semua[s]; break; }
    }
  }
  if (!sh) throw new Error("TAB_TIDAK_ADA:" + nama);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) {
    return { header: buildHeaders_(nama), rows: [], mapById: {} };
  }
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var header = values[0];
  header = normalisasiHeader_(nama, header);
  var rows = values.slice(1);
  var mapById = {};
  var idIdx = header.indexOf("id");
  if (idIdx >= 0) {
    for (var i = 0; i < rows.length; i++) {
      var id = rows[i][idIdx];
      if (id) mapById[id] = { row: rows[i], sheetRow: i + 2 };
    }
  }
  return { header: header, rows: rows, mapById: mapById };
}

// Samakan header aktual ke nama kanonis (toleran huruf besar/kecil + spasi).
// Hanya memetakan bila nama persis tidak ada tapi ada padanan case-insensitive.
function normalisasiHeader_(nama, header) {
  var kanon = (typeof TABS !== "undefined" && TABS[nama]) ? TABS[nama] : [];
  var keluar = header.slice();
  for (var k = 0; k < kanon.length; k++) {
    if (keluar.indexOf(kanon[k]) >= 0) continue;
    var target = String(kanon[k]).trim().toLowerCase();
    for (var c = 0; c < keluar.length; c++) {
      if (String(keluar[c]).trim().toLowerCase() === target) { keluar[c] = kanon[k]; break; }
    }
  }
  return keluar;
}

function appendRows_(nama, rowsBatch) {
  if (!rowsBatch || rowsBatch.length === 0) return 0;
  var sh = ss_().getSheetByName(nama);
  if (!sh) throw new Error("TAB_TIDAK_ADA:" + nama);
  var startRow = sh.getLastRow() + 1;
  sh.getRange(startRow, 1, rowsBatch.length, rowsBatch[0].length).setValues(rowsBatch);
  SpreadsheetApp.flush();
  return rowsBatch.length;
}
