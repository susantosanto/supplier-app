// laporan.logic.gs — logic murni agregat kas, margin, omset & modal per periode (testable di Node).
// DSA: agregatKas/agregatMargin/agregatOmset/agregatModal — filter rentang + Σ O(n) sekali per
// request — n = baris 4 tab transaksi. Tanpa sort karena tak butuh urutan.

/* AWAS ZONA WAKTU: `new Date("2026-10-01")` di-parse sebagai TANGGAL UTC (00:00Z), sedangkan
   sel spreadsheet datang sebagai Date pada tengah malam WAKTU LOKAL. Di Asia/Jakarta两者bedanya
   7 jam, sehingga baris tepat tanggal 1 Oktober (00:00 WIB = 30 Sep 17:00 UTC) akan TERKECUALIKAN
   dari periode. Karena itu batas periode "YYYY-MM-DD" diurai MANUAL menjadi tengah malam lokal.
   (Helper kembar ada di beban.logic.gs sebagai awalRentangBeban_ — sengaja dinamai berbeda agar
   tak bentrok di scope global GAS; kedua nama diuji identik di test masing-masing.) */
function awalRentangLaporan_(s) {
  if (!s) return null;
  var t = String(s).trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  var d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

function dalamRentang_(tanggal, dari, sampai) {
  var t = new Date(tanggal).getTime();
  var a = awalRentangLaporan_(dari);
  var b = awalRentangLaporan_(sampai);
  if (isNaN(t)) return false;
  if (a && t < a.getTime()) return false;
  if (b) {
    var akhir = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999);
    if (t > akhir.getTime()) return false;
  }
  return true;
}

// rows: [{tanggal, jumlah}] — pembelianTunai pakai {tanggal, total} dipetakan caller.
function agregatKas(pembayaranJual, pembelianTunai, pembayaranBeli, dari, sampai) {
  var masuk = 0;
  for (var i = 0; i < pembayaranJual.length; i++) {
    if (dalamRentang_(pembayaranJual[i].tanggal, dari, sampai)) masuk += Number(pembayaranJual[i].jumlah);
  }
  var keluar = 0;
  for (var j = 0; j < pembelianTunai.length; j++) {
    if (dalamRentang_(pembelianTunai[j].tanggal, dari, sampai)) keluar += Number(pembelianTunai[j].total);
  }
  for (var k = 0; k < pembayaranBeli.length; k++) {
    if (dalamRentang_(pembayaranBeli[k].tanggal, dari, sampai)) keluar += Number(pembayaranBeli[k].jumlah);
  }
  return { masuk: masuk, keluar: keluar, saldo: masuk - keluar };
}

// rows: [{tanggal, itemId, margin}] — margin dari snapshot JBL, bukan hitung ulang.
function agregatMargin(pengirimanRows, dari, sampai) {
  var total = 0;
  var perItem = {};
  var count = 0;
  for (var i = 0; i < pengirimanRows.length; i++) {
    var r = pengirimanRows[i];
    if (!dalamRentang_(r.tanggal, dari, sampai)) continue;
    total += Number(r.margin);
    count += 1;
    perItem[r.itemId] = (perItem[r.itemId] || 0) + Number(r.margin);
  }
  return { total: total, perItem: perItem, jumlahPengiriman: count };
}

// Sprint 005: Omzet / HPP / Laba Kotor per periode.
// rows: [{tanggal, total, hpp, margin}] — semua dari snapshot baris Pengiriman (tanpa read ulang Item).
function agregatOmset(pengirimanRows, dari, sampai) {
  var omzet = 0;
  var hpp = 0;
  var labaKotor = 0;
  var jumlahKirim = 0;
  for (var i = 0; i < pengirimanRows.length; i++) {
    var r = pengirimanRows[i];
    if (!dalamRentang_(r.tanggal, dari, sampai)) continue;
    omzet += Number(r.total) || 0;
    hpp += Number(r.hpp) || 0;
    labaKotor += Number(r.margin) || 0;
    jumlahKirim += 1;
  }
  var marginPersen = omzet > 0 ? Math.round((labaKotor / omzet) * 10000) / 100 : 0;
  return {
    omzet: omzet,
    hpp: hpp,
    labaKotor: labaKotor,
    marginPersen: marginPersen,
    jumlahKirim: jumlahKirim
  };
}

// Sprint 005: Modal Belanja Stok per periode, dipecah tunai vs tempo.
// rows: [{tanggal, total, metode}]
function agregatModal(pembelianRows, dari, sampai) {
  var total = 0;
  var tunai = 0;
  var tempo = 0;
  var jumlahFaktur = 0;
  for (var i = 0; i < pembelianRows.length; i++) {
    var r = pembelianRows[i];
    if (!dalamRentang_(r.tanggal, dari, sampai)) continue;
    var n = Number(r.total) || 0;
    total += n;
    jumlahFaktur += 1;
    if (r.metode === "tempo") tempo += n;
    else tunai += n;
  }
  return { total: total, tunai: tunai, tempo: tempo, jumlahFaktur: jumlahFaktur };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    agregatKas: agregatKas,
    agregatMargin: agregatMargin,
    agregatOmset: agregatOmset,
    agregatModal: agregatModal
  };
}
