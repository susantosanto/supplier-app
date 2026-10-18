// master.js — logic murni master (bisa di-test di Node tanpa GAS).
function required(payload, fields) {
  var kurang = [];
  for (var i = 0; i < fields.length; i++) {
    var v = payload[fields[i]];
    if (v === undefined || v === null || v === "") kurang.push(fields[i]);
  }
  if (kurang.length > 0) throw new Error("FIELD_WAJIB_KOSONG:" + kurang.join(","));
}

function validasiToko(payload) {
  required(payload, ["nama"]);
  if (payload.tempoHari !== undefined && payload.tempoHari !== null && payload.tempoHari !== "") {
    if (Number(payload.tempoHari) < 0) throw new Error("TEMPO_TIDAK_VALID");
  }
  return true;
}

function validasiSppg(payload) {
  required(payload, ["nama"]);
  return true;
}

function validasiItem(payload) {
  required(payload, ["nama", "satuanDasar", "batasStokMin"]);
  var allowed = ["sak", "kg", "liter"];
  if (allowed.indexOf(payload.satuanDasar) < 0) throw new Error("SATUAN_TIDAK_VALID");
  if (Number(payload.batasStokMin) < 0) throw new Error("BATAS_TIDAK_VALID");
  return true;
}

function namaUnik(rows, namaIdx, nama, excludeId, idIdx) {
  var norm = String(nama).trim().toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if (excludeId && rows[i][idIdx] === excludeId) continue;
    if (String(rows[i][namaIdx]).trim().toLowerCase() === norm) {
      throw new Error("NAMA_DUPLIKAT");
    }
  }
  return true;
}

function barisMaster(header, payload, id, now) {
  var row = [];
  for (var i = 0; i < header.length; i++) {
    var k = header[i];
    if (k === "id") row.push(id);
    else if (k === "aktif") row.push(payload.aktif === undefined ? true : payload.aktif);
    else if (k === "createdAt") row.push(payload.createdAt || now);
    else if (k === "updatedAt") row.push(now);
    else row.push(payload[k] === undefined ? "" : payload[k]);
  }
  return row;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { required: required, validasiToko: validasiToko, validasiSppg: validasiSppg, validasiItem: validasiItem, namaUnik: namaUnik, barisMaster: barisMaster };
}
