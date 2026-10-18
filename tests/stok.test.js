// Test T5.1: stok logic murni.
var st = require("../src/modules/stok.logic.gs");

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

var HEADER_OPNAME = ["id", "tanggal", "itemId", "fisik", "sistem", "selisih", "koreksiStok", "catatan", "createdAt"];

module.exports = {
  tests: [
    {
      name: "hitungStok 20-5+2=17",
      fn: function () {
        eq(st.hitungStok(20, 5, 2), 17, "stok");
      }
    },
    {
      name: "selisihOpname susut -2",
      fn: function () {
        var s = st.selisihOpname(13, 15);
        eq(s.selisih, -2, "selisih");
        eq(s.koreksiStok, -2, "koreksi");
      }
    },
    {
      name: "selisihOpname lebih +3",
      fn: function () {
        eq(st.selisihOpname(18, 15).selisih, 3, "selisih positif");
      }
    },
    {
      name: "selisihOpname menolak fisik negatif",
      fn: function () {
        mustThrow(function () { st.selisihOpname(-1, 15); }, "FISIK_TIDAK_VALID", "fisik negatif");
      }
    },
    {
      name: "barisOpname susun kolom OPN",
      fn: function () {
        var now = new Date("2026-10-15T00:00:00+07:00");
        var r = st.barisOpname(HEADER_OPNAME, { itemId: "ITM-1", fisik: 13, catatan: "susut" }, 15, "OPN-1", now);
        eq(r[HEADER_OPNAME.indexOf("id")], "OPN-1", "id");
        eq(r[HEADER_OPNAME.indexOf("fisik")], 13, "fisik");
        eq(r[HEADER_OPNAME.indexOf("sistem")], 15, "sistem");
        eq(r[HEADER_OPNAME.indexOf("selisih")], -2, "selisih");
        eq(r[HEADER_OPNAME.indexOf("koreksiStok")], -2, "koreksi");
      }
    }
  ]
};
