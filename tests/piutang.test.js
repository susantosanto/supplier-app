// Test T4.1: piutang logic murni (HPP, margin, jatuh tempo, FIFO, aging, validasi).
var pt = require("../src/modules/piutang.logic.gs");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + a + ", harap " + b + ")");
}

function mustThrow(fn, part, msg) {
  try {
    fn();
  } catch (e) {
    if (String(e.message).indexOf(part) < 0) throw new Error(msg + " (pesan: " + e.message + ")");
    return;
  }
  throw new Error(msg + " (tidak melempar)");
}

module.exports = {
  tests: [
    {
      name: "hitungHPPRataRata 2 pembelian berbobot",
      fn: function () {
        var hpp = pt.hitungHPPRataRata([{ total: 3000000, qty: 10 }, { total: 3200000, qty: 10 }]);
        eq(hpp, 310000, "HPP rata-rata berbobot");
      }
    },
    {
      name: "hitungHPPRataRata tanpa pembelian ditolak",
      fn: function () {
        mustThrow(function () { pt.hitungHPPRataRata([]); }, "HPP_TIDAK_ADA", "HPP kosong");
      }
    },
    {
      name: "hitungMargin 5x(350000-310000)",
      fn: function () {
        eq(pt.hitungMargin(5, 350000, 310000), 200000, "margin");
      }
    },
    {
      name: "hitungJatuhTempoPiutang default 14 hari",
      fn: function () {
        var jt = pt.hitungJatuhTempoPiutang(new Date("2026-10-20T00:00:00+07:00"), "", 14);
        eq(jt.getFullYear(), 2026, "tahun");
        eq(jt.getMonth(), 10, "bulan November (0-based)");
        eq(jt.getDate(), 3, "tanggal 3 November");
      }
    },
    {
      name: "alokasiPiutang FIFO penuh ke faktur tertua",
      fn: function () {
        var h = pt.alokasiPiutang([{ id: "PTB-1", sisa: 1000000 }, { id: "PTB-2", sisa: 2000000 }], 1000000);
        eq(h.length, 1, "satu alokasi");
        eq(h[0].id, "PTB-1", "faktur tertua dulu");
        eq(h[0].bayar, 1000000, "penuh F1");
      }
    },
    {
      name: "alokasiPiutang sebagian lintas 2 faktur",
      fn: function () {
        var h = pt.alokasiPiutang([{ id: "PTB-1", sisa: 1000000 }, { id: "PTB-2", sisa: 2000000 }], 1500000);
        eq(h.length, 2, "dua alokasi");
        eq(h[0].bayar, 1000000, "F1 habis");
        eq(h[1].bayar, 500000, "F2 sebagian");
      }
    },
    {
      name: "alokasiPiutang menolak melebihi sisa",
      fn: function () {
        mustThrow(function () { pt.alokasiPiutang([{ id: "PTB-1", sisa: 500000 }], 999000000); }, "MELEBIHI_SISA", "overpay");
      }
    },
    {
      name: "bucketAging batas 7/8/30/31",
      fn: function () {
        eq(pt.bucketAging(7), "0-7", "umur 7");
        eq(pt.bucketAging(8), "8-30", "umur 8");
        eq(pt.bucketAging(30), "8-30", "umur 30");
        eq(pt.bucketAging(31), ">30", "umur 31");
      }
    },
    {
      name: "hitungMargin menolak qty 0 dan harga 0",
      fn: function () {
        mustThrow(function () { pt.hitungMargin(0, 350000, 310000); }, "QTY_TIDAK_VALID", "qty 0");
        mustThrow(function () { pt.hitungMargin(5, 0, 310000); }, "HARGA_TIDAK_VALID", "harga 0");
      }
    }
  ]
};
