const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  CHINA_BOUNDARY,
  CHINA_PROVINCE_BOUNDARY_GUIDES,
  CHINA_REGION,
  CHINA_TERRAIN_CITIES,
  CHINA_TERRAIN_SITES,
  CHINA_WATER_SYSTEMS,
  FIVE_TERRAIN_BLOCKS,
  MAP_LAYER_GROUPS,
  MAP_LAYERS,
  buildTerrainContourSegments,
  buildTerrainDetailPatchRing,
  buildTerrainTraceElevationProfile,
  buildTerrainTraceProfileChart,
  buildTerrainTracePatchSuggestions,
  buildTerrainTileTraceGuides,
  buildTerrainTracePath,
  addManualTerrainTracePoint,
  closeManualTerrainTraceDraft,
  clamp,
  clearManualTerrainTraceDraft,
  createManualTerrainTraceDraft,
  createDetailPatchVisibilityState,
  createTerrainPatchSuggestionGroupVisibilityState,
  createTerrainTraceVisibilityState,
  findTerrainPatchSuggestion,
  groupTerrainPatchSuggestionsByTrace,
  planCityObservationVisibility,
  summarizeTerrainPatchSuggestionBundle,
  getGroupedRenderableMapLayers,
  getMapLayerGroupState,
  getRenderableMapLayers,
  getTerrainTraceCenter,
  getWaterSystemLayerId,
  latLngToVector3,
  isPointInsidePolygon,
  isInRegion,
  normalizeZoom,
  promoteTerrainPatchSuggestions,
  reverseManualTerrainTraceDraft,
  removeManualTerrainTracePointAt,
  summarizeTerrainCoverage,
  createLayerVisibilityState,
  createInitialMapState,
  estimateChinaElevation,
  selectHotspot,
  findNearestHotspot,
  sampleChinaTerrainElevation,
  sampleChinaTerrainMeters,
  sampleTerrainDetailPatchMeters,
  sampleTerrainGridMeters,
  sampleTerrainTileMeters,
  simplifyManualTerrainTraceDraft,
  smoothManualTerrainTraceDraft,
  summarizeTerrainDetailPatches,
  summarizeTerrainTileAnalysis,
  summarizeTerrainTileTraceAid,
  summarizeTerrainTracePatchSuggestions,
  summarizeTerrainTraceGuides,
  toggleDetailPatchVisibility,
  toggleMapLayerGroup,
  toggleMapLayer,
  toggleTerrainPatchSuggestionGroupVisibility,
  toggleTerrainTraceVisibility,
  undoManualTerrainTracePoint,
  updateManualTerrainTracePointAt,
  vector3ToLatLng,
} = require("./world-map-core");

test("clamp keeps values inside the provided range", () => {
  assert.equal(clamp(-2, 0, 1), 0);
  assert.equal(clamp(0.45, 0, 1), 0.45);
  assert.equal(clamp(3, 0, 1), 1);
});

test("latLngToVector3 converts geographic coordinates onto a sphere", () => {
  const northPole = latLngToVector3({ lat: 90, lng: 0, radius: 2 });
  assert.deepEqual(northPole.map((value) => Number(value.toFixed(4))), [0, 2, 0]);

  const equatorPrime = latLngToVector3({ lat: 0, lng: 0, radius: 2 });
  assert.deepEqual(equatorPrime.map((value) => Number(value.toFixed(4))), [0, 0, 2]);

  const equatorEast = latLngToVector3({ lat: 0, lng: 90, radius: 2 });
  assert.deepEqual(equatorEast.map((value) => Number(value.toFixed(4))), [2, 0, 0]);
});

test("vector3ToLatLng reverses terrain surface coordinates for tracing", () => {
  const source = { lat: 31.25, lng: 103.75, radius: 2.42 };
  const vector = latLngToVector3(source);
  const point = vector3ToLatLng(vector);

  assert.equal(Number(point.lat.toFixed(2)), 31.25);
  assert.equal(Number(point.lng.toFixed(2)), 103.75);
  assert.equal(vector3ToLatLng([0, 0, 0]), null);
});

test("selectHotspot stores a stable selected hotspot and camera target", () => {
  const state = createInitialMapState({
    hotspots: [{ id: "shanghai", label: "Shanghai", lat: 31.23, lng: 121.47 }],
  });
  const next = selectHotspot(state, "shanghai");

  assert.equal(next.selectedHotspotId, "shanghai");
  assert.equal(next.cameraTarget.hotspotId, "shanghai");
  assert.ok(next.cameraTarget.position.every((value) => Number.isFinite(value)));
  assert.notEqual(next, state);
});

test("findNearestHotspot returns null outside the hit radius", () => {
  const hotspots = [
    { id: "a", label: "A", screenX: 10, screenY: 10 },
    { id: "b", label: "B", screenX: 80, screenY: 80 },
  ];

  assert.equal(findNearestHotspot(hotspots, { x: 12, y: 10 }, 8).id, "a");
  assert.equal(findNearestHotspot(hotspots, { x: 45, y: 45 }, 8), null);
});

test("isPointInsidePolygon detects points inside terrain block polygons", () => {
  const polygon = [
    { lat: 20, lng: 100 },
    { lat: 24, lng: 100 },
    { lat: 24, lng: 104 },
    { lat: 20, lng: 104 },
  ];

  assert.equal(isPointInsidePolygon({ lat: 22, lng: 102 }, polygon), true);
  assert.equal(isPointInsidePolygon({ lat: 25, lng: 102 }, polygon), false);
  assert.equal(isPointInsidePolygon({ lat: 22, lng: 105 }, polygon), false);
  assert.equal(isPointInsidePolygon(null, polygon), false);
});

test("China terrain region includes the expected first-pass sites", () => {
  assert.deepEqual(CHINA_REGION.bounds, {
    minLat: 18,
    maxLat: 54,
    minLng: 73,
    maxLng: 135,
  });

  assert.ok(CHINA_TERRAIN_SITES.some((site) => site.id === "beijing"));
  assert.ok(CHINA_TERRAIN_SITES.some((site) => site.id === "lhasa"));
  assert.ok(CHINA_TERRAIN_SITES.some((site) => site.id === "urumqi"));
  assert.ok(CHINA_TERRAIN_SITES.every((site) => isInRegion(site, CHINA_REGION)));
});

test("normalizeZoom clamps camera distance for terrain inspection", () => {
  assert.equal(normalizeZoom(2), 2.18);
  assert.equal(normalizeZoom(5), 5);
  assert.equal(normalizeZoom(10), 7.2);
});

test("createLayerVisibilityState opens a clean terrain view by default", () => {
  const visibility = createLayerVisibilityState();

  assert.deepEqual(Object.keys(visibility), MAP_LAYERS.map((layer) => layer.id));
  ["terrain", "blocks", "water", "waterRefs", "borders"].forEach((layerId) => {
    assert.equal(visibility[layerId], true, `${layerId} should be visible in the clean terrain view`);
  });
  ["waterTributaries", "coastRefs", "contours", "details", "traces", "suggestions", "approved", "provinceBorders", "cityBoundaries", "sites", "cities", "weather"].forEach((layerId) => {
    assert.equal(visibility[layerId], false, `${layerId} should stay hidden until editing/review`);
  });
});

test("province boundaries remain available as a hidden reference layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "provinceBorders"));
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "cityBoundaries"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.borders, true);
  assert.equal(visibility.provinceBorders, false);
  assert.equal(visibility.cityBoundaries, false);

  const next = toggleMapLayer(visibility, "provinceBorders");
  assert.equal(next.borders, true);
  assert.equal(next.provinceBorders, true);
  assert.equal(visibility.provinceBorders, false);
});

test("observation points remain available as a hidden toggle layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "sites"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.sites, false);

  const next = toggleMapLayer(visibility, "sites");
  assert.equal(next.sites, true);
  assert.equal(visibility.sites, false);
});

test("weather cloud flow remains available as a hidden toggle layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "weather"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.weather, false);

  const next = toggleMapLayer(visibility, "weather");
  assert.equal(next.weather, true);
  assert.equal(visibility.weather, false);
});

test("toggleMapLayer flips one layer without mutating the previous state", () => {
  const initial = createLayerVisibilityState();
  const next = toggleMapLayer(initial, "contours");

  assert.equal(initial.contours, false);
  assert.equal(next.contours, true);
  assert.equal(next.terrain, true);
  assert.notEqual(next, initial);
  assert.deepEqual(toggleMapLayer(next, "unknown-layer"), next);
});

test("candidate terrain patch suggestions have a dedicated inspection layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "suggestions"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.suggestions, false);

  const next = toggleMapLayer(visibility, "suggestions");
  assert.equal(next.suggestions, true);
  assert.equal(visibility.suggestions, false);
});

test("approved terrain patches have a dedicated preview layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "approved"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.approved, false);

  const next = toggleMapLayer(visibility, "approved");
  assert.equal(next.approved, true);
  assert.equal(visibility.approved, false);
});

test("water reference outlines are visible by default and remain toggleable", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "waterRefs"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.waterRefs, true);

  const next = toggleMapLayer(visibility, "waterRefs");
  assert.equal(next.waterRefs, false);
  assert.equal(visibility.waterRefs, true);
});

test("coastline and island references remain available as a hidden toggle layer", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "coastRefs"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.coastRefs, false);

  const next = toggleMapLayer(visibility, "coastRefs");
  assert.equal(next.coastRefs, true);
  assert.equal(visibility.coastRefs, false);
});

test("river tributaries split key guides from optional fine tributaries", () => {
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "waterTributaries"));
  assert.ok(MAP_LAYERS.some((layer) => layer.id === "waterMinorTributaries"));

  const visibility = createLayerVisibilityState();
  assert.equal(visibility.water, true);
  assert.equal(visibility.waterTributaries, false);
  assert.equal(visibility.waterMinorTributaries, false);
  assert.equal(getWaterSystemLayerId({ rank: "main" }), "water");
  assert.equal(getWaterSystemLayerId({ rank: "tributary", scaleRank: 5 }), "waterTributaries");
  assert.equal(getWaterSystemLayerId({ rank: "tributary", scaleRank: 8 }), "waterMinorTributaries");
  assert.equal(getWaterSystemLayerId({ rank: "tributary", source: "project-authored-major-tributaries", scaleRank: 9 }), "waterTributaries");
});

test("empty optional layers are omitted from the map legend", () => {
  assert.ok(getRenderableMapLayers({ waterMinorTributaries: 2 }).some((layer) => layer.id === "waterMinorTributaries"));
  assert.ok(getRenderableMapLayers({ waterMinorTributaries: undefined }).some((layer) => layer.id === "waterMinorTributaries"));
  assert.ok(!getRenderableMapLayers({ waterMinorTributaries: 0 }).some((layer) => layer.id === "waterMinorTributaries"));
});

test("map legend compresses scene controls into one terrain overview layer", () => {
  assert.deepEqual(MAP_LAYER_GROUPS.map((group) => group.id), ["terrainOverview"]);
  assert.deepEqual(MAP_LAYER_GROUPS[0].label, "地形总览");
  assert.deepEqual(MAP_LAYER_GROUPS[0].primaryLayerIds, ["terrain", "blocks", "borders", "water", "waterRefs"]);

  const groups = getGroupedRenderableMapLayers({ waterMinorTributaries: 0 });
  assert.deepEqual(groups.map((group) => group.id), ["terrainOverview"]);
  assert.deepEqual(groups[0].layers.map((layer) => layer.id), [
    "terrain",
    "borders",
    "water",
    "waterRefs",
    "blocks",
    "waterTributaries",
    "coastRefs",
    "provinceBorders",
    "cityBoundaries",
    "contours",
    "details",
    "traces",
    "suggestions",
    "approved",
    "sites",
    "cities",
    "weather",
  ]);
  assert.ok(!groups.flatMap((group) => group.layers).some((layer) => layer.id === "waterMinorTributaries"));
});

test("terrain overview layer toggles the whole composed map without enabling noisy optional references", () => {
  const visibility = createLayerVisibilityState();
  assert.deepEqual(getMapLayerGroupState(visibility, "terrainOverview"), {
    active: true,
    mixed: true,
    visibleCount: 5,
    totalCount: 18,
  });

  const hiddenOverview = toggleMapLayerGroup(visibility, "terrainOverview");
  MAP_LAYERS.forEach((layer) => {
    assert.equal(hiddenOverview[layer.id], false, `${layer.id} should be hidden by the overview master toggle`);
  });

  const restoredOverview = toggleMapLayerGroup(hiddenOverview, "terrainOverview");
  ["terrain", "blocks", "borders", "water", "waterRefs"].forEach((layerId) => {
    assert.equal(restoredOverview[layerId], true, `${layerId} should return as part of the composed terrain layer`);
  });
  ["waterTributaries", "waterMinorTributaries", "coastRefs", "provinceBorders", "cityBoundaries", "contours", "details", "traces", "suggestions", "approved", "sites", "cities", "weather"].forEach((layerId) => {
    assert.equal(restoredOverview[layerId], false, `${layerId} should stay folded under details`);
  });
});

test("detail patch visibility can be toggled one patch at a time", () => {
  const patchLayer = {
    patches: [
      { id: "ridge-lift" },
      { id: "basin-cut" },
    ],
  };
  const initial = createDetailPatchVisibilityState(patchLayer);

  assert.deepEqual(initial, {
    "ridge-lift": true,
    "basin-cut": true,
  });

  const next = toggleDetailPatchVisibility(initial, patchLayer, "basin-cut");

  assert.equal(initial["basin-cut"], true);
  assert.equal(next["basin-cut"], false);
  assert.equal(next["ridge-lift"], true);
  assert.notEqual(next, initial);
  assert.deepEqual(toggleDetailPatchVisibility(next, patchLayer, "unknown"), next);
});

test("terrain trace visibility can be toggled one guide at a time", () => {
  const traceLayer = {
    traces: [
      { id: "ridge-a" },
      { id: "valley-b" },
    ],
  };
  const initial = createTerrainTraceVisibilityState(traceLayer);

  assert.deepEqual(initial, {
    "ridge-a": true,
    "valley-b": true,
  });

  const next = toggleTerrainTraceVisibility(initial, traceLayer, "ridge-a");

  assert.equal(initial["ridge-a"], true);
  assert.equal(next["ridge-a"], false);
  assert.equal(next["valley-b"], true);
  assert.notEqual(next, initial);
  assert.deepEqual(toggleTerrainTraceVisibility(next, traceLayer, "unknown"), next);
});

test("terrain patch suggestions can be grouped and toggled by source trace", () => {
  const suggestionLayer = {
    patches: [
      { id: "ridge-01", kind: "radial", sourceTraceId: "ridge", sourceTraceKind: "ridge", sourceTileId: "qinling-tile", sourceTileLabel: "Qinling Tile", sourceTileDataset: "mapzen-terrarium", reviewStatus: "draft", deltaMeters: 420 },
      { id: "ridge-02", kind: "line-band", sourceTraceId: "ridge", sourceTraceKind: "ridge", sourceTileId: "qinling-tile", sourceTileLabel: "Qinling Tile", sourceTileDataset: "mapzen-terrarium", reviewStatus: "reviewed", deltaMeters: 420 },
      { id: "valley-01", sourceTraceId: "valley", sourceTraceKind: "valley", deltaMeters: -260 },
    ],
  };

  const groups = groupTerrainPatchSuggestionsByTrace(suggestionLayer);
  assert.deepEqual(
    groups.map((group) => ({
      id: group.id,
      kind: group.sourceTraceKind,
      sourceTileId: group.sourceTileId,
      sourceTileLabel: group.sourceTileLabel,
      sourceTileDataset: group.sourceTileDataset,
      reviewStatus: group.reviewStatus,
      total: group.total,
      lifts: group.lifts,
      depressions: group.depressions,
      radial: group.radialCount,
      lineBand: group.lineBandCount,
      polygonMask: group.polygonMaskCount,
    })),
    [
      { id: "ridge", kind: "ridge", sourceTileId: "qinling-tile", sourceTileLabel: "Qinling Tile", sourceTileDataset: "mapzen-terrarium", reviewStatus: "mixed", total: 2, lifts: 2, depressions: 0, radial: 1, lineBand: 1, polygonMask: 0 },
      { id: "valley", kind: "valley", sourceTileId: "", sourceTileLabel: "", sourceTileDataset: "", reviewStatus: "draft", total: 1, lifts: 0, depressions: 1, radial: 1, lineBand: 0, polygonMask: 0 },
    ]
  );

  const initial = createTerrainPatchSuggestionGroupVisibilityState(suggestionLayer);
  assert.deepEqual(initial, { ridge: true, valley: true });

  const next = toggleTerrainPatchSuggestionGroupVisibility(initial, suggestionLayer, "ridge");
  assert.equal(initial.ridge, true);
  assert.equal(next.ridge, false);
  assert.equal(next.valley, true);
  assert.notEqual(next, initial);
  assert.deepEqual(toggleTerrainPatchSuggestionGroupVisibility(next, suggestionLayer, "unknown"), next);
});

test("terrain patch suggestions can be located for single-candidate review", () => {
  const suggestionLayer = {
    patches: [
      {
        id: "ridge-01",
        label: "Ridge 01",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        reviewStatus: "draft",
        center: { lat: 30.1, lng: 100.2 },
        radiusDegrees: 0.85,
        deltaMeters: 420,
      },
    ],
  };

  const patch = findTerrainPatchSuggestion(suggestionLayer, "ridge-01");

  assert.equal(patch.id, "ridge-01");
  assert.equal(patch.reviewStatus, "draft");
  assert.deepEqual(patch.center, { lat: 30.1, lng: 100.2 });
  assert.equal(findTerrainPatchSuggestion(suggestionLayer, "unknown"), null);
  assert.equal(findTerrainPatchSuggestion(null, "ridge-01"), null);
});

test("terrain patch suggestions can be bundled for combined console review", () => {
  const suggestionLayer = {
    patches: [
      {
        id: "ridge-01",
        label: "Ridge 01",
        kind: "radial",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        center: { lat: 30, lng: 100 },
        radiusDegrees: 0.8,
        deltaMeters: 420,
      },
      {
        id: "ridge-02",
        label: "Ridge 02",
        kind: "radial",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        center: { lat: 32, lng: 102 },
        radiusDegrees: 1.2,
        deltaMeters: 380,
      },
      {
        id: "valley-01",
        label: "Valley 01",
        kind: "radial",
        sourceTraceId: "valley",
        sourceTraceKind: "valley",
        center: { lat: 29, lng: 101 },
        radiusDegrees: 0.6,
        deltaMeters: -260,
      },
      {
        id: "ridge-band",
        label: "Ridge Band",
        kind: "line-band",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        points: [
          { lat: 30, lng: 100 },
          { lat: 32, lng: 102 },
        ],
        widthDegrees: 0.5,
        deltaMeters: 360,
      },
    ],
  };

  const bundle = summarizeTerrainPatchSuggestionBundle(suggestionLayer, ["ridge-02", "missing", "ridge-band", "ridge-01", "ridge-02"]);

  assert.deepEqual(bundle.ids, ["ridge-02", "ridge-band", "ridge-01"]);
  assert.equal(bundle.count, 3);
  assert.equal(bundle.lifts, 3);
  assert.equal(bundle.depressions, 0);
  assert.deepEqual(bundle.center, { lat: 31, lng: 101 });
  assert.equal(bundle.averageRadiusDegrees, 0.8333333333333334);
  assert.equal(bundle.totalDeltaMeters, 1160);
  assert.equal(bundle.promoteCommand, "node scripts/promote-trace-patch-suggestions.js ridge-02 ridge-band ridge-01");
});

test("reviewed terrain patch suggestions can be promoted into a detail patch layer", () => {
  const suggestionLayer = {
    patches: [
      {
        id: "ridge-01",
        label: "Ridge 01",
        kind: "radial",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        reviewStatus: "draft",
        center: { lat: 30.1, lng: 100.2 },
        radiusDegrees: 0.85,
        deltaMeters: 420,
      },
      {
        id: "valley-01",
        label: "Valley 01",
        kind: "radial",
        sourceTraceId: "valley",
        sourceTraceKind: "valley",
        sourceTileId: "qinling-main-ridge-srtm30m-local",
        sourceTileLabel: "Qinling main ridge",
        sourceTileBounds: { minLat: 33.2, maxLat: 34.7, minLng: 106.5, maxLng: 108.6 },
        sourceTileDataset: "SRTMGL1",
        sourceTileReliefMeters: 2140,
        reviewStatus: "draft",
        center: { lat: 29.1, lng: 101.2 },
        radiusDegrees: 0.75,
        deltaMeters: -260,
      },
      {
        id: "ridge-band",
        label: "Ridge Band",
        kind: "line-band",
        sourceTraceId: "ridge",
        sourceTraceKind: "ridge",
        reviewStatus: "draft",
        points: [
          { lat: 30, lng: 100 },
          { lat: 31, lng: 101 },
        ],
        widthDegrees: 0.5,
        deltaMeters: 360,
      },
      {
        id: "basin-mask",
        label: "Basin Mask",
        kind: "polygon-mask",
        sourceTraceId: "basin",
        sourceTraceKind: "basin-edge",
        reviewStatus: "draft",
        points: [
          { lat: 30, lng: 100 },
          { lat: 30, lng: 102 },
          { lat: 32, lng: 102 },
          { lat: 32, lng: 100 },
        ],
        edgeFeatherDegrees: 0.4,
        deltaMeters: -180,
      },
    ],
  };

  const promoted = promoteTerrainPatchSuggestions(suggestionLayer, ["valley-01", "ridge-band", "basin-mask"], {
    id: "reviewed-pass",
    labelPrefix: "Reviewed",
  });

  assert.equal(promoted.id, "reviewed-pass");
  assert.equal(promoted.type, "terrain-detail-patches");
  assert.equal(promoted.units, "meters");
  assert.equal(promoted.patches.length, 3);
  assert.deepEqual(promoted.patches[0], {
    id: "valley-01",
    label: "Reviewed Valley 01",
    kind: "radial",
    center: { lat: 29.1, lng: 101.2 },
    radiusDegrees: 0.75,
    deltaMeters: -260,
    sourceSuggestionId: "valley-01",
    sourceTraceId: "valley",
    sourceTraceKind: "valley",
    sourceTileId: "qinling-main-ridge-srtm30m-local",
    sourceTileLabel: "Qinling main ridge",
    sourceTileBounds: { minLat: 33.2, maxLat: 34.7, minLng: 106.5, maxLng: 108.6 },
    sourceTileDataset: "SRTMGL1",
    sourceTileReliefMeters: 2140,
    reviewStatus: "approved",
  });
  assert.deepEqual(promoted.patches[1], {
    id: "ridge-band",
    label: "Reviewed Ridge Band",
    kind: "line-band",
    points: [
      { lat: 30, lng: 100 },
      { lat: 31, lng: 101 },
    ],
    widthDegrees: 0.5,
    deltaMeters: 360,
    sourceSuggestionId: "ridge-band",
    sourceTraceId: "ridge",
    sourceTraceKind: "ridge",
    reviewStatus: "approved",
  });
  assert.deepEqual(promoted.patches[2], {
    id: "basin-mask",
    label: "Reviewed Basin Mask",
    kind: "polygon-mask",
    points: [
      { lat: 30, lng: 100 },
      { lat: 30, lng: 102 },
      { lat: 32, lng: 102 },
      { lat: 32, lng: 100 },
    ],
    edgeFeatherDegrees: 0.4,
    deltaMeters: -180,
    sourceSuggestionId: "basin-mask",
    sourceTraceId: "basin",
    sourceTraceKind: "basin-edge",
    reviewStatus: "approved",
  });

  assert.deepEqual(promoteTerrainPatchSuggestions(suggestionLayer, ["missing"]).patches, []);
  assert.deepEqual(promoteTerrainPatchSuggestions(null, ["valley-01"]).patches, []);
});

test("terrain trace paths filter usable China-region points and compute center", () => {
  const trace = {
    id: "edge",
    points: [
      { lat: 28, lng: 99 },
      { lat: 30, lng: 102 },
      { lat: 99, lng: 102 },
      { lat: 32, lng: 105 },
    ],
  };

  const path = buildTerrainTracePath(trace);

  assert.deepEqual(path, [
    { lat: 28, lng: 99 },
    { lat: 30, lng: 102 },
    { lat: 32, lng: 105 },
  ]);
  assert.deepEqual(getTerrainTraceCenter(trace), { lat: 30, lng: 102 });
  assert.deepEqual(buildTerrainTracePath({ points: [{ lat: 28, lng: 99 }] }), []);
});

test("manual terrain trace drafts collect valid China points and support undo and clear", () => {
  const draft = createManualTerrainTraceDraft({
    id: "manual-ridge",
    label: "Manual ridge",
    kind: "ridge",
  });
  const onePoint = addManualTerrainTracePoint(draft, { lat: 30.123456, lng: 101.654321 });
  const rejected = addManualTerrainTracePoint(onePoint, { lat: 60, lng: 101 });
  const twoPoints = addManualTerrainTracePoint(rejected, { lat: 31.2, lng: 102.4 });
  const undone = undoManualTerrainTracePoint(twoPoints);
  const cleared = clearManualTerrainTraceDraft(twoPoints);

  assert.equal(draft.id, "manual-ridge");
  assert.equal(draft.label, "Manual ridge");
  assert.equal(draft.kind, "ridge");
  assert.deepEqual(draft.points, []);
  assert.deepEqual(onePoint.points, [{ lat: 30.1235, lng: 101.6543 }]);
  assert.deepEqual(rejected.points, onePoint.points);
  assert.equal(twoPoints.points.length, 2);
  assert.deepEqual(undone.points, onePoint.points);
  assert.deepEqual(cleared.points, []);
  assert.notEqual(onePoint, draft);
});

test("manual terrain trace drafts reject points outside their source DEM tile bounds", () => {
  const draft = {
    ...createManualTerrainTraceDraft({
      id: "manual-qinling-tile",
      label: "Qinling tile trace",
      kind: "ridge",
    }),
    sourceTileId: "qinling-mapzen-terrarium-z7-102-51",
    sourceTileBounds: { minLat: 32.4, maxLat: 33.4, minLng: 106.5, maxLng: 109.3 },
  };

  const inside = addManualTerrainTracePoint(draft, { lat: 33.0, lng: 107.2 });
  const outside = addManualTerrainTracePoint(inside, { lat: 34.2, lng: 107.2 });
  const movedInside = updateManualTerrainTracePointAt(inside, 0, { lat: 32.8, lng: 108.4 });
  const movedOutside = updateManualTerrainTracePointAt(movedInside, 0, { lat: 32.8, lng: 110.4 });

  assert.deepEqual(inside.points, [{ lat: 33, lng: 107.2 }]);
  assert.deepEqual(outside.points, inside.points);
  assert.deepEqual(movedInside.points, [{ lat: 32.8, lng: 108.4 }]);
  assert.deepEqual(movedOutside.points, movedInside.points);
  assert.deepEqual(outside.sourceTileBounds, draft.sourceTileBounds);
});

test("manual terrain trace drafts can move and remove a selected point", () => {
  const draft = [
    { lat: 30, lng: 100 },
    { lat: 31, lng: 101 },
    { lat: 32, lng: 102 },
  ].reduce(
    (current, point) => addManualTerrainTracePoint(current, point),
    {
      ...createManualTerrainTraceDraft({
        id: "manual-editable-ridge",
        label: "Editable ridge",
        kind: "ridge",
      }),
      sourceTileId: "qinling-mapzen-terrarium-z7-102-51",
      seedKind: "ridge",
    }
  );

  const moved = updateManualTerrainTracePointAt(draft, 1, { lat: 31.333333, lng: 101.777777 });
  const rejectedMove = updateManualTerrainTracePointAt(moved, 1, { lat: 61, lng: 101 });
  const removed = removeManualTerrainTracePointAt(moved, 1);
  const outOfRangeRemoved = removeManualTerrainTracePointAt(moved, 99);

  assert.equal(moved.id, draft.id);
  assert.equal(moved.sourceTileId, draft.sourceTileId);
  assert.equal(moved.seedKind, "ridge");
  assert.deepEqual(moved.points, [
    { lat: 30, lng: 100 },
    { lat: 31.3333, lng: 101.7778 },
    { lat: 32, lng: 102 },
  ]);
  assert.deepEqual(rejectedMove.points, moved.points);
  assert.deepEqual(removed.points, [
    { lat: 30, lng: 100 },
    { lat: 32, lng: 102 },
  ]);
  assert.deepEqual(outOfRangeRemoved.points, moved.points);
  assert.deepEqual(draft.points, [
    { lat: 30, lng: 100 },
    { lat: 31, lng: 101 },
    { lat: 32, lng: 102 },
  ]);
});

test("manual terrain trace drafts can be reversed and simplified while preserving provenance", () => {
  const draft = [
    { lat: 30, lng: 100 },
    { lat: 31, lng: 101 },
    { lat: 32, lng: 102 },
    { lat: 33, lng: 103 },
    { lat: 34, lng: 104 },
  ].reduce(
    (current, point) => addManualTerrainTracePoint(current, point),
    {
      ...createManualTerrainTraceDraft({
        id: "manual-qinling-ridge",
        label: "Qinling ridge",
        kind: "ridge",
      }),
      sourceTileId: "qinling-mapzen-terrarium-z7-102-51",
      sourceTileBounds: { minLat: 30, maxLat: 34, minLng: 100, maxLng: 104 },
      seedKind: "ridge",
    }
  );

  const reversed = reverseManualTerrainTraceDraft(draft);
  const simplified = simplifyManualTerrainTraceDraft(draft, { stride: 2 });

  assert.equal(reversed.id, draft.id);
  assert.equal(reversed.sourceTileId, draft.sourceTileId);
  assert.equal(reversed.seedKind, "ridge");
  assert.deepEqual(reversed.points, [...draft.points].reverse());
  assert.equal(simplified.id, draft.id);
  assert.deepEqual(simplified.sourceTileBounds, draft.sourceTileBounds);
  assert.deepEqual(simplified.points, [
    draft.points[0],
    draft.points[2],
    draft.points[4],
  ]);
  assert.deepEqual(simplifyManualTerrainTraceDraft(draft, { stride: 20 }).points, [
    draft.points[0],
    draft.points[4],
  ]);
});

test("manual terrain trace drafts can be closed for polygon mask sculpting", () => {
  const draft = [
    { lat: 33.02, lng: 106.78 },
    { lat: 33.22, lng: 107.22 },
    { lat: 32.94, lng: 107.52 },
  ].reduce(
    (trace, point) => addManualTerrainTracePoint(trace, point),
    createManualTerrainTraceDraft({ id: "manual-basin-area", kind: "basin-edge", label: "Manual basin area" })
  );

  const closed = closeManualTerrainTraceDraft(draft);

  assert.notEqual(closed, draft);
  assert.equal(closed.closed, true);
  assert.equal(closed.points.length, 4);
  assert.deepEqual(closed.points[3], closed.points[0]);
  const suggestions = buildTerrainTracePatchSuggestions(closed, {
    includeLineBand: true,
    includePolygonMask: true,
  });
  assert.ok(suggestions.patches.some((patch) => patch.kind === "polygon-mask"));
});

test("manual terrain trace drafts can be smoothed without moving endpoints", () => {
  const draft = [
    { lat: 30, lng: 100 },
    { lat: 31, lng: 103 },
    { lat: 32, lng: 101 },
    { lat: 33, lng: 104 },
    { lat: 34, lng: 102 },
  ].reduce(
    (current, point) => addManualTerrainTracePoint(current, point),
    {
      ...createManualTerrainTraceDraft({
        id: "manual-qinling-jagged-ridge",
        label: "Jagged Qinling ridge",
        kind: "ridge",
      }),
      sourceTileId: "qinling-mapzen-terrarium-z7-102-51",
      sourceTileBounds: { minLat: 30, maxLat: 34, minLng: 100, maxLng: 104 },
      seedKind: "ridge",
    }
  );

  const smoothed = smoothManualTerrainTraceDraft(draft);

  assert.equal(smoothed.id, draft.id);
  assert.equal(smoothed.sourceTileId, draft.sourceTileId);
  assert.equal(smoothed.seedKind, "ridge");
  assert.equal(smoothed.smoothedPointCount, 3);
  assert.deepEqual(smoothed.points[0], draft.points[0]);
  assert.deepEqual(smoothed.points[4], draft.points[4]);
  assert.notDeepEqual(smoothed.points[1], draft.points[1]);
  assert.deepEqual(smoothed.points[1], { lat: 31, lng: 101.3333 });
  assert.deepEqual(smoothManualTerrainTraceDraft({ ...draft, points: draft.points.slice(0, 2) }).points, draft.points.slice(0, 2));
});

test("summarizeTerrainTraceGuides reports guide kinds for tracing workflow", () => {
  const traceLayer = {
    traces: [
      { id: "ridge", kind: "ridge" },
      { id: "edge", kind: "basin-edge" },
      { id: "valley", kind: "valley" },
      { id: "other", kind: "coast" },
    ],
  };

  assert.deepEqual(summarizeTerrainTraceGuides(traceLayer), {
    total: 4,
    ridges: 1,
    basinEdges: 1,
    valleys: 1,
  });
  assert.deepEqual(summarizeTerrainTraceGuides(null), {
    total: 0,
    ridges: 0,
    basinEdges: 0,
    valleys: 0,
  });
});

test("terrain trace guides can produce radial patch suggestions for sculpting", () => {
  const ridgeTrace = {
    id: "ridge-line",
    label: "Ridge Line",
    kind: "ridge",
    points: [
      { lat: 30, lng: 100 },
      { lat: 31, lng: 101 },
      { lat: 32, lng: 102 },
    ],
  };
  const valleyTrace = {
    id: "valley-line",
    label: "Valley Line",
    kind: "valley",
    points: [
      { lat: 28, lng: 103 },
      { lat: 29, lng: 104 },
    ],
  };

  const ridgeSuggestions = buildTerrainTracePatchSuggestions(ridgeTrace);
  const valleySuggestions = buildTerrainTracePatchSuggestions(valleyTrace);

  assert.equal(ridgeSuggestions.type, "terrain-detail-patch-suggestions");
  assert.equal(ridgeSuggestions.sourceTraceId, "ridge-line");
  assert.equal(ridgeSuggestions.patches.length, 3);
  assert.ok(ridgeSuggestions.patches.every((patch) => patch.kind === "radial"));
  assert.ok(ridgeSuggestions.patches.every((patch) => patch.sourceTraceId === "ridge-line"));
  assert.ok(ridgeSuggestions.patches.every((patch) => patch.sourceTraceKind === "ridge"));
  assert.ok(ridgeSuggestions.patches.every((patch) => patch.deltaMeters > 0));
  assert.deepEqual(ridgeSuggestions.patches[0].center, { lat: 30, lng: 100 });
  assert.ok(ridgeSuggestions.patches[0].id.startsWith("ridge-line-sculpt-"));

  assert.equal(valleySuggestions.patches.length, 2);
  assert.ok(valleySuggestions.patches.every((patch) => patch.deltaMeters < 0));
  assert.deepEqual(buildTerrainTracePatchSuggestions({ id: "short", points: [{ lat: 30, lng: 100 }] }).patches, []);
});

test("terrain trace guides can produce line-band patch suggestions for continuous tracing", () => {
  const ridgeTrace = {
    id: "qinling-line",
    label: "Qinling Line",
    kind: "ridge",
    points: [
      { lat: 33.6, lng: 105.5 },
      { lat: 34.0, lng: 107.4 },
      { lat: 34.2, lng: 109.2 },
    ],
  };

  const suggestions = buildTerrainTracePatchSuggestions(ridgeTrace, { includeLineBand: true });
  const lineBand = suggestions.patches.find((patch) => patch.kind === "line-band");

  assert.equal(suggestions.patches.length, 4);
  assert.ok(lineBand);
  assert.equal(lineBand.id, "qinling-line-sculpt-band");
  assert.equal(lineBand.sourceTraceId, "qinling-line");
  assert.equal(lineBand.sourceTraceKind, "ridge");
  assert.equal(lineBand.deltaMeters, 420);
  assert.ok(lineBand.widthDegrees > 0);
  assert.deepEqual(lineBand.points, [
    { lat: 33.6, lng: 105.5 },
    { lat: 34, lng: 107.4 },
    { lat: 34.2, lng: 109.2 },
  ]);
});

test("closed terrain trace guides can produce polygon-mask patch suggestions for traced areas", () => {
  const basinTrace = {
    id: "hanzhong-basin-draft",
    label: "Hanzhong Basin Draft",
    kind: "basin-edge",
    points: [
      { lat: 32.8, lng: 106.6 },
      { lat: 33.4, lng: 106.9 },
      { lat: 33.2, lng: 107.7 },
      { lat: 32.7, lng: 107.2 },
      { lat: 32.82, lng: 106.62 },
    ],
  };
  const openTrace = {
    id: "open-ridge",
    kind: "ridge",
    points: [
      { lat: 33.6, lng: 105.5 },
      { lat: 34.0, lng: 107.4 },
      { lat: 34.2, lng: 109.2 },
    ],
  };

  const suggestions = buildTerrainTracePatchSuggestions(basinTrace, { includePolygonMask: true });
  const polygon = suggestions.patches.find((patch) => patch.kind === "polygon-mask");
  const openSuggestions = buildTerrainTracePatchSuggestions(openTrace, { includePolygonMask: true });

  assert.ok(polygon);
  assert.equal(polygon.id, "hanzhong-basin-draft-sculpt-mask");
  assert.equal(polygon.sourceTraceKind, "basin-edge");
  assert.deepEqual(polygon.points, [
    { lat: 32.8, lng: 106.6 },
    { lat: 33.4, lng: 106.9 },
    { lat: 33.2, lng: 107.7 },
    { lat: 32.7, lng: 107.2 },
  ]);
  assert.equal(polygon.edgeFeatherDegrees, 0.12);
  assert.equal(polygon.deltaMeters, -220);
  assert.equal(openSuggestions.patches.some((patch) => patch.kind === "polygon-mask"), false);
});

test("summarizeTerrainTracePatchSuggestions reports generated sculpting workload", () => {
  const suggestionLayer = {
    patches: [
      { deltaMeters: 420 },
      { deltaMeters: -260 },
      { deltaMeters: 0 },
    ],
  };

  assert.deepEqual(summarizeTerrainTracePatchSuggestions(suggestionLayer), {
    total: 3,
    lifts: 1,
    depressions: 1,
  });
  assert.deepEqual(summarizeTerrainTracePatchSuggestions(null), {
    total: 0,
    lifts: 0,
    depressions: 0,
  });
});

test("sampleTerrainGridMeters interpolates a DEM height grid", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [1000, 2000],
      [3000, 5000],
    ],
  };

  assert.equal(sampleTerrainGridMeters(grid, 30, 100), 1000);
  assert.equal(sampleTerrainGridMeters(grid, 31, 101), 2750);
  assert.equal(sampleTerrainGridMeters(grid, 32, 102), 5000);
  assert.equal(sampleTerrainGridMeters(grid, 29, 101), null);
});

test("sampleTerrainTileMeters uses the highest-resolution local DEM tile covering a point", () => {
  const tileLayer = {
    tiles: [
      {
        id: "coarse",
        latitudes: [30, 32],
        longitudes: [100, 102],
        elevationsMeters: [
          [1000, 1000],
          [1000, 1000],
        ],
      },
      {
        id: "fine",
        latitudes: [30.5, 31, 31.5],
        longitudes: [100.5, 101, 101.5],
        elevationsMeters: [
          [2100, 2200, 2300],
          [2400, 2600, 2800],
          [3000, 3200, 3400],
        ],
      },
    ],
  };

  assert.equal(sampleTerrainTileMeters(tileLayer, 31, 101), 2600);
  assert.equal(sampleTerrainTileMeters(tileLayer, 30.2, 100.2), 1000);
  assert.equal(sampleTerrainTileMeters(tileLayer, 35, 105), null);
});

test("buildTerrainContourSegments extracts contour lines from a DEM grid", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [0, 200],
      [0, 200],
    ],
  };

  const segments = buildTerrainContourSegments(grid, [100]);

  assert.equal(segments.length, 1);
  assert.equal(segments[0].levelMeters, 100);
  assert.deepEqual(segments[0].start, { lat: 30, lng: 101 });
  assert.deepEqual(segments[0].end, { lat: 32, lng: 101 });
});

test("buildTerrainContourSegments groups multiple contour levels", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [0, 300],
      [0, 300],
    ],
  };

  const levels = buildTerrainContourSegments(grid, [100, 200]).map((segment) => segment.levelMeters);

  assert.deepEqual(levels, [100, 200]);
});

test("sampleChinaTerrainElevation prefers DEM meters and falls back to procedural terrain", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [0, 0],
      [6000, 6000],
    ],
  };

  const sampled = sampleChinaTerrainElevation(32, 101, grid);
  assert.ok(sampled > 0.72);

  const fallback = sampleChinaTerrainElevation(35, 110, grid);
  assert.equal(fallback, estimateChinaElevation(35, 110));
});

test("sampleTerrainDetailPatchMeters applies local sculpting patches with linear falloff", () => {
  const patchLayer = {
    patches: [
      {
        id: "test-peak",
        kind: "radial",
        center: { lat: 30, lng: 100 },
        radiusDegrees: 2,
        deltaMeters: 1200,
      },
      {
        id: "test-basin",
        kind: "radial",
        center: { lat: 30, lng: 102 },
        radiusDegrees: 2,
        deltaMeters: -300,
      },
    ],
  };

  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 30, 100), 1200);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 31, 100), 600);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 30, 102), -300);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 33, 100), 0);
});

test("sampleTerrainDetailPatchMeters applies line-band sculpting patches along traced terrain", () => {
  const patchLayer = {
    patches: [
      {
        id: "traced-ridge-band",
        kind: "line-band",
        points: [
          { lat: 30, lng: 100 },
          { lat: 30, lng: 104 },
        ],
        widthDegrees: 1,
        deltaMeters: 500,
      },
      {
        id: "traced-valley-band",
        kind: "line-band",
        points: [
          { lat: 32, lng: 100 },
          { lat: 34, lng: 100 },
        ],
        widthDegrees: 0.5,
        deltaMeters: -200,
      },
    ],
  };

  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 30, 102), 500);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 30.5, 102), 250);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 31.2, 102), 0);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 33, 100), -200);
});

test("sampleTerrainDetailPatchMeters applies polygon-mask sculpting patches inside traced areas", () => {
  const patchLayer = {
    patches: [
      {
        id: "traced-basin-mask",
        kind: "polygon-mask",
        points: [
          { lat: 30, lng: 100 },
          { lat: 30, lng: 102 },
          { lat: 32, lng: 102 },
          { lat: 32, lng: 100 },
        ],
        edgeFeatherDegrees: 0.5,
        deltaMeters: -400,
      },
    ],
  };

  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 31, 101), -400);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 30.25, 101), -200);
  assert.equal(sampleTerrainDetailPatchMeters(patchLayer, 29.9, 101), 0);
});

test("sampleChinaTerrainElevation can layer local detail patches over DEM meters", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [1000, 1000],
      [1000, 1000],
    ],
  };
  const patchLayer = {
    patches: [
      {
        id: "local-peak",
        kind: "radial",
        center: { lat: 31, lng: 101 },
        radiusDegrees: 1.5,
        deltaMeters: 2000,
      },
    ],
  };

  const base = sampleChinaTerrainElevation(31, 101, grid);
  const detailed = sampleChinaTerrainElevation(31, 101, grid, patchLayer);
  assert.ok(detailed > base);
});

test("sampleChinaTerrainElevation prefers local DEM tiles before global DEM and sculpting patches", () => {
  const grid = {
    latitudes: [30, 32],
    longitudes: [100, 102],
    elevationsMeters: [
      [1000, 1000],
      [1000, 1000],
    ],
  };
  const tileLayer = {
    tiles: [
      {
        id: "local-ridge",
        latitudes: [30.5, 31.5],
        longitudes: [100.5, 101.5],
        elevationsMeters: [
          [2400, 2400],
          [2400, 2400],
        ],
      },
    ],
  };
  const patchLayer = {
    patches: [
      {
        id: "reviewed-lift",
        kind: "radial",
        center: { lat: 31, lng: 101 },
        radiusDegrees: 1,
        deltaMeters: 600,
      },
    ],
  };

  assert.equal(sampleChinaTerrainMeters(31, 101, grid, patchLayer, tileLayer), 3000);
  assert.equal(sampleChinaTerrainMeters(30.1, 100.1, grid, patchLayer, tileLayer), 1000);
});

test("summarizeTerrainTileAnalysis classifies DEM tile relief for readable 3d inspection", () => {
  const tile = {
    id: "rugged-demo",
    latitudes: [30, 31, 32],
    longitudes: [100, 101, 102],
    elevationsMeters: [
      [400, 900, 1500],
      [700, 1800, 2600],
      [600, 1500, 3100],
    ],
  };

  const analysis = summarizeTerrainTileAnalysis(tile);

  assert.equal(analysis.tileId, "rugged-demo");
  assert.equal(analysis.sampleCount, 9);
  assert.equal(analysis.cellCount, 4);
  assert.equal(analysis.minMeters, 400);
  assert.equal(analysis.maxMeters, 3100);
  assert.equal(Math.round(analysis.averageMeters), 1456);
  assert.equal(analysis.reliefMeters, 2700);
  assert.equal(analysis.maxCellReliefMeters, 1700);
  assert.equal(analysis.steepCellCount, 4);
  assert.equal(analysis.steepCellRatio, 1);
  assert.equal(analysis.reliefClass, "rugged");
  assert.equal(analysis.traceRecommendation, "ridge-valley");
  assert.equal(analysis.traceWorkload, "dense");
});

test("summarizeTerrainTileTraceAid reports tracing readiness from DEM reference density", () => {
  const tile = {
    id: "trace-aid-demo",
    latitudes: [30, 31, 32],
    longitudes: [100, 101, 102],
    elevationsMeters: [
      [400, 900, 1500],
      [700, 1800, 2600],
      [600, 1500, 3100],
    ],
  };

  const summary = summarizeTerrainTileTraceAid(tile, {
    contourSegments: 12,
    boundarySegments: 3,
    waterSegments: 2,
    cityCount: 1,
    traceGuides: [
      { kind: "ridge", points: [{ lat: 30, lng: 102 }, { lat: 31, lng: 102 }] },
      { kind: "valley", points: [{ lat: 30, lng: 100 }, { lat: 31, lng: 100 }] },
    ],
    recommendedTraceGuideCount: 2,
  });

  assert.equal(summary.tileId, "trace-aid-demo");
  assert.equal(summary.traceReadiness, "ready");
  assert.equal(summary.detailPriority, "high");
  assert.equal(summary.contourDensityPerCell, 3);
  assert.equal(summary.referenceLayerCount, 5);
  assert.equal(summary.guidePointCount, 4);
  assert.deepEqual(summary.guideKinds, ["ridge", "valley"]);
  assert.equal(summary.recommendedTraceGuideCount, 2);
});

test("buildTerrainTileTraceGuides extracts ridge and valley candidates from a DEM tile", () => {
  const tile = {
    id: "trace-demo",
    latitudes: [30, 31, 32],
    longitudes: [100, 101, 102],
    elevationsMeters: [
      [300, 900, 1800],
      [500, 1400, 2400],
      [200, 800, 3200],
    ],
  };

  const guides = buildTerrainTileTraceGuides(tile);

  assert.equal(guides.length, 2);
  assert.equal(guides[0].kind, "ridge");
  assert.equal(guides[0].sourceTileId, "trace-demo");
  assert.equal(guides[0].points.length, 3);
  assert.deepEqual(guides[0].points.map((point) => point.lng), [102, 102, 102]);
  assert.equal(guides[1].kind, "valley");
  assert.equal(guides[1].points.length, 3);
  assert.deepEqual(guides[1].points.map((point) => point.lng), [100, 100, 100]);
  assert.deepEqual(buildTerrainTileTraceGuides({ id: "flat", latitudes: [30], longitudes: [100], elevationsMeters: [[1]] }), []);
});

test("terrain trace elevation profiles sample DEM meters for sculpting review", () => {
  const grid = {
    latitudes: [30, 31, 32],
    longitudes: [100, 101, 102],
    elevationsMeters: [
      [1000, 1200, 1400],
      [1600, 2000, 2200],
      [2300, 2500, 2600],
    ],
  };
  const trace = {
    id: "ridge-profile",
    label: "Ridge profile",
    kind: "ridge",
    points: [
      { lat: 30, lng: 100 },
      { lat: 31, lng: 101 },
      { lat: 32, lng: 102 },
    ],
  };
  const patchLayer = {
    patches: [
      {
        id: "ridge-lift",
        kind: "radial",
        center: { lat: 31, lng: 101 },
        radiusDegrees: 1,
        deltaMeters: 100,
      },
    ],
  };

  assert.equal(sampleChinaTerrainMeters(31, 101, grid, patchLayer), 2100);
  const profile = buildTerrainTraceElevationProfile(trace, grid, patchLayer);

  assert.equal(profile.traceId, "ridge-profile");
  assert.equal(profile.sampleCount, 3);
  assert.deepEqual(profile.samples.map((sample) => Math.round(sample.elevationMeters)), [1000, 2100, 2600]);
  assert.equal(Math.round(profile.minMeters), 1000);
  assert.equal(Math.round(profile.maxMeters), 2600);
  assert.equal(Math.round(profile.averageMeters), 1900);
  assert.equal(Math.round(profile.reliefMeters), 1600);
  assert.deepEqual(profile.lowPoint, { lat: 30, lng: 100, elevationMeters: 1000 });
  assert.deepEqual(profile.highPoint, { lat: 32, lng: 102, elevationMeters: 2600 });
  assert.deepEqual(buildTerrainTraceElevationProfile({ id: "short", points: [{ lat: 30, lng: 100 }] }, grid).samples, []);
});

test("terrain trace profile charts map sampled elevations into stable chart coordinates", () => {
  const profile = {
    sampleCount: 3,
    samples: [
      { index: 0, lat: 30, lng: 100, elevationMeters: 1000 },
      { index: 1, lat: 31, lng: 101, elevationMeters: 2100 },
      { index: 2, lat: 32, lng: 102, elevationMeters: 2600 },
    ],
    minMeters: 1000,
    maxMeters: 2600,
    lowPoint: { lat: 30, lng: 100, elevationMeters: 1000 },
    highPoint: { lat: 32, lng: 102, elevationMeters: 2600 },
  };

  const chart = buildTerrainTraceProfileChart(profile, { width: 120, height: 40, padding: 4 });

  assert.equal(chart.width, 120);
  assert.equal(chart.height, 40);
  assert.equal(chart.points, "4,36 60,14 116,4");
  assert.deepEqual(chart.lowMarker, { x: 4, y: 36, elevationMeters: 1000 });
  assert.deepEqual(chart.highMarker, { x: 116, y: 4, elevationMeters: 2600 });
  assert.deepEqual(buildTerrainTraceProfileChart({ samples: [] }).points, "");
});

test("buildTerrainDetailPatchRing creates a closed local patch boundary", () => {
  const patch = {
    id: "test-ring",
    kind: "radial",
    center: { lat: 31, lng: 101 },
    radiusDegrees: 2,
  };

  const ring = buildTerrainDetailPatchRing(patch, 8);

  assert.equal(ring.length, 9);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.ok(ring.every((point) => isInRegion(point, CHINA_REGION)));
  assert.ok(ring.some((point) => point.lat > patch.center.lat));
  assert.ok(ring.some((point) => point.lng > patch.center.lng));
});

test("buildTerrainDetailPatchRing creates a closed line-band patch boundary", () => {
  const patch = {
    id: "test-line-band",
    kind: "line-band",
    points: [
      { lat: 30, lng: 100 },
      { lat: 31, lng: 102 },
      { lat: 30, lng: 104 },
    ],
    widthDegrees: 0.4,
  };

  const ring = buildTerrainDetailPatchRing(patch);

  assert.ok(ring.length >= 7);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.ok(ring.some((point) => point.lat > 31));
  assert.ok(ring.some((point) => point.lat < 30));
  assert.ok(ring.every((point) => isInRegion(point, CHINA_REGION)));
});

test("buildTerrainDetailPatchRing creates a closed polygon-mask patch boundary", () => {
  const patch = {
    id: "test-polygon-mask",
    kind: "polygon-mask",
    points: [
      { lat: 30, lng: 100 },
      { lat: 31, lng: 101 },
      { lat: 30, lng: 102 },
      { lat: 29.2, lng: 101 },
    ],
  };

  const ring = buildTerrainDetailPatchRing(patch);

  assert.equal(ring.length, 5);
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  assert.deepEqual(ring[1], { lat: 31, lng: 101 });
  assert.ok(ring.every((point) => isInRegion(point, CHINA_REGION)));
});

test("summarizeTerrainDetailPatches reports count and positive/negative sculpting", () => {
  const patchLayer = {
    patches: [
      { id: "lift", deltaMeters: 400 },
      { id: "sink", deltaMeters: -120 },
      { id: "flat", deltaMeters: 0 },
    ],
  };

  assert.deepEqual(summarizeTerrainDetailPatches(patchLayer), {
    total: 3,
    lifts: 1,
    depressions: 1,
  });
  assert.deepEqual(summarizeTerrainDetailPatches(null), {
    total: 0,
    lifts: 0,
    depressions: 0,
  });
});

test("main html entry is terrain-focused and has no class-manager interactions", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const combined = `${index}\n${worldMap}`;

  assert.match(index, /China Terrain Atlas/);
  assert.match(index, /world-map\.css/);
  assert.match(index, /world-map\.js/);
  assert.doesNotMatch(combined, /tuoguan|class manager/i);
});

test("project no longer carries the old class-management app implementation", () => {
  [
    "app.js",
    "logic.js",
    "styles.css",
    "desktop-store.js",
    "preload.js",
    "logic.test.js",
    "desktop-store.test.js",
    "mobile-build.test.js",
    "capacitor.config.json",
    path.join("scripts", "build-mobile.js"),
    "dist",
    "android",
    "ios",
  ].forEach((relativePath) => {
    assert.equal(
      fs.existsSync(path.join(__dirname, relativePath)),
      false,
      `${relativePath} should not remain in the terrain atlas project`
    );
  });

  [
    "package.json",
    "README.md",
    "index.html",
    "world-map.html",
    "main.js",
  ].forEach((relativePath) => {
    const content = fs.readFileSync(path.join(__dirname, relativePath), "utf8");
    assert.doesNotMatch(content, /tuoguan|class-manager|class manager/i);
    assert.doesNotMatch(content, /恩溢托管班|托管班管理系统/);
  });
});

test("main html entry exposes trace-derived candidate patch controls", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const combined = `${index}\n${worldMap}`;

  assert.match(combined, /id="suggestionButtons"/);
  assert.match(combined, /候选补丁/);
});

test("main html groups terrain patch controls into one patch console", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const stylesheet = fs.readFileSync(path.join(root, "world-map.css"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "world-map.js"), "utf8");
  const combined = `${index}\n${worldMap}`;

  assert.match(combined, /id="patchConsole"/);
  assert.match(combined, /class="patch-console"/);
  assert.ok(
    combined.indexOf('id="patchButtons"') < combined.indexOf('id="suggestionButtons"'),
    "applied and candidate patch controls should share one console group"
  );
  assert.match(stylesheet, /\.patch-console/);
  assert.match(runtime, /const patchConsole = document\.querySelector\("#patchConsole"\)/);
  assert.match(runtime, /patchConsole\.hidden = patchButtonsHidden && suggestionButtonsHidden/);
});

test("main html entry exposes a trace elevation profile panel", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const combined = `${index}\n${worldMap}`;

  assert.match(combined, /id="traceProfile"/);
  assert.match(combined, /aria-label="临摹线高程剖面"/);
});

test("main html entry exposes manual terrain tracing controls", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const combined = `${index}\n${worldMap}`;

  assert.match(combined, /id="manualTraceBtn"/);
  assert.match(combined, /id="generateManualTraceBtn"/);
  assert.match(combined, /id="undoManualTraceBtn"/);
  assert.match(combined, /id="reverseManualTraceBtn"/);
  assert.match(combined, /id="closeManualTraceBtn"/);
  assert.match(combined, /id="simplifyManualTraceBtn"/);
  assert.match(combined, /id="smoothManualTraceBtn"/);
  assert.match(combined, /id="deleteManualTracePointBtn"/);
  assert.match(combined, /id="clearManualTraceBtn"/);
  assert.match(combined, /id="manualTraceStatus"/);
});

test("runtime loads candidate patch suggestions as a non-sculpting inspection layer", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /china-trace-patch-suggestions\.json/);
  assert.match(runtime, /terrainSuggestionPatchGroup/);
  assert.match(runtime, /terrain-suggestion-patch-ring/);
  assert.match(runtime, /terrain-suggestion-patch-center/);
  assert.match(runtime, /data-suggestion-patch-focus-id/);
  assert.match(runtime, /selectedSuggestionPatchId/);
  assert.match(runtime, /focusOnSuggestionPatch/);
  assert.match(runtime, /sampleChinaTerrainElevation\(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.doesNotMatch(runtime, /sampleChinaTerrainElevation\(lat, lng, terrainElevationGrid, terrainPatchSuggestions, terrainDetailTiles\)/);
});

test("runtime loads Natural Earth China river centerlines and renders smoothed water curves", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /loadChinaRiverCenterlines/);
  assert.match(runtime, /RIVER_SOURCE_CANDIDATES/);
  assert.match(runtime, /data\/terrain\/china-rivers-hydrosheds\.json/);
  assert.match(runtime, /data\/terrain\/china-rivers-natural-earth\.json/);
  assert.match(runtime, /data\/terrain\/china-supplemental-tributaries\.json/);
  assert.match(runtime, /worldGroup\.userData\.waterSourcePath/);
  assert.match(runtime, /container\.dataset\.waterSourcePath/);
  assert.match(runtime, /mergeRiverCenterlineLayers/);
  assert.match(runtime, /createRiverCurveLine/);
  assert.match(runtime, /CatmullRomCurve3/);
  assert.match(runtime, /river\.rank === "main"/);
  assert.match(runtime, /depthTest: true/);
  assert.match(runtime, /WATER_MAIN_LIFT/);
  assert.match(runtime, /WATER_TRIBUTARY_LIFT/);
  assert.match(runtime, /createRiverCurveMesh/);
  assert.match(runtime, /new THREE\.TubeGeometry/);
  assert.match(runtime, /WATER_MAIN_RADIUS/);
  assert.match(runtime, /WATER_TRIBUTARY_RADIUS/);
  assert.match(runtime, /WATER_FLOW_DOT_RADIUS/);
  assert.match(runtime, /WATER_FLOW_HALO_RADIUS/);
  assert.match(runtime, /createRiverCurveVisual/);
  assert.match(runtime, /water-system-glow/);
  assert.match(runtime, /THREE\.AdditiveBlending/);
  assert.match(runtime, /WATER_MAIN_GLOW_RADIUS/);
  assert.match(runtime, /WATER_TRIBUTARY_GLOW_RADIUS/);
  assert.match(runtime, /createWaterFlowMarker/);
  assert.match(runtime, /estimateRiverFlowSpeed/);
  assert.match(runtime, /hydrologySource/);
  assert.match(runtime, /container\.dataset\.waterFlowSpeedAverage/);
  assert.match(runtime, /container\.dataset\.waterFlowSpeedRange/);
  assert.match(runtime, /container\.dataset\.waterFlowHydrologySource/);
  assert.match(runtime, /worldGroup\.userData\.waterFlowHydrologySource/);
  assert.match(runtime, /waterFlowMarkers/);
  assert.match(runtime, /createWaterFlowDirectionArrow/);
  assert.match(runtime, /waterFlowDirectionArrows/);
  assert.match(runtime, /water-flow-direction-arrow/);
  assert.match(runtime, /container\.dataset\.waterFlowDirectionCount/);
  assert.match(runtime, /waterFlowMarkers\.length < 24/);
  assert.match(runtime, /updateWaterMotion/);
  assert.match(runtime, /container\.dataset\.waterMotionEnabled/);
});

test("runtime subdues national water ribbons during close DEM inspection", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const applyLayerBlock = runtime.match(/function applyLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /function waterSystemDistanceOpacity\(viewDistance, baseOpacity, partRole\)/);
  assert.match(runtime, /waterSystemCoreEffectiveOpacity/);
  assert.match(runtime, /waterSystemGlowEffectiveOpacity/);
  assert.match(runtime, /waterSystemDistanceOpacityMode/);
  assert.match(runtime, /glow\.userData\.baseOpacity = Math\.min\(0\.34, opacity \* 0\.52\)/);
  assert.match(runtime, /core\.userData\.baseOpacity = opacity/);
  assert.ok(applyLayerBlock, "missing layer visibility function");
  assert.match(applyLayerBlock[0], /const waterRibbonOpacity = waterSystemDistanceOpacity\(camera\.position\.z, object\.userData\.baseOpacity, object\.userData\.role\)/);
  assert.match(applyLayerBlock[0], /object\.material\.opacity = waterRibbonOpacity\.opacity/);
  assert.match(applyLayerBlock[0], /container\.dataset\.waterSystemCoreEffectiveOpacity = waterSystemOpacityDebug\.coreOpacity\.toFixed\(2\)/);
  assert.match(applyLayerBlock[0], /container\.dataset\.waterSystemGlowEffectiveOpacity = waterSystemOpacityDebug\.glowOpacity\.toFixed\(2\)/);
  assert.match(applyLayerBlock[0], /container\.dataset\.waterSystemDistanceOpacityMode = waterSystemOpacityDebug\.mode/);
  assert.match(script, /waterSystemCoreEffectiveOpacity/);
  assert.match(script, /waterSystemGlowEffectiveOpacity/);
  assert.match(script, /waterSystemDistanceOpacityMode/);
  assert.match(script, /Expected national water ribbon distance opacity tuning/);
});

test("runtime exposes observation modes and subdues administrative boundaries by distance", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const stylesheet = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const applyLayerBlock = runtime.match(/function applyLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(html, /id="terrainObservationModeStatus"/);
  assert.match(stylesheet, /\.observation-mode-status/);
  assert.match(runtime, /const terrainObservationModeStatus = document\.querySelector\("#terrainObservationModeStatus"\)/);
  assert.match(runtime, /function terrainObservationModeForDistance\(viewDistance\)/);
  assert.match(runtime, /id: "explore"/);
  assert.match(runtime, /id: "locate"/);
  assert.match(runtime, /id: "inspect"/);
  assert.match(runtime, /function boundaryDistanceOpacity\(viewDistance, baseOpacity, boundaryLevel\)/);
  assert.match(runtime, /line\.userData\.baseOpacity = opacity/);
  assert.match(runtime, /terrainObservationModeStatus\.textContent = observationMode\.text/);
  assert.match(runtime, /container\.dataset\.terrainObservationMode = observationMode\.id/);
  assert.match(runtime, /container\.dataset\.terrainObservationModeLabel = observationMode\.label/);
  assert.match(runtime, /container\.dataset\.terrainObservationModeText = observationMode\.text/);
  assert.match(runtime, /container\.dataset\.provinceBoundaryEffectiveOpacity/);
  assert.match(runtime, /container\.dataset\.prefectureBoundaryEffectiveOpacity/);
  assert.match(runtime, /container\.dataset\.boundaryDistanceOpacityMode/);
  assert.ok(applyLayerBlock, "missing layer visibility function");
  assert.match(applyLayerBlock[0], /const boundaryOpacityDebug = \{ provinceOpacity: 0, prefectureOpacity: 0, mode: "idle" \}/);
  assert.match(applyLayerBlock[0], /const adminBoundaryOpacity = boundaryDistanceOpacity\(camera\.position\.z, object\.userData\.baseOpacity, object\.userData\.boundaryLevel\)/);
  assert.match(applyLayerBlock[0], /object\.material\.opacity = adminBoundaryOpacity\.opacity/);
  assert.match(applyLayerBlock[0], /syncTerrainObservationModeStatus\(\)/);
  assert.match(script, /terrainObservationMode/);
  assert.match(script, /provinceBoundaryEffectiveOpacity/);
  assert.match(script, /prefectureBoundaryEffectiveOpacity/);
  assert.match(script, /boundaryDistanceOpacityMode/);
  assert.match(script, /Expected terrain observation mode and boundary opacity tuning/);
});

test("runtime maps fine tributary water curves to an optional layer", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /Core\.getWaterSystemLayerId/);
  assert.match(runtime, /Core\.getGroupedRenderableMapLayers/);
  assert.match(runtime, /userData\.river/);
  assert.match(runtime, /waterTributaries: "water"/);
  assert.match(runtime, /waterMinorTributaries: "water"/);
  assert.match(runtime, /"water-flow-direction-arrow": "water"/);
});

test("runtime renders map layer controls as grouped panels", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const stylesheet = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(runtime, /Core\.getGroupedRenderableMapLayers/);
  assert.match(runtime, /class="layer-group"/);
  assert.match(runtime, /class="layer-group-title"/);
  assert.match(runtime, /data-layer-group/);
  assert.match(stylesheet, /\.layer-group/);
  assert.match(stylesheet, /\.layer-group-title/);
  assert.match(stylesheet, /\.layer-group-items/);
});

test("runtime keeps terrain overview details expanded while toggling sublayers", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /let openLayerGroupIds = new Set\(\)/);
  assert.match(runtime, /function rememberOpenLayerGroupState\(\)/);
  assert.match(runtime, /function getOpenLayerGroupIds\(\)/);
  assert.match(runtime, /const preservedOpenLayerGroupIds = rememberOpenLayerGroupState\(\)/);
  assert.match(runtime, /data-layer-group-details="\$\{group\.id\}"/);
  assert.match(runtime, /details\.open = preservedOpenLayerGroupIds\.has\(details\.dataset\.layerGroupDetails\)/);
  assert.match(runtime, /details\.addEventListener\("toggle"/);
  assert.match(runtime, /rememberOpenLayerGroupState\(\);\s*\n\s*layerVisibility = Core\.toggleMapLayer\(layerVisibility, button\.dataset\.layerId\)/);
});

test("runtime separates visible lake references from hidden coastline references", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const packageJson = fs.readFileSync(path.join(__dirname, "package.json"), "utf8");

  assert.match(runtime, /loadChinaWaterReferences/);
  assert.match(runtime, /WATER_REFERENCE_SOURCE_CANDIDATES/);
  assert.match(runtime, /data\/terrain\/china-water-references-hydrosheds\.json/);
  assert.match(runtime, /data\/terrain\/china-water-references-natural-earth\.json/);
  assert.match(runtime, /data\/terrain\/china-supplemental-water-references\.json/);
  assert.match(runtime, /worldGroup\.userData\.waterReferenceSourcePath/);
  assert.match(runtime, /container\.dataset\.waterReferenceSourcePath/);
  assert.match(runtime, /mergeWaterReferenceLayers/);
  assert.match(runtime, /createWaterReferenceOutlines/);
  assert.match(runtime, /terrain-water-lake-reference/);
  assert.match(runtime, /terrain-water-coast-reference/);
  assert.match(runtime, /WATER_LAKE_LIFT/);
  assert.match(runtime, /WATER_COAST_LIFT/);
  assert.match(runtime, /"terrain-water-lake-reference": "waterRefs"/);
  assert.match(runtime, /"terrain-water-coast-reference": "coastRefs"/);
  assert.match(runtime, /container\.dataset\.waterReferenceLakeCount/);
  assert.match(runtime, /container\.dataset\.waterReferenceCoastlineCount/);
  assert.match(runtime, /lakeReferenceMeshes/);
  assert.match(runtime, /updateLakeMotion/);
  assert.match(runtime, /container\.dataset\.lakeMotionEnabled/);
  assert.match(packageJson, /terrain:waterrefs/);
  assert.match(packageJson, /extract-china-water-references\.js/);
});

test("runtime renders lake water as animated terrain-attached ripple markers", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /lakeRippleMarkers/);
  assert.match(runtime, /createLakeRippleMarker/);
  assert.match(runtime, /terrain-water-lake-ripple/);
  assert.match(runtime, /container\.dataset\.lakeRippleMarkerCount/);
  assert.match(runtime, /container\.dataset\.lakeWindDrivenRippleCount/);
  assert.match(runtime, /container\.dataset\.lakeWindHeadingSampleCount/);
  assert.match(runtime, /worldGroup\.userData\.lakeRippleMarkerCount/);
  assert.match(runtime, /nearestWeatherVector/);
  assert.match(runtime, /refreshLakeWeatherDrivenMotion/);
  assert.match(runtime, /refreshWeatherCloudFlow[\s\S]*refreshLakeWeatherDrivenMotion\(\)/);
  assert.match(runtime, /windHeading/);
  assert.match(runtime, /windSpeed/);
  assert.match(runtime, /weatherPointId/);
  assert.match(runtime, /driftVector/);
  assert.match(runtime, /updateLakeMotion[\s\S]*lakeRippleMarkers\.forEach/);
  assert.match(runtime, /entry\.driftVector/);
  assert.match(runtime, /WATER_LAKE_RIPPLE_LIFT/);
}
);

test("runtime renders optional weather cloud flow from Open-Meteo with a local fallback", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /OPEN_METEO_FORECAST_URL/);
  assert.match(runtime, /OPEN_METEO_CURRENT_FIELDS/);
  assert.match(runtime, /current=cloud_cover,wind_speed_10m,wind_direction_10m/);
  assert.match(runtime, /forecast_hours=1/);
  assert.match(runtime, /WEATHER_REFRESH_INTERVAL_MS = 15 \* 60 \* 1000/);
  assert.match(runtime, /WEATHER_REQUEST_TIMEOUT_MS = 3500/);
  assert.match(runtime, /WEATHER_SAMPLE_POINTS/);
  assert.match(runtime, /weatherCloudFlowGroup/);
  assert.match(runtime, /weatherCloudParticles/);
  assert.match(runtime, /loadWeatherCloudFlow\(\)/);
  assert.match(runtime, /refreshWeatherCloudFlow\(\)/);
  assert.match(runtime, /new AbortController\(\)/);
  assert.match(runtime, /weatherCloudFlow = createFallbackWeatherLayer\(\);[\s\S]*createWeatherCloudFlow\(weatherCloudFlow\)/);
  assert.match(runtime, /window\.setInterval\(refreshWeatherCloudFlow, WEATHER_REFRESH_INTERVAL_MS\)/);
  assert.match(runtime, /createFallbackWeatherLayer\(\)/);
  assert.match(runtime, /createWeatherCloudFlow\(/);
  assert.match(runtime, /updateWeatherCloudMotion\(elapsed\)/);
  assert.match(runtime, /terrain-weather-cloud/);
  assert.match(runtime, /terrain-weather-vector/);
  assert.match(runtime, /"terrain-weather-cloud": "weather"/);
  assert.match(runtime, /"terrain-weather-vector": "weather"/);
  assert.match(runtime, /container\.dataset\.weatherSource/);
  assert.match(runtime, /container\.dataset\.weatherCloudCount/);
  assert.match(runtime, /container\.dataset\.weatherUpdatedAt/);
  assert.match(runtime, /container\.dataset\.weatherMotionEnabled/);
  assert.match(runtime, /container\.dataset\.weatherAverageWindSpeed/);
  assert.match(runtime, /container\.dataset\.weatherAverageWindHeading/);
  assert.match(runtime, /container\.dataset\.weatherWindHeadingRange/);
  assert.match(runtime, /worldGroup\.userData\.weatherWindHeadingRange/);
  assert.match(runtime, /particle\.userData\.windSpeed/);
  assert.match(runtime, /particle\.userData\.windDirection/);
  assert.match(runtime, /vector\.userData\.heading/);
  assert.match(runtime, /vector\.userData\.windSpeed/);
});

test("runtime keeps the default terrain overview overlays close to the surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const TERRAIN_MESH_LIFT = 0\.04/);
  assert.match(runtime, /const TERRAIN_SURFACE_OVERLAY_LIFT = 0\.064/);
  assert.match(runtime, /const WATER_MAIN_LIFT = 0\.082/);
  assert.match(runtime, /const WATER_TRIBUTARY_LIFT = 0\.076/);
  assert.match(runtime, /const WATER_LAKE_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT/);
  assert.match(runtime, /const BOUNDARY_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT/);
  assert.match(runtime, /const PROVINCE_BOUNDARY_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT/);
  assert.match(runtime, /const CONTOUR_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT/);
  assert.doesNotMatch(runtime, /isMainRiver \? 0\.43 : 0\.41/);
  assert.doesNotMatch(runtime, /createRiverCurveMesh\(lake\.path, color, 0\.42, 0\.314/);
  assert.doesNotMatch(runtime, /createPathLine\(Core\.CHINA_BOUNDARY\.path, new THREE\.Color\("#00f5d4"\), 0\.72, 0\.31/);
  assert.doesNotMatch(runtime, /const (?:WATER_LAKE_LIFT|BOUNDARY_LIFT|PROVINCE_BOUNDARY_LIFT|CONTOUR_LIFT) = 0\.07/);
});

test("runtime attaches optional terrain detail layers to the terrain surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const TERRAIN_SURFACE_OVERLAY_LIFT = 0\.064/);
  assert.match(runtime, /const TERRAIN_SURFACE_MARKER_LIFT = 0\.068/);
  [
    "WATER_LAKE_LIFT",
    "WATER_COAST_LIFT",
    "BOUNDARY_LIFT",
    "PROVINCE_BOUNDARY_LIFT",
    "CONTOUR_LIFT",
    "TERRAIN_DETAIL_LIFT",
    "TERRAIN_TRACE_LIFT",
    "TERRAIN_SUGGESTION_LIFT",
    "TERRAIN_APPROVED_LIFT",
  ].forEach((constantName) => {
    assert.match(runtime, new RegExp(`const ${constantName} = TERRAIN_SURFACE_OVERLAY_LIFT`));
  });
  assert.match(runtime, /const TERRAIN_SITE_LIFT = TERRAIN_SURFACE_MARKER_LIFT/);
  assert.match(runtime, /function terrainDetailPatchFocusPoint\(patch\)/);
  assert.match(runtime, /createPathLine\(ring, color, 0\.5, TERRAIN_DETAIL_LIFT\)/);
  assert.match(runtime, /const focusPoint = terrainDetailPatchFocusPoint\(patch\)/);
  assert.match(runtime, /rotationTarget\.y = -toRadians\(focusPoint\.lng\)/);
  assert.match(runtime, /createPathLine\(path, color, 0\.52, TERRAIN_TRACE_LIFT\)/);
  assert.match(runtime, /createPathLine\(ring, color, 0\.34, TERRAIN_SUGGESTION_LIFT\)/);
  assert.match(runtime, /createPathLine\(ring, color, 0\.38, TERRAIN_APPROVED_LIFT\)/);
  assert.match(runtime, /radius: terrainRadius\(site\.lat, site\.lng, TERRAIN_SITE_LIFT\)/);
  assert.doesNotMatch(runtime, /const (?:WATER_LAKE_LIFT|WATER_COAST_LIFT|BOUNDARY_LIFT|PROVINCE_BOUNDARY_LIFT|CONTOUR_LIFT|TERRAIN_DETAIL_LIFT|TERRAIN_TRACE_LIFT|TERRAIN_SUGGESTION_LIFT|TERRAIN_APPROVED_LIFT|TERRAIN_SITE_LIFT) = 0\.0[789]/);
  assert.doesNotMatch(runtime, /Core\.DEFAULT_RADIUS \+ 0\.3[146]/);
});

test("runtime renders DEM relief strongly enough for close terrain inspection", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const TERRAIN_VERTICAL_EXAGGERATION = 0\.24/);
  assert.match(runtime, /Core\.DEFAULT_RADIUS \+ TERRAIN_MESH_LIFT \+ elevation \* TERRAIN_VERTICAL_EXAGGERATION/);
  assert.match(runtime, /Core\.DEFAULT_RADIUS \+ lift \+ terrainElevation\(lat, lng\) \* TERRAIN_VERTICAL_EXAGGERATION/);
  assert.doesNotMatch(runtime, /elevation \* 0\.17/);
  assert.doesNotMatch(runtime, /terrainElevation\(lat, lng\) \* 0\.17/);
});

test("runtime uses stronger hillshade contrast so relief reads on the map surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const TERRAIN_HILLSHADE_SAMPLE_DEGREES = 0\.08/);
  assert.match(runtime, /const TERRAIN_HILLSHADE_EAST_WEST_GAIN = -2\.4/);
  assert.match(runtime, /const TERRAIN_HILLSHADE_NORTH_SOUTH_GAIN = 1\.75/);
  assert.match(runtime, /const TERRAIN_HILLSHADE_MIN = 0\.54/);
  assert.match(runtime, /const TERRAIN_HILLSHADE_MAX = 1\.32/);
  assert.match(runtime, /const sampleStep = TERRAIN_HILLSHADE_SAMPLE_DEGREES/);
  assert.match(runtime, /slopeX \* TERRAIN_HILLSHADE_EAST_WEST_GAIN \+ slopeY \* TERRAIN_HILLSHADE_NORTH_SOUTH_GAIN/);
  assert.match(runtime, /Core\.clamp\([\s\S]*TERRAIN_HILLSHADE_MIN,\s*TERRAIN_HILLSHADE_MAX\s*\)/);
  assert.doesNotMatch(runtime, /const sampleStep = 0\.12/);
  assert.doesNotMatch(runtime, /slopeX \* -1\.65 \+ slopeY \* 1\.25/);
});

test("runtime encodes subtle elevation bands directly into the terrain surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const TERRAIN_RELIEF_BAND_INTERVAL = 0\.055/);
  assert.match(runtime, /const TERRAIN_RELIEF_BAND_STRENGTH = 0\.075/);
  assert.match(runtime, /function terrainReliefBand\(elevation\)/);
  assert.match(runtime, /Math\.sin\(normalizedElevation \* Math\.PI \* 2\)/);
  assert.match(runtime, /return 1 - band \* TERRAIN_RELIEF_BAND_STRENGTH/);
  assert.match(runtime, /return color\.multiplyScalar\(hillshade\)\.multiplyScalar\(terrainReliefBand\(elevation\)\)/);
});

test("runtime colorizes close DEM tiles with realistic terrain bands", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const TERRAIN_DETAIL_TILE_COLOR_BANDS = \[/);
  assert.match(runtime, /id: "lowland"/);
  assert.match(runtime, /id: "foothill"/);
  assert.match(runtime, /id: "mountain"/);
  assert.match(runtime, /id: "alpine"/);
  assert.match(runtime, /function terrainDetailTileColorBand\(meters\)/);
  assert.match(runtime, /function terrainDetailTileSurfaceColor\(meters, elevation, lat, lng, slopeShade = 1\)/);
  assert.match(runtime, /Core\.sampleChinaTerrainMeters\(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.match(runtime, /terrainDetailTileSurfaceColor\(meters, elevation, lat, lng, slopeShade\)/);
  assert.match(runtime, /mesh\.userData\.colorBandLabels/);
  assert.match(runtime, /mesh\.userData\.colorBandCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceColorBandLabels/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceColorBandCount/);
  assert.match(script, /terrainDetailTileSurfaceColorBandLabels/);
  assert.match(script, /terrainDetailTileSurfaceColorBandCount/);
  assert.match(script, /Expected selected DEM tile terrain color bands/);
});

test("runtime shades close DEM tiles from local slope so relief reads at inspection distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES/);
  assert.match(runtime, /const TERRAIN_DETAIL_TILE_SLOPE_SHADE_MIN/);
  assert.match(runtime, /const TERRAIN_DETAIL_TILE_SLOPE_SHADE_MAX/);
  assert.match(runtime, /function terrainDetailTileSlopeShade\(lat, lng\)/);
  assert.match(runtime, /Core\.sampleChinaTerrainMeters\(lat, lng - TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES/);
  assert.match(runtime, /Core\.sampleChinaTerrainMeters\(lat \+ TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES, lng/);
  assert.match(runtime, /terrainDetailTileSurfaceColor\(meters, elevation, lat, lng, slopeShade\)/);
  assert.match(runtime, /color[\s\S]*\.multiplyScalar\(slopeShade\)/);
  assert.match(runtime, /mesh\.userData\.slopeShadeMin/);
  assert.match(runtime, /mesh\.userData\.slopeShadeMax/);
  assert.match(runtime, /terrainDetailTileSurfaceGroup\.userData\.slopeShadeMin/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceSlopeShadeMin/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceSlopeShadeMax/);
  assert.match(script, /terrainDetailTileSurfaceSlopeShadeMin/);
  assert.match(script, /terrainDetailTileSurfaceSlopeShadeMax/);
  assert.match(script, /Expected selected DEM tile slope shade range/);
});

test("runtime blends close DEM tile edges back into the base terrain surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const TERRAIN_DETAIL_TILE_EDGE_BLEND_DEGREES/);
  assert.match(runtime, /function terrainDetailTileEdgeBlendWeight\(tile, lat, lng\)/);
  assert.match(runtime, /function terrainDetailTileBaseMeters\(lat, lng, fallbackMeters\)/);
  assert.match(runtime, /Core\.sampleTerrainGridMeters\(terrainElevationGrid, lat, lng\)/);
  assert.match(runtime, /const edgeBlendWeight = terrainDetailTileEdgeBlendWeight\(tile, lat, lng\)/);
  assert.match(runtime, /const baseMeters = terrainDetailTileBaseMeters\(lat, lng, localMeters\)/);
  assert.match(runtime, /const meters = baseMeters \+ \(localMeters - baseMeters\) \* edgeBlendWeight/);
  assert.match(runtime, /Core\.metersToTerrainElevation\(meters\)/);
  assert.match(runtime, /mesh\.userData\.edgeBlendWeightMin/);
  assert.match(runtime, /mesh\.userData\.edgeBlendWeightMax/);
  assert.match(runtime, /terrainDetailTileSurfaceGroup\.userData\.edgeBlendWeightMin/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceEdgeBlendMin/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSurfaceEdgeBlendMax/);
  assert.match(script, /terrainDetailTileSurfaceEdgeBlendMin/);
  assert.match(script, /terrainDetailTileSurfaceEdgeBlendMax/);
  assert.match(script, /Expected selected DEM tile edge blending range/);
});

test("runtime exposes a compact selected DEM tile workflow inspector", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainTileWorkflowInspector"/);
  assert.match(html, /id="terrainTilePanel"[\s\S]*id="terrainTileWorkflowInspector"[\s\S]*id="terrainTileButtons"/);
  assert.match(css, /\.terrain-tile-workflow-inspector/);
  assert.match(runtime, /const terrainTileWorkflowInspector = document\.querySelector\("#terrainTileWorkflowInspector"\)/);
  assert.match(runtime, /function renderTerrainTileWorkflowInspector\(activeTile, status, context\)/);
  assert.match(runtime, /container\.dataset\.terrainTileWorkflowInspectorText/);
  assert.match(runtime, /container\.dataset\.terrainTileWorkflowInspectorBandLabels/);
  assert.match(runtime, /container\.dataset\.terrainTileWorkflowInspectorTraceState/);
  assert.match(runtime, /terrainDetailTileSurfaceGroup\.userData\.colorBandLabels/);
  assert.match(runtime, /terrainTileTraceAidReadiness/);
  assert.match(script, /terrainTileWorkflowInspectorText/);
  assert.match(script, /terrainTileWorkflowInspectorVisibleText/);
  assert.match(script, /Expected selected DEM tile workflow inspector/);
});

test("runtime exposes selected DEM tile render QA metrics for multi-region tuning", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainTileRenderQa"/);
  assert.match(html, /id="terrainTileWorkflowInspector"[\s\S]*id="terrainTileRenderQa"[\s\S]*id="terrainTileButtons"/);
  assert.match(css, /\.terrain-tile-render-qa/);
  assert.match(runtime, /const terrainTileRenderQa = document\.querySelector\("#terrainTileRenderQa"\)/);
  assert.match(runtime, /function renderTerrainTileRenderQa\(activeTile, status\)/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaText/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaVisibleText/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaSlopeShadeRange/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaEdgeBlendRange/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaBandLabels/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaContourSegmentCount/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaContourLevelCount/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaContourReadiness/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaContourOpacity/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaState/);
  assert.match(runtime, /function terrainTileRenderQaVerdict\(activeTile, status, metrics\)/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaVerdict/);
  assert.match(runtime, /container\.dataset\.terrainTileRenderQaFlags/);
  assert.match(runtime, /function terrainDetailTileContourOpacityProfile\(segmentCount, levelCount\)/);
  assert.match(runtime, /label: `Verdict \$\{verdict\.label\}`/);
  assert.match(runtime, /label: `Contours \$\{metrics\.contourSegments\} seg \/ \$\{metrics\.contourLevelCount\} levels \/ \$\{metrics\.contourOpacity\} opacity`/);
  assert.match(runtime, /metrics\.contourReadiness !== "ready"/);
  assert.match(runtime, /line\.material\.opacity = contourProfile\.opacity/);
  assert.match(script, /captureTerrainTileRenderQa/);
  assert.match(script, /terrainTileRenderQaVerdict/);
  assert.match(script, /terrainTileRenderQaFlags/);
  assert.match(script, /terrainTileRenderQaContourSegmentCount/);
  assert.match(script, /terrainTileRenderQaContourLevelCount/);
  assert.match(script, /terrainTileRenderQaContourReadiness/);
  assert.match(script, /terrainTileRenderQaContourOpacity/);
  assert.match(script, /Expected selected DEM tile render QA verdict/);
  assert.match(script, /multiRegionTerrainRenderQa/);
  assert.match(script, /Expected multi-region DEM render QA verdicts/);
  assert.match(script, /Expected multi-region DEM render QA metrics/);
  assert.match(script, /Expected multi-region DEM contour QA metrics/);
  assert.match(script, /Expected multi-region DEM contour opacity tuning/);
  assert.match(script, /qinling-mapzen-terrarium-z7-102-51/);
  assert.match(script, /sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52/);
  assert.match(script, /hengduan-dali-lijiang-mapzen-terrarium-z7-99-53/);
});

test("runtime exposes DEM tile visual tuning presets without changing terrain data", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainTileVisualPresetControls"/);
  assert.match(html, /data-terrain-tile-visual-preset="natural"/);
  assert.match(html, /data-terrain-tile-visual-preset="relief"/);
  assert.match(html, /data-terrain-tile-visual-preset="soft-edge"/);
  assert.match(css, /\.terrain-tile-visual-preset-control/);
  assert.match(runtime, /const terrainTileVisualPresetButtons = document\.querySelectorAll\("\[data-terrain-tile-visual-preset\]"\)/);
  assert.match(runtime, /const TERRAIN_DETAIL_TILE_VISUAL_PRESETS = \{/);
  assert.match(runtime, /let terrainTileVisualPreset = "natural"/);
  assert.match(runtime, /function terrainTileVisualSettings\(\)/);
  assert.match(runtime, /function setTerrainTileVisualPreset\(presetId\)/);
  assert.match(runtime, /terrainTileSurfaceCache\.clear\(\)/);
  assert.match(runtime, /refreshSelectedTerrainTileSurface\(selectedTile\)/);
  assert.match(runtime, /terrainTileVisualPresetButtons\.forEach/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualPreset/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualPresetLabel/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualSlopeGainScale/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualEdgeBlendDegrees/);
  assert.match(runtime, /terrainDetailTileSlopeShade\(lat, lng\)/);
  assert.match(runtime, /terrainDetailTileEdgeBlendWeight\(tile, lat, lng\)/);
  assert.match(runtime, /terrainTileVisualSettings\(\)\.slopeGainScale/);
  assert.match(runtime, /terrainTileVisualSettings\(\)\.edgeBlendDegrees/);
  assert.match(runtime, /Style \$\{terrainTileVisualSettings\(\)\.label\}/);
  assert.match(script, /terrainTileVisualPresetInteractions/);
  assert.match(script, /data-terrain-tile-visual-preset="relief"/);
  assert.match(script, /data-terrain-tile-visual-preset="soft-edge"/);
  assert.match(script, /Expected DEM tile visual tuning presets/);
});

test("runtime recommends a DEM tile visual preset from render QA state", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainTileVisualRecommendation"/);
  assert.match(html, /id="applyTerrainTileVisualRecommendationBtn"/);
  assert.match(html, /id="terrainTileRenderQa"[\s\S]*id="terrainTileVisualRecommendation"[\s\S]*id="terrainTileVisualPresetControls"/);
  assert.match(css, /\.terrain-tile-visual-recommendation/);
  assert.match(runtime, /const terrainTileVisualRecommendation = document\.querySelector\("#terrainTileVisualRecommendation"\)/);
  assert.match(runtime, /const applyTerrainTileVisualRecommendationBtn = document\.querySelector\("#applyTerrainTileVisualRecommendationBtn"\)/);
  assert.match(runtime, /function recommendTerrainTileVisualPreset\(activeTile, status, metrics, verdict\)/);
  assert.match(runtime, /function renderTerrainTileVisualRecommendation\(activeTile, status, metrics, verdict\)/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualRecommendedPreset/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualRecommendedLabel/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualRecommendationReason/);
  assert.match(runtime, /container\.dataset\.terrainTileVisualRecommendationText/);
  assert.match(runtime, /setTerrainTileVisualPreset\(recommendedPreset\.id\)/);
  assert.match(script, /terrainTileVisualRecommendationInteraction/);
  assert.match(script, /applyTerrainTileVisualRecommendationBtn/);
  assert.match(script, /Expected DEM tile visual preset recommendation/);
});

test("tested prefecture city anchors are available as a separate terrain city layer", () => {
  const cityById = new Map(CHINA_TERRAIN_CITIES.map((city) => [city.id, city]));
  const expectedCities = [
    ["chengdu", "成都", "chengdu-plain"],
    ["mianyang", "绵阳", "chengdu-plain"],
    ["hanzhong", "汉中", "hanzhong-basin"],
    ["ankang", "安康", "ankang-han-river-valley"],
    ["luoyang", "洛阳", "western-henan-funiu-songshan-mountains"],
    ["nanyang", "南阳", "nanyang-basin"],
    ["guiyang", "贵阳", "qianzhong-karst-plateau"],
    ["jinan", "济南", "shandong-hills"],
    ["taiyuan", "太原", "taiyuan-basin"],
    ["zhangjiakou", "张家口", "yan-taihang-mountains"],
    ["baishan", "白山", "changbai-volcanic-mountains"],
    ["tonghua", "通化", "changbai-volcanic-mountains"],
    ["yanji", "延吉", "yanbian-tumen-basin"],
    ["mudanjiang", "牡丹江", "mudanjiang-valley-basin"],
    ["hulunbuir", "呼伦贝尔", "hulunbuir-grassland-plateau"],
    ["manzhouli", "满洲里", "hulunbuir-grassland-plateau"],
    ["changsha", "长沙", "xiangjiang-changzhutan-basin"],
    ["zhuzhou", "株洲", "xiangjiang-changzhutan-basin"],
    ["xiangtan", "湘潭", "xiangjiang-changzhutan-basin"],
    ["nanchang", "南昌", "poyang-lake-plain"],
    ["jiujiang", "九江", "poyang-lake-plain"],
    ["jingdezhen", "景德镇", "jiangnan-hills"],
    ["shangrao", "上饶", "huaiyu-xinjiang-hills"],
    ["yingtan", "鹰潭", "huaiyu-xinjiang-hills"],
    ["heyuan", "河源", "southeast-hills"],
    ["guangzhou", "广州", "pearl-river-delta-plain"],
    ["foshan", "佛山", "pearl-river-delta-plain"],
    ["dongguan", "东莞", "pearl-river-delta-plain"],
    ["shenzhen", "深圳", "pearl-river-delta-plain"],
    ["zhuhai", "珠海", "pearl-river-delta-plain"],
    ["shantou", "汕头", "chaoshan-coastal-plain"],
    ["zhanjiang", "湛江", "west-guangdong-leizhou-lowlands"],
    ["beihai", "北海", "beibu-gulf-coastal-lowlands"],
    ["fuzhou", "福州", "fujian-zhejiang-coastal-lowlands"],
    ["xiamen", "厦门", "fujian-zhejiang-coastal-lowlands"],
    ["quanzhou", "泉州", "fujian-zhejiang-coastal-lowlands"],
    ["zhangzhou", "漳州", "fujian-zhejiang-coastal-lowlands"],
    ["putian", "莆田", "fujian-zhejiang-coastal-lowlands"],
    ["ningde", "宁德", "fujian-zhejiang-coastal-lowlands"],
    ["wenzhou", "温州", "fujian-zhejiang-coastal-lowlands"],
    ["taizhou-zhejiang", "台州", "fujian-zhejiang-coastal-lowlands"],
    ["hangzhou", "杭州", "hangjiahu-ningshao-plains"],
    ["jiaxing", "嘉兴", "hangjiahu-ningshao-plains"],
    ["huzhou", "湖州", "hangjiahu-ningshao-plains"],
    ["shaoxing", "绍兴", "hangjiahu-ningshao-plains"],
    ["ningbo", "宁波", "hangjiahu-ningshao-plains"],
    ["nanjing", "南京", "ningzhen-maoshan-hills"],
    ["zhenjiang", "镇江", "middle-lower-yangtze-plain"],
    ["changzhou", "常州", "taihu-yangtze-delta-plain"],
    ["wuxi", "无锡", "taihu-yangtze-delta-plain"],
    ["suzhou", "苏州", "taihu-yangtze-delta-plain"],
    ["nantong", "南通", "jianghuai-lixiahe-plain"],
    ["shanghai", "上海", "middle-lower-yangtze-plain"],
    ["yangzhou", "扬州", "jianghuai-lixiahe-plain"],
    ["taizhou-jiangsu", "泰州", "jianghuai-lixiahe-plain"],
    ["huaian", "淮安", "jianghuai-lixiahe-plain"],
    ["yancheng", "盐城", "jianghuai-lixiahe-plain"],
    ["bengbu", "蚌埠", "jianghuai-lixiahe-plain"],
    ["huainan", "淮南", "jianghuai-lixiahe-plain"],
    ["hefei", "合肥", "hefei-chaohu-low-hills"],
    ["luan", "六安", "wanxi-jianghuai-hills"],
    ["anqing", "安庆", "middle-lower-yangtze-plain"],
    ["wuhu", "芜湖", "middle-lower-yangtze-plain"],
    ["maanshan", "马鞍山", "middle-lower-yangtze-plain"],
    ["chuzhou", "滁州", "jianghuai-lixiahe-plain"],
    ["fuyang-anhui", "阜阳", "huanghuai-north-jiangsu-plain"],
    ["bozhou", "亳州", "huanghuai-north-jiangsu-plain"],
    ["huaibei", "淮北", "huanghuai-north-jiangsu-plain"],
    ["suzhou-anhui", "宿州", "huanghuai-north-jiangsu-plain"],
    ["xuzhou", "徐州", "huanghuai-north-jiangsu-plain"],
    ["suqian", "宿迁", "huanghuai-north-jiangsu-plain"],
    ["lianyungang", "连云港", "huanghuai-north-jiangsu-plain"],
  ];

  assert.ok(CHINA_TERRAIN_CITIES.length >= expectedCities.length);
  expectedCities.forEach(([id, name, blockId]) => {
    const city = cityById.get(id);
    assert.ok(city, `${id} should be included in the tested city anchors`);
    assert.equal(city.name, name);
    assert.equal(city.kind, "prefecture");
    assert.equal(city.terrainBlockId, blockId);
    assert.ok(isInRegion(city, CHINA_REGION), `${id} should be inside China terrain bounds`);
    const matchingBlockIds = FIVE_TERRAIN_BLOCKS
      .filter((block) => isPointInsidePolygon(city, block.polygon))
      .map((block) => block.id);
    assert.ok(
      matchingBlockIds.includes(blockId),
      `${id} should sit in ${blockId}; matched ${matchingBlockIds.join(", ") || "none"}`
    );
  });
});

test("runtime exposes tested prefecture city controls and terrain-attached labels", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(html, /id="cityPanel"/);
  assert.match(html, /id="cityButtons"/);
  assert.match(runtime, /Core\.CHINA_TERRAIN_CITIES/);
  assert.match(runtime, /createTerrainCities\(\)/);
  assert.match(runtime, /createCityLabels\(\)/);
  assert.match(runtime, /function updateCityLabels\(cameraInteractionActive = false\)/);
  assert.match(runtime, /scheduleCityLabelUpdate\(\)/);
  assert.match(runtime, /const TERRAIN_TILE_CITY_LABEL_PADDING_DEGREES = 0\.35/);
  assert.match(runtime, /function terrainTileLocalCities\(tile\)/);
  assert.match(runtime, /function isCityInsideTerrainTileFocus\(city, tile\)/);
  assert.match(runtime, /container\.dataset\.selectedTerrainTileCityIds/);
  assert.match(runtime, /label\.classList\.toggle\("is-local-terrain-city"/);
  assert.match(runtime, /Core\.planCityObservationVisibility\(Core\.CHINA_TERRAIN_CITIES/);
  assert.match(runtime, /data-city-id/);
  assert.match(runtime, /terrain-city-label/);
  assert.match(runtime, /"terrain-city": "cities"/);
  assert.match(runtime, /"terrain-city-stem": "cities"/);
  assert.match(runtime, /"terrain-city-label": "cities"/);
  assert.match(runtime, /cityButtons\.hidden = layerVisibility\.cities === false/);
  assert.match(css, /\.city-panel/);
  assert.match(css, /\.terrain-city-label/);
});

test("runtime filters prefecture city labels by viewing distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const shouldProjectBlock = runtime.match(/function shouldProjectCityLabel\(city, group, markerState, cityLabelDetail\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /const CITY_LABEL_NEAR_DISTANCE = 3\.35/);
  assert.match(runtime, /const CITY_LABEL_MID_DISTANCE = 4\.55/);
  assert.match(runtime, /function cityLabelDetailLevel\(viewDistance\)/);
  assert.match(runtime, /function cityLabelImportance\(city\)/);
  assert.match(runtime, /function shouldShowCityLabelForDistance\(city, detailLevel, isLocalTerrainCity\)/);
  assert.match(runtime, /const cityLabelDetail = cityLabelDetailLevel\(camera\.position\.z\)/);
  assert.match(runtime, /container\.dataset\.cityLabelDetailLevel/);
  assert.match(runtime, /container\.dataset\.cityLabelViewDistance/);
  assert.ok(shouldProjectBlock, "missing city label projection gate");
  assert.match(shouldProjectBlock[0], /shouldShowCityLabelForDistance\(city, cityLabelDetail, isLocalTerrainCity\)/);
});

test("runtime shows prefecture city map positions by observation distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /function shouldShowCityForObservationDistance\(city, detailLevel, isLocalTerrainCity, isSelectedTerrainCity = false\)/);
  assert.match(runtime, /function updateTerrainCityMarkerVisibility\(detailLevel, selectedTerrainTile\)/);
  assert.match(runtime, /Core\.planCityObservationVisibility\(Core\.CHINA_TERRAIN_CITIES/);
  assert.match(runtime, /selectedTerrainTileBounds: selectedTerrainTile && selectedTerrainTile\.bounds/);
  assert.match(runtime, /container\.dataset\.cityMarkerHiddenByTileFocusCount/);
  assert.match(runtime, /const isSelectedTerrainCity = Boolean\(plannedVisibility\.isSelectedTerrainCity\)/);
  assert.match(runtime, /group\.userData\.distanceVisible = visible/);
  assert.match(runtime, /container\.dataset\.cityMarkerDetailLevel = detailLevel/);
  assert.match(runtime, /container\.dataset\.cityMarkerVisibleCount = String\(visibleCount\)/);
  assert.match(runtime, /container\.dataset\.cityMarkerVisibleIds = visibleIds\.join\(","\)/);
  assert.match(runtime, /const cityMarkerVisibility = cachedTerrainCityMarkerVisibility\(cityLabelDetail, selectedTerrainTile\)/);
  assert.match(runtime, /const markerState = cityMarkerVisibility\.get\(cityId\)/);
  assert.match(script, /cityMarkerDetailLevel/);
  assert.match(script, /cityMarkerVisibleCount/);
  assert.match(script, /cityMarkerVisibleIds\.includes\('hanzhong'\)/);
  assert.match(script, /cityMarkerVisibleIds\.includes\('ankang'\)/);
});

test("city observation visibility tiers reveal prefecture positions as the view moves closer", () => {
  const qinlingTile = {
    bounds: {
      minLat: 32.45,
      maxLat: 33.35,
      minLng: 106.55,
      maxLng: 109.25,
    },
  };
  const majorCityIds = ["chengdu", "shanghai", "guangzhou", "jinan", "taiyuan"];

  const near = planCityObservationVisibility(CHINA_TERRAIN_CITIES, {
    detailLevel: "near",
    selectedTerrainTileBounds: qinlingTile.bounds,
    majorCityIds,
    tilePaddingDegrees: 0.35,
  });
  assert.deepEqual(near.visibleIds.sort(), ["ankang", "hanzhong"]);
  assert.equal(near.hiddenByTileFocusCount, CHINA_TERRAIN_CITIES.length - 2);

  const mid = planCityObservationVisibility(CHINA_TERRAIN_CITIES, {
    detailLevel: "mid",
    selectedTerrainTileBounds: qinlingTile.bounds,
    majorCityIds,
    tilePaddingDegrees: 0.35,
  });
  assert.ok(mid.visibleIds.includes("hanzhong"));
  assert.ok(mid.visibleIds.includes("chengdu"));
  assert.ok(mid.visibleIds.includes("jinan"));
  assert.ok(mid.visibleIds.length > near.visibleIds.length);
  assert.equal(mid.hiddenByTileFocusCount, 0);

  const far = planCityObservationVisibility(CHINA_TERRAIN_CITIES, {
    detailLevel: "far",
    selectedTerrainTileBounds: qinlingTile.bounds,
    majorCityIds,
    tilePaddingDegrees: 0.35,
  });
  assert.deepEqual(far.visibleIds.sort(), ["ankang", "hanzhong", ...majorCityIds].sort());
  assert.ok(far.visibleIds.length < mid.visibleIds.length);
});

test("layer legend buttons stay clickable inside the scrollable terrain panel", () => {
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(css, /\.legend-item\s*\{[^}]*pointer-events:\s*auto/s);
  assert.match(css, /\.legend-item\s*\{[^}]*z-index:\s*1/s);
});

test("runtime exposes Natural Earth river source and counts in DOM-visible state", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /syncWaterSystemDebugState/);
  assert.match(runtime, /container\.dataset\.waterSource/);
  assert.match(runtime, /container\.dataset\.waterSystemCount/);
  assert.match(runtime, /container\.dataset\.waterKeyTributaryCount/);
  assert.match(runtime, /container\.dataset\.waterMinorTributaryCount/);
  assert.match(runtime, /waterSystemSummary\(\)/);
  assert.match(runtime, /waterSummary\.count/);
  assert.match(runtime, /waterSummary\.source/);
  assert.match(runtime, /provinceBoundaryRingCount/);
  assert.match(runtime, /prefectureBoundaryRingCount/);
});

test("runtime layer summary reports visible rivers and lakes with optional coast references", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /默认显示主流/);
  assert.match(runtime, /湖泊参考/);
  assert.match(runtime, /支流参考/);
  assert.match(runtime, /海岸\/岛屿/);
  assert.match(runtime, /waterSummary\.main/);
  assert.match(runtime, /waterSummary\.keyTributary/);
  assert.match(runtime, /waterSummary\.minorTributary/);
  assert.match(runtime, /waterReferenceSummary\(\)/);
  assert.match(runtime, /waterReferenceSummary\.lakes/);
  assert.match(runtime, /waterReferenceSummary\.coastlines/);
  assert.doesNotMatch(runtime, /waterSummary\.count\} 段水系曲线/);
});

test("runtime clips the China terrain mesh to real ADM1 geographic coverage", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /terrainRegionMask/);
  assert.match(runtime, /TERRAIN_LNG_STEPS = 620/);
  assert.match(runtime, /TERRAIN_LAT_STEPS = 360/);
  assert.match(runtime, /loadTerrainRegionMask\(\)/);
  assert.match(runtime, /await loadTerrainRegionMask\(\)/);
  assert.match(runtime, /isPointInsideGeoBoundaryRings/);
  assert.match(runtime, /terrainMaskSource/);
  assert.match(runtime, /terrainMaskSkippedCellCount/);
  assert.match(runtime, /terrainMaskRenderedCellCount/);
  assert.match(runtime, /terrainWireOpacity = 0/);
  assert.match(runtime, /terrainHillshade/);
});

test("runtime prefers the denser China DEM grid before falling back to the sample grid", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const packageJson = fs.readFileSync(path.join(__dirname, "package.json"), "utf8");

  assert.match(runtime, /china-srtm90m-full\.json/);
  assert.match(runtime, /china-srtm90m-medium\.json/);
  assert.match(runtime, /china-srtm90m-sample\.json/);
  assert.match(runtime, /DEM_SOURCE_CANDIDATES/);
  assert.ok(
    runtime.indexOf("china-srtm90m-full.json") < runtime.indexOf("china-srtm90m-medium.json"),
    "full DEM source should be tried before the medium-density grid"
  );
  assert.ok(
    runtime.indexOf("china-srtm90m-medium.json") < runtime.indexOf("china-srtm90m-sample.json"),
    "medium DEM source should be tried before the low-resolution sample"
  );
  assert.match(packageJson, /terrain:dem/);
  assert.match(packageJson, /generate-china-dem-grid\.js/);
  assert.match(runtime, /container\.dataset\.terrainSource/);
  assert.match(runtime, /container\.dataset\.terrainSourcePath/);
  assert.match(runtime, /SRTM90m DEM 中密度网格/);
  assert.doesNotMatch(runtime, /SRTM90m DEM 样本网格/);
});

test("runtime loads local DEM tiles for close-up terrain inspection", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const manifest = fs.readFileSync(path.join(__dirname, "data", "manifest.json"), "utf8");

  assert.match(runtime, /LOCAL_DEM_TILE_SOURCE = "data\/terrain\/china-local-dem-tiles\.json"/);
  assert.match(runtime, /LOCAL_DEM_TILE_INDEX_SOURCE = "data\/terrain\/china-local-dem-tile-index\.json"/);
  assert.match(runtime, /let terrainDetailTiles = null/);
  assert.match(runtime, /await loadTerrainDetailTiles\(\)/);
  assert.match(runtime, /function loadTerrainDetailTiles\(\)/);
  assert.match(runtime, /function ensureTerrainDetailTileLoaded\(tileId\)/);
  assert.match(runtime, /const TERRAIN_TILE_INSPECTION_ZOOM = 2\.58/);
  assert.match(runtime, /const terrainDetailTileSurfaceGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /const terrainDetailTileContourGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /const terrainDetailTileBoundaryGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /const terrainDetailTileWaterGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /const terrainDetailTileTraceGuideGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /function createTerrainDetailTileSurface\(tile\)/);
  assert.match(runtime, /function createTerrainDetailTileContours\(tile\)/);
  assert.match(runtime, /function createTerrainDetailTileBoundaries\(tile\)/);
  assert.match(runtime, /function createTerrainDetailTileWaterReferences\(tile\)/);
  assert.match(runtime, /function createTerrainDetailTileTraceGuides\(tile\)/);
  assert.match(runtime, /Core\.buildTerrainTileTraceGuides\(tile\)/);
  assert.match(runtime, /function isRecommendedTerrainTileTraceGuide\(guide, analysis\)/);
  assert.match(runtime, /function resetTerrainDetailTileWaterState\(\)/);
  assert.match(runtime, /function clipBoundarySegmentToTerrainTileBounds\(start, end, bounds\)/);
  assert.match(runtime, /function refreshSelectedTerrainTileSurface\(tile\)/);
  assert.match(runtime, /terrainDetailTileContourGroup\.userData\.segmentCount/);
  assert.match(runtime, /terrainDetailTileBoundaryGroup\.userData\.segmentCount/);
  assert.match(runtime, /terrainDetailTileWaterGroup\.userData\.segmentCount/);
  assert.match(runtime, /terrainDetailTileWaterGroup\.userData\.riverCount/);
  assert.match(runtime, /terrainDetailTileWaterGroup\.userData\.lakeCount/);
  assert.match(runtime, /terrainDetailTileTraceGuideGroup\.userData\.guideCount/);
  assert.match(runtime, /terrainDetailTileTraceGuideGroup\.userData\.guideKinds/);
  assert.match(runtime, /terrainDetailTileTraceGuideGroup\.userData\.recommendedGuideCount/);
  assert.match(runtime, /terrainDetailTileTraceGuideGroup\.userData\.recommendedGuideKinds/);
  assert.match(runtime, /line\.userData\.traceRecommended = recommended/);
  assert.match(runtime, /terrainDetailTileSurfaceGroup\.userData\.tileId/);
  assert.match(runtime, /terrainDetailTileSurfaceVisible/);
  assert.match(runtime, /terrainDetailTileSurfaceVertexCount/);
  assert.match(runtime, /terrainDetailTileContourSegmentCount/);
  assert.match(runtime, /terrainDetailTileBoundarySegmentCount/);
  assert.match(runtime, /terrainDetailTileWaterSegmentCount/);
  assert.match(runtime, /terrainDetailTileWaterRiverCount/);
  assert.match(runtime, /terrainDetailTileWaterLakeCount/);
  assert.match(runtime, /terrainDetailTileTraceGuideCount/);
  assert.match(runtime, /terrainDetailTileTraceGuideKinds/);
  assert.match(runtime, /terrainDetailTileRecommendedTraceGuideCount/);
  assert.match(runtime, /terrainDetailTileRecommendedTraceGuideKinds/);
  assert.match(runtime, /function scheduleTerrainTileReferenceLayers\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileWaterReferences\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileTraceGuides\(tile\)/);
  assert.match(runtime, /terrainDetailTileReferenceLayersPending/);
  assert.match(runtime, /tile\.sourcePath/);
  assert.match(runtime, /terrainDetailTileLoadPromises/);
  assert.match(runtime, /zoom: Core\.normalizeZoom\(TERRAIN_TILE_INSPECTION_ZOOM\)/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileMode/);
  assert.match(runtime, /container\.dataset\.terrainDetailLoadedTileCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileSource/);
  assert.match(runtime, /sampleChinaTerrainElevation\(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.match(runtime, /sampleChinaTerrainMeters\(selectedCity\.lat, selectedCity\.lng, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.match(manifest, /china-local-dem-tiles/);
});

test("runtime exposes local DEM tiles as focusable terrain detail regions", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(html, /id="terrainTilePanel"/);
  assert.match(html, /id="terrainTileButtons"/);
  assert.match(html, /id="terrainTileTraceSummary"/);
  assert.match(runtime, /function renderTerrainTileButtons\(\)/);
  assert.match(runtime, /const terrainTileTraceSummary = document\.querySelector\("#terrainTileTraceSummary"\)/);
  assert.match(runtime, /function sortTerrainDetailTileItems\(tiles\)/);
  assert.match(runtime, /function terrainTileResolutionScore\(tile\)/);
  assert.match(runtime, /function terrainTileSourceBadge\(tile\)/);
  assert.match(runtime, /function renderTerrainTileTraceSummary\(tile\)/);
  assert.match(runtime, /function hideTerrainTileTraceSummary\(\)/);
  assert.match(runtime, /Core\.summarizeTerrainTileAnalysis\(tile\)/);
  assert.match(runtime, /terrainTileAnalysisReliefClass/);
  assert.match(runtime, /terrainTileAnalysisTraceRecommendation/);
  assert.match(runtime, /terrainTileAnalysisMaxCellReliefMeters/);
  assert.match(runtime, /terrainTileAnalysisSteepCellRatio/);
  assert.match(runtime, /terrainTileAnalysisTraceWorkload/);
  assert.match(runtime, /function terrainTileTraceWorkloadLabel\(workload\)/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceSummaryText/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceSummaryWaterSegments/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceSummaryCityCount/);
  assert.match(runtime, /function focusOnTerrainTile\(tileId\)/);
  assert.match(runtime, /data-terrain-tile-id/);
  assert.match(runtime, /data-terrain-tile-dataset/);
  assert.match(runtime, /container\.dataset\.selectedTerrainTileId/);
  assert.match(runtime, /container\.dataset\.terrainMapzenTileCount/);
  assert.match(runtime, /container\.dataset\.terrainTilePrimaryDataset/);
  assert.match(runtime, /updateActiveTerrainTileButtons\(selectedTerrainTileId\)/);
  assert.match(runtime, /terrainTileSourceBadge\(tile\)/);
  assert.match(runtime, /terrainTileSourceBadge\(selectedTerrainTile\)/);
  assert.match(runtime, /sortTerrainDetailTileItems\(getTerrainDetailTileItems\(\)\)/);
  assert.match(runtime, /selectedMetricLabel\.textContent = "高清地形"/);
  assert.match(css, /\.terrain-tile-panel/);
  assert.match(css, /\.terrain-tile-button/);
  assert.match(css, /\.terrain-tile-trace-summary/);
});

test("runtime exposes import-ready real terrain source catalog controls", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainSourcePanel"/);
  assert.match(html, /id="terrainSourceButtons"/);
  assert.match(runtime, /TERRAIN_SOURCE_CATALOG_SOURCE = "data\/terrain\/china-terrain-source-catalog\.json"/);
  assert.match(runtime, /let terrainSourceCatalog = null/);
  assert.match(runtime, /await loadTerrainSourceCatalog\(\)/);
  assert.match(runtime, /function loadTerrainSourceCatalog\(\)/);
  assert.match(runtime, /function renderTerrainSourceButtons\(\)/);
  assert.match(runtime, /container\.dataset\.terrainSourceCatalogCount/);
  assert.match(runtime, /container\.dataset\.terrainSourceCatalogPrimary/);
  assert.match(runtime, /data-terrain-source-id/);
  assert.match(css, /\.terrain-source-panel/);
  assert.match(css, /\.terrain-source-button/);
  assert.match(script, /terrainSourceCatalogCount/);
  assert.match(script, /mapzen-terrain-tiles-aws/);
});

test("package scripts include the Mapzen terrain tile importer", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const readme = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");

  assert.equal(packageJson.scripts["terrain:mapzen:tile"], "node scripts/import-mapzen-terrain-tile.js");
  assert.match(packageJson.scripts.test, /scripts\/import-mapzen-terrain-tile\.test\.js/);
  assert.match(packageJson.scripts.check, /scripts\/import-mapzen-terrain-tile\.js/);
  assert.match(readme, /terrain:mapzen:tile/);
  assert.match(readme, /import-mapzen-terrain-tile\.js/);
});

test("runtime can start a manual tracing draft scoped to the selected DEM tile", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="startTerrainTileTraceBtn"/);
  assert.match(runtime, /const startTerrainTileTraceBtn = document\.querySelector\("#startTerrainTileTraceBtn"\)/);
  assert.match(runtime, /function startTraceInSelectedTerrainTile\(\)/);
  assert.match(runtime, /sourceTileId: tile\.id/);
  assert.match(runtime, /sourceTileBounds: \{ \.\.\.tile\.bounds \}/);
  assert.match(runtime, /function isPointInsideManualTraceTileBounds\(point\)/);
  assert.match(runtime, /container\.dataset\.manualTraceSourceTileId/);
  assert.match(runtime, /startTerrainTileTraceBtn\.hidden = !selectedTerrainTile/);
  assert.match(script, /\[data-workflow-id="trace"\]/);
  assert.match(script, /terrainWorkflowTraceActionResult/);
  assert.match(script, /manualTraceSourceTileId/);
  assert.match(script, /manualTraceSegmentCount/);
  assert.match(script, /manualTraceReliefMeters/);
  assert.match(script, /manualTraceCoverageText/);
  assert.match(script, /manualTraceClosed/);
  assert.match(script, /closeManualTracePointDisabled/);
  assert.match(script, /manualTracePolygonMaskSuggestionCount/);
  assert.match(script, /Expected manual trace quality state/);
});

test("runtime can seed manual terrain tracing from automatic DEM ridge and valley guides", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="seedRidgeTraceBtn"/);
  assert.match(html, /id="seedValleyTraceBtn"/);
  assert.match(html, /id="generateRecommendedTileSuggestionsBtn"/);
  assert.match(runtime, /const seedRidgeTraceBtn = document\.querySelector\("#seedRidgeTraceBtn"\)/);
  assert.match(runtime, /const seedValleyTraceBtn = document\.querySelector\("#seedValleyTraceBtn"\)/);
  assert.match(runtime, /const generateRecommendedTileSuggestionsBtn = document\.querySelector\("#generateRecommendedTileSuggestionsBtn"\)/);
  assert.match(runtime, /function seedManualTraceFromTerrainTileGuide\(kind\)/);
  assert.match(runtime, /function generateRecommendedTerrainTileSuggestions\(\)/);
  assert.match(runtime, /function recommendedTerrainTileTraceGuides\(tile\)/);
  assert.match(runtime, /Core\.buildTerrainTileTraceGuides\(tile\)/);
  assert.match(runtime, /Core\.buildTerrainTracePatchSuggestions\(guide, \{ includeLineBand: true \}\)/);
  assert.match(runtime, /\.kind === kind/);
  assert.match(runtime, /points\.reduce\(\s*\(draft, point\) => Core\.addManualTerrainTracePoint\(draft, point\)/);
  assert.match(runtime, /sourceTileId: tile\.id/);
  assert.match(runtime, /sourceTileBounds: \{ \.\.\.tile\.bounds \}/);
  assert.match(runtime, /seedRidgeTraceBtn\.addEventListener\("click", \(\) => seedManualTraceFromTerrainTileGuide\("ridge"\)\)/);
  assert.match(runtime, /seedValleyTraceBtn\.addEventListener\("click", \(\) => seedManualTraceFromTerrainTileGuide\("valley"\)\)/);
  assert.match(runtime, /generateRecommendedTileSuggestionsBtn\.addEventListener\("click", \(\) => generateRecommendedTerrainTileSuggestions\(\)\)/);
  assert.match(runtime, /seedRidgeTraceBtn\.hidden = !selectedTerrainTile/);
  assert.match(runtime, /seedValleyTraceBtn\.hidden = !selectedTerrainTile/);
  assert.match(runtime, /generateRecommendedTileSuggestionsBtn\.hidden = !selectedTerrainTile/);
  assert.match(runtime, /container\.dataset\.terrainTileRecommendedSuggestionCount/);
  assert.match(runtime, /const sourceTile = manualTraceDraft\.sourceTileId/);
  assert.match(runtime, /selectedTerrainTileId = sourceTile \? sourceTile\.id : null/);
  assert.match(runtime, /refreshSelectedTerrainTileSurface\(sourceTile\)/);
  assert.match(runtime, /const selectedSuggestionPatchSourceTile = terrainTileForSuggestionSource\(selectedSuggestionPatch\.sourceTileId\)/);
  assert.match(runtime, /updateStartTerrainTileTraceButton\(selectedSuggestionPatchSourceTile\)/);
  assert.match(runtime, /const selectedSuggestionGroupSourceTile = terrainTileForSuggestionSource\(selectedSuggestionGroup\.sourceTileId\)/);
  assert.match(runtime, /updateStartTerrainTileTraceButton\(selectedSuggestionGroupSourceTile\)/);
  assert.match(script, /seedRidgeTraceBtn/);
  assert.match(script, /generateRecommendedTileSuggestionsBtn/);
  assert.match(script, /terrainTileRecommendedSuggestionCount/);
  assert.match(script, /manualTraceSeedKind/);
  assert.match(script, /Expected recommended tile suggestions/);
  assert.match(script, /Expected automatic ridge guide to seed manual trace draft/);
});

test("runtime clips terrain block overlays to the ADM1 terrain mask", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /BLOCK_LNG_STEPS/);
  assert.match(runtime, /BLOCK_LAT_STEPS/);
  assert.match(runtime, /createTerrainBlockSurfaceMesh/);
  assert.match(runtime, /Core\.isPointInsideGeoBoundaryRings\(cellCenter, terrainRegionMask\)/);
  assert.match(runtime, /blocks\.find\(\(item\) => Core\.isPointInsidePolygon\(cellCenter, item\.polygon\)\)/);
  assert.match(runtime, /terrainBlockRenderedCellCount/);
  assert.match(runtime, /terrainBlockSkippedCellCount/);
  assert.doesNotMatch(runtime, /indices\.push\(0, i, next\)/);
});

test("runtime hides hand drawn boundary fallback when ADM1 boundaries are available", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const fallbackBoundaryGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /worldGroup\.add\(fallbackBoundaryGroup\)/);
  assert.match(runtime, /fallbackBoundaryGroup\.userData\.source = "hand-drawn-fallback"/);
  assert.match(runtime, /fallbackBoundaryGroup\.visible = !terrainRegionMask/);
  assert.match(runtime, /worldGroup\.userData\.fallbackBoundaryVisible = fallbackBoundaryGroup\.visible/);
  assert.doesNotMatch(runtime, /worldGroup\.add\(boundary\);\s*\n\s*Core\.CHINA_PROVINCE_BOUNDARY_GUIDES/);
});

test("runtime maps national, province, and prefecture boundaries to separate layers", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const core = fs.readFileSync(path.join(__dirname, "world-map-core.js"), "utf8");

  assert.match(runtime, /"country-boundary": "borders"/);
  assert.match(runtime, /"province-boundary-guide": "provinceBorders"/);
  assert.match(runtime, /"province-boundary-real": "provinceBorders"/);
  assert.match(runtime, /"prefecture-boundary-real": "cityBoundaries"/);
  assert.match(runtime, /"terrain-detail-tile-province-boundary": "provinceBorders"/);
  assert.match(runtime, /"terrain-detail-tile-prefecture-boundary": "cityBoundaries"/);
  assert.match(runtime, /const prefectureBoundaryGroup = new THREE\.Group\(\)/);
  assert.match(runtime, /worldGroup\.add\(prefectureBoundaryGroup\)/);
  assert.match(core, /id: "cityBoundaries"/);
});

test("runtime renders province and prefecture boundary sources with separate colors", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /PROVINCE_BOUNDARY_SOURCE/);
  assert.match(runtime, /PREFECTURE_BOUNDARY_SOURCE/);
  assert.match(runtime, /data\/raw\/geoboundaries-chn-adm1-simplified\.geojson/);
  assert.match(runtime, /data\/raw\/cn-atlas-prefectures\.geojson/);
  assert.match(runtime, /PROVINCE_BOUNDARY_COLOR = new THREE\.Color\("#7dd3fc"\)/);
  assert.match(runtime, /PREFECTURE_BOUNDARY_COLOR = new THREE\.Color\("#f4d28a"\)/);
  assert.match(runtime, /renderMaxPoints: 72/);
  assert.match(runtime, /simplifyBoundaryRenderPoints/);
  assert.match(runtime, /line\.userData\.renderPointCount = renderPoints\.length/);
  assert.match(runtime, /worldGroup\.userData\.provinceBoundarySource = source\.id/);
  assert.match(runtime, /worldGroup\.userData\.prefectureBoundarySource = source\.id/);
  assert.match(runtime, /container\.dataset\.provinceBoundarySource/);
  assert.match(runtime, /container\.dataset\.prefectureBoundarySource/);
  assert.match(runtime, /container\.dataset\.boundarySource/);
  assert.match(runtime, /container\.dataset\.boundaryRingCount/);
  assert.match(runtime, /container\.dataset\.boundaryFeatureCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileProvinceBoundarySegmentCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailTilePrefectureBoundarySegmentCount/);
});

test("runtime opens province and prefecture boundaries when inspecting a DEM tile", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /function focusOnTerrainTile\(tileId\)[\s\S]*updateSelectedSuggestionBundleDebug\(\);\s*\n\s*layerVisibility = \{\s*\n\s*\.\.\.layerVisibility,\s*\n\s*provinceBorders: true,\s*\n\s*cityBoundaries: true,/);
});

test("runtime keeps side views visible and uses one compressed terrain layer control", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /Core\.getGroupedRenderableMapLayers/);
  assert.doesNotMatch(runtime, /EDGE_DECLUTTERED_LAYERS/);
  assert.doesNotMatch(runtime, /updateTerrainViewDeclutter/);
  assert.doesNotMatch(runtime, /edgeDeclutterActive/);
});

test("runtime composes terrain block regions into one attached terrain surface", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /function createTerrainBlockSurfaceMesh/);
  assert.match(runtime, /worldGroup\.userData\.terrainBlockMeshCount = 1/);
  assert.match(runtime, /mesh\.userData\.blockIds = blockIds/);
  assert.match(runtime, /side: THREE\.FrontSide/);
  assert.doesNotMatch(runtime, /Core\.FIVE_TERRAIN_BLOCKS\.forEach\(\(block\) => \{\s*const mesh = createTerrainBlockMesh\(block\)/);
});

test("runtime adds terrain block names as distance-aware map labels", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const terrainBlockLabelElements = new Map\(\)/);
  assert.match(runtime, /function createTerrainBlockLabels\(\)/);
  assert.match(runtime, /Core\.FIVE_TERRAIN_BLOCKS\.forEach\(\(block\) =>/);
  assert.match(runtime, /label\.className = "terrain-block-label"/);
  assert.match(runtime, /label\.dataset\.terrainBlockId = block\.id/);
  assert.match(runtime, /label\.dataset\.terrainBlockTier = String\(block\.tier \|\| 3\)/);
  assert.match(runtime, /label\.dataset\.role = "terrain-block-label"/);
  assert.match(runtime, /label\.textContent = block\.name/);
  assert.match(runtime, /function terrainBlockLabelDetailLevel\(viewDistance\)/);
  assert.match(runtime, /function shouldShowTerrainBlockLabel\(block, detailLevel\)/);
  assert.match(runtime, /function terrainBlockLabelProjectionCameraKey\(detailLevel\)/);
  assert.match(runtime, /function updateTerrainBlockLabels\(cameraInteractionActive = false\)/);
  assert.match(runtime, /terrainBlockLabelElements\.forEach\(\(label, blockId\) =>/);
  assert.match(runtime, /layerVisibility\.blocks !== false/);
  assert.match(runtime, /terrainBlockLabelProjectionPosition\.project\(camera\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelCount = String\(Core\.FIVE_TERRAIN_BLOCKS\.length\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelVisibleCount = String\(visibleCount\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelVisibleIds = visibleIds\.join\(","\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelVisibleNames = visibleNames\.join\(","\)/);
  assert.match(runtime, /createTerrainBlockLabels\(\)/);
  assert.match(runtime, /updateTerrainBlockLabels\(cameraInteractionActive\)/);
  assert.match(runtime, /"terrain-block-label": "blocks"/);
  assert.match(css, /\.terrain-block-label/);
  assert.match(script, /terrainBlockLabelCount/);
  assert.match(script, /terrainBlockLabelVisibleCount/);
  assert.match(script, /terrainBlockLabelVisibleNames/);
  assert.match(script, /Expected terrain block labels on the map/);
});

test("runtime keeps terrain block labels readable with priority and collision gating", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const TERRAIN_BLOCK_LABEL_LIMITS = Object\.freeze\(\{/);
  assert.match(runtime, /function terrainBlockLabelMaxVisibleCount\(detailLevel\)/);
  assert.match(runtime, /function terrainBlockLabelPriority\(block\)/);
  assert.match(runtime, /function terrainBlockLabelBox\(entry\)/);
  assert.match(runtime, /function terrainBlockLabelBoxOverlaps\(box, placedLabelBoxes\)/);
  assert.match(runtime, /const placedLabelBoxes = \[\]/);
  assert.match(runtime, /candidates\.sort\(\(a, b\) => b\.priority - a\.priority\)/);
  assert.match(runtime, /if \(acceptedCount >= maxVisibleCount\)/);
  assert.match(runtime, /hiddenReason: "max-count"/);
  assert.match(runtime, /terrainBlockLabelBoxOverlaps\(box, placedLabelBoxes\)/);
  assert.match(runtime, /hiddenReason: "collision"/);
  assert.match(runtime, /placedLabelBoxes\.push\(box\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelMaxVisibleCount = String\(state \? state\.maxVisibleCount \|\| 0 : 0\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelHiddenCollisionCount = String\(collisionHiddenCount\)/);
  assert.match(runtime, /container\.dataset\.terrainBlockLabelHiddenMaxCount = String\(maxCountHiddenCount\)/);
  assert.match(script, /terrainBlockLabelMaxVisibleCount/);
  assert.match(script, /terrainBlockLabelHiddenCollisionCount/);
  assert.match(script, /terrainBlockLabelHiddenMaxCount/);
  assert.match(script, /Expected terrain block label readability gating/);
});

test("runtime mixes DEM relief into the terrain block surface colors", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const BLOCK_LNG_STEPS = 248/);
  assert.match(runtime, /const BLOCK_LAT_STEPS = 144/);
  assert.match(runtime, /const TERRAIN_BLOCK_RELIEF_BLEND = 0\.72/);
  assert.match(runtime, /const TERRAIN_BLOCK_RELIEF_CONTRAST = 1\.24/);
  assert.match(runtime, /const elevation = terrainElevation\(cellCenter\.lat, cellCenter\.lng\)/);
  assert.match(runtime, /terrainColor\(elevation, terrainHillshade\(lat, lng\)\)/);
  assert.match(runtime, /terrainBlockSurfaceColor\(block, elevation, cellCenter\.lat, cellCenter\.lng\)/);
  assert.match(runtime, /function terrainBlockSurfaceColor\(block, elevation, lat, lng\)/);
  assert.match(runtime, /terrainToneTextureColor\(block\.tone, elevation, lat, lng\)/);
  assert.match(runtime, /terrainTextureNoise\(lat, lng\)/);
  assert.doesNotMatch(runtime, /const color = BLOCK_COLORS\[block\.tone\] \|\| BLOCK_COLORS\.plain;\s*\[/);
});

test("runtime shows elevation profile metrics for selected trace guides", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /buildTerrainTraceElevationProfile\(selectedTrace, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.match(runtime, /renderTraceProfile\(profile\)/);
  assert.match(runtime, /terrainTraceProfileMarkerGroup/);
  assert.match(runtime, /renderTraceProfileMarkers\(selectedTrace, profile\)/);
  assert.match(runtime, /function renderTraceProfileMarkers\(trace, profile\)/);
  assert.match(runtime, /updateTraceProfileMarkerDebug\(\)/);
  assert.match(runtime, /worldGroup\.userData\.terrainTraceProfileMarkerCount/);
  assert.match(runtime, /worldGroup\.userData\.terrainTraceProfileMarkerRoles/);
  assert.match(runtime, /terrainTraceProfileMarkerVisibleCount/);
  assert.match(runtime, /container\.dataset\.traceProfileMarkerCount/);
  assert.match(runtime, /container\.dataset\.traceProfileMarkerVisibleCount/);
  assert.match(runtime, /container\.dataset\.traceProfileMarkerRoles/);
  assert.match(runtime, /ChinaTerrainAtlasDebug/);
  assert.match(runtime, /getWorldUserData/);
  assert.match(runtime, /terrain-trace-profile-marker-high/);
  assert.match(runtime, /terrain-trace-profile-marker-low/);
  assert.match(runtime, /clearTraceProfileMarkers\(\)/);
  assert.match(runtime, /function renderTraceProfile\(profile\)/);
  assert.match(runtime, /buildTerrainTraceProfileChart\(profile/);
  assert.match(runtime, /trace-profile-line/);
  assert.match(runtime, /hideTraceProfile\(\)/);
  assert.match(runtime, /selectedMetricLabel\.textContent = "高程剖面"/);
  assert.match(runtime, /起伏/);
  assert.match(runtime, /均值/);
  assert.match(runtime, /formatMeters/);
});

test("runtime supports click-to-add manual terrain trace drafts", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /manualTraceBtn/);
  assert.match(runtime, /generateManualTraceBtn/);
  assert.match(runtime, /manualTraceDraft/);
  assert.match(runtime, /manualTraceEditMode/);
  assert.match(runtime, /raycastTerrainPoint/);
  assert.match(runtime, /Core\.vector3ToLatLng/);
  assert.match(runtime, /Core\.addManualTerrainTracePoint/);
  assert.match(runtime, /function isPointInsideManualTraceTileBounds\(point\)/);
  assert.match(runtime, /!isPointInsideManualTraceTileBounds\(point\)/);
  assert.match(runtime, /Core\.undoManualTerrainTracePoint/);
  assert.match(runtime, /Core\.reverseManualTerrainTraceDraft/);
  assert.match(runtime, /Core\.simplifyManualTerrainTraceDraft/);
  assert.match(runtime, /Core\.smoothManualTerrainTraceDraft/);
  assert.match(runtime, /Core\.clearManualTerrainTraceDraft/);
  assert.match(runtime, /const reverseManualTraceBtn = document\.querySelector\("#reverseManualTraceBtn"\)/);
  assert.match(runtime, /const closeManualTraceBtn = document\.querySelector\("#closeManualTraceBtn"\)/);
  assert.match(runtime, /const simplifyManualTraceBtn = document\.querySelector\("#simplifyManualTraceBtn"\)/);
  assert.match(runtime, /const smoothManualTraceBtn = document\.querySelector\("#smoothManualTraceBtn"\)/);
  assert.match(runtime, /const deleteManualTracePointBtn = document\.querySelector\("#deleteManualTracePointBtn"\)/);
  assert.match(runtime, /reverseManualTraceBtn\.addEventListener\("click"/);
  assert.match(runtime, /closeManualTraceBtn\.addEventListener\("click"/);
  assert.match(runtime, /Core\.closeManualTerrainTraceDraft\(manualTraceDraft\)/);
  assert.match(runtime, /simplifyManualTraceBtn\.addEventListener\("click"/);
  assert.match(runtime, /smoothManualTraceBtn\.addEventListener\("click"/);
  assert.match(runtime, /generateManualTraceSuggestions\(\)/);
  assert.match(runtime, /Core\.buildTerrainTracePatchSuggestions\(manualTraceDraft/);
  assert.match(runtime, /includePolygonMask: true/);
  assert.match(runtime, /function manualTraceSuggestionShapeSummary\(patches\)/);
  assert.match(runtime, /manualTraceSuggestionCount/);
  assert.match(runtime, /manualTracePolygonMaskSuggestionCount/);
  assert.match(runtime, /renderManualTraceDraft\(\)/);
  assert.match(runtime, /terrain-manual-trace-point/);
  assert.match(runtime, /terrain-manual-trace-line/);
  assert.match(runtime, /container\.dataset\.manualTracePointCount/);
  assert.match(runtime, /container\.dataset\.manualTraceSuggestionCount/);
  assert.match(runtime, /container\.dataset\.manualTracePolygonMaskSuggestionCount/);
  assert.match(runtime, /container\.dataset\.manualTraceLineBandSuggestionCount/);
  assert.match(runtime, /container\.dataset\.manualTraceRadialSuggestionCount/);
  assert.match(runtime, /function manualTraceQualitySummary\(trace\)/);
  assert.match(runtime, /container\.dataset\.manualTraceSegmentCount/);
  assert.match(runtime, /container\.dataset\.manualTraceReliefMeters/);
  assert.match(runtime, /container\.dataset\.manualTraceCoverageText/);
  assert.match(runtime, /container\.dataset\.manualTraceClosed/);
  assert.match(runtime, /container\.dataset\.manualTraceSimplifiedPointCount/);
  assert.match(runtime, /container\.dataset\.manualTraceSmoothedPointCount/);
  assert.match(runtime, /manualTraceStatus\.dataset\.quality/);
  assert.match(runtime, /closeManualTraceBtn\.disabled = pointCount < 3 \|\| Boolean\(manualTraceDraft\.closed\)/);
});

test("runtime exposes DEM tile tracing aid readiness for later manual detail work", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /Core\.summarizeTerrainTileTraceAid\(tile, \{/);
  assert.match(runtime, /traceGuides: Core\.buildTerrainTileTraceGuides\(tile\)/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceAidReadiness/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceAidContourDensity/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceAidReferenceLayerCount/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceAidDetailPriority/);
  assert.match(runtime, /container\.dataset\.terrainTileTraceAidGuideKinds/);
});

test("runtime renders non-radial trace candidate patches with derived focus points", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const suggestionRenderer = runtime.match(/function createTerrainPatchSuggestions\(\) \{[\s\S]+?\n  \}/);
  const suggestionList = runtime.match(/function renderSuggestionPatchList\(group\) \{[\s\S]+?\n  \}/);
  const suggestionFocus = runtime.match(/function focusOnSuggestionPatch\(patchId\) \{[\s\S]+?\n  \}/);
  const selectedPatchBlock = runtime.match(/if \(selectedSuggestionPatch\) \{[\s\S]+?updateActiveSuggestionPatchButtons\(selectedSuggestionPatch\.id\);\s+return;\s+\}/);

  assert.ok(suggestionRenderer, "missing createTerrainPatchSuggestions function");
  assert.match(suggestionRenderer[0], /const focusPoint = terrainDetailPatchFocusPoint\(patch\)/);
  assert.match(suggestionRenderer[0], /lat: focusPoint\.lat/);
  assert.match(suggestionRenderer[0], /lng: focusPoint\.lng/);
  assert.doesNotMatch(suggestionRenderer[0], /ring\.length < 4 \|\| !patch\.center/);
  assert.ok(suggestionList, "missing renderSuggestionPatchList function");
  assert.match(runtime, /function terrainDetailPatchShapeSummary\(patch\)/);
  assert.match(suggestionList[0], /const focusPoint = terrainDetailPatchFocusPoint\(patch\)/);
  assert.match(suggestionList[0], /if \(!focusPoint\) return/);
  assert.match(suggestionList[0], /patch\.center = patch\.center \|\| focusPoint/);
  assert.match(suggestionList[0], /terrainDetailPatchShapeSummary\(patch\)/);
  assert.match(suggestionList[0], /data-suggestion-patch-shape/);
  assert.ok(suggestionFocus, "missing focusOnSuggestionPatch function");
  assert.match(suggestionFocus[0], /const focusPoint = terrainDetailPatchFocusPoint\(patch\)/);
  assert.match(suggestionFocus[0], /rotationTarget\.y = -toRadians\(focusPoint\.lng\)/);
  assert.match(suggestionFocus[0], /rotationTarget\.x = Core\.clamp\(toRadians\(focusPoint\.lat\)/);
  assert.ok(selectedPatchBlock, "missing selected suggestion patch panel block");
  assert.match(selectedPatchBlock[0], /terrainDetailPatchShapeSummary\(selectedSuggestionPatch\)/);
  assert.doesNotMatch(selectedPatchBlock[0], /半径 \$\{Number\(selectedSuggestionPatch\.radiusDegrees\)/);
});

test("runtime can select, move, and delete manual trace points for terrain detail tracing", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts/verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /let selectedManualTracePointIndex = null/);
  assert.match(runtime, /function pickManualTracePointFromClick\(event\)/);
  assert.match(runtime, /function selectManualTracePoint\(index\)/);
  assert.match(runtime, /function moveSelectedManualTracePointFromClick\(event\)/);
  assert.match(runtime, /function deleteSelectedManualTracePoint\(\)/);
  assert.match(runtime, /Core\.updateManualTerrainTracePointAt\(manualTraceDraft, selectedManualTracePointIndex, point\)/);
  assert.match(runtime, /Core\.removeManualTerrainTracePointAt\(manualTraceDraft, selectedManualTracePointIndex\)/);
  assert.match(runtime, /marker\.userData\.manualTraceSelected = isSelected/);
  assert.match(runtime, /halo\.userData\.manualTraceSelected = isSelected/);
  assert.match(runtime, /deleteManualTracePointBtn\.addEventListener\("click", \(\) => deleteSelectedManualTracePoint\(\)\)/);
  assert.match(runtime, /container\.dataset\.manualTraceSelectedPointIndex/);
  assert.match(runtime, /container\.dataset\.manualTraceMovedPointCount/);
  assert.match(runtime, /container\.dataset\.manualTraceDeletedPointCount/);
  assert.match(script, /deleteManualTracePointBtn/);
  assert.match(script, /manualTraceSelectedPointIndex/);
  assert.match(script, /manualTraceDeletedPointCount/);
});

test("runtime attaches selected DEM tile provenance to manual patch suggestions", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const suggestionBlock = runtime.match(/function generateManualTraceSuggestions\(\) \{[\s\S]+?\n  \}/);

  assert.ok(suggestionBlock, "missing generateManualTraceSuggestions function");
  assert.match(suggestionBlock[0], /sourceTileId: manualTraceDraft\.sourceTileId \|\| ""/);
  assert.match(suggestionBlock[0], /sourceTileLabel: sourceTile \? terrainTileLabel\(sourceTile\) : ""/);
  assert.match(suggestionBlock[0], /sourceTileBounds: manualTraceDraft\.sourceTileBounds \? \{ \.\.\.manualTraceDraft\.sourceTileBounds \} : null/);
  assert.match(suggestionBlock[0], /sourceTileDataset:/);
  assert.match(suggestionBlock[0], /sourceTileReliefMeters:/);
});

test("runtime preserves source DEM tile surface when focusing trace suggestions", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const suggestionGroupFocus = runtime.match(/function focusOnSuggestionGroup\(groupId\) \{[\s\S]+?\n  \}/);
  const suggestionPatchFocus = runtime.match(/function focusOnSuggestionPatch\(patchId\) \{[\s\S]+?\n  \}/);
  const suggestionPatchSelection = runtime.match(/function toggleSuggestionPatchSelection\(patchId\) \{[\s\S]+?\n  \}/);
  const suggestionGroupSelection = runtime.match(/function selectSuggestionGroupPatches\(groupId\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /function terrainTileForSuggestionSource\(sourceTileId\)/);
  assert.match(runtime, /function preserveSuggestionSourceTerrainTile\(sourceTileId\)/);
  assert.ok(suggestionGroupFocus, "missing focusOnSuggestionGroup function");
  assert.ok(suggestionPatchFocus, "missing focusOnSuggestionPatch function");
  assert.ok(suggestionPatchSelection, "missing toggleSuggestionPatchSelection function");
  assert.ok(suggestionGroupSelection, "missing selectSuggestionGroupPatches function");
  assert.match(suggestionGroupFocus[0], /preserveSuggestionSourceTerrainTile\(group\.sourceTileId\)/);
  assert.match(suggestionPatchFocus[0], /preserveSuggestionSourceTerrainTile\(patch\.sourceTileId\)/);
  assert.match(suggestionPatchSelection[0], /preserveSuggestionSourceTerrainTile\(patch\.sourceTileId\)/);
  assert.match(suggestionGroupSelection[0], /preserveSuggestionSourceTerrainTile\(group\.sourceTileId\)/);
});

test("runtime uses compact site markers so terrain remains readable", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const siteBlock = runtime.match(/function createTerrainSites\(\) \{[\s\S]+?\n  \}/);

  assert.ok(siteBlock, "missing createTerrainSites function");
  assert.match(siteBlock[0], /terrainRadius\(site\.lat, site\.lng, TERRAIN_SITE_LIFT\)/);
  assert.match(siteBlock[0], /new THREE\.SphereGeometry\(0\.018, 12, 12\)/);
  assert.match(siteBlock[0], /new THREE\.SphereGeometry\(0\.032, 12, 12\)/);
  assert.match(siteBlock[0], /opacity: 0\.82/);
  assert.match(siteBlock[0], /opacity: 0\.08/);
  assert.doesNotMatch(siteBlock[0], /terrain-site-stem/);
});

test("runtime previews DEM elevation profiles for manual terrain trace drafts", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /selectedManualTraceId/);
  assert.match(runtime, /focusOnManualTraceDraft\(\)/);
  assert.match(runtime, /buildTerrainTraceElevationProfile\(manualTraceDraft, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.match(runtime, /renderTraceProfile\(profile\)/);
  assert.match(runtime, /renderTraceProfileMarkers\(manualTraceDraft, profile\)/);
  assert.match(runtime, /container\.dataset\.manualTraceProfileVisible/);
  assert.match(runtime, /container\.dataset\.manualTraceProfileSampleCount/);
  assert.match(runtime, /updateActiveTraceButtons\(manualTraceDraft\.id\)/);
  assert.match(runtime, /manualTraceStatus\.textContent/);
  assert.match(runtime, /高程剖面/);
});

test("runtime persists manual trace drafts and generated suggestions across reloads", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /MANUAL_TRACE_STORAGE_KEY/);
  assert.match(runtime, /MANUAL_SUGGESTIONS_STORAGE_KEY/);
  assert.match(runtime, /loadStoredManualTraceDraft\(\)/);
  assert.match(runtime, /saveManualTraceDraft\(\)/);
  assert.match(runtime, /loadStoredManualTraceSuggestions\(\)/);
  assert.match(runtime, /saveManualTraceSuggestions\(manualPatches\)/);
  assert.match(runtime, /mergeManualTraceSuggestions\(storedManualSuggestions\)/);
  assert.match(runtime, /localStorage\.getItem\(MANUAL_TRACE_STORAGE_KEY\)/);
  assert.match(runtime, /localStorage\.setItem\(MANUAL_TRACE_STORAGE_KEY/);
  assert.match(runtime, /localStorage\.getItem\(MANUAL_SUGGESTIONS_STORAGE_KEY\)/);
  assert.match(runtime, /localStorage\.setItem\(MANUAL_SUGGESTIONS_STORAGE_KEY/);
  assert.match(runtime, /localStorage\.removeItem\(MANUAL_TRACE_STORAGE_KEY\)/);
  assert.match(runtime, /localStorage\.removeItem\(MANUAL_SUGGESTIONS_STORAGE_KEY\)/);
});

test("runtime loads approved patch previews without applying them by default", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /china-approved-detail-patches\.json/);
  assert.match(runtime, /terrainApprovedPatchGroup/);
  assert.match(runtime, /terrain-approved-patch-ring/);
  assert.match(runtime, /terrain-approved-patch-center/);
  assert.match(runtime, /approvedPatchVisibility/);
  assert.match(runtime, /renderApprovedPatchButtons/);
  assert.match(runtime, /let approvedPatchTerrainPreviewEnabled = false/);
  assert.match(runtime, /function activeTerrainDetailPatchLayer\(\)/);
  assert.match(runtime, /sampleChinaTerrainElevation\(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer\(\), terrainDetailTiles\)/);
  assert.doesNotMatch(runtime, /sampleChinaTerrainElevation\(lat, lng, terrainElevationGrid, terrainApprovedPatches, terrainDetailTiles\)/);
});

test("runtime can temporarily apply approved patch previews to the 3d terrain", () => {
  const root = __dirname;
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worldMap = fs.readFileSync(path.join(root, "world-map.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(root, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(`${index}\n${worldMap}`, /id="applyApprovedPatchesBtn"/);
  assert.match(runtime, /const applyApprovedPatchesBtn = document\.querySelector\("#applyApprovedPatchesBtn"\)/);
  assert.match(runtime, /function toggleApprovedPatchTerrainPreview\(\)/);
  assert.match(runtime, /approvedPatchTerrainPreviewEnabled = !approvedPatchTerrainPreviewEnabled/);
  assert.match(runtime, /const selectedPreviewPatches = approvedPatchTerrainPreviewEnabled && selectedSuggestionApprovedPreviewLayer/);
  assert.match(runtime, /const previewPatches = \[\.\.\.approvedPatches, \.\.\.selectedPreviewPatches\]/);
  assert.match(runtime, /patches: \[\.\.\.basePatches, \.\.\.previewPatches\]/);
  assert.match(runtime, /function approvedPatchTerrainPreviewAvailableCount\(\)/);
  assert.match(runtime, /refreshActiveTerrainSurfaces\(\)/);
  assert.match(runtime, /container\.dataset\.approvedPatchTerrainPreviewEnabled/);
  assert.match(runtime, /container\.dataset\.approvedPatchTerrainPreviewPatchCount/);
  assert.match(runtime, /container\.dataset\.selectedSuggestionApprovedPreviewCount/);
  assert.match(runtime, /applyApprovedPatchesBtn\.addEventListener\("click", \(\) => toggleApprovedPatchTerrainPreview\(\)\)/);
  assert.match(script, /applyApprovedPatchesBtn/);
  assert.match(script, /approvedPatchTerrainPreviewEnabled/);
});

test("runtime can inspect approved patch previews independently", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const selectedApprovedPatch = terrainApprovedPatches/);
  assert.match(runtime, /selectedMetricLabel\.textContent = "已审修正"/);
  assert.match(runtime, /未应用到地形/);
  assert.match(runtime, /预览/);
  assert.match(runtime, /function updateActiveApprovedPatchButtons\(patchId\)/);
  assert.match(runtime, /dataset\.approvedPatchFocusId === patchId/);
  assert.match(runtime, /updateActiveApprovedPatchButtons\(selectedApprovedPatch\.id\)/);
  assert.match(runtime, /renderPatchButtons\(\);\s+renderApprovedPatchButtons\(\);/);
});

test("runtime can bundle selected candidate patches from the patch console", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const selectedGroupBlock = runtime.match(/if \(selectedSuggestionGroup\) \{[\s\S]+?updateActiveSuggestionPatchButtons\(null\);\s+return;\s+\}/);

  assert.match(runtime, /let selectedSuggestionPatchIds = new Set\(\)/);
  assert.match(runtime, /data-suggestion-patch-select-id/);
  assert.match(runtime, /function toggleSuggestionPatchSelection\(patchId\)/);
  assert.match(runtime, /function selectSuggestionGroupPatches\(groupId\)/);
  assert.match(runtime, /function clearSelectedSuggestionPatchBundle\(\)/);
  assert.match(runtime, /let selectedSuggestionApprovedPreviewLayer = null/);
  assert.match(runtime, /function previewSelectedSuggestionPatchBundle\(\)/);
  assert.match(runtime, /Core\.promoteTerrainPatchSuggestions\(terrainPatchSuggestions, Array\.from\(selectedSuggestionPatchIds\)/);
  assert.match(runtime, /data-suggestion-preview-selected/);
  assert.match(runtime, /container\.dataset\.selectedSuggestionApprovedPreviewCount/);
  assert.match(runtime, /summarizeTerrainPatchSuggestionBundle\(terrainPatchSuggestions, Array\.from\(selectedSuggestionPatchIds\)\)/);
  assert.match(runtime, /container\.dataset\.suggestionBundlePatchCount/);
  assert.match(runtime, /function suggestionGroupShapeText\(group\)/);
  assert.match(runtime, /function suggestionGroupSourceText\(group\)/);
  assert.match(runtime, /function suggestionGroupReviewText\(group\)/);
  assert.match(runtime, /data-suggestion-shape-summary/);
  assert.match(runtime, /data-suggestion-source-tile-id/);
  assert.match(runtime, /data-suggestion-review-status/);
  assert.match(runtime, /suggestion-meta-stack/);
  assert.match(runtime, /suggestion-shapes/);
  assert.match(runtime, /suggestion-source/);
  assert.ok(selectedGroupBlock, "missing selected suggestion group panel block");
  assert.match(selectedGroupBlock[0], /suggestionGroupSourceText\(selectedSuggestionGroup\)/);
  assert.match(selectedGroupBlock[0], /suggestionGroupShapeText\(selectedSuggestionGroup\)/);
  assert.match(selectedGroupBlock[0], /suggestionGroupReviewText\(selectedSuggestionGroup\)/);
  assert.match(css, /\.suggestion-bundle-actions/);
  assert.match(css, /\.suggestion-patch-select/);
  assert.match(css, /\.suggestion-meta-stack/);
  assert.match(css, /\.suggestion-source/);
  assert.match(css, /\.suggestion-shapes/);
});

test("runtime shows DEM tile cache readiness chips in the terrain tile list", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const renderBlock = runtime.match(/function renderTerrainTileButtons\(\) \{[\s\S]+?\n  \}/);
  const activeBlock = runtime.match(/function updateActiveTerrainTileButtons\(tileId\) \{[\s\S]+?\n  \}/);

  assert.ok(renderBlock, "missing terrain tile button renderer");
  assert.ok(activeBlock, "missing terrain tile button active-state sync");
  assert.match(runtime, /function terrainTileButtonStatusItems\(tile\)/);
  assert.match(runtime, /function syncTerrainTileButtonStatus\(button, tile\)/);
  assert.match(renderBlock[0], /syncTerrainTileButtonStatus\(button, tile\)/);
  assert.match(activeBlock[0], /syncTerrainTileButtonStatus\(button, tile\)/);
  assert.match(runtime, /button\.dataset\.terrainTileSurfaceCacheState/);
  assert.match(runtime, /button\.dataset\.terrainTileReferenceCacheState/);
  assert.match(runtime, /button\.dataset\.terrainTileStageState/);
  assert.match(runtime, /status\.className = "terrain-tile-button-status"/);
  assert.match(runtime, /chip\.className = "terrain-tile-button-chip"/);
  assert.match(runtime, /chip\.dataset\.state = item\.state/);
  assert.match(css, /\.terrain-tile-button-status/);
  assert.match(css, /\.terrain-tile-button-chip/);
  assert.match(css, /\.terrain-tile-button-chip\[data-state="ready"\]/);
  assert.match(css, /\.terrain-tile-button-chip\[data-state="loading"\]/);
  assert.match(css, /\.terrain-tile-button-chip\[data-state="idle"\]/);
  assert.match(script, /firstTerrainTileStatusText/);
  assert.match(script, /selectedTerrainTileStatusText/);
  assert.match(script, /selectedTerrainTileStatusStates/);
});

test("patch console smoke script exits cleanly after broken pipe exceptions", () => {
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(script, /installBrokenPipeProcessGuards\(\{/);
  assert.match(script, /onBrokenPipeException/);
  assert.match(script, /app\.exit\(0\)/);
  assert.match(script, /terrainDetailTileCount\) < 16/);
  assert.match(script, /terrainTileButtonCount/);
  assert.match(script, /terrainMapzenTileCount/);
  assert.match(script, /terrainTilePrimaryDataset/);
  assert.match(script, /firstTerrainTileDataset/);
  assert.match(script, /Expected Mapzen terrain tiles to render first/);
  assert.match(script, /qinling-mapzen-terrarium-z7-102-51/);
  assert.match(script, /sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52/);
  assert.match(script, /tianshan-urumqi-bogda-mapzen-terrarium-z7-95-46/);
  assert.match(script, /hengduan-dali-lijiang-mapzen-terrarium-z7-99-53/);
  assert.match(script, /himalaya-everest-mapzen-terrarium-z7-94-53/);
  assert.match(script, /qilian-qinghai-mapzen-terrarium-z7-99-49/);
  assert.match(script, /loess-ordos-mapzen-terrarium-z7-103-49/);
  assert.match(script, /yungui-karst-mapzen-terrarium-z7-101-54/);
  assert.match(script, /changbai-mountain-mapzen-terrarium-z7-109-47/);
  assert.match(script, /kunlun-tarim-edge-mapzen-terrarium-z7-94-49/);
  assert.match(script, /terrainDetailTileSurfaceVertexCount\) < 1000/);
  assert.match(script, /terrainDetailTileContourSegmentCount/);
  assert.match(script, /Expected selected DEM tile contour segments/);
  assert.match(script, /terrainDetailTileBoundarySegmentCount/);
  assert.match(script, /Expected selected DEM tile boundary segments/);
  assert.match(script, /terrainDetailTileWaterSegmentCount/);
  assert.match(script, /Expected selected DEM tile water reference segments/);
  assert.match(script, /terrainDetailTileWaterRiverCount/);
  assert.match(script, /terrainDetailTileWaterLakeCount/);
  assert.match(script, /terrainDetailTileTraceGuideCount/);
  assert.match(script, /terrainDetailTileTraceGuideKinds/);
  assert.match(script, /terrainDetailTileRecommendedTraceGuideCount/);
  assert.match(script, /terrainDetailTileRecommendedTraceGuideKinds/);
  assert.match(script, /Expected selected DEM tile automatic trace guides/);
  assert.match(script, /terrainTileAnalysisReliefClass/);
  assert.match(script, /terrainTileAnalysisTraceRecommendation/);
  assert.match(script, /terrainTileAnalysisSteepCellRatio/);
  assert.match(script, /terrainTileAnalysisTraceWorkload/);
  assert.match(script, /terrainTileTraceAidReadiness/);
  assert.match(script, /terrainTileTraceAidContourDensity/);
  assert.match(script, /terrainTileTraceAidDetailPriority/);
  assert.match(script, /Expected selected DEM tile terrain analysis/);
  assert.match(script, /terrainTileTraceSummaryText/);
  assert.match(script, /terrainTileTraceSummaryWaterSegments/);
  assert.match(script, /terrainTileTraceSummaryCityCount/);
  assert.match(script, /Expected selected DEM tile trace summary/);
  assert.match(script, /selectedTerrainTileZoom/);
  assert.match(script, /Expected selected DEM tile inspection zoom/);
  assert.match(script, /terrainTileReclickDurationMs/);
  assert.match(script, /terrainTileReferenceLayersPendingAfterReclick/);
  assert.match(script, /selected terrain tile deferred reference layers after reclick/);
  assert.match(script, /selectedTerrainTileCityCount/);
  assert.match(script, /selectedTerrainTileCityIds/);
  assert.match(script, /Expected Qinling local city labels/);
  assert.match(script, /suggestionShapeSummary/);
  assert.match(script, /suggestionSourceTileId/);
  assert.match(script, /suggestionSourceText/);
  assert.match(script, /suggestionReviewStatus/);
  assert.match(script, /selectedSuggestionApprovedPreviewCount/);
  assert.match(script, /Expected candidate group source metadata text/);
  assert.match(script, /selectedTerrainTileMetricLabel !== "高清地形"/);
});

test("runtime hides inspector detail controls when their parent layers are off", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(runtime, /function syncInspectorPanelVisibility\(\)/);
  assert.match(runtime, /const patchButtonsHidden = layerVisibility\.details === false && layerVisibility\.approved === false/);
  assert.match(runtime, /const suggestionButtonsHidden = layerVisibility\.suggestions === false/);
  assert.match(runtime, /patchButtons\.hidden = patchButtonsHidden/);
  assert.match(runtime, /patchConsole\.hidden = patchButtonsHidden && suggestionButtonsHidden/);
  assert.match(runtime, /traceButtons\.hidden = layerVisibility\.traces === false/);
  assert.match(runtime, /suggestionButtons\.hidden = suggestionButtonsHidden/);
  assert.match(runtime, /siteButtons\.hidden = layerVisibility\.sites === false/);
  assert.match(runtime, /syncInspectorPanelVisibility\(\);\s*\n\s*renderLayerSummary\(\);/);
  assert.match(css, /\.patch-buttons\[hidden\],\s*\n\.trace-buttons\[hidden\],\s*\n\.suggestion-buttons\[hidden\]/);
  assert.match(css, /\.site-buttons\[hidden\]/);
});

test("runtime exposes a clear 3d terrain interaction control panel", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="viewControlPanel"/);
  assert.match(html, /id="viewZoomRange"/);
  assert.match(html, /id="terrainReliefRange"/);
  assert.match(html, /id="terrainViewPresetControls"/);
  assert.match(html, /data-view-preset="far"/);
  assert.match(html, /data-view-preset="mid"/);
  assert.match(html, /data-view-preset="near"/);
  assert.match(html, /id="focusInspectionLayersBtn"/);
  assert.match(html, /id="terrainWorkflowSummary"/);
  assert.match(runtime, /const viewZoomRange = document\.querySelector\("#viewZoomRange"\)/);
  assert.match(runtime, /const terrainViewPresetButtons = document\.querySelectorAll\("\[data-view-preset\]"\)/);
  assert.match(runtime, /const terrainWorkflowSummary = document\.querySelector\("#terrainWorkflowSummary"\)/);
  assert.match(runtime, /let terrainReliefScale = 1/);
  assert.match(runtime, /function syncViewControlPanel\(\)/);
  assert.match(runtime, /function terrainViewPresetConfig\(presetId\)/);
  assert.match(runtime, /function applyTerrainViewPresetLayerFocus\(config\)/);
  assert.match(runtime, /function syncTerrainViewPresetButtons\(\)/);
  assert.match(runtime, /function setTerrainViewPreset\(presetId\)/);
  assert.match(runtime, /container\.dataset\.terrainViewPreset/);
  assert.match(runtime, /container\.dataset\.terrainViewPresetLod/);
  assert.match(runtime, /container\.dataset\.terrainViewPresetZoom/);
  assert.match(runtime, /container\.dataset\.terrainViewPresetLayerFocusVisibleIds/);
  assert.match(runtime, /container\.dataset\.terrainViewPresetLayerFocusHiddenIds/);
  assert.match(runtime, /function terrainWorkflowSummaryItems\(\)/);
  assert.match(runtime, /function syncTerrainWorkflowSummary\(\)/);
  assert.match(runtime, /function handleTerrainWorkflowAction\(workflowId\)/);
  assert.match(runtime, /function bindTerrainWorkflowChip\(chip, item\)/);
  assert.match(runtime, /container\.dataset\.terrainWorkflowSummaryText/);
  assert.match(runtime, /container\.dataset\.terrainWorkflowSummaryStates/);
  assert.match(runtime, /container\.dataset\.terrainWorkflowLastAction/);
  assert.match(runtime, /chip\.className = "terrain-workflow-chip"/);
  assert.match(runtime, /chip\.dataset\.workflowId = item\.id/);
  assert.match(runtime, /chip\.type = "button"/);
  assert.match(runtime, /bindTerrainWorkflowChip\(chip, item\)/);
  assert.match(runtime, /handleTerrainWorkflowAction\(item\.id\)/);
  assert.match(runtime, /startTraceInSelectedTerrainTile\(\)/);
  assert.match(runtime, /syncTerrainWorkflowSummary\(\)/);
  assert.match(runtime, /function setTerrainReliefScale\(nextScale\)/);
  assert.match(runtime, /container\.dataset\.terrainReliefScale/);
  assert.match(runtime, /container\.dataset\.viewZoomControlValue/);
  assert.match(runtime, /focusInspectionLayersBtn\.addEventListener/);
  assert.match(runtime, /terrainViewPresetButtons\.forEach/);
  assert.match(css, /\.view-control-panel/);
  assert.match(css, /\.view-preset-control/);
  assert.match(css, /\.view-preset-button/);
  assert.match(css, /\.terrain-workflow-summary/);
  assert.match(css, /\.terrain-workflow-chip/);
  assert.match(css, /\.terrain-workflow-chip\[data-state="ready"\]/);
  assert.match(css, /\.terrain-workflow-chip\[data-state="loading"\]/);
  assert.match(css, /\.control-slider/);
  assert.match(script, /terrainWorkflowSummaryText/);
  assert.match(script, /terrainWorkflowSummaryVisibleText/);
  assert.match(script, /terrainWorkflowSummaryStates/);
  assert.match(script, /terrainWorkflowActionResult/);
  assert.match(script, /terrainWorkflowTraceActionResult/);
  assert.match(script, /terrainViewPresetInteractions/);
  assert.match(script, /Expected terrain view presets/);
  assert.match(script, /Expected terrain workflow summary/);
  assert.match(script, /Expected terrain workflow summary actions/);
  assert.match(script, /Expected terrain workflow trace action/);
});

test("runtime throttles zoom input and lowers render cost during zoom interaction", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const ZOOM_INPUT_SCALE = 0\.0038/);
  assert.match(runtime, /const INTERACTION_PIXEL_RATIO_MAX = 1\.[0-9]+/);
  assert.match(runtime, /let appliedRendererPixelRatio = 0/);
  assert.match(runtime, /let pendingWheelZoomDelta = 0/);
  assert.match(runtime, /let wheelZoomFrame = 0/);
  assert.match(runtime, /function scheduleWheelZoom\(deltaY\)/);
  assert.match(runtime, /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(runtime, /setZoom\(state\.zoom \+ delta \* ZOOM_INPUT_SCALE/);
  assert.match(runtime, /function beginRenderInteraction\(\)/);
  assert.match(runtime, /function applyRendererPixelRatio\(\)/);
  assert.match(runtime, /container\.dataset\.renderQualityMode/);
  assert.match(runtime, /container\.dataset\.rendererPixelRatio/);
  assert.match(runtime, /if \(appliedRendererPixelRatio === pixelRatio\) return/);
  assert.match(runtime, /appliedRendererPixelRatio = pixelRatio/);
  assert.match(runtime, /renderer\.setPixelRatio\(pixelRatio\)/);
  assert.match(runtime, /scheduleWheelZoom\(event\.deltaY\)/);
  assert.doesNotMatch(runtime, /setZoom\(state\.zoom \+ event\.deltaY \* 0\.0038\)/);
  assert.match(script, /renderQualityMode/);
  assert.match(script, /Expected zoom interaction render mode/);
});

test("runtime reduces high cost scene updates while zooming or dragging", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const INTERACTION_SCREEN_UPDATE_INTERVAL_MS = 64/);
  assert.match(runtime, /const INTERACTION_EFFECT_UPDATE_INTERVAL_MS = 48/);
  assert.match(runtime, /const CITY_LABEL_IDLE_UPDATE_INTERVAL_MS = 120/);
  assert.match(runtime, /const CITY_LABEL_INTERACTION_UPDATE_INTERVAL_MS = 220/);
  assert.match(runtime, /const CAMERA_SETTLE_EPSILON = 0\.025/);
  assert.match(runtime, /let lastScreenProjectionUpdateMs = 0/);
  assert.match(runtime, /let lastCityLabelUpdateMs = 0/);
  assert.match(runtime, /let cityLabelSkippedWriteCount = 0/);
  assert.match(runtime, /let lastMotionEffectUpdateMs = 0/);
  assert.match(runtime, /function isCameraInteractionActive\(\)/);
  assert.match(runtime, /Math\.abs\(state\.zoom - camera\.position\.z\) > CAMERA_SETTLE_EPSILON/);
  assert.match(runtime, /function shouldRunInteractionUpdate\(nowMs, lastRunMs, intervalMs, cameraInteractionActive\)/);
  assert.match(runtime, /function shouldUpdateCityLabels\(nowMs, cameraInteractionActive\)/);
  assert.match(runtime, /nowMs - lastCityLabelUpdateMs >= intervalMs/);
  assert.match(runtime, /shouldRunInteractionUpdate\(nowMs, lastMotionEffectUpdateMs, INTERACTION_EFFECT_UPDATE_INTERVAL_MS, cameraInteractionActive\)/);
  assert.match(runtime, /shouldRunInteractionUpdate\(nowMs, lastScreenProjectionUpdateMs, INTERACTION_SCREEN_UPDATE_INTERVAL_MS, cameraInteractionActive\)/);
  assert.match(runtime, /shouldUpdateCityLabels\(nowMs, cameraInteractionActive\)/);
  assert.match(runtime, /const hotspotProjectionPosition = new THREE\.Vector3\(\)/);
  assert.match(runtime, /const cityLabelProjectionPosition = new THREE\.Vector3\(\)/);
  assert.match(runtime, /container\.dataset\.cityLabelUpdateMode/);
  assert.match(runtime, /container\.dataset\.cityLabelVisibleCount/);
  assert.match(runtime, /container\.dataset\.cityLabelSkippedWriteCount/);
  assert.match(runtime, /label\.dataset\.screenX === String\(screenX\)/);
});

test("runtime schedules city label refreshes outside synchronous layer visibility work", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const applyLayerVisibilityBlock = runtime.match(/function applyLayerVisibility\(\) \{[\s\S]+?\n  \}/);
  const schedulerBlock = runtime.match(/function scheduleCityLabelUpdate\(cameraInteractionActive = false\) \{[\s\S]+?\n  \}/);

  assert.ok(applyLayerVisibilityBlock, "missing layer visibility function");
  assert.ok(schedulerBlock, "missing city label update scheduler");
  assert.match(runtime, /let cityLabelUpdateFrame = 0/);
  assert.match(schedulerBlock[0], /window\.cancelAnimationFrame\(cityLabelUpdateFrame\)/);
  assert.match(schedulerBlock[0], /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(schedulerBlock[0], /updateCityLabels\(cameraInteractionActive\)/);
  assert.match(schedulerBlock[0], /container\.dataset\.cityLabelUpdateScheduled = "true"/);
  assert.match(schedulerBlock[0], /container\.dataset\.cityLabelUpdateScheduled = "false"/);
  assert.match(applyLayerVisibilityBlock[0], /scheduleCityLabelUpdate\(\)/);
  assert.doesNotMatch(applyLayerVisibilityBlock[0], /updateCityLabels\(\)/);
  assert.match(runtime, /updateCityLabels\(cameraInteractionActive\)/);
  assert.match(script, /cityLabelUpdateScheduled/);
});

test("runtime caches city marker visibility while distance tier and terrain tile stay stable", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const cachedVisibilityBlock = runtime.match(/function cachedTerrainCityMarkerVisibility\(detailLevel, selectedTerrainTile\) \{[\s\S]+?\n  \}/);
  const updateLabelsBlock = runtime.match(/function updateCityLabels\(cameraInteractionActive = false\) \{[\s\S]+?\n  \}/);

  assert.ok(cachedVisibilityBlock, "missing cached city marker visibility helper");
  assert.ok(updateLabelsBlock, "missing city label update function");
  assert.match(runtime, /let cityMarkerVisibilityCacheKey = ""/);
  assert.match(runtime, /let cityMarkerVisibilityCache = null/);
  assert.match(runtime, /let cityMarkerVisibilityCacheHitCount = 0/);
  assert.match(runtime, /let cityMarkerVisibilityCacheMissCount = 0/);
  assert.match(cachedVisibilityBlock[0], /cityMarkerVisibilityCacheKey === cacheKey/);
  assert.match(cachedVisibilityBlock[0], /cityMarkerVisibilityCacheHitCount \+= 1/);
  assert.match(cachedVisibilityBlock[0], /cityMarkerVisibilityCacheMissCount \+= 1/);
  assert.match(cachedVisibilityBlock[0], /updateTerrainCityMarkerVisibility\(detailLevel, selectedTerrainTile\)/);
  assert.match(cachedVisibilityBlock[0], /syncCachedTerrainCityMarkerVisibility\(cityMarkerVisibilityCache\)/);
  assert.match(updateLabelsBlock[0], /cachedTerrainCityMarkerVisibility\(cityLabelDetail, selectedTerrainTile\)/);
  assert.doesNotMatch(updateLabelsBlock[0], /updateTerrainCityMarkerVisibility\(cityLabelDetail, selectedTerrainTile\)/);
  assert.match(runtime, /container\.dataset\.cityMarkerVisibilityCacheKey/);
  assert.match(runtime, /container\.dataset\.cityMarkerVisibilityCacheHits/);
  assert.match(runtime, /container\.dataset\.cityMarkerVisibilityCacheMisses/);
  assert.match(script, /cityMarkerVisibilityCacheHits/);
  assert.match(script, /cityMarkerVisibilityCacheMisses/);
});

test("runtime skips hidden city labels before screen projection", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const updateLabelsBlock = runtime.match(/function updateCityLabels\(cameraInteractionActive = false\) \{[\s\S]+?\n  \}/);

  assert.ok(updateLabelsBlock, "missing city label update function");
  assert.match(runtime, /function shouldProjectCityLabel\(city, group, markerState, cityLabelDetail\)/);
  assert.match(updateLabelsBlock[0], /let projectionCandidateCount = 0/);
  assert.match(updateLabelsBlock[0], /let hiddenEarlySkipCount = 0/);
  assert.match(updateLabelsBlock[0], /if \(!shouldProjectCityLabel\(city, group, markerState, cityLabelDetail\)\) \{/);
  assert.match(updateLabelsBlock[0], /hiddenEarlySkipCount \+= 1/);
  assert.match(updateLabelsBlock[0], /projectionCandidateCount \+= 1/);
  assert.ok(
    updateLabelsBlock[0].indexOf("if (!shouldProjectCityLabel") < updateLabelsBlock[0].indexOf("group.getWorldPosition(cityLabelProjectionPosition)"),
    "city labels should skip hidden labels before screen projection"
  );
  assert.match(runtime, /container\.dataset\.cityLabelProjectionCandidateCount = String\(projectionCandidateCount\)/);
  assert.match(runtime, /container\.dataset\.cityLabelHiddenEarlySkipCount = String\(hiddenEarlySkipCount\)/);
  assert.match(script, /cityLabelProjectionCandidateCount/);
  assert.match(script, /cityLabelHiddenEarlySkipCount/);
});

test("runtime reuses city label projection while the view stays inside the same camera bucket", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const updateLabelsBlock = runtime.match(/function updateCityLabels\(cameraInteractionActive = false\) \{[\s\S]+?\n  \}/);

  assert.ok(updateLabelsBlock, "missing city label update function");
  assert.match(runtime, /const CITY_LABEL_PROJECTION_Z_BUCKET = 0\.04/);
  assert.match(runtime, /const CITY_LABEL_PROJECTION_ROTATION_BUCKET = 0\.006/);
  assert.match(runtime, /let cityLabelProjectionCacheKey = ""/);
  assert.match(runtime, /let cityLabelProjectionCacheHitCount = 0/);
  assert.match(runtime, /function cityLabelProjectionCameraKey\(cityLabelDetail\)/);
  assert.match(runtime, /function shouldReuseCityLabelProjection\(cameraInteractionActive, projectionCacheKey\)/);
  assert.match(runtime, /function reuseCityLabelProjectionCache\(cameraInteractionActive, cityLabelDetail\)/);
  assert.match(updateLabelsBlock[0], /const projectionCacheKey = cityLabelProjectionCameraKey\(cityLabelDetail\)/);
  assert.match(updateLabelsBlock[0], /if \(shouldReuseCityLabelProjection\(cameraInteractionActive, projectionCacheKey\)\) \{/);
  assert.match(updateLabelsBlock[0], /return reuseCityLabelProjectionCache\(cameraInteractionActive, cityLabelDetail\)/);
  assert.match(updateLabelsBlock[0], /cityLabelProjectionCacheKey = projectionCacheKey/);
  assert.ok(
    updateLabelsBlock[0].indexOf("shouldReuseCityLabelProjection") < updateLabelsBlock[0].indexOf("group.getWorldPosition(cityLabelProjectionPosition)"),
    "city label projection cache should be checked before world-position projection"
  );
  assert.match(runtime, /container\.dataset\.cityLabelProjectionCacheKey/);
  assert.match(runtime, /container\.dataset\.cityLabelProjectionCacheHits/);
  assert.match(runtime, /container\.dataset\.cityLabelProjectionCacheMode/);
  assert.match(script, /cityLabelProjectionCacheHits/);
  assert.match(script, /cityLabelProjectionCacheMode/);
  assert.match(script, /Number\(terrainTileResult\.cityLabelProjectionCacheHits\) < 1/);
});

test("runtime smooths full map zoom by throttling marker animation and control DOM sync", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");

  assert.match(runtime, /const INTERACTION_HOTSPOT_UPDATE_INTERVAL_MS = 96/);
  assert.match(runtime, /const INTERACTION_VIEW_CONTROL_SYNC_INTERVAL_MS = 80/);
  assert.match(runtime, /let lastHotspotPulseUpdateMs = 0/);
  assert.match(runtime, /let lastViewControlPanelSyncMs = 0/);
  assert.match(runtime, /let viewControlPanelSyncFrame = 0/);
  assert.match(runtime, /function updateHotspotMarkerPulse\(elapsed\)/);
  assert.match(runtime, /shouldRunInteractionUpdate\(nowMs, lastHotspotPulseUpdateMs, INTERACTION_HOTSPOT_UPDATE_INTERVAL_MS, cameraInteractionActive\)/);
  assert.match(runtime, /updateHotspotMarkerPulse\(elapsed\)/);
  assert.match(runtime, /function scheduleViewControlPanelSync\(force = false\)/);
  assert.match(runtime, /nowMs - lastViewControlPanelSyncMs < INTERACTION_VIEW_CONTROL_SYNC_INTERVAL_MS/);
  assert.match(runtime, /scheduleViewControlPanelSync\(\)/);
  assert.match(runtime, /scheduleViewControlPanelSync\(true\)/);
  assert.doesNotMatch(runtime, /setZoom\(nextZoom\) \{\s+state = \{ \.\.\.state, zoom: Core\.normalizeZoom\(nextZoom\) \};\s+beginRenderInteraction\(\);\s+syncViewControlPanel\(\);/);
});

test("runtime defers heavy DEM tile reference layers after high resolution terrain clicks", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const refreshBlock = runtime.match(/function refreshSelectedTerrainTileSurface\(tile\) \{[\s\S]+?\n  \}/);
  const schedulerBlock = runtime.match(/function scheduleTerrainTileReferenceLayers\(tile\) \{[\s\S]+?\n  \}/);
  const stageBlock = runtime.match(/function runTerrainTileReferenceLayerStage\(tile, token\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /let terrainTileReferenceLayerFrame = 0/);
  assert.match(runtime, /let terrainTileReferenceLayerToken = 0/);
  assert.match(runtime, /function cancelTerrainTileReferenceLayerFrame\(options = \{\}\)/);
  assert.match(runtime, /function scheduleTerrainTileReferenceLayers\(tile\)/);
  assert.match(runtime, /window\.requestAnimationFrame\(\(\) => \{/);
  assert.ok(refreshBlock, "missing DEM tile surface refresh function");
  assert.ok(schedulerBlock, "missing DEM tile reference layer scheduler");
  assert.ok(stageBlock, "missing DEM tile reference layer stage runner");
  assert.match(refreshBlock[0], /scheduleTerrainTileReferenceLayers\(tile\)/);
  assert.doesNotMatch(refreshBlock[0], /createTerrainDetailTileContours\(tile\);\s+createTerrainDetailTileBoundaries\(tile\);\s+createTerrainDetailTileWaterReferences\(tile\);\s+createTerrainDetailTileTraceGuides\(tile\);/);
  assert.match(stageBlock[0], /stage\.run\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileContours\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileBoundaries\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileWaterReferences\(tile\)/);
  assert.match(runtime, /createTerrainDetailTileTraceGuides\(tile\)/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileReferenceLayersPending/);
});

test("runtime stages DEM tile reference layer generation across animation frames", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const schedulerBlock = runtime.match(/function scheduleTerrainTileReferenceLayers\(tile\) \{[\s\S]+?\n  \}/);
  const stageBlock = runtime.match(/function runTerrainTileReferenceLayerStage\(tile, token\) \{[\s\S]+?\n  \}/);
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /const TERRAIN_TILE_REFERENCE_LAYER_STAGES = \[/);
  assert.match(runtime, /id: "contours"[\s\S]+createTerrainDetailTileContours\(tile\)/);
  assert.match(runtime, /id: "boundaries"[\s\S]+createTerrainDetailTileBoundaries\(tile\)/);
  assert.match(runtime, /id: "water"[\s\S]+createTerrainDetailTileWaterReferences\(tile\)/);
  assert.match(runtime, /id: "traceGuides"[\s\S]+createTerrainDetailTileTraceGuides\(tile\)/);
  assert.match(runtime, /let terrainTileReferenceLayerStageIndex = 0/);
  assert.match(runtime, /function runTerrainTileReferenceLayerStage\(tile, token\)/);
  assert.ok(schedulerBlock, "missing DEM tile reference layer scheduler");
  assert.ok(stageBlock, "missing DEM tile reference layer stage runner");
  assert.match(schedulerBlock[0], /terrainTileReferenceLayerStageIndex = 0/);
  assert.match(schedulerBlock[0], /runTerrainTileReferenceLayerStage\(tile, token\)/);
  assert.doesNotMatch(schedulerBlock[0], /createTerrainDetailTileContours\(tile\);\s+createTerrainDetailTileBoundaries\(tile\);\s+createTerrainDetailTileWaterReferences\(tile\);\s+createTerrainDetailTileTraceGuides\(tile\);/);
  assert.match(stageBlock[0], /const stage = TERRAIN_TILE_REFERENCE_LAYER_STAGES\[terrainTileReferenceLayerStageIndex\]/);
  assert.match(stageBlock[0], /stage\.run\(tile\)/);
  assert.match(stageBlock[0], /terrainTileReferenceLayerStageIndex \+= 1/);
  assert.match(stageBlock[0], /window\.requestAnimationFrame\(\(\) => runTerrainTileReferenceLayerStage\(tile, token\)\)/);
  assert.match(stageBlock[0], /cacheActiveTerrainTileReferenceLayers\(\)/);
  assert.match(stageBlock[0], /restoreTerrainTileReferenceLayersFromCache\(tile\)/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileReferenceLayerStage/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileReferenceLayerStageIndex/);
  assert.match(runtime, /container\.dataset\.terrainDetailTileReferenceLayerStageTotal/);
  assert.match(script, /terrainDetailTileReferenceLayerStage/);
});

test("runtime exposes a clear DEM tile inspect mode and reference loading state", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(html, /id="terrainTileInspectStatus"/);
  assert.match(html, /id="terrainTileInspectContext"/);
  assert.match(html, /id="terrainTilePipelineStatus"/);
  assert.match(html, /id="terrainTilePipelineChips"/);
  assert.match(runtime, /const terrainTileInspectStatus = document\.querySelector\("#terrainTileInspectStatus"\)/);
  assert.match(runtime, /const terrainTileInspectContext = document\.querySelector\("#terrainTileInspectContext"\)/);
  assert.match(runtime, /const terrainTilePipelineStatus = document\.querySelector\("#terrainTilePipelineStatus"\)/);
  assert.match(runtime, /const terrainTilePipelineChips = document\.querySelector\("#terrainTilePipelineChips"\)/);
  assert.match(runtime, /function syncTerrainTileInspectStatus\(tile\)/);
  assert.match(runtime, /function terrainTilePipelineStatusText\(activeTile, status\)/);
  assert.match(runtime, /function terrainTileReferenceLayerStageText\(status\)/);
  assert.match(runtime, /function renderTerrainTilePipelineChips\(activeTile, status\)/);
  assert.match(runtime, /function terrainTileLocalCityContext\(tile\)/);
  assert.match(runtime, /container\.dataset\.terrainTileInspectMode/);
  assert.match(runtime, /container\.dataset\.terrainTileReferenceLayerStatus/);
  assert.match(runtime, /container\.dataset\.terrainTileReferenceLayerStageText/);
  assert.match(runtime, /container\.dataset\.selectedTerrainTileCityLabels/);
  assert.match(runtime, /container\.dataset\.selectedTerrainTileCityNames/);
  assert.match(runtime, /container\.dataset\.selectedTerrainTileProvinceNames/);
  assert.match(runtime, /container\.dataset\.terrainTileInspectContextText/);
  assert.match(runtime, /terrainTileLocalCityContext\(activeTile\)/);
  assert.match(runtime, /terrainTileInspectStatus\.dataset\.state/);
  assert.match(runtime, /terrainTileInspectContext\.textContent = activeTile/);
  assert.match(runtime, /terrainTileInspectContext\.hidden = !activeTile/);
  assert.match(runtime, /container\.dataset\.terrainTilePipelineStatusText/);
  assert.match(runtime, /container\.dataset\.terrainTilePipelineChipText/);
  assert.match(runtime, /container\.dataset\.terrainTilePipelineChipStates/);
  assert.match(runtime, /terrainTilePipelineStatus\.textContent = activeTile/);
  assert.match(runtime, /Stage \$\{terrainTileReferenceLayerStageText\(status\)\}/);
  assert.match(runtime, /terrainTilePipelineStatus\.hidden = !activeTile/);
  assert.match(runtime, /terrainTilePipelineChips\.replaceChildren/);
  assert.match(runtime, /chip\.className = "terrain-tile-pipeline-chip"/);
  assert.match(runtime, /chip\.dataset\.state = item\.state/);
  assert.match(runtime, /terrainTileSurfaceCache\.has\(activeTile\.id\)/);
  assert.match(runtime, /terrainTileReferenceLayerCache\.has\(activeTile\.id\)/);
  assert.match(runtime, /button\.classList\.toggle\("is-loading"/);
  assert.match(css, /\.terrain-tile-inspect-status/);
  assert.match(css, /\.terrain-tile-inspect-context/);
  assert.match(css, /\.terrain-tile-inspect-context\[hidden\]/);
  assert.match(css, /\.terrain-tile-pipeline-status/);
  assert.match(css, /\.terrain-tile-pipeline-status\[hidden\]/);
  assert.match(css, /\.terrain-tile-pipeline-chips/);
  assert.match(css, /\.terrain-tile-pipeline-chip/);
  assert.match(css, /\.terrain-tile-pipeline-chip\[data-state="ready"\]/);
  assert.match(css, /\.terrain-tile-pipeline-chip\[data-state="loading"\]/);
  assert.match(css, /\.terrain-tile-inspect-status\[data-state="loading"\]/);
  assert.match(css, /\.terrain-tile-button\.is-loading/);
  assert.match(script, /terrainTileInspectMode/);
  assert.match(script, /terrainTileReferenceLayerStatus/);
  assert.match(script, /terrainTileInspectStatusText/);
  assert.match(script, /terrainTileInspectContextVisibleText/);
  assert.match(script, /terrainTileInspectContextText/);
  assert.match(script, /terrainTilePipelineStatusVisibleText/);
  assert.match(script, /terrainTilePipelineStatusText/);
  assert.match(script, /terrainTilePipelineChipText/);
  assert.match(script, /terrainTilePipelineChipStates/);
  assert.match(script, /terrainTileReferenceLayerStageText/);
  assert.match(script, /selectedTerrainTileCityLabels/);
  assert.match(script, /selectedTerrainTileProvinceNames/);
});

test("runtime adapts DEM tile detail layers by observation distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const lodBlock = runtime.match(/function terrainDetailLodLevel\(viewDistance\) \{[\s\S]+?\n  \}/);
  const visibilityBlock = runtime.match(/function applyTerrainDetailTileLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /const TERRAIN_DETAIL_LOD_NEAR_DISTANCE = 3\.15/);
  assert.match(runtime, /const TERRAIN_DETAIL_LOD_MID_DISTANCE = 4\.35/);
  assert.match(runtime, /function terrainDetailLodLevel\(viewDistance\)/);
  assert.ok(lodBlock, "missing terrain detail LOD helper");
  assert.match(lodBlock[0], /return "near"/);
  assert.match(lodBlock[0], /return "mid"/);
  assert.match(lodBlock[0], /return "far"/);
  assert.ok(visibilityBlock, "missing terrain detail tile visibility helper");
  assert.match(visibilityBlock[0], /const detailLevel = effectiveTerrainDetailLodLevel\(camera\.position\.z\)/);
  assert.match(visibilityBlock[0], /const roleDetailLevels = \{/);
  assert.match(visibilityBlock[0], /"terrain-detail-tile-contour": "near"/);
  assert.match(visibilityBlock[0], /"terrain-detail-tile-prefecture-boundary": "near"/);
  assert.match(visibilityBlock[0], /"terrain-detail-tile-trace-guide": "near"/);
  assert.match(visibilityBlock[0], /"terrain-detail-tile-water-reference": "mid"/);
  assert.match(visibilityBlock[0], /detailRank\(detailLevel\) <= detailRank\(requiredDetail\)/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailLodLevel = detailLevel/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailLodViewDistance = camera\.position\.z\.toFixed\(2\)/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailLodHiddenCount = String\(hiddenCount\)/);
  assert.match(runtime, /applyTerrainDetailTileLayerVisibility\(\)/);
  assert.match(script, /terrainDetailLodLevel/);
  assert.match(script, /terrainDetailLodHiddenCount/);
});

test("runtime fades dense DEM tile contours by observation distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const visibilityBlock = runtime.match(/function applyTerrainDetailTileLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /function terrainDetailTileContourDistanceOpacity\(viewDistance, baseOpacity\)/);
  assert.match(runtime, /TERRAIN_DETAIL_LOD_NEAR_DISTANCE/);
  assert.match(runtime, /TERRAIN_DETAIL_LOD_MID_DISTANCE/);
  assert.match(runtime, /terrainDetailTileContourEffectiveOpacity/);
  assert.match(runtime, /terrainDetailTileContourDistanceOpacityMode/);
  assert.ok(visibilityBlock, "missing terrain detail tile visibility helper");
  assert.match(visibilityBlock[0], /const contourDistanceOpacity = terrainDetailTileContourDistanceOpacity\(camera\.position\.z, terrainDetailTileContourGroup\.userData\.opacity\)/);
  assert.match(visibilityBlock[0], /object\.material\.opacity = contourDistanceOpacity\.opacity/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailTileContourEffectiveOpacity = contourDistanceOpacity\.opacity\.toFixed\(2\)/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailTileContourDistanceOpacityMode = contourDistanceOpacity\.mode/);
  assert.match(script, /terrainDetailTileContourEffectiveOpacity/);
  assert.match(script, /terrainDetailTileContourDistanceOpacityMode/);
  assert.match(script, /Expected DEM contour distance opacity tuning/);
});

test("runtime subdues DEM tile water references by observation distance", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const visibilityBlock = runtime.match(/function applyTerrainDetailTileLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /function terrainDetailTileWaterReferenceDistanceOpacity\(viewDistance, baseOpacity\)/);
  assert.match(runtime, /terrainDetailTileWaterEffectiveOpacity/);
  assert.match(runtime, /terrainDetailTileWaterDistanceOpacityMode/);
  assert.match(runtime, /line\.userData\.baseOpacity = river\.rank === "main" \? 0\.72 : 0\.52/);
  assert.match(runtime, /line\.userData\.baseOpacity = 0\.62/);
  assert.ok(visibilityBlock, "missing terrain detail tile visibility helper");
  assert.match(visibilityBlock[0], /const waterDistanceOpacity = terrainDetailTileWaterReferenceDistanceOpacity\(camera\.position\.z, object\.userData\.baseOpacity\)/);
  assert.match(visibilityBlock[0], /role === "terrain-detail-tile-water-reference" && object\.material/);
  assert.match(visibilityBlock[0], /object\.material\.opacity = waterDistanceOpacity\.opacity/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailTileWaterEffectiveOpacity = waterReferenceOpacityDebug\.opacity\.toFixed\(2\)/);
  assert.match(visibilityBlock[0], /container\.dataset\.terrainDetailTileWaterDistanceOpacityMode = waterReferenceOpacityDebug\.mode/);
  assert.match(script, /terrainDetailTileWaterEffectiveOpacity/);
  assert.match(script, /terrainDetailTileWaterDistanceOpacityMode/);
  assert.match(script, /Expected DEM water reference distance opacity tuning/);
});

test("runtime exposes manual DEM detail density modes in the view controls", () => {
  const html = [
    fs.readFileSync(path.join(__dirname, "index.html"), "utf8"),
    fs.readFileSync(path.join(__dirname, "world-map.html"), "utf8"),
  ].join("\n");
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const visibilityBlock = runtime.match(/function applyTerrainDetailTileLayerVisibility\(\) \{[\s\S]+?\n  \}/);

  assert.match(html, /id="terrainDetailDensityControls"/);
  assert.match(html, /id="terrainDetailDensityStatus"/);
  assert.match(html, /id="terrainDetailLodGuidance"/);
  assert.match(html, /id="terrainDetailLodSummary"/);
  assert.match(html, /id="terrainDetailLodRecipe"/);
  assert.match(html, /id="terrainDetailApplyRecipeBtn"/);
  assert.match(html, /data-detail-density-mode="auto"/);
  assert.match(html, /data-detail-density-mode="compact"/);
  assert.match(html, /data-detail-density-mode="fine"/);
  assert.match(runtime, /const terrainDetailDensityButtons = document\.querySelectorAll\("\[data-detail-density-mode\]"\)/);
  assert.match(runtime, /const terrainDetailDensityStatus = document\.querySelector\("#terrainDetailDensityStatus"\)/);
  assert.match(runtime, /const terrainDetailLodSummary = document\.querySelector\("#terrainDetailLodSummary"\)/);
  assert.match(runtime, /const terrainDetailLodRecipe = document\.querySelector\("#terrainDetailLodRecipe"\)/);
  assert.match(runtime, /const terrainDetailApplyRecipeBtn = document\.querySelector\("#terrainDetailApplyRecipeBtn"\)/);
  assert.match(runtime, /let terrainDetailDensityMode = "auto"/);
  assert.match(runtime, /function effectiveTerrainDetailLodLevel\(viewDistance\)/);
  assert.match(runtime, /terrainDetailDensityMode === "compact"/);
  assert.match(runtime, /terrainDetailDensityMode === "fine"/);
  assert.match(runtime, /function syncTerrainDetailDensityStatus\(detailLevel\)/);
  assert.match(runtime, /function terrainDetailLodGuidanceText\(detailLevel\)/);
  assert.match(runtime, /function terrainDetailLodRecipeItems\(detailLevel\)/);
  assert.match(runtime, /function applyTerrainDetailLodRecipe\(\)/);
  assert.match(runtime, /function refreshTerrainDetailLodForViewDistance\(\)/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodLevel !== detailLevel/);
  assert.match(runtime, /syncTerrainDetailDensityStatus\(detailLevel\)/);
  assert.match(runtime, /function setTerrainDetailDensityMode\(mode\)/);
  assert.match(runtime, /container\.dataset\.terrainDetailDensityMode = terrainDetailDensityMode/);
  assert.match(runtime, /container\.dataset\.terrainDetailDensityStatusText/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodGuidanceText/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeText/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeIds/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeActiveIds/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeActiveCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeTotalCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeMissingIds/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeStatusText/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodSummaryText/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodSummaryActiveCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodSummaryMissingCount/);
  assert.match(runtime, /container\.dataset\.terrainDetailLodRecipeAppliedIds/);
  assert.match(runtime, /terrainDetailLodGuidance\.textContent = guidanceText/);
  assert.match(runtime, /terrainDetailLodSummary\.replaceChildren/);
  assert.match(runtime, /className = "lod-summary-chip"/);
  assert.match(runtime, /terrainDetailLodRecipe\.replaceChildren/);
  assert.match(runtime, /document\.createElement\("button"\)/);
  assert.match(runtime, /chip\.dataset\.lodRecipeLayerId = item\.id/);
  assert.match(runtime, /bindTerrainDetailLodRecipeChip\(chip, item\)/);
  assert.match(runtime, /function bindTerrainDetailLodRecipeChip\(chip, item\)/);
  assert.match(runtime, /terrainDetailApplyRecipeBtn\.addEventListener\("click", \(\) => applyTerrainDetailLodRecipe\(\)\)/);
  assert.match(runtime, /terrainDetailApplyRecipeBtn\.textContent = recipeStatusText/);
  assert.match(runtime, /chip\.classList\.toggle\("is-muted", !active\)/);
  assert.match(runtime, /chip\.dataset\.active = String\(active\)/);
  assert.match(runtime, /button\.setAttribute\("aria-pressed", String\(active\)\)/);
  assert.match(runtime, /button\.classList\.toggle\("is-active", active\)/);
  assert.ok(visibilityBlock, "missing terrain detail tile visibility helper");
  assert.match(visibilityBlock[0], /const detailLevel = effectiveTerrainDetailLodLevel\(camera\.position\.z\)/);
  assert.match(css, /\.density-control/);
  assert.match(css, /\.density-status/);
  assert.match(css, /\.lod-guidance/);
  assert.match(css, /\.lod-summary/);
  assert.match(css, /\.lod-summary-chip/);
  assert.match(css, /\.lod-summary-chip\[data-state="missing"\]/);
  assert.match(css, /\.lod-recipe/);
  assert.match(css, /\.lod-recipe-chip/);
  assert.match(css, /\.lod-recipe-chip\.is-muted/);
  assert.match(css, /\.density-button/);
  assert.match(script, /terrainDetailDensityMode/);
  assert.match(script, /terrainDetailDensityInteractions/);
  assert.match(script, /terrainDetailDensityStatusText/);
  assert.match(script, /terrainDetailLodGuidanceText/);
  assert.match(script, /terrainDetailLodRecipeText/);
  assert.match(script, /terrainDetailLodRecipeIds/);
  assert.match(script, /terrainDetailLodRecipeActiveIds/);
  assert.match(script, /terrainDetailLodSummaryText/);
  assert.match(script, /terrainDetailLodSummaryVisibleText/);
  assert.match(script, /terrainDetailLodSummaryMissingCount/);
  assert.match(script, /terrainDetailLodRecipeStatusText/);
  assert.match(script, /terrainDetailLodRecipeMissingIds/);
  assert.match(script, /terrainDetailLodRecipeClickResult/);
  assert.match(script, /terrainDetailLodRecipeApplyResult/);
  assert.match(script, /Expected DEM detail LOD guidance/);
  assert.match(script, /Expected DEM detail LOD summary/);
  assert.match(script, /Expected DEM detail LOD recipe/);
  assert.match(script, /Expected DEM detail LOD recipe active state/);
  assert.match(script, /Expected DEM detail LOD recipe chip to toggle contours/);
  assert.match(script, /Expected DEM detail LOD recipe apply button to enable current recipe layers/);
  assert.match(script, /Expected DEM detail LOD recipe status counts/);
});

test("runtime skips DEM tile rebuilds when reclicking the already inspected tile", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const focusBlock = runtime.match(/function focusOnTerrainTile\(tileId\) \{[\s\S]+?\n  \}/);
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.ok(focusBlock, "missing DEM tile focus function");
  assert.match(focusBlock[0], /const reuseActiveTerrainTileSurface = selectedTerrainTileId === tile\.id/);
  assert.match(focusBlock[0], /terrainDetailTileSurfaceGroup\.userData\.tileId === tile\.id/);
  assert.match(focusBlock[0], /!terrainDetailTileSurfaceGroup\.userData\.referenceLayersPending/);
  assert.match(focusBlock[0], /if \(reuseActiveTerrainTileSurface\) \{/);
  assert.ok(
    focusBlock[0].indexOf("if (reuseActiveTerrainTileSurface)") < focusBlock[0].indexOf("selectedManualTraceId = null"),
    "same-tile reclick should return before selection, layer, and camera state updates"
  );
  const fastPathBlock = focusBlock[0].match(/if \(reuseActiveTerrainTileSurface\) \{[\s\S]+?return;\s+\}/);
  assert.ok(fastPathBlock, "missing same-tile reclick fast path");
  assert.doesNotMatch(fastPathBlock[0], /syncTerrainTileInspectStatus\(tile\)/);
  assert.doesNotMatch(fastPathBlock[0], /updateActiveTerrainTileButtons\(tile\.id\)/);
  assert.doesNotMatch(fastPathBlock[0], /updateStartTerrainTileTraceButton\(tile\)/);
  assert.match(focusBlock[0], /return;\s+\}/);
  assert.match(script, /terrainTileReclickReusedSurface/);
  assert.match(script, /Expected loaded DEM tile reclick to reuse rendered layers/);
});

test("runtime keeps cached DEM tile switches on a short synchronous path", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const focusBlock = runtime.match(/function focusOnTerrainTile\(tileId\) \{[\s\S]+?\n  \}/);
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.ok(focusBlock, "missing DEM tile focus function");
  assert.match(focusBlock[0], /const cachedTerrainTileSurface = terrainTileSurfaceCache\.has\(tile\.id\)/);
  assert.match(focusBlock[0], /if \(cachedTerrainTileSurface\) \{/);
  assert.match(focusBlock[0], /window\.requestAnimationFrame\(\(\) => renderLayerSummary\(\)\)/);
  assert.match(focusBlock[0], /if \(cachedTerrainTileSurface\) \{[\s\S]*refreshSelectedTerrainTileSurface\(tile\)/);
  assert.ok(
    focusBlock[0].indexOf("if (cachedTerrainTileSurface)") < focusBlock[0].indexOf("renderLayerSummary();"),
    "cached tile switch should choose the deferred layer-summary path before the synchronous summary refresh"
  );
  assert.match(script, /terrainTileCacheReturnDurationMs/);
  assert.match(script, /Expected cached DEM tile return to show surface quickly and restore reference layers/);
});

test("runtime syncs selected DEM tile dataset before deferred panel refresh", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const focusBlock = runtime.match(/function focusOnTerrainTile\(tileId\) \{[\s\S]+?\n  \}/);

  assert.ok(focusBlock, "missing DEM tile focus function");
  assert.match(focusBlock[0], /selectedTerrainTileId = tile\.id;\s+container\.dataset\.selectedTerrainTileId = tile\.id/);
  assert.ok(
    focusBlock[0].indexOf("container.dataset.selectedTerrainTileId = tile.id") < focusBlock[0].indexOf("refreshSelectedTerrainTileSurface(tile)"),
    "selected tile dataset should be current before cached surface restore and deferred panel refresh"
  );
});

test("runtime avoids clearing DEM inspector during cached tile switch setup", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const cancelBlock = runtime.match(/function cancelTerrainTileReferenceLayerFrame\(options = \{\}\) \{[\s\S]+?\n  \}/);
  const refreshBlock = runtime.match(/function refreshSelectedTerrainTileSurface\(tile\) \{[\s\S]+?\n  \}/);

  assert.ok(cancelBlock, "missing cancellable DEM reference layer frame helper");
  assert.ok(refreshBlock, "missing DEM tile surface refresh function");
  assert.match(cancelBlock[0], /if \(!options\.deferInspectSync\) \{/);
  assert.match(cancelBlock[0], /syncTerrainTileInspectStatus\(null\)/);
  assert.match(refreshBlock[0], /cancelTerrainTileReferenceLayerFrame\(\{ deferInspectSync: Boolean\(tile\) \}\)/);
  assert.ok(
    refreshBlock[0].indexOf("cancelTerrainTileReferenceLayerFrame({ deferInspectSync: Boolean(tile) })") < refreshBlock[0].indexOf("restoreTerrainTileSurfaceFromCache(tile)"),
    "tile switches should suppress inspector clearing before cached surface restore"
  );
  assert.doesNotMatch(refreshBlock[0], /cancelTerrainTileReferenceLayerFrame\(\);\s+\n\s+const restoreCachedTerrainTileSurfaceFirst/);
});

test("runtime restores cached DEM reference layers with lightweight debug sync", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const restoreBlock = runtime.match(/function restoreTerrainTileReferenceLayersFromCache\(tile, options = \{\}\) \{[\s\S]+?\n  \}/);
  const cachedRestoreScheduler = runtime.match(/function scheduleCachedTerrainTileReferenceLayerRestore\(tile\) \{[\s\S]+?\n  \}/);

  assert.ok(restoreBlock, "missing cached DEM reference restore helper with options");
  assert.ok(cachedRestoreScheduler, "missing cached DEM reference restore scheduler");
  assert.match(restoreBlock[0], /syncTerrainDetailTileSurfaceDebugState\(\)/);
  assert.doesNotMatch(restoreBlock[0], /syncTerrainTileInspectStatus\(tile\)/);
  assert.doesNotMatch(restoreBlock[0], /updateSelectedPanel\(\)/);
  assert.match(cachedRestoreScheduler[0], /restoreTerrainTileReferenceLayersFromCache\(tile, \{ lightweight: true \}\)/);
  assert.match(cachedRestoreScheduler[0], /scheduleSelectedTerrainTilePanelRefresh\(tile\.id\)/);
  assert.doesNotMatch(cachedRestoreScheduler[0], /updateSelectedPanel\(\)/);
});

test("runtime preserves the target reference cache entry before caching the outgoing tile", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const cachedRestoreScheduler = runtime.match(/function scheduleCachedTerrainTileReferenceLayerRestore\(tile\) \{[\s\S]+?\n  \}/);

  assert.ok(cachedRestoreScheduler, "missing cached DEM reference restore scheduler");
  assert.match(cachedRestoreScheduler[0], /const targetReferenceCacheEntry = tile && terrainTileReferenceLayerCache\.get\(tile\.id\)/);
  assert.match(cachedRestoreScheduler[0], /terrainTileReferenceLayerCache\.delete\(tile\.id\)/);
  assert.match(cachedRestoreScheduler[0], /cacheActiveTerrainTileReferenceLayers\(\{ allowPending: true \}\)/);
  assert.match(cachedRestoreScheduler[0], /terrainTileReferenceLayerCache\.set\(tile\.id, targetReferenceCacheEntry\)/);
  assert.ok(
    cachedRestoreScheduler[0].indexOf("const targetReferenceCacheEntry") < cachedRestoreScheduler[0].indexOf("cacheActiveTerrainTileReferenceLayers({ allowPending: true })"),
    "target reference cache entry should be reserved before caching the outgoing tile"
  );
  assert.ok(
    cachedRestoreScheduler[0].indexOf("terrainTileReferenceLayerCache.set(tile.id, targetReferenceCacheEntry)") < cachedRestoreScheduler[0].indexOf("restoreTerrainTileReferenceLayersFromCache(tile"),
    "target reference cache entry should be restored to the cache before the restore call"
  );
});

test("runtime refreshes cached reference QA state without immediate full panel rebuild", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const cachedRestoreScheduler = runtime.match(/function scheduleCachedTerrainTileReferenceLayerRestore\(tile\) \{[\s\S]+?\n  \}/);

  assert.ok(cachedRestoreScheduler, "missing cached DEM reference restore scheduler");
  assert.match(cachedRestoreScheduler[0], /const restored = restoreTerrainTileReferenceLayersFromCache\(tile, \{ lightweight: true \}\)/);
  assert.match(cachedRestoreScheduler[0], /if \(!restored\) \{/);
  assert.match(cachedRestoreScheduler[0], /scheduleTerrainTileReferenceLayers\(tile\)/);
  assert.match(cachedRestoreScheduler[0], /syncTerrainTileInspectStatus\(tile\)/);
  assert.match(cachedRestoreScheduler[0], /scheduleSelectedTerrainTilePanelRefresh\(tile\.id\)/);
  assert.doesNotMatch(cachedRestoreScheduler[0], /updateSelectedPanel\(\)/);
  assert.ok(
    cachedRestoreScheduler[0].indexOf("syncTerrainTileInspectStatus(tile)") < cachedRestoreScheduler[0].indexOf("scheduleSelectedTerrainTilePanelRefresh(tile.id)"),
    "cached refs should refresh QA/inspector before deferred full panel rebuild"
  );
});

test("runtime caches generated DEM tile reference layers when switching between inspected tiles", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");
  const refreshBlock = runtime.match(/function refreshSelectedTerrainTileSurface\(tile\) \{[\s\S]+?\n  \}/);
  const schedulerBlock = runtime.match(/function scheduleTerrainTileReferenceLayers\(tile\) \{[\s\S]+?\n  \}/);
  const stageBlock = runtime.match(/function runTerrainTileReferenceLayerStage\(tile, token\) \{[\s\S]+?\n  \}/);
  const restoreBlock = runtime.match(/function restoreTerrainTileReferenceLayersFromCache\(tile, options = \{\}\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /const TERRAIN_TILE_REFERENCE_LAYER_CACHE_LIMIT = 3/);
  assert.match(runtime, /const terrainTileReferenceLayerCache = new Map\(\)/);
  assert.match(runtime, /function cacheActiveTerrainTileReferenceLayers\(options = \{\}\)/);
  assert.match(runtime, /function terrainTileReferenceLayersReadyForCache\(tileId\)/);
  assert.match(runtime, /function restoreTerrainTileReferenceLayersFromCache\(tile, options = \{\}\)/);
  assert.match(runtime, /function scheduleCachedTerrainTileReferenceLayerRestore\(tile\)/);
  assert.match(runtime, /const tileId = terrainDetailTileContourGroup\.userData\.tileId/);
  assert.match(runtime, /terrainTileReferenceLayersReadyForCache\(tileId\)/);
  assert.match(runtime, /terrainDetailTileContourGroup\.userData\.tileId === tileId/);
  assert.match(runtime, /terrainDetailTileBoundaryGroup\.userData\.tileId === tileId/);
  assert.match(runtime, /terrainDetailTileWaterGroup\.userData\.tileId === tileId/);
  assert.match(runtime, /terrainDetailTileTraceGuideGroup\.userData\.tileId === tileId/);
  assert.match(runtime, /const restoreCachedTerrainTileSurfaceFirst = tile && terrainTileSurfaceCache\.has\(tile\.id\)/);
  assert.match(runtime, /function applyTerrainDetailTileLayerVisibility\(\)/);
  assert.match(runtime, /group\.children\.splice\(0\)/);
  assert.match(runtime, /group\.children = cachedLayer\.children/);
  assert.doesNotMatch(runtime, /child\.parent = null/);
  assert.doesNotMatch(runtime, /child\.parent = group/);
  assert.ok(refreshBlock, "missing DEM tile surface refresh function");
  assert.ok(schedulerBlock, "missing DEM tile reference layer scheduler");
  assert.ok(stageBlock, "missing DEM tile reference layer stage runner");
  assert.ok(restoreBlock, "missing DEM tile reference cache restore function");
  assert.match(refreshBlock[0], /cacheActiveTerrainTileReferenceLayers\(\)/);
  assert.match(refreshBlock[0], /if \(terrainTileReferenceLayerCache\.has\(tile\.id\)\) \{/);
  assert.match(refreshBlock[0], /scheduleCachedTerrainTileReferenceLayerRestore\(tile\)/);
  assert.match(schedulerBlock[0], /runTerrainTileReferenceLayerStage\(tile, token\)/);
  assert.match(stageBlock[0], /cacheActiveTerrainTileReferenceLayers\(\)/);
  assert.doesNotMatch(restoreBlock[0], /createTerrainDetailTileContours\(tile\)/);
  assert.doesNotMatch(restoreBlock[0], /createTerrainDetailTileBoundaries\(tile\)/);
  assert.doesNotMatch(restoreBlock[0], /createTerrainDetailTileWaterReferences\(tile\)/);
  assert.doesNotMatch(restoreBlock[0], /createTerrainDetailTileTraceGuides\(tile\)/);
  assert.match(restoreBlock[0], /applyTerrainDetailTileLayerVisibility\(\)/);
  assert.doesNotMatch(restoreBlock[0], /applyLayerVisibility\(\)/);
  assert.match(runtime, /window\.requestAnimationFrame\(\(\) => \{[\s\S]+restoreTerrainTileReferenceLayersFromCache\(tile, \{ lightweight: true \}\)/);
  const cachedRestoreScheduler = runtime.match(/function scheduleCachedTerrainTileReferenceLayerRestore\(tile\) \{[\s\S]+?\n  \}/);
  assert.ok(cachedRestoreScheduler, "missing cached reference restore scheduler");
  assert.match(cachedRestoreScheduler[0], /syncTerrainTileInspectStatus\(tile\)/);
  assert.doesNotMatch(cachedRestoreScheduler[0], /syncTerrainDetailTileSurfaceDebugState\(\)/);
  assert.match(script, /terrainTileCacheReturnDurationMs/);
  assert.match(script, /terrainTileCacheReturnReferencesReady/);
  assert.match(script, /Expected cached DEM tile return to show surface quickly and restore reference layers/);
});

test("runtime caches generated DEM tile surfaces when returning to an inspected tile", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const refreshBlock = runtime.match(/function refreshSelectedTerrainTileSurface\(tile\) \{[\s\S]+?\n  \}/);
  const focusBlock = runtime.match(/function focusOnTerrainTile\(tileId\) \{[\s\S]+?\n  \}/);
  const restoreBlock = runtime.match(/function restoreTerrainTileSurfaceFromCache\(tile\) \{[\s\S]+?\n  \}/);
  const panelSchedulerBlock = runtime.match(/function scheduleSelectedTerrainTilePanelRefresh\(tileId\) \{[\s\S]+?\n  \}/);

  assert.match(runtime, /const terrainTileSurfaceCache = new Map\(\)/);
  assert.match(runtime, /function cacheActiveTerrainTileSurface\(\)/);
  assert.match(runtime, /function restoreTerrainTileSurfaceFromCache\(tile\)/);
  assert.ok(refreshBlock, "missing DEM tile surface refresh function");
  assert.ok(restoreBlock, "missing DEM tile surface cache restore function");
  assert.match(refreshBlock[0], /cacheActiveTerrainTileSurface\(\)/);
  assert.match(refreshBlock[0], /if \(restoreTerrainTileSurfaceFromCache\(tile\)\) \{/);
  assert.match(refreshBlock[0], /const mesh = createTerrainDetailTileSurface\(tile\)/);
  assert.doesNotMatch(restoreBlock[0], /createTerrainDetailTileSurface\(tile\)/);
  assert.ok(focusBlock, "missing DEM tile focus function");
  assert.match(focusBlock[0], /terrainTileSurfaceCache\.has\(tile\.id\)/);
  assert.match(focusBlock[0], /scheduleSelectedTerrainTilePanelRefresh\(tile\.id\)/);
  assert.ok(panelSchedulerBlock, "missing selected DEM tile panel refresh scheduler");
  assert.match(panelSchedulerBlock[0], /window\.requestAnimationFrame\(\(\) => \{[\s\S]+renderTerrainTileButtons\(\)/);
  assert.ok(
    focusBlock[0].indexOf("terrainTileSurfaceCache.has(tile.id)") < focusBlock[0].indexOf("ensureTerrainDetailTileLoaded(tile.id)"),
    "cached DEM tile return should restore before async tile loading"
  );
});

test("runtime defers selected DEM tile panel rebuilds while high resolution terrain loads", () => {
  const runtime = fs.readFileSync(path.join(__dirname, "world-map.js"), "utf8");
  const focusBlock = runtime.match(/function focusOnTerrainTile\(tileId\) \{[\s\S]+?\n  \}/);
  const schedulerBlock = runtime.match(/function scheduleSelectedTerrainTilePanelRefresh\(tileId\) \{[\s\S]+?\n  \}/);
  const script = fs.readFileSync(path.join(__dirname, "scripts", "verify-patch-console-ui.js"), "utf8");

  assert.match(runtime, /let selectedTerrainTilePanelFrame = 0/);
  assert.match(runtime, /function scheduleSelectedTerrainTilePanelRefresh\(tileId\)/);
  assert.ok(focusBlock, "missing DEM tile focus function");
  assert.ok(schedulerBlock, "missing selected DEM tile panel scheduler");
  assert.match(focusBlock[0], /syncTerrainTileInspectStatus\(tile\)/);
  assert.match(focusBlock[0], /scheduleSelectedTerrainTilePanelRefresh\(tile\.id\)/);
  assert.match(focusBlock[0], /scheduleSelectedTerrainTilePanelRefresh\(loadedTile\.id\)/);
  assert.doesNotMatch(focusBlock[0], /updateSelectedPanel\(\);\s+ensureTerrainDetailTileLoaded\(tile\.id\)/);
  assert.match(schedulerBlock[0], /window\.cancelAnimationFrame\(selectedTerrainTilePanelFrame\)/);
  assert.match(schedulerBlock[0], /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(schedulerBlock[0], /selectedTerrainTileId === tileId/);
  assert.match(schedulerBlock[0], /container\.dataset\.terrainTilePanelRefreshPending = "true"/);
  assert.match(schedulerBlock[0], /container\.dataset\.terrainTilePanelRefreshPending = "false"/);
  assert.match(schedulerBlock[0], /updateSelectedPanel\(\)/);
  assert.match(schedulerBlock[0], /renderTerrainTileButtons\(\)/);
  assert.match(script, /terrainTilePanelRefreshPending/);
});

test("promotion script exists for reviewed trace candidates without overwriting active detail patches by default", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const script = fs.readFileSync(path.join(__dirname, "scripts", "promote-trace-patch-suggestions.js"), "utf8");

  assert.match(packageJson.scripts["terrain:promote"], /promote-trace-patch-suggestions\.js/);
  assert.match(script, /china-approved-detail-patches\.json/);
  assert.doesNotMatch(script, /const OUTPUT_PATH = .*china-detail-patches\.json/);
});

test("mobile terrain panel is constrained for dense tracing controls", () => {
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const mobileBlock = css.match(/@media \(max-width: 760px\) \{[\s\S]+?\n\}/);

  assert.ok(mobileBlock, "missing mobile media query");
  assert.ok(mobileBlock[0].includes("max-height: calc(100vh - 90px);"));
  assert.ok(mobileBlock[0].includes("overflow-y: auto;"));
  assert.ok(mobileBlock[0].includes("overscroll-behavior: contain;"));
});

test("desktop terrain panel remains scrollable when tracing controls are dense", () => {
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");
  const panelBlock = css.match(/\.atlas-panel \{[\s\S]+?\n\}/);

  assert.ok(panelBlock, "missing atlas panel block");
  assert.ok(panelBlock[0].includes("top: 112px;"));
  assert.ok(panelBlock[0].includes("max-height: calc(100vh - 136px);"));
  assert.ok(panelBlock[0].includes("overflow-y: auto;"));
});

test("trace elevation profile has compact chart styling", () => {
  const css = fs.readFileSync(path.join(__dirname, "world-map.css"), "utf8");

  assert.match(css, /\.trace-profile \{/);
  assert.match(css, /\.trace-profile-line/);
  assert.match(css, /\.trace-profile-marker-high/);
  assert.match(css, /\.trace-profile-marker-low/);
});

test("terrain blocks are positioned from researched China physical geography", () => {
  assert.ok(FIVE_TERRAIN_BLOCKS.length >= 8);
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qinghai-tibet-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "gannan-aba-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "southeast-tibet-gorges"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "himalaya-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "kunlun-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "tarim-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "junggar-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "ili-valley"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "altai-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "tian-shan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "turpan-hami-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qilian-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qaidam-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "dehong-river-valleys"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hengduan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "liangshan-panxi-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qinling-daba-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "longmen-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "minshan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "three-gorges-wushan-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "han-river-valley"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "chengdu-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "central-sichuan-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "eastern-sichuan-parallel-ridge-valleys"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hanzhong-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "ankang-han-river-valley"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "daba-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "western-henan-funiu-songshan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "nanyang-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "tongbai-dabie-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "wumeng-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "western-yunnan-mountain-valleys"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "southern-yunnan-valleys"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "red-river-ailao-valley"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "southeast-yunnan-karst-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qiandongnan-miaoling-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qianzhong-karst-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qianbei-dalou-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qianxinan-karst-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "qiannan-karst-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "guanzhong-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "nanling-mountains"));
  assert.equal(
    FIVE_TERRAIN_BLOCKS.some((block) => block.id === "tarim-junggar-basins"),
    false
  );
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "inner-mongolia-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "loess-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "yan-taihang-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hebei-bashang-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "liaoxi-yanshan-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "datong-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xinding-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taiyuan-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "linfen-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "yuncheng-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "yangquan-shouyang-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "shangdang-changzhi-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "luliang-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "zhongtiao-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "jiaodong-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "luzhongnan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "shandong-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "liaodong-hills"));
  assert.equal(
    FIVE_TERRAIN_BLOCKS.some((block) => block.id === "inner-mongolia-loess-plateaus"),
    false
  );
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "northeast-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "songnen-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "sanjiang-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "liaohe-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hulunbuir-grassland-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "greater-khingan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "lesser-khingan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "changbai-volcanic-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "yanbian-tumen-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "mudanjiang-valley-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "zhangguangcai-laoye-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "liaoxi-corridor-coastal-lowlands"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "north-china-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "middle-lower-yangtze-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "jianghuai-lixiahe-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "huanghuai-north-jiangsu-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "lianyungang-yuntai-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xuzhou-low-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "ningzhen-maoshan-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "yili-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taihu-yangtze-delta-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "wanxi-jianghuai-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hefei-chaohu-low-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "wuling-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xuefeng-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xiangjiang-changzhutan-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xiangzhong-hills-basins"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "xiangnan-hills-basins"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "luoxiao-wugong-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "dabie-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "lushan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "poyang-lake-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "huaiyu-xinjiang-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "wannan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hexi-corridor"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "alxa-plateau-desert"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "ordos-maowusu-plateau"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "ningxia-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hetao-tumochuan-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "jiangnan-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hangjiahu-ningshao-plains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "tianmu-mogan-fuchun-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "kuaiji-siming-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "zhezhong-zhenan-hills-basins"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "southeast-hills"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "fujian-zhejiang-coastal-lowlands"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "pearl-river-delta-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "chaoshan-coastal-plain"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "west-guangdong-leizhou-lowlands"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "beibu-gulf-coastal-lowlands"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "southeast-guangxi-hills-basins"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taipei-basin"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taiwan-western-plains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taiwan-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "taiwan-east-coast-valley"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hainan-coastal-lowlands"));
  assert.ok(FIVE_TERRAIN_BLOCKS.some((block) => block.id === "hainan-central-mountains"));
  assert.ok(FIVE_TERRAIN_BLOCKS.every((block) => block.polygon.length >= 4));
  assert.ok(FIVE_TERRAIN_BLOCKS.every((block) => isInRegion(block.center, CHINA_REGION)));
});

test("terrain block polygons cover known physical geography anchor points", () => {
  const anchors = [
    { id: "kashgar", expectedBlockId: "tarim-basin", point: { lat: 39.47, lng: 75.99 } },
    { id: "korla", expectedBlockId: "tarim-basin", point: { lat: 41.73, lng: 86.17 } },
    { id: "kunlun-pass", expectedBlockId: "kunlun-mountains", point: { lat: 35.62, lng: 94.06 } },
    { id: "yutian-kunlun-front", expectedBlockId: "kunlun-mountains", point: { lat: 36.86, lng: 81.67 } },
    { id: "karamay", expectedBlockId: "junggar-basin", point: { lat: 45.58, lng: 84.89 } },
    { id: "urumqi", expectedBlockId: "junggar-basin", point: { lat: 43.82, lng: 87.62 } },
    { id: "bole", expectedBlockId: "junggar-basin", point: { lat: 44.90, lng: 82.07 } },
    { id: "yining", expectedBlockId: "ili-valley", point: { lat: 43.91, lng: 81.32 } },
    { id: "huocheng", expectedBlockId: "ili-valley", point: { lat: 44.05, lng: 80.87 } },
    { id: "khorgos", expectedBlockId: "ili-valley", point: { lat: 44.22, lng: 80.42 } },
    { id: "zhaosu", expectedBlockId: "ili-valley", point: { lat: 43.15, lng: 81.13 } },
    { id: "tekes", expectedBlockId: "ili-valley", point: { lat: 43.22, lng: 81.84 } },
    { id: "xinyuan", expectedBlockId: "ili-valley", point: { lat: 43.43, lng: 83.26 } },
    { id: "nalati", expectedBlockId: "ili-valley", point: { lat: 43.25, lng: 84.00 } },
    { id: "altay-city", expectedBlockId: "altai-mountains", point: { lat: 47.85, lng: 88.13 } },
    { id: "koktokay", expectedBlockId: "altai-mountains", point: { lat: 47.22, lng: 89.52 } },
    { id: "tianchi", expectedBlockId: "tian-shan-mountains", point: { lat: 43.88, lng: 88.13 } },
    { id: "turpan", expectedBlockId: "turpan-hami-basin", point: { lat: 42.95, lng: 89.18 } },
    { id: "hami", expectedBlockId: "turpan-hami-basin", point: { lat: 42.82, lng: 93.52 } },
    { id: "qilian-county", expectedBlockId: "qilian-mountains", point: { lat: 38.18, lng: 100.24 } },
    { id: "golmud", expectedBlockId: "qaidam-basin", point: { lat: 36.41, lng: 94.90 } },
    { id: "delingha", expectedBlockId: "qaidam-basin", point: { lat: 37.37, lng: 97.37 } },
    { id: "kangding", expectedBlockId: "hengduan-mountains", point: { lat: 30.05, lng: 101.96 } },
    { id: "shangri-la", expectedBlockId: "hengduan-mountains", point: { lat: 27.83, lng: 99.71 } },
    { id: "wenchuan", expectedBlockId: "longmen-mountains", point: { lat: 31.48, lng: 103.59 } },
    { id: "beichuan", expectedBlockId: "longmen-mountains", point: { lat: 31.83, lng: 104.45 } },
    { id: "maoxian", expectedBlockId: "longmen-mountains", point: { lat: 31.68, lng: 103.85 } },
    { id: "songpan", expectedBlockId: "minshan-mountains", point: { lat: 32.64, lng: 103.60 } },
    { id: "jiuzhaigou", expectedBlockId: "minshan-mountains", point: { lat: 33.26, lng: 104.24 } },
    { id: "huanglong", expectedBlockId: "minshan-mountains", point: { lat: 32.75, lng: 103.83 } },
    { id: "qomolangma", expectedBlockId: "himalaya-mountains", point: { lat: 27.99, lng: 86.93 } },
    { id: "nyalam", expectedBlockId: "himalaya-mountains", point: { lat: 28.16, lng: 85.98 } },
    { id: "lhasa", expectedBlockId: "qinghai-tibet-plateau", point: { lat: 29.65, lng: 91.13 } },
    { id: "shigatse", expectedBlockId: "qinghai-tibet-plateau", point: { lat: 29.27, lng: 88.88 } },
    { id: "aba-county", expectedBlockId: "gannan-aba-plateau", point: { lat: 32.90, lng: 101.70 } },
    { id: "maerkang", expectedBlockId: "gannan-aba-plateau", point: { lat: 31.90, lng: 102.22 } },
    { id: "hongyuan", expectedBlockId: "gannan-aba-plateau", point: { lat: 32.79, lng: 102.54 } },
    { id: "ruoergai", expectedBlockId: "gannan-aba-plateau", point: { lat: 33.58, lng: 102.96 } },
    { id: "hezuo", expectedBlockId: "gannan-aba-plateau", point: { lat: 35.00, lng: 102.91 } },
    { id: "nyingchi", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.65, lng: 94.36 } },
    { id: "bomi", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.86, lng: 95.77 } },
    { id: "medog", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.33, lng: 95.33 } },
    { id: "mainling", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.21, lng: 94.21 } },
    { id: "yarlung-tsangpo-canyon", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.62, lng: 95.05 } },
    { id: "xining", expectedBlockId: "qinghai-tibet-plateau", point: { lat: 36.62, lng: 101.78 } },
    { id: "ruili", expectedBlockId: "dehong-river-valleys", point: { lat: 24.01, lng: 97.85 } },
    { id: "longchuan", expectedBlockId: "dehong-river-valleys", point: { lat: 24.18, lng: 97.79 } },
    { id: "mangshi", expectedBlockId: "dehong-river-valleys", point: { lat: 24.43, lng: 98.58 } },
    { id: "yingjiang", expectedBlockId: "dehong-river-valleys", point: { lat: 24.70, lng: 97.93 } },
    { id: "dunhuang", expectedBlockId: "hexi-corridor", point: { lat: 40.14, lng: 94.66 } },
    { id: "jiayuguan", expectedBlockId: "hexi-corridor", point: { lat: 39.77, lng: 98.29 } },
    { id: "zhangye", expectedBlockId: "hexi-corridor", point: { lat: 38.93, lng: 100.45 } },
    { id: "wuwei", expectedBlockId: "hexi-corridor", point: { lat: 37.93, lng: 102.64 } },
    { id: "yongchang", expectedBlockId: "hexi-corridor", point: { lat: 38.24, lng: 101.97 } },
    { id: "alxa-left-banner", expectedBlockId: "alxa-plateau-desert", point: { lat: 38.83, lng: 105.67 } },
    { id: "ordos", expectedBlockId: "ordos-maowusu-plateau", point: { lat: 39.61, lng: 109.78 } },
    { id: "dongsheng", expectedBlockId: "ordos-maowusu-plateau", point: { lat: 39.82, lng: 109.98 } },
    { id: "maowusu-desert", expectedBlockId: "ordos-maowusu-plateau", point: { lat: 38.90, lng: 109.20 } },
    { id: "yinchuan", expectedBlockId: "ningxia-plain", point: { lat: 38.49, lng: 106.23 } },
    { id: "wuzhong", expectedBlockId: "ningxia-plain", point: { lat: 37.99, lng: 106.20 } },
    { id: "shizuishan", expectedBlockId: "ningxia-plain", point: { lat: 39.02, lng: 106.38 } },
    { id: "linhe-bayannur", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.75, lng: 107.40 } },
    { id: "wuyuan-bayannur", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 41.10, lng: 108.27 } },
    { id: "baotou", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.66, lng: 109.84 } },
    { id: "hohhot", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.82, lng: 111.75 } },
    { id: "togtoh-yellow-river", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.28, lng: 111.18 } },
    { id: "chengdu", expectedBlockId: "chengdu-plain", point: { lat: 30.67, lng: 104.06 } },
    { id: "deyang", expectedBlockId: "chengdu-plain", point: { lat: 31.13, lng: 104.40 } },
    { id: "mianyang", expectedBlockId: "chengdu-plain", point: { lat: 31.47, lng: 104.68 } },
    { id: "meishan", expectedBlockId: "chengdu-plain", point: { lat: 30.08, lng: 103.85 } },
    { id: "neijiang", expectedBlockId: "central-sichuan-hills", point: { lat: 29.58, lng: 105.06 } },
    { id: "zigong", expectedBlockId: "central-sichuan-hills", point: { lat: 29.34, lng: 104.78 } },
    { id: "suining", expectedBlockId: "central-sichuan-hills", point: { lat: 30.53, lng: 105.59 } },
    { id: "nanchong", expectedBlockId: "central-sichuan-hills", point: { lat: 30.84, lng: 106.11 } },
    { id: "chongqing", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 29.56, lng: 106.55 } },
    { id: "guangan", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 30.46, lng: 106.63 } },
    { id: "dazhou", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 31.21, lng: 107.50 } },
    { id: "wanzhou", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 30.81, lng: 108.38 } },
    { id: "yaan", expectedBlockId: "sichuan-basin", point: { lat: 29.98, lng: 103.01 } },
    { id: "xichang", expectedBlockId: "liangshan-panxi-mountains", point: { lat: 27.89, lng: 102.26 } },
    { id: "panzhihua", expectedBlockId: "liangshan-panxi-mountains", point: { lat: 26.58, lng: 101.72 } },
    { id: "zhaotong", expectedBlockId: "wumeng-mountains", point: { lat: 27.34, lng: 103.72 } },
    { id: "weining", expectedBlockId: "wumeng-mountains", point: { lat: 26.86, lng: 104.28 } },
    { id: "liupanshui", expectedBlockId: "wumeng-mountains", point: { lat: 26.59, lng: 104.83 } },
    { id: "bijie", expectedBlockId: "wumeng-mountains", point: { lat: 27.30, lng: 105.29 } },
    { id: "huize", expectedBlockId: "wumeng-mountains", point: { lat: 26.42, lng: 103.30 } },
    { id: "qiaojia", expectedBlockId: "wumeng-mountains", point: { lat: 26.91, lng: 102.93 } },
    { id: "yongshan", expectedBlockId: "wumeng-mountains", point: { lat: 28.23, lng: 103.64 } },
    { id: "kunming", expectedBlockId: "yunnan-guizhou-plateau", point: { lat: 25.04, lng: 102.72 } },
    { id: "qujing", expectedBlockId: "yunnan-guizhou-plateau", point: { lat: 25.49, lng: 103.80 } },
    { id: "chuxiong", expectedBlockId: "yunnan-guizhou-plateau", point: { lat: 25.04, lng: 101.55 } },
    { id: "lincang", expectedBlockId: "western-yunnan-mountain-valleys", point: { lat: 23.88, lng: 100.09 } },
    { id: "cangyuan", expectedBlockId: "western-yunnan-mountain-valleys", point: { lat: 23.15, lng: 99.25 } },
    { id: "puer", expectedBlockId: "southern-yunnan-valleys", point: { lat: 22.78, lng: 100.97 } },
    { id: "jinghong", expectedBlockId: "southern-yunnan-valleys", point: { lat: 22.01, lng: 100.80 } },
    { id: "mengla", expectedBlockId: "southern-yunnan-valleys", point: { lat: 21.48, lng: 101.56 } },
    { id: "yuanyang", expectedBlockId: "red-river-ailao-valley", point: { lat: 23.22, lng: 102.84 } },
    { id: "jinping", expectedBlockId: "red-river-ailao-valley", point: { lat: 22.78, lng: 103.23 } },
    { id: "pingbian", expectedBlockId: "red-river-ailao-valley", point: { lat: 22.99, lng: 103.69 } },
    { id: "hekou", expectedBlockId: "red-river-ailao-valley", point: { lat: 22.53, lng: 103.96 } },
    { id: "wenshan", expectedBlockId: "southeast-yunnan-karst-plateau", point: { lat: 23.37, lng: 104.25 } },
    { id: "yanshan-yunnan", expectedBlockId: "southeast-yunnan-karst-plateau", point: { lat: 23.62, lng: 104.34 } },
    { id: "qiubei", expectedBlockId: "southeast-yunnan-karst-plateau", point: { lat: 24.04, lng: 104.19 } },
    { id: "guiyang", expectedBlockId: "qianzhong-karst-plateau", point: { lat: 26.65, lng: 106.63 } },
    { id: "anshun", expectedBlockId: "qianzhong-karst-plateau", point: { lat: 26.25, lng: 105.93 } },
    { id: "qingzhen", expectedBlockId: "qianzhong-karst-plateau", point: { lat: 26.56, lng: 106.47 } },
    { id: "zunyi", expectedBlockId: "qianbei-dalou-mountains", point: { lat: 27.73, lng: 106.93 } },
    { id: "loushan-pass", expectedBlockId: "qianbei-dalou-mountains", point: { lat: 28.13, lng: 106.88 } },
    { id: "xingyi", expectedBlockId: "qianxinan-karst-plateau", point: { lat: 25.09, lng: 104.90 } },
    { id: "panxian", expectedBlockId: "qianxinan-karst-plateau", point: { lat: 25.71, lng: 104.47 } },
    { id: "duyun", expectedBlockId: "qiannan-karst-hills", point: { lat: 26.26, lng: 107.52 } },
    { id: "libo", expectedBlockId: "qiannan-karst-hills", point: { lat: 25.42, lng: 107.88 } },
    { id: "kaili", expectedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 26.57, lng: 107.98 } },
    { id: "leishan", expectedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 26.38, lng: 108.08 } },
    { id: "rongjiang", expectedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 25.93, lng: 108.52 } },
    { id: "congjiang", expectedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 25.75, lng: 108.91 } },
    { id: "liping", expectedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 26.23, lng: 109.14 } },
    { id: "lanzhou", expectedBlockId: "loess-plateau", point: { lat: 36.06, lng: 103.83 } },
    { id: "datong", expectedBlockId: "datong-basin", point: { lat: 40.08, lng: 113.30 } },
    { id: "xinzhou", expectedBlockId: "xinding-basin", point: { lat: 38.42, lng: 112.73 } },
    { id: "dingxiang", expectedBlockId: "xinding-basin", point: { lat: 38.48, lng: 112.96 } },
    { id: "taiyuan", expectedBlockId: "taiyuan-basin", point: { lat: 37.87, lng: 112.55 } },
    { id: "jinzhong-yuci", expectedBlockId: "taiyuan-basin", point: { lat: 37.69, lng: 112.74 } },
    { id: "taigu", expectedBlockId: "taiyuan-basin", point: { lat: 37.42, lng: 112.55 } },
    { id: "linfen", expectedBlockId: "linfen-basin", point: { lat: 36.08, lng: 111.52 } },
    { id: "hongtong", expectedBlockId: "linfen-basin", point: { lat: 36.25, lng: 111.67 } },
    { id: "houma", expectedBlockId: "linfen-basin", point: { lat: 35.62, lng: 111.37 } },
    { id: "yuncheng", expectedBlockId: "yuncheng-basin", point: { lat: 35.03, lng: 111.00 } },
    { id: "yongji", expectedBlockId: "yuncheng-basin", point: { lat: 34.87, lng: 110.45 } },
    { id: "yangquan", expectedBlockId: "yangquan-shouyang-basin", point: { lat: 37.86, lng: 113.58 } },
    { id: "shouyang", expectedBlockId: "yangquan-shouyang-basin", point: { lat: 37.89, lng: 113.18 } },
    { id: "changzhi", expectedBlockId: "shangdang-changzhi-basin", point: { lat: 36.20, lng: 113.12 } },
    { id: "lucheng", expectedBlockId: "shangdang-changzhi-basin", point: { lat: 36.33, lng: 113.23 } },
    { id: "lvliang", expectedBlockId: "luliang-mountains", point: { lat: 37.52, lng: 111.14 } },
    { id: "guandi-mountain", expectedBlockId: "luliang-mountains", point: { lat: 37.83, lng: 111.47 } },
    { id: "zhongtiao", expectedBlockId: "zhongtiao-mountains", point: { lat: 35.25, lng: 111.75 } },
    { id: "chengde", expectedBlockId: "yan-taihang-mountains", point: { lat: 40.95, lng: 117.96 } },
    { id: "zhangjiakou", expectedBlockId: "yan-taihang-mountains", point: { lat: 40.77, lng: 114.89 } },
    { id: "zhangbei", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.16, lng: 114.72 } },
    { id: "kangbao", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.85, lng: 114.60 } },
    { id: "guyuan-hebei", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.67, lng: 115.68 } },
    { id: "fengning", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.21, lng: 116.65 } },
    { id: "weichang", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.94, lng: 117.76 } },
    { id: "saihanba", expectedBlockId: "hebei-bashang-plateau", point: { lat: 42.41, lng: 117.26 } },
    { id: "wutaishan", expectedBlockId: "yan-taihang-mountains", point: { lat: 39.00, lng: 113.59 } },
    { id: "chifeng", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 42.26, lng: 118.89 } },
    { id: "ningcheng", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 41.60, lng: 119.33 } },
    { id: "jianping", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 41.40, lng: 119.64 } },
    { id: "lingyuan", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 41.24, lng: 119.40 } },
    { id: "chaoyang-liaoning", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 41.57, lng: 120.45 } },
    { id: "fuxin", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 42.02, lng: 121.67 } },
    { id: "xian", expectedBlockId: "guanzhong-plain", point: { lat: 34.34, lng: 108.94 } },
    { id: "xianyang", expectedBlockId: "guanzhong-plain", point: { lat: 34.33, lng: 108.71 } },
    { id: "weinan", expectedBlockId: "guanzhong-plain", point: { lat: 34.50, lng: 109.51 } },
    { id: "baoji", expectedBlockId: "guanzhong-plain", point: { lat: 34.36, lng: 107.24 } },
    { id: "taibai-mountain", expectedBlockId: "qinling-daba-mountains", point: { lat: 34.00, lng: 107.75 } },
    { id: "foping", expectedBlockId: "qinling-daba-mountains", point: { lat: 33.52, lng: 107.99 } },
    { id: "hanzhong", expectedBlockId: "hanzhong-basin", point: { lat: 33.07, lng: 107.02 } },
    { id: "mianxian", expectedBlockId: "hanzhong-basin", point: { lat: 33.15, lng: 106.68 } },
    { id: "chenggu", expectedBlockId: "hanzhong-basin", point: { lat: 33.15, lng: 107.33 } },
    { id: "yangxian", expectedBlockId: "hanzhong-basin", point: { lat: 33.22, lng: 107.55 } },
    { id: "shiquan", expectedBlockId: "ankang-han-river-valley", point: { lat: 33.04, lng: 108.25 } },
    { id: "ankang", expectedBlockId: "ankang-han-river-valley", point: { lat: 32.69, lng: 109.03 } },
    { id: "xunyang", expectedBlockId: "ankang-han-river-valley", point: { lat: 32.83, lng: 109.36 } },
    { id: "zhenba", expectedBlockId: "daba-mountains", point: { lat: 32.54, lng: 107.90 } },
    { id: "ningqiang", expectedBlockId: "daba-mountains", point: { lat: 32.83, lng: 106.25 } },
    { id: "dabashan", expectedBlockId: "daba-mountains", point: { lat: 32.40, lng: 108.35 } },
    { id: "luoyang", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.62, lng: 112.45 } },
    { id: "songshan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.51, lng: 113.00 } },
    { id: "dengfeng", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.45, lng: 113.03 } },
    { id: "luanchuan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 33.78, lng: 111.62 } },
    { id: "funiushan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 33.70, lng: 111.80 } },
    { id: "xixia", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 33.31, lng: 111.48 } },
    { id: "nanyang", expectedBlockId: "nanyang-basin", point: { lat: 32.99, lng: 112.53 } },
    { id: "neixiang", expectedBlockId: "nanyang-basin", point: { lat: 33.05, lng: 111.85 } },
    { id: "xinyang", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 32.15, lng: 114.09 } },
    { id: "tongbai", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 32.38, lng: 113.40 } },
    { id: "jigongshan", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 31.81, lng: 114.09 } },
    { id: "shennongjia", expectedBlockId: "qinling-daba-mountains", point: { lat: 31.74, lng: 110.68 } },
    { id: "badong", expectedBlockId: "three-gorges-wushan-hills", point: { lat: 31.04, lng: 110.34 } },
    { id: "zigui", expectedBlockId: "three-gorges-wushan-hills", point: { lat: 30.83, lng: 110.98 } },
    { id: "yichang", expectedBlockId: "three-gorges-wushan-hills", point: { lat: 30.69, lng: 111.29 } },
    { id: "danjiangkou", expectedBlockId: "han-river-valley", point: { lat: 32.54, lng: 111.51 } },
    { id: "xiangyang", expectedBlockId: "han-river-valley", point: { lat: 32.01, lng: 112.12 } },
    { id: "tianjin", expectedBlockId: "north-china-plain", point: { lat: 39.12, lng: 117.20 } },
    { id: "tangshan", expectedBlockId: "north-china-plain", point: { lat: 39.63, lng: 118.18 } },
    { id: "jinzhou", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 41.10, lng: 121.13 } },
    { id: "huludao", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 40.71, lng: 120.84 } },
    { id: "xingcheng", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 40.62, lng: 120.73 } },
    { id: "suizhong", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 40.33, lng: 120.34 } },
    { id: "shanhaiguan", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 40.00, lng: 119.75 } },
    { id: "qinhuangdao", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 39.94, lng: 119.60 } },
    { id: "beidaihe", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 39.83, lng: 119.48 } },
    { id: "baoding", expectedBlockId: "north-china-plain", point: { lat: 38.87, lng: 115.46 } },
    { id: "shijiazhuang", expectedBlockId: "north-china-plain", point: { lat: 38.04, lng: 114.51 } },
    { id: "jinan", expectedBlockId: "shandong-hills", point: { lat: 36.65, lng: 117.12 } },
    { id: "qingdao", expectedBlockId: "jiaodong-hills", point: { lat: 36.07, lng: 120.38 } },
    { id: "laoshan", expectedBlockId: "jiaodong-hills", point: { lat: 36.18, lng: 120.60 } },
    { id: "yantai", expectedBlockId: "jiaodong-hills", point: { lat: 37.46, lng: 121.45 } },
    { id: "weihai", expectedBlockId: "jiaodong-hills", point: { lat: 37.51, lng: 122.12 } },
    { id: "taishan", expectedBlockId: "luzhongnan-mountains", point: { lat: 36.25, lng: 117.10 } },
    { id: "laiwu", expectedBlockId: "luzhongnan-mountains", point: { lat: 36.21, lng: 117.67 } },
    { id: "yimengshan", expectedBlockId: "luzhongnan-mountains", point: { lat: 35.55, lng: 118.17 } },
    { id: "linyi", expectedBlockId: "luzhongnan-mountains", point: { lat: 35.10, lng: 118.36 } },
    { id: "harbin", expectedBlockId: "songnen-plain", point: { lat: 45.75, lng: 126.64 } },
    { id: "shenyang", expectedBlockId: "liaohe-plain", point: { lat: 41.80, lng: 123.43 } },
    { id: "liaoyang", expectedBlockId: "liaohe-plain", point: { lat: 41.27, lng: 123.17 } },
    { id: "anshan", expectedBlockId: "liaohe-plain", point: { lat: 41.10, lng: 122.99 } },
    { id: "panjin", expectedBlockId: "liaohe-plain", point: { lat: 41.12, lng: 122.07 } },
    { id: "yingkou", expectedBlockId: "liaohe-plain", point: { lat: 40.67, lng: 122.24 } },
    { id: "benxi", expectedBlockId: "liaodong-hills", point: { lat: 41.30, lng: 123.76 } },
    { id: "dandong", expectedBlockId: "liaodong-hills", point: { lat: 40.13, lng: 124.38 } },
    { id: "kuandian", expectedBlockId: "liaodong-hills", point: { lat: 40.73, lng: 124.78 } },
    { id: "fengcheng", expectedBlockId: "liaodong-hills", point: { lat: 40.45, lng: 124.07 } },
    { id: "dalian", expectedBlockId: "liaodong-hills", point: { lat: 38.91, lng: 121.61 } },
    { id: "jiamusi", expectedBlockId: "sanjiang-plain", point: { lat: 46.80, lng: 130.32 } },
    { id: "fujin", expectedBlockId: "sanjiang-plain", point: { lat: 47.25, lng: 132.04 } },
    { id: "shenyang", expectedBlockId: "liaohe-plain", point: { lat: 41.80, lng: 123.43 } },
    { id: "yingkou", expectedBlockId: "liaohe-plain", point: { lat: 40.67, lng: 122.24 } },
    { id: "benxi", expectedBlockId: "liaodong-hills", point: { lat: 41.30, lng: 123.76 } },
    { id: "kuandian", expectedBlockId: "liaodong-hills", point: { lat: 40.73, lng: 124.78 } },
    { id: "tongjiang", expectedBlockId: "sanjiang-plain", point: { lat: 47.65, lng: 132.51 } },
    { id: "fuyuan", expectedBlockId: "sanjiang-plain", point: { lat: 48.36, lng: 134.29 } },
    { id: "jiansanjiang", expectedBlockId: "sanjiang-plain", point: { lat: 47.25, lng: 132.62 } },
    { id: "hulunbuir", expectedBlockId: "hulunbuir-grassland-plateau", point: { lat: 49.21, lng: 119.76 } },
    { id: "manzhouli", expectedBlockId: "hulunbuir-grassland-plateau", point: { lat: 49.60, lng: 117.43 } },
    { id: "ergun", expectedBlockId: "hulunbuir-grassland-plateau", point: { lat: 50.24, lng: 120.18 } },
    { id: "yakeshi", expectedBlockId: "greater-khingan-mountains", point: { lat: 49.28, lng: 120.73 } },
    { id: "genhe", expectedBlockId: "greater-khingan-mountains", point: { lat: 50.78, lng: 121.52 } },
    { id: "yichun", expectedBlockId: "lesser-khingan-mountains", point: { lat: 47.72, lng: 128.84 } },
    { id: "mudanjiang", expectedBlockId: "mudanjiang-valley-basin", point: { lat: 44.58, lng: 129.60 } },
    { id: "ningan", expectedBlockId: "mudanjiang-valley-basin", point: { lat: 44.35, lng: 129.47 } },
    { id: "yanji", expectedBlockId: "yanbian-tumen-basin", point: { lat: 42.89, lng: 129.51 } },
    { id: "tumen", expectedBlockId: "yanbian-tumen-basin", point: { lat: 42.97, lng: 129.84 } },
    { id: "hunchun", expectedBlockId: "yanbian-tumen-basin", point: { lat: 42.86, lng: 130.37 } },
    { id: "changbai-mountain", expectedBlockId: "changbai-volcanic-mountains", point: { lat: 42.00, lng: 128.06 } },
    { id: "baishan", expectedBlockId: "changbai-volcanic-mountains", point: { lat: 41.94, lng: 126.42 } },
    { id: "tonghua", expectedBlockId: "changbai-volcanic-mountains", point: { lat: 41.73, lng: 125.94 } },
    { id: "dunhua", expectedBlockId: "zhangguangcai-laoye-mountains", point: { lat: 43.37, lng: 128.23 } },
    { id: "suifenhe", expectedBlockId: "zhangguangcai-laoye-mountains", point: { lat: 44.40, lng: 131.15 } },
    { id: "beijing", expectedBlockId: "north-china-plain", point: { lat: 39.90, lng: 116.40 } },
    { id: "zhengzhou", expectedBlockId: "north-china-plain", point: { lat: 34.75, lng: 113.62 } },
    { id: "fuyang", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 32.89, lng: 115.81 } },
    { id: "bozhou", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.86, lng: 115.78 } },
    { id: "huaibei", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.96, lng: 116.79 } },
    { id: "suzhou-anhui", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.65, lng: 116.96 } },
    { id: "xuzhou", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.26, lng: 117.20 } },
    { id: "suqian", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.96, lng: 118.28 } },
    { id: "lianyungang", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.60, lng: 119.22 } },
    { id: "yuntai-mountain", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.58, lng: 119.30 } },
    { id: "jinping-mountain", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.56, lng: 119.20 } },
    { id: "yunlong-mountain", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.23, lng: 117.20 } },
    { id: "dadong-mountain", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.43, lng: 117.41 } },
    { id: "jiawang", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.43, lng: 117.45 } },
    { id: "bengbu", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.92, lng: 117.38 } },
    { id: "huainan", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.63, lng: 117.00 } },
    { id: "huoqiu", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.35, lng: 116.28 } },
    { id: "shouxian", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.57, lng: 116.78 } },
    { id: "huaian", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.61, lng: 119.02 } },
    { id: "yangzhou", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.39, lng: 119.42 } },
    { id: "yancheng", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.35, lng: 120.16 } },
    { id: "nantong", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 31.98, lng: 120.89 } },
    { id: "zijinshan", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.06, lng: 118.85 } },
    { id: "qixia", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.15, lng: 118.96 } },
    { id: "jurong", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.95, lng: 119.16 } },
    { id: "maoshan", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.78, lng: 119.31 } },
    { id: "yixing", expectedBlockId: "yili-hills", point: { lat: 31.34, lng: 119.82 } },
    { id: "liyang", expectedBlockId: "yili-hills", point: { lat: 31.42, lng: 119.48 } },
    { id: "tianmu-lake", expectedBlockId: "yili-hills", point: { lat: 31.30, lng: 119.43 } },
    { id: "changzhou", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.81, lng: 119.97 } },
    { id: "wuxi", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.49, lng: 120.31 } },
    { id: "suzhou", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.30, lng: 120.58 } },
    { id: "kunshan", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.39, lng: 120.98 } },
    { id: "taicang", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.45, lng: 121.10 } },
    { id: "taihu-lake", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.23, lng: 120.18 } },
    { id: "wuhan", expectedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.59, lng: 114.31 } },
    { id: "jingzhou", expectedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.34, lng: 112.24 } },
    { id: "yueyang", expectedBlockId: "middle-lower-yangtze-plain", point: { lat: 29.37, lng: 113.13 } },
    { id: "nanchang", expectedBlockId: "middle-lower-yangtze-plain", point: { lat: 28.68, lng: 115.86 } },
    { id: "changsha", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 28.23, lng: 112.94 } },
    { id: "zhuzhou", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 27.83, lng: 113.13 } },
    { id: "xiangtan", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 27.83, lng: 112.94 } },
    { id: "shanghai", expectedBlockId: "middle-lower-yangtze-plain", point: { lat: 31.23, lng: 121.47 } },
    { id: "zhangjiajie", expectedBlockId: "wuling-mountains", point: { lat: 29.13, lng: 110.48 } },
    { id: "enshi", expectedBlockId: "wuling-mountains", point: { lat: 30.28, lng: 109.49 } },
    { id: "huaihua", expectedBlockId: "xuefeng-mountains", point: { lat: 27.57, lng: 110.00 } },
    { id: "xupu", expectedBlockId: "xuefeng-mountains", point: { lat: 27.91, lng: 110.59 } },
    { id: "dongkou", expectedBlockId: "xuefeng-mountains", point: { lat: 27.06, lng: 110.58 } },
    { id: "xinhua", expectedBlockId: "xuefeng-mountains", point: { lat: 27.73, lng: 111.30 } },
    { id: "shaoyang", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 27.24, lng: 111.47 } },
    { id: "shaodong", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 27.26, lng: 111.74 } },
    { id: "loudi", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 27.70, lng: 112.00 } },
    { id: "hengyang", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 26.89, lng: 112.57 } },
    { id: "yongzhou", expectedBlockId: "xiangnan-hills-basins", point: { lat: 26.42, lng: 111.61 } },
    { id: "lingling", expectedBlockId: "xiangnan-hills-basins", point: { lat: 26.22, lng: 111.62 } },
    { id: "pingxiang", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.62, lng: 113.85 } },
    { id: "wugongshan", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.47, lng: 114.17 } },
    { id: "yichun-jiangxi", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.81, lng: 114.38 } },
    { id: "fenyi", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.82, lng: 114.68 } },
    { id: "jinggangshan", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 26.75, lng: 114.29 } },
    { id: "lianhua", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.13, lng: 113.95 } },
    { id: "dabie-mountain", expectedBlockId: "dabie-mountains", point: { lat: 31.10, lng: 115.80 } },
    { id: "tiantangzhai", expectedBlockId: "dabie-mountains", point: { lat: 31.11, lng: 115.78 } },
    { id: "jinzhai", expectedBlockId: "dabie-mountains", point: { lat: 31.68, lng: 115.88 } },
    { id: "huoshan", expectedBlockId: "dabie-mountains", point: { lat: 31.40, lng: 116.33 } },
    { id: "yuexi", expectedBlockId: "dabie-mountains", point: { lat: 30.85, lng: 116.36 } },
    { id: "tianzhushan", expectedBlockId: "dabie-mountains", point: { lat: 30.74, lng: 116.45 } },
    { id: "luan", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.75, lng: 116.51 } },
    { id: "shucheng", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.46, lng: 116.94 } },
    { id: "lujiang", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.26, lng: 117.29 } },
    { id: "tongcheng", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.04, lng: 116.95 } },
    { id: "qianshan", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.63, lng: 116.58 } },
    { id: "taihu", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.45, lng: 116.31 } },
    { id: "huaining", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.73, lng: 116.83 } },
    { id: "hefei", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.82, lng: 117.23 } },
    { id: "feixi", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.71, lng: 117.16 } },
    { id: "chaohu", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.60, lng: 117.87 } },
    { id: "lushan", expectedBlockId: "lushan-mountains", point: { lat: 29.55, lng: 115.98 } },
    { id: "nanchang", expectedBlockId: "poyang-lake-plain", point: { lat: 28.68, lng: 115.86 } },
    { id: "poyang-lake", expectedBlockId: "poyang-lake-plain", point: { lat: 29.12, lng: 116.32 } },
    { id: "jiujiang", expectedBlockId: "poyang-lake-plain", point: { lat: 29.70, lng: 116.00 } },
    { id: "yongxiu", expectedBlockId: "poyang-lake-plain", point: { lat: 29.04, lng: 115.82 } },
    { id: "gongqingcheng", expectedBlockId: "poyang-lake-plain", point: { lat: 29.25, lng: 115.81 } },
    { id: "hukou", expectedBlockId: "poyang-lake-plain", point: { lat: 29.73, lng: 116.25 } },
    { id: "duchang", expectedBlockId: "poyang-lake-plain", point: { lat: 29.28, lng: 116.20 } },
    { id: "poyang-county", expectedBlockId: "poyang-lake-plain", point: { lat: 29.00, lng: 116.68 } },
    { id: "wuyuan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 29.25, lng: 117.86 } },
    { id: "sanqingshan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.91, lng: 118.06 } },
    { id: "shangrao", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.45, lng: 117.97 } },
    { id: "yingtan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.24, lng: 117.04 } },
    { id: "guixi", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.29, lng: 117.21 } },
    { id: "longhushan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.08, lng: 116.99 } },
    { id: "hangzhou", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.27, lng: 120.15 } },
    { id: "jiaxing", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.75, lng: 120.76 } },
    { id: "huzhou", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.89, lng: 120.09 } },
    { id: "deqing", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.54, lng: 119.98 } },
    { id: "shaoxing", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.00, lng: 120.58 } },
    { id: "ningbo", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 29.87, lng: 121.55 } },
    { id: "moganshan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.62, lng: 119.87 } },
    { id: "anji", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.64, lng: 119.68 } },
    { id: "linan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.23, lng: 119.72 } },
    { id: "tianmushan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.34, lng: 119.43 } },
    { id: "fuyang-zhejiang", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.05, lng: 119.95 } },
    { id: "tonglu", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 29.80, lng: 119.69 } },
    { id: "zhuji", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.71, lng: 120.23 } },
    { id: "shengzhou", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.59, lng: 120.82 } },
    { id: "xinchang", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.50, lng: 120.90 } },
    { id: "huangshan", expectedBlockId: "wannan-mountains", point: { lat: 30.13, lng: 118.17 } },
    { id: "jiuhuashan", expectedBlockId: "wannan-mountains", point: { lat: 30.48, lng: 117.81 } },
    { id: "shitai", expectedBlockId: "wannan-mountains", point: { lat: 30.21, lng: 117.48 } },
    { id: "qingyang", expectedBlockId: "wannan-mountains", point: { lat: 30.64, lng: 117.84 } },
    { id: "jingxian", expectedBlockId: "wannan-mountains", point: { lat: 30.69, lng: 118.41 } },
    { id: "jixi", expectedBlockId: "wannan-mountains", point: { lat: 30.07, lng: 118.59 } },
    { id: "shexian", expectedBlockId: "wannan-mountains", point: { lat: 29.87, lng: 118.43 } },
    { id: "jingdezhen", expectedBlockId: "jiangnan-hills", point: { lat: 29.27, lng: 117.18 } },
    { id: "quzhou", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 28.97, lng: 118.86 } },
    { id: "jinhua", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 29.08, lng: 119.65 } },
    { id: "lishui", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 28.45, lng: 119.92 } },
    { id: "guilin", expectedBlockId: "guangxi-karst-basin", point: { lat: 25.27, lng: 110.29 } },
    { id: "hechi", expectedBlockId: "guangxi-karst-basin", point: { lat: 24.69, lng: 108.06 } },
    { id: "baise", expectedBlockId: "guangxi-karst-basin", point: { lat: 23.90, lng: 106.62 } },
    { id: "liuzhou", expectedBlockId: "guangxi-karst-basin", point: { lat: 24.33, lng: 109.42 } },
    { id: "nanning", expectedBlockId: "guangxi-karst-basin", point: { lat: 22.82, lng: 108.32 } },
    { id: "wuzhou", expectedBlockId: "southeast-guangxi-hills-basins", point: { lat: 23.48, lng: 111.28 } },
    { id: "yulin-guangxi", expectedBlockId: "southeast-guangxi-hills-basins", point: { lat: 22.65, lng: 110.18 } },
    { id: "qingyuan", expectedBlockId: "nanling-mountains", point: { lat: 23.68, lng: 113.05 } },
    { id: "shaoguan", expectedBlockId: "nanling-mountains", point: { lat: 24.81, lng: 113.60 } },
    { id: "chenzhou", expectedBlockId: "nanling-mountains", point: { lat: 25.77, lng: 113.02 } },
    { id: "wuyishan", expectedBlockId: "southeast-hills", point: { lat: 27.76, lng: 118.04 } },
    { id: "sanming", expectedBlockId: "southeast-hills", point: { lat: 26.26, lng: 117.64 } },
    { id: "longyan", expectedBlockId: "southeast-hills", point: { lat: 25.08, lng: 117.02 } },
    { id: "ganzhou", expectedBlockId: "southeast-hills", point: { lat: 25.83, lng: 114.93 } },
    { id: "fuzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 26.08, lng: 119.30 } },
    { id: "xiamen", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 24.48, lng: 118.08 } },
    { id: "quanzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 24.87, lng: 118.68 } },
    { id: "zhangzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 24.51, lng: 117.66 } },
    { id: "putian", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 25.43, lng: 119.01 } },
    { id: "ningde", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 26.66, lng: 119.52 } },
    { id: "wenzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 27.99, lng: 120.70 } },
    { id: "taizhou-zhejiang", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 28.66, lng: 121.42 } },
    { id: "guangzhou", expectedBlockId: "pearl-river-delta-plain", point: { lat: 23.13, lng: 113.26 } },
    { id: "heyuan", expectedBlockId: "southeast-hills", point: { lat: 23.74, lng: 114.70 } },
    { id: "shantou", expectedBlockId: "chaoshan-coastal-plain", point: { lat: 23.35, lng: 116.68 } },
    { id: "jieyang", expectedBlockId: "chaoshan-coastal-plain", point: { lat: 23.55, lng: 116.37 } },
    { id: "chaozhou", expectedBlockId: "chaoshan-coastal-plain", point: { lat: 23.66, lng: 116.62 } },
    { id: "shanwei", expectedBlockId: "chaoshan-coastal-plain", point: { lat: 22.79, lng: 115.38 } },
    { id: "zhanjiang", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 21.27, lng: 110.36 } },
    { id: "leizhou", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 20.91, lng: 110.09 } },
    { id: "xuwen", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 20.33, lng: 110.17 } },
    { id: "maoming", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 21.66, lng: 110.92 } },
    { id: "yangjiang", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 21.86, lng: 111.98 } },
    { id: "beihai", expectedBlockId: "beibu-gulf-coastal-lowlands", point: { lat: 21.48, lng: 109.12 } },
    { id: "qinzhou", expectedBlockId: "beibu-gulf-coastal-lowlands", point: { lat: 21.98, lng: 108.65 } },
    { id: "fangchenggang", expectedBlockId: "beibu-gulf-coastal-lowlands", point: { lat: 21.61, lng: 108.35 } },
    { id: "taipei", expectedBlockId: "taipei-basin", point: { lat: 25.03, lng: 121.56 } },
    { id: "taoyuan", expectedBlockId: "taiwan-western-plains", point: { lat: 24.99, lng: 121.31 } },
    { id: "taichung", expectedBlockId: "taiwan-western-plains", point: { lat: 24.15, lng: 120.67 } },
    { id: "tainan", expectedBlockId: "taiwan-western-plains", point: { lat: 22.99, lng: 120.21 } },
    { id: "kaohsiung", expectedBlockId: "taiwan-western-plains", point: { lat: 22.63, lng: 120.30 } },
    { id: "hualien", expectedBlockId: "taiwan-east-coast-valley", point: { lat: 23.99, lng: 121.60 } },
    { id: "taitung", expectedBlockId: "taiwan-east-coast-valley", point: { lat: 22.76, lng: 121.14 } },
    { id: "yushan", expectedBlockId: "taiwan-mountains", point: { lat: 23.47, lng: 120.96 } },
    { id: "alishan", expectedBlockId: "taiwan-mountains", point: { lat: 23.51, lng: 120.80 } },
    { id: "xueshan", expectedBlockId: "taiwan-mountains", point: { lat: 24.38, lng: 121.23 } },
    { id: "haikou", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 20.04, lng: 110.32 } },
    { id: "wenchang", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 19.62, lng: 110.75 } },
    { id: "qionghai", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 19.25, lng: 110.47 } },
    { id: "danzhou", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 19.52, lng: 109.58 } },
    { id: "sanya", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 18.25, lng: 109.51 } },
    { id: "dongfang", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 19.10, lng: 108.65 } },
    { id: "wuzhi-mountain", expectedBlockId: "hainan-central-mountains", point: { lat: 18.90, lng: 109.68 } },
    { id: "wuzhishan-city", expectedBlockId: "hainan-central-mountains", point: { lat: 18.78, lng: 109.52 } },
    { id: "baisha", expectedBlockId: "hainan-central-mountains", point: { lat: 19.22, lng: 109.45 } },
    { id: "baoting", expectedBlockId: "hainan-central-mountains", point: { lat: 18.64, lng: 109.70 } },
  ];

  anchors.forEach((anchor) => {
    const matchingBlockIds = FIVE_TERRAIN_BLOCKS
      .filter((block) => isPointInsidePolygon(anchor.point, block.polygon))
      .map((block) => block.id);

    assert.ok(
      matchingBlockIds.includes(anchor.expectedBlockId),
      `${anchor.id} should be inside ${anchor.expectedBlockId}; matched ${matchingBlockIds.join(", ") || "none"}`
    );
  });
});

test("terrain block render priority uses the intended block for overlapping transition anchors", () => {
  const anchors = [
    { id: "beijing", expectedBlockId: "north-china-plain", point: { lat: 39.90, lng: 116.40 } },
    { id: "zhengzhou", expectedBlockId: "north-china-plain", point: { lat: 34.75, lng: 113.62 } },
    { id: "fuyang", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 32.89, lng: 115.81 } },
    { id: "bozhou", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.86, lng: 115.78 } },
    { id: "huaibei", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.96, lng: 116.79 } },
    { id: "suzhou-anhui", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.65, lng: 116.96 } },
    { id: "xuzhou", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.26, lng: 117.20 } },
    { id: "suqian", expectedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.96, lng: 118.28 } },
    { id: "lianyungang", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.60, lng: 119.22 } },
    { id: "yuntai-mountain", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.58, lng: 119.30 } },
    { id: "jinping-mountain", expectedBlockId: "lianyungang-yuntai-mountains", point: { lat: 34.56, lng: 119.20 } },
    { id: "yunlong-mountain", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.23, lng: 117.20 } },
    { id: "dadong-mountain", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.43, lng: 117.41 } },
    { id: "jiawang", expectedBlockId: "xuzhou-low-hills", point: { lat: 34.43, lng: 117.45 } },
    { id: "chengde", expectedBlockId: "yan-taihang-mountains", point: { lat: 40.95, lng: 117.96 } },
    { id: "zhangjiakou", expectedBlockId: "yan-taihang-mountains", point: { lat: 40.77, lng: 114.89 } },
    { id: "zhangbei", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.16, lng: 114.72 } },
    { id: "guyuan-hebei", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.67, lng: 115.68 } },
    { id: "weichang", expectedBlockId: "hebei-bashang-plateau", point: { lat: 41.94, lng: 117.76 } },
    { id: "saihanba", expectedBlockId: "hebei-bashang-plateau", point: { lat: 42.41, lng: 117.26 } },
    { id: "datong", expectedBlockId: "datong-basin", point: { lat: 40.08, lng: 113.30 } },
    { id: "xinzhou", expectedBlockId: "xinding-basin", point: { lat: 38.42, lng: 112.73 } },
    { id: "taiyuan", expectedBlockId: "taiyuan-basin", point: { lat: 37.87, lng: 112.55 } },
    { id: "linfen", expectedBlockId: "linfen-basin", point: { lat: 36.08, lng: 111.52 } },
    { id: "yuncheng", expectedBlockId: "yuncheng-basin", point: { lat: 35.03, lng: 111.00 } },
    { id: "yangquan", expectedBlockId: "yangquan-shouyang-basin", point: { lat: 37.86, lng: 113.58 } },
    { id: "changzhi", expectedBlockId: "shangdang-changzhi-basin", point: { lat: 36.20, lng: 113.12 } },
    { id: "lvliang", expectedBlockId: "luliang-mountains", point: { lat: 37.52, lng: 111.14 } },
    { id: "zhongtiao", expectedBlockId: "zhongtiao-mountains", point: { lat: 35.25, lng: 111.75 } },
    { id: "wutaishan", expectedBlockId: "yan-taihang-mountains", point: { lat: 39.00, lng: 113.59 } },
    { id: "luoyang", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.62, lng: 112.45 } },
    { id: "songshan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.51, lng: 113.00 } },
    { id: "luanchuan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 33.78, lng: 111.62 } },
    { id: "funiushan", expectedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 33.70, lng: 111.80 } },
    { id: "nanyang", expectedBlockId: "nanyang-basin", point: { lat: 32.99, lng: 112.53 } },
    { id: "neixiang", expectedBlockId: "nanyang-basin", point: { lat: 33.05, lng: 111.85 } },
    { id: "xinyang", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 32.15, lng: 114.09 } },
    { id: "tongbai", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 32.38, lng: 113.40 } },
    { id: "jigongshan", expectedBlockId: "tongbai-dabie-mountains", point: { lat: 31.81, lng: 114.09 } },
    { id: "chifeng", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 42.26, lng: 118.89 } },
    { id: "chaoyang-liaoning", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 41.57, lng: 120.45 } },
    { id: "fuxin", expectedBlockId: "liaoxi-yanshan-hills", point: { lat: 42.02, lng: 121.67 } },
    { id: "jinzhou", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 41.10, lng: 121.13 } },
    { id: "huludao", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 40.71, lng: 120.84 } },
    { id: "qinhuangdao", expectedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 39.94, lng: 119.60 } },
    { id: "qingdao", expectedBlockId: "jiaodong-hills", point: { lat: 36.07, lng: 120.38 } },
    { id: "laoshan", expectedBlockId: "jiaodong-hills", point: { lat: 36.18, lng: 120.60 } },
    { id: "yantai", expectedBlockId: "jiaodong-hills", point: { lat: 37.46, lng: 121.45 } },
    { id: "weihai", expectedBlockId: "jiaodong-hills", point: { lat: 37.51, lng: 122.12 } },
    { id: "jinan", expectedBlockId: "shandong-hills", point: { lat: 36.65, lng: 117.12 } },
    { id: "taishan", expectedBlockId: "luzhongnan-mountains", point: { lat: 36.25, lng: 117.10 } },
    { id: "laiwu", expectedBlockId: "luzhongnan-mountains", point: { lat: 36.21, lng: 117.67 } },
    { id: "yimengshan", expectedBlockId: "luzhongnan-mountains", point: { lat: 35.55, lng: 118.17 } },
    { id: "linyi", expectedBlockId: "luzhongnan-mountains", point: { lat: 35.10, lng: 118.36 } },
    { id: "golmud", expectedBlockId: "qaidam-basin", point: { lat: 36.41, lng: 94.90 } },
    { id: "kunlun-pass", expectedBlockId: "kunlun-mountains", point: { lat: 35.62, lng: 94.06 } },
    { id: "altay-city", expectedBlockId: "altai-mountains", point: { lat: 47.85, lng: 88.13 } },
    { id: "yining", expectedBlockId: "ili-valley", point: { lat: 43.91, lng: 81.32 } },
    { id: "khorgos", expectedBlockId: "ili-valley", point: { lat: 44.22, lng: 80.42 } },
    { id: "zhaosu", expectedBlockId: "ili-valley", point: { lat: 43.15, lng: 81.13 } },
    { id: "nalati", expectedBlockId: "ili-valley", point: { lat: 43.25, lng: 84.00 } },
    { id: "qomolangma", expectedBlockId: "himalaya-mountains", point: { lat: 27.99, lng: 86.93 } },
    { id: "lhasa", expectedBlockId: "qinghai-tibet-plateau", point: { lat: 29.65, lng: 91.13 } },
    { id: "nyingchi", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.65, lng: 94.36 } },
    { id: "medog", expectedBlockId: "southeast-tibet-gorges", point: { lat: 29.33, lng: 95.33 } },
    { id: "tianchi", expectedBlockId: "tian-shan-mountains", point: { lat: 43.88, lng: 88.13 } },
    { id: "bogda-peak", expectedBlockId: "tian-shan-mountains", point: { lat: 43.82, lng: 88.33 } },
    { id: "turpan", expectedBlockId: "turpan-hami-basin", point: { lat: 42.95, lng: 89.18 } },
    { id: "hami", expectedBlockId: "turpan-hami-basin", point: { lat: 42.82, lng: 93.52 } },
    { id: "dunhuang", expectedBlockId: "hexi-corridor", point: { lat: 40.14, lng: 94.66 } },
    { id: "jiayuguan", expectedBlockId: "hexi-corridor", point: { lat: 39.77, lng: 98.29 } },
    { id: "wuwei", expectedBlockId: "hexi-corridor", point: { lat: 37.93, lng: 102.64 } },
    { id: "alxa-left-banner", expectedBlockId: "alxa-plateau-desert", point: { lat: 38.83, lng: 105.67 } },
    { id: "ordos", expectedBlockId: "ordos-maowusu-plateau", point: { lat: 39.61, lng: 109.78 } },
    { id: "maowusu-desert", expectedBlockId: "ordos-maowusu-plateau", point: { lat: 38.90, lng: 109.20 } },
    { id: "linhe-bayannur", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.75, lng: 107.40 } },
    { id: "baotou", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.66, lng: 109.84 } },
    { id: "hohhot", expectedBlockId: "hetao-tumochuan-plain", point: { lat: 40.82, lng: 111.75 } },
    { id: "wenchuan", expectedBlockId: "longmen-mountains", point: { lat: 31.48, lng: 103.59 } },
    { id: "songpan", expectedBlockId: "minshan-mountains", point: { lat: 32.64, lng: 103.60 } },
    { id: "chengdu", expectedBlockId: "chengdu-plain", point: { lat: 30.67, lng: 104.06 } },
    { id: "mianyang", expectedBlockId: "chengdu-plain", point: { lat: 31.47, lng: 104.68 } },
    { id: "neijiang", expectedBlockId: "central-sichuan-hills", point: { lat: 29.58, lng: 105.06 } },
    { id: "suining", expectedBlockId: "central-sichuan-hills", point: { lat: 30.53, lng: 105.59 } },
    { id: "chongqing", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 29.56, lng: 106.55 } },
    { id: "dazhou", expectedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 31.21, lng: 107.50 } },
    { id: "taibai-mountain", expectedBlockId: "qinling-daba-mountains", point: { lat: 34.00, lng: 107.75 } },
    { id: "hanzhong", expectedBlockId: "hanzhong-basin", point: { lat: 33.07, lng: 107.02 } },
    { id: "yangxian", expectedBlockId: "hanzhong-basin", point: { lat: 33.22, lng: 107.55 } },
    { id: "ankang", expectedBlockId: "ankang-han-river-valley", point: { lat: 32.69, lng: 109.03 } },
    { id: "shiquan", expectedBlockId: "ankang-han-river-valley", point: { lat: 33.04, lng: 108.25 } },
    { id: "zhenba", expectedBlockId: "daba-mountains", point: { lat: 32.54, lng: 107.90 } },
    { id: "dabashan", expectedBlockId: "daba-mountains", point: { lat: 32.40, lng: 108.35 } },
    { id: "badong", expectedBlockId: "three-gorges-wushan-hills", point: { lat: 31.04, lng: 110.34 } },
    { id: "yichang", expectedBlockId: "three-gorges-wushan-hills", point: { lat: 30.69, lng: 111.29 } },
    { id: "xiangyang", expectedBlockId: "han-river-valley", point: { lat: 32.01, lng: 112.12 } },
    { id: "zijinshan", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.06, lng: 118.85 } },
    { id: "qixia", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.15, lng: 118.96 } },
    { id: "jurong", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.95, lng: 119.16 } },
    { id: "maoshan", expectedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.78, lng: 119.31 } },
    { id: "yixing", expectedBlockId: "yili-hills", point: { lat: 31.34, lng: 119.82 } },
    { id: "liyang", expectedBlockId: "yili-hills", point: { lat: 31.42, lng: 119.48 } },
    { id: "tianmu-lake", expectedBlockId: "yili-hills", point: { lat: 31.30, lng: 119.43 } },
    { id: "changzhou", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.81, lng: 119.97 } },
    { id: "wuxi", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.49, lng: 120.31 } },
    { id: "suzhou", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.30, lng: 120.58 } },
    { id: "kunshan", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.39, lng: 120.98 } },
    { id: "taicang", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.45, lng: 121.10 } },
    { id: "taihu-lake", expectedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.23, lng: 120.18 } },
    { id: "huangshan", expectedBlockId: "wannan-mountains", point: { lat: 30.13, lng: 118.17 } },
    { id: "jiuhuashan", expectedBlockId: "wannan-mountains", point: { lat: 30.48, lng: 117.81 } },
    { id: "shitai", expectedBlockId: "wannan-mountains", point: { lat: 30.21, lng: 117.48 } },
    { id: "qingyang", expectedBlockId: "wannan-mountains", point: { lat: 30.64, lng: 117.84 } },
    { id: "jingxian", expectedBlockId: "wannan-mountains", point: { lat: 30.69, lng: 118.41 } },
    { id: "huzhou", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.89, lng: 120.09 } },
    { id: "jiaxing", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.75, lng: 120.76 } },
    { id: "deqing", expectedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.54, lng: 119.98 } },
    { id: "moganshan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.62, lng: 119.87 } },
    { id: "anji", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.64, lng: 119.68 } },
    { id: "linan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.23, lng: 119.72 } },
    { id: "tianmushan", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.34, lng: 119.43 } },
    { id: "fuyang-zhejiang", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.05, lng: 119.95 } },
    { id: "tonglu", expectedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 29.80, lng: 119.69 } },
    { id: "zhuji", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.71, lng: 120.23 } },
    { id: "shengzhou", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.59, lng: 120.82 } },
    { id: "xinchang", expectedBlockId: "kuaiji-siming-hills", point: { lat: 29.50, lng: 120.90 } },
    { id: "quzhou", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 28.97, lng: 118.86 } },
    { id: "jinhua", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 29.08, lng: 119.65 } },
    { id: "lishui", expectedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 28.45, lng: 119.92 } },
    { id: "qiqihar", expectedBlockId: "songnen-plain", point: { lat: 47.35, lng: 123.92 } },
    { id: "daqing", expectedBlockId: "songnen-plain", point: { lat: 46.59, lng: 125.10 } },
    { id: "suihua", expectedBlockId: "songnen-plain", point: { lat: 46.63, lng: 126.98 } },
    { id: "songyuan", expectedBlockId: "songnen-plain", point: { lat: 45.14, lng: 124.83 } },
    { id: "baicheng", expectedBlockId: "songnen-plain", point: { lat: 45.62, lng: 122.84 } },
    { id: "nenjiang", expectedBlockId: "songnen-plain", point: { lat: 49.18, lng: 125.22 } },
    { id: "heihe", expectedBlockId: "lesser-khingan-mountains", point: { lat: 50.25, lng: 127.53 } },
    { id: "fushun", expectedBlockId: "liaodong-hills", point: { lat: 41.88, lng: 123.96 } },
    { id: "mudanjiang", expectedBlockId: "mudanjiang-valley-basin", point: { lat: 44.58, lng: 129.60 } },
    { id: "yanji", expectedBlockId: "yanbian-tumen-basin", point: { lat: 42.89, lng: 129.51 } },
    { id: "changbai-mountain", expectedBlockId: "changbai-volcanic-mountains", point: { lat: 42.00, lng: 128.06 } },
    { id: "dunhua", expectedBlockId: "zhangguangcai-laoye-mountains", point: { lat: 43.37, lng: 128.23 } },
    { id: "jiamusi", expectedBlockId: "sanjiang-plain", point: { lat: 46.80, lng: 130.32 } },
    { id: "fujin", expectedBlockId: "sanjiang-plain", point: { lat: 47.25, lng: 132.04 } },
    { id: "hulunbuir", expectedBlockId: "hulunbuir-grassland-plateau", point: { lat: 49.21, lng: 119.76 } },
    { id: "manzhouli", expectedBlockId: "hulunbuir-grassland-plateau", point: { lat: 49.60, lng: 117.43 } },
    { id: "yakeshi", expectedBlockId: "greater-khingan-mountains", point: { lat: 49.28, lng: 120.73 } },
    { id: "yichun", expectedBlockId: "lesser-khingan-mountains", point: { lat: 47.72, lng: 128.84 } },
    { id: "guilin", expectedBlockId: "guangxi-karst-basin", point: { lat: 25.27, lng: 110.29 } },
    { id: "hechi", expectedBlockId: "guangxi-karst-basin", point: { lat: 24.69, lng: 108.06 } },
    { id: "baise", expectedBlockId: "guangxi-karst-basin", point: { lat: 23.90, lng: 106.62 } },
    { id: "guiyang", expectedBlockId: "qianzhong-karst-plateau", point: { lat: 26.65, lng: 106.63 } },
    { id: "anshun", expectedBlockId: "qianzhong-karst-plateau", point: { lat: 26.25, lng: 105.93 } },
    { id: "zunyi", expectedBlockId: "qianbei-dalou-mountains", point: { lat: 27.73, lng: 106.93 } },
    { id: "xingyi", expectedBlockId: "qianxinan-karst-plateau", point: { lat: 25.09, lng: 104.90 } },
    { id: "duyun", expectedBlockId: "qiannan-karst-hills", point: { lat: 26.26, lng: 107.52 } },
    { id: "libo", expectedBlockId: "qiannan-karst-hills", point: { lat: 25.42, lng: 107.88 } },
    { id: "wuzhou", expectedBlockId: "southeast-guangxi-hills-basins", point: { lat: 23.48, lng: 111.28 } },
    { id: "yulin-guangxi", expectedBlockId: "southeast-guangxi-hills-basins", point: { lat: 22.65, lng: 110.18 } },
    { id: "qingyuan", expectedBlockId: "nanling-mountains", point: { lat: 23.68, lng: 113.05 } },
    { id: "shaoguan", expectedBlockId: "nanling-mountains", point: { lat: 24.81, lng: 113.60 } },
    { id: "fuzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 26.08, lng: 119.30 } },
    { id: "xiamen", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 24.48, lng: 118.08 } },
    { id: "wenzhou", expectedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 27.99, lng: 120.70 } },
    { id: "nanchang", expectedBlockId: "poyang-lake-plain", point: { lat: 28.68, lng: 115.86 } },
    { id: "changsha", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 28.23, lng: 112.94 } },
    { id: "zhuzhou", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 27.83, lng: 113.13 } },
    { id: "xiangtan", expectedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 27.83, lng: 112.94 } },
    { id: "bengbu", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.92, lng: 117.38 } },
    { id: "huainan", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.63, lng: 117.00 } },
    { id: "huoqiu", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.35, lng: 116.28 } },
    { id: "shouxian", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.57, lng: 116.78 } },
    { id: "huaian", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.61, lng: 119.02 } },
    { id: "yangzhou", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.39, lng: 119.42 } },
    { id: "yancheng", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.35, lng: 120.16 } },
    { id: "nantong", expectedBlockId: "jianghuai-lixiahe-plain", point: { lat: 31.98, lng: 120.89 } },
    { id: "zhangjiajie", expectedBlockId: "wuling-mountains", point: { lat: 29.13, lng: 110.48 } },
    { id: "enshi", expectedBlockId: "wuling-mountains", point: { lat: 30.28, lng: 109.49 } },
    { id: "huaihua", expectedBlockId: "xuefeng-mountains", point: { lat: 27.57, lng: 110.00 } },
    { id: "xupu", expectedBlockId: "xuefeng-mountains", point: { lat: 27.91, lng: 110.59 } },
    { id: "shaoyang", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 27.24, lng: 111.47 } },
    { id: "loudi", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 27.70, lng: 112.00 } },
    { id: "hengyang", expectedBlockId: "xiangzhong-hills-basins", point: { lat: 26.89, lng: 112.57 } },
    { id: "yongzhou", expectedBlockId: "xiangnan-hills-basins", point: { lat: 26.42, lng: 111.61 } },
    { id: "pingxiang", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.62, lng: 113.85 } },
    { id: "yichun-jiangxi", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.81, lng: 114.38 } },
    { id: "jinggangshan", expectedBlockId: "luoxiao-wugong-mountains", point: { lat: 26.75, lng: 114.29 } },
    { id: "ganzhou", expectedBlockId: "southeast-hills", point: { lat: 25.83, lng: 114.93 } },
    { id: "dabie-mountain", expectedBlockId: "dabie-mountains", point: { lat: 31.10, lng: 115.80 } },
    { id: "jinzhai", expectedBlockId: "dabie-mountains", point: { lat: 31.68, lng: 115.88 } },
    { id: "huoshan", expectedBlockId: "dabie-mountains", point: { lat: 31.40, lng: 116.33 } },
    { id: "yuexi", expectedBlockId: "dabie-mountains", point: { lat: 30.85, lng: 116.36 } },
    { id: "tianzhushan", expectedBlockId: "dabie-mountains", point: { lat: 30.74, lng: 116.45 } },
    { id: "luan", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.75, lng: 116.51 } },
    { id: "shucheng", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.46, lng: 116.94 } },
    { id: "lujiang", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.26, lng: 117.29 } },
    { id: "tongcheng", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.04, lng: 116.95 } },
    { id: "qianshan", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.63, lng: 116.58 } },
    { id: "taihu", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.45, lng: 116.31 } },
    { id: "huaining", expectedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.73, lng: 116.83 } },
    { id: "hefei", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.82, lng: 117.23 } },
    { id: "feixi", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.71, lng: 117.16 } },
    { id: "chaohu", expectedBlockId: "hefei-chaohu-low-hills", point: { lat: 31.60, lng: 117.87 } },
    { id: "lushan", expectedBlockId: "lushan-mountains", point: { lat: 29.55, lng: 115.98 } },
    { id: "poyang-lake", expectedBlockId: "poyang-lake-plain", point: { lat: 29.12, lng: 116.32 } },
    { id: "jiujiang", expectedBlockId: "poyang-lake-plain", point: { lat: 29.70, lng: 116.00 } },
    { id: "duchang", expectedBlockId: "poyang-lake-plain", point: { lat: 29.28, lng: 116.20 } },
    { id: "wuyuan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 29.25, lng: 117.86 } },
    { id: "sanqingshan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.91, lng: 118.06 } },
    { id: "shangrao", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.45, lng: 117.97 } },
    { id: "yingtan", expectedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.24, lng: 117.04 } },
    { id: "taipei", expectedBlockId: "taipei-basin", point: { lat: 25.03, lng: 121.56 } },
    { id: "taichung", expectedBlockId: "taiwan-western-plains", point: { lat: 24.15, lng: 120.67 } },
    { id: "hualien", expectedBlockId: "taiwan-east-coast-valley", point: { lat: 23.99, lng: 121.60 } },
    { id: "yushan", expectedBlockId: "taiwan-mountains", point: { lat: 23.47, lng: 120.96 } },
    { id: "haikou", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 20.04, lng: 110.32 } },
    { id: "sanya", expectedBlockId: "hainan-coastal-lowlands", point: { lat: 18.25, lng: 109.51 } },
    { id: "wuzhi-mountain", expectedBlockId: "hainan-central-mountains", point: { lat: 18.90, lng: 109.68 } },
    { id: "baisha", expectedBlockId: "hainan-central-mountains", point: { lat: 19.22, lng: 109.45 } },
    { id: "shantou", expectedBlockId: "chaoshan-coastal-plain", point: { lat: 23.35, lng: 116.68 } },
    { id: "heyuan", expectedBlockId: "southeast-hills", point: { lat: 23.74, lng: 114.70 } },
    { id: "zhanjiang", expectedBlockId: "west-guangdong-leizhou-lowlands", point: { lat: 21.27, lng: 110.36 } },
    { id: "beihai", expectedBlockId: "beibu-gulf-coastal-lowlands", point: { lat: 21.48, lng: 109.12 } },
  ];

  anchors.forEach((anchor) => {
    const firstBlock = FIVE_TERRAIN_BLOCKS.find((block) => isPointInsidePolygon(anchor.point, block.polygon));

    assert.equal(
      firstBlock && firstBlock.id,
      anchor.expectedBlockId,
      `${anchor.id} should render as ${anchor.expectedBlockId}`
    );
  });
});

test("terrain block polygons exclude nearby transition zones from the wrong block", () => {
  const exclusions = [
    { id: "kangding", excludedBlockId: "sichuan-basin", point: { lat: 30.05, lng: 101.96 } },
    { id: "xichang", excludedBlockId: "sichuan-basin", point: { lat: 27.89, lng: 102.26 } },
    { id: "panzhihua", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 26.58, lng: 101.72 } },
    { id: "zhaotong", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 27.34, lng: 103.72 } },
    { id: "yongshan", excludedBlockId: "sichuan-basin", point: { lat: 28.23, lng: 103.64 } },
    { id: "kunming", excludedBlockId: "wumeng-mountains", point: { lat: 25.04, lng: 102.72 } },
    { id: "qujing", excludedBlockId: "wumeng-mountains", point: { lat: 25.49, lng: 103.80 } },
    { id: "guiyang", excludedBlockId: "wumeng-mountains", point: { lat: 26.65, lng: 106.63 } },
    { id: "yibin", excludedBlockId: "wumeng-mountains", point: { lat: 28.75, lng: 104.64 } },
    { id: "luzhou", excludedBlockId: "wumeng-mountains", point: { lat: 28.87, lng: 105.44 } },
    { id: "xichang", excludedBlockId: "wumeng-mountains", point: { lat: 27.89, lng: 102.26 } },
    { id: "panzhihua", excludedBlockId: "wumeng-mountains", point: { lat: 26.58, lng: 101.72 } },
    { id: "karamay", excludedBlockId: "tarim-basin", point: { lat: 45.58, lng: 84.89 } },
    { id: "korla", excludedBlockId: "junggar-basin", point: { lat: 41.73, lng: 86.17 } },
    { id: "altay-city", excludedBlockId: "junggar-basin", point: { lat: 47.85, lng: 88.13 } },
    { id: "yining", excludedBlockId: "junggar-basin", point: { lat: 43.91, lng: 81.32 } },
    { id: "huocheng", excludedBlockId: "junggar-basin", point: { lat: 44.05, lng: 80.87 } },
    { id: "khorgos", excludedBlockId: "junggar-basin", point: { lat: 44.22, lng: 80.42 } },
    { id: "bole", excludedBlockId: "ili-valley", point: { lat: 44.90, lng: 82.07 } },
    { id: "zhaosu", excludedBlockId: "junggar-basin", point: { lat: 43.15, lng: 81.13 } },
    { id: "nalati", excludedBlockId: "junggar-basin", point: { lat: 43.25, lng: 84.00 } },
    { id: "tianchi", excludedBlockId: "junggar-basin", point: { lat: 43.88, lng: 88.13 } },
    { id: "bogda-peak", excludedBlockId: "junggar-basin", point: { lat: 43.82, lng: 88.33 } },
    { id: "turpan", excludedBlockId: "tian-shan-mountains", point: { lat: 42.95, lng: 89.18 } },
    { id: "hami", excludedBlockId: "tian-shan-mountains", point: { lat: 42.82, lng: 93.52 } },
    { id: "dunhuang", excludedBlockId: "qinghai-tibet-plateau", point: { lat: 40.14, lng: 94.66 } },
    { id: "kunlun-pass", excludedBlockId: "qaidam-basin", point: { lat: 35.62, lng: 94.06 } },
    { id: "qomolangma", excludedBlockId: "qinghai-tibet-plateau", point: { lat: 27.99, lng: 86.93 } },
    { id: "lhasa", excludedBlockId: "himalaya-mountains", point: { lat: 29.65, lng: 91.13 } },
    { id: "aba-county", excludedBlockId: "qinghai-tibet-plateau", point: { lat: 32.90, lng: 101.70 } },
    { id: "maerkang", excludedBlockId: "hengduan-mountains", point: { lat: 31.90, lng: 102.22 } },
    { id: "songpan", excludedBlockId: "gannan-aba-plateau", point: { lat: 32.64, lng: 103.60 } },
    { id: "jiuzhaigou", excludedBlockId: "gannan-aba-plateau", point: { lat: 33.26, lng: 104.24 } },
    { id: "wenchuan", excludedBlockId: "gannan-aba-plateau", point: { lat: 31.48, lng: 103.59 } },
    { id: "kangding", excludedBlockId: "gannan-aba-plateau", point: { lat: 30.05, lng: 101.96 } },
    { id: "xining", excludedBlockId: "gannan-aba-plateau", point: { lat: 36.62, lng: 101.78 } },
    { id: "nyingchi", excludedBlockId: "himalaya-mountains", point: { lat: 29.65, lng: 94.36 } },
    { id: "nyingchi", excludedBlockId: "qinghai-tibet-plateau", point: { lat: 29.65, lng: 94.36 } },
    { id: "bomi", excludedBlockId: "qinghai-tibet-plateau", point: { lat: 29.86, lng: 95.77 } },
    { id: "lhasa", excludedBlockId: "southeast-tibet-gorges", point: { lat: 29.65, lng: 91.13 } },
    { id: "qomolangma", excludedBlockId: "southeast-tibet-gorges", point: { lat: 27.99, lng: 86.93 } },
    { id: "jiayuguan", excludedBlockId: "qilian-mountains", point: { lat: 39.77, lng: 98.29 } },
    { id: "zhangye", excludedBlockId: "qilian-mountains", point: { lat: 38.93, lng: 100.45 } },
    { id: "wuwei", excludedBlockId: "qilian-mountains", point: { lat: 37.93, lng: 102.64 } },
    { id: "yongchang", excludedBlockId: "qilian-mountains", point: { lat: 38.24, lng: 101.97 } },
    { id: "alxa-left-banner", excludedBlockId: "loess-plateau", point: { lat: 38.83, lng: 105.67 } },
    { id: "yinchuan", excludedBlockId: "alxa-plateau-desert", point: { lat: 38.49, lng: 106.23 } },
    { id: "yinchuan", excludedBlockId: "loess-plateau", point: { lat: 38.49, lng: 106.23 } },
    { id: "ordos", excludedBlockId: "inner-mongolia-plateau", point: { lat: 39.61, lng: 109.78 } },
    { id: "ordos", excludedBlockId: "loess-plateau", point: { lat: 39.61, lng: 109.78 } },
    { id: "maowusu-desert", excludedBlockId: "loess-plateau", point: { lat: 38.90, lng: 109.20 } },
    { id: "yulin", excludedBlockId: "ordos-maowusu-plateau", point: { lat: 38.29, lng: 109.73 } },
    { id: "delingha", excludedBlockId: "qilian-mountains", point: { lat: 37.37, lng: 97.37 } },
    { id: "wenchuan", excludedBlockId: "sichuan-basin", point: { lat: 31.48, lng: 103.59 } },
    { id: "beichuan", excludedBlockId: "sichuan-basin", point: { lat: 31.83, lng: 104.45 } },
    { id: "songpan", excludedBlockId: "sichuan-basin", point: { lat: 32.64, lng: 103.60 } },
    { id: "jiuzhaigou", excludedBlockId: "sichuan-basin", point: { lat: 33.26, lng: 104.24 } },
    { id: "yaan", excludedBlockId: "chengdu-plain", point: { lat: 29.98, lng: 103.01 } },
    { id: "chengdu", excludedBlockId: "central-sichuan-hills", point: { lat: 30.67, lng: 104.06 } },
    { id: "mianyang", excludedBlockId: "central-sichuan-hills", point: { lat: 31.47, lng: 104.68 } },
    { id: "chongqing", excludedBlockId: "central-sichuan-hills", point: { lat: 29.56, lng: 106.55 } },
    { id: "chengdu", excludedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 30.67, lng: 104.06 } },
    { id: "neijiang", excludedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 29.58, lng: 105.06 } },
    { id: "zhenba", excludedBlockId: "eastern-sichuan-parallel-ridge-valleys", point: { lat: 32.54, lng: 107.90 } },
    { id: "shennongjia", excludedBlockId: "three-gorges-wushan-hills", point: { lat: 31.74, lng: 110.68 } },
    { id: "enshi", excludedBlockId: "three-gorges-wushan-hills", point: { lat: 30.28, lng: 109.49 } },
    { id: "jingmen", excludedBlockId: "three-gorges-wushan-hills", point: { lat: 31.04, lng: 112.20 } },
    { id: "shiyan", excludedBlockId: "han-river-valley", point: { lat: 32.63, lng: 110.80 } },
    { id: "nanyang", excludedBlockId: "han-river-valley", point: { lat: 32.99, lng: 112.53 } },
    { id: "jingmen", excludedBlockId: "han-river-valley", point: { lat: 31.04, lng: 112.20 } },
    { id: "taibai-mountain", excludedBlockId: "hanzhong-basin", point: { lat: 34.00, lng: 107.75 } },
    { id: "foping", excludedBlockId: "hanzhong-basin", point: { lat: 33.52, lng: 107.99 } },
    { id: "zhenba", excludedBlockId: "hanzhong-basin", point: { lat: 32.54, lng: 107.90 } },
    { id: "ankang", excludedBlockId: "hanzhong-basin", point: { lat: 32.69, lng: 109.03 } },
    { id: "hanzhong", excludedBlockId: "ankang-han-river-valley", point: { lat: 33.07, lng: 107.02 } },
    { id: "zhenba", excludedBlockId: "ankang-han-river-valley", point: { lat: 32.54, lng: 107.90 } },
    { id: "taibai-mountain", excludedBlockId: "daba-mountains", point: { lat: 34.00, lng: 107.75 } },
    { id: "hanzhong", excludedBlockId: "daba-mountains", point: { lat: 33.07, lng: 107.02 } },
    { id: "ankang", excludedBlockId: "daba-mountains", point: { lat: 32.69, lng: 109.03 } },
    { id: "zhenba", excludedBlockId: "sichuan-basin", point: { lat: 32.54, lng: 107.90 } },
    { id: "dujiangyan", excludedBlockId: "longmen-mountains", point: { lat: 30.99, lng: 103.62 } },
    { id: "mianyang", excludedBlockId: "longmen-mountains", point: { lat: 31.47, lng: 104.68 } },
    { id: "enshi", excludedBlockId: "sichuan-basin", point: { lat: 30.28, lng: 109.49 } },
    { id: "taibai-mountain", excludedBlockId: "loess-plateau", point: { lat: 34.00, lng: 107.75 } },
    { id: "shennongjia", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 31.74, lng: 110.68 } },
    { id: "nanning", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 22.82, lng: 108.32 } },
    { id: "kaili", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 26.57, lng: 107.98 } },
    { id: "congjiang", excludedBlockId: "guangxi-karst-basin", point: { lat: 25.75, lng: 108.91 } },
    { id: "kaili", excludedBlockId: "qianzhong-karst-plateau", point: { lat: 26.57, lng: 107.98 } },
    { id: "bijie", excludedBlockId: "qianzhong-karst-plateau", point: { lat: 27.30, lng: 105.29 } },
    { id: "guiyang", excludedBlockId: "qianbei-dalou-mountains", point: { lat: 26.65, lng: 106.63 } },
    { id: "tongren", excludedBlockId: "qianbei-dalou-mountains", point: { lat: 27.72, lng: 109.19 } },
    { id: "liupanshui", excludedBlockId: "qianxinan-karst-plateau", point: { lat: 26.59, lng: 104.83 } },
    { id: "guiyang", excludedBlockId: "qianxinan-karst-plateau", point: { lat: 26.65, lng: 106.63 } },
    { id: "kaili", excludedBlockId: "qiannan-karst-hills", point: { lat: 26.57, lng: 107.98 } },
    { id: "hechi", excludedBlockId: "qiannan-karst-hills", point: { lat: 24.69, lng: 108.06 } },
    { id: "libo", excludedBlockId: "guangxi-karst-basin", point: { lat: 25.42, lng: 107.88 } },
    { id: "guiyang", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 26.65, lng: 106.63 } },
    { id: "zunyi", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 27.73, lng: 106.93 } },
    { id: "tongren", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 27.72, lng: 109.19 } },
    { id: "hechi", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 24.69, lng: 108.06 } },
    { id: "guilin", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 25.27, lng: 110.29 } },
    { id: "liuzhou", excludedBlockId: "qiandongnan-miaoling-mountains", point: { lat: 24.33, lng: 109.42 } },
    { id: "guilin", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 25.27, lng: 110.29 } },
    { id: "hechi", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 24.69, lng: 108.06 } },
    { id: "baise", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 23.90, lng: 106.62 } },
    { id: "puer", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 22.78, lng: 100.97 } },
    { id: "jinghong", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 22.01, lng: 100.80 } },
    { id: "mengla", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 21.48, lng: 101.56 } },
    { id: "lincang", excludedBlockId: "southern-yunnan-valleys", point: { lat: 23.88, lng: 100.09 } },
    { id: "lincang", excludedBlockId: "hengduan-mountains", point: { lat: 23.88, lng: 100.09 } },
    { id: "puer", excludedBlockId: "western-yunnan-mountain-valleys", point: { lat: 22.78, lng: 100.97 } },
    { id: "baoshan", excludedBlockId: "western-yunnan-mountain-valleys", point: { lat: 25.11, lng: 99.16 } },
    { id: "tengchong", excludedBlockId: "dehong-river-valleys", point: { lat: 25.02, lng: 98.49 } },
    { id: "longling", excludedBlockId: "dehong-river-valleys", point: { lat: 24.59, lng: 98.69 } },
    { id: "baoshan", excludedBlockId: "dehong-river-valleys", point: { lat: 25.11, lng: 99.16 } },
    { id: "lincang", excludedBlockId: "dehong-river-valleys", point: { lat: 23.88, lng: 100.09 } },
    { id: "hekou", excludedBlockId: "southeast-yunnan-karst-plateau", point: { lat: 22.53, lng: 103.96 } },
    { id: "mengzi", excludedBlockId: "southeast-yunnan-karst-plateau", point: { lat: 23.36, lng: 103.39 } },
    { id: "mengzi", excludedBlockId: "red-river-ailao-valley", point: { lat: 23.36, lng: 103.39 } },
    { id: "gejiu", excludedBlockId: "red-river-ailao-valley", point: { lat: 23.36, lng: 103.16 } },
    { id: "jianshui", excludedBlockId: "red-river-ailao-valley", point: { lat: 23.62, lng: 102.83 } },
    { id: "wenshan", excludedBlockId: "red-river-ailao-valley", point: { lat: 23.37, lng: 104.25 } },
    { id: "kunming", excludedBlockId: "southern-yunnan-valleys", point: { lat: 25.04, lng: 102.72 } },
    { id: "chuxiong", excludedBlockId: "southern-yunnan-valleys", point: { lat: 25.04, lng: 101.55 } },
    { id: "baotou", excludedBlockId: "loess-plateau", point: { lat: 40.66, lng: 109.84 } },
    { id: "ordos", excludedBlockId: "hetao-tumochuan-plain", point: { lat: 39.61, lng: 109.78 } },
    { id: "wuchuan-yinshan-north", excludedBlockId: "hetao-tumochuan-plain", point: { lat: 41.10, lng: 111.45 } },
    { id: "ulanhot-plateau", excludedBlockId: "hetao-tumochuan-plain", point: { lat: 46.08, lng: 122.07 } },
    { id: "xian", excludedBlockId: "loess-plateau", point: { lat: 34.34, lng: 108.94 } },
    { id: "xian", excludedBlockId: "qinling-daba-mountains", point: { lat: 34.34, lng: 108.94 } },
    { id: "xian", excludedBlockId: "north-china-plain", point: { lat: 34.34, lng: 108.94 } },
    { id: "zhengzhou", excludedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.75, lng: 113.62 } },
    { id: "kaifeng", excludedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.80, lng: 114.31 } },
    { id: "sanmenxia", excludedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 34.77, lng: 111.20 } },
    { id: "nanyang", excludedBlockId: "western-henan-funiu-songshan-mountains", point: { lat: 32.99, lng: 112.53 } },
    { id: "xuchang", excludedBlockId: "nanyang-basin", point: { lat: 34.04, lng: 113.85 } },
    { id: "zhoukou", excludedBlockId: "nanyang-basin", point: { lat: 33.63, lng: 114.65 } },
    { id: "zhumadian", excludedBlockId: "nanyang-basin", point: { lat: 32.98, lng: 114.02 } },
    { id: "xixia", excludedBlockId: "nanyang-basin", point: { lat: 33.31, lng: 111.48 } },
    { id: "nanyang", excludedBlockId: "tongbai-dabie-mountains", point: { lat: 32.99, lng: 112.53 } },
    { id: "zhumadian", excludedBlockId: "tongbai-dabie-mountains", point: { lat: 32.98, lng: 114.02 } },
    { id: "zhoukou", excludedBlockId: "tongbai-dabie-mountains", point: { lat: 33.63, lng: 114.65 } },
    { id: "guangzhou", excludedBlockId: "southeast-hills", point: { lat: 23.13, lng: 113.26 } },
    { id: "shantou", excludedBlockId: "southeast-hills", point: { lat: 23.35, lng: 116.68 } },
    { id: "jieyang", excludedBlockId: "southeast-hills", point: { lat: 23.55, lng: 116.37 } },
    { id: "guigang", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 23.11, lng: 109.60 } },
    { id: "nanning", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 22.82, lng: 108.32 } },
    { id: "guilin", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 25.27, lng: 110.29 } },
    { id: "beihai", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 21.48, lng: 109.12 } },
    { id: "qinzhou", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 21.98, lng: 108.65 } },
    { id: "maoming", excludedBlockId: "southeast-guangxi-hills-basins", point: { lat: 21.66, lng: 110.92 } },
    { id: "zhanjiang", excludedBlockId: "nanling-mountains", point: { lat: 21.27, lng: 110.36 } },
    { id: "guangzhou", excludedBlockId: "nanling-mountains", point: { lat: 23.13, lng: 113.26 } },
    { id: "foshan", excludedBlockId: "nanling-mountains", point: { lat: 23.02, lng: 113.12 } },
    { id: "dongguan", excludedBlockId: "nanling-mountains", point: { lat: 23.04, lng: 113.75 } },
    { id: "huizhou", excludedBlockId: "nanling-mountains", point: { lat: 23.11, lng: 114.42 } },
    { id: "zhanjiang", excludedBlockId: "guangxi-karst-basin", point: { lat: 21.27, lng: 110.36 } },
    { id: "beihai", excludedBlockId: "guangxi-karst-basin", point: { lat: 21.48, lng: 109.12 } },
    { id: "qinzhou", excludedBlockId: "guangxi-karst-basin", point: { lat: 21.98, lng: 108.65 } },
    { id: "qingdao", excludedBlockId: "north-china-plain", point: { lat: 36.07, lng: 120.38 } },
    { id: "yantai", excludedBlockId: "north-china-plain", point: { lat: 37.46, lng: 121.45 } },
    { id: "xuzhou", excludedBlockId: "jianghuai-lixiahe-plain", point: { lat: 34.26, lng: 117.20 } },
    { id: "suzhou-anhui", excludedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.65, lng: 116.96 } },
    { id: "huaibei", excludedBlockId: "jianghuai-lixiahe-plain", point: { lat: 33.96, lng: 116.79 } },
    { id: "fuyang", excludedBlockId: "jianghuai-lixiahe-plain", point: { lat: 32.89, lng: 115.81 } },
    { id: "bengbu", excludedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 32.92, lng: 117.38 } },
    { id: "huainan", excludedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 32.63, lng: 117.00 } },
    { id: "huaian", excludedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.61, lng: 119.02 } },
    { id: "yancheng", excludedBlockId: "huanghuai-north-jiangsu-plain", point: { lat: 33.35, lng: 120.16 } },
    { id: "dezhou", excludedBlockId: "shandong-hills", point: { lat: 37.45, lng: 116.31 } },
    { id: "liaocheng", excludedBlockId: "shandong-hills", point: { lat: 36.45, lng: 115.98 } },
    { id: "heze", excludedBlockId: "shandong-hills", point: { lat: 35.23, lng: 115.48 } },
    { id: "jining", excludedBlockId: "shandong-hills", point: { lat: 35.41, lng: 116.59 } },
    { id: "jinan", excludedBlockId: "luzhongnan-mountains", point: { lat: 36.65, lng: 117.12 } },
    { id: "zibo", excludedBlockId: "luzhongnan-mountains", point: { lat: 36.81, lng: 118.05 } },
    { id: "jining", excludedBlockId: "luzhongnan-mountains", point: { lat: 35.41, lng: 116.59 } },
    { id: "qingdao", excludedBlockId: "luzhongnan-mountains", point: { lat: 36.07, lng: 120.38 } },
    { id: "yantai", excludedBlockId: "luzhongnan-mountains", point: { lat: 37.46, lng: 121.45 } },
    { id: "weifang", excludedBlockId: "jiaodong-hills", point: { lat: 36.71, lng: 119.16 } },
    { id: "dongying", excludedBlockId: "jiaodong-hills", point: { lat: 37.43, lng: 118.67 } },
    { id: "taishan", excludedBlockId: "jiaodong-hills", point: { lat: 36.25, lng: 117.10 } },
    { id: "linyi", excludedBlockId: "jiaodong-hills", point: { lat: 35.10, lng: 118.36 } },
    { id: "chengde", excludedBlockId: "north-china-plain", point: { lat: 40.95, lng: 117.96 } },
    { id: "zhangjiakou", excludedBlockId: "inner-mongolia-plateau", point: { lat: 40.77, lng: 114.89 } },
    { id: "zhangbei", excludedBlockId: "inner-mongolia-plateau", point: { lat: 41.16, lng: 114.72 } },
    { id: "guyuan-hebei", excludedBlockId: "inner-mongolia-plateau", point: { lat: 41.67, lng: 115.68 } },
    { id: "saihanba", excludedBlockId: "inner-mongolia-plateau", point: { lat: 42.41, lng: 117.26 } },
    { id: "zhangjiakou", excludedBlockId: "hebei-bashang-plateau", point: { lat: 40.77, lng: 114.89 } },
    { id: "chengde", excludedBlockId: "hebei-bashang-plateau", point: { lat: 40.95, lng: 117.96 } },
    { id: "beijing", excludedBlockId: "hebei-bashang-plateau", point: { lat: 39.90, lng: 116.40 } },
    { id: "baoding", excludedBlockId: "hebei-bashang-plateau", point: { lat: 38.87, lng: 115.46 } },
    { id: "xilingol", excludedBlockId: "hebei-bashang-plateau", point: { lat: 43.94, lng: 116.09 } },
    { id: "datong", excludedBlockId: "inner-mongolia-plateau", point: { lat: 40.08, lng: 113.30 } },
    { id: "chifeng", excludedBlockId: "inner-mongolia-plateau", point: { lat: 42.26, lng: 118.89 } },
    { id: "fuxin", excludedBlockId: "northeast-plain", point: { lat: 42.02, lng: 121.67 } },
    { id: "tangshan", excludedBlockId: "yan-taihang-mountains", point: { lat: 39.63, lng: 118.18 } },
    { id: "jinzhou", excludedBlockId: "liaohe-plain", point: { lat: 41.10, lng: 121.13 } },
    { id: "huludao", excludedBlockId: "liaohe-plain", point: { lat: 40.71, lng: 120.84 } },
    { id: "qinhuangdao", excludedBlockId: "north-china-plain", point: { lat: 39.94, lng: 119.60 } },
    { id: "chaoyang-liaoning", excludedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 41.57, lng: 120.45 } },
    { id: "panjin", excludedBlockId: "liaoxi-corridor-coastal-lowlands", point: { lat: 41.12, lng: 122.07 } },
    { id: "gaizhou", excludedBlockId: "liaodong-hills", point: { lat: 40.40, lng: 122.35 } },
    { id: "wutaishan", excludedBlockId: "loess-plateau", point: { lat: 39.00, lng: 113.59 } },
    { id: "wutaishan", excludedBlockId: "xinding-basin", point: { lat: 39.00, lng: 113.59 } },
    { id: "wutaishan", excludedBlockId: "yangquan-shouyang-basin", point: { lat: 39.00, lng: 113.59 } },
    { id: "taiyuan", excludedBlockId: "xinding-basin", point: { lat: 37.87, lng: 112.55 } },
    { id: "xinzhou", excludedBlockId: "taiyuan-basin", point: { lat: 38.42, lng: 112.73 } },
    { id: "linfen", excludedBlockId: "yuncheng-basin", point: { lat: 36.08, lng: 111.52 } },
    { id: "houma", excludedBlockId: "yuncheng-basin", point: { lat: 35.62, lng: 111.37 } },
    { id: "yuncheng", excludedBlockId: "linfen-basin", point: { lat: 35.03, lng: 111.00 } },
    { id: "yuncheng", excludedBlockId: "zhongtiao-mountains", point: { lat: 35.03, lng: 111.00 } },
    { id: "changzhi", excludedBlockId: "yangquan-shouyang-basin", point: { lat: 36.20, lng: 113.12 } },
    { id: "yangquan", excludedBlockId: "shangdang-changzhi-basin", point: { lat: 37.86, lng: 113.58 } },
    { id: "taiyuan", excludedBlockId: "luliang-mountains", point: { lat: 37.87, lng: 112.55 } },
    { id: "xinzhou", excludedBlockId: "luliang-mountains", point: { lat: 38.42, lng: 112.73 } },
    { id: "taishan", excludedBlockId: "north-china-plain", point: { lat: 36.25, lng: 117.10 } },
    { id: "nanchang", excludedBlockId: "southeast-hills", point: { lat: 28.68, lng: 115.86 } },
    { id: "jingdezhen", excludedBlockId: "poyang-lake-plain", point: { lat: 29.27, lng: 117.18 } },
    { id: "ruichang", excludedBlockId: "poyang-lake-plain", point: { lat: 29.67, lng: 115.67 } },
    { id: "nanchang", excludedBlockId: "huaiyu-xinjiang-hills", point: { lat: 28.68, lng: 115.86 } },
    { id: "poyang-lake", excludedBlockId: "huaiyu-xinjiang-hills", point: { lat: 29.12, lng: 116.32 } },
    { id: "fuzhou-jiangxi", excludedBlockId: "huaiyu-xinjiang-hills", point: { lat: 27.95, lng: 116.36 } },
    { id: "changsha", excludedBlockId: "southeast-hills", point: { lat: 28.23, lng: 112.94 } },
    { id: "fuzhou", excludedBlockId: "southeast-hills", point: { lat: 26.08, lng: 119.30 } },
    { id: "xiamen", excludedBlockId: "southeast-hills", point: { lat: 24.48, lng: 118.08 } },
    { id: "wenzhou", excludedBlockId: "southeast-hills", point: { lat: 27.99, lng: 120.70 } },
    { id: "wuyishan", excludedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 27.76, lng: 118.04 } },
    { id: "sanming", excludedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 26.26, lng: 117.64 } },
    { id: "longyan", excludedBlockId: "fujian-zhejiang-coastal-lowlands", point: { lat: 25.08, lng: 117.02 } },
    { id: "zhangjiajie", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 29.13, lng: 110.48 } },
    { id: "enshi", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.28, lng: 109.49 } },
    { id: "changde", excludedBlockId: "xuefeng-mountains", point: { lat: 29.03, lng: 111.69 } },
    { id: "yiyang", excludedBlockId: "xuefeng-mountains", point: { lat: 28.59, lng: 112.36 } },
    { id: "changsha", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 28.23, lng: 112.94 } },
    { id: "zhuzhou", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 27.83, lng: 113.13 } },
    { id: "xiangtan", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 27.83, lng: 112.94 } },
    { id: "changsha", excludedBlockId: "xuefeng-mountains", point: { lat: 28.23, lng: 112.94 } },
    { id: "xinhua", excludedBlockId: "xiangzhong-hills-basins", point: { lat: 27.73, lng: 111.30 } },
    { id: "changsha", excludedBlockId: "xiangzhong-hills-basins", point: { lat: 28.23, lng: 112.94 } },
    { id: "yiyang", excludedBlockId: "xiangzhong-hills-basins", point: { lat: 28.59, lng: 112.36 } },
    { id: "yueyang", excludedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 29.37, lng: 113.13 } },
    { id: "changde", excludedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 29.03, lng: 111.69 } },
    { id: "yiyang", excludedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 28.59, lng: 112.36 } },
    { id: "hengyang", excludedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 26.89, lng: 112.57 } },
    { id: "loudi", excludedBlockId: "xiangjiang-changzhutan-basin", point: { lat: 27.70, lng: 112.00 } },
    { id: "chenzhou", excludedBlockId: "xiangzhong-hills-basins", point: { lat: 25.77, lng: 113.02 } },
    { id: "hengyang", excludedBlockId: "xiangnan-hills-basins", point: { lat: 26.89, lng: 112.57 } },
    { id: "daoxian", excludedBlockId: "xiangnan-hills-basins", point: { lat: 25.53, lng: 111.60 } },
    { id: "jianghua", excludedBlockId: "xiangnan-hills-basins", point: { lat: 25.19, lng: 111.58 } },
    { id: "ganzhou", excludedBlockId: "nanling-mountains", point: { lat: 25.83, lng: 114.93 } },
    { id: "changsha", excludedBlockId: "luoxiao-wugong-mountains", point: { lat: 28.23, lng: 112.94 } },
    { id: "nanchang", excludedBlockId: "luoxiao-wugong-mountains", point: { lat: 28.68, lng: 115.86 } },
    { id: "jian", excludedBlockId: "luoxiao-wugong-mountains", point: { lat: 27.12, lng: 114.99 } },
    { id: "ganzhou", excludedBlockId: "luoxiao-wugong-mountains", point: { lat: 25.83, lng: 114.93 } },
    { id: "hefei", excludedBlockId: "dabie-mountains", point: { lat: 31.82, lng: 117.23 } },
    { id: "luan", excludedBlockId: "dabie-mountains", point: { lat: 31.75, lng: 116.51 } },
    { id: "shucheng", excludedBlockId: "dabie-mountains", point: { lat: 31.46, lng: 116.94 } },
    { id: "hefei", excludedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.82, lng: 117.23 } },
    { id: "chaohu", excludedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.60, lng: 117.87 } },
    { id: "feixi", excludedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.71, lng: 117.16 } },
    { id: "anqing", excludedBlockId: "wanxi-jianghuai-hills", point: { lat: 30.54, lng: 117.06 } },
    { id: "wuwei", excludedBlockId: "wanxi-jianghuai-hills", point: { lat: 31.30, lng: 117.91 } },
    { id: "hangzhou", excludedBlockId: "jiangnan-hills", point: { lat: 30.27, lng: 120.15 } },
    { id: "hangzhou", excludedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 30.27, lng: 120.15 } },
    { id: "hangzhou", excludedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.27, lng: 120.15 } },
    { id: "huzhou", excludedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.89, lng: 120.09 } },
    { id: "jiaxing", excludedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.75, lng: 120.76 } },
    { id: "deqing", excludedBlockId: "tianmu-mogan-fuchun-hills", point: { lat: 30.54, lng: 119.98 } },
    { id: "moganshan", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.62, lng: 119.87 } },
    { id: "anji", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.64, lng: 119.68 } },
    { id: "linan", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.23, lng: 119.72 } },
    { id: "tianmushan", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.34, lng: 119.43 } },
    { id: "fuyang-zhejiang", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 30.05, lng: 119.95 } },
    { id: "tonglu", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 29.80, lng: 119.69 } },
    { id: "zhuji", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 29.71, lng: 120.23 } },
    { id: "shengzhou", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 29.59, lng: 120.82 } },
    { id: "xinchang", excludedBlockId: "hangjiahu-ningshao-plains", point: { lat: 29.50, lng: 120.90 } },
    { id: "shaoxing", excludedBlockId: "kuaiji-siming-hills", point: { lat: 30.00, lng: 120.58 } },
    { id: "ningbo", excludedBlockId: "kuaiji-siming-hills", point: { lat: 29.87, lng: 121.55 } },
    { id: "yuyao", excludedBlockId: "kuaiji-siming-hills", point: { lat: 30.05, lng: 121.15 } },
    { id: "shaoxing", excludedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 30.00, lng: 120.58 } },
    { id: "ningbo", excludedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 29.87, lng: 121.55 } },
    { id: "wenzhou", excludedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 27.99, lng: 120.70 } },
    { id: "taizhou-zhejiang", excludedBlockId: "zhezhong-zhenan-hills-basins", point: { lat: 28.66, lng: 121.42 } },
    { id: "shaoxing", excludedBlockId: "southeast-hills", point: { lat: 30.00, lng: 120.58 } },
    { id: "ningbo", excludedBlockId: "southeast-hills", point: { lat: 29.87, lng: 121.55 } },
    { id: "huangshan", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.13, lng: 118.17 } },
    { id: "shitai", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.21, lng: 117.48 } },
    { id: "qingyang", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.64, lng: 117.84 } },
    { id: "jingxian", excludedBlockId: "middle-lower-yangtze-plain", point: { lat: 30.69, lng: 118.41 } },
    { id: "chizhou-city", excludedBlockId: "wannan-mountains", point: { lat: 30.66, lng: 117.49 } },
    { id: "anqing", excludedBlockId: "wannan-mountains", point: { lat: 30.54, lng: 117.06 } },
    { id: "tongling", excludedBlockId: "wannan-mountains", point: { lat: 30.95, lng: 117.81 } },
    { id: "wuhu", excludedBlockId: "wannan-mountains", point: { lat: 31.35, lng: 118.43 } },
    { id: "maanshan", excludedBlockId: "wannan-mountains", point: { lat: 31.67, lng: 118.51 } },
    { id: "hefei", excludedBlockId: "wannan-mountains", point: { lat: 31.82, lng: 117.23 } },
    { id: "zhenjiang-city", excludedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.19, lng: 119.43 } },
    { id: "danyang", excludedBlockId: "ningzhen-maoshan-hills", point: { lat: 32.01, lng: 119.61 } },
    { id: "changzhou", excludedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.81, lng: 119.97 } },
    { id: "maanshan", excludedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.67, lng: 118.51 } },
    { id: "wuhu", excludedBlockId: "ningzhen-maoshan-hills", point: { lat: 31.35, lng: 118.43 } },
    { id: "changzhou", excludedBlockId: "yili-hills", point: { lat: 31.81, lng: 119.97 } },
    { id: "wuxi", excludedBlockId: "yili-hills", point: { lat: 31.49, lng: 120.31 } },
    { id: "suzhou", excludedBlockId: "yili-hills", point: { lat: 31.30, lng: 120.58 } },
    { id: "yixing", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.34, lng: 119.82 } },
    { id: "liyang", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.42, lng: 119.48 } },
    { id: "huzhou", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 30.89, lng: 120.09 } },
    { id: "jiaxing", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 30.75, lng: 120.76 } },
    { id: "maanshan", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.67, lng: 118.51 } },
    { id: "wuhu", excludedBlockId: "taihu-yangtze-delta-plain", point: { lat: 31.35, lng: 118.43 } },
    { id: "shaoguan", excludedBlockId: "pearl-river-delta-plain", point: { lat: 24.81, lng: 113.60 } },
    { id: "heyuan", excludedBlockId: "pearl-river-delta-plain", point: { lat: 23.74, lng: 114.70 } },
    { id: "taipei", excludedBlockId: "taiwan-mountains", point: { lat: 25.03, lng: 121.56 } },
    { id: "taichung", excludedBlockId: "taiwan-mountains", point: { lat: 24.15, lng: 120.67 } },
    { id: "tainan", excludedBlockId: "taiwan-mountains", point: { lat: 22.99, lng: 120.21 } },
    { id: "hualien", excludedBlockId: "taiwan-mountains", point: { lat: 23.99, lng: 121.60 } },
    { id: "yushan", excludedBlockId: "taiwan-western-plains", point: { lat: 23.47, lng: 120.96 } },
    { id: "xueshan", excludedBlockId: "taipei-basin", point: { lat: 24.38, lng: 121.23 } },
    { id: "haikou", excludedBlockId: "hainan-central-mountains", point: { lat: 20.04, lng: 110.32 } },
    { id: "sanya", excludedBlockId: "hainan-central-mountains", point: { lat: 18.25, lng: 109.51 } },
    { id: "wuzhi-mountain", excludedBlockId: "hainan-coastal-lowlands", point: { lat: 18.90, lng: 109.68 } },
    { id: "baoting", excludedBlockId: "hainan-coastal-lowlands", point: { lat: 18.64, lng: 109.70 } },
    { id: "mudanjiang", excludedBlockId: "northeast-plain", point: { lat: 44.58, lng: 129.60 } },
    { id: "yanji", excludedBlockId: "northeast-plain", point: { lat: 42.89, lng: 129.51 } },
    { id: "hulunbuir", excludedBlockId: "inner-mongolia-plateau", point: { lat: 49.21, lng: 119.76 } },
    { id: "hulunbuir", excludedBlockId: "greater-khingan-mountains", point: { lat: 49.21, lng: 119.76 } },
    { id: "manzhouli", excludedBlockId: "greater-khingan-mountains", point: { lat: 49.60, lng: 117.43 } },
    { id: "yakeshi", excludedBlockId: "hulunbuir-grassland-plateau", point: { lat: 49.28, lng: 120.73 } },
    { id: "genhe", excludedBlockId: "hulunbuir-grassland-plateau", point: { lat: 50.78, lng: 121.52 } },
    { id: "qiqihar", excludedBlockId: "hulunbuir-grassland-plateau", point: { lat: 47.35, lng: 123.92 } },
    { id: "yichun", excludedBlockId: "sanjiang-plain", point: { lat: 47.72, lng: 128.84 } },
    { id: "yichun", excludedBlockId: "northeast-plain", point: { lat: 47.72, lng: 128.84 } },
    { id: "mudanjiang", excludedBlockId: "sanjiang-plain", point: { lat: 44.58, lng: 129.60 } },
    { id: "yanji", excludedBlockId: "sanjiang-plain", point: { lat: 42.89, lng: 129.51 } },
    { id: "jiamusi", excludedBlockId: "mudanjiang-valley-basin", point: { lat: 46.80, lng: 130.32 } },
    { id: "harbin", excludedBlockId: "mudanjiang-valley-basin", point: { lat: 45.75, lng: 126.64 } },
    { id: "changbai-mountain", excludedBlockId: "yanbian-tumen-basin", point: { lat: 42.00, lng: 128.06 } },
    { id: "baishan", excludedBlockId: "yanbian-tumen-basin", point: { lat: 41.94, lng: 126.42 } },
    { id: "yanji", excludedBlockId: "changbai-volcanic-mountains", point: { lat: 42.89, lng: 129.51 } },
    { id: "hunchun", excludedBlockId: "changbai-volcanic-mountains", point: { lat: 42.86, lng: 130.37 } },
    { id: "kuandian", excludedBlockId: "changbai-volcanic-mountains", point: { lat: 40.73, lng: 124.78 } },
    { id: "mudanjiang", excludedBlockId: "yanbian-tumen-basin", point: { lat: 44.58, lng: 129.60 } },
    { id: "yanji", excludedBlockId: "mudanjiang-valley-basin", point: { lat: 42.89, lng: 129.51 } },
    { id: "jiamusi", excludedBlockId: "zhangguangcai-laoye-mountains", point: { lat: 46.80, lng: 130.32 } },
    { id: "tumen", excludedBlockId: "zhangguangcai-laoye-mountains", point: { lat: 42.97, lng: 129.84 } },
    { id: "jiamusi", excludedBlockId: "lesser-khingan-mountains", point: { lat: 46.80, lng: 130.32 } },
    { id: "qiqihar", excludedBlockId: "greater-khingan-mountains", point: { lat: 47.35, lng: 123.92 } },
    { id: "suihua", excludedBlockId: "lesser-khingan-mountains", point: { lat: 46.63, lng: 126.98 } },
    { id: "songyuan", excludedBlockId: "northeast-plain", point: { lat: 45.14, lng: 124.83 } },
    { id: "heihe", excludedBlockId: "songnen-plain", point: { lat: 50.25, lng: 127.53 } },
    { id: "benxi", excludedBlockId: "northeast-plain", point: { lat: 41.30, lng: 123.76 } },
    { id: "fushun", excludedBlockId: "liaohe-plain", point: { lat: 41.88, lng: 123.96 } },
    { id: "kuandian", excludedBlockId: "northeast-mountains", point: { lat: 40.73, lng: 124.78 } },
    { id: "shenyang", excludedBlockId: "liaodong-hills", point: { lat: 41.80, lng: 123.43 } },
    { id: "panjin", excludedBlockId: "liaodong-hills", point: { lat: 41.12, lng: 122.07 } },
    { id: "anshan", excludedBlockId: "liaodong-hills", point: { lat: 41.10, lng: 122.99 } },
    { id: "haicheng", excludedBlockId: "liaodong-hills", point: { lat: 40.85, lng: 122.75 } },
    { id: "guilin", excludedBlockId: "yunnan-guizhou-plateau", point: { lat: 25.27, lng: 110.29 } },
    { id: "guilin", excludedBlockId: "pearl-river-delta-plain", point: { lat: 25.27, lng: 110.29 } },
  ];

  exclusions.forEach((anchor) => {
    const matchingBlockIds = FIVE_TERRAIN_BLOCKS
      .filter((block) => isPointInsidePolygon(anchor.point, block.polygon))
      .map((block) => block.id);

    assert.ok(
      !matchingBlockIds.includes(anchor.excludedBlockId),
      `${anchor.id} should not be inside ${anchor.excludedBlockId}; matched ${matchingBlockIds.join(", ") || "none"}`
    );
  });
});

test("major water systems include first-pass river distribution", () => {
  assert.deepEqual(
    CHINA_WATER_SYSTEMS.map((river) => river.id),
    ["yangtze", "yellow", "pearl", "heilongjiang", "lancang"]
  );
  assert.ok(CHINA_WATER_SYSTEMS.every((river) => river.path.length >= 4));
  assert.ok(CHINA_WATER_SYSTEMS.every((river) => river.path.every((point) => isInRegion(point, CHINA_REGION))));
});

test("boundary layers include national outline and province guides", () => {
  assert.ok(CHINA_BOUNDARY.path.length >= 24);
  assert.ok(CHINA_BOUNDARY.path.every((point) => isInRegion(point, CHINA_REGION)));
  assert.ok(CHINA_PROVINCE_BOUNDARY_GUIDES.length >= 18);
  assert.ok(CHINA_PROVINCE_BOUNDARY_GUIDES.every((line) => line.path.length >= 2));
});

test("terrain coverage summary reports completed layers and next gaps", () => {
  const summary = summarizeTerrainCoverage();
  assert.ok(summary.blocks >= 9);
  assert.equal(summary.waterSystems, 5);
  assert.ok(summary.boundaryGuides >= 18);
  assert.ok(summary.completed.includes("主要地貌板块"));
  assert.ok(summary.completed.includes("SRTM90m DEM 中密度网格"));
  assert.ok(summary.completed.includes("精确国界/省界 GeoJSON"));
  assert.ok(summary.completed.includes("Natural Earth 湖泊/海岸线参考层"));
  assert.equal(summary.nextGaps.includes("用真实 DEM 替换程序化高程"), false);
  assert.equal(summary.nextGaps.includes("接入精确国界/省界 GeoJSON"), false);
  assert.equal(summary.nextGaps.includes("补充湖泊、海岸线、台湾岛和南海诸岛表达"), false);
  assert.ok(summary.nextGaps.includes("补充南海诸岛与更细海岸线表达"));
});
