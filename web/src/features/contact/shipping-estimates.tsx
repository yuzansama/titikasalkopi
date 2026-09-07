/**
 * Perkiraan ongkos kirim (FR-26, BR-18).
 *
 * Server Component murni — tidak ada `"use client"`, tidak ada state, tidak
 * ada efek. Isinya konstanta build-time, jadi blok ini tidak menambah satu
 * byte pun ke bundel klien meski dipasang di dalam halaman keranjang yang
 * kolomnya Client Component: `/keranjang/page.tsx` mengirimnya sebagai props
 * `ReactNode`, pola yang sama dengan `<OrderSteps />` (Bagian 9.4).
 *
 * Angka datang dari `shippingEstimates` di `@/lib/site` dan diformat lewat
 * `formatIDR()`. Tidak ada rupiah yang ditulis sebagai teks di berkas ini.
 *
 * Kenapa ada baris tanpa angka. Owner memberi perkiraan untuk Jabodetabek dan
 * luar Jawa saja. Jawa di luar Jabodetabek ditampilkan APA ADANYA sebagai
 * "dikonfirmasi lewat WhatsApp", bukan disembunyikan dan bukan ditebak:
 * menghilangkannya membuat pembeli di sana mengira salah satu angka lain
 * berlaku untuknya, dan menebaknya membuat ia berpatokan pada angka yang
 * nanti tidak ditagihkan.
 */

import { formatIDR } from "@/lib/format";
import {
  shippingDisclaimer,
  shippingEstimates,
  shippingQuoteOnRequest,
} from "@/lib/site";

/**
 * Satu-satunya tempat baris tabel dirakit, dipakai kedua varian tampilan.
 * "mulai dari" melekat pada angkanya supaya perkiraan tidak pernah terbaca
 * sebagai harga tetap, di mana pun baris ini muncul.
 */
const ROWS: ReadonlyArray<{ id: string; region: string; value: string }> = [
  ...shippingEstimates.map((estimate) => ({
    id: estimate.id,
    region: estimate.region,
    value: `mulai dari ${formatIDR(estimate.fromIDR)}`,
  })),
  {
    id: shippingQuoteOnRequest.id,
    region: shippingQuoteOnRequest.region,
    value: shippingQuoteOnRequest.note,
  },
];

/**
 * Daftar wilayah dan biayanya.
 *
 * `<dl>` dipakai karena hubungannya memang istilah-dan-keterangan; pembaca
 * layar membacakan wilayah lalu biayanya sebagai satu pasangan. Wilayah
 * memakai `text-olive` (8,40:1 di cream) dan nilainya `text-primary`
 * (14,74:1) — keduanya lulus AA untuk teks normal. Gold tidak dipakai di
 * sini karena ukurannya teks normal (Bagian 11.4).
 */
function EstimateRows({ textClass }: { textClass: string }) {
  return (
    <dl className={`space-y-1.5 ${textClass}`}>
      {ROWS.map((row) => (
        <div key={row.id} className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-olive">{row.region}</dt>
          <dd className="font-medium text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Bentuk ringkas untuk kolom checkout keranjang — menggantikan kalimat lama
 * yang hanya memperingatkan bahwa ongkir belum termasuk. Peringatan itu tetap
 * ada di kalimat pembuka, tetapi kini disusul angkanya, tepat di tempat
 * pembeli berhenti karena tidak tahu totalnya.
 */
export function ShippingEstimateNote({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-olive">
        Belum termasuk ongkos kirim. Perkiraan ongkir:
      </p>
      <EstimateRows textClass="mt-2 text-sm" />
      <p className="mt-2 text-sm text-olive">{shippingDisclaimer}</p>
    </div>
  );
}

/**
 * Bentuk penuh untuk halaman Kontak — bagian dari hal yang perlu diketahui
 * pembeli sebelum ia mengirim pertanyaan.
 */
export function ShippingEstimates({
  headingLevel = "h2",
  className = "",
}: {
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section className={className} aria-labelledby="ongkos-kirim">
      <Heading
        id="ongkos-kirim"
        className="font-display text-xl font-semibold text-primary sm:text-2xl"
      >
        Perkiraan ongkos kirim
      </Heading>
      <p className="mt-3 text-[0.95rem] text-olive">
        Supaya Anda punya gambaran biaya sebelum bertanya. Sebutkan kota tujuan
        saat menghubungi kami dan kami kirimkan angka pastinya.
      </p>
      <EstimateRows textClass="mt-4 text-[0.95rem]" />
      <p className="mt-4 text-[0.95rem] text-olive">{shippingDisclaimer}</p>
    </section>
  );
}
