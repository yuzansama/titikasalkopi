/**
 * Gerbang anggaran kata terlihat per rute (D-11).
 *
 *   node scripts/check-copy-budget.mjs
 *
 * Owner menilai situs ini terlalu banyak kata, dan angkanya membenarkannya:
 * `/katalog` 774 kata, beranda 470, sementara kerangka header dan footer saja
 * sudah menyumbang ±105. D-11 karena itu menetapkan plafon kata per rute dan
 * meminta plafon itu ditegakkan CI, bukan diingat orang.
 *
 * Kenapa harus gerbang, bukan kalimat di dokumen. Situs ini sudah punya
 * pelajarannya: plafon 190 KB pada D-04 disepakati sejak awal, lalu tiga fitur
 * bertambah tanpa satu pun mengukur ulang, karena tidak ada yang menjaganya.
 * Kata jauh lebih mudah bertambah daripada JavaScript — satu kalimat "biar
 * jelas" per PR tidak pernah terasa mahal, dan enam bulan kemudian halamannya
 * kembali ke 774 kata tanpa ada satu pun perubahan yang bisa disalahkan.
 *
 * ATURAN YANG PALING PENTING DI BERKAS INI, dan alasan ia ditulis paling atas:
 * angka pada PLAFON di bawah hanya boleh naik dengan menyunting keputusan D-11
 * di `docs/13-diet-tampilan.md`, lewat PR yang terlihat dan bisa diperdebatkan.
 * Ia TIDAK BOLEH dinaikkan di sini supaya gerbangnya berubah hijau. Itu persis
 * bentuk kegagalan cacat harga 9 September 2026, ketika pemeriksaan diubah agar
 * mengesahkan keluaran yang salah — gerbang yang menyesuaikan diri dengan
 * kenyataan berhenti menjadi gerbang dan berubah menjadi stempel.
 *
 * Saat berkas ini ditulis, gerbangnya MERAH untuk tujuh rute. Itu hasil yang
 * benar: pemangkasan (Sprint C-1 dan seterusnya) belum dikerjakan, dan D-11
 * sengaja meminta gerbangnya dipasang lebih dulu supaya ia pernah terlihat
 * merah. Gerbang yang lahir hijau tidak pernah dibuktikan bekerja.
 *
 * Yang dihitung adalah KATA TERLIHAT pada HTML hasil build: isi `<script>`,
 * `<style>`, dan `<template>` dibuang beserta tagnya, sisa tag dilucuti, entitas
 * HTML diubah menjadi spasi, lalu sisanya dipecah pada spasi. Bukan panjang
 * berkas, bukan jumlah karakter — yang dikeluhkan owner adalah banyaknya kata
 * yang harus dibaca, dan itu yang diukur. Metode ini sama persis dengan yang
 * menghasilkan tabel pada Bagian 2 dokumen D-11, sehingga angka di layar bisa
 * dibandingkan langsung dengan angka di dokumen; kalau keduanya menyimpang jauh,
 * yang salah adalah pelucutan tag di sini, bukan tabelnya.
 *
 * Tanpa dependensi baru: `node:fs` dan `node:path` sudah ada di Node (ADR-14).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { check, summary } from "./_ts-load.mjs";

/**
 * Plafon kata terlihat per rute, disalin dari tabel D-11. Kerangka header dan
 * footer IKUT dihitung — plafon ini adalah beban baca total satu halaman, bukan
 * beban isinya saja, karena pengunjung tidak memisahkan keduanya.
 *
 * Rute yang tidak ada di sini tidak diperiksa, dan itu disengaja. `/keranjang`
 * (104 kata) justru halaman paling ringkas di situs dan tidak pernah dikeluhkan;
 * `/lacak` dan halaman 404 adalah alat, bukan halaman jualan. Memberi mereka
 * plafon berarti menambah angka yang tidak pernah dibahas siapa pun.
 */
const BUDGETS = new Map([
  ["", 260],
  ["katalog", 420],
  ["houseblend", 300],
  ["houseblend/bold", 300],
  ["houseblend/bright", 300],
  ["houseblend/full-robusta", 300],
  ["produk/oelbiteno", 280],
  ["produk/abmisibil", 280],
  ["produk/sabin", 280],
  ["produk/pyramid", 280],
  ["produk/palimping", 280],
  ["produk/kerinci", 280],
  ["produk/pondok-baru", 280],
  ["produk/sindoro", 280],
  ["cerita-kami", 260],
  ["kontak", 260],
]);

const BUILD_DIR = "out";

console.log("Pemeriksaan anggaran kata terlihat per rute (D-11)\n");

if (!existsSync(BUILD_DIR)) {
  // Sama seperti check-build-output dan check-bundle-size: `check-all.mjs`
  // dijalankan juga pada alur yang belum sempat membangun apa pun, dan gerbang
  // yang menjatuhkan seluruh rangkaian hanya karena folder build belum ada akan
  // segera dicabut orang dari daftar — itu cara paling cepat kehilangan gerbang.
  console.log("  DILEWATI  Folder build tidak ditemukan.");
  console.log("            Jalankan `npm run build` lebih dulu, lalu ulangi.");
  process.exit(0);
}

/** Seluruh berkas .html di dalam folder build. */
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (full.endsWith(".html")) found.push(full);
  }
  return found;
}

function routeOf(file) {
  return file
    .slice(BUILD_DIR.length + 1)
    .split(sep)
    .join("/")
    .replace(/\/index\.html$/, "")
    .replace(/\.html$/, "")
    .replace(/^index$/, "");
}

/**
 * Jumlah kata yang benar-benar dibaca pengunjung pada satu halaman.
 *
 * Urutannya mengikat. Blok `<script>`, `<style>`, dan `<template>` dibuang
 * LEBIH DULU beserta isinya: muatan RSC yang ditanam Next di dalam `<script>`
 * memuat ulang hampir seluruh teks halaman, jadi melucuti tag lebih dulu akan
 * menghitung setiap kalimat dua kali dan melaporkan halaman yang sudah ramping
 * sebagai pelanggar. `<template>` ikut dibuang karena isinya belum tayang.
 *
 * Entitas diganti SPASI, bukan dihapus dan bukan didekode menjadi karakternya.
 * "Rp120.000&nbsp;/&nbsp;kg" harus terbaca tiga kata seperti saat dibaca mata;
 * menghapus entitasnya akan melekatkan angka dan satuan menjadi satu kata dan
 * diam-diam mengecilkan setiap halaman yang memakai spasi tak-putus — dan BR-02
 * membuat situs ini memakainya di setiap harga.
 *
 * Teks `sr-only` TIDAK dihitung, dan itu keputusan, bukan kelalaian. Ia memang
 * tidak terlihat — itu seluruh gunanya — sehingga ia bukan bagian dari beban
 * baca yang dikeluhkan owner. Yang lebih menentukan: menghitungnya membuat
 * gerbang ini memberi tekanan untuk MENGHAPUS keterangan pembaca layar demi
 * angka yang lebih kecil. `RatioTable` menaruh satu keterangan per sel harga,
 * karena "Rp215.000" saja tidak memberi tahu apa yang sedang dipilih; plafon
 * yang menghukum kalimat itu menukar aksesibilitas dengan keringkasan, dan
 * pertukaran itu tidak pernah disetujui siapa pun.
 *
 * Konsekuensinya ditulis terbuka: angka di sini lebih kecil daripada tabel
 * Bagian 2 pada `docs/13-diet-tampilan.md`, yang diukur sebelum aturan ini ada.
 * Tabel itu dibiarkan apa adanya sebagai catatan keadaan awal.
 */
function countVisibleWords(html) {
  const text = html
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Elemen sr-only dibuang beserta isinya. Seluruh pemakaiannya di situs ini
    // berupa elemen daun (span, p, h2, caption), sehingga tag penutup terdekat
    // sudah pasti penutupnya sendiri.
    .replace(
      /<(span|p|h[1-6]|caption|div|li)\b[^>]*\bclass="[^"]*\bsr-only\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    )
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text === "" ? 0 : text.split(" ").length;
}

const counted = new Map(); // rute -> jumlah kata
for (const file of walk(BUILD_DIR)) {
  const route = routeOf(file);
  if (!BUDGETS.has(route) || counted.has(route)) continue;
  counted.set(route, countVisibleWords(readFileSync(file, "utf8")));
}

const measured = [...BUDGETS.keys()]
  .filter((route) => counted.has(route))
  .map((route) => ({
    route,
    words: counted.get(route),
    budget: BUDGETS.get(route),
  }));

check("D-11: setiap rute berplafon benar-benar ada di hasil build", () => {
  // Tanpa pemeriksaan ini, sebuah halaman yang berhenti dibangun akan melewati
  // gerbang ini dengan mulus — nol kata memang selalu di bawah plafon apa pun.
  // Rute yang hilang adalah cacat yang jauh lebih besar daripada rute yang
  // kebanyakan kata, dan gerbang yang menghijau justru karena halamannya lenyap
  // adalah gerbang yang berbohong.
  const missing = [...BUDGETS.keys()].filter((route) => !counted.has(route));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} rute berplafon tidak ada di ${BUILD_DIR}:\n` +
        missing.map((route) => `    /${route}`).join("\n"),
    );
  }
});

check("D-11: setiap rute di bawah plafon katanya", () => {
  const over = measured.filter((entry) => entry.words > entry.budget);
  if (over.length > 0) {
    throw new Error(
      `${over.length} rute melewati plafon D-11:\n` +
        over
          .map(
            (entry) =>
              `    /${entry.route} = ${entry.words} kata ` +
              `(plafon ${entry.budget}, lebih ${entry.words - entry.budget})`,
          )
          .join("\n") +
        `\n    Plafon dinaikkan HANYA lewat docs/13-diet-tampilan.md D-11, ` +
        `tidak pernah lewat berkas ini.`,
    );
  }
});

/* Seluruh rute dicetak, bukan hanya yang gagal. Gerbang yang hanya bersuara saat
   merah tidak memberi tahu siapa pun seberapa dekat rute lain dengan plafonnya,
   sehingga pelanggaran berikutnya selalu datang sebagai kejutan. */
if (measured.length > 0) {
  console.log("\n  Kata terlihat per rute (kata / plafon):");
  for (const entry of [...measured].sort((a, b) => b.words - a.words)) {
    const status = entry.words > entry.budget ? "LEBIH" : "     ";
    const margin =
      entry.words > entry.budget
        ? `+${entry.words - entry.budget}`
        : `sisa ${entry.budget - entry.words}`;
    console.log(
      `    ${status}  ${String(entry.words).padStart(4)} / ` +
        `${String(entry.budget).padEnd(4)}  /${entry.route.padEnd(24)} ${margin}`,
    );
  }
  const total = measured.reduce((sum, entry) => sum + entry.words, 0);
  const budgeted = measured.reduce((sum, entry) => sum + entry.budget, 0);
  console.log(
    `\n  Total ${total} kata pada ${measured.length} rute berplafon ` +
      `(anggaran ${budgeted}).`,
  );
}

summary("Anggaran kata");
