// Renders one MP4 per product into out/. Pass slugs to render only some:
//   node render-all.mjs pondok-baru bold
// Set REMOTION_BROWSER_EXECUTABLE to use a local Chrome instead of Remotion's download.
import path from "node:path";
import { createRequire } from "node:module";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

const require = createRequire(import.meta.url);
const { webpackOverride } = require("./webpack-override.cjs");

const only = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.jsx"), webpackOverride });
const compositions = (await getCompositions(serveUrl, { browserExecutable }))
  .filter((c) => !only.length || only.includes(c.id.replace(/^produk-/, "")));

for (const composition of compositions) {
  const outputLocation = `out/${composition.id}.mp4`;
  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation, crf: 23, colorSpace: "bt709",
    inputProps: composition.props, browserExecutable,
  });
  console.log(`rendered ${outputLocation}`);
}
console.log(`${compositions.length} video(s) in promo/out/`);
