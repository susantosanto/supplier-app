// Test api: guarantee "Server tidak mengembalikan data (getMaster)" tidak bisa
// muncul lagi karena nilai non-JSON (Date) yang diam-diam jadi null di sisi GAS.
var apiLogic = require("../src/api.logic.gs");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + JSON.stringify(a) + ", harap " + JSON.stringify(b) + ")");
}

module.exports = {
  tests: [
    {
      // akar masalah: Date tidak boleh keluar dari server sebagai objek Date
      name: "jsonAman_ ubah Date jadi ISO lokal-naif (tanpa Z)",
      fn: function () {
        var d = new Date(2026, 9, 15, 9, 30, 5, 7); // 15 Okt 2026 09:30:05.007 lokal
        eq(apiLogic.isoLokalNaif_(d), "2026-10-15T09:30:05.007", "iso lokal-naif");
      }
    },
    {
      name: "jsonAman_ Date di dalam array baris sheet jadi string",
      fn: function () {
        var out = apiLogic.jsonAman_([["TK-1", new Date(2026, 0, 2), 10, true]]);
        eq(typeof out[0][1], "string", "tanggal harus string");
        eq(out[0][1], "2026-01-02T00:00:00.000", "nilai tanggal");
        eq(out[0][2], 10, "qty tetap angka");
        eq(out[0][3], true, "aktif tetap boolean");
      }
    },
    {
      // bentuk payloads getMaster: {toko:{header,rows},…}
      name: "jsonAman_ bentuk getMaster tetap utuh dan JSON-kan",
      fn: function () {
        var m = {
          toko: { header: ["id", "nama"], rows: [["TK-1", "Toko"]] },
          sppg: { header: ["id", "nama"], rows: [] },
          item: { header: ["id", "nama"], rows: [["ITM-1", "Beras", new Date(2026, 9, 16)]] }
        };
        var teks = JSON.stringify(apiLogic.jsonAman_(m));
        var kembali = JSON.parse(teks);
        eq(kembali.toko.header[0], "id", "header toko");
        eq(kembali.sppg.rows.length, 0, "baris kosong tetap array");
        eq(kembali.item.rows[0][2], "2026-10-16T00:00:00.000", "createdAt jadi string");
      }
    },
    {
      name: "jsonAman_ NaN/Infinity jadi null, undefined di objek dibuang",
      fn: function () {
        var out = apiLogic.jsonAman_({ a: NaN, b: Infinity, c: undefined, d: "isi" });
        eq(out.a, null, "NaN -> null");
        eq(out.b, null, "Infinity -> null");
        eq(Object.prototype.hasOwnProperty.call(out, "c"), false, "undefined dibuang");
        eq(out.d, "isi", "string tak berubah");
      }
    },
    {
      name: "jsonAman_ undefined di dalam array jadi null (bukan bolong)",
      fn: function () {
        var out = apiLogic.jsonAman_([1, undefined, 3]);
        eq(out.length, 3, "panjang tetap");
        eq(out[1], null, "lubang -> null");
      }
    },
    {
      name: "jsonAman_ tidak memutasikan objek asal",
      fn: function () {
        var asal = { tgl: new Date(2026, 4, 6), dalam: { x: 1 } };
        apiLogic.jsonAman_(asal);
        eq(asal.tgl instanceof Date, true, "tanggal asal tetap Date");
        eq(asal.dalam.x, 1, "nested asal tak berubah");
      }
    },
    {
      name: "jsonAman_ kedalaman dijaga (siklus tak bikin stack overflow)",
      fn: function () {
        var dalam = { isi: 1 };
        var atas = dalam;
        for (var i = 0; i < 40; i++) { atas.next = { isi: i }; atas = atas.next; }
        var teks = JSON.stringify(apiLogic.jsonAman_(dalam));
        eq(typeof teks, "string", "tetap ter-serialize");
      }
    },
    {
      // amplop: hanya inilah yang benar-benar menyeberang lewat google.script.run
      name: "amplopSukses_ hasilkan String yang selalu bisa dikirim",
      fn: function () {
        var s = apiLogic.amplopSukses_({ rows: [[new Date(2026, 2, 3)]] });
        eq(typeof s, "string", "harus string");
        var b = JSON.parse(s);
        eq(b.ok, true, "ok true");
        eq(b.data.rows[0][0], "2026-03-03T00:00:00.000", "tanggal jadi string");
      }
    },
    {
      name: "amplopSukses_ data undefined jadi null, bukan teks kosong",
      fn: function () {
        var b = JSON.parse(apiLogic.amplopSukses_(undefined));
        eq(b.ok, true, "ok true");
        eq(b.data, null, "data null");
      }
    },
    {
      name: "amplopGalat_ bawa pesan server apa adanya",
      fn: function () {
        eq(JSON.parse(apiLogic.amplopGalat_("AKSES_DITOLAK")).galat, "AKSES_DITOLAK", "pesan utuh");
        eq(JSON.parse(apiLogic.amplopGalat_(undefined)).galat, "GAGAL", "pesan default");
      }
    },
    {
      name: "pesanGalat_ ambil e.message tanpa bungkus Exception",
      fn: function () {
        eq(apiLogic.pesanGalat_(new Error("TAB_TIDAK_ADA:Toko")), "TAB_TIDAK_ADA:Toko", "pesan Error");
        eq(apiLogic.pesanGalat_("teks polos"), "teks polos", "string langsung");
        eq(apiLogic.pesanGalat_(null), "GAGAL", "null -> GAGAL");
      }
    }
  ]
};