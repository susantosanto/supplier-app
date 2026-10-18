# HANDOFF PROMPT — Sprint 002: Pengiriman + Piutang (fitur #1) — DRAFT (menunggu persetujuan pemilik)

## Prompt untuk Builder (paste apa adanya setelah pack disetujui)

Anda adalah BUILDER dalam metode Architect-Builder. Sprint 002.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` — aturan umum (dry run dulu, bukti asli, tanpa library di luar BLUEPRINT)
2. `STATE.MD` — status terkini (Sprint 001 SELESAI APPROVED+CLEAN)
3. `DECISIONS.MD` — stack terkunci D1–D5 + keputusan 2026-10-15 (logic `.logic.gs`, container-bound 1vcM, protokol sinkron editor, Sheet1, scope penuh)
4. `CONSTRAINTS.MD` — floor + dimensi enforced (lint/typecheck/test/secrets/pin)
5. `planning/sprints/sprint-002/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD` — isi sprint ini
6. Referensi teknis: `docs/DATA-MODEL.MD` (§2 skema Pengiriman/PiutangBaris/PembayaranJual, §5 turunan), `docs/ARCHITECTURE.MD`, `planning/MODULE-PLAN.MD` (M4/T4.1–T4.4), `src/modules/pembelian.server.gs` (pola guard/lock/log/idempotency untuk ditiru)

### Bootstrap command block (JALANKAN SEBELUM APA PUN; deterministik — jangan mengarang setup sendiri)
```bash
# 0) Prasyarat: Node.js >= 20
node -v                                   # expect v20+

# 1) Dependensi terpin (SAMA Sprint 001, tanpa penambahan)
npm install                               # resolve 6 devDep exact dari package-lock.json
npm run check                             # sanity: hijau sebelum mulai (expect EXIT=0)

# 2) Auth clasp — lewati bila token ada (cek: npx clasp list)
npx clasp list                            # bila error auth → minta user `npx clasp login` (JANGAN print token)

# 3) Verifikasi remote = Sprint 001 (jangan timpa sebelum paham)
npx clasp pull                            # opsional cek; waspada kembaran .js untracked (catatan DECISIONS 2026-10-15) — pulihkan via git bila muncul

# 4) Push verifikasi per task + final
npx clasp push -f                         # expect exit 0 (B2)

# 5) Rung-3 via editor online script 1vcM (container-bound DB 1QNJ):
#    tutup SEMUA tab Apps Script & buka ulang dari URL 1vcM setiap habis push (protokol 2026-10-15),
#    verifikasi file piutang.logic.gs + pengiriman.server.gs terlihat, baru Run skenario B3–B7.
#    Bila `clasp run` NOT_FOUND → fallback harness in-process pola VERIFICATION-REPORT 001
#    (muat src/*.gs asli + shim layanan GAS in-memory; harness di luar src/tests, hapus setelah run).
```
Jika langkah apa pun gagal: HENTIKAN, lapor error exact + usulan perbaikan, JANGAN menebak.

### Aturan kerja (wajib)
1. **DRY RUN DULU**: setelah membaca pack, laporkan: (a) daftar file dibuat/diubah persis BLUEPRINT, (b) urutan T4.1→T4.4, (c) dependensi + versi exact (cat package.json), (d) risiko yang kamu lihat, (e) titik butuh user (login/otorisasi/setupOwner_/init ulang bila DB reset).
2. **TUNGGU persetujuan** ("Approved. Mulai coding.") sebelum menulis kode apa pun.
3. Kerjakan berurutan; **setiap task selesai hanya jika DoD hijau** (`npm run check` + rung-3 task) — tempel output asli.
4. Task hot-path (T4.1–T4.4): tulis baris DSA persis BLUEPRINT sebelum implementasi; logic murni WAJIB `.logic.gs` (jangan `.js`).
5. Selesai: jalankan ACCEPTANCE B1–B7, lapor PASS/FAIL per butir + bukti, lalu minta `/acceptance-runner` (konteks segar) sebelum menganggap selesai.
6. Update STATE.MD + FILE-INVENTORY.MD saat selesai (atau minta /state-keeper).

### JANGAN
- JANGAN coding sebelum dry run disetujui
- JANGAN mengubah requirements/kriteria atau skema tab (11 tab tetap; header tetap)
- JANGAN menambah library/tool di luar BLUEPRINT (runtime deps = NOL)
- JANGAN mengubah versi dependensi terpin tanpa entri DECISIONS.MD
- JANGAN taruh kode Node-only (require/module tanpa guard) di src/ — pola guard `typeof module` seperti pembelian.logic.gs
- JANGAN menyentuh file Sprint 001 (master/pembelian/server/db/audit/init) kecuali import-helper; JANGAN fitur sprint berikut (opname/kas-margin/dashboard/UI Stitch/arsip-deploy)
- JANGAN commit/print `.clasprc.json`, `.clasp.json`, OWNER_EMAIL
- JANGAN menganggap "kelihatannya benar" sebagai selesai — hanya output perintah yang berlaku

### SETUJU (setelah persetujuan dry run)
- Mulai T4.1 → berurutan sampai T4.4 (logic murni + gas-fakes dulu, baru rung-3 push+editor)
- Protokol sinkron editor setiap push; snippet rung_* tempel ulang setelah refresh (terhapus tiap push — wajar)
