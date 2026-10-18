# REQUIREMENTS — Sprint 002: Pengiriman + Piutang (fitur #1)

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | ✅ SELESAI — clasp+spreadsheet 11 tab, pembelian tunai/tempo, hutang toko |
| 002 | Pengiriman & Piutang | Kirim ke SPPG otomatis jadi piutang; aging per SPPG; bayar FIFO akurat |
| 003 | Stok, Opname & Laporan | Stok akurat + opname; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Membuktikan alur JUAL end-to-end: catat pengiriman ke SPPG dari HP → stok berkurang → piutang terbentuk otomatis dengan jatuh tempo → terima pembayaran (penuh/sebagian, FIFO) → piutang berkurang & kas masuk tercatat. Sprint ini adalah "fitur #1" (DOMAIN.MD pain #1: tunggakan SPPG kronis).

## Apa yang Dibangun
- Pengiriman: catat kirim ke SPPG (pilih SPPG + item + qty + harga jual), snapshot HPP rata-rata berbobot, margin tersimpan permanen
- Piutang otomatis: tiap pengiriman → 1 baris PiutangBaris (PTB-) dengan tanggal + jatuhTempo (tempoHari SPPG, default Config 14)
- Stok guard: tolak bila stok kurang, kecuali ada `catatanOverride` (tetap kirim + tercatat)
- Pembayaran SPPG: bayar penuh/sebagian, alokasi FIFO otomatis ke faktur tertua, bisa ke faktur spesifik, idempoten via `pembayaranId`
- Query: aging piutang per SPPG (bucket 0–7 / 8–30 / >30 hari) + riwayat pengiriman per SPPG (siap audit BGN: tanggal/item/qty/harga/total/status)
- Cache harga: `hargaJualTerakhir` item ter-update tiap pengiriman

## Mengapa
- Tanpa piutang otomatis, owner mencatat ganda (kirim lalu tagih manual) — sumber selisih
- Aging per SPPG adalah keputusan tagih harian owner; tanpa bucket umur, tunggakan kronis tak terlihat
- FIFO + snapshot HPP membuat margin per pengiriman konsisten walau harga beli berubah-ubah (pain DOMAIN.MD #3)
- Override ber-catatan menjaga kelancaran kirim saat stok mepet tanpa merusak audit trail

## Pengguna
- Owner (satu-satunya): input dari HP saat kirim ke dapur; review piutang/aging di HP/laptop

## Data Sumber
- Master existing (Toko/SPPG/Item dari Sprint 001) + pembelian existing (sumber HPP & stok masuk)
- Harga jual dicatat per transaksi (bukan master); tempoHari per SPPG (default 14)

## Output yang Diharapkan
- Kirim tercatat → PiutangBaris terbentuk + stok berkurang + margin terhitung (terbukti lewat ACCEPTANCE.MD)
- `getPiutang()` tampil per SPPG: totalSisa, jumlah terbuka, bucket umur, tertua
- `bayarPiutang()` FIFO akurat; sisa konsisten dengan hitung ulang `auditPiutang()`-style (jumlah alokasi = jumlah bayar)

## Batasan
- Tanpa UI premium (menunggu Stitch — Sprint 004); tanpa penambahan layar; fungsi server + test saja
- Tanpa PDF invoice, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT Sprint 002; tanpa keputusan stack baru (D1–D5 dikunci)
- Tanpa stok akhir/opname/kas-margin periode/dashboard (Sprint 003–004); tanpa arsip/backup/deploy produksi (Sprint 005)
- Skema tab TIDAK berubah (11 tab Sprint 001 sudah mencakup Pengiriman/PembayaranJual/PiutangBaris — hanya isi yang dipakai)
