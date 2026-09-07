import type { ReactNode } from "react";

/**
 * Pembatas lebar baca. Mobile-first: padding 20 px di HP, melebar bertahap.
 * Tidak ada lebar tetap di mana pun supaya tidak ada penggeseran horizontal
 * pada 320–1920 px (NFR-05).
 */
export function Container({
  children,
  className = "",
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "prose";
}) {
  const max = width === "prose" ? "max-w-3xl" : "max-w-6xl";
  return (
    <div className={`mx-auto w-full ${max} px-5 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

/** Judul bagian dengan struktur heading yang konsisten (h2 + kalimat pengantar). */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  id?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-2 font-display text-2xl font-semibold text-primary sm:text-3xl"
      >
        {title}
      </h2>
      {lead ? <p className="mt-3 text-olive">{lead}</p> : null}
    </div>
  );
}
