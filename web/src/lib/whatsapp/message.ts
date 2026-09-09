/**
 * Generator pesan WhatsApp (ADR-11, Bagian 7 arsitektur).
 *
 * SATU-SATUNYA tempat format pesan pesanan didefinisikan (BRD 11.2). Seluruh
 * fungsi di sini murni: tanpa `window`, tanpa `Date.now()` implisit, tanpa
 * state React. Kode order dan URL sumber disuntikkan lewat payload sehingga
 * hasilnya deterministik dan dapat diuji tanpa merender UI.
 *
 * Impor sengaja RELATIF (`../format`, `../site`) dan bukan lewat alias `@/`,
 * supaya berkas ini bisa dimuat apa adanya oleh skrip pemeriksaan
 * `scripts/check-whatsapp.mjs` tanpa resolver alias.
 */

import { formatIDR, formatQuantity } from "../format";
import { site, whatsapp } from "../site";
import type {
  AskInquiryPayload,
  B2BInquiryPayload,
  OrderInquiryPayload,
  WhatsAppMessage,
} from "./types";
import type { ResolvedCartLine } from "@/data/types";

/** NFR-15: panjang maksimum SETELAH pengodean URL. */
export const WA_MAX_ENCODED_LENGTH = 1500;

const OPENING = `Halo ${site.name}, saya ingin memesan:`;
/** BR-18: ongkir tidak pernah diklaim sudah termasuk. */
const SHIPPING_NOTICE =
  "(Belum termasuk ongkos kirim. Total akhir dikonfirmasi lewat chat.)";
/**
 * FR-24. Penanda sumber ditanam di BADAN pesan, bukan sebagai parameter UTM:
 * `wa.me` membuang seluruh query selain `text`, jadi UTM tidak pernah sampai
 * ke owner. Baris inilah satu-satunya cara owner tahu order datang dari situs.
 */
const SOURCE_MARKER = `Dikirim dari ${site.domain}`;

function encodedLength(text: string): number {
  return encodeURIComponent(text).length;
}

/** Sama dengan `waLink()` di `lib/site.ts`; ditulis lokal agar tetap murni. */
function toUrl(text: string): string {
  return `${whatsapp.link}?text=${encodeURIComponent(text)}`;
}

/**
 * Harga satuan siap tampil — SELALU harga satu kemasan.
 *
 * Sebelum 9 September 2026 houseblend menampilkan tarif per kg di sini,
 * sementara subtotalnya dihitung dari harga kemasan 0,5 kg. Begitu kedua angka
 * itu berhenti berhubungan, pesan yang diterima pembeli tidak lagi bisa
 * dijumlahkan sendiri: "5 kg x Rp205.000/kg" di atas "Subtotal Rp1.150.000".
 * Sekarang satu-satunya angka satuan yang boleh muncul adalah yang dikalikan
 * dengan jumlah kemasan untuk menghasilkan subtotal di baris berikutnya.
 */
function unitPriceLabel(line: ResolvedCartLine): string {
  return formatIDR(line.unitPrice);
}

/** Bentuk penuh sesuai BRD 11.2. */
function fullLine(line: ResolvedCartLine, index: number): string {
  return [
    `${index + 1}. ${line.productName} (${line.categoryLabel})`,
    `   Varian: ${line.variantLabel}`,
    `   Jumlah: ${formatQuantity(line.qty, line.unit)} x ${unitPriceLabel(line)}`,
    `   Subtotal: ${formatIDR(line.lineTotal)}`,
  ].join("\n");
}

/** Bentuk ringkas, dipakai hanya bila bentuk penuh melewati batas NFR-15. */
function compactLine(line: ResolvedCartLine, index: number): string {
  return (
    `${index + 1}. ${line.productName} — ${line.variantLabel} — ` +
    `${formatQuantity(line.qty, line.unit)} x ${unitPriceLabel(line)} = ` +
    `${formatIDR(line.lineTotal)}`
  );
}

type LineRenderer = (line: ResolvedCartLine, index: number) => string;

function assemble(
  payload: OrderInquiryPayload,
  renderLine: LineRenderer,
  maxLines: number,
  noteLimit: number,
): string {
  const shown = payload.lines.slice(0, maxLines);
  const hidden = payload.lines.length - shown.length;

  const blocks: string[] = [
    OPENING,
    `Kode order: ${payload.orderCode}`,
    shown.map(renderLine).join(renderLine === fullLine ? "\n\n" : "\n"),
  ];

  if (hidden > 0) {
    blocks.push(`(+${hidden} item lainnya — rinciannya saya kirim menyusul.)`);
  }

  blocks.push(`Subtotal pesanan: ${formatIDR(payload.subtotal)}\n${SHIPPING_NOTICE}`);

  const note = payload.note.trim().slice(0, noteLimit);
  if (note) blocks.push(`Catatan: ${note}`);

  blocks.push(`${SOURCE_MARKER}\n${payload.sourceUrl}`);

  return blocks.filter((block) => block.length > 0).join("\n\n");
}

/**
 * FR-22, FR-23, FR-24 — pesan checkout dari keranjang.
 *
 * Tangga peringkasan NFR-15. Blok yang TIDAK PERNAH dibuang pada tingkat mana
 * pun: salam, kode order, subtotal, pernyataan ongkir, dan penanda sumber —
 * kelimanya wajib menurut BRD 11.2 dan menjadi dasar KPI G-01/G-04.
 *
 * Urutan pemangkasan sengaja dimulai dari BENTUK BARIS, bukan dari membuang
 * item: satu baris baru menjadi tiga karakter (`%0A`) setelah dikodekan,
 * sehingga bentuk penuh yang lapang berbiaya besar terhadap anggaran 1.500.
 */
export function buildOrderMessage(payload: OrderInquiryPayload): WhatsAppMessage {
  const n = payload.lines.length;

  const ladder: Array<{
    render: LineRenderer;
    maxLines: number;
    noteLimit: number;
  }> = [
    { render: fullLine, maxLines: n, noteLimit: 200 }, // 1. bentuk penuh
    { render: compactLine, maxLines: n, noteLimit: 200 }, // 2. rincian diringkas
    { render: compactLine, maxLines: n, noteLimit: 80 }, // 3. catatan dipangkas
    { render: compactLine, maxLines: 8, noteLimit: 80 }, // 4. item dibatasi
    { render: compactLine, maxLines: 4, noteLimit: 60 }, // 5. batas terakhir
  ];

  let text = "";
  let truncated = false;

  for (let i = 0; i < ladder.length; i += 1) {
    const step = ladder[i];
    text = assemble(payload, step.render, step.maxLines, step.noteLimit);
    truncated = i > 0;
    if (encodedLength(text) <= WA_MAX_ENCODED_LENGTH) break;
  }

  return {
    text,
    url: toUrl(text),
    encodedLength: encodedLength(text),
    truncated,
    orderCode: payload.orderCode,
  };
}

/** FR-38 — "Tanya produk ini". Tanpa kode order, karena belum ada pesanan. */
export function buildAskMessage(payload: AskInquiryPayload): WhatsAppMessage {
  const price = `${formatIDR(payload.unitPrice)} / ${payload.variantLabel}`;

  const text = [
    `Halo ${site.name}, saya ingin bertanya tentang ${payload.productName} (${payload.categoryLabel}) — ${payload.variantLabel}, ${price}.`,
    `${SOURCE_MARKER}\n${payload.sourceUrl}`,
  ].join("\n\n");

  return {
    text,
    url: toUrl(text),
    encodedLength: encodedLength(text),
    truncated: false,
    orderCode: "",
  };
}

/** FR-30 (Fase 1b) — CTA konsultasi blend untuk segmen kedai. */
export function buildB2BMessage(payload: B2BInquiryPayload): WhatsAppMessage {
  const text = [
    `Halo ${site.name}, saya dari kedai dan ingin berdiskusi soal ${payload.lineName} untuk kebutuhan rutin per kilogram.`,
    `${SOURCE_MARKER}\n${payload.sourceUrl}`,
  ].join("\n\n");

  return {
    text,
    url: toUrl(text),
    encodedLength: encodedLength(text),
    truncated: false,
    orderCode: "",
  };
}
