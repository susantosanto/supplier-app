# DOMAIN.MD — Domain Bisnis

## Tentang Perusahaan
- Jenis usaha: Supplier bahan pokok (beras & minyak goreng)
- Model bisnis: Beli dari beberapa toko grosir → jual/kirim ke dapur SPPG program MBG (Makan Bergizi Gratis)
- Skala operasional: melayani 3–8 SPPG, membeli dari banyak toko grosir
- Pemilik sekaligus operator: 1 orang (owner input data sendiri dari HP)

## Terminologi Penting
- "SPPG" = Satuan Pelayanan Pemenuhan Gizi — dapur MBG yang menjadi pelanggan supplier
- "MBG" = Makan Bergizi Gratis — program nasional yang dikelola Badan Gizi Nasional (BGN)
- "Piutang" = tagihan yang belum dibayar oleh SPPG atas pengiriman yang sudah dilakukan
- "Tempo" = pembayaran ditunda (kredit); bisa dari toko grosir ke supplier (hutang), maupun dari SPPG ke supplier (piutang)
- "Toko" = pemasok tempat supplier membeli beras & minyak
- "Pengiriman" = satu kali kirim bahan ke satu SPPG pada satu hari (unit dasar penagihan)
- "Aging piutang" = umur tagihan: berapa hari SPPG belum membayar
- "Stok opname" = penghitungan fisik stok untuk mencocokkan dengan catatan
- "BKU" = Buku Kas Umum (pencatatan harian uang masuk/keluar)

## Pengguna Sistem
| Role | Akses | Keterangan |
|------|-------|------------|
| Owner | Full | Satu-satunya pengisi & pengguna; input dari HP saat belanja/kirim; review laporan dari laptop |

## Aturan Bisnis
1. Pembelian dari toko: sebagian tunai, sebagian tempo — setiap pembelian tercatat sebagai stok masuk + kas keluar (atau hutang).
2. Pengiriman ke SPPG selalu tempo → setiap pengiriman otomatis menjadi piutang dengan tanggal jatuh tempo.
3. Margin per pengiriman = harga jual ke SPPG − harga beli dari toko (harga beli bisa berbeda antar toko dan antar hari).
4. Laporan harus terlihat real-time (auto-refresh) saat dibuka di HP maupun laptop.
5. Setiap pengiriman harus siap dipertanggungjawabkan (berat/jenis/tujuan/tanggal) — mengikuti ekspektasi audit BGN.

## Pain Points
- Pembayaran SPPG sering telat (tunggakan kronis adalah masalah nasional program MBG) → sulit melacak siapa berapa dan sudah berapa hari
- Pencatatan masih manual (buku/catatan HP) → stok, kas, dan piutang tidak sinkron
- Harga beli antar toko dan hari berbeda → margin sulit dihitung manual
- Belanja tanpa panduan stok → risiko kelebihan/kekurangan pembelian
