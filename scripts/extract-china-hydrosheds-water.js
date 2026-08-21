const fs = require("node:fs");
const path = require("node:path");

const Core = require("../world-map-core");
const { readDbfRows, readPolylineShapes } = require("./extract-china-rivers");
const { readPolygonShapes } = require("./extract-china-water-references");

const ROOT = path.join(__dirname, "..");
const BOUNDARY_PATH = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
const HYDRO_RIVERS_ROOT = path.join(ROOT, "data", "raw", "hydrosheds-hydrorivers-asia");
const HYDRO_LAKES_ROOT = path.join(ROOT, "data", "raw", "hydrosheds-hydrolakes");
const HYDRO_RIVERS_SHP_PATH = path.join(HYDRO_RIVERS_ROOT, "HydroRIVERS_v10_as.shp");
const HYDRO_RIVERS_DBF_PATH = path.join(HYDRO_RIVERS_ROOT, "HydroRIVERS_v10_as.dbf");
const HYDRO_LAKES_SHP_PATH = path.join(HYDRO_LAKES_ROOT, "HydroLAKES_polys_v10.shp");
const HYDRO_LAKES_DBF_PATH = path.join(HYDRO_LAKES_ROOT, "HydroLAKES_polys_v10.dbf");
const RIVER_OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-rivers-hydrosheds.json");
const LAKE_OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-water-references-hydrosheds.json");

const MIN_RIVER_POINTS = 3;
const MIN_LAKE_POINTS = 4;
const MAX_RIVER_POINTS = 120;
const MAX_LAKE_POINTS = 160;
const RIVER_POINT_STEP_DEGREES = 0.08;
const LAKE_POINT_STEP_DEGREES = 0.06;

function buildChinaHydroShedsLayers(options = {}) {
  const boundaryLayer = loadBoundaryLayer(options.boundaryPath || BOUNDARY_PATH);
  const riverRows = readDbfRows(options.riverDbfPath || HYDRO_RIVERS_DBF_PATH);
  const riverShapes = readPolylineShapes(options.riverShpPath || HYDRO_RIVERS_SHP_PATH);
  const lakeRows = readDbfRows(options.lakeDbfPath || HYDRO_LAKES_DBF_PATH);
  const lakeShapes = readPolygonShapes(options.lakeShpPath || HYDRO_LAKES_SHP_PATH);
  return {
    riverLayer: createHydroRiverLayer(riverRows, riverShapes, boundaryLayer),
    waterReferenceLayer: createHydroWaterReferenceLayer(lakeRows, lakeShapes, boundaryLayer),
  };
}

function loadBoundaryLayer(boundaryPath) {
  const boundaryGeoJson = JSON.parse(fs.readFileSync(boundaryPath, "utf8"));
  return Core.extractGeoJsonBoundaryRings(boundaryGeoJson, {
    region: Core.CHINA_REGION,
    minRingPoints: 4,
  });
}

function createHydroRiverLayer(rows, shapes, boundaryLayer) {
  return {
    type: "china-river-centerlines",
    id: "china-hydrosheds-rivers",
    source: "hydrosheds-hydrorivers",
    generatedFrom: "data/raw/hydrosheds-hydrorivers-asia/HydroRIVERS_v10_as.shp",
    license: "HydroSHEDS/HydroRIVERS, see hydrosheds.org for terms",
    clippingBoundary: "geoBoundaries CHN ADM1 simplified",
    curveHint: "Render as CatmullRomCurve3 on the terrain surface; use ORD_STRA and DIS_AV_CMS for visual hierarchy.",
    rivers: createHydroRiverRecords(rows, shapes, boundaryLayer),
  };
}

function createHydroWaterReferenceLayer(rows, shapes, boundaryLayer) {
  return {
    type: "china-water-reference-lines",
    id: "china-hydrosheds-water-references",
    source: "hydrosheds-hydrolakes",
    generatedFrom: ["data/raw/hydrosheds-hydrolakes/HydroLAKES_polys_v10.shp"],
    license: "HydroSHEDS/HydroLAKES, see hydrosheds.org for terms",
    clippingBoundary: "geoBoundaries CHN ADM1 simplified",
    curveHint: "Render lake outlines as low-opacity curved references; keep coastline references in Natural Earth layer.",
    lakes: createHydroLakeRecords(rows, shapes, boundaryLayer),
    coastlines: [],
  };
}

function createHydroRiverRecords(rows, shapes, boundaryLayer) {
  const records = [];
  rows.forEach((row, rowIndex) => {
    const hydroRiverId = numberField(row, "HYRIV_ID", "HydroID", "HYRIVID");
    const insideSegments = splitInsideBoundary(shapes[rowIndex] || [], boundaryLayer, MIN_RIVER_POINTS);
    if (!insideSegments.length) return;

    insideSegments
      .map((segment) => simplifyPath(segment, MAX_RIVER_POINTS, RIVER_POINT_STEP_DEGREES))
      .filter((segment) => segment.length >= MIN_RIVER_POINTS)
      .forEach((segment, segmentIndex) => {
        const order = numberField(row, "ORD_STRA", "ORD_CLAS", "ORD_FLOW");
        const averageDischargeCms = numberField(row, "DIS_AV_CMS", "DIS_AV");
        const upstreamAreaSqKm = numberField(row, "UPLAND_SKM", "CATCH_SKM");
        records.push({
          id: `hydroriver-${hydroRiverId || `${rowIndex}-${segmentIndex}`}`,
          name: textField(row, "RIV_NAME", "NAME", "RiverName") || `HydroRIVER ${hydroRiverId || rowIndex}`,
          nameEn: textField(row, "RIV_NAME", "NAME", "RiverName") || "",
          source: "hydrosheds-hydrorivers",
          sourceFeatureClass: "HydroRIVER reach",
          hydroRiverId,
          nextDownId: numberField(row, "NEXT_DOWN", "NEXTDOWNID"),
          mainRiverId: numberField(row, "MAIN_RIV", "MAINRIV"),
          order,
          averageDischargeCms,
          lengthKm: numberField(row, "LENGTH_KM", "Length_km"),
          upstreamAreaSqKm,
          scaleRank: scaleRankFromHydro(order, averageDischargeCms, upstreamAreaSqKm),
          rank: isMainHydroRiver(order, averageDischargeCms, upstreamAreaSqKm) ? "main" : "tributary",
          tone: toneFromHydro(order, averageDischargeCms),
          path: segment,
        });
      });
  });
  return records.sort((a, b) =>
    a.scaleRank - b.scaleRank ||
    b.averageDischargeCms - a.averageDischargeCms ||
    b.upstreamAreaSqKm - a.upstreamAreaSqKm ||
    a.id.localeCompare(b.id)
  );
}

function createHydroLakeRecords(rows, shapes, boundaryLayer) {
  const records = [];
  rows.forEach((row, rowIndex) => {
    const hydroLakeId = numberField(row, "Hylak_id", "HYLAK_ID", "Hylak_ID");
    const rings = shapes[rowIndex] || [];
    rings
      .map((ring) => ring.filter((point) => Core.isPointInsideGeoBoundaryRings(point, boundaryLayer)).map(copyPoint))
      .filter((ring) => ring.length >= MIN_LAKE_POINTS)
      .map((ring) => simplifyPath(closeRing(ring), MAX_LAKE_POINTS, LAKE_POINT_STEP_DEGREES))
      .forEach((ring, ringIndex) => {
        const name = textField(row, "Lake_name", "LAKE_NAME", "Name") || `HydroLAKE ${hydroLakeId || rowIndex}`;
        records.push({
          id: `hydrolake-${hydroLakeId || `${rowIndex}-${ringIndex}`}`,
          name,
          nameEn: name,
          source: "hydrosheds-hydrolakes",
          sourceFeatureClass: "HydroLAKE polygon",
          hydroLakeId,
          kind: lakeKind(row),
          areaSqKm: numberField(row, "Lake_area", "LAKE_AREA"),
          volumeKm3: numberField(row, "Vol_total", "VOL_TOTAL"),
          pourPoint: {
            lat: numberField(row, "Pour_lat", "POUR_LAT"),
            lng: numberField(row, "Pour_long", "POUR_LONG", "Pour_lon"),
          },
          scaleRank: lakeScaleRank(numberField(row, "Lake_area", "LAKE_AREA")),
          path: ring,
        });
      });
  });
  return records.sort((a, b) => a.scaleRank - b.scaleRank || b.areaSqKm - a.areaSqKm || a.id.localeCompare(b.id));
}

function splitInsideBoundary(paths, boundaryLayer, minPoints) {
  return paths.flatMap((pathPoints) => {
    const segments = [];
    let segment = [];
    pathPoints.forEach((point) => {
      if (Core.isPointInsideGeoBoundaryRings(point, boundaryLayer)) {
        segment.push(copyPoint(point));
        return;
      }
      if (segment.length >= minPoints) segments.push(segment);
      segment = [];
    });
    if (segment.length >= minPoints) segments.push(segment);
    return segments;
  });
}

function simplifyPath(points, maxPoints, stepDegrees) {
  if (points.length <= maxPoints) return points.map(copyPoint);
  const closed = isSamePoint(points[0], points[points.length - 1]);
  const finalIndex = closed ? points.length - 2 : points.length - 1;
  const simplified = [copyPoint(points[0])];
  let last = points[0];
  for (let index = 1; index < finalIndex; index += 1) {
    const point = points[index];
    if (distanceDegrees(last, point) >= stepDegrees) {
      simplified.push(copyPoint(point));
      last = point;
    }
  }
  simplified.push(copyPoint(points[finalIndex]));
  if (closed) simplified.push(copyPoint(simplified[0]));
  if (simplified.length <= maxPoints) return simplified;
  const stride = Math.ceil(simplified.length / maxPoints);
  const strided = simplified.filter((_, index) =>
    index === 0 || index === simplified.length - 1 || index % stride === 0
  );
  if (closed && !isSamePoint(strided[0], strided[strided.length - 1])) {
    strided.push(copyPoint(strided[0]));
  }
  return strided;
}

function scaleRankFromHydro(order, discharge, upstreamArea) {
  if (order >= 6 || discharge >= 1000 || upstreamArea >= 50000) return 3;
  if (order >= 4 || discharge >= 150 || upstreamArea >= 8000) return 5;
  return 7;
}

function isMainHydroRiver(order, discharge, upstreamArea) {
  return scaleRankFromHydro(order, discharge, upstreamArea) <= 5;
}

function toneFromHydro(order, discharge) {
  if (order >= 6 || discharge >= 1000) return "blue";
  if (order >= 4 || discharge >= 150) return "cyan";
  return "ice";
}

function lakeKind(row) {
  const lakeType = numberField(row, "Lake_type", "LAKE_TYPE");
  return lakeType === 2 ? "reservoir" : "lake";
}

function lakeScaleRank(areaSqKm) {
  if (areaSqKm >= 1000) return 3;
  if (areaSqKm >= 100) return 5;
  return 7;
}

function numberField(row, ...names) {
  const value = getField(row, names);
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function textField(row, ...names) {
  const value = getField(row, names);
  return value == null ? "" : String(value).trim();
}

function getField(row, names) {
  const entries = Object.entries(row || {});
  const match = entries.find(([key]) => names.some((name) => key.toLowerCase() === String(name).toLowerCase()));
  return match ? match[1] : undefined;
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

function assertInputFiles() {
  [
    HYDRO_RIVERS_SHP_PATH,
    HYDRO_RIVERS_DBF_PATH,
    HYDRO_LAKES_SHP_PATH,
    HYDRO_LAKES_DBF_PATH,
  ].forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing ${path.relative(ROOT, filePath)}. Download HydroRIVERS Asia and HydroLAKES shapefiles from hydrosheds.org, then place them under data/raw before running this script.`
      );
    }
  });
}

if (require.main === module) {
  assertInputFiles();
  const { riverLayer, waterReferenceLayer } = buildChinaHydroShedsLayers();
  fs.writeFileSync(RIVER_OUTPUT_PATH, `${JSON.stringify(riverLayer, null, 2)}\n`, "utf8");
  fs.writeFileSync(LAKE_OUTPUT_PATH, `${JSON.stringify(waterReferenceLayer, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, RIVER_OUTPUT_PATH)} with ${riverLayer.rivers.length} HydroRIVER reaches.`);
  console.log(`Wrote ${path.relative(ROOT, LAKE_OUTPUT_PATH)} with ${waterReferenceLayer.lakes.length} HydroLAKE outlines.`);
}

module.exports = {
  buildChinaHydroShedsLayers,
  createHydroLakeRecords,
  createHydroRiverRecords,
};
