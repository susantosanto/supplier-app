# REQUIREMENTS — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | Aplikasi terpasang (clasp+spreadsheet 11 tab); owner bisa catat pembelian tunai/tempo dari HP; stok masuk & kas/hutang tercatat |
| 002 | Pengiriman & Piutang | Kirim ke SPPG otomatis jadi piutang; aging per SPPG; bayar FIFO akurat |
| 003 | Stok, Opname & Laporan | Stok akurat + opname; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Meletakkan fondasi teknis yang benar (proyek clasp, spreadsheet terinisialisasi, kunci akses, audit log) dan membuktikan alur BELANJA end-to-end: catat pembelian dari toko → stok bertambah → kas keluar (tunai) atau hutang ke toko (tempo). Sprint ini adalah "tulang punggung" yang dipakai semua sprint berikutnya.

## Apa yang Dibangun
- Proyek Apps Script lokal (clasp) terhubung ke 1 spreadsheet baru = database aplikasi
- Spreadsheet berisi 11 tab terinisialisasi (konvensi docs/DATA-MODEL.MD) + baris Config awal
- Kunci akses: hanya akun Google owner yang bisa memanggil fungsi server (US-11)
- Audit log: setiap tulisan tercatat di tab Log
- Master data: Toko, SPPG, Item (CRUD lunak, nama unik)
- Pembelian: catat belanja ke toko (tunai/tempo), hitung total & jatuh tempo, per baris transaksi
- Pembayaran ke toko (hutang per faktur, lunas/sebagian/belum)
- Query hutang per toko & daftar pembelian
- Shell web app dasar (terbuka, benar, masih polos — polish UI di Sprint 004)

## Mengapa
- Tanpa fondasi (clasp, tab, guard, Log) semua sprint berikutnya tidak bisa dimulai
- Pembelian adalah titik masuk seluruh data: tanpa stok masuk & harga beli, Sprint 002 (margin, HPP) mustahil
- Pembayaran ke toko tempoenya nyata (riset DOMAIN.MD: campuran tunai/tempo) — dicatat sejak awal supaya tidak menumpuk hutang tak terlacak

## Pengguna
- Owner (satu-satunya): input dari HP saat belanja; verifikasi data di tab spreadsheet

## Data Sumber
- Data awal dari pemilik: daftar toko grosir, daftar SPPG yang dilayani, daftar item (beras, minyak) + kemasan
- Harga beli dicatat per transaksi (bukan master)

## Output yang Diharapkan
- Web app "terbuka di HP & laptop, ditolak untuk akun lain"
- 11 tab terisi sesuai konvensi DATA-MODEL §2; Log berisi jejak setiap operasi
- Pembelian tercatat → stok masuk & kas/hutang akurat (terbukti lewat acceptance ACCEPTANCE.MD)

## Batasan
- Tanpa UI premium (menunggu Stitch — Sprint 004); shell dasar cukup
- Tanpa PDF, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT Sprint 001; tanpa keputusan stack baru
- Tanpa fitur pengiriman/piutang (Sprint 002)
