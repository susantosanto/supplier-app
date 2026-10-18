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
