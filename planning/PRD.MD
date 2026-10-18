# PRD — Aplikasi Supplier Beras & Minyak untuk SPPG MBG

Tanggal: 2026-10-10 | Sumber: Idea Brief (idea-clarifier, dikonfirmasi via "lanjut" + default)
Platform: Google Apps Script web app + Google Sheets | Pengguna tunggal: Owner

---

## 1. Users & Goals

- **Owner-supplier** (satu-satunya persona): membeli beras & minyak dari toko grosir (tunai/tempo), mengirim ke 3–8 dapur SPPG MBG (selalu tempo). Tujuan: tahu stok, kas, dan piutang secara akurat dan real-time dari HP; review laporan di laptop.
- Kanal pesan ke SPPG (WhatsApp/telepon) TIDAK digantikan — aplikasi mencatat pesanan & pengiriman.

## 2. User Stories

### US-1: Catat pembelian dari toko
As a owner, I want to record a purchase from a toko (tunai/tempo), so that stok bertambah dan kas keluar/hutang tercatat akurat.
Acceptance Criteria:
- [ ] Form: pilih/tambah toko, item (beras/minyak), qty + satuan, harga beli, metode (tunai/tempo), hari tempo bila tempo
- [ ] Simpan → stok item bertambah; tunai = kas keluar; tempo = hutang ke toko tercatat dengan jatuh tempo
- [ ] Repeat purchase cepat: toko & harga beli terakhir tersuguh (input <60 detik)
- [ ] Validasi: qty > 0, harga > 0, toko & item wajib; pesan error jelas

### US-2: Catat pengiriman ke SPPG → otomatis jadi piutang
As a owner, I want to record a delivery to an SPPG, so that piutang terbentuk otomatis tanpa pencatatan ganda.
Acceptance Criteria:
- [ ] Form: pilih SPPG, item, qty + satuan, harga jual
- [ ] Simpan → stok berkurang; piutang terbentuk dengan tanggal kirim + jatuh tempo (hari tempo per SPPG, default 14 hari)
- [ ] Margin terhitung otomatis = harga jual − harga beli rata-rata/inventori (metode konsisten, mis. average)
- [ ] Jika stok kurang: peringatan jelas + boleh lanjut dengan catatan (override)

### US-3: Lihat piutang & aging per SPPG (fitur #1)
As a owner, I want to see total piutang and its aging per SPPG, so that I know siapa yang harus ditagih dan sudah berapa hari.
Acceptance Criteria:
- [ ] Ringkasan: total piutang outstanding + tertua dalam 1 tampilan (tanpa navigasi)
- [ ] Rincian per SPPG: total, jumlah invoice terbuka, kelompok umur 0–7 / 8–30 / >30 hari
- [ ] Klik SPPG → daftar invoice terbuka (tanggal, nominal, umur)

### US-4: Catat penerimaan pembayaran SPPG
As a owner, I want to record payments from an SPPG (penuh/sebagian), so that piutang berkurang akurat.
Acceptance Criteria:
- [ ] Form: pilih SPPG, jumlah, tanggal → alokasi otomatis FIFO ke invoice terlama; bisa dialih manual ke invoice tertentu
- [ ] Status invoice: terbuka / sebagian / lunas terlihat jelas
- [ ] Pembayaran berkurang → kas masuk tercatat

### US-5: Pantau stok beras & minyak
As a owner, I want to see current stock of beras & minyak anytime, so that I know berapa yang harus dibeli.
Acceptance Criteria:
- [ ] Stok per item dalam satuan siap pakai (sak 25 kg / liter), plus mutasi masuk/keluar hari ini
- [ ] Riwayat mutasi bisa difilter per tanggal/item
- [ ] Stok selalu = hasil pembelian − pengiriman (tidak ada input manual stok kecuali opname)

### US-6: Peringatan stok tipis
As a owner, I want a low-stock warning, so that belanja terencana, bukan reaktif.
Acceptance Criteria:
- [ ] Ambang batas per item bisa diatur
- [ ] Peringatan tampil di dashboard saat stok < ambang

### US-7: Stok opname
As a owner, I want to record a physical stock count, so that selisih cepat terdeteksi sebelum jadi masalah audit.
Acceptance Criteria:
- [ ] Form opname: hitung fisik per item → sistem hitung selisih vs catatan
- [ ] Selisih tercatat permanen (tanggal, fisik, catatan, delta)
- [ ] Bila stok fisik > stok sistem, koreksi lewat mekanisme opname (bukan edit transaksi lama)

### US-8: Kas masuk-keluar & margin (laporan)
As a owner, I want daily cash in/out and realized margin, so that saya tahu untung riil dan kas tidak bolong.
Acceptance Criteria:
- [ ] Laporan periode (hari/minggu/bulan): kas keluar (belanja tunai, bayar hutang toko), kas masuk (terima piutang), saldo
- [ ] Margin per pengiriman & total periode, per item
- [ ] Angka konsisten dengan detail transaksi (bisa ditelusuri)

### US-9: Hutang ke toko (tempo)
As a owner, I want to track what I owe to toko tempo and record payments, so that hubungan dagang dengan toko tidak retak.
Acceptance Criteria:
- [ ] Daftar hutang per toko: terbuka, jatuh tempo, sudah dibayar sebagian/penuh
- [ ] Bayar toko → kas keluar + hutang berkurang

### US-10: Laporan real-time di HP & laptop
As a owner, I want the dashboard to auto-refresh, so that data yang terlihat selalu terkini tanpa reload manual.
Acceptance Criteria:
- [ ] Auto-refresh ≤1 menit; indikator "data per …" terlihat
- [ ] Mobile-first premium (layar 360–480 px, satu tangan) DAN desktop nyaman (tabel lebar) — mengikuti desain Stitch
- [ ] Waktu muat dashboard <3 detik pada koneksi 4G

### US-11: Akses terbatas ke owner
As a owner, I want the app accessible only by my Google account, so that data keuangan privat.
Acceptance Criteria:
- [ ] Web app di-deploy "Execute as owner, access: only myself" (atau setara: hanya email owner)
- [ ] Membuka dengan akun lain ditolak

### US-12: Riwayat pengiriman per SPPG (audit trail)
As a owner, I want delivery history per SPPG with berat/jenis/tanggal, so that sengketa atau audit BGN bisa dijawab dengan data.
Acceptance Criteria:
- [ ] Riwayat per SPPG: tanggal, item, qty, harga, total, status bayar
- [ ] Data tidak bisa dihapus; koreksi = transaksi penyesuaian

## 3. API Surface (Server functions via google.script.run)

Auth: semua fungsi butuh Session.getActiveUser = email owner (web app restricted).

| Function | Auth | Deskripsi | MVP/P2 |
|---|---|---|---|
| getDashboard() | Ya | Ringkasan: stok, total piutang + aging, kas hari ini, peringatan | MVP |
| createPembelian(payload) / listPembelian(filter) | Ya | US-1 | MVP |
| createPengiriman(payload) / listPengiriman(filter) | Ya | US-2, US-12 | MVP |
| getPiutang(sppgId?) | Ya | US-3 aging | MVP |
| bayarPiutang(payload) | Ya | US-4 alokasi FIFO | MVP |
| getStok() / listMutasiStok(filter) | Ya | US-5 | MVP |
| getBatasStok() / setBatasStok() | Ya | US-6 | MVP |
| doOpname(payload) / listOpname() | Ya | US-7 | MVP |
| getLaporanKas(period) / getMargin(period) | Ya | US-8 | MVP |
| getHutangToko() / bayarHutang(payload) | Ya | US-9 | MVP |
| getMaster() (toko, SPPG, item, harga terakhir) / saveMaster(data) | Ya | US-1, US-2 cepat | MVP |
| exportInvoicePdf(invoiceId) | Ya | PDF invoice/surat jalan | P2 |
| kirimPengingatWhatsApp(sppgId) | Ya | Pengingat tagih | P2 |

Contoh shape `createPengiriman`:
```json
{ "sppgId": "S01", "tanggal": "2026-10-10", "items": [
  { "itemId": "BERAS_PANDAN", "qty": 20, "satuan": "sak", "hargaJual": 320000 } ] }
→ { "ok": true, "ids": ["P-000123"], "piutangId": "PT-00045",
    "margin": { "BERAS_PANDAN": 3800000 }, "stokSisa": { "BERAS_PANDAN": 45 } }
```

## 4. Data Requirements (tabel Sheets)

| Entity | Key Fields | Relasi |
|---|---|---|
| Toko | id, nama, kontak, tempoHariDefault | has many Pembelian |
| SPPG | id, nama, kontak, tempoHariDefault (default 14) | has many Pengiriman |
| Item | id, nama, satuanDasar, isiPerSakKg, batasStokMin, hargaBeliTerakhir, hargaJualTerakhir | has many Pembelian/Pengiriman |
| Pembelian | id, tanggal, tokoId, itemId, qty, satuan, hargaBeli, total, metode, jatuhTempo | belongs Toko, many PembayaranBeli |
| PembayaranBeli | id, pembelianId, tanggal, jumlah | belongs Pembelian |
| Pengiriman | id, tanggal, sppgId, itemId, qty, satuan, hargaJual, total, hargaBeliPakai, margin | belongs SPPG |
| PembayaranJual | id, sppgId, tanggal, jumlah, alokasi (JSON invoice→jumlah) | belongs SPPG |
| PiutangBaris | id, pengirimanId, tanggal, jatuhTempo, nominal, sisa, status | derived dari Pengiriman |
| Opname | id, tanggal, itemId, fisik, sistem, selisih, catatan | belongs Item |

Aturan: stok = ΣPembelian − ΣPengiriman ± koreksiOpname; kas = tunai pembelian + pembayaran jual − pembayaran beli; arsip bulanan bila >20.000 baris.

## 5. Non-Functional Requirements

Performance:
- Dashboard muat <3 detik di 4G; fungsi operasi <2 detik p95 pada data normal
- Auto-refresh ≤60 detik; tanpa websocket (batas platform Apps Script)

Security:
- Web app: execute-as-owner, hanya email owner yang boleh akses; HTTPS dari Google
- Validasi input server-side (qty/harga > 0, ID valid, tanggal wajar)
- Tidak ada rahasia di kode; sheet tidak dibagikan ke siapa pun

Scalability/Reliability:
- Tulis batch, hindari rate-limit Apps Script; backoff saat kuota
- Satu penulis (owner) → tanpa konflik multi-writer; timestamp server-side
- Transaksi tersimpan permanen; koreksi = transaksi penyesuaian (audit trail)

Compliance/Bahasa:
- Field siap audit (tanggal, berat/jenis/tujuan/pihak) mengikuti ekspektasi dokumen SPPG/BGN
- UI berbahasa Indonesia

## 6. Success Metrics

| Kriteria Brief | Metrik | Target |
|---|---|---|
| Pengiriman tercatat <2 menit dari HP | Median selisih waktu kirim (estimasi owner) vs timestamp catat | <2 menit |
| Piutang + tertua dalam 1 langkah | Jumlah tap dari dashboard ke info tersebut | ≤1 tap |
| Stok akurat | Selisih opname fisik vs sistem | <1% |
| Margin otomatis | % pengiriman dengan margin terhitung | 100% |
| Laporan real-time | Selisih data vs waktu tampil (auto-refresh) | ≤1 menit |
| Dipakai penuh tanpa buku catatan | Transaksi harian tercatat lengkap | 100% transaksi aktif |

## 7. Out of Scope (JANGAN diimplementasikan)

> Items below are explicitly excluded. Do NOT implement them. If a user story implies an out-of-scope feature, remove or note it.

- Honor relawan / operasional dapur SPPG (urusan pihak SPPG)
- Pembukuan akuntansi penuh (jurnal, neraca)
- Multi-gudang / multi-cabang
- POS kasir & cetak struk
- Phase 2 (belum MVP): PDF invoice/surat jalan, pengingat WhatsApp otomatis, multi-user staf

## 8. Self-Review Checklist
- [x] Setiap user story punya acceptance criteria teruji
- [x] API surface mencakup semua story (US-1..12 → fungsi; tidak ada story yatim)
- [x] Data requirements mencakup semua entitas di story
- [x] NFR spesifik & terukur (angka, bukan "cepat")
- [x] Out-of-scope hadir & dihormati
- [x] Success metrics memetakan kriteria brief

## 9. Keputusan Desain yang Mengikat PRD ini
- Desain UI: Stitch dulu → builder implementasi (DECISIONS.MD 2026-10-10)
- Satuan default: beras sak 25 kg, minyak liter (revisable)
- Hari tempo: per SPPG, default 14 hari (revisable)
