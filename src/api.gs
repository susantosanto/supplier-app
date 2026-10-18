// api.gs — SATU PINTU untuk semua panggilan `google.script.run` dari klien.
//
// Alasan file ini ada (bug produksi 2026-10-16, "Server tidak mengembalikan data
// (getMaster)"): google.script.run hanya bisa mengirim nilai JSON. Nilai balik
// fungsi yang memuat objek `Date` (semua baris spreadsheet memuatnya) TIDAK
// dikembalikan sebagai error — Apps Script mengirim `null` ke success handler.
// Jadi tidak ada satu pun fungsi data yang bisa mengirim datanya ke klien.
//
// Di sini semua hasil fungsi diserialisasi jadi String JSON di sisi server
// (lihat api.logic.gs). String selalu bisa dikirim apa adanya, sehingga
// respons `null` mustahil terjadi dan setiap galat jadi pesan yang bisa dibaca.
//
// Klien: run_(nama, args) → google.script.run.api(nama, args) → JSON.parse.

function api(nama, args) {
  var daftar = apiDaftar_();
  if (!Object.prototype.hasOwnProperty.call(daftar, String(nama))) {
    return amplopGalat_("FUNGSI_TIDAK_DIKENAL:" + nama);
  }
  var fn = daftar[String(nama)];
  if (typeof fn !== "function") return amplopGalat_("FUNGSI_TIDAK_DIKETAHUI:" + nama);
  var masuk = Array.isArray(args) ? args : [];
  try {
    return amplopSukses_(fn.apply(null, masuk));
  } catch (e) {
    return amplopGalat_(pesanGalat_(e));
  }
}

// Peta putih nama fungsi yang boleh dipanggil klien — bukan daftar hitam, supaya
// fungsi internal (helper ber-underscore, guard, db) tidak bisa dipreach.
// Dibuat saat pemanggilan (bukan saat load) supaya urutan file .gs tidak berpengaruh.
function apiDaftar_() {
  return {
    // master
    getMaster: getMaster,
    saveMaster: saveMaster,
    nonaktifkanMaster: nonaktifkanMaster,
    // pembelian + hutang
    listPembelian: listPembelian,
    createPembelian: createPembelian,
    getHistoriBelanja: getHistoriBelanja,
    bayarHutang: bayarHutang,
    getHutangToko: getHutangToko,
    // pengiriman + piutang
    listPengiriman: listPengiriman,
    createPengiriman: createPengiriman,
    getHistoriKirim: getHistoriKirim,
    bayarPiutang: bayarPiutang,
    getPiutang: getPiutang,
    // stok
    getStok: getStok,
    listMutasiStok: listMutasiStok,
    getBatasStok: getBatasStok,
    doOpname: doOpname,
    setBatasStok: setBatasStok,
// laporan + dashboard
    getLaporanKas: getLaporanKas,
    getMargin: getMargin,
    getDashboard: getDashboard,
    // beban operasional (Sprint 005) → tab ke-12
    getBeban: getBeban,
    saveBeban: saveBeban,
    hapusBeban: hapusBeban,
    getLaporanLaba: getLaporanLaba,
    // profil
    getProfil: getProfil,
    saveProfil: saveProfil,
    // diagnosa + bootstrap
    getPing: getPing,
    diagTulis: diagTulis,
    siapkanSpreadsheet: siapkanSpreadsheet
  };
}

// Pintasan UI untuk initSpreadsheet() — tab Beban (ke-12) belum ada di spreadsheet
// yang dibuat Sprint 001–004, jadi pemilik perlu tombol untuk menyiapkannya tanpa
// masuk ke editor Apps Script. Idempotent: aman diklik berkali-kali.
function siapkanSpreadsheet() {
  guardOwner_();
  return initSpreadsheet();
}