# MODULE PLAN — Aplikasi Supplier Beras & Minyak SPPG MBG

Tanggal: 2026-10-10 | Sumber: /module-planner dari planning/PRD.MD + docs/ARCHITECTURE.MD (D1–D5) + docs/DATA-MODEL.MD (11 tab)
Target: Apps Script V8 + clasp, 1 penulis, MVP diproduksi secepat mungkin.

## 1. Module Map

### M1: Infra & Bootstrap
- Entities: Config, Log (+ pembuat 11 tab)
- APIs: `doGet`, `initSpreadsheet()`, `writeLog()`, guard owner
- Responsibility: proyek clasp, manifest (scopes `spreadsheets.currentonly`, `Asia/Jakarta`, `exceptionReporting: STACKDRIVER`, webapp `MYSELF`/`USER_DEPLOYING`), bootstrap spreadsheet idempotent, kunci akses (US-11), audit trail
- Dependencies: None

### M2: Master Data
- Entities: Toko, SPPG, Item
- APIs: `getMaster()`, `saveMaster()`
- Responsibility: CRUD lunak (soft delete `aktif`), validasi unique nama, cache harga terakhir
- Dependencies: M1

### M3: Pembelian & Hutang Toko
- Entities: Pembelian, PembayaranBeli
- APIs: `createPembelian()`, `listPembelian()`, `getHutangToko()`, `bayarHutang()`
- Responsibility: US-1 (belanja tunai/tempo → stok masuk + kas/hutang), US-9
- Dependencies: M1, M2 (tokoId/itemId valid)

### M4: Pengiriman & Piutang (fitur #1)
- Entities: Pengiriman, PiutangBaris, PembayaranJual
- APIs: `createPengiriman()`, `getPiutang()`, `bayarPiutang()`, `listPengiriman()`
- Responsibility: US-2 (kirim → piutang otomatis, HPP snapshot), US-3 (aging), US-4 (alokasi FIFO), US-12 (riwayat)
- Dependencies: M1, M2, M3 (HPP rata-rata dari pembelian)

### M5: Stok & Opname
- Entities: Opname (+ turunan stok)
- APIs: `getStok()`, `listMutasiStok()`, `doOpname()`, `setBatasStok()`
- Responsibility: US-5 (stok = Σmasuk−Σkeluar±koreksi), US-6 (peringatan), US-7
- Dependencies: M3, M4 (sumber mutasi)

### M6: Kas & Laporan
- Entities: (agregat dari M3/M4)
- APIs: `getLaporanKas()`, `getMargin()`
- Responsibility: US-8 kas masuk/keluar/saldo + margin per periode
- Dependencies: M3, M4

### M7: Dashboard & Real-time
- APIs: `getDashboard()`
- Responsibility: US-10 ringkasan (stok, aging, kas hari ini, peringatan), CacheService TTL = REFRESH_DETIK, indikator "data per…"
- Dependencies: M3, M4, M5, M6

### M8: UI (HtmlService SPA)
- APIs: client `google.script.run` ke semua fungsi publik M2–M7
- Responsibility: semua layar US-1..12; **design source-of-truth = output Stitch** (DECISIONS.MD 2026-10-10); mobile-first 360–480px + desktop; empty/loading/error state
- Dependencies: kontrak fungsi M2–M7 (bukan implementasinya) + input Stitch

### M9: Ops & Keamanan
- APIs: trigger arsip, backup, `auditStok()`, `auditPiutang()`, deploy
- Responsibility: arsip >20k baris (bottom-up), backup mingguan Drive, health-check turunan, versioning + deploy ladder (GAS skill)
- Dependencies: M3–M5 (data ada)

## 2. Dependency Graph & Implementation Order

```
M1 (Infra) ──▶ M2 (Master) ──▶ M3 (Pembelian) ──▶ M4 (Piutang) ──▶ M5 (Stok)
                                     │                  │             │
                                     ▼                  ▼             ▼
                                    └────────▶ M6 (Kas/Laporan) ◀─────┘
                                                    │
                       M8-UI (desain Stitch, paralel)──▶ M7 (Dashboard)
                                                    ▼
                                              M9 (Ops/Deploy)
```
Order: **M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9** (M8 desain & shell boleh paralel dari awal).

## 3. Task Breakdown (≤2 jam per task; estimasi = jam kerja builder AI)

### M1
- **T1.1** Setup clasp lokal: `clasp login`, `clasp create --type sheets` (spreadsheet baru = DB app), manifest lengkap, `.gitignore` (`.clasp.json`, `.clasprc.json`), `.claspignore` (tests/), `clasp push` sukses. Est 1,5 jtk. Paralel: ya. Done: push hijau, editor membuka proyek.
- **T1.2** `initSpreadsheet()`: 11 tab + header + freeze + dropdown (satuan/metode/aktif) + baris Config; idempotent (deteksi tab ada). Est 1,5. Depends T1.1. Done: jalankan 2× tanpa error, tab cocok DATA-MODEL §2.
- **T1.3** Fondasi server: guard owner (`Session.getActiveUser`), `lockWrap()` (try/finally), `writeLog()`, helper tulis batch + `flush()`. Est 1. Depends T1.1. Done: fungsi contoh ditolak akun lain (rung-3 manual), Log terisi.
- **T1.4** `doGet` + shell HTML (viewport meta, slot mount, tanpa data). Est 1. Depends T1.1. Done: deploy dev terbuka di HP owner.

### M2
- **T2.1** `modules/master.js` logic murni: validasi payload, unique nama case-insensitive, normalisasi. Est 1. Paralel. Done: unit gas-fakes hijau.
- **T2.2** `master.server.gs`: `getMaster`/`saveMaster` (batch read→Map by id, tulis baris baru/ubah, Log). Est 1,5. Depends T1.3, T2.1.

### M3
- **T3.1** `modules/pembelian.js`: validasi qty/harga>0, hitung total, jatuhTempo = tanggal+tempoHari (tunai=null), statusBayar awal. Est 1. Done: unit hijau termasuk tempo toko kosong → Config default.
- **T3.2** `pembelian.server.gs`: `createPembelian` (LockService, tulis BLI, update hargaBeliTerakhir item, Log, flush). Est 1,5. Depends T1.2, T3.1. Done: 20 belanja berturut → 20 baris benar.
- **T3.3** `bayarHutang`: tulis PBY, alokasi ke faktur (per faktur), update statusBayar. Est 1,5. Depends T3.2.
- **T3.4** `getHutangToko`/`listPembelian`: filter + sisa per faktur. Est 1. Depends T3.2.

### M4
- **T4.1** `modules/piutang.js`: FIFO alokasi bayar, aging bucket 0–7/8–30/>30, HPP rata-rata berbobot, invariant total/margin. Est 2. Paralel setelah T2.1. Done: unit kasus FIFO berurutan + pembayaran melebihi sisa ditolak. **(inti risiko)**
- **T4.2** `pengiriman.server.gs`: `createPengiriman` (LockService; cek stok → izinkan override ber-catatan; tulis JBL + PTB; snapshot HPP; Log). Est 1,5. Depends T1.2, T4.1.
- **T4.3** `bayarPiutang`: tulis PYJ + alokasi JSON, update `sisa/status` batch. Est 1,5. Depends T4.2. Done: bayar 50% lunas parsial; sisa konsisten dengan `auditPiutang()`.
- **T4.4** `getPiutang` (aging per SPPG) + `listPengiriman` (US-12). Est 1. Depends T4.2.

### M5
- **T5.1** `modules/stok.js`: Σ per item dari 3 tab, selisih opname, normalisasi satuan (sak↔kg). Est 1.
- **T5.2** `getStok`/`listMutasiStok` + peringatan < batasStokMin. Est 1. Depends T3.2, T4.2, T5.1.
- **T5.3** `doOpname`: tulis OPN + koreksiStok + Log. Est 1,5. Depends T5.2.

### M6
- **T6.1** `modules/laporan.js`: agregat kas & margin per rentang tanggal. Est 1,5.
- **T6.2** `getLaporanKas`/`getMargin`. Est 1. Depends T3.2, T4.3, T6.1.

### M7
- **T7.1** `getDashboard`: kompilasi stok+aging+kas+peringatan; CacheService TTL 60 dtk; payload ringkas. Est 1,5. Depends T5.2, T4.4, T6.2.
- **T7.2** client auto-refresh 60 dtk + indikator "data per…" + banner stok tipis. Est 1. Depends T1.4.

### M8 (UI — mengikuti output Stitch)
- **T8.0** **Gate input**: terima DESIGN.md/screens Stitch (milik user; belum ada → blocker T8.x). Est 0. Done: file desain di `references/`.
- **T8.1** Shell SPA: design tokens CSS dari Stitch, bottom-nav mobile / sidebar desktop, routing. Est 2. Depends T1.4, T8.0.
- **T8.2** Form cepat pembelian (suguh toko+harga terakhir). Est 1,5. Depends T2.2, T3.2.
- **T8.3** Form pengiriman + konfirmasi piutang terbentuk. Est 1,5. Depends T4.2.
- **T8.4** Skrin piutang: aging, tap detail, form bayar (sebagian/penuh). Est 1,5. Depends T4.4, T4.3.
- **T8.5** Skrin stok + opname. Est 1. Depends T5.2, T5.3.
- **T8.6** Skrin laporan kas/margin + riwayat per SPPG. Est 1,5. Depends T6.2.
- **T8.7** Polish: state loading/empty/error, dark-safe colors, tap target ≥44px, A2HS check. Est 2. Depends T8.1–T8.6.

### M9
- **T9.1** Trigger arsip bulanan (chunk bottom-up, idempoten per baris ID). Est 1,5. Depends T3.2, T4.2.
- **T9.2** Backup mingguan Drive + `auditStok`/`auditPiutang` health-check (alert ke Log). Est 1,5.
- **T9.3** Deploy produksi: `clasp version`+`clasp deploy`, akses MYSELF, ladder rung 4–5 (akses akun lain = ditolak; Executions bersih). Est 1,5. Depends semua. Done: US-11 terbukti.

## 4. Execution Plan (fase paralel)

- **Fase 0**: [T1.1] — satu-satunya task urut awal
- **Fase 1 (paralel)**: [T1.2] [T1.3] [T1.4]
- **Fase 2 (paralel)**: [T2.1] [T3.1] [T4.1] [T5.1] [T6.1] [T8.0 → T8.1] [T7.2]
- **Fase 3 (paralel)**: [T2.2] [T3.2→T3.3→T3.4] [T4.2→T4.3→T4.4]
- **Fase 4 (paralel)**: [T5.2→T5.3] [T6.2] [T8.2–T8.6]
- **Fase 5**: [T7.1] [T8.7] [T9.1] [T9.2] [T9.3] + uji integrasi
Catatan paralelisasi: logic murni (`modules/*.js`) bebas konflik file; adapter menempel satu-modul-satu-file; T8.x butuh hasil Stitch (T8.0) — desain UI = jalur mandiri yang tidak memblokir M1–M7.

## 5. File Structure (clasp; mengikuti template skill GAS)

```
src/
├── appsscript.json          # manifest: scopes currentonly, Asia/Jakarta, STACKDRIVER, webapp MYSELF
├── config.gs                # non-secret constants (nama tab, prefix ID)
├── secrets.gs               # getSecret_() over ScriptProperties (siap, MVP belum ada rahasia)
├── server.gs                # doGet + guard owner + shell template
├── db.gs                    # adapter tipis: readTab_(batch), writeRows_, lockWrap_
├── audit.gs                 # writeLog, auditStok, auditPiutang
├── modules/
│   ├── master.js            # logic murni
│   ├── master.server.gs     # getMaster/saveMaster
│   ├── pembelian.js / pembelian.server.gs
│   ├── piutang.js  / pengiriman.server.gs
│   ├── stok.js     / stok.server.gs
│   └── laporan.js  / laporan.server.gs
└── html/
    ├── index.html           # shell SPA (template GAS)
    ├── styles.css           # tokens dari Stitch
    └── app.js               # client: routing, google.script.run, auto-refresh
tests/                       # gas-fakes (Node) — di .claspignore
references/                  # DESIGN.md + screens Stitch (T8.0)
```

## 6. Risk Flags

| Task | Risk | Mitigation |
|---|---|---|
| T4.1 | FIFO alokasi salah → sisa piutang meleset | LockService + idempotency (PYJ id) + `auditPiutang()` |
| T4.3 | Bayar dobel saat retry | Alokasi keyed by PYJ id; cek sudah dialokasi |
| T3.2/T4.2 | Stok minus / double-write | Cek stok dalam lock; override wajib `catatanOverride` |
| T1.1 | `clasp login` interaktif gagal di mesin builder | Fallback: paste editor → migrasi clasp setelah akun siap (risiko tercatat ARCHITECTURE §5) |
| T8.x | Stitch belum ada → UI mandek | T8.0 gate eksplisit; M1–M7 tidak menunggu |
| T7.1 | Latensi cold start terasa | CacheService 60 dtk + indikator data-per-waktu |
| Semua | Kuota 6 menit | Task apa pun >5k baris → chunk (pola cursor GAS skill) |

## 7. Module → User Story Traceability
M1→US-11; M2→US-1,2 (dukungan); M3→US-1,9; M4→US-2,3,4,12; M5→US-5,6,7; M6→US-8; M7→US-10; M8→US-1..12 (lapisan tampilan); M9→US-7,12 + arsip.

## 8. Self-Review Checklist
- [x] Semua module map ke ≥1 user story (§7)
- [x] Setiap task ada estimasi (≤2 jam)
- [x] Dependensi eksplisit per task
- [x] Fase paralel teridentifikasi (konflik file dihindari: logic vs adapter terpisah)
- [x] Struktur file mengikuti konvensi clasp/GAS skill
- [x] Definisi "done" jelas per task
- [x] Error handling & logging jadi task (T1.3, T9.2), bukan afterthought
