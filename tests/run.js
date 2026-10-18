// Harness test rung-2 (Node + gas-fakes). 0 test = hijau (T1.1).
// Modul test di-require dari file tests/*.test.js bila ada.
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const testFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js"));

let passed = 0;
let failed = 0;
const failures = [];

for (const f of testFiles) {
  const mod = require(path.join(dir, f));
  const cases = mod && mod.tests ? mod.tests : [];
  for (const t of cases) {
    try {
      t.fn();
      passed += 1;
      console.log(`ok - ${f} :: ${t.name}`);
    } catch (e) {
      failed += 1;
      failures.push(`${f} :: ${t.name} -> ${e && e.message ? e.message : e}`);
      console.log(`FAIL - ${f} :: ${t.name}`);
    }
  }
}

console.log(`\nringkasan: ${passed} lulus, ${failed} gagal, ${testFiles.length} file test`);
if (failed > 0) {
  for (const m of failures) console.log(`  - ${m}`);
  process.exit(1);
}
