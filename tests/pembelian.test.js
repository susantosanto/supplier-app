// Test T3.1 + T3.3: pembelian logic murni + alokasi hutang.
var pb = require("../src/modules/pembelian.logic.gs");

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
      name: "hitungPembelian tunai 5x300000",
      fn: function () {
        eq(pb.hitungPembelian(5, 300000), 1500000, "total tunai");
      }
    },
    {
      name: "hitungJatuhTempo tempo toko 7 hari",
      fn: function () {
        var jt = pb.hitungJatuhTempo(new Date("2026-10-11T00:00:00+07:00"), "tempo", 7, 14);
        eq(jt.getDate(), 18, "jatuh tempo +7");
      }
    },
    {
      name: "hitungJatuhTempo tempo tanpa tempo toko pakai default 14",
      fn: function () {
        var jt = pb.hitungJatuhTempo(new Date("2026-10-11T00:00:00+07:00"), "tempo", "", 14);
        eq(jt.getDate(), 25, "jatuh tempo +14");
      }
    },
    {
      name: "hitungJatuhTempo tunai null",
      fn: function () {
        eq(pb.hitungJatuhTempo(new Date(), "tunai", 7, 14), null, "tunai null");
      }
    },
    {
      name: "hitungPembelian menolak qty 0",
      fn: function () {
        mustThrow(function () { pb.hitungPembelian(0, 1000); }, "QTY_TIDAK_VALID", "qty 0");
      }
    },
    {
      name: "hitungPembelian menolak harga 0",
      fn: function () {
        mustThrow(function () { pb.hitungPembelian(3, 0); }, "HARGA_TIDAK_VALID", "harga 0");
      }
    },
    {
      name: "alokasiHutang penuh + sebagian",
      fn: function () {
        var h = pb.alokasiHutang([{ id: "BLI-1", sisa: 3100000 }], 1550000);
        eq(h.length, 1, "satu alokasi");
        eq(h[0].bayar, 1550000, "sebagian 50%");
      }
    },
    {
      name: "alokasiHutang menolak melebihi sisa",
      fn: function () {
        mustThrow(function () { pb.alokasiHutang([{ id: "BLI-1", sisa: 1550000 }], 2000000); }, "MELEBIHI_SISA", "overpay");
      }
    }
  ]
};
