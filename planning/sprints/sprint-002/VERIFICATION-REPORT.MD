# VERIFICATION-REPORT — Sprint 002: Pengiriman + Piutang (fitur #1)

- Dijalankan: 2026-10-15 oleh acceptance-runner (KONTEKS SEGAR — bukan sesi penulis kode)
- Kontrak: `planning/sprints/sprint-002/ACCEPTANCE.MD` (Task Gate + B1–B7)
- Referensi: `planning/sprints/sprint-002/BLUEPRINT.MD`, `planning/sprints/sprint-001/VERIFICATION-REPORT.MD` (pola harness)
- Metode: setiap kriteria dipetakan ke perintah, dijalankan PENUH di sesi ini, output + exit code dibaca sebelum verdict (Iron Law). `src/` dan `tests/` tidak diubah (read-only); harness sementara di luar repo, sudah dihapus.

## Task Gate

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| G1 | `npm run check` hijau | `npm run check; echo EXIT=$LASTEXITCODE` | PASS | lint+typecheck+test bersih; `ringkasan: 22 lulus, 0 gagal, 3 file test`; `EXIT=0` |
| G2 | Baris DSA hot-path (T4.1–T4.4) ada & konsisten BLUEPRINT | `Select-String "DSA:" src/modules/piutang.logic.gs src/modules/pengiriman.server.gs` | PASS | 4 baris DSA: `piutang.logic.gs:2` (alokasiPiutang O(F log F)/O(F) — T4.1), `pengiriman.server.gs:2` (stokItem_+hppItem_ O(n) — T4.2), `:3` (update sisa/status O(F) — T4.3), `:4` (agregasi aging O(n) — T4.4); teks konsisten BLUEPRINT kata-per-kata |
| G3 | Tak ada file/librari di luar BLUEPRINT | `git status --short` + `git ls-files src tests` + `git diff` file lindung + cek `package.json` | PASS | tracked `src`/`tests` = Sprint 001 + 3 file baru sesuai BLUEPRINT (`piutang.logic.gs`, `pengiriman.server.gs`, `piutang.test.js`); satu-satunya tracked-modified = `eslint.config.js` (+15 baris globals readonly fungsi baru — pola yang sama dengan Sprint 001, wajib agar `lint` lolos); `git diff` kosong untuk `src/config.gs`, `src/*.gs` Sprint 001, `package.json`, `tsconfig.json`, `.claspignore`, `tests/run.js`; runtime deps NOL (`dependencies=null`), 6 devDep pin exact sesuai BLUEPRINT (`clasp 3.4.1`, `gas-fakes 2.5.8`, `types-gas 2.0.13`, `eslint 10.12.0`, `eslint-plugin-googleappsscript 1.0.5`, `typescript 7.0.2`); untracked lain hanya artefak dokumen (`planning/sprints/sprint-002/`, `architect-packs/architect-pack-002.md`) — bukan kode/librari |
| G4 | Skema tab tidak berubah | `git diff -- src/config.gs` (kosong, lihat G3) | PASS | `config.gs` diff kosong → `TABS`/`TAB_ORDER` tetap 11 tab Sprint 001, `CONFIG_SEED` tetap 4 baris |

Catatan G3: BLUEPRINT menetapkan `tests/run.js` "UBAH: daftarkan piutang.test.js", tetapi `run.js` memakai auto-discovery (`readdirSync *.test.js`) sehingga tanpa ubahan pun 9 test piutang ikut jalan (terbukti di output `npm test`: `piutang.test.js :: …` ×9). Efek yang diminta tercapai; bukan gap.

## Kriteria Sprint

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| B1 | `npm run check` exit 0 | `npm run check; echo EXIT=$LASTEXITCODE` | PASS | `ringkasan: 22 lulus, 0 gagal, 3 file test` (master 5 + pembelian 8 + piutang 9); `EXIT=0` |
| B2 | `clasp push -f` exit 0 + sebut file | `npx clasp push -f; echo EXIT=$LASTEXITCODE` | PASS | `Pushed 14 files at 10.50.24` — daftar memuat `pengiriman.server.gs` + `piutang.logic.gs`; `EXIT=0` (push ulang, idempoten) |
| B3 | Pengiriman → piutang otomatis + HPP snapshot | harness in-process (kode `src/*.gs` asli via `vm` + shim GAS in-memory): init; saveMaster toko/SPPG Uji (tempo kosong)/Beras Uji; 2 pembelian tunai 10×300rb + 10×320rb; `createPengiriman({qty:5, hargaJual:350000, tanggal:'2026-10-20'})` | PASS | margin=200000; stokSisa=15; JBL total=1750000, hargaBeliPakai=310000, margin=200000; PTB nominal=sisa=1750000 status=`terbuka`, jatuhTempo=`2026-11-03T00:00:00.000Z` (=tgl+14 default); Item.hargaJualTerakhir=350000; Log `createPengiriman`=1 (11/11 asersi harness B3 hijau) |
| B4 | Guard stok: tolak tanpa override, lolos dengan override | harness: `createPengiriman({qty:99, tanggal:'2026-10-21'})` tanpa lalu dengan `catatanOverride` | PASS | tanpa override `throw='STOK_KURANG'`, JBL=1 PTB=1 tidak bertambah; dengan override lolos (JBL+PTB=2), kolom `catatanOverride='Stok fisik ada, susulan catat'`, F2 total=34650000 (6/6 hijau) |
| B5 | Aging piutang per SPPG | harness: `getPiutang()` pasca-B3+B4 (+SPPG Kosong tanpa piutang) | PASS | 1 grup `SPPG Uji`: jumlahTerbuka=2, totalSisa=36400000 (=1750000+34650000), Σbucket=36400000 (`{"0-7":36400000,"8-30":0,">30":0}`), tertuaTanggal=`2026-10-20T00:00:00.000Z`, tiap faktur bawa `{id,tanggal,jatuhTempo,nominal,sisa,umur}`; `SPPG Kosong` tidak muncul. JSON lengkap ditempel di log harness (`B5-JSON=`). Catatan jam: umur faktur −5/−6 hari karena jam sistem sesi ini (2026-10-15) mendahului tanggal skenario (2026-10-20/21); bucket `0-7` konsisten dengan formula `bucketAging(umur)` dan Σbucket=total terpenuhi (6/6 hijau) |
| B6 | Bayar FIFO: sebagian, melebihi, idempoten, spesifik | harness: bayar 875000 (=S1/2); bayar 999×sisa; `pembayaranId:'PYJ-TEST-001'` 2×; bayar 500000 ke `pengirimanId` F2 | PASS | alokasi `[{F1:875000}]`; F1 `sebagian` sisa=875000, F2 utuh 34650000; PYJ alokasi JSON `{"PTB-…":875000}`; overpay `throw='MELEBIHI_SISA'` tanpa baris PYJ baru; retry return `{"id":"PYJ-TEST-001","idempoten":true}` tanpa baris/Log ganda (PYJ=2, Log bayar=2 tetap); spesifik hanya ke F2 → F1 tetap 775000, F2=34150000 (12/12 hijau) |
| B7 | Riwayat pengiriman per SPPG + tanpa hapus | harness: `listPengiriman({sppgId})` + grep/runtime check hapus | PASS | 2 baris, urut tanggal desc (`2026-10-21` lalu `2026-10-20`), `statusBayar` = status PTB terkini (`sebagian`/`sebagian`), field lengkap `{id,tanggal,sppgId,itemId,qty,satuan,hargaJual,total,margin,statusBayar}`; grep `hapus|delete` di `pengiriman.server.gs` bersih + `typeof hapusPengiriman === 'undefined'`; Log `createPengiriman`=2, `bayarPiutang`=3 (7/7 hijau) |

Ringkasan harness: `ringkasan: 44 lulus, 0 gagal`, `EXIT=0`.

## GAPS (correctness only)

- (tidak ada)

## Catatan Metodologi

- B1 & G1: dijalankan langsung dari repo (bukti mentah di atas).
- B2: deploy sungguhan via `clasp push -f` (14 file, `EXIT=0`).
- B3–B7 (rung-3): `clasp run` NOT_FOUND untuk proyek ini (pola Sprint 001 — tidak dicoba ulang untuk hemat waktu, sesuai instruksi). Verifikasi dijalankan dengan memuat **file `src/*.gs` yang sama persis dengan yang di-push** ke runtime Node via `vm` dan menyuntikkan **hanya lapisan layanan GAS** (`SpreadsheetApp`/`LockService`/`PropertiesService`/`Session`/`Utilities`) sebagai shim in-memory. Logika aplikasi = kode asli; hanya boundary Google yang di-fake. Skenario B4 memakai tanggal eksplisit `2026-10-21` agar urutan FIFO F1<F2 deterministik (tiebreak tanggal). Harness bersifat sementara di `C:/Users/<pengguna>/AppData\Local\Temp\opencode\harness002.js`, sudah dihapus (`Test-Path=False`), `git status` workdir tak berubah oleh harness.
- Pilihan tanggal skenario B3 (`2026-10-20`) berasal dari ACCEPTANCE; terhadap jam sistem sesi ini menghasilkan umur negatif — diverifikasi konsisten-formula, bukan hardcode bucket.

## Verdict: APPROVED (0 FAIL, 0 UNTESTED)

Langkah berikut: `/security-dependency-auditor` (konteks segar), lalu `/state-keeper`.
