// master.server.gs — adapter GAS untuk master (logic di master.logic.gs).
// DSA: Map by id dari readTab_ — lookup by id O(1), cek unik O(M) M<100 master — volume kecil, sekali per request.
function masterKind_(kind) {
  if (kind === "toko") return "Toko";
  if (kind === "sppg") return "SPPG";
  if (kind === "item") return "Item";
  throw new Error("KIND_TIDAK_VALID:" + kind);
}

function masterPrefix_(kind) {
  if (kind === "toko") return "TK-";
  if (kind === "sppg") return "SPPG-";
  return "ITM-";
}

function masterValidate_(kind, payload) {
  if (kind === "toko") return validasiToko(payload);
  if (kind === "sppg") return validasiSppg(payload);
  return validasiItem(payload);
}

function getMaster() {
  guardOwner_();
  // mapById sengaja TIDAK dikirim ke klien (tak dipakai sisi klien, tapi menggandakan
  // ukuran payload). Logika server tetap memakainya lewat readTab_ langsung.
  return {
    toko: tabUntukKlien_(readTab_("Toko")),
    sppg: tabUntukKlien_(readTab_("SPPG")),
    item: tabUntukKlien_(readTab_("Item"))
  };
}

// Bentuk ringan hasil readTab_ untuk dikirim ke klien: header + rows saja.
function tabUntukKlien_(data) {
  return { header: data.header, rows: data.rows };
}

function saveMaster(kind, payload) {
  guardOwner_();
  var tab = masterKind_(kind);
  masterValidate_(kind, payload || {});
  return lockWrap_(function () {
    var data = readTab_(tab);
    var namaIdx = data.header.indexOf("nama");
    var idIdx = data.header.indexOf("id");
    namaUnik(data.rows, namaIdx, payload.nama, payload.id || null, idIdx);
    var now = new Date();
    if (payload.id && data.mapById[payload.id]) {
      var info = data.mapById[payload.id];
      var row = barisMaster(data.header, payload, payload.id, now);
      var sh = ss_().getSheetByName(tab);
      sh.getRange(info.sheetRow, 1, 1, row.length).setValues([row]);
      writeLog("saveMaster", payload.id, kind + ":" + payload.nama);
      SpreadsheetApp.flush();
      return { id: payload.id, updated: true };
    }
    var id = masterPrefix_(kind) + Utilities.getUuid();
    var baris = barisMaster(data.header, payload, id, now);
    appendRows_(tab, [baris]);
    writeLog("saveMaster", id, kind + ":" + payload.nama);
    return { id: id, updated: false };
  });
}

function nonaktifkanMaster(kind, id) {
  guardOwner_();
  var tab = masterKind_(kind);
  return lockWrap_(function () {
    var data = readTab_(tab);
    var info = data.mapById[id];
    if (!info) throw new Error("ID_TIDAK_ADA:" + id);
    var aktifIdx = data.header.indexOf("aktif");
    var updIdx = data.header.indexOf("updatedAt");
    var sh = ss_().getSheetByName(tab);
    sh.getRange(info.sheetRow, aktifIdx + 1).setValue(false);
    if (updIdx >= 0) sh.getRange(info.sheetRow, updIdx + 1).setValue(new Date());
    writeLog("nonaktifkanMaster", id, kind);
    SpreadsheetApp.flush();
    return { id: id, aktif: false };
  });
}
