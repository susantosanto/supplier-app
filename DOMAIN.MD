# DOMAIN.MD — Domain Bisnis

> Catatan: istilah di dokumen ini ditulis generik — **pelanggan** (bisa SPPG, kantin, rumah
> makan, toko, atau distributor lain). Tidak ada fitur aplikasi yang bergantung pada
> pelanggan bergelar tertentu.

## Tentang Perusahaan
- Jenis usaha: supplier bahan pokok (contoh: beras, minyak goreng)
- Model bisnis: Beli dari beberapa toko grosir → jual/kirim ke beberapa pelanggan
- Skala operasional: melayani 3–8 pelanggan, membeli dari banyak toko grosir
- Pemilik sekaligus operator: 1 orang (owner input data sendiri dari HP)

## Terminologi Penting
- "SPPG" = salah satu jenis pelanggan; di aplikasi disimpan sebagai nama pelanggan
- "Pelanggan" = penerima barang yang dibayar tempo (nama bebas: SPPG, kantin, rumah makan, toko)
- "Piutang" = tagihan yang belum dibayar oleh pelanggan atas pengiriman yang sudah dilakukan
- "Tempo" = pembayaran ditunda (kredit); bisa dari toko grosir ke supplier (hutang), maupun dari pelanggan ke supplier (piutang)
- "Toko" = pemasok tempat supplier membeli barang
- "Pengiriman" = satu kali kirim barang ke satu pelanggan pada satu hari (unit dasar penagihan)
- "Aging piutang" = umur tagihan: berapa hari pelanggan belum membayar
- "Stok opname" = penghitungan fisik stok untuk mencocokkan dengan catatan
- "BKU" = Buku Kas Umum (pencatatan harian uang masuk/keluar)

## Pengguna Sistem
| Role | Akses | Keterangan |
|------|-------|------------|
| Owner | Full | Satu-satunya pengisi & pengguna; input dari HP saat belanja/kirim; review laporan dari laptop |

## Aturan Bisnis
1. Pembelian dari toko: sebagian tunai, sebagian tempo — setiap pembelian tercatat sebagai stok masuk + kas keluar (atau hutang).
2. Pengiriman ke pelanggan selalu tempo → setiap pengiriman otomatis menjadi piutang dengan tanggal jatuh tempo.
3. Margin per pengiriman = harga jual ke pelanggan − harga beli dari toko (harga beli bisa berbeda antar toko dan antar hari).
4. Laporan harus terlihat real-time (auto-refresh) saat dibuka di HP maupun laptop.
5. Setiap pengiriman harus siap dipertanggungjawabkan (berat/jenis/tujuan/tanggal).

## Pain Points
- Pembayaran pelanggan sering telat → sulit melacak siapa berapa dan sudah berapa hari
- Pencatatan masih manual (buku/catatan HP) → stok, kas, dan piutang tidak sinkron
- Harga beli antar toko dan hari berbeda → margin sulit dihitung manual
- Belanja tanpa panduan stok → risiko kelebihan/kekurangan pembelian