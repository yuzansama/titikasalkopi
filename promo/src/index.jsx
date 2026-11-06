import { Composition, registerRoot } from "remotion";
import { products } from "@/data/catalog";
import { ProductPromo, DURATION, FPS } from "./ProductPromo";

// One 9:16 composition per product in the site's catalog: id "produk-<slug>".
// Prices, variants, origin and tasting notes come from web/src/data, so a re-render
// always matches the site.
const Root = () => (
  <>
    {products.map((p) => (
      <Composition
        key={p.slug}
        id={`produk-${p.slug}`}
        component={ProductPromo}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ slug: p.slug }}
      />
    ))}
  </>
);

registerRoot(Root);
