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
