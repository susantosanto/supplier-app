# BLUEPRINT — SPRINT 006
## "Lock Screen Premium (admin/admin)"

Tanggal: 2026-10-18 · Sprint: 006 · Acuan: `planning/sprints/sprint-006/REQUIREMENTS.MD`

---

## 1. Peta perubahan file (1 file kode + 1 file test)

### 1.1 File baru
| File | Tanggung jawab |
|---|---|
| `tests/login.test.js` | ≥12 kasus: SHA-256 JS murni vs oracle `crypto` Node, cocok/tolak kredensial, audit statis gate |

### 1.2 File diubah
| File | Perubahan | Perkiraan |
|---|---|---|
| `src/html/index.html` | 4 blok baru: CSS `.gate*`, HTML gate, JS auth (`sha256Hex_`, `cocokkanAuth_`, `authAkses_`, `authSimpan_`, `authHapus_`, `initGate_`), +\~2 kartu/handler di Profil | +380 / −6 baris |
| `CONSTRAINTS.MD` | baris Exception `EXC-006-01` (R7.4) | +4 |
| `RISKS.MD` | 3 entri (lock screen cosmetik, deploy access tak terverifikasi,gate↔init) | +6 |
| `DECISIONS.MD` | ADR: "Lock screen client-side, bukan kontrol akses" + reschedule Ops & Produksi → 007 | +12 |
| `STATE.MD` | Sprint 006 aktif, blocker & langkah berikutnya | ±10 |

### 1.3 File yang **dilarang** disentuh (nol perubahan, dibuktikan `git diff --stat`)
`src/api.gs`, `src/config.gs`, `src/db.gs`, `src/secrets.gs`, `src/server.gs`, `src/init.gs`, `src/audit.gs`, `src/api.logic.gs`, seluruh `src/modules/*.gs`, `package.json`, `tsconfig.json`, `eslint.config.js`, 12 tab Spreadsheet.

---

## 2. Blok 1 — CSS gate (pakai token existing, nol hex baru)

Ditempel setelah blok CSS kartu/form yang sudah ada (dekat `.form-card`), supaya token `--*` sudah terdefinisi di `:root` dan `html[data-tema="light"]`.

```css
/* ===== GATE LOGIN (Sprint 006) — token sama, tanpa hex baru ===== */
.gate{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;
  padding:20px;overscroll-behavior:none;
  background:radial-gradient(120% 90% at 50% -10%,var(--accent-tint) 0%,var(--paper) 58%,var(--paper) 100%)}
.gate[hidden]{display:none}
body.terkunci{overflow:hidden;overscroll-behavior:none}
.gate-kartu{width:min(100%,380px);background:var(--card);border:1px solid var(--accent-line);
  border-radius:14px;padding:26px 22px 18px;box-shadow:var(--shadow);
  display:flex;flex-direction:column;gap:2px}
.gate-logo{width:46px;height:46px;border-radius:12px;background:var(--accent-tint);
  border:1px solid var(--accent-line);color:var(--accent-bright);
  display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.gate-nama{font-size:21px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink)}
.gate-sub{font-size:12px;color:var(--muted);letter-spacing:.06em;margin:4px 0 18px}
.gate label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin:12px 0 6px}
.gate input[type=text],.gate input[type=password]{width:100%}
.gate-bungkus{position:relative;display:flex;align-items:center}
.gate-bungkus input[type=password]{padding-right:44px}
.gate-mata{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:36px;height:36px;
  border:0;background:transparent;color:var(--muted);cursor:pointer;border-radius:8px;display:flex;
  align-items:center;justify-content:center}
.gate-mata:hover{color:var(--ink)}
.gate-mata svg{width:18px;height:18px}
.gate-baris{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
.gate-ingat{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);margin:0;
  font-weight:500;cursor:pointer}
.gate-ingat input{width:16px;height:16px;accent-color:var(--accent)}
.gate-tema{width:36px;height:36px;border:1px solid var(--line);background:var(--card);color:var(--muted);
  border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.gate-tema svg{width:18px;height:18px}
.gate-masuk{width:100%;margin-top:16px}
.gate-galat{margin-top:10px;font-size:13px;color:var(--danger);background:var(--danger-tint);
  border:1px solid var(--danger-line);border-radius:var(--radius-s);padding:8px 10px;display:none}
.gate-galat.on{display:block}
.gate-catatan{font-size:11px;color:var(--faint);line-height:1.5;margin:14px 0 0}
.gate-versi{font-size:11px;color:var(--faint);margin-top:10px;letter-spacing:.04em}
@keyframes gateGoyang{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}
  30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}
.gate-kartu.goyang{animation:gateGoyang .4s}
@media (prefers-reduced-motion:reduce){.gate-kartu.goyang{animation:none}}
```

Catatan: `.gate-masuk` memakai kelas `.utama` yang sudah ada → warna/tombol otomatis sama dengan tombol "Simpan profil" (konsistensi).

---

## 3. Blok 2 — HTML gate

Ditempel **setelah** penutup `</nav>` dan **sebelum** `<script>` → tidak menggeser markup view yang sudah ada.

```html
<!-- ===== GATE LOGIN (Sprint 006) ===== -->
<div class="gate" id="gate" hidden>
  <div class="gate-kartu" id="gate-kartu">
    <div class="gate-logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg></div>
    <div class="gate-nama">Supplier MBG</div>
    <div class="gate-sub">Aplikasi Pengadaan &amp; Penjualan</div>
    <form id="gate-form" novalidate autocomplete="off">
      <label for="gate-user">Nama pengguna</label>
      <input id="gate-user" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" autofocus>
      <label for="gate-pass">Kata sandi</label>
      <div class="gate-bungkus">
        <input id="gate-pass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false">
        <button class="gate-mata" type="button" id="gate-mata" aria-label="Tampilkan kata sandi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button>
      </div>
      <div class="gate-baris">
        <label class="gate-ingat"><input type="checkbox" id="gate-ingat" checked> Ingat saya 7 hari</label>
        <button class="gate-tema" type="button" id="gate-tema" aria-label="Ganti tema"></button>
      </div>
      <button class="utama gate-masuk" type="submit" id="gate-masuk">Masuk</button>
      <div class="gate-galat" id="gate-galat" role="alert" aria-live="polite"></div>
      <p class="gate-catatan">Kunci tampilan, bukan pengaman data. Akses data tetap dijaga akun Google owner.</p>
      <div class="gate-versi" id="gate-versi"></div>
    </form>
  </div>
</div>
```

Ikon tema pada `gate-tema` diisi JS dengan SVG yang sama seperti ikon tema existing (`.i-bulan` / `.i-matahari`) supaya konsisten tanpa HTML ganda.

---

## 4. Blok 3 — JS auth (ditempel setelah `var VERSI_APP`, sebelum `terapkanTema`)

Konvensi penamaan klien saat ini: `snake_case`, privat ber-underscore di akhir (`run_`, `antriRun_`, `el`). Diikuti.

```js
/* ===== GATE LOGIN (Sprint 006) — client-side, bukan kontrol akses ===== */
var AUTH = {
  USER: "admin",
  HASH: "26ac484ab33dea0a0737411fff787c6a3a0c5427838f0196e8377b13c8ccf892", // sha256("admin|admin")
  KUNCI: "mbg-auth-v1",
  HARI: 7
};
var gateTerpasang_ = false;

// SHA-256 hex, JS murni (tanpa crypto.subtle) supaya identik di browser/Node/file://.
function sha256Hex_(teks) { /* 4 blok: pra-proses + 64 putaran + hex; O(n) */ }
function cocokkanAuth_(user, pass) { return sha256Hex_(user + "|" + pass) === AUTH.HASH; }
function authAkses_() { /* baca localStorage, parse, cek exp > Date.now() dan u === AUTH.USER */ }
function authSimpan_(ingat) { /* ingat → set {u, exp: Date.now()+AUTH.HARI*864e5}; selain itu hapus */ }
function authHapus_() { try { localStorage.removeItem(AUTH.KUNCI); } catch (e) {} }
function initGate_() { /* pasang gate: isi versi, ikon tema, submit, mata, 'ingat'; return void */ }
function gateBuka_() { /* sembunyikan gate, buang kelas body, panggil lanjutInit_() sekali */ }
```

Keputusan implementasi yang dikunci di pack:

1. **`sha256Hex_` JS murni, bukan `crypto.subtle`** — menghindari jalur cadangan yang bisa jadi stub (CONSTRAINTS Floor "no unimplemented stubs") dan membuat tes bisa memakai fungsi yang sama persis yang berjalan di browser.
2. **Username ikut di-hash** (`user + "|" + pass`) supaya satu konstanta cukup; sekaligus menolak `Admin/admin` maupun `admin/Admin` (R3.4).
3. **Gate = satu-satunya tempat yang memanggil `lanjutInit_()`** selain `init()` bila sudah terbuka; `lanjutInit_()` dipanggil maksimal sekali (R4.3).
4. **Keluar = `authHapus_()` + `location.reload()`** — bukan hanya sembunyikan gate, supaya tidak ada data/handler tersisa di DOM.
5. **Tidak ada `localStorage` baru** selain `mbg-auth-v1`; `mbg-tema` dipakai apa adanya.
6. **Koreksi implementasi (2026-10-18, saat koding — lihat VERIFICATION-REPORT §3 & §7)**:
   - `heks_()` harus menggeser `k * 8` (byte), bukan `k * 4` (nibble).
   - Panjang 64-bit ditulis di paruh rendah `msg[pad-4..pad-1]`, bukan parung tinggi `msg[pad-8..pad-5]`.
   - Tombol tema di gate memanggil `terapkanTema()`, **bukan** `gantiTema()` — `gantiTema()` memanggil `tampil()` → request server saat gate masih terkunci (melanggar E2). Ditutup test `gate tidak memicu server`.
   - Pemanggilan `tampil()` dari banner "coba lagi" dibungkus `muatUlang_()` agar `init()` benar-benar bebas `tampil()` (syarat E21).

### 4.1 Pemecahan `init()` (R4)

```js
function init() {
  var temaSimpan = null;
  try { temaSimpan = localStorage.getItem("mbg-tema"); } catch (e) {}
  terapkanTema(temaSimpan === "light" ? "light" : "dark");
  if (el("versi-app")) el("versi-app").textContent = VERSI_APP;
  if (el("versi-side")) el("versi-side").textContent = VERSI_APP;
  /* … banner + window error handler yang sekarang, tetap di sini … */
  jamAtas(); setInterval(jamAtas, 30000);            // dipindah ke atas agar hidup di 2 status
  if (authAkses_()) lanjutInit_(); else initGate_();  // satu-satunya gerbang
}

function lanjutInit_() {
  /* ISI PERSIS seperti init() sekarang mulai baris "el("tombol-ping")…"
     sampai call terakhirnya (pasangTabsHistori, filter, form, dll) — TANPA diubah. */
  tampil();
  /* … sisa isi init() sekarang setelah "tampil();" … */
}
```

Blok yang dipindah (baris 1657–1720 `index.html`) **disalin apa adanya** ke `lanjutInit_()`; satu-satunya penyesuaian = `tampil();` dan listener `hashchange` ikut pindah (supaya app belum aktif saat terkunci).

---

## 5. Blok 4 — Profil: sesi & keluar

Ditempel sebagai kartu baru setelah kartu "Profil Supplier", sebelum "Diagnosa koneksi":

```html
<div class="card"><h2>Sesi &amp; keamanan</h2>
  <p class="muted">Kunci tampilan memakai nama pengguna dan kata sandi. Ini bukan pengaman data —
     data tetap hanya bisa dibaca lewat akun Google owner.</p>
  <button class="kedua" type="button" id="tombol-keluar">Keluar</button>
</div>
```

Handler (di `lanjutInit_()`, dekat listener profil yang sudah ada):

```js
var bKeluar = el("tombol-keluar");
if (bKeluar) bKeluar.addEventListener("click", function () {
  authHapus_();
  location.reload();
});
```

---

## 6. Kontrak test (`tests/login.test.js`)

Harness: baca `src/html/index.html` → ambil isi `<script>` → buat konteks `vm` berisi stub minimal (`el`, `document`, `localStorage`, `window`) → **diekstrak fungsi auth yang murni** (`sha256Hex_`, `cocokkanAuth_`) untuk diuji dengan oracle `crypto` Node. Sisanya = audit statis string/struktur.

| # | Kasus | Bukti |
|---|---|---|
| L1 | `sha256Hex_("")` = `e3b0c442…b855` | vektor standar |
| L2 | `sha256Hex_("abc")` = `ba7816bf…f20015ad` | vektor standar NIST |
| L3 | `sha256Hex_(x)` = `crypto.createHash("sha256")` untuk 3 input (termasuk `admin\|admin`) | **oracle independen** |
| L4 | `cocokkanAuth_("admin","admin")` → true | |
| L5 | `cocokkanAuth_("admin","Admin")` → false | case-sensitive |
| L6 | `cocokkanAuth_("Admin","admin")` → false | username case-sensitive |
| L7 | `cocokkanAuth_("admin","")` → false | |
| L8 | Hash konstan di source = hash hitung ulang | mencegah konstanta salah |
| L9 | Source **tidak** memuat literal pola `password`/`pass:` bernilai `"admin"` | Floor CONSTRAINTS |
| L10 | `gate`, `gate-form`, `gate-user`, `gate-pass`, `gate-mata`, `gate-ingat`, `gate-galat`, `gate-versi`, `tombol-keluar` semuanya ada di HTML | id terpakai |
| L11 | `init()` memuat `authAkses_()` + `lanjutInit_()`/`initGate_()`, dan **tidak** memanggil `tampil()` langsung | bukti "0 request sebelum unlock" secara struktural |
| L12 | Kunci `mbg-auth-v1` + `HARI: 7` + `authHapus_()` + `location.reload()` ada | sesi & keluar |
| L13 | `.gate[hidden]{display:none}` + `body.terkunci` ada; blok `.gate` tidak memuat hex warna baru (`#` di luar komentar) | konsistensi tema |

Nol dependensi baru: hanya `fs`, `path`, `vm`, `crypto` (bawaan Node) — tidak masuk `package.json` (R6.4).

---

## 7. DSA & biaya

| Opsi | Kompleksitas | Catatan |
|---|---|---|
| SHA-256 JS murni atas input ~11 byte | **O(n)**, 64 putaran | <1 ms; tanpa I/O, tanpa `crypto.subtle` |
| Baca token saat buka | O(1) — satu `getItem` + `JSON.parse` kecil | |
| Simpan token | O(1) — satu `setItem` | hanya saat "Ingat saya" dicentang |
| Gate DOM | ~40 node statis, O(1) render | tanpa framework, tanpa loop |
| `lanjutInit_()` | **tidak ada** asymptotically; pemisahan 1 fungsi | tanpa regresi: isi dipindah verbatim |

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| `init()` pecah → seluruh app mati (seperti hotfix `}` yatim 2026-10-15) | Pemecahan 1 fungsi + `node --check` ekstrak JS + `npm run check` + uji browser buka tiap rute |
| `tampil()` tetap terpanggil sebelum unlock → data bocor di belakang gate | L11 (audit struktural) + bukti Network 0 request |
| Gate tidak bisa ditutup (`hidden` kalah dari `display:flex`) | `.gate[hidden]{display:none}` eksplisit (R1.5) + uji browser |
| `localStorage` berisi data rusak /kedaluwarsa → app terkunci permanen | try/catch + validasi `u`/`exp`, token dibuang (R2.4) |
| Admin Neighbor salah baca "login = aman" | Teks jujur di gate (R7.1) + `RISKS.MD` + `DECISIONS.MD` + Exception CONSTRAINTS |
| Browser lama tanpa `backdrop-filter` | Properti opsional; gate tetap tampil & berfungsi (fallback visual otomatis) |
| Perubahan lama uncommitted ikut ter-commit | R6.7: tanpa `git add -A`, tanpa `checkout/stash`, commit hanya atas perintah |

## 9. Verifikasi minimum (builder)

```powershell
npm run check
$html = Get-Content src\html\index.html -Raw
$js = ([regex]::Matches($html,'(?s)<script>(.*?)</script>') | ForEach-Object { $_.Groups[1].Value }) -join "`n"
Set-Content C:/Users/<pengguna>/AppData\Local\Temp\opencode\gate.js -Value $js -Encoding UTF8
node --check C:/Users/<pengguna>/AppData\Local\Temp\opencode\gate.js
git diff --stat -- src\api.gs src\config.gs src\db.gs src\modules     # harus KOSONG (R6.3)
node -e "console.log(require('crypto').createHash('sha256').update('admin|admin').digest('hex'))"
npx clasp push -f
```

## 10. Deploy

- `clasp push -f` ke `@HEAD` (web app dev auto-live, pola Sprint 004/005).
- Bukti: `clasp deployments` tetap 1 deployment; tarik ulang (`clasp pull`) file **SAMA PERSIS** dengan lokal.
- `VERSI_APP` → `"2026-10-18 #0326-spendflo"`.
- **Tidak ada** deploy versi baru ke produksi (produksi berversi = Sprint 007).

---

## 11. Rebranding + logo (tambahan setelah persetujuan, 2026-10-18)

Diminta pemilik **setelah** gate Sprint 006 live (bukan scope pack awal). Keputusan penuh di `DECISIONS.MD` 2026-10-18.

### 11.1 Nama
| Tempat | Sebelum | Sesudah |
|---|---|---|
| `<title>` | `Supplier MBG` | `SpendFlo — Pengadaan & Pengiriman` |
| Sidebar brand | `MBG Supplier` / `Kelola belanja & kirim` | `SpendFlo` / `Pengadaan & Pengiriman` |
| Gate | `Supplier MBG` / `Aplikasi Pengadaan & Penjualan` | `SpendFlo` / `Pengadaan & Pengiriman` |
| `server.gs` `setTitle()` | `Supplier MBG` | `SpendFlo` |
| `localStorage` | `mbg-auth-v1`, `mbg-tema` | `spendflo-auth-v1`, `spendflo-tema` |
| `VERSI_APP` | `#0326-gate` | `#0326-spendflo` |

Dasar pilihan: riset nama kategori (premium global = nama non-deskriptif 1 kata <=2 suku kata; UMKM Indonesia = coinage/netral) dan pemilik sendiri yang memilih "SpendFlo" dari daftar hasil riset. **Risiko tercatat**: nama tersebut milik SaaS B2B procurement yang sudah ada -> wajib diganti bila aplikasi dipakai luas atau komersial.

CSS yang harus ikut berubah: `.gate-nama` kehilangan `text-transform:uppercase` dan `letter-spacing` .14em → .02em (kalau tidak, camelCase jadi "SPENDFLO" dan spacing grotesk).

Avatar "S" di topbar **tidak** diubah — itu inisial profil supplier (diisi `inisial(p.nama)` saat profil dimuat), bukan logo aplikasi.

### 11.2 Logo mark (2 stroke, grid 24, stroke-width 1.6 = bobot ikon app)

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M15.4 6.4H9.6a2.9 2.9 0 0 0 0 5.8h3.2a2.9 2.9 0 0 1 0 5.8H6"/>
  <path d="M16.8 12.4 19.8 15.4 16.8 18.4"/>
</svg>
```

- Makna: **S** = Spend; **chevron maju** = alur procuring → pengiriman. Terbaca "S-Flo(w)".
- Dipakai di `.brand-mark` (sidebar, 21px, tinta di atas cyan) dan `.gate-logo` (gate, 25px, cyan di atas tint).
- Alur desain: kandidat 1 (kubus/parcel + garis gerak) **ditolak** — generic dan garisnya hilang di ukuran kecil; kandidat A/B/C dibandingkan di 96px & 20px lewat browser, **B (S + chevron terpisah)** menang (CWT jumlah stroke 2, tetap terbaca di 20px).
- Diku(B6): test asserting `path` logo + chevron muncul tepat 2x.