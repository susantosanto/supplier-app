// Test Sprint 005: logika beban operasional murni (tanpa GAS).
var bl = require("../src/modules/beban.logic.gs");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + JSON.stringify(a) + ", harap " + JSON.stringify(b) + ")");
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

function hari(n) { return new Date(2026, 9, n, 12, 0, 0); }

module.exports = {
  tests: [
    {
      name: "KATEGORI_BEBAN = 5 kategori tertutup",
      fn: function () {
        eq(bl.KATEGORI_BEBAN.length, 5, "jumlah kategori");
        eq(bl.KATEGORI_BEBAN.join(","), "Sewa,Transport,Gaji,Listrik,Lain-lain", "urutan kategori");
      }
    },
    {
      name: "validasiBeban menerima payload valid",
      fn: function () {
        var b = bl.validasiBeban({ tanggal: "2026-10-15", kategori: "Sewa", jumlah: 75000, catatan: "  ok  " });
        eq(b.kategori, "Sewa", "kategori");
        eq(b.jumlah, 75000, "jumlah");
        eq(b.catatan, "ok", "catatan di-trim");
      }
    },
    {
      name: "validasiBeban tolak kategori di luar daftar",
      fn: function () {
        mustThrow(function () {
          bl.validasiBeban({ tanggal: "2026-10-15", kategori: "Makan", jumlah: 1000 });
        }, "KATEGORI_TIDAK_VALID", "kategori asing");
      }
    },
    {
      name: "validasiBeban tolak jumlah 0 / negatif / kosong",
      fn: function () {
        mustThrow(function () {
          bl.validasiBeban({ tanggal: "2026-10-15", kategori: "Sewa", jumlah: 0 });
        }, "JUMLAH_TIDAK_VALID", "jumlah 0");
        mustThrow(function () {
          bl.validasiBeban({ tanggal: "2026-10-15", kategori: "Sewa", jumlah: -5 });
        }, "JUMLAH_TIDAK_VALID", "jumlah negatif");
        mustThrow(function () {
          bl.validasiBeban({ tanggal: "2026-10-15", kategori: "Sewa" });
        }, "JUMLAH_TIDAK_VALID", "jumlah tak ada");
      }
    },
    {
      name: "validasiBeban tolak tanggal kosong / rusak",
      fn: function () {
        mustThrow(function () {
          bl.validasiBeban({ kategori: "Sewa", jumlah: 1000 });
        }, "TANGGAL_WAJIB", "tanpa tanggal");
        mustThrow(function () {
          bl.validasiBeban({ tanggal: "bukan-tanggal", kategori: "Sewa", jumlah: 1000 });
        }, "TANGGAL_WAJIB", "tanggal rusak");
      }
    },
    {
      name: "agregatBeban jumlahkan + pecah per kategori",
      fn: function () {
        var rows = [
          { tanggal: hari(3), kategori: "Sewa", jumlah: 500000 },
          { tanggal: hari(9), kategori: "Transport", jumlah: 75000 },
          { tanggal: hari(9), kategori: "Transport", jumlah: 25000 },
          { tanggal: hari(20), kategori: "Gaji", jumlah: 900000 }
        ];
        var a = bl.agregatBeban(rows, "2026-10-01", "2026-10-31");
        eq(a.total, 1500000, "total");
        eq(a.jumlahCatatan, 4, "jumlah catatan");
        eq(a.perKategori.Sewa, 500000, "Sewa");
        eq(a.perKategori.Transport, 100000, "Transport");
        eq(a.perKategori.Gaji, 900000, "Gaji");
      }
    },
    {
      name: "agregatBeban hormati batas periode (dari & sampai inklusif)",
      fn: function () {
        var rows = [
          { tanggal: new Date(2026, 8, 30, 12), kategori: "Sewa", jumlah: 111 }, // Sep 30 — di luar
          { tanggal: new Date(2026, 9, 1, 0, 0, 0), kategori: "Sewa", jumlah: 222 },  // tepat 1 Okt — masuk
          { tanggal: new Date(2026, 9, 31, 23, 59, 59), kategori: "Gaji", jumlah: 333 }, // 31 Okt 23:59 — masuk
          { tanggal: new Date(2026, 10, 1, 6, 0, 0), kategori: "Gaji", jumlah: 444 }  // 1 Nov — di luar
        ];
        var a = bl.agregatBeban(rows, "2026-10-01", "2026-10-31");
        eq(a.total, 555, "hanya baris dalam rentang");
        eq(a.jumlahCatatan, 2, "dua catatan");
      }
    },
    {
      name: "agregatBeban tanpa filter = semua baris",
      fn: function () {
        var rows = [{ tanggal: hari(1), kategori: "Sewa", jumlah: 10 }, { tanggal: hari(2), kategori: "Gaji", jumlah: 20 }];
        eq(bl.agregatBeban(rows, null, null).total, 30, "total tanpa filter");
      }
    },
    {
      name: "agregatBeban baris kosong = nol (bukan NaN)",
      fn: function () {
        var a = bl.agregatBeban([], "2026-10-01", "2026-10-31");
        eq(a.total, 0, "total 0");
        eq(a.jumlahCatatan, 0, "nol catatan");
        eq(Object.keys(a.perKategori).length, 0, "tanpa kategori");
      }
    },
    {
      name: "hitungLabaBersih = laba kotor − beban",
      fn: function () {
        eq(bl.hitungLabaBersih(1000000, 250000), 750000, "laba bersih");
        eq(bl.hitungLabaBersih(1000000, 0), 1000000, "tanpa beban = sama");
        eq(bl.hitungLabaBersih(100000, 250000), -150000, "rugi boleh negatif");
      }
    },
    {
      name: "hitungLabaBersih tahan null/undefined",
      fn: function () {
        eq(bl.hitungLabaBersih(null, null), 0, "null-safe");
        eq(bl.hitungLabaBersih(5000, null), 5000, "beban null");
      }
    },
    {
      name: "barisBeban susun kolom sesuai header tab Beban",
      fn: function () {
        var header = ["id", "tanggal", "kategori", "jumlah", "catatan", "createdBy", "createdAt"];
        var baris = bl.barisBeban(header, { tanggal: "2026-10-15", kategori: "Transport", jumlah: 30000, catatan: "bensin" },
          "BBN-1", new Date(2026, 9, 15, 8), "owner@x.id");
        eq(baris.length, 7, "jumlah kolom = header");
        eq(baris[0], "BBN-1", "id");
        eq(baris[2], "Transport", "kategori");
        eq(baris[3], 30000, "jumlah");
        eq(baris[4], "bensin", "catatan");
        eq(baris[5], "owner@x.id", "createdBy");
      }
    }
  ]
};