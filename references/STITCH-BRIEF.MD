# STITCH BRIEF — Supplier MBG (siap tempel ke Stitch)

Tanggal: 2026-10-15 | Tujuan: hasilkan DESIGN.md + screens untuk gerbang T8.0 Sprint 004.
Cara pakai: tempel blok PROMPT di bawah ke Stitch, generate 7 layar, export DESIGN.md + screens ke `references/` lalu jawab "lanjut".

## PROMPT (tempel apa adanya)

Aplikasi "Supplier MBG" — alat satu owner supplier beras & minyak untuk 3–8 dapur SPPG program Makan Bergizi Gratis. Mobile-first (360–480px, satu tangan, Android Chrome) + nyaman di desktop lebar. Bahasa Indonesia. Gaya premium anti-generik: editorial, tipografi kuat, satu warna aksen pekat + netral hangat, tanpa gradien ungu-biru, tanpa kartu-di-dalam-kartu. Target tap ≥44px, state loading/empty/error jelas, angka rupiah format "Rp 1.550.000".

7 layar:
1. Dashboard — ringkasan: total piutang outstanding + tertua, stok per item + flag tipis, kas hari ini (masuk/keluar), daftar peringatan. Auto-refresh 60 detik + label "data per …".
2. Belanja — form catat pembelian: pilih toko (suguh harga beli terakhir), item, qty+satuan terkunci ke satuan item, harga, tunai/tempo + hari tempo. Simpan <60 detik.
3. Kirim — form pengiriman: pilih SPPG, item, qty, harga jual → pratinjau margin + peringatan stok kurang dengan opsi lanjut ber-catatan.
4. Piutang — total + aging per SPPG (bucket 0–7 / 8–30 / >30 hari), tap SPPG → faktur terbuka (tanggal, nominal, umur), tombol bayar (penuh/sebagian, alokasi FIFO otomatis).
5. Stok & Opname — stok per item + mutasi hari ini, form opname (fisik vs catatan → selisih), atur batas tipis.
6. Laporan — periode hari/minggu/bulan: kas masuk/keluar/saldo + margin total & per item, angka bisa ditelusur ke transaksi.
7. Hutang Toko — daftar hutang per toko (terbuka, jatuh tempo, sebagian/lunas) + form bayar.

## Konteks API (untuk desainer — bentuk data nyata)

- getStok() → [{itemId, nama, satuan: sak|kg|liter, stok, batasStokMin, tipis, masukHariIni, keluarHariIni}]
- getPiutang() → [{sppg, totalSisa, jumlahTerbuka, bucket:{"0-7","8-30",">30"}, tertuaTanggal, faktur:[{tanggal, jatuhTempo, nominal, sisa, umur}]}]
- getLaporanKas() → {masuk, keluar, saldo}; getMargin() → {total, perItem, jumlahPengiriman}
- getHutangToko() → [{toko, totalSisa, jumlahFaktur, tertuaTanggal}]
- listPengiriman({sppgId}) → [{tanggal, itemId, qty, hargaJual, total, margin, statusBayar}]

## Batasan desain
- Satu penulis (owner), tanpa login/multi-user (akses Google MYSELF sudah ditangani platform).
- Tanpa PDF, WhatsApp, multi-gudang, akuntansi (out-of-scope).
- Klien hanya via google.script.run ke fungsi di atas (kontrak JSON, bukan REST).
