# ACCEPTANCE — SPRINT 006
## "Lock Screen Premium (admin/admin)"

Format **Given/When/Then**. Semua PASS + `npm run check` hijau.

**Status akhir 2026-10-18: 29 PASS · 0 FAIL · 1 UNTESTED (E29, perlu cek manual pemilik).** Bukti lengkap: `VERIFICATION-REPORT.MD` di folder ini.

Legend: T = otomatis (test Node), B = browser (Playwright MCP), D = dokumen/push.

| # | Given | When | Then | Jenis |
|---|---|---|---|---|
| **E1** | Halaman dibuka di HP dengan `localStorage` kosong | `init()` jalan | Gate **tertampil layar penuh** (kartu ≥ 340px, vertikal tengah), app di belakangnya tidak dimuat | B |
| **E2** | Gate tampil | submit, lalu cek Network | **0** permintaan `google.script.run` (tidak ada `getMaster`/ping) sebelum unlock | B |
| **E3** | Gate tampil | `admin` / `admin` | Gate hilang (fade/remove), dashboard terisi angka asli dari server, tanpa reload halaman | B |
| **E4** | Sudah login | buka ulang URL (< 7 hari, "Ingat saya" dicentang) | Langsung masuk, **gate tidak tampil** | B |
| **E5** | Sudah login, "Ingat saya" **tidak** dicentang | buka ulang URL | Gate **tampil lagi** (hanya sesi tab) | B |
| **E6** | Gate tampil | `admin` / `salah` | Banner merah + shake, password dikosongkan, fokus ke nama pengguna, tetap terkunci | B |
| **E7** | Gate tampil | kedua field kosong + submit | Pesan "Isi nama pengguna dan kata sandi." tanpa memanggil hash | B |
| **E8** | Gate tampil | tekan tombol mata | `type=password` ↔ `text` (label ikon ikut berubah) | B |
| **E9** | Gate tampil | tekan tombol tema di gate | Gate **ikut** berubah dark↔light, token warna sama dengan app, pilihan tersimpan (`mbg-tema`) | B |
| **E10** | Sudah masuk, halaman Profil | tekan **Keluar** | Kembali ke gate (reload), `mbg-auth-v1` terhapus, app minta login lagi | B |
| **E11** | Gate tampil | buka tema light lalu lock/unlock | Kontras teks tetap terbaca (tidak ada teks tenggelam) | B |
| **E12** | HP 360px + keyboard terbuka | isi form | Tombol Masuk tetap terjangkau, tidak ada overflow horizontal | B |
| **E13** | Login berhasil | buka tiap rute (`#/dashboard`,`belanja`,`kirim`,`piutang`,`stok`,`laporan`,`hutang`,`master`,`profil`) | Semua rute normal — **0 regresi** vs Sprint 005 (tidak ada `ReferenceError`) | B |
| **E14** | Versi Sprint 005 | buka Profil | `VERSI_APP` = `2026-10-18 #0326-gate` | B |
| **E15** | Konsol browser | buka + login + semua rute | **0** error JS | B |
| **E16** | Kode klien diekstrak dari `index.html` | `node --check` | EXIT=0 (tidak ada parse error) | T |
| **E17** | 3 input (`""`, `"abc"`, `"admin\|admin"`) | `sha256Hex_()` vs `crypto` Node | Hash identik (oracle independen) | T |
| **E18** | `cocokkanAuth_` | 4 kombinasi | `admin/admin`=true; `admin/Admin`, `Admin/admin`, `admin/`=false | T |
| **E19** | Source `index.html` | audit | Hash `26ac484a…c892` (sha256 "admin\|admin") ada; **tidak ada** literal `password`/`pass:` bernilai `"admin"` | T |
| **E20** | Source `index.html` | audit id | `gate`, `gate-form`, `gate-user`, `gate-pass`, `gate-mata`, `gate-ingat`, `gate-galat`, `gate-versi`, `tombol-keluar` semuanya ada | T |
| **E21** | Source `index.html` | audit struktur `init()` | `init()` memanggil `authAkses_()` lalu `lanjutInit_()`/`initGate_()`, dan **tidak** memanggil `tampil()` (bukti struktural E2) | T |
| **E22** | Source `index.html` | audit sesi | `mbg-auth-v1` + `HARI: 7` + `authHapus_()` + `location.reload()` ada | T |
| **E23** | CSS gate | audit | `.gate[hidden]{display:none}` + `body.terkunci` ada; blok gate tidak menambah hex warna baru | T |
| **E24** | Seluruh repo | `npm run check` | lint 0 error · tsc 0 error · test **hijau semua** (≥ 57 + 13 kasus baru) | T |
| **E25** | `git diff --stat` | file `.gs` (`api/config/db/secrets/server/init/audit/*.logic/modules`) | **Kosong** — nol perubahan server | T |
| **E26** | Dokumen | `CONSTRAINTS.MD` / `RISKS.MD` / `DECISIONS.MD` / `STATE.MD` | Exception bernomor + 3 risiko + ADR + status Sprint 006 tertulis | D |
| **E27** | Lokal vs cloud | `clasp push -f` lalu tarik ulang | Push exit 0; `html/index` cloud **SAMA PERSIS** dengan lokal | D |
| **E28** | Deployment | `clasp deployments` | Tetap 1 deployment `AKfycbw09…` @HEAD (tidak menambah versi) | D |
| **E29** | Pengaturan deploy | **Pemilik** cek manual di editor Apps Script | "Who has access" = **Only myself** — bila tidak, dilaporkan sebagai temuan (R7.2), **tidak** diklaim PASS | D |
| **E30** | Halaman baru dibuka dari URL web app | tes pengaman | Gate **tidak** memuat teks peringatan (R7.1 dibatalkan pemilik 2026-10-18); kartu gate tetap rapi tanpa celah kosong | B |

### Tambahan setelah persetujuan ( rebranding + logo — diminta pemilik 2026-10-18, di luar pack awal )

| # | Given | When | Then | Jenis |
|---|---|---|---|---|
| **B1** | Aplikasi dibuka | lihat judul tab browser | Judul = `SpendFlo — Pengadaan & Pengiriman` | T |
| **B2** | Sidebar (desktop) | lihat logo | Kotak cyan berisi mark "S ›" + wordmark **SpendFlo** + subjudul "Pengadaan & Pengiriman" | B |
| **B3** | Layar login | lihat kartu | Wordmark **SpendFlo** (bukan "SPENDFLO" — `text-transform:uppercase` sudah dilepas) + subjudul sama | B |
| **B4** | Web app | `doGet()` | `setTitle("SpendFlo")` | T |
| **B5** | Source | audit | "Supplier MBG" / "MBG Supplier" **nol** di `src/`; kunci `mbg-*` **nol**, ganti `spendflo-auth-v1` + `spendflo-tema` | T |
| **B6** | Source | audit logo | `path` logo + chevron muncul **tepat 2x** (sidebar + gate) — dikunci test, tidak boleh drift | T |
| **B7** | `npm run check` | seluruh repo | **74 lulus / 0 gagal** (17 kasus `login.test.js`) | T |
| **B8** | Deploy | `clasp push -f` + `clasp pull` | Push EXIT=0; 24/24 file cloud identik lokal; 1 deployment tetap | D |

**Status akhir Sprint 006: 29 PASS + 8 PASS (rebranding) · 0 FAIL · 1 UNTESTED (E29 — cek manual pemilik).**

---

## Kriteria GATE (semua harus true sebelum sprint ditutup)

1. E1–E30 PASS atau UNTESTED dengan alasan tercatat.
2. `npm run check` hijau + `node --check` klien EXIT=0.
3. `git diff --stat` file `.gs` kosong.
4. Bukti asli terlampir (output test, screenshot gate, Network 0-request, hasil tarik-ulang).
5. Tidak ada `git commit` tanpa perintah pemilik.