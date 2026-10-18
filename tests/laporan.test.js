// Test T6.1: laporan logic murni.
var lp = require("../src/modules/laporan.logic.gs");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + a + ", harap " + b + ")");
}

module.exports = {
  tests: [
    {
      name: "agregatKas masuk-keluar-saldo",
      fn: function () {
        var r = lp.agregatKas(
          [{ tanggal: "2026-10-20", jumlah: 875000 }],
          [{ tanggal: "2026-10-18", total: 3000000 }],
          [{ tanggal: "2026-10-21", jumlah: 875000 }]
        );
        eq(r.masuk, 875000, "masuk");
        eq(r.keluar, 3875000, "keluar");
        eq(r.saldo, -3000000, "saldo");
      }
    },
    {
      name: "agregatKas filter rentang tanggal",
      fn: function () {
        var r = lp.agregatKas(
          [{ tanggal: "2026-10-20", jumlah: 875000 }],
          [{ tanggal: "2026-09-01", total: 999999 }],
          [],
          "2026-10-01", "2026-10-31"
        );
        eq(r.masuk, 875000, "masuk periode");
        eq(r.keluar, 0, "tunai lama dikecualikan");
      }
    },
    {
      name: "agregatMargin total + per item",
      fn: function () {
        var r = lp.agregatMargin([
          { tanggal: "2026-10-20", itemId: "ITM-1", margin: 200000 },
          { tanggal: "2026-10-21", itemId: "ITM-1", margin: 140000 }
        ]);
        eq(r.total, 340000, "total");
        eq(r.jumlahPengiriman, 2, "count");
        eq(r.perItem["ITM-1"], 340000, "per item");
      }
    },
    {
      // Sprint 005 E13: 5 x (jual 350.000, HPP 310.000)
      name: "agregatOmset omzet + HPP + laba kotor + margin persen",
      fn: function () {
        var rows = [];
        for (var i = 0; i < 5; i++) {
          rows.push({ tanggal: "2026-10-20", total: 350000, hpp: 310000, margin: 40000 });
        }
        var r = lp.agregatOmset(rows, "2026-10-01", "2026-10-31");
        eq(r.omzet, 1750000, "omzet");
        eq(r.hpp, 1550000, "hpp");
        eq(r.labaKotor, 200000, "laba kotor");
        eq(r.jumlahKirim, 5, "jumlah kirim");
        eq(r.marginPersen, 11.43, "margin persen 200.000/1.750.000");
      }
    },
    {
      name: "agregatOmset filter rentang + margin persen 0 saat omzet nol",
      fn: function () {
        var rows = [
          { tanggal: "2026-09-01", total: 999999, hpp: 1, margin: 999998 },
          { tanggal: "2026-10-05", total: 100000, hpp: 60000, margin: 40000 }
        ];
        var r = lp.agregatOmset(rows, "2026-10-01", "2026-10-31");
        eq(r.omzet, 100000, "omzet periode saja");
        eq(r.jumlahKirim, 1, "satu kirim");
        var nol = lp.agregatOmset([], "2026-10-01", "2026-10-31");
        eq(nol.marginPersen, 0, "tanpa bagi nol");
        eq(nol.omzet, 0, "omzet 0");
      }
    },
    {
      // Sprint 005 E17
      name: "agregatModal Belanja Stok pecah tunai + tempo",
      fn: function () {
        var r = lp.agregatModal([
          { tanggal: "2026-10-02", total: 300000, metode: "tunai" },
          { tanggal: "2026-10-03", total: 1000000, metode: "tempo" },
          { tanggal: "2026-10-04", total: 550000, metode: "tempo" },
          { tanggal: "2026-09-01", total: 777777, metode: "tunai" }
        ], "2026-10-01", "2026-10-31");
        eq(r.total, 1850000, "total modal");
        eq(r.tunai, 300000, "tunai");
        eq(r.tempo, 1550000, "tempo");
        eq(r.jumlahFaktur, 3, "tiga faktur dalam periode");
      }
    },
    {
      // Regresi zona waktu: batas "2026-10-01" harus tengah malam LOKAL, bukan UTC.
      // Kalau UTC, baris 1 Okt 00:00 WIB (= 30 Sep 17:00Z) terlewat dari periode.
      name: "agregatOmset inklusif batas awal & akhir periode (tidak geser zona waktu)",
      fn: function () {
        var rows = [
          { tanggal: new Date(2026, 9, 1, 0, 0, 0), total: 222, hpp: 0, margin: 222 },
          { tanggal: new Date(2026, 9, 31, 23, 59, 59), total: 333, hpp: 0, margin: 333 },
          { tanggal: new Date(2026, 9, 5, 6, 0, 0), total: 100, hpp: 0, margin: 100 }
        ];
        var r = lp.agregatOmset(rows, "2026-10-01", "2026-10-31");
        eq(r.omzet, 655, "tiga baris di dalam rentang");
        var lu = lp.agregatOmset([{ tanggal: new Date(2026, 10, 1, 0, 0, 0), total: 999, hpp: 0, margin: 999 }],
          "2026-10-01", "2026-10-31");
        eq(lu.omzet, 0, "1 Nov di luar periode Okt");
        var se = lp.agregatOmset([{ tanggal: new Date(2026, 8, 30, 23, 0, 0), total: 999, hpp: 0, margin: 999 }],
          "2026-10-01", "2026-10-31");
        eq(se.omzet, 0, "30 Sep di luar periode Okt");
      }
    }
  ]
};
