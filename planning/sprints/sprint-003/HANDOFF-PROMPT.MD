# HANDOFF PROMPT — Sprint 003: Stok, Opname & Laporan — DRAFT (menunggu persetujuan pemilik)

Anda adalah BUILDER. Sprint 003.

### Baca dulu (urutan wajib)
1. `AGENTS.MD` 2. `STATE.MD` (Sprint 002 SELESAI, deploy dev live) 3. `DECISIONS.MD` 4. `CONSTRAINTS.MD`
5. `planning/sprints/sprint-003/REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD`
6. Referensi: `docs/DATA-MODEL.MD` (§2 Opname, §5 turunan), `planning/MODULE-PLAN.MD` (M5–M6), `src/modules/pengiriman.server.gs` (pola guard/lock/log), `src/modules/piutang.logic.gs` (pola logic+guard module)

### Bootstrap (JALANKAN SEBELUM APA PUN)
```bash
node -v                                   # expect v20+
npm install                               # 6 devDep exact, tanpa penambahan
npm run check                             # sanity hijau (expect EXIT=0, 22 test)
npx clasp list                            # bila auth error → minta user `npx clasp login`
npx clasp push -f                         # expect exit 0 (C2)
# Rung-3 editor script 1vcM: tutup SEMUA tab & buka ulang tiap habis push; bila `clasp run` NOT_FOUND → harness in-process pola 001/002 (src asli + shim, di luar src/tests, hapus setelah run).
```
Gagal di langkah mana pun: HENTIKAN, lapor error exact, JANGAN menebak.

### Aturan kerja
1. **DRY RUN DULU**: laporkan (a) file dibuat/diubah, (b) urutan T5.1→T6.2, (c) dependensi exact, (d) risiko, (e) titik butuh user.
2. **TUNGGU** "Approved. Mulai coding." sebelum tulis kode.
3. Berurutan; tiap task selesai hanya jika DoD hijau (output asli ditempel).
4. Logic murni WAJIB `.logic.gs`; baris DSA persis BLUEPRINT sebelum implementasi hot-path.
5. Selesai: ACCEPTANCE C1–C7 + minta `/acceptance-runner` (konteks segar).

### JANGAN
- JANGAN coding sebelum dry run disetujui; JANGAN ubah requirements/kriteria/skema tab
- JANGAN tambah lib (runtime NOL); JANGAN ubah versi pin tanpa DECISIONS.MD
- JANGAN sentuh file Sprint 001–002 kecuali `eslint.config.js` (globals); JANGAN fitur 004–005; JANGAN konversi satuan
- JANGAN commit/print `.clasprc.json`, `.clasp.json`, OWNER_EMAIL; JANGAN klaim selesai tanpa output perintah

### SETUJU (pasca-persetujuan dry run)
- T5.1 → T6.2 (logic + gas-fakes dulu, baru rung-3); protokol sinkron editor tiap push.
