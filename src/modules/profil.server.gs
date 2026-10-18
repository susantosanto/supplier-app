// profil.server.gs — profil supplier teks di tab Config (tanpa scope/auth baru).
// DSA: lookup kunci Config O(K) — K = baris Config (<20), sekali per request.
var PROFIL_KEYS = ["NAMA_SUPPLIER", "KONTAK_SUPPLIER", "ALAMAT_SUPPLIER"];

function profilLabel_(key) {
  if (key === "NAMA_SUPPLIER") return "Nama supplier";
  if (key === "KONTAK_SUPPLIER") return "Kontak supplier";
  return "Alamat supplier";
}

function getProfil() {
  guardOwner_();
  var data = readTab_("Config");
  var h = data.header;
  var kunciIdx = h.indexOf("key");
  var nilaiIdx = h.indexOf("value");
  var peta = {};
  for (var i = 0; i < data.rows.length; i++) {
    peta[data.rows[i][kunciIdx]] = data.rows[i][nilaiIdx];
  }
  return {
    nama: peta.NAMA_SUPPLIER || "",
    kontak: peta.KONTAK_SUPPLIER || "",
    alamat: peta.ALAMAT_SUPPLIER || ""
  };
}

function saveProfil(payload) {
  guardOwner_();
  if (!payload || !String(payload.nama || "").trim()) throw new Error("NAMA_WAJIB");
  return lockWrap_(function () {
    var data = readTab_("Config");
    var h = data.header;
    var kunciIdx = h.indexOf("key");
    var nilaiIdx = h.indexOf("value");
    var nilai = {
      NAMA_SUPPLIER: String(payload.nama).trim(),
      KONTAK_SUPPLIER: String(payload.kontak || "").trim(),
      ALAMAT_SUPPLIER: String(payload.alamat || "").trim()
    };
    var sh = ss_().getSheetByName("Config");
    for (var k = 0; k < PROFIL_KEYS.length; k++) {
      var key = PROFIL_KEYS[k];
      var ketemu = -1;
      for (var i = 0; i < data.rows.length; i++) {
        if (data.rows[i][kunciIdx] === key) { ketemu = i + 2; break; }
      }
      if (ketemu > 0) {
        sh.getRange(ketemu, nilaiIdx + 1).setValue(nilai[key]);
      } else {
        appendRows_("Config", [[key, nilai[key], profilLabel_(key)]]);
      }
    }
    writeLog("saveProfil", "profil", nilai.NAMA_SUPPLIER);
    SpreadsheetApp.flush();
    return { ok: true };
  });
}
