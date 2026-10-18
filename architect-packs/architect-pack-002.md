# ARCHITECT PACK 002 � Sprint 002: Pengiriman + Piutang (fitur #1)
Tanggal: 2026-10-15 | Disalin dari planning/sprints/sprint-002/ (audit trail Bab 8.5) | Status: DRAFT menunggu persetujuan pemilik


# REQUIREMENTS — Sprint 002: Pengiriman + Piutang (fitur #1)

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | ✅ SELESAI — clasp+spreadsheet 11 tab, pembelian tunai/tempo, hutang toko |
| 002 | Pengiriman & Piutang | Kirim ke SPPG otomatis jadi piutang; aging per SPPG; bayar FIFO akurat |
| 003 | Stok, Opname & Laporan | Stok akurat + opname; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Membuktikan alur JUAL end-to-end: catat pengiriman ke SPPG dari HP → stok berkurang → piutang terbentuk otomatis dengan jatuh tempo → terima pembayaran (penuh/sebagian, FIFO) → piutang berkurang & kas masuk tercatat. Sprint ini adalah "fitur #1" (DOMAIN.MD pain #1: tunggakan SPPG kronis).

## Apa yang Dibangun
- Pengiriman: catat kirim ke SPPG (pilih SPPG + item + qty + harga jual), snapshot HPP rata-rata berbobot, margin tersimpan permanen
- Piutang otomatis: tiap pengiriman → 1 baris PiutangBaris (PTB-) dengan tanggal + jatuhTempo (tempoHari SPPG, default Config 14)
- Stok guard: tolak bila stok kurang, kecuali ada `catatanOverride` (tetap kirim + tercatat)
- Pembayaran SPPG: bayar penuh/sebagian, alokasi FIFO otomatis ke faktur tertua, bisa ke faktur spesifik, idempoten via `pembayaranId`
- Query: aging piutang per SPPG (bucket 0–7 / 8–30 / >30 hari) + riwayat pengiriman per SPPG (siap audit BGN: tanggal/item/qty/harga/total/status)
- Cache harga: `hargaJualTerakhir` item ter-update tiap pengiriman

## Mengapa
- Tanpa piutang otomatis, owner mencatat ganda (kirim lalu tagih manual) — sumber selisih
- Aging per SPPG adalah keputusan tagih harian owner; tanpa bucket umur, tunggakan kronis tak terlihat
- FIFO + snapshot HPP membuat margin per pengiriman konsisten walau harga beli berubah-ubah (pain DOMAIN.MD #3)
- Override ber-catatan menjaga kelancaran kirim saat stok mepet tanpa merusak audit trail

## Pengguna
- Owner (satu-satunya): input dari HP saat kirim ke dapur; review piutang/aging di HP/laptop

## Data Sumber
- Master existing (Toko/SPPG/Item dari Sprint 001) + pembelian existing (sumber HPP & stok masuk)
- Harga jual dicatat per transaksi (bukan master); tempoHari per SPPG (default 14)

## Output yang Diharapkan
- Kirim tercatat → PiutangBaris terbentuk + stok berkurang + margin terhitung (terbukti lewat ACCEPTANCE.MD)
- `getPiutang()` tampil per SPPG: totalSisa, jumlah terbuka, bucket umur, tertua
- `bayarPiutang()` FIFO akurat; sisa konsisten dengan hitung ulang `auditPiutang()`-style (jumlah alokasi = jumlah bayar)

## Batasan
- Tanpa UI premium (menunggu Stitch — Sprint 004); tanpa penambahan layar; fungsi server + test saja
- Tanpa PDF invoice, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT Sprint 002; tanpa keputusan stack baru (D1–D5 dikunci)
- Tanpa stok akhir/opname/kas-margin periode/dashboard (Sprint 003–004); tanpa arsip/backup/deploy produksi (Sprint 005)
- Skema tab TIDAK berubah (11 tab Sprint 001 sudah mencakup Pengiriman/PembayaranJual/PiutangBaris — hanya isi yang dipakai)



<!-- ======== BLUEPRINT.MD ======== -->


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



<!-- ======== ACCEPTANCE.MD ======== -->


# ACCEPTANCE CRITERIA — Sprint 002: Pengiriman + Piutang (fitur #1)

## Task Gate (WAJIB lulus sebelum menilai kriteria sprint)
- [ ] Semua DoD per-task di BLUEPRINT sudah hijau: `npm run check` exit 0 + rung-3 tiap task dijalankan dengan output ditempel
- [ ] Task hot-path (T4.1, T4.2, T4.3, T4.4) punya baris DSA hadir & konsisten dengan BLUEPRINT (cek keberadaan; kualitas dinilai ladder, bukan opini)
- [ ] Tidak ada file/librari di luar daftar BLUEPRINT (cek `git status` + `git ls-files`)
- [ ] Skema tab tidak berubah (header 11 tab = Sprint 001; cek `config.gs` diff kosong)

## Definisi "Selesai"
Sprint ini SELESAI jika semua kriteria B1–B7 PASS dengan bukti (output perintah/screenshot asli).

### B1. Cek berkala (Task Gate)
- **Given** repo di keadaan sprint selesai, **When** dijalankan `npm run check`, **Then** exit code 0 dan output berakhir tanpa error lint/type/test.
  Command: `npm run check; echo "EXIT=$?"` → expect `EXIT=0` (paste ringkasan N lulus, M file test).

### B2. Push & manifest (tak ada perubahan manifest)
- **Given** proyek clasp terhubung (script container-bound 1vcM, rootDir src), **When** `npx clasp push -f` dijalankan, **Then** exit 0 dan output menyebut file yang di-push (termasuk `piutang.logic.gs` + `pengiriman.server.gs`).
  Command: `npx clasp push -f; echo "EXIT=$?"` → expect `EXIT=0`.

### B3. Pengiriman → piutang otomatis (happy path + HPP snapshot)
- **Given** SPPG 'SPPG Uji' (tempoHari kosong → default 14) dan Item 'Beras Uji' (satuan sak) ada, serta 2 pembelian: (p1) 10 sak × 300.000, (p2) 10 sak × 320.000 → HPP = 310.000, stok = 20 sak, **When** `createPengiriman({sppgId, itemId, qty:5, satuan:'sak', hargaJual:350000, tanggal:'2026-10-20'})` dipanggil, **Then**: 1 baris JBL (total 1.750.000, hargaBeliPakai 310.000, margin 200.000); 1 baris PTB (nominal 1.750.000, sisa 1.750.000, status `terbuka`, jatuhTempo = 2026-11-03); Item.hargaJualTerakhir = 350.000; Log berisi entri `createPengiriman`.
  Command (rung-3 editor; fallback harness in-process pola 001 bila `clasp run` NOT_FOUND): panggil + `console.log(JSON.stringify(listPengiriman({})))` → expect 1 baris sesuai; cek tab PiutangBaris 1 baris PTB-.

### B4. Guard stok (edge case: kurang tanpa/melalui override)
- **Given** stok Beras Uji sisa 15 sak pasca-B3, **When** `createPengiriman({qty:99, ...})` tanpa `catatanOverride` → Then error `STOK_KURANG`, baris JBL/PTB tidak bertambah. **When** dipanggil lagi dengan `catatanOverride:'Stok fisik ada, susulan catat'` → Then lolos (JBL+PTB terbentuk, kolom catatanOverride terisi).
  Command (rung-3): dua pemanggilan → expect pesan error lalu sukses; verifikasi jumlah baris +1 hanya pada panggilan kedua.

### B5. Aging piutang per SPPG
- **Given** skenario B3+B4 (2 faktur terbuka milik SPPG Uji), **When** `getPiutang()` dipanggil, **Then** output berisi SPPG Uji dengan totalSisa = Σsisa, jumlahTerbuka = 2, bucket `0-7`/`8-30`/`>30` konsisten dengan umur (hari ini − tanggal), tertuaTanggal = tanggal faktur tertua, tiap faktur bawa {id, tanggal, jatuhTempo, nominal, sisa, umur}.
  Command (rung-3): `console.log(JSON.stringify(getPiutang()))` → expect JSON berisi `{"sppg":"SPPG Uji",...}` (paste JSON); hitungan manual cocok.
- **Edge**: SPPG tanpa piutang → tidak muncul di output (bukan total 0).

### B6. Bayar piutang FIFO (edge case: sebagian, spesifik, melebihi sisa, idempoten)
- **Given** 2 faktur terbuka (F1 tertua sisa S1, F2 sisa S2), **When** `bayarPiutang({sppgId, jumlah:S1/2})` → Then baris PYJ tercatat dengan alokasi JSON `{F1: S1/2}`, F1 status `sebagian` sisa S1/2, F2 utuh. **When** `bayarPiutang({jumlah: 999×totalSisa})` → Then error `MELEBIHI_SISA`, tanpa baris PYJ baru. **When** `bayarPiutang({sppgId, jumlah:X, pembayaranId:'PYJ-TEST-001'})` 2× → Then panggilan kedua return `{id:'PYJ-TEST-001', idempoten:true}` tanpa baris ganda. **When** bayar ke `pengirimanId` spesifik F2 → Then alokasi hanya ke F2.
  Command (rung-3): empat pemanggilan → expect status + pesan error + flag idempoten; Log konsisten (tanpa entri ganda untuk retry).

### B7. Riwayat pengiriman per SPPG (audit trail, US-12)
- **Given** skenario B3–B6, **When** `listPengiriman({sppgId})` dipanggil, **Then** daftar berisi semua JBL milik SPPG Uji (tanggal, item, qty, harga, total, status bayar terkini dari PTB) terurut tanggal desc; tidak ada fungsi hapus (koreksi = transaksi baru, bukan edit/delete).
  Command (rung-3): `console.log(JSON.stringify(listPengiriman({sppgId:'...'})))` → expect N baris sesuai skenario.

## Output yang Bisa Didemonstrasikan
1. Skenario kirim→piutang→bayar FIFO ujung-ke-ujung di spreadsheet DB (tab Pengiriman/PiutangBaris/PembayaranJual + Log)
2. JSON `getPiutang()` per SPPG dengan bucket aging (B5)
3. `npm run check` hijau + `clasp push -f` exit 0 dari terminal builder (B1–B2)

## Sprint Boundary (sengaja TIDAK dites di sprint ini — milik sprint berikut)
Stok akhir/opname, kas & margin periode, dashboard real-time + auto-refresh, UI premium Stitch, arsip/backup/deploy produksi. Skema tab baru juga tidak dibuat (tetap 11 tab).



<!-- ======== HANDOFF-PROMPT.MD ======== -->


# HANDOFF PROMPT — Sprint 002: Pengiriman + Piutang (fitur #1) — DRAFT (menunggu persetujuan pemilik)

## Prompt untuk Builder (paste apa adanya setelah pack disetujui)

Anda adalah BUILDER dalam metode Architect-Builder. Sprint 002.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` — aturan umum (dry run dulu, bukti asli, tanpa library di luar BLUEPRINT)
2. `STATE.MD` — status terkini (Sprint 001 SELESAI APPROVED+CLEAN)
3. `DECISIONS.MD` — stack terkunci D1–D5 + keputusan 2026-10-15 (logic `.logic.gs`, container-bound 1vcM, protokol sinkron editor, Sheet1, scope penuh)
4. `CONSTRAINTS.MD` — floor + dimensi enforced (lint/typecheck/test/secrets/pin)
5. `planning/sprints/sprint-002/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD` — isi sprint ini
6. Referensi teknis: `docs/DATA-MODEL.MD` (§2 skema Pengiriman/PiutangBaris/PembayaranJual, §5 turunan), `docs/ARCHITECTURE.MD`, `planning/MODULE-PLAN.MD` (M4/T4.1–T4.4), `src/modules/pembelian.server.gs` (pola guard/lock/log/idempotency untuk ditiru)

### Bootstrap command block (JALANKAN SEBELUM APA PUN; deterministik — jangan mengarang setup sendiri)
```bash
# 0) Prasyarat: Node.js >= 20
node -v                                   # expect v20+

# 1) Dependensi terpin (SAMA Sprint 001, tanpa penambahan)
npm install                               # resolve 6 devDep exact dari package-lock.json
npm run check                             # sanity: hijau sebelum mulai (expect EXIT=0)

# 2) Auth clasp — lewati bila token ada (cek: npx clasp list)
npx clasp list                            # bila error auth → minta user `npx clasp login` (JANGAN print token)

# 3) Verifikasi remote = Sprint 001 (jangan timpa sebelum paham)
npx clasp pull                            # opsional cek; waspada kembaran .js untracked (catatan DECISIONS 2026-10-15) — pulihkan via git bila muncul

# 4) Push verifikasi per task + final
npx clasp push -f                         # expect exit 0 (B2)

# 5) Rung-3 via editor online script 1vcM (container-bound DB 1QNJ):
#    tutup SEMUA tab Apps Script & buka ulang dari URL 1vcM setiap habis push (protokol 2026-10-15),
#    verifikasi file piutang.logic.gs + pengiriman.server.gs terlihat, baru Run skenario B3–B7.
#    Bila `clasp run` NOT_FOUND → fallback harness in-process pola VERIFICATION-REPORT 001
#    (muat src/*.gs asli + shim layanan GAS in-memory; harness di luar src/tests, hapus setelah run).
```
Jika langkah apa pun gagal: HENTIKAN, lapor error exact + usulan perbaikan, JANGAN menebak.

### Aturan kerja (wajib)
1. **DRY RUN DULU**: setelah membaca pack, laporkan: (a) daftar file dibuat/diubah persis BLUEPRINT, (b) urutan T4.1→T4.4, (c) dependensi + versi exact (cat package.json), (d) risiko yang kamu lihat, (e) titik butuh user (login/otorisasi/setupOwner_/init ulang bila DB reset).
2. **TUNGGU persetujuan** ("Approved. Mulai coding.") sebelum menulis kode apa pun.
3. Kerjakan berurutan; **setiap task selesai hanya jika DoD hijau** (`npm run check` + rung-3 task) — tempel output asli.
4. Task hot-path (T4.1–T4.4): tulis baris DSA persis BLUEPRINT sebelum implementasi; logic murni WAJIB `.logic.gs` (jangan `.js`).
5. Selesai: jalankan ACCEPTANCE B1–B7, lapor PASS/FAIL per butir + bukti, lalu minta `/acceptance-runner` (konteks segar) sebelum menganggap selesai.
6. Update STATE.MD + FILE-INVENTORY.MD saat selesai (atau minta /state-keeper).

### JANGAN
- JANGAN coding sebelum dry run disetujui
- JANGAN mengubah requirements/kriteria atau skema tab (11 tab tetap; header tetap)
- JANGAN menambah library/tool di luar BLUEPRINT (runtime deps = NOL)
- JANGAN mengubah versi dependensi terpin tanpa entri DECISIONS.MD
- JANGAN taruh kode Node-only (require/module tanpa guard) di src/ — pola guard `typeof module` seperti pembelian.logic.gs
- JANGAN menyentuh file Sprint 001 (master/pembelian/server/db/audit/init) kecuali import-helper; JANGAN fitur sprint berikut (opname/kas-margin/dashboard/UI Stitch/arsip-deploy)
- JANGAN commit/print `.clasprc.json`, `.clasp.json`, OWNER_EMAIL
- JANGAN menganggap "kelihatannya benar" sebagai selesai — hanya output perintah yang berlaku

### SETUJU (setelah persetujuan dry run)
- Mulai T4.1 → berurutan sampai T4.4 (logic murni + gas-fakes dulu, baru rung-3 push+editor)
- Protokol sinkron editor setiap push; snippet rung_* tempel ulang setelah refresh (terhapus tiap push — wajar)

