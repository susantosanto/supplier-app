# Panduan Penggunaan SpendFlo

Panduan ini untuk **pemilik usaha** — orang yang memakai aplikasi ini sendiri setiap hari.
Tidak perlu background teknis. Tujuannya cuma satu: Anda tahu **kapan membuka menu apa, apa
yang harus diisi, dan angka itu artinya apa**.

Semua menu dan tombol yang dijelaskan di bawah **sudah ada di aplikasi**.

---

## 1. Aplikasi ini untuk apa

SpendFlo mencatat dua hal yang paling sering bikin pusing pemilik usaha:

1. **Uang keluar** untuk membeli barang dari toko supplier (tunai atau tempo).
2. **Uang masuk** dari pelanggan setelah barang dikirim (biasanya tempo).

Dari dua catatan itu, aplikasi ini otomatismenghitung stok barang, hutang ke toko,
piutang dari pelanggan, dan **_laba bersih_ Anda**.

Kalau Anda ingat satu kalimat saja: **beli → kirim → tagih → terima → lihat laporan**.

---

## 2. Istilah yang perlu Anda tahu

| Istilah | Arti dalam bahasa sehari-hari |
|---|---|
| **Toko / Supplier** | tempat Anda membeli barang |
| **Pelanggan / SPPG** | tempat Anda mengirim barang. Di aplikasi disimpan sebagai "SPPG", tapi isinya apa pun: SPPG, kantin, rumah makan, toko, atau pelanggan lain |
| **Item** | nama barang yang Anda jual (contoh: Beras Premium) |
| **Qty** | jumlah barang (satuan yang dipakai di form, misal sak/kilogram) |
| **Faktur** | satu lembar tagihan dari satu kali transaksi. Satu pembelian = satu faktur hutang |
| **Hutang** | uang yang Anda **utang** ke toko karena belanja tempo |
| **Piutang** | uang yang **belum Anda terima** dari pelanggan karena barang sudah dikirim |
| **Tempo** | bayar belakangan (kredit), bukan langsung saat barang diterima |
| **Jatuh tempo** | tanggal paling akhir harus bayar (dihitung dari tempo yang disepakati, default 14 hari) |
| **HPP** | harga beli barang itu. Kalau barang dijual Rp 350.000 dan dibeli Rp 310.000, HPP-nya Rp 310.000 |
| **Margin** | untung per barang: harga jual dikurangi HPP |
| **Laba Kotor** | Omzet dikurangi HPP (belum dipotong biaya lain seperti bensin) |
| **Laba Bersih** | Laba Kotor dikurangi beban (sewa, transport, gaji, listrik, dll) |
| **Beban** | biaya yang tidak terkait barang, misalnya bensin atau listrik |
| **Opname** | menghitung barang fisik di gudang lalu membandingkan dengan catatan sistem |
| **Kas** | uang yang benar-benar ada (tidak termasuk yang masih jadi piutang) |

---

## 3. Alur harian Anda (lima langkah)

**Langkah 1 — Buka aplikasi.**
Buka SpendFlo di HP atau laptop. Kalau muncul layar kunci **SpendFlo**, isi nama pengguna
`admin` dan kata sandi `admin`, lalu tekan **Masuk**. Pilih **"Ingat saya 7 hari"** agar
tidak perlu mengetik ulang selama seminggu.

**Langkah 2 — Lihat Dasbor (1 menit).**
Buka menu **Dasbor**. Di sini Anda langsung tahu: uang masuk hari ini, uang keluar hari ini,
berapa pelanggan yang belum bayar, dan barang apa yang sudah menipis.

**Langkah 3 — Kirim barang yang sudah keluar.**
Buka menu **Kirim**. Pilih pelanggan, pilih barang, isi jumlah dan harga jual, lalu tekan
**Simpan**. Stok barang berkurang dan tagihan (piutang) otomatis tercatat.

**Langkah 4 — Catat pembayaran yang masuk.**
Kalau pelanggan membayar, buka menu **Piutang**, pilih pelanggan, isi jumlah uang yang
diterima, lalu konfirmasi. Aplikasi otomatis memotong dari tagihan yang paling lama.

**Langkah 5 — Kalau ada utang ke toko, bayar.**
Buka menu **Hutang**, tekan **Bayar** pada faktur yang jatuh tempo, atau **Bayar Semua**.

---

## 4. Penjelasan tiap menu, satu per satu

### 4.1 Layar Kunci (Masuk)

Layar pertama yang muncul sebelum isi data terlihat. Ini hanya **kunci tampilan**: mencegah
orang yang mengambil HP Anda langsung melihat angka bisnis. Isi `admin` / `admin`, centang
**Ingat saya 7 hari** bila ingin tidak mengetik lagi selama seminggu.

Keluar lagi kapan saja lewat **Profil → Sesi & Keamanan → Keluar**.

### 4.2 Dasbor

Layar ringkasan. Enam bagian penting:

1. **Total Nilai Usaha** — jumlah kas + seluruh piutang. Ini perkiraan "kaya" usaha Anda.
2. **Kas Masuk / Kas Keluar hari ini** — uang yang benar-benar bergerak hari ini.
3. **SPPG Menunggak** — berapa pelanggan yang belum membayar.
4. **Stok Tipis** — barang yang jumlahnya sudah di bawah batas minimum yang Anda tentukan.
5. **Indeks Cepat** — kartu kecil untuk stok, piutang, dan hutang.
6. **Peringatan** — pesan penting, misal ada pelanggan yang menunggak lama.

**Kapan dipakai:** setiap pagi, atau sebelum meeting dengan pelanggan.

### 4.3 Belanja (mencatat pembelian dari toko)

Menu ini mencatat setiap pembelian. Langkah-langkahnya:

1. Pilih **Toko Supplier**.
2. Pilih **Item Produk**.
3. Isi **Qty** (jumlah) dan **Harga Beli**.
4. Pilih **Metode**: **Tunai** (dibayar langsung) atau **Tempo** (dibayar nanti).
5. Tekan **Simpan**.

Setelah disimpan, stok bertambah dan riwayat belanja muncul di bawah form.

**Kalau belanja tempo:** hutang otomatis tercatat per faktur, lengkap dengan tanggal jatuh
tempo. Cara membayarnya ada di menu **Hutang**.

**Tips:** isi harga beli apa adanya. Harga jual dan untungnya dihitung otomatis di menu Kirim.

### 4.4 Hutang (utang Anda ke toko)

Halaman ini menampilkan daftar toko dan **sisa hutang per faktur**. Satu baris = satu
faktur (satu kali pembelian tempo).

- Tekan **Bayar** pada baris yang mau dibayar — muncul kolom kecil untuk isi jumlah, dan
  sistem akan menampilkan sisa yang harus dibayar.
- Tekan **Bayar Semua** untuk menutup faktur itu tanpa perlu menghitung.
- Setelah lunas, baris tersebut hilang dari daftar dan hutang Anda berkurang.

### 4.5 Kirim (mengirim barang ke pelanggan)

Ini menu inti usaha Anda. Langkah-langkahnya:

1. Pilih **SPPG** (pelanggan tujuan).
2. Pilih **Item**.
3. Isi **Qty** dan **Harga Jual**.
4. Tanggal terisi otomatis hari ini; ubah bila kirim di lain hari.
5. Tekan **Simpan**.

Yang terjadi otomatis: stok berkurang, margin dan HPP tercatat, dan pengiriman menjadi
**piutang** (karena pengiriman selalu tempo).

**Kalau muncul pesan "Stok kurang":** sistem menemukan stok catatannya kurang. Anda punya dua
pilihan: isi **Catatan override** berisi alasan (misal "stok sistem kurang 1 sak") lalu simpan
ulang, atau koreksi stoknya lebih dulu di menu **Stok**.

### 4.6 Piutang (tagihan ke pelanggan yang belum dibayar)

Halaman ini menampilkan semua pelanggan yang belum lunas beserta umur tagihannya.

- **Mencatat pembayaran:** pilih pelanggan, isi **Jumlah** uang yang diterima, konfirmasi.
  Aplikasi otomatis memotong dari tagihan **terlama lebih dulu**, lalu yang berikutnya — jadi
  Anda tidak perlu tahu faktur yang mana.
- Setelah lunas, pelanggan pindah dari daftar "belum bayar" ke riwayat.

**Umur tagihan** membantu Anda tahu siapa yang perlu dikejar: 1–7 hari masih wajar,
di atas 30 hari perlu segera ditagih.

### 4.7 Stok

Empat fungsi dalam satu menu:

1. **Posisi stok** — daftar barang beserta jumlah saat ini dan penanda "tipis".
2. **Batas minimum** — isi angka agar Anda diberi tahu saat barang mendekati habis.
3. **Mutasi** — riwayat barang masuk (belanja) dan keluar (kirim), lengkap dengan tanggal.
4. **Opname** — hitung barang fisik di gudang, masukkan angkanya, lalu tekan Simpan.
   Aplikasi menghitung selisih dan mengoreksi stok otomatis.

**Kapan dipakai:** setiap selesai belanja (cek stok), setiap bulan (opname), dan kapan pun
curiga ada barang hilang atau selisih.

### 4.8 Laporan (bagaimana tahu untung)

Menu ini menjawab pertanyaan: "bulan ini saya untung berapa?"

Cara memakainya:

1. Tekan salah satu tombol periode: **Minggu ini**, **Minggu lalu**, **Bulan ini**, atau
   **Bulan lalu**. Angka langsung berubah sesuai periode yang dipilih.
2. Bacalah berurutan dari atas:
   - **Omzet** — total nilai semua pengiriman pada periode itu.
   - **HPP** — total harga beli barang yang terjual.
   - **Laba Kotor** — Omzet dikurangi HPP.
   - **Beban** — biaya lain yang Anda catat pada periode itu.
   - **Laba Bersih** — Laba Kotor dikurangi Beban. **Ini angka untung Anda.**
3. **Arus Kas** di bawahnya menunjukkan uang yang benar-benar masuk dan keluar.
4. **Modal** menunjukkan berapa modal yang Anda pakai untuk belanja stok pada periode itu.

**Mencatat beban:** form **Beban** dipakai untuk biaya non-barang — misalnya bensin
(Transport), listrik (Listrik), sewa (Sewa), gaji (Gaji), atau Lain-lain. Pilih tanggal yang
benar lalu simpan; angka Laba Bersih langsung turun.

**Penting:** catat beban **pada hari yang sama** dengan kejadiannya. Beban yang dicatat
nanti tidak mengubah angka periode yang sudah lewat.

### 4.9 Master (data tetap)

Tiga tab: **Toko**, **SPPG**, **Item**. Di sini Anda menambah dan mengubah data yang dipakai
form lain.

- Tambah **Toko** dulu agar bisa mencatat Belanja.
- Tambah **Item** dulu agar bisa mencatat Belanja dan Kirim (sekalian isi harga jual terakhir
  dan batas stok minimum).
- Tambah **SPPG** dulu agar bisa mencatat Kirim dan Piutang.
- **Nonaktifkan** (bukan Hapus) untuk toko/pelanggan/item yang sudah tidak dipakai. Riwayat
  transaksi lama tetap utuh dan bisa dibuka.

### 4.10 Profil

- **Profil Supplier** — nama dan kontak yang tampil di aplikasi.
- **Sesi & Keamanan** — tombol **Keluar** untuk mengunci layar kembali.
- **Diagnosa koneksi** — tombol **Tes koneksi server** (untuk mengecek aplikasi bisa membaca
  data) dan **Tes simpan server** (untuk mengecek aplikasi bisa menyimpan). Tombol
  **Siapkan Spreadsheet** cukup diklik satu kali kalau ada tabel baru yang belum tersedia.
- **Versi app** — nomor versi yang tampil di sini. Sebutkan nomor ini kalau melapor masalah.

---

## 5. Rutinitas yang wajar

**Setiap hari (5–10 menit):**
- Buka Dasbor, lihat kas dan pelanggan yang menunggak.
- Catat semua pengiriman hari ini di menu Kirim.
- Catat pembayaran pelanggan yang masuk di menu Piutang.

**Setiap akhir minggu:**
- Buka Laporan → **Minggu ini**, cek Omzet, Laba Kotor, dan Arus Kas.
- Catat semua beban minggu ini (bensin, listrik, dll).
- Bayar toko yang tempo-nya jatuh.

**Setiap akhir bulan:**
- Laporan → **Bulan ini** dan **Bulan lalu**, bandingkan.
- Lakukan **Opname** di menu Stok.
- Tambah toko/pelanggan/item baru bila ada.

---

## 6. Kalau ada masalah

| Gejala | Penyebab | Yang harus dilakukan |
|---|---|---|
| Dropdown di form kosong | Toko / SPPG / Item belum ada | Buka **Master** dan tambahkan dulu |
| Muncul "Stok kurang" | Stok tercatat kurang dari jumlah yang dikirim | Isi **Catatan override** di form Kirim, atau perbaiki stok lewat Opname |
| Angka laporan terasa tidak benar | Beban dicatat setelah periode ditutup | Catat beban sesuai tanggal kejadiannya |
| Tombol Master tidak bisa diklik | Data belum pernah diisi | Tidak ada hak khusus; cukup isi datanya |
| Aplikasi lambat / error | Koneksi internet | Buka **Profil → Tes koneksi server**, catat hasilnya |
| Lupa sudah masuk | — | Isi `admin` / `admin` lagi di layar kunci |
| Ingin mengunci HP untuk orang lain | — | **Profil → Keluar** |

---

## 7. Tips supaya data tetap rapi

1. **Pilih satu pelanggan = satu nama.** Jangan membuat dua nama untuk pelanggan yang sama,
   agar piutang tidak terpecah.
2. **Selalu pilih metode pembayaran yang benar** saat Belanja (Tunai atau Tempo), supaya
   Hutang tidak salah hitung.
3. **Isi tanggal dengan benar.** Tanggal menentukan jatuh tempo dan laporan mingguan/bulanan.
4. **Catat beban rutin setiap minggu**, bukan ditunda sampai akhir bulan.
5. **Opname minimal sebulan sekali.** Selisih yang ketahuan cepat lebih murah daripada yang
   menggantung berbulan-bulan.
6. **Jangan hapus data.** Gunakan **Nonaktifkan** agar riwayat lama tetap bisa ditelusuri.

---

## 8. Ringkasan satu halaman

| Urutan | Menu | Isi singkat |
|---|---|---|
| 1 | Dasbor | Lihat kas, piutang, stok tipis |
| 2 | Master | Siapkan daftar Toko, SPPG, Item (sekali saja di awal) |
| 3 | Belanja | Catat pembelian (tunai/tempo) → stok bertambah |
| 4 | Kirim | Catat pengiriman ke pelanggan → stok berkurang, piutang bertambah |
| 5 | Piutang | Catat pembayaran pelanggan yang masuk |
| 6 | Hutang | Bayar toko yang tempo-nya jatuh |
| 7 | Stok | Cek posisi, mutasi, batas minimum, opname |
| 8 | Laporan | Omzet → laba bersih, kas, beban, modal |
| 9 | Profil | Identitas, keluar aplikasi, tes koneksi, versi |

---

Untuk yang teknis: lihat `README.MD`, `docs/ARCHITECTURE.MD`, `docs/DATA-MODEL.MD`.