# RISKS.MD — Daftar Risiko

## Format
⚠️ [Kemungkinan: Tinggi/Sedang/Rendah] RISIKO: <deskripsi>
  Dampak: <Tinggi/Sedang/Rendah>
  Mitigasi: <solusi>

## Daftar Risiko

⚠️ [Sedang] RISIKO: FIFO alokasi bayar piutang salah → sisa piutang meleset (T4.1)
  Dampak: Tinggi — tagihan SPPG salah, audit BGN gagal
  Mitigasi: LockService + idempotency (keyed by PYJ id) + `auditPiutang()`

⚠️ [Sedang] RISIKO: Pembayaran dobel saat retry (T4.3/T3.3)
  Dampak: Tinggi — kas & piutang double-count
  Mitigasi: Alokasi keyed by id pembayaran (PBY/PYJ); cek sudah dialokasi → return tanpa dobel

⚠️ [Sedang] RISIKO: Stok minus / double-write saat pengiriman (T3.2/T4.2)
  Dampak: Sedang — stok fisik vs catatan tidak cocok
  Mitigasi: Cek stok dalam lock; override wajib `catatanOverride` tercatat di Log

⚠️ [Sedang] RISIKO: `clasp login` interaktif gagal di mesin builder (T1.1)
  Dampak: Tinggi — sprint 001 mandek di bootstrap
  Mitigasi: User jalankan sekali; fallback: setup via editor online → `clasp clone` (risiko tercatat ARCHITECTURE §5)

⚠️ [Sedang] RISIKO: Output Stitch belum ada → UI mandek (T8.x / sprint 004)
  Dampak: Sedang — hanya menghambat M8, bukan M1–M7
  Mitigasi: Gate eksplisit T8.0; logika non-UI tetap jalan paralel

⚠️ [Rendah] RISIKO: Latensi cold start GAS terasa di HP (T7.1)
  Dampak: Sedang — UX terasa lambat saat dibuka
  Mitigasi: CacheService 60 detik + indikator data-per-waktu di UI

⚠️ [Rendah] RISIKO: Kuota eksekusi 6 menit Apps Script
  Dampak: Sedang — task besar gagal tengah jalan
  Mitigasi: Task >5k baris di-chunk (pola cursor GAS skill); sprint 001 <5k baris

⚠️ [Rendah] RISIKO: Advisori `braces` DoS (GHSA-vfj7-8cjw-p6xm) via @google/clasp -> micromatch (devDependency build tool)
  Dampak: Rendah — ada di toolchain push lokal (clasp 3.4.1), BUKAN runtime; aplikasi GAS ship 0 npm runtime dependency, kode rentan tak masuk produksi; tak ada input attacker menuju ekspansi glob clasp
  Mitigasi: Dicatat docs/SECURITY-AUDIT-001.md (gate CLEAN). Fix resmi = downgrade clasp 3.4.1->2.5.0 (breaking, langgar pin BLUEPRINT) — TIDAK diambil sprint ini. Jadwalkan: upgrade clasp major / pasang osv-scanner di sprint deploy (005)

⚠️ [Rendah] RISIKO: Belum ada secret scanner otomatis (gitleaks/trufflehog) di toolchain
  Dampak: Rendah — sprint 001 scan rahasia masih MANUAL (git grep pattern) dan bersih; tanpa gate otomatis rahasia bisa lolos di sprint besar
  Mitigasi: Tambah gitleaks pre-commit + osv/semgrep di CI saat sprint deploy (005); sementara: git grep manual sebelum commit

⚠️ [Rendah] RISIKO: Kode Sprint 002+003+004 (+pack+laporan) belum dikomit — hanya ada lokal + GAS
  Dampak: Tinggi — git hanya merekam s/d Sprint 001 (b1ddc52); kehilangan/korupsi lokal = kerja 3 sprint hilang (GAS remote bukan version control)
  Mitigasi: Minta perintah commit eksplisit ke pemilik (AGENTS.MD); setelah commit catat hash di STATE.MD (menggantikan entri 002+003 — diperbarui, bukan dihapus)

⚠️ [Rendah] RISIKO: Duplikasi agregat stok (`stokSemua_` vs `stokItem_`) divergen di masa depan
  Dampak: Sedang — stok tampil beda antar fungsi bila formula diubah di satu tempat
  Mitigasi: Disengaja Sprint 003 (nol regresi); unifikasi + test silang di Sprint 005 (DECISIONS.MD 2026-10-15)

⚠️ [Rendah] RISIKO: Satuan campur (sak vs kg) tanpa konversi
  Dampak: Rendah — server menolak satuan ≠ satuanDasar (`SATUAN_TIDAK_COCOK`); stok selalu dalam satuanDasar
  Mitigasi: UI Sprint 004 kunci pilihan satuan ke satuanDasar item; konversi antar-satuan tetap out-of-scope

⚠️ [Sedang] RISIKO: Klien web (index.html) belum diuji di perangkat owner — hanya cek statis + harness server
  Dampak: Rendah — validasi + guard tetap di server (klien rusak tak merusak data); error tampil di banner
  Mitigasi: Cek statis D3/D5/D6 lolos (syntax, 14/14 nama, 0 URL eksternal); daftar uji perangkat di STATE.MD Langkah 1; perbaiki temuan sebagai rework 004

[Sprint 006] [Tinggi] RISIKO: Lock screen `admin`/`admin` disalahartikan sebagai keamanan - pemilik mengira data sudah terlindungi oleh layar login
  Dampak: Tinggi - data keuangan sekolah terbuka bila link web app dibagikan; sumar "sudah ada password"
  Mitigasi: (1) FAKTA terverifikasi: semua fungsi server memanggil `guardOwner_()` fail-closed (`server.gs:2`), jadi gate tidak menambah dan tidak mengurangi keamanan; (2) teks jujur di gate "Kunci tampilan, bukan pengaman data"; (3) pemilik WAJIB cek manual "Who has access = Only myself" (ACCEPTANCE E29) karena CLI tak bisa membacanya; (4) tercatat di DECISIONS.MD + Exception CONSTRAINTS EXC-006-01 dengan masa kedaluwarsa

[Sprint 006] [Sedang] RISIKO: Aturan "Who has access" pada deployment `AKfycbw09...` belum terverifikasi pihak builder
  Dampak: Tinggi bila ternyata "Anyone with the link" - data terbuka tanpa akun owner
  Mitigasi: Dispatcher `api()` + `guardOwner_()` tetap menolak anonim (AKSES_DITOLAK); verifikasi manual pemilik jadi syarat tutup sprint (E29); bila tidak "Only myself" - laporkan sebagai temuan US-11, jangan diamkan

[Sprint 006] [Sedang] RISIKO: Pemecahan `init()`/`lanjutInit_()` merusak 9 rute (regresi seperti hotfix `}` yatim 2026-10-15)
  Dampak: Tinggi - aplikasi mati total di HP pemilik
  Mitigasi: Isi `lanjutInit_()` dipindah VERBATIM; `node --check` ekstrak klien; test L21 (audit struktural `init()` tidak memanggil `tampil()`); `npm run check`; uji browser 9 rute + 0 error console (E13/E15)

[Sprint 006] [Rendah] RISIKO: `localStorage` `mbg-auth-v1` rusak/kedaluwarsa - pengguna terkunci permanen
  Dampak: Rendah - owner menghapus storage atau 7 hari habis = masukkan ulang `admin`/`admin` (memang dikenzhen)
  Mitigasi: try/catch + validasi `u`/`exp`, token dibuang saat tidak valid (R2.4); tombol Keluar selalu tersedia di Profil

[Sprint 006] [Rendah] RISIKO: 28+ path uncommitted Sprint 002-005 ikut tersentuh saat Sprint 006 dikerjakan
  Dampak: Sedang - `git checkout/stash` menghapus kode yang sudah live
  Mitigasi: Larangan eksplisit di HANDOFF-PROPMPT; hanya 4 file yang boleh diedit; `git diff --stat` file `.gs` wajib kosong (E25); tanpa commit tanpa perintah pemilik

[Sprint 006] [Tinggi] RISIKO: Layar login tanpa penanda "bukan pengaman data" (teks gate dihapus atas perintah pemilik 2026-10-18)
  Dampak: Tinggi - pengunjung/teknisi lain bisa menyimpulkan ada proteksi password padahal pengaman sebenarnya tetap guardOwner_() + aturan "Who has access = Only myself"
  Mitigasi: (1) fakta tetap tertulis di DECISIONS.MD, CONSTRAINTS EXC-006-01, dan VERIFICATION-REPORT (bukan hanya di UI); (2) penjelasan masih ada di kartu "Sesi & keamanan" di halaman Profil; (3) jalur benar tetap: verifikasi manual "Who has access = Only myself" (E29); (4) bila nanti berubah pikiran, teks 1 kalimat bisa dikembalikan tanpa mengubah kode lain
