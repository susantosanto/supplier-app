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
