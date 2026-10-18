# FILE-INVENTORY.MD

| File | Sumber | Format | Catatan |
|------|--------|--------|---------|
| package.json / package-lock.json | T1.1 | config | 6 devDeps exact: clasp 3.4.1, @mcpher/gas-fakes 2.5.8, eslint 10.12.0, eslint-plugin-googleappsscript 1.0.5, typescript 7.0.2, @types/google-apps-script 2.0.13 |
| tsconfig.json / eslint.config.js | T1.1 | config | checkJs=false (D 2026-10-11); lint globals GAS lintas-file |
| .gitignore / .claspignore | T1.1 + CLASP-FIX 1–2 (fdbf589) | config | pola resmi `**/**` + `!` (push 10 file OK 2026-10-14, A2 PASS); `.clasp.json` gitignored = ID kanonis 1JcK... + rootDir src |
| src/appsscript.json | T1.1 | GAS manifest | scopes currentonly+container, Asia/Jakarta, MYSELF/USER_DEPLOYING |
| src/config.gs / init.gs / db.gs / audit.gs / server.gs / secrets.gs | T1.2–T1.4 | GAS | fondasi; guardOwner_ fail-closed; doGet html/index |
| src/html/index.html | T1.4 + Sprint 006 | HTML | shell aplikasi **SpendFlo** (sebelumnya "Supplier MBG"); 9 view, gate login admin/admin (Sprint 006), logo mark "S ›" |
| src/modules/master.js + master.server.gs | T2.1–T2.2 | JS murni + GAS | getMaster/saveMaster/nonaktifkanMaster |
| src/modules/pembelian.js + pembelian.server.gs | T3.1–T3.4 | JS murni + GAS | create/list/bayarHutang FIFO idempoten/getHutangToko |
| tests/run.js + master.test.js + pembelian.test.js | T2–T3 | Node harness | 13 test hijau via npm run check |
|------|--------|--------|---------|
