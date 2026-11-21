import { esc, PERAN_LABEL } from "./lib.js";

let toastTimer = null;
export function toast(text, { bad = false } = {}) {
  const el = document.getElementById("toast");
  el.innerHTML = `<div class="t${bad ? " bad" : ""}">${esc(text)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.innerHTML = ""), bad ? 5000 : 2600);
}

const I = {
  scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v7h-7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

/** Menu bawah per peran. Owner juga bisa membuka layar gudang dan sales lewat Ringkasan. */
export const MENU = {
  gudang: [
    ["#/gudang/scan", "Scan masuk", "scan"],
    ["#/gudang/stok", "Stok", "box"],
  ],
  sales: [
    ["#/sales/scan", "Scan jual", "scan"],
    ["#/sales/manual", "Manual", "pen"],
    ["#/sales/riwayat", "Riwayat", "clock"],
  ],
  owner: [
    ["#/owner/ringkasan", "Ringkasan", "chart"],
    ["#/owner/label", "Label QR", "qr"],
    ["#/owner/atur", "Atur", "gear"],
  ],
};

export function nav(peran, aktif) {
  const items = MENU[peran] ?? [];
  return `<nav class="nav" aria-label="Menu ${esc(PERAN_LABEL[peran] ?? "")}">${items
    .map(
      ([href, label, ic]) =>
        `<a href="${href}"${href === aktif ? ' aria-current="page"' : ""}>${icon(ic)}${esc(label)}</a>`,
    )
    .join("")}</nav>`;
}

export function topbar(ctx) {
  return `<div class="topbar"><span class="who">${esc(ctx.anggota.nama)} · ${esc(
    PERAN_LABEL[ctx.anggota.peran],
  )}</span><button type="button" class="linkbtn" data-act="keluar">Keluar</button></div>`;
}

/** Warna nama: BOLD karat, BRIGHT emas, single origin hijau zaitun. */
export function blendClass(jenis) {
  const j = String(jenis).toUpperCase();
  return j === "BRIGHT" ? "alt" : j === "BOLD" ? "bold" : "so";
}

export function namaVarian(v) {
  return `${v.jenis} · ${v.ukuran}`;
}

export function stokBar(v, skala) {
  const pct = (n) => Math.max(0, Math.min(100, (n / skala) * 100));
  const low = v.stok <= v.batas_min;
  return `<div class="track" aria-hidden="true"><span class="fill${low ? " low" : ""}" style="width:${pct(
    v.stok,
  )}%"></span><span class="min" style="left:${pct(v.batas_min)}%"></span></div>`;
}

/** Skala batang stok: cukup lebar untuk stok terbesar dan 2x batas. */
export function skalaStok(list) {
  return Math.max(1, ...list.map((v) => Math.max(v.stok, v.batas_min * 2)));
}
