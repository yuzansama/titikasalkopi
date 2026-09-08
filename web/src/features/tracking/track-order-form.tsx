"use client";

/**
 * Formulir lacak pesanan (FR-51).
 *
 * Satu-satunya tempat di situs ini yang menampilkan data dari luar repositori.
 * Karena itu setiap jalur keluar ditulis eksplisit: ketemu, tidak ketemu,
 * status tak dikenal, belum aktif, jaringan gagal, waktu habis. Tidak ada
 * cabang yang berakhir diam — halaman yang diam saat gagal terbaca sebagai
 * "pesanan Anda tidak ada".
 */

import { useId, useState } from "react";
import { buttonClass, CARD, FOCUS_RING } from "@/components/ui/styles";
import { waLink } from "@/lib/site";
import {
  INPUT_PROBLEM_MESSAGES,
  isStale,
  lookupOrder,
  ORDER_STATUSES,
  STALE_AFTER_DAYS,
  validateLookupInput,
  type LookupResult,
} from "@/lib/tracking";

type ViewState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "input-invalid"; message: string }
  | { phase: "done"; result: LookupResult };

export function TrackOrderForm() {
  const codeId = useId();
  const last4Id = useId();
  const [code, setCode] = useState("");
  const [last4, setLast4] = useState("");
  const [view, setView] = useState<ViewState>({ phase: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validateLookupInput(code, last4);
    if (!validated.ok) {
      setView({
        phase: "input-invalid",
        message: INPUT_PROBLEM_MESSAGES[validated.problem],
      });
      return;
    }

    setView({ phase: "checking" });
    const result = await lookupOrder(validated.code, validated.last4);
    setView({ phase: "done", result });
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={codeId} className="block font-medium text-primary">
              Kode order
            </label>
            <p id={`${codeId}-hint`} className="mt-1 text-sm text-olive">
              Ada di pesan WhatsApp yang Anda kirim, bentuknya TAK-260908-K7Q2.
            </p>
            <input
              id={codeId}
              name="code"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${codeId}-hint`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="TAK-260908-K7Q2"
              className={`mt-2 w-full rounded-md border-2 border-primary bg-surface px-3 py-2 font-mono text-primary uppercase placeholder:normal-case placeholder:text-olive/60 ${FOCUS_RING}`}
            />
          </div>

          <div>
            <label htmlFor={last4Id} className="block font-medium text-primary">
              4 digit terakhir nomor WhatsApp
            </label>
            <p id={`${last4Id}-hint`} className="mt-1 text-sm text-olive">
              Nomor yang Anda pakai memesan. Dipakai supaya pesanan orang lain
              tidak bisa dibuka dengan menebak kode.
            </p>
            <input
              id={last4Id}
              name="last4"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              aria-describedby={`${last4Id}-hint`}
              value={last4}
              onChange={(event) =>
                setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="9567"
              className={`mt-2 w-full rounded-md border-2 border-primary bg-surface px-3 py-2 font-mono text-primary placeholder:text-olive/60 ${FOCUS_RING}`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={view.phase === "checking"}
          className={`mt-6 ${buttonClass("primary", "lg")} disabled:opacity-60`}
        >
          {view.phase === "checking" ? "Mencari…" : "Lacak pesanan"}
        </button>
      </form>

      {/* Satu wilayah aria-live untuk SELURUH hasil, termasuk galat masukan:
          pembaca layar mengumumkan perubahannya tanpa fokus berpindah. */}
      <div className="mt-8" aria-live="polite">
        <ResultBlock view={view} />
      </div>
    </div>
  );
}

function ResultBlock({ view }: { view: ViewState }) {
  if (view.phase === "idle") return null;

  if (view.phase === "checking") {
    return <p className="text-olive">Mencari pesanan Anda…</p>;
  }

  if (view.phase === "input-invalid") {
    return <Notice tone="warn">{view.message}</Notice>;
  }

  const { result } = view;

  switch (result.kind) {
    case "found":
      return <OrderCard result={result} />;

    case "not-found":
      return (
        <Notice tone="warn">
          Pesanan dengan kode dan nomor itu tidak ditemukan. Periksa lagi
          salinannya, atau tanyakan langsung lewat{" "}
          <WaLink>WhatsApp</WaLink>. Pesanan yang baru saja dikirim juga bisa
          belum tercatat.
        </Notice>
      );

    // Owner salah mengetik slug status di sheet. Menampilkan apa adanya jauh
    // lebih jujur daripada memetakannya ke status terdekat.
    case "unknown-status":
      return (
        <Notice tone="warn">
          Pesanan ini ada, tetapi statusnya tertulis &ldquo;{result.raw}&rdquo;
          dan belum kami kenali. Tanyakan lewat <WaLink>WhatsApp</WaLink> supaya
          dapat jawaban pasti.
        </Notice>
      );

    case "not-configured":
      return (
        <Notice tone="warn">
          Pelacakan otomatis belum aktif. Untuk sementara, tanyakan status
          pesanan Anda lewat <WaLink>WhatsApp</WaLink> dengan menyebut kode
          order.
        </Notice>
      );

    case "error":
      return (
        <Notice tone="warn">
          {result.reason === "waktu-habis"
            ? "Pencarian terlalu lama dan dihentikan. Coba lagi sebentar."
            : "Status tidak bisa diambil sekarang."}{" "}
          Ini gangguan di sisi kami, bukan tanda pesanan Anda bermasalah.
          Anda selalu bisa bertanya lewat <WaLink>WhatsApp</WaLink>.
        </Notice>
      );
  }
}

function OrderCard({
  result,
}: {
  result: Extract<LookupResult, { kind: "found" }>;
}) {
  const { order } = result;
  const status = ORDER_STATUSES[order.status];
  const stale = isStale(order);

  return (
    <div className={`${CARD} p-5`}>
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-rust">
        {order.code}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-primary">
        {status.label}
      </h2>
      <p className="mt-1 text-olive">{status.detail}</p>

      <dl className="mt-5 space-y-3 border-t border-primary/10 pt-5">
        {order.items ? <Row label="Pesanan" value={order.items} /> : null}
        {order.orderedAt ? (
          <Row label="Tanggal pesan" value={order.orderedAt} />
        ) : null}
        {order.courier ? <Row label="Kurir" value={order.courier} /> : null}
        {order.trackingNumber ? (
          <Row label="Nomor resi" value={order.trackingNumber} mono />
        ) : null}
        {order.statusUpdatedAt ? (
          <Row label="Status diperbarui" value={order.statusUpdatedAt} />
        ) : null}
      </dl>

      {stale ? (
        <p className="mt-5 rounded-md bg-coffee px-4 py-3 text-[0.95rem] text-cream">
          Status ini belum diperbarui lebih dari {STALE_AFTER_DAYS} hari, jadi
          mungkin sudah tidak mutakhir. Tanyakan lewat{" "}
          <WaLink tone="dark">WhatsApp</WaLink> untuk kepastian.
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-olive">{label}</dt>
      <dd className={`text-primary sm:text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warn";
  children: React.ReactNode;
}) {
  // Cream di coffee = 7,04:1. Emas DILARANG untuk teks berukuran normal
  // (docs/04-frontend.md Bagian 11.4).
  return (
    <p
      className={`rounded-md px-4 py-3 text-[0.95rem] ${
        tone === "warn" ? "bg-coffee text-cream" : ""
      }`}
    >
      {children}
    </p>
  );
}

function WaLink({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <a
      href={waLink("Halo, saya ingin menanyakan status pesanan saya.")}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-sm underline underline-offset-4 ${
        tone === "dark" ? "text-cream" : "text-rust"
      } ${FOCUS_RING}`}
    >
      {children}
    </a>
  );
}
