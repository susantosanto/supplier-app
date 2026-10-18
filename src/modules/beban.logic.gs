// beban.logic.gs — logic murni beban operasional (testable di Node, tanpa GAS).
// Sumber kebenaran data: tab `Beban` (satu baris per pengeluaran — keputusan pemilik 2026-10-16).
// DSA: agregatBeban = filter rentang + Σ O(n) sekali per request — n = baris Beban (rendah).
var KATEGORI_BEBAN = ["Sewa", "Transport", "Gaji", "Listrik", "Lain-lain"];

function kategoriValid_(kategori) {
  for (var i = 0; i < KATEGORI_BEBAN.length; i++) {
    if (KATEGORI_BEBAN[i] === kategori) return true;
  }
  return false;
}

// Fail-closed:_date wajib, kategori harus dari daftar tertutup, jumlah > 0.
function validasiBeban(payload) {
  var p = payload || {};
  var tanggal = p.tanggal ? new Date(p.tanggal) : null;
  if (!tanggal || isNaN(tanggal.getTime())) throw new Error("TANGGAL_WAJIB");
  var kategori = String(p.kategori || "").trim();
  if (!kategoriValid_(kategori)) throw new Error("KATEGORI_TIDAK_VALID");
  var jumlah = Number(p.jumlah);
  if (!(jumlah > 0)) throw new Error("JUMLAH_TIDAK_VALID");
  return {
    tanggal: tanggal,
    kategori: kategori,
    jumlah: jumlah,
    catatan: String(p.catatan || "").trim().slice(0, 200)
  };
}

// Susun baris sesuai urutan header tab Beban (DATAMODEL §2).
function barisBeban(header, payload, id, now, createdBy) {
  var bersih = validasiBeban(payload);
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var k = header[i];
    if (k === "id") row.push(id);
    else if (k === "tanggal") row.push(bersih.tanggal);
    else if (k === "kategori") row.push(bersih.kategori);
    else if (k === "jumlah") row.push(bersih.jumlah);
    else if (k === "catatan") row.push(bersih.catatan);
    else if (k === "createdBy") row.push(createdBy || "");
    else if (k === "createdAt") row.push(now);
    else row.push("");
  }
  return row;
}

// rows: [{tanggal, kategori, jumlah}] → total + per kategori dalam rentang.
function agregatBeban(rows, dari, sampai) {
  var perKategori = {};
  var total = 0;
  var jumlahCatatan = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!dalamRentangBeban_(r.tanggal, dari, sampai)) continue;
    var n = Number(r.jumlah) || 0;
    total += n;
    jumlahCatatan += 1;
    perKategori[r.kategori] = (perKategori[r.kategori] || 0) + n;
  }
  return { total: total, perKategori: perKategori, jumlahCatatan: jumlahCatatan };
}

// Rentang inklusif: `sampai` dibandingkan sampai 23:59:59.999 hari itu.
// AWAS ZONA WAKTU: "YYYY-MM-DD" diurai sebagai tengah malam LOKAL, bukan UTC —
// kalau UTC, baris tepat tanggal 1 Okt (00:00 WIB = 30 Sep 17:00Z) terlewat.
// Kembar dari awalRentangLaporan_ di laporan.logic.gs, sengaja dibedaikan namanya
// agar tak bentrok di scope global GAS; kedua nama diuji identik.
function awalRentangBeban_(s) {
  if (!s) return null;
  var t = String(s).trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  var d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

function dalamRentangBeban_(tanggal, dari, sampai) {
  var t = new Date(tanggal).getTime();
  if (isNaN(t)) return false;
  var a = awalRentangBeban_(dari);
  var b = awalRentangBeban_(sampai);
  if (a && t < a.getTime()) return false;
  if (b) {
    var akhir = new Date(b.getFullYear(), b.getMonth(), b.getDate(), 23, 59, 59, 999);
    if (t > akhir.getTime()) return false;
  }
  return true;
}

// Laba Bersih = Laba Kotor − Beban. Beban tak boleh negatif dihitung sebagai laba.
function hitungLabaBersih(labaKotor, bebanTotal) {
  return Number(labaKotor || 0) - Number(bebanTotal || 0);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    KATEGORI_BEBAN: KATEGORI_BEBAN,
    kategoriValid_: kategoriValid_,
    validasiBeban: validasiBeban,
    barisBeban: barisBeban,
    agregatBeban: agregatBeban,
    hitungLabaBersih: hitungLabaBersih
  };
}