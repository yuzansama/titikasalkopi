import { api } from "../api.js";
import { bertanda, esc, hitungKas, parseRupiah, pesanGalat, rupiah } from "../lib.js";
import { nav, toast, topbar } from "../ui.js";

const KATEGORI = ["Kopi", "Peralatan & kemasan", "Lainnya"];
const STATUS_PO = ["Dalam proses", "Berjalan", "Habis terjual"];
const TAB = [
  ["ringkasan", "Ringkasan"],
  ["belanja", "Belanja"],
  ["setoran", "Setoran"],
  ["talangan", "Talangan"],
];

const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const tgl = (s) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "");
const opsi = (list, pilih) =>
  list.map((v) => `<option value="${esc(v)}"${v === pilih ? " selected" : ""}>${esc(v)}</option>`).join("");
const pillStatus = (s) =>
  `<span class="pill ${s === "Lunas" ? "lunas" : s === "Kurang setor" ? "kurang" : "balik"}">${esc(s)}</span>`;

function kv(baris) {
  return `<dl class="kv">${baris
    .map(([k, v, tot]) => `<dt${tot ? ' class="tot"' : ""}>${esc(k)}</dt><dd${tot ? ' class="tot"' : ""}>${esc(v)}</dd>`)
    .join("")}</dl>`;
}

function hapusBtn(tabel, id, label) {
  return `<button type="button" class="btn icon outline x" data-hapus="${tabel}:${id}" aria-label="Hapus ${esc(label)}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>`;
}

function tabRingkasan(d, k) {
  return `
    <div class="card tile"><span class="k">Uang di tangan</span><span class="v" id="k-uang" style="font-size:30px">${rupiah(k.uang)}</span>
      <span class="small">Setoran + penjualan − belanja dari kas − talangan yang sudah dikembalikan</span></div>
    <div class="grid2">
      <div class="card tile"><span class="k">Saldo usaha</span><span class="v" id="k-saldo">${bertanda(k.saldo)}</span><span class="small">Setelah semua talangan balik</span></div>
      <div class="card tile"><span class="k">Penjualan</span><span class="v" id="k-jual">${rupiah(k.jual)}</span><span class="small">${k.jualCount} transaksi</span></div>
      <div class="card tile"><span class="k">Belanja usaha</span><span class="v" id="k-usaha">${rupiah(k.usaha)}</span><span class="small">Belanja bersama</span></div>
      <div class="card tile"><span class="k">Modal pemodal</span><span class="v" id="k-modal">${rupiah(k.modalTotal)}</span><span class="small">${d.pemodal.length} pemodal</span></div>
    </div>

    <section class="stack"><span class="eyebrow">Posisi tiap pemodal</span>
      <div class="list" id="k-rekap">${k.rekap
        .map(
          (r) => `<div class="stack" style="gap:4px">
            <div class="row" style="justify-content:space-between"><b>${esc(r.nama)}</b>
              <span class="row" style="gap:8px"><b class="num">${r.selisih ? bertanda(r.selisih) : "Rp0"}</b>${pillStatus(r.status)}</span></div>
            <span class="small">Modal ${rupiah(r.modal)}${r.pribadi ? ` + kopi pribadi ${rupiah(r.pribadi)}` : ""} · setor ${rupiah(r.setor)} · talangan ${rupiah(r.talangan)} · dikembalikan ${rupiah(r.kembali)}</span>
          </div>`,
        )
        .join("")}</div>
      <p class="small" style="margin:0">Plus = talangan yang belum dikembalikan ke orang itu. Minus = kurang setor.</p>
    </section>

    <section class="card stack" style="gap:10px"><span class="eyebrow">Penjualan dan belanja</span>
      ${kv([
        [`Penjualan (${k.jualCount} transaksi)`, rupiah(k.jual)],
        ["Belanja kopi", rupiah(k.kopiTotal)],
        ["Belanja peralatan & kemasan", rupiah(k.alat)],
        ["Total belanja", rupiah(k.totalBelanja), true],
        ["Kopi pribadi (dibayar sendiri)", rupiah(k.pribadi)],
        ["Belanja usaha", rupiah(k.usaha), true],
      ])}</section>

    <section class="card stack" style="gap:10px"><span class="eyebrow">Stok awal + batch 1</span>
      ${kv([
        ["Modal kopi stok awal + batch 1", rupiah(k.kopi1)],
        ["Penjualan tercatat", rupiah(k.jual)],
        ["Untung kotor stok awal + batch 1", bertanda(k.untungKotor1), true],
        ["Kopi batch lain (belum habis)", rupiah(k.stok2)],
        ["Peralatan & kemasan (aset)", rupiah(k.alat)],
      ])}</section>

    <section class="stack"><span class="eyebrow">Daftar PO</span>
      <div class="box"><table><thead><tr><th scope="col">Batch</th><th scope="col" class="r">Berat</th><th scope="col" class="r">Belanja</th><th scope="col" style="padding-left:8px">Status</th></tr></thead>
      <tbody>${k.po
        .map(
          (p) => `<tr><td>Batch ${esc(p.batch)}</td><td class="r">${Number(p.kg).toLocaleString("id-ID")} kg</td><td class="r">${rupiah(p.belanja)}</td>
          <td style="padding-left:8px"><select class="input" style="min-height:44px;padding:0 6px;font-size:14px" data-po="${esc(p.batch)}" aria-label="Status batch ${esc(p.batch)}">${opsi(STATUS_PO, p.status)}</select></td></tr>`,
        )
        .join("")}</tbody></table></div>
      <form class="row" id="f-po" style="gap:8px" novalidate>
        <input class="input" name="batch" maxlength="20" placeholder="Batch" aria-label="Batch baru" style="width:96px">
        <input class="input" name="kg" inputmode="decimal" placeholder="kg" aria-label="Berat (kg)" style="width:80px">
        <button class="btn small" type="submit">Tambah PO</button></form>
    </section>

    <section class="stack"><span class="eyebrow">Penjualan terakhir</span>
      <div class="list">${d.penjualan
        .slice(0, 10)
        .map(
          (p) => `<div class="row" style="justify-content:space-between;align-items:flex-start;font-size:13px">
            <span class="grow">${esc(p.catatan ?? "Dicatat lewat app")}<br><span class="small">${esc(new Date(p.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short" }))}</span></span>
            <b class="num">${rupiah(p.uang_diterima)}</b></div>`,
        )
        .join("")}</div>
    </section>`;
}

function tabBelanja(d, k) {
  const pemodal = d.pemodal.map((p) => p.nama);
  return `
    <form class="card stack" id="f-belanja" style="gap:10px" novalidate>
      <span class="eyebrow">Catat belanja</span>
      <div class="field"><label class="lbl" for="b-item">Barang</label><input class="input" id="b-item" name="item" maxlength="120" placeholder="mis. House Blend Bright Arabica"></div>
      <div class="grid2">
        <div class="field"><label class="lbl" for="b-tgl">Tanggal</label><input class="input" id="b-tgl" name="tanggal" type="date" value="${hariIni()}"></div>
        <div class="field"><label class="lbl" for="b-kat">Kategori</label><select class="input" id="b-kat" name="kategori">${opsi(KATEGORI, "Kopi")}</select></div>
        <div class="field"><label class="lbl" for="b-qty">Qty</label><input class="input" id="b-qty" name="qty" inputmode="numeric" value="1"></div>
        <div class="field"><label class="lbl" for="b-harga">Harga satuan</label><input class="input" id="b-harga" name="harga" inputmode="numeric" placeholder="Rp0"></div>
        <div class="field"><label class="lbl" for="b-oleh">Dibayar oleh</label><select class="input" id="b-oleh" name="dibayar_oleh">${opsi(["Kas", ...pemodal], "Kas")}</select></div>
        <div class="field"><label class="lbl" for="b-untuk">Untuk</label><select class="input" id="b-untuk" name="dibebankan_ke">${opsi(["Bersama", ...pemodal], "Bersama")}</select></div>
        <div class="field"><label class="lbl" for="b-sumber">Sumber</label><input class="input" id="b-sumber" name="sumber" maxlength="120" placeholder="Toko / invoice"></div>
        <div class="field"><label class="lbl" for="b-batch">Batch</label><input class="input" id="b-batch" name="batch" maxlength="20" placeholder="mis. 3"></div>
      </div>
      <div class="field"><label class="lbl" for="b-cat">Catatan <span style="font-weight:400;color:var(--muted)">(opsional)</span></label><input class="input" id="b-cat" name="catatan" maxlength="200"></div>
      <p class="small" style="margin:0">"Dibayar oleh" selain Kas dihitung sebagai talangan orang itu. "Untuk" selain Bersama dihitung sebagai kopi pribadi.</p>
      <button class="btn" type="submit">Simpan belanja</button>
    </form>

    <section class="stack"><span class="eyebrow">Belanja per kelompok</span>
      <div class="box"><table><thead><tr><th scope="col">Kelompok</th><th scope="col" class="r">Jumlah</th></tr></thead>
      <tbody>${k.grup.map((g) => `<tr><td>${esc(g.kelompok)}</td><td class="r">${rupiah(g.jumlah)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Total</td><td class="r">${rupiah(k.totalBelanja)}</td></tr></tfoot></table></div></section>

    <section class="stack"><span class="eyebrow">Semua belanja (${d.belanja.length})</span>
      <div class="list">${d.belanja
        .map(
          (b) => `<div class="entry"><span><b>${esc(b.item)}</b>${b.catatan ? ` (${esc(b.catatan)})` : ""}</span>${hapusBtn("belanja", b.id, b.item)}
            <span class="small">${b.qty} × ${rupiah(b.harga)} = <b>${rupiah(b.jumlah)}</b> · ${esc(b.dibayar_oleh)}${b.dibebankan_ke !== "Bersama" ? ` · untuk ${esc(b.dibebankan_ke)}` : ""}${b.batch ? ` · batch ${esc(b.batch === "0" ? "awal" : b.batch)}` : ""}${b.tanggal ? ` · ${tgl(b.tanggal)}` : ""}</span></div>`,
        )
        .join("")}</div></section>`;
}

function tabSetoran(d) {
  return `
    <form class="card stack" id="f-setoran" style="gap:10px" novalidate>
      <span class="eyebrow">Catat setoran modal</span>
      <div class="grid2">
        <div class="field"><label class="lbl" for="s-nama">Pemodal</label><select class="input" id="s-nama" name="nama">${opsi(d.pemodal.map((p) => p.nama))}</select></div>
        <div class="field"><label class="lbl" for="s-jml">Jumlah</label><input class="input" id="s-jml" name="jumlah" inputmode="numeric" placeholder="Rp0"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl" for="s-tgl">Tanggal</label><input class="input" id="s-tgl" name="tanggal" type="date" value="${hariIni()}"></div>
        <div class="field"><label class="lbl" for="s-ket">Keterangan</label><input class="input" id="s-ket" name="keterangan" maxlength="200"></div>
      </div>
      <button class="btn" type="submit">Simpan setoran</button>
    </form>
    <section class="stack"><span class="eyebrow">Semua setoran (${d.setoran.length})</span>
      <div class="list">${d.setoran
        .map(
          (s) => `<div class="entry"><span><b>${esc(s.nama)}</b> · ${rupiah(s.jumlah)}</span>${hapusBtn("setoran", s.id, `setoran ${s.nama}`)}
            <span class="small">${esc(s.keterangan ?? "")}${s.tanggal ? ` · ${tgl(s.tanggal)}` : ""}</span></div>`,
        )
        .join("")}</div></section>
    <section class="stack"><span class="eyebrow">Pemodal dan modal per orang</span>
      <div class="list">${d.pemodal
        .map(
          (p) => `<div class="row" style="justify-content:space-between;gap:8px"><b class="grow">${esc(p.nama)}</b>
            <input class="input r" style="width:132px;min-height:44px" inputmode="numeric" value="${p.modal.toLocaleString("id-ID")}" data-modal="${esc(p.nama)}" aria-label="Modal ${esc(p.nama)}"></div>`,
        )
        .join("")}</div>
      <form class="row" id="f-pemodal" style="gap:8px" novalidate>
        <input class="input grow" name="nama" maxlength="40" placeholder="Nama pemodal baru" aria-label="Nama pemodal baru">
        <button class="btn small" type="submit">Tambah</button></form>
      <p class="small" style="margin:0">Pemodal juga diundang sebagai Owner di menu Atur supaya bisa melihat Kas.</p>
    </section>`;
}

function tabTalangan(d, k) {
  const belum = k.rekap.filter((r) => r.selisih > 0);
  return `
    <section class="stack"><span class="eyebrow">Talangan yang belum balik</span>
      ${
        belum.length
          ? `<div class="list">${belum
              .map((r) => `<div class="row" style="justify-content:space-between"><b>${esc(r.nama)}</b><b class="num">${rupiah(r.selisih)}</b></div>`)
              .join("")}</div>`
          : `<p class="small">Semua talangan sudah dikembalikan.</p>`
      }
    </section>
    <form class="card stack" id="f-kembali" style="gap:10px" novalidate>
      <span class="eyebrow">Catat pengembalian talangan</span>
      <div class="grid2">
        <div class="field"><label class="lbl" for="t-nama">Kepada</label><select class="input" id="t-nama" name="nama">${opsi(
          d.pemodal.map((p) => p.nama),
          belum[0]?.nama,
        )}</select></div>
        <div class="field"><label class="lbl" for="t-jml">Jumlah</label><input class="input" id="t-jml" name="jumlah" inputmode="numeric" placeholder="Rp0"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl" for="t-tgl">Tanggal</label><input class="input" id="t-tgl" name="tanggal" type="date" value="${hariIni()}"></div>
        <div class="field"><label class="lbl" for="t-ket">Keterangan</label><input class="input" id="t-ket" name="keterangan" maxlength="200"></div>
      </div>
      <button class="btn" type="submit">Simpan pengembalian</button>
    </form>
    <section class="stack"><span class="eyebrow">Semua pengembalian (${d.pengembalian.length})</span>
      <div class="list">${d.pengembalian
        .map(
          (t) => `<div class="entry"><span><b>${esc(t.nama)}</b> · ${rupiah(t.jumlah)}</span>${hapusBtn("pengembalian", t.id, `pengembalian ${t.nama}`)}
            <span class="small">${esc(t.keterangan ?? "")}${t.tanggal ? ` · ${tgl(t.tanggal)}` : ""}</span></div>`,
        )
        .join("")}</div></section>`;
}

export function layarKas(ctx) {
  let tab = "ringkasan";
  let data = null;

  return {
    html: `<main class="screen">
      ${topbar(ctx)}
      <div class="stack" style="gap:4px"><span class="eyebrow">Owner</span><h1>Kas</h1></div>
      <div class="tabs chips" role="group" aria-label="Bagian kas">${TAB.map(
        ([id, label]) => `<button type="button" class="chip" data-tab="${id}" aria-pressed="${id === tab}">${label}</button>`,
      ).join("")}</div>
      <div class="stack" id="isi" style="gap:16px"><p class="small">Memuat…</p></div>
    </main>${nav("owner", "#/owner/kas")}`,
    async mount(root) {
      const isi = root.querySelector("#isi");
      const render = () => {
        const k = hitungKas(data);
        root.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
        isi.innerHTML =
          tab === "ringkasan" ? tabRingkasan(data, k)
          : tab === "belanja" ? tabBelanja(data, k)
          : tab === "setoran" ? tabSetoran(data)
          : tabTalangan(data, k);
      };
      const muat = async () => {
        data = await api.kas();
        render();
      };
      const gagal = (ex) => toast(pesanGalat(ex), { bad: true });
      const teks = (v) => (String(v ?? "").trim() || null);

      root.addEventListener("click", async (e) => {
        const t = e.target.closest("button");
        if (!t) return;
        if (t.dataset.tab) {
          tab = t.dataset.tab;
          render();
        }
        if (t.dataset.hapus) {
          const [tabel, id] = t.dataset.hapus.split(":");
          if (!window.confirm("Hapus catatan ini? Tidak bisa dibatalkan.")) return;
          try {
            await api.hapus(tabel, Number(id));
            await muat();
            toast("Dihapus.");
          } catch (ex) {
            gagal(ex);
          }
        }
      });

      root.addEventListener("change", async (e) => {
        try {
          if (e.target.dataset.po) {
            await api.ubah("po", "batch", e.target.dataset.po, { status: e.target.value });
            await muat();
            toast("Status PO disimpan.");
          }
          if (e.target.dataset.modal) {
            const modal = parseRupiah(e.target.value);
            if (modal === null) throw new Error("Modal harus berupa angka.");
            await api.ubah("pemodal", "nama", e.target.dataset.modal, { modal });
            await muat();
            toast("Modal disimpan.");
          }
        } catch (ex) {
          gagal(ex);
          await muat();
        }
      });

      root.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector("button[type=submit]");
        btn.disabled = true;
        let pesan = "Disimpan.";
        try {
          if (f.id === "f-belanja") {
            const harga = parseRupiah(f.harga.value);
            const qty = parseRupiah(f.qty.value);
            if (!teks(f.item.value) || harga === null || !qty) throw new Error("Isi barang, qty, dan harga.");
            await api.tambah("belanja", {
              item: teks(f.item.value), tanggal: f.tanggal.value || null, kategori: f.kategori.value, qty, harga,
              dibayar_oleh: f.dibayar_oleh.value, dibebankan_ke: f.dibebankan_ke.value,
              sumber: teks(f.sumber.value), batch: teks(f.batch.value), catatan: teks(f.catatan.value),
            });
            pesan = `Belanja ${rupiah(qty * harga)} disimpan.`;
          }
          if (f.id === "f-setoran" || f.id === "f-kembali") {
            const jumlah = parseRupiah(f.jumlah.value);
            if (!jumlah) throw new Error("Isi jumlah.");
            await api.tambah(f.id === "f-setoran" ? "setoran" : "pengembalian", {
              nama: f.nama.value, jumlah, tanggal: f.tanggal.value || null, keterangan: teks(f.keterangan.value),
            });
            pesan = `${f.id === "f-setoran" ? "Setoran" : "Pengembalian"} ${rupiah(jumlah)} disimpan.`;
          }
          if (f.id === "f-pemodal") {
            if (!teks(f.nama.value)) throw new Error("Isi nama pemodal.");
            await api.tambah("pemodal", { nama: teks(f.nama.value), urutan: data.pemodal.length });
            pesan = "Pemodal ditambahkan.";
          }
          if (f.id === "f-po") {
            const kg = Number(String(f.kg.value).replace(",", "."));
            if (!teks(f.batch.value) || !(kg > 0)) throw new Error("Isi batch dan berat (kg).");
            await api.tambah("po", { batch: teks(f.batch.value), kg, status: "Dalam proses", urutan: data.po.length });
            pesan = "PO ditambahkan.";
          }
          // Muat ulang dulu, baru beri tahu: angka di layar sudah yang baru saat pesan muncul.
          await muat();
          toast(pesan);
        } catch (ex) {
          gagal(ex);
          btn.disabled = false;
        }
      });

      await muat();
    },
  };
}
