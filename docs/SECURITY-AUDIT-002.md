# SECURITY AUDIT — Sprint 002: Pengiriman + Piutang (fitur #1)

- Tanggal: 2026-10-15 · Auditor: security-dependency-auditor (konteks FRESH, read-only — nol perubahan kode/dependency)
- Scope: `src/modules/piutang.logic.gs` (BARU) + `src/modules/pengiriman.server.gs` (BARU) + `tests/piutang.test.js` (BARU) + `eslint.config.js` (globals) vs BLUEPRINT `planning/sprints/sprint-002/BLUEPRINT.MD`
- Referensi: Bab 13 (Keamanan-Dependency-Check) + Bab 22 Checklist P1; gate CLEAN vs FINDINGS

## 1. Raw tool output

### 1a. Secret scan (MANUAL — gitleaks/trufflehog tidak terinstal; pola manual via `git grep`)
```
# git grep -I -n -E "OWNER_EMAIL|@gmail|1[A-Za-z0-9_-]{20,}|sk-|api[_-]?key|password\s*=|BEGIN PRIVATE KEY|ghp_|xox" -- .
# Temuan relevan HANYA:
src/server.gs:3:  var ownerEmail = PropertiesService.getScriptProperties().getProperty("OWNER_EMAIL");   # nama key, BUKAN nilai
src/server.gs:20: PropertiesService.getScriptProperties().setProperty("OWNER_EMAIL", email);              # ditulis saat setupOwner_, tak ada nilai hardcode
planning/sprints/sprint-001/* + STATE.MD:9: ID resource historis (1JcK…, 1vcM…, 1QNJ…) + email login di STATE — dokumentasi, bukan kredensial
# package-lock.json: hanya hash "integrity" sha512 (false positive pola, bukan secret)
# File baru sprint 002 (untracked, dicek via Select-String): nol match secret/token/ID
git check-ignore -v .clasp.json .clasprc.json  →  .gitignore:2:.clasp.json  +  .gitignore:3:.clasprc.json  (KEDUANYA ignored)
git ls-files | Select-String "clasp"  →  hanya .claspignore + docs ( .clasp.json TIDAK ter-track )
```
- `SPREADSHEET_ID` di `src/config.gs:29` = `"ID-SPREADSHEET-DIHAPUS-DI-REPO-PUBLIK"` → **ID resource, BUKAN kredensial** (pola resmi `openById`; komentar baris 26–28 menyatakan eksplisit). **BUKAN temuan.**
- `.env`: tidak ada file `.env` di repo; tidak ada kredensial di code/committed files.

### 1b. Guard / lock / error (inspeksi kode + grep)
```
# Guard baris pertama — SEMUA 4 fungsi publik baru:
pengiriman.server.gs:39-40:  function createPengiriman(payload) {  guardOwner_();
pengiriman.server.gs:110-111: function bayarPiutang(params) {  guardOwner_();
pengiriman.server.gs:151-152: function getPiutang(sppgId) {  guardOwner_();
pengiriman.server.gs:186-187: function listPengiriman(filter) {  guardOwner_();
# Tulis dalam lock: createPengiriman → return lockWrap_(…) (l.44); bayarPiutang → return lockWrap_(…) (l.113)
# Read-only tanpa lock (benar): getPiutang, listPengiriman — nol appendRows_/setValue di kedua fungsi
# lockWrap_ (src/db.gs:2-10): LockService.getScriptLock + waitLock(10000) + try/finally releaseLock — benar
# Stack leak: Select-String "\.stack|e\.message" di kedua file baru → NOL match; semua throw = string SNAKE_CASE
```
Daftar kode error baru (semua SNAKE_CASE, tanpa pesan/stack bocor): `FK_WAJIB, QTY_TIDAK_VALID, HARGA_TIDAK_VALID, SPPG_TIDAK_ADA, ITEM_TIDAK_ADA, SPPG_NONAKTIF, ITEM_NONAKTIF, SATUAN_TIDAK_COCIK [sic], STOK_KURANG, PARAM_TIDAK_VALID, FAKTUR_TIDAK_ADA, HPP_TIDAK_ADA, HPP_TIDAK_VALID, JUMLAH_TIDAK_VALID, MELEBIHI_SISA` (+ reuse `AKSES_DITOLAK` via guard).

### 1c. Dependency scan
```
# package.json: runtime deps = 0 (NOL — GAS tanpa npm runtime) ✔
# devDependencies exact-pin (6/6 cocok BLUEPRINT §Dependensi): @google/clasp 3.4.1 · @mcpher/gas-fakes 2.5.8 · @types/google-apps-script 2.0.13 · eslint 10.12.0 · eslint-plugin-googleappsscript 1.0.5 · typescript 7.0.2 — tanpa ^/~ ✔

# npm audit --audit-level=high (exit 1):
braces  *
Severity: high
braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
fix available via `npm audit fix --force`
Will install @google/clasp@2.5.0, which is a breaking change
node_modules/braces → micromatch → @google/clasp
3 high severity vulnerabilities
# (advisori SAMA dengan audit Sprint 001; jalur dev-only via build tool clasp; fix = downgrade breaking — TIDAK diambil auditor)
```

### 1d. Scope diff (git)
```
M  eslint.config.js            # hanya +15 baris globals sprint 002 (15 simbol: hitungHPPRataRata…listPengiriman) — sesuai BLUEPRINT butir 5
?? src/modules/pengiriman.server.gs · src/modules/piutang.logic.gs · tests/piutang.test.js   # 3 file BARU sesuai BLUEPRINT butir 1–3
?? planning/sprints/sprint-002/ · architect-packs/architect-pack-002.md                       # artefak architect/docs, bukan kode
# package.json, src/config.gs, src/appsscript.json, .claspignore, tsconfig.json, src/modules/master.*, pembelian.*, server/db/audit/init — TAK BERUBAH ✔
# tests/run.js TAK BERUBAH — auto-discovery `*.test.js` (l.7) sehingga piutang.test.js terdaftar tanpa edit; deviasi harmless dari BLUEPRINT butir 4
```

## 2. Tabel temuan

| ID | Severity | File:baris | Kategori | Temuan + bukti |
|----|----------|------------|----------|----------------|
| S002-01 | SEDANG | `src/modules/pengiriman.server.gs:124-128` | Logic / CWE-694 (protection-mechanism abuse — idempotency lemah) | Cek idempotency `pembayaranId` (l.125–128) berjalan **SETELAH** `alokasiPiutang` (l.124) yang dapat throw `MELEBIHI_SISA`. Retry dengan `pembayaranId` sama setelah sisa berubah → throw, bukan `{idempoten:true}`. Fail-closed (throw sebelum tulis, tanpa double-write — l.133), sehingga bukan KRITIS/TINGGI; namun melemahkan jaminan BLUEPRINT T4.3 "Bayar dobel saat retry HP". Rekomendasi (builder, bukan auditor): pindahkan cek `mapById[pembayaranId]` ke **sebelum** komputasi alokasi. |
| S002-02 | RENDAH | `src/modules/pengiriman.server.gs:53` | Kontrak error | Typo kode error `SATUAN_TIDAK_COCIK` (harusnya `…COCOK`). Fungsional tak terdampak, tetapi klien yang match string exact akan gagal. Rekomendasi: rename + sesuaikan test. |
| S002-03 | RENDAH | `package-lock.json` (via `@google/clasp@3.4.1` → `micromatch` → `braces *`) | Dependen / GHSA-vfj7-8cjw-p6xm | `npm audit`: **3 high** — `braces` stack-exhaustion DoS. Dev-only (build tool, tak ikut runtime GAS / tak ter-deploy ke Apps Script), fix resmi = downgrade breaking ke clasp 2.5.0. Sama dengan audit-001. Dicatat, tidak diblokir. |
| — | BUKAN temuan | `src/config.gs:29` | — | `SPREADSHEET_ID = "1QNJ…"` = ID resource, bukan kredensial (catat eksplisit sesuai mandat audit). |
| — | BUKAN temuan | `tests/run.js` tak berubah | — | Auto-discovery membuat edit pendaftaran tak perlu; deviasi harmless dari BLUEPRINT butir 4. |

**Validasi input (LULUS semua, bukan temuan):** qty/harga `>0` (`pengiriman.server.gs:42-43`, `piutang.logic.gs:18-19`); FK ada & aktif (`:49-52`); satuan cocok (`:53`); stok + override (`:61`); `jumlah≤sisa` via `MELEBIHI_SISA` (`piutang.logic.gs:51`); idempotency ada (`:125-128`, dengan catatan urutan S002-01); FIFO sort tunggal di `fakturTerbukaSppg_` (`:100-106`), logic tanpa sort internal sesuai kontrak (`piutang.logic.gs:45`).

## 3. Gate decision

**Gate: CLEAN** — nol temuan KRITIS/TINGGI terbuka. 1 SEDANG (S002-01) + 2 RENDAH (S002-02, S002-03) diteruskan sebagai item terbuka; S002-01 wajib dijadwalkan (rekam di RISKS.MD via `/state-keeper`), bukan penghalang deploy sprint ini karena fail-closed.

## 4. Item terbuka (untuk `/state-keeper` → RISKS.MD)
1. [SEDANG] S002-01 — pindahkan cek idempotency `pembayaranId` sebelum `alokasiPiutang` di `bayarPiutang`.
2. [RENDAH] S002-02 — perbaiki typo `SATUAN_TIDAK_COCIK` → `SATUAN_TIDAK_COC…` + test.
3. [RENDAH] S002-03 — advisori `braces` dev-only; pantau rilis clasp tanpa breaking downgrade.
4. [PROSES] Pasang gitleaks (secret scan masih MANUAL) + re-audit tiap sprint yang menyentuh dependensi (Bab 13 Rules).
