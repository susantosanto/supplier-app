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
