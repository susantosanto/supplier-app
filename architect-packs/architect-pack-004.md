# ARCHITECT PACK 004 � Sprint 004: Dashboard + UI Fungsional (tanpa Stitch)
Tanggal: 2026-10-15 | Disalin dari planning/sprints/sprint-004/ | Status: DRAFT


# REQUIREMENTS — Sprint 004: Dashboard + UI Fungsional (tanpa Stitch)

## Rencana Sprint 1..N

| Sprint | Nama | Goal |
|---|---|---|
| 001–003 | Fondasi → Piutang → Stok/Laporan | ✅ SELESAI (30 test, deploy dev live) |
| 004 | Dashboard + UI Fungsional | Seluruh fungsi server bisa dipakai dari HP via web app (tanpa Stitch) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi, acceptance penuh, security audit |

## Keputusan scope (pemilik 2026-10-15)
"lanjut sprint 004 tanpa stich" — gerbang T8.0 (output Stitch) DIBEBASKAN via keputusan ini. Konsekuensi tercatat: UI fungsional-rapi (bukan premium Stitch); token desain didefinisikan di BLUEPRINT §Tokens sebagai source of truth sementara; upgrade visual Stitch tetap bisa masuk kapan saja tanpa mengubah kontrak server.

## Tujuan Sprint
Fungsi server Sprint 001–003 yang sudah APPROVED tapi hanya bisa dipanggil via editor, kini bisa dipakai owner dari HP: dashboard sekali lihat + 6 layar kerja (belanja, kirim, piutang, stok/opname, laporan, hutang).

## Apa yang Dibangun
- `getDashboard()` server: kompilasi stok + aging piutang + kas + peringatan stok tipis, CacheService TTL 60 detik, payload ringkas + stempel "diperbarui"
- Shell SPA `index.html` ditulis ulang SATU file (CSS + JS inline, tanpa URL eksternal): token hangat-minimal, bottom-nav mobile, routing hash 7 view, auto-refresh dashboard 60 detik + label "data per …"
- 6 layar kerja memanggil fungsi server asli via google.script.run: form belanja (suguh harga terakhir), form kirim (pratinjau margin + override), piutang (aging + bayar FIFO), stok (mutasi + opname + batas), laporan (kas + margin + periode), hutang (daftar + bayar)
- State loading/empty/error di tiap view; error server tampil verbatim (kode SNAKE_CASE); target sentuh ≥44px

## Pengguna
- Owner dari HP Android Chrome (360–480px) + review laptop (tabel lebar)

## Output yang Diharapkan
- Buka URL → dashboard terisi data nyata (bukan "Memuat…" selamanya)
- Tiap tombol/form memanggil tepat satu fungsi server yang benar (cek statis D3)
- Tanpa library/framework/URL eksternal — 0 ketergantungan baru

## Batasan
- Tanpa premium Stitch (ditunda terbuka, bukan dibatalkan); tanpa PDF/WhatsApp/multi-user/akuntansi (PRD §7)
- Tanpa ubah kontrak + perilaku 11 fungsi server existing; tanpa skema tab baru; tanpa lib di luar BLUEPRINT
- Tanpa arsip/backup/deploy produksi (Sprint 005)



<!-- ======== BLUEPRINT.MD ======== -->


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



<!-- ======== ACCEPTANCE.MD ======== -->


# ACCEPTANCE CRITERIA — Sprint 004: Dashboard + UI Fungsional

## Task Gate
- [ ] `npm run check` exit 0; DSA T7.1 hadir; file di luar BLUEPRINT nihil; 11 fungsi existing diff kosong (`git diff -- src/modules/master* src/modules/pembelian* src/modules/pengiriman* src/modules/piutang* src/modules/stok* src/modules/laporan*`)

## Definisi "Selesai"
SELESAI jika D1–D6 PASS dengan bukti. Uji perangkat owner = seksi Demonstrasi (bukan kriteria, karena butuh login owner).

### D1. Cek — `npm run check; echo "EXIT=$?"` → `EXIT=0` (N lulus).
### D2. Push — `npx clasp push -f` → `EXIT=0`, menyebut `index.html` + `dashboard.server.gs`.
### D3. Klien valid statis — ekstrak isi `<script>` index.html → `node --check` exit 0; tiap nama dalam `run_('NAMA')` ada sebagai `function NAMA` di src/ (cek silang, 0 miss); 7 `id="view-"` hadir; 0 URL eksternal (`http` hanya di komentar? expect nihil di src/href).
### D4. Dashboard — harness (CacheService stub): `getDashboard()` → {stok[], piutang[], kas{masuk,keluar,saldo}, peringatan[], diperbarui}; put() terpanggil; panggilan ke-2 = hit (tanpa hitung ulang).
### D5. Peta layar — 14 pasangan view→fungsi §Peta BLUEPRINT terpenuhi di kode (grep per pasangan, paste hitungan 14/14).
### D6. Polish — `min-height:44px` + `confirm(` + `catatanOverride` + `theme-color` hadir di index.html; tanpa `eval(`.

## Output Demonstrasi (perangkat owner)
1. URL → dashboard angka nyata + refresh 60 dtk. 2. Belanja→kirim→piutang→bayar end-to-end dari HP. 3. `npm run check` + push bukti terminal.

## Sprint Boundary (TIDAK dites)
Premium Stitch, PDF/WhatsApp/multi-user, arsip/backup/deploy produksi.



<!-- ======== HANDOFF-PROMPT.MD ======== -->


# HANDOFF PROMPT — Sprint 004: Dashboard + UI Fungsional — DRAFT (tanpa Stitch, menunggu persetujuan)

Anda adalah BUILDER. Sprint 004 (adaptasi: T8.0 dibebaskan via keputusan pemilik 2026-10-15).

### Baca dulu
1. `AGENTS.MD` 2. `STATE.MD` 3. `DECISIONS.MD` 4. `CONSTRAINTS.MD`
5. `planning/sprints/sprint-004/REQUIREMENTS.MD`, `BLUEPRINT.MD` (§Tokens + §Peta), `ACCEPTANCE.MD`
6. Referensi: `src/html/index.html` (diganti total), `src/modules/pengiriman.server.gs` (pola), `docs/DATA-MODEL.MD`

### Bootstrap
```bash
node -v && npm install && npm run check     # hijau 30 test sebelum mulai
npx clasp list                              # auth error → minta user login
npx clasp push -f                           # D2
# Rung: editor 1vcM (refresh tab tiap push) + harness in-process bila clasp run NOT_FOUND.
# Browser agent TAK bisa buka URL MYSELF (butuh login owner) — uji perangkat = pemilik.
```
Gagal: HENTIKAN, lapor exact, JANGAN menebak.

### Aturan
1. **DRY RUN DULU** (file, urutan T7.1→T8.7, dependensi exact, risiko, titik user). 2. **TUNGGU** "Approved. Mulai coding."
3. index.html TANPA scriptlet `<?= ?>`, tanpa URL eksternal, tanpa `eval(`; SATU file.
4. JANGAN ubah 11 fungsi server existing / skema / manifest / versi pin; JANGAN lib baru; JANGAN klaim tanpa output.
5. Selesai: D1–D6 + `/acceptance-runner` segar.

### JANGAN
coding sebelum disetujui · ubah requirements · lib di luar BLUEPRINT · sentuh server existing · fitur 005 · commit rahasia.

