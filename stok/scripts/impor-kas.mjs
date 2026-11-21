/**
 * Impor penjualan dari halaman /kas (web/public/kas/index.html) ke database stok.
 *
 *   node scripts/impor-kas.mjs > /tmp/impor.sql   # SQL ke stdout, laporan ke stderr
 *
 * SQL-nya bisa dijalankan ulang: penjualan impor lama dihapus dulu, lalu
 * seluruh isi /kas dimasukkan lagi dalam satu transaksi. Penjualan impor
 * ditandai `impor = true` sehingga TIDAK mengurangi stok (kopinya dari batch
 * sebelum app dipakai) tetapi tetap masuk hitungan uang dan bungkus terjual.
 *
 * Rincian lama memakai nama sebelum BOLD/BRIGHT. Pemetaannya dicocokkan dengan
 * harga: Arabica / Full Arabica / Bright = BRIGHT (100 gr Rp55.000, 200 gr
 * Rp95.000); Bold / Blend / Houseblend / Robusta = BOLD (100 gr Rp45.000).
 * Yang tidak bisa dipetakan ke 4 varian (1 kg, single origin, "Kopi", tanpa
 * keterangan) tetap diimpor uangnya, tanpa baris varian.
 */
import { readFileSync } from "node:fs";

const KAS = new URL("../../web/public/kas/index.html", import.meta.url);

export function bacaKas(html) {
  const m = html.match(/<script id="kas-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("kas-data tidak ditemukan di halaman /kas");
  return JSON.parse(m[1]);
}

/** Rincian bebas -> [{ kode, jumlah }]. Bagian yang tidak dikenali dilewati. */
export function petakanRincian(rincian) {
  const hasil = new Map();
  let jenisSebelumnya = null;
  for (const mentah of String(rincian).toLowerCase().split(/[,+]/)) {
    const bagian = mentah.trim();
    if (!bagian) continue;
    if (/\b1\s*kg\b|single origin|giling|papua/.test(bagian)) {
      jenisSebelumnya = null;
      continue;
    }
    let jenis = null;
    if (/arabica|bright/.test(bagian)) jenis = "bright";
    else if (/bold|blend|robusta/.test(bagian)) jenis = "bold";
    const ukuran = bagian.match(/\b(100|200)\s*g/)?.[1];
    if (!jenis && ukuran && jenisSebelumnya) jenis = jenisSebelumnya; // "Full Arabica 100g x1, 200g x1"
    jenisSebelumnya = jenis;
    if (!jenis || !ukuran) continue;
    const qty = Number(bagian.match(/x\s*(\d+)/)?.[1] ?? bagian.match(/^(\d+)\s/)?.[1] ?? 1);
    const kode = `${jenis}-${ukuran}g`;
    hasil.set(kode, (hasil.get(kode) ?? 0) + qty);
  }
  return [...hasil].map(([kode, jumlah]) => ({ kode, jumlah }));
}

const lit = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);

export function buatSql(kas) {
  const baris = [
    "begin;",
    "delete from public.penjualan where impor;",
    "do $$ declare pid bigint; pemilik uuid; begin",
    "  select user_id into pemilik from public.anggota where peran = 'owner' and aktif order by bergabung_at limit 1;",
    "  if pemilik is null then raise exception 'Belum ada owner aktif'; end if;",
  ];
  const laporan = [];
  for (const p of kas.penjualan) {
    const items = petakanRincian(p.rincian);
    const catatan = [`Impor /kas #${p.no}`, p.rincian, p.metode, p.catatan].filter(Boolean).join(" · ").slice(0, 500);
    baris.push(
      `  insert into public.penjualan (uang_diterima, oleh, waktu, catatan, impor) values (${Number(p.total)}, pemilik, ${lit(`${p.tanggal}T12:00:00+07:00`)}, ${lit(catatan)}, true) returning id into pid;`,
    );
    for (const it of items) {
      baris.push(
        `  insert into public.penjualan_item (penjualan_id, kode_varian, jumlah, harga_satuan) select pid, kode, ${it.jumlah}, harga from public.varian where kode = ${lit(it.kode)};`,
      );
    }
    laporan.push({ no: p.no, tanggal: p.tanggal, total: p.total, rincian: p.rincian, items });
  }
  baris.push("end $$;", "commit;");
  return { sql: baris.join("\n"), laporan };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const kas = bacaKas(readFileSync(KAS, "utf8"));
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
