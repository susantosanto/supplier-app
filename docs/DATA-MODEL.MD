# MODEL DATA (Entity Model — Google Sheets sebagai database)

Tanggal: 2026-10-10 | Sumber: /entity-modeler dari PRD §4 + stack docs/ARCHITECTURE.MD
Adaptasi: Sheets ARE the database (panduan /google-apps-script) — skema = tab + kolom + tipe + konvensi header.

## 0. Delta dari PRD §4
PRD §4 punya 9 entitas. Model ini menambah 2 tab sesuai panduan skill GAS (Config & Log) → **11 tab**:
- `Config` — pengganti "magic constants" (default tempo 14 hari, ambang stok global, refresh interval)
- `Log` — audit trail setiap tulisan (siapa/kapan/operasi), selain baris transaksi
Tidak ada entitas dihapus. Seluruh turunan (stok, kas, sisa piutang) tetap dihitung dari baris transaksi.

## 1. Konvensi Umum (wajib)

- 1 spreadsheet; 1 tab = 1 entitas; **baris 1 = header, dibekukan (freeze)**
- ID = kolom eksplisit, UUID `Utilities.getUuid()` + prefix, **tidak pernah posisional**:
  `TK-` Toko, `SPPG-`, `ITM-`, `BLI-` Pembelian, `JBL-` Pengiriman, `PBY-` PembayaranBeli, `PYJ-` PembayaranJual, `OPN-` Opname, `LOG-`
- Tanggal: `Date` asli Sheets (tz manifest `Asia/Jakarta`), tampil `yyyy-MM-dd`; uang: angka polos (tanpa format mata uang di sel, format hanya tampilan)
- Tanpa sel merge; tanpa baris kosong di tengah data
- Satu penulis (owner via aplikasi); owner TIDAK mengetik langsung di tab transaksi (risiko merusak turunan) — tab master boleh diedit manual
- Semua baca = batch `getRange().getValues()` (1x per tab per request), semua tulis batch + `SpreadsheetApp.flush()` sebelum return
- Tulis yang membaca-modifikasi-menulis (bayarPiutang, opname, createPengiriman) wajib `LockService.getScriptLock()` (try/finally)

## 2. Skema per Tab

### Config (1 baris, diparse sebagai peta)
| Kolom | Tipe | Required | Catatan |
|---|---|---|---|
| key | string | Ya | kunci unik, mis. `TEMPO_DEFAULT_HARI` |
| value | string | Ya | |
| keterangan | string | Tidak | dokumentasi pemilik |

Isi awal: `TEMPO_DEFAULT_HARI=14`, `REFRESH_DETIK=60`, `ARSIP_BARIS=20000`, `ZONA=Asia/Jakarta`.

### Toko
| Kolom | Tipe | Required | Validasi |
|---|---|---|---|
| id | string (TK-uuid) | Ya | unique |
| nama | string(100) | Ya | unique case-insensitive |
| kontak | string(30) | Tidak | |
| aktif | boolean | Ya | default TRUE; arsip = aktif FALSE (soft delete) |
| tempoHari | number | Tidak | kosong = ikut `TEMPO_DEFAULT_HARI` |
| catatan | string | Tidak | |
| createdAt / updatedAt | Date | Ya | diisi kode |

### SPPG
Identik pola Toko (`SPPG-`), plus:
| Kolom | Tipe | Required | Catatan |
|---|---|---|---|
| tempoHari | number | Ya | default 14; menentukan jatuh tempo tiap pengiriman |

### Item
| Kolom | Tipe | Required | Validasi |
|---|---|---|---|
| id | string (ITM-uuid) | Ya | unique |
| nama | string(100) | Ya | mis. "Beras Pandan Wangi", "Minyak Goreng 1L" |
| satuanDasar | string(10) | Ya | `sak` \| `kg` \| `liter` (dropdown) |
| isiPerSakKg | number | Tidak | hanya item sak; 25 default |
| batasStokMin | number | Ya | pemicu peringatan stok tipis |
| hargaBeliTerakhir | number | Tidak | cache; bukan sumber kebenaran |
| hargaJualTerakhir | number | Tidak | cache |
| aktif | boolean | Ya | soft delete |
| createdAt / updatedAt | Date | Ya | |

### Pembelian
| Kolom | Tipe | Required | Validasi |
|---|---|---|---|
| id | string (BLI-uuid) | Ya | |
| tanggal | Date | Ya | server-side `new Date()` |
| tokoId | string | Ya | FK → Toko.id, dicek kode |
| itemId | string | Ya | FK → Item.id |
| qty | number | Ya | > 0 |
| satuan | string | Ya | sama dengan satuanDasar item |
| hargaBeli | number | Ya | > 0; harga aktual per transaksi |
| total | number | Ya | qty × hargaBeli (disimpan, bukan dihitung ulang) |
| metode | string | Ya | `tunai` \| `tempo` |
| jatuhTempo | Date | Tidak | wajib bila tempo = tanggal + tempoHari toko |
| statusBayar | string | Ya | `belum` \| `sebagian` \| `lunas` (diupdate kode) |
| createdBy/createdAt | string/Date | Ya | |

### PembayaranBeli (bayar hutang ke toko)
| Kolom | Tipe | Required |
|---|---|---|
| id | string (PBY-uuid) | Ya |
| pembelianId | string | Ya (FK; bayar per faktur — toko tempoenya per belanja) |
| tanggal | Date | Ya |
| jumlah | number | Ya (> 0, ≤ sisa) |
| createdAt | Date | Ya |

### Pengiriman
| Kolom | Tipe | Required | Validasi |
|---|---|---|---|
| id | string (JBL-uuid) | Ya | |
| tanggal | Date | Ya | server-side |
| sppgId | string | Ya | FK → SPPG.id |
| itemId | string | Ya | FK → Item.id |
| qty | number | Ya | > 0 (satuan item) |
| satuan | string | Ya | |
| hargaJual | number | Ya | > 0 |
| total | number | Ya | qty × hargaJual |
| hargaBeliPakai | number | Ya | snapshot HPP (metode rata-rata terakhir, lihat §5) |
| margin | number | Ya | total − qty × hargaBeliPakai (disimpan) |
| catatanOverride | string | Tidak | diisi bila stok kurang tapi tetap kirim |
| createdAt | Date | Ya | |

### PiutangBaris (1 baris = 1 faktur tagih ke SPPG; auto dari Pengiriman)
| Kolom | Tipe | Required | Catatan |
|---|---|---|---|
| id | string (PTB-uuid) | Ya | |
| pengirimanId | string | Ya | unique FK → Pengiriman.id |
| sppgId | string | Ya | denormalisasi untuk aging per SPPG |
| tanggal | Date | Ya | = tanggal pengiriman |
| jatuhTempo | Date | Ya | tanggal + SPPG.tempoHari |
| nominal | number | Ya | = total pengiriman |
| sisa | number | Ya | diperbarui saat `bayarPiutang` (FIFO) |
| status | string | Ya | `terbuka` \| `sebagian` \| `lunas` |

### PembayaranJual (terima uang dari SPPG)
| Kolom | Tipe | Required | Catatan |
|---|---|---|---|
| id | string (PYJ-uuid) | Ya | |
| sppgId | string | Ya | |
| tanggal | Date | Ya | |
| jumlah | number | Ya | > 0 |
| alokasi | string (JSON) | Ya | `{"PTB-xx":1200000,...}` alokasi FIFO-otomatis; bisa diedit kode |
| createdAt | Date | Ya | |

### Opname
| Kolom | Tipe | Required |
|---|---|---|
| id | string (OPN-uuid) | Ya |
| tanggal | Date | Ya |
| itemId | string | Ya |
| fisik | number | Ya (≥ 0) |
| sistem | number | Ya (snapshot saat opname) |
| selisih | number | Ya (fisik − sistem) |
| koreksiStok | number | Ya (selisih diterapkan sebagai mutasi koreksi) |
| catatan | string | Tidak |
| createdAt | Date | Ya |

### Log (audit; append-only)
| Kolom | Tipe | Catatan |
|---|---|---|
| id | string (LOG-uuid) | |
| waktu | Date | |
| aktor | string | `Session.getActiveUser()` / "owner" |
| operasi | string | `createPembelian`, `bayarPiutang`, `opname`, dst. |
| refId | string | id entitas terkait |
| ringkas | string | ringkasan payload (tanpa data sensitif) |

## 3. Relationship Map

```
Toko 1──N Pembelian N──1 Item
              │ 1
              ▼ N
        PembayaranBeli

SPPG 1──N Pengiriman N──1 Item
   │            │ 1
   │            ▼ 1
   │       PiutangBaris (sisa, status)
   ▼ N
PembayaranJual ──alokasi──▶ PiutangBaris (FIFO)

Item 1──N Opname
Config, Log ── standalone
```
1:N semua relasi; tidak ada N:M (item berulang = baris baru). FK = kolom `*Id`, divalidasi kode (bukan validasi Sheets, agar pesan error bagus di UI).

## 4. Strategi "Index" (Sheets: baca batch + map in-memory)

| Pola | Sumber | Akses |
|---|---|---|
| Lookup by id | semua tab master | 1 `getValues()` per tab → `Map(id→row)` |
| Aging per SPPG | PiutangBaris | filter in-memory `status≠lunas`, bucket umur |
| Stok per item | Pembelian + Pengiriman (+Opname) | Σ per itemId in-memory |
| Riwayat per SPPG/tanggal | Pengiriman | sort in-memory; tampilan default tab di-sort kolom `tanggal` desc |
| FIFO alokasi | PiutangBaris | sort by `jatuhTempo`/`tanggal` asc in-memory |

Aturan: jangan pernah `getValue()` per sel; ukuran wajar <20k baris/tab (batch read ~1–2 detik). Bila lintasan lambat → CacheService 60 dtk untuk `getDashboard` (TTL ≤ REFRESH_DETIK).

## 5. Turunan & Invariant (dijaga kode, bukan rumus sel)

- `stok(item)` = ΣPembelian.qty − ΣPengiriman.qty + ΣOpname.koreksiStok
- `kas` = ΣPembelian(tunai).total + ΣPembayaranJual.jumlah − ΣPembayaranBeli.jumlah
- `PiutangBaris.sisa` disimpan & diperbarui transaksional di `bayarPiutang` (LockService); diverifikasi ulang fungsi `auditPiutang()` bila selisih
- HPP rata-rata: `hargaBeliPakai` = rata-rata berbobot hargaBeli item (snapshot saat kirim; margin terekam permanen walau harga berubah)
- Invariant: `total = qty × harga`, `margin = total − qty × hargaBeliPakai` — dicek server-side sebelum tulis
- Hard delete dilarang; koreksi = baris Opname/koreksi baru (audit trail BGN)

## 6. Migration / Initialization Plan

1. **Phase 1 — bootstrap**: skrip `initSpreadsheet()` membuat 11 tab + header + freeze + dropdown validasi (satuan, metode, aktif) + protect header; tulis baris Config awal
2. **Phase 2 — seed**: form master (tambah Toko/SPPG/Item via aplikasi)
3. **Phase 3 — verifikasi**: skrip `auditStok()` & `auditPiutang()` hitung ulang vs disimpan; harus 0 selisih
4. **Rollback**: dev = hapus spreadsheet, jalankan ulang `initSpreadsheet()` (idempotent: deteksi tab ada); prod = tab arsip belum pernah ada → aman; data = backup Drive mingguan (trigger, ARCHITECTURE §5)
5. **Arsip**: trigger harian pindahkan baris < (hari ini − ARSIP_BARIS-waktu) dari tab transaksi ke tab `*_ARSIP` bila suatu tab melewati 20.000 baris (pola bottom-up dari skill GAS)

## 7. Query Patterns (5 teratas)

- **Q1 Dashboard**: `getDashboard()` → batch baca PiutangBaris + Item + Config; Σ stok/aging in-memory. Target <2 dtk @ <20k baris.
- **Q2 Aging per SPPG**: filter PiutangBaris `sisa>0`, bucket 0–7/8–30/>30 by `tanggal` vs hari ini.
- **Q3 Stok**: Σ 3 tab per itemId; peringatan bila < `batasStokMin`.
- **Q4 Kas & margin periode**: filter 4 tab by tanggal range; Σ. Tanpa `SELECT *` analog — baca hanya kolom yang dipakai (`getRange` kolom spesifik).
- **Q5 bayarPiutang (tulis)**: LockService → baca PiutangBaris + buat baris PembayaranJual → alokasi FIFO → tulis ulang kolom `sisa/status` batch → Log → flush.

## 8. Self-Review Checklist
- [x] Semua entitas PRD §4 punya skema (+Config, Log = delta terdokumentasi §0)
- [x] Relasi = FK kolom `*Id`, dicek kode
- [x] Pola query utama tercakup (§7) dengan pola akses batch
- [x] Kolom dibaca ditentukan, tidak ada read-all-but-col sembarangan
- [x] Keputusan ID eksplisit: UUID+prefix (bukan auto-increment)
- [x] createdAt/updatedAt pada semua entitas; Log append-only
- [x] Soft delete (`aktif=FALSE`); hard delete dilarang
- [x] Migration + rollback ada (§6)
