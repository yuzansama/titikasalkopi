/**
 * Fungsi murni tanpa ketergantungan browser atau Supabase, supaya bisa diuji
 * dengan `node --test` (tests/unit.test.js).
 */

/** Alamat dasar yang dikodekan ke QR kemasan. Lihat web/src/data/qr.ts. */
export const QR_BASE = "https://titikasalkopi.vercel.app/q/";

export const PERAN_LABEL = { owner: "Owner", gudang: "PIC Gudang", sales: "PIC Sales" };

const KODE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** URL yang dikodekan ke QR untuk satu varian. */
export function qrUrl(kode) {
  return QR_BASE + kode;
}

/**
 * Ambil kode varian dari teks hasil scan. Menerima URL `/q/<kode>` dari host
 * mana pun (supaya QR tetap terbaca kalau suatu saat domain berganti) dan kode
 * polos. Mengembalikan null untuk teks lain.
 */
export function kodeDariScan(text) {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (KODE_RE.test(t) && t.length <= 40) return t;
  let path;
  try {
    path = new URL(t).pathname;
  } catch {
    return null;
  }
  const m = path.match(/^\/q\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  return m && m[1].length <= 40 ? m[1] : null;
}

/** "BOLD", "1 kg" -> "bold-1kg"; "100 gr" -> "100g". Saran kode untuk varian baru. */
export function saranKode(jenis, ukuran) {
  const slug = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\bgr(am)?\b/g, "g")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const u = slug(ukuran).replace(/(\d)-(g|kg)\b/g, "$1$2").replace(/,|\./g, "");
  return [slug(jenis), u].filter(Boolean).join("-");
}

export function rupiah(n) {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? "-Rp" : "Rp") + Math.abs(v).toLocaleString("id-ID");
}

/** "Rp45.000", "45.000", "45000" -> 45000. Teks tanpa angka -> null. */
export function parseRupiah(text) {
  const digits = String(text ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/** Awal hari lokal. */
export function awalHari(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function awalBulan(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function tambahHari(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Ringkasan penjualan dari baris `penjualan` beserta `penjualan_item`.
 * Uang = yang benar-benar diterima; nilai = harga katalog x jumlah.
 */
export function ringkasPenjualan(penjualan, sejak = null) {
  const perVarian = new Map();
  let uang = 0;
  let bungkus = 0;
  let nilai = 0;
  let transaksi = 0;
  for (const p of penjualan) {
    if (sejak && new Date(p.waktu) < sejak) continue;
    transaksi += 1;
    uang += p.uang_diterima;
    for (const it of p.penjualan_item ?? []) {
      bungkus += it.jumlah;
      nilai += it.jumlah * it.harga_satuan;
      const r = perVarian.get(it.kode_varian) ?? { bungkus: 0, nilai: 0 };
      r.bungkus += it.jumlah;
      r.nilai += it.jumlah * it.harga_satuan;
      perVarian.set(it.kode_varian, r);
    }
  }
  return { uang, bungkus, nilai, transaksi, perVarian };
}

/**
 * Perkiraan stok cukup berapa hari, dari rata-rata terjual per hari.
 * null bila tidak ada penjualan pada jendela itu.
 */
export function cukupHari(stok, terjualDalamJendela, hariJendela) {
  if (!terjualDalamJendela || terjualDalamJendela <= 0) return null;
  const perHari = terjualDalamJendela / hariJendela;
  return Math.max(0, Math.floor(stok / perHari));
}

/** Peringatan pesan ulang: hanya untuk varian yang pernah punya stok. */
export function perluPesan(v) {
  return v.aktif && v.total_masuk > 0 && v.stok <= v.batas_min;
}

/** Varian yang ditampilkan di daftar stok: pernah punya stok, atau stoknya tidak 0. */
export function adaStok(v) {
  return v.aktif && (v.total_masuk > 0 || v.stok !== 0);
}

export function formatWaktu(iso) {
  const d = new Date(iso);
  const hari = awalHari();
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (d >= hari) return jam;
  if (d >= tambahHari(hari, -1)) return `Kemarin ${jam}`;
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

export function tanggalPanjang(d = new Date()) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Pesan WhatsApp undangan. */
export function pesanUndangan({ nama, peran, kode, appUrl }) {
  return (
    `Halo ${nama}, kamu diundang ke app Stok Titik Asal Kopi sebagai ${PERAN_LABEL[peran] ?? peran}.\n\n` +
    `1. Buka ${appUrl}\n2. Pilih "Buat akun" dan isi email + password\n3. Masukkan kode undangan: ${kode}\n\n` +
    `Kode hanya bisa dipakai sekali dan berlaku 7 hari.`
  );
}

/** Pesan galat Supabase yang ramah. */
export function pesanGalat(error) {
  const msg = String(error?.message ?? error ?? "");
  if (/Invalid login credentials/i.test(msg)) return "Email atau password salah.";
  if (/User already registered/i.test(msg)) return "Email ini sudah punya akun. Pilih Masuk.";
  if (/Password should be at least/i.test(msg)) return "Password minimal 8 karakter.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Tidak ada koneksi. Coba lagi.";
  if (/row-level security|permission denied/i.test(msg)) return "Akunmu tidak punya izin untuk ini.";
  return msg || "Terjadi kesalahan.";
}

/**
 * Hitungan kas. Rumusnya sama persis dengan halaman /kas lama:
 * - belanja usaha = belanja yang dibebankan ke 'Bersama';
 * - uang di tangan = setoran + penjualan − belanja dibayar dari 'Kas' − talangan yang sudah dikembalikan;
 * - posisi tiap pemodal: (setoran + talangan) − (modal + kopi pribadi) − dikembalikan.
 *   Positif = talangannya belum dikembalikan, negatif = kurang setor;
 * - saldo usaha = uang di tangan + total kurang setor − total talangan belum balik.
 */
export function hitungKas({ penjualan, belanja, setoran, pengembalian, pemodal, po }) {
  const sum = (a, f) => a.reduce((s, r) => s + Number(f(r)), 0);
  const B = belanja.filter((b) => b.masuk_hitungan !== false);
  const bersama = B.filter((b) => b.dibebankan_ke === "Bersama");
  const jual = sum(penjualan, (p) => p.uang_diterima);
  const setor = sum(setoran, (s) => s.jumlah);
  const usaha = sum(bersama, (b) => b.jumlah);
  const kembaliTotal = sum(pengembalian, (k) => k.jumlah);
  const uang = setor + jual - sum(B.filter((b) => b.dibayar_oleh === "Kas"), (b) => b.jumlah) - kembaliTotal;

  const rekap = pemodal.map(({ nama, modal }) => {
    const pribadi = sum(B.filter((b) => b.dibebankan_ke === nama), (b) => b.jumlah);
    const st = sum(setoran.filter((s) => s.nama === nama), (s) => s.jumlah);
    const tal = sum(B.filter((b) => b.dibayar_oleh === nama), (b) => b.jumlah);
    const kembali = sum(pengembalian.filter((k) => k.nama === nama), (k) => k.jumlah);
    const wajib = modal + pribadi;
    const keluar = st + tal;
    const selisih = keluar - wajib - kembali;
    return {
      nama, modal, pribadi, wajib, setor: st, talangan: tal, keluar, kembali, selisih,
      status: selisih > 0 ? "Belum dikembalikan" : selisih < 0 ? "Kurang setor" : "Lunas",
    };
  });
  const piutang = rekap.reduce((s, r) => s + Math.max(0, r.selisih), 0);
  const kurang = rekap.reduce((s, r) => s + Math.max(0, -r.selisih), 0);
  const saldo = uang + kurang - piutang;

  const kopi = B.filter((b) => b.kategori === "Kopi");
  const awalBatch1 = (b) => b.batch === "0" || b.batch === "1";
  const kopi1 = sum(bersama.filter((b) => b.kategori === "Kopi" && awalBatch1(b)), (b) => b.jumlah);
  const stok2 = sum(kopi.filter((b) => !awalBatch1(b)), (b) => b.jumlah);
  const alat = sum(B.filter((b) => b.kategori !== "Kopi"), (b) => b.jumlah);
  const totalBelanja = sum(B, (b) => b.jumlah);

  const grupMap = new Map();
  for (const b of B) {
    const k = b.kategori === "Kopi" ? `Kopi ${b.sumber ?? ""}`.trim() : b.item;
    const g = grupMap.get(k) ?? { kelompok: k, kategori: b.kategori, jumlah: 0 };
    g.jumlah += b.jumlah;
    grupMap.set(k, g);
  }
  const grup = [...grupMap.values()].sort((a, b) =>
    a.kategori === b.kategori ? b.jumlah - a.jumlah : a.kategori === "Kopi" ? -1 : 1,
  );
  const poBaris = (po ?? []).map((p) => ({
    ...p,
    belanja: sum(kopi.filter((b) => b.batch === p.batch), (b) => b.jumlah),
  }));

  return {
    jual, jualCount: penjualan.length, setor, usaha, kembaliTotal, uang, rekap, piutang, kurang, saldo,
    modalTotal: sum(pemodal, (p) => p.modal), kopiTotal: sum(kopi, (b) => b.jumlah), alat, totalBelanja,
    pribadi: totalBelanja - usaha, kopi1, untungKotor1: jual - kopi1, stok2, grup, po: poBaris,
  };
}

/** "+Rp1.000", "−Rp1.000", "Rp0". */
export function bertanda(n) {
  return (n > 0 ? "+" : n < 0 ? "−" : "") + rupiah(Math.abs(n));
}
