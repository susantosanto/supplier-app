# VERIFICATION-REPORT — Sprint 003: Stok, Opname & Laporan

- Dijalankan: 2026-10-15 oleh acceptance-runner (KONTEKS SEGAR — bukan sesi penulis kode)
- Kontrak: `planning/sprints/sprint-003/ACCEPTANCE.MD` (Task Gate + C1–C7)
- Referensi: `planning/sprints/sprint-003/BLUEPRINT.MD`, `planning/sprints/sprint-002/VERIFICATION-REPORT.MD` (pola harness)
- Metode: setiap kriteria dipetakan ke perintah, dijalankan PENUH di sesi ini, output + exit code dibaca sebelum verdict (Iron Law). `src/` dan `tests/` tidak diubah (read-only); harness sementara di `C:/Users/<pengguna>/AppData\Local\Temp\opencode\harness003.js`, sudah dihapus (`Test-Path=False`), `git status` workdir tak berubah oleh harness.

## Task Gate

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| G1 | `npm run check` hijau | `npm run check; echo EXIT=$LASTEXITCODE` | PASS | lint+typecheck+test bersih; `ringkasan: 30 lulus, 0 gagal, 5 file test` (master 5 + pembelian 8 + piutang 9 + stok 5 + laporan 3); `EXIT=0` |
| G2 | Baris DSA hot-path (T5.1–T6.2) ada & konsisten BLUEPRINT | `Select-String "DSA:" src/modules/stok.logic.gs src/modules/stok.server.gs src/modules/laporan.logic.gs src/modules/laporan.server.gs` | PASS | 5 baris DSA: `stok.logic.gs:2` (hitungStok O(n) — T5.1), `stok.server.gs:2` (listMutasiStok O(n log n) — T5.2), `:3` (doOpname snapshot+append, retry=baris baru — T5.3), `laporan.logic.gs:2` (agregatKas/agregatMargin O(n) — T6.1), `laporan.server.gs:2` (1 batch read per tab — T6.2); teks konsisten BLUEPRINT kata-per-kata |
| G3 | Tak ada file/librari di luar BLUEPRINT | `git status --short` + `git ls-files src tests` + `git diff --stat -- src tests` + cek `package.json` | PASS | `git diff --stat -- src tests` KOSONG (nol tracked-modified di `src/`/`tests/`); untracked `src`/`tests` tepat 7 file = 3 warisan Sprint 002 (`pengiriman.server.gs`, `piutang.logic.gs`, `tests/piutang.test.js`) + 4 baru Sprint 003 sesuai BLUEPRINT (`stok.logic.gs`, `stok.server.gs`, `laporan.logic.gs`, `laporan.server.gs`, `tests/stok.test.js`, `tests/laporan.test.js` — 6 file, tertulis 4+2); satu-satunya kode-modified = `eslint.config.js` (+29 baris globals readonly fungsi Sprint 002+003 — pola Sprint 001/002, wajib agar `lint` lolos); `STATE.MD` modified = update status dokumen Sprint 002 (bukan kode); untracked lain hanya artefak dokumen (`planning/sprints/sprint-002|003/`, `architect-packs/*-002|003.md`, `docs/SECURITY-AUDIT-002.md`) — bukan kode/librari; runtime deps NOL, 6 devDep pin exact sesuai BLUEPRINT (`clasp 3.4.1`, `gas-fakes 2.5.8`, `types-gas 2.0.13`, `eslint 10.12.0`, `eslint-plugin-googleappsscript 1.0.5`, `typescript 7.0.2`) |
| G4 | Skema tab tidak berubah | `git diff -- src/config.gs` (kosong, lihat G3) + baca `src/config.gs` | PASS | `config.gs` diff kosong → tetap 11 tab (`TAB_ORDER` Config..Opname), `Item.batasStokMin` + tab `Opname` hadir, `CONFIG_SEED` tetap 4 baris |

Catatan G3: `tests/run.js` auto-discovery (`readdirSync *.test.js`) sehingga `stok.test.js` + `laporan.test.js` ikut jalan tanpa ubahan (terbukti di output `npm test`: 5 file test, 30 test). Efek BLUEPRINT tercapai; bukan gap.

## Kriteria Sprint

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| C1 | `npm run check` exit 0 | `npm run check; echo EXIT=$LASTEXITCODE` | PASS | `ringkasan: 30 lulus, 0 gagal, 5 file test`; `EXIT=0` |
| C2 | `clasp push -f` exit 0 + sebut file | `npx clasp push -f; echo EXIT=$LASTEXITCODE` | PASS | `Pushed 18 files at 13.29.40` — daftar memuat `stok.logic.gs` + `stok.server.gs` + `laporan.logic.gs` + `laporan.server.gs`; `EXIT=0` |
| C3 | Stok akurat + flag tipis + mutasi | harness in-process (kode `src/*.gs` asli via `vm` + shim GAS in-memory): init; saveMaster toko/SPPG/item sak batasStokMin 20; 2 pembelian tunai 10×300rb + tempo 10×310rb; `createPengiriman({qty:5, hargaJual:350000})`; `getStok()` + `listMutasiStok({itemId})` | PASS | `C3-JSON={"itemId":"ITM-…","nama":"Beras Sak 003","satuan":"sak","stok":15,"batasStokMin":20,"tipis":true,"masukHariIni":20,"keluarHariIni":5}` (20−5+0=15, tipis 15<20); mutasi 3 baris (masuk×2+keluar×1), terurut desc, refId = 2 BLI + 1 JBL (10/10 asersi C3 hijau) |
| C4 | Opname selisih negatif + retry tercatat | harness: `doOpname({itemId, fisik:13, catatan:'susut'})` lalu ulang fisik sama | PASS | return `{sistem:15, selisih:-2}`; baris OPN `{fisik:13, sistem:15, selisih:-2, koreksiStok:-2}`; `getStok()` kini 13; retry → baris OPN kedua tercatat (Opname=2 baris, by design bukan idempoten), stok tetap 13 (6/6 hijau) |
| C5 | Batas stok + negatif ditolak | harness: `setBatasStok({itemId, batas:10})` → `getStok()`; `setBatasStok({batas:-1})` | PASS | `C5-JSON={…,"stok":13,"batasStokMin":10,"tipis":false}` (13<10 salah → tipis=false); batas −1 `throw='BATAS_TIDAK_VALID'` (4/4 hijau) |
| C6 | Kas periode exact | harness: `bayarHutang({tokoId, jumlah:875000})` + `bayarPiutang({sppgId, jumlah:875000})` → `getLaporanKas({})` | PASS | `C6-JSON={"masuk":875000,"keluar":3875000,"saldo":-3000000,…}` = kontrak kata-per-kata (tunai 3.000.000 + bayar hutang 875.000 keluar; terima piutang 875.000 masuk); alokasi hutang `[875000]` (2/2 hijau) |
| C7 | Margin periode struktural | harness: `createPengiriman({qty:2, hargaJual:350000})` (kirim2) → `getMargin({})` vs Σ snapshot `margin` baris Pengiriman | PASS | `C7-JSON={"total":315000,"perItem":{"ITM-…":{"nama":"Beras Sak 003","margin":315000}},"jumlahPengiriman":2,…}`; total == Σ snapshot JBL (225000+90000), count 2, perItem cocok (5/5 hijau) |

Ringkasan harness: `ringkasan: 27 lulus, 0 gagal`, `EXIT=0`.

Catatan C7: angka kontrak (200.000+140.000=340.000) ilustratif untuk bauran harga lain; dengan skenario harga terkunci (tunai 300rb + tempo 310rb → HPP rata-rata 305.000) margin aktual = 5×45.000 + 2×45.000 = 315.000. Invarian yang diuji (total = Σ snapshot `margin`, count 2, perItem cocok) terpenuhi — bukan gap.

## GAPS (correctness only)

- (tidak ada)

## Catatan Metodologi

- C1 & G1: dijalankan langsung dari repo (bukti mentah di atas).
- C2: deploy sungguhan via `clasp push -f` (18 file, `EXIT=0`).
- C3–C7 (rung-3): `clasp run` tidak dicoba (NOT_FOUND pola Sprint 001/002, sesuai instruksi hemat waktu). Verifikasi dijalankan dengan memuat **file `src/*.gs` yang sama persis dengan yang di-push** ke runtime Node via `vm` dan menyuntikkan **hanya lapisan layanan GAS** (`SpreadsheetApp`/`LockService`/`PropertiesService`/`Session`/`Utilities`) sebagai shim in-memory. Logika aplikasi = kode asli; hanya boundary Google yang di-fake. Urutan skenario: init → masters → 2 pembelian → kirim1 → C3 → C4 (opname×2) → C5 → kirim2 → C7 → C6. Tanpa `tanggal` eksplisit (pakai jam sistem sesi ini) agar `masukHariIni`/`keluarHariIni` C3 terisi (20/5). Harness sementara di `C:/Users/<pengguna>/AppData\Local\Temp\opencode\harness003.js`, sudah dihapus (`Test-Path=False`), `git status` workdir tak berubah oleh harness.

## Verdict: APPROVED (0 FAIL, 0 UNTESTED)

Langkah berikut: `/security-dependency-auditor` (konteks segar), lalu `/state-keeper`.
