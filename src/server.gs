// server.gs — doGet + guard owner + setup sekali jalan.
function guardOwner_() {
  var ownerEmail = PropertiesService.getScriptProperties().getProperty("OWNER_EMAIL");
  if (!ownerEmail) throw new Error("AKSES_DITOLAK");
  var aktif = "";
  try {
    aktif = String(Session.getActiveUser().getEmail() || "");
  } catch (e) {
    throw new Error("AKSES_DITOLAK");
  }
  if (aktif.toLowerCase() !== String(ownerEmail).toLowerCase()) {
    throw new Error("AKSES_DITOLAK");
  }
  return aktif;
}

function setupOwner_() {
  var email = String(Session.getActiveUser().getEmail() || "");
  if (!email) throw new Error("EMAIL_KOSONG");
  PropertiesService.getScriptProperties().setProperty("OWNER_EMAIL", email);
  return { owner: email };
}

function doGet() {
  return HtmlService.createTemplateFromFile("html/index")
    .evaluate()
    .setTitle("SpendFlo")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// Tes koneksi server (diagnosa): tanpa baca data, hanya guard + waktu server.
function getPing() {
  guardOwner_();
  return { ok: true, waktu: new Date(), tab: ss_().getSheets().length };
}

// Tes jalur tulis (diagnosa): kunci + tulis 1 baris DIAG ke tab Log.
function diagTulis() {
  guardOwner_();
  return lockWrap_(function () {
    var id = "DIAG-" + Utilities.getUuid();
    appendRows_("Log", [[id, new Date(), "diag", "diagTulis", id, "tes tulis server"]]);
    SpreadsheetApp.flush();
    return { ok: true, id: id };
  });
}
