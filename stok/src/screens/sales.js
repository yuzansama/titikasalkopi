import { api } from "../api.js";
import { awalHari, esc, formatWaktu, parseRupiah, pesanGalat, ringkasPenjualan, rupiah, tambahHari } from "../lib.js";
import { blendClass, namaVarian, nav, toast, topbar } from "../ui.js";
import { kamera, nyalakanKamera } from "./gudang.js";

function inputUang(id, nilai) {
  return `<input class="input money" id="${id}" inputmode="numeric" autocomplete="off" value="${esc(rupiah(nilai))}">`;
}

export function layarSalesScan(ctx) {
  let varian = [];
  const keranjang = new Map(); // kode -> { v, jumlah }
  let uangManual = null;

  const totalKatalog = () => [...keranjang.values()].reduce((s, it) => s + it.v.harga * it.jumlah, 0);
  const totalBungkus = () => [...keranjang.values()].reduce((s, it) => s + it.jumlah, 0);

  const sheet = () => {
    if (keranjang.size === 0) {
      return `<h1 style="font-size:22px">Penjualan ini</h1>
        <p class="lead">Scan QR tiap bungkus yang terjual. Scan lagi untuk menambah.</p>`;
    }
    const lines = [...keranjang.values()]
      .map(({ v, jumlah }) => {
        const kurang = jumlah > v.stok;
        return `<div class="cart-line" style="border-top:1px solid var(--line);padding-top:12px">
          <div><div class="blend ${blendClass(v.jenis)}" style="font-size:19px">${esc(namaVarian(v))}</div>
            <div class="small">${rupiah(v.harga)} / bungkus${kurang ? ` · <span style="color:var(--rust-ink);font-weight:600">stok tercatat ${v.stok}</span>` : ""}</div></div>
          <div class="row" style="gap:4px">
            <button type="button" class="step sm" data-ubah="-1" data-kode="${esc(v.kode)}" aria-label="Kurangi ${esc(namaVarian(v))}">−</button>
            <span class="num" style="width:24px;text-align:center;font-weight:700">${jumlah}</span>
            <button type="button" class="step sm" data-ubah="1" data-kode="${esc(v.kode)}" aria-label="Tambah ${esc(namaVarian(v))}">+</button>
          </div>
          <span class="num r" style="min-width:80px;font-weight:700">${rupiah(v.harga * jumlah)}</span>
        </div>`;
      })
      .join("");
    return `<div class="row" style="justify-content:space-between;align-items:baseline">
        <h1 style="font-size:22px">Penjualan ini</h1><span class="small">${totalBungkus()} bungkus</span></div>
      <div class="stack" style="gap:12px">${lines}</div>
      <div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:12px;font-size:14px;color:var(--ink-soft)">
        <span>Total harga katalog</span><b class="num">${rupiah(totalKatalog())}</b></div>
      <div class="field"><label class="lbl" for="uang">Uang diterima</label>${inputUang("uang", uangManual ?? totalKatalog())}
        <span class="small">Terisi otomatis dari harga katalog. Ubah kalau ada diskon atau pembulatan.</span></div>
      <button type="button" class="btn" data-act="simpan">Simpan · stok berkurang ${totalBungkus()}</button>
      <button type="button" class="linkbtn" data-act="kosongkan">Kosongkan</button>`;
  };

  return {
    html: `<main class="screen">
      ${kamera({
        judul: "PIC Sales · Penjualan",
        hint: "Arahkan kamera ke QR di bungkus",
        tautan: `<a class="linkbtn" href="#/sales/manual">QR rusak? Catat manual</a>`,
      })}
      <section class="sheet" id="sheet" aria-live="polite"></section>
    </main>${nav(ctx.navPeran("sales"), "#/sales/scan")}`,
    async mount(root) {
      const sheetEl = root.querySelector("#sheet");
      const render = () => (sheetEl.innerHTML = sheet());
      const tambah = (v, n = 1) => {
        const it = keranjang.get(v.kode) ?? { v, jumlah: 0 };
        it.jumlah += n;
        if (it.jumlah <= 0) keranjang.delete(v.kode);
        else keranjang.set(v.kode, it);
        render();
      };
      root.addEventListener("click", async (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        if (t.dataset.ubah) tambah(keranjang.get(t.dataset.kode).v, Number(t.dataset.ubah));
        if (t.dataset.act === "kosongkan") {
          keranjang.clear();
          uangManual = null;
          render();
        }
        if (t.dataset.act === "simpan") {
          const uang = parseRupiah(root.querySelector("#uang").value);
          if (uang === null) return toast("Isi uang diterima.", { bad: true });
          t.disabled = true;
          try {
            const items = [...keranjang.values()].map(({ v, jumlah }) => ({ kode: v.kode, jumlah }));
            await api.catatJual(items, uang);
            toast(`Tersimpan: ${totalBungkus()} bungkus, ${rupiah(uang)}`);
            keranjang.clear();
            uangManual = null;
            varian = await api.stok();
            render();
          } catch (ex) {
            toast(pesanGalat(ex), { bad: true });
            t.disabled = false;
          }
        }
      });
      root.addEventListener("input", (e) => {
        if (e.target.id === "uang") uangManual = parseRupiah(e.target.value);
      });
      root.addEventListener("focusout", (e) => {
        if (e.target.id === "uang") e.target.value = rupiah(uangManual ?? totalKatalog());
      });
      varian = await api.stok();
      render();
      return await nyalakanKamera(root, (v) => tambah(v, 1), () => varian);
    },
  };
}

export function layarSalesManual(ctx) {
  let varian = [];
  let jenis = null;
  let kode = null;
  let jumlah = 1;
  let uangManual = null;

  const dipilih = () => varian.find((v) => v.kode === kode) ?? null;
  const html = () => {
    const aktif = varian.filter((v) => v.aktif);
    const daftarJenis = [...new Set(aktif.map((v) => v.jenis))];
    const ukuran = aktif.filter((v) => v.jenis === jenis);
    const v = dipilih();
    const total = v ? v.harga * jumlah : 0;
    return `
    <div class="field"><span class="lbl" id="l-kopi">Kopi</span>
      <div class="seg" role="group" aria-labelledby="l-kopi">${daftarJenis
        .map(
          (j) => `<button type="button" class="opt blend ${blendClass(j)}" style="font-size:22px" data-jenis="${esc(j)}" aria-pressed="${j === jenis}">${esc(j)}</button>`,
        )
        .join("")}</div></div>
    ${jenis ? `<div class="field"><span class="lbl" id="l-ukuran">Ukuran</span>
      <div class="seg" role="group" aria-labelledby="l-ukuran">${ukuran
        .map((u) => `<button type="button" class="opt" data-kode="${esc(u.kode)}" aria-pressed="${u.kode === kode}">${esc(u.ukuran)}</button>`)
        .join("")}</div>
      ${v ? `<span class="small">Stok ${esc(namaVarian(v))} di gudang: ${v.stok} bungkus</span>` : ""}</div>` : ""}
    ${v ? `<div class="field"><span class="lbl" id="l-jml">Jumlah (bungkus)</span>
      <div class="stepper" role="group" aria-labelledby="l-jml">
        <button type="button" class="step" data-ubah="-1" aria-label="Kurangi jumlah">−</button>
        <span class="qty">${jumlah}</span>
        <button type="button" class="step" data-ubah="1" aria-label="Tambah jumlah">+</button></div></div>
    <div class="field"><label class="lbl" for="uang">Uang diterima</label>${inputUang("uang", uangManual ?? total)}
      <span class="small">Harga katalog ${rupiah(total)}. Ubah kalau ada diskon.</span></div>
    <button type="button" class="btn" data-act="simpan">Simpan penjualan</button>` : ""}`;
  };

  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">PIC Sales</span><h1>Catat manual</h1>
        <p class="lead">Kalau QR tidak bisa di-scan.</p></div>
      <form class="stack" id="form" style="gap:18px" novalidate></form>
      <div class="card row" style="justify-content:space-between;font-size:13px;background:var(--sunk);border:0">
        <span>Penjualanmu hari ini</span><b class="num" id="hari-ini">—</b></div>
    </main>${nav(ctx.navPeran("sales"), "#/sales/manual")}`,
    async mount(root) {
      const form = root.querySelector("#form");
      const render = () => (form.innerHTML = html());
      const muatHariIni = async () => {
        const r = ringkasPenjualan(await api.penjualan({ sejak: awalHari(), oleh: ctx.user.id }));
        root.querySelector("#hari-ini").textContent = `${r.bungkus} bungkus · ${rupiah(r.uang)}`;
      };
      root.addEventListener("click", async (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        if (t.dataset.jenis) {
          jenis = t.dataset.jenis;
          kode = null;
          jumlah = 1;
          uangManual = null;
          const satu = varian.filter((v) => v.aktif && v.jenis === jenis);
          if (satu.length === 1) kode = satu[0].kode;
          render();
        }
        if (t.dataset.kode) {
          kode = t.dataset.kode;
          uangManual = null;
          render();
        }
        if (t.dataset.ubah) {
          jumlah = Math.max(1, Math.min(1000, jumlah + Number(t.dataset.ubah)));
          uangManual = null;
          render();
        }
        if (t.dataset.act === "simpan") {
          const v = dipilih();
          const uang = parseRupiah(root.querySelector("#uang").value);
          if (!v || uang === null) return toast("Lengkapi kopi, ukuran, dan uang diterima.", { bad: true });
          t.disabled = true;
          try {
            await api.catatJual([{ kode: v.kode, jumlah }], uang);
            toast(`Tersimpan: ${jumlah} ${namaVarian(v)}, ${rupiah(uang)}`);
            jumlah = 1;
            uangManual = null;
            varian = await api.stok();
            render();
            await muatHariIni();
          } catch (ex) {
            toast(pesanGalat(ex), { bad: true });
            t.disabled = false;
          }
        }
      });
      root.addEventListener("input", (e) => {
        if (e.target.id === "uang") uangManual = parseRupiah(e.target.value);
      });
      root.addEventListener("focusout", (e) => {
        const v = dipilih();
        if (e.target.id === "uang" && v) e.target.value = rupiah(uangManual ?? v.harga * jumlah);
      });
      varian = await api.stok();
      render();
      form.addEventListener("submit", (e) => e.preventDefault());
      await muatHariIni();
    },
  };
}

export function layarSalesRiwayat(ctx) {
  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">PIC Sales</span><h1>Riwayat penjualan</h1>
        <p class="lead">Penjualanmu 7 hari terakhir.</p></div>
      <div class="grid2"><div class="card tile"><span class="k">Hari ini</span><span class="v" id="t-uang">—</span></div>
        <div class="card tile"><span class="k">Terjual hari ini</span><span class="v" id="t-bks">—</span></div></div>
      <div class="list" id="daftar"></div>
    </main>${nav(ctx.navPeran("sales"), "#/sales/riwayat")}`,
    async mount(root) {
      const [varian, jual] = await Promise.all([
        api.stok(),
        api.penjualan({ sejak: tambahHari(awalHari(), -6), oleh: ctx.user.id }),
      ]);
      const nama = new Map(varian.map((v) => [v.kode, namaVarian(v)]));
      const r = ringkasPenjualan(jual, awalHari());
      root.querySelector("#t-uang").textContent = rupiah(r.uang);
      root.querySelector("#t-bks").textContent = `${r.bungkus} bks`;
      root.querySelector("#daftar").innerHTML = jual.length
        ? jual
            .map(
              (p) => `<div class="row" style="justify-content:space-between;align-items:flex-start;font-size:13px">
              <span>${p.penjualan_item.map((i) => `${i.jumlah} × ${esc(nama.get(i.kode_varian) ?? i.kode_varian)}`).join("<br>")}</span>
              <span class="r num"><b>${rupiah(p.uang_diterima)}</b><br><span class="small">${esc(formatWaktu(p.waktu))}</span></span></div>`,
            )
            .join("")
        : `<p class="small">Belum ada penjualan.</p>`;
    },
  };
}
