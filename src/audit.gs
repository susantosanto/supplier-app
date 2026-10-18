// audit.gs — audit trail append-only ke tab Log.
function writeLog(operasi, refId, ringkas) {
  if (!operasi) throw new Error("OPERASI_KOSONG");
  var now = new Date();
  var aktor = "owner";
  try {
    aktor = String(Session.getActiveUser().getEmail() || "owner");
  } catch (e) {
    aktor = "owner";
  }
  var id = "LOG-" + Utilities.getUuid();
  appendRows_("Log", [[id, now, aktor, operasi, refId || "", ringkas || ""]]);
  return id;
}
