// stok.server.gs — adapter GAS untuk stok, mutasi, batas & opname.
// DSA: listMutasiStok — merge 3 sumber + sort O(n log n) — n = baris periode, in-memory.
// DSA: doOpname — snapshot + 1 append O(n) baca batch — idempoten via OPN id unik (retry = baris baru tercatat).
function dateKey_(d) {
  var t = new Date(d);
  return t.getFullYear() + "-" + (t.getMonth() + 1) + "-" + t.getDate();
}

function stokSemua_() {
  var item = readTab_("Item");
  var perItem = {};
  function slot(id) {
    if (!perItem[id]) perItem[id] = { masuk: 0, keluar: 0, koreksi: 0, stok: 0 };
    return perItem[id];
  }
  var beli = readTab_("Pembelian");
  var hb = beli.header;
  for (var i = 0; i < beli.rows.length; i++) {
    slot(beli.rows[i][hb.indexOf("itemId")]).masuk += Number(beli.rows[i][hb.indexOf("qty")]);
  }
  var kirim = readTab_("Pengiriman");
  var hk = kirim.header;
  for (var j = 0; j < kirim.rows.length; j++) {
    slot(kirim.rows[j][hk.indexOf("itemId")]).keluar += Number(kirim.rows[j][hk.indexOf("qty")]);
  }
  var opn = readTab_("Opname");
  var ho = opn.header;
  for (var k = 0; k < opn.rows.length; k++) {
    slot(opn.rows[k][ho.indexOf("itemId")]).koreksi += Number(opn.rows[k][ho.indexOf("koreksiStok")]);
  }
  for (var id in perItem) {
    if (Object.prototype.hasOwnProperty.call(perItem, id)) {
      perItem[id].stok = hitungStok(perItem[id].masuk, perItem[id].keluar, perItem[id].koreksi);
    }
  }
  return { item: item, perItem: perItem, beli: beli, kirim: kirim };
}

function getStok() {
  guardOwner_();
  var ctx = stokSemua_();
  var h = ctx.item.header;
  var hariIni = dateKey_(new Date());
  var hb = ctx.beli.header;
  var hk = ctx.kirim.header;
  var hasil = [];
  for (var i = 0; i < ctx.item.rows.length; i++) {
    var r = ctx.item.rows[i];
    var id = r[h.indexOf("id")];
    var agg = ctx.perItem[id] || { masuk: 0, keluar: 0, koreksi: 0, stok: 0 };
    var masukHariIni = 0;
    for (var a = 0; a < ctx.beli.rows.length; a++) {
      if (ctx.beli.rows[a][hb.indexOf("itemId")] === id && dateKey_(ctx.beli.rows[a][hb.indexOf("tanggal")]) === hariIni) {
        masukHariIni += Number(ctx.beli.rows[a][hb.indexOf("qty")]);
      }
    }
    var keluarHariIni = 0;
    for (var b = 0; b < ctx.kirim.rows.length; b++) {
      if (ctx.kirim.rows[b][hk.indexOf("itemId")] === id && dateKey_(ctx.kirim.rows[b][hk.indexOf("tanggal")]) === hariIni) {
        keluarHariIni += Number(ctx.kirim.rows[b][hk.indexOf("qty")]);
      }
    }
    var batas = Number(r[h.indexOf("batasStokMin")]);
    hasil.push({
      itemId: id,
      nama: r[h.indexOf("nama")],
      satuan: r[h.indexOf("satuanDasar")],
      stok: agg.stok,
      batasStokMin: batas,
      tipis: agg.stok < batas,
      masukHariIni: masukHariIni,
      keluarHariIni: keluarHariIni
    });
  }
  return hasil;
}

function listMutasiStok(filter) {
  guardOwner_();
  var f = filter || {};
  var out = [];
  var beli = readTab_("Pembelian");
  var hb = beli.header;
  for (var i = 0; i < beli.rows.length; i++) {
    var rb = beli.rows[i];
    if (f.itemId && rb[hb.indexOf("itemId")] !== f.itemId) continue;
    if (f.dari && new Date(rb[hb.indexOf("tanggal")]) < new Date(f.dari)) continue;
    if (f.sampai && new Date(rb[hb.indexOf("tanggal")]) > new Date(f.sampai)) continue;
    out.push({ tanggal: rb[hb.indexOf("tanggal")], jenis: "masuk", itemId: rb[hb.indexOf("itemId")], qty: Number(rb[hb.indexOf("qty")]), refId: rb[hb.indexOf("id")] });
  }
  var kirim = readTab_("Pengiriman");
  var hk = kirim.header;
  for (var j = 0; j < kirim.rows.length; j++) {
    var rk = kirim.rows[j];
    if (f.itemId && rk[hk.indexOf("itemId")] !== f.itemId) continue;
    if (f.dari && new Date(rk[hk.indexOf("tanggal")]) < new Date(f.dari)) continue;
    if (f.sampai && new Date(rk[hk.indexOf("tanggal")]) > new Date(f.sampai)) continue;
    out.push({ tanggal: rk[hk.indexOf("tanggal")], jenis: "keluar", itemId: rk[hk.indexOf("itemId")], qty: Number(rk[hk.indexOf("qty")]), refId: rk[hk.indexOf("id")] });
  }
  var opn = readTab_("Opname");
  var ho = opn.header;
  for (var k = 0; k < opn.rows.length; k++) {
    var ro = opn.rows[k];
    if (f.itemId && ro[ho.indexOf("itemId")] !== f.itemId) continue;
    if (f.dari && new Date(ro[ho.indexOf("tanggal")]) < new Date(f.dari)) continue;
    if (f.sampai && new Date(ro[ho.indexOf("tanggal")]) > new Date(f.sampai)) continue;
    out.push({ tanggal: ro[ho.indexOf("tanggal")], jenis: "koreksi", itemId: ro[ho.indexOf("itemId")], qty: Number(ro[ho.indexOf("koreksiStok")]), refId: ro[ho.indexOf("id")] });
  }
  out.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  return out;
}

function doOpname(payload) {
  guardOwner_();
  if (!payload || !payload.itemId) throw new Error("FK_WAJIB");
  if (!(Number(payload.fisik) >= 0)) throw new Error("FISIK_TIDAK_VALID");
  return lockWrap_(function () {
    var ctx = stokSemua_();
    if (!ctx.item.mapById[payload.itemId]) throw new Error("ITEM_TIDAK_ADA");
    var sistem = ctx.perItem[payload.itemId] ? ctx.perItem[payload.itemId].stok : 0;
    var now = new Date(payload.tanggal || new Date());
    var opn = readTab_("Opname");
    var id = "OPN-" + Utilities.getUuid();
    var baris = barisOpname(opn.header, { tanggal: now, itemId: payload.itemId, fisik: Number(payload.fisik), catatan: payload.catatan || "" }, sistem, id, now);
    appendRows_("Opname", [baris]);
    writeLog("doOpname", id, payload.itemId + ":" + payload.fisik);
    SpreadsheetApp.flush();
    var sel = selisihOpname(payload.fisik, sistem);
    return { id: id, sistem: sistem, selisih: sel.selisih };
  });
}

function getBatasStok() {
  guardOwner_();
  var data = readTab_("Item");
  var h = data.header;
  var out = [];
  for (var i = 0; i < data.rows.length; i++) {
    out.push({ itemId: data.rows[i][h.indexOf("id")], nama: data.rows[i][h.indexOf("nama")], batasStokMin: Number(data.rows[i][h.indexOf("batasStokMin")]) });
  }
  return out;
}

function setBatasStok(params) {
  guardOwner_();
  if (!params || !params.itemId) throw new Error("PARAM_TIDAK_VALID");
  if (!(Number(params.batas) >= 0)) throw new Error("BATAS_TIDAK_VALID");
  return lockWrap_(function () {
    var data = readTab_("Item");
    var info = data.mapById[params.itemId];
    if (!info) throw new Error("ITEM_TIDAK_ADA");
    var sh = ss_().getSheetByName("Item");
    sh.getRange(info.sheetRow, data.header.indexOf("batasStokMin") + 1).setValue(Number(params.batas));
    var updIdx = data.header.indexOf("updatedAt");
    if (updIdx >= 0) sh.getRange(info.sheetRow, updIdx + 1).setValue(new Date());
    writeLog("setBatasStok", params.itemId, String(params.batas));
    SpreadsheetApp.flush();
    return { itemId: params.itemId, batas: Number(params.batas) };
  });
}
