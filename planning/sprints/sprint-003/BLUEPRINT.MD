# BLUEPRINT — Sprint 003: Stok, Opname & Laporan

## Arsitektur Sistem (scope sprint ini — D1–D5 dikunci, tidak diputuskan ulang)

```
 HP/Laptop owner                     Lokal (builder)
┌──────────────────┐   clasp push  ┌──────────────────────┐
│ Browser (rung-3  │──────────────▶│ src/*.gs (repo)      │
│ editor / harness)│               │ + tests/stok+laporan │
└────────┬─────────┘               └──────────┬───────────┘
         │ google.script.run                 │ clasp deploy (@HEAD)
         ▼                                   ▼
┌─────────────────────────────────────────────────────────┐
│ Apps Script V8 — execute as owner, access MYSELF        │
│ guardOwner_ · lockWrap_ · writeLog · readTab_/appendRows│
│ master/pembelian/pengiriman .server (tak disentuh)       │
│ stok.server + laporan.server (BARU T5.2–T6.2)            │
│ stok.logic + laporan.logic (BARU T5.1/T6.1)              │
└──────────────────────────┬──────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Spreadsheet DB 1QNJ (11 tab, skema tetap)                │
│ Opname (dipakai aktif pertama kali) + Item.batasStokMin  │
│ Pembelian/Pengiriman/Pembayaran* (sumber hitung)         │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack (DIKUNCI D1–D5)
Apps Script V8 · Sheets 11 tab (skema tetap) · MYSELF + `guardOwner_` · clasp+git (1vcM/1QNJ) · gas-fakes + harness in-process (pola 001/002).

## Dependensi (PIN exact; runtime NOL; SAMA Sprint 001–002, tanpa penambahan)
@google/clasp 3.4.1 · @mcpher/gas-fakes 2.5.8 · eslint 10.12.0 · eslint-plugin-googleappsscript 1.0.5 · typescript 7.0.2 · @types/google-apps-script 2.0.13. Mengubah versi = DECISIONS.MD baru.

## File yang Akan Dibuat/Diubah (sprint 003)
1. `src/modules/stok.logic.gs` — BARU: `hitungStok(masuk, keluar, koreksi)`, `selisihOpname(fisik, sistem)`, `barisOpname(header, payload, snapshotSistem, id, now)`.
2. `src/modules/stok.server.gs` — BARU: `stokSemua_()` (agregat 3 tab), `getStok()`, `listMutasiStok(filter)`, `doOpname(payload)`, `getBatasStok()`, `setBatasStok({itemId, batas})`.
3. `src/modules/laporan.logic.gs` — BARU: `agregatKas(bayarJual, beliTunai, bayarBeli, dari, sampai)`, `agregatMargin(pengirimanRows, dari, sampai)`.
4. `src/modules/laporan.server.gs` — BARU: `getLaporanKas({dari, sampai})`, `getMargin({dari, sampai})`.
5. `tests/stok.test.js`, `tests/laporan.test.js` — BARU (auto-discovery, `run.js` tak perlu edit).
6. `eslint.config.js` — TAMBAH globals fungsi baru (pola Sprint 002; satu-satunya file lama yang disentuh).
7. TIDAK DIUBAH: manifest, `config.gs`, `.claspignore`, tsconfig, package.json, seluruh `*.server.gs`/`*.logic.gs` Sprint 001–002 (duplikasi baca agregat kecil di `stokSemua_` disengaja — nol risiko regresi; lihat Risiko).

## Kontrak Data (DATA-MODEL §2+§5)
- Opname: `id OPN-uuid, tanggal, itemId, fisik≥0, sistem=snapshot, selisih=fisik−sistem, koreksiStok=selisih, catatan?, createdAt`.
- Stok(item) = ΣPembelian.qty − ΣPengiriman.qty + ΣOpname.koreksiStok (satuanDasar, tanpa konversi).
- `getStok()` → [{itemId, nama, satuan, stok, batasStokMin, tipis: stok<batas, masukHariIni, keluarHariIni}].
- Mutasi = baris Pembelian (masuk) + Pengiriman (keluar) + Opname (koreksi) → [{tanggal, jenis, itemId, qty, refId}] filter {dari, sampai, itemId}, sort tanggal desc.
- Kas periode: masuk = ΣPembayaranJual.jumlah; keluar = ΣPembelian tunai.total + ΣPembayaranBeli.jumlah; saldo = masuk − keluar. Filter tanggal masing-masing tab.
- Margin periode: dari tab Pengiriman (snapshot `margin`, bukan hitung ulang) → {total, perItem: {itemId: margin}, jumlahPengiriman}. Filter tanggal kirim.

## Tasks

### T5.1 stok logic murni — files: stok.logic.gs, tests/stok.test.js
1. `hitungStok`, `selisihOpname` (fisik≥0 else `FISIK_TIDAK_VALID`), `barisOpname` (files: stok.logic.gs)
2. Test: stok 20−5+2=17; selisih ±; fisik negatif ditolak (files: tests/stok.test.js)
- **DoD**: `npm run check` exit 0
- **DSA**: DSA: hitungStok — agregasi Σ per item O(n) sekali per request — n = baris 3 tab, batch 1x per tab

### T5.2 getStok + mutasi + batas — files: stok.server.gs
1. `stokSemua_` batch 3 tab → map itemId→stok (files: stok.server.gs)
2. `getStok()` + mutasi hari ini; `listMutasiStok({dari,sampai,itemId})` merge+sort (files: sama)
3. `getBatasStok()` / `setBatasStok({itemId,batas≥0})` — guard; update sel Item.batasStokMin; writeLog (files: sama)
- **DoD**: `npm run check` + rung-3: stok cocok manual; flag tipis; mutasi terfilter (paste)
- **DSA**: DSA: listMutasiStok — merge 3 sumber + sort O(n log n) — n = baris periode, in-memory

### T5.3 doOpname — files: stok.server.gs (lanjut)
1. `doOpname({itemId, fisik, tanggal?, catatan?})` — guard; lockWrap_: snapshot sistem via `stokSemua_`; tulis OPN; writeLog; flush; return {sistem, selisih} (files: stok.server.gs)
- **DoD**: `npm run check` + rung-3: fisik<catatan → selisih negatif tercatat; stok pasca = fisik (paste)
- **DSA**: DSA: doOpname — snapshot + 1 append O(n) baca batch — idempoten via OPN id unik (retry = baris baru tercatat)

### T6.1 laporan logic murni — files: laporan.logic.gs, tests/laporan.test.js
1. `agregatKas` + `agregatMargin` atas array baris + rentang tanggal (files: laporan.logic.gs)
2. Test: kas masuk−keluar=saldo; margin Σ snapshot + per item (files: tests/laporan.test.js)
- **DoD**: `npm run check` exit 0
- **DSA**: DSA: agregatKas/agregatMargin — filter rentang + Σ O(n) sekali per request — n = baris 4 tab transaksi

### T6.2 getLaporanKas + getMargin — files: laporan.server.gs
1. `getLaporanKas({dari,sampai})`, `getMargin({dari,sampai})` — guard; batch baca; panggil logic; return {masuk,keluar,saldo,rincian?}/{total,perItem,jumlahPengiriman} (files: laporan.server.gs)
- **DoD**: `npm run check` + rung-3: angka cocok hitungan manual skenario (paste JSON)
- **DSA**: DSA: laporan server — 1 batch read per tab + agregasi in-memory O(n) — tanpa rumus sel

## Risiko Sprint 003
| Task | Risk | Mitigasi |
|---|---|---|
| T5.2 | Duplikasi agregat stok vs `stokItem_` (002) divergen | Formula tunggal di §Kontrak; `stokSemua_` dipakai semua fungsi baru; unifikasi ditunda Sprint 005 |
| T5.3 | Opname ganda (retry HP) = koreksi ganda | By design tercatat (audit trail); dokumentasikan di ACCEPTANCE C4 |
| T6.1 | Kas definisi ganda (tempo beli masuk kas kapan?) | Kunci §Kontrak: keluar saat bayar (tunai saat beli, tempo saat bayarHutang); piutang masuk saat bayarPiutang |
| Semua | Satuan campur (sak vs kg) | TIDAK dikonversi sprint ini (REQUIREMENTS Batasan); hitung per satuanDasar |
| Semua | `clasp run` NOT_FOUND | Rung-3 editor + fallback harness in-process |

## Consistency Check (DRAFT)
- [x] REQUIREMENTS→BLUEPRINT lengkap (stok, mutasi, tipis, opname, kas, margin)
- [x] T5.1→C3-unit, T5.2→C3/C5, T5.3→C4, T6.1→C6/C7-unit, T6.2→C6/C7
- [x] DoD machine-checked semua; DSA di T5.1, T5.2, T5.3, T6.1, T6.2
- [x] ACCEPTANCE tanpa fitur luar BLUEPRINT; bootstrap di HANDOFF; dependensi == pin; satu goal
