# SECURITY-AUDIT — Sprint 001

- Dijalankan: 2026-10-15 oleh security-dependency-auditor (konteks segar, sesi terpisah dari penulis kode)
- Metode (Bab 13.1): tools dijalankan DULU, reasoning hanya untuk triase/klasifikasi hasil tool. Bukan opini model.
- Scope: `package.json` + `package-lock.json`, seluruh `src/`, `.gitignore`, auth/input code path.

## Step 1 — Output Tool Mentah

### 1a. Dependency vulnerability scan
```
$ npm audit --audit-level=high
# npm audit report

braces  *
Severity: high
braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - GHSA-vfj7-8cjw-p6xm
fix available via `npm audit fix --force`
Will install @google/clasp@2.5.0, which is a breaking change
node_modules/braces
  micromatch  >=0.2.0
  Depends on vulnerable versions of braces
  node_modules/micromatch
    @google/clasp  >=3.0.0-alpha1
    Depends on vulnerable versions of micromatch

3 high severity vulnerabilities
AUDIT_EXIT=0
```
Chain: `@google/clasp@3.4.1 -> micromatch@4.0.8 -> braces@3.0.3` (devDependency, build tool).

### 1b. Secret scan
gitleaks: NOT INSTALLED. trufflehog: NOT INSTALLED. -> fallback MANUAL pattern scan.
```
$ git grep -I -n -E 'sk-[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30}|BEGIN PRIVATE KEY|client_secret|password[:=]|secret[:=]|api[_-]?key[:=]' -- '*.gs' '*.js' '*.json' '*.html' '*.md'
(no output)
git grep exit=1  (1 = tak ada match = bersih)
```

### 1c. Credential files committed?
```
$ git ls-files | Select-String 'clasprc|clasp.json|\.env'
(no output -> tak ada kredensial ter-commit)
```
`.clasp.json` & `.clasprc.json` ada di `.gitignore`. ✓

### 1d. Environment hygiene
- `.env` files: tidak ada (app GAS tidak pakai env vars; rahasia runtime via `ScriptProperties`, lihat `secrets.gs`).
- `.env.example`: tidak ada -> bukan gap: tidak ada env var yang perlu didokumentasikan.
- Kredensial di kode/commit: tidak ada (1b/1c).

## Step 2 — Blueprint Drift Check

| Item | Hasil |
|------|-------|
| Setiap dependency disebut di BLUEPRINT §Dependensi | PASS — 6 devDep = daftar BLUEPRINT (@google/clasp, @mcpher/gas-fakes, eslint, eslint-plugin-googleappsscript, typescript, @types/google-apps-script) |
| Semua versi pinned exact (tanpa ^ / ~) | PASS — `3.4.1, 2.5.8, 10.12.0, 1.0.5, 7.0.2, 2.0.13` |
| Dependency dihapin diam-diam | PASS — tak ada |
| Library di luar rencana | PASS — tak ada; 0 runtime dep (BLUEPRINT: "Runtime: tidak ada") |
| package-lock.json ter-commit | PASS — ada & tracked |

## Step 3 — Checklist P1 (Bab 22.2)

| Cek | Hasil | Bukti |
|-----|-------|-------|
| Input validation pada endpoint user-facing (OWASP A03) | PASS | 17 throw validasi (`FIELD_WAJIB_KOSONG`, `NAMA_DUPLIKAT`, `SATUAN_TIDAK_VALID`, `QTY_TIDAK_VALID`, `HARGA_TIDAK_VALID`, `METODE_TIDAK_VALID`, `MELEBIHI_SISA`, dll) di `*.logic.gs` + `pembelian.server.gs` |
| Auth pada setiap endpoint (OWASP A01) | PASS | 7/7 data endpoint panggil `guardOwner_()`: getMaster, saveMaster, nonaktifkanMaster, createPembelian, listPembelian, bayarHutang, getHutangToko |
| Error tidak bocorkan stack trace / rahasia (OWASP A04) | PASS | error = kode pendek (AKSES_DITOLAK dll), tak ada stack trace ke klien |
| Rate limiting login / API | N/A | app single-user owner-only (webapp MYSELF/USER_DEPLOYING), auth via Google, tak ada endpoint login/API publik — tak ada permukaan untuk brute-force |

## Temuan

| # | Temuan | Severity (advisory) | Risiko proyek | Tag | Gate |
|---|--------|--------------------|---------------|-----|------|
| F1 | `braces` DoS via `@google/clasp` (dev/build tool) | high (npm) | RENDAH | CWE-400 (resource exhaustion); OWASP — dev-only | Log only |
| F2 | initSpreadsheet() tak panggil guardOwner_ | — | RENDAH | info; fungsi bootstrap editor-only (tak diekspos ke webapp `doGet`/google.script.run) | Log only |
| F3 | gitleaks/trufflehog belum terpasang | — | RENDAH | process; secret scan = MANUAL fallback | Schedule |

### Triase F1 (mengapa RENDAH, bukan blocker)
- `braces` ada di **devDependency chain clasp** (alat push lokal), BUKAN runtime. Aplikasi ter-deploy ke GAS dengan **0 npm runtime dependency** — kode rentan tak ikut ke produksi.
- Tak ada input attacker-controlled yang mencapai ekspansi pola glob clasp (operasi lokal saat `push`).
- Fix resmi = downgrade clasp 3.4.1 -> 2.5.0 (**breaking**, melanggar pin BLUEPRINT §Dependensi). Auditor TIDAK mengubah dependency atas inisiatif sendiri (scope).
- Kebijakan false-positive skill: temuan devDependency = LOG ("dev deps ship to CI runners too"), bukan diabaikan. -> dicatat di RISKS.MD, dijadwalkan (mis. saat clasp upgrade major / CI semgrep+osv di sprint deploy).

## Gate Decision: CLEAN

Tidak ada temuan KRITIS / TINGGI yang terbuka pada artifact yang ter-deploy.
- Rahasia: bersih. Auth: semua endpoint data ter-guard. Input: tervalidasi. Blueprint: 0 drift.
- F1 (high advisory) = dev-only, tanpa runtime exposure, fix breaking/out-of-scope -> dicatat, dijadwalkan.

Item terbuka (bukan diperbaiki sprint ini) -> diserahkan ke `/state-keeper` untuk RISKS.MD.

Next: `/deploy-production-gate`.
