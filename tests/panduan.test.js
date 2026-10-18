// Test Sprint 007: halaman Panduan (dokumentasi in-app untuk pengguna non-teknis).
// Memastikan view ada, terdaftar di semua peta rute, memuat 10 blok menu,
// dan tetap bebas dari diagram serta konteks yang tidak relevan.
const fs = require("fs");
const path = require("path");

const INDEX = path.join(__dirname, "..", "src", "html", "index.html");
const html = fs.readFileSync(INDEX, "utf8");

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg + " (dapat " + a + ", harap " + b + ")");
}
function ok(kondisi, msg) {
  if (!kondisi) throw new Error(msg);
}

// isolate view-panduan supaya audit tidak salah baca halaman lain
const mulai = html.indexOf('id="view-panduan"');
ok(mulai > 0, "view-panduan tidak ditemukan");
const akhir = html.indexOf("</section>", mulai);
ok(akhir > mulai, "view-panduan tidak ditutup dengan benar");
const view = html.slice(mulai, akhir);

const MENU = ["Dasbor", "Belanja", "Hutang", "Kirim", "Piutang", "Stok", "Laporan", "Master", "Profil", "Masuk"];

module.exports = {
  tests: [
    {
      name: "panduan: view + rute terdaftar di semua peta",
      fn: function () {
        ok(html.indexOf("RUTE = [") >= 0, "RUTE hilang");
        ok(/RUTE = \[[^\]]*"profil", "panduan"\]/.test(html), "panduan belum terdaftar di RUTE");
        ok(/RUTE_LAINNYA = \[[^\]]*"panduan"\]/.test(html), "panduan belum terdaftar di RUTE_LAINNYA (menu Lainnya)");
        ok(/panduan: \{ title: "Panduan"/.test(html), "judul desktop untuk panduan belum ada");
        ok(/panduan: muatPanduan/.test(html), "pemuat halaman panduan belum didaftarkan");
        ok(/nama: "Panduan"/.test(html), "entri Panduan di menu Lainnya belum ada");
      }
    },
    {
      name: "panduan: bisa dibuka dari sidebar, topbar, dan Profil",
      fn: function () {
        ok(html.indexOf('href="#/panduan"') >= 0, "tautan Panduan di sidebar tidak ada");
        ok(html.indexOf('title="Panduan"') >= 0, "tombol Panduan di topbar tidak ada");
        ok(html.indexOf("Buka Panduan") >= 0, "kartu Panduan di halaman Profil tidak ada");
      }
    },
    {
      name: "panduan: 10 blok menu lengkap (dapat diketuk)",
      fn: function () {
        eq((view.match(/class="pg-blok"/g) || []).length, 10, "jumlah blok menu harus 10");
        const hilang = MENU.filter((m) => view.indexOf(">" + m + "<") < 0);
        eq(hilang.length, 0, "menu tidak dijelaskan: " + hilang.join(", "));
      }
    },
    {
      name: "panduan: tiap menu punya tujuan, langkah, dan istilah",
      fn: function () {
        const blok = view.split('class="pg-blok"').slice(1);
        eq(blok.length, 10, "blok tidak terbagi 10 bagian");
        for (let i = 0; i < blok.length; i++) {
          const isi = blok[i];
          const judul = MENU.filter((m) => isi.indexOf(">" + m + "<") >= 0)[0] || ("blok " + (i + 1));
          ok(isi.indexOf("Gunanya untuk Anda") >= 0, judul + ": bagian 'Gunanya untuk Anda' tidak ada");
          ok(/Kapan dipakai|Langkah memakai|Isi halaman ini|Setiap hari/.test(isi), judul + ": tidak ada cara pakai");
          ok(isi.indexOf("<ol>") >= 0 || isi.indexOf("<ul>") >= 0, judul + ": tidak ada langkah/poin");
        }
      }
    },
    {
      name: "panduan: memuat alur 5 langkah + rutinitas + troubleshooting",
      fn: function () {
        const langkah = (view.match(/class="pg-num"/g) || []).length;
        eq(langkah, 5, "alur utama harus 5 langkah bernomor");
        ok(view.indexOf("Lima langkah yang selalu Anda jalankan") >= 0, "judul alur utama hilang");
        ok(view.indexOf("Setiap hari") >= 0 && view.indexOf("Setiap akhir minggu") >= 0 &&
          view.indexOf("Setiap akhir bulan") >= 0, "rutinitas harian/mingguan/bulanan belum lengkap");
        ok(view.indexOf("Kalau ada masalah") >= 0, "tabel troubleshooting hilang");
      }
    },
    {
      name: "panduan: bersih dari diagram dan istilah teknis tak perlu",
      fn: function () {
        ok(!/```|mermaid|flowchart|graph TD|graph LR/.test(view), "view panduan tidak boleh berisi blok diagram");
        const css = html.slice(html.indexOf(".pg-hero"), html.indexOf(".gate{position:fixed"));
        const hexBaru = (css.match(/#[0-9a-fA-F]{3,8}/g) || []).filter((h) => !/^#[0-9a-fA-F]{6}$/.test(h));
        ok((css.match(/#[0-9a-fA-F]{3,8}/g) || []).length === 0, "CSS panduan memakai hex warna baru: " + hexBaru.join(","));
        ok(/var\(--/.test(css), "CSS panduan harus memakai token warna yang sudah ada");
      }
    },
    {
      name: "panduan: isi sesuai implementasi (tidak ada tombol yang tidak ada)",
      fn: function () {
        const nyata = ["Toko Supplier", "Item Produk", "Qty", "Harga Beli", "Harga Jual", "Metode",
          "Tunai", "Tempo", "Bayar Semua", "Catatan override", "Minggu ini", "Bulan ini",
          "Sewa", "Transport", "Gaji", "Listrik", "Keluar", "Tes koneksi server",
          "Siapkan Spreadsheet", "Ingat saya 7 hari"];
        const dibuat = nyata.filter((t) => view.indexOf(t) < 0);
        eq(dibuat.length, 0, "menyebut istilah yang tidak ada di aplikasi: " + dibuat.join(", "));
        const tombolPalsu = ["Uang Tarik", "Scan Barcode", "Cetak Invoice", "Multi User"];
        const muncul = tombolPalsu.filter((t) => view.indexOf(t) >= 0);
        eq(muncul.length, 0, "menyebut fitur yang tidak ada: " + muncul.join(", "));
      }
    },
    {
      name: "panduan: netral (tanpa konteks yang tidak relevan)",
      fn: function () {
        const dilarang = ["makan gratis", "operator sekolah", "program pemerintah", "SDN "];
        const kena = dilarang.filter((t) => new RegExp(t, "i").test(view));
        eq(kena.length, 0, "panduan memuat konteks yang tidak relevan: " + kena.join(", "));
        ok(/pelanggan/i.test(view), "istilah 'pelanggan' harus dipakai");
      }
    },
    {
      name: "panduan: pemuat halaman tidak memanggil server",
      fn: function () {
        const awal = html.indexOf("function muatPanduan");
        ok(awal > 0, "fungsi muatPanduan tidak ada");
        let i = html.indexOf("{", awal), depth = 0, badan = "";
        for (let j = i; j < html.length; j++) {
          if (html[j] === "{") depth++;
          else if (html[j] === "}") {
            depth--;
            if (depth === 0) { badan = html.slice(awal, j + 1); break; }
          }
        }
        eq(badan, "function muatPanduan() { return Promise.resolve(); }",
          "muatPanduan harus no-op (halaman statis, tanpa request server)");
        ok(badan.indexOf("runTahan_") < 0 && badan.indexOf("antriRun_") < 0 && badan.indexOf("run_") < 0,
          "muatPanduan tidak boleh memanggil server");
      }
    }
  ]
};