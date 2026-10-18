// api.logic.gs — serialisasi JSON-aman untuk jalur server→klien.
//
// MASALAH YANG DISELESAIKAN (bug produksi 2026-10-16):
// `google.script.run` HANYA bisa mengirim nilai JSON. Bila nilai balik server
// mengandung objek `Date` (atau nilai non-JSON lain), Apps Script TIDAK melempar
// error ke failure handler — ia diam-diam mengirim `null` ke success handler.
// Gejalanya di klien: "Server tidak mengembalikan data (getMaster)".
// Karena setiap fungsi data mengembalikan baris spreadsheet (yang isinya Date:
// tanggal, jatuhTempo, createdAt, updatedAt), SELURUH data dari spreadsheet gagal
// meskipun servernya tidak pernah error.
//
// SOLUSI: payload diserialisasi menjadi String JSON di sisi server. String
// selalu bisa dikirim apa adanya, jadi Respons null mustahil terjadi; galat
// pun jadi pesan nyata (ok:false, bukan null senyap).
//
// DSA: jsonAman_ = DFS rekursif tunggal pada pohon nilai; O(N) total node,
// bukan O(N·dalam) — API_MAKS_KEDALAMAN membatasi kedalaman sebagai jaring pengaman.

// Batas kedalaman: data sheet dangkal (baris × kolom), 12 lapis sudah jauh di atas
// kebutuhan nyata. Mencegah stack overflow bila suatu saat ada siklus tak sengaja.
var API_MAKS_KEDALAMAN = 12;

// Date → "YYYY-MM-DDTHH:mm:ss.SSS" TANPA penanda Z/offset (ISO lokal-naif).
// Alasannya: `new Date("2026-10-15T00:00:00.000")` di-parser sebagai waktu LOKAL
// perangkat (spes ES2015+ untuk date-time tanpa offset), jadi tanggal spreadsheet
// tampil sama persis di perangkat mana pun. Kalau memakai toJSON() bawaan yang
// menambah "Z", tanggal 2026-10-15 00:00 WIB bergeser jadi 14 Oktober di
// perangkat yang zona waktunya berbeda.
function isoLokalNaif_(d) {
  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) s = "0" + s;
    return s;
  }
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" +
    pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "." +
    pad(d.getMilliseconds(), 3);
}

// Ubah nilai apa pun menjadi pohon yang pasti bisa di-JSON-kan:
// Date → string ISO lokal-naif · NaN/Infinity → null · undefined → null (di array)
// atau dibuang (di objek) · fungsi/symbol → dibuang · objek → objek biasa baru.
// Menghindari mutasi input (asal tetap utuh untuk logika server).
function jsonAman_(nilai, dalam) {
  var d = dalam || 0;
  if (d > API_MAKS_KEDALAMAN) return null;
  if (nilai === null || nilai === undefined) return null;
  if (nilai instanceof Date) return isoLokalNaif_(nilai);
  var t = typeof nilai;
  if (t === "string" || t === "boolean") return nilai;
  if (t === "number") return isFinite(nilai) ? nilai : null;
  if (t === "function" || t === "symbol") return null;
  if (Object.prototype.toString.call(nilai) === "[object Array]") {
    var arr = [];
    for (var i = 0; i < nilai.length; i++) arr.push(jsonAman_(nilai[i], d + 1));
    return arr;
  }
  if (t === "object") {
    var out = {};
    var kunci = Object.keys(nilai);
    for (var k = 0; k < kunci.length; k++) {
      var v = nilai[kunci[k]];
      if (typeof v === "function" || v === undefined) continue;
      out[kunci[k]] = jsonAman_(v, d + 1);
    }
    return out;
  }
  return null;
}

// Bungkus hasil fungsi server jadi amplop JSON: {ok:true,data:…} / {ok:false,galat:…}.
// Selalu mengembalikan String — tidak pernah null/undefined.
function amplopSukses_(data) {
  return JSON.stringify({ ok: true, data: jsonAman_(data === undefined ? null : data) });
}

function amplopGalat_(pesan) {
  return JSON.stringify({ ok: false, galat: String(pesan === undefined || pesan === null ? "GAGAL" : pesan) });
}

// Pesan galat server apa adanya (tanpa bungkus "Exception:") supaya pesan dari
// guardOwner_ (AKSES_DITOLAK) dan validator tetap persis seperti yang ditulis.
function pesanGalat_(e) {
  if (!e) return "GAGAL";
  if (e.message) return String(e.message);
  return String(e);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    jsonAman_: jsonAman_,
    isoLokalNaif_: isoLokalNaif_,
    amplopSukses_: amplopSukses_,
    amplopGalat_: amplopGalat_,
    pesanGalat_: pesanGalat_
  };
}