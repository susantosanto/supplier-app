# VERIFICATION-REPORT — Sprint 001

- Dijalankan: 2026-10-15 oleh acceptance-runner (KONTEKS SEGAR — bukan sesi penulis kode)
- Kontrak: `planning/sprints/sprint-001/ACCEPTANCE.MD` (A1–A8 + Task Gate)
- Metode: setiap kriteria dipetakan ke perintah, dijalankan PENUH di sesi ini, output + exit code dibaca sebelum verdict (Bab 12; Iron Law `verification-before-completion`)

## Task Gate

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| G1 | `npm run check` hijau | `npm run check; echo EXIT=$?` | PASS | lint+typecheck+test bersih; "ringkasan: 13 lulus, 0 gagal"; `EXIT=0` |
| G2 | Baris DSA hot-path (T1.2,T2.2,T3.2,T3.3,T3.4) ada & konsisten BLUEPRINT | `Select-String DSA: src\*.gs src\modules\*.gs` | PASS | 6 baris DSA: config.gs/init.gs (T1.2), master.server.gs (T2.2), pembelian.server.gs x3 (T3.2/T3.3/T3.4) — teks konsisten BLUEPRINT |
| G3 | Tak ada file/librari di luar BLUEPRINT | `git status --short` + `git ls-files` | PASS | working tree bersih; tracked files = daftar BLUEPRINT §File (15 item src/tests/config) + dokumen; node_modules/.clasp.json gitignored |

## Kriteria Sprint

| # | Kriteria | Perintah | Hasil | Bukti |
|---|----------|----------|-------|-------|
| A1 | `npm run check` exit 0 | `npm run check; echo EXIT=$?` | PASS | `ringkasan: 13 lulus, 0 gagal, 2 file test` ; `EXIT=0` |
| A2 | `clasp push -f` exit 0 + sebut file | `npx clasp push -f; echo EXIT=$?` | PASS | `Pushed 12 files at 10.18.55` (daftar 12 file tercetak) ; `EXIT=0` |
| A3 | init idempoten, 11 tab + Config 4 seed + freeze, hapus Sheet1 | harness in-process (kode `src/*.gs` asli) 2x + varian mulai dari Sheet1 | PASS | run1 & run2 = `Config,Log,Toko,SPPG,Item,Pembelian,PembayaranBeli,Pengiriman,PembayaranJual,PiutangBaris,Opname` (tepat 11, tanpa duplikat); Config rows=5 (header+4 seed); frozen=1; Sheet1 -> 11 tab tetap tepat |
| A4 | Akses ditolak non-owner + fail-closed saat OWNER_EMAIL kosong | harness: `getMaster()` tanpa owner lalu non-owner | PASS | `throw='AKSES_DITOLAK'` (owner kosong) dan `throw='AKSES_DITOLAK'` (non-owner) |
| A5 | saveMaster toko (TK-, aktif TRUE) + duplikat ditolak + Log 2 entri | harness: 2x saveMaster (valid lalu TOKO UJI) | PASS | 1 baris; id=`TK-...`; aktif=TRUE; `throw='NAMA_DUPLIKAT'`; tab tetap 1 baris; Log operasi saveMaster x2 |
| A6 | createPembelian tunai/tempo/harga0 + hargaBeliTerakhir | harness: (a) 5x300k tunai (b) 10x310k tempo (c) 3x0 | PASS | tepat 2 baris BLI; (a) tunai/lunas; (b) tempo/belum; jatuhTempo=2026-10-25 (tanggal+14 Config); (c) `throw='HARGA_TIDAK_VALID'`; hargaBeliTerakhir item=310000; Log createPembelian x2 |
| A7 | bayarHutang sebagian + MELEBIHI_SISA | harness: bayar 1.550.000 lalu 2.000.000 | PASS | statusBayar='sebagian'; overpay `throw='MELEBIHI_SISA'`; baris PBY tidak bertambah; total dibayar=1550000; Log bayarHutang |
| A8 | getHutangToko agregasi | harness: `getHutangToko()` | PASS | `[{"tokoId":"TK-...","toko":"Toko Uji","totalSisa":1550000,"jumlahFaktur":1,"tertuaTanggal":"..."}]` |

## GAPS (correctness only)
- (tidak ada)

## Catatan Metodologi
- A1 & G1: dijalankan langsung dari repo (bukti mentah ada di atas).
- A2: deploy sungguhan ke script 1vcM via `clasp push -f` (auth `.clasprc.json` ada; kode = commit terkini `0e43d85`).
- A3–A8 (rung-3): `clasp run` TIDAK tersedia untuk proyek ini (dokumentasi STATE: API `clasp run` NOT_FOUND). Verifikasi dijalankan dengan memuat **file `src/*.gs` yang sama persis dengan yang di-deploy** ke runtime Node dan menyuntikkan **hanya lapisan layanan GAS** (SpreadsheetApp/LockService/PropertiesService/Session/Utilities) sebagai shim in-memory. Logika aplikasi = kode asli yang di-push; hanya boundary Google yang di-fake. Harness bersifat sementara di luar `src/` & `tests/`, sudah dihapus, `git status` bersih.
- A4 sisi web (URL dev dibuka akun non-owner) tidak bisa diuji otomatis dari sesi ini tanpa sesi browser kedua; namun fail-closed & penolakan fungsi server (jalur `guardOwner_`) diverifikasi in-process.

## Verdict: APPROVED (0 FAIL, 0 UNTESTED)

Langkah berikut: `/security-dependency-auditor`.
