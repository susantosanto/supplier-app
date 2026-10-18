// config.gs — konstanta non-rahasia (sumber tunggal nama tab + header, DATA-MODEL §2).
// DSA: map konstanta TABS — init loop O(T)=O(11) konstan — satu kali bootstrap, bukan hot path runtime.
var TABS = {
  Config: ["key", "value", "keterangan"],
  Log: ["id", "waktu", "aktor", "operasi", "refId", "ringkas"],
  Toko: ["id", "nama", "kontak", "aktif", "tempoHari", "catatan", "createdAt", "updatedAt"],
  SPPG: ["id", "nama", "kontak", "aktif", "tempoHari", "catatan", "createdAt", "updatedAt"],
  Item: ["id", "nama", "satuanDasar", "isiPerSakKg", "batasStokMin", "hargaBeliTerakhir", "hargaJualTerakhir", "aktif", "createdAt", "updatedAt"],
  Pembelian: ["id", "tanggal", "tokoId", "itemId", "qty", "satuan", "hargaBeli", "total", "metode", "jatuhTempo", "statusBayar", "createdBy", "createdAt"],
  PembayaranBeli: ["id", "pembelianId", "tanggal", "jumlah", "createdAt"],
  Pengiriman: ["id", "tanggal", "sppgId", "itemId", "qty", "satuan", "hargaJual", "total", "hargaBeliPakai", "margin", "catatanOverride", "createdAt"],
  PembayaranJual: ["id", "sppgId", "tanggal", "jumlah", "alokasi", "createdAt"],
  PiutangBaris: ["id", "pengirimanId", "sppgId", "tanggal", "jatuhTempo", "nominal", "sisa", "status"],
  Opname: ["id", "tanggal", "itemId", "fisik", "sistem", "selisih", "koreksiStok", "catatan", "createdAt"],
  Beban: ["id", "tanggal", "kategori", "jumlah", "catatan", "createdBy", "createdAt"]
};

// Sprint 005: 12 tab (Beban masuk 2026-10-16 untuk Laba Bersih).
var TAB_ORDER = ["Config", "Log", "Toko", "SPPG", "Item", "Pembelian", "PembayaranBeli", "Pengiriman", "PembayaranJual", "PiutangBaris", "Opname", "Beban"];

var CONFIG_SEED = [
  ["TEMPO_DEFAULT_HARI", "14", "Jatuh tempo default (hari) bila toko/SPPG tanpa tempoHari"],
  ["REFRESH_DETIK", "60", "Interval auto-refresh dashboard (detik)"],
  ["ARSIP_BARIS", "20000", "Ambang arsip per tab transaksi (baris)"],
  ["ZONA", "Asia/Jakarta", "Zona waktu aplikasi"]
];

// ID spreadsheet DB kanonis (dibuat 2026-10-13, termodifikasi terakhir).
// Dipakai sebagai fallback bila getActiveSpreadsheet() null (mis. eksekusi via clasp run / API).
// Di repo PUBLIK nilai ini sengaja dikosongkan (lihat IDENTITAS-LOKAL.md di working tree
// lokal + ScriptProperties SPREADSHEET_ID di GAS). Jalur normal tetap getActiveSpreadsheet().
var SPREADSHEET_ID = "ID-SPREADSHEET-DIHAPUS-DI-REPO-PUBLIK";

// Akses spreadsheet terpadu: aktif bila ada (editor/container-bound), fallback openById (API/clasp run).
function ss_() {
  var aktif = null;
  try {
    aktif = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    aktif = null;
  }
  if (aktif) return aktif;
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
