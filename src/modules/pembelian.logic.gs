// pembelian.js — logic murni pembelian & alokasi hutang (testable di Node).
function hitungPembelian(qty, harga) {
  var q = Number(qty);
  var h = Number(harga);
  if (!(q > 0)) throw new Error("QTY_TIDAK_VALID");
  if (!(h > 0)) throw new Error("HARGA_TIDAK_VALID");
  return q * h;
}

function hitungJatuhTempo(tanggal, metode, tempoHariToko, tempoDefault) {
  if (metode === "tunai") return null;
  var hari = tempoHariToko === undefined || tempoHariToko === null || tempoHariToko === ""
    ? tempoDefault
    : Number(tempoHariToko);
  var d = new Date(tanggal);
  d.setDate(d.getDate() + Number(hari));
  return d;
}

function statusAwal(metode) {
  return metode === "tempo" ? "belum" : "lunas";
}

function barisPembelian(header, payload, id, now) {
  var total = hitungPembelian(payload.qty, payload.hargaBeli);
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var k = header[i];
    if (k === "id") row.push(id);
    else if (k === "total") row.push(total);
    else if (k === "statusBayar") row.push(statusAwal(payload.metode));
    else if (k === "createdAt") row.push(now);
    else if (k === "createdBy") row.push("owner");
    else row.push(payload[k] === undefined ? "" : payload[k]);
  }
  return row;
}

// fakturTerbuka: [{id, sisa}] — alokasi FIFO sesuai urutan array.
function alokasiHutang(fakturTerbuka, jumlah) {
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = { hitungPembelian: hitungPembelian, hitungJatuhTempo: hitungJatuhTempo, statusAwal: statusAwal, barisPembelian: barisPembelian, alokasiHutang: alokasiHutang };
}
