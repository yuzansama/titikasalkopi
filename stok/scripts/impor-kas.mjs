/**
 * Impor penjualan dari halaman /kas (web/public/kas/index.html) ke database stok.
 *
 *   node scripts/impor-kas.mjs [kas.html] > /tmp/impor.sql   # SQL ke stdout, laporan ke stderr
 *
 * Halaman /kas sudah dihapus dari web setelah diimpor (21 Nov 2026). Untuk
 * menjalankan ulang, ambil dari riwayat git:
 *   git show 3e2dd65:web/public/kas/index.html > /tmp/kas.html
 *
 * Selain penjualan, skrip ini juga mengimpor bagian kas: pemodal, daftar PO,
 * belanja, setoran modal, dan pengembalian talangan.
 *
 * SQL-nya bisa dijalankan ulang: penjualan impor lama dihapus dulu, lalu
 * seluruh isi /kas dimasukkan lagi dalam satu transaksi. Penjualan impor
 * ditandai `impor = true` sehingga TIDAK mengurangi stok (kopinya dari batch
 * sebelum app dipakai) tetapi tetap masuk hitungan uang dan bungkus terjual.
 *
 * Rincian lama memakai nama sebelum BOLD/BRIGHT. Pemetaannya dicocokkan dengan
 * harga: Arabica / Full Arabica / Bright = BRIGHT (100 gr Rp55.000, 200 gr
 * Rp95.000); Bold / Blend / Houseblend / Robusta = BOLD (100 gr Rp45.000).
 * Single origin dipetakan lewat namanya; "Single Origin Papua" = Sabin, satu-
 * satunya single origin Papua di stok awal (invoice Santana 3 Okt).
 * Yang tidak bisa dipetakan (1 kg, "Kopi", tanpa keterangan) tetap diimpor
 * uangnya, tanpa baris varian, sehingga total uang sama dengan /kas.
 *
 * Stok: untuk setiap varian, barang masuk impor ("stok awal") = jumlah yang
 * terjual di /kas. Asumsinya seluruh stok lama sudah terjual, jadi stok
 * setelah impor tepat 0 dan sisa yang masih dipegang dicatat lewat app.
 */
import { readFileSync } from "node:fs";

const KAS = new URL("../../web/public/kas/index.html", import.meta.url);

export function bacaKas(html) {
  const m = html.match(/<script id="kas-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("kas-data tidak ditemukan di halaman /kas");
  const kas = JSON.parse(m[1]);
  // Daftar pemodal dan modal per orang tertulis di skrip halaman, bukan di kas-data.
  const inv = html.match(/var INVESTOR = (\[[^\]]*\]);/);
  const modal = html.match(/var MODAL = (\d+);/);
  kas.pemodal = inv ? JSON.parse(inv[1].replace(/'/g, '"')) : [];
  kas.modal = modal ? Number(modal[1]) : 500000;
  return kas;
}

/** [pola nama, slug produk web]. Papua = Sabin (lihat komentar di atas). */
const SINGLE_ORIGIN = [
  [/oelbiteno/, "oelbiteno"],
  [/abmisibil/, "abmisibil"],
  [/sabin|papua/, "sabin"],
  [/pyramid/, "pyramid"],
  [/palimping/, "palimping"],
  [/kerinci/, "kerinci"],
  [/pondok\s*baru/, "pondok-baru"],
  [/sindoro/, "sindoro"],
  [/peneli/, "peneli"], // di luar katalog web; halaman /q-nya di web/src/data/qr.ts
];

/** Kode varian = id varian di katalog web. */
function kodeVarian(jenis, ukuran) {
  if (jenis === "bold" || jenis === "bright") return `${jenis}-${ukuran}g`;
  return `${jenis}-${ukuran === "100" ? "mini1" : "pack1"}`;
}

/** Rincian bebas -> [{ kode, jumlah }]. Bagian yang tidak dikenali dilewati. */
export function petakanRincian(rincian) {
  const hasil = new Map();
  let jenisSebelumnya = null;
  for (const mentah of String(rincian).toLowerCase().split(/[,+]/)) {
    const bagian = mentah.trim();
    if (!bagian) continue;
    if (/\b1\s*kg\b|giling/.test(bagian)) {
      jenisSebelumnya = null;
      continue;
    }
    let jenis = null;
    const so = SINGLE_ORIGIN.find(([re]) => re.test(bagian));
    if (so) jenis = so[1];
    else if (/single origin/.test(bagian)) jenis = null;
    else if (/arabica|bright/.test(bagian)) jenis = "bright";
    else if (/bold|blend|robusta/.test(bagian)) jenis = "bold";
    const ukuran = bagian.match(/\b(100|200)\s*g/)?.[1];
    if (!jenis && ukuran && jenisSebelumnya) jenis = jenisSebelumnya; // "Full Arabica 100g x1, 200g x1"
    jenisSebelumnya = jenis;
    if (!jenis || !ukuran) continue;
    const qty = Number(bagian.match(/x\s*(\d+)/)?.[1] ?? bagian.match(/^(\d+)\s/)?.[1] ?? 1);
    const kode = kodeVarian(jenis, ukuran);
    hasil.set(kode, (hasil.get(kode) ?? 0) + qty);
  }
  return [...hasil].map(([kode, jumlah]) => ({ kode, jumlah }));
}

const lit = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);

const angka = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`bukan angka: ${v}`);
  return n;
};

/** Pemodal, PO, belanja, setoran, dan pengembalian talangan (bagian kas). */
export function sqlKas(kas) {
  const out = [];
  if (!kas.belanja && !kas.setoran && !kas.pengembalian) return out;
  out.push(
    "  delete from public.pengembalian where impor;",
    "  delete from public.setoran where impor;",
    "  delete from public.belanja where impor;",
  );
  (kas.pemodal ?? []).forEach((nama, i) => {
    out.push(
      `  insert into public.pemodal (nama, modal, urutan) values (${lit(nama)}, ${angka(kas.modal)}, ${i}) on conflict (nama) do update set modal = excluded.modal, urutan = excluded.urutan;`,
    );
  });
  (kas.po ?? []).forEach((p, i) => {
    out.push(
      `  insert into public.po (batch, kg, status, urutan) values (${lit(p.batch)}, ${angka(p.kg)}, ${lit(p.status)}, ${i}) on conflict (batch) do update set kg = excluded.kg, status = excluded.status, urutan = excluded.urutan;`,
    );
  });
  for (const b of kas.belanja ?? []) {
    if (angka(b.jumlah) !== angka(b.qty) * angka(b.harga)) throw new Error(`belanja #${b.no}: jumlah bukan qty x harga`);
    const batch = b.batch && b.batch !== "-" ? b.batch : null;
    out.push(
      `  insert into public.belanja (item, sumber, kategori, batch, qty, harga, dibayar_oleh, dibebankan_ke, masuk_hitungan, catatan, impor, oleh) values (${lit(b.item)}, ${lit(b.sumber || null)}, ${lit(b.kategori)}, ${lit(batch)}, ${angka(b.qty)}, ${angka(b.harga)}, ${lit(b.dibayar_oleh)}, ${lit(b.dibebankan_ke)}, ${b.masuk_hitungan === "Ya"}, ${lit(b.catatan || null)}, true, pemilik);`,
    );
  }
  for (const t of kas.setoran ?? []) {
    out.push(
      `  insert into public.setoran (nama, jumlah, keterangan, impor, oleh) values (${lit(t.nama)}, ${angka(t.jumlah)}, ${lit(t.keterangan || null)}, true, pemilik);`,
    );
  }
  for (const k of kas.pengembalian ?? []) {
    out.push(
      `  insert into public.pengembalian (nama, jumlah, keterangan, impor, oleh) values (${lit(k.nama)}, ${angka(k.jumlah)}, ${lit(k.keterangan || null)}, true, pemilik);`,
    );
  }
  return out;
}

export function buatSql(kas) {
  const baris = [
    "begin;",
    "delete from public.penjualan where impor;",
    "delete from public.barang_masuk where impor;",
    "do $$ declare pid bigint; pemilik uuid; begin",
    "  select user_id into pemilik from public.anggota where peran = 'owner' and aktif order by bergabung_at limit 1;",
    "  if pemilik is null then raise exception 'Belum ada owner aktif'; end if;",
  ];
  const laporan = [];
  const terjual = new Map();
  for (const p of kas.penjualan) {
    const items = petakanRincian(p.rincian);
    const catatan = [`Impor /kas #${p.no}`, p.rincian, p.metode, p.catatan].filter(Boolean).join(" · ").slice(0, 500);
    baris.push(
      `  insert into public.penjualan (uang_diterima, oleh, waktu, catatan, impor) values (${Number(p.total)}, pemilik, ${lit(`${p.tanggal}T12:00:00+07:00`)}, ${lit(catatan)}, true) returning id into pid;`,
    );
    for (const it of items) {
      terjual.set(it.kode, (terjual.get(it.kode) ?? 0) + it.jumlah);
      baris.push(
        `  insert into public.penjualan_item (penjualan_id, kode_varian, jumlah, harga_satuan) select pid, kode, ${it.jumlah}, harga from public.varian where kode = ${lit(it.kode)};`,
      );
    }
    laporan.push({ no: p.no, tanggal: p.tanggal, total: p.total, rincian: p.rincian, items });
  }
  baris.push(...sqlKas(kas));
  const awal = kas.penjualan.map((p) => p.tanggal).sort()[0];
  for (const [kode, jumlah] of terjual) {
    baris.push(
      `  insert into public.barang_masuk (kode_varian, jumlah, oleh, waktu, catatan, impor) values (${lit(kode)}, ${jumlah}, pemilik, ${lit(`${awal}T08:00:00+07:00`)}, 'Stok awal (asumsi: sama dengan yang terjual di /kas)', true);`,
    );
  }
  baris.push("end $$;", "commit;");
  return { sql: baris.join("\n"), laporan, stokAwal: Object.fromEntries(terjual) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kas = bacaKas(readFileSync(process.argv[2] ?? KAS, "utf8"));
  const { sql, laporan } = buatSql(kas);
  process.stdout.write(sql + "\n");
  const total = laporan.reduce((s, l) => s + l.total, 0);
  const bungkus = laporan.reduce((s, l) => s + l.items.reduce((a, i) => a + i.jumlah, 0), 0);
  for (const l of laporan) {
    const it = l.items.map((i) => `${i.jumlah}×${i.kode}`).join(", ") || "(hanya uang)";
    process.stderr.write(`#${l.no.padStart(2)} ${l.tanggal} ${String(l.total).padStart(7)}  ${it.padEnd(34)} ← ${l.rincian}\n`);
  }
  process.stderr.write(`\n${laporan.length} transaksi, total Rp${total.toLocaleString("id-ID")}, ${bungkus} bungkus terpetakan\n`);
}
