# Promo videos

Vertical (1080×1920, 12 s) promo videos for Instagram Reels / Stories and TikTok, **one per product**,
generated from the site's own catalog (`web/src/data`): name, origin, process, tasting notes, variants
and prices are read from the same code the website uses, so a re-render always matches the site.
Built with [Remotion](https://www.remotion.dev/) (React); colours and fonts follow `docs/00-brand-brief.md`.

Each video: brand → product photo (or the placeholder artwork) with origin → tasting notes
(or the summary when there are none) → price from, up to three variants, and the WhatsApp number.
Sold-out products say so instead of "Pesan via WhatsApp".

```bash
cd promo
npm ci
npm run studio                          # preview every product in the browser
npm run render:all                      # out/produk-<slug>.mp4 for every product
node render-all.mjs pondok-baru bold    # only some products
```

**On GitHub:** the `promo-videos` workflow renders all videos when the catalog or this folder changes,
and on demand (Actions → promo-videos → Run workflow). Download them from the run's
**promo-videos** artifact.

Remotion is free for individuals and companies of up to 3 people; larger companies need a company license.
