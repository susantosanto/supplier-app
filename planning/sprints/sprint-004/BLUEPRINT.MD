# BLUEPRINT — Sprint 004: Dashboard + UI Fungsional (tanpa Stitch)

## Arsitektur

```
 HP/Laptop ──▶ Web App @HEAD ──▶ doGet → html/index (SATU file: CSS+JS inline)
                                         │ google.script.run (JSON)
                                         ▼
                    Server V8: 11 fungsi existing (tak diubah) + getDashboard (BARU)
                                         ▼
                    Sheets DB 1QNJ (skema tetap) + CacheService 60 dtk
```

## Tokens (source of truth sementara pengganti DESIGN.md)
--bg:#faf8f4, --card:#ffffff, --ink:#1c1917, --muted:#78716c, --line:#e7e0d6,
--accent:#9a3412, --accent-ink:#ffffff, --ok:#166534, --warn:#b45309, --bad:#b91c1c;
font: system stack; radius 10px; tap min-height 44px; nav bawah mobile, sidebar ≥900px.

## Dependensi (PIN exact; runtime NOL; tanpa penambahan)
clasp 3.4.1 · gas-fakes 2.5.8 · eslint 10.12.0 · plugin 1.0.5 · typescript 7.0.2 · types 2.0.13.

## File Dibuat/Diubah
1. `src/html/index.html` — TULIS ULANG total (7 view + router hash + run_() Promise + rp()/tgl() + banner error). SATU file, nol URL eksternal.
2. `src/modules/dashboard.server.gs` — BARU: `getDashboard()` (guard; cache read-through `Kunci dasbor`; kompilasi getStok/getPiutang/getLaporanKas + peringatan[]; return {stok, piutang, kas, peringatan, diperbarui}).
3. `eslint.config.js` — TAMBAH global `getDashboard` (+ `CacheService` bila belum dari plugin).
4. TIDAK DIUBAH: 11 fungsi server existing, skema, manifest, package.json, tsconfig, claspignore.

## Peta view → fungsi (kontrak; D3 cek statis nama persis)
- #/ → getDashboard · #/belanja → getMaster, createPembelian · #/kirim → getMaster, createPengiriman
- #/piutang → getPiutang, bayarPiutang · #/stok → getStok, listMutasiStok, doOpname, setBatasStok
- #/laporan → getLaporanKas, getMargin · #/hutang → getHutangToko, bayarHutang

## Tasks

### T7.1 getDashboard — files: dashboard.server.gs
1. Agregasi via fungsi existing + `peringatan` (stok tipis + piutang >30 hari + hutang). 2. Cache: get → hit return; miss → hitung + put 60 dtk; degradasi: cache gagal → hitung langsung (try/catch).
- **DoD**: `npm run check` + harness (CacheService stub): shape lengkap + put dipanggil + panggilan ke-2 dari cache (paste)
- **DSA**: DSA: getDashboard — 4 agregat batch O(n) + cache TTL 60 — hit O(1), miss O(n)

### T8.1 Shell + router — files: index.html
1. Tokens + layout + nav 7 rute + `run_()` + `rp()/tgl()` + banner error + loading/empty per view. 2. Dashboard view + auto-refresh 60 dtk + "data per …".
- **DoD**: `npm run check` + ekstrak `<script>` → `node --check` OK + 7 `id="view-"` hadir (paste)

### T8.2–T8.6 Layar kerja — files: index.html (lanjut, 1 task per 1–2 layar)
- T8.2 belanja · T8.3 kirim (pratinjau margin qty×(jual−suguhBeli)? tanpa HPP server — tampilkan total + info margin dihitung server) · T8.4 piutang+bayar · T8.5 stok+opname+batas · T8.6 laporan+periode & hutang+bayar.
- **DoD tiap task**: `npm run check` + nama fungsi di `run_('X')` cocok daftar §Peta (cek grep, paste)

### T8.7 Polish — files: index.html
tap ≥44px (CSS), theme-color meta, error STOK_KURANG tawarkan override (checkbox → kirim ulang + catatanOverride), konfirmasi sebelum bayar (confirm()).
- **DoD**: `npm run check` + grep `44px|min-height` + `confirm(` hadir (paste)

## Risiko
| Risk | Mitigasi |
|---|---|
| Template evaluate gagal (scriptlet) | index.html TANPA `<?= ?>` — HTML statis + JS; doGet tak berubah |
| Caja/IFRAME blokir pola JS | Hanya DOM + fetch internal google.script.run; tanpa eval/innerHTML string event (addEventListener) |
| Nama fungsi klien vs server drift | D3 cek silang machine-checked |
| Cache basi | TTL 60 + stempel diperbarui terlihat |

## Consistency Check (DRAFT)
- [x] REQUIREMENTS→BLUEPRINT (dashboard, 6 layar, token, nol-lib) · T7.1→D4, T8.1→D3, T8.2–T8.6→D3/D5, T8.7→D6
- [x] DoD machine-checked semua; DSA di T7.1 (hot-path agregat); D-tanpa-fitur-luar; bootstrap di HANDOFF; dependensi == pin; satu goal
