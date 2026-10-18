// dashboard.server.gs — agregat dashboard ringkas + cache 60 detik.
// DSA: getDashboard — 4 agregat batch O(n) + cache TTL 60 — hit O(1), miss O(n).
function getDashboard() {
  guardOwner_();
  var KUNCI = "dasbor_v1";
  var cache = null;
  try {
    cache = CacheService.getScriptCache();
    var hit = cache.get(KUNCI);
    if (hit) return JSON.parse(hit);
  } catch (e) {
    cache = null;
  }
  var stok = getStok();
  var piutang = getPiutang();
  var kas = getLaporanKas({});
  var hutang = getHutangToko();
  var peringatan = [];
  for (var i = 0; i < stok.length; i++) {
    if (stok[i].tipis) peringatan.push({ jenis: "stok-tipis", teks: "Stok tipis: " + stok[i].nama + " sisa " + stok[i].stok + " " + stok[i].satuan });
  }
  for (var j = 0; j < piutang.length; j++) {
    if (piutang[j].bucket[">30"] > 0) peringatan.push({ jenis: "piutang-tua", teks: "Piutang >30 hari Rp " + piutang[j].bucket[">30"] + " di " + piutang[j].sppg });
  }
  for (var k = 0; k < hutang.length; k++) {
    peringatan.push({ jenis: "hutang", teks: "Hutang ke " + hutang[k].toko + ": Rp " + hutang[k].totalSisa });
  }
  var hasil = { stok: stok, piutang: piutang, kas: kas, hutang: hutang, peringatan: peringatan, diperbarui: new Date() };
  try {
    if (cache) cache.put(KUNCI, JSON.stringify(hasil), 60);
  } catch (e2) {}
  return hasil;
}
