import { api } from "../api.js";
import { esc, pesanGalat } from "../lib.js";

/** Masuk / buat akun. */
export function layarMasuk(ctx) {
  let mode = "masuk";
  const html = () => `
  <main class="screen" style="justify-content:center;gap:24px">
    <div class="stack" style="align-items:center;text-align:center;gap:10px">
      <img src="/icon-256.png" alt="Logo Titik Asal Kopi" width="84" height="84" style="border-radius:20px">
      <span class="eyebrow">Titik Asal Kopi</span>
      <h1>Stok &amp; Penjualan</h1>
      <p class="lead" style="max-width:300px">Masuk ke akunmu. Baru diundang? Pilih <b>Buat akun</b>, lalu masukkan kode undangan.</p>
    </div>
    <div class="seg" role="group" aria-label="Pilih">
      <button type="button" class="opt" data-mode="masuk" aria-pressed="${mode === "masuk"}">Masuk</button>
      <button type="button" class="opt" data-mode="daftar" aria-pressed="${mode === "daftar"}">Buat akun</button>
    </div>
    <form class="stack" style="gap:12px" novalidate>
      <div class="field"><label class="lbl" for="email">Email</label>
        <input class="input" id="email" name="email" type="email" autocomplete="email" required placeholder="nama@email.com"></div>
      <div class="field"><label class="lbl" for="pw">Password</label>
        <input class="input" id="pw" name="pw" type="password" minlength="8" required
          autocomplete="${mode === "masuk" ? "current-password" : "new-password"}" placeholder="${mode === "masuk" ? "" : "Minimal 8 karakter"}"></div>
      <p class="err" id="err" role="alert"></p>
      <button class="btn" type="submit">${mode === "masuk" ? "Masuk" : "Buat akun"}</button>
    </form>
  </main>`;

  return {
    html: html(),
    mount(root) {
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-mode]");
        if (!b) return;
        const email = root.querySelector("#email").value;
        mode = b.dataset.mode;
        root.innerHTML = html();
        root.querySelector("#email").value = email;
      });
      root.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target;
        const err = root.querySelector("#err");
        const btn = f.querySelector("button[type=submit]");
        const email = f.email.value.trim();
        const pw = f.pw.value;
        err.textContent = "";
        if (!email || !pw) return (err.textContent = "Isi email dan password.");
        if (mode === "daftar" && pw.length < 8) return (err.textContent = "Password minimal 8 karakter.");
        btn.disabled = true;
        try {
          if (mode === "masuk") await api.masuk(email, pw);
          else await api.daftar(email, pw);
          await ctx.muatUlang();
        } catch (ex) {
          err.textContent = pesanGalat(ex);
          btn.disabled = false;
        }
      });
    },
  };
}

/** Akun sudah ada tapi belum menjadi anggota: masukkan kode undangan. */
export function layarUndangan(ctx) {
  return {
    html: `
  <main class="screen" style="justify-content:center;gap:20px">
    <div class="stack" style="gap:6px">
      <span class="eyebrow">Satu langkah lagi</span>
      <h1>Masukkan kode undangan</h1>
      <p class="lead">Kode dikirim owner, bentuknya seperti <b>K7QM-4XPA</b>. Masuk sebagai ${esc(ctx.user.email)}.</p>
    </div>
    <form class="stack" style="gap:12px" novalidate>
      <div class="field"><label class="lbl" for="kode">Kode undangan</label>
        <input class="input" id="kode" name="kode" autocomplete="off" autocapitalize="characters" spellcheck="false"
          style="font-size:22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase" placeholder="XXXX-XXXX"></div>
      <p class="err" id="err" role="alert"></p>
      <button class="btn" type="submit">Gabung</button>
      <button class="btn outline" type="button" data-act="keluar">Keluar</button>
    </form>
  </main>`,
    mount(root) {
      root.addEventListener("submit", async (e) => {
        e.preventDefault();
        const err = root.querySelector("#err");
        const btn = e.target.querySelector("button[type=submit]");
        const kode = e.target.kode.value.trim();
        if (!kode) return (err.textContent = "Isi kode undangan.");
        btn.disabled = true;
        err.textContent = "";
        try {
          await api.klaimUndangan(kode);
          await ctx.muatUlang();
        } catch (ex) {
          err.textContent = pesanGalat(ex);
          btn.disabled = false;
        }
      });
    },
  };
}

/** Anggota yang dinonaktifkan owner. */
export function layarNonaktif() {
  return {
    html: `<main class="screen" style="justify-content:center;gap:16px">
      <h1>Akses dinonaktifkan</h1>
      <p class="lead">Owner menonaktifkan akunmu. Hubungi owner kalau ini keliru.</p>
      <button class="btn outline" type="button" data-act="keluar">Keluar</button></main>`,
  };
}
