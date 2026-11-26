import QRCode from "qrcode";
import { api } from "../api.js";
import {
  adaStok, awalBulan, awalHari, cukupHari, esc, PERAN_LABEL, perluPesan, parseRupiah, pesanGalat, pesanUndangan,
  qrUrl, ringkasPenjualan, rupiah, saranKode, tambahHari, tanggalPanjang,
} from "../lib.js";
import { blendClass, namaVarian, nav, skalaStok, stokBar, toast, topbar } from "../ui.js";

const JENDELA_HARI = 14;

export function layarRingkasan(ctx) {
  let periode = "bulan";
  let semua = null; // cache penjualan seluruhnya, dimuat saat "Semua" dipilih
  let jual = [];
  let varian = [];

  const periodeAwal = () =>
    periode === "7" ? tambahHari(awalHari(), -6) : periode === "bulan" ? awalBulan() : null;

  const render = (root) => {
    const aktif = varian.filter(adaStok);
    const belum = varian.filter((v) => v.aktif && !adaStok(v)).length;
    const nama = new Map(varian.map((v) => [v.kode, namaVarian(v)]));
    const hari = ringkasPenjualan(jual, awalHari());
    const per = ringkasPenjualan(periode === "semua" ? semua ?? [] : jual, periodeAwal());
    const jendela = ringkasPenjualan(jual, tambahHari(awalHari(), -(JENDELA_HARI - 1)));
    const skala = skalaStok(aktif);
    const pesan = varian.filter(perluPesan);
    const labelPeriode = periode === "7" ? "7 hari terakhir" : periode === "bulan" ? new Date().toLocaleDateString("id-ID", { month: "long" }) : "sejak awal";

    root.querySelector("#t-uang").textContent = rupiah(hari.uang);
    root.querySelector("#t-bks").innerHTML = `${hari.bungkus} <span style="font:600 15px var(--font-body);color:var(--ink-soft)">bungkus</span>`;
    root.querySelectorAll("[data-periode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.periode === periode)));
    root.querySelector("#p-label").textContent = `Total uang masuk · ${labelPeriode}`;
    root.querySelector("#p-uang").textContent = periode === "semua" && !semua ? "…" : rupiah(per.uang);
    root.querySelector("#p-bks").textContent = periode === "semua" && !semua ? "…" : per.bungkus;

    root.querySelector("#alert").innerHTML = pesan
      .map((v) => {
        const terjual = jendela.perVarian.get(v.kode)?.bungkus ?? 0;
        const hariSisa = cukupHari(v.stok, terjual, JENDELA_HARI);
        const rata = terjual / JENDELA_HARI;
        return `<div class="card warn row" style="align-items:flex-start;gap:12px">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rust-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-top:1px"><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/></svg>
          <div class="stack" style="gap:4px"><b style="color:var(--rust-ink)">Waktunya pesan ${esc(namaVarian(v))}</b>
          <span class="small" style="color:var(--ink-soft);font-size:13px">Sisa ${v.stok} bungkus, batasnya ${v.batas_min}.${
            v.stok < 0
              ? " Stok minus berarti ada penjualan yang barang masuknya belum dicatat gudang."
              : hariSisa === null
              ? ""
              : ` Rata-rata terjual ${rata.toLocaleString("id-ID", { maximumFractionDigits: 1 })} bungkus sehari, jadi habis sekitar ${hariSisa} hari lagi.`
          }</span></div></div>`;
      })
      .join("");

    root.querySelector("#stok-total").textContent = `${aktif.reduce((s, v) => s + v.stok, 0)} bks`;
    root.querySelector("#stok").innerHTML = aktif
      .map((v) => {
        const terjual = jendela.perVarian.get(v.kode)?.bungkus ?? 0;
        const h = cukupHari(v.stok, terjual, JENDELA_HARI);
        const low = v.stok <= v.batas_min;
        return `<div style="display:grid;grid-template-columns:120px 1fr 44px;gap:4px 10px;align-items:center">
          <span class="blend ${blendClass(v.jenis)}" style="font-size:17px">${esc(namaVarian(v))}</span>
          ${stokBar(v, skala)}
          <b class="num r" style="${low ? "color:var(--rust-ink)" : ""}">${v.stok}</b>
          <span class="small" style="grid-column:2 / span 2;${low ? "color:var(--rust-ink);font-weight:600" : ""}">${
            v.stok < 0
              ? "minus: ada penjualan yang barang masuknya belum dicatat gudang"
              : h === null
                ? `belum ada penjualan ${JENDELA_HARI} hari terakhir`
                : `cukup ± ${h} hari`
          }</span></div>`;
      })
      .join("") + (belum ? `<p class="small" style="margin:0">${belum} varian lain belum pernah punya stok.</p>` : "");

    const baris = [...hari.perVarian.entries()].sort((a, b) => b[1].bungkus - a[1].bungkus);
    root.querySelector("#tabel").innerHTML = baris.length
      ? `<table><thead><tr><th scope="col">Varian</th><th scope="col" class="r">Bungkus</th><th scope="col" class="r">Harga katalog</th></tr></thead>
        <tbody>${baris
          .map(([k, r]) => `<tr><td>${esc(nama.get(k) ?? k)}</td><td class="r">${r.bungkus}</td><td class="r">${rupiah(r.nilai)}</td></tr>`)
          .join("")}</tbody>
        <tfoot><tr><td>Total</td><td class="r">${hari.bungkus}</td><td class="r">${rupiah(hari.nilai)}</td></tr>
        ${hari.uang !== hari.nilai ? `<tr><td colspan="2">Uang diterima</td><td class="r">${rupiah(hari.uang)}</td></tr>` : ""}</tfoot></table>`
      : `<p class="small">Belum ada penjualan hari ini.</p>`;
  };

  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">Owner · ${esc(tanggalPanjang())}</span><h1>Ringkasan</h1></div>
      <div class="row"><a class="btn outline small" href="#/gudang/scan" style="display:inline-flex;align-items:center;text-decoration:none">Catat barang masuk</a>
        <a class="btn outline small" href="#/sales/scan" style="display:inline-flex;align-items:center;text-decoration:none">Catat penjualan</a></div>
      <div class="grid2">
        <div class="card tile"><span class="k">Uang masuk hari ini</span><span class="v" id="t-uang">—</span></div>
        <div class="card tile"><span class="k">Terjual hari ini</span><span class="v" id="t-bks">—</span></div>
      </div>
      <div class="card stack" style="gap:12px">
        <div class="chips" role="group" aria-label="Periode">
          <button type="button" class="chip" data-periode="7">7 hari</button>
          <button type="button" class="chip" data-periode="bulan">Bulan ini</button>
          <button type="button" class="chip" data-periode="semua">Semua</button></div>
        <div class="row" style="justify-content:space-between;align-items:flex-end">
          <div class="tile"><span class="k" id="p-label">Total uang masuk</span><span class="v" id="p-uang" style="font-size:30px">—</span></div>
          <div class="r small" style="font-size:13px;color:var(--ink-soft)">Terjual<br><b class="num" id="p-bks" style="font-size:18px;color:var(--ink)">—</b> bks</div>
        </div>
      </div>
      <div class="stack" id="alert" style="gap:10px"></div>
      <section class="stack"><div class="row" style="justify-content:space-between"><span class="eyebrow">Stok sisa di gudang</span><b class="num" id="stok-total"></b></div>
        <div class="stack" id="stok" style="gap:12px"></div></section>
      <section class="stack" style="gap:4px"><span class="eyebrow">Terjual hari ini per varian</span><div id="tabel"></div></section>
    </main>${nav("owner", "#/owner/ringkasan")}`,
    async mount(root) {
      const muat = async () => {
        const sejak = new Date(Math.min(awalBulan().getTime(), tambahHari(awalHari(), -(JENDELA_HARI - 1)).getTime()));
        [varian, jual] = await Promise.all([api.stok(), api.penjualan({ sejak })]);
        if (periode === "semua") semua = await api.penjualan();
        render(root);
      };
      root.addEventListener("click", async (e) => {
        const b = e.target.closest("[data-periode]");
        if (!b) return;
        periode = b.dataset.periode;
        render(root);
        if (periode === "semua" && !semua) {
          semua = await api.penjualan();
          render(root);
        }
      });
      await muat();
      return api.dengarkan(muat);
    },
  };
}

export function layarLabel(ctx) {
  let varian = [];
  const salinan = new Map();

  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">Owner</span><h1>Label QR</h1>
        <p class="lead">Satu QR untuk satu jenis + satu ukuran. Tempel di setiap bungkus. Di-scan pembeli, QR membuka halaman terima kasih. Di-scan dari app, stok tercatat.</p></div>
      <div class="labels" id="labels"></div>
      <button type="button" class="btn" data-act="cetak" id="cetak">Cetak label</button>
      <p class="small">Ukuran stiker 50 × 30 mm di kertas A4. Pilih "Simpan sebagai PDF" di dialog cetak kalau mau dicetak di tempat lain.</p>
    </main>${nav("owner", "#/owner/label")}`,
    async mount(root) {
      varian = (await api.stok()).filter((v) => v.aktif);
      const svg = new Map();
      for (const v of varian) {
        salinan.set(v.kode, 10);
        svg.set(
          v.kode,
          await QRCode.toString(qrUrl(v.kode), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0e251f", light: "#ffffff" } }),
        );
      }
      const total = () => [...salinan.values()].reduce((s, n) => s + n, 0);
      const render = () => {
        root.querySelector("#labels").innerHTML = varian
          .map(
            (v) => `<div class="label">
            <span role="img" aria-label="QR ${esc(namaVarian(v))}">${svg.get(v.kode)}</span>
            <span class="blend ${blendClass(v.jenis)}" style="font-size:22px">${esc(v.jenis)}</span>
            <span style="font-size:13px;font-weight:600">${esc(v.ukuran)}</span>
            <span class="code">${esc(qrUrl(v.kode).replace("https://", ""))}</span>
            <div class="row" style="gap:6px"><button type="button" class="step sm" data-ubah="-1" data-kode="${esc(v.kode)}" aria-label="Kurangi jumlah cetak ${esc(namaVarian(v))}">−</button>
              <span class="num" style="min-width:30px;font-weight:700">${salinan.get(v.kode)}</span>
              <button type="button" class="step sm" data-ubah="1" data-kode="${esc(v.kode)}" aria-label="Tambah jumlah cetak ${esc(namaVarian(v))}">+</button></div>
          </div>`,
          )
          .join("");
        root.querySelector("#cetak").textContent = `Cetak ${total()} label`;
      };
      root.addEventListener("click", (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        if (t.dataset.ubah) {
          salinan.set(t.dataset.kode, Math.max(0, Math.min(500, salinan.get(t.dataset.kode) + Number(t.dataset.ubah) * 5)));
          render();
        }
        if (t.dataset.act === "cetak") {
          const area = document.getElementById("print-area");
          area.innerHTML = varian
            .flatMap((v) =>
              Array.from({ length: salinan.get(v.kode) }, () =>
                `<div class="sticker">${svg.get(v.kode)}<div><div class="blend ${blendClass(v.jenis)}">${esc(v.jenis)}</div><div class="s">${/^(BOLD|BRIGHT|FULL ROBUSTA)$/.test(v.jenis) ? "Houseblend" : "Single Origin"} · ${esc(v.ukuran)}</div></div></div>`,
              ),
            )
            .join("");
          window.print();
        }
      });
      render();
    },
  };
}

export function layarAtur(ctx) {
  let undanganBaru = null;

  const bagianTim = (anggota, undangan) => `
    <section class="stack" style="gap:0">
      <span class="eyebrow" style="padding-bottom:4px">Tim</span>
      <div class="list">${anggota
        .map((a) => {
          const diriSendiri = a.user_id === ctx.user.id;
          return `<div class="row" style="justify-content:space-between;gap:8px">
            <div class="grow stack" style="gap:1px"><b>${esc(a.nama)}${diriSendiri ? " (kamu)" : ""}</b><span class="small">${esc(a.email ?? "")}</span></div>
            ${
              diriSendiri
                ? `<span class="pill owner">Owner</span>`
                : `<select class="input" style="width:128px;min-height:44px;padding:0 8px;font-size:15px" data-peran-untuk="${esc(a.user_id)}" aria-label="Peran ${esc(a.nama)}">
                    ${["gudang", "sales", "owner"].map((p) => `<option value="${p}"${p === a.peran ? " selected" : ""}>${PERAN_LABEL[p]}</option>`).join("")}</select>
                  <button type="button" class="btn small ${a.aktif ? "danger" : "outline"}" data-aktif-untuk="${esc(a.user_id)}" data-aktif="${a.aktif ? "0" : "1"}">${a.aktif ? "Nonaktifkan" : "Aktifkan"}</button>`
            }</div>`;
        })
        .join("")}
      ${undangan
        .map(
          (u) => `<div class="row" style="justify-content:space-between;gap:8px">
            <div class="grow stack" style="gap:1px"><b>${esc(u.nama)}</b><span class="small">Belum bergabung · kode <span class="code">${esc(u.kode)}</span></span></div>
            <span class="pill ${u.peran}">${esc(PERAN_LABEL[u.peran])}</span>
            <button type="button" class="btn small outline" data-cabut="${esc(u.kode)}" aria-label="Cabut undangan ${esc(u.nama)}">Cabut</button></div>`,
        )
        .join("")}</div>
      <form class="stack" id="f-undang" style="gap:8px;padding-top:12px;border-top:1px solid var(--line)" novalidate>
        <span class="lbl">Undang anggota</span>
        <div class="row" style="gap:8px">
          <input class="input grow" name="nama" maxlength="60" placeholder="Nama" aria-label="Nama anggota baru">
          <select class="input" name="peran" style="width:128px;padding:0 8px;font-size:15px" aria-label="Peran">
            <option value="gudang">PIC Gudang</option><option value="sales">PIC Sales</option><option value="owner">Owner</option></select></div>
        <button class="btn" type="submit">Buat kode undangan</button>
      </form>
      ${
        undanganBaru
          ? `<div class="card stack" style="gap:8px;margin-top:10px;background:var(--primary-wash);border-color:var(--olive)">
          <span class="small">Kode undangan untuk ${esc(undanganBaru.nama)} (${esc(PERAN_LABEL[undanganBaru.peran])})</span>
          <b class="num" style="font-size:28px;letter-spacing:.12em;color:var(--primary)" id="kode-baru">${esc(undanganBaru.kode)}</b>
          <a class="btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none" target="_blank" rel="noopener noreferrer"
             href="https://wa.me/?text=${encodeURIComponent(pesanUndangan({ ...undanganBaru, appUrl: location.origin }))}">Kirim lewat WhatsApp</a>
          <span class="small">Berlaku 7 hari dan hanya bisa dipakai sekali.</span></div>`
          : ""
      }
    </section>`;

  const bagianVarian = (varian) => `
    <section class="stack" style="gap:6px">
      <span class="eyebrow">Varian, harga &amp; batas stok</span>
      <table><thead><tr><th scope="col">Varian</th><th scope="col" class="r" style="width:112px">Harga (Rp)</th><th scope="col" class="r" style="width:64px;padding-left:8px">Batas</th><th scope="col" style="width:52px" class="r">Aktif</th></tr></thead>
      <tbody>${varian
        .map(
          (v) => `<tr data-varian="${esc(v.kode)}"><td>${esc(namaVarian(v))}<br><span class="code">${esc(v.kode)}</span></td>
          <td><input class="input r" style="min-height:44px;padding:0 8px" inputmode="numeric" data-f="harga" value="${v.harga.toLocaleString("id-ID")}" aria-label="Harga ${esc(namaVarian(v))}"></td>
          <td style="padding-left:8px"><input class="input r" style="min-height:44px;padding:0 8px" inputmode="numeric" data-f="batas_min" value="${v.batas_min}" aria-label="Batas stok ${esc(namaVarian(v))}"></td>
          <td class="r"><input type="checkbox" data-f="aktif" style="width:22px;height:22px"${v.aktif ? " checked" : ""} aria-label="${esc(namaVarian(v))} aktif"></td></tr>`,
        )
        .join("")}</tbody></table>
      <button type="button" class="btn outline" data-act="simpan-varian">Simpan harga &amp; batas</button>
      <p class="small">Harga jadi isian awal saat Sales mencatat. Batas = kapan kamu diingatkan pesan lagi.</p>
      <details><summary class="lbl" style="min-height:44px;display:flex;align-items:center;cursor:pointer">+ Tambah varian</summary>
        <form class="stack" id="f-varian" style="gap:10px" novalidate>
          <div class="grid2"><div class="field"><label class="lbl" for="v-jenis">Jenis</label><input class="input" id="v-jenis" name="jenis" maxlength="40" placeholder="BOLD"></div>
            <div class="field"><label class="lbl" for="v-ukuran">Ukuran</label><input class="input" id="v-ukuran" name="ukuran" maxlength="20" placeholder="1 kg"></div></div>
          <div class="field"><label class="lbl" for="v-kode">Kode QR</label><input class="input" id="v-kode" name="kode" maxlength="40" spellcheck="false" autocapitalize="off" placeholder="bold-1kg">
            <span class="small">Samakan dengan kode varian di web supaya QR membuka halaman terima kasih yang benar. Kode tidak bisa diubah setelah stiker dicetak.</span></div>
          <div class="grid2"><div class="field"><label class="lbl" for="v-harga">Harga</label><input class="input" id="v-harga" name="harga" inputmode="numeric" placeholder="Rp0"></div>
            <div class="field"><label class="lbl" for="v-batas">Batas stok</label><input class="input" id="v-batas" name="batas" inputmode="numeric" value="10"></div></div>
          <button class="btn" type="submit">Tambah varian</button>
        </form></details>
    </section>`;

  return {
    html: `<main class="screen">${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">Owner</span><h1>Atur</h1></div>
      <div id="tim"></div><div id="varian"></div></main>${nav("owner", "#/owner/atur")}`,
    async mount(root) {
      const muatTim = async () => {
        const [anggota, undangan] = await Promise.all([api.anggota(), api.undanganAktif()]);
        root.querySelector("#tim").innerHTML = bagianTim(anggota, undangan);
      };
      const muatVarian = async () => {
        root.querySelector("#varian").innerHTML = bagianVarian(await api.stok());
      };
      const gagal = (ex) => toast(pesanGalat(ex), { bad: true });

      root.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector("button[type=submit]");
        btn.disabled = true;
        try {
          if (f.id === "f-undang") {
            const nama = f.nama.value.trim();
            if (!nama) throw new Error("Isi nama anggota.");
            const kode = await api.buatUndangan(nama, f.peran.value);
            undanganBaru = { nama, peran: f.peran.value, kode };
            await muatTim();
          }
          if (f.id === "f-varian") {
            const v = {
              jenis: f.jenis.value.trim().toUpperCase(),
              ukuran: f.ukuran.value.trim(),
              kode: f.kode.value.trim().toLowerCase(),
              harga: parseRupiah(f.harga.value),
              batas_min: parseRupiah(f.batas.value) ?? 10,
            };
            if (!v.jenis || !v.ukuran || !v.kode || v.harga === null) throw new Error("Lengkapi jenis, ukuran, kode, dan harga.");
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.kode)) throw new Error("Kode hanya huruf kecil, angka, dan tanda minus.");
            await api.tambahVarian({ ...v, urutan: 1000 });
            toast(`${v.jenis} · ${v.ukuran} ditambahkan. QR-nya ada di Label QR.`);
            await muatVarian();
          }
        } catch (ex) {
          gagal(ex);
        } finally {
          btn.disabled = false;
        }
      });

      root.addEventListener("input", (e) => {
        if (e.target.id === "v-jenis" || e.target.id === "v-ukuran") {
          const f = e.target.form;
          if (!f.kode.dataset.diubah) f.kode.value = saranKode(f.jenis.value, f.ukuran.value);
        }
        if (e.target.id === "v-kode") e.target.dataset.diubah = "1";
      });

      root.addEventListener("change", async (e) => {
        const id = e.target.dataset.peranUntuk;
        if (!id) return;
        try {
          await api.ubahAnggota(id, { peran: e.target.value });
          toast("Peran diubah.");
        } catch (ex) {
          gagal(ex);
          await muatTim();
        }
      });

      root.addEventListener("click", async (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        try {
          if (t.dataset.aktifUntuk) {
            await api.ubahAnggota(t.dataset.aktifUntuk, { aktif: t.dataset.aktif === "1" });
            await muatTim();
          }
          if (t.dataset.cabut) {
            await api.cabutUndangan(t.dataset.cabut);
            if (undanganBaru?.kode === t.dataset.cabut) undanganBaru = null;
            await muatTim();
          }
          if (t.dataset.act === "simpan-varian") {
            t.disabled = true;
            for (const tr of root.querySelectorAll("tr[data-varian]")) {
              const harga = parseRupiah(tr.querySelector('[data-f="harga"]').value);
              const batas = parseRupiah(tr.querySelector('[data-f="batas_min"]').value);
              if (harga === null || batas === null) throw new Error("Harga dan batas harus berupa angka.");
              await api.ubahVarian(tr.dataset.varian, {
                harga,
                batas_min: batas,
                aktif: tr.querySelector('[data-f="aktif"]').checked,
              });
            }
            toast("Harga dan batas disimpan.");
            await muatVarian();
          }
        } catch (ex) {
          gagal(ex);
          t.disabled = false;
        }
      });

      await Promise.all([muatTim(), muatVarian()]);
    },
  };
}
