# titikasalkopi.id — web

Frontend Titik Asal Kopi. Next.js (App Router) + TypeScript + Tailwind CSS v4, deploy ke Vercel.

Sumber kebenaran brand, produk, dan harga ada di [`../docs/00-brand-brief.md`](../docs/00-brand-brief.md).
Baca file itu dulu sebelum mengubah apa pun di sini.

## Menjalankan

Butuh Node 18.18+ (dikembangkan dengan Node 24) dan npm.

```bash
npm install     # sekali saja, atau setelah package.json berubah
npm run dev     # server pengembangan di http://localhost:3000
npm run build   # build produksi
npm run start   # menjalankan hasil build
npm run lint    # eslint
```

## Di mana isinya

| Yang dicari | File |
|---|---|
| Palet warna & token desain | `src/app/globals.css` |
| Katalog produk & harga | `src/data/products.ts` |
| Nama situs, WhatsApp, Instagram, Shopee | `src/lib/site.ts` |
| Format rupiah | `src/lib/format.ts` |
| Font & metadata global | `src/app/layout.tsx` |

### Palet warna — `src/app/globals.css`

Sepuluh warna dari brief ditulis **sekali** sebagai hex di `:root`, dalam lapis `--brand-*`,
lalu dipetakan ke namespace warna Tailwind lewat `@theme inline`:

| Peran | Token Tailwind | Custom property | Hex |
|---|---|---|---|
| Base / background | `base` | `--color-base` | `#F9F4EE` |
| Surface / card | `surface` | `--color-surface` | `#FDF8F2` |
| Primary (forest green) | `primary` | `--color-primary` | `#0E251F` |
| Deep green alt | `primary-deep` | `--color-primary-deep` | `#063026` |
| Olive (secondary) | `olive` | `--color-olive` | `#474A2D` |
| Rust / terracotta | `rust` | `--color-rust` | `#A34215` |
| Clay brown | `clay` | `--color-clay` | `#954E24` |
| Coffee brown | `coffee` | `--color-coffee` | `#7F4321` |
| Gold (aksen saja) | `gold` | `--color-gold` | `#AC6D04` |
| Espresso (teks cokelat gelap) | `espresso` | `--color-espresso` | `#2C1100` |

Pakai lewat utility (`bg-base`, `text-primary`, `bg-rust/10`, `ring-olive`) atau lewat
CSS biasa (`var(--color-primary)`). `body` sudah di-set cream + teks hijau, jadi halaman
baru tidak perlu mengulang keduanya.

Aturan dari brief: cream selalu jadi base halaman, hijau untuk primary/authority,
keluarga cokelat-rust untuk produk dan kehangatan, gold hanya aksen, dan teks di atas
fill cokelat/hijau memakai cream.

> **Catatan `text-base`.** Karena ada warna bernama `base`, class `text-base` berarti
> **warna cream**, bukan ukuran font 1rem bawaan Tailwind. Untuk ukuran font pakai
> modifier (`text-base/relaxed`) atau nilai eksplisit (`text-[1rem]`).

Menambah warna baru hanya boleh kalau warnanya ada di brief. Tambahkan di kedua blok
(`:root` sebagai `--brand-*`, lalu `@theme inline` sebagai `--color-*`).

### Data produk — `src/data/products.ts`

Satu sumber untuk seluruh katalog (keputusan CEO #3: tanpa CMS eksternal di fase 1).
Dibaca frontend maupun route handler — jangan menyalin harga ke komponen.

Isinya: `houseblendBold` (6 rasio, harga per kg), `houseblendBright` (Signature & Reguler,
per kg), `houseblendFullRobusta` (per kg), `singleOriginBeans` (7 biji dengan metadata
asal/proses/ketinggian/varietal), dan `singleOriginPricing` (harga per tier untuk 1 pack
dan 3 pack ukuran 200 gr). Tipe diekspor berdampingan dengan datanya.

Harga selalu **integer rupiah penuh** (`210_000` = Rp210.000). Untuk menampilkannya
pakai `formatIDR()` dari `src/lib/format.ts`. Metadata yang tidak disebut brief bernilai
`null` — jangan diisi tebakan.

## Catatan

- Checkout fase 1 lewat deeplink WhatsApp (`waLink()` di `src/lib/site.ts`) dan link
  Shopee. Tidak ada payment gateway.
- `AGENTS.md` di folder ini ditulis ulang otomatis oleh `next dev`, biarkan saja.
