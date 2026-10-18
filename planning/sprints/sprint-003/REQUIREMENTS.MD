# REQUIREMENTS — Sprint 003: Stok, Opname & Laporan

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | ✅ SELESAI |
| 002 | Pengiriman & Piutang | ✅ SELESAI (B1–B7, deploy dev @HEAD live) |
| 003 | Stok, Opname & Laporan | Stok akurat + opname tercatat; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Menjawab dua pertanyaan owner setiap hari: "stok beras/minyak saya tinggal berapa (harus belanja apa)?" dan "uang & untung saya periode ini berapa?". Plus jaring pengaman audit: opname fisik yang selisihnya tercatat permanen sebagai koreksi (bukan edit transaksi lama).

## Apa yang Dibangun
- Stok real-time per item: ΣPembelian − ΣPengiriman + ΣOpname.koreksiStok, dalam satuan siap pakai (sak/kg/liter) + mutasi masuk/keluar hari ini
- Riwayat mutasi terfilter (tanggal/item): gabungan pembelian + pengiriman + koreksi opname, terurut terbaru
- Peringatan stok tipis: flag per item bila stok < batasStokMin + ubah ambang via `setBatasStok`
- Opname: input hitung fisik → sistem hitung selisih vs catatan → tulis OPN permanen (fisik, sistem, selisih, koreksiStok, catatan); stok berikutnya memakai koreksi
- Laporan kas periode: kas masuk (terima piutang) vs kas keluar (belanja tunai + bayar hutang toko) + saldo
- Laporan margin periode: total + per item + jumlah pengiriman (margin memakai snapshot JBL, bukan harga berjalan)

## Mengapa
- Tanpa stok akurat, belanja buta → kelebihan/kekurangan (pain DOMAIN.MD #4)
- Tanpa opname tercatat, selisih fisik vs catatan menumpuk sampai audit BGN (aturan bisnis #5)
- Tanpa kas & margin, owner tak tahu untung riil vs kas yang bolong (PRD US-8)

## Pengguna
- Owner (satu-satunya): cek stok sebelum belanja; opname berkala; review kas/margin di laptop

## Data Sumber
- Tab existing Sprint 001–002 (Pembelian, Pengiriman, PembayaranBeli, PembayaranJual, Opname kosong, Item.batasStokMin) — tanpa tab baru

## Output yang Diharapkan
- `getStok()` cocok hitungan manual Σmasuk−Σkeluar±koreksi; item di bawah ambang berflag `tipis:true`
- `doOpname()` selisih tercatat + stok pasca-opname = fisik
- `getLaporanKas()` / `getMargin()` konsisten dengan detail transaksi (ditelusur per baris)

## Batasan
- Tanpa UI premium (Sprint 004 via Stitch); tanpa dashboard real-time/auto-refresh (Sprint 004); tanpa arsip/backup/deploy produksi (Sprint 005)
- Tanpa PDF, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT; tanpa keputusan stack baru (D1–D5 dikunci); tanpa ubah skema 11 tab
- Normalisasi satuan (sak↔kg) TIDAK dikerjakan — qty dicatat & dihitung dalam satuanDasar item apa adanya (ditunda tercatat sebagai risiko)
