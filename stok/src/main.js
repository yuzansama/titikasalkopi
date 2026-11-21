import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/fraunces";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./style.css";

import { api, sb } from "./api.js";
import { pesanGalat } from "./lib.js";
import { layarMasuk, layarNonaktif, layarUndangan } from "./screens/auth.js";
import { layarGudangScan, layarGudangStok } from "./screens/gudang.js";
import { layarKas } from "./screens/kas.js";
import { layarAtur, layarLabel, layarRingkasan } from "./screens/owner.js";
import { layarSalesManual, layarSalesRiwayat, layarSalesScan } from "./screens/sales.js";
import { MENU, toast } from "./ui.js";

const app = document.getElementById("app");

/** Rute -> [layar, peran yang boleh membuka]. Owner boleh membuka semuanya. */
const RUTE = {
  "#/gudang/scan": [layarGudangScan, ["gudang"]],
  "#/gudang/stok": [layarGudangStok, ["gudang"]],
  "#/sales/scan": [layarSalesScan, ["sales"]],
  "#/sales/manual": [layarSalesManual, ["sales"]],
  "#/sales/riwayat": [layarSalesRiwayat, ["sales"]],
  "#/owner/ringkasan": [layarRingkasan, []],
  "#/owner/kas": [layarKas, []],
  "#/owner/label": [layarLabel, []],
  "#/owner/atur": [layarAtur, []],
};

const state = { user: null, anggota: null };
let bersihkan = null;
let generasi = 0;

const ctx = {
  get user() {
    return state.user;
  },
  get anggota() {
    return state.anggota;
  },
  /** Menu yang tampil: owner selalu melihat menu owner. */
  navPeran(p) {
    return state.anggota?.peran === "owner" ? "owner" : p;
  },
  async muatUlang() {
    await muatSesi();
    render();
  },
};

async function muatSesi() {
  const sesi = await api.sesi();
  state.user = sesi?.user ?? null;
  state.anggota = state.user ? await api.anggotaSaya(state.user.id) : null;
}

function bolehBuka(rute) {
  const def = RUTE[rute];
  if (!def || !state.anggota) return false;
  return state.anggota.peran === "owner" || def[1].includes(state.anggota.peran);
}

function pilihLayar() {
  if (!state.user) return layarMasuk(ctx);
  if (!state.anggota) return layarUndangan(ctx);
  if (!state.anggota.aktif) return layarNonaktif(ctx);
  if (!bolehBuka(location.hash)) {
    const beranda = MENU[state.anggota.peran][0][0];
    if (location.hash !== beranda) {
      history.replaceState(null, "", beranda);
    }
  }
  return RUTE[location.hash][0](ctx);
}

async function render() {
  const gen = ++generasi;
  if (bersihkan) {
    try {
      bersihkan();
    } catch {
      /* abaikan */
    }
    bersihkan = null;
  }
  const layar = pilihLayar();
  app.innerHTML = layar.html;
  const root = document.createElement("div");
  root.style.display = "contents";
  root.append(...app.childNodes);
  app.append(root);
  window.scrollTo(0, 0);
  if (layar.mount) {
    try {
      const stop = await layar.mount(root);
      if (gen !== generasi) stop?.();
      else bersihkan = stop ?? null;
    } catch (ex) {
      toast(pesanGalat(ex), { bad: true });
    }
  }
}

document.addEventListener("click", async (e) => {
  if (e.target.closest('[data-act="keluar"]')) {
    await api.keluar();
    state.user = null;
    state.anggota = null;
    history.replaceState(null, "", "#/");
    render();
  }
});

window.addEventListener("hashchange", render);

sb.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    state.user = null;
    state.anggota = null;
  }
});

muatSesi()
  .catch((ex) => toast(pesanGalat(ex), { bad: true }))
  .finally(render);
