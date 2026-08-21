const fs = require("node:fs");
const path = require("node:path");

const {
  buildTerrainTracePatchSuggestions,
  summarizeTerrainTracePatchSuggestions,
} = require("../world-map-core");

const ROOT = path.join(__dirname, "..");
const TRACE_PATH = path.join(ROOT, "data", "terrain", "china-trace-guides.json");
const OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-trace-patch-suggestions.json");

function buildSuggestionFile(traceLayer) {
  const traces = Array.isArray(traceLayer.traces) ? traceLayer.traces : [];
  const patches = traces.flatMap((trace) =>
    buildTerrainTracePatchSuggestions(trace, { includeLineBand: true, includePolygonMask: true }).patches.map((patch) => ({
      ...patch,
      reviewStatus: "draft",
    }))
  );
  const summary = summarizeTerrainTracePatchSuggestions({ patches });
  return {
    id: "china-trace-patch-suggestions",
    type: "terrain-detail-patch-suggestions",
    sourceTraceLayerId: traceLayer.id || "china-trace-guides",
    units: "meters",
    note: "Draft radial, line-band, and polygon-mask patch candidates generated from terrain tracing guides. Review before copying any candidate into china-detail-patches.json.",
    summary,
    patches,
  };
}

function main() {
  const traceLayer = JSON.parse(fs.readFileSync(TRACE_PATH, "utf8"));
  const suggestionFile = buildSuggestionFile(traceLayer);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(suggestionFile, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${suggestionFile.patches.length} trace patch suggestions to ${path.relative(ROOT, OUTPUT_PATH)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSuggestionFile,
};
