# ARCHITECT PACK 003 � Sprint 003: Stok, Opname & Laporan
Tanggal: 2026-10-15 | Disalin dari planning/sprints/sprint-003/ (audit trail Bab 8.5) | Status: DRAFT menunggu persetujuan pemilik


# REQUIREMENTS — Sprint 003: Stok, Opname & Laporan

## Rencana Sprint 1..N (satu goal per sprint, Bab 10.3)

| Sprint | Nama | Goal (tunggal) |
|---|---|---|
| 001 | Fondasi + Pembelian | ✅ SELESAI |
| 002 | Pengiriman & Piutang | ✅ SELESAI (B1–B7, deploy dev @HEAD live) |
| 003 | Stok, Opname & Laporan | Stok akurat + opname tercatat; kas & margin per periode terlihat |
| 004 | Dashboard + UI Stitch | Dashboard real-time + seluruh layar mengikuti desain Stitch (butuh output Stitch sebelum sprint dimulai) |
| 005 | Ops & Produksi | Arsip, backup, audit, deploy produksi (MYSELF), acceptance penuh, security audit |

## Tujuan Sprint
Menjawab dua pertanyaan owner setiap hari: "stok beras/minyak saya tinggal berapa (harus belanja apa)?" dan "uang & untung saya periode ini berapa?". Plus jaring pengaman audit: opname fisik yang selisihnya tercatat permanen sebagai koreksi (bukan edit transaksi lama).

## Apa yang Dibangun
- Stok real-time per item: ΣPembelian − ΣPengiriman + ΣOpname.koreksiStok, dalam satuan siap pakai (sak/kg/liter) + mutasi masuk/keluar hari ini
- Riwayat mutasi terfilter (tanggal/item): gabungan pembelian + pengiriman + koreksi opname, terurut terbaru
- Peringatan stok tipis: flag per item bila stok < batasStokMin + ubah ambang via `setBatasStok`
- Opname: input hitung fisik → sistem hitung selisih vs catatan → tulis OPN permanen (fisik, sistem, selisih, koreksiStok, catatan); stok berikutnya memakai koreksi
- Laporan kas periode: kas masuk (terima piutang) vs kas keluar (belanja tunai + bayar hutang toko) + saldo
- Laporan margin periode: total + per item + jumlah pengiriman (margin memakai snapshot JBL, bukan harga berjalan)

## Mengapa
- Tanpa stok akurat, belanja buta → kelebihan/kekurangan (pain DOMAIN.MD #4)
- Tanpa opname tercatat, selisih fisik vs catatan menumpuk sampai audit BGN (aturan bisnis #5)
- Tanpa kas & margin, owner tak tahu untung riil vs kas yang bolong (PRD US-8)

## Pengguna
- Owner (satu-satunya): cek stok sebelum belanja; opname berkala; review kas/margin di laptop

## Data Sumber
- Tab existing Sprint 001–002 (Pembelian, Pengiriman, PembayaranBeli, PembayaranJual, Opname kosong, Item.batasStokMin) — tanpa tab baru

## Output yang Diharapkan
- `getStok()` cocok hitungan manual Σmasuk−Σkeluar±koreksi; item di bawah ambang berflag `tipis:true`
- `doOpname()` selisih tercatat + stok pasca-opname = fisik
- `getLaporanKas()` / `getMargin()` konsisten dengan detail transaksi (ditelusur per baris)

## Batasan
- Tanpa UI premium (Sprint 004 via Stitch); tanpa dashboard real-time/auto-refresh (Sprint 004); tanpa arsip/backup/deploy produksi (Sprint 005)
- Tanpa PDF, WhatsApp, multi-user, akuntansi penuh (out-of-scope PRD §7)
- Tanpa library di luar BLUEPRINT; tanpa keputusan stack baru (D1–D5 dikunci); tanpa ubah skema 11 tab
- Normalisasi satuan (sak↔kg) TIDAK dikerjakan — qty dicatat & dihitung dalam satuanDasar item apa adanya (ditunda tercatat sebagai risiko)



<!-- ======== BLUEPRINT.MD ======== -->


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



<!-- ======== ACCEPTANCE.MD ======== -->


# ACCEPTANCE CRITERIA — Sprint 003: Stok, Opname & Laporan

## Task Gate (WAJIB lulus sebelum menilai kriteria sprint)
- [ ] `npm run check` exit 0 + rung-3 tiap task (output ditempel)
- [ ] Baris DSA T5.1, T5.2, T5.3, T6.1, T6.2 hadir & konsisten BLUEPRINT
- [ ] Tak ada file/lib di luar BLUEPRINT (`git status` + `git ls-files`); skema 11 tab tak berubah

## Definisi "Selesai"
SELESAI jika C1–C7 PASS dengan bukti.

### C1. Cek berkala — `npm run check; echo "EXIT=$?"` → `EXIT=0` (N lulus, 0 gagal).

### C2. Push — `npx clasp push -f; echo "EXIT=$?"` → `EXIT=0`, menyebut `stok.*.gs` + `laporan.*.gs`.

### C3. Stok akurat (rung-3/harness: 20 masuk − 5 keluar + 0 koreksi = 15; flag tipis)
- **Given** item sak stok 15 & batasStokMin 20, **When** `getStok()` → **Then** entri {stok:15, tipis:true, masukHariIni/keluarHariIni terisi}. `listMutasiStok({itemId})` berisi baris masuk+keluar terurut desc.

### C4. Opname (edge: selisih negatif + retry tercatat)
- **Given** stok catatan 15, **When** `doOpname({itemId, fisik:13, catatan:'susut'})` → **Then** baris OPN {fisik:13, sistem:15, selisih:-2, koreksiStok:-2}; `getStok()` kini 13. **When** diulang fisik sama → **Then** baris OPN kedua tercatat (by design, bukan idempoten), stok tetap 13.

### C5. Batas stok — `setBatasStok({itemId, batas:10})` → `getStok()` flag tipis=false untuk stok 13; batas negatif → error `BATAS_TIDAK_VALID`.

### C6. Kas periode — skenario: belanja tunai 3.000.000 + bayar hutang 875.000 + terima piutang 875.000 → `getLaporanKas()` = {masuk:875000, keluar:3875000, saldo:-3000000} (paste JSON).

### C7. Margin periode — 2 pengiriman margin 200.000 + 140.000 → `getMargin()` = {total:340000, jumlahPengiriman:2, perItem cocok} (paste JSON).

## Output Demonstrasi
1. JSON `getStok()` + flag tipis; 2. baris OPN di tab Opname; 3. JSON kas & margin; 4. check hijau + push exit 0.

## Sprint Boundary (TIDAK dites)
Dashboard/auto-refresh, UI Stitch, arsip/backup/deploy produksi, konversi satuan.



<!-- ======== HANDOFF-PROMPT.MD ======== -->


# HANDOFF PROMPT — Sprint 003: Stok, Opname & Laporan — DRAFT (menunggu persetujuan pemilik)

Anda adalah BUILDER. Sprint 003.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` 2. `STATE.MD` (Sprint 002 SELESAI, deploy dev live) 3. `DECISIONS.MD` 4. `CONSTRAINTS.MD`
5. `planning/sprints/sprint-003/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD`
6. Referensi: `docs/DATA-MODEL.MD` (§2 Opname, §5 turunan), `planning/MODULE-PLAN.MD` (M5–M6), `src/modules/pengiriman.server.gs` (pola guard/lock/log), `src/modules/piutang.logic.gs` (pola logic+guard module)

### Bootstrap (JALANKAN SEBELUM APA PUN)
```bash
node -v                                   # expect v20+
npm install                               # 6 devDep exact, tanpa penambahan
npm run check                             # sanity hijau (expect EXIT=0, 22 test)
npx clasp list                            # bila auth error → minta user `npx clasp login`
npx clasp push -f                         # expect exit 0 (C2)
# Rung-3 editor script 1vcM: tutup SEMUA tab & buka ulang tiap habis push; bila `clasp run` NOT_FOUND → harness in-process pola 001/002 (src asli + shim, di luar src/tests, hapus setelah run).
```
Gagal di langkah mana pun: HENTIKAN, lapor error exact, JANGAN menebak.

### Aturan kerja
1. **DRY RUN DULU**: laporkan (a) file dibuat/diubah, (b) urutan T5.1→T6.2, (c) dependensi exact, (d) risiko, (e) titik butuh user.
2. **TUNGGU** "Approved. Mulai coding." sebelum tulis kode.
3. Berurutan; tiap task selesai hanya jika DoD hijau (output asli ditempel).
4. Logic murni WAJIB `.logic.gs`; baris DSA persis BLUEPRINT sebelum implementasi hot-path.
5. Selesai: ACCEPTANCE C1–C7 + minta `/acceptance-runner` (konteks segar).

### JANGAN
- JANGAN coding sebelum dry run disetujui; JANGAN ubah requirements/kriteria/skema tab
- JANGAN tambah lib (runtime NOL); JANGAN ubah versi pin tanpa DECISIONS.MD
- JANGAN sentuh file Sprint 001–002 kecuali `eslint.config.js` (globals); JANGAN fitur 004–005; JANGAN konversi satuan
- JANGAN commit/print `.clasprc.json`, `.clasp.json`, OWNER_EMAIL; JANGAN klaim selesai tanpa output perintah

### SETUJU (pasca-persetujuan dry run)
- T5.1 → T6.2 (logic + gas-fakes dulu, baru rung-3); protokol sinkron editor tiap push.

