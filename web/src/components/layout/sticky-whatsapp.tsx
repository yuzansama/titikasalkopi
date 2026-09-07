import { WhatsAppIcon } from "@/components/icons/icons";
import { FOCUS_RING } from "@/components/ui/styles";
import { site, waLink } from "@/lib/site";

/**
 * Tombol WhatsApp yang selalu terjangkau ibu jari (FR-37). Server Component:
 * sebuah `<a>` biasa, nol JavaScript.
 *
 * Agar tidak menutupi isi halaman maupun tombol utama:
 * - hanya muncul di layar sempit (`lg:hidden`); di layar lebar CTA sudah selalu
 *   terlihat di dalam halaman;
 * - `layout.tsx` memberi `pb-24 lg:pb-0` pada wilayah konten sehingga selalu
 *   ada ruang kosong di bawah tombol;
 * - target 56 x 56 px, melewati ambang 44 x 44 px (NFR-05).
 *
 * Latar rust dengan ikon cream = 5,74:1 (lulus). `bg-gold` DILARANG di sini.
 */
export function StickyWhatsApp() {
  return (
    <a
      href={waLink(`Halo ${site.name}, saya ingin bertanya tentang kopi.`)}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-4 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-rust text-cream shadow-lg hover:bg-clay lg:hidden ${FOCUS_RING}`}
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="sr-only">Hubungi kami lewat WhatsApp</span>
    </a>
  );
}
