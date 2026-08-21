const test = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");

const {
  buildMapzenTerrainTileFromPng,
  decodeTerrariumPixel,
  webMercatorTileBounds,
} = require("./import-mapzen-terrain-tile");

test("decodeTerrariumPixel converts RGB channels into meters", () => {
  assert.equal(decodeTerrariumPixel(128, 0, 0), 0);
  assert.equal(decodeTerrariumPixel(128, 16, 128), 16.5);
  assert.equal(decodeTerrariumPixel(127, 255, 0), -1);
});

test("buildMapzenTerrainTileFromPng creates a runtime-compatible DEM tile", () => {
  const png = createFixturePng([
    [encodeTerrariumPixel(100), encodeTerrariumPixel(200)],
    [encodeTerrariumPixel(10), encodeTerrariumPixel(20)],
  ]);

  const tile = buildMapzenTerrainTileFromPng({
    id: "fixture-mapzen-tile",
    label: "Fixture Mapzen tile",
    z: 1,
    x: 1,
    y: 0,
    pngBuffer: png,
    generatedAt: "2026-07-04",
  });

  assert.equal(tile.id, "fixture-mapzen-tile");
  assert.equal(tile.dataset, "mapzen-terrarium");
  assert.equal(tile.sourceName, "Mapzen Terrain Tiles on AWS");
  assert.equal(tile.sourceUrl, "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/1/1/0.png");
  assert.equal(tile.generatedBy, "scripts/import-mapzen-terrain-tile.js");
  assert.deepEqual(tile.bounds, webMercatorTileBounds(1, 1, 0));
  assert.deepEqual(tile.longitudes, [45, 135]);
  assert.deepEqual(tile.latitudes.map((value) => Number(value.toFixed(5))), [40.9799, 79.17133]);
  assert.deepEqual(tile.elevationsMeters, [
    [10, 20],
    [100, 200],
  ]);
});

function encodeTerrariumPixel(heightMeters) {
  const value = Number(heightMeters) + 32768;
  const integer = Math.floor(value);
  return {
    r: Math.floor(integer / 256),
    g: integer % 256,
    b: Math.round((value - integer) * 256),
    a: 255,
  };
}

function createFixturePng(rows) {
  const width = rows[0].length;
  const height = rows.length;
  const rawRows = [];
  rows.forEach((row) => {
    rawRows.push(Buffer.from([0]));
    row.forEach((pixel) => {
      rawRows.push(Buffer.from([pixel.r, pixel.g, pixel.b, pixel.a]));
    });
  });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    createPngChunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0]),
    ])),
    createPngChunk("IDAT", zlib.deflateSync(Buffer.concat(rawRows))),
    createPngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const crcBuffer = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(crcBuffer)),
  ]);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
