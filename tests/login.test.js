// Test Sprint 006: gate login (kunci tampilan) — SHA-256 JS murni vs oracle crypto Node,
// cocok/tolak kredensial, dan audit statis gate di src/html/index.html.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const INDEX = path.join(__dirname, "..", "src", "html", "index.html");
const html = fs.readFileSync(INDEX, "utf8");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + a + ", harap " + b + ")");
}
function ok(kondisi, msg) {
  if (!kondisi) throw new Error(msg);
}
function bagikan(mens) {
  throw new Error("tidak boleh: " + mens);
}

// --- ambil blok <script> (isi klien) --------------------------------------
const blok = html.match(/<script>([\s\S]*?)<\/script>/);
ok(blok, "blok <script> tidak ditemukan di index.html");
const js = blok[1];

// --- ekstrak fungsi murni sha256Hex_ + cocokkanAuth_ ke sandbox vm --------
// Fungsi di-copy apa adanya dari source supaya yang diuji = yang jalan di browser.
function ambilFungsi(nama) {
  const m = js.match(new RegExp("function\\s+" + nama + "\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n    \\}", ""));
  ok(m, "fungsi " + nama + " tidak ditemukan di script klien");
  return m[0];
}
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  [
    "var AUTH = { USER: \"admin\", HASH: null };",
    ambilFungsi("rotr_"),
    ambilFungsi("heks_"),
    ambilFungsi("utf8_"),
    ambilFungsi("sha256Hex_"),
    ambilFungsi("cocokkanAuth_"),
    "AUTH.HASH = sha256Hex_(AUTH.USER + '|' + 'admin');",
    "var __cocokkan = cocokkanAuth_;",
    "var __sha = sha256Hex_;"
  ].join("\n"),
  sandbox
);
const sha256Hex_ = sandbox.__sha;
const cocokkanAuth_ = sandbox.__cocokkan;

// konstanta hash resmi di source
const mHash = js.match(/HASH:\s*"([0-9a-f]{64})"/);
ok(mHash, "konstanta AUTH.HASH tidak ditemukan di source");
const HASH_SOURCE = mHash[1];

function oracle(t) {
  return crypto.createHash("sha256").update(t, "utf8").digest("hex");
}

// --- lokasi Audit statis ---------------------------------------------------
function badanFungsi(nama) {
  const start = js.indexOf("function " + nama + "(");
  ok(start >= 0, "fungsi " + nama + " tidak ada");
  let i = js.indexOf("{", start), depth = 0;
  for (let j = i; j < js.length; j++) {
    if (js[j] === "{") depth++;
    else if (js[j] === "}") {
      depth--;
      if (depth === 0) return js.slice(start, j + 1);
    }
  }
  bagikan("kurung tidak seimbang di " + nama);
  return "";
}
const initBody = badanFungsi("init");
const lanjutBody = badanFungsi("lanjutInit_");

module.exports = {
  tests: [
    {
      name: "sha256Hex_ vektor standar kosong",
      fn: function () {
        eq(sha256Hex_(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "sha256('')");
      }
    },
    {
      name: "sha256Hex_ vektor standar abc",
      fn: function () {
        eq(sha256Hex_("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "sha256('abc')");
      }
    },
    {
      name: "sha256Hex_ cocok oracle crypto Node (3 input)",
      fn: function () {
        const inputs = ["admin|admin", "admin|salah", "SpendFlo —"];
        for (let i = 0; i < inputs.length; i++) {
          eq(sha256Hex_(inputs[i]), oracle(inputs[i]), "beda dengan oracle: " + inputs[i]);
        }
      }
    },
    {
      name: "sha256Hex_ menangani input panjang (> 1 blok)",
      fn: function () {
        const panjang = new Array(201).join("x");
        eq(sha256Hex_(panjang), oracle(panjang), "blok multi");
      }
    },
    {
      name: "sha256Hex_ menangani karakter non-ASCII (UTF-8)",
      fn: function () {
        const teks = "penggunaé中";
        eq(sha256Hex_(teks), oracle(teks), "utf-8");
      }
    },
    {
      name: "cocokkanAuth_ menerima admin/admin",
      fn: function () {
        eq(cocokkanAuth_("admin", "admin"), true, "admin/admin harus cocok");
      }
    },
    {
      name: "cocokkanAuth_ menolak password case berbeda",
      fn: function () {
        eq(cocokkanAuth_("admin", "Admin"), false, "Admin != admin");
      }
    },
    {
      name: "cocokkanAuth_ menolak username case berbeda",
      fn: function () {
        eq(cocokkanAuth_("Admin", "admin"), false, "username case-sensitive");
      }
    },
    {
      name: "cocokkanAuth_ menolak password kosong / salah",
      fn: function () {
        eq(cocokkanAuth_("admin", ""), false, "password kosong");
        eq(cocokkanAuth_("admin", "admin1"), false, "password salah");
        eq(cocokkanAuth_("", "admin"), false, "username kosong");
      }
    },
    {
      name: "konstanta AUTH.HASH = sha256(admin|admin) menurut oracle",
      fn: function () {
        eq(HASH_SOURCE, oracle("admin|admin"), "hash di source bukan sha256('admin|admin')");
      }
    },
    {
      name: "source tidak memuat kata sandi polos",
      fn: function () {
        ok(!/(password|passwd|pass)\s*[:=]\s*["']admin["']/i.test(js), "ada literal password admin di source");
        ok(!/value\s*=\s*["']admin["']/i.test(html), "ada value=admin (pratinjau) di HTML");
      }
    },
    {
      name: "elemen gate lengkap ada di HTML",
      fn: function () {
        const ids = ["gate", "gate-kartu", "gate-form", "gate-user", "gate-pass", "gate-mata",
          "gate-ingat", "gate-masuk", "gate-galat", "gate-versi", "gate-tema", "tombol-keluar"];
        for (let i = 0; i < ids.length; i++) {
          ok(html.indexOf('id="' + ids[i] + '"') >= 0, "id hilang: " + ids[i]);
        }
      }
    },
    {
      name: "logo SpendFlo sama di sidebar dan gate (1 sumber)",
      fn: function () {
        const pathLogo = 'd="M15.4 6.4H9.6a2.9 2.9 0 0 0 0 5.8h3.2a2.9 2.9 0 0 1 0 5.8H6"';
        const chevron = 'd="M16.8 12.4 19.8 15.4 16.8 18.4"';
        ok(html.indexOf('class="brand-mark"') >= 0, "brand-mark hilang di sidebar");
        ok(html.indexOf('class="gate-logo"') >= 0, "gate-logo hilang di gate");
        const kemunculan = html.split(pathLogo).length - 1;
        const chevronMuncul = html.split(chevron).length - 1;
        eq(kemunculan, 2, "path logo harus muncul tepat 2x (sidebar + gate)");
        eq(chevronMuncul, 2, "chevron harus muncul tepat 2x (sidebar + gate)");
        ok(html.indexOf(">SpendFlo<") >= 0 || html.indexOf("SpendFlo</div>") >= 0, "wordmark SpendFlo hilang");
      }
    },
    {
      name: "init() bergate: tidak memanggil tampil() langsung",
      fn: function () {
        ok(initBody.indexOf("authAkses_()") >= 0, "init() tidak memanggil authAkses_()");
        ok(initBody.indexOf("lanjutInit_()") >= 0, "init() tidak memanggil lanjutInit_()");
        ok(initBody.indexOf("initGate_()") >= 0, "init() tidak memanggil initGate_()");
        ok(initBody.indexOf("tampil(") < 0, "init() masih memanggil tampil() langsung — data bisa dimuat sebelum unlock");
        ok(lanjutBody.indexOf("tampil();") >= 0, "lanjutInit_() tidak lagi memuat tampil()");
      }
    },
    {
      name: "sesi 7 hari + keluar lengkap",
      fn: function () {
        ok(js.indexOf('KUNCI: "spendflo-auth-v1"') >= 0, "kunci localStorage hilang");
        ok(/HARI:\s*7/.test(js), "umur token bukan 7 hari");
        ok(js.indexOf("86400000") >= 0, "perhitungan kedaluwarsa 7 hari hilang");
        ok(js.indexOf("location.reload()") >= 0, "keluar tidak reload");
        const keluar = badanFungsi("authKeluar_");
        ok(keluar.indexOf("authHapus_()") >= 0, "authKeluar_ tidak menghapus token");
      }
    },
    {
      name: "CSS gate: hidden & terkunci, tanpa hex warna baru",
      fn: function () {
        ok(/\.gate\[hidden\]\s*\{\s*display:none/.test(html), ".gate[hidden]{display:none} hilang");
        ok(/body\.terkunci\{overflow:hidden/.test(html), "body.terkunci hilang");
        const mulai = html.indexOf(".gate{position:fixed");
        const akhir = html.indexOf("@media (prefers-reduced-motion", mulai);
        ok(mulai > 0 && akhir > mulai, "blok CSS gate tidak ditemukan utuh");
        const blokCss = html.slice(mulai, akhir)
          .replace(/\/\*[^]*?\*\//g, "")
          .replace(/rgba\([^)]*\)/g, "")
          .replace(/var\(--[a-z-]+\)/g, "");
        const hex = blokCss.match(/#[0-9a-fA-F]{3,8}/g);
        ok(!hex, "CSS gate memakai hex warna baru: " + (hex || []).join(","));
      }
    },
    {
      name: "gate tidak memicu server: gantiTema() tak dipakai di dalam gate",
      fn: function () {
        const initGate = badanFungsi("initGate_").replace(/\/\/[^\n]*/g, "");
        ok(initGate.indexOf("gantiTema()") < 0, "gate memakai gantiTema() yang memanggil tampil() -> request server");
        ok(initGate.indexOf("terapkanTema(") >= 0, "gate tidak menerapkan tema");
      }
    }
  ]
};