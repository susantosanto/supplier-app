# HANDOFF PROMPT — Sprint 001: Fondasi + Pembelian & Stok Masuk

## Prompt untuk Builder (paste apa adanya)

Anda adalah BUILDER dalam metode Architect-Builder. Sprint 001.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` — aturan umum (dry run dulu, bukti asli, tanpa library di luar BLUEPRINT)
2. `STATE.MD` — status terkini
3. `DECISIONS.MD` — stack terkunci D1–D5
4. `planning/sprints/sprint-001/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD` — isi sprint ini

### Bootstrap command block (JALANKAN SEBELUM APA PUN; ini setup deterministik — jangan mengarang setup sendiri)
```bash
# 0) Prasyarat: Node.js >= 20 terpasang
node -v                                   # expect v20+

# 1) Dependensi terpin (sudah ada package.json; bila belum: npm init -y dulu)
npm install                               # resolve devDeps terpin dari package-lock.json
npm run check                             # sanity: lint+typecheck+test hijau (0 test = hijau)

# 2) Auth clasp — INTERAKTIF SEKALI, minta user menjalankan di terminal mereka bila token belum ada
npx clasp login                           # menulis ~/.clasprc.json (JANGAN commit/print)

# 3) Proyek GAS (sekali per mesin; bila .clasp.json sudah ada, lewati ke langkah 4)
npx clasp create --type sheets --title "Supplier MBG DB"   # hasilkan scriptId → .clasp.json (gitignored)

# 4) Push perdana + verifikasi
npx clasp push -f                         # expect exit 0

# 5) Sanity spreadsheet: jalankan initSpreadsheet() (rung-3, via editor online)
#    lalu hitung tab:
#    expect: 11 nama tab persis sesuai BLUEPRINT T1.2
```
Jika langkah apa pun gagal: HENTIKAN, lapor error exact + usulan perbaikan, JANGAN menebak.

### Aturan kerja (wajib)
1. **DRY RUN DULU**: setelah membaca pack, laporkan: (a) daftar file yang akan dibuat/diubah persis dari BLUEPRINT, (b) urutan task T1.1→T3.4, (c) dependensi yang terpasang + versi exact hasil resolve, (d) risiko yang kamu lihat, (e) titik yang butuh user (mis. `clasp login`).
2. **TUNGGU persetujuan** ("Approved. Mulai coding.") sebelum menulis kode apa pun.
3. Kerjakan task berurutan sesuai BLUEPRINT; **setiap task selesai hanya jika DoD-nya hijau** (`npm run check` + rung-3 task) — tempel output asli sebagai bukti.
4. Task hot-path (T1.2, T2.2, T3.2, T3.3, T3.4): tulis baris DSA persis format BLUEPRINT sebelum implementasinya.
5. Selesai sprint: jalankan seluruh ACCEPTANCE.MD A1–A8, laporkan PASS/FAIL per butir dengan bukti, lalu minta `/acceptance-runner` (konteks segar) sebelum menganggap selesai.

### JANGAN
- JANGAN coding sebelum dry run disetujui
- JANGAN mengubah requirements/kriteria
- JANGAN menambah library/tool di luar BLUEPRINT (runtime deps = NOL)
- JANGAN mengubah versi dependensi terpin tanpa entri DECISIONS.MD
- JANGAN menganggap "kelihatannya benar" sebagai selesai — hanya output perintah yang berlaku
- JANGAN menyentuh fitur sprint berikut (pengiriman, piutang, dashboard, UI premium)
- JANGAN commit/print isi `.clasprc.json` atau `.clasp.json`

### SETUJU (setelah persetujuan dry run)
- Mulai T1.1 → berurutan sampai T3.4
- Test logic murni dulu (gas-fakes rung 2), baru rung 3 (push + editor)
- Update STATE.MD + FILE-INVENTORY.MD saat selesai (atau minta /state-keeper)
