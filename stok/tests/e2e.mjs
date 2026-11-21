/**
 * Uji ujung ke ujung terhadap database Supabase sungguhan.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   SUPABASE_ACCESS_TOKEN=... VIDEO_DIR=/path/ke/video npm run test:e2e
 *
 * VIDEO_DIR berisi <kode>.y4m: video kamera palsu yang menampilkan QR kemasan
 * (bold-200g.y4m untuk gudang, bright-100g.y4m untuk sales). Chrome memutarnya
 * sebagai kamera, jadi jalur scan (jsQR) ikut teruji.
 *
 * Akun uji dibuat dengan email @example.com dan SELALU dihapus di akhir,
 * berikut barang masuk, penjualan, dan undangannya.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const APP = process.env.APP_URL ?? "http://localhost:4173";
const REF = process.env.SUPABASE_REF ?? "ypdpnlzedpnatiqhpkei";
const VIDEO_DIR = process.env.VIDEO_DIR;
const SHOTS = process.env.SHOT_DIR ?? null;
const run = Date.now().toString(36);
const email = (r) => `e2e-${r}-${run}@example.com`;
const PW = `Uji-${run}-pass`;

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN ?? "proxyinjected"}`,
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`SQL gagal: ${JSON.stringify(body)}`);
  return body;
}

const browsers = [];
async function bukaHP(video) {
  const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"];
  if (video) args.push(`--use-file-for-fake-video-capture=${join(VIDEO_DIR, video)}`);
  const browser = await chromium.launch({ args });
  browsers.push(browser);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    permissions: ["camera"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  page.errors = errors;
  return page;
}

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
}

async function daftarDanGabung(page, peran, kode) {
  await page.goto(APP);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await page.getByLabel("Email").fill(email(peran));
  await page.getByLabel("Password").fill(PW);
  await page.locator("form button[type=submit]").click();
  await page.getByLabel("Kode undangan").fill(kode.toLowerCase());
  await page.getByRole("button", { name: "Gabung" }).click();
}

const langkah = [];
async function uji(nama, fn) {
  try {
    await fn();
    langkah.push(`PASS  ${nama}`);
  } catch (e) {
    langkah.push(`FAIL  ${nama}\n      ${String(e.message ?? e).split("\n")[0]}`);
    throw e;
  }
}

let gagal = false;
try {
  await sql(`insert into public.undangan (kode, nama, peran) values ('E2EO-${run.slice(-4).toUpperCase()}', 'Owner E2E', 'owner')`);
  const kodeOwner = `E2EO-${run.slice(-4).toUpperCase()}`;

  // ---------------- Owner bergabung dan mengundang ----------------
  const owner = await bukaHP(null);
  let kodeGudang;
  let kodeSales;
  await uji("owner membuat akun, memakai kode, dan masuk ke Ringkasan", async () => {
    await shot(owner, "00-masuk");
    await daftarDanGabung(owner, "owner", kodeOwner);
    await owner.waitForURL(/#\/owner\/ringkasan$/);
    await owner.getByRole("heading", { name: "Ringkasan" }).waitFor();
  });
  await uji("owner membuat kode undangan Gudang dan Sales", async () => {
    await owner.getByRole("link", { name: "Atur" }).click();
    await owner.getByLabel("Nama anggota baru").fill("Gudang E2E");
    await owner.getByLabel("Peran", { exact: true }).selectOption("gudang");
    await owner.getByRole("button", { name: "Buat kode undangan" }).click();
    kodeGudang = (await owner.locator("#kode-baru").textContent()).trim();
    assert.match(kodeGudang, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const wa = await owner.getByRole("link", { name: "Kirim lewat WhatsApp" }).getAttribute("href");
    assert.ok(decodeURIComponent(wa).includes(kodeGudang), "pesan WhatsApp tanpa kode");
    await owner.getByLabel("Nama anggota baru").fill("Sales E2E");
    await owner.getByLabel("Peran", { exact: true }).selectOption("sales");
    await owner.getByRole("button", { name: "Buat kode undangan" }).click();
    await owner.locator("#kode-baru").filter({ hasNotText: kodeGudang }).waitFor();
    kodeSales = (await owner.locator("#kode-baru").textContent()).trim();
    await shot(owner, "10-owner-atur");
  });

  // ---------------- Gudang: scan barang masuk ----------------
  const gudang = await bukaHP("bold-200g.y4m");
  await uji("gudang bergabung dan langsung masuk ke Scan masuk", async () => {
    await daftarDanGabung(gudang, "gudang", kodeGudang);
    await gudang.waitForURL(/#\/gudang\/scan$/);
  });
  await uji("kamera membaca QR BOLD 200 gr dan menghitungnya sekali", async () => {
    await gudang.locator("#sheet .blend", { hasText: "BOLD · 200 gr" }).waitFor({ timeout: 15000 });
    await gudang.waitForTimeout(1500); // QR tetap di depan kamera: tidak boleh bertambah
    assert.equal(await gudang.locator("#jml").inputValue(), "1");
  });
  await uji("gudang mencatat 12 bungkus masuk", async () => {
    await gudang.locator("#jml").fill("12");
    await gudang.locator("#jml").blur();
    await gudang.getByLabel("Catatan").fill("Roasting uji");
    await shot(gudang, "20-gudang-scan");
    await gudang.getByRole("button", { name: "Simpan 12 bungkus masuk" }).click();
    await gudang.locator("#toast", { hasText: "+12" }).waitFor();
    await gudang.getByRole("link", { name: "Stok" }).click();
    await gudang.locator("#log", { hasText: "Roasting uji" }).waitFor();
    await shot(gudang, "21-gudang-stok");
  });
  await uji("gudang tidak bisa membuka layar owner", async () => {
    await gudang.goto(`${APP}/#/owner/atur`);
    await gudang.waitForURL(/#\/gudang\/scan$/);
  });

  // ---------------- Sales: scan dan manual ----------------
  const sales = await bukaHP("bright-100g.y4m");
  await uji("sales bergabung dan scan BRIGHT 100 gr masuk keranjang", async () => {
    await daftarDanGabung(sales, "sales", kodeSales);
    await sales.waitForURL(/#\/sales\/scan$/);
    await sales.locator("#sheet .blend", { hasText: "BRIGHT · 100 gr" }).waitFor({ timeout: 15000 });
  });
  await uji("uang diterima terisi dari harga katalog dan bisa diubah", async () => {
    await sales.getByRole("button", { name: "Tambah BRIGHT · 100 gr" }).click();
    assert.equal(await sales.locator("#uang").inputValue(), "Rp110.000");
    await sales.locator("#uang").fill("100000");
    await sales.locator("#uang").blur();
    assert.equal(await sales.locator("#uang").inputValue(), "Rp100.000");
    await shot(sales, "30-sales-scan");
    await sales.getByRole("button", { name: /Simpan · stok berkurang 2/ }).click();
    await sales.locator("#toast", { hasText: "Rp100.000" }).waitFor();
  });
  await uji("sales mencatat manual 2 × BOLD 200 gr", async () => {
    await sales.getByRole("navigation").getByRole("link", { name: "Manual" }).click();
    await sales.getByRole("button", { name: "BOLD" }).click();
    await sales.getByRole("button", { name: "200 gr" }).click();
    await sales.getByRole("button", { name: "Tambah jumlah" }).click();
    assert.equal(await sales.locator("#uang").inputValue(), "Rp160.000");
    await shot(sales, "31-sales-manual");
    await sales.getByRole("button", { name: "Simpan penjualan" }).click();
    await sales.locator("#hari-ini", { hasText: "4 bungkus · Rp260.000" }).waitFor();
  });
  await uji("sales tidak bisa membuka layar owner atau gudang", async () => {
    await sales.goto(`${APP}/#/gudang/stok`);
    await sales.waitForURL(/#\/sales\/scan$/);
  });

  // ---------------- Owner melihat hasilnya ----------------
  await uji("ringkasan owner: uang, bungkus, stok, peringatan", async () => {
    await owner.goto(`${APP}/#/owner/ringkasan`);
    await owner.locator("#t-uang", { hasText: "Rp260.000" }).waitFor();
    assert.match(await owner.locator("#t-bks").textContent(), /^4/);
    const stok = await owner.locator("#stok").textContent();
    assert.match(stok, /BOLD · 200 gr\s*10/);
    await owner.getByText("Waktunya pesan BOLD · 200 gr").waitFor();
    const tabel = await owner.locator("#tabel").textContent();
    assert.match(tabel, /Uang diterima\s*Rp260\.000/);
    assert.match(tabel, /Total\s*4\s*Rp270\.000/);
    await shot(owner, "40-owner-ringkasan");
  });
  await uji("label QR menampilkan empat QR berisi alamat /q/", async () => {
    await owner.getByRole("link", { name: "Label QR" }).click();
    await owner.locator(".label svg").first().waitFor();
    assert.equal(await owner.locator(".label").count(), 4);
    await owner.getByText("titikasalkopi.vercel.app/q/bold-100g").waitFor();
    await shot(owner, "50-owner-label");
  });
  await uji("owner menonaktifkan gudang dan gudang kehilangan akses", async () => {
    await owner.getByRole("link", { name: "Atur" }).click();
    await owner.getByRole("button", { name: "Nonaktifkan" }).first().click();
    await owner.getByRole("button", { name: "Aktifkan", exact: true }).waitFor({ timeout: 10000 });
    const status = await sql(
      `select aktif from public.anggota a join auth.users u on u.id = a.user_id where u.email = '${email("gudang")}'`,
    );
    assert.equal(status[0]?.aktif, false, `status di database: ${JSON.stringify(status)}`);
    await gudang.reload();
    await shot(gudang, "60-gudang-nonaktif");
    await gudang.getByRole("heading", { name: "Akses dinonaktifkan" }).waitFor({ timeout: 10000 });
  });
  await uji("tidak ada error di console browser", async () => {
    const semua = [...owner.errors, ...gudang.errors, ...sales.errors].filter((e) => !/favicon/i.test(e));
    assert.deepEqual(semua, [], semua.join(" | "));
  });
} catch {
  gagal = true;
} finally {
  for (const b of browsers) await b.close().catch(() => {});
  await sql(`
    with u as (select id from auth.users where email like 'e2e-%-${run}@example.com')
    , a as (delete from public.penjualan where oleh in (select id from u) returning 1)
    , b as (delete from public.barang_masuk where oleh in (select id from u) returning 1)
    , c as (delete from public.undangan where nama like '% E2E' or dibuat_oleh in (select id from u) returning 1)
    select (select count(*) from a) + (select count(*) from b) + (select count(*) from c) as dihapus;
  `);
  await sql(`delete from auth.users where email like 'e2e-%-${run}@example.com'`);
  const sisa = await sql(`select (select count(*) from auth.users) as users, (select count(*) from public.penjualan) as jual,
    (select count(*) from public.barang_masuk) as masuk, (select count(*) from public.undangan) as undangan`);
  langkah.push(`Bersih-bersih: ${JSON.stringify(sisa[0])}`);
  console.log(langkah.join("\n"));
  process.exit(gagal ? 1 : 0);
}
