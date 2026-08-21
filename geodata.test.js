const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const {
  CHINA_REGION,
  CHINA_WATER_SYSTEMS,
  buildTerrainTracePatchSuggestions,
  buildTerrainTracePath,
  extractGeoJsonBoundaryRings,
  isPointInsideGeoBoundaryRings,
  sampleTerrainGridMeters,
  summarizeTerrainTracePatchSuggestions,
  summarizeTerrainTraceGuides,
} = require("./world-map-core");

test("downloaded geodata manifest points to available raw files", () => {
  const manifestPath = path.join(ROOT, "data", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.equal(manifest.sources.length, 12);
  assert.ok(manifest.sources.some((source) => source.id === "china-srtm90m-full"));
  assert.ok(manifest.sources.some((source) => source.id === "china-local-dem-tiles"));
  assert.ok(manifest.sources.some((source) => source.id === "cn-atlas-prefectures"));
  assert.ok(manifest.sources.some((source) => source.id === "china-srtm90m-medium"));
  assert.ok(manifest.sources.some((source) => source.id === "natural-earth-lakes-10m"));
  assert.ok(manifest.sources.some((source) => source.id === "natural-earth-coastline-10m"));
  manifest.sources.forEach((source) => {
    assert.ok(fs.existsSync(path.join(ROOT, source.path)), `${source.id} path missing`);
  });
});

test("geoBoundaries China ADM1 simplified file has 34 province-level features", () => {
  const filePath = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.features.length, 34);
});

test("geoBoundaries China ADM1 can be converted into renderable boundary rings", () => {
  const filePath = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const layer = extractGeoJsonBoundaryRings(data, {
    region: CHINA_REGION,
    minRingPoints: 4,
  });

  assert.equal(layer.featureCount, 34);
  assert.ok(layer.rings.length >= 34);
  assert.ok(layer.rings.every((ring) => ring.points.length >= 4));
  assert.ok(layer.rings.every((ring) =>
    ring.points.every((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
  ));
  assert.ok(layer.rings.some((ring) => ring.featureName));
});

test("GitHub cn-atlas prefecture boundaries can be converted into renderable city rings", () => {
  const filePath = path.join(ROOT, "data", "raw", "cn-atlas-prefectures.geojson");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const layer = extractGeoJsonBoundaryRings(data, {
    region: CHINA_REGION,
    minRingPoints: 6,
  });

  assert.equal(data.type, "FeatureCollection");
  assert.ok(data.features.length >= 330);
  assert.ok(layer.rings.length >= 330);
  assert.ok(layer.rings.every((ring) => ring.points.length >= 6));
  assert.ok(layer.rings.some((ring) => ring.featureName));
});

test("geoBoundaries rings can mask terrain cells to real geographic coverage", () => {
  const layer = {
    rings: [
      {
        points: [
          { lat: 20, lng: 100 },
          { lat: 25, lng: 100 },
          { lat: 25, lng: 105 },
          { lat: 20, lng: 105 },
          { lat: 20, lng: 100 },
        ],
      },
    ],
  };

  assert.equal(isPointInsideGeoBoundaryRings({ lat: 22.5, lng: 102.5 }, layer), true);
  assert.equal(isPointInsideGeoBoundaryRings({ lat: 26, lng: 102.5 }, layer), false);
  assert.equal(isPointInsideGeoBoundaryRings({ lat: 22.5, lng: 106 }, layer), false);
  assert.equal(isPointInsideGeoBoundaryRings(null, layer), false);
});

test("Natural Earth archives were extracted with shapefile components", () => {
  [
    "natural-earth-admin0-50m",
    "natural-earth-admin1-50m",
    "natural-earth-rivers-10m",
  ].forEach((folder) => {
    const dir = path.join(ROOT, "data", "raw", folder);
    const files = fs.readdirSync(dir);
    assert.ok(files.some((file) => file.endsWith(".shp")), `${folder} missing .shp`);
    assert.ok(files.some((file) => file.endsWith(".dbf")), `${folder} missing .dbf`);
    assert.ok(files.some((file) => file.endsWith(".prj")), `${folder} missing .prj`);
  });
});

test("China DEM sample grid is available and aligned with the China terrain region", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-srtm90m-sample.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  assert.equal(data.type, "height-grid");
  assert.equal(data.units, "meters");
  assert.equal(data.dataset, "srtm90m");
  assert.ok(data.sourceUrl.includes("api.opentopodata.org"));
  assert.ok(data.latitudes.length >= 7);
  assert.ok(data.longitudes.length >= 9);
  assert.equal(data.elevationsMeters.length, data.latitudes.length);
  data.elevationsMeters.forEach((row) => {
    assert.equal(row.length, data.longitudes.length);
    row.forEach((height) => assert.ok(Number.isFinite(height)));
  });
  assert.ok(data.latitudes[0] >= CHINA_REGION.bounds.minLat);
  assert.ok(data.latitudes[data.latitudes.length - 1] <= CHINA_REGION.bounds.maxLat);
  assert.ok(data.longitudes[0] >= CHINA_REGION.bounds.minLng);
  assert.ok(data.longitudes[data.longitudes.length - 1] <= CHINA_REGION.bounds.maxLng);
});

test("China medium DEM grid improves terrain resolution over the first sample", () => {
  const samplePath = path.join(ROOT, "data", "terrain", "china-srtm90m-sample.json");
  const mediumPath = path.join(ROOT, "data", "terrain", "china-srtm90m-medium.json");
  const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  const data = JSON.parse(fs.readFileSync(mediumPath, "utf8"));

  assert.equal(data.type, "height-grid");
  assert.equal(data.dataset, "srtm90m");
  assert.equal(data.units, "meters");
  assert.equal(data.id, "china-srtm90m-medium");
  assert.equal(data.generatedBy, "scripts/generate-china-dem-grid.js");
  assert.ok(data.sourceUrl.includes("api.opentopodata.org"));
  assert.ok(data.latitudes.length >= 25);
  assert.ok(data.longitudes.length >= 35);
  assert.ok(data.latitudes.length > sample.latitudes.length);
  assert.ok(data.longitudes.length > sample.longitudes.length);
  assert.equal(data.elevationsMeters.length, data.latitudes.length);
  data.elevationsMeters.forEach((row) => {
    assert.equal(row.length, data.longitudes.length);
    row.forEach((height) => assert.ok(Number.isFinite(height)));
  });
  assert.ok(data.latitudes[0] >= CHINA_REGION.bounds.minLat);
  assert.ok(data.latitudes[data.latitudes.length - 1] <= CHINA_REGION.bounds.maxLat);
  assert.ok(data.longitudes[0] >= CHINA_REGION.bounds.minLng);
  assert.ok(data.longitudes[data.longitudes.length - 1] <= CHINA_REGION.bounds.maxLng);
});

test("China full DEM grid renders a complete higher-density national terrain", () => {
  const mediumPath = path.join(ROOT, "data", "terrain", "china-srtm90m-medium.json");
  const fullPath = path.join(ROOT, "data", "terrain", "china-srtm90m-full.json");
  const medium = JSON.parse(fs.readFileSync(mediumPath, "utf8"));
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  assert.equal(data.type, "height-grid");
  assert.equal(data.dataset, "srtm90m");
  assert.equal(data.units, "meters");
  assert.equal(data.id, "china-srtm90m-full");
  assert.equal(data.generatedBy, "scripts/generate-china-dem-grid.js");
  assert.ok(data.sourceUrl.includes("api.opentopodata.org"));
  assert.ok(data.latitudes.length >= 90);
  assert.ok(data.longitudes.length >= 140);
  assert.ok(data.latitudes.length > medium.latitudes.length * 2);
  assert.ok(data.longitudes.length > medium.longitudes.length * 3);
  assert.equal(data.elevationsMeters.length, data.latitudes.length);
  data.elevationsMeters.forEach((row) => {
    assert.equal(row.length, data.longitudes.length);
    row.forEach((height) => assert.ok(Number.isFinite(height)));
  });
  assert.ok(data.latitudes[0] >= CHINA_REGION.bounds.minLat);
  assert.ok(data.latitudes[data.latitudes.length - 1] <= CHINA_REGION.bounds.maxLat);
  assert.ok(data.longitudes[0] >= CHINA_REGION.bounds.minLng);
  assert.ok(data.longitudes[data.longitudes.length - 1] <= CHINA_REGION.bounds.maxLng);
});

test("China local DEM tiles are available for close-up terrain overrides", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-local-dem-tiles.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  assert.equal(data.type, "terrain-dem-tiles");
  assert.equal(data.units, "meters");
  assert.ok(Array.isArray(data.tiles));
  assert.ok(data.tiles.length >= 2);
  assert.equal(data.dataset, "mixed-local-dem");
  assert.ok(
    data.tiles.some((tile) =>
      tile.id === "xuzhou-lianyungang-srtm30m-local" &&
      tile.dataset === "srtm30m" &&
      tile.latitudes.length >= 13 &&
      tile.longitudes.length >= 25
    ),
    "SRTM 30m local terrain tile is missing or too sparse"
  );
  [
    "qinling-main-ridge-srtm30m-local",
    "sichuan-basin-east-wushan-srtm30m-local",
    "tianshan-urumqi-bogda-srtm30m-local",
    "hengduan-dali-lijiang-srtm30m-local",
  ].forEach((tileId) => {
    const tile = data.tiles.find((item) => item.id === tileId);
    assert.ok(tile, `${tileId} is missing`);
    assert.equal(tile.dataset, "srtm30m");
    assert.ok(tile.latitudes.length >= 13, `${tileId} latitude axis is too sparse`);
    assert.ok(tile.longitudes.length >= 25, `${tileId} longitude axis is too sparse`);
  });
  [
    {
      id: "qinling-mapzen-terrarium-z7-102-51",
      coordinates: { z: 7, x: 102, y: 51 },
      overlap: { lat: 34, lng: 108 },
    },
    {
      id: "sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52",
      coordinates: { z: 7, x: 102, y: 52 },
      overlap: { lat: 30.9, lng: 108.85 },
    },
    {
      id: "tianshan-urumqi-bogda-mapzen-terrarium-z7-95-46",
      coordinates: { z: 7, x: 95, y: 46 },
      overlap: { lat: 43.4, lng: 87.75 },
    },
    {
      id: "hengduan-dali-lijiang-mapzen-terrarium-z7-99-53",
      coordinates: { z: 7, x: 99, y: 53 },
      overlap: { lat: 27.1, lng: 100.3 },
    },
    {
      id: "himalaya-everest-mapzen-terrarium-z7-94-53",
      coordinates: { z: 7, x: 94, y: 53 },
      overlap: { lat: 28, lng: 86.9 },
    },
    {
      id: "qilian-qinghai-mapzen-terrarium-z7-99-49",
      coordinates: { z: 7, x: 99, y: 49 },
      overlap: { lat: 38.5, lng: 98.5 },
    },
    {
      id: "loess-ordos-mapzen-terrarium-z7-103-49",
      coordinates: { z: 7, x: 103, y: 49 },
      overlap: { lat: 37.5, lng: 110 },
    },
    {
      id: "yungui-karst-mapzen-terrarium-z7-101-54",
      coordinates: { z: 7, x: 101, y: 54 },
      overlap: { lat: 25.8, lng: 106.5 },
    },
    {
      id: "changbai-mountain-mapzen-terrarium-z7-109-47",
      coordinates: { z: 7, x: 109, y: 47 },
      overlap: { lat: 42, lng: 128 },
    },
    {
      id: "kunlun-tarim-edge-mapzen-terrarium-z7-94-49",
      coordinates: { z: 7, x: 94, y: 49 },
      overlap: { lat: 37, lng: 84.5 },
    },
  ].forEach(({ id, coordinates, overlap }) => {
    const tile = data.tiles.find((item) => item.id === id);
    assert.ok(tile, `${id} is missing`);
    assert.equal(tile.dataset, "mapzen-terrarium");
    assert.equal(tile.generatedBy, "scripts/import-mapzen-terrain-tile.js");
    assert.equal(tile.sourceUrl, `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${coordinates.z}/${coordinates.x}/${coordinates.y}.png`);
    assert.deepEqual(tile.tileCoordinates, coordinates);
    assert.ok(tile.latitudes.length >= 256, `${id} latitude axis is too sparse`);
    assert.ok(tile.longitudes.length >= 256, `${id} longitude axis is too sparse`);
    assert.ok(tile.bounds.minLat < overlap.lat && tile.bounds.maxLat > overlap.lat, `${id} does not overlap the tested latitude`);
    assert.ok(tile.bounds.minLng < overlap.lng && tile.bounds.maxLng > overlap.lng, `${id} does not overlap the tested longitude`);
  });
  data.tiles.forEach((tile) => {
    assert.ok(tile.id);
    assert.ok(Array.isArray(tile.latitudes) && tile.latitudes.length >= 2);
    assert.ok(Array.isArray(tile.longitudes) && tile.longitudes.length >= 2);
    assert.equal(tile.elevationsMeters.length, tile.latitudes.length);
    tile.elevationsMeters.forEach((row) => {
      assert.ok(Array.isArray(row));
      assert.equal(row.length, tile.longitudes.length);
    });
    assert.ok(Number.isFinite(sampleTerrainGridMeters(tile, tile.latitudes[0], tile.longitudes[0])));
  });
});

test("China local DEM tile index points to split on-demand tile files", () => {
  const indexPath = path.join(ROOT, "data", "terrain", "china-local-dem-tile-index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  assert.equal(index.type, "terrain-dem-tile-index");
  assert.equal(index.units, "meters");
  assert.ok(Array.isArray(index.tiles));
  assert.ok(index.tiles.length >= 16);
  assert.ok(index.tiles.filter((tile) => tile.dataset === "mapzen-terrarium").length >= 10);
  index.tiles.forEach((tile) => {
    assert.ok(tile.id);
    assert.ok(tile.sourcePath, `${tile.id} is missing a sourcePath`);
    assert.equal(tile.elevationsMeters, undefined, `${tile.id} should not inline elevation matrices in the index`);
    const tilePath = path.join(ROOT, tile.sourcePath);
    assert.ok(fs.existsSync(tilePath), `${tile.sourcePath} is missing`);
    const fullTile = JSON.parse(fs.readFileSync(tilePath, "utf8"));
    assert.equal(fullTile.id, tile.id);
    assert.ok(Array.isArray(fullTile.elevationsMeters), `${tile.id} split file has no elevationsMeters`);
    assert.equal(fullTile.elevationsMeters.length, fullTile.latitudes.length);
  });
});

test("China terrain source catalog lists import-ready real elevation sources", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-terrain-source-catalog.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  assert.equal(data.type, "terrain-source-catalog");
  assert.equal(data.scope, "china-3d-terrain");
  assert.ok(Array.isArray(data.sources));
  assert.ok(data.sources.length >= 3);
  assert.ok(data.sources.some((source) => source.id === "mapzen-terrain-tiles-aws" && source.format === "terrain-rgb"));
  assert.ok(data.sources.some((source) => source.id === "copernicus-dem-glo-30" && source.resolutionMeters === 30));
  assert.ok(data.sources.some((source) => source.id === "nasa-srtmgl1-v003" && source.resolutionMeters === 30));
  data.sources.forEach((source) => {
    assert.ok(source.id);
    assert.ok(source.name);
    assert.ok(source.kind);
    assert.ok(source.format);
    assert.ok(source.priority >= 1);
    assert.ok(source.coverage.includes("China"));
    assert.ok(source.sourceUrl.startsWith("https://"));
    assert.ok(source.license || source.access);
    assert.ok(source.importPlan);
  });
  const mapzen = data.sources.find((source) => source.id === "mapzen-terrain-tiles-aws");
  assert.equal(mapzen.importScript, "scripts/import-mapzen-terrain-tile.js");
  assert.equal(mapzen.npmScript, "terrain:mapzen:tile");
});

test("local DEM tile generation is wired as a repeatable terrain detail pipeline", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const readme = fs.readFileSync(path.join(ROOT, "data", "README.md"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "manifest.json"), "utf8"));
  const source = manifest.sources.find((item) => item.id === "china-local-dem-tiles");

  assert.equal(packageJson.scripts["terrain:dem:tile"], "node scripts/generate-local-dem-tile.js");
  assert.match(packageJson.scripts.check, /scripts\/generate-local-dem-tile\.js/);
  assert.match(packageJson.scripts.test, /scripts\/generate-local-dem-tile\.test\.js/);
  assert.match(readme, /terrain:dem:tile/);
  assert.match(readme, /SRTM 30m/);
  assert.equal(source.generatedBy, "scripts/generate-local-dem-tile.js");
  assert.equal(source.preferredLocalDataset, "srtm30m");
  assert.ok(source.sourceRepositoryUrl.includes("bopen/elevation"));
});

test("China terrain detail patches are available for local sculpting", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-detail-patches.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  assert.equal(data.type, "terrain-detail-patches");
  assert.equal(data.units, "meters");
  assert.ok(data.patches.length >= 3);
  assert.ok(data.patches.some((patch) => patch.kind === "line-band"));
  assert.ok(data.patches.some((patch) => patch.kind === "polygon-mask"));
  data.patches.forEach((patch) => {
    assert.ok(patch.id);
    assert.ok(["radial", "line-band", "polygon-mask"].includes(patch.kind));
    assert.ok(Number.isFinite(patch.deltaMeters));
    if (patch.kind === "line-band") {
      assert.ok(Array.isArray(patch.points));
      assert.ok(patch.points.length >= 2);
      assert.ok(Number.isFinite(patch.widthDegrees));
      assert.ok(patch.widthDegrees > 0);
      patch.points.forEach((point) => {
        assert.ok(Number.isFinite(point.lat));
        assert.ok(Number.isFinite(point.lng));
        assert.ok(isInChinaRegion(point));
      });
    } else if (patch.kind === "polygon-mask") {
      assert.ok(Array.isArray(patch.points));
      assert.ok(patch.points.length >= 3);
      patch.points.forEach((point) => {
        assert.ok(Number.isFinite(point.lat));
        assert.ok(Number.isFinite(point.lng));
        assert.ok(isInChinaRegion(point));
      });
      if (patch.edgeFeatherDegrees !== undefined) {
        assert.ok(Number.isFinite(patch.edgeFeatherDegrees));
        assert.ok(patch.edgeFeatherDegrees > 0);
      }
    } else {
      assert.ok(Number.isFinite(patch.center.lat));
      assert.ok(Number.isFinite(patch.center.lng));
      assert.ok(isInChinaRegion(patch.center));
      assert.ok(Number.isFinite(patch.radiusDegrees));
      assert.ok(patch.radiusDegrees > 0);
    }
  });
});

test("major water system guide points stay inside the real China ADM1 boundary", () => {
  const boundaryLayer = loadChinaBoundaryLayer();

  CHINA_WATER_SYSTEMS.forEach((river) => {
    assert.ok(river.path.length >= 4);
    river.path.forEach((point) => {
      assert.ok(
        isPointInsideGeoBoundaryRings(point, boundaryLayer),
        `${river.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
      );
    });
  });
});

test("Natural Earth China river extraction includes main rivers and tributary curves inside ADM1", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-rivers-natural-earth.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();

  assert.equal(data.type, "china-river-centerlines");
  assert.equal(data.source, "natural-earth-rivers-10m");
  assert.ok(data.generatedFrom.endsWith("ne_10m_rivers_lake_centerlines.shp"));
  assert.ok(data.rivers.length >= 12);
  assert.ok(data.rivers.some((river) => river.rank === "main"));
  assert.ok(data.rivers.some((river) => river.rank === "tributary"));

  const named = new Set(data.rivers.map((river) => river.nameEn || river.name));
  ["Yangtze", "Yellow River", "Xi River", "Amur", "Mekong"].forEach((name) => {
    assert.ok(named.has(name), `${name} missing from extracted China river layer`);
  });

  data.rivers.forEach((river) => {
    assert.ok(river.id);
    assert.ok(["main", "tributary"].includes(river.rank));
    assert.ok(Number.isFinite(river.scaleRank));
    assert.ok(river.path.length >= 4, `${river.id} does not have enough points for a curve`);
    river.path.forEach((point) => {
      assert.ok(
        isPointInsideGeoBoundaryRings(point, boundaryLayer),
        `${river.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
      );
    });
  });
});

test("project supplemental tributary curves cover key missing China rivers", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-supplemental-tributaries.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();

  assert.equal(data.type, "china-supplemental-river-centerlines");
  assert.equal(data.source, "project-authored-major-tributaries");
  assert.ok(data.rivers.length >= 5);

  const named = new Set(data.rivers.map((river) => river.nameEn || river.name));
  [
    "Jialing River",
    "Yalong River",
    "Wei River",
    "Fen River",
    "Huai River",
    "Han River",
    "Gan River",
    "Bei River",
    "Dong River",
    "Hai River",
    "Yongding River",
    "Daqing River",
    "Ziya River",
    "North Canal",
    "South Canal",
    "Songhua River",
    "Nen River",
    "Second Songhua River",
    "Liao River",
    "Hun-Taizi River",
  ].forEach((name) => {
    assert.ok(named.has(name), `${name} missing from supplemental tributaries`);
  });

  data.rivers.forEach((river) => {
    assert.ok(river.id);
    assert.equal(river.rank, "tributary");
    assert.ok(Number.isFinite(river.scaleRank));
    assert.equal(river.source, data.source);
    assert.ok(river.path.length >= 4, `${river.id} does not have enough points for a curve`);
    river.path.forEach((point) => {
      assert.ok(
        isPointInsideGeoBoundaryRings(point, boundaryLayer),
        `${river.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
      );
    });
  });
});

test("Natural Earth China water references include coastline and major lake outlines", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-water-references-natural-earth.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();

  assert.equal(data.type, "china-water-reference-lines");
  assert.equal(data.source, "natural-earth-10m-water-physical");
  assert.ok(data.generatedFrom.some((source) => source.endsWith("ne_10m_lakes.shp")));
  assert.ok(data.generatedFrom.some((source) => source.endsWith("ne_10m_coastline.shp")));
  assert.ok(data.lakes.length >= 5);
  assert.ok(data.coastlines.length >= 8);

  const lakeNames = new Set(data.lakes.map((lake) => lake.nameEn || lake.name));
  ["Qinghai Lake", "Poyang Lake", "Dongting Lake", "Tai Hu"].forEach((name) => {
    assert.ok(lakeNames.has(name), `${name} missing from extracted lake references`);
  });

  data.lakes.forEach((lake) => {
    assert.ok(lake.id);
    assert.ok(lake.path.length >= 8, `${lake.id} lake outline is too sparse`);
    assert.ok(
      lake.path.some((point) => isPointInsideGeoBoundaryRings(point, boundaryLayer)),
      `${lake.id} has no points inside China ADM1 boundary`
    );
  });
  data.coastlines.forEach((coastline) => {
    assert.ok(coastline.id);
    assert.ok(["coastline", "island"].includes(coastline.kind));
    assert.ok(coastline.path.length >= 4, `${coastline.id} coastline outline is too sparse`);
    assert.ok(
      coastline.path.some((point) => isPointInsideGeoBoundaryRings(point, boundaryLayer)),
      `${coastline.id} has no points inside China ADM1 boundary`
    );
  });
});

test("HydroSHEDS import pipeline can normalize China river reaches and lake polygons", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const readme = fs.readFileSync(path.join(ROOT, "data", "README.md"), "utf8");
  const hydrosheds = require("./scripts/extract-china-hydrosheds-water");
  const boundaryLayer = {
    rings: [
      {
        points: [
          { lat: 20, lng: 100 },
          { lat: 35, lng: 100 },
          { lat: 35, lng: 120 },
          { lat: 20, lng: 120 },
          { lat: 20, lng: 100 },
        ],
      },
    ],
  };

  const rivers = hydrosheds.createHydroRiverRecords(
    [
      {
        HYRIV_ID: 101,
        NEXT_DOWN: 102,
        MAIN_RIV: 100,
        ORD_STRA: 6,
        DIS_AV_CMS: 1800,
        LENGTH_KM: 210,
        UPLAND_SKM: 52000,
      },
      {
        HYRIV_ID: 201,
        NEXT_DOWN: 101,
        MAIN_RIV: 100,
        ORD_STRA: 3,
        DIS_AV_CMS: 80,
        LENGTH_KM: 42,
        UPLAND_SKM: 1300,
      },
    ],
    [
      [[{ lat: 25, lng: 101 }, { lat: 26, lng: 104 }, { lat: 27, lng: 108 }, { lat: 28, lng: 112 }]],
      [[{ lat: 26, lng: 103 }, { lat: 26.4, lng: 104.6 }, { lat: 27, lng: 106 }, { lat: 27.6, lng: 107.2 }]],
    ],
    boundaryLayer
  );
  const lakes = hydrosheds.createHydroLakeRecords(
    [
      {
        Hylak_id: 301,
        Lake_name: "Fixture Lake",
        Lake_type: 1,
        Lake_area: 640,
        Vol_total: 21.5,
        Pour_lat: 27.2,
        Pour_long: 105.1,
      },
    ],
    [
      [[
        { lat: 26, lng: 104 },
        { lat: 27, lng: 104.5 },
        { lat: 27.4, lng: 105.5 },
        { lat: 26.5, lng: 106.2 },
        { lat: 26, lng: 104 },
      ]],
    ],
    boundaryLayer
  );

  assert.equal(packageJson.scripts["terrain:hydrosheds"], "node scripts/extract-china-hydrosheds-water.js");
  assert.match(readme, /HydroRIVERS/);
  assert.match(readme, /HydroLAKES/);
  assert.match(readme, /terrain:hydrosheds/);
  assert.equal(rivers.length, 2);
  assert.equal(rivers[0].id, "hydroriver-101");
  assert.equal(rivers[0].rank, "main");
  assert.equal(rivers[0].hydroRiverId, 101);
  assert.equal(rivers[0].nextDownId, 102);
  assert.equal(rivers[0].mainRiverId, 100);
  assert.equal(rivers[0].order, 6);
  assert.equal(rivers[0].averageDischargeCms, 1800);
  assert.equal(rivers[1].rank, "tributary");
  assert.ok(rivers.every((river) => river.source === "hydrosheds-hydrorivers"));
  assert.ok(rivers.every((river) => river.path.every((point) => isPointInsideGeoBoundaryRings(point, boundaryLayer))));
  assert.equal(lakes.length, 1);
  assert.equal(lakes[0].id, "hydrolake-301");
  assert.equal(lakes[0].name, "Fixture Lake");
  assert.equal(lakes[0].areaSqKm, 640);
  assert.equal(lakes[0].volumeKm3, 21.5);
  assert.equal(lakes[0].kind, "lake");
  assert.ok(lakes[0].path.every((point) => isPointInsideGeoBoundaryRings(point, boundaryLayer)));
});

test("project supplemental water references cover Yunnan plateau lakes", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-supplemental-water-references.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();

  assert.equal(data.type, "china-supplemental-water-reference-lines");
  assert.equal(data.source, "project-authored-major-lakes");
  assert.ok(data.lakes.length >= 2);
  assert.deepEqual(data.coastlines, []);

  const lakeNames = new Set(data.lakes.map((lake) => lake.nameEn || lake.name));
  ["Dianchi Lake", "Erhai Lake"].forEach((name) => {
    assert.ok(lakeNames.has(name), `${name} missing from supplemental lake references`);
  });

  data.lakes.forEach((lake) => {
    assert.ok(lake.id);
    assert.equal(lake.kind, "lake");
    assert.equal(lake.source, data.source);
    assert.ok(lake.path.length >= 8, `${lake.id} lake outline is too sparse`);
    lake.path.forEach((point) => {
      assert.ok(
        isPointInsideGeoBoundaryRings(point, boundaryLayer),
        `${lake.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
      );
    });
  });
});

test("China terrain trace guides are available for manual tracing", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();

  assert.equal(data.type, "terrain-trace-guides");
  assert.ok(data.traces.length >= 3);
  const summary = summarizeTerrainTraceGuides(data);
  assert.ok(summary.ridges >= 1);
  assert.ok(summary.basinEdges >= 1);
  assert.ok(summary.valleys >= 1);
  data.traces.forEach((trace) => {
    assert.ok(trace.id);
    assert.ok(trace.label);
    assert.ok(["ridge", "basin-edge", "valley"].includes(trace.kind));
    assert.ok(buildTerrainTracePath(trace).length >= 2);
    trace.points.forEach((point) => {
      assert.ok(
        isPointInsideGeoBoundaryRings(point, boundaryLayer),
        `${trace.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
      );
    });
  });
});

test("China terrain trace guides include the Sichuan Basin east edge for later sculpting", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const trace = data.traces.find((item) => item.id === "sichuan-basin-east-edge");

  assert.ok(trace, "sichuan-basin-east-edge trace is missing");
  assert.equal(trace.kind, "basin-edge");
  assert.ok(buildTerrainTracePath(trace).length >= 4);
  assert.ok(trace.points.every((point) => point.lng >= 107.2 && point.lng <= 109.2));
});

test("China terrain trace guides include the Tian Shan ridge between Xinjiang basins", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const trace = data.traces.find((item) => item.id === "tianshan-main-ridge");

  assert.ok(trace, "tianshan-main-ridge trace is missing");
  assert.equal(trace.kind, "ridge");
  assert.ok(buildTerrainTracePath(trace).length >= 5);
  assert.ok(trace.points.every((point) => point.lat >= 41 && point.lat <= 45));
  assert.ok(trace.points.every((point) => point.lng >= 78 && point.lng <= 96));
});

test("China terrain trace guides include the Qilian ridge along the northeast Tibetan Plateau", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const trace = data.traces.find((item) => item.id === "qilian-main-ridge");

  assert.ok(trace, "qilian-main-ridge trace is missing");
  assert.equal(trace.kind, "ridge");
  assert.ok(buildTerrainTracePath(trace).length >= 5);
  assert.ok(trace.points.every((point) => point.lat >= 36 && point.lat <= 40));
  assert.ok(trace.points.every((point) => point.lng >= 94 && point.lng <= 104));
});

test("China terrain trace guides include the Hengduan ridge for southwest relief tracing", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const trace = data.traces.find((item) => item.id === "hengduan-main-ridge");

  assert.ok(trace, "hengduan-main-ridge trace is missing");
  assert.equal(trace.kind, "ridge");
  assert.ok(buildTerrainTracePath(trace).length >= 6);
  assert.ok(trace.points.every((point) => point.lat >= 24 && point.lat <= 33));
  assert.ok(trace.points.every((point) => point.lng >= 97 && point.lng <= 102));
});

test("China terrain trace guides include the Yarlung Tsangpo valley for south Tibet tracing", () => {
  const filePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const trace = data.traces.find((item) => item.id === "yarlung-tsangpo-valley");

  assert.ok(trace, "yarlung-tsangpo-valley trace is missing");
  assert.equal(trace.kind, "valley");
  assert.ok(buildTerrainTracePath(trace).length >= 6);
  assert.ok(trace.points.every((point) => point.lat >= 28 && point.lat <= 31));
  assert.ok(trace.points.every((point) => point.lng >= 82 && point.lng <= 96));
});

test("China terrain trace patch suggestions are generated from trace guides", () => {
  const tracePath = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
  const suggestionPath = path.join(ROOT, "data", "terrain", "china-trace-patch-suggestions.json");
  const traceLayer = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  const suggestionLayer = JSON.parse(fs.readFileSync(suggestionPath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();
  const expectedPatches = traceLayer.traces.flatMap((trace) =>
    buildTerrainTracePatchSuggestions(trace, { includeLineBand: true, includePolygonMask: true }).patches
  );

  assert.equal(suggestionLayer.type, "terrain-detail-patch-suggestions");
  assert.equal(suggestionLayer.sourceTraceLayerId, traceLayer.id);
  assert.equal(suggestionLayer.units, "meters");
  assert.equal(suggestionLayer.patches.length, expectedPatches.length);
  assert.deepEqual(
    suggestionLayer.patches.map((patch) => patch.id),
    expectedPatches.map((patch) => patch.id)
  );
  assert.deepEqual(
    summarizeTerrainTracePatchSuggestions(suggestionLayer),
    summarizeTerrainTracePatchSuggestions({ patches: expectedPatches })
  );
  suggestionLayer.patches.forEach((patch) => {
    assert.ok(["radial", "line-band", "polygon-mask"].includes(patch.kind));
    assert.ok(patch.reviewStatus === "draft");
    assert.ok(patch.sourceTraceId);
    assert.ok(["ridge", "basin-edge", "valley"].includes(patch.sourceTraceKind));
    if (patch.kind === "radial") {
      assert.ok(isInChinaRegion(patch.center));
      assert.ok(
        isPointInsideGeoBoundaryRings(patch.center, boundaryLayer),
        `${patch.id} center ${patch.center.lat},${patch.center.lng} falls outside China ADM1 boundary`
      );
      assert.ok(Number.isFinite(patch.radiusDegrees));
    } else {
      assert.ok(Array.isArray(patch.points));
      assert.ok(patch.points.length >= (patch.kind === "polygon-mask" ? 3 : 2));
      patch.points.forEach((point) => {
        assert.ok(isInChinaRegion(point));
        assert.ok(
          isPointInsideGeoBoundaryRings(point, boundaryLayer),
          `${patch.id} point ${point.lat},${point.lng} falls outside China ADM1 boundary`
        );
      });
      if (patch.kind === "line-band") {
        assert.ok(Number.isFinite(patch.widthDegrees));
      }
      if (patch.kind === "polygon-mask") {
        assert.ok(Number.isFinite(patch.edgeFeatherDegrees));
      }
    }
    assert.ok(Number.isFinite(patch.deltaMeters));
  });
});

test("China approved terrain patch preview file contains reviewed suggestions only", () => {
  const approvedPath = path.join(ROOT, "data", "terrain", "china-approved-detail-patches.json");
  const suggestionPath = path.join(ROOT, "data", "terrain", "china-trace-patch-suggestions.json");
  const approvedLayer = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
  const suggestionLayer = JSON.parse(fs.readFileSync(suggestionPath, "utf8"));
  const boundaryLayer = loadChinaBoundaryLayer();
  const suggestionIds = new Set(suggestionLayer.patches.map((patch) => patch.id));

  assert.equal(approvedLayer.type, "terrain-detail-patches");
  assert.equal(approvedLayer.units, "meters");
  assert.equal(approvedLayer.sourceSuggestionLayerId, suggestionLayer.id);
  assert.ok(approvedLayer.id.includes("approved"));
  assert.ok(approvedLayer.patches.length >= 1);
  approvedLayer.patches.forEach((patch) => {
    assert.equal(patch.kind, "radial");
    assert.equal(patch.reviewStatus, "approved");
    assert.ok(suggestionIds.has(patch.sourceSuggestionId));
    assert.ok(isInChinaRegion(patch.center));
    assert.ok(
      isPointInsideGeoBoundaryRings(patch.center, boundaryLayer),
      `${patch.id} center ${patch.center.lat},${patch.center.lng} falls outside China ADM1 boundary`
    );
    assert.ok(Number.isFinite(patch.radiusDegrees));
    assert.ok(Number.isFinite(patch.deltaMeters));
  });
});

function loadChinaBoundaryLayer() {
  const filePath = path.join(ROOT, "data", "raw", "geoboundaries-chn-adm1-simplified.geojson");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return extractGeoJsonBoundaryRings(data, {
    region: CHINA_REGION,
    minRingPoints: 4,
  });
}

function isInChinaRegion(point) {
  return point.lat >= CHINA_REGION.bounds.minLat &&
    point.lat <= CHINA_REGION.bounds.maxLat &&
    point.lng >= CHINA_REGION.bounds.minLng &&
    point.lng <= CHINA_REGION.bounds.maxLng;
}
