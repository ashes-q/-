const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildLocalDemTile,
  mergeLocalDemTile,
  parseBounds,
} = require("./generate-local-dem-tile");

test("buildLocalDemTile creates a runtime-compatible local DEM tile from a bounding box", async () => {
  const tile = await buildLocalDemTile({
    id: "fixture-tile",
    label: "Fixture DEM tile",
    dataset: "srtm30m",
    bounds: { minLat: 30, maxLat: 31, minLng: 100, maxLng: 102 },
    latIntervals: 2,
    lngIntervals: 2,
    generatedAt: "2026-07-04",
    fetchElevations: async (locations) => locations.map((point) => Math.round(point.lat * 10 + point.lng)),
  });

  assert.equal(tile.id, "fixture-tile");
  assert.equal(tile.label, "Fixture DEM tile");
  assert.equal(tile.dataset, "srtm30m");
  assert.equal(tile.sourceUrl, "https://api.opentopodata.org/v1/srtm30m");
  assert.deepEqual(tile.bounds, { minLat: 30, maxLat: 31, minLng: 100, maxLng: 102 });
  assert.deepEqual(tile.latitudes, [30, 30.5, 31]);
  assert.deepEqual(tile.longitudes, [100, 101, 102]);
  assert.deepEqual(tile.elevationsMeters, [
    [400, 401, 402],
    [405, 406, 407],
    [410, 411, 412],
  ]);
});

test("mergeLocalDemTile replaces an existing tile with the same id", () => {
  const layer = {
    id: "china-local-dem-tiles",
    type: "terrain-dem-tiles",
    units: "meters",
    dataset: "srtm90m-local",
    tiles: [
      { id: "keep", label: "Keep", sourceUrl: "https://api.opentopodata.org/v1/srtm90m" },
      { id: "replace", label: "Old", dataset: "srtm90m" },
    ],
  };

  const next = mergeLocalDemTile(layer, { id: "replace", label: "New", dataset: "srtm30m" });

  assert.deepEqual(next.tiles.map((tile) => tile.id), ["keep", "replace"]);
  assert.equal(next.tiles[1].label, "New");
  assert.equal(next.dataset, "mixed-local-dem");
  assert.equal(layer.tiles[1].label, "Old");
});

test("parseBounds accepts minLat,maxLat,minLng,maxLng", () => {
  assert.deepEqual(parseBounds("18,54,73,135"), {
    minLat: 18,
    maxLat: 54,
    minLng: 73,
    maxLng: 135,
  });
  assert.throws(() => parseBounds("18,54,73"), /Expected --bounds=minLat,maxLat,minLng,maxLng/);
});
