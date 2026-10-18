# ARSITEKTUR & TECH STACK

Tanggal: 2026-10-10 | Sumber: /tech-stack-advisor dari planning/PRD.MD
Kunci user: Google Apps Script + Sheets, akun Google gratis, HP+desktop, produksi secepat mungkin.

## 1. Requirements (ekstraksi dari PRD)

- Performance: dashboard <3 detik (4G), operasi <2 detik p95, auto-refresh ≤60 detik
- Scale: 1 user; 3–8 SPPG + banyak toko; ±50–100 baris transaksi/hari; arsip bila >20.000 baris
- Security: hanya akun Google owner; HTTPS; validasi server-side; tanpa rahasia di kode
- Team: owner non-teknis; builder AI; timeline ASAP (MVP 1–2 sprint)
- Integrasi: kanal pesan WhatsApp manual (di luar app); PDF invoice = Phase 2
- Deployment: infrastruktur Google, biaya Rp0

## 2. Recommendation Matrix (per lapisan: 1 utama + 1 alternatif)

## Frontend
| Choice | Why | Trade-off |
|---|---|---|
| HtmlService SPA (HTML/CSS/JS disajikan Apps Script, desain dari output Stitch) | Satu deployment, HTTPS gratis, responsif HP+desktop, sesuai keputusan Stitch-first | Tanpa framework build; kuasa CSS manual; batas ekosistem |
| Alternative: AppSheet | No-code, cepat | UI generik/terkunci, biaya langganan, gagal target "premium anti-slop" |

## Backend
| Choice | Why | Trade-off |
|---|---|---|
| Google Apps Script (V8), server functions dipanggil via google.script.run | Sudah diputuskan user; gratis; eksekusi sebagai owner; tanpa server/provisioning | Kuota (6 menit/exec, 30 exec paralel), latensi detik, bukan untuk komputasi berat |
| Alternative: Cloudflare Workers + D1 | Performa & struktur data lebih baik | Butuh hosting/akun terpisah, biaya & kompleksitas naik, di luar constraint user |

## Database
| Choice | Why | Trade-off |
|---|---|---|
| Google Sheets — 1 spreadsheet, 1 tab per entitas (9 tabel di PRD §4) | Gratis; owner bisa inspeksi manual; backup/review mudah; tim kecil 1 penulis → tanpa konflik | Bukan SQL: konsistensi dijaga kode; limit sel/ukuran; scan baris = O(n) |
| Alternative: Cloud SQL / Supabase | Relasi & ACID penuh | Biaya, akun kartu,运维 ekstra — tidak sepadan untuk 1 user |

## Auth
| Choice | Why | Trade-off |
|---|---|---|
| Deploy web app "Execute as: Me" + "Who has access: Only myself" (Session.getActiveUser) | Nol kode; HTTPS dari Google; sesuai US-11 | Tidak bisa multi-user tanpa redesain; lupa set = app tidak terbuka |
| Alternative: login email+password custom | Bisa multi-user | Risiko keamanan sendiri, tanpa nilai untuk 1 user |

## Hosting
| Choice | Why | Trade-off |
|---|---|---|
| Apps Script Web App deployment (infra Google, `script.google.com`) | Gratis, otomatis HTTPS, A2HS di Android | Vendor lock-in penuh ke Google |
| Alternative: domain sendiri via reverse-proxy | Branding | Tidak didukung resmi; rawan melanggar ToS |

## Dev workflow
| Choice | Why | Trade-off |
|---|---|---|
| clasp (kode lokal di repo `src/`, push ke Apps Script) + git | Version control nyata, diff review, builder AI bisa kerja lokal | Butuh setup sekali (akun, OAuth) |
| Alternative: editor bawaan script.google.com | Tanpa setup | Tanpa git/diff; jejak kerja AI sulit direview |

## 3. Architecture Diagram

```
┌───────────────────┐   ┌──────────────────────┐
│ HP owner (Android)│   │ Laptop owner         │   Desain UI (source of truth visual):
│ Chrome, A2HS      │   │ Browser              │   ┌──────────────┐
└─────────┬─────────┘   └──────────┬───────────┘   │ Stitch       │
          │                        │               │ (DESIGN.md/  │
          └────────────┬───────────┘               │  screens)    │
                       ▼                           └──────┬───────┘
        ┌─────────────────────────────────┐               │ implementasi
        │ Apps Script Web App (HtmlService)│◀──────────────┘
        │ SPA: auto-refresh ≤60s           │
        └───────────────┬─────────────────┘
                        │ google.script.run (JSON)
                        ▼
        ┌─────────────────────────────────┐
        │ Server functions (V8, execute   │
        │ as owner, validasi input)       │
        │ getDashboard, createPengiriman, │
        │ bayarPiutang, getLaporanKas, …  │
        └───────────────┬─────────────────┘
                        ▼
        ┌─────────────────────────────────┐
        │ Google Sheets (1 spreadsheet)   │
        │ 9 tab: Toko, SPPG, Item,        │
        │ Pembelian, PembayaranBeli,      │
        │ Pengiriman, PembayaranJual,     │
        │ PiutangBaris, Opname            │
        └─────────────────────────────────┘

 Dev: lokal (clasp + git) ──clasp push──▶ Apps Script ──deploy──▶ Web App
```

## 4. Decision Log

### D1: Frontend = HtmlService SPA + desain Stitch
- **Date**: 2026-10-10
- **Decision**: SPA HtmlService (HTML/CSS/JS manual), mengimplementasi hasil desain Stitch
- **Rationale**: Satu platform deploy; target premium anti-slop dikejar lewat desain Stitch dulu (DECISIONS.MD 2026-10-10)
- **Alternatives considered**: AppSheet (ditolak: UI generik, biaya)
- **Revisit if**: kebutuhan UI melampaui yang bisa dicapai HTML/CSS di HtmlService

### D2: Backend = Apps Script V8
- **Date**: 2026-10-10
- **Decision**: Semua logika server sebagai fungsi Apps Script, dipanggil via google.script.run
- **Rationale**: Constraint user (gratis, tanpa server); kuota cukup untuk 1 user
- **Alternatives considered**: Cloudflare Workers + D1 (ditolak: di luar constraint & biaya)
- **Revisit if**: data > batas Sheets atau butuh >30 eksekusi paralel

### D3: Database = Google Sheets (9 tab)
- **Date**: 2026-10-10
- **Decision**: 1 spreadsheet, 1 tab per entitas PRD §4; stok/kas/piutang = turunan kode, bukan angka manual
- **Rationale**: Gratis, transparan untuk owner, audit manual mudah; 1 penulis → tanpa lock contention
- **Alternatives considered**: Cloud SQL/Supabase (ditolak: biaya+运维 untuk 1 user)
- **Revisit if**: >20.000 baris aktif per bulan (mulai arsip) atau >500.000 baris total (migrasi)

### D4: Auth = deploy "Execute as Me, Only myself"
- **Date**: 2026-10-10
- **Decision**: Keterbatasan akses tingkat deployment; Session.getActiveUser diverifikasi di tiap fungsi
- **Rationale**: US-11; nol kode; keamanan Google-native
- **Alternatives considered**: login custom (ditolak: risiko, tidak perlu)
- **Revisit if**: staf harus memakai aplikasi (butuh redesain multi-user)

### D5: Dev workflow = clasp + git
- **Date**: 2026-10-10
- **Decision**: Kode Apps Script hidup di repo ini (`src/`), dipush via clasp; deploy via clasp
- **Rationale**: Builder AI bekerja lokal dengan diff & test; jejak perubahan jelas
- **Alternatives considered**: editor bawaan (ditolak: tanpa version control)
- **Revisit if**: (tidak direncanakan)

## 5. Risk Assessment

| Technology | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Apps Script | Kuota eksekusi/6 menit, 30 paralel | Rendah (1 user) | Sedang | Operasi ringan O(n) kecil; batch write; backoff |
| Apps Script | Latensi eksekusi dingin (2–5 detik) | Tinggi | Rendah | Hitung ulang hanya data berubah; auto-refresh 60s; UI optimistis |
| Sheets | Batas sel 10 juta & ukuran file | Rendah | Tinggi | Arsip bulanan >20k baris (D3); monitor ukuran |
| Sheets | Konsistensi tanpa transaksi DB | Sedang | Tinggi | Satu penulis; semua turunan dihitung dari baris transaksi; opname sebagai jaring pengaman |
| Google | Akun/layanan down atau kebijakan berubah | Rendah | Tinggi | Export rutin spreadsheet ke Drive mingguan (skrip trigger); jalur migrasi ke SQL (D3 revisit) |
| Deployment | Lupa "Only myself" → data keuangan terbuka | Rendah | Kritis | Checklist acceptance US-11 wajib lulus sebelum produksi |
| Workflow | clasp/OAuth setup gagal di mesin builder | Sedang | Rendah | Fallback: editor bawaan untuk setup awal, migrasi ke clasp setelah jalan |

## 6. Migration Path (jika skala naik)
Sheets → PostgreSQL/Cloud SQL: schema PRD §4 peta langsung ke tabel SQL; kode fungsi server dipindah apa adanya (logika terpisah I/O). Estimasi: 1 sprint.

## 7. Self-Review Checklist
- [x] Setiap requirement PRD punya pilihan teknologi (performance→latensi dikelola; scale→arsip; security→D4; team→D1/D5; deployment→D5)
- [x] Setiap choice punya rationale eksplisit
- [x] Setiap choice punya alternatif yang dipertimbangkan
- [x] Trade-off jujur (kuota, latensi, lock-in, konsistensi ditulis)
- [x] Diagram arsitektur mencakup semua komponen
- [x] Decision log lengkap (D1–D5)
