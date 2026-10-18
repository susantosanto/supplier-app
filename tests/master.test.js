// Test T1.2: header init + T2.1: master logic murni.
var master = require("../src/modules/master.logic.gs");

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
      name: "validasiToko menolak nama kosong",
      fn: function () {
        mustThrow(function () { master.validasiToko({}); }, "FIELD_WAJIB", "toko kosong");
      }
    },
    {
      name: "validasiToko menerima payload valid",
      fn: function () {
        eq(master.validasiToko({ nama: "Toko Uji" }), true, "toko valid");
      }
    },
    {
      name: "namaUnik menolak duplikat case-insensitive",
      fn: function () {
        var rows = [["TK-1", "Toko Uji"]];
        mustThrow(function () { master.namaUnik(rows, 1, "TOKO UJI", null, 0); }, "NAMA_DUPLIKAT", "duplikat");
      }
    },
    {
      name: "validasiItem menolak satuan salah",
      fn: function () {
        mustThrow(function () { master.validasiItem({ nama: "Beras", satuanDasar: "karung", batasStokMin: 1 }); }, "SATUAN_TIDAK_VALID", "satuan");
      }
    },
    {
      name: "barisMaster susun kolom + aktif default TRUE",
      fn: function () {
        var header = ["id", "nama", "aktif", "createdAt", "updatedAt"];
        var now = new Date("2026-10-11T00:00:00+07:00");
        var row = master.barisMaster(header, { nama: "Toko Uji" }, "TK-x", now);
        eq(row[0], "TK-x", "id");
        eq(row[2], true, "aktif default");
      }
    }
  ]
};
