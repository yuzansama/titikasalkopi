// 12-second vertical promo for one product: brand → product + origin → tasting notes → price + how to order.
// Colours and type follow docs/00-brand-brief.md. Content stays inside Instagram's safe area
// (clear of the top bar and the caption/buttons at the bottom).
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill, Easing, Img, Sequence, continueRender, delayRender, interpolate, spring,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { findProductBySlug, priceFrom, TIER_LABEL } from "@/data/catalog";

export const FPS = 30;
export const DURATION = 360; // 12 s

const B = {
  cream: "#F9F4EE", surface: "#FDF8F2", forest: "#0E251F", deep: "#063026", olive: "#474A2D",
  rust: "#A34215", clay: "#954E24", gold: "#AC6D04", espresso: "#2C1100",
};
const CONDENSED = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const DISPLAY = "Fraunces, Georgia, serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

// Contact details as published in docs/00-brand-brief.md.
const WHATSAPP = "0877-7793-9567";
const INSTAGRAM = "@Titikasalkopi";

// Placeholder artwork (web/public/produk/<slug>.svg) for products that have no photo yet.
const placeholders = require.context("@/../public/produk", false, /\.svg$/);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const fadeIn = (f, start, len = 14) => interpolate(f, [start, start + len], [0, 1], { ...clamp, easing: ease });
const rise = (f, start, len = 18, dist = 40) => interpolate(f, [start, start + len], [dist, 0], { ...clamp, easing: ease });
const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["700 80px 'Barlow Condensed'", "600 80px 'Barlow Condensed'", "600 80px Fraunces", "400 30px 'Plus Jakarta Sans'", "600 30px 'Plus Jakarta Sans'"]
      .map((f) => document.fonts.load(f)))
      .then(() => continueRender(handle), () => continueRender(handle));
  }, [handle]);
};

const imageOf = (product) => {
  const src = product.image?.src;
  if (src) return typeof src === "string" ? src : src.src; // next/image StaticImageData or a plain URL
  try { return placeholders(`./${product.slug}.svg`); } catch { return null; }
};

const categoryLabel = (p) =>
  p.category === "single-origin" ? `Single Origin · ${TIER_LABEL[p.tier] ?? ""}` : "Houseblend";

const originLine = (p) => {
  const o = p.origin;
  if (!o) return null;
  const parts = [[o.region, o.province].filter(Boolean).join(", ")];
  if (o.altitudeMasl) parts.push(`${o.altitudeMasl.toLocaleString("id-ID")} mdpl`);
  return parts.filter(Boolean).join(" · ");
};

/* A sequence that fades in and out over the shared background. */
const Part = ({ from, len, children, bg }) => (
  <Sequence from={from} durationInFrames={len}>
    <Fader len={len} bg={bg}>{children}</Fader>
  </Sequence>
);
const Fader = ({ len, bg, children }) => {
  const f = useCurrentFrame();
  const opacity = Math.min(fadeIn(f, 0, 10), interpolate(f, [len - 10, len], [1, 0], clamp));
  return <AbsoluteFill style={{ opacity, background: bg }}>{children}</AbsoluteFill>;
};

/* ---------- 1. Brand ---------- */
const Brand = ({ product }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: "250px 80px 420px" }}>
      <BeanMark size={120} color={B.gold} style={{ opacity: s, transform: `scale(${0.8 + 0.2 * s})` }} />
      <div style={{ font: `700 112px/0.95 ${CONDENSED}`, letterSpacing: "0.06em", color: B.cream, marginTop: 40, opacity: s }}>
        TITIK ASAL<br />KOPI
      </div>
      <div style={{ font: `600 40px ${CONDENSED}`, letterSpacing: "0.22em", textTransform: "uppercase", color: B.gold, marginTop: 44, opacity: fadeIn(f, 18) }}>
        {categoryLabel(product)}
      </div>
    </AbsoluteFill>
  );
};

const BeanMark = ({ size, color, style }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 80 100" style={style} aria-hidden="true">
    <ellipse cx="40" cy="50" rx="34" ry="46" fill={color} />
    <path d="M40 8 C 26 34, 54 62, 40 92" fill="none" stroke={B.forest} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

/* ---------- 2. Product + origin ---------- */
const Hero = ({ product }) => {
  const f = useCurrentFrame();
  const img = imageOf(product);
  const origin = originLine(product);
  const o = product.origin;
  return (
    <AbsoluteFill style={{ padding: "250px 80px 420px", alignItems: "center" }}>
      <div style={{ width: 760, height: 950 * (760 / 800), maxHeight: 820, borderRadius: 28, overflow: "hidden", boxShadow: "0 30px 70px -30px rgba(44,17,0,.55)", opacity: fadeIn(f, 0, 16), transform: `translateY(${rise(f, 0, 20, 50)}px)` }}>
        {img ? (
          <Img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${interpolate(f, [0, 150], [1.0, 1.07], clamp)})` }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: B.forest }} />
        )}
      </div>
      <div style={{ font: `600 96px/1.02 ${DISPLAY}`, color: B.forest, marginTop: 46, textAlign: "center", opacity: fadeIn(f, 14), transform: `translateY(${rise(f, 14)}px)` }}>
        {product.name}
      </div>
      {origin && (
        <div style={{ font: `600 36px ${BODY}`, color: B.rust, marginTop: 18, textAlign: "center", opacity: fadeIn(f, 26) }}>{origin}</div>
      )}
      {o?.process && (
        <div style={{ font: `400 32px ${BODY}`, color: B.olive, marginTop: 10, textAlign: "center", opacity: fadeIn(f, 34) }}>
          Proses {o.process}{o.varietals?.length ? ` · ${o.varietals.join(", ")}` : ""}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------- 3. Taste ---------- */
const Taste = ({ product }) => {
  const f = useCurrentFrame();
  const notes = product.tastingNotes ?? [];
  return (
    <AbsoluteFill style={{ padding: "250px 80px 420px", justifyContent: "center" }}>
      <div style={{ font: `700 46px ${CONDENSED}`, letterSpacing: "0.2em", color: B.gold, textTransform: "uppercase", opacity: fadeIn(f, 0) }}>
        {notes.length ? "Catatan rasa" : "Tentang kopi ini"}
      </div>
      {notes.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 40 }}>
          {notes.map((n, i) => (
            <div key={n} style={{
              alignSelf: "flex-start", font: `600 72px ${DISPLAY}`, color: B.cream, background: i % 2 ? B.clay : B.rust,
              padding: "18px 40px", borderRadius: 999, opacity: fadeIn(f, 8 + i * 9), transform: `translateX(${rise(f, 8 + i * 9, 18, -60)}px)`,
            }}>{n}</div>
          ))}
        </div>
      ) : (
        <div style={{ font: `400 52px/1.4 ${BODY}`, color: B.cream, marginTop: 36, opacity: fadeIn(f, 8) }}>{product.summary}</div>
      )}
    </AbsoluteFill>
  );
};

/* ---------- 4. Price + order ---------- */
const Order = ({ product }) => {
  const f = useCurrentFrame();
  const from = priceFrom(product);
  const variants = [...product.variants].sort((a, b) => a.unitPrice - b.unitPrice).slice(0, 3);
  const soldOut = product.status === "out-of-stock";
  return (
    <AbsoluteFill style={{ padding: "250px 80px 420px", justifyContent: "center" }}>
      <div style={{ font: `600 40px ${BODY}`, color: B.olive, opacity: fadeIn(f, 0) }}>{product.name} · mulai</div>
      <div style={{ font: `700 150px/1 ${CONDENSED}`, color: B.forest, marginTop: 6, opacity: fadeIn(f, 4), transform: `translateY(${rise(f, 4)}px)` }}>
        {rupiah(from)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
        {variants.map((v, i) => (
          <div key={v.id} style={{
            display: "flex", justifyContent: "space-between", gap: 20, padding: "22px 30px", borderRadius: 20,
            background: B.surface, border: `2px solid rgba(14,37,31,.12)`, opacity: fadeIn(f, 12 + i * 7),
          }}>
            <span style={{ font: `400 34px ${BODY}`, color: B.espresso }}>{v.label}</span>
            <span style={{ font: `700 40px ${CONDENSED}`, color: B.rust, whiteSpace: "nowrap" }}>{rupiah(v.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 50, padding: "30px 36px", borderRadius: 26, background: soldOut ? B.olive : B.forest, opacity: fadeIn(f, 34), transform: `scale(${0.96 + 0.04 * fadeIn(f, 34)})` }}>
        <div style={{ font: `700 56px ${CONDENSED}`, letterSpacing: "0.04em", color: B.cream }}>
          {soldOut ? "STOK SEDANG HABIS" : "PESAN VIA WHATSAPP"}
        </div>
        <div style={{ font: `600 44px ${BODY}`, color: B.gold, marginTop: 6 }}>{WHATSAPP}</div>
      </div>
      <div style={{ font: `600 34px ${BODY}`, color: B.olive, marginTop: 26, opacity: fadeIn(f, 44) }}>
        {INSTAGRAM} · Shopee: Titikasalkopi
      </div>
    </AbsoluteFill>
  );
};

export const ProductPromo = ({ slug }) => {
  useFonts();
  const product = findProductBySlug(slug);
  if (!product) throw new Error(`Unknown product slug: ${slug}`);
  return (
    <AbsoluteFill style={{ background: B.cream }}>
      <Part from={0} len={80} bg={B.forest}><Brand product={product} /></Part>
      <Part from={72} len={130} bg={B.cream}><Hero product={product} /></Part>
      <Part from={194} len={86} bg={B.deep}><Taste product={product} /></Part>
      <Part from={272} len={88} bg={B.cream}><Order product={product} /></Part>
    </AbsoluteFill>
  );
};
