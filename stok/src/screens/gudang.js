import { api } from "../api.js";
import { adaStok, esc, formatWaktu, kodeDariScan, pesanGalat } from "../lib.js";
import { getar, mulaiScanner } from "../scanner.js";
import { blendClass, namaVarian, nav, skalaStok, stokBar, toast, topbar } from "../ui.js";

/** Bagian kamera yang dipakai layar scan gudang dan sales. */
export function kamera({ judul, hint, tautan = "" }) {
  return `<section class="cam" aria-label="Kamera">
    <div class="row" style="align-self:stretch;justify-content:space-between">
      <span class="eyebrow" style="align-self:center">${esc(judul)}</span>
      <button type="button" class="linkbtn" data-act="keluar">Keluar</button></div>
    <div class="viewfinder"><video id="video" aria-label="Pratinjau kamera"></video></div>
    <p class="hint" id="cam-hint">${esc(hint)}</p>${tautan}
  </section>`;
}

/** Menyalakan kamera di root; mengembalikan fungsi berhenti. */
export async function nyalakanKamera(root, onKode, varian) {
  const hint = root.querySelector("#cam-hint");
  try {
    return await mulaiScanner(root.querySelector("#video"), (text) => {
      const kode = kodeDariScan(text);
      const v = kode && varian().find((x) => x.kode === kode);
      if (!v) return toast("QR ini bukan QR kemasan Titik Asal Kopi.", { bad: true });
      if (!v.aktif) return toast(`${namaVarian(v)} sudah dinonaktifkan owner.`, { bad: true });
      getar();
      onKode(v);
    });
  } catch (ex) {
    hint.textContent =
      ex?.name === "NotAllowedError"
        ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser, atau pilih kopi di bawah."
        : "Kamera tidak bisa dibuka. Pilih kopi di bawah.";
    return () => {};
  }
}

export function layarGudangScan(ctx) {
  let varian = [];
  let pilih = null; // { v, jumlah }
  let catatan = "";

  const sheet = () => {
    if (!pilih) {
      const aktif = varian.filter((v) => v.aktif);
      return `<p class="lead">Scan QR di bungkus, atau pilih kopinya:</p>
        <div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))">${aktif
          .map((v) => `<button type="button" class="opt" data-pilih="${esc(v.kode)}">${esc(namaVarian(v))}</button>`)
          .join("")}</div>`;
    }
    const { v, jumlah } = pilih;
    return `
      <div class="row" style="justify-content:space-between;align-items:flex-end">
        <div class="stack" style="gap:2px">
          <span class="blend ${blendClass(v.jenis)}" style="font-size:30px">${esc(namaVarian(v))}</span>
          <span class="code">${esc(v.kode)}</span>
        </div>
        <div class="r small">Stok sekarang<br><b class="num" style="font-size:18px;color:var(--ink)">${v.stok} → ${v.stok + jumlah}</b></div>
      </div>
      <div class="field"><span class="lbl" id="lbl-jml">Jumlah masuk (bungkus)</span>
        <div class="stepper" role="group" aria-labelledby="lbl-jml">
          <button type="button" class="step" data-ubah="-1" aria-label="Kurangi jumlah">−</button>
          <input class="qty input" style="border:0;background:transparent" id="jml" inputmode="numeric" value="${jumlah}" aria-label="Jumlah">
          <button type="button" class="step" data-ubah="1" aria-label="Tambah jumlah">+</button>
        </div>
        <span class="small">Setiap scan menambah 1. Satu dus bisa langsung diketik jumlahnya.</span></div>
      <div class="field"><label class="lbl" for="catatan">Catatan <span style="font-weight:400;color:var(--muted)">(opsional)</span></label>
        <input class="input" id="catatan" maxlength="200" value="${esc(catatan)}" placeholder="mis. Roasting 20 Nov"></div>
      <button type="button" class="btn" data-act="simpan">Simpan ${jumlah} bungkus masuk</button>
      <button type="button" class="linkbtn" data-act="batal">Batal</button>`;
  };

  return {
    html: `<main class="screen">
      ${kamera({ judul: "PIC Gudang · Barang masuk", hint: "Arahkan kamera ke QR di bungkus" })}
      <section class="sheet" id="sheet" aria-live="polite"></section>
    </main>${nav(ctx.navPeran("gudang"), "#/gudang/scan")}`,
    async mount(root) {
      const sheetEl = root.querySelector("#sheet");
      const render = () => (sheetEl.innerHTML = sheet());
      const muat = async () => {
        varian = await api.stok();
        if (pilih) pilih.v = varian.find((x) => x.kode === pilih.v.kode) ?? pilih.v;
        render();
      };
      const set = (v) => {
        if (pilih && pilih.v.kode === v.kode) pilih.jumlah += 1;
        else {
          if (pilih) toast(`Ganti ke ${namaVarian(v)}. ${namaVarian(pilih.v)} belum disimpan.`);
          pilih = { v, jumlah: 1 };
        }
        render();
      };
      root.addEventListener("click", async (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        if (t.dataset.pilih) set(varian.find((x) => x.kode === t.dataset.pilih));
        if (t.dataset.ubah && pilih) {
          pilih.jumlah = Math.max(1, Math.min(10000, pilih.jumlah + Number(t.dataset.ubah)));
          render();
        }
        if (t.dataset.act === "batal") {
          pilih = null;
          catatan = "";
          render();
        }
        if (t.dataset.act === "simpan" && pilih) {
          t.disabled = true;
          try {
            await api.catatMasuk(pilih.v.kode, pilih.jumlah, catatan.trim());
            toast(`Tersimpan: +${pilih.jumlah} ${namaVarian(pilih.v)}`);
            pilih = null;
            catatan = "";
            await muat();
          } catch (ex) {
            toast(pesanGalat(ex), { bad: true });
            t.disabled = false;
          }
        }
      });
      root.addEventListener("input", (e) => {
        if (e.target.id === "catatan") catatan = e.target.value;
        if (e.target.id === "jml" && pilih) {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          pilih.jumlah = Number.isFinite(n) ? Math.max(1, Math.min(10000, n)) : 1;
          const btn = root.querySelector('[data-act="simpan"]');
          if (btn) btn.textContent = `Simpan ${pilih.jumlah} bungkus masuk`;
        }
      });
      root.addEventListener("change", (e) => {
        if (e.target.id === "jml") render();
      });
      await muat();
      return await nyalakanKamera(root, set, () => varian);
    },
  };
}

export function layarGudangStok(ctx) {
  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="head"><div class="stack" style="gap:4px"><span class="eyebrow">PIC Gudang</span><h1>Stok gudang</h1></div>
        <div class="r"><span class="num" id="total" style="font-size:26px;font-weight:700;color:var(--primary)">—</span><br><span class="small">bungkus total</span></div></div>
      <p class="small" id="ket" style="margin:0"></p>
      <div class="stack" id="daftar" style="gap:10px"></div>
      <section class="stack" style="gap:0"><span class="eyebrow" style="padding-bottom:6px">Masuk terakhir</span><div class="list" id="log"></div></section>
    </main>${nav(ctx.navPeran("gudang"), "#/gudang/stok")}`,
    async mount(root) {
      const muat = async () => {
        const [varian, log] = await Promise.all([api.stok(), api.masukTerakhir(10)]);
        const aktif = varian.filter(adaStok);
        const belum = varian.filter((v) => v.aktif && !adaStok(v)).length;
        const skala = skalaStok(aktif);
        root.querySelector("#total").textContent = aktif.reduce((s, v) => s + v.stok, 0);
        root.querySelector("#ket").textContent = `Per ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · garis hitam = batas minimum`;
        root.querySelector("#daftar").innerHTML = aktif
          .map((v) => {
            const low = v.stok <= v.batas_min;
            return `<div class="card${low ? " warn" : ""} stack" style="gap:10px">
              <div class="row" style="justify-content:space-between;align-items:baseline">
                <span class="blend ${blendClass(v.jenis)}" style="font-size:20px">${esc(namaVarian(v))}</span>
                <span><b class="num" style="font-size:28px;color:${low ? "var(--rust-ink)" : "var(--primary)"}">${v.stok}</b> <span class="small">bks</span></span></div>
              ${stokBar(v, skala)}
              ${low ? `<span class="err">Di bawah batas ${v.batas_min}. Owner melihat peringatan ini.</span>` : ""}
            </div>`;
          })
          .join("") + (belum ? `<p class="small">${belum} varian lain belum pernah punya stok. Scan QR-nya di Scan masuk saat barangnya datang.</p>` : "");
        const nama = new Map(varian.map((v) => [v.kode, namaVarian(v)]));
        root.querySelector("#log").innerHTML = log.length
          ? log
              .map(
                (m) => `<div class="row" style="justify-content:space-between;font-size:13px">
                <span><b>${esc(nama.get(m.kode_varian) ?? m.kode_varian)}</b>${m.catatan ? ` · ${esc(m.catatan)}` : ""}</span>
                <span class="num"><b style="color:var(--olive)">+${m.jumlah}</b> · ${esc(formatWaktu(m.waktu))}</span></div>`,
              )
              .join("")
          : `<p class="small">Belum ada barang masuk.</p>`;
      };
      await muat();
      return api.dengarkan(muat);
    },
  };
}
