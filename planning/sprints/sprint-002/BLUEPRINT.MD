# BLUEPRINT — Sprint 002: Pengiriman + Piutang (fitur #1)

## Arsitektur Sistem (scope sprint ini — D1–D5 dikunci, tidak diputuskan ulang)

```
 HP/Laptop owner                     Lokal (builder)
┌──────────────────┐   clasp push  ┌──────────────────────┐
│ Browser (rung-3  │──────────────▶│ src/*.gs (repo)      │
│ editor / harness)│               │ + tests/piutang      │
└────────┬─────────┘               └──────────┬───────────┘
         │ google.script.run                 │ clasp deploy
         ▼                                   ▼
┌─────────────────────────────────────────────────────────┐
│ Apps Script V8 — execute as owner, access MYSELF        │
│ guardOwner_ · lockWrap_ · writeLog · readTab_/appendRows│
│ master.server · pembelian.server (001, tak disentuh)    │
│ pengiriman.server (BARU T4.2–T4.4) + piutang.logic (BARU)│
└──────────────────────────┬──────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Google Spreadsheet DB 1QNJ (11 tab, skema DATA-MODEL §2) │
│ Pengiriman · PiutangBaris · PembayaranJual (dipakai aktif│
│ pertama kali) + Pembelian/Opname (sumber stok & HPP)    │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack (DIKUNCI dari docs/ARCHITECTURE.MD D1–D5)
Apps Script V8 · HtmlService (tak disentuh sprint ini) · Google Sheets (11 tab, skema tetap) · auth Execute-as-Me/MYSELF + `guardOwner_` tiap fungsi publik · clasp+git (script container-bound 1vcM, DB 1QNJ) · gas-fakes rung-2 + harness in-process rung-3 (pola VERIFICATION-REPORT 001).

## Dependensi (PIN — Bab 17.2; exact, tanpa `^`; runtime = NOL)
Dev (sprint ini — SAMA dengan Sprint 001, tidak ada penambahan):
| Package | Pin exact | Catatan |
|---|---|---|
| @google/clasp | 3.4.1 | build tool, dev-only |
| @mcpher/gas-fakes | 2.5.8 | rung-2 Node |
| eslint | 10.12.0 | `npm run lint` |
| eslint-plugin-googleappsscript | 1.0.5 | globals GAS |
| typescript | 7.0.2 | `npm run typecheck` |
| @types/google-apps-script | 2.0.13 | types GAS |
Aturan: mengubah versi = keputusan baru di DECISIONS.MD. Runtime GAS = NOL (tidak ada npm runtime dep).

## File yang Akan Dibuat/Diubah (sprint 002)
1. `src/modules/piutang.logic.gs` — BARU: logika murni (FIFO, aging, HPP rata-rata berbobot, baris pengiriman/piutang). Ekstensi `.logic.gs` WAJIB (keputusan 2026-10-15: `.js` murni sebabkan ReferenceError; yang dites = yang di-deploy).
2. `src/modules/pengiriman.server.gs` — BARU: adapter GAS (`createPengiriman`, `bayarPiutang`, `getPiutang`, `listPengiriman` + helper `stokItem_`, `hppItem_`, `configMap_` reuse pola pembelian.server).
3. `tests/piutang.test.js` — BARU: unit logic murni (HPP, margin, FIFO penuh/sebagian/melebihi, aging bucket, validasi).
4. `tests/run.js` — UBAH: daftarkan `piutang.test.js` (pola existing master/pembelian).
5. `src/appsscript.json`, `src/config.gs`, `.claspignore`, `tsconfig.json`, `eslint.config.js`, `package.json` — TIDAK DIUBAH (scopes spreadsheets penuh + container.ui + userinfo.email sudah benar; TABS sudah ada Pengiriman/PembayaranJual/PiutangBaris; claspignore sudah pola resmi `**/**` + `!**/*.gs`).
6. `src/modules/master.*`, `src/modules/pembelian.*`, `src/server.gs`, `src/db.gs`, `src/audit.gs`, `src/init.gs` — TIDAK DIUBAH (reuse guard/lock/log/readTab).

## Package scripts (sama Sprint 001; DoD semua task)
```
"lint":      "eslint --no-error-on-unmatched-pattern \"src/**/*.{js,gs}\" tests"
"typecheck": "tsc -p tsconfig.json --noEmit"
"test":      "node tests/run.js"
"check":     "npm run lint && npm run typecheck && npm test"
```

## Kontrak Data (dari DATA-MODEL §2, diringkas untuk builder)
- Pengiriman: `id JBL-uuid, tanggal, sppgId→SPPG.id, itemId→Item.id, qty>0, satuan=satuanDasar item, hargaJual>0, total=qty×hargaJual, hargaBeliPakai=snapshot HPP, margin=total−qty×hargaBeliPakai, catatanOverride?, createdAt`
- PiutangBaris: `id PTB-uuid, pengirimanId unique→Pengiriman.id, sppgId (denormalisasi), tanggal=pengiriman, jatuhTempo=tanggal+tempoHari SPPG (fallback Config TEMPO_DEFAULT_HARI=14), nominal=total, sisa=nominal−Σalokasi, status=terbuka/sebagian/lunas`
- PembayaranJual: `id PYJ-uuid (atau pembayaranId client untuk idempotency), sppgId, tanggal, jumlah>0, alokasi JSON {PTB-id: jumlah}, createdAt`
- HPP rata-rata berbobot per item = Σ(pembelian.total per item) / Σ(pembelian.qty per item) seluruh riwayat (snapshot saat kirim; margin permanen walau harga berubah).
- Stok(item) = ΣPembelian.qty − ΣPengiriman.qty + ΣOpname.koreksiStok (Opname kosong di sprint ini = 0).
- Umur piutang = hari ini − tanggal pengiriman (hari kalender); bucket 0–7 / 8–30 / >30.
- FIFO = faktur terbuka (`sisa>0`) sort tanggal asc (tiebreak jatuhTempo asc, lalu id).

## Tasks (micro-steps; files; DoD machine-checked)

### T4.1 piutang logic murni — files: src/modules/piutang.logic.gs, tests/piutang.test.js
1. `hitungHPPRataRata(pembelianRows)` → Σtotal/Σqty; lempar `HPP_TIDAK_ADA` bila Σqty ≤ 0 (files: piutang.logic.gs)
2. `hitungMargin(qty, hargaJual, hpp)` → qty×(hargaJual−hpp); validasi qty>0, hargaJual>0, hpp≥0 else `HARGA_TIDAK_VALID`/`QTY_TIDAK_VALID` (files: sama)
3. `hitungJatuhTempoPiutang(tanggal, tempoHariSppg, tempoDefault)` → tanggal+hari (files: sama)
4. `alokasiPiutang(fakturTerbuka, jumlah)` — FIFO sesuai urutan array; `JUMLAH_TIDAK_VALID` bila ≤0; `MELEBIHI_SISA` bila > Σsisa; return [{id, bayar}] (files: sama)
5. `bucketAging(umurHari)` → `0-7`/`8-30`/`>30`; `umurHari(tanggal, hariIni)` helper (files: sama)
6. `barisPengiriman(header, payload, id, now, hpp)` + `barisPiutang(headerPTB, pengirimanId, sppgId, tanggal, jatuhTempo, nominal, idPTB)` — susun array kolom sesuai header (files: sama)
7. Test: HPP berbobot 2 pembelian; margin; jatuhTempo default 14; FIFO penuh/sebagian/melebihi; bucket batas 7/8/30/31; qty 0 & harga 0 ditolak (files: tests/piutang.test.js + register di tests/run.js)
- **DoD**: `npm run check` exit 0 (paste ringkasan N lulus)
- **DSA**: DSA: alokasiPiutang — sort faktur terbuka O(F log F), alokasi O(F) — F = faktur terbuka per SPPG (<100), sekali per pembayaran

### T4.2 createPengiriman — files: src/modules/pengiriman.server.gs
1. `stokItem_(itemId)` — batch baca Pembelian+Pengiriman+Opname → stok (files: pengiriman.server.gs)
2. `hppItem_(itemId)` — Σtotal/Σqty dari Pembelian per item (files: sama)
3. `createPengiriman(payload)` — guard; validasi FK sppgId/itemId ada & aktif, qty>0, hargaJual>0, satuan cocok; lockWrap_: cek stok → bila kurang dan tanpa `catatanOverride` throw `STOK_KURANG`; hitung total/margin/HPP snapshot; append JBL + PTB; update Item.hargaJualTerakhir; writeLog; flush; return {id, piutangId, margin, stokSisa} (files: sama)
- **DoD**: `npm run check` + rung-3: kirim valid → 1 JBL + 1 PTB (jatuhTempo=tanggal+tempo SPPG), margin benar, hargaJualTerakhir update, Log 1 entri (paste)
- **DSA**: DSA: stokItem_ + hppItem_ — scan 3 tab batch O(n) sekali per request — n = baris transaksi, dibaca 1x per tab

### T4.3 bayarPiutang — files: src/modules/pengiriman.server.gs (lanjut), tests/piutang.test.js (kasus alokasi server-side bila perlu)
1. `fakturTerbukaSppg_(sppgId)` — baca PiutangBaris filter sisa>0 milik SPPG + sort FIFO (files: pengiriman.server.gs)
2. `bayarPiutang({sppgId, tanggal, jumlah, pengirimanId?, pembayaranId?})` — guard; lockWrap_; target = semua terbuka atau 1 faktur spesifik; `alokasiPiutang` via logic; idempotency: bila `pembayaranId` sudah ada di mapById → return {id, idempoten:true} tanpa tulis; tulis PYJ + alokasi JSON; update kolom sisa/status PiutangBaris batch; writeLog; flush (files: sama)
- **DoD**: `npm run check` + rung-3: bayar 50% → status `sebagian`, sisa 50%; bayar melebihi sisa → `MELEBIHI_SISA` tanpa baris baru; `pembayaranId` sama 2× → idempoten (paste)
- **DSA**: DSA: update sisa/status batch — 1 baca + 1 tulis per faktur terdampak O(F) — F kecil, tanpa scan berulang

### T4.4 getPiutang + listPengiriman — files: src/modules/pengiriman.server.gs
1. `getPiutang(sppgId?)` — guard; baca PiutangBaris + SPPG; filter terbuka; agregasi per SPPG {sppgId, sppg, totalSisa, jumlahTerbuka, bucket:{'0-7','8-30','>30'}, tertuaTanggal, faktur:[{id,tanggal,jatuhTempo,nominal,sisa,umur}]} (files: pengiriman.server.gs)
2. `listPengiriman({dari, sampai, sppgId})` — filter in-memory tanggal/SPPG + join status piutang (files: sama)
- **DoD**: `npm run check` + rung-3: JSON getPiutang cocok hitungan manual skenario T4.2+T4.3 (paste JSON)
- **DSA**: DSA: agregasi aging — scan PiutangBaris + akumulasi per SPPG O(n) sekali per request — n = baris piutang, batch 1x

## Risiko Sprint 002
| Task | Risk | Mitigasi |
|---|---|---|
| T4.1 | HPP definisi ganda (rata-rata vs terakhir) | Kunci: rata-rata berbobot seluruh pembelian per item (BLUEPRINT §Kontrak); snapshot permanen di JBL |
| T4.2 | Stok race / double-write | Semua tulis dalam `lockWrap_`; cek stok di dalam lock; override wajib `catatanOverride` non-kosong |
| T4.3 | Bayar dobel saat retry HP | `pembayaranId` idempoten: cek mapById dulu (pola bayarHutang 001) |
| T4.3 | Alokasi salah sasaran | FIFO sort tunggal di `fakturTerbukaSppg_`; logic `alokasiPiutang` tanpa sort internal (urutan = kontrak caller) |
| Semua | `clasp run` NOT_FOUND (pola 001) | Rung-3 via editor online; fallback harness in-process kode `src/*.gs` asli vs shim (catat di ACCEPTANCE) |
| Semua | Kuota 6 menit | Data sprint <5k baris; batch read/write + flush 1×; tanpa chunking |

## Consistency Check (Sprint-Planner Step 4) — DRAFT, wajib diverifikasi pemilik sebelum handoff
- [x] Setiap item REQUIREMENTS muncul di BLUEPRINT (pengiriman, PTB otomatis, guard stok+override, bayar FIFO, aging, riwayat, hargaJualTerakhir)
- [x] Setiap task BLUEPRINT punya ≥1 kriteria ACCEPTANCE (T4.1→B3/B6-unit, T4.2→B3/B4, T4.3→B6, T4.4→B5/B7)
- [x] Setiap task punya DoD machine-checked (`npm run check` + rung-3 spesifik)
- [x] Task hot-path bawa DSA line (T4.1, T4.2, T4.3, T4.4)
- [x] ACCEPTANCE tidak meminta fitur di luar BLUEPRINT (tanpa UI/Stitch/kas-margin/dashboard/arsip)
- [x] HANDOFF-PROMPT memuat blok bootstrap
- [x] Dependensi == keputusan advisor + pin Sprint 001 (tidak ada drift; runtime NOL)
- [x] Satu sprint = satu goal (Pengiriman→Piutang FIFO)
