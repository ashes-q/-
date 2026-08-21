const fs = require("node:fs");
const path = require("node:path");

const Core = require("../world-map-core");

const ROOT = path.join(__dirname, "..");
const SOURCE_URL = "https://api.opentopodata.org/v1/srtm90m";
const MAX_LOCATIONS_PER_REQUEST = 100;
const REQUEST_DELAY_MS = 1100;
const FETCH_RETRY_LIMIT = 4;
const PROFILES = {
  medium: {
    id: "china-srtm90m-medium",
    outputPath: path.join(ROOT, "data", "terrain", "china-srtm90m-medium.json"),
    latIntervals: 36,
    lngIntervals: 41,
    requestDelayMs: REQUEST_DELAY_MS,
    note: "Medium-density real DEM grid for the China Terrain Atlas. Values outside SRTM land coverage are stored as 0m so interpolation remains stable at clipped terrain edges.",
  },
  full: {
    id: "china-srtm90m-full",
    outputPath: path.join(ROOT, "data", "terrain", "china-srtm90m-full.json"),
    latIntervals: 90,
    lngIntervals: 145,
    requestDelayMs: 550,
    note: "Higher-density full China real DEM grid for rendering the complete terrain surface before local hand-traced detail sculpting.",
  },
};

function buildAxis(min, max, intervals) {
  const values = [];
  for (let index = 0; index <= intervals; index += 1) {
    values.push(roundCoordinate(min + ((max - min) * index) / intervals));
  }
  return values;
}

function buildLocations(latitudes, longitudes) {
  return latitudes.flatMap((lat) => longitudes.map((lng) => ({ lat, lng })));
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchElevations(locations) {
  const params = new URLSearchParams({
    locations: locations.map((point) => `${point.lat},${point.lng}`).join("|"),
  });
  let lastError = null;
  for (let attempt = 1; attempt <= FETCH_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(`${SOURCE_URL}?${params.toString()}`);
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

async function buildChinaDemGrid(options = {}) {
  const profile = resolveProfile(options.profile);
  const bounds = Core.CHINA_REGION.bounds;
  const latitudes = buildAxis(bounds.minLat, bounds.maxLat, options.latIntervals || profile.latIntervals);
  const longitudes = buildAxis(bounds.minLng, bounds.maxLng, options.lngIntervals || profile.lngIntervals);
  const locations = buildLocations(latitudes, longitudes);
  const elevationValues = [];
  const batches = chunk(locations, MAX_LOCATIONS_PER_REQUEST);

  for (let index = 0; index < batches.length; index += 1) {
    if (index > 0) {
      await delay(options.requestDelayMs ?? profile.requestDelayMs);
    }
    const elevations = await fetchElevations(batches[index]);
    elevationValues.push(...elevations);
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
    id: options.id || profile.id,
    type: "height-grid",
    dataset: "srtm90m",
    units: "meters",
    sourceName: "Open Topo Data SRTM 90m API",
    sourceUrl: SOURCE_URL,
    sourceDatasetUrl: "https://www.opentopodata.org/datasets/srtm/",
    generatedAt: new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/generate-china-dem-grid.js",
    note: options.note || profile.note,
    latitudes,
    longitudes,
    elevationsMeters,
  };
}

function resolveProfile(profileName = "medium") {
  const profile = PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown DEM profile "${profileName}". Expected one of: ${Object.keys(PROFILES).join(", ")}`);
  }
  return profile;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 100000) / 100000;
}

if (require.main === module) {
  const profileName = readProfileArg(process.argv.slice(2));
  const profile = resolveProfile(profileName);
  buildChinaDemGrid({
    profile: profileName,
    onProgress: ({ completed, total }) => {
      console.log(`Fetched ${profileName} DEM batch ${completed}/${total}`);
    },
  })
    .then((grid) => {
      fs.writeFileSync(profile.outputPath, `${JSON.stringify(grid, null, 2)}\n`, "utf8");
      console.log(`Wrote ${path.relative(ROOT, profile.outputPath)} with ${grid.latitudes.length}x${grid.longitudes.length} points.`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

function readProfileArg(args) {
  const profileFlag = args.find((arg) => arg.startsWith("--profile="));
  if (profileFlag) {
    return profileFlag.slice("--profile=".length);
  }
  if (args.includes("--full")) {
    return "full";
  }
  return "medium";
}

module.exports = {
  buildAxis,
  buildChinaDemGrid,
  buildLocations,
  PROFILES,
};
