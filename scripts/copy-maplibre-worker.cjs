const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const targetDir = path.join(__dirname, "../public/workers");
const target = path.join(targetDir, "maplibre-gl-worker.js");

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
