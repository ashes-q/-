const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildLocalDemTileIndex,
  createSplitLocalDemTileArtifacts,
  terrainTileFileName,
} = require("./split-local-dem-tiles");

test("buildLocalDemTileIndex creates lightweight tile metadata with browser source paths", () => {
  const layer = {
    id: "china-local-dem-tiles",
    type: "terrain-dem-tiles",
    dataset: "mixed-local-dem",
    units: "meters",
    tiles: [
      {
        id: "fixture tile/one",
        label: "Fixture Tile",
        dataset: "mapzen-terrarium",
        bounds: { minLat: 30, maxLat: 31, minLng: 100, maxLng: 101 },
        latitudes: [30, 31],
        longitudes: [100, 101],
        elevationsMeters: [
          [1000, 1100],
          [1200, 1300],
        ],
      },
    ],
  };

  const index = buildLocalDemTileIndex(layer, {
    browserTileDir: "data/terrain/local-dem-tiles",
  });

  assert.equal(index.id, "china-local-dem-tile-index");
  assert.equal(index.type, "terrain-dem-tile-index");
  assert.equal(index.tiles.length, 1);
  assert.equal(index.tiles[0].id, "fixture tile/one");
  assert.equal(index.tiles[0].sourcePath, "data/terrain/local-dem-tiles/fixture-tile-one.json");
  assert.equal(index.tiles[0].latitudes.length, 2);
  assert.equal(index.tiles[0].longitudes.length, 2);
  assert.equal(index.tiles[0].elevationsMeters, undefined);
});

test("createSplitLocalDemTileArtifacts returns full per-tile JSON files", () => {
  const layer = {
    id: "china-local-dem-tiles",
    type: "terrain-dem-tiles",
    dataset: "mixed-local-dem",
    units: "meters",
    tiles: [
      {
        id: "fixture-mapzen",
        dataset: "mapzen-terrarium",
        bounds: { minLat: 30, maxLat: 31, minLng: 100, maxLng: 101 },
        latitudes: [30, 31],
        longitudes: [100, 101],
        elevationsMeters: [
          [1000, 1100],
          [1200, 1300],
        ],
      },
    ],
  };

  const artifacts = createSplitLocalDemTileArtifacts(layer, {
    browserTileDir: "data/terrain/local-dem-tiles",
  });

  assert.equal(artifacts.index.tiles[0].sourcePath, "data/terrain/local-dem-tiles/fixture-mapzen.json");
  assert.equal(artifacts.files.length, 1);
  assert.equal(artifacts.files[0].fileName, "fixture-mapzen.json");
  assert.deepEqual(artifacts.files[0].tile.elevationsMeters, [
    [1000, 1100],
    [1200, 1300],
  ]);
});

test("terrainTileFileName normalizes ids for filesystem paths", () => {
  assert.equal(terrainTileFileName("Qilian Qinghai z7/99/49"), "qilian-qinghai-z7-99-49.json");
});
