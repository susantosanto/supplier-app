# VERIFICATION REPORT — SPRINT 006
## "Lock Screen Premium (admin/admin)"

Tanggal: 2026-10-18 · Status: **SELESAI builder — ter-deploy live dev @HEAD** · Bukti asli terlampir di bawah

---

## 1. Ringkasan

| Metrik | Sprint 005 (sebelum) | Sprint 006 (sekarang) |
|---|---|---|
| `npm run check` | 57 lulus / 0 gagal | **74 lulus / 0 gagal** (17 kasus `tests/login.test.js`) |
| File `.gs` disentuh | — | **0** (bukti §5) |
| Dependensi baru | — | **0** (`package.json` tidak berubah) |
| Tab spreadsheet | 12 | 12 (tidak berubah) |
| Nama aplikasi | Supplier MBG | **SpendFlo** — "Pengadaan & Pengiriman" |
| Logo | kubus ASCII + huruf "M"/"S" | **mark "S ›"** (2 stroke, grid 24, stroke-width 1.6) |
| Versi klien | `2026-10-16 #0325-laba` | `2026-10-18 #0326-spendflo` |

---

## 2. Output test asli (`npm run check`, EXIT=0)

```
> eslint --no-error-on-unmatched-pattern "src/**/*.{js,gs}" tests
> tsc -p tsconfig.json --noEmit
> node tests/run.js

ok - login.test.js :: sha256Hex_ vektor standar kosong
ok - login.test.js :: sha256Hex_ vektor standar abc
ok - login.test.js :: sha256Hex_ cocok oracle crypto Node (3 input)
ok - login.test.js :: sha256Hex_ menangani input panjang (> 1 blok)
ok - login.test.js :: sha256Hex_ menangani karakter non-ASCII (UTF-8)
ok - login.test.js :: cocokkanAuth_ menerima admin/admin
ok - login.test.js :: cocokkanAuth_ menolak password case berbeda
ok - login.test.js :: cocokkanAuth_ menolak username case berbeda
ok - login.test.js :: cocokkanAuth_ menolak password kosong / salah
ok - login.test.js :: konstanta AUTH.HASH = sha256(admin|admin) menurut oracle
ok - login.test.js :: source tidak memuat kata sandi polos
ok - login.test.js :: elemen gate lengkap ada di HTML
ok - login.test.js :: init() bergate: tidak memanggil tampil() langsung
ok - login.test.js :: sesi 7 hari + keluar lengkap
ok - login.test.js :: CSS gate: hidden & terkunci, tanpa hex warna baru
ok - login.test.js :: gate tidak memicu server: gantiTema() tak dipakai di dalam gate
...
ringkasan: 73 lulus, 0 gagal, 8 file test
npm run check EXIT=0
```

Bukti tambahan: ekstrak `<script>` dari `index.html` → `node --check` **EXIT=0**.

---

## 3. Dua bug nyata yang ditemukan oleh test (dan diperbaiki)

Test bukan hiasan — dua bug ditemukan **sebelum** kode sampai ke browser:

| # | Bug | Gejala | Akar masalah | Perbaikan | Bukti sesudah |
|---|---|---|---|---|---|
| B1 | Konstanta hash salah di pack | `admin/admin` tidak akan pernah cocok | Pack menulis `8c6976e5…18a918` = `sha256("admin")`, padahal yang diverifikasi `sha256("admin\|admin")` | Konstanta diganti `26ac484ab33dea0a0737411fff787c6a3a0c5427838f0196e8377b13c8ccf892` (oracle Node) | L10 hijau |
| B2 | SHA-256 JSPURE salah pada input non-kosong | Hashsampel acak untuk semua input kecuali string kosong | **Dua** galat: (a) `heks_()` menggeser `k*4` (nibble) bukan `k*8` (byte); (b) panjang 64-bit ditulis di paruh tinggi `msg[pad-8..pad-5]`, harus paruh rendah `msg[pad-4..pad-1]`. String kosong lolos karena panjangnya 0 | Kedua baris diperbaiki | 13/13 vektor (termasuk 1000 karakter & UTF-8) cocok dengan `crypto` Node |

Pelajaran yang dicatat: masukkan kosong yang "kebetulan benar" adalah bug tersembunyi — karena itu test memakai **oracle independen** (`crypto` Node), bukan perbandingan dengan implementasi sendiri.

---

## 4. Bukti browser (Playwright MCP, harness lokal + stub `api`)

Harness: `src/html/index.html` **apa adanya** + stub `google.script.run` (data tiruan), dilayani `http://127.0.0.1:8123`. Tidak ada modifikasi kode aplikasi untuk pengujian.

| Kriteria | Hasil nyata |
|---|---|
| Gate tampil layar penuh | `gate.hidden=false`, `body.class="terkunci"`, kartu 380px di tengah layar (screenshot `gate-01-terkunci.png`) |
| **0 request server sebelum unlock** | `window.__PANGGIL` = `[]` (stub mencatat setiap `.api()` yang dipanggil) |
| Password salah | banner "Nama pengguna atau kata sandi salah." + kartu `goyang` (shake) + password dikosongkan + **tetap terkunci** + `__PANGGIL` = `[]` |
| Field kosong | "Isi nama pengguna dan kata sandi." tanpa memanggil hash |
| `admin` / `admin` (klik nyata) | gate hilang **tanpa reload**, dashboard terisi: Piutang `Rp 1.550.000`, Kas `Rp 300.000` |
| Buka ulang < 7 hari | `gate.hidden=true` langsung, dashboard terisi (token terbaca) |
| "Ingat saya" tidak dicentang | login tetap berhasil **tanpa** menulis token; buka ulang → **gate tampil lagi** |
| Token rusak / kedaluwarsa | `mbg-auth-v1` dibuang otomatis, gate tampil, `__PANGGIL` = `[]` |
| Tombol mata show/hide | `type` `password` → `text` → `password` |
| Tema di gate | dark → light, `data-tema="light"`, `mbg-tema=light`, **0 request server** (bukti `gantiTema()` tidak dipakai) |
| Kontras light theme | terbaca jelas (screenshot `gate-02-tema-terang.png`) |
| Keluar (Profil) | `tombol-keluar` → reload → gate tampil, `mbg-auth-v1=null` |
| 9 rute setelah login | dashboard/belanja/kirim/piutang/stok/laporan/hutang/master/profil semua `view.aktif` benar |
| Konsol | **0 error, 0 warning** (`browser_console_messages`) |
| Mobile 390px | gate rapi, tombol terjangkau, tanpa overflow horizontal (screenshot `gate-05-hp-390.png`) |
| Versi di Profil | `2026-10-18 #0326-gate` |

---

## 5. Bukti "nol perubahan server"

`git diff` tidak bisa dipakai sebagai bukti karena 28+ path uncommitted Sprint 002–005 sudah ada sebelum sprint ini. Bukti yang dipakai:

1. **Waktu modifikasi**: seluruh `src/**/*.gs` terakhir diubah **2026-10-16 01:26–04:10**; hanya `src/html/index.html` (2026-10-18 22:50) dan `tests/login.test.js` (22:45) yang disentuh Sprint 006.
2. **Hash pra-push vs lokal**: 23/23 file `.gs` + `html/index.html` identik dengan salinan sebelum `clasp push` → tidak ada file server yang berubah oleh sprint ini.
3. **Tarik ulang cloud**: `clasp pull` mengunduh 24 file; 22 kembaran `.js` hasilan `#identik dengan .gs` → isi cloud = isi lokal.
4. `npm run check` tetap 57 kasus lama + 16 baru = 73, semua hijau.

Catatan operasional: `clasp pull` membuat kembaran `.js` di `src/` (perilaku clasp 3.4.1). Kembaran itu **sudah dihapus** (0 file `.js` tersisa di `src`) karena akan dilint dan ter-push sebagai duplikat.

---

## 6. Status per kriteria ACCEPTANCE (E1–E30)

| # | Status | Catatan |
|---|---|---|
| E1 | **PASS** | Gate tampil layar penuh, kartu di tengah |
| E2 | **PASS** | `__PANGGIL` kosong sebelum unlock (3 kali diuji: muat awal, salah password, ganti tema) |
| E3 | **PASS** | Klik nyata tombol Masuk → dashboard terisi tanpa reload |
| E4 | **PASS** | Buka ulang URL → langsung masuk |
| E5 | **PASS** | Tanpa "Ingat saya" → buka ulang memunculkan gate |
| E6 | **PASS** | Banner merah + shake + password dikosongkan + tetap terkunci |
| E7 | **PASS** | Pesan isi-dua-field, hash tidak dipanggil |
| E8 | **PASS** | `type` berbalik `password` ↔ `text` |
| E9 | **PASS** | Gate ikut tema, pilihan tersimpan, 0 request |
| E10 | **PASS** | Keluar → gate, token terhapus |
| E11 | **PASS** | Screenshot light theme: kontras teks/label/banner baik |
| E12 | **PASS** | 390px: tanpa overflow, tombol terjangkau |
| E13 | **PASS** | 9 rute aktif benar, 0 error konsol |
| E14 | **PASS** | `VERSI_APP` = `2026-10-18 #0326-gate` di Profil |
| E15 | **PASS** | 0 error JS (error + warning) |
| E16 | **PASS** | `node --check` EXIT=0 |
| E17 | **PASS** | 3 input + 2 vektor standar identik dengan oracle `crypto` |
| E18 | **PASS** | 4 kombinasi kredensial |
| E19 | **PASS** | Hanya hash hex; tidak ada literal `password: "admin"` |
| E20 | **PASS** | 12 id gate + `tombol-keluar` ada |
| E21 | **PASS** | `init()` → `authAkses_()` → `lanjutInit_()`/`initGate_()`, tanpa `tampil()` langsung |
| E22 | **PASS** | `mbg-auth-v1`, `HARI: 7`, `authHapus_()`, `location.reload()` |
| E23 | **PASS** | `.gate[hidden]{display:none}` + `body.terkunci` ada; 0 hex baru |
| E24 | **PASS** | lint 0 · tsc 0 · 73/0 |
| E25 | **PASS** | Bukti §5 (diperluas: mtime + hash pra-push, bukan `git diff`) |
| E26 | **PASS** | EXC-006-01 + 5 risiko + 2 ADR + STATE diperbarui |
| E27 | **PASS** | `clasp push -f` EXIT=0; tarik ulang identik (§5.3) |
| E28 | **PASS** | Tetap 1 deployment `AKfycbw09…` @HEAD |
| E29 | **UNTESTED** | "Who has access = Only myself" hanya bisa dicek pemilik di editor Apps Script — CLI tidak membacanya. **Harus dicek sebelum sprint ditutup.** |
| E30 | **PASS** | Gate **tidak** memuat teks peringatan (R7.1 dibatalkan pemilik 2026-10-18); kartu tetap rapi, tinggi kartu 502px di 390px viewport, 0 request server |

**Ringkasan: 29 PASS · 0 FAIL · 1 UNTESTED (butuh tindakan pemilik).**

---

## 7. Penyimpangan dari pack (dicatat, bukan disembunyikan)

0. **Teks peringatan di gate dihapus atas perintah pemilik (2026-10-18, setelah deploy pertama).** R7.1 ("Kunci tampilan, bukan pengaman data…") dibatalkan; elemen `.gate-catatan` + CSS-nya dihapus, assertion test `teks jujur gate hilang` ikut dibuang, `npm run check` tetap 73/73, push ulang EXIT=0. Risiko yang tersisa: layar login tanpa penanda lebih mudah disalahartikan sebagai pengaman → tercatat di `RISKS.MD` + ADR. Penjelasan yang tersisa hanya di kartu "Sesi & keamanan" (Profil).

1. **Tombol tema di gate memakai `terapkanTema()`, bukan `gantiTema()`.** Pack §R4.5 menyebut `gantiTema()`; saat implementasi ditemukan bahwa `gantiTema()` memanggil `tampil()` → `muatMaster()` → **request server**, sehingga akan melanggar E2. Perbaikan: `terapkanTema()` langsung (tema tetap sama, nol request). Ditutup test `gate tidak memicu server…`.
2. **Audit `init()` memakai pembungkus `muatUlang_()`.** Banner "coba lagi" sebelumnya memanggil `tampil()`; sekarang lewat `muatUlang_()` yang memeriksa `appHidup_`, sehingga `init()` benar-benar bebas dari `tampil()` (syarat E21).
3. **Konstanta hash dikoreksi** (lihat §3 B1).
4. **E25 dikoreksi** dari `git diff` menjadi bukti mtime + hash pra-push (lihat §5).

---

## 8. Yang belum dikerjakan (sengaja)

- Tanpa `git commit` (menunggu perintah pemilik; masih ada 28+ path uncommitted Sprint 002–005).
- Tanpa deploy versi baru ke produksi (produksi berversi = Sprint 007).
- E29 menunggu pemeriksaan manual pemilik.

---

## 9. Uji yang harus dilakukan pemilik di HP

1. Buka web app → harus muncul layar kunci **SpendFlo**.
2. `admin` / `admin` → dashboard langsung tampil.
3. Tutup HP, buka lagi dalam 7 hari → **tidak** perlu login lagi (memakai "Ingat saya").
4. Profil → **Keluar** → layar kunci muncul lagi.
5. Lanjut menguji fitur Sprint 005 yang belum berubah (Hutang → bayar per faktur; Laporan → preset + catat beban).
6. **Cek Deploy → Manage deployments → `AKfycbw09…` → "Who has access" = Only myself** (E29).

---

## 10. PENUTUPAN SPRINT (2026-10-18, setelah rebranding)

### 10.1 Perubahan setelah gate live (diminta pemilik, di luar pack awal)
1. Teks peringatan di gate **dihapus** (R7.1 dibatalkan) → §7 butir 0.
2. Nama aplikasi **"Supplier MBG" → SpendFlo** (subtitle "Pengadaan & Pengiriman") → BLUEPRINT §11.1.
3. Logo mark baru **"S ›"** replacing kubus + huruf "M"/"S" → BLUEPRINT §11.2.

Semua ketiganya diminta pemilik setelah Sprint 006 disetujui dan setelah deploy pertama, dicatat di `DECISIONS.MD` (3 entri), bukan diam-diam masuk ke pack.

### 10.2 Bukti branding (audit otomatis + screenshot)
Audit `src/html/index.html` setelah `clasp pull` (isi = isi cloud):
```
file src dibandingkan: 24 | identik lokal vs pra-push: 24
OK  title SpendFlo                       OK  kunci spendflo-auth-v1
OK  brand SpendFlo                       OK  kunci spendflo-tema
OK  gate SpendFlo                        OK  tanpa kunci mbg-
OK  subtitle Pengadaan                   OK  versi #0326-spendflo
OK  logo path (2x)                       OK  tanpa teks peringatan gate
OK  tanpa SPENDFLO uppercase             OK  tanpa 'Supplier MBG'
```
Screenshot: `logo-06-gate-final.png` (gate 1280px), `logo-07-lockup.png` (lockup sidebar), `logo-05-kandidat.png` (perbandingan 3 kandidat di 96px & 20px), `spendflo-02-sidebar.png` (sidebar aplikasi).

### 10.3 Deploy akhir
```
npx clasp push -f          → EXIT=0
npx clasp pull             → EXIT=0, "Pulled 24 files"
npx clasp deployments      → Found 1 deployment: AKfycbw09… @HEAD
verifikasi cloud vs lokal  → 24/24 identik
kembaran .js dari pull     → 22 file, dihapus (0 sisa di src/)
npm run check              → 74 lulus, 0 gagal, EXIT=0
node --check (klien)       → EXIT=0
```

### 10.4 Status akhir
**37 PASS (29 gate + 8 rebranding) · 0 FAIL · 1 UNTESTED (E29).**
`npm run check` hijau, konsol browser 0 error/0 warning, cloud identik lokal.

### 10.5 Yang masih terbuka (tidak dikerjakan, sengaja)
- **E29 UNTESTED** — hanya pemilik bisa memastikan "Who has access = Only myself" di editor Apps Script.
- **`git commit` belum dilakukan** — menunggu perintah pemilik; masih ada 28+ path uncommitted sejak Sprint 002 (JANGAN `git checkout -- .` / `git stash`).
- **Efek samping branding**: kunci `localStorage` berubah → pemilik perlu **login 1x lagi** dan tema kembali default 1x.
- **Deploy produksi berversi** = Sprint 007 (belum).