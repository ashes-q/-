const fs = require("node:fs");
const path = require("node:path");

const {
  promoteTerrainPatchSuggestions,
  summarizeTerrainDetailPatches,
} = require("../world-map-core");

const ROOT = path.join(__dirname, "..");
const SUGGESTION_PATH = path.join(ROOT, "data", "terrain", "china-trace-patch-suggestions.json");
const OUTPUT_PATH = path.join(ROOT, "data", "terrain", "china-approved-detail-patches.json");

function buildApprovedPatchFile(suggestionLayer, patchIds, options = {}) {
  const approved = promoteTerrainPatchSuggestions(suggestionLayer, patchIds, {
    id: options.id || "china-approved-detail-patches",
    labelPrefix: options.labelPrefix || "Reviewed",
  });
  return {
    ...approved,
    note: "Reviewed local height offsets promoted from trace-derived patch suggestions. Merge selected patches into china-detail-patches.json only after visual review.",
    sourceSuggestionLayerId: suggestionLayer.id || "china-trace-patch-suggestions",
    summary: summarizeTerrainDetailPatches(approved),
  };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const ids = [];
  let outputPath = OUTPUT_PATH;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--output") {
      outputPath = path.resolve(ROOT, args[index + 1] || "");
      index += 1;
      continue;
    }
    ids.push(arg);
  }
  return { ids, outputPath };
}

function main() {
  const { ids, outputPath } = parseArgs(process.argv);
  if (!ids.length) {
    process.stderr.write("Usage: node scripts/promote-trace-patch-suggestions.js <suggestion-id...> [--output path]\n");
    process.exitCode = 1;
    return;
  }
  const suggestionLayer = JSON.parse(fs.readFileSync(SUGGESTION_PATH, "utf8"));
  const approvedFile = buildApprovedPatchFile(suggestionLayer, ids);
  fs.writeFileSync(outputPath, `${JSON.stringify(approvedFile, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${approvedFile.patches.length} approved terrain patches to ${path.relative(ROOT, outputPath)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildApprovedPatchFile,
  parseArgs,
};
