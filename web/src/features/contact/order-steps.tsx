/**
 * Blok "Cara pesan dalam 4 langkah" (FR-26). Server Component murni.
 *
 * Isi keempat langkah adalah pernyataan proses yang sudah ditetapkan BRD
 * (FR-22, FR-26, BR-18): tidak ada payment gateway di Fase 1, dan ongkir serta
 * total akhir dikonfirmasi lewat chat. Tidak ada klaim yang tidak disebutkan
 * brand brief maupun BRD.
 */

const STEPS: Array<{ title: string; detail: string }> = [
  {
    title: "Pilih kopi dan variannya",
    detail:
      "Tentukan single origin (1 pack atau 3 pack) atau houseblend per kilogram, lalu tambahkan ke keranjang.",
  },
  {
    title: "Periksa keranjang",
    detail:
      "Atur jumlah tiap item dan tulis catatan bila ada permintaan khusus, misalnya tingkat gilingan atau kota tujuan.",
  },
  {
    title: "Tekan Pesan via WhatsApp",
    detail:
      "Pesan sudah terisi lengkap beserta kode order. Anda tinggal menekan kirim di aplikasi WhatsApp.",
  },
  {
    title: "Konfirmasi lewat chat",
    detail:
      "Ongkos kirim dan total akhir dikonfirmasi lewat WhatsApp. Pembayaran tidak dilakukan di website ini.",
  },
];

export function OrderSteps({
  headingLevel = "h2",
  className = "",
}: {
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section className={className} aria-labelledby="cara-pesan">
      <Heading
        id="cara-pesan"
        className="font-display text-xl font-semibold text-primary sm:text-2xl"
      >
        Cara pesan dalam 4 langkah
      </Heading>
      <ol className="mt-4 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            {/* Angka gold berukuran display: 3,88:1 lulus ambang teks besar
                3:1 (Bagian 11.4 aturan 3). Ia dekoratif dan diulang oleh
                elemen <ol> untuk pembaca layar. */}
            <span
              aria-hidden="true"
              className="font-display text-3xl font-semibold leading-none text-gold"
            >
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-primary">{step.title}</p>
              <p className="mt-1 text-[0.95rem] text-olive">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-md bg-coffee px-4 py-3 text-[0.95rem] text-cream">
        Harga di keranjang belum termasuk ongkos kirim. Total akhir dan
        pembayaran dikonfirmasi lewat WhatsApp, bukan di website.
      </p>
    </section>
  );
}
