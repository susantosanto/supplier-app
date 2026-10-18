// pembelian.server.gs — adapter GAS untuk pembelian & hutang toko.
// DSA: append + Map update hargaBeli — tulis O(1) amortized per baris — input harian kecil, tanpa scan berulang.
// DSA: alokasiHutang — sort faktur terbuka O(F log F), alokasi O(F) — F = faktur tempo per toko (<100), sekali per pembayaran.
// DSA: scan faktur + akumulasi per toko O(n) sekali per request — n = baris pembelian, dibaca batch 1x.
function configMap_() {
  var data = readTab_("Config");
  var keyIdx = data.header.indexOf("key");
  var valIdx = data.header.indexOf("value");
  var map = {};
  for (var i = 0; i < data.rows.length; i++) {
    map[data.rows[i][keyIdx]] = data.rows[i][valIdx];
  }
  return map;
}

function createPembelian(payload) {
  guardOwner_();
  if (!payload || !payload.tokoId || !payload.itemId) throw new Error("FK_WAJIB");
  if (payload.metode !== "tunai" && payload.metode !== "tempo") throw new Error("METODE_TIDAK_VALID");
  return lockWrap_(function () {
    var toko = readTab_("Toko");
    var item = readTab_("Item");
    var tokoInfo = toko.mapById[payload.tokoId];
    var itemInfo = item.mapById[payload.itemId];
    if (!tokoInfo) throw new Error("TOKO_TIDAK_ADA");
    if (!itemInfo) throw new Error("ITEM_TIDAK_ADA");
    var aktifToko = tokoInfo.row[toko.header.indexOf("aktif")];
    var aktifItem = itemInfo.row[item.header.indexOf("aktif")];
    if (aktifToko === false) throw new Error("TOKO_NONAKTIF");
    if (aktifItem === false) throw new Error("ITEM_NONAKTIF");
    var cfg = configMap_();
    var tempoDefault = Number(cfg.TEMPO_DEFAULT_HARI || 14);
    var tempoToko = tokoInfo.row[toko.header.indexOf("tempoHari")];
    var now = new Date();
    var tanggal = payload.tanggal ? new Date(payload.tanggal) : now;
    var jatuhTempo = hitungJatuhTempo(tanggal, payload.metode, tempoToko, tempoDefault);
    var beli = readTab_("Pembelian");
    var id = "BLI-" + Utilities.getUuid();
    var full = {
      tanggal: tanggal,
      tokoId: payload.tokoId,
      itemId: payload.itemId,
      qty: payload.qty,
      satuan: payload.satuan,
      hargaBeli: payload.hargaBeli,
      metode: payload.metode,
      jatuhTempo: jatuhTempo || ""
    };
    var baris = barisPembelian(beli.header, full, id, now);
    appendRows_("Pembelian", [baris]);
    var shItem = ss_().getSheetByName("Item");
    shItem.getRange(itemInfo.sheetRow, item.header.indexOf("hargaBeliTerakhir") + 1).setValue(Number(payload.hargaBeli));
    writeLog("createPembelian", id, payload.tokoId + "/" + payload.itemId);
    SpreadsheetApp.flush();
    return { id: id };
  });
}

function listPembelian(filter) {
  guardOwner_();
  var f = filter || {};
  var data = readTab_("Pembelian");
  var h = data.header;
  var tglIdx = h.indexOf("tanggal");
  var tokoIdx = h.indexOf("tokoId");
  var out = [];
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (f.tokoId && r[tokoIdx] !== f.tokoId) continue;
    if (f.dari && new Date(r[tglIdx]) < new Date(f.dari)) continue;
    if (f.sampai && new Date(r[tglIdx]) > new Date(f.sampai)) continue;
    out.push(r);
  }
  return out;
}

function fakturTerbukaToko_(tokoId) {
  var data = readTab_("Pembelian");
  var h = data.header;
  var out = [];
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    var isToko = r[h.indexOf("tokoId")] === tokoId;
    var isTempo = r[h.indexOf("metode")] === "tempo";
    var status = r[h.indexOf("statusBayar")];
    if (isToko && isTempo && (status === "belum" || status === "sebagian")) {
      var total = Number(r[h.indexOf("total")]);
      var dibayar = totalDibayarFaktur_(r[h.indexOf("id")]);
      out.push({ id: r[h.indexOf("id")], tanggal: r[h.indexOf("tanggal")], total: total, sisa: total - dibayar, sheetRow: i + 2 });
    }
  }
  out.sort(function (a, b) { return new Date(a.tanggal) - new Date(b.tanggal); });
  return { beli: data, faktur: out };
}

function totalDibayarFaktur_(pembelianId) {
  var data = readTab_("PembayaranBeli");
  var h = data.header;
  var total = 0;
  for (var i = 0; i < data.rows.length; i++) {
    if (data.rows[i][h.indexOf("pembelianId")] === pembelianId) {
      total += Number(data.rows[i][h.indexOf("jumlah")]);
    }
  }
  return total;
}

function bayarHutang(params) {
  guardOwner_();
  if (!params || !params.tokoId || !(Number(params.jumlah) > 0)) throw new Error("PARAM_TIDAK_VALID");
  return lockWrap_(function () {
    var ctx = fakturTerbukaToko_(params.tokoId);
    var target = ctx.faktur;
    if (params.pembelianId) {
      target = ctx.faktur.filter(function (f) { return f.id === params.pembelianId; });
      if (target.length === 0) throw new Error("FAKTUR_TIDAK_ADA");
    }
    var alokasiInput = [];
    for (var i = 0; i < target.length; i++) {
      alokasiInput.push({ id: target[i].id, sisa: target[i].sisa });
    }
    var alokasi = alokasiHutang(alokasiInput, Number(params.jumlah));
    if (params.pembayaranId) {
      var cek = readTab_("PembayaranBeli");
      if (cek.mapById[params.pembayaranId]) return { id: params.pembayaranId, idempoten: true };
    }
    var now = new Date(params.tanggal || new Date());
    var barisBayar = [];
    for (var j = 0; j < alokasi.length; j++) {
      barisBayar.push([params.pembayaranId || ("PBY-" + Utilities.getUuid()), alokasi[j].id, now, Number(alokasi[j].bayar), now]);
    }
    appendRows_("PembayaranBeli", barisBayar);
    var sh = ss_().getSheetByName("Pembelian");
    var h = ctx.beli.header;
    var statusIdx = h.indexOf("statusBayar");
    for (var k = 0; k < target.length; k++) {
      var dibayar = 0;
      for (var m = 0; m < alokasi.length; m++) {
        if (alokasi[m].id === target[k].id) dibayar = alokasi[m].bayar;
      }
      if (dibayar <= 0) continue;
      var sisaBaru = Number(target[k].sisa) - dibayar;
      var statusBaru = sisaBaru <= 0 ? "lunas" : "sebagian";
      sh.getRange(target[k].sheetRow, statusIdx + 1).setValue(statusBaru);
    }
    writeLog("bayarHutang", params.tokoId, String(params.jumlah));
    SpreadsheetApp.flush();
    return { alokasi: alokasi };
  });
}

function getHutangToko() {
  guardOwner_();
  var beli = readTab_("Pembelian");
  var h = beli.header;
  var toko = readTab_("Toko");
  var namaIdx = toko.header.indexOf("nama");
  var item = readTab_("Item");
  var itemNamaIdx = item.header.indexOf("nama");
  var hasil = [];
  var tokoIds = {};
  for (var i = 0; i < beli.rows.length; i++) {
    var r = beli.rows[i];
    if (r[h.indexOf("metode")] !== "tempo") continue;
    var status = r[h.indexOf("statusBayar")];
    if (status !== "belum" && status !== "sebagian") continue;
    var id = r[h.indexOf("id")];
    var total = Number(r[h.indexOf("total")]);
    var sisa = total - totalDibayarFaktur_(id);
    if (!(sisa > 0)) continue;
    var tid = r[h.indexOf("tokoId")];
    var iid = r[h.indexOf("itemId")];
    var tanggal = r[h.indexOf("tanggal")];
    if (!tokoIds[tid]) {
      tokoIds[tid] = {
        tokoId: tid,
        toko: toko.mapById[tid] ? toko.mapById[tid].row[namaIdx] : tid,
        totalSisa: 0,
        jumlahFaktur: 0,
        tertuaTanggal: tanggal,
        faktur: []
      };
    }
    tokoIds[tid].totalSisa += sisa;
    tokoIds[tid].jumlahFaktur += 1;
    if (new Date(tanggal) < new Date(tokoIds[tid].tertuaTanggal)) {
      tokoIds[tid].tertuaTanggal = tanggal;
    }
    // Sprint 005: rincian per faktur — pemilik bisa lihat & bayar sisa yang tepat.
    tokoIds[tid].faktur.push({
      id: id,
      tanggal: tanggal,
      jatuhTempo: r[h.indexOf("jatuhTempo")],
      itemId: iid,
      item: item.mapById[iid] ? item.mapById[iid].row[itemNamaIdx] : iid,
      qty: Number(r[h.indexOf("qty")]),
      satuan: r[h.indexOf("satuan")],
      total: total,
      sisa: sisa,
      status: status
    });
  }
  for (var k in tokoIds) {
    if (Object.prototype.hasOwnProperty.call(tokoIds, k)) {
      var t = tokoIds[k];
      // FIFO: faktur tertua dulu — urutan sama dengan alokasi bayarHutang.
      t.faktur.sort(function (a, b) { return new Date(a.tanggal) - new Date(b.tanggal); });
      t.terlambat = t.faktur.some(function (f) {
        return f.jatuhTempo && new Date(f.jatuhTempo) < new Date();
      });
      hasil.push(t);
    }
  }
  hasil.sort(function (a, b) { return Number(b.totalSisa) - Number(a.totalSisa); });
  return hasil;
}

// Histori belanja: semua baris pembelian + nama + sisa (tempo) — terbaru dulu.
function getHistoriBelanja() {
  guardOwner_();
  var beli = readTab_("Pembelian");
  var h = beli.header;
  var toko = readTab_("Toko");
  var item = readTab_("Item");
  var nt = toko.header.indexOf("nama");
  var ni = item.header.indexOf("nama");
  var out = [];
  for (var i = 0; i < beli.rows.length; i++) {
    var r = beli.rows[i];
    var id = r[h.indexOf("id")];
    var total = Number(r[h.indexOf("total")]);
    var metode = r[h.indexOf("metode")];
    var status = r[h.indexOf("statusBayar")] || (metode === "tempo" ? "belum" : "lunas");
    var sisa = metode === "tempo" ? total - totalDibayarFaktur_(id) : 0;
    if (!(sisa >= 0)) sisa = 0;
    var tid = r[h.indexOf("tokoId")];
    var iid = r[h.indexOf("itemId")];
    out.push({
      id: id,
      tanggal: r[h.indexOf("tanggal")],
      tokoId: tid,
      toko: toko.mapById[tid] ? toko.mapById[tid].row[nt] : tid,
      itemId: iid,
      item: item.mapById[iid] ? item.mapById[iid].row[ni] : iid,
      qty: Number(r[h.indexOf("qty")]),
      satuan: r[h.indexOf("satuan")],
      hargaBeli: Number(r[h.indexOf("hargaBeli")]),
      total: total,
      metode: metode,
      statusBayar: status,
      sisa: sisa
    });
  }
  out.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  return out;
}

