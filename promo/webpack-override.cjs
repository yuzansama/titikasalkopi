// Lets the promo import the site's own catalog code (web/src/data), which uses the "@/" alias.
const path = require("path");

const webpackOverride = (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias || {}), "@": path.join(__dirname, "..", "web", "src") },
  },
});

module.exports = { webpackOverride };
