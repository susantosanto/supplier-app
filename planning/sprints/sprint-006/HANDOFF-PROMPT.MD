# HANDOFF PROMPT — SPRINT 006

Anda adalah builder Sprint 006 "Lock Screen Premium". Baca `AGENTS.MD`, `STATE.MD`, `DECISIONS.MD`, lalu pack ini (`REQUIREMENTS.MD`, `BLUEPRINT.MD`, `ACCEPTANCE.MD`).

## Urutan kerja (WAJIB)
1. **Dry run** — laporkan rencana (file mana, fungsi mana,test mana) dan **tunggu persetujuan pemilik**. Jangan menulis kode sebelum disetujui.
2. **Koding** sesuai BLUEPRINT §2–§5 (CSS → HTML gate → JS auth → pemecahan `init()` → Profil/Keluar).
3. **Test** `tests/login.test.js` (L1–L13) lalu `npm run check` sampai hijau.
4. **Deploy dev** `clasp push -f`, tarik ulang, buktikan SAMA PERSIS.
5. **Bukti** laporkan output asli (bukan ringkasan) + status tiap E1–E30.
6. **Dokumen** perbarui `CONSTRAINTS.MD` (Exception), `RISKS.MD`, `DECISIONS.MD`, `STATE.MD`.
7. **Commit** hanya atas perintah eksplisit pemilik.

## Larangan keras
- **JANGAN** mengubah requirement di `REQUIREMENTS.MD` tanpa persetujuan pemilik.
- **JANGAN** menyentuh file `.gs` apa pun (R6.3) — hanya `src/html/index.html` + `tests/login.test.js` + dokumen.
- **JANGAN** menambah dependensi (`package.json` tidak boleh berubah) — nol library baru.
- **JANGAN** menambah suppressi (`@ts-ignore`, `eslint-disable`, `// @ts-nocheck`) atau stub (`TODO`, `throw new Error("Not implemented")`, `catch {}` kosong) — Floor CONSTRAINTS.
- **JANGAN** melakukan `git checkout -- .`, `git stash`, atau `git add -A` (28+ path uncommitted Sprint 002–005 masih hidup & sudah live).
- **JANGAN** mengklaim PASS untuk pengaman yang tidak diuji. Bila Playwright MCP mati → tulis **UNTESTED** beserta alasannya.
- **JANGAN** mengklaim gate ini menambah keamanan. Ia kosmetik; `guardOwner_()` + pengaturan deploy Apps Script tetap satu-satunya pengaman.

## Alias taktik yang tidak boleh dipakai
- Hardcode `sha256_` konstanta tanpa verifikasi ulang (harus cocok `crypto` Node).
- `location.reload()` untuk sukses login (hanya untuk Keluar) — reloadissance kehilangan state.
- `crypto.subtle` (tidak dipakai;زمةsync tidak cocok di iframe/file:// dan membuka celah fallback).
- Menyembunyikan app dengan `visibility:hidden` alih-alih benar-benar tidak memanggil `tampil()`.

## Perintah verifikasi minimum
```powershell
npm run check
$html = Get-Content src\html\index.html -Raw
$js = ([regex]::Matches($html,'(?s)<script>(.*?)</script>') | ForEach-Object { $_.Groups[1].Value }) -join "`n"
Set-Content C:/Users/<pengguna>/AppData\Local\Temp\opencode\gate.js -Value $js -Encoding UTF8
node --check C:/Users/<pengguna>/AppData\Local\Temp\opencode\gate.js
git diff --stat -- src\api.gs src\config.gs src\db.gs src\secrets.gs src\server.gs src\init.gs src\audit.gs src\api.logic.gs src\modules
node -e "console.log(require('crypto').createHash('sha256').update('admin|admin').digest('hex'))"
npx clasp push -f
npx clasp deployments
```

## Laporkan ke pemilik
- Status per kriteria E1–E30: **PASS / FAIL / UNTESTED** + bukti.
- What changed: daftar file + jumlah baris (`git diff --stat`).
- Residual risk yang masih terbuka (terutama: **cek manual "Who has access"**).