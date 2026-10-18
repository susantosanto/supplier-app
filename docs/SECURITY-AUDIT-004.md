# SECURITY AUDIT — Sprint 004: Dashboard + UI Fungsional

- Tanggal: 2026-10-15 · Auditor: security-dependency-auditor (konteks FRESH, read-only — nol perubahan kode/dependency; satu-satunya tulis = file laporan ini)
- Scope: `src/html/index.html` (TULIS ULANG) + `src/modules/dashboard.server.gs` (BARU) + `eslint.config.js` (globals) vs BLUEPRINT `planning/sprints/sprint-004/BLUEPRINT.MD`
- Referensi: Bab 13 (Keamanan-Dependency-Check) + Bab 22 Checklist P1; gate CLEAN vs FINDINGS
- Verifikasi independen: `planning/sprints/sprint-004/VERIFICATION-REPORT.MD` = APPROVED (D1–D6 PASS, G1–G5 PASS)

## 1. Raw tool output

### 1a. Secret scan (MANUAL — gitleaks/trufflehog tidak terinstal; pola manual via `git grep`)

```
# Hardcode OWNER / token → NOL match (exit False = tidak ada):
git grep -n -E 'OWNER_EMAIL\s*=\s*"' -- '*.gs' '*.js' '*.html' → NOL match
git grep -n -I -E 'sk-[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30}|BEGIN PRIVATE KEY|client_secret|password\s*[:=]|api[_-]?key\s*[:=]' -- '*.gs' '*.js' '*.json' '*.html' → NOL match
# Catatan: `git grep -n -i -E "token|OWNER|api[_-]?key|..."` (lebar) hanya match:
#   - dokumentasi/aturan (CONSTRAINTS.MD, DECISIONS.MD, DOMAIN.MD, STATE.MD, ARCHITECTURE.MD, PRD, BLUEPRINT, VERIFICATION, SECURITY-AUDIT-001)
#   - nama key BUKAN nilai: src/server.gs:3 getProperty("OWNER_EMAIL"), src/server.gs:20 setProperty("OWNER_EMAIL", email)
#   - nama paket di package-lock.json (gtoken/js-tokens/jsonwebtoken = transitive dev-dep, bukan kredensial)
#   → NOL kredensial hardcode. BUKAN temuan.

git check-ignore -v .clasp.json .clasprc.json → .gitignore:2:.clasp.json + .gitignore:3:.clasprc.json (KEDUANYA ignored) ✔
git ls-files | Select-String clasp → hanya .claspignore + planning/sprints/sprint-001/CLASP-FIX-PLAN.MD (DOKUMEN); .clasp.json TIDAK ter-track ✔
git status --short → .clasp.json tak muncul sebagai untracked/modified (diabaikan git) ✔
```

- `src/server.gs:2-16` = `guardOwner_()` fail-closed (`OWNER_EMAIL` kosong → `AKSES_DITOLAK`; email aktif ≠ owner → `AKSES_DITOLAK`); `setupOwner_()` tulis sekali-jalan editor-only. Nol nilai email hardcode di repo. ✔
- `.env`: tidak ada file `.env`; tidak ada kredensial di code/committed files. ✔

### 1b. getDashboard (`src/modules/dashboard.server.gs`, 33 baris — dibaca utuh)

```
3:  function getDashboard() {
4:    guardOwner_();                                     # guard = statement PERTAMA ✔
5:    var KUNCI = "dasbor_v1";
7-13:   try { cache = CacheService.getScriptCache(); var hit = cache.get(KUNCI); if (hit) return JSON.parse(hit); } catch (e) { cache = null; }
        # JSON.parse HANYA atas `hit` (string yang baru ditulis server sendiri via JSON.stringify, l.30) — tanpa input attacker ✔
14-17:  var stok = getStok(); var piutang = getPiutang(); var kas = getLaporanKas({}); var hutang = getHutangToko();
        # agregat via 4 fungsi existing (read path), tanpa parameter user ✔
18-27:  peringatan[] — stok tipis + piutang bucket[">30"] + hutang (string concat nama/satuan/angka internal) ✔
28:    var hasil = { stok, piutang, kas, hutang, peringatan, diperbarui: new Date() };
29-31:  try { if (cache) cache.put(KUNCI, JSON.stringify(hasil), 60); } catch (e2) {}
        # cache.put = TULIS CACHE 60 dtk, BUKAN tulis DB — benar dicatat: nol Spreadsheet/appendRows_/setValue/flush/writeLog di file ini ✔
33:  }                                                  # tanpa throw sendiri; degradasi: cache gagal → hitung langsung ✔
# Stack leak: Select-String '\.stack|Stack|throw new Error' di file → NOL match; error SNAKE_CASE (AKSES_DITOLAK dkk) berasal dari fungsi yang dipanggil, tanpa stack bocor ✔
```

### 1c. Klien (`src/html/index.html`, 580 baris — dibaca utuh)

```
URL eksternal:  Select-String '(src|href)\s*=\s*"http' → 0 ✔  (SATU file CSS+JS inline; <script src> → NOL match)
eval(:          Select-String 'eval\s*\(' → 0 ✔
esc():          def index.html:210 `function esc(s)` (escape & < > "); 13 pemakaian esc( — dipakai untuk
                interpolasi nama: :242 opsiAktif nama, :288 d.stok nama, :293 peringatan teks, :307 sppg,
                :322/:324 stok nama+satuan, :343 mg.perItem nama, :356 toko, :433/:458 r.id, :540-541 jenis+refId ✔
                (angka/tanggal via Number()/rp()/tgl(), bukan esc — benar karena kanal numerik)
google.script.run: 14 call site, SEMUA nama LITERAL di tiap run_("NAMA",...), tanpa string dinamis/variabel:
  :249 getMaster · :278 getDashboard · :299 getPiutang · :319 getStok · :336 getLaporanKas · :340 getMargin ·
  :349 getHutangToko · :425 createPembelian · :456 createPengiriman · :480 bayarPiutang · :497 doOpname ·
  :515 setBatasStok · :533 listMutasiStok · :563 bayarHutang
  # helper :221-228 `run_(nama,args)` dispatch via [nama] INTERNAL — 14 call site literal, nol run_(variabel)
  # dari input user → BUKAN injeksi fungsi. Cross-check `function NAMA` di src → 14/14 ADA (MISS=0, cf. VERIFICATION D3/D5) ✔
input angka:    10 situs Number(...) sebelum kirim — :413-414 q/h kirim, :428/:430 qty/hargaBeli,
                :449-450 qty/hargaJual, :476 jumlah piutang, :499 fisik, :517 batas, :559 jumlah hutang ✔
confirm():      :477 `if (!confirm("Terima " + rp(jumlah) + "?")) return;` (bayarPiutang) +
                :560 `if (!confirm("Bayar " + rp(jumlah) + "?")) return;` (bayarHutang) — SEBELUM kirim ✔
error klien:    banner(e.message) — pesan SNAKE_CASE server diteruskan sebagai teks (textContent, :218), tanpa stack ✔
```

### 1d. Dependency scan

```
# package.json: key "dependencies" = null (node -e hasDeps=false) → runtime deps = NOL (GAS tanpa npm runtime) ✔
# devDependencies exact-pin 6/6 cocok BLUEPRINT §Dependensi, tanpa ^/~ (unpinned:0): ✔
@google/clasp 3.4.1 · @mcpher/gas-fakes 2.5.8 · @types/google-apps-script 2.0.13 · eslint 10.12.0 · eslint-plugin-googleappsscript 1.0.5 · typescript 7.0.2
# npm ls --depth=0 → 6 top-level tsb (prod:1 = meta root, dev:486 transitive) ✔

# npm audit (raw, exit 1):
# npm audit report
braces  *
Severity: high
braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
fix available via `npm audit fix --force`
Will install @google/clasp@2.5.0, which is a breaking change
node_modules/braces
  micromatch  >=0.2.0
  Depends on vulnerable versions of braces
  node_modules/micromatch
    @google/clasp  >=3.0.0-alpha1
    Depends on vulnerable versions of micromatch
    node_modules/@google/clasp
3 high severity vulnerabilities
# --json: vulnerabilities { info:0, low:0, moderate:0, high:3, critical:0, total:3 }
# (advisori SAMA dengan audit-001/002/003; jalur dev-only via build tool clasp, tak ikut runtime GAS / tak ter-deploy;
#  fix resmi = downgrade breaking ke clasp 2.5.0 — TIDAK diambil auditor) → RENDAH, item terbuka.
```

### 1e. Scope diff (git)

```
M  eslint.config.js            # diff: +30 globals (hitungHPPRataRata…getDashboard, l.52-81) — satu-satunya config tersentuh;
                              # delta murni-004 = `getDashboard:81`; sisanya bundle simbol sprint-002/003 yang belum ter-commit (wajar, cf. audit-003 §1e)
                              # CacheService TIDAK ditambah eksplisit — disediakan plugin env googleappsscript; `npm run check` hijau (VERIFICATION G1) ✔
M  src/html/index.html         # 574 insertions — TULIS ULANG total sesuai BLUEPRINT butir 1 (7 view + router + run_ + rp/tgl + banner) ✔
?? src/modules/dashboard.server.gs  # file BARU sesuai BLUEPRINT butir 2 ✔
# TAK BERUBAH (git diff HEAD kosong): src/server.gs, src/config.gs, src/db.gs, src/audit.gs, src/secrets.gs,
#   src/modules/master.server.gs, src/modules/pembelian.server.gs, package.json, package-lock.json, tsconfig ✔
# Skema: nol sentuh tab/spreadsheet (hanya baca via fungsi existing + cache) ✔
# Sisa untracked (BUKAN scope 004, tak dinilai di sini): src/modules/{laporan.logic,laporan.server,pengiriman.server,
#   piutang.logic,stok.logic,stok.server}.gs + tests/{laporan,piutang,stok}.test.js + planning/sprints/sprint-002|003 —
#   artefak Sprint 002/003 belum ter-commit (cf. VERIFICATION G4 PASS, audit-003 §1e item proses).
```

## 2. Tabel temuan

| ID | Severity | File:baris | Kategori | Temuan + bukti |
|----|----------|------------|----------|----------------|
| S004-01 | RENDAH | `package-lock.json` (via `@google/clasp@3.4.1` → `micromatch` → `braces *`) | Dependen / GHSA-vfj7-8cjw-p6xm | `npm audit`: **3 high** — `braces` stack-exhaustion DoS. Dev-only (build tool, tak ikut runtime GAS / tak ter-deploy ke Apps Script), fix resmi = downgrade breaking ke clasp 2.5.0. Sama dengan audit-001/002/003. Dicatat, tidak diblokir. |
| — | BUKAN temuan | `src/modules/dashboard.server.gs:30` | — | `cache.put` = tulis CacheService 60 dtk, BUKAN tulis DB (nol Spreadsheet/appendRows_/setValue di file; dicatat benar sesuai mandat). |
| — | BUKAN temuan | `src/html/index.html:221-228` | — | Helper `run_` dispatch `[nama]` internal; 14 call site literal + 14/14 `function` ada (MISS=0). Bukan string dinamis dari input user. |
| — | BUKAN temuan | `src/config.gs:29` | — | `SPREADSHEET_ID` = ID resource, bukan kredensial (cf. audit-003). Tak tersentuh sprint ini. |

**Cek 1–5 mandat: LULUS semua (bukan temuan)** — rahasia bersih + clasp ignored/untracked (§1a); guard baris pertama + read-only + cache-put-bukan-DB + JSON.parse atas cache sendiri + error SNAKE tanpa stack (§1b); nol URL eksternal + nol eval + esc ada & dipakai nama + 14 nama literal existing + Number() + confirm() (§1c); runtime NOL + 6 pin + audit dev-only (§1d); scope = index.html + dashboard.server.gs + eslint global, server existing + skema utuh (§1e).

## 3. Gate decision

**Gate: CLEAN** — nol temuan KRITIS/TINGGI terbuka. 1 RENDAH (S004-01) diteruskan sebagai item terbuka; bukan penghalang deploy sprint ini (dev-only, fix breaking).

## 4. Item terbuka (untuk `/state-keeper` → RISKS.MD)

1. [RENDAH] S004-01 — advisori `braces` dev-only; pantau rilis clasp tanpa breaking downgrade (jangan `npm audit fix --force`).
2. [PROSES] Untracked Sprint 002/003 (`pengiriman.server.gs`, `piutang.logic.gs`, `stok.*`, `laporan.*`, 3 test, `planning/sprints/sprint-002|003`, `architect-pack-002|003`, `SECURITY-AUDIT-002|003`) masih belum ter-commit — pisahkan commit per sprint agar scope audit tetap terisolasi (carry-over dari audit-003).
3. [PROSES] Pasang gitleaks (secret scan masih MANUAL) + re-audit tiap sprint yang menyentuh dependensi (Bab 13 Rules).
