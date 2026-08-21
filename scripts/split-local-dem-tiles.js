const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_INPUT_PATH = path.join(ROOT, "data", "terrain", "china-local-dem-tiles.json");
const DEFAULT_INDEX_OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-local-dem-tile-index.json");
const DEFAULT_TILE_OUTPUT_DIR = path.join(ROOT, "data", "terrain", "local-dem-tiles");
const DEFAULT_BROWSER_TILE_DIR = "data/terrain/local-dem-tiles";

function terrainTileFileName(id) {
  const normalized = String(id || "tile")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${normalized || "tile"}.json`;
}

function buildLocalDemTileIndex(layer, options = {}) {
  const tiles = Array.isArray(layer && layer.tiles) ? layer.tiles : [];
  const browserTileDir = normalizeBrowserDir(options.browserTileDir || DEFAULT_BROWSER_TILE_DIR);
  return {
    id: "china-local-dem-tile-index",
    type: "terrain-dem-tile-index",
    dataset: layer && layer.dataset ? layer.dataset : "mixed-local-dem",
    units: layer && layer.units ? layer.units : "meters",
    sourceLayerId: layer && layer.id ? layer.id : "china-local-dem-tiles",
    sourceName: layer && layer.sourceName ? layer.sourceName : "",
    sourceUrl: layer && layer.sourceUrl ? layer.sourceUrl : "",
    sourceDatasetUrl: layer && layer.sourceDatasetUrl ? layer.sourceDatasetUrl : "",
    generatedAt: layer && layer.generatedAt ? layer.generatedAt : new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/split-local-dem-tiles.js",
    note: "Lightweight local DEM tile index. Full elevation matrices are stored in per-tile JSON files and loaded on demand.",
    tiles: tiles.map((tile) => buildTileMetadata(tile, browserTileDir)),
  };
}

function buildTileMetadata(tile, browserTileDir) {
  const metadata = {};
  Object.entries(tile || {}).forEach(([key, value]) => {
    if (key !== "elevationsMeters") {
      metadata[key] = value;
    }
  });
  metadata.sourcePath = `${browserTileDir}/${terrainTileFileName(metadata.id)}`;
  metadata.hasElevations = Array.isArray(tile && tile.elevationsMeters);
  metadata.elevationRowCount = Array.isArray(tile && tile.elevationsMeters) ? tile.elevationsMeters.length : 0;
  metadata.elevationColumnCount = Array.isArray(tile && tile.elevationsMeters) && Array.isArray(tile.elevationsMeters[0])
    ? tile.elevationsMeters[0].length
    : 0;
  return metadata;
}

function createSplitLocalDemTileArtifacts(layer, options = {}) {
  const browserTileDir = normalizeBrowserDir(options.browserTileDir || DEFAULT_BROWSER_TILE_DIR);
  const index = buildLocalDemTileIndex(layer, { browserTileDir });
  const tiles = Array.isArray(layer && layer.tiles) ? layer.tiles : [];
  return {
    index,
    files: tiles.map((tile) => ({
      fileName: terrainTileFileName(tile.id),
      tile: {
        ...tile,
        sourcePath: `${browserTileDir}/${terrainTileFileName(tile.id)}`,
      },
    })),
  };
}

function writeSplitLocalDemTileArtifacts(options = {}) {
  const inputPath = options.inputPath || DEFAULT_INPUT_PATH;
  const indexOutputPath = options.indexOutputPath || DEFAULT_INDEX_OUTPUT_PATH;
  const tileOutputDir = options.tileOutputDir || DEFAULT_TILE_OUTPUT_DIR;
  const browserTileDir = options.browserTileDir || DEFAULT_BROWSER_TILE_DIR;
  const layer = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const artifacts = createSplitLocalDemTileArtifacts(layer, { browserTileDir });

  fs.mkdirSync(path.dirname(indexOutputPath), { recursive: true });
  fs.mkdirSync(tileOutputDir, { recursive: true });
  fs.writeFileSync(indexOutputPath, `${JSON.stringify(artifacts.index, null, 2)}\n`, "utf8");
  artifacts.files.forEach((file) => {
    fs.writeFileSync(path.join(tileOutputDir, file.fileName), `${JSON.stringify(file.tile, null, 2)}\n`, "utf8");
  });
  return artifacts;
}

function normalizeBrowserDir(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/\/+$/g, "");
}

function readCliOptions(args) {
  const options = {};
  args.forEach((arg) => {
    const [rawKey, ...rawValue] = arg.split("=");
    const key = rawKey.replace(/^--/, "");
    const value = rawValue.join("=");
    if (key && value) {
      options[key] = value;
    }
  });
  return {
    inputPath: options.input ? path.resolve(process.cwd(), options.input) : DEFAULT_INPUT_PATH,
    indexOutputPath: options.index ? path.resolve(process.cwd(), options.index) : DEFAULT_INDEX_OUTPUT_PATH,
    tileOutputDir: options.tiles ? path.resolve(process.cwd(), options.tiles) : DEFAULT_TILE_OUTPUT_DIR,
    browserTileDir: options["browser-tile-dir"] || options.browserTileDir || DEFAULT_BROWSER_TILE_DIR,
  };
}

if (require.main === module) {
  try {
    const options = readCliOptions(process.argv.slice(2));
    const artifacts = writeSplitLocalDemTileArtifacts(options);
    console.log(`Wrote ${path.relative(ROOT, options.indexOutputPath)} and ${artifacts.files.length} local DEM tile files.`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = {
  buildLocalDemTileIndex,
  createSplitLocalDemTileArtifacts,
  terrainTileFileName,
  writeSplitLocalDemTileArtifacts,
};
