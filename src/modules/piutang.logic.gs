// piutang.logic.gs — logic murni pengiriman & piutang (testable di Node).
// DSA: alokasiPiutang — sort faktur terbuka O(F log F), alokasi O(F) — F = faktur terbuka per SPPG (<100), sekali per pembayaran.
function hitungHPPRataRata(pembelianRows) {
  var totalNilai = 0;
  var totalQty = 0;
  for (var i = 0; i < pembelianRows.length; i++) {
    totalNilai += Number(pembelianRows[i].total);
    totalQty += Number(pembelianRows[i].qty);
  }
  if (!(totalQty > 0)) throw new Error("HPP_TIDAK_ADA");
  return totalNilai / totalQty;
}

function hitungMargin(qty, hargaJual, hpp) {
  var q = Number(qty);
  var j = Number(hargaJual);
  var h = Number(hpp);
  if (!(q > 0)) throw new Error("QTY_TIDAK_VALID");
  if (!(j > 0)) throw new Error("HARGA_TIDAK_VALID");
  if (!(h >= 0)) throw new Error("HPP_TIDAK_VALID");
  return q * (j - h);
}

function hitungJatuhTempoPiutang(tanggal, tempoHariSppg, tempoDefault) {
  var hari = tempoHariSppg === undefined || tempoHariSppg === null || tempoHariSppg === ""
    ? tempoDefault
    : Number(tempoHariSppg);
  var d = new Date(tanggal);
  d.setDate(d.getDate() + Number(hari));
  return d;
}

function umurHari(tanggal, hariIni) {
  var ms = new Date(hariIni).getTime() - new Date(tanggal).getTime();
  return Math.floor(ms / 86400000);
}

function bucketAging(umur) {
  var u = Number(umur);
  if (u <= 7) return "0-7";
  if (u <= 30) return "8-30";
  return ">30";
}

// fakturTerbuka: [{id, sisa}] — FIFO sesuai urutan array (caller wajib sort tanggal asc).
function alokasiPiutang(fakturTerbuka, jumlah) {
  var sisaBayar = Number(jumlah);
  if (!(sisaBayar > 0)) throw new Error("JUMLAH_TIDAK_VALID");
  var totalSisa = 0;
  for (var i = 0; i < fakturTerbuka.length; i++) totalSisa += Number(fakturTerbuka[i].sisa);
  if (sisaBayar > totalSisa) throw new Error("MELEBIHI_SISA");
  var hasil = [];
  for (var j = 0; j < fakturTerbuka.length; j++) {
    if (sisaBayar <= 0) break;
    var ambil = Math.min(Number(fakturTerbuka[j].sisa), sisaBayar);
    hasil.push({ id: fakturTerbuka[j].id, bayar: ambil });
    sisaBayar -= ambil;
  }
  return hasil;
}

function barisPengiriman(header, payload, id, now, hpp) {
  var total = Number(payload.qty) * Number(payload.hargaJual);
  var margin = hitungMargin(payload.qty, payload.hargaJual, hpp);
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var k = header[i];
    if (k === "id") row.push(id);
    else if (k === "total") row.push(total);
    else if (k === "hargaBeliPakai") row.push(Number(hpp));
    else if (k === "margin") row.push(margin);
    else if (k === "createdAt") row.push(now);
    else row.push(payload[k] === undefined ? "" : payload[k]);
  }
  return row;
}

function barisPiutang(headerPTB, pengirimanId, sppgId, tanggal, jatuhTempo, nominal, idPTB) {
  var row = [];
  for (var i = 0; i < headerPTB.length; i++) {
    var k = headerPTB[i];
    if (k === "id") row.push(idPTB);
    else if (k === "pengirimanId") row.push(pengirimanId);
    else if (k === "sppgId") row.push(sppgId);
    else if (k === "tanggal") row.push(tanggal);
    else if (k === "jatuhTempo") row.push(jatuhTempo);
    else if (k === "nominal") row.push(Number(nominal));
    else if (k === "sisa") row.push(Number(nominal));
    else if (k === "status") row.push("terbuka");
    else row.push("");
  }
  return row;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { hitungHPPRataRata: hitungHPPRataRata, hitungMargin: hitungMargin, hitungJatuhTempoPiutang: hitungJatuhTempoPiutang, umurHari: umurHari, bucketAging: bucketAging, alokasiPiutang: alokasiPiutang, barisPengiriman: barisPengiriman, barisPiutang: barisPiutang };
}
