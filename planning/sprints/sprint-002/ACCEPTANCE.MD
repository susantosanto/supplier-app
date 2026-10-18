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
