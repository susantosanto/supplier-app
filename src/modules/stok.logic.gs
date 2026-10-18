// stok.logic.gs — logic murni stok & opname (testable di Node).
// DSA: hitungStok — agregasi Σ per item O(n) sekali per request — n = baris 3 tab, batch 1x per tab.
function hitungStok(masuk, keluar, koreksi) {
  return Number(masuk) - Number(keluar) + Number(koreksi);
}

function selisihOpname(fisik, sistem) {
  var f = Number(fisik);
  var s = Number(sistem);
  if (!(f >= 0)) throw new Error("FISIK_TIDAK_VALID");
  return { fisik: f, sistem: s, selisih: f - s, koreksiStok: f - s };
}

function barisOpname(header, payload, snapshotSistem, id, now) {
  var sel = selisihOpname(payload.fisik, snapshotSistem);
  var tanggal = payload.tanggal ? new Date(payload.tanggal) : now;
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var k = header[i];
    if (k === "id") row.push(id);
    else if (k === "tanggal") row.push(tanggal);
    else if (k === "itemId") row.push(payload.itemId);
    else if (k === "fisik") row.push(sel.fisik);
    else if (k === "sistem") row.push(sel.sistem);
    else if (k === "selisih") row.push(sel.selisih);
    else if (k === "koreksiStok") row.push(sel.koreksiStok);
    else if (k === "catatan") row.push(payload.catatan || "");
    else if (k === "createdAt") row.push(now);
    else row.push("");
  }
  return row;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { hitungStok: hitungStok, selisihOpname: selisihOpname, barisOpname: barisOpname };
}
