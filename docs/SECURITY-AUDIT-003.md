# SECURITY AUDIT — Sprint 003: Stok, Opname & Laporan

- Tanggal: 2026-10-15 · Auditor: security-dependency-auditor (konteks FRESH, read-only — nol perubahan kode/dependency)
- Scope: `src/modules/stok.logic.gs` (BARU) + `src/modules/stok.server.gs` (BARU) + `src/modules/laporan.logic.gs` (BARU) + `src/modules/laporan.server.gs` (BARU) + `tests/stok.test.js` + `tests/laporan.test.js` (BARU) + `eslint.config.js` (globals) vs BLUEPRINT `planning/sprints/sprint-003/BLUEPRINT.MD`
- Referensi: Bab 13 (Keamanan-Dependency-Check) + Bab 22 Checklist P1; gate CLEAN vs FINDINGS

## 1. Raw tool output

### 1a. Secret scan (MANUAL — gitleaks/trufflehog tidak terinstal; pola manual via `git grep` + `rg`)
```
# git grep -n "OWNER_EMAIL" → hanya:
src/server.gs:3:   var ownerEmail = PropertiesService.getScriptProperties().getProperty("OWNER_EMAIL");   # nama key, BUKAN nilai
src/server.gs:20: PropertiesService.getScriptProperties().setProperty("OWNER_EMAIL", email);              # ditulis saat setupOwner_, tak ada nilai hardcode
# (sisanya: CONSTRAINTS.MD/STATE.MD/architect-pack/ACCEPTANCE/BLUEPRINT/VERIFICATION = dokumentasi & aturan, bukan kredensial)
# git grep -n "SPREADSHEET_ID" → src/config.gs:29 (+ pemakaian :40) dan eslint globals :82, DECISIONS/STATE (dokumentasi)
# git grep -n -i -E "sk-[A-Za-z0-9]{10,}|api[_-]?key|password\s*=|BEGIN PRIVATE KEY|ghp_|xox[bap]-|AKIA" -- . ":!package-lock.json" → NOL match (exit True = tidak ada)
# rg -n -i "password|client_secret|BEGIN PRIVATE|ghp_|AKIA|sk-[A-Za-z0-9]{20}" src tests docs planning --glob "!package-lock.json" → NOL match kode
#   (hanya match dokumentasi: docs/ARCHITECTURE.MD:39 "email+password custom" sebagai alternatif ditolak + referensi pola di SECURITY-AUDIT-001/002)
git check-ignore -v .clasp.json .clasprc.json → .gitignore:2:.clasp.json + .gitignore:3:.clasprc.json (KEDUANYA ignored)
git ls-files → .clasp.json TIDAK ter-track; .clasprc.json tidak ada di disk (Test-Path False) ✔
.clasp.json lokal = {"scriptId":"1vcMgwm7…","rootDir":"src"} — scriptId + rootDir saja, tanpa token/kredensial ✔
```
- `SPREADSHEET_ID` di `src/config.gs:29` = `"ID-SPREADSHEET-DIHAPUS-DI-REPO-PUBLIK"` → **ID resource, BUKAN kredensial** (pola resmi `openById`; komentar baris 26–28 menyatakan eksplisit). **BUKAN temuan.**
- `.env`: tidak ada file `.env` di repo; tidak ada kredensial di code/committed files.

### 1b. Guard / lock / error (inspeksi kode + rg)
```
# Guard — SEMUA 7 fungsi publik baru memanggil guardOwner_() sebagai statement pertama:
src/modules/stok.server.gs:39-40:    function getStok() {  guardOwner_();
src/modules/stok.server.gs:78-79:    function listMutasiStok(filter) {  guardOwner_();
src/modules/stok.server.gs:113-114:   function doOpname(payload) {  guardOwner_();
src/modules/stok.server.gs:133-134:   function getBatasStok() {  guardOwner_();
src/modules/stok.server.gs:144-145:   function setBatasStok(params) {  guardOwner_();
src/modules/laporan.server.gs:3-4:    function getLaporanKas(filter) {  guardOwner_();
src/modules/laporan.server.gs:30-31:  function getMargin(filter) {  guardOwner_();
# Tulis dalam lock: doOpname → return lockWrap_(…) (l.117); setBatasStok → return lockWrap_(…) (l.148)
# Read-only tanpa lock (benar): getStok, listMutasiStok, getBatasStok, getLaporanKas, getMargin — nol appendRows_/setValue di kelima fungsi
# lockWrap_ (src/db.gs:2-10): LockService.getScriptLock + waitLock(10000) + try/finally releaseLock — benar
# Stack leak: rg "\.stack|e\.stack" di src → NOL match; rg "console.log" di src/tests → hanya tests/run.js (harness output), tak ada log secret
```
Daftar `throw` baru sprint 003 (semua SNAKE_CASE, tanpa stack/pesan bocor — `rg -n "throw new Error"`):
`FK_WAJIB` (stok.server.gs:115), `FISIK_TIDAK_VALID` (:116 + stok.logic.gs:10), `ITEM_TIDAK_ADA` (:119, :151),
`PARAM_TIDAK_VALID` (:146), `BATAS_TIDAK_VALID` (:147) (+ reuse `AKSES_DITOLAK` via guard, `TAB_TIDAK_ADA:<nama>` via readTab_ — sufiks nama tab, bukan secret).
`laporan.server.gs` = nol throw (read-only agregat; filter periode diteruskan ke logic) — benar.

### 1c. Validasi input (LULUS semua, bukan temuan)
- `itemId` wajib: `doOpname` → `FK_WAJIB` (`stok.server.gs:115`); `setBatasStok` → `PARAM_TIDAK_VALID` (`:146`)
- `fisik ≥ 0`: server `:116` (`!(Number(fisik) >= 0)`) + logic `stok.logic.gs:10` + test `stok.test.js:44` (negatif ditolak)
- `batas ≥ 0`: server `:147` (`!(Number(batas) >= 0)`)
- Opname item tak-ada → `ITEM_TIDAK_ADA` (`:119`); batas item tak-ada → `ITEM_TIDAK_ADA` (`:151`)
- `doOpname` memakai snapshot `stokSemua_` + `barisOpname` (`stok.logic.gs:14-32`); retry = `OPN-` + UUID unik (`:123`) → baris ganda by design, lihat §1e.

### 1d. Dependency scan
```
# package.json: key "dependencies" TIDAK ADA (rg hanya match "devDependencies") → runtime deps = 0 (NOL — GAS tanpa npm runtime) ✔
# devDependencies exact-pin (6/6 cocok BLUEPRINT §Dependensi, tanpa ^/~): ✔
@google/clasp 3.4.1 · @mcpher/gas-fakes 2.5.8 · @types/google-apps-script 2.0.13 · eslint 10.12.0 · eslint-plugin-googleappsscript 1.0.5 · typescript 7.0.2

# npm audit --audit-level=high (exit 1):
braces  *
Severity: high
braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
fix available via `npm audit fix --force`
Will install @google/clasp@2.5.0, which is a breaking change
node_modules/braces → micromatch → @google/clasp
3 high severity vulnerabilities
# (advisori SAMA dengan audit 001/002; jalur dev-only via build tool clasp; fix = downgrade breaking — TIDAK diambil auditor)
```

### 1e. Scope diff (git)
```
M  eslint.config.js            # +29 baris globals (15 simbol sprint-002: hitungHPPRataRata…listPengiriman + 14 simbol sprint-003: hitungStok…getMargin) — satu-satunya file lama tersentuh, sesuai BLUEPRINT butir 6 (bundle 002+003 karena 002 belum ter-commit)
?? src/modules/stok.logic.gs · src/modules/stok.server.gs · src/modules/laporan.logic.gs · src/modules/laporan.server.gs   # 4 file BARU sesuai BLUEPRINT butir 1–4 ✔
?? tests/stok.test.js · tests/laporan.test.js                                                                               # 2 test BARU sesuai BLUEPRINT butir 5 ✔
?? src/modules/pengiriman.server.gs · src/modules/piutang.logic.gs · tests/piutang.test.js · planning/sprints/sprint-002/ · architect-packs/architect-pack-002.md · docs/SECURITY-AUDIT-002.md
   # sisa untracked = artefak Sprint 002 yang belum ter-commit + docs — BUKAN scope sprint 003, tak dinilai di sini (lihat item terbuka)
# package.json, package-lock.json, src/config.gs, src/db.gs, src/server.gs, src/secrets.gs, src/audit.gs — TAK BERUBAH (git diff HEAD kosong) ✔
# tests/run.js TAK BERUBAH — auto-discovery `*.test.js` (l.6) sehingga 2 test baru terdaftar tanpa edit; deviasi harmless dari BLUEPRINT butir 5
# doOpname retry = baris ganda BY DESIGN (bukan bug): id unik per retry (stok.server.gs:123) + BLUEPRINT Risiko T5.3 + komentar l.3 ("retry = baris baru tercatat") + ACCEPTANCE C4 ✔
```

## 2. Tabel temuan

| ID | Severity | File:baris | Kategori | Temuan + bukti |
|----|----------|------------|----------|----------------|
| S003-01 | RENDAH | `package-lock.json` (via `@google/clasp@3.4.1` → `micromatch` → `braces *`) | Dependen / GHSA-vfj7-8cjw-p6xm | `npm audit`: **3 high** — `braces` stack-exhaustion DoS. Dev-only (build tool, tak ikut runtime GAS / tak ter-deploy ke Apps Script), fix resmi = downgrade breaking ke clasp 2.5.0. Sama dengan audit-001/002. Dicatat, tidak diblokir. |
| — | BUKAN temuan | `src/config.gs:29` | — | `SPREADSHEET_ID = "1QNJ…"` = ID resource, bukan kredensial (catat eksplisit sesuai mandat audit). |
| — | BUKAN temuan | `src/modules/stok.server.gs:123` | — | `doOpname` retry = baris ganda by design (OPN-UUID unik + audit trail; BLUEPRINT Risiko T5.3). Bukan bug. |
| — | BUKAN temuan | `tests/run.js` tak berubah | — | Auto-discovery membuat edit pendaftaran tak perlu; deviasi harmless dari BLUEPRINT butir 5. |

**Guard/validasi/scope Sprint 003: LULUS semua (bukan temuan)** — 7/7 guard baris pertama (§1b); 2 tulis dalam `lockWrap_` (§1b); error SNAKE_CASE tanpa stack (§1b); validasi itemId/fisik/batas/FK + `ITEM_TIDAK_ADA` (§1c); 6 devDep pin exact + runtime NOL (§1d); file baru sesuai BLUEPRINT (§1e).

## 3. Gate decision

**Gate: CLEAN** — nol temuan KRITIS/TINGGI terbuka. 1 RENDAH (S003-01) diteruskan sebagai item terbuka; bukan penghalang deploy sprint ini (dev-only, fix breaking).

## 4. Item terbuka (untuk `/state-keeper` → RISKS.MD)
1. [RENDAH] S003-01 — advisori `braces` dev-only; pantau rilis clasp tanpa breaking downgrade (jangan `npm audit fix --force`).
2. [CARRY-OVER dari audit-002, belum diverifikasi ulang] S002-01 [SEDANG] `src/modules/pengiriman.server.gs:124-128` — cek idempotency `pembayaranId` setelah `alokasiPiutang`; S002-02 [RENDAH] typo `SATUAN_TIDAK_COCIK` (`:53`).
3. [PROSES] Untracked Sprint 002 (`pengiriman.server.gs`, `piutang.logic.gs`, `tests/piutang.test.js`, `planning/sprints/sprint-002/`, `architect-pack-002`) masih belum ter-commit — pisahkan commit 002 vs 003 agar scope audit tetap terisolasi.
4. [PROSES] Pasang gitleaks (secret scan masih MANUAL) + re-audit tiap sprint yang menyentuh dependensi (Bab 13 Rules).
