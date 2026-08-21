const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-local-dem-tiles.json");
const MAX_LOCATIONS_PER_REQUEST = 100;
const REQUEST_DELAY_MS = 1100;
const FETCH_RETRY_LIMIT = 4;
const DATASETS = {
  srtm30m: {
    sourceName: "Open Topo Data SRTM 30m API",
    sourceUrl: "https://api.opentopodata.org/v1/srtm30m",
    sourceDatasetUrl: "https://www.opentopodata.org/datasets/srtm/",
  },
  srtm90m: {
    sourceName: "Open Topo Data SRTM 90m API",
    sourceUrl: "https://api.opentopodata.org/v1/srtm90m",
    sourceDatasetUrl: "https://www.opentopodata.org/datasets/srtm/",
  },
};

async function buildLocalDemTile(options = {}) {
  const dataset = options.dataset || "srtm30m";
  const source = resolveDataset(dataset);
  const bounds = normalizeBounds(options.bounds);
  const latitudes = buildAxis(bounds.minLat, bounds.maxLat, options.latIntervals || 10);
  const longitudes = buildAxis(bounds.minLng, bounds.maxLng, options.lngIntervals || 10);
  const locations = buildLocations(latitudes, longitudes);
  const fetchElevations = options.fetchElevations || ((batch) => fetchOpenTopoDataElevations(batch, source));
  const elevationValues = [];
  const batches = chunk(locations, MAX_LOCATIONS_PER_REQUEST);

  for (let index = 0; index < batches.length; index += 1) {
    if (index > 0) {
      await delay(options.requestDelayMs ?? REQUEST_DELAY_MS);
    }
    const elevations = await fetchElevations(batches[index], { dataset, source });
    if (!Array.isArray(elevations) || elevations.length !== batches[index].length) {
      throw new Error(`Expected ${batches[index].length} elevation values, got ${Array.isArray(elevations) ? elevations.length : "invalid output"}`);
    }
    elevationValues.push(...elevations.map((value) => Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0));
    if (options.onProgress) {
      options.onProgress({ completed: index + 1, total: batches.length });
    }
  }

  const elevationsMeters = [];
  for (let latIndex = 0; latIndex < latitudes.length; latIndex += 1) {
    const start = latIndex * longitudes.length;
    elevationsMeters.push(elevationValues.slice(start, start + longitudes.length));
  }

  return {
    id: requireNonEmpty(options.id, "id"),
    label: options.label || options.id,
    dataset,
    units: "meters",
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    sourceDatasetUrl: source.sourceDatasetUrl,
    generatedAt: options.generatedAt || new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/generate-local-dem-tile.js",
    bounds,
    latitudes,
    longitudes,
    elevationsMeters,
  };
}

function mergeLocalDemTile(layer, tile, options = {}) {
  if (!tile || !tile.id) {
    throw new Error("A local DEM tile with an id is required.");
  }
  const source = layer && typeof layer === "object" ? layer : {};
  const tiles = Array.isArray(source.tiles) ? source.tiles : [];
  const nextTiles = options.appendDuplicate
    ? [...tiles, tile]
    : [...tiles.filter((item) => item.id !== tile.id), tile];
  const dataset = resolveLayerDataset(nextTiles, source.dataset || tile.dataset);

  return {
    id: source.id || "china-local-dem-tiles",
    type: source.type || "terrain-dem-tiles",
    dataset,
    units: source.units || "meters",
    sourceName: source.sourceName || tile.sourceName,
    sourceUrl: source.sourceUrl || tile.sourceUrl,
    sourceDatasetUrl: source.sourceDatasetUrl || tile.sourceDatasetUrl,
    generatedAt: tile.generatedAt,
    generatedBy: "scripts/generate-local-dem-tile.js",
    note: source.note || "Local DEM tiles override the national DEM where available. Generate one reviewed tile per close-up terrain area so high-resolution terrain can be added without replacing the whole China grid.",
    tiles: nextTiles,
  };
}

function resolveLayerDataset(tiles, fallback) {
  const datasets = new Set(
    tiles
      .map((tile) => tile.dataset || inferDatasetFromSourceUrl(tile.sourceUrl))
      .filter((dataset) => dataset && typeof dataset === "string")
  );
  if (datasets.size > 1) {
    return "mixed-local-dem";
  }
  if (datasets.size === 1) {
    return [...datasets][0];
  }
  return fallback || "local-dem";
}

function inferDatasetFromSourceUrl(sourceUrl) {
  const value = String(sourceUrl || "");
  if (value.includes("/srtm30m")) {
    return "srtm30m";
  }
  if (value.includes("/srtm90m")) {
    return "srtm90m";
  }
  return null;
}

function parseBounds(value) {
  const parts = String(value || "").split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error("Expected --bounds=minLat,maxLat,minLng,maxLng");
  }
  return normalizeBounds({
    minLat: parts[0],
    maxLat: parts[1],
    minLng: parts[2],
    maxLng: parts[3],
  });
}

function normalizeBounds(bounds) {
  if (!bounds || typeof bounds !== "object") {
    throw new Error("bounds are required.");
  }
  const normalized = {
    minLat: Number(bounds.minLat),
    maxLat: Number(bounds.maxLat),
    minLng: Number(bounds.minLng),
    maxLng: Number(bounds.maxLng),
  };
  Object.entries(normalized).forEach(([key, value]) => {
    if (!Number.isFinite(value)) {
      throw new Error(`bounds.${key} must be a finite number.`);
    }
  });
  if (normalized.minLat >= normalized.maxLat || normalized.minLng >= normalized.maxLng) {
    throw new Error("bounds must satisfy minLat < maxLat and minLng < maxLng.");
  }
  return normalized;
}

function buildAxis(min, max, intervals) {
  const count = Number(intervals);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Axis intervals must be a positive integer.");
  }
  const values = [];
  for (let index = 0; index <= count; index += 1) {
    values.push(roundCoordinate(min + ((max - min) * index) / count));
  }
  return values;
}

function buildLocations(latitudes, longitudes) {
  return latitudes.flatMap((lat) => longitudes.map((lng) => ({ lat, lng })));
}

async function fetchOpenTopoDataElevations(locations, source) {
  const params = new URLSearchParams({
    locations: locations.map((point) => `${point.lat},${point.lng}`).join("|"),
  });
  let lastError = null;
  for (let attempt = 1; attempt <= FETCH_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(`${source.sourceUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`OpenTopoData request failed: ${response.status} ${response.statusText}`);
      }
      const payload = await response.json();
      if (payload.status !== "OK" || !Array.isArray(payload.results)) {
        throw new Error(`OpenTopoData returned ${payload.status || "an invalid payload"}`);
      }
      if (payload.results.length !== locations.length) {
        throw new Error(`Expected ${locations.length} elevation results, got ${payload.results.length}`);
      }
      return payload.results.map((result) => Number.isFinite(Number(result.elevation))
        ? Math.round(Number(result.elevation))
        : 0);
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_RETRY_LIMIT) {
        await delay(750 * attempt);
      }
    }
  }
  throw lastError;
}

function resolveDataset(dataset) {
  const source = DATASETS[dataset];
  if (!source) {
    throw new Error(`Unknown DEM dataset "${dataset}". Expected one of: ${Object.keys(DATASETS).join(", ")}`);
  }
  return source;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 100000) / 100000;
}

function requireNonEmpty(value, name) {
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required.`);
  }
  return String(value).trim();
}

function readCliOptions(args) {
  const options = {};
  args.forEach((arg) => {
    const [rawKey, ...rawValue] = arg.split("=");
    const key = rawKey.replace(/^--/, "");
    const value = rawValue.join("=");
    if (!key || !value) {
      return;
    }
    options[key] = value;
  });

  return {
    id: options.id,
    label: options.label,
    dataset: options.dataset || "srtm30m",
    bounds: parseBounds(options.bounds),
    latIntervals: parseIntegerOption(options["lat-intervals"] || options.latIntervals || "12", "lat-intervals"),
    lngIntervals: parseIntegerOption(options["lng-intervals"] || options.lngIntervals || "12", "lng-intervals"),
    outputPath: options.output ? path.resolve(process.cwd(), options.output) : DEFAULT_OUTPUT_PATH,
  };
}

function parseIntegerOption(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer.`);
  }
  return parsed;
}

if (require.main === module) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

async function runCli(args) {
  const options = readCliOptions(args);
  const tile = await buildLocalDemTile({
    id: options.id,
    label: options.label,
    dataset: options.dataset,
    bounds: options.bounds,
    latIntervals: options.latIntervals,
    lngIntervals: options.lngIntervals,
    onProgress: ({ completed, total }) => {
      console.log(`Fetched local DEM batch ${completed}/${total}`);
    },
  });
  const layer = fs.existsSync(options.outputPath)
    ? JSON.parse(fs.readFileSync(options.outputPath, "utf8"))
    : null;
  const nextLayer = mergeLocalDemTile(layer, tile);
  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
  fs.writeFileSync(options.outputPath, `${JSON.stringify(nextLayer, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, options.outputPath)} with ${tile.latitudes.length}x${tile.longitudes.length} points in ${tile.id}.`);
}

module.exports = {
  buildAxis,
  buildLocalDemTile,
  buildLocations,
  DATASETS,
  mergeLocalDemTile,
  parseBounds,
  readCliOptions,
};
