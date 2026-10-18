# Constraints

Last reviewed: 2026-10-10 by @owner

## Floor (always enforced, no setup required)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`, `TODO` standing where implementation should be
- No skipped or deleted tests without a reason in the commit message
- No secrets in source (termasuk `.clasprc.json`, `.clasp.json`, `OWNER_EMAIL` hardcoded)
- **No identifier privat di commit** (bertanggal 2026-10-18): `src/config.gs` memuat `SPREADSHEET_ID` asli di working tree lokal karena dibutuhkan `clasp push`; versi yang **ter-commit ke repo publik** harus bernilai `ID-SPREADSHEET-DIHAPUS-DI-REPO-PUBLIK`. Email owner & ID script tidak boleh masuk file mana pun. Sebelum `git add`, telusuri `git diff --cached` untuk pola `SPREADSHEET_ID`, `gmail.com`, dan `Script ID`. Cek otomatis = **usul Sprint 007** (secret scanner / gitleaks pre-commit).
- This file does not get weakened to make a change pass

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Types | Zero type errors | `tsc -p tsconfig.json --noEmit` | every edit (via `npm run typecheck`) |
| Lint | Zero errors from our config | `eslint src tests` | every edit (via `npm run lint`) |
| Tests | All tests pass | `node tests/run.js` | every edit (via `npm run test`) |
| Secrets in source | No secrets in tracked files | `git grep -I` + manual check `.clasprc.json/.clasp.json` are gitignored | every commit |
| Dependency versions | Exact pinned, no drift from BLUEPRINT | `cat package.json` dibandingkan BLUEPRINT §Dependensi | task end |

Every row names the command that produces the verdict. A dimension with a number and no command in this column is an aspiration, not a constraint.

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Project coverage | n/a (unit-testable logic belum ada di repo) | must not fall once tests ditulis |
| GAS execution time per handler | belum diukur | must not exceed 6 menit quota per handler; chunk jika >5k baris |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| EXC-006-01 | No secrets in source | `src/html/index.html` (blok `AUTH.HASH` + fungsi gate) | Kredensial **lock screen visual** milik Sprint 006. Bukan kontrol akses dan bukan rahasia: satu-satunya pengaman data tetap `guardOwner_()` (fail-closed, semua fungsi server) + aturan "Who has access = Only myself" pada deployment Apps Script. Source hanya memuat SHA-256 hex `admin|admin` (bukan password polos), diverifikasi silang dengan oracle `crypto` Node di `tests/login.test.js`. Floor lain tidak dilunakkan: nol suppressi, nol stub | @owner | Saat gate diganti autentikasi token server / tab `Pengguna` (belum dijadwalkan) — jika belum, tinjau tiap sprint |

## Penjelasan angka (opsional, cukup kalau sudah jelas dari konteks)

- Floor diambil dari skill `/constraint-driven-development` Step 3 template — tanpa angka, cukup "selalu enforced, no setup required".
- Dimensi terpilih: (a) coverage tidak di-set angka karena logika testnable murni (master.js, pembelian.js) ditulis terakhir sebelum test; bila後來 ditambahkan, atur ≥80% changed lines sesuai default skill. (b) security scanning (semgrep/osv/gitleaks) ditunda — belum ada dependency runtime dan belum ada CI; masukkan di sprint deploy-production-gate. (c) performance budgets dan (d) accessibility tidak di-set — aplikasi belum punya URL produksi/stable untuk Lighthouse/axe; masukkan setelah dev server stabil atau deploy preview. (e) architecture boundaries: timpang, logika murni `src/modules/*.js` dipisah dari adapter `.server.gs` sudah jadi aturan struktural di BLUEPRINT; cukup kanopi via lint `eslint src` + reviewer.
- Runs at: fast loop = `npm run check` (lint + typecheck + test) di bawah 90 detik target; secrets dipastikan gitignored di `.gitignore`/`.claspignore` sehingga tidak masuk repo.
