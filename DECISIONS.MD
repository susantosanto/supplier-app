# DECISIONS.MD — Log Keputusan

## Format
[YYYY-MM-DD] Keputusan: <apa>
  Status: proposed | accepted | superseded
  Alasan: <mengapa>
  Dibuat oleh: <siapa>
  Dampak: <apa yang berubah>

## Daftar Keputusan

[2026-10-15] Keputusan: Verifikasi rung-3 (A3–A8) dilakukan in-process — file `src/*.gs` yang sama dengan yang di-deploy dimuat ke runtime Node, lapisan layanan GAS (SpreadsheetApp/LockService/PropertiesService/Session/Utilities) disuntikkan sebagai shim in-memory
  Status: accepted
  Alasan: `clasp run` NOT_FOUND untuk proyek ini (API eksekusi tidak tersedia); verifikasi harus tetap berjalan PENUH di sesi acceptance-runner (Iron Law: tak ada klaim PASS tanpa bukti sesi ini). Shim hanya mem-fake boundary Google; logika aplikasi = kode asli yang di-push sehingga yang diuji = yang di-deploy (gap ReferenceError ronde-1 tak terulang)
  Dibuat oleh: acceptance-runner (Stage 6, konteks segar)
  Dampak: Harness sementara di luar `src/`/`tests/` (dihapus setelah run; `git status` bersih). Terbatas: sisi web (URL dev dibuka akun non-owner) tak teruji otomatis (butuh sesi browser kedua); jalur guardOwner_ terverifikasi in-process. Bukti: 26 asersi lulus EXIT=0

[2026-10-15] Keputusan: gate security sprint 001 = CLEAN; advisori `braces` DoS (via @google/clasp devDep) dicatat RENDAH/dev-only, TIDAK diturunkan clasp di sprint ini
  Status: accepted
  Alasan: `braces` ada di devDependency build tool (clasp), bukan runtime; app GAS ship 0 npm runtime dependency sehingga kode rentan tak masuk produksi; tak ada input attacker menuju glob clasp. Fix resmi = downgrade clasp 3.4.1->2.5.0 (breaking, langgar pin BLUEPRINT §Dependensi) — di luar scope auditor (tak ubah dependency atas inisiatif sendiri)
  Dibuat oleh: security-dependency-auditor (Bab 13, konteks segar)
  Dampak: 0 temuan KRITIS/TINGGI pada artifact ter-deploy (rahasia bersih, semua endpoint data guardOwner_, 17 validasi input, error tak bocorkan stack). Item terbuka dijadwalkan sprint deploy (005): pasang gitleaks + osv-scanner. Laporan: docs/SECURITY-AUDIT-001.md

[2026-10-11] Keputusan: Nama paket gas-fakes di BLUEPRINT dikoreksi menjadi @mcpher/gas-fakes@2.5.8 (scoped, nama tak-scoped tidak ada di npm)
  Status: accepted
  Alasan: `npm view gas-fakes` 404; hasil `npm search` menunjukkan paket resmi bermaintainer brucemcpherson di scope @mcpher versi 2.5.8; fungsi sama (runtime GAS di Node)
  Dibuat oleh: Builder (temuan T1.1)
  Dampak: 6 devDep terpin: @google/clasp 3.4.1, @mcpher/gas-fakes 2.5.8, eslint 10.12.0, eslint-plugin-googleappsscript 1.0.5, typescript 7.0.2, @types/google-apps-script 2.0.13

[2026-10-11] Keputusan: tsconfig checkJs=false untuk file .js GAS (typecheck hanya validasi .gs via allowJs tanpa check)
  Status: accepted
  Alasan: tsc strict menolak implicit-any di fungsi .js gaya GAS tanpa JSDoc di tiap param; menulis JSDoc per-param di semua fungsi menambah noise tanpa nilai; lint (no-undef) + test tetap menjaga kebenaran
  Dibuat oleh: Builder (temuan T1.1)
  Dampak: `npm run typecheck` valid; kebenaran tipe dijaga via test + review, bukan tsc pada .js

[2026-10-10] Keputusan: Desain UI dikerjakan dengan Stitch lebih dulu; builder (AI) mengimplementasi hasil design Stitch
  Status: accepted (sementara — keputusan bisa berubah kapan saja)
  Alasan: User ingin tampilan premium anti-AI-slop yang terdesain dulu, bukan langsung dikodekan; Stitch jadi sumber kebenaran desain
  Dibuat oleh: User
  Dampak: Alur kerja bertambah tahap desain Stitch sebelum implementasi UI; hasil Stitch (DESIGN.md / screens) jadi input builder di sprint UI; BLUEPRINT.MD sprint UI nanti harus mengacu ke output Stitch

[2026-10-10] Keputusan: Tech stack resmi — HtmlService SPA + Apps Script V8 + Google Sheets (9 tab) + auth "Execute as Me/Only myself" + dev via clasp+git (D1–D5)
  Status: accepted
  Alasan: Constraint user (gratis, tanpa server, produksi cepat) + PRD NFR; alternatif (AppSheet, Cloudflare Workers, SQL, login custom) ditolak dengan alasan terdokumentasi
  Dibuat oleh: User (constraint) + Tech-Stack-Advisor (meresmikan & alternatif)
  Dampak: docs/ARCHITECTURE.MD jadi rujukan stack & risiko; entity-modeler & sprint-planner wajib memakai stack ini; jalur migrasi SQL tercatat bila >20k baris/bulan

[2026-10-10] Keputusan: Rencana 5 sprint — 001 Fondasi+Pembelian, 002 Pengiriman+Piutang, 003 Stok+Opname+Laporan, 004 Dashboard+UI (output Stitch), 005 Ops & Produksi
  Status: accepted
  Alasan: Bab 10.3 satu sprint = satu goal; urutan dari fondasi → fitur #1 (piutang) → pelengkap → UI → deploy; risiko inti (FIFO/HPP/aging) masuk lebih awal
  Dibuat oleh: Sprint-Planner (dari MODULE-PLAN.MD + PRD)
  Dampak: Tercatat di tabel Riwayat STATE.MD; sprint 004 bergantung output Stitch (T8.0); tiap sprint butuh Architect Pack sendiri sebelum coding

[2026-10-10] Keputusan: Architect Pack Sprint 001 disusun & diarsipkan (REQUIREMENTS/BLUEPRINT/ACCEPTANCE/HANDOFF + salinan architect-packs/architect-pack-001.md)
  Status: accepted
  Alasan: AGENTS.MD melarang coding tanpa architect pack; sprint-planner Step 3–5 wajib sebelum handoff
  Dibuat oleh: Sprint-Planner
  Dampak: Builder tinggal terima HANDOFF-PROMPT.MD (dry run dulu); konsistensi lintas-artefak 8/8 LULUS; dependensi sprint 001 runtime = nol, 6 devDep di-pin di T1.1

[2026-10-15] Keputusan: Scope manifest spreadsheets.currentonly → spreadsheets penuh + akses ss_() fallback SPREADSHEET_ID ID-SPREADSHEET-DIHAPUS-DI-REPO-PUBLIK
  Status: accepted
  Alasan: Proyek clasp 1JcK standalone (Drive 404, bukan container-bound) → getActiveSpreadsheet() null via clasp run/API (NOT_FOUND); openById butuh scope spreadsheets penuh, bukan currentonly
  Dibuat oleh: Builder (temuan rung-3 2026-10-15)
  Dampak: 7 file (config/db/init/master.server/pembelian.server/appsscript/eslint globals); check 13/13; push 10 file OK 08.53.02; webapp tetap MYSELF/USER_DEPLOYING (A4 tidak berubah)

[2026-10-15] Keputusan: Protokol sinkron editor — tutup SEMUA tab Apps Script & buka ulang dari URL 1vcM setiap habis push, verifikasi file logic terlihat, baru Run (tab basi menimpa file hasil push saat save-on-run)
  Status: accepted
  Alasan: Push 09.44 (12 file, EXIT=0) hilang dari remote — pull 09.53 bukti tak ada master.logic; pola konsisten dengan save dari tab basi (10 file lama + snippet, tanpa logic). Push ulang 09.55 + pull verifikasi 09.55 bukti master.logic/pembelian.logic mendarat. Catatan tool: pull clasp v3.4.1 menulis kembaran .js untracked (SERVER_JS→.js) — tree lokal dipulihkan 2× via git, file tracked tak tersentuh
  Dibuat oleh: Builder (temuan rework ronde-1)
  Dampak: Prosedur tetap tiap push; snippet rung_* di editor ikut terhapus tiap push (wajar: updateContent ganti seluruh konten) — tempel ulang setelah refresh

[2026-10-15] Keputusan: Logika murni .js → .logic.gs agar ter-deploy ke GAS (single source; fix ReferenceError A5–A7 rework ronde-1)
  Status: accepted
  Alasan: Verdict acceptance-runner REWORK — src/modules/*.js dikecualikan .claspignore → adapter .server.gs crash ReferenceError di runtime padahal test Node hijau; rename membuat file yang dites = file yang di-deploy sehingga gap hilang; Node require .gs tetap jalan; tsconfig include +tests agar tsc ada input (checkJs=false, level keamanan sama seperti sebelum rename)
  Dibuat oleh: Builder (rework ronde-1)
  Dampak: .claspignore tanpa pengecualian modules + komentar larangan kode Node-only di .js; push 12 file OK 09.44.11

[2026-10-15] Keputusan: initSpreadsheet() hapus tab "Sheet1" otomatis (A3 tetap tepat 11 tab)
  Status: accepted
  Alasan: Pemilik memilih hapus-otomatis atas tafsir longgar "≥11 tab"; hanya nama persis "Sheet1" yang dihapus, tab lain di luar TAB_ORDER tidak disentuh
  Dibuat oleh: Pemilik (jawaban atas pertanyaan builder)
  Dampak: src/init.gs; bukti A3 = re-run init di editor lalu tepat 11 nama tab

[2026-10-15] Keputusan: Ganti proyek cloud 1JcK (standalone) → 1vcM (container-bound ke spreadsheet Supplier MBG DB); script lama ditinggalkan total
  Status: accepted
  Alasan: User beri Script ID baru SCRIPT-ID-DIHAPUS-DI-REPO-PUBLIK; pull bukti proyek kosong (Kode.js + manifest bare Asia/Jakarta); push 10 file OK 09.07.28; getActiveSpreadsheet() kini valid di editor
  Dibuat oleh: User (ID baru) + Builder (pull/push)
  Dampak: .clasp.json = ID baru (gitignored, backup lama dihapus); kode src/ tidak berubah (ss_() tetap kompatibel); DB tetap 1QNJ (ID tidak berubah); perlu: otorisasi 1× via editor + setupOwner_ + rung initSpreadsheet() di editor baru

[2026-10-15] Keputusan: Pack Sprint 002 & 003 di-draft builder dari PRD+MODULE-PLAN+DATA-MODEL (opsi "saya draftkan pack dulu" pilihan pemilik), lalu disetujui per-pack sebelum dry run
  Status: accepted
  Alasan: Architect pack wajib ada sebelum coding (AGENTS.MD) tapi sesi architect terpisah tak tersedia; draft builder + persetujuan eksplisit pemilik ("Approved pack 00X") menjaga gate tanpa memblokir jadwal
  Dibuat oleh: Pemilik (pilihan jalur) + Builder (draft)
  Dampak: Pola tetap tiap sprint tanpa pack: draft → approve pack → dry run → approve coding; pack 002/003 diarsipkan ke architect-packs/

[2026-10-15] Keputusan: Temuan audit S002-01 (cek idempotency sesudah alokasi) & S002-02 (typo SATUAN_TIDAK_COCIK) diperbaiki builder sebelum baca-ulang deploy, bukan dijadwalkan
  Status: accepted
  Alasan: Keduanya 2-baris, dalam scope BLUEPRINT (idempotency B6 + error code baru tanpa klien), fail-closed; re-verifikasi harness 6/6 + check 22/22 + push 10.57.25. Catatan "carry-over" di SECURITY-AUDIT-003.md dinyatakan basi (terverifikasi baris 53/126)
  Dibuat oleh: Builder (pasca security-dependency-auditor Sprint 002)
  Dampak: bayarPiutang cek pembayaranId SEBELUM alokasiPiutang; error code = SATUAN_TIDAK_COCOK

[2026-10-15] Keputusan: Sprint 003 sengaja duplikasi agregat stok (stokSemua_ baru vs stokItem_ Sprint 002) + tanpa konversi satuan + opname retry tercatat sebagai baris baru
  Status: accepted
  Alasan: Nol risiko regresi ke file 001–002 yang sudah APPROVED; unifikasi agregat dijadwalkan Sprint 005; konversi satuan di luar kebutuhan owner (satuanDasar tunggal per item, mismatch ditolak server); retry tercatat = audit trail BGN
  Dibuat oleh: Builder (BLUEPRINT Sprint 003 §Risiko, disetujui via "Approved pack 003")
  Dampak: Unifikasi + gitleaks + osv-scanner dijadwalkan Sprint 005; UI 004 wajib kunci pilihan satuan ke satuanDasar item

[2026-10-15] Keputusan: Deploy dev = push ke @HEAD (deployment AKfycbw09hGXPWbyWBi4n30vtF7nyuvL2n35TQ1SubwS68Ip), tanpa langkah deploy terpisah per sprint
  Status: accepted
  Alasan: Deployment @HEAD menyajikan kode HEAD otomatis; tiap `clasp push -f` = live. Deploy berversi + MYSELF produksi = Sprint 005
  Dibuat oleh: Builder (temuan `clasp deployments` Sprint 002)
  Dampak: URL exec tetap sama tiap sprint; uji user via URL owner + editor; catatan deploy produksi tetap di Sprint 005

[2026-10-15] Keputusan: Sprint 004 tanpa Stitch — gerbang T8.0 dibebaskan atas perintah pemilik ("lanjut sprint 004 tanpa stich"); token desain sementara di BLUEPRINT §Tokens; 11 fungsi server existing tak diubah
  Status: accepted
  Alasan: CLI stitch tak ada di mesin builder + Stitch butuh akun/browser interaktif pemilik; menunggu desain = aplikasi tak bisa dipakai berbulan-bulan padahal fungsi sudah APPROVED. UI fungsional-rapi satu file (nol lib/URL eksternal) cukup untuk operasi harian
  Dibuat oleh: Pemilik (perintah) + Builder (pack adaptasi + implementasi)
  Dampak: Upgrade visual Stitch tetap bisa masuk kapan saja tanpa ubah kontrak server; peta 14 view→fungsi dikunci di BLUEPRINT 004; pertanyaan OPEN "/stitch" ditutup sebagai opsional

[2026-10-15] Keputusan: Rework pasca-uji-pemilik — tambah layar Master (CRUD Toko/SPPG/Item + nonaktifkan, fungsi server existing) + Profil supplier TEKS (nama/kontak/alamat via kunci Config baru, tanpa scope Drive)
  Status: accepted
  Alasan: Pemilik menanyakan kedua fitur; master CRUD = klien saja (server APPROVED 001); profil teks = tanpa auth/scope baru (foto upload butuh scope Drive + otorisasi ulang — ditunda)
  Dibuat oleh: Pemilik (jawaban question tool) + Builder
  Dampak: BARU profil.server.gs (getProfil/saveProfil) + view master/profil (9 rute, 18 run_); kunci Config NAMA/KONTAK/ALAMAT_SUPPLIER; foto = keputusan terpisah bila diminta

[2026-10-16] Keputusan: Semua panggilan klien lewat SATU dispatcher `api(nama, args)` yang mengembalikan String JSON (amplop {ok,data}/{ok,galat}) — bukan objek mentah
  Status: accepted
  Alasan: INSIDEN DATA 2026-10-16 (pemilik: "Server tidak mengembalikan data (getMaster)"). Akar masalah: `google.script.run` hanya bisa mengirim nilai JSON; tiap fungsi data mengembalikan baris `getValues()` yang memuat objek `Date` (tanggal/jatuhTempo/createdAt/updatedAt). Apps Script TIDAK melempar error ke failure handler — ia diam-diam mengirim `null` ke success handler, jadi tidak ada fungsi data yang bisa mengirim apa pun. Solusi: serialisasi di server (api.logic.gs jsonAman_) jadi String yang selalu bisa dikirim; respons null mustahil, galat jadi pesan nyata
  Dibuat oleh: Builder (diagnosis + fix, atas permintaan pemilik "fix hingga solve")
  Dampak: src/api.gs (dispatcher + putih-senjata 26 fungsi) + src/api.logic.gs (jsonAman_/isoLokalNaif_/amplopSukses_/amplopGalat_) BARU; klien run_ memanggil google.script.run.api lalu JSON.parse; fungsi server TIDAK berubah kontraknya (html/client-only rule tetap); mapById dibuang dari payload getMaster (tak dipakai klien); helpers internal (ber-underscore) tak bisa dipreach; test tests/api.test.js 11 kasus; versi klien #0324-fix-api

[2026-10-16] Keputusan: Sprint 005 = "Hutang per Faktur + Laporan Laba & Modal" + tab baru `Beban` (satu baris per pengeluaran)
  Status: accepted (disetujui pemilik via question tool)
  Alasan: Pemilik minta (1) input bayar berapa saat belanja tempo + sisa langsung tampil di hutang, (2) laporan laba mingguan & bulanan + laporan modal. Server bayarHutang SUDAH mendukung `pembelianId` sejak Sprint 001 — yang hilang UI per faktur. "Modal" dipilih pemilik = Modal Belanja Stok (Σ Pembelian.total), "laba" = Laba Kotor + Beban input → Laba Bersih, format = satu periode per tampilan (tombol preset), Beban per tanggal (fleksibel, tak edit ulang tiap periode)
  Dibuat oleh: Pemilik (pilihan eksplisit) + Builder (pack + implementasi)
  Dampak: tab ke-12 `Beban` [id,tanggal,kategori,jumlah,catatan,createdBy,createdAt] — nol perubahan skema lain (omzet/HPP/margin sudah snapshot di Pengiriman); beban.logic+server.gs BARU; getLaporanLaba; getHutangToko + faktur[]; preset Minggu ini/lalu + Bulan ini/lalu (Senin–Minggu); tombol "Siapkan Spreadsheet" di Profil untuk menjalankan initSpreadsheet (tab ke-12 belum ada di DB lama); keputusan E28–E30 akan BLACKLIST tetap per-penyelenggara

[2026-10-16] Keputusan: perbaiki cacat zona waktu `dalamRentang_` (ada sejak Sprint 003) — batas "YYYY-MM-DD" diurai UTC, bukan tengah malam lokal
  Status: accepted
  Alasan: Ditemukan oleh test Sprint 005. Sel spreadsheet datang sebagai tengah malam WAKTU LOKAL, pembanding `new Date("2026-10-01")` = UTC midnight; di Asia/Jakarta beda 7 jam sehingga baris tepat tanggal 1 Oktober TERKELUAR dari periode (data hilang tanpa gejala). Diperbaiki dengan regex manual → tengah malam lokal, diuji identik di laporan.test.js & beban.test.js
  Dibuat oleh: Builder (regression test empat date-range)
  Dampak: getLaporanKas, getMargin, getLaporanLaba, getBeban kini inklusif pada batas awal; test regresi jadi bagian DoD

[2026-10-18] Keputusan: Sprint 006 = "Lock Screen Premium" - gate layar penuh client-side dengan kredensial admin/admin, ingat 7 hari, satu akun, nol perubahan server
  Status: accepted (pemilik menjawab question tool 2026-10-18: "Lock screen visual saja" + "Gate layar penuh" + "admin/admin di source" + "Ingat 7 hari" + "Hanya admin")
  Alasan: Pemilik meminta layar kunci premium sebelum data terlihat saat HP dibuka. SETELAH fakta diverifikasi: semua fungsi server sudah memanggil guardOwner_() fail-closed, jadi gate ini PURELY KOSMETIK - menambah satu lapis pengalaman, menambah nol risiko dan nol keamanan. Pemilik secara eksplisit memilih Lock screen visual + admin/admin di source, jadi itu yang dikunci. Password tidak disimpan polos: hanya SHA-256 hex dari "admin|admin" yang ada di source, diverifikasi silang dengan crypto Node di test. Gate tidak bisa jadi halaman terpisah karena GAS hanya melayani satu HtmlService (doGet -> html/index) - makanya overlay, bukan page baru
  Dibuat oleh: Pemilik (pilihan eksplisit) + Builder (fakta guard + disain pack)
  Dampak: src/html/index.html saja (CSS .gate*, HTML gate, sha256Hex_/cocokkanAuth_/authAkses_/authSimpan_/authHapus_/initGate_); init() dipecah jadi init() + lanjutInit_() agar tampil()/muatMaster() tak jalan sebelum unlock; kartu "Sesi & keamanan" + tombol Keluar di Profil; localStorage baru mbg-auth-v1; tests/login.test.js 13 kasus; VERSI_APP #0326-gate; Exception CONSTRAINTS EXC-006-01; teks jujur "Kunci tampilan, bukan pengaman data"; PRD US-11 tetap fulfilled oleh GAS (tidak diubah); jalur upgrade ke token server + tab Pengguna ditulis untuk sprint berikutnya

[2026-10-18] Keputusan: Sprint "Ops & Produksi" (arsip, backup, deploy berversi + MYSELF produksi, monitoring) di geser dari Sprint 006 ke Sprint 007
  Status: accepted (disetujui pemilik: "lanjutkan" atas dry run Sprint 006)
  Alasan: Lock screen diminta pemilik untuk dipakai sekarang; Ops & Produksi (RUNG deploy produksi) belum dijadwalkan ulang sejak Sprint 005 selesai dan tidak punya tenggat. Nomor sprint dipindah, isi tidak berubah
  Dibuat oleh: Pemilik (urutan prioritas) + Builder
  Dampak: STATE.MD tabel riwayat sprint Sprint 006 = Lock Screen Premium, Sprint 007 = Ops & Produksi (belum); tidak ada perubahan kode untuk keputusan ini

[2026-10-18] Keputusan: dua koreksi teknis saat implementasi Sprint 006 (dicatat karena mengubah isi pack, bukan requirement)
  Status: accepted
  Alasan: (1) Konstanta hash di pack = SHA-256("admin") karena pemisah "|" lupa dihitung — diperbaiki ke SHA-256("admin|admin") = 26ac484a...c892 (oracle crypto Node). (2) SHA-256 JS murni salah pada semua input non-kosong: heks_() menggeser k*4 (nibble) bukan k*8 (byte), dan panjang 64-bit ditulis di paruh tinggi msg[pad-8..pad-5] alih-alih paruh rendah msg[pad-4..pad-1] — string kosong tetap benar karena panjangnya 0, jadi test HARUS memakai oracle independen (crypto Node), bukan bandingkan dengan implementasi sendiri. (3) gantiTema() memanggil tampil() sehingga TIDAK BOLEH dipakai di gate (akan memicu request server sebelum unlock) - gate memakai terapkanTema() langsung; (4) pemanggilan tampil() dari banner dibungkus muatUlang_() agar init() benar-benar bebas tampil()
  Dibuat oleh: Builder (test + bukti browser menemukan, bukan asumsi)
  Dampak: tests/login.test.js 16 kasus (L1-L16 nyata,Termasuk multi-blok & UTF-8); 13/13 vektor cocok oracle; REQUIREMENTS R3.2 + BLUEPRINT §4 catatan koreksi + VERIFICATION-REPORT §3 & §7 diperbarui

[2026-10-18] Keputusan: hapus teks peringatan "Kunci tampilan, bukan pengaman data..." dari layar gate (R7.1 dibatalkan) atas perintah pemilik setelah deploy pertama
  Status: accepted (perintah eksplisit pemilik: "hapus kata kata Kunci tampilan, bukan pengaman data. Akses data tetap dijaga akun Google owner.")
  Alasan: Pemilik ingin layar kunci bersih tanpa teks penjelasan. Konsekuensi jujur dicatat: gate jadi tanpa penanda bahwa ini hanya kunci tampilan; pengaman data tetap guardOwner_() fail-closed + pengaturan deploy Apps Script (tidak berubah). Penjelasan yang sama masih ada di kartu "Sesi & keamanan" di halaman Profil
  Dibuat oleh: Pemilik (perintah) + Builder (implementasi + pembaruan test/dokumen)
  Dampak: elemen .gate-catatan + CSS .gate-catatan dihapus dari src/html/index.html; assertion test "teks jujur gate hilang" dibuang (tests/login.test.js tetap 16 kasus); R7.1 di REQUIREMENTS ditandai BATAL; E30 ditulis ulang di ACCEPTANCE; VERIFICATION-REPORT §4/§6/§7 diperbarui; risiko baru dicatat di RISKS.MD; npm run check 73/73 hijau; clasp push -f EXIT=0

[2026-10-18] Keputusan: nama aplikasi diganti "Supplier MBG" -> **SpendFlo** (subtitle "Pengadaan & Pengiriman") + logo mark sendiri
  Status: accepted (pemilihan pemilik setelah riset nama kategori: 2x daftar 6 nama ditolak pemilik ["cari nama lain"], lalu pilih "SpendFlo" sendiri dari daftar research)
  Alasan: pemilik menilai "Supplier MBG" jelek dan bukan premium. Riset (OrderEase/Spendflo/Erplain/Envoy/Zenenta/NotaKulo + ZenBusiness 135 nama fintech + CB Insights Fintech 100) menunjukkan kategori ini menang dengan (a) bukan nama deskriptif, (b) satu kata, (c) <=2 suku kata, (d) fungsi dipindah ke tagline. Pemilik insisted English. CATATAN RISIKO: "SpendFlo" adalah nama SaaS B2B procurement yang sudah dipakai perusahaan nyata (spendflo.com) - tidak masalah untuk aplikasi internal sekolah, tapi WAJIB diganti bila suatu saat dipakai luas/commercial (sudah dikonfirmasi ke pemilik)
  Dampak KODE: <title> "SpendFlo - Pengadaan & Pengiriman"; sidebar brand "SpendFlo / Pengadaan & Pengiriman" (ganti "MBG Supplier / Kelola belanja & kirim"); gate "SpendFlo / Pengadaan & Pengiriman"; .gate-nama kehilangan text-transform:uppercase + tracking .14em -> .02em (biar camelCase utuh, bukan "SPENDFLO"); server.gs setTitle("SpendFlo"); kunci localStorage mbg-auth-v1/mbg-tema -> spendflo-auth-v1/spendflo-tema (efek: pemilik perlu login 1x lagi & tema kembali default 1x); VERSI_APP -> 2026-10-18 #0326-spendflo
  Dampak LOGO: mark sendiri "S + chevron maju" (2 stroke, grid 24, stroke-width 1.6 samain dengan icon set) - S = Spend, chevron = alur procuring -> pengiriman; dipakai di .brand-mark (sidebar, 21px, tinta gelap di atas cyan) dan .gate-logo (gate, 25px, cyan di atas tint). Avatar "S" di topbar tetap inisial supplier (itu profil orang, bukan logo)
  Dampak TEST/DOKUMEN: tests/login.test.js 17 kasus (+1 "logo SpendFlo sama di sidebar dan gate (1 sumber)" yang mengunci path logo muncul tepat 2x); npm run check 74/74 hijau; push dev @HEAD EXIT=0; konsol browser 0 error
  Catatan: dokumen historis Sprint 001-005 TIDAK ditulis ulang (memang bukti bertanggal); nama lama "Supplier MBG" hanya berlaku untuk laporan lama
