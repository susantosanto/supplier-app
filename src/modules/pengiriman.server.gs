// pengiriman.server.gs — adapter GAS untuk pengiriman & piutang SPPG.
// DSA: stokItem_ + hppItem_ — scan 3 tab batch O(n) sekali per request — n = baris transaksi, dibaca 1x per tab.
// DSA: update sisa/status batch — 1 baca + 1 tulis per faktur terdampak O(F) — F kecil, tanpa scan berulang.
// DSA: agregasi aging — scan PiutangBaris + akumulasi per SPPG O(n) sekali per request — n = baris piutang, batch 1x.
function stokItem_(itemId) {
  var masuk = 0;
  var beli = readTab_("Pembelian");
  var hb = beli.header;
  for (var i = 0; i < beli.rows.length; i++) {
    if (beli.rows[i][hb.indexOf("itemId")] === itemId) masuk += Number(beli.rows[i][hb.indexOf("qty")]);
  }
  var keluar = 0;
  var kirim = readTab_("Pengiriman");
  var hk = kirim.header;
  for (var j = 0; j < kirim.rows.length; j++) {
    if (kirim.rows[j][hk.indexOf("itemId")] === itemId) keluar += Number(kirim.rows[j][hk.indexOf("qty")]);
  }
  var koreksi = 0;
  var opn = readTab_("Opname");
  var ho = opn.header;
  for (var k = 0; k < opn.rows.length; k++) {
    if (opn.rows[k][ho.indexOf("itemId")] === itemId) koreksi += Number(opn.rows[k][ho.indexOf("koreksiStok")]);
  }
  return masuk - keluar + koreksi;
}

function hppItem_(itemId) {
  var beli = readTab_("Pembelian");
  var h = beli.header;
  var rows = [];
  for (var i = 0; i < beli.rows.length; i++) {
    if (beli.rows[i][h.indexOf("itemId")] === itemId) {
      rows.push({ total: beli.rows[i][h.indexOf("total")], qty: beli.rows[i][h.indexOf("qty")] });
    }
  }
  return hitungHPPRataRata(rows);
}

function createPengiriman(payload) {
  guardOwner_();
  if (!payload || !payload.sppgId || !payload.itemId) throw new Error("FK_WAJIB");
  if (!(Number(payload.qty) > 0)) throw new Error("QTY_TIDAK_VALID");
  if (!(Number(payload.hargaJual) > 0)) throw new Error("HARGA_TIDAK_VALID");
  return lockWrap_(function () {
    var sppg = readTab_("SPPG");
    var item = readTab_("Item");
    var sppgInfo = sppg.mapById[payload.sppgId];
    var itemInfo = item.mapById[payload.itemId];
    if (!sppgInfo) throw new Error("SPPG_TIDAK_ADA");
    if (!itemInfo) throw new Error("ITEM_TIDAK_ADA");
    if (sppgInfo.row[sppg.header.indexOf("aktif")] === false) throw new Error("SPPG_NONAKTIF");
    if (itemInfo.row[item.header.indexOf("aktif")] === false) throw new Error("ITEM_NONAKTIF");
    if (payload.satuan && payload.satuan !== itemInfo.row[item.header.indexOf("satuanDasar")]) throw new Error("SATUAN_TIDAK_COCOK");
    var cfg = configMap_();
    var tempoDefault = Number(cfg.TEMPO_DEFAULT_HARI || 14);
    var tempoSppg = sppgInfo.row[sppg.header.indexOf("tempoHari")];
    var now = new Date();
    var tanggal = payload.tanggal ? new Date(payload.tanggal) : now;
    var qty = Number(payload.qty);
    var stok = stokItem_(payload.itemId);
    if (stok < qty && !payload.catatanOverride) throw new Error("STOK_KURANG");
    var hpp = hppItem_(payload.itemId);
    var total = qty * Number(payload.hargaJual);
    var margin = hitungMargin(qty, payload.hargaJual, hpp);
    var jatuhTempo = hitungJatuhTempoPiutang(tanggal, tempoSppg, tempoDefault);
    var kirim = readTab_("Pengiriman");
    var id = "JBL-" + Utilities.getUuid();
    var full = {
      tanggal: tanggal,
      sppgId: payload.sppgId,
      itemId: payload.itemId,
      qty: qty,
      satuan: payload.satuan || itemInfo.row[item.header.indexOf("satuanDasar")],
      hargaJual: Number(payload.hargaJual),
      catatanOverride: payload.catatanOverride || ""
    };
    appendRows_("Pengiriman", [barisPengiriman(kirim.header, full, id, now, hpp)]);
    var ptb = readTab_("PiutangBaris");
    var idPTB = "PTB-" + Utilities.getUuid();
    appendRows_("PiutangBaris", [barisPiutang(ptb.header, id, payload.sppgId, tanggal, jatuhTempo, total, idPTB)]);
    var shItem = ss_().getSheetByName("Item");
    shItem.getRange(itemInfo.sheetRow, item.header.indexOf("hargaJualTerakhir") + 1).setValue(Number(payload.hargaJual));
    writeLog("createPengiriman", id, payload.sppgId + "/" + payload.itemId);
    SpreadsheetApp.flush();
    return { id: id, piutangId: idPTB, margin: margin, stokSisa: stok - qty };
  });
}

function fakturTerbukaSppg_(sppgId) {
  var data = readTab_("PiutangBaris");
  var h = data.header;
  var out = [];
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    var status = r[h.indexOf("status")];
    if (r[h.indexOf("sppgId")] === sppgId && (status === "terbuka" || status === "sebagian") && Number(r[h.indexOf("sisa")]) > 0) {
      out.push({ id: r[h.indexOf("id")], pengirimanId: r[h.indexOf("pengirimanId")], tanggal: r[h.indexOf("tanggal")], jatuhTempo: r[h.indexOf("jatuhTempo")], nominal: Number(r[h.indexOf("nominal")]), sisa: Number(r[h.indexOf("sisa")]), sheetRow: i + 2 });
    }
  }
  out.sort(function (a, b) {
    var t = new Date(a.tanggal) - new Date(b.tanggal);
    if (t !== 0) return t;
    var j = new Date(a.jatuhTempo) - new Date(b.jatuhTempo);
    if (j !== 0) return j;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
  return { ptb: data, faktur: out };
}

function bayarPiutang(params) {
  guardOwner_();
  if (!params || !params.sppgId || !(Number(params.jumlah) > 0)) throw new Error("PARAM_TIDAK_VALID");
  return lockWrap_(function () {
    var ctx = fakturTerbukaSppg_(params.sppgId);
    var target = ctx.faktur;
    if (params.pengirimanId) {
      target = ctx.faktur.filter(function (f) { return f.pengirimanId === params.pengirimanId; });
      if (target.length === 0) throw new Error("FAKTUR_TIDAK_ADA");
    }
    var alokasiInput = [];
    for (var i = 0; i < target.length; i++) {
      alokasiInput.push({ id: target[i].id, sisa: target[i].sisa });
    }
    if (params.pembayaranId) {
      var cek = readTab_("PembayaranJual");
      if (cek.mapById[params.pembayaranId]) return { id: params.pembayaranId, idempoten: true };
    }
    var alokasi = alokasiPiutang(alokasiInput, Number(params.jumlah));
    var now = new Date(params.tanggal || new Date());
    var id = params.pembayaranId || ("PYJ-" + Utilities.getUuid());
    var peta = {};
    for (var j = 0; j < alokasi.length; j++) peta[alokasi[j].id] = alokasi[j].bayar;
    appendRows_("PembayaranJual", [[id, params.sppgId, now, Number(params.jumlah), JSON.stringify(peta), now]]);
    var sh = ss_().getSheetByName("PiutangBaris");
    var h = ctx.ptb.header;
    var sisaIdx = h.indexOf("sisa");
    var statusIdx = h.indexOf("status");
    for (var k = 0; k < target.length; k++) {
      var dibayar = peta[target[k].id] || 0;
      if (dibayar <= 0) continue;
      var sisaBaru = Number(target[k].sisa) - dibayar;
      sh.getRange(target[k].sheetRow, sisaIdx + 1).setValue(sisaBaru);
      sh.getRange(target[k].sheetRow, statusIdx + 1).setValue(sisaBaru <= 0 ? "lunas" : "sebagian");
    }
    writeLog("bayarPiutang", params.sppgId, String(params.jumlah));
    SpreadsheetApp.flush();
    return { id: id, alokasi: alokasi };
  });
}

function getPiutang(sppgId) {
  guardOwner_();
  var data = readTab_("PiutangBaris");
  var h = data.header;
  var sppg = readTab_("SPPG");
  var namaIdx = sppg.header.indexOf("nama");
  var hariIni = new Date();
  var grup = {};
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    var status = r[h.indexOf("status")];
    if (status !== "terbuka" && status !== "sebagian") continue;
    var sid = r[h.indexOf("sppgId")];
    if (sppgId && sid !== sppgId) continue;
    var sisa = Number(r[h.indexOf("sisa")]);
    if (!(sisa > 0)) continue;
    if (!grup[sid]) {
      grup[sid] = { sppgId: sid, sppg: sppg.mapById[sid] ? sppg.mapById[sid].row[namaIdx] : sid, totalSisa: 0, jumlahTerbuka: 0, bucket: { "0-7": 0, "8-30": 0, ">30": 0 }, tertuaTanggal: r[h.indexOf("tanggal")], faktur: [] };
    }
    var umur = umurHari(r[h.indexOf("tanggal")], hariIni);
    grup[sid].totalSisa += sisa;
    grup[sid].jumlahTerbuka += 1;
    grup[sid].bucket[bucketAging(umur)] += sisa;
    grup[sid].faktur.push({ id: r[h.indexOf("id")], pengirimanId: r[h.indexOf("pengirimanId")], tanggal: r[h.indexOf("tanggal")], jatuhTempo: r[h.indexOf("jatuhTempo")], nominal: Number(r[h.indexOf("nominal")]), sisa: sisa, umur: umur });
    if (new Date(r[h.indexOf("tanggal")]) < new Date(grup[sid].tertuaTanggal)) {
      grup[sid].tertuaTanggal = r[h.indexOf("tanggal")];
    }
  }
  var hasil = [];
  for (var k in grup) {
    if (Object.prototype.hasOwnProperty.call(grup, k)) hasil.push(grup[k]);
  }
  return hasil;
}

function listPengiriman(filter) {
  guardOwner_();
  var f = filter || {};
  var data = readTab_("Pengiriman");
  var h = data.header;
  var ptb = readTab_("PiutangBaris");
  var hp = ptb.header;
  var statusMap = {};
  for (var i = 0; i < ptb.rows.length; i++) {
    statusMap[ptb.rows[i][hp.indexOf("pengirimanId")]] = ptb.rows[i][hp.indexOf("status")];
  }
  var out = [];
  for (var j = 0; j < data.rows.length; j++) {
    var r = data.rows[j];
    if (f.sppgId && r[h.indexOf("sppgId")] !== f.sppgId) continue;
    if (f.dari && new Date(r[h.indexOf("tanggal")]) < new Date(f.dari)) continue;
    if (f.sampai && new Date(r[h.indexOf("tanggal")]) > new Date(f.sampai)) continue;
    out.push({
      id: r[h.indexOf("id")],
      tanggal: r[h.indexOf("tanggal")],
      sppgId: r[h.indexOf("sppgId")],
      itemId: r[h.indexOf("itemId")],
      qty: Number(r[h.indexOf("qty")]),
      satuan: r[h.indexOf("satuan")],
      hargaJual: Number(r[h.indexOf("hargaJual")]),
      total: Number(r[h.indexOf("total")]),
      margin: Number(r[h.indexOf("margin")]),
      statusBayar: statusMap[r[h.indexOf("id")]] || "tak-ada-piutang"
    });
  }
  out.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  return out;
}

// Histori kirim: list pengiriman + nama SPPG/item — terbaru dulu.
function getHistoriKirim() {
  guardOwner_();
  var daftar = listPengiriman({});
  var sppg = readTab_("SPPG");
  var item = readTab_("Item");
  var ns = sppg.header.indexOf("nama");
  var ni = item.header.indexOf("nama");
  for (var i = 0; i < daftar.length; i++) {
    var d = daftar[i];
    d.sppg = sppg.mapById[d.sppgId] ? sppg.mapById[d.sppgId].row[ns] : d.sppgId;
    d.item = item.mapById[d.itemId] ? item.mapById[d.itemId].row[ni] : d.itemId;
  }
  return daftar;
}
