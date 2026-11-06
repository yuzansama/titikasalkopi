// Settings for `remotion studio` / `remotion render`. Run from promo/.
const path = require("path");
const { Config } = require("@remotion/cli/config");
const { webpackOverride } = require(path.join(process.cwd(), "webpack-override.cjs"));

Config.overrideWebpackConfig(webpackOverride);
Config.setColorSpace("bt709");
Config.setCrf(23);
