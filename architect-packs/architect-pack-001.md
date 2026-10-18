# ARCHITECT PACK 001 — Sprint 001: Fondasi + Pembelian & Stok Masuk
Tanggal: 2026-10-10 | Disalin dari planning/sprints/sprint-001/ (audit trail Bab 8.5)


<!-- ======== REQUIREMENTS.MD ======== -->

# REQUIREMENTS — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | Aplikasi terpasang (clasp+spreadsheet 11 tab); owner bisa catat pembelian tunai/tempo dari HP; stok masuk & kas/hutang tercatat |
| 002 | Pengiriman & Piutang | Kirim ke SPPG otomatis jadi piutang; aging per SPPG; bayar FIFO akurat |
| 003 | Stok, Opname & Laporan | Stok akurat + opname; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Meletakkan fondasi teknis yang benar (proyek clasp, spreadsheet terinisialisasi, kunci akses, audit log) dan membuktikan alur BELANJA end-to-end: catat pembelian dari toko → stok bertambah → kas keluar (tunai) atau hutang ke toko (tempo). Sprint ini adalah "tulang punggung" yang dipakai semua sprint berikutnya.

## Apa yang Dibangun
- Proyek Apps Script lokal (clasp) terhubung ke 1 spreadsheet baru = database aplikasi
- Spreadsheet berisi 11 tab terinisialisasi (konvensi docs/DATA-MODEL.MD) + baris Config awal
- Kunci akses: hanya akun Google owner yang bisa memanggil fungsi server (US-11)
- Audit log: setiap tulisan tercatat di tab Log
- Master data: Toko, SPPG, Item (CRUD lunak, nama unik)
- Pembelian: catat belanja ke toko (tunai/tempo), hitung total & jatuh tempo, per baris transaksi
- Pembayaran ke toko (hutang per faktur, lunas/sebagian/belum)
- Query hutang per toko & daftar pembelian
- Shell web app dasar (terbuka, benar, masih polos — polish UI di Sprint 004)

## Mengapa
- Tanpa fondasi (clasp, tab, guard, Log) semua sprint berikutnya tidak bisa dimulai
- Pembelian adalah titik masuk seluruh data: tanpa stok masuk & harga beli, Sprint 002 (margin, HPP) mustahil
- Pembayaran ke toko tempoenya nyata (riset DOMAIN.MD: campuran tunai/tempo) — dicatat sejak awal supaya tidak menumpuk hutang tak terlacak

## Pengguna
- Owner (satu-satunya): input dari HP saat belanja; verifikasi data di tab spreadsheet

## Data Sumber
- Data awal dari pemilik: daftar toko grosir, daftar SPPG yang dilayani, daftar item (beras, minyak) + kemasan
- Harga beli dicatat per transaksi (bukan master)

## Output yang Diharapkan
- Web app "terbuka di HP & laptop, ditolak untuk akun lain"
- 11 tab terisi sesuai konvensi DATA-MODEL §2; Log berisi jejak setiap operasi
- Pembelian tercatat → stok masuk & kas/hutang akurat (terbukti lewat acceptance ACCEPTANCE.MD)

## Batasan
- Tanpa UI premium (menunggu Stitch — Sprint 004); shell dasar cukup
- Tanpa PDF, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT Sprint 001; tanpa keputusan stack baru
- Tanpa fitur pengiriman/piutang (Sprint 002)

<!-- ======== BLUEPRINT.MD ======== -->

# BLUEPRINT — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Arsitektur Sistem (scope sprint ini)

```
 HP/Laptop owner                     Lokal (builder)
┌──────────────────┐   clasp push  ┌──────────────────────┐
│ Browser (shell)  │──────────────▶│ src/*.gs|*.js (repo) │
└────────┬─────────┘               └──────────┬───────────┘
         │ google.script.run                 │ clasp deploy
         ▼                                   ▼
┌─────────────────────────────────────────────────────────┐
│ Apps Script V8 — execute as owner, access MYSELF        │
│ doGet (shell) · guardOwner_ · lockWrap_ · writeLog      │
│ master.server · pembelian.server (Sprint 002+: piutang) │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Google Spreadsheet (DB) — 11 tab, konvensi DATA-MODEL §2│
│ Config · Log · Toko · SPPG · Item · Pembelian · …       │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack (DIKUNCI dari docs/ARCHITECTURE.MD D1–D5 — tidak didecidisikan ulang)
Apps Script V8 · HtmlService · Google Sheets (11 tab) · auth Execute-as-Me/MYSELF · clasp+git · gas-fakes (rung 2)

## Dependensi (PIN — Bab 17.2; `--save-exact` + package-lock.json dikomit)
Runtime: **tidak ada** (GAS tidak memakai npm runtime deps).
Dev (sprint ini, dipasang di T1.1):
| Package | Pin | Cara pin |
|---|---|---|
| @google/clasp | versi exact hasil `npm view @google/clasp version` saat T1.1 → package.json `--save-exact` | package-lock.json |
| gas-fakes | idem — resolve exact saat T1.1 | package-lock.json |
| eslint | idem | package-lock.json |
| eslint-plugin-googleappsscript | idem | package-lock.json |
| typescript | idem | package-lock.json |
| @types/google-apps-script | idem | package-lock.json |
Aturan: builder WAJIB mencatat versi resolve exact ke package.json; mengubah versi = keputusan baru di DECISIONS.MD.

## File yang Akan Dibuat/Diubah (sprint 001)
1. `package.json` — scripts: lint/typecheck/test/check
2. `tsconfig.json` — checkJs + allowJs + noEmit, types: google-apps-script
3. `eslint.config.js` — flat config + plugin googleappsscript
4. `.gitignore` (.clasp.json, .clasprc.json, node_modules) · `.claspignore` (tests/, node_modules/, *.md)
5. `src/appsscript.json` — manifest: scopes `spreadsheets.currentonly` + `script.container`, tz `Asia/Jakarta`, V8, `exceptionReporting: STACKDRIVER`, webapp `{access: MYSELF, executeAs: USER_DEPLOYING}`
6. `src/config.gs` — nama tab + header per DATA-MODEL §2 (konstanta, tanpa rahasia)
7. `src/secrets.gs` — `getSecret_()` over ScriptProperties (belum dipakai rahasia)
8. `src/init.gs` — `initSpreadsheet()` idempotent
9. `src/db.gs` — `readTab_`, `appendRows_`, `lockWrap_`
10. `src/audit.gs` — `writeLog()`
11. `src/server.gs` — `doGet`, `guardOwner_`
12. `src/modules/master.js` (logic murni) + `src/modules/master.server.gs`
13. `src/modules/pembelian.js` (logic murni) + `src/modules/pembelian.server.gs`
14. `src/html/index.html` — shell minimal (premium styling Sprint 004)
15. `tests/run.js` (harness Node + gas-fakes) · `tests/master.test.js` · `tests/pembelian.test.js`

## Package scripts (didefinisikan T1.1; DoD semua task memakai ini)
```
"lint":      "eslint src tests"
"typecheck": "tsc -p tsconfig.json --noEmit"
"test":      "node tests/run.js"          // argumen filter modul: npm test -- master
"check":     "npm run lint && npm run typecheck && npm test"
```

## Tasks (micro-steps 2–5 menit; files; DoD machine-checked)

### T1.1 Setup clasp lokal — files: package.json, tsconfig.json, eslint.config.js, .gitignore, .claspignore, src/appsscript.json
1. `npm init -y`; tambah 4 scripts di atas (files: package.json)
2. `npm i -D --save-exact @google/clasp gas-fakes eslint eslint-plugin-googleappsscript typescript @types/google-apps-script`; catat versi exact di package.json (files: package.json, package-lock.json)
3. Tulis tsconfig.json (checkJs, allowJs, noEmit, target ES2021, types google-apps-script) (files: tsconfig.json)
4. Tulis eslint.config.js (globals GAS dari plugin; no-unused-vars error) (files: eslint.config.js)
5. Tulis .gitignore + .claspignore (files: keduanya)
6. `npx clasp login` — **INTERAKTIF, minta bantuan user sekali**; bila gagal → fallback dicatat, sprint mandek di titik ini (lihat Risiko)
7. `npx clasp create --type sheets --title "Supplier MBG DB"` → .clasp.json (gitignored) (files: src/appsscript.json set via `--rootDir src`? tidak: clasp rootDir=src di .clasp.json)
8. Tulis manifest src/appsscript.json sesuai spesifikasi di atas
9. `npx clasp push -f` — pertama kali
- **DoD**: `npm run check` (0 error; belum ada src) DAN `npx clasp push -f` exit 0 (paste output keduanya)

### T1.2 initSpreadsheet() — files: src/config.gs, src/init.gs, tests/master.test.js (bagian header)
1. config.gs: `TABS` = peta nama tab → array header persis DATA-MODEL §2 (files: src/config.gs)
2. config.gs: `CONFIG_SEED` = 4 baris Config awal (TEMPO_DEFAULT_HARI=14, REFRESH_DETIK=60, ARSIP_BARIS=20000, ZONA) (files: src/config.gs)
3. init.gs: `buildHeaders_(tab)` logic murni (files: src/init.gs)
4. init.gs: `initSpreadsheet()` idempotent (create bila belum ada; set header; freeze 1; dropdown satuan/metode/aktif; tulis Config_SEED; skip tab sudah ada) (files: src/init.gs)
5. Test: buildHeaders_ menghasilkan header sesuai peta (files: tests/master.test.js)
- **DoD**: `npm run check` + rung-3: jalankan `initSpreadsheet()` di editor 2× berturut tanpa error, lalu `SpreadsheetApp.getActive().getSheets().map(s=>s.getName())` = 11 nama (paste daftar)
- **DSA**: DSA: map konstanta TABS — init loop O(T)=O(11) konstan — satu kali bootstrap, bukan hot path runtime

### T1.3 Fondasi server (guard + lock + log) — files: src/audit.gs, src/db.gs, src/server.gs
1. audit.gs: `writeLog(operasi, refId, ringkas)` → append baris LOG-uuid + waktu + aktor (files: src/audit.gs)
2. db.gs: `lockWrap_(fn)` LockService.getScriptLock try/finally (files: src/db.gs)
3. db.gs: `readTab_(nama)` batch `getRange().getValues()` → {header, rows, mapById} (files: src/db.gs)
4. db.gs: `appendRows_(nama, rowsBatch)` + `SpreadsheetApp.flush()` (files: src/db.gs)
5. server.gs: `guardOwner_()` — cocokkan Session.getActiveUser dengan ScriptProperties OWNER_EMAIL; selain itu throw "AKSES_DITOLAK" (files: src/server.gs)
6. server.gs: `setupOwner_()` (sekali jalan manual, isi OWNER_EMAIL) (files: src/server.gs)
- **DoD**: `npm run check` + rung-3: `writeLog('TEST','X','uji')` terisi tab Log; fungsi guard dipanggil konteks bukan-owner melempar AKSES_DITOLAK (paste pesan error)

### T1.4 doGet + shell — files: src/server.gs, src/html/index.html
1. index.html: shell minimal — viewport meta, judul "Supplier MBG", header + slot konten + nav polos (files: src/html/index.html)
2. server.gs: `doGet()` → template index, `.setTitle('Supplier MBG').addMetaTag('viewport',...)` (files: src/server.gs)
3. `npx clasp deploy --deploymentId <dev> --description dev` (buat deployment dev pertama) (files: catat deploymentId)
- **DoD**: `npm run check` + buka URL dev di browser → HTML 200 berisi "Supplier MBG" (paste URL + tangkapan layar); buka dengan akun Google lain → ditolak

### T2.1 master logic murni — files: src/modules/master.js, tests/master.test.js
1. `validasiToko/SPPG/Item(payload)` — required, tipe, nilai wajar (files: master.js)
2. `namaUnik(rows, nama, excludeId)` case-insensitive (files: master.js)
3. `barisMaster(payload, id, now)` — susun baris + createdAt/updatedAt (files: master.js)
4. Test: valid payload, duplikat nama, payload kosong (files: tests/master.test.js)
- **DoD**: `npm run check` (test master hijau, paste ringkasan)

### T2.2 master server — files: src/modules/master.server.gs
1. `getMaster()` — guard; baca 3 tab master → {toko, sppg, item} (files: master.server.gs)
2. `saveMaster(kind, payload)` — guard; lockWrap_; validasi via master.js; tulis/ubah baris; writeLog; flush (files: master.server.gs)
3. `nonaktifkanMaster(kind, id)` — soft delete aktif=FALSE (files: master.server.gs)
- **DoD**: `npm run check` + rung-3: simpan Toko "Toko Uji" → 1 baris di tab Toko; simpan nama sama lagi → error NAMA_DUPLIKAT (paste pesan); Log berisi 2 entri
- **DSA**: DSA: Map by id dari readTab_ — lookup by id O(1), cek unik O(M) M<100 master — volume kecil, sekali per request

### T3.1 pembelian logic murni — files: src/modules/pembelian.js, tests/pembelian.test.js
1. `hitungPembelian(qty, harga)` → total; lempar bila ≤0 (files: pembelian.js)
2. `hitungJatuhTempo(tanggal, metode, tempoHariToko, tempoDefault)` — tunai=null; tempo=tanggal+tempoHari (fallback Config 14) (files: pembelian.js)
3. `barisPembelian(payload, id, now)` + `statusAwal` = tempo ? 'belum' : 'lunas' (files: pembelian.js)
4. Test: tunai, tempo dgn toko tempo, tempo tanpa tempo toko → default 14, qty 0 ditolak (files: tests/pembelian.test.js)
- **DoD**: `npm run check` (paste ringkasan)

### T3.2 createPembelian — files: src/modules/pembelian.server.gs
1. guard + validasi FK tokoId/itemId ada & aktif (files: pembelian.server.gs)
2. lockWrap_: append baris BLI-uuid; update kolom hargaBeliTerakhir item terkait; writeLog; flush (files: pembelian.server.gs)
3. `listPembelian({dari, sampai, tokoId})` — filter in-memory (files: pembelian.server.gs)
- **DoD**: `npm run check` + rung-3: 3 pembelian contoh (2 tunai, 1 tempo) → 3 baris BLI benar, hargaBeliTerakhir item ter-update, Log 3 entri (paste isi ringkas tab)
- **DSA**: DSA: append + Map update hargaBeli — tulis O(1) amortized per baris — input harian kecil, tanpa scan berulang

### T3.3 bayarHutang — files: src/modules/pembelian.server.gs
1. `bayarHutang({tokoId, tanggal, jumlah, pembelianId?})` — guard; lockWrap_; alokasi ke faktur tempo terbuka milik toko (FIFO per tanggal faktur; atau faktur spesifik); tulis PBY-uuid; update statusBayar faktur (belum/sebagian/lunas); tolak bila jumlah > total sisa toko/faktur; writeLog (files: pembelian.server.gs)
2. Test logic murni alokasi (pembelian.js: `alokasiHutang(fakturTerbuka, jumlah)`) — kasus penuh, sebagian, melebihi sisa (files: tests/pembelian.test.js)
- **DoD**: `npm run check` + rung-3: bayar 50% faktur tempo → status 'sebagian'; sisa=50%; bayar melebihi sisa → error MELEBIHI_SISA (paste)
- **DSA**: DSA: alokasiHutang — sort faktur terbuka O(F log F), alokasi O(F) — F = faktur tempo per toko (<100), sekali per pembayaran

### T3.4 getHutangToko — files: src/modules/pembelian.server.gs
1. `getHutangToko()` — agregasi sisa per toko dari faktur tempo (belum/sebagian) + total + tertua (files: pembelian.server.gs)
- **DoD**: `npm run check` + rung-3: setelah skenario T3.2+T3.3, JSON output = {toko, totalSisa, jumlahFaktur, tertuaTanggal} sesuai hitungan manual (paste JSON)
- **DSA**: DSA: scan faktur + akumulasi per toko O(n) sekali per request — n = baris pembelian, dibaca batch 1x

## Risiko Sprint 001
| Task | Risk | Mitigasi |
|---|---|---|
| T1.1 | `clasp login` interaktif / API belum aktif | Minta user jalankan sekali; fallback: setup lewat editor online lalu `clasp clone` |
| T1.2 | Nama tab salah ketik vs DATA-MODEL | TABS di config.gs = satu-satunya sumber nama; test mencocokkan 11 nama |
| T3.3 | Alokasi hutang dobel saat retry | PBY id idempoten: cek payload `pembayaranId` sudah ada → return tanpa dobel |
| Semua | Kuota 6 menit | Sprint 001 <5k baris; tanpa chunking |

## Consistency Check (Sprint-Planner Step 4) — HASIL: LULUS semua
- [x] Setiap item REQUIREMENTS muncul di BLUEPRINT (file/task) — fondasi, guard, Log, master, pembelian, bayar hutang, shell
- [x] Setiap task BLUEPRINT punya ≥1 kriteria ACCEPTANCE
- [x] Setiap task punya DoD machine-checked (`npm run check` + rung-3 spesifik)
- [x] Task hot-path bawa DSA line (T1.2, T2.2, T3.2, T3.3, T3.4)
- [x] ACCEPTANCE tidak meminta fitur di luar BLUEPRINT
- [x] HANDOFF-PROMPT memuat blok bootstrap
- [x] Dependensi == keputusan advisor (tidak ada drift; TIDAK menambah runtime deps)
- [x] Satu sprint = satu goal

<!-- ======== ACCEPTANCE.MD ======== -->

# ACCEPTANCE CRITERIA — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Task Gate (WAJIB lulus sebelum menilai kriteria sprint)
- [ ] Semua DoD per-task di BLUEPRINT sudah hijau: `npm run check` exit 0 + rung-3 tiap task dijalankan dengan output ditempel
- [ ] Task hot-path (T1.2, T2.2, T3.2, T3.3, T3.4) punya baris DSA hadir & konsisten dengan BLUEPRINT (cek keberadaan; kualitas dinilai ladder, bukan opini)
- [ ] Tidak ada file/librari di luar daftar BLUEPRINT (cek `git status`)

## Definisi "Selesai"
Sprint ini SELESAI jika semua kriteria A1–A8 PASS dengan bukti (output perintah/screenshot asli).

### A1. Cek berkala (Task Gate)
- **Given** repo di keadaan sprint selesai, **When** dijalankan `npm run check`, **Then** exit code 0 dan output berakhir tanpa error lint/type/test.
  Command: `npm run check; echo "EXIT=$?"` → expect `EXIT=0`

### A2. Push & manifest
- **Given** proyek clasp terhubung, **When** `npx clasp push -f` dijalankan, **Then** exit 0 dan output menyebut file yang di-push.
  Command: `npx clasp push -f; echo "EXIT=$?"` → expect `EXIT=0`

### A3. Inisialisasi spreadsheet (edge case: idempoten)
- **Given** spreadsheet app kosong, **When** `initSpreadsheet()` dijalankan DUA KALI berturut-turut, **Then** tidak ada error dan jumlah tab = 11 dengan nama persis: Config, Log, Toko, SPPG, Item, Pembelian, PembayaranBeli, Pengiriman, PembayaranJual, PiutangBaris, Opname (baris 1 = header terfreeze; Config berisi 4 baris seed).
  Command (editor/rung-3): jalankan fungsi 2×, lalu `console.log(SpreadsheetApp.getActive().getSheets().map(s=>s.getName()).join(','))` → expect daftar 11 nama, tanpa duplikat.

### A4. Kunci akses (US-11)
- **Given** web app dev ter-deploy dengan access MYSELF, **When** dibuka oleh akun Google BUKAN owner, **Then** akses ditolak (tidak ada data tampil).
  Command: buka URL dev dengan akun lain → expect layar "Akses ditolak" Google; dan pemanggilan fungsi server dari konteks non-owner melempar `AKSES_DITOLAK`.
- **Edge case**: OWNER_EMAIL belum diisi → semua panggilan ditolak (fail-closed, bukan fail-open). Command: tanpa setupOwner_, panggil `getMaster()` → expect error `AKSES_DITOLAK`.

### A5. Master data
- **Given** aplikasi terinisialisasi, **When** `saveMaster('toko',{nama:'Toko Uji', kontak:'0812'})` dijalankan, **Then** 1 baris di tab Toko dengan id prefix `TK-` dan aktif=TRUE; **When** disimpan lagi nama 'TOKO UJI' → Then error `NAMA_DUPLIKAT` dan tab tidak berubah.
  Command (rung-3): jalankan skrip dua pemanggilan → expect baris + pesan error; verifikasi `Log` berisi 2 entri operasi.

### A6. Pembelian (tunai & tempo)
- **Given** Toko 'Toko Uji' (tanpa tempoHari) dan Item 'Beras' (sak) ada, **When** `createPembelian` dipanggil 3×: (a) 5 sak × 300.000 tunai, (b) 10 sak × 310.000 tempo, (c) 3 sak × 0 → Then: (a) baris BLI dengan metode tunai, status lunas; (b) baris BLI tempo dengan jatuhTempo = tanggal+14 hari (Config default); (c) ditolak error `HARGA_TIDAK_VALID`, baris tidak bertambah; kolom hargaBeliTerakhir Item = 310.000 (transaksi terakhir); Log berisi entri untuk a & b.
  Command (rung-3): panggil berturut, lalu `console.log(JSON.stringify(listPembelian({})))` → expect 2 baris sesuai.

### A7. Bayar hutang (edge case: sebagian & melebihi sisa)
- **Given** faktur tempo (b) sisa 3.100.000, **When** `bayarHutang({tokoId, jumlah:1550000})` → Then baris PBY tercatat dan statusBayar faktur = 'sebagian', sisa 1.550.000. **When** `bayarHutang({jumlah: 2.000.000})` (melebihi sisa) → Then error `MELEBIHI_SISA`, tanpa baris PBY baru.
  Command (rung-3): dua pemanggilan → expect status + pesan error; Log konsisten.

### A8. Hutang per toko
- **Given** skenario A6+A7, **When** `getHutangToko()` dipanggil, **Then** output JSON berisi 'Toko Uji' dengan totalSisa = 1.550.000, jumlahFaktur = 1.
  Command (rung-3): `console.log(JSON.stringify(getHutangToko()))` → expect `{"toko":"Toko Uji","totalSisa":1550000,"jumlahFaktur":1,...}` (paste JSON).

## Output yang Bisa Didemonstrasikan
1. Shell web app terbuka di HP owner (URL dev) menampilkan "Supplier MBG"; akun lain ditolak (A4)
2. Spreadsheet DB: 11 tab, Log berisi jejak operasi uji (A3, A5–A7)
3. `npm run check` hijau dari terminal builder (A1)

## Sprint Boundary (sengaja TIDAK dites di sprint ini — milik sprint berikut)
Pengiriman, piutang, aging, FIFO-jual, stok akhir, opname, kas/margin, dashboard, UI premium Stitch, arsip/backup/deploy produksi.

<!-- ======== HANDOFF-PROMPT.MD ======== -->

# HANDOFF PROMPT — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Prompt untuk Builder (paste apa adanya)

Anda adalah BUILDER dalam metode Architect-Builder. Sprint 001.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` — aturan umum (dry run dulu, bukti asli, tanpa library di luar BLUEPRINT)
2. `STATE.MD` — status terkini
3. `DECISIONS.MD` — stack terkunci D1–D5
4. `planning/sprints/sprint-001/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD` — isi sprint ini

### Bootstrap command block (JALANKAN SEBELUM APA PUN; ini setup deterministik — jangan mengarang setup sendiri)
```bash
# 0) Prasyarat: Node.js >= 20 terpasang
node -v                                   # expect v20+

# 1) Dependensi terpin (sudah ada package.json; bila belum: npm init -y dulu)
npm install                               # resolve devDeps terpin dari package-lock.json
npm run check                             # sanity: lint+typecheck+test hijau (0 test = hijau)

# 2) Auth clasp — INTERAKTIF SEKALI, minta user menjalankan di terminal mereka bila token belum ada
npx clasp login                           # menulis ~/.clasprc.json (JANGAN commit/print)

# 3) Proyek GAS (sekali per mesin; bila .clasp.json sudah ada, lewati ke langkah 4)
npx clasp create --type sheets --title "Supplier MBG DB"   # hasilkan scriptId → .clasp.json (gitignored)

# 4) Push perdana + verifikasi
npx clasp push -f                         # expect exit 0

# 5) Sanity spreadsheet: jalankan initSpreadsheet() (rung-3, via editor online)
#    lalu hitung tab:
#    expect: 11 nama tab persis sesuai BLUEPRINT T1.2
```
Jika langkah apa pun gagal: HENTIKAN, lapor error exact + usulan perbaikan, JANGAN menebak.

### Aturan kerja (wajib)
1. **DRY RUN DULU**: setelah membaca pack, laporkan: (a) daftar file yang akan dibuat/diubah persis dari BLUEPRINT, (b) urutan task T1.1→T3.4, (c) dependensi yang terpasang + versi exact hasil resolve, (d) risiko yang kamu lihat, (e) titik yang butuh user (mis. `clasp login`).
2. **TUNGGU persetujuan** ("Approved. Mulai coding.") sebelum menulis kode apa pun.
3. Kerjakan task berurutan sesuai BLUEPRINT; **setiap task selesai hanya jika DoD-nya hijau** (`npm run check` + rung-3 task) — tempel output asli sebagai bukti.
4. Task hot-path (T1.2, T2.2, T3.2, T3.3, T3.4): tulis baris DSA persis format BLUEPRINT sebelum implementasinya.
5. Selesai sprint: jalankan seluruh ACCEPTANCE.MD A1–A8, laporkan PASS/FAIL per butir dengan bukti, lalu minta `/acceptance-runner` (konteks segar) sebelum menganggap selesai.

### JANGAN
- JANGAN coding sebelum dry run disetujui
- JANGAN mengubah requirements/kriteria
- JANGAN menambah library/tool di luar BLUEPRINT (runtime deps = NOL)
- JANGAN mengubah versi dependensi terpin tanpa entri DECISIONS.MD
- JANGAN menganggap "kelihatannya benar" sebagai selesai — hanya output perintah yang berlaku
- JANGAN menyentuh fitur sprint berikut (pengiriman, piutang, dashboard, UI premium)
- JANGAN commit/print isi `.clasprc.json` atau `.clasp.json`

### SETUJU (setelah persetujuan dry run)
- Mulai T1.1 → berurutan sampai T3.4
- Test logic murni dulu (gas-fakes rung 2), baru rung 3 (push + editor)
- Update STATE.MD + FILE-INVENTORY.MD saat selesai (atau minta /state-keeper)
