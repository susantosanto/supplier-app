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
