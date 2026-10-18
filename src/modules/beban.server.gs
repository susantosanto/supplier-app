// beban.server.gs — adapter GAS untuk beban operasional (logic di beban.logic.gs).
// DSA: agregatBebanPeriode_ = 1 batch read + Σ O(n) — 1 lintasan per laporan, bukan per baris UI.
function actor_() {
  try {
    return String(Session.getActiveUser().getEmail() || "");
  } catch (e) {
    return "";
  }
}

// Daftar beban pada rentang tertentu (atau semua bila tanpa filter), tanggal menaik.
function getBeban(filter) {
  guardOwner_();
  var f = filter || {};
  var data = readTab_("Beban");
  var h = data.header;
  var iT = h.indexOf("tanggal");
  var iK = h.indexOf("kategori");
  var iJ = h.indexOf("jumlah");
  var iC = h.indexOf("catatan");
  var rows = [];
  for (var i = 0; i < data.rows.length; i++) {
    var r = data.rows[i];
    if (!dalamRentangBeban_(r[iT], f.dari, f.sampai)) continue;
    rows.push({
      id: r[h.indexOf("id")],
      tanggal: r[iT],
      kategori: r[iK],
      jumlah: Number(r[iJ]) || 0,
      catatan: r[iC] || ""
    });
  }
  rows.sort(function (a, b) {
    var d = new Date(a.tanggal) - new Date(b.tanggal);
    if (d !== 0) return d;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
  var ringkas = agregatBeban(rows, f.dari, f.sampai);
  return {
    header: ["tanggal", "kategori", "jumlah", "catatan"],
    rows: rows,
    total: ringkas.total,
    perKategori: ringkas.perKategori,
    jumlahCatatan: ringkas.jumlahCatatan
  };
}

// Total beban pada periode — dipakai getLaporanLaba supaya tak read 2×.
function agregatBebanPeriode_(dari, sampai) {
  var data = readTab_("Beban");
  var h = data.header;
  var iT = h.indexOf("tanggal");
  var iK = h.indexOf("kategori");
  var iJ = h.indexOf("jumlah");
  var rows = [];
  for (var i = 0; i < data.rows.length; i++) {
    rows.push({ tanggal: data.rows[i][iT], kategori: data.rows[i][iK], jumlah: data.rows[i][iJ] });
  }
  return agregatBeban(rows, dari, sampai);
}

function saveBeban(payload) {
  guardOwner_();
  var bersih = validasiBeban(payload);
  return lockWrap_(function () {
    var data = readTab_("Beban");
    var id = "BBN-" + Utilities.getUuid();
    var now = new Date();
    appendRows_("Beban", [barisBeban(data.header, bersih, id, now, actor_())]);
    writeLog("saveBeban", id, bersih.kategori + ":" + bersih.jumlah);
    return { id: id, created: true };
  });
}

// Hapus per baris — tabel Beban kecil (ratusan), deleteRow cukup; arsip menyusul Sprint 006.
function hapusBeban(id) {
  guardOwner_();
  if (!id) throw new Error("ID_WAJIB");
  return lockWrap_(function () {
    var data = readTab_("Beban");
    var info = data.mapById[id];
    if (!info) throw new Error("ID_TIDAK_ADA");
    var sh = ss_().getSheetByName("Beban");
    sh.deleteRow(info.sheetRow);
    writeLog("hapusBeban", id, "beban");
    SpreadsheetApp.flush();
    return { id: id, deleted: true };
  });
}