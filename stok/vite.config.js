import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

// `vite preview` memakai header keamanan yang sama dengan Vercel (vercel.json),
// supaya pelanggaran CSP ketahuan saat uji lokal, bukan setelah tayang.
// `upgrade-insecure-requests` dibuang karena preview berjalan di http://localhost.
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
const headers = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]));
headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(/;\s*upgrade-insecure-requests/, "");

export default defineConfig({
  // Jangan sisipkan aset kecil sebagai data: URI. CSP hanya mengizinkan
  // font-src 'self', jadi font yang disisipkan akan diblokir browser.
  build: { assetsInlineLimit: 0 },
  preview: { headers },
});
