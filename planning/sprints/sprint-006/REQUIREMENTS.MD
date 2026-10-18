# REQUIREMENTS — SPRINT 006
## "Lock Screen Premium (admin/admin)"

Tanggal: 2026-10-18 · Status: **MENUNGGU PERSETUJUAN PEMILIK** · Sprint: 006

---

## R0 — Fakta terverifikasi sebelum menulis pack (dasar semua requirement)

| Fakta | Bukti | Arti untuk sprint ini |
|---|---|---|
| Semua fungsi server sudah memanggil `guardOwner_()` (fail-closed, `server.gs:2-15`) | `api.gs` 1x, `server.gs` 3x, 8 modul server 1–5x | Kontrol akses **sudah ada** dan tidak boleh dilewati. Gate baru ini **tidak menambah/mengurangi keamanan**. |
| Web app = 1 deployment `AKfycbw09hGXPWbyWBi4n30vtF7nyuvL2n35TQ1SubwS68Ip @HEAD` | `npx clasp deployments` | Aturan "Who has access" **tidak terbaca dari CLI** → wajib dicek manual pemilik (R7.2). |
| Sumber UI = 1 file: `src/html/index.html` (2175 baris, GHS `doGet` hanya `html/index`) | `server.gs:24-29`, `src/html/` | Tidak mungkin punya halaman login terpisah → **gate overlay** di dalam satu file. |
| `init()` (baris 1637) memanggil `tampil()` (baris 1683) → `tampil()` memanggil `muatMaster()` (baris 1505) | baca file | Untuk "0 panggilan server sebelum unlock", gate harus dipasang **sebelum** `tampil()` — bukan sesudahnya. |
| Tema sudah tersimpan di `localStorage["mbg-tema"]`, diterapkan lewat `terapkanTema()`/`gantiTema()` | `index.html:754-759, 1638-1640` | Gate tinggal mengikuti `data-tema` — nol token warna baru. |
| Fingerprint data: `VERSI_APP = "2026-10-16 #0325-laba"` | `index.html:707` | Naik jadi `2026-10-18 #0326-gate` (rastrekan deploy). |

---

## R1 — Gate layar penuh (BARU, inti sprint)

Keputusan pemilik (question tool 2026-10-18): *"Lock screen visual saja"* + *"Gate layar penuh"* + *`admin`/`admin`* + *"Ingat 7 hari"* + *"Hanya admin"*.

- **R1.1** Sebelum masuk, layar menampilkan **gate full-screen** (fixed, menutup 100% viewport) berisi: wordmark "Supplier MBG", subjudul "Aplikasi Pengadaan & Penjualan", form nama pengguna + kata sandi, tombol mata show/hide, checkbox "Ingat saya 7 hari", tombol **Masuk**, pesan galat, catatan jujur, dan versi app.
- **R1.2** Gate memakai **token warna yang sudah ada** (`--paper`, `--card`, `--accent`, `--accent-bright`, `--accent-line`, `--line`, `--ink`, `--muted`, `--radius`, `--shadow`) — **tanpa satu pun hex baru**, sehingga otomatis cocok dengan tema dark (navy `#0F172A` + aksen cyan `#56CCF2`) maupun light.
- **R1.3** Nuansa "premium" yang diminta: latar radial lembut dari aksen → paper, kartu login berkaca (backdrop blur), border 1px aksen, radius 14px, bayanan halus, wordmark bertracking lebar, dan animasi shake singkat saat gagal.
- **R1.4** Gate responsif (mobile-first, lebar kartu `min(100%, 380px)`), aman di HP 360px.
- **R1.5** Gate bisa disembunyikan lewat atribut `hidden` — WAJIB ada aturan CSS `.gate[hidden]{display:none}` karena `display:flex` mengalahkan atribut `hidden`.
- **R1.6** Sambil terkunci, `body` diberi kelas `terkunci` (`overflow:hidden; overscroll-behavior:none`) agar HP tidak bisa "meleset" lewat rubber-band.
- **R1.7** Kontrol tipe: `autocomplete="username"` / `"current-password"`, `spellcheck="false"`, `autocapitalize="off"`, `autofocus` di field nama pengguna.
- **R1.8** Aksesibilitas: pesan galat `role="alert"` + `aria-live="polite"`, tombol mata punya `aria-label`, seluruh form bisa.submit dengan tombol Enter.

## R2 — Status terkunci / terbuka + sesi 7 hari

- **R2.1** Dua status: **terkunci** (gate tampil, app tidak dimuat) dan **terbuka** (gate disembunyikan, app jalan normal).
- **R2.2** "Ingat saya" **dicentang (default)** → token disimpan di `localStorage` kunci `mbg-auth-v1` = `{ u: "admin", exp: <epoch ms> }` dengan `exp = sekarang + 7 hari`.
- **R2.3** "Ingat saya" **tidak dicentang** → token **tidak** ditulis ke `localStorage`; status terbuka hanya untuk sesi tab tersebut (muat ulang → terkunci lagi).
- **R2.4** Token dibaca aman (try/catch seperti `mbg-tema`); JSON rusak / `exp` habis / `u` tidak cocok → diperlakukan sebagai **terkunci** dan token dibuang.
- **R2.5** Gate hanya menampilkan data non-sensitif (wordmark, versi). **Tidak ada** panggilan `google.script.run` apa pun selama terkunci.

## R3 — Verifikasi client-side, tanpa kredensial polos di source

- **R3.1** Kredensial yang diverifikasi: username `admin` (boleh plaintext — itu bukan rahasia) + kata sandi yang **hanya boleh disimpan sebagai hash SHA-256 hex**.
- **R3.2** Hash yang harus cocok: `SHA-256("admin|admin") = 26ac484ab33dea0a0737411fff787c6a3a0c5427838f0196e8377b13c8ccf892` (dihitung ulang saat build, diverifikasi silang dengan `crypto` Node di test). **Koreksi 2026-10-18:** draft pack menulis `8c6976e5…18a918` — itu `SHA-256("admin")` tanpa pemisah `|`; sudah diganti hasil hitung ulang.
- **R3.3** Fungsi hash ditulis **JS murni di dalam `index.html`** (tanpa `crypto.subtle`, tanpa fallback yang bisa jadi stub) → deterministik di browser, Node, dan `file://`.
- **R3.4** Password **case-sensitive**; input kosong ditolak tanpa memanggil hash (pesan "Isi nama pengguna dan kata sandi.").
- **R3.5** Gagal → banner merah + shake + field password dikosongkan + fokus kembali ke nama pengguna. Berhasil → sembunyikan gate, buka app, **tanpa reload** (reload hanya saat Keluar).

## R4 — Struktur `init()`: app tidak boleh hidup di belakang gate

- **R4.1** `init()` dipecah dua: `init()` (tema + versi + banner + gate) dan `lanjutInit_()` (seluruh pemasangan listener + `tampil()` yang sudah ada, dipindah **tanpa mengubah perilakunya**).
- **R4.2** `init()` memanggil `lanjutInit_()` **hanya** bila `authAkses_()` true; bila tidak, `initGate_()` memasang gate dan **tidak** menyentuh `tampil()` → `muatMaster()` tidak pernah terpanggil sebelum unlock.
- **R4.3** Setelah login berhasil, gate memanggil `lanjutInit_()` **tepat satu kali** (penjaga anti double-submit) dan tidak memasang listener kedua kali.
- **R4.4** Jam header (`jamAtas` + interval 30 detik) dipindah ke luar `lanjutInit_()` agar tetap hidup di dua status.
- **R4.5** Gate punya tombol tema kecil (matahari/bulan) yang memakai `gantiTema()` yang sudah ada — gate mengikuti tema real-time tanpa token baru.

## R5 — Keluar

- **R5.1** Kartu baru **"Sesi & keamanan"** di halaman Profil berisi tombol **Keluar** (`tombol-keluar`) + penjelasan singkat bahwa kunci hanya tampilan.
- **R5.2** Keluar = hapus `mbg-auth-v1` → `location.reload()` (state app bersih total, tidak ada data sisa di DOM).
- **R5.3** Setelah keluar, halaman **tidak** bisa masuk tanpa `admin`/`admin` lagi.

## R6 — Bukti & aturan proyek

- **R6.1** Test baru `tests/login.test.js` (**≥ 12 kasus**): hash diverifikasi **silang** dengan `crypto` Node (oracle independen), kasus benar/salah password, dan audit statis (elemen gate ada, hash ada, **tidak ada** literal `password = "admin"`, `init()` gated, kunci token + konstanta 7 hari).
- **R6.2** `npm run check` (lint + typecheck + test) hijau — tidak ada exception baru, tidak ada suppressi (`@ts-ignore`, `eslint-disable`).
- **R6.3** **Nol perubahan file `.gs`** — `api.gs`, `config.gs`, `db.gs`, dan 12 tab Spreadsheet **tidak boleh disentuh** (terbukti lewat `git diff --stat`).
- **R6.4** Nol dependensi baru (BLUEPRINT §dependensi tetap: `@google/clasp`, `@mcpher/gas-fakes`, `@types/google-apps-script`, `eslint`, `eslint-plugin-googleappsscript`, `typescript`).
- **R6.5** Deploy `clasp push -f` ke dev `@HEAD` (auto-live), lalu tarik ulang file dan buktikan **SAMA PERSIS**.
- **R6.6** Bukti browser wajib (Playwright MCP): gate tampil → `admin`/`admin` → dashboard terisi; Network **0** request server sebelum unlock; reload dalam 7 hari tidak minta login; Keluar kembali ke gate; 0 error console. Bila MCP mati, laporkan apa adanya sebagai UNTESTED (tidak boleh diklaim PASS).
- **R6.7** **Tidak** `git commit` tanpa perintah eksplisit pemilik (sudah ada 28+ path uncommitted Sprint 002–005).

## R7 — Batas yang jujur ditulis di layar dan di dokumen

- **R7.1** ~~Di bawah form tampil teks: "Kunci tampilan, bukan pengaman data."~~ **DIBATALKAN pemilik 2026-10-18** (perintah eksplisit: hapus kalimat itu dari layar). Konsekuensi dicatat di `RISKS.MD`: layar login tanpa penanda bisa disalahartikan sebagai pengaman. Penjelasan yang tersisa hanya di kartu "Sesi & keamanan" di halaman Profil.
- **R7.2** **Pemilik wajib cek manual** di Apps Script → Deploy → Manage deployments → deployment `AKfycbw09…` → **"Who has access" = "Only myself"**. Bila ternyata "Anyone with the link", itu temuan US-11/ARCHITECTURE-MD §risiko "Kritis" dan **harus dilaporkan**, bukan disembunyikan.
- **R7.3** Catatan security posture (Security-Audit 004 "CLEAN" tetap berlaku): gate **tidak menambah** permukaan risiko karena tidak ada endpoint/secret baru; `guardOwner_()` tetap satu-satunya gerbang data.
- **R7.4** Baris **Exception** baru di `CONSTRAINTS.MD` (mekanisme resmi, floor tidak dilunakkan) untuk "no secrets in source": path `src/html/index.html`, alasan "hash SHA-256 kredensial lock screen visual; bukan kontrol akses; guardOwner_ tetap pengaman sebenarnya", kedaluwarsa saat gate diganti token server.
- **R7.5** `RISKS.MD` + `DECISIONS.MD` diperbarui; PRD **tidak** diubah diam-diam (US-11 tetap fulfilled oleh GAS; lock screen dicatat sebagai lapisan kedua opsional).

---

## Di luar scope (eksplisit — jangan dikerjakan)

- Token server / session API / `api()` butuh auth / `guardAuth_` baru
- Tab `Pengguna`, multi-peran, operator, akun baca-saja
- Ganti password, reset password, bcrypt/argon/scrypt
- Login Google/OAuth, Google Sign-In
- CAPTCHA, rate limit, lockout percobaan, log login, 2FA, audit trail login
- Halaman login terpisah (mustahil di GAS satu `HtmlService`)
- Enkripsi data saat transit/nyimpan, ganti password owner
- Migrasi Sprint 006 "Ops & Produksi" (→ Sprint 007), backup/arsip/monitoring/deploy berversi
- Perbaikan UI lain yang diminta di luar gate (tidak ada perubahan visual pada halaman existing)