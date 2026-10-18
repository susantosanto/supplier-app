# HANDOFF PROMPT — Sprint 004: Dashboard + UI Fungsional — DRAFT (tanpa Stitch, menunggu persetujuan)

Anda adalah BUILDER. Sprint 004 (adaptasi: T8.0 dibebaskan via keputusan pemilik 2026-10-15).

### Baca dulu
1. `AGENTS.MD` 2. `STATE.MD` 3. `DECISIONS.MD` 4. `CONSTRAINTS.MD`
5. `planning/sprints/sprint-004/REQUIREMENTS.MD`, `BLUEPRINT.MD` (§Tokens + §Peta), `ACCEPTANCE.MD`
6. Referensi: `src/html/index.html` (diganti total), `src/modules/pengiriman.server.gs` (pola), `docs/DATA-MODEL.MD`

### Bootstrap
```bash
node -v && npm install && npm run check     # hijau 30 test sebelum mulai
npx clasp list                              # auth error → minta user login
npx clasp push -f                           # D2
# Rung: editor 1vcM (refresh tab tiap push) + harness in-process bila clasp run NOT_FOUND.
# Browser agent TAK bisa buka URL MYSELF (butuh login owner) — uji perangkat = pemilik.
```
Gagal: HENTIKAN, lapor exact, JANGAN menebak.

### Aturan
1. **DRY RUN DULU** (file, urutan T7.1→T8.7, dependensi exact, risiko, titik user). 2. **TUNGGU** "Approved. Mulai coding."
3. index.html TANPA scriptlet `<?= ?>`, tanpa URL eksternal, tanpa `eval(`; SATU file.
4. JANGAN ubah 11 fungsi server existing / skema / manifest / versi pin; JANGAN lib baru; JANGAN klaim tanpa output.
5. Selesai: D1–D6 + `/acceptance-runner` segar.

### JANGAN
coding sebelum disetujui · ubah requirements · lib di luar BLUEPRINT · sentuh server existing · fitur 005 · commit rahasia.
