# SpendFlo

**Aplikasi Pengadaan & Pengiriman** — sistem operasional untuk pemasok bahan pangan sekolah: mencatat belanja ke toko, mengirim barang ke pelanggan SPPG, memantau stok, piutang, hutang, dan menghitung laba bersih.

Berjalan langsung di **Google Apps Script + Google Sheets**. Tanpa server, tanpa database eksternal, tanpa biaya bulanan: data tinggal di Spreadsheet milik pemilik sendiri.

---

## Untuk siapa

Pemilik usaha pemasok kebutuhan pokok sekolah (program makan gratis): satu orang yang sebelumnya mencatat belanja, pengiriman, dan pembayaran di buku atau chat. Semua cukup dilakukan dari HP.

---

## Fitur

| Modul | Isi |
|---|---|
| **Dasbor** | Total nilai usaha (kas + piutang), kas masuk/keluar hari ini, SPPG menunggak, stok tipis, indeks cepat stok/piutang/hutang, peringatan |
| **Belanja** | Pembelian ke toko (tunai/tempo), riwayat, **sisa hutang per faktur** + bayar per faktur / bayar semua (alokasi FIFO) |
| **Kirim** | Pengiriman ke SPPG, harga jual, HPP, margin otomatis, catatan override saat stok kurang |
| **Piutang** | Tagihan per SPPG + aging, pembayaran dengan alokasi ke faktur tertua, status lunas/belum |
| **Hutang** | Sisa per faktur ke toko, form bayar inline, alokasi idempoten |
| **Stok** | Posisi stok per item, mutasi, batas stok minimum, stock opname + koreksi |
| **Laporan** | Omzet → HPP → laba kotor → beban → **laba bersih**, modal belanja stok, arus kas, margin per item. Preset: Minggu ini/lalu, Bulan ini/lalu |
| **Beban** | Catatan pengeluaran (Sewa/Transport/Gaji/Listrik/Lain-lain) per tanggal — masuk sebagai pengurang laba |
| **Master** | CRUD Toko, SPPG, Item (nonaktifkan, bukan hapus) |
| **Profil** | Identitas supplier, tes koneksi server, tombol "Siapkan Spreadsheet" (tambah tab baru) |
| **Layar login** | Kunci tampilan 7 hari (`admin` / `admin`) — bukan pengaman data, hanya mencegah layar terbuka di HP yang ditinggal |

---

## Arsitektur

```
Spreadsheet (12 tab data)  ←→  Apps Script (server)  ←→  index.html (klien)
                                  │                        │
                       guardOwner_() fail-closed     satu pintu: api(nama, args)
                       + dispatcher api()            serialisasi JSON aman
                       + logika murni *.logic.gs     (testable di Node)
```

Prinsip yang dipegang sejak awal:

1. **Satu pintu klien → server.** Semua panggilan lewat `api(nama, args)`; hasilnya dikembalikan sebagai **String JSON** (Apps Script tidak bisa mengirim objek `Date`, dan diam-dirim mengirim `null` kalau gagal).
2. **Logika murni terpisah.** Perhitungan agregasi/validasi ditulis di `*.logic.gs` tanpa API Google, lalu diuji dengan Node — bukan diuji lewat browser.
3. **Fail-closed.** Setiap fungsi server memanggil `guardOwner_()`; tanpa email pemilik di `ScriptProperties` atau sesi yang tidak cocok, fungsi **melempar `AKSES_DITOLAK`**, bukan membuka data.
4. **Klien boleh berubah, kontrak server tidak.** Handler klien boleh ditulis ulang; bentuk data server terkunci lewat test.
5. **Nol dependensi runtime.** Tidak ada library pihak ketiga di aplikasi; `package.json` hanya untuk alat devs (clasp, eslint, typescript).

---

## Keamanan

- Kontrol akses sesungguhnya ada di **Google Apps Script**: web app dijalankan "Execute as: Owner" dan hanya bisa dibuka akun pemilik. Button di dalam aplikasi (layar login) hanya lapisan tampilan.
- Tidak ada rahasia di source: ID proyek & kredensial disimpan di `.clasp.json`/`.clasprc.json` yang **tidak** masuk repo.
- Semua penulisan data melewati `writeLog()` ke tab `Log` (append-only) untuk penelusuran.
- Login aplikasi=`admin`/`admin` disimpan sebagai hash SHA-256 di klien, bukan teks polos.

---

## Menjalankan test

```bash
npm install
npm run check      # lint + typecheck + test
```

Saat ini: **74 test hijau** (0 gagal), mencakup logika pembelian, pengiriman, piutang, stok, beban, laporan, dispatcher `api()`, dan gate login.

---

## Deploy

Butuh Google account dengan Apps Script API aktif dan sudah login lewat `clasp`:

```bash
npx clasp login
npx clasp push -f        # kode di src/ otomatis live di web app @HEAD
npx clasp pull           # tarik ulang (file .gs/.html)
```

> `clasp pull` membuat kembaran `.js` di `src/` — hapus setelah tarik ulang, jangan ikut commit.

Struktur penting:

```
src/
  api.gs / api.logic.gs     dispatcher + serialisasi JSON aman
  config.gs                 nama tab, header, seed Config, ID spreadsheet
  server.gs                 doGet + guardOwner_
  db.gs / audit.gs / init.gs / secrets.gs
  html/index.html           seluruh UI (9 halaman, mobile-first)
  modules/*.logic.gs        logika murni (unit test)
  modules/*.server.gs       adapter Google Sheets
tests/                      harness Node (tanpa Jasmine)
docs/                       arsitektur, model data, laporan audit keamanan
planning/sprints/           dokumen arsitektur + laporan verifikasi per sprint
```

---

## Status & rencana

| Sprint | Isi | Status |
|---|---|---|
| 001–005 | Master, pembelian/hutang, pengiriman/piutang, stok/opname, dashboard/UI, laporan laba + beban | Selesai, ter-deploy |
| 006 | Layar login + penyegaran nama & logo | Selesai, ter-deploy |
| 007 | Operasional: arsip, backup, deploy berversi ke produksi, monitoring | Rencana |

---

## Catatan privasi

Repositori ini berisi **kode aplikasi**, bukan data transaksi. Data operasional ada di Spreadsheet pemilik (privat) dan tidak pernah masuk ke sini. Released under MIT.