# ARCHITECT PACK — SPRINT 005
## "Hutang per Faktur + Laporan Laba Mingguan/Bulanan"

Tanggal: 2026-10-16 · Status: **DISETUJUI PEMILIK 2026-10-16** (via question tool) · Sprint: 005

---

## 1. REQUIREMENTS

### R1 — Sisa hutang tampil per faktur + bayar langsung dari daftar (KEBAJTUAN)
**Konteks**: Pemilik: *"ketika belanja tempo ada input form bayar berapa dan langsung sisa nya tampil di hutang"*.

- **R1.1** Halaman Hutang menampilkan **sisa per faktur** (bukan hanya total per toko). Saat ini `getHutangToko()` hanya mengembalikan `{toko, totalSisa, jumlahFaktur}` sehingga pemilik tidak tahu faktur mana yang sisa berapa.
- **R1.2** Tiap baris faktur punya aksi **Bayar** yang membuka form input jumlah di baris tersebut (bukan pindah ke form terpisah).
- **R1.3** Input jumlah menampilkan **sisa faktur sebagai petunjuk** (placeholder `sisa Rp 1.550.000`) agar pemilik tidak salah input.
- **R1.4** Aksi **Bayar Semua** menutup faktur tersebut penuh dalam satu ketukan.
- **R1.5** Setelah pembayaran, **sisa pada baris yang sama berubah langsung** tanpa pindah halaman.
- **R1.6** Pembayaran per faktur Tertentu memakai alokasi ke `pembelianId` spesifik (server **sudah mendukung** sejak Sprint 001, `pembelian.server.gs:114` — cukup dipanggil).
- **R1.7** Backward-compatible: form bayar per toko yang sudah ada **tetap berfungsi** (alokasi FIFO ke seluruh faktur tertua toko itu).
- **R1.8** facts: jika pembayarannya sudah tercatat (idempoten), tampilan tidak berubah.

**Di luar scope R1**: cicilan terjadwal, dhakkae invoice PDF, kirim pengingat jatuh tempo.

### R2 — Laporan laba & modal, preset mingguan/bulanan (BARU)
**Konteks**: Pemilik: *"laporan laba mingguan dan bulanan, laporan laba mingguan dan laporan modal mingguan dan bulanan"*.

Keputusan pemilik (question tool 2026-10-16):
- **"Modal" = Modal Belanja Stok** — total uang keluar untuk belanja pada periode itu.
- **Laba = Laba Kotor + input Beban** → juga ada **Laba Bersih**.
- **Format = satu periode per tampilan** (tombol preset), bukan tabel rekap banyak periode.

- **R2.1** Preset cepat: **Minggu ini · Minggu lalu · Bulan ini · Bulan lalu**. Input `Dari`/`Sampai` manual **tetap ada** (fallback).
- **R2.2** Mingguan = Senin–Minggu (mengikuti kebiasaan sekolah/penjualan mingguan).
- **R2.3** Laporan menampilkan, dalam satu periode:
  - **Omzet** = Σ `Pengiriman.total`
  - **Modal Barang Terjual (HPP)** = Σ `Pengiriman.hargaBeliPakai`
  - **Laba Kotor** = Σ `Pengiriman.margin` + persentase margin
  - **− Beban** = Σ tab `Beban` pada periode itu
  - **= Laba Bersih** = Laba Kotor − Beban
  - **Modal Belanja Stok** = Σ `Pembelian.total` (dipecah tunai + tempo)
  - **Kas Masuk / Kas Keluar / Saldo Kas** (Kas Keluar sudah termasuk Beban)
- **R2.4** **Nol perubahan skema spreadsheet** untuk R2.3 — semua kolom sumber sudah ada (`Pengiriman.hargaBeliPakai`, `Pengiriman.margin` sudah berupa snapshot saat pengiriman).
- **R2.5** Bila periode belum punya Beban tercatat, Laba Bersih = Laba Kotor dan UI menyatakan eksplisit *"belum ada beban dicatat"*, supaya pemilik tidak salah baca laporan.
- **R2.6** Ringkasan margin per item **tetap ada** (tidak dihapus).

### R3 — Beban per tanggal (BARU — tab ke-12)
- **R3.1** Tab baru `Beban`, **satu baris per pengeluaran** (bukan per periode) — keputusan pemilik: *per tanggal*. Dipilih supaya bensin 3× seminggu tetap tercatat apa adanya tanpa mengedit ulang.
- **R3.2** Kolom: `id, tanggal, kategori, jumlah, catatan, createdBy, createdAt`.
- **R3.3** Kategori tertutup: **Sewa · Transport · Gaji · Listrik · Lain-lain**. Kategori di luar daftar ditolak (`KATEGORI_TIDAK_INVALID` → `KATEGORI_TIDAK_VALID`).
- **R3.4** Jumlah harus > 0 (`JUMLAH_TIDAK_VALID`), tanggal wajib (`TANGGAL_WAJIB`).
- **R3.5** Form input Beban di halaman Laporan + daftar Beban periode + hapus per baris.
- **R3.6** Penghapusan = hapus baris (baris kecil, tidak perlu arsip di Sprint ini) + catat `writeLog`.

### R4 — Setup tab baru tanpa langkah manual merepotkan
- **R4.1** `initSpreadsheet()` **tidak pernah dipanggil klien** saat ini → tab ke-12 tidak akan ada sampai dipanggil.
- **R4.2** Tombol **"Siapkan Spreadsheet"** di halaman Profil memanggilnya (idempotent — aman diklik berkali-kali).
- **R4.3** Kriteria A3 berubah: **11 tab → 12 tab**. Sheet1 tetap dihapus.

### R5 — Aturan proyek yang tidak boleh dilanggar
- **R5.1** Tidak boleh menambah library di luar BLUEPRINT → **nol dependensi baru**.
- **R5.2** Semua fungsi server wajib lewat **satu pintu `api()`** (keputusan 2026-10-16 hotfix). Fungsi baru wajib masuk putih-senjata.
- **R5.3** Logika agregasi wajib **murni & testable di Node** (pola `*.logic.gs` + `tests/*.test.js`).
- **R5.4** DoD = `npm run check` hijau (lint + typecheck + test).
- **R5.5** Tidak mengubah kontrak fungsi existing (hanya menambah field `faktur[]`).

---

## 2. BLUEPRINT

### 2.1 File baru
| File | Tanggung jawab |
|---|---|
| `src/modules/beban.logic.gs` | `KATEGORI_BEBAN`, `validasiBeban`, `agregatBeban`, `hitungLabaBersih`, `barisBeban` (murni, testable) |
| `src/modules/beban.server.gs` | `getBeban(filter)`, `saveBeban`, `hapusBeban`, `agregatBebanPeriode_` (adapter GAS) |
| `tests/beban.test.js` | 12 kasus |

### 2.2 File diubah
| File | Perubahan |
|---|---|
| `src/config.gs` | `TABS.Beban` + `TAB_ORDER` → 12 tab |
| `src/modules/laporan.logic.gs` | + `agregatOmset`, `agregatModal` (murni) |
| `src/modules/laporan.server.gs` | + `getLaporanLaba`, `kasPeriode_` (faktorisasi duplikasi dari `getLaporanKas`) |
| `src/modules/pembelian.server.gs` | `getHutangToko` + array `faktur[]` (sort FIFO) |
| `src/api.gs` | + `getBeban`, `saveBeban`, `hapusBeban`, `getLaporanLaba`, `siapkanSpreadsheet` |
| `src/html/index.html` | `view-laporan` (preset + tabel laba + form beban), `view-hutang` (daftar faktur + bayar inline), `view-profil` (tombol Siapkan), `view-nav` |
| `eslint.config.js` | globals baru |
| `tests/laporan.test.js` | + kasus `agregatOmset`/`agregatModal` |

### 2.3 Skema tab baru
```
Beban: ["id","tanggal","kategori","jumlah","catatan","createdBy","createdAt"]
```

### 2.4 Kontrak fungsi server baru
```
getLaporanLaba(filter)  → { periode:{dari,sampai}, omzet, hpp, labaKotor, marginPersen,
                            jumlahKirim, bebanTotal, bebanPerKategori, bebanJumlahCatatan,
                            labaBersih, modal:{total,tunai,tempo}, kas:{masuk,keluar,saldo}, perItem }
getBeban(filter)        → { header, rows:[{id,tanggal,kategori,jumlah,catatan}] }   // filter {dari,sampai}
saveBeban(payload)      → { id, created }
hapusBeban(id)          → { id, deleted }
siapkanSpreadsheet()    → { tabs, ok }        // pembungkus initSpreadsheet() untuk UI
getHutangToko()         → … + faktur:[{id,tanggal,jatuhTempo,item,qty,satuan,total,sisa,status}]
bayarHutang(params)     → TAK BERUBAH (sudah dukung params.pembelianId)
```

### 2.5 Peta view → fungsi
```
#/hutang    → getHutangToko, getHistoriBelanja, bayarHutang
#/laporan   → getLaporanLaba, getBeban, saveBeban, hapusBeban
#/profil    → getProfil, saveProfil, getPing, diagTulis, siapkanSpreadsheet
```

### 2.6 DSA
| Opsi | Kompleksitas | Catatan |
|---|---|---|
| Agregasi laba 1 batch read/tab | **O(n) per tab, 1 lintasan** | `n` = baris transaksi; filter rentang inline, tanpa sort. Dipilih. |
| Rekap per minggu/bulan (banyak baris) | O(n + w·log w) | **Ditolak** — pemilik pilih satu periode per tampilan (R2 format). |
| Hapus baris Beban | O(1) `deleteRow` | `n` Beban kecil. |
| `faktur[]` per toko | O(F) sort satu kali | F = faktur tempo terbuka, kecil. |

### 2.7 Risiko
| Risiko | Mitigasi |
|---|---|
| Tab ke-12 belum ada di spreadsheet → seluruh app error | Tombol "Siapkan Spreadsheet" + pesan galat `TAB_TIDAK_ADA:Beban` yang sudah ada di `galatDasar_` |
| Kriteria A3 lama bilang 11 tab | Diperbarui di VERIFICATION-REPORT + STATE |
| Beban periode lama kosong → Laba Bersih = Laba Kotor | R2.5: UI menyatakan eksplisit |
| `getLaporanLaba` membaca 5 tab | Batas quota Spreadsheet berjam-jam; 1 lintasan per tab sudah minimum |
| Bug hotfix `api()` berulang | Semua fungsi baru wajib didaftarkan di `api.gs` + `api.test.js`/cek silang |

---

## 3. ACCEPTANCE

Format Given/When/Then. Semua harus PASS + `npm run check` hijau.

| # | Given | When | Then |
|---|---|---|---|
| **E1** | Factur tempo belum lunas | `getHutangToko()` | Setiap toko punya `faktur[]`; tiap faktur ada `id, tanggal, item, total, **sisa**, jatuhTempo, status`; `faktur` urut **tanggal menaik** (FIFO) |
| **E2** | `getHutangToko()` tanpa faktur tempo terbuka | dipanggil | `faktur: []`, `jumlahFaktur: 0`, tanpa error |
| **E3** | Halaman `#/hutang` | dibuka | Tiap baris faktur menampilkan **sisa** + tombol **Bayar**; baris tanpa sisa tidak muncul |
| **E4** | Faktur sisa Rp 1.550.000 | tombol Bayar diketuk | Form inline terbuka di baris itu, placeholder memuat `sisa Rp 1.550.000` |
| **E5** | Form inline, nilai = sisa | Simpan | `bayarHutang({tokoId, pembelianId, jumlah})` → faktur jadi **lunas**, hilang dari daftar terbuka, banner hijau |
| **E6** | Form inline | **Bayar Semua** diketuk | jumlah dikirim = sisa faktur penuh (tanpa ketik manual) |
| **E7** | Pembayaran idempoten (sudah tercatat) | dipanggil | `alokasi` berisi `idempoten:true`, tanpa baris ganda |
| **E8** | Form bayar per toko lama | diisi & submit | tetap alokasi FIFO ke seluruh faktur tertua toko (R1.7) |
| **E9** | Halaman `#/laporan` | dibuka | Default = **Bulan ini** terisi di `Dari`/`Sampai` |
| **E10** | Tombol **Minggu ini** | diketuk | `Dari`=Senin minggu tsb, `Sampai`=Minggu; laporan dimuat |
| **E11** | Tombol **Minggu lalu** | diketuk | rentang 7 hari penuh-configuration sebelumnya, label minggu benar |
| **E12** | Tombol **Bulan ini / Bulan lalu** | diketuk | tanggal 1 s/d akhir bulan (28/29/30/31 benar) |
| **E13** | Pengiriman 5 × (jual 350.000, HPP 310.000) | `getLaporanLaba({dari,sampai})` | omzet 1.750.000 · hpp 1.550.000 · labaKotor 200.000 · marginPersen ≈ 11,43 |
| **E14** | Periode tanpa Beban | `getLaporanLaba` | `bebanTotal: 0`, `bebanJumlahCatatan: 0`, `labaBersih == labaKotor` |
| **E15** | Periode dengan Beban Rp 50.000 | `getLaporanLaba` | `bebanTotal: 50.000`, `labaBersih = labaKotor − 50.000` |
| **E16** | Beban Rp 30.000 Sewa + Rp 20.000 Transport | `getLaporanLaba` | `bebanPerKategori = {Sewa:30.000, Transport:20.000}` |
| **E17** | Pembelian tunai 300.000 + tempo 1.550.000 | `getLaporanLaba` | `modal.total = 1.850.000`, `modal.tunai = 300.000`, `modal.tempo = 1.550.000` |
| **E18** | `getLaporanLaba` | dipanggil | `kas.keluar` **sudah termasuk** Beban; `kas.saldo = masuk − keluar` |
| **E19** | Halaman Laporan | periode tanpa beban | UI menampilkan catatan *"belum ada beban dicatat"* |
| **E20** | Beban kategori `Sewa` Rp 75.000 | `saveBeban` | tersimpan, `id` prefix `BBN-`, `created:true`, baris masuk tab `Beban` |
| **E21** | Kategori `Makan` (di luar daftar) | `saveBeban` | dilempar `KATEGORI_TIDAK_VALID` |
| **E22** | Jumlah `0` / negatif | `saveBeban` | dilempar `JUMLAH_TIDAK_VALID` |
| **E23** | Tanpa tanggal | `saveBeban` | dilempar `TANGGAL_WAJIB` |
| **E24** | Beban tersimpan | `hapusBeban(id)` | baris hilang, `{deleted:true}`, tercatat di `Log` |
| **E25** | `getBeban({dari,sampai})` | dipanggil | hanya baris dalam rentang, urut tanggal **naik** |
| **E26** | Spreadsheet belum punya tab `Beban` | klik **Siapkan Spreadsheet** | tab dibuat + header tertulis; klik kedua = aman, tetap 12 tab |
| **E27** | 12 tab setelah setup | `initSpreadsheet()` | **tepat 12** tab bisnis, tanpa `Sheet1` |
| **E28** | Semua fungsi baru | cek silang | ada di `apiDaftar_()` **dan** punya `function` di `src` |
| **E29** | Klien | `npm run check` + `node --check` | hijau; semua `el("...")` punya id di HTML |
| **E30** | Semua fungsi data | dipanggil via `google.script.run` **langsung** (bukan `api`) | tidak pernah dipakai — semua lewat `api()` (R5.2) |

---

## 4. HANDOFF PROMPT

Anda adalah builder Sprint 005. Baca `AGENTS.MD`, `STATE.MD`, `DECISIONS.MD`, lalu pack ini.

1. **JANGAN** mengubah requirement di §1 tanpa persetujuan pemilik.
2. **JANGAN** menambah library (R5.1).
3. **WAJIB** lewat `api()` untuk semua fungsi server (R5.2) + daftarkan di putih-senjata `src/api.gs`.
4. **WAJIB** logika agregasi murni di `*.logic.gs` + test Node (`R5.3`).
5. **WAJIB** pesan galat memakai kode yang sudah ada di `galatDasar_()`; jangan menambah pesan hard-coded baru tanpa kebutuhan.
6. Set `$ErrorActionPreference='Stop'` bila memakai helper.
7. DoD: `npm run check` hijau **dan** semua E1–E30 PASS **dan** `clasp push -f` keluar 0.
8. Laporkan bukti asli (output test, daftar file ter-push), bukan ringkasan.

**Perintah verifikasi minimum**
```powershell
npm run check
# node --check klien:
$html = Get-Content src\html\index.html -Raw
$js = ([regex]::Matches($html,'(?s)<script>(.*?)</script>') | ForEach-Object { $_.Groups[1].Value }) -join "`n"
Set-Content C:/Users/<pengguna>/AppData\Local\Temp\opencode\k.js -Value $js -Encoding UTF8
node --check C:/Users/<pengguna>/AppData\Local\Temp\opencode\k.js
npx clasp push -f
```