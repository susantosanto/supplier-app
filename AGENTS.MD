# AGENTS.MD — Router Utama

## Model Operasi
- Metode Architect-Builder (folder = source of truth, bukan chat history)
- Architect: ChatGPT/Claude — Builder: <tool yang dipakai user>

## File yang Harus Dibaca (urutan wajib)
1. AGENTS.MD (file ini)
2. STATE.MD (status terkini)
3. DECISIONS.MD (keputusan yang sudah dibuat)
4. DOMAIN.MD (konteks bisnis)
5. Pack sprint aktif (planning/sprints/sprint-XXX/)

## Aturan Builder
- JANGAN mulai coding tanpa architect pack
- SELALU dry run dulu → laporkan rencana → TUNGGU persetujuan
- SELALU berikan bukti (test output asli, screenshot)
- JANGAN mengubah requirements tanpa persetujuan
- JANGAN pakai library yang tidak ada di BLUEPRINT.MD
- Baca CONSTRAINTS.md sebelum menulis kode; jangan melunakkan batasan untuk lewat test

## Workflow
1. Baca architect pack sprint aktif
2. Dry run → lapor hasil
3. Disetujui → coding + test
4. Selesai → lapor hasil dengan bukti
