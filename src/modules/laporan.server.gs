// laporan.server.gs — adapter GAS untuk laporan kas, margin, laba & modal periode.
// DSA: laporan server — 1 batch read per tab + agregasi in-memory O(n) — tanpa rumus sel.
function getLaporanKas(filter) {
  guardOwner_();
  var f = filter || {};
  var kas = kasPeriode_(f.dari, f.sampai);
  kas.periode = { dari: f.dari || null, sampai: f.sampai || null };
  return kas;
}

// Faktorisasi: getLaporanKas & getLaporanLaba butuh arus kas yang sama.
// Tanpa ini, getLaporanLaba akan read 3 tab transaksi 2× (2× kuota baca).
function kasPeriode_(dari, sampai) {
  var masukRows = [];
  var jual = readTab_("PembayaranJual");
  var hj = jual.header;
  for (var i = 0; i < jual.rows.length; i++) {
    masukRows.push({ tanggal: jual.rows[i][hj.indexOf("tanggal")], jumlah: jual.rows[i][hj.indexOf("jumlah")] });
  }
  var tunaiRows = [];
  var beli = readTab_("Pembelian");
  var hb = beli.header;
  for (var j = 0; j < beli.rows.length; j++) {
    if (beli.rows[j][hb.indexOf("metode")] !== "tunai") continue;
    tunaiRows.push({ tanggal: beli.rows[j][hb.indexOf("tanggal")], total: beli.rows[j][hb.indexOf("total")] });
  }
  var bayarRows = [];
  var byr = readTab_("PembayaranBeli");
  var hy = byr.header;
  for (var k = 0; k < byr.rows.length; k++) {
    bayarRows.push({ tanggal: byr.rows[k][hy.indexOf("tanggal")], jumlah: byr.rows[k][hy.indexOf("jumlah")] });
  }
  return agregatKas(masukRows, tunaiRows, bayarRows, dari, sampai);
}

// Sprint 005: Laporan laba & modal satu periode.
// Omzet / HPP / Laba Kotor dari snapshot Pengiriman · Beban dari tab Beban ·
// Modal Belanja Stok dari Pembelian · Arus kas (Beban ikut counted sebagai keluar).
function getLaporanLaba(filter) {
  guardOwner_();
  var f = filter || {};
  var dari = f.dari || null;
  var sampai = f.sampai || null;

  var kirim = readTab_("Pengiriman");
  var hk = kirim.header;
  var rowsKirim = [];
  for (var i = 0; i < kirim.rows.length; i++) {
    var r = kirim.rows[i];
    rowsKirim.push({
      tanggal: r[hk.indexOf("tanggal")],
      itemId: r[hk.indexOf("itemId")],
      total: r[hk.indexOf("total")],
      hpp: r[hk.indexOf("hargaBeliPakai")],
      margin: r[hk.indexOf("margin")]
    });
  }
  var omset = agregatOmset(rowsKirim, dari, sampai);

  var beli = readTab_("Pembelian");
  var hb = beli.header;
  var rowsBeli = [];
  for (var j = 0; j < beli.rows.length; j++) {
    rowsBeli.push({
      tanggal: beli.rows[j][hb.indexOf("tanggal")],
      total: beli.rows[j][hb.indexOf("total")],
      metode: beli.rows[j][hb.indexOf("metode")]
    });
  }
  var modal = agregatModal(rowsBeli, dari, sampai);

  var beban = agregatBebanPeriode_(dari, sampai);
  var labaBersih = hitungLabaBersih(omset.labaKotor, beban.total);

  var kas = kasPeriode_(dari, sampai);
  var kasFinal = {
    masuk: kas.masuk,
    keluar: kas.keluar + beban.total,
    saldo: kas.masuk - (kas.keluar + beban.total),
    keluarBelanja: kas.keluar,
    keluarBeban: beban.total
  };

  // Per item: pakai agregatMargin (logika sama, sudah diuji Sprint 003).
  var margin = agregatMargin(rowsKirim, dari, sampai);
  var item = readTab_("Item");
  var hi = item.header;
  var perItem = {};
  for (var id in margin.perItem) {
    if (Object.prototype.hasOwnProperty.call(margin.perItem, id)) {
      perItem[id] = {
        nama: item.mapById[id] ? item.mapById[id].row[hi.indexOf("nama")] : id,
        margin: margin.perItem[id]
      };
    }
  }

  return {
    periode: { dari: dari, sampai: sampai },
    omzet: omset.omzet,
    hpp: omset.hpp,
    labaKotor: omset.labaKotor,
    marginPersen: omset.marginPersen,
    jumlahKirim: omset.jumlahKirim,
    bebanTotal: beban.total,
    bebanPerKategori: beban.perKategori,
    bebanJumlahCatatan: beban.jumlahCatatan,
    labaBersih: labaBersih,
    modal: modal,
    kas: kasFinal,
    perItem: perItem
  };
}

function getMargin(filter) {
  guardOwner_();
  var f = filter || {};
  var kirim = readTab_("Pengiriman");
  var h = kirim.header;
  var rows = [];
  for (var i = 0; i < kirim.rows.length; i++) {
    rows.push({ tanggal: kirim.rows[i][h.indexOf("tanggal")], itemId: kirim.rows[i][h.indexOf("itemId")], margin: kirim.rows[i][h.indexOf("margin")] });
  }
  var hasil = agregatMargin(rows, f.dari, f.sampai);
  var item = readTab_("Item");
  var hi = item.header;
  var perItem = {};
  for (var id in hasil.perItem) {
    if (Object.prototype.hasOwnProperty.call(hasil.perItem, id)) {
      perItem[id] = {
        nama: item.mapById[id] ? item.mapById[id].row[hi.indexOf("nama")] : id,
        margin: hasil.perItem[id]
      };
    }
  }
  return { total: hasil.total, perItem: perItem, jumlahPengiriman: hasil.jumlahPengiriman, periode: { dari: f.dari || null, sampai: f.sampai || null } };
}
