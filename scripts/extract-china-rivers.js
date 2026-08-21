const fs = require("node:fs");
const path = require("node:path");

const Core = require("../world-map-core");

const ROOT = path.join(__dirname, "..");
const RIVER_ROOT = path.join(ROOT, "data", "raw", "natural-earth-rivers-10m");
const SHP_PATH = path.join(RIVER_ROOT, "ne_10m_rivers_lake_centerlines.shp");
const DBF_PATH = path.join(RIVER_ROOT, "ne_10m_rivers_lake_centerlines.dbf");
const BOUNDARY_PATH = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
const OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-rivers-natural-earth.json");

const MIN_SEGMENT_POINTS = 4;
const MIN_MAIN_INSIDE_POINTS = 40;
const MIN_TRIBUTARY_INSIDE_POINTS = 60;
const MAX_TRIBUTARY_SCALE_RANK = 6;
const POINT_STEP_DEGREES = 0.12;
const MAX_POINTS_PER_SEGMENT = 90;

const DISPLAY_NAME_EN = {
  Chang_Jiang: "Yangtze",
  Huang: "Yellow River",
  Xi: "Xi River",
};

const TONE_BY_NAME = {
  Amur: "ice",
  Argun: "ice",
  Yangtze: "blue",
  "Yellow River": "gold",
  "Xi River": "cyan",
  Mekong: "green",
  Salween: "green",
};

function readDbfRows(filePath) {
  const dbf = fs.readFileSync(filePath);
  const headerLength = dbf.readUInt16LE(8);
  const recordLength = dbf.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; offset < headerLength - 1; offset += 32) {
    if (dbf[offset] === 0x0d) break;
    fields.push({
      name: decodeDbfText(dbf.subarray(offset, offset + 11)),
      type: String.fromCharCode(dbf[offset + 11]),
      length: dbf[offset + 16],
    });
  }

  const rows = [];
  for (let offset = headerLength; offset + recordLength <= dbf.length; offset += recordLength) {
    if (dbf[offset] === 0x2a) continue;
    let cursor = offset + 1;
    const row = {};
    fields.forEach((field) => {
      const raw = decodeDbfText(dbf.subarray(cursor, cursor + field.length));
      row[field.name] = field.type === "N" ? Number(raw) : raw;
      cursor += field.length;
    });
    rows.push(row);
  }
  return rows;
}

function decodeDbfText(buffer) {
  return buffer.toString("utf8").replace(/\0/g, "").trim();
}

function readPolylineShapes(filePath) {
  const shp = fs.readFileSync(filePath);
  const records = [];
  let offset = 100;
  while (offset + 8 <= shp.length) {
    const contentBytes = shp.readInt32BE(offset + 4) * 2;
    const start = offset + 8;
    const shapeType = shp.readInt32LE(start);
    if ((shapeType === 3 || shapeType === 13 || shapeType === 23) && contentBytes >= 44) {
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

function splitInsideBoundary(paths, boundaryLayer) {
  return paths.flatMap((pathPoints) => {
    const segments = [];
    let segment = [];
    pathPoints.forEach((point) => {
      if (Core.isPointInsideGeoBoundaryRings(point, boundaryLayer)) {
        segment.push(point);
        return;
      }
      if (segment.length >= MIN_SEGMENT_POINTS) {
        segments.push(segment);
      }
      segment = [];
    });
    if (segment.length >= MIN_SEGMENT_POINTS) {
      segments.push(segment);
    }
    return segments;
  });
}

function simplifyPath(points) {
  if (points.length <= MAX_POINTS_PER_SEGMENT) {
    return points.map(copyPoint);
  }

  const simplified = [copyPoint(points[0])];
  let last = points[0];
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    if (distanceDegrees(last, point) >= POINT_STEP_DEGREES) {
      simplified.push(copyPoint(point));
      last = point;
    }
  }
  simplified.push(copyPoint(points[points.length - 1]));

  if (simplified.length <= MAX_POINTS_PER_SEGMENT) {
    return simplified;
  }

  const stride = Math.ceil(simplified.length / MAX_POINTS_PER_SEGMENT);
  return simplified.filter((_, index) => index === 0 || index === simplified.length - 1 || index % stride === 0);
}

function shouldKeep(row, totalInsidePoints) {
  if (!String(row.featurecla || "").includes("River")) return false;
  if (row.scalerank <= 4) return totalInsidePoints >= MIN_MAIN_INSIDE_POINTS;
  if (row.scalerank <= MAX_TRIBUTARY_SCALE_RANK) return totalInsidePoints >= MIN_TRIBUTARY_INSIDE_POINTS;
  return false;
}

function createRiverRecords(rows, shapes, boundaryLayer) {
  const rivers = [];
  rows.forEach((row, rowIndex) => {
    const insideSegments = splitInsideBoundary(shapes[rowIndex] || [], boundaryLayer);
    const totalInsidePoints = insideSegments.reduce((sum, segment) => sum + segment.length, 0);
    if (!shouldKeep(row, totalInsidePoints)) return;

    insideSegments
      .map(simplifyPath)
      .filter((segment) => segment.length >= MIN_SEGMENT_POINTS)
      .forEach((segment, segmentIndex) => {
        const nameEn = displayNameEn(row);
        const id = slugify(`${nameEn || row.name || "river"}-${row.ne_id || rowIndex}-${segmentIndex}`);
        rivers.push({
          id,
          name: row.name_zh || row.name || nameEn || id,
          nameEn,
          sourceName: row.name || "",
          sourceNameEn: row.name_en || "",
          sourceFeatureClass: row.featurecla,
          scaleRank: row.scalerank,
          minZoom: row.min_zoom,
          rank: row.scalerank <= 4 ? "main" : "tributary",
          tone: TONE_BY_NAME[nameEn] || "blue",
          path: segment,
        });
      });
  });
  return rivers.sort((a, b) =>
    a.scaleRank - b.scaleRank ||
    a.nameEn.localeCompare(b.nameEn) ||
    b.path.length - a.path.length
  );
}

function displayNameEn(row) {
  const key = String(row.name || row.name_en || "").replace(/\W+/g, "_").replace(/^_+|_+$/g, "");
  return DISPLAY_NAME_EN[key] || row.name_en || row.name || "";
}

function copyPoint(point) {
  return {
    lat: roundCoordinate(point.lat),
    lng: roundCoordinate(point.lng),
  };
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

function buildChinaRiverLayer() {
  const boundaryGeoJson = JSON.parse(fs.readFileSync(BOUNDARY_PATH, "utf8"));
  const boundaryLayer = Core.extractGeoJsonBoundaryRings(boundaryGeoJson, {
    region: Core.CHINA_REGION,
    minRingPoints: 4,
  });
  const rows = readDbfRows(DBF_PATH);
  const shapes = readPolylineShapes(SHP_PATH);
  const rivers = createRiverRecords(rows, shapes, boundaryLayer);
  return {
    type: "china-river-centerlines",
    id: "china-natural-earth-rivers-10m",
    source: "natural-earth-rivers-10m",
    generatedFrom: "data/raw/natural-earth-rivers-10m/ne_10m_rivers_lake_centerlines.shp",
    license: "Natural Earth public domain",
    clippingBoundary: "geoBoundaries CHN ADM1 simplified",
    curveHint: "Render as CatmullRomCurve3 on the terrain surface; main rivers should be stronger than tributaries.",
    rivers,
  };
}

if (require.main === module) {
  const layer = buildChinaRiverLayer();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(layer, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} with ${layer.rivers.length} river segments.`);
}

module.exports = {
  buildChinaRiverLayer,
  readDbfRows,
  readPolylineShapes,
};
