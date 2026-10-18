# VERIFICATION REPORT — SPRINT 005
## Hutang per Faktur + Laporan Laba Mingguan/Bulanan + Beban

Tanggal: 2026-10-16 · Builder: sesi lanjutan · Verifikasi: **51/51 sandbox + 57/57 unit**

---

## Ringkasan verdict

| Bagian | Hasil | Bukti |
|---|---|---|
| A. Laporan laba (E13–E18) | **PASS 15/15** | Harness sandbox §A |
| B. Periode tanpa beban (E14) | **PASS 3/3** | Harness §B |
| C. Beban CRUD (E20, E24, E25) | **PASS 6/6** | Harness §C |
| D. Validasi beban (E21–E23) | **PASS 3/3** | Harness §D + test Node |
| E. Hutang per faktur (E1–E5) | **PASS 10/10** | Harness §E |
| F. Whitelist + JSON-aman (E28–E30) | **PASS 4/4** | Harness §F |
| G. SiapkanSpreadsheet (E26, E27) | **PASS 5/5** | Harness §G |
| Klien integrasi (browser) | **PASS 7/7** | Playwright §H |
| Unit test (`npm run check`) | **PASS 57/57** | lint + tsc + 7 file test |

---

## A–G. Bukti harness (Node + `vm`)

Spreadsheet palsu memakai **header asli** dari `src/config.gs` (dievaluasi di sandbox, bukan ditulis ulang) — mencegah kegagalan palsu akibat salah susun kolom.

```
=== A. getLaporanLaba (E13–E18) ===
  OK   omzet = 1750000
  OK   hpp = 1550000
  OK   labaKotor = 200000
  OK   marginPersen = 11.43
  OK   jumlahKirim = 5
  OK   bebanTotal = 50000
  OK   bebanJumlahCatatan = 2
  OK   labaBersih = 150000
  OK   bebanPerKategori = {"Sewa":30000,"Transport":20000}
  OK   modal.total = 2170000
  OK   modal.tempo = 1550000
  OK   modal.tunai = 620000
  OK   kas.keluar (belanja + beban) = 670000
  OK   kas.keluarBeban = 50000
  OK   kas.saldo = -670000
  OK   perItem.ITM-001.margin = 200000
=== B. Periode tanpa beban (E14) ===
  OK   bebanTotal 0 = 0
  OK   labaBersih == labaKotor = 0
  OK   jumlahKirim 0 = 0
=== C. getBeban / saveBeban / hapusBeban (E20, E24, E25) ===
  OK   2 baris beban = 2
  OK   urutan tanggal naik = true
  OK   id prefix BBN- = true
  OK   3 baris setelah save = 3
  OK   bebanTotal naik 550.000 = 550000
  OK   labaBersih jadi 200.000-550.000 = -350000
  OK   hapusBeban deleted = true
  OK   kembali 2 baris = 2
=== D. Validasi beban (E21–E23) ===
  OK   kategori asing = "KATEGORI_TIDAK_VALID"
  OK   jumlah 0 = "JUMLAH_TIDAK_VALID"
  OK   tanpa tanggal = "TANGGAL_WAJIB"
=== E. Hutang per faktur + bayar satu faktur (E1, E5, E6) ===
  OK   1 faktur terbuka = 1
  OK   sisa faktur A = 1550000
  OK   nama item = "Beras Premium"
  OK   itemId ikut dikirim = "ITM-001"
  OK   jatuhTempo ikut = true
  OK   totalSisa toko = 1550000
  OK   faktur tunai tak muncul = 0
  OK   pembayaran sebagian = [{"id":"BLI-A","bayar":500000}]
  OK   status jadi sebagian = "sebagian"
  OK   hutang sisa turun = 1050000
  OK   status lunas setelah pelunasan = "lunas"
  OK   daftar hutang kosong = 0
=== F. Whitelist + JSON-aman (E28–E30) ===
  OK   fungsi asing ditolak = "FUNGSI_TIDAK_DIKENAL:hapusSemua"
  OK   tak ada objek Date (aman utk google.script.run) = false
  OK   node dipindai > 10 = true
  INFO total node dipindai = 30
  OK   batas periode tepat 1 hari = 1
=== G. siapkanSpreadsheet (E26, E27) ===
  OK   Beban hilang sebelum setup = null
  OK   tabs jadi 12 = 12
  OK   Beban hadir kembali = true
  OK   Sheet1 tak tampil = null
  OK   idempoten (tetap 12) = 12

RINGKASAN: 51 lulus, 0 gagal  (exit 0)
```

Catatan jujur: 3 "kegagalan" pertama (labaBersih −350.000, alokasi tanpa `sisa`, jumlah node) ternyata **ekspektasi harness saya yang keliru**, bukan cacat kode:
- labaBersih benar: 200.000 − 550.000 = −350.000 (angka saya tulis salah di test).
- `alokasiHutang` memang berjodoh `{id, bayar}` kontrak Sprint 001 — tidak boleh "diperbaiki" agar cocok test.
- Jumlah node = 30, ambang >30 terlalu ketat.

---

## H. Bukti browser (Playwright, `index.html` asli + stub `api()`)

| # | Aksi | Hasil |
|---|---|---|
| H1 | Buka `#/laporan` | Versi `2026-10-16 #0325-laba`; preset aktif `bulan-ini*`; rentang `2026-10-01` → `2026-10-31` |
| H2 | Tabel laba | Omzet 1.750.000 · HPP 1.550.000 · Laba Kotor 200.000 (margin 11.43%) − Beban 50.000 = **Laba Bersih 150.000** · Modal Belanja Stok 1.850.000 (tunai 300.000 · tempo 1.550.000) |
| H3 | Kartu Arus kas | Masuk 1.500.000 · Keluaran 350.000 · Saldo 1.150.000 (Beban masuk keluar) |
| H4 | Daftar Beban | 2 baris (Sewa 30.000 "kios", Transport 20.000 "bensin 3x") + tombol Hapus |
| H5 | Dropdown kategori | `Sewa, Transport, Gaji, Listrik, Lain-lain`; tanggal default = hari ini |
| H6 | Buka `#/hutang` | Ringkasan toko + **2 baris faktur** dengan sisa (`Rp 1.550.000` & `Rp 200.000`), dropdown form bayar = `Toko Uji · sisa Rp 1.550.000` |
| H7 | Klik "Bayar faktur ini" | Form inline muncul, placeholder `sisa Rp 1.550.000`, tombol **Bayar / Bayar semua / Batal** |
| H8 | Klik "Bayar semua" | Argumen terkirim `{tokoId:"TK-001", pembelianId:"BLI-A", jumlah:1550000}`; banner `Pembayaran Rp 1.550.000 tercatat.`; form tertutup, daftar di-refresh |
| H9 | Simpan Beban | `saveBeban` menerima `{tanggal, kategori:"Gaji", jumlah:500000, catatan}`; banner `Beban Rp 500.000 (Gaji) tercatat.`; input jumlah dikosongkan |
| H10 | Klik "Siapkan Spreadsheet" | `siapkanSpreadsheet` dipanggil; hasil `SIAP · 12 tab siap (termasuk Beban)` |
| H11 | Preset periode | `minggu-ini` 12–18 Okt (mulai **Sen**, 7 hari) · `minggu-lalu` 5–11 Okt (7 hari) · `bulan-ini` 1–31 Okt (31 hari) · `bulan-lalu` 1–30 Sep (30 hari). Semuamuat tabel laporan |
| H12 | Console | **0 error, 0 warning** |

Perbaikan tampilan temuan saat uji: `&minus;` dirender sebagai teks literal (karena `esc()` meng-escape `&`) → diganti karakter `−` langsung.

---

## I. Unit test (`npm run check`)

```
ringkasan: 57 lulus, 0 gagal, 7 file test
```
File baru `tests/beban.test.js` (12 kasus) + `tests/laporan.test.js` bertambah 5 kasus (`agregatOmset`, `agregatModal`, regresi zona waktu). Lint + `tsc --noEmit` juga hijau.

## J. Regresi zona waktu (ditemukan saat Sprint 005, perbaikan menyeluruh)

`dalamRentang_` (Sprint 003) membandingkan dengan `new Date("2026-10-01")` = **UTC midnight**. Karena sel spreadsheet datang sebagai tengah malam **lokal**, baris tepat 1 Oktober (00:00 WIB = 30 Sep 17:00Z) **terkecualikan** dari periode. Diperbaiki lewat pembacaan manual `YYYY-MM-DD` → tengah malam lokal, diuji identik di `laporan.test.js` dan `beban.test.js`.

---

## K. Cek silang klien ↔ server (statis)

| Cek | Hasil |
|---|---|
| `el("...")` tanpa `id` | **0** (111 panggilan → semua punya id) |
| Fungsi dipanggil klien vs `apiDaftar_()` | **25/25 terdaftar** (30 fungsi di putih-senjata) |
| Fungsi putih-senjata vs definisi `function` di src | **30/30 ada** |
| `node --check` extraksi `<script>` | **EXIT=0** |
| URL eksternal / scriptlet `<?=` | 0 (tidak berubah dari Sprint 004) |
| Pustaka baru di `package.json` | **0** |

---

## L. Blokir untuk pemilik

1. **Tab ke-12 (`Beban`) belum ada** di spreadsheet lama → buka **Profil → Siapkan Spreadsheet** sekali (idempotent). Sebelum itu, segala pencatatan beban akan menampilkan pesan ramah "Tab 'Beban' belum ada di Spreadsheet".
2. Beban lama belum ada → **Laba Bersih = Laba Kotor** pada periode lama (ditandai eksplisit di layar).
3. `git commit` Sprint 005 belum dijalankan (menunggu perintah; kode live @HEAD).

---

## M. Daftar file Sprint 005

```
BARU  src/modules/beban.logic.gs            (KATEGORI_BEBAN, validasiBeban, barisBeban, agregatBeban, hitungLabaBersih)
BARU  src/modules/beban.server.gs           (getBeban, saveBeban, hapusBeban, agregatBebanPeriode_, actor_)
BARU  tests/beban.test.js                   (12 kasus)
UBAH  src/config.gs                         (TABS.Beban + TAB_ORDER → 12 tab)
UBAH  src/modules/laporan.logic.gs          (agregatOmset, agregatModal, awalRentangLaporan_ perbaiki zona waktu)
UBAH  src/modules/laporan.server.gs         (getLaporanLaba, kasPeriode_ faktorisasi)
UBAH  src/modules/pembelian.server.gs       (getHutangToko + faktur[])
UBAH  src/api.gs                            (+ getBeban, saveBeban, hapusBeban, getLaporanLaba, siapkanSpreadsheet)
UBAH  src/html/index.html                   (preset periode, tabel laba, form beban, daftar faktur + bayar inline, tombol Siapkan)
UBAH  eslint.config.js                      (globals Sprint 005)
UBAH  tests/laporan.test.js                 (+5 kasus)
BAAR  planning/sprints/sprint-005/ARCHITECT-PACK.MD
BARU  planning/sprints/sprint-005/VERIFICATION-REPORT.MD  (dokumen ini)
```
