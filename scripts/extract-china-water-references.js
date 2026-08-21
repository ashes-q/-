const fs = require("node:fs");
const path = require("node:path");

const Core = require("../world-map-core");
const { readDbfRows, readPolylineShapes } = require("./extract-china-rivers");

const ROOT = path.join(__dirname, "..");
const LAKE_ROOT = path.join(ROOT, "data", "raw", "natural-earth-lakes-10m");
const COASTLINE_ROOT = path.join(ROOT, "data", "raw", "natural-earth-coastline-10m");
const LAKE_SHP_PATH = path.join(LAKE_ROOT, "ne_10m_lakes.shp");
const LAKE_DBF_PATH = path.join(LAKE_ROOT, "ne_10m_lakes.dbf");
const COASTLINE_SHP_PATH = path.join(COASTLINE_ROOT, "ne_10m_coastline.shp");
const COASTLINE_DBF_PATH = path.join(COASTLINE_ROOT, "ne_10m_coastline.dbf");
const BOUNDARY_PATH = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
const OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-water-references-natural-earth.json");

const MIN_LAKE_POINTS = 50;
const MIN_COASTLINE_POINTS = 4;
const MAX_POINTS_PER_LINE = 140;
const POINT_STEP_DEGREES = 0.08;

const DISPLAY_LAKE_NAMES = {
  Dongting: "Dongting Lake",
  Poyang: "Poyang Lake",
  Qinghai: "Qinghai Lake",
  Tai: "Tai Hu",
};

function readPolygonShapes(filePath) {
  const shp = fs.readFileSync(filePath);
  const records = [];
  let offset = 100;
  while (offset + 8 <= shp.length) {
    const contentBytes = shp.readInt32BE(offset + 4) * 2;
    const start = offset + 8;
    const shapeType = shp.readInt32LE(start);
    if ((shapeType === 5 || shapeType === 15 || shapeType === 25) && contentBytes >= 44) {
      const numParts = shp.readInt32LE(start + 36);
      const numPoints = shp.readInt32LE(start + 40);
      const parts = [];
      for (let index = 0; index < numParts; index += 1) {
        parts.push(shp.readInt32LE(start + 44 + index * 4));
      }
      parts.push(numPoints);
      const pointsOffset = start + 44 + numParts * 4;
      records.push(parts.slice(0, -1).map((partStart, partIndex) => {
        const partEnd = parts[partIndex + 1];
        const points = [];
        for (let index = partStart; index < partEnd; index += 1) {
          const pointOffset = pointsOffset + index * 16;
          points.push({
            lng: roundCoordinate(shp.readDoubleLE(pointOffset)),
            lat: roundCoordinate(shp.readDoubleLE(pointOffset + 8)),
          });
        }
        return points;
      }));
    } else {
      records.push([]);
    }
    offset = start + contentBytes;
  }
  return records;
}

function buildChinaWaterReferenceLayer() {
  const boundaryGeoJson = JSON.parse(fs.readFileSync(BOUNDARY_PATH, "utf8"));
  const boundaryLayer = Core.extractGeoJsonBoundaryRings(boundaryGeoJson, {
    region: Core.CHINA_REGION,
    minRingPoints: 4,
  });
  const lakes = createLakeRecords(readDbfRows(LAKE_DBF_PATH), readPolygonShapes(LAKE_SHP_PATH), boundaryLayer);
  const coastlines = createCoastlineRecords(
    readDbfRows(COASTLINE_DBF_PATH),
    readPolylineShapes(COASTLINE_SHP_PATH),
    boundaryLayer
  );
  return {
    type: "china-water-reference-lines",
    id: "china-natural-earth-water-references-10m",
    source: "natural-earth-10m-water-physical",
    generatedFrom: [
      "data/raw/natural-earth-lakes-10m/ne_10m_lakes.shp",
      "data/raw/natural-earth-coastline-10m/ne_10m_coastline.shp",
    ],
    license: "Natural Earth public domain",
    clippingBoundary: "geoBoundaries CHN ADM1 simplified",
    curveHint: "Render as low-opacity curved lake/coastline outlines on a hidden inspection layer.",
    lakes,
    coastlines,
  };
}

function createLakeRecords(rows, shapes, boundaryLayer) {
  const lakes = [];
  rows.forEach((row, rowIndex) => {
    const rings = shapes[rowIndex] || [];
    const insideRings = rings
      .map((ring) => ring.filter((point) => Core.isPointInsideGeoBoundaryRings(point, boundaryLayer)))
      .filter((ring) => ring.length >= MIN_LAKE_POINTS);
    if (!insideRings.length) return;
    if (!shouldKeepLake(row, insideRings)) return;

    insideRings.forEach((ring, ringIndex) => {
      const nameEn = displayLakeName(row);
      const id = slugify(`${nameEn || row.name || "lake"}-${rowIndex}-${ringIndex}`);
      lakes.push({
        id,
        name: row.name || nameEn || id,
        nameEn,
        sourceFeatureClass: row.featurecla,
        scaleRank: row.scalerank,
        kind: String(row.featurecla || "").includes("Reservoir") ? "reservoir" : "lake",
        path: simplifyPath(closeRing(ring)),
      });
    });
  });
  return lakes.sort((a, b) => a.scaleRank - b.scaleRank || b.path.length - a.path.length || a.id.localeCompare(b.id));
}

function createCoastlineRecords(rows, shapes, boundaryLayer) {
  const coastlines = [];
  rows.forEach((row, rowIndex) => {
    splitInsideBoundary(shapes[rowIndex] || [], boundaryLayer)
      .map(simplifyPath)
      .filter((segment) => segment.length >= MIN_COASTLINE_POINTS)
      .forEach((segment, segmentIndex) => {
        coastlines.push({
          id: slugify(`coastline-${rowIndex}-${segmentIndex}`),
          sourceFeatureClass: row.featurecla || "Coastline",
          scaleRank: row.scalerank,
          minZoom: row.min_zoom,
          kind: segment.length >= 120 ? "coastline" : "island",
          path: segment,
        });
      });
  });
  return coastlines.sort((a, b) => a.scaleRank - b.scaleRank || b.path.length - a.path.length || a.id.localeCompare(b.id));
}

function shouldKeepLake(row, rings) {
  const name = displayLakeName(row);
  if (["Qinghai Lake", "Poyang Lake", "Dongting Lake", "Tai Hu"].includes(name)) return true;
  if (Number(row.scalerank) <= 5) return true;
  return rings.some((ring) => ring.length >= 120) && Number(row.scalerank) <= 7;
}

function displayLakeName(row) {
  const name = row.name_en || row.name || "";
  return DISPLAY_LAKE_NAMES[name] || name;
}

function splitInsideBoundary(paths, boundaryLayer) {
  return paths.flatMap((pathPoints) => {
    const segments = [];
    let segment = [];
    pathPoints.forEach((point) => {
      if (Core.isPointInsideGeoBoundaryRings(point, boundaryLayer)) {
        segment.push(copyPoint(point));
        return;
      }
      if (segment.length >= MIN_COASTLINE_POINTS) {
        segments.push(segment);
      }
      segment = [];
    });
    if (segment.length >= MIN_COASTLINE_POINTS) {
      segments.push(segment);
    }
    return segments;
  });
}

function simplifyPath(points) {
  if (points.length <= MAX_POINTS_PER_LINE) {
    return points.map(copyPoint);
  }

  const closed = isSamePoint(points[0], points[points.length - 1]);
  const simplified = [copyPoint(points[0])];
  let last = points[0];
  const finalIndex = closed ? points.length - 2 : points.length - 1;
  for (let index = 1; index < finalIndex; index += 1) {
    const point = points[index];
    if (distanceDegrees(last, point) >= POINT_STEP_DEGREES) {
      simplified.push(copyPoint(point));
      last = point;
    }
  }
  simplified.push(copyPoint(points[finalIndex]));
  if (closed) {
    simplified.push(copyPoint(simplified[0]));
  }

  if (simplified.length <= MAX_POINTS_PER_LINE) {
    return simplified;
  }

  const stride = Math.ceil(simplified.length / MAX_POINTS_PER_LINE);
  const strided = simplified.filter((_, index) =>
    index === 0 || index === simplified.length - 1 || index % stride === 0
  );
  if (closed && !isSamePoint(strided[0], strided[strided.length - 1])) {
    strided.push(copyPoint(strided[0]));
  }
  return strided;
}

function closeRing(points) {
  if (!points.length || isSamePoint(points[0], points[points.length - 1])) {
    return points.map(copyPoint);
  }
  return [...points.map(copyPoint), copyPoint(points[0])];
}

function copyPoint(point) {
  return {
    lat: roundCoordinate(point.lat),
    lng: roundCoordinate(point.lng),
  };
}

function isSamePoint(a, b) {
  return Boolean(a && b && a.lat === b.lat && a.lng === b.lng);
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 100000) / 100000;
}

function distanceDegrees(a, b) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

if (require.main === module) {
  const layer = buildChinaWaterReferenceLayer();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(layer, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT_PATH)} with ${layer.lakes.length} lakes and ${layer.coastlines.length} coastline segments.`
  );
}

module.exports = {
  buildChinaWaterReferenceLayer,
  readPolygonShapes,
};
