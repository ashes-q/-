const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSuggestionFile } = require("./generate-trace-patch-suggestions");

test("buildSuggestionFile includes line-band candidates for trace-based sculpting", () => {
  const result = buildSuggestionFile({
    id: "fixture-traces",
    traces: [
      {
        id: "fixture-ridge",
        label: "Fixture Ridge",
        kind: "ridge",
        points: [
          { lat: 33.6, lng: 105.5 },
          { lat: 34.0, lng: 107.4 },
          { lat: 34.2, lng: 109.2 },
        ],
      },
      {
        id: "fixture-closed-basin",
        label: "Fixture Closed Basin",
        kind: "basin-edge",
        points: [
          { lat: 32.8, lng: 106.6 },
          { lat: 33.4, lng: 106.9 },
          { lat: 33.2, lng: 107.7 },
          { lat: 32.7, lng: 107.2 },
          { lat: 32.82, lng: 106.62 },
        ],
      },
    ],
  });

  const lineBand = result.patches.find((patch) => patch.kind === "line-band");
  const polygonMask = result.patches.find((patch) => patch.kind === "polygon-mask");

  assert.equal(result.type, "terrain-detail-patch-suggestions");
  assert.ok(lineBand);
  assert.equal(lineBand.id, "fixture-ridge-sculpt-band");
  assert.equal(lineBand.reviewStatus, "draft");
  assert.equal(lineBand.sourceTraceId, "fixture-ridge");
  assert.ok(lineBand.widthDegrees > 0);
  assert.deepEqual(lineBand.points, [
    { lat: 33.6, lng: 105.5 },
    { lat: 34, lng: 107.4 },
    { lat: 34.2, lng: 109.2 },
  ]);
  assert.ok(polygonMask);
  assert.equal(polygonMask.id, "fixture-closed-basin-sculpt-mask");
  assert.equal(polygonMask.reviewStatus, "draft");
  assert.equal(polygonMask.sourceTraceId, "fixture-closed-basin");
  assert.equal(polygonMask.edgeFeatherDegrees, 0.12);
  assert.deepEqual(polygonMask.points, [
    { lat: 32.8, lng: 106.6 },
    { lat: 33.4, lng: 106.9 },
    { lat: 33.2, lng: 107.7 },
    { lat: 32.7, lng: 107.2 },
  ]);
  assert.equal(result.summary.total, 10);
});
