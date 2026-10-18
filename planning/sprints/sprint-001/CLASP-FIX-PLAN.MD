# CLASP-FIX-PLAN.MD — Catatan perbaikan dari research struktur resmi (PAUSED, BELUM dieksekusi)

Tanggal research: 2026-10-11 | Status: DICATAT, menunggu persetujuan user sebelum eksekusi
Commit terakhir saat dicatat: f6a7f5a (pause sprint001)

## 1. Sumber resmi yang diverifikasi
1. `developers.google.com/apps-script/guides/clasp` — subfolder didukung, struktur lokal dipertahankan saat push ("organize your code into directories, which are preserved").
2. Codelab resmi clasp — `utils/strings.gs` online ↔ folder lokal `utils/`; path = nama file remote.
3. Kode clasp 3.4.1 terinstal (bukti lokal, bukan opini):
   - `node_modules/@google/clasp/build/src/core/clasp.js:32-41` — `DEFAULT_CLASP_IGNORE = ['**/**', '!**/appsscript.json', '!**/*.gs', '!**/*.js', '!**/*.ts', '!**/*.html', '.git/**', 'node_modules/**']`
   - `node_modules/@google/clasp/build/src/core/files.js:107-129` — konflik `src/Code.js` + `src/Code.gs` → error `FILE_CONFLICT` (kunci = dir+nama tanpa ekstensi)
   - `node_modules/@google/clasp/build/src/core/files.js:130-144` — `getFileType()`: `.gs`/`.js` → `SERVER_JS`, `.html` → `HTML`, hanya file bernama `appsscript` + `.json` → `JSON`
   - `rootDir`/`srcDir` di `.clasp.json` = content dir (default = project root); manifest boleh di subfolder (`!**/appsscript.json` rekursif)
4. `.claspignore` resmi repo clasp diawali `**/**` lalu baris `!` pengecualian — artinya file `.claspignore` MENGGANTIKAN default, bukan menambah.

## 2. Temuan audit repo (4 masalah nyata)
| # | Masalah | Bukti di repo | Dampak bila dibiarkan |
|---|---------|---------------|----------------------|
| 1 | `.claspignore` salah semantik (hanya 8 baris ignore-only, tanpa `**/**` + `!`) | `.claspignore` saat ini: node_modules/, tests/, **/*.md, package.json, ... | File tak dikenal ikut kandidat push; perilaku tak terdefinisi |
| 2 | File `.js` murni (`src/modules/master.js`, `src/modules/pembelian.js`) akan ter-push sebagai `SERVER_JS` padahal berisi `module.exports` (Node-only) | `getFileType`: `.js` → SERVER_JS tanpa kecuali | Runtime GAS: `ReferenceError: module is not defined` |
| 3 | Risiko konflik nama kembar `.js`/`.gs` sedirektori | `files.js:115-118` | `clasp push` error `FILE_CONFLICT` bila terjadi |
| 4 | `.clasp.json` belum ada (`rootDir: src` belum diset) | `Test-Path .clasp.json = False` (2026-10-11) | Path remote tidak sesuai rencana `src/` |

## 3. Rencana perbaikan (5 langkah — BELUM dieksekusi)
1. **Tulis ulang `.claspignore`** pola resmi (ganti total):
   ```
   **/**
   !**/appsscript.json
   !**/*.gs
   !**/*.html
   .git/**
   node_modules/**
   tests/**
   src/modules/*.js
   **/*.md
   package.json
   package-lock.json
   tsconfig.json
   eslint.config.js
   .gitignore
   ```
   Catatan: `src/modules/*.js` dikecualikan dari push (hanya untuk test Node); yang ter-push hanya `.gs` + `.html` + manifest.
2. **Pisahkan sumber GAS vs Node**: `.js` murni tetap untuk test Node (tidak di-push); `.gs` satu-satunya SERVER_JS. Pastikan tidak ada pasangan nama kembar `.js`/`.gs` dalam satu folder.
3. **Buat `.clasp.json` setelah login+create**: isi `{"scriptId": "<dari create>", "rootDir": "src"}`. Dibuat via `npx clasp create --type sheets --title "Supplier MBG DB"` dari root repo (jangan tulis manual scriptId).
4. **Guard `module` dua arah**: blok `if (typeof module !== "undefined" && module.exports)` di `.js` sudah benar — pertahankan; jangan panggil fungsi `.js` langsung dari `.gs` tanpa load order clasp (semua file satu scope runtime).
5. **HtmlService tidak diubah**: `doGet` → `createTemplateFromFile("html/index")` cocok dengan `src/html/index.html` + rootDir `src` → remote `html/index` ✅.
6. Re-run `npm run check` (harus EXIT=0) → commit → lanjut `clasp push -f` → rung-3 A3–A8.

## 4. Checklist serah terima ke agent/sesi berikut
- [ ] User setuju 5 langkah di atas (atau revisi)
- [ ] Eksekusi langkah 1–2, `npm run check` hijau
- [ ] User `npx clasp login` (interaktif sekali)
- [ ] `npx clasp create --type sheets` → `.clasp.json` berisi `rootDir: src`
- [ ] `npx clasp push -f` exit 0 (bukti A2)
- [ ] Rung-3 editor: `initSpreadsheet()` 2× → 11 tab (A3), `setupOwner_()` + uji guard (A4), skenario A5–A8
