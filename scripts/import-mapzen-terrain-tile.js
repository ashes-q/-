const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const { mergeLocalDemTile } = require("./generate-local-dem-tile");

const ROOT = path.join(__dirname, "..");
const DEFAULT_OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-local-dem-tiles.json");
const MAPZEN_TERRARIUM_BASE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";

function decodeTerrariumPixel(red, green, blue) {
  return (Number(red) * 256 + Number(green) + Number(blue) / 256) - 32768;
}

function buildMapzenTerrainTileFromPng(options = {}) {
  const z = parseTileCoordinate(options.z, "z");
  const x = parseTileCoordinate(options.x, "x");
  const y = parseTileCoordinate(options.y, "y");
  const image = decodePng(options.pngBuffer);
  const bounds = webMercatorTileBounds(z, x, y);
  const longitudes = buildPixelCenterLongitudes(z, x, image.width);
  const northToSouthLatitudes = buildPixelCenterLatitudes(z, y, image.height);
  const latitudes = [...northToSouthLatitudes].reverse();
  const elevationsMeters = [];

  for (let row = image.height - 1; row >= 0; row -= 1) {
    const outputRow = [];
    for (let column = 0; column < image.width; column += 1) {
      const pixel = getPngPixel(image, column, row);
      outputRow.push(roundMeters(decodeTerrariumPixel(pixel.r, pixel.g, pixel.b)));
    }
    elevationsMeters.push(outputRow);
  }

  return {
    id: requireNonEmpty(options.id, "id"),
    label: options.label || options.id,
    dataset: "mapzen-terrarium",
    units: "meters",
    sourceName: "Mapzen Terrain Tiles on AWS",
    sourceUrl: mapzenTerrariumTileUrl(z, x, y),
    sourceDatasetUrl: "https://registry.opendata.aws/terrain-tiles/",
    generatedAt: options.generatedAt || new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/import-mapzen-terrain-tile.js",
    bounds,
    tileCoordinates: { z, x, y },
    latitudes,
    longitudes,
    elevationsMeters,
  };
}

function decodePng(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("pngBuffer must be a Buffer.");
  }
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error("Invalid PNG signature.");
  }

  let offset = 8;
  let header = null;
  const idatChunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (!header) {
    throw new Error("PNG is missing IHDR.");
  }
  if (header.bitDepth !== 8 || ![2, 6].includes(header.colorType)) {
    throw new Error("Only 8-bit RGB or RGBA PNG terrain tiles are supported.");
  }

  const channels = header.colorType === 6 ? 4 : 3;
  const bytesPerPixel = channels;
  const stride = header.width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(header.height * stride);
  let inputOffset = 0;
  for (let row = 0; row < header.height; row += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const current = inflated.subarray(inputOffset, inputOffset + stride);
    inputOffset += stride;
    const previous = row > 0 ? pixels.subarray((row - 1) * stride, row * stride) : null;
    const output = pixels.subarray(row * stride, (row + 1) * stride);
    unfilterPngScanline(filter, current, previous, output, bytesPerPixel);
  }

  return {
    width: header.width,
    height: header.height,
    channels,
    pixels,
  };
}

function unfilterPngScanline(filter, current, previous, output, bytesPerPixel) {
  for (let index = 0; index < current.length; index += 1) {
    const left = index >= bytesPerPixel ? output[index - bytesPerPixel] : 0;
    const up = previous ? previous[index] : 0;
    const upLeft = previous && index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
    let value;
    if (filter === 0) {
      value = current[index];
    } else if (filter === 1) {
      value = current[index] + left;
    } else if (filter === 2) {
      value = current[index] + up;
    } else if (filter === 3) {
      value = current[index] + Math.floor((left + up) / 2);
    } else if (filter === 4) {
      value = current[index] + paethPredictor(left, up, upLeft);
    } else {
      throw new Error(`Unsupported PNG filter type ${filter}.`);
    }
    output[index] = value & 0xff;
  }
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function getPngPixel(image, column, row) {
  const offset = (row * image.width + column) * image.channels;
  return {
    r: image.pixels[offset],
    g: image.pixels[offset + 1],
    b: image.pixels[offset + 2],
  };
}

function webMercatorTileBounds(z, x, y) {
  const tiles = 2 ** z;
  return {
    minLat: roundCoordinate(tileYToLatitude(y + 1, tiles)),
    maxLat: roundCoordinate(tileYToLatitude(y, tiles)),
    minLng: roundCoordinate(tileXToLongitude(x, tiles)),
    maxLng: roundCoordinate(tileXToLongitude(x + 1, tiles)),
  };
}

function buildPixelCenterLongitudes(z, x, width) {
  const tiles = 2 ** z;
  return Array.from({ length: width }, (_, column) =>
    roundCoordinate(tileXToLongitude(x + (column + 0.5) / width, tiles))
  );
}

function buildPixelCenterLatitudes(z, y, height) {
  const tiles = 2 ** z;
  return Array.from({ length: height }, (_, row) =>
    roundCoordinate(tileYToLatitude(y + (row + 0.5) / height, tiles))
  );
}

function tileXToLongitude(tileX, tiles) {
  return (tileX / tiles) * 360 - 180;
}

function tileYToLatitude(tileY, tiles) {
  const mercator = Math.PI * (1 - (2 * tileY) / tiles);
  return (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
}

function mapzenTerrariumTileUrl(z, x, y) {
  return `${MAPZEN_TERRARIUM_BASE_URL}/${z}/${x}/${y}.png`;
}

async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapzen terrain tile request failed: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
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
    id: options.id,
    label: options.label,
    z: parseTileCoordinate(options.z, "z"),
    x: parseTileCoordinate(options.x, "x"),
    y: parseTileCoordinate(options.y, "y"),
    inputPath: options.input ? path.resolve(process.cwd(), options.input) : "",
    outputPath: options.output ? path.resolve(process.cwd(), options.output) : DEFAULT_OUTPUT_PATH,
  };
}

async function runCli(args) {
  const options = readCliOptions(args);
  const pngBuffer = options.inputPath
    ? fs.readFileSync(options.inputPath)
    : await fetchBuffer(mapzenTerrariumTileUrl(options.z, options.x, options.y));
  const tile = buildMapzenTerrainTileFromPng({
    id: options.id,
    label: options.label,
    z: options.z,
    x: options.x,
    y: options.y,
    pngBuffer,
  });
  const layer = fs.existsSync(options.outputPath)
    ? JSON.parse(fs.readFileSync(options.outputPath, "utf8"))
    : null;
  const nextLayer = mergeLocalDemTile(layer, tile);
  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
  fs.writeFileSync(options.outputPath, `${JSON.stringify(nextLayer, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(ROOT, options.outputPath)} with Mapzen ${options.z}/${options.x}/${options.y} in ${tile.id}.`);
}

function parseTileCoordinate(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

function requireNonEmpty(value, name) {
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required.`);
  }
  return String(value).trim();
}

function roundCoordinate(value) {
  return Math.round(Number(value) * 100000) / 100000;
}

function roundMeters(value) {
  return Math.round(Number(value) * 100) / 100;
}

if (require.main === module) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  buildMapzenTerrainTileFromPng,
  decodePng,
  decodeTerrariumPixel,
  mapzenTerrariumTileUrl,
  readCliOptions,
  webMercatorTileBounds,
};
