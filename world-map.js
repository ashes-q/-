(async function initChinaTerrainAtlas() {
  const Core = window.WorldMapCore;
  const container = document.querySelector("#mapCanvas");
  const autoRotateBtn = document.querySelector("#autoRotateBtn");
  const resetViewBtn = document.querySelector("#resetViewBtn");
  const focusChinaBtn = document.querySelector("#focusChinaBtn");
  const manualTraceBtn = document.querySelector("#manualTraceBtn");
  const generateManualTraceBtn = document.querySelector("#generateManualTraceBtn");
  const undoManualTraceBtn = document.querySelector("#undoManualTraceBtn");
  const reverseManualTraceBtn = document.querySelector("#reverseManualTraceBtn");
  const closeManualTraceBtn = document.querySelector("#closeManualTraceBtn");
  const simplifyManualTraceBtn = document.querySelector("#simplifyManualTraceBtn");
  const smoothManualTraceBtn = document.querySelector("#smoothManualTraceBtn");
  const deleteManualTracePointBtn = document.querySelector("#deleteManualTracePointBtn");
  const clearManualTraceBtn = document.querySelector("#clearManualTraceBtn");
  const zoomInBtn = document.querySelector("#zoomInBtn");
  const zoomOutBtn = document.querySelector("#zoomOutBtn");
  const hoverLabel = document.querySelector("#hoverLabel");
  const selectedTitle = document.querySelector("#selectedTitle");
  const selectedMeta = document.querySelector("#selectedMeta");
  const selectedMetricLabel = document.querySelector("#selectedMetricLabel");
  const selectedMetric = document.querySelector("#selectedMetric");
  const selectedZoom = document.querySelector("#selectedZoom");
  const viewZoomRange = document.querySelector("#viewZoomRange");
  const viewZoomValue = document.querySelector("#viewZoomValue");
  const terrainViewPresetButtons = document.querySelectorAll("[data-view-preset]");
  const terrainReliefRange = document.querySelector("#terrainReliefRange");
  const terrainReliefValue = document.querySelector("#terrainReliefValue");
  const focusInspectionLayersBtn = document.querySelector("#focusInspectionLayersBtn");
  const terrainDetailDensityButtons = document.querySelectorAll("[data-detail-density-mode]");
  const terrainDetailDensityStatus = document.querySelector("#terrainDetailDensityStatus");
  const terrainObservationModeStatus = document.querySelector("#terrainObservationModeStatus");
  const terrainDetailLodGuidance = document.querySelector("#terrainDetailLodGuidance");
  const terrainDetailLodSummary = document.querySelector("#terrainDetailLodSummary");
  const terrainDetailLodRecipe = document.querySelector("#terrainDetailLodRecipe");
  const terrainDetailApplyRecipeBtn = document.querySelector("#terrainDetailApplyRecipeBtn");
  const traceProfile = document.querySelector("#traceProfile");
  const terrainTileTraceSummary = document.querySelector("#terrainTileTraceSummary");
  const terrainTileInspectStatus = document.querySelector("#terrainTileInspectStatus");
  const terrainTileInspectContext = document.querySelector("#terrainTileInspectContext");
  const terrainTilePipelineStatus = document.querySelector("#terrainTilePipelineStatus");
  const terrainTilePipelineChips = document.querySelector("#terrainTilePipelineChips");
  const terrainTileWorkflowInspector = document.querySelector("#terrainTileWorkflowInspector");
  const terrainTileRenderQa = document.querySelector("#terrainTileRenderQa");
  const terrainTileVisualRecommendation = document.querySelector("#terrainTileVisualRecommendation");
  const applyTerrainTileVisualRecommendationBtn = document.querySelector("#applyTerrainTileVisualRecommendationBtn");
  const terrainTileVisualPresetButtons = document.querySelectorAll("[data-terrain-tile-visual-preset]");
  const manualTraceStatus = document.querySelector("#manualTraceStatus");
  const terrainWorkflowSummary = document.querySelector("#terrainWorkflowSummary");
  const siteButtons = document.querySelector("#siteButtons");
  const cityPanel = document.querySelector("#cityPanel");
  const cityButtons = document.querySelector("#cityButtons");
  const layerLegend = document.querySelector("#layerLegend");
  const layerSummary = document.querySelector("#layerSummary");
  const patchConsole = document.querySelector("#patchConsole");
  const applyApprovedPatchesBtn = document.querySelector("#applyApprovedPatchesBtn");
  const patchButtons = document.querySelector("#patchButtons");
  const terrainTilePanel = document.querySelector("#terrainTilePanel");
  const terrainTileButtons = document.querySelector("#terrainTileButtons");
  const startTerrainTileTraceBtn = document.querySelector("#startTerrainTileTraceBtn");
  const seedRidgeTraceBtn = document.querySelector("#seedRidgeTraceBtn");
  const seedValleyTraceBtn = document.querySelector("#seedValleyTraceBtn");
  const generateRecommendedTileSuggestionsBtn = document.querySelector("#generateRecommendedTileSuggestionsBtn");
  const terrainSourcePanel = document.querySelector("#terrainSourcePanel");
  const terrainSourceButtons = document.querySelector("#terrainSourceButtons");
  const traceButtons = document.querySelector("#traceButtons");
  const suggestionButtons = document.querySelector("#suggestionButtons");

  const MANUAL_TRACE_STORAGE_KEY = "china-terrain-atlas:manual-trace-draft";
  const MANUAL_SUGGESTIONS_STORAGE_KEY = "china-terrain-atlas:manual-trace-suggestions";

  const TERRAINS = {
    low: new THREE.Color("#365f58"),
    plain: new THREE.Color("#6d8f62"),
    basin: new THREE.Color("#8b8062"),
    high: new THREE.Color("#92745c"),
    snow: new THREE.Color("#b8c7c8"),
  };
  const SITE_COLORS = {
    cyan: new THREE.Color("#00f5d4"),
    gold: new THREE.Color("#f4d28a"),
    green: new THREE.Color("#85d58b"),
    ice: new THREE.Color("#b8e7ff"),
    sand: new THREE.Color("#c1a074"),
  };
  const BLOCK_COLORS = {
    snow: new THREE.Color("#d6e6e9"),
    sand: new THREE.Color("#b79668"),
    loess: new THREE.Color("#ad8a56"),
    basin: new THREE.Color("#6f8a5f"),
    karst: new THREE.Color("#8cb47b"),
    plain: new THREE.Color("#6aa77e"),
    waterplain: new THREE.Color("#5ea1a0"),
  };
  const BLOCK_TEXTURE_COLORS = {
    snow: {
      low: new THREE.Color("#7c837b"),
      mid: new THREE.Color("#a89a86"),
      high: new THREE.Color("#edf5f2"),
    },
    sand: {
      low: new THREE.Color("#7f6643"),
      mid: new THREE.Color("#c6a362"),
      high: new THREE.Color("#e0c987"),
    },
    loess: {
      low: new THREE.Color("#836742"),
      mid: new THREE.Color("#bd9a5b"),
      high: new THREE.Color("#d7b775"),
    },
    basin: {
      low: new THREE.Color("#455f4d"),
      mid: new THREE.Color("#77845a"),
      high: new THREE.Color("#a59a6f"),
    },
    karst: {
      low: new THREE.Color("#536d5b"),
      mid: new THREE.Color("#8fb184"),
      high: new THREE.Color("#b4b7a0"),
    },
    plain: {
      low: new THREE.Color("#49755c"),
      mid: new THREE.Color("#7dae72"),
      high: new THREE.Color("#b7b77a"),
    },
    waterplain: {
      low: new THREE.Color("#3d7776"),
      mid: new THREE.Color("#6ea59a"),
      high: new THREE.Color("#9bbd94"),
    },
  };
  const WATER_COLORS = {
    blue: new THREE.Color("#4ba3ff"),
    gold: new THREE.Color("#e0bb64"),
    cyan: new THREE.Color("#00f5d4"),
    ice: new THREE.Color("#b8e7ff"),
    green: new THREE.Color("#85d58b"),
  };
  const WATER_REFERENCE_COLORS = {
    lake: new THREE.Color("#7dd3fc"),
    reservoir: new THREE.Color("#38bdf8"),
    coastline: new THREE.Color("#d7f7ff"),
    island: new THREE.Color("#a7f3d0"),
  };
  const TERRAIN_DETAIL_TILE_COLOR_BANDS = [
    { id: "lowland", label: "Lowland", minMeters: 0, maxMeters: 700, low: new THREE.Color("#3f765d"), high: new THREE.Color("#8ea96a") },
    { id: "foothill", label: "Foothill", minMeters: 700, maxMeters: 1600, low: new THREE.Color("#7f8b59"), high: new THREE.Color("#b59a62") },
    { id: "mountain", label: "Mountain", minMeters: 1600, maxMeters: 3200, low: new THREE.Color("#8c7058"), high: new THREE.Color("#b29a82") },
    { id: "alpine", label: "Alpine", minMeters: 3200, maxMeters: 6200, low: new THREE.Color("#9ea2a0"), high: new THREE.Color("#d9e5e4") },
  ];
  const TRACE_COLORS = {
    ridge: new THREE.Color("#ffce6b"),
    "basin-edge": new THREE.Color("#ff7f6e"),
    valley: new THREE.Color("#79c7ff"),
  };
  const PROVINCE_BOUNDARY_COLOR = new THREE.Color("#7dd3fc");
  const PREFECTURE_BOUNDARY_COLOR = new THREE.Color("#f4d28a");
  const TERRAIN_LNG_STEPS = 620;
  const TERRAIN_LAT_STEPS = 360;
  const BLOCK_LNG_STEPS = 248;
  const BLOCK_LAT_STEPS = 144;
  const DEM_SOURCE_CANDIDATES = [
    "data/terrain/china-srtm90m-full.json",
    "data/terrain/china-srtm90m-medium.json",
    "data/terrain/china-srtm90m-sample.json",
  ];
  const LOCAL_DEM_TILE_INDEX_SOURCE = "data/terrain/china-local-dem-tile-index.json";
  const LOCAL_DEM_TILE_SOURCE = "data/terrain/china-local-dem-tiles.json";
  const TERRAIN_SOURCE_CATALOG_SOURCE = "data/terrain/china-terrain-source-catalog.json";
  const PROVINCE_BOUNDARY_SOURCE = {
    id: "geoboundaries-adm1",
    path: "data/raw/geoboundaries-chn-adm1-simplified.geojson",
    minRingPoints: 4,
    opacity: 0.38,
  };
  const PREFECTURE_BOUNDARY_SOURCE = {
    id: "cn-atlas-prefectures",
    path: "data/raw/cn-atlas-prefectures.geojson",
    minRingPoints: 6,
    opacity: 0.16,
    renderMaxPoints: 72,
  };
  const RIVER_SOURCE_CANDIDATES = [
    "data/terrain/china-rivers-hydrosheds.json",
    "data/terrain/china-rivers-natural-earth.json",
  ];
  const WATER_REFERENCE_SOURCE_CANDIDATES = [
    "data/terrain/china-water-references-hydrosheds.json",
    "data/terrain/china-water-references-natural-earth.json",
  ];
  const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const OPEN_METEO_CURRENT_FIELDS = "cloud_cover,wind_speed_10m,wind_direction_10m";
  const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
  const WEATHER_REQUEST_TIMEOUT_MS = 3500;
  const WEATHER_SAMPLE_POINTS = [
    { id: "xinjiang", lat: 43.8, lng: 87.6 },
    { id: "tibet", lat: 29.7, lng: 91.1 },
    { id: "qinghai", lat: 36.6, lng: 101.8 },
    { id: "sichuan", lat: 30.7, lng: 104.1 },
    { id: "north-china", lat: 39.9, lng: 116.4 },
    { id: "northeast", lat: 45.8, lng: 126.6 },
    { id: "yangtze-delta", lat: 31.2, lng: 121.5 },
    { id: "south-china", lat: 23.1, lng: 113.3 },
    { id: "yunnan-guizhou", lat: 25.0, lng: 102.7 },
  ];
  const TERRAIN_MESH_LIFT = 0.04;
  const TERRAIN_VERTICAL_EXAGGERATION = 0.24;
  const TERRAIN_HILLSHADE_SAMPLE_DEGREES = 0.08;
  const TERRAIN_HILLSHADE_EAST_WEST_GAIN = -2.4;
  const TERRAIN_HILLSHADE_NORTH_SOUTH_GAIN = 1.75;
  const TERRAIN_HILLSHADE_MIN = 0.54;
  const TERRAIN_HILLSHADE_MAX = 1.32;
  const TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES = 0.028;
  const TERRAIN_DETAIL_TILE_SLOPE_SHADE_EAST_WEST_GAIN = -0.00034;
  const TERRAIN_DETAIL_TILE_SLOPE_SHADE_NORTH_SOUTH_GAIN = 0.00026;
  const TERRAIN_DETAIL_TILE_SLOPE_SHADE_MIN = 0.68;
  const TERRAIN_DETAIL_TILE_SLOPE_SHADE_MAX = 1.28;
  const TERRAIN_DETAIL_TILE_EDGE_BLEND_DEGREES = 0.18;
  const TERRAIN_DETAIL_TILE_VISUAL_PRESETS = {
    natural: { id: "natural", label: "Natural", slopeGainScale: 1, edgeBlendDegrees: TERRAIN_DETAIL_TILE_EDGE_BLEND_DEGREES },
    relief: { id: "relief", label: "Relief", slopeGainScale: 1.24, edgeBlendDegrees: TERRAIN_DETAIL_TILE_EDGE_BLEND_DEGREES },
    "soft-edge": { id: "soft-edge", label: "Soft edge", slopeGainScale: 1, edgeBlendDegrees: 0.28 },
  };
  const TERRAIN_RELIEF_BAND_INTERVAL = 0.055;
  const TERRAIN_RELIEF_BAND_STRENGTH = 0.075;
  const TERRAIN_BLOCK_LIFT = 0.058;
  const TERRAIN_BLOCK_RELIEF_BLEND = 0.72;
  const TERRAIN_BLOCK_RELIEF_CONTRAST = 1.24;
  const TERRAIN_SURFACE_OVERLAY_LIFT = 0.064;
  const TERRAIN_SURFACE_MARKER_LIFT = 0.068;
  const WATER_MAIN_LIFT = 0.082;
  const WATER_TRIBUTARY_LIFT = 0.076;
  const WATER_LAKE_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const WATER_LAKE_RIPPLE_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT + 0.012;
  const WATER_COAST_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const WATER_MARKER_LIFT = 0.092;
  const BOUNDARY_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const PROVINCE_BOUNDARY_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const CONTOUR_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const TERRAIN_DETAIL_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const TERRAIN_TRACE_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const TERRAIN_SUGGESTION_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const TERRAIN_APPROVED_LIFT = TERRAIN_SURFACE_OVERLAY_LIFT;
  const TERRAIN_SITE_LIFT = TERRAIN_SURFACE_MARKER_LIFT;
  const WEATHER_CLOUD_LIFT = 0.13;
  const WEATHER_VECTOR_LIFT = 0.125;
  const WATER_MAIN_RADIUS = 0.004;
  const WATER_TRIBUTARY_RADIUS = 0.0026;
  const WATER_MAIN_GLOW_RADIUS = 0.006;
  const WATER_TRIBUTARY_GLOW_RADIUS = 0.004;
  const WATER_FLOW_DOT_RADIUS = 0.007;
  const WATER_FLOW_HALO_RADIUS = 0.018;
  const WATER_FLOW_ARROW_RADIUS = 0.011;
  const WATER_FLOW_ARROW_LENGTH = 0.032;
  const TERRAIN_TILE_INSPECTION_ZOOM = 2.58;
  const TERRAIN_TILE_REFERENCE_LAYER_CACHE_LIMIT = 3;
  const TERRAIN_TILE_REFERENCE_LAYER_STAGES = [
    { id: "contours", run: (tile) => createTerrainDetailTileContours(tile) },
    { id: "boundaries", run: (tile) => createTerrainDetailTileBoundaries(tile) },
    { id: "water", run: (tile) => createTerrainDetailTileWaterReferences(tile) },
    { id: "traceGuides", run: (tile) => createTerrainDetailTileTraceGuides(tile) },
  ];
  const TERRAIN_TILE_CITY_LABEL_PADDING_DEGREES = 0.35;
  const TERRAIN_DETAIL_LOD_NEAR_DISTANCE = 3.15;
  const TERRAIN_DETAIL_LOD_MID_DISTANCE = 4.35;
  const ZOOM_INPUT_SCALE = 0.0038;
  const IDLE_PIXEL_RATIO_MAX = 2;
  const INTERACTION_PIXEL_RATIO_MAX = 1.25;
  const INTERACTION_PIXEL_RATIO_RESTORE_MS = 180;
  const INTERACTION_SCREEN_UPDATE_INTERVAL_MS = 64;
  const CITY_LABEL_NEAR_DISTANCE = 3.35;
  const CITY_LABEL_MID_DISTANCE = 4.55;
  const CITY_LABEL_IDLE_UPDATE_INTERVAL_MS = 120;
  const CITY_LABEL_INTERACTION_UPDATE_INTERVAL_MS = 220;
  const CITY_LABEL_PROJECTION_Z_BUCKET = 0.04;
  const CITY_LABEL_PROJECTION_ROTATION_BUCKET = 0.006;
  const INTERACTION_EFFECT_UPDATE_INTERVAL_MS = 48;
  const INTERACTION_HOTSPOT_UPDATE_INTERVAL_MS = 96;
  const INTERACTION_VIEW_CONTROL_SYNC_INTERVAL_MS = 80;
  const CAMERA_SETTLE_EPSILON = 0.025;
  const MAJOR_CITY_LABEL_IDS = new Set([
    "chengdu",
    "guangzhou",
    "shenzhen",
    "shanghai",
    "nanjing",
    "hangzhou",
    "hefei",
    "nanchang",
    "changsha",
    "jinan",
    "taiyuan",
    "guiyang",
    "fuzhou",
  ]);

  let state = Core.createInitialMapState({
    hotspots: [...Core.CHINA_TERRAIN_CITIES, ...Core.CHINA_TERRAIN_SITES],
    autoRotate: true,
    zoom: 5.6,
  });
  let layerVisibility = Core.createLayerVisibilityState();
  let terrainReliefScale = 1;
  let terrainDetailDensityMode = "auto";
  let terrainTileVisualPreset = "natural";
  let terrainTileVisualPresetRevision = 0;
  let patchVisibility = {};
  let traceVisibility = {};
  let suggestionVisibility = {};
  let approvedPatchVisibility = {};
  let approvedPatchTerrainPreviewEnabled = false;
  let selectedSuggestionPatchIds = new Set();
  let selectedSuggestionApprovedPreviewLayer = null;
  let openLayerGroupIds = new Set();
  let manualTraceEditMode = false;
  let selectedManualTraceId = null;
  let selectedManualTracePointIndex = null;
  let manualTraceMovedPointCount = 0;
  let manualTraceDeletedPointCount = 0;
  let selectedTerrainTileId = null;
  let manualTraceDraft = loadStoredManualTraceDraft();
  let terrainTileReferenceLayerFrame = 0;
  let terrainTileReferenceLayerToken = 0;
  let terrainTileReferenceLayerStageIndex = 0;
  let selectedTerrainTilePanelFrame = 0;
  let pendingWheelZoomDelta = 0;
  let wheelZoomFrame = 0;
  let interactionPixelRatioActive = false;
  let interactionReducedDetailActive = false;
  let interactionPixelRatioRestoreTimer = 0;
  let appliedRendererPixelRatio = 0;
  let lastScreenProjectionUpdateMs = 0;
  let lastCityLabelUpdateMs = 0;
  let cityLabelUpdateFrame = 0;
  let cityLabelSkippedWriteCount = 0;
  let cityLabelProjectionCacheKey = "";
  let cityLabelProjectionCacheState = null;
  let cityLabelProjectionCacheHitCount = 0;
  let cityMarkerVisibilityCacheKey = "";
  let cityMarkerVisibilityCache = null;
  let cityMarkerVisibilityCacheHitCount = 0;
  let cityMarkerVisibilityCacheMissCount = 0;
  let lastMotionEffectUpdateMs = 0;
  let lastHotspotPulseUpdateMs = 0;
  let lastViewControlPanelSyncMs = 0;
  let viewControlPanelSyncFrame = 0;
  const terrainDetailTileLoadPromises = new Map();
  const terrainTileReferenceLayerCache = new Map();
  const terrainTileSurfaceCache = new Map();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090b, 0.046);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 0.24, state.zoom);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const raycaster = new THREE.Raycaster();
  const raycastMouse = new THREE.Vector2();
  const rotationTarget = { x: 0.42, y: -1.8 };
  const pointer = { x: 0, y: 0, down: false, moved: false, lastX: 0, lastY: 0 };
  const hotspotMeshes = new Map();
  const cityMeshes = new Map();
  const cityLabelElements = new Map();
  const terrainBlockLabelElements = new Map();
  const hotspotScreen = [];
  const hotspotProjectionPosition = new THREE.Vector3();
  const cityLabelProjectionPosition = new THREE.Vector3();
  const terrainBlockLabelProjectionPosition = new THREE.Vector3();
  let terrainBlockLabelProjectionCacheKey = "";
  let terrainBlockLabelProjectionCacheState = null;
  let terrainBlockLabelProjectionCacheHitCount = 0;
  const terrainPickTargets = [];
  const fallbackBoundaryGroup = new THREE.Group();
  const provinceBoundaryGroup = new THREE.Group();
  const prefectureBoundaryGroup = new THREE.Group();
  const terrainContourGroup = new THREE.Group();
  const terrainDetailTileSurfaceGroup = new THREE.Group();
  const terrainDetailTileContourGroup = new THREE.Group();
  const terrainDetailTileBoundaryGroup = new THREE.Group();
  const terrainDetailTileWaterGroup = new THREE.Group();
  const terrainDetailTileTraceGuideGroup = new THREE.Group();
  const terrainPatchGroup = new THREE.Group();
  const terrainTraceGroup = new THREE.Group();
  const terrainManualTraceGroup = new THREE.Group();
  const terrainTraceProfileMarkerGroup = new THREE.Group();
  const terrainSuggestionPatchGroup = new THREE.Group();
  const terrainApprovedPatchGroup = new THREE.Group();
  const waterReferenceGroup = new THREE.Group();
  const weatherCloudFlowGroup = new THREE.Group();
  const interactionDetailGroups = [
    provinceBoundaryGroup,
    prefectureBoundaryGroup,
    terrainContourGroup,
    terrainDetailTileContourGroup,
    terrainDetailTileBoundaryGroup,
    terrainDetailTileWaterGroup,
    terrainDetailTileTraceGuideGroup,
    waterReferenceGroup,
    weatherCloudFlowGroup,
  ];
  const waterFlowMarkers = [];
  const waterFlowDirectionArrows = [];
  const lakeReferenceMeshes = [];
  const lakeRippleMarkers = [];
  const weatherCloudParticles = [];
  const clock = new THREE.Clock();
  let terrainElevationGrid = null;
  let terrainRegionMask = null;
  let provinceBoundaryLayer = null;
  let prefectureBoundaryLayer = null;
  let terrainDetailTiles = null;
  let terrainSourceCatalog = null;
  let terrainDetailPatches = null;
  let terrainTraceGuides = null;
  let terrainPatchSuggestions = null;
  let manualTraceSuggestionCount = 0;
  let manualTraceRadialSuggestionCount = 0;
  let manualTraceLineBandSuggestionCount = 0;
  let manualTracePolygonMaskSuggestionCount = 0;
  let terrainApprovedPatches = null;
  let chinaRiverCenterlines = null;
  let chinaWaterReferences = null;
  let weatherCloudFlow = null;
  let weatherRefreshTimer = null;

  setupDebugApi();
  updateTraceProfileMarkerDebug();
  syncAdministrativeBoundaryDebugState();
  syncTerrainDetailTileSurfaceDebugState();
  syncTerrainTileVisualPresetControls();
  setupLights();
  worldGroup.add(fallbackBoundaryGroup);
  worldGroup.add(provinceBoundaryGroup);
  worldGroup.add(prefectureBoundaryGroup);
  worldGroup.add(terrainContourGroup);
  worldGroup.add(terrainDetailTileSurfaceGroup);
  worldGroup.add(terrainDetailTileContourGroup);
  worldGroup.add(terrainDetailTileBoundaryGroup);
  worldGroup.add(terrainDetailTileWaterGroup);
  worldGroup.add(terrainDetailTileTraceGuideGroup);
  worldGroup.add(terrainPatchGroup);
  worldGroup.add(terrainTraceGroup);
  worldGroup.add(terrainManualTraceGroup);
  worldGroup.add(terrainTraceProfileMarkerGroup);
  worldGroup.add(terrainSuggestionPatchGroup);
  worldGroup.add(terrainApprovedPatchGroup);
  worldGroup.add(waterReferenceGroup);
  worldGroup.add(weatherCloudFlowGroup);
  createStars();
  createEarth();
  await loadTerrainSourceCatalog();
  await loadTerrainElevationGrid();
  await loadTerrainDetailTiles();
  await loadTerrainRegionMask();
  await loadTerrainDetailPatches();
  await loadTerrainTraceGuides();
  await loadTerrainPatchSuggestions();
  const storedManualSuggestions = loadStoredManualTraceSuggestions();
  mergeManualTraceSuggestions(storedManualSuggestions);
  await loadTerrainApprovedPatches();
  await loadChinaRiverCenterlines();
  await loadChinaWaterReferences();
  weatherCloudFlow = createFallbackWeatherLayer();
  patchVisibility = Core.createDetailPatchVisibilityState(terrainDetailPatches);
  traceVisibility = Core.createTerrainTraceVisibilityState(terrainTraceGuides);
  suggestionVisibility = Core.createTerrainPatchSuggestionGroupVisibilityState(terrainPatchSuggestions);
  approvedPatchVisibility = Core.createDetailPatchVisibilityState(terrainApprovedPatches);
  createChinaTerrain();
  createTerrainBlocks();
  createTerrainContours();
  createWaterSystems();
  createWaterReferenceOutlines();
  createWeatherCloudFlow(weatherCloudFlow);
  createChinaBoundary();
  createTerrainDetailPatches();
  createTerrainTraceGuides();
  createTerrainPatchSuggestions();
  createTerrainApprovedPatches();
  renderManualTraceDraft();
  createTerrainSites();
  createTerrainCities();
  createCityLabels();
  createTerrainBlockLabels();
  applyLayerVisibility();
  renderPatchButtons();
  renderApprovedPatchButtons();
  renderTerrainTileButtons();
  renderTerrainSourceButtons();
  renderTraceButtons();
  renderSuggestionButtons();
  renderCityButtons();
  renderSiteButtons();
  renderLayerSummary();
  loadProvinceBoundaries();
  bindEvents();
  focusOnChina();
  resize();
  updateSelectedPanel();
  animate();
  refreshWeatherCloudFlow();

  function setupDebugApi() {
    window.ChinaTerrainAtlasDebug = {
      getWorldUserData: () => ({
        ...worldGroup.userData,
        terrainTraceProfileMarkerRoles: [
          ...(worldGroup.userData.terrainTraceProfileMarkerRoles || []),
        ],
        terrainTraceProfileMarkerVisibleCount: terrainTraceProfileMarkerGroup.children
          .filter((object) => object.visible)
          .length,
      }),
    };
  }

  function createDefaultManualTraceDraft() {
    return Core.createManualTerrainTraceDraft({
      id: "manual-terrain-trace-draft",
      label: "临摹草稿",
      kind: "ridge",
    });
  }

  function loadStoredManualTraceDraft() {
    const fallback = createDefaultManualTraceDraft();
    try {
      const rawDraft = localStorage.getItem(MANUAL_TRACE_STORAGE_KEY);
      if (!rawDraft) return fallback;
      const storedDraft = JSON.parse(rawDraft);
      if (!storedDraft || !Array.isArray(storedDraft.points)) {
        throw new Error("Stored manual trace draft is invalid");
      }
      const baseDraft = Core.createManualTerrainTraceDraft({
        id: storedDraft.id || fallback.id,
        label: storedDraft.label || fallback.label,
        kind: storedDraft.kind || fallback.kind,
      });
      const restoredDraft = storedDraft.points.reduce(
        (draft, point) => Core.addManualTerrainTracePoint(draft, point),
        baseDraft
      );
      const shapeDraft = storedDraft.closed
        ? Core.closeManualTerrainTraceDraft(restoredDraft)
        : restoredDraft;
      return {
        ...shapeDraft,
        sourceTileId: storedDraft.sourceTileId || null,
        sourceTileBounds: storedDraft.sourceTileBounds || null,
        seedKind: storedDraft.seedKind || "",
        simplifiedPointCount: Number(storedDraft.simplifiedPointCount) || 0,
        smoothedPointCount: Number(storedDraft.smoothedPointCount) || 0,
      };
    } catch (error) {
      console.warn(error);
      try {
        localStorage.removeItem(MANUAL_TRACE_STORAGE_KEY);
      } catch (removeError) {
        console.warn(removeError);
      }
      return fallback;
    }
  }

  function saveManualTraceDraft() {
    try {
      const pointCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
      if (!pointCount) {
        localStorage.removeItem(MANUAL_TRACE_STORAGE_KEY);
        return;
      }
      localStorage.setItem(MANUAL_TRACE_STORAGE_KEY, JSON.stringify(manualTraceDraft));
    } catch (error) {
      console.warn(error);
    }
  }

  function loadStoredManualTraceSuggestions() {
    try {
      const rawSuggestions = localStorage.getItem(MANUAL_SUGGESTIONS_STORAGE_KEY);
      if (!rawSuggestions) return [];
      const storedSuggestions = JSON.parse(rawSuggestions);
      const patches = Array.isArray(storedSuggestions)
        ? storedSuggestions
        : storedSuggestions && storedSuggestions.patches;
      if (!Array.isArray(patches)) {
        throw new Error("Stored manual trace suggestions are invalid");
      }
      return patches.filter((patch) => {
        if (!patch || patch.sourceTraceId !== manualTraceDraft.id || !Number.isFinite(Number(patch.deltaMeters))) {
          return false;
        }
        if (patch.kind === "line-band") {
          return Array.isArray(patch.points) &&
            patch.points.length >= 2 &&
            Number.isFinite(Number(patch.widthDegrees));
        }
        if (patch.kind === "polygon-mask") {
          return Array.isArray(patch.points) &&
            patch.points.length >= 3 &&
            Number.isFinite(Number(patch.edgeFeatherDegrees));
        }
        return patch.center &&
          Number.isFinite(Number(patch.center.lat)) &&
          Number.isFinite(Number(patch.center.lng)) &&
          Number.isFinite(Number(patch.radiusDegrees));
      });
    } catch (error) {
      console.warn(error);
      try {
        localStorage.removeItem(MANUAL_SUGGESTIONS_STORAGE_KEY);
      } catch (removeError) {
        console.warn(removeError);
      }
      return [];
    }
  }

  function saveManualTraceSuggestions(manualPatches) {
    try {
      if (!Array.isArray(manualPatches) || !manualPatches.length) {
        localStorage.removeItem(MANUAL_SUGGESTIONS_STORAGE_KEY);
        return;
      }
      localStorage.setItem(MANUAL_SUGGESTIONS_STORAGE_KEY, JSON.stringify(manualPatches));
    } catch (error) {
      console.warn(error);
    }
  }

  function manualTraceSuggestionShapeSummary(patches) {
    const summary = {
      radial: 0,
      lineBand: 0,
      polygonMask: 0,
    };
    (Array.isArray(patches) ? patches : []).forEach((patch) => {
      if (!patch) return;
      if (patch.kind === "polygon-mask") {
        summary.polygonMask += 1;
      } else if (patch.kind === "line-band") {
        summary.lineBand += 1;
      } else {
        summary.radial += 1;
      }
    });
    return summary;
  }

  function syncManualTraceSuggestionShapeCounts(manualPatches) {
    const summary = manualTraceSuggestionShapeSummary(manualPatches);
    manualTraceRadialSuggestionCount = summary.radial;
    manualTraceLineBandSuggestionCount = summary.lineBand;
    manualTracePolygonMaskSuggestionCount = summary.polygonMask;
    return summary;
  }

  function mergeManualTraceSuggestions(storedManualSuggestions) {
    const manualPatches = Array.isArray(storedManualSuggestions) ? storedManualSuggestions : [];
    if (!manualPatches.length) {
      manualTraceSuggestionCount = 0;
      syncManualTraceSuggestionShapeCounts([]);
      return;
    }
    const existingPatches = terrainPatchSuggestions && Array.isArray(terrainPatchSuggestions.patches)
      ? terrainPatchSuggestions.patches
      : [];
    terrainPatchSuggestions = {
      id: "china-trace-patch-suggestions",
      type: "terrain-detail-patch-suggestions",
      units: "meters",
      patches: [
        ...existingPatches.filter((patch) => patch.sourceTraceId !== manualTraceDraft.id),
        ...manualPatches,
      ],
    };
    manualTraceSuggestionCount = manualPatches.length;
    syncManualTraceSuggestionShapeCounts(manualPatches);
    worldGroup.userData.terrainPatchSuggestionCount = terrainPatchSuggestions.patches.length;
  }

  function clearManualTraceSuggestions() {
    if (terrainPatchSuggestions && Array.isArray(terrainPatchSuggestions.patches)) {
      terrainPatchSuggestions = {
        ...terrainPatchSuggestions,
        patches: terrainPatchSuggestions.patches.filter((patch) => patch.sourceTraceId !== manualTraceDraft.id),
      };
      worldGroup.userData.terrainPatchSuggestionCount = terrainPatchSuggestions.patches.length;
    }
    manualTraceSuggestionCount = 0;
    syncManualTraceSuggestionShapeCounts([]);
    saveManualTraceSuggestions([]);
  }

  function setupLights() {
    scene.add(new THREE.AmbientLight(0x9db8cf, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 1.08);
    key.position.set(3.8, 3.2, 5.8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x00f5d4, 0.5);
    rim.position.set(-6, -2.5, -3);
    scene.add(rim);
  }

  function createStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 820; i += 1) {
      const radius = 18 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    scene.add(new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xd8f8ff,
        size: 0.035,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      })
    ));
  }

  function createEarth() {
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(Core.DEFAULT_RADIUS, 96, 64),
      new THREE.MeshPhongMaterial({
        color: 0x10202a,
        emissive: 0x061116,
        shininess: 18,
        transparent: true,
        opacity: 0.7,
      })
    );
    worldGroup.add(globe);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(Core.DEFAULT_RADIUS * 1.035, 96, 64),
      new THREE.MeshBasicMaterial({
        color: 0x73a7ff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      })
    );
    worldGroup.add(atmosphere);

    for (let lng = 75; lng <= 135; lng += 10) {
      worldGroup.add(createLine(buildLongitude(lng), 0x7fd8ff, 0.12));
    }
    for (let lat = 20; lat <= 50; lat += 5) {
      worldGroup.add(createLine(buildLatitude(lat), 0xf4d28a, 0.09));
    }
  }

  function createChinaTerrain() {
    const bounds = Core.CHINA_REGION.bounds;
    const lngSteps = TERRAIN_LNG_STEPS;
    const latSteps = TERRAIN_LAT_STEPS;
    const positions = [];
    const colors = [];
    const indices = [];
    let terrainMaskSkippedCellCount = 0;
    let terrainMaskRenderedCellCount = 0;

    for (let y = 0; y <= latSteps; y += 1) {
      const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * (y / latSteps);
      for (let x = 0; x <= lngSteps; x += 1) {
        const lng = bounds.minLng + (bounds.maxLng - bounds.minLng) * (x / lngSteps);
        const elevation = terrainElevation(lat, lng);
        const radius = Core.DEFAULT_RADIUS + TERRAIN_MESH_LIFT + elevation * TERRAIN_VERTICAL_EXAGGERATION * terrainReliefScale;
        positions.push(...Core.latLngToVector3({ lat, lng, radius }));
        const color = terrainColor(elevation, terrainHillshade(lat, lng));
        colors.push(color.r, color.g, color.b);
      }
    }

    for (let y = 0; y < latSteps; y += 1) {
      for (let x = 0; x < lngSteps; x += 1) {
        const cellCenter = {
          lat: bounds.minLat + (bounds.maxLat - bounds.minLat) * ((y + 0.5) / latSteps),
          lng: bounds.minLng + (bounds.maxLng - bounds.minLng) * ((x + 0.5) / lngSteps),
        };
        if (terrainRegionMask && !Core.isPointInsideGeoBoundaryRings(cellCenter, terrainRegionMask)) {
          terrainMaskSkippedCellCount += 1;
          continue;
        }
        const a = y * (lngSteps + 1) + x;
        const b = a + 1;
        const c = a + (lngSteps + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
        terrainMaskRenderedCellCount += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const terrain = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
      })
    );
    terrain.userData.role = "china-terrain";
    worldGroup.add(terrain);
    terrainPickTargets.push(terrain);
    worldGroup.userData.terrainMaskSkippedCellCount = terrainMaskSkippedCellCount;
    worldGroup.userData.terrainMaskRenderedCellCount = terrainMaskRenderedCellCount;
    worldGroup.userData.terrainMaskSource = terrainRegionMask
      ? worldGroup.userData.terrainMaskSource || "geoboundaries-adm1"
      : "region-bounds-fallback";
    container.dataset.terrainMaskSource = worldGroup.userData.terrainMaskSource;
    container.dataset.terrainMaskSkippedCellCount = String(terrainMaskSkippedCellCount);
    container.dataset.terrainMaskRenderedCellCount = String(terrainMaskRenderedCellCount);

    const terrainWireOpacity = 0;
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: 0xd8f8ff,
        transparent: true,
        opacity: terrainWireOpacity,
        depthWrite: false,
      })
    );
    wire.userData.role = "terrain-wire";
    worldGroup.add(wire);
  }

  function terrainColor(elevation, hillshade = 1) {
    let color;
    if (elevation > 0.58) {
      color = TERRAINS.snow.clone().lerp(TERRAINS.high, 0.22);
    } else if (elevation > 0.38) {
      color = TERRAINS.high.clone().lerp(TERRAINS.snow, (elevation - 0.38) / 0.4);
    } else if (elevation > 0.2) {
      color = TERRAINS.basin.clone().lerp(TERRAINS.high, (elevation - 0.2) / 0.18);
    } else {
      color = TERRAINS.low.clone().lerp(TERRAINS.plain, elevation / 0.2);
    }
    return color.multiplyScalar(hillshade).multiplyScalar(terrainReliefBand(elevation));
  }

  function terrainReliefBand(elevation) {
    const normalizedElevation = Math.max(0, Number(elevation) || 0) / TERRAIN_RELIEF_BAND_INTERVAL;
    const band = (Math.sin(normalizedElevation * Math.PI * 2) + 1) * 0.5;
    return 1 - band * TERRAIN_RELIEF_BAND_STRENGTH;
  }

  function terrainBlockSurfaceColor(block, elevation, lat, lng) {
    const textureColor = terrainToneTextureColor(block.tone, elevation, lat, lng);
    const reliefColor = terrainColor(elevation, terrainHillshade(lat, lng));
    const color = textureColor.clone().lerp(reliefColor, TERRAIN_BLOCK_RELIEF_BLEND);
    color.multiplyScalar(TERRAIN_BLOCK_RELIEF_CONTRAST);
    return color;
  }

  function terrainToneTextureColor(tone, elevation, lat, lng) {
    const texture = BLOCK_TEXTURE_COLORS[tone] || BLOCK_TEXTURE_COLORS.plain;
    const normalized = Core.clamp(Number(elevation) || 0, 0, 1);
    const noise = terrainTextureNoise(lat, lng);
    const color = normalized < 0.48
      ? texture.low.clone().lerp(texture.mid, normalized / 0.48)
      : texture.mid.clone().lerp(texture.high, (normalized - 0.48) / 0.52);
    const dryTones = new Set(["sand", "loess"]);
    const wetTones = new Set(["waterplain", "plain", "basin"]);
    if (dryTones.has(tone)) {
      color.offsetHSL(0.012 * noise, -0.035 + noise * 0.025, 0.08 * noise);
    } else if (wetTones.has(tone)) {
      color.offsetHSL(-0.018 * noise, 0.025 + noise * 0.025, 0.045 * noise);
    } else {
      color.offsetHSL(0.008 * noise, 0.018 * noise, 0.055 * noise);
    }
    return color;
  }

  function terrainDetailTileColorBand(meters) {
    const safeMeters = Math.max(0, Number(meters) || 0);
    return TERRAIN_DETAIL_TILE_COLOR_BANDS.find((band) => safeMeters <= band.maxMeters) ||
      TERRAIN_DETAIL_TILE_COLOR_BANDS[TERRAIN_DETAIL_TILE_COLOR_BANDS.length - 1];
  }

  function terrainDetailTileSurfaceColor(meters, elevation, lat, lng, slopeShade = 1) {
    const band = terrainDetailTileColorBand(meters);
    const span = Math.max(1, band.maxMeters - band.minMeters);
    const t = Core.clamp((Math.max(0, Number(meters) || 0) - band.minMeters) / span, 0, 1);
    const noise = terrainTextureNoise(lat, lng);
    const color = band.low.clone().lerp(band.high, t);
    color.offsetHSL(0.008 * noise, 0.018 + noise * 0.018, 0.045 * noise);
    return color
      .multiplyScalar(terrainHillshade(lat, lng))
      .multiplyScalar(slopeShade)
      .multiplyScalar(terrainReliefBand(elevation));
  }

  function terrainTileVisualSettings() {
    return TERRAIN_DETAIL_TILE_VISUAL_PRESETS[terrainTileVisualPreset] || TERRAIN_DETAIL_TILE_VISUAL_PRESETS.natural;
  }

  function terrainDetailTileSlopeShade(lat, lng) {
    const slopeGainScale = terrainTileVisualSettings().slopeGainScale;
    const west = Core.sampleChinaTerrainMeters(lat, lng - TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
    const east = Core.sampleChinaTerrainMeters(lat, lng + TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
    const south = Core.sampleChinaTerrainMeters(lat - TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES, lng, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
    const north = Core.sampleChinaTerrainMeters(lat + TERRAIN_DETAIL_TILE_SLOPE_SHADE_SAMPLE_DEGREES, lng, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
    const slopeX = (Number(east) || 0) - (Number(west) || 0);
    const slopeY = (Number(north) || 0) - (Number(south) || 0);
    return Core.clamp(
      0.98 + slopeX * TERRAIN_DETAIL_TILE_SLOPE_SHADE_EAST_WEST_GAIN * slopeGainScale + slopeY * TERRAIN_DETAIL_TILE_SLOPE_SHADE_NORTH_SOUTH_GAIN * slopeGainScale,
      TERRAIN_DETAIL_TILE_SLOPE_SHADE_MIN,
      TERRAIN_DETAIL_TILE_SLOPE_SHADE_MAX
    );
  }

  function terrainDetailTileEdgeBlendWeight(tile, lat, lng) {
    if (!tile || !tile.bounds) return 1;
    const bounds = tile.bounds;
    const edgeDistance = Math.min(
      Number(lat) - Number(bounds.minLat),
      Number(bounds.maxLat) - Number(lat),
      Number(lng) - Number(bounds.minLng),
      Number(bounds.maxLng) - Number(lng)
    );
    const t = Core.clamp(edgeDistance / terrainTileVisualSettings().edgeBlendDegrees, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function terrainDetailTileBaseMeters(lat, lng, fallbackMeters) {
    const baseMeters = Core.sampleTerrainGridMeters(terrainElevationGrid, lat, lng);
    if (Number.isFinite(baseMeters)) {
      return baseMeters + Core.sampleTerrainDetailPatchMeters(activeTerrainDetailPatchLayer(), lat, lng);
    }
    return Number.isFinite(fallbackMeters) ? fallbackMeters : 0;
  }

  function terrainTextureNoise(lat, lng) {
    const seed = Math.sin((Number(lat) * 12.9898) + (Number(lng) * 78.233)) * 43758.5453;
    return (seed - Math.floor(seed)) - 0.5;
  }

  function terrainHillshade(lat, lng) {
    const sampleStep = TERRAIN_HILLSHADE_SAMPLE_DEGREES;
    const west = terrainElevation(lat, lng - sampleStep);
    const east = terrainElevation(lat, lng + sampleStep);
    const south = terrainElevation(lat - sampleStep, lng);
    const north = terrainElevation(lat + sampleStep, lng);
    const slopeX = east - west;
    const slopeY = north - south;
    return Core.clamp(
      0.92 + slopeX * TERRAIN_HILLSHADE_EAST_WEST_GAIN + slopeY * TERRAIN_HILLSHADE_NORTH_SOUTH_GAIN,
      TERRAIN_HILLSHADE_MIN,
      TERRAIN_HILLSHADE_MAX
    );
  }

  function createTerrainBlocks() {
    const mesh = createTerrainBlockSurfaceMesh(Core.FIVE_TERRAIN_BLOCKS);
    const terrainBlockRenderedCellCount = mesh ? mesh.userData.renderedCellCount || 0 : 0;
    const terrainBlockSkippedCellCount = mesh ? mesh.userData.skippedCellCount || 0 : 0;
    if (mesh) {
      worldGroup.add(mesh);
    }
    worldGroup.userData.terrainBlockRenderedCellCount = terrainBlockRenderedCellCount;
    worldGroup.userData.terrainBlockSkippedCellCount = terrainBlockSkippedCellCount;
    worldGroup.userData.terrainBlockMeshCount = 1;
    container.dataset.terrainBlockRenderedCellCount = String(terrainBlockRenderedCellCount);
    container.dataset.terrainBlockSkippedCellCount = String(terrainBlockSkippedCellCount);
    container.dataset.terrainBlockMeshCount = String(mesh ? 1 : 0);
  }

  function createTerrainBlockSurfaceMesh(blocks) {
    const bounds = Core.CHINA_REGION.bounds;
    const lngSteps = BLOCK_LNG_STEPS;
    const latSteps = BLOCK_LAT_STEPS;
    const positions = [];
    const colors = [];
    const indices = [];
    const renderedBlockIds = new Set();
    let renderedCellCount = 0;
    let skippedCellCount = 0;

    for (let y = 0; y < latSteps; y += 1) {
      const minLat = bounds.minLat + (bounds.maxLat - bounds.minLat) * (y / latSteps);
      const maxLat = bounds.minLat + (bounds.maxLat - bounds.minLat) * ((y + 1) / latSteps);
      for (let x = 0; x < lngSteps; x += 1) {
        const minLng = bounds.minLng + (bounds.maxLng - bounds.minLng) * (x / lngSteps);
        const maxLng = bounds.minLng + (bounds.maxLng - bounds.minLng) * ((x + 1) / lngSteps);
        const cellCenter = {
          lat: (minLat + maxLat) / 2,
          lng: (minLng + maxLng) / 2,
        };
        if (terrainRegionMask && !Core.isPointInsideGeoBoundaryRings(cellCenter, terrainRegionMask)) {
          skippedCellCount += 1;
          continue;
        }
        const block = blocks.find((item) => Core.isPointInsidePolygon(cellCenter, item.polygon));
        if (!block) {
          skippedCellCount += 1;
          continue;
        }
        const index = positions.length / 3;
        const elevation = terrainElevation(cellCenter.lat, cellCenter.lng);
        const color = terrainBlockSurfaceColor(block, elevation, cellCenter.lat, cellCenter.lng);
        [
          { lat: minLat, lng: minLng },
          { lat: maxLat, lng: minLng },
          { lat: maxLat, lng: maxLng },
          { lat: minLat, lng: maxLng },
        ].forEach((point) => {
          positions.push(...Core.latLngToVector3({
            lat: point.lat,
            lng: point.lng,
            radius: terrainRadius(point.lat, point.lng, TERRAIN_BLOCK_LIFT),
          }));
          colors.push(color.r, color.g, color.b);
        });
        indices.push(index, index + 2, index + 1, index, index + 3, index + 2);
        renderedBlockIds.add(block.id);
        renderedCellCount += 1;
      }
    }

    if (!renderedCellCount) {
      return null;
    }

    const blockIds = Array.from(renderedBlockIds);
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.16,
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    mesh.userData.role = "terrain-block";
    mesh.userData.blockIds = blockIds;
    mesh.userData.renderedCellCount = renderedCellCount;
    mesh.userData.skippedCellCount = skippedCellCount;
    return mesh;
  }

  function createWaterSystems() {
    const rivers = chinaRiverCenterlines && Array.isArray(chinaRiverCenterlines.rivers) && chinaRiverCenterlines.rivers.length
      ? chinaRiverCenterlines.rivers
      : Core.CHINA_WATER_SYSTEMS;
    waterFlowMarkers.length = 0;
    waterFlowDirectionArrows.length = 0;
    rivers.forEach((river, index) => {
      const color = WATER_COLORS[river.tone] || WATER_COLORS.blue;
      const isMainRiver = river.rank === "main" || !river.rank;
      const line = createRiverCurveVisual(
        river.path,
        color,
        isMainRiver ? 0.58 : 0.34,
        isMainRiver ? WATER_MAIN_LIFT : WATER_TRIBUTARY_LIFT,
        isMainRiver ? WATER_MAIN_RADIUS : WATER_TRIBUTARY_RADIUS,
        isMainRiver ? WATER_MAIN_GLOW_RADIUS : WATER_TRIBUTARY_GLOW_RADIUS
      );
      line.renderOrder = isMainRiver ? 32 : 31;
      line.traverse((object) => {
        object.renderOrder = isMainRiver ? 32 : 31;
      });
      line.userData.role = "water-system";
      line.userData.riverId = river.id;
      line.userData.riverRank = river.rank || "fallback";
      line.userData.river = river;
      worldGroup.add(line);
      if (isMainRiver && index % 3 === 0 && waterFlowMarkers.length < 24) {
        const marker = createWaterFlowMarker(river.path, color, index * 0.137, river);
        if (marker) {
          marker.userData.role = "water-flow-marker";
          marker.userData.riverId = river.id;
          marker.userData.riverRank = river.rank || "fallback";
          marker.userData.river = river;
          marker.renderOrder = 36;
          worldGroup.add(marker);
        }
      }
      if (isMainRiver && waterFlowDirectionArrows.length < 36) {
        const arrow = createWaterFlowDirectionArrow(river.path, color, 0.62);
        if (arrow) {
          arrow.userData.role = "water-flow-direction-arrow";
          arrow.userData.riverId = river.id;
          arrow.userData.riverRank = river.rank || "fallback";
          arrow.userData.river = river;
          arrow.renderOrder = 37;
          worldGroup.add(arrow);
        }
      }
    });
    syncWaterSystemDebugState(waterSystemSummary());
    syncWaterMotionDebugState();
  }

  function waterSystemSummary() {
    const rivers = chinaRiverCenterlines && Array.isArray(chinaRiverCenterlines.rivers) && chinaRiverCenterlines.rivers.length
      ? chinaRiverCenterlines.rivers
      : Core.CHINA_WATER_SYSTEMS;
    return {
      source: chinaRiverCenterlines ? chinaRiverCenterlines.source : "hand-drawn-fallback",
      count: rivers.length,
      main: rivers.filter((river) => river.rank === "main").length,
      tributary: rivers.filter((river) => river.rank === "tributary").length,
      keyTributary: rivers.filter((river) => Core.getWaterSystemLayerId(river) === "waterTributaries").length,
      minorTributary: rivers.filter((river) => Core.getWaterSystemLayerId(river) === "waterMinorTributaries").length,
    };
  }

  function waterReferenceSummary() {
    const lakes = chinaWaterReferences && Array.isArray(chinaWaterReferences.lakes)
      ? chinaWaterReferences.lakes
      : [];
    const coastlines = chinaWaterReferences && Array.isArray(chinaWaterReferences.coastlines)
      ? chinaWaterReferences.coastlines
      : [];
    return {
      source: chinaWaterReferences ? chinaWaterReferences.source : "none",
      lakes: lakes.length,
      coastlines: coastlines.length,
    };
  }

  function syncWaterSystemDebugState(waterSummary) {
    worldGroup.userData.waterSource = waterSummary.source;
    worldGroup.userData.waterSystemCount = waterSummary.count;
    worldGroup.userData.waterMainCount = waterSummary.main;
    worldGroup.userData.waterTributaryCount = waterSummary.tributary;
    worldGroup.userData.waterKeyTributaryCount = waterSummary.keyTributary;
    worldGroup.userData.waterMinorTributaryCount = waterSummary.minorTributary;
    container.dataset.waterSource = waterSummary.source;
    container.dataset.waterSystemCount = String(waterSummary.count);
    container.dataset.waterMainCount = String(waterSummary.main);
    container.dataset.waterTributaryCount = String(waterSummary.tributary);
    container.dataset.waterKeyTributaryCount = String(waterSummary.keyTributary);
    container.dataset.waterMinorTributaryCount = String(waterSummary.minorTributary);
  }

  function syncWaterMotionDebugState() {
    const speeds = waterFlowMarkers
      .map((entry) => Number(entry.speed))
      .filter((speed) => Number.isFinite(speed));
    const speedAverage = speeds.length
      ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
      : 0;
    const speedRange = speeds.length
      ? `${Math.min(...speeds).toFixed(3)}-${Math.max(...speeds).toFixed(3)}`
      : "none";
    const hydrologySources = Array.from(new Set(waterFlowMarkers
      .map((entry) => entry.hydrologySource)
      .filter(Boolean)));
    worldGroup.userData.waterMotionEnabled = waterFlowMarkers.length > 0;
    worldGroup.userData.waterFlowMarkerCount = waterFlowMarkers.length;
    worldGroup.userData.waterFlowDirectionCount = waterFlowDirectionArrows.length;
    worldGroup.userData.waterFlowSpeedAverage = speedAverage;
    worldGroup.userData.waterFlowSpeedRange = speedRange;
    worldGroup.userData.waterFlowHydrologySource = hydrologySources.join(",") || "none";
    container.dataset.waterMotionEnabled = String(waterFlowMarkers.length > 0);
    container.dataset.waterFlowMarkerCount = String(waterFlowMarkers.length);
    container.dataset.waterFlowDirectionCount = String(waterFlowDirectionArrows.length);
    container.dataset.waterFlowSpeedAverage = speedAverage.toFixed(3);
    container.dataset.waterFlowSpeedRange = speedRange;
    container.dataset.waterFlowHydrologySource = worldGroup.userData.waterFlowHydrologySource;
  }

  function syncLakeMotionDebugState() {
    const windDrivenCount = lakeRippleMarkers.filter((entry) => entry.windDriven).length;
    const weatherPointIds = new Set(lakeRippleMarkers
      .map((entry) => entry.weatherPointId)
      .filter(Boolean));
    worldGroup.userData.lakeMotionEnabled = lakeReferenceMeshes.length > 0 || lakeRippleMarkers.length > 0;
    worldGroup.userData.lakeMotionMeshCount = lakeReferenceMeshes.length;
    worldGroup.userData.lakeRippleMarkerCount = lakeRippleMarkers.length;
    worldGroup.userData.lakeWindDrivenRippleCount = windDrivenCount;
    worldGroup.userData.lakeWindHeadingSampleCount = weatherPointIds.size;
    container.dataset.lakeMotionEnabled = String(lakeReferenceMeshes.length > 0 || lakeRippleMarkers.length > 0);
    container.dataset.lakeMotionMeshCount = String(lakeReferenceMeshes.length);
    container.dataset.lakeRippleMarkerCount = String(lakeRippleMarkers.length);
    container.dataset.lakeWindDrivenRippleCount = String(windDrivenCount);
    container.dataset.lakeWindHeadingSampleCount = String(weatherPointIds.size);
  }

  function waterLayerSummaryText(waterSummary, waterReferenceSummary) {
    return `默认显示主流 ${waterSummary.main} 段和湖泊参考 ${waterReferenceSummary.lakes} 条；支流参考 ${waterSummary.keyTributary} 段、细支流 ${waterSummary.minorTributary} 段、海岸/岛屿 ${waterReferenceSummary.coastlines} 条可单独打开（来源 ${waterSummary.source}）`;
  }

  function createWaterReferenceOutlines() {
    clearGroup(waterReferenceGroup);
    lakeReferenceMeshes.length = 0;
    lakeRippleMarkers.length = 0;
    const lakes = chinaWaterReferences && Array.isArray(chinaWaterReferences.lakes)
      ? chinaWaterReferences.lakes
      : [];
    const coastlines = chinaWaterReferences && Array.isArray(chinaWaterReferences.coastlines)
      ? chinaWaterReferences.coastlines
      : [];

    lakes.forEach((lake) => {
      const color = WATER_REFERENCE_COLORS[lake.kind] || WATER_REFERENCE_COLORS.lake;
      const line = createRiverCurveMesh(lake.path, color, 0.42, WATER_LAKE_LIFT, 0.0035);
      line.renderOrder = 30;
      line.userData.role = "terrain-water-lake-reference";
      line.userData.waterReferenceId = lake.id;
      line.userData.waterReferenceKind = lake.kind || "lake";
      line.userData.baseOpacity = 0.42;
      waterReferenceGroup.add(line);
      lakeReferenceMeshes.push(line);
      if (lakeRippleMarkers.length < 36) {
        const ripple = createLakeRippleMarker(lake.path, color, lakeRippleMarkers.length * 0.173);
        if (ripple) {
          ripple.userData.role = "terrain-water-lake-ripple";
          ripple.userData.waterReferenceId = lake.id;
          ripple.userData.waterReferenceKind = lake.kind || "lake";
          waterReferenceGroup.add(ripple);
        }
      }
    });
    coastlines.forEach((coastline) => {
      const color = WATER_REFERENCE_COLORS[coastline.kind] || WATER_REFERENCE_COLORS.coastline;
      const line = createRiverCurveLine(coastline.path, color, coastline.kind === "island" ? 0.2 : 0.28, WATER_COAST_LIFT);
      line.userData.role = "terrain-water-coast-reference";
      line.userData.waterReferenceId = coastline.id;
      line.userData.waterReferenceKind = coastline.kind || "coastline";
      waterReferenceGroup.add(line);
    });
    syncWaterReferenceDebugState({
      source: chinaWaterReferences ? chinaWaterReferences.source : "none",
      lakes: lakes.length,
      coastlines: coastlines.length,
    });
    syncLakeMotionDebugState();
  }

  function syncWaterReferenceDebugState(summary) {
    worldGroup.userData.waterReferenceSource = summary.source;
    worldGroup.userData.waterReferenceLakeCount = summary.lakes;
    worldGroup.userData.waterReferenceCoastlineCount = summary.coastlines;
    container.dataset.waterReferenceSource = summary.source;
    container.dataset.waterReferenceLakeCount = String(summary.lakes);
    container.dataset.waterReferenceCoastlineCount = String(summary.coastlines);
  }

  function createWeatherCloudFlow(layer) {
    clearGroup(weatherCloudFlowGroup);
    weatherCloudParticles.length = 0;
    const points = layer && Array.isArray(layer.points) ? layer.points : [];
    points.forEach((point, index) => {
      const cloudCover = Math.max(0, Math.min(100, Number(point.cloudCover) || 0));
      const windSpeed = Math.max(1, Number(point.windSpeed) || 8);
      const heading = Number.isFinite(Number(point.heading)) ? Number(point.heading) : 90;
      const windDirection = Number.isFinite(Number(point.windDirection)) ? Number(point.windDirection) : (heading + 180) % 360;
      const opacity = 0.12 + (cloudCover / 100) * 0.3;
      const color = new THREE.Color(cloudCover > 62 ? "#dff7ff" : "#9bd8ff");
      const cloud = new THREE.Group();
      cloud.userData.role = "terrain-weather-cloud";
      cloud.userData.weatherPointId = point.id;
      cloud.userData.heading = heading;
      cloud.userData.windSpeed = windSpeed;
      cloud.userData.windDirection = windDirection;
      for (let particleIndex = 0; particleIndex < 3; particleIndex += 1) {
        const phase = (index * 0.19 + particleIndex * 0.31) % 1;
        const offsetPoint = movePointByHeading(point, heading + particleIndex * 18 - 18, (phase - 0.5) * 1.1);
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.022 + particleIndex * 0.005, 12, 12),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
          })
        );
        particle.position.copy(toVector3(Core.latLngToVector3({
          lat: offsetPoint.lat,
          lng: offsetPoint.lng,
          radius: terrainRadius(offsetPoint.lat, offsetPoint.lng, WEATHER_CLOUD_LIFT),
        })));
        particle.userData.role = "terrain-weather-cloud";
        particle.userData.basePoint = point;
        particle.userData.heading = heading + particleIndex * 18 - 18;
        particle.userData.windSpeed = windSpeed;
        particle.userData.windDirection = windDirection;
        particle.userData.phase = phase;
        particle.userData.speed = 0.008 + windSpeed * 0.00045;
        particle.userData.driftDegrees = 1.1 + cloudCover * 0.006;
        weatherCloudParticles.push(particle);
        cloud.add(particle);
      }
      const vectorEnd = movePointByHeading(point, heading, 1.0 + windSpeed * 0.035);
      const vector = createPathLine([point, vectorEnd], new THREE.Color("#dff7ff"), 0.22 + cloudCover * 0.002, WEATHER_VECTOR_LIFT);
      vector.userData.role = "terrain-weather-vector";
      vector.userData.weatherPointId = point.id;
      vector.userData.heading = heading;
      vector.userData.windSpeed = windSpeed;
      vector.userData.windDirection = windDirection;
      weatherCloudFlowGroup.add(vector, cloud);
    });
    syncWeatherCloudDebugState(layer ? layer.source : "none", points.length);
  }

  function syncWeatherCloudDebugState(source, pointCount) {
    const windSummary = summarizeWeatherWindField(weatherCloudFlow);
    worldGroup.userData.weatherSource = source;
    worldGroup.userData.weatherPointCount = pointCount;
    worldGroup.userData.weatherCloudCount = weatherCloudParticles.length;
    worldGroup.userData.weatherUpdatedAt = weatherCloudFlow && weatherCloudFlow.updatedAt
      ? weatherCloudFlow.updatedAt
      : "";
    worldGroup.userData.weatherAverageWindSpeed = windSummary.averageWindSpeed;
    worldGroup.userData.weatherAverageWindHeading = windSummary.averageWindHeading;
    worldGroup.userData.weatherWindHeadingRange = windSummary.headingRange;
    container.dataset.weatherSource = source;
    container.dataset.weatherPointCount = String(pointCount);
    container.dataset.weatherCloudCount = String(weatherCloudParticles.length);
    container.dataset.weatherUpdatedAt = worldGroup.userData.weatherUpdatedAt;
    container.dataset.weatherMotionEnabled = String(weatherCloudParticles.length > 0);
    container.dataset.weatherAverageWindSpeed = windSummary.averageWindSpeed.toFixed(1);
    container.dataset.weatherAverageWindHeading = windSummary.averageWindHeading.toFixed(0);
    container.dataset.weatherWindHeadingRange = windSummary.headingRange;
  }

  function summarizeWeatherWindField(layer) {
    const points = layer && Array.isArray(layer.points) ? layer.points : [];
    const valid = points
      .map((point) => ({
        heading: normalizeHeading(point.heading),
        windSpeed: Number(point.windSpeed),
      }))
      .filter((point) => Number.isFinite(point.heading) && Number.isFinite(point.windSpeed));
    if (!valid.length) {
      return { averageWindSpeed: 0, averageWindHeading: 90, headingRange: "none" };
    }
    const totals = valid.reduce((sum, point) => {
      const radians = (point.heading * Math.PI) / 180;
      return {
        speed: sum.speed + point.windSpeed,
        x: sum.x + Math.sin(radians),
        y: sum.y + Math.cos(radians),
      };
    }, { speed: 0, x: 0, y: 0 });
    const averageWindHeading = normalizeHeading((Math.atan2(totals.x, totals.y) * 180) / Math.PI);
    const headings = valid.map((point) => point.heading).sort((a, b) => a - b);
    const minHeading = headings[0];
    const maxHeading = headings[headings.length - 1];
    return {
      averageWindSpeed: totals.speed / valid.length,
      averageWindHeading,
      headingRange: `${Math.round(minHeading)}-${Math.round(maxHeading)}`,
    };
  }

  function normalizeHeading(value) {
    const heading = Number(value);
    if (!Number.isFinite(heading)) {
      return NaN;
    }
    return ((heading % 360) + 360) % 360;
  }

  function createTerrainContours() {
    clearGroup(terrainContourGroup);
    if (!terrainElevationGrid) {
      return;
    }
    const levels = [500, 1000, 2000, 3000, 4000, 5000];
    const segments = Core.buildTerrainContourSegments(terrainElevationGrid, levels);
    const color = new THREE.Color("#f4d28a");
    segments.forEach((segment) => {
      const line = createPathLine([segment.start, segment.end], color, contourOpacity(segment.levelMeters), CONTOUR_LIFT);
      line.userData.role = "terrain-contour";
      line.userData.levelMeters = segment.levelMeters;
      terrainContourGroup.add(line);
    });
    terrainContourGroup.userData.segmentCount = segments.length;
    terrainContourGroup.userData.levels = levels;
  }

  function contourOpacity(levelMeters) {
    return levelMeters % 1000 === 0 ? 0.36 : 0.22;
  }

  function terrainDetailTileContourOpacityProfile(segmentCount, levelCount) {
    const segments = Math.max(0, Number(segmentCount) || 0);
    const levels = Math.max(1, Number(levelCount) || 1);
    const segmentsPerLevel = segments / levels;
    const opacity = segmentsPerLevel > 900
      ? 0.16
      : segmentsPerLevel > 520
        ? 0.22
        : 0.30;
    return {
      opacity,
      segmentsPerLevel,
      mode: segmentsPerLevel > 900 ? "dense" : segmentsPerLevel > 520 ? "balanced" : "open",
    };
  }

  function terrainDetailTileContourDistanceOpacity(viewDistance, baseOpacity) {
    const distance = Number(viewDistance);
    const base = Math.max(0, Math.min(1, Number(baseOpacity) || 0));
    if (!base) {
      return { opacity: 0, mode: "idle" };
    }
    if (!Number.isFinite(distance) || distance <= 2.72) {
      return { opacity: base, mode: "inspect" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_NEAR_DISTANCE) {
      return { opacity: base * 0.72, mode: "near-fade" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_MID_DISTANCE) {
      return { opacity: base * 0.46, mode: "mid-fade" };
    }
    return { opacity: base * 0.28, mode: "far-fade" };
  }

  function terrainDetailTileWaterReferenceDistanceOpacity(viewDistance, baseOpacity) {
    const distance = Number(viewDistance);
    const base = Math.max(0, Math.min(1, Number(baseOpacity) || 0));
    if (!base) {
      return { opacity: 0, mode: "idle" };
    }
    if (!Number.isFinite(distance) || distance <= 2.72) {
      return { opacity: base * 0.78, mode: "inspect-subtle" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_NEAR_DISTANCE) {
      return { opacity: base * 0.56, mode: "near-subtle" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_MID_DISTANCE) {
      return { opacity: base * 0.38, mode: "mid-subtle" };
    }
    return { opacity: base * 0.22, mode: "far-subtle" };
  }

  function waterSystemDistanceOpacity(viewDistance, baseOpacity, partRole) {
    const distance = Number(viewDistance);
    const base = Math.max(0, Math.min(1, Number(baseOpacity) || 0));
    if (!base) {
      return { opacity: 0, mode: "idle" };
    }
    const isGlow = partRole === "water-system-glow";
    if (!Number.isFinite(distance) || distance <= 2.72) {
      return { opacity: base * (isGlow ? 0.48 : 0.62), mode: "inspect-subtle" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_NEAR_DISTANCE) {
      return { opacity: base * (isGlow ? 0.36 : 0.50), mode: "near-subtle" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_MID_DISTANCE) {
      return { opacity: base * (isGlow ? 0.58 : 0.74), mode: "mid-readable" };
    }
    return { opacity: base, mode: "explore" };
  }

  function boundaryDistanceOpacity(viewDistance, baseOpacity, boundaryLevel) {
    const distance = Number(viewDistance);
    const base = Math.max(0, Math.min(1, Number(baseOpacity) || 0));
    if (!base) {
      return { opacity: 0, mode: "idle" };
    }
    const isPrefecture = boundaryLevel === "prefecture";
    if (!Number.isFinite(distance) || distance <= 2.72) {
      return { opacity: base * (isPrefecture ? 0.46 : 0.68), mode: "inspect-boundary" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_NEAR_DISTANCE) {
      return { opacity: base * (isPrefecture ? 0.52 : 0.74), mode: "near-boundary" };
    }
    if (distance <= TERRAIN_DETAIL_LOD_MID_DISTANCE) {
      return { opacity: base * (isPrefecture ? 0.72 : 0.92), mode: "locate-boundary" };
    }
    return { opacity: base * (isPrefecture ? 0.45 : 0.86), mode: "explore-boundary" };
  }

  function buildTerrainDetailTileContourLevels(tile) {
    const rows = tile && Array.isArray(tile.elevationsMeters) ? tile.elevationsMeters : [];
    let min = Infinity;
    let max = -Infinity;
    rows.forEach((row) => {
      if (!Array.isArray(row)) return;
      row.forEach((rawValue) => {
        const value = Number(rawValue);
        if (!Number.isFinite(value)) return;
        min = Math.min(min, value);
        max = Math.max(max, value);
      });
    });
    if (!Number.isFinite(min) || !Number.isFinite(max) || max - min < 120) {
      return [];
    }
    const interval = max - min > 4200 ? 500 : 250;
    const start = Math.ceil(min / interval) * interval;
    const end = Math.floor(max / interval) * interval;
    const levels = [];
    for (let level = start; level <= end; level += interval) {
      levels.push(level);
    }
    return levels.slice(0, 32);
  }

  function createTerrainDetailTileContourGrid(tile) {
    if (!tile || !Array.isArray(tile.latitudes) || !Array.isArray(tile.longitudes) || !Array.isArray(tile.elevationsMeters)) {
      return null;
    }
    const rowCount = tile.latitudes.length;
    const columnCount = tile.longitudes.length;
    if (rowCount < 2 || columnCount < 2) {
      return null;
    }
    const maxPoints = 96;
    const rowIndexes = sampleTerrainTileAxisIndexes(rowCount, maxPoints);
    const columnIndexes = sampleTerrainTileAxisIndexes(columnCount, maxPoints);
    return {
      ...tile,
      latitudes: rowIndexes.map((index) => Number(tile.latitudes[index])),
      longitudes: columnIndexes.map((index) => Number(tile.longitudes[index])),
      elevationsMeters: rowIndexes.map((rowIndex) => (
        columnIndexes.map((columnIndex) => Number(tile.elevationsMeters[rowIndex] && tile.elevationsMeters[rowIndex][columnIndex]))
      )),
    };
  }

  function sampleTerrainTileAxisIndexes(length, maxPoints) {
    const count = Number(length);
    if (!Number.isFinite(count) || count <= 0) return [];
    if (count <= maxPoints) {
      return Array.from({ length: count }, (_, index) => index);
    }
    return Array.from({ length: maxPoints }, (_, index) => Math.round((index * (count - 1)) / (maxPoints - 1)));
  }

  function createTerrainDetailTileContours(tile) {
    clearGroup(terrainDetailTileContourGroup);
    const levels = buildTerrainDetailTileContourLevels(tile);
    const contourGrid = createTerrainDetailTileContourGrid(tile);
    if (!contourGrid || !levels.length) {
      resetTerrainDetailTileContourState();
      return;
    }
    const segments = Core.buildTerrainContourSegments(contourGrid, levels);
    const contourProfile = terrainDetailTileContourOpacityProfile(segments.length, levels.length);
    const color = new THREE.Color("#fff2b8");
    segments.forEach((segment) => {
      const line = createPathLine([segment.start, segment.end], color, contourOpacity(segment.levelMeters), TERRAIN_DETAIL_LIFT + 0.008);
      line.material.opacity = contourProfile.opacity;
      line.userData.role = "terrain-detail-tile-contour";
      line.userData.tileId = tile.id;
      line.userData.levelMeters = segment.levelMeters;
      terrainDetailTileContourGroup.add(line);
    });
    terrainDetailTileContourGroup.userData.tileId = tile.id;
    terrainDetailTileContourGroup.userData.segmentCount = segments.length;
    terrainDetailTileContourGroup.userData.levels = levels;
    terrainDetailTileContourGroup.userData.opacity = contourProfile.opacity;
    terrainDetailTileContourGroup.userData.opacityMode = contourProfile.mode;
    terrainDetailTileContourGroup.userData.segmentsPerLevel = contourProfile.segmentsPerLevel;
  }

  function resetTerrainDetailTileContourState() {
    terrainDetailTileContourGroup.userData.tileId = "";
    terrainDetailTileContourGroup.userData.segmentCount = 0;
    terrainDetailTileContourGroup.userData.levels = [];
    terrainDetailTileContourGroup.userData.opacity = 0;
    terrainDetailTileContourGroup.userData.opacityMode = "idle";
    terrainDetailTileContourGroup.userData.segmentsPerLevel = 0;
  }

  function clipBoundarySegmentToTerrainTileBounds(start, end, bounds) {
    if (!start || !end || !bounds) {
      return null;
    }
    const x0 = Number(start.lng);
    const y0 = Number(start.lat);
    const x1 = Number(end.lng);
    const y1 = Number(end.lat);
    const minX = Number(bounds.minLng);
    const maxX = Number(bounds.maxLng);
    const minY = Number(bounds.minLat);
    const maxY = Number(bounds.maxLat);
    if (![x0, y0, x1, y1, minX, maxX, minY, maxY].every(Number.isFinite)) {
      return null;
    }
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t0 = 0;
    let t1 = 1;
    const clip = (p, q) => {
      if (p === 0) {
        return q >= 0;
      }
      const ratio = q / p;
      if (p < 0) {
        if (ratio > t1) return false;
        if (ratio > t0) t0 = ratio;
      } else if (p > 0) {
        if (ratio < t0) return false;
        if (ratio < t1) t1 = ratio;
      }
      return true;
    };
    if (
      !clip(-dx, x0 - minX) ||
      !clip(dx, maxX - x0) ||
      !clip(-dy, y0 - minY) ||
      !clip(dy, maxY - y0)
    ) {
      return null;
    }
    return [
      { lat: y0 + t0 * dy, lng: x0 + t0 * dx },
      { lat: y0 + t1 * dy, lng: x0 + t1 * dx },
    ];
  }

  function resetTerrainDetailTileBoundaryState() {
    terrainDetailTileBoundaryGroup.userData.tileId = "";
    terrainDetailTileBoundaryGroup.userData.segmentCount = 0;
    terrainDetailTileBoundaryGroup.userData.provinceSegmentCount = 0;
    terrainDetailTileBoundaryGroup.userData.prefectureSegmentCount = 0;
    terrainDetailTileBoundaryGroup.userData.featureCount = 0;
    terrainDetailTileBoundaryGroup.userData.ringCount = 0;
  }

  function createTerrainDetailTileBoundaries(tile) {
    clearGroup(terrainDetailTileBoundaryGroup);
    if (!tile || !tile.bounds) {
      resetTerrainDetailTileBoundaryState();
      return;
    }
    const featureNames = new Set();
    const ringKeys = new Set();
    const provinceSegmentCount = addTerrainDetailTileBoundaryLines({
      tile,
      layer: provinceBoundaryLayer,
      role: "terrain-detail-tile-province-boundary",
      boundaryLevel: "province",
      color: PROVINCE_BOUNDARY_COLOR,
      opacity: 0.62,
      lift: TERRAIN_DETAIL_LIFT + 0.012,
      featureNames,
      ringKeys,
    });
    const prefectureSegmentCount = addTerrainDetailTileBoundaryLines({
      tile,
      layer: prefectureBoundaryLayer,
      role: "terrain-detail-tile-prefecture-boundary",
      boundaryLevel: "prefecture",
      color: PREFECTURE_BOUNDARY_COLOR,
      opacity: 0.38,
      lift: TERRAIN_DETAIL_LIFT + 0.016,
      featureNames,
      ringKeys,
    });
    const segmentCount = provinceSegmentCount + prefectureSegmentCount;
    if (!segmentCount) {
      resetTerrainDetailTileBoundaryState();
      return;
    }
    terrainDetailTileBoundaryGroup.userData.tileId = tile.id;
    terrainDetailTileBoundaryGroup.userData.segmentCount = segmentCount;
    terrainDetailTileBoundaryGroup.userData.provinceSegmentCount = provinceSegmentCount;
    terrainDetailTileBoundaryGroup.userData.prefectureSegmentCount = prefectureSegmentCount;
    terrainDetailTileBoundaryGroup.userData.featureCount = featureNames.size;
    terrainDetailTileBoundaryGroup.userData.ringCount = ringKeys.size;
  }

  function addTerrainDetailTileBoundaryLines(options) {
    const {
      tile,
      layer,
      role,
      boundaryLevel,
      color,
      opacity,
      lift,
      featureNames,
      ringKeys,
    } = options;
    if (!layer || !Array.isArray(layer.rings)) {
      return 0;
    }
    let segmentCount = 0;
    layer.rings.forEach((ring, fallbackRingIndex) => {
      const points = ring && Array.isArray(ring.points) ? ring.points : [];
      for (let index = 0; index < points.length - 1; index += 1) {
        const clipped = clipBoundarySegmentToTerrainTileBounds(points[index], points[index + 1], tile.bounds);
        if (!clipped) continue;
        const line = createPathLine(clipped, color, opacity, lift);
        line.userData.role = role;
        line.userData.tileId = tile.id;
        line.userData.featureName = ring.featureName || "";
        line.userData.boundaryLevel = boundaryLevel;
        terrainDetailTileBoundaryGroup.add(line);
        segmentCount += 1;
        if (ring.featureName) featureNames.add(ring.featureName);
        ringKeys.add(`${boundaryLevel}:${ring.featureIndex ?? "feature"}:${ring.ringIndex ?? fallbackRingIndex}`);
      }
    });
    return segmentCount;
  }

  function resetTerrainDetailTileWaterState() {
    terrainDetailTileWaterGroup.userData.tileId = "";
    terrainDetailTileWaterGroup.userData.segmentCount = 0;
    terrainDetailTileWaterGroup.userData.riverCount = 0;
    terrainDetailTileWaterGroup.userData.lakeCount = 0;
  }

  function createTerrainDetailTileWaterReferences(tile) {
    clearGroup(terrainDetailTileWaterGroup);
    if (!tile || !tile.bounds) {
      resetTerrainDetailTileWaterState();
      return;
    }
    const rivers = chinaRiverCenterlines && Array.isArray(chinaRiverCenterlines.rivers) && chinaRiverCenterlines.rivers.length
      ? chinaRiverCenterlines.rivers
      : Core.CHINA_WATER_SYSTEMS;
    const lakes = chinaWaterReferences && Array.isArray(chinaWaterReferences.lakes)
      ? chinaWaterReferences.lakes
      : [];
    const riverIds = new Set();
    const lakeIds = new Set();
    let segmentCount = 0;

    rivers.forEach((river) => {
      const path = river && Array.isArray(river.path) ? river.path : [];
      const color = WATER_COLORS[river.tone] || WATER_COLORS.blue;
      for (let index = 0; index < path.length - 1; index += 1) {
        const clipped = clipBoundarySegmentToTerrainTileBounds(path[index], path[index + 1], tile.bounds);
        if (!clipped) continue;
        const baseOpacity = river.rank === "main" ? 0.72 : 0.52;
        const line = createPathLine(clipped, color, baseOpacity, TERRAIN_DETAIL_LIFT + 0.018);
        line.renderOrder = 44;
        line.userData.role = "terrain-detail-tile-water-reference";
        line.userData.tileId = tile.id;
        line.userData.waterReferenceKind = "river";
        line.userData.riverId = river.id || "";
        line.userData.riverRank = river.rank || "fallback";
        line.userData.baseOpacity = river.rank === "main" ? 0.72 : 0.52;
        terrainDetailTileWaterGroup.add(line);
        segmentCount += 1;
        if (river.id) riverIds.add(river.id);
      }
    });

    lakes.forEach((lake) => {
      const path = lake && Array.isArray(lake.path) ? lake.path : [];
      const color = WATER_REFERENCE_COLORS[lake.kind] || WATER_REFERENCE_COLORS.lake;
      for (let index = 0; index < path.length - 1; index += 1) {
        const clipped = clipBoundarySegmentToTerrainTileBounds(path[index], path[index + 1], tile.bounds);
        if (!clipped) continue;
        const line = createPathLine(clipped, color, 0.62, TERRAIN_DETAIL_LIFT + 0.02);
        line.renderOrder = 45;
        line.userData.role = "terrain-detail-tile-water-reference";
        line.userData.tileId = tile.id;
        line.userData.waterReferenceKind = lake.kind || "lake";
        line.userData.waterReferenceId = lake.id || "";
        line.userData.baseOpacity = 0.62;
        terrainDetailTileWaterGroup.add(line);
        segmentCount += 1;
        if (lake.id) lakeIds.add(lake.id);
      }
    });

    terrainDetailTileWaterGroup.userData.tileId = tile.id;
    terrainDetailTileWaterGroup.userData.segmentCount = segmentCount;
    terrainDetailTileWaterGroup.userData.riverCount = riverIds.size;
    terrainDetailTileWaterGroup.userData.lakeCount = lakeIds.size;
  }

  function resetTerrainDetailTileTraceGuideState() {
    terrainDetailTileTraceGuideGroup.userData.tileId = "";
    terrainDetailTileTraceGuideGroup.userData.guideCount = 0;
    terrainDetailTileTraceGuideGroup.userData.guideKinds = [];
    terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount = 0;
    terrainDetailTileTraceGuideGroup.userData.recommendedGuideKinds = [];
    terrainDetailTileTraceGuideGroup.userData.pointCount = 0;
  }

  function isRecommendedTerrainTileTraceGuide(guide, analysis) {
    if (!guide || !analysis) return false;
    if (analysis.traceRecommendation === "ridge-valley") {
      return guide.kind === "ridge" || guide.kind === "valley";
    }
    if (analysis.traceRecommendation === "basin-edge") {
      return guide.kind === "ridge";
    }
    if (analysis.traceRecommendation === "water-boundary") {
      return guide.kind === "valley";
    }
    return false;
  }

  function recommendedTerrainTileTraceGuides(tile) {
    if (!tile) return [];
    const analysis = Core.summarizeTerrainTileAnalysis(tile);
    return Core.buildTerrainTileTraceGuides(tile)
      .filter((guide) => isRecommendedTerrainTileTraceGuide(guide, analysis));
  }

  function createTerrainDetailTileTraceGuides(tile) {
    clearGroup(terrainDetailTileTraceGuideGroup);
    const guides = Core.buildTerrainTileTraceGuides(tile);
    if (!guides.length) {
      resetTerrainDetailTileTraceGuideState();
      return;
    }
    const analysis = Core.summarizeTerrainTileAnalysis(tile);
    const recommendedKinds = [];
    let pointCount = 0;
    guides.forEach((guide) => {
      const recommended = isRecommendedTerrainTileTraceGuide(guide, analysis);
      const color = TRACE_COLORS[guide.kind] || TRACE_COLORS.ridge;
      const opacity = recommended ? 0.92 : (guide.kind === "ridge" ? 0.62 : 0.52);
      const lift = TERRAIN_DETAIL_LIFT + (recommended ? 0.034 : 0.024);
      const line = createPathLine(guide.points, color, opacity, lift);
      line.renderOrder = recommended ? 54 : 46;
      line.userData.role = "terrain-detail-tile-trace-guide";
      line.userData.tileId = tile.id;
      line.userData.traceId = guide.id;
      line.userData.traceKind = guide.kind;
      line.userData.traceRecommended = recommended;
      terrainDetailTileTraceGuideGroup.add(line);
      pointCount += guide.points.length;
      if (recommended) {
        recommendedKinds.push(guide.kind);
      }
    });
    terrainDetailTileTraceGuideGroup.userData.tileId = tile.id;
    terrainDetailTileTraceGuideGroup.userData.guideCount = guides.length;
    terrainDetailTileTraceGuideGroup.userData.guideKinds = guides.map((guide) => guide.kind);
    terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount = recommendedKinds.length;
    terrainDetailTileTraceGuideGroup.userData.recommendedGuideKinds = recommendedKinds;
    terrainDetailTileTraceGuideGroup.userData.pointCount = pointCount;
  }

  function createTerrainDetailTileSurface(tile) {
    if (!tile || !Array.isArray(tile.latitudes) || !Array.isArray(tile.longitudes) || !Array.isArray(tile.elevationsMeters)) {
      return null;
    }
    const latitudes = sampleTerrainTileAxis(tile.latitudes, 72);
    const longitudes = sampleTerrainTileAxis(tile.longitudes, 72);
    if (latitudes.length < 2 || longitudes.length < 2) {
      return null;
    }
    const positions = [];
    const colors = [];
    const indices = [];
    const colorBandLabels = new Set();
    let renderedCellCount = 0;
    let skippedCellCount = 0;
    let slopeShadeMin = Infinity;
    let slopeShadeMax = -Infinity;
    let edgeBlendWeightMin = Infinity;
    let edgeBlendWeightMax = -Infinity;

    latitudes.forEach((lat) => {
      longitudes.forEach((lng) => {
        const localMeters = Core.sampleChinaTerrainMeters(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
        const edgeBlendWeight = terrainDetailTileEdgeBlendWeight(tile, lat, lng);
        const baseMeters = terrainDetailTileBaseMeters(lat, lng, localMeters);
        const meters = baseMeters + (localMeters - baseMeters) * edgeBlendWeight;
        const elevation = Core.metersToTerrainElevation(meters);
        edgeBlendWeightMin = Math.min(edgeBlendWeightMin, edgeBlendWeight);
        edgeBlendWeightMax = Math.max(edgeBlendWeightMax, edgeBlendWeight);
        const radius = Core.DEFAULT_RADIUS + TERRAIN_MESH_LIFT + 0.01 + elevation * TERRAIN_VERTICAL_EXAGGERATION * terrainReliefScale;
        positions.push(...Core.latLngToVector3({ lat, lng, radius }));
        const band = terrainDetailTileColorBand(meters);
        colorBandLabels.add(band.label);
        const slopeShade = terrainDetailTileSlopeShade(lat, lng);
        slopeShadeMin = Math.min(slopeShadeMin, slopeShade);
        slopeShadeMax = Math.max(slopeShadeMax, slopeShade);
        const color = terrainDetailTileSurfaceColor(meters, elevation, lat, lng, slopeShade);
        colors.push(color.r, color.g, color.b);
      });
    });

    for (let y = 0; y < latitudes.length - 1; y += 1) {
      for (let x = 0; x < longitudes.length - 1; x += 1) {
        const cellCenter = {
          lat: (Number(latitudes[y]) + Number(latitudes[y + 1])) / 2,
          lng: (Number(longitudes[x]) + Number(longitudes[x + 1])) / 2,
        };
        if (terrainRegionMask && !Core.isPointInsideGeoBoundaryRings(cellCenter, terrainRegionMask)) {
          skippedCellCount += 1;
          continue;
        }
        const a = y * longitudes.length + x;
        const b = a + 1;
        const c = a + longitudes.length;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
        renderedCellCount += 1;
      }
    }

    if (!indices.length) {
      return null;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
      })
    );
    mesh.userData.role = "terrain-detail-tile-surface";
    mesh.userData.tileId = tile.id;
    mesh.userData.vertexCount = positions.length / 3;
    mesh.userData.renderedCellCount = renderedCellCount;
    mesh.userData.skippedCellCount = skippedCellCount;
    mesh.userData.colorBandLabels = [...colorBandLabels];
    mesh.userData.colorBandCount = colorBandLabels.size;
    mesh.userData.slopeShadeMin = Number.isFinite(slopeShadeMin) ? slopeShadeMin : 1;
    mesh.userData.slopeShadeMax = Number.isFinite(slopeShadeMax) ? slopeShadeMax : 1;
    mesh.userData.edgeBlendWeightMin = Number.isFinite(edgeBlendWeightMin) ? edgeBlendWeightMin : 1;
    mesh.userData.edgeBlendWeightMax = Number.isFinite(edgeBlendWeightMax) ? edgeBlendWeightMax : 1;
    return mesh;
  }

  function sampleTerrainTileAxis(axis, maxPoints) {
    const values = axis.map(Number).filter(Number.isFinite);
    if (values.length <= maxPoints) return values;
    const output = [];
    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex = Math.round((index * (values.length - 1)) / (maxPoints - 1));
      output.push(values[sourceIndex]);
    }
    return output;
  }

  function syncTerrainTileInspectStatus(tile) {
    const activeTile = tile || (selectedTerrainTileId
      ? getTerrainDetailTileItems().find((item) => item.id === selectedTerrainTileId)
      : null);
    const context = terrainTileLocalCityContext(activeTile);
    const pending = Boolean(activeTile && terrainDetailTileSurfaceGroup.userData.referenceLayersPending);
    const surfaceReady = Boolean(activeTile && terrainDetailTileSurfaceGroup.userData.tileId === activeTile.id);
    const status = !activeTile
      ? "idle"
      : pending
        ? "loading"
        : surfaceReady
          ? "ready"
          : "loading";
    const referenceStageText = terrainTileReferenceLayerStageText(status);
    const pipelineText = terrainTilePipelineStatusText(activeTile, status);
    container.dataset.terrainTileInspectMode = activeTile ? "tile" : "overview";
    container.dataset.terrainTileReferenceLayerStatus = activeTile
      ? status
      : "idle";
    container.dataset.terrainTileInspectContextText = activeTile ? context.contextText : "";
    container.dataset.terrainTileReferenceLayerStageText = referenceStageText;
    container.dataset.terrainTilePipelineStatusText = pipelineText;
    if (terrainTileInspectStatus) {
      terrainTileInspectStatus.hidden = !activeTile;
      terrainTileInspectStatus.dataset.state = status;
      terrainTileInspectStatus.dataset.contextText = activeTile ? context.contextText : "";
      terrainTileInspectStatus.title = activeTile ? context.contextText : "";
      terrainTileInspectStatus.textContent = activeTile
        ? `DEM 检查：${terrainTileLabel(activeTile)} · ${status === "ready" ? "参考层就绪" : "参考层加载中"}`
        : "DEM 检查：未选择高清区域";
    }
    if (terrainTileInspectContext) {
      terrainTileInspectContext.hidden = !activeTile;
      terrainTileInspectContext.textContent = activeTile ? context.contextText : "";
    }
    if (terrainTilePipelineStatus) {
      terrainTilePipelineStatus.hidden = !activeTile;
      terrainTilePipelineStatus.textContent = activeTile ? pipelineText : "";
    }
    renderTerrainTilePipelineChips(activeTile, status);
    renderTerrainTileWorkflowInspector(activeTile, status, context);
    renderTerrainTileRenderQa(activeTile, status);
    syncTerrainWorkflowSummary();
    updateActiveTerrainTileButtons(activeTile ? activeTile.id : null);
  }

  function scheduleSelectedTerrainTilePanelRefresh(tileId) {
    if (selectedTerrainTilePanelFrame) {
      window.cancelAnimationFrame(selectedTerrainTilePanelFrame);
    }
    container.dataset.terrainTilePanelRefreshPending = "true";
    selectedTerrainTilePanelFrame = window.requestAnimationFrame(() => {
      selectedTerrainTilePanelFrame = 0;
      container.dataset.terrainTilePanelRefreshPending = "false";
      if (selectedTerrainTileId === tileId) {
        updateSelectedPanel();
        renderTerrainTileButtons();
      }
    });
  }

  function cancelTerrainTileReferenceLayerFrame(options = {}) {
    terrainTileReferenceLayerToken += 1;
    if (terrainTileReferenceLayerFrame) {
      window.cancelAnimationFrame(terrainTileReferenceLayerFrame);
      terrainTileReferenceLayerFrame = 0;
    }
    terrainTileReferenceLayerStageIndex = 0;
    terrainDetailTileSurfaceGroup.userData.referenceLayersPending = false;
    container.dataset.terrainDetailTileReferenceLayerStage = "idle";
    container.dataset.terrainDetailTileReferenceLayerStageIndex = "0";
    container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    if (!options.deferInspectSync) {
      syncTerrainTileInspectStatus(null);
    }
  }

  function cloneTerrainTileReferenceUserData(userData) {
    const output = { ...userData };
    Object.keys(output).forEach((key) => {
      if (Array.isArray(output[key])) {
        output[key] = [...output[key]];
      }
    });
    return output;
  }

  function detachTerrainTileReferenceLayerGroup(group) {
    const children = group.children.splice(0);
    return {
      children,
      userData: cloneTerrainTileReferenceUserData(group.userData || {}),
    };
  }

  function attachTerrainTileReferenceLayerGroup(group, cachedLayer) {
    clearGroup(group);
    group.children = cachedLayer.children;
    group.userData = cloneTerrainTileReferenceUserData(cachedLayer.userData || {});
  }

  function terrainTilePipelineStatusText(activeTile, status) {
    if (!activeTile) {
      return "";
    }
    const surfaceReady = terrainDetailTileSurfaceGroup.userData.tileId === activeTile.id;
    const surfaceVertices = Number(terrainDetailTileSurfaceGroup.userData.vertexCount || 0);
    const surfaceCacheState = terrainTileSurfaceCache.has(activeTile.id) ? "cached" : surfaceReady ? "live" : "pending";
    const refsCacheState = terrainTileReferenceLayerCache.has(activeTile.id) ? "cached" : status === "ready" ? "live" : "pending";
    const surfaceText = surfaceReady ? `${surfaceVertices} verts` : "pending";
    return `Surface ${surfaceText} | Refs ${status} | Stage ${terrainTileReferenceLayerStageText(status)} | Cache surface ${surfaceCacheState} / refs ${refsCacheState}`;
  }

  function renderTerrainTilePipelineChips(activeTile, status) {
    if (!terrainTilePipelineChips) {
      return;
    }
    if (!activeTile) {
      terrainTilePipelineChips.hidden = true;
      terrainTilePipelineChips.replaceChildren();
      container.dataset.terrainTilePipelineChipText = "";
      container.dataset.terrainTilePipelineChipStates = "";
      return;
    }
    const surfaceReady = terrainDetailTileSurfaceGroup.userData.tileId === activeTile.id;
    const surfaceVertices = Number(terrainDetailTileSurfaceGroup.userData.vertexCount || 0);
    const surfaceCacheState = terrainTileSurfaceCache.has(activeTile.id) ? "cached" : surfaceReady ? "live" : "pending";
    const refsCacheState = terrainTileReferenceLayerCache.has(activeTile.id) ? "cached" : status === "ready" ? "live" : "pending";
    const stageText = terrainTileReferenceLayerStageText(status);
    const chipItems = [
      { label: `Surface ${surfaceReady ? `${surfaceVertices} verts` : "pending"}`, state: surfaceReady ? "ready" : "loading" },
      { label: `Refs ${status}`, state: status === "ready" ? "ready" : "loading" },
      { label: `Stage ${stageText}`, state: stageText.includes("ready") ? "ready" : "loading" },
      { label: `Cache S:${surfaceCacheState} R:${refsCacheState}`, state: surfaceCacheState === "cached" && refsCacheState === "cached" ? "ready" : "loading" },
    ];
    terrainTilePipelineChips.hidden = false;
    terrainTilePipelineChips.replaceChildren(...chipItems.map((item) => {
      const chip = document.createElement("span");
      chip.className = "terrain-tile-pipeline-chip";
      chip.dataset.state = item.state;
      chip.textContent = item.label;
      return chip;
    }));
    container.dataset.terrainTilePipelineChipText = chipItems.map((item) => item.label).join(" | ");
    container.dataset.terrainTilePipelineChipStates = chipItems.map((item) => item.state).join(",");
  }

  function renderTerrainTileWorkflowInspector(activeTile, status, context) {
    const emptyState = () => {
      container.dataset.terrainTileWorkflowInspectorText = "";
      container.dataset.terrainTileWorkflowInspectorBandLabels = "";
      container.dataset.terrainTileWorkflowInspectorTraceState = "";
      container.dataset.terrainTileWorkflowInspectorContextText = "";
      if (terrainTileWorkflowInspector) {
        terrainTileWorkflowInspector.hidden = true;
        terrainTileWorkflowInspector.replaceChildren();
      }
    };
    if (!activeTile) {
      emptyState();
      return;
    }
    const surfaceReady = terrainDetailTileSurfaceGroup.userData.tileId === activeTile.id;
    const bandLabels = surfaceReady && Array.isArray(terrainDetailTileSurfaceGroup.userData.colorBandLabels)
      ? terrainDetailTileSurfaceGroup.userData.colorBandLabels
      : [];
    const cityContext = context || terrainTileLocalCityContext(activeTile);
    const traceAid = Core.summarizeTerrainTileTraceAid(activeTile, {
      contourSegments: Number(terrainDetailTileContourGroup.userData.segmentCount) || 0,
      boundarySegments: Number(terrainDetailTileBoundaryGroup.userData.segmentCount) || 0,
      waterSegments: Number(terrainDetailTileWaterGroup.userData.segmentCount) || 0,
      traceGuides: Core.buildTerrainTileTraceGuides(activeTile),
      recommendedTraceGuideCount: Number(terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount) || 0,
    });
    const bandText = bandLabels.length ? bandLabels.join(" / ") : "bands pending";
    const provinceText = cityContext.provinceNames.length ? cityContext.provinceNames.join(" / ") : "province pending";
    const cityText = cityContext.cityNames.length ? cityContext.cityNames.join(" / ") : "city context pending";
    const traceText = `${traceAid.traceReadiness}/${traceAid.detailPriority}`;
    const summaryText = `Tile ${terrainTileLabel(activeTile)} | Bands ${bandText} | ${provinceText} | ${cityText} | Surface ${surfaceReady ? "ready" : "loading"} | Refs ${status} | Trace ${traceText}`;
    container.dataset.terrainTileWorkflowInspectorText = summaryText;
    container.dataset.terrainTileWorkflowInspectorBandLabels = bandLabels.join(",");
    container.dataset.terrainTileWorkflowInspectorTraceState = traceText;
    container.dataset.terrainTileWorkflowInspectorContextText = cityContext.contextText;
    if (!terrainTileWorkflowInspector) {
      return;
    }
    const items = [
      { label: `Tile ${terrainTileLabel(activeTile)}`, state: "ready" },
      { label: `Bands ${bandText}`, state: bandLabels.length ? "ready" : "loading" },
      { label: provinceText, state: cityContext.provinceNames.length ? "ready" : "idle" },
      { label: cityText, state: cityContext.cityNames.length ? "ready" : "idle" },
      { label: `Surface ${surfaceReady ? "ready" : "loading"}`, state: surfaceReady ? "ready" : "loading" },
      { label: `Refs ${status}`, state: status === "ready" ? "ready" : "loading" },
      { label: `Trace ${traceText}`, state: traceAid.traceReadiness === "ready" ? "ready" : "partial" },
    ];
    terrainTileWorkflowInspector.hidden = false;
    terrainTileWorkflowInspector.replaceChildren(...items.map((item) => {
      const chip = document.createElement("span");
      chip.className = "terrain-tile-workflow-chip";
      chip.dataset.state = item.state;
      chip.textContent = item.label;
      return chip;
    }));
    terrainTileWorkflowInspector.title = summaryText;
  }

  function terrainTileRenderQaVerdict(activeTile, status, metrics) {
    if (!activeTile) {
      return { id: "idle", label: "idle", state: "idle", flags: ["No tile"] };
    }
    const flags = [];
    if (!metrics.surfaceReady) flags.push("Surface");
    if (metrics.vertices < 1000 || metrics.cells < 1000) flags.push("Mesh");
    if (!metrics.bandLabels.length || metrics.bandLabels.length < 2) flags.push("Bands");
    if (!(metrics.slopeMin < 0.96 && metrics.slopeMax > 1.04)) flags.push("Slope");
    if (!(metrics.edgeMin <= 0.05 && metrics.edgeMax >= 0.95)) flags.push("Edge");
    if (metrics.contourReadiness !== "ready") flags.push("Contours");
    if (status !== "ready") flags.push("Refs");
    if (!flags.length) {
      return { id: "pass", label: "pass", state: "ready", flags: [] };
    }
    const loadingFlags = ["Surface", "Mesh", "Refs"].some((flag) => flags.includes(flag));
    return {
      id: loadingFlags ? "loading" : "inspect",
      label: loadingFlags ? "loading" : "inspect",
      state: loadingFlags ? "loading" : "partial",
      flags,
    };
  }

  function recommendTerrainTileVisualPreset(activeTile, status, metrics, verdict) {
    const natural = TERRAIN_DETAIL_TILE_VISUAL_PRESETS.natural;
    if (!activeTile) {
      return {
        ...natural,
        state: "idle",
        reason: "Select a DEM tile",
      };
    }
    if (!metrics.surfaceReady || status !== "ready") {
      return {
        ...natural,
        state: "loading",
        reason: "Waiting for DEM refs",
      };
    }
    const flags = new Set(verdict.flags || []);
    if (flags.has("Edge") || metrics.edgeMin > 0.05 || metrics.edgeMax < 0.95) {
      return {
        ...TERRAIN_DETAIL_TILE_VISUAL_PRESETS["soft-edge"],
        state: "partial",
        reason: "Blend tile edge",
      };
    }
    if (flags.has("Slope") || metrics.slopeMin > 0.82 || metrics.slopeMax < 1.18) {
      return {
        ...TERRAIN_DETAIL_TILE_VISUAL_PRESETS.relief,
        state: "partial",
        reason: "Strengthen local relief",
      };
    }
    return {
      ...natural,
      state: verdict.id === "pass" ? "ready" : verdict.state,
      reason: verdict.id === "pass" ? "QA pass baseline" : `Inspect ${verdict.flags.join(" / ")}`,
    };
  }

  function updateTerrainTileVisualRecommendationApplied() {
    const recommendedPresetId = container.dataset.terrainTileVisualRecommendedPreset || "";
    const settings = terrainTileVisualSettings();
    const applied = Boolean(recommendedPresetId && recommendedPresetId === settings.id);
    container.dataset.terrainTileVisualRecommendationApplied = String(applied);
    if (terrainTileVisualRecommendation) {
      terrainTileVisualRecommendation.dataset.applied = String(applied);
    }
    if (applyTerrainTileVisualRecommendationBtn && recommendedPresetId) {
      applyTerrainTileVisualRecommendationBtn.textContent = applied ? `Applied ${settings.label}` : "Apply";
      applyTerrainTileVisualRecommendationBtn.disabled = false;
      applyTerrainTileVisualRecommendationBtn.setAttribute("aria-pressed", String(applied));
    }
  }

  function renderTerrainTileVisualRecommendation(activeTile, status, metrics, verdict) {
    const recommendation = recommendTerrainTileVisualPreset(activeTile, status, metrics, verdict);
    const text = `Recommend ${recommendation.label} | ${recommendation.reason}`;
    container.dataset.terrainTileVisualRecommendedPreset = recommendation.id;
    container.dataset.terrainTileVisualRecommendedLabel = recommendation.label;
    container.dataset.terrainTileVisualRecommendationReason = recommendation.reason;
    container.dataset.terrainTileVisualRecommendationText = text;
    if (!terrainTileVisualRecommendation) {
      updateTerrainTileVisualRecommendationApplied();
      return;
    }
    terrainTileVisualRecommendation.hidden = false;
    terrainTileVisualRecommendation.dataset.state = recommendation.state;
    terrainTileVisualRecommendation.title = text;
    const label = terrainTileVisualRecommendation.querySelector("strong");
    if (label) {
      label.textContent = text;
    }
    if (applyTerrainTileVisualRecommendationBtn) {
      applyTerrainTileVisualRecommendationBtn.dataset.terrainTileVisualRecommendationPreset = recommendation.id;
      applyTerrainTileVisualRecommendationBtn.disabled = !activeTile;
    }
    updateTerrainTileVisualRecommendationApplied();
  }

  function renderTerrainTileRenderQa(activeTile, status) {
    const emptyState = () => {
      container.dataset.terrainTileRenderQaText = "";
      container.dataset.terrainTileRenderQaVisibleText = "";
      container.dataset.terrainTileRenderQaSlopeShadeRange = "";
      container.dataset.terrainTileRenderQaEdgeBlendRange = "";
      container.dataset.terrainTileRenderQaBandLabels = "";
      container.dataset.terrainTileRenderQaContourSegmentCount = "0";
      container.dataset.terrainTileRenderQaContourLevelCount = "0";
      container.dataset.terrainTileRenderQaContourReadiness = "";
      container.dataset.terrainTileRenderQaContourOpacity = "";
      container.dataset.terrainTileRenderQaState = "";
      container.dataset.terrainTileRenderQaVerdict = "";
      container.dataset.terrainTileRenderQaFlags = "";
      container.dataset.terrainTileVisualRecommendedPreset = "";
      container.dataset.terrainTileVisualRecommendedLabel = "";
      container.dataset.terrainTileVisualRecommendationReason = "";
      container.dataset.terrainTileVisualRecommendationText = "";
      container.dataset.terrainTileVisualRecommendationApplied = "false";
      if (terrainTileRenderQa) {
        terrainTileRenderQa.hidden = true;
        terrainTileRenderQa.replaceChildren();
      }
      if (terrainTileVisualRecommendation) {
        terrainTileVisualRecommendation.hidden = true;
        terrainTileVisualRecommendation.dataset.applied = "false";
      }
      if (applyTerrainTileVisualRecommendationBtn) {
        applyTerrainTileVisualRecommendationBtn.disabled = true;
        applyTerrainTileVisualRecommendationBtn.textContent = "Apply";
        applyTerrainTileVisualRecommendationBtn.removeAttribute("aria-pressed");
      }
    };
    if (!activeTile) {
      emptyState();
      return;
    }
    const surfaceReady = terrainDetailTileSurfaceGroup.userData.tileId === activeTile.id;
    const vertices = Number(terrainDetailTileSurfaceGroup.userData.vertexCount || 0);
    const cells = Number(terrainDetailTileSurfaceGroup.userData.renderedCellCount || 0);
    const bandLabels = surfaceReady && Array.isArray(terrainDetailTileSurfaceGroup.userData.colorBandLabels)
      ? terrainDetailTileSurfaceGroup.userData.colorBandLabels
      : [];
    const slopeMin = Number(terrainDetailTileSurfaceGroup.userData.slopeShadeMin || 1);
    const slopeMax = Number(terrainDetailTileSurfaceGroup.userData.slopeShadeMax || 1);
    const edgeMin = Number(terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMin || 1);
    const edgeMax = Number(terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMax || 1);
    const contourSegments = Number(terrainDetailTileContourGroup.userData.segmentCount || 0);
    const contourLevels = Array.isArray(terrainDetailTileContourGroup.userData.levels)
      ? terrainDetailTileContourGroup.userData.levels
      : [];
    const contourLevelCount = contourLevels.length;
    const contourMinimumSegments = Math.max(24, contourLevelCount * 8);
    const contourReadiness = status !== "ready"
      ? "loading"
      : contourSegments >= contourMinimumSegments && contourLevelCount >= 2
        ? "ready"
        : "inspect";
    const contourOpacityValue = Number(terrainDetailTileContourGroup.userData.opacity || 0);
    const contourOpacity = contourOpacityValue > 0 ? contourOpacityValue.toFixed(2) : "0.00";
    const slopeRange = surfaceReady ? `${slopeMin.toFixed(3)}-${slopeMax.toFixed(3)}` : "pending";
    const edgeRange = surfaceReady ? `${edgeMin.toFixed(3)}-${edgeMax.toFixed(3)}` : "pending";
    const bandText = bandLabels.length ? bandLabels.join(" / ") : "bands pending";
    const qaState = surfaceReady && status === "ready" ? "ready" : surfaceReady ? "loading" : "idle";
    const metrics = { surfaceReady, vertices, cells, bandLabels, slopeMin, slopeMax, edgeMin, edgeMax, contourSegments, contourLevelCount, contourReadiness, contourOpacity };
    const verdict = terrainTileRenderQaVerdict(activeTile, status, metrics);
    const flagText = verdict.flags.length ? verdict.flags.join(" / ") : "none";
    const items = [
      { label: `Verdict ${verdict.label}`, state: verdict.state },
      { label: `Flags ${flagText}`, state: verdict.flags.length ? verdict.state : "ready" },
      { label: `Style ${terrainTileVisualSettings().label}`, state: "ready" },
      { label: `QA ${terrainTileLabel(activeTile)}`, state: surfaceReady ? "ready" : "loading" },
      { label: `Mesh ${vertices} verts / ${cells} cells`, state: surfaceReady && vertices > 0 ? "ready" : "loading" },
      { label: `Bands ${bandText}`, state: bandLabels.length ? "ready" : "loading" },
      { label: `Slope ${slopeRange}`, state: surfaceReady && slopeMin < 0.96 && slopeMax > 1.04 ? "ready" : surfaceReady ? "loading" : "idle" },
      { label: `Edge ${edgeRange}`, state: surfaceReady && edgeMin <= 0.05 && edgeMax >= 0.95 ? "ready" : surfaceReady ? "loading" : "idle" },
      { label: `Contours ${metrics.contourSegments} seg / ${metrics.contourLevelCount} levels / ${metrics.contourOpacity} opacity`, state: contourReadiness },
      { label: `Refs ${status}`, state: status === "ready" ? "ready" : "loading" },
    ];
    const text = items.map((item) => item.label).join(" | ");
    container.dataset.terrainTileRenderQaText = text;
    container.dataset.terrainTileRenderQaVisibleText = text;
    container.dataset.terrainTileRenderQaSlopeShadeRange = slopeRange;
    container.dataset.terrainTileRenderQaEdgeBlendRange = edgeRange;
    container.dataset.terrainTileRenderQaBandLabels = bandLabels.join(",");
    container.dataset.terrainTileRenderQaContourSegmentCount = String(contourSegments);
    container.dataset.terrainTileRenderQaContourLevelCount = String(contourLevelCount);
    container.dataset.terrainTileRenderQaContourReadiness = contourReadiness;
    container.dataset.terrainTileRenderQaContourOpacity = contourOpacity;
    container.dataset.terrainTileRenderQaState = qaState;
    container.dataset.terrainTileRenderQaVerdict = verdict.id;
    container.dataset.terrainTileRenderQaFlags = verdict.flags.join(",");
    renderTerrainTileVisualRecommendation(activeTile, status, metrics, verdict);
    if (!terrainTileRenderQa) {
      return;
    }
    terrainTileRenderQa.hidden = false;
    terrainTileRenderQa.replaceChildren(...items.map((item) => {
      const chip = document.createElement("span");
      chip.className = "terrain-tile-render-qa-chip";
      chip.dataset.state = item.state;
      chip.textContent = item.label;
      return chip;
    }));
    terrainTileRenderQa.title = text;
  }

  function terrainTileReferenceLayerStageText(status) {
    const stage = container.dataset.terrainDetailTileReferenceLayerStage || (status === "ready" ? "ready" : "queued");
    const stageIndex = Number(container.dataset.terrainDetailTileReferenceLayerStageIndex || 0);
    const stageTotal = Number(container.dataset.terrainDetailTileReferenceLayerStageTotal || TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    if (stage === "ready") {
      return `ready ${stageTotal}/${stageTotal}`;
    }
    if (stage === "idle") {
      return "idle";
    }
    if (stage === "cache") {
      return `cache restore ${stageIndex}/${stageTotal}`;
    }
    if (stage === "queued") {
      return `queued 0/${stageTotal}`;
    }
    const label = TERRAIN_TILE_REFERENCE_LAYER_STAGES.find((item) => item.id === stage);
    if (label) {
      return `${label.id} ${Math.max(1, stageIndex)}/${stageTotal}`;
    }
    return `${stage} ${stageIndex}/${stageTotal}`;
  }

  function trimTerrainTileSurfaceCache() {
    while (terrainTileSurfaceCache.size > TERRAIN_TILE_REFERENCE_LAYER_CACHE_LIMIT) {
      const oldestTileId = terrainTileSurfaceCache.keys().next().value;
      const oldestEntry = terrainTileSurfaceCache.get(oldestTileId);
      terrainTileSurfaceCache.delete(oldestTileId);
      if (!oldestEntry) continue;
      oldestEntry.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }

  function cacheActiveTerrainTileSurface() {
    const tileId = terrainDetailTileSurfaceGroup.userData.tileId;
    if (!tileId || !terrainDetailTileSurfaceGroup.children.length) {
      return false;
    }
    terrainTileSurfaceCache.delete(tileId);
    terrainTileSurfaceCache.set(tileId, detachTerrainTileReferenceLayerGroup(terrainDetailTileSurfaceGroup));
    trimTerrainTileSurfaceCache();
    return true;
  }

  function restoreTerrainTileSurfaceFromCache(tile) {
    const entry = tile && terrainTileSurfaceCache.get(tile.id);
    if (!entry) {
      return false;
    }
    terrainTileSurfaceCache.delete(tile.id);
    terrainTileSurfaceCache.set(tile.id, entry);
    attachTerrainTileReferenceLayerGroup(terrainDetailTileSurfaceGroup, entry);
    return true;
  }

  function trimTerrainTileReferenceLayerCache() {
    while (terrainTileReferenceLayerCache.size > TERRAIN_TILE_REFERENCE_LAYER_CACHE_LIMIT) {
      const oldestTileId = terrainTileReferenceLayerCache.keys().next().value;
      const oldestEntry = terrainTileReferenceLayerCache.get(oldestTileId);
      terrainTileReferenceLayerCache.delete(oldestTileId);
      [
        oldestEntry && oldestEntry.contours,
        oldestEntry && oldestEntry.boundaries,
        oldestEntry && oldestEntry.water,
        oldestEntry && oldestEntry.traceGuides,
      ].forEach((cachedLayer) => {
        if (!cachedLayer) return;
        cachedLayer.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });
    }
  }

  function terrainTileReferenceLayersReadyForCache(tileId) {
    return Boolean(tileId)
      && terrainDetailTileContourGroup.userData.tileId === tileId
      && terrainDetailTileBoundaryGroup.userData.tileId === tileId
      && terrainDetailTileWaterGroup.userData.tileId === tileId
      && terrainDetailTileTraceGuideGroup.userData.tileId === tileId;
  }

  function cacheActiveTerrainTileReferenceLayers(options = {}) {
    const tileId = terrainDetailTileContourGroup.userData.tileId
      || terrainDetailTileBoundaryGroup.userData.tileId
      || terrainDetailTileWaterGroup.userData.tileId
      || terrainDetailTileTraceGuideGroup.userData.tileId;
    if (!tileId || (!options.allowPending && terrainDetailTileSurfaceGroup.userData.referenceLayersPending)) {
      return false;
    }
    if (!terrainTileReferenceLayersReadyForCache(tileId)) {
      return false;
    }
    const hasReferenceLayers = terrainDetailTileContourGroup.children.length
      || terrainDetailTileBoundaryGroup.children.length
      || terrainDetailTileWaterGroup.children.length
      || terrainDetailTileTraceGuideGroup.children.length;
    if (!hasReferenceLayers) {
      return false;
    }
    terrainTileReferenceLayerCache.delete(tileId);
    terrainTileReferenceLayerCache.set(tileId, {
      contours: detachTerrainTileReferenceLayerGroup(terrainDetailTileContourGroup),
      boundaries: detachTerrainTileReferenceLayerGroup(terrainDetailTileBoundaryGroup),
      water: detachTerrainTileReferenceLayerGroup(terrainDetailTileWaterGroup),
      traceGuides: detachTerrainTileReferenceLayerGroup(terrainDetailTileTraceGuideGroup),
    });
    trimTerrainTileReferenceLayerCache();
    return true;
  }

  function restoreTerrainTileReferenceLayersFromCache(tile, options = {}) {
    const entry = tile && terrainTileReferenceLayerCache.get(tile.id);
    if (!entry) {
      return false;
    }
    terrainTileReferenceLayerCache.delete(tile.id);
    terrainTileReferenceLayerCache.set(tile.id, entry);
    attachTerrainTileReferenceLayerGroup(terrainDetailTileContourGroup, entry.contours);
    attachTerrainTileReferenceLayerGroup(terrainDetailTileBoundaryGroup, entry.boundaries);
    attachTerrainTileReferenceLayerGroup(terrainDetailTileWaterGroup, entry.water);
    attachTerrainTileReferenceLayerGroup(terrainDetailTileTraceGuideGroup, entry.traceGuides);
    terrainDetailTileSurfaceGroup.userData.referenceLayersPending = false;
    container.dataset.terrainDetailTileReferenceLayersPending = "false";
    container.dataset.terrainDetailTileReferenceLayerStage = "ready";
    container.dataset.terrainDetailTileReferenceLayerStageIndex = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    container.dataset.terrainTileReferenceLayerRestoreMode = options.lightweight ? "lightweight" : "full";
    applyTerrainDetailTileLayerVisibility();
    syncTerrainDetailTileSurfaceDebugState();
    return true;
  }

  function scheduleCachedTerrainTileReferenceLayerRestore(tile) {
    const token = terrainTileReferenceLayerToken + 1;
    terrainTileReferenceLayerToken = token;
    terrainDetailTileSurfaceGroup.userData.referenceLayersPending = true;
    container.dataset.terrainDetailTileSurfaceVisible = String(terrainDetailTileSurfaceGroup.children.length > 0);
    container.dataset.terrainDetailTileSurfaceTileId = String(terrainDetailTileSurfaceGroup.userData.tileId || "");
    container.dataset.terrainDetailTileSurfaceVertexCount = String(terrainDetailTileSurfaceGroup.userData.vertexCount || 0);
    container.dataset.terrainDetailTileReferenceLayersPending = "true";
    container.dataset.terrainDetailTileReferenceLayerStage = "cache";
    container.dataset.terrainDetailTileReferenceLayerStageIndex = "0";
    container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    if (terrainTileReferenceLayerFrame) {
      window.cancelAnimationFrame(terrainTileReferenceLayerFrame);
    }
    terrainTileReferenceLayerFrame = window.requestAnimationFrame(() => {
      terrainTileReferenceLayerFrame = 0;
      if (token !== terrainTileReferenceLayerToken || !tile || terrainDetailTileSurfaceGroup.userData.tileId !== tile.id) {
        return;
      }
      const targetReferenceCacheEntry = tile && terrainTileReferenceLayerCache.get(tile.id);
      if (targetReferenceCacheEntry) {
        terrainTileReferenceLayerCache.delete(tile.id);
      }
      cacheActiveTerrainTileReferenceLayers({ allowPending: true });
      if (targetReferenceCacheEntry) {
        terrainTileReferenceLayerCache.set(tile.id, targetReferenceCacheEntry);
      }
      const restored = restoreTerrainTileReferenceLayersFromCache(tile, { lightweight: true });
      if (!restored) {
        scheduleTerrainTileReferenceLayers(tile);
        return;
      }
      container.dataset.terrainDetailTileReferenceLayerStage = "ready";
      container.dataset.terrainDetailTileReferenceLayerStageIndex = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
      container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
      if (selectedTerrainTileId === tile.id) {
        syncTerrainTileInspectStatus(tile);
        scheduleSelectedTerrainTilePanelRefresh(tile.id);
      }
    });
  }

  function scheduleTerrainTileReferenceLayers(tile) {
    const token = terrainTileReferenceLayerToken + 1;
    terrainTileReferenceLayerToken = token;
    terrainTileReferenceLayerStageIndex = 0;
    terrainDetailTileSurfaceGroup.userData.referenceLayersPending = true;
    container.dataset.terrainDetailTileReferenceLayersPending = "true";
    container.dataset.terrainDetailTileReferenceLayerStage = "queued";
    container.dataset.terrainDetailTileReferenceLayerStageIndex = "0";
    container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    syncTerrainTileInspectStatus(tile);
    if (terrainTileReferenceLayerFrame) {
      window.cancelAnimationFrame(terrainTileReferenceLayerFrame);
    }
    terrainTileReferenceLayerFrame = window.requestAnimationFrame(() => runTerrainTileReferenceLayerStage(tile, token));
  }

  function runTerrainTileReferenceLayerStage(tile, token) {
    terrainTileReferenceLayerFrame = 0;
    if (token !== terrainTileReferenceLayerToken || !tile || terrainDetailTileSurfaceGroup.userData.tileId !== tile.id) {
      return;
    }
    const stage = TERRAIN_TILE_REFERENCE_LAYER_STAGES[terrainTileReferenceLayerStageIndex];
    if (stage) {
      container.dataset.terrainDetailTileReferenceLayerStage = stage.id;
      container.dataset.terrainDetailTileReferenceLayerStageIndex = String(terrainTileReferenceLayerStageIndex + 1);
      container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
      stage.run(tile);
      terrainTileReferenceLayerStageIndex += 1;
      terrainTileReferenceLayerFrame = window.requestAnimationFrame(() => runTerrainTileReferenceLayerStage(tile, token));
      return;
    }
    cacheActiveTerrainTileReferenceLayers();
    restoreTerrainTileReferenceLayersFromCache(tile);
    terrainDetailTileSurfaceGroup.userData.referenceLayersPending = false;
    container.dataset.terrainDetailTileReferenceLayerStage = "ready";
    container.dataset.terrainDetailTileReferenceLayerStageIndex = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    container.dataset.terrainDetailTileReferenceLayerStageTotal = String(TERRAIN_TILE_REFERENCE_LAYER_STAGES.length);
    applyLayerVisibility();
    syncTerrainDetailTileSurfaceDebugState();
    syncTerrainTileInspectStatus(tile);
    if (selectedTerrainTileId === tile.id) {
      scheduleSelectedTerrainTilePanelRefresh(tile.id);
    }
  }

  function refreshSelectedTerrainTileSurface(tile) {
    cancelTerrainTileReferenceLayerFrame({ deferInspectSync: Boolean(tile) });
    const restoreCachedTerrainTileSurfaceFirst = tile && terrainTileSurfaceCache.has(tile.id);
    if (restoreCachedTerrainTileSurfaceFirst) {
      cacheActiveTerrainTileSurface();
      clearGroup(terrainDetailTileSurfaceGroup);
      restoreTerrainTileSurfaceFromCache(tile);
      [
        terrainDetailTileContourGroup,
        terrainDetailTileBoundaryGroup,
        terrainDetailTileWaterGroup,
        terrainDetailTileTraceGuideGroup,
      ].forEach((group) => {
        group.visible = false;
      });
      scheduleCachedTerrainTileReferenceLayerRestore(tile);
      return;
    }
    cacheActiveTerrainTileReferenceLayers();
    cacheActiveTerrainTileSurface();
    clearGroup(terrainDetailTileSurfaceGroup);
    clearGroup(terrainDetailTileContourGroup);
    clearGroup(terrainDetailTileBoundaryGroup);
    clearGroup(terrainDetailTileWaterGroup);
    clearGroup(terrainDetailTileTraceGuideGroup);
    let surfaceReady = false;
    if (restoreTerrainTileSurfaceFromCache(tile)) {
      surfaceReady = true;
    } else {
      const mesh = createTerrainDetailTileSurface(tile);
      if (mesh) {
        terrainDetailTileSurfaceGroup.add(mesh);
        terrainDetailTileSurfaceGroup.userData.tileId = tile.id;
        terrainDetailTileSurfaceGroup.userData.vertexCount = mesh.userData.vertexCount;
        terrainDetailTileSurfaceGroup.userData.renderedCellCount = mesh.userData.renderedCellCount;
        terrainDetailTileSurfaceGroup.userData.skippedCellCount = mesh.userData.skippedCellCount;
        terrainDetailTileSurfaceGroup.userData.colorBandLabels = mesh.userData.colorBandLabels || [];
        terrainDetailTileSurfaceGroup.userData.colorBandCount = mesh.userData.colorBandCount || 0;
        terrainDetailTileSurfaceGroup.userData.slopeShadeMin = mesh.userData.slopeShadeMin || 1;
        terrainDetailTileSurfaceGroup.userData.slopeShadeMax = mesh.userData.slopeShadeMax || 1;
        terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMin = mesh.userData.edgeBlendWeightMin || 1;
        terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMax = mesh.userData.edgeBlendWeightMax || 1;
        surfaceReady = true;
      }
    }
    if (surfaceReady) {
      resetTerrainDetailTileContourState();
      resetTerrainDetailTileBoundaryState();
      resetTerrainDetailTileWaterState();
      resetTerrainDetailTileTraceGuideState();
      if (terrainTileReferenceLayerCache.has(tile.id)) {
        scheduleCachedTerrainTileReferenceLayerRestore(tile);
        return;
      }
      applyLayerVisibility();
      scheduleTerrainTileReferenceLayers(tile);
    } else {
      terrainDetailTileSurfaceGroup.userData.tileId = "";
      terrainDetailTileSurfaceGroup.userData.vertexCount = 0;
      terrainDetailTileSurfaceGroup.userData.renderedCellCount = 0;
      terrainDetailTileSurfaceGroup.userData.skippedCellCount = 0;
      terrainDetailTileSurfaceGroup.userData.colorBandLabels = [];
      terrainDetailTileSurfaceGroup.userData.colorBandCount = 0;
      terrainDetailTileSurfaceGroup.userData.slopeShadeMin = 1;
      terrainDetailTileSurfaceGroup.userData.slopeShadeMax = 1;
      terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMin = 1;
      terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMax = 1;
      resetTerrainDetailTileContourState();
      resetTerrainDetailTileBoundaryState();
      resetTerrainDetailTileWaterState();
      resetTerrainDetailTileTraceGuideState();
    }
    syncTerrainDetailTileSurfaceDebugState();
  }

  function syncTerrainDetailTileSurfaceDebugState() {
    worldGroup.userData.terrainDetailTileWaterSegmentCount = terrainDetailTileWaterGroup.userData.segmentCount || 0;
    worldGroup.userData.terrainDetailTileWaterRiverCount = terrainDetailTileWaterGroup.userData.riverCount || 0;
    worldGroup.userData.terrainDetailTileWaterLakeCount = terrainDetailTileWaterGroup.userData.lakeCount || 0;
    worldGroup.userData.terrainDetailTileTraceGuideCount = terrainDetailTileTraceGuideGroup.userData.guideCount || 0;
    worldGroup.userData.terrainDetailTileTraceGuideKinds = (terrainDetailTileTraceGuideGroup.userData.guideKinds || []).join(",");
    worldGroup.userData.terrainDetailTileRecommendedTraceGuideCount = terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount || 0;
    worldGroup.userData.terrainDetailTileRecommendedTraceGuideKinds = (terrainDetailTileTraceGuideGroup.userData.recommendedGuideKinds || []).join(",");
    container.dataset.terrainDetailTileSurfaceVisible = String(terrainDetailTileSurfaceGroup.children.length > 0);
    container.dataset.terrainDetailTileSurfaceTileId = String(terrainDetailTileSurfaceGroup.userData.tileId || "");
    container.dataset.terrainDetailTileSurfaceVertexCount = String(terrainDetailTileSurfaceGroup.userData.vertexCount || 0);
    container.dataset.terrainDetailTileSurfaceCellCount = String(terrainDetailTileSurfaceGroup.userData.renderedCellCount || 0);
    container.dataset.terrainDetailTileSurfaceColorBandCount = String(terrainDetailTileSurfaceGroup.userData.colorBandCount || 0);
    container.dataset.terrainDetailTileSurfaceColorBandLabels = (terrainDetailTileSurfaceGroup.userData.colorBandLabels || []).join(",");
    container.dataset.terrainDetailTileSurfaceSlopeShadeMin = Number(terrainDetailTileSurfaceGroup.userData.slopeShadeMin || 1).toFixed(3);
    container.dataset.terrainDetailTileSurfaceSlopeShadeMax = Number(terrainDetailTileSurfaceGroup.userData.slopeShadeMax || 1).toFixed(3);
    container.dataset.terrainDetailTileSurfaceEdgeBlendMin = Number(terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMin || 1).toFixed(3);
    container.dataset.terrainDetailTileSurfaceEdgeBlendMax = Number(terrainDetailTileSurfaceGroup.userData.edgeBlendWeightMax || 1).toFixed(3);
    container.dataset.terrainDetailTileReferenceLayersPending = String(Boolean(terrainDetailTileSurfaceGroup.userData.referenceLayersPending));
    container.dataset.terrainDetailTileContourSegmentCount = String(terrainDetailTileContourGroup.userData.segmentCount || 0);
    container.dataset.terrainDetailTileContourLevels = (terrainDetailTileContourGroup.userData.levels || []).join(",");
    container.dataset.terrainDetailTileContourOpacity = Number(terrainDetailTileContourGroup.userData.opacity || 0).toFixed(2);
    container.dataset.terrainDetailTileContourOpacityMode = terrainDetailTileContourGroup.userData.opacityMode || "idle";
    container.dataset.terrainDetailTileBoundarySegmentCount = String(terrainDetailTileBoundaryGroup.userData.segmentCount || 0);
    container.dataset.terrainDetailTileProvinceBoundarySegmentCount = String(terrainDetailTileBoundaryGroup.userData.provinceSegmentCount || 0);
    container.dataset.terrainDetailTilePrefectureBoundarySegmentCount = String(terrainDetailTileBoundaryGroup.userData.prefectureSegmentCount || 0);
    container.dataset.terrainDetailTileBoundaryFeatureCount = String(terrainDetailTileBoundaryGroup.userData.featureCount || 0);
    container.dataset.terrainDetailTileBoundaryRingCount = String(terrainDetailTileBoundaryGroup.userData.ringCount || 0);
    container.dataset.terrainDetailTileWaterSegmentCount = String(terrainDetailTileWaterGroup.userData.segmentCount || 0);
    container.dataset.terrainDetailTileWaterRiverCount = String(terrainDetailTileWaterGroup.userData.riverCount || 0);
    container.dataset.terrainDetailTileWaterLakeCount = String(terrainDetailTileWaterGroup.userData.lakeCount || 0);
    container.dataset.terrainDetailTileTraceGuideCount = String(terrainDetailTileTraceGuideGroup.userData.guideCount || 0);
    container.dataset.terrainDetailTileTraceGuideKinds = (terrainDetailTileTraceGuideGroup.userData.guideKinds || []).join(",");
    container.dataset.terrainDetailTileRecommendedTraceGuideCount = String(terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount || 0);
    container.dataset.terrainDetailTileRecommendedTraceGuideKinds = (terrainDetailTileTraceGuideGroup.userData.recommendedGuideKinds || []).join(",");
    container.dataset.terrainDetailTileTraceGuidePointCount = String(terrainDetailTileTraceGuideGroup.userData.pointCount || 0);
    if (!terrainDetailTileSurfaceGroup.children.length) {
      container.dataset.terrainTileRecommendedSuggestionCount = "0";
      container.dataset.terrainTileRecommendedSuggestionGroupIds = "";
    }
  }

  function createChinaBoundary() {
    fallbackBoundaryGroup.userData.source = "hand-drawn-fallback";
    const boundary = createPathLine(Core.CHINA_BOUNDARY.path, new THREE.Color("#00f5d4"), 0.72, BOUNDARY_LIFT);
    boundary.userData.role = "country-boundary";
    fallbackBoundaryGroup.add(boundary);
    Core.CHINA_PROVINCE_BOUNDARY_GUIDES.forEach((guide) => {
      const line = createPathLine(guide.path, PROVINCE_BOUNDARY_COLOR, 0.22, PROVINCE_BOUNDARY_LIFT);
      line.userData.role = "province-boundary-guide";
      provinceBoundaryGroup.add(line);
    });
    updateFallbackBoundaryVisibility();
  }

  function updateFallbackBoundaryVisibility() {
    fallbackBoundaryGroup.visible = !terrainRegionMask;
    worldGroup.userData.fallbackBoundaryVisible = fallbackBoundaryGroup.visible;
    container.dataset.fallbackBoundaryVisible = String(fallbackBoundaryGroup.visible);
  }

  async function loadProvinceBoundaries() {
    const errors = [];
    try {
      const provinceLayer = await fetchBoundaryLayer(PROVINCE_BOUNDARY_SOURCE);
      replaceAdministrativeBoundaryLayer(provinceLayer, PROVINCE_BOUNDARY_SOURCE, "province");
    } catch (error) {
      console.warn(error);
      errors.push(error);
      if (terrainRegionMask && Array.isArray(terrainRegionMask.rings) && terrainRegionMask.rings.length) {
        replaceAdministrativeBoundaryLayer(terrainRegionMask, {
          id: "geoboundaries-adm1-mask",
          opacity: 0.3,
        }, "province");
      }
    }

    try {
      const prefectureLayer = await fetchBoundaryLayer(PREFECTURE_BOUNDARY_SOURCE);
      replaceAdministrativeBoundaryLayer(prefectureLayer, PREFECTURE_BOUNDARY_SOURCE, "prefecture");
    } catch (error) {
      console.warn(error);
      errors.push(error);
      syncAdministrativeBoundaryDebugState();
    }

    if (!provinceBoundaryLayer && layerSummary) {
      layerSummary.textContent += " 省界 GeoJSON 加载失败，当前使用手绘引导线。";
    }
    if (!prefectureBoundaryLayer && layerSummary) {
      layerSummary.textContent += " 地级市界 GeoJSON 加载失败。";
    }
  }

  async function fetchBoundaryLayer(source) {
    const response = await fetch(source.path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${source.id} boundary request failed: ${response.status}`);
    }
    const geojson = await response.json();
    const layer = Core.extractGeoJsonBoundaryRings(geojson, {
      region: Core.CHINA_REGION,
      minRingPoints: source.minRingPoints,
    });
    if (!layer.rings.length) {
      throw new Error(`${source.id} produced no renderable boundary rings`);
    }
    return layer;
  }

  async function loadTerrainElevationGrid() {
    const errors = [];
    for (const sourcePath of DEM_SOURCE_CANDIDATES) {
      try {
        const response = await fetch(sourcePath, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`DEM grid request failed: ${response.status}`);
        }
        const grid = await response.json();
        const probe = Core.sampleTerrainGridMeters(grid, Core.CHINA_REGION.center.lat, Core.CHINA_REGION.center.lng);
        if (!Number.isFinite(probe)) {
          throw new Error("DEM grid produced no sample at China center");
        }
        terrainElevationGrid = grid;
        worldGroup.userData.terrainSource = grid.id || "height-grid";
        worldGroup.userData.terrainSourcePath = sourcePath;
        worldGroup.userData.terrainSourceErrors = errors.length;
        syncTerrainSourceDebugState();
        return;
      } catch (error) {
        console.warn(error);
        errors.push(error);
      }
    }
    terrainElevationGrid = null;
    worldGroup.userData.terrainSource = "procedural-fallback";
    worldGroup.userData.terrainSourcePath = "procedural-fallback";
    worldGroup.userData.terrainSourceErrors = errors.length;
    syncTerrainSourceDebugState();
  }

  function syncTerrainSourceDebugState() {
    container.dataset.terrainSource = String(worldGroup.userData.terrainSource || "");
    container.dataset.terrainSourcePath = String(worldGroup.userData.terrainSourcePath || "");
    container.dataset.terrainSourceErrors = String(worldGroup.userData.terrainSourceErrors || 0);
  }

  async function loadTerrainSourceCatalog() {
    try {
      const response = await fetch(TERRAIN_SOURCE_CATALOG_SOURCE, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Terrain source catalog request failed: ${response.status}`);
      }
      const catalog = await response.json();
      if (!catalog || !Array.isArray(catalog.sources)) {
        throw new Error("Terrain source catalog has no sources array");
      }
      terrainSourceCatalog = catalog;
      const sources = getTerrainSourceCatalogItems();
      worldGroup.userData.terrainSourceCatalogCount = sources.length;
      worldGroup.userData.terrainSourceCatalogPrimary = sources[0] ? sources[0].id : "";
    } catch (error) {
      console.warn(error);
      terrainSourceCatalog = null;
      worldGroup.userData.terrainSourceCatalogCount = 0;
      worldGroup.userData.terrainSourceCatalogPrimary = "none";
    }
    syncTerrainSourceCatalogDebugState();
  }

  function syncTerrainSourceCatalogDebugState() {
    container.dataset.terrainSourceCatalogCount = String(worldGroup.userData.terrainSourceCatalogCount || 0);
    container.dataset.terrainSourceCatalogPrimary = String(worldGroup.userData.terrainSourceCatalogPrimary || "");
  }

  async function loadTerrainDetailTiles() {
    try {
      let tileLayer = null;
      let mode = "index";
      try {
        tileLayer = await fetchTerrainDetailTileLayer(LOCAL_DEM_TILE_INDEX_SOURCE);
      } catch (indexError) {
        console.warn(indexError);
        tileLayer = await fetchTerrainDetailTileLayer(LOCAL_DEM_TILE_SOURCE);
        mode = "inline";
      }
      if (!tileLayer || !Array.isArray(tileLayer.tiles)) {
        throw new Error("Local DEM tile file has no tiles array");
      }
      terrainDetailTiles = tileLayer;
      worldGroup.userData.terrainDetailTileSource = tileLayer.id || "local-dem-tiles";
      worldGroup.userData.terrainDetailTileCount = tileLayer.tiles.length;
      worldGroup.userData.terrainDetailInspectableTileCount = getTerrainDetailTileItems().length;
      worldGroup.userData.terrainDetailTileMode = mode;
      worldGroup.userData.terrainDetailLoadedTileCount = countLoadedTerrainDetailTiles();
    } catch (error) {
      console.warn(error);
      terrainDetailTiles = null;
      worldGroup.userData.terrainDetailTileSource = "none";
      worldGroup.userData.terrainDetailTileCount = 0;
      worldGroup.userData.terrainDetailInspectableTileCount = 0;
      worldGroup.userData.terrainDetailTileMode = "none";
      worldGroup.userData.terrainDetailLoadedTileCount = 0;
    }
    syncTerrainDetailTileDebugState();
  }

  async function fetchTerrainDetailTileLayer(source) {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Local DEM tile request failed: ${response.status}`);
    }
    return response.json();
  }

  function countLoadedTerrainDetailTiles() {
    const tiles = terrainDetailTiles && Array.isArray(terrainDetailTiles.tiles)
      ? terrainDetailTiles.tiles
      : [];
    return tiles.filter((tile) => tile && Array.isArray(tile.elevationsMeters)).length;
  }

  function syncTerrainDetailTileDebugState() {
    container.dataset.terrainDetailTileSource = String(worldGroup.userData.terrainDetailTileSource || "");
    container.dataset.terrainDetailTileCount = String(worldGroup.userData.terrainDetailTileCount || 0);
    container.dataset.terrainDetailInspectableTileCount = String(worldGroup.userData.terrainDetailInspectableTileCount || 0);
    container.dataset.terrainDetailTileMode = String(worldGroup.userData.terrainDetailTileMode || "");
    container.dataset.terrainDetailLoadedTileCount = String(worldGroup.userData.terrainDetailLoadedTileCount || 0);
  }

  async function loadTerrainRegionMask() {
    try {
      const response = await fetch("data/raw/geoboundaries-chn-adm1-simplified.geojson", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Terrain region mask request failed: ${response.status}`);
      }
      const geojson = await response.json();
      const layer = Core.extractGeoJsonBoundaryRings(geojson, {
        region: Core.CHINA_REGION,
        minRingPoints: 4,
      });
      if (!layer.rings.length) {
        throw new Error("Terrain region mask produced no renderable rings");
      }
      terrainRegionMask = layer;
      worldGroup.userData.terrainMaskSource = "geoboundaries-adm1";
      worldGroup.userData.terrainMaskRingCount = layer.rings.length;
    } catch (error) {
      console.warn(error);
      terrainRegionMask = null;
      worldGroup.userData.terrainMaskSource = "region-bounds-fallback";
      worldGroup.userData.terrainMaskRingCount = 0;
    }
  }

  async function loadTerrainDetailPatches() {
    try {
      const response = await fetch("data/terrain/china-detail-patches.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Terrain detail patch request failed: ${response.status}`);
      }
      const patchLayer = await response.json();
      if (!patchLayer || !Array.isArray(patchLayer.patches)) {
        throw new Error("Terrain detail patch file has no patches array");
      }
      terrainDetailPatches = patchLayer;
      patchVisibility = Core.createDetailPatchVisibilityState(patchLayer, patchVisibility);
      worldGroup.userData.terrainDetailPatchCount = patchLayer.patches.length;
    } catch (error) {
      console.warn(error);
      terrainDetailPatches = null;
      patchVisibility = {};
      worldGroup.userData.terrainDetailPatchCount = 0;
    }
  }

  async function loadTerrainTraceGuides() {
    try {
      const response = await fetch("data/terrain/china-trace-guides.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Terrain trace guide request failed: ${response.status}`);
      }
      const traceLayer = await response.json();
      if (!traceLayer || !Array.isArray(traceLayer.traces)) {
        throw new Error("Terrain trace guide file has no traces array");
      }
      terrainTraceGuides = traceLayer;
      traceVisibility = Core.createTerrainTraceVisibilityState(traceLayer, traceVisibility);
      worldGroup.userData.terrainTraceGuideCount = traceLayer.traces.length;
    } catch (error) {
      console.warn(error);
      terrainTraceGuides = null;
      traceVisibility = {};
      worldGroup.userData.terrainTraceGuideCount = 0;
    }
  }

  async function loadFirstJsonLayer(sourcePaths, isValidLayer) {
    const errors = [];
    for (const sourcePath of sourcePaths) {
      try {
        const response = await fetch(sourcePath, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`${sourcePath} request failed: ${response.status}`);
        }
        const layer = await response.json();
        if (!isValidLayer(layer)) {
          throw new Error(`${sourcePath} has an unsupported layer shape`);
        }
        return { layer, sourcePath, errors };
      } catch (error) {
        console.warn(error);
        errors.push(error);
      }
    }
    throw new Error(`No usable layer found from ${sourcePaths.join(", ")}`);
  }

  async function loadChinaRiverCenterlines() {
    try {
      const { layer: riverLayer, sourcePath } = await loadFirstJsonLayer(RIVER_SOURCE_CANDIDATES, (layer) =>
        layer && Array.isArray(layer.rivers) && layer.rivers.length
      );
      const supplementalLayer = await loadSupplementalTributaries();
      chinaRiverCenterlines = mergeRiverCenterlineLayers(riverLayer, supplementalLayer);
      worldGroup.userData.waterSource = chinaRiverCenterlines.source || "natural-earth-rivers-10m";
      worldGroup.userData.waterSourcePath = sourcePath;
      container.dataset.waterSourcePath = sourcePath;
      worldGroup.userData.waterSupplementalCount = supplementalLayer && Array.isArray(supplementalLayer.rivers)
        ? supplementalLayer.rivers.length
        : 0;
    } catch (error) {
      console.warn(error);
      chinaRiverCenterlines = null;
      worldGroup.userData.waterSource = "hand-drawn-fallback";
      worldGroup.userData.waterSourcePath = "hand-drawn-fallback";
      container.dataset.waterSourcePath = "hand-drawn-fallback";
      worldGroup.userData.waterSupplementalCount = 0;
    }
  }

  async function loadSupplementalTributaries() {
    try {
      const response = await fetch("data/terrain/china-supplemental-tributaries.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Supplemental tributary request failed: ${response.status}`);
      }
      const layer = await response.json();
      if (!layer || !Array.isArray(layer.rivers)) {
        throw new Error("Supplemental tributary file has no rivers array");
      }
      return layer;
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  function mergeRiverCenterlineLayers(baseLayer, supplementalLayer) {
    const baseRivers = baseLayer && Array.isArray(baseLayer.rivers) ? baseLayer.rivers : [];
    const supplementalRivers = supplementalLayer && Array.isArray(supplementalLayer.rivers)
      ? supplementalLayer.rivers
      : [];
    if (!supplementalRivers.length) {
      return baseLayer;
    }
    return {
      ...baseLayer,
      source: `${baseLayer.source || "natural-earth-rivers-10m"} + ${supplementalLayer.source || "supplemental-tributaries"}`,
      supplementalSource: supplementalLayer.source || "supplemental-tributaries",
      supplementalRiverCount: supplementalRivers.length,
      rivers: [...baseRivers, ...supplementalRivers],
    };
  }

  async function loadChinaWaterReferences() {
    try {
      const { layer: referenceLayer, sourcePath } = await loadFirstJsonLayer(WATER_REFERENCE_SOURCE_CANDIDATES, (layer) =>
        layer && Array.isArray(layer.lakes) && Array.isArray(layer.coastlines)
      );
      const supplementalLayer = await loadSupplementalWaterReferences();
      chinaWaterReferences = mergeWaterReferenceLayers(referenceLayer, supplementalLayer);
      worldGroup.userData.waterReferenceSourcePath = sourcePath;
      container.dataset.waterReferenceSourcePath = sourcePath;
    } catch (error) {
      console.warn(error);
      chinaWaterReferences = null;
      worldGroup.userData.waterReferenceSourcePath = "none";
      container.dataset.waterReferenceSourcePath = "none";
    }
  }

  async function loadSupplementalWaterReferences() {
    try {
      const response = await fetch("data/terrain/china-supplemental-water-references.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Supplemental water reference request failed: ${response.status}`);
      }
      const layer = await response.json();
      if (!layer || !Array.isArray(layer.lakes) || !Array.isArray(layer.coastlines)) {
        throw new Error("Supplemental water reference file has no lakes/coastlines arrays");
      }
      return layer;
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  function mergeWaterReferenceLayers(baseLayer, supplementalLayer) {
    const baseLakes = baseLayer && Array.isArray(baseLayer.lakes) ? baseLayer.lakes : [];
    const baseCoastlines = baseLayer && Array.isArray(baseLayer.coastlines) ? baseLayer.coastlines : [];
    const supplementalLakes = supplementalLayer && Array.isArray(supplementalLayer.lakes)
      ? supplementalLayer.lakes
      : [];
    const supplementalCoastlines = supplementalLayer && Array.isArray(supplementalLayer.coastlines)
      ? supplementalLayer.coastlines
      : [];
    if (!supplementalLakes.length && !supplementalCoastlines.length) {
      return baseLayer;
    }
    return {
      ...baseLayer,
      source: `${baseLayer.source || "natural-earth-10m-water-physical"} + ${supplementalLayer.source || "supplemental-water-references"}`,
      supplementalSource: supplementalLayer.source || "supplemental-water-references",
      supplementalLakeCount: supplementalLakes.length,
      supplementalCoastlineCount: supplementalCoastlines.length,
      lakes: [...baseLakes, ...supplementalLakes],
      coastlines: [...baseCoastlines, ...supplementalCoastlines],
    };
  }

  async function loadWeatherCloudFlow() {
    try {
      const latitude = WEATHER_SAMPLE_POINTS.map((point) => point.lat).join(",");
      const longitude = WEATHER_SAMPLE_POINTS.map((point) => point.lng).join(",");
      const url = `${OPEN_METEO_FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=cloud_cover,wind_speed_10m,wind_direction_10m&hourly=${OPEN_METEO_CURRENT_FIELDS}&forecast_hours=1&timezone=auto`;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), WEATHER_REQUEST_TIMEOUT_MS);
      const response = await fetch(url, { cache: "no-store", signal: controller.signal })
        .finally(() => window.clearTimeout(timeout));
      if (!response.ok) {
        throw new Error(`Open-Meteo weather request failed: ${response.status}`);
      }
      const payload = await response.json();
      weatherCloudFlow = normalizeWeatherCloudFlow(payload, "open-meteo-current");
      if (!weatherCloudFlow.points.length) {
        throw new Error("Open-Meteo weather response has no usable weather points");
      }
    } catch (error) {
      console.warn(error);
      weatherCloudFlow = createFallbackWeatherLayer();
    }
  }

  async function refreshWeatherCloudFlow() {
    await loadWeatherCloudFlow();
    createWeatherCloudFlow(weatherCloudFlow);
    refreshLakeWeatherDrivenMotion();
    applyLayerVisibility();
  }

  function normalizeWeatherCloudFlow(payload, source) {
    const responses = Array.isArray(payload) ? payload : [payload];
    return {
      source,
      updatedAt: new Date().toISOString(),
      points: WEATHER_SAMPLE_POINTS.map((sample, index) => {
        const entry = responses[index] || responses[0] || {};
        const current = entry.current || {};
        const hourly = entry.hourly || {};
        const cloudCover = firstFinite(current.cloud_cover, firstFinite(hourly.cloud_cover, fallbackCloudCover(sample, index)));
        const windSpeed = firstFinite(current.wind_speed_10m, firstFinite(hourly.wind_speed_10m, 12 + index * 1.7));
        const windDirection = firstFinite(current.wind_direction_10m, firstFinite(hourly.wind_direction_10m, 245 - index * 17));
        return {
          ...sample,
          cloudCover,
          windSpeed,
          windDirection,
          heading: (windDirection + 180) % 360,
        };
      }),
    };
  }

  function firstFinite(values, fallback) {
    const list = Array.isArray(values) ? values : [values];
    const value = list.find((item) => Number.isFinite(Number(item)));
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function fallbackCloudCover(sample, index) {
    const westMoisture = Math.max(0, (112 - sample.lng) / 40);
    const southMoisture = Math.max(0, (34 - sample.lat) / 18);
    return Math.round(Math.min(92, 24 + westMoisture * 24 + southMoisture * 34 + index * 2));
  }

  function createFallbackWeatherLayer() {
    return {
      source: "local-simulated-wind",
      updatedAt: new Date().toISOString(),
      points: WEATHER_SAMPLE_POINTS.map((sample, index) => ({
        ...sample,
        cloudCover: fallbackCloudCover(sample, index),
        windSpeed: 10 + index * 1.8,
        windDirection: 250 - index * 14,
        heading: (70 - index * 14 + 360) % 360,
      })),
    };
  }

  async function loadTerrainPatchSuggestions() {
    try {
      const response = await fetch("data/terrain/china-trace-patch-suggestions.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Terrain patch suggestion request failed: ${response.status}`);
      }
      const suggestionLayer = await response.json();
      if (!suggestionLayer || !Array.isArray(suggestionLayer.patches)) {
        throw new Error("Terrain patch suggestion file has no patches array");
      }
      terrainPatchSuggestions = suggestionLayer;
      suggestionVisibility = Core.createTerrainPatchSuggestionGroupVisibilityState(suggestionLayer, suggestionVisibility);
      worldGroup.userData.terrainPatchSuggestionCount = suggestionLayer.patches.length;
    } catch (error) {
      console.warn(error);
      terrainPatchSuggestions = null;
      suggestionVisibility = {};
      worldGroup.userData.terrainPatchSuggestionCount = 0;
    }
  }

  async function loadTerrainApprovedPatches() {
    try {
      const response = await fetch("data/terrain/china-approved-detail-patches.json", { cache: "no-store" });
      if (response.status === 404) {
        terrainApprovedPatches = null;
        approvedPatchVisibility = {};
        worldGroup.userData.terrainApprovedPatchCount = 0;
        return;
      }
      if (!response.ok) {
        throw new Error(`Approved terrain patch request failed: ${response.status}`);
      }
      const patchLayer = await response.json();
      if (!patchLayer || !Array.isArray(patchLayer.patches)) {
        throw new Error("Approved terrain patch file has no patches array");
      }
      terrainApprovedPatches = patchLayer;
      approvedPatchVisibility = Core.createDetailPatchVisibilityState(patchLayer, approvedPatchVisibility);
      worldGroup.userData.terrainApprovedPatchCount = patchLayer.patches.length;
    } catch (error) {
      console.warn(error);
      terrainApprovedPatches = null;
      approvedPatchVisibility = {};
      worldGroup.userData.terrainApprovedPatchCount = 0;
    }
  }

  function createTerrainDetailPatches() {
    clearGroup(terrainPatchGroup);
    if (!terrainDetailPatches || !Array.isArray(terrainDetailPatches.patches)) {
      return;
    }
    terrainDetailPatches.patches.forEach((patch) => {
      const ring = Core.buildTerrainDetailPatchRing(patch, 64);
      if (ring.length < 4) return;
      const focusPoint = terrainDetailPatchFocusPoint(patch);
      if (!focusPoint) return;
      const isDepression = Number(patch.deltaMeters) < 0;
      const color = new THREE.Color(isDepression ? "#73a7ff" : "#ff9f43");
      const line = createPathLine(ring, color, 0.5, TERRAIN_DETAIL_LIFT);
      line.userData.role = "terrain-detail-patch-ring";
      line.userData.patchId = patch.id;
      terrainPatchGroup.add(line);

      const center = toVector3(Core.latLngToVector3({
        lat: focusPoint.lat,
        lng: focusPoint.lng,
        radius: terrainRadius(focusPoint.lat, focusPoint.lng, TERRAIN_DETAIL_LIFT),
      }));
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.78,
          depthWrite: true,
          depthTest: true,
        })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );
      marker.position.copy(center);
      halo.position.copy(center);
      marker.userData.role = "terrain-detail-patch-center";
      marker.userData.patchId = patch.id;
      halo.userData.role = "terrain-detail-patch-center";
      halo.userData.patchId = patch.id;
      terrainPatchGroup.add(halo, marker);
    });
    terrainPatchGroup.userData.patchCount = terrainDetailPatches.patches.length;
  }

  function createTerrainTraceGuides() {
    clearGroup(terrainTraceGroup);
    if (!terrainTraceGuides || !Array.isArray(terrainTraceGuides.traces)) {
      return;
    }
    terrainTraceGuides.traces.forEach((trace) => {
      const path = Core.buildTerrainTracePath(trace);
      if (path.length < 2) return;
      const color = TRACE_COLORS[trace.kind] || TRACE_COLORS.ridge;
      const line = createPathLine(path, color, 0.52, TERRAIN_TRACE_LIFT);
      line.userData.role = "terrain-trace-guide";
      line.userData.traceId = trace.id;
      line.userData.traceKind = trace.kind;
      terrainTraceGroup.add(line);
    });
    terrainTraceGroup.userData.traceCount = terrainTraceGroup.children.length;
  }

  function createTerrainPatchSuggestions() {
    clearGroup(terrainSuggestionPatchGroup);
    if (!terrainPatchSuggestions || !Array.isArray(terrainPatchSuggestions.patches)) {
      return;
    }
    terrainPatchSuggestions.patches.forEach((patch) => {
      const ring = Core.buildTerrainDetailPatchRing(patch, 48);
      if (ring.length < 4) return;
      const focusPoint = terrainDetailPatchFocusPoint(patch);
      if (!focusPoint) return;
      const isDepression = Number(patch.deltaMeters) < 0;
      const color = new THREE.Color(isDepression ? "#b78cff" : "#daff69");
      const line = createPathLine(ring, color, 0.34, TERRAIN_SUGGESTION_LIFT);
      line.userData.role = "terrain-suggestion-patch-ring";
      line.userData.suggestionPatchId = patch.id;
      line.userData.suggestionGroupId = patch.sourceTraceId || "unassigned";
      terrainSuggestionPatchGroup.add(line);

      const center = toVector3(Core.latLngToVector3({
        lat: focusPoint.lat,
        lng: focusPoint.lng,
        radius: terrainRadius(focusPoint.lat, focusPoint.lng, TERRAIN_SUGGESTION_LIFT),
      }));
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.72,
          depthWrite: true,
          depthTest: true,
        })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );
      marker.position.copy(center);
      halo.position.copy(center);
      marker.userData.role = "terrain-suggestion-patch-center";
      marker.userData.suggestionPatchId = patch.id;
      marker.userData.suggestionGroupId = patch.sourceTraceId || "unassigned";
      halo.userData.role = "terrain-suggestion-patch-center";
      halo.userData.suggestionPatchId = patch.id;
      halo.userData.suggestionGroupId = patch.sourceTraceId || "unassigned";
      terrainSuggestionPatchGroup.add(halo, marker);
    });
    terrainSuggestionPatchGroup.userData.patchCount = terrainPatchSuggestions.patches.length;
  }

  function createTerrainApprovedPatches() {
    clearGroup(terrainApprovedPatchGroup);
    if (!terrainApprovedPatches || !Array.isArray(terrainApprovedPatches.patches)) {
      return;
    }
    terrainApprovedPatches.patches.forEach((patch) => {
      const ring = Core.buildTerrainDetailPatchRing(patch, 64);
      if (ring.length < 4) return;
      const focusPoint = terrainDetailPatchFocusPoint(patch);
      if (!focusPoint) return;
      const isDepression = Number(patch.deltaMeters) < 0;
      const color = new THREE.Color(isDepression ? "#8ec5ff" : "#9cffb0");
      const line = createPathLine(ring, color, 0.38, TERRAIN_APPROVED_LIFT);
      line.userData.role = "terrain-approved-patch-ring";
      line.userData.approvedPatchId = patch.id;
      terrainApprovedPatchGroup.add(line);

      const center = toVector3(Core.latLngToVector3({
        lat: focusPoint.lat,
        lng: focusPoint.lng,
        radius: terrainRadius(focusPoint.lat, focusPoint.lng, TERRAIN_APPROVED_LIFT),
      }));
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.78,
          depthWrite: true,
          depthTest: true,
        })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );
      marker.position.copy(center);
      halo.position.copy(center);
      marker.userData.role = "terrain-approved-patch-center";
      marker.userData.approvedPatchId = patch.id;
      halo.userData.role = "terrain-approved-patch-center";
      halo.userData.approvedPatchId = patch.id;
      terrainApprovedPatchGroup.add(halo, marker);
    });
    terrainApprovedPatchGroup.userData.patchCount = terrainApprovedPatches.patches.length;
  }

  function replaceAdministrativeBoundaryLayer(layer, source, boundaryLevel) {
    const isPrefecture = boundaryLevel === "prefecture";
    const group = isPrefecture ? prefectureBoundaryGroup : provinceBoundaryGroup;
    clearGroup(group);
    if (isPrefecture) {
      prefectureBoundaryLayer = layer;
    } else {
      provinceBoundaryLayer = layer;
    }
    const color = isPrefecture ? PREFECTURE_BOUNDARY_COLOR : PROVINCE_BOUNDARY_COLOR;
    const opacity = Number.isFinite(source.opacity) ? source.opacity : (isPrefecture ? 0.16 : 0.38);
    const role = isPrefecture ? "prefecture-boundary-real" : "province-boundary-real";
    const lift = isPrefecture ? PROVINCE_BOUNDARY_LIFT + 0.006 : PROVINCE_BOUNDARY_LIFT;
    layer.rings.forEach((ring) => {
      const renderPoints = simplifyBoundaryRenderPoints(ring.points, source.renderMaxPoints);
      if (renderPoints.length < 2) return;
      const line = createPathLine(renderPoints, color, opacity, lift);
      line.userData.role = role;
      line.userData.featureName = ring.featureName;
      line.userData.boundaryLevel = boundaryLevel;
      line.userData.baseOpacity = opacity;
      line.userData.sourcePointCount = Array.isArray(ring.points) ? ring.points.length : 0;
      line.userData.renderPointCount = renderPoints.length;
      group.add(line);
    });
    group.userData.source = source.id;
    group.userData.ringCount = layer.rings.length;
    group.userData.featureCount = layer.featureCount || layer.rings.length;
    if (isPrefecture) {
      worldGroup.userData.prefectureBoundarySource = source.id;
      worldGroup.userData.prefectureBoundaryRingCount = layer.rings.length;
      worldGroup.userData.prefectureBoundaryFeatureCount = layer.featureCount || layer.rings.length;
    } else {
      worldGroup.userData.provinceBoundarySource = source.id;
      worldGroup.userData.provinceBoundaryRingCount = layer.rings.length;
      worldGroup.userData.provinceBoundaryFeatureCount = layer.featureCount || layer.rings.length;
    }
    syncAdministrativeBoundaryDebugState();
    if (selectedTerrainTileId) {
      const selectedTile = getTerrainDetailTileItems().find((tile) => tile.id === selectedTerrainTileId);
      createTerrainDetailTileBoundaries(selectedTile);
      syncTerrainDetailTileSurfaceDebugState();
    }
    updateFallbackBoundaryVisibility();
    applyLayerVisibility();
    if (layerSummary) {
      const summary = Core.summarizeTerrainCoverage();
      const waterSummary = waterSystemSummary();
      const waterReferences = waterReferenceSummary();
      layerSummary.textContent = `已接入 ${terrainSourceLabel()}，勾勒 ${summary.blocks} 个地貌单元、水系曲线（${waterLayerSummaryText(waterSummary, waterReferences)}）；省界 ${worldGroup.userData.provinceBoundaryRingCount || 0} 环、地级市界 ${worldGroup.userData.prefectureBoundaryRingCount || 0} 环已分色贴地渲染。`;
    }
  }

  function simplifyBoundaryRenderPoints(points, maxPoints) {
    if (!Array.isArray(points)) {
      return [];
    }
    const validPoints = points.filter((point) =>
      point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))
    );
    const limit = Math.floor(Number(maxPoints) || 0);
    if (!limit || validPoints.length <= limit) {
      return validPoints;
    }
    const output = [];
    const lastIndex = validPoints.length - 1;
    for (let index = 0; index < limit; index += 1) {
      const sourceIndex = Math.round((index * lastIndex) / (limit - 1));
      output.push(validPoints[sourceIndex]);
    }
    if (output[output.length - 1] !== validPoints[lastIndex]) {
      output.push(validPoints[lastIndex]);
    }
    return output;
  }

  function syncAdministrativeBoundaryDebugState() {
    const provinceRings = Number(worldGroup.userData.provinceBoundaryRingCount) || 0;
    const prefectureRings = Number(worldGroup.userData.prefectureBoundaryRingCount) || 0;
    const provinceFeatures = Number(worldGroup.userData.provinceBoundaryFeatureCount) || 0;
    const prefectureFeatures = Number(worldGroup.userData.prefectureBoundaryFeatureCount) || 0;
    worldGroup.userData.boundarySource = [
      worldGroup.userData.provinceBoundarySource,
      worldGroup.userData.prefectureBoundarySource,
    ].filter(Boolean).join("+");
    worldGroup.userData.boundaryRingCount = provinceRings + prefectureRings;
    worldGroup.userData.boundaryFeatureCount = provinceFeatures + prefectureFeatures;
    container.dataset.provinceBoundarySource = String(worldGroup.userData.provinceBoundarySource || "");
    container.dataset.prefectureBoundarySource = String(worldGroup.userData.prefectureBoundarySource || "");
    container.dataset.provinceBoundaryRingCount = String(provinceRings);
    container.dataset.prefectureBoundaryRingCount = String(prefectureRings);
    container.dataset.provinceBoundaryFeatureCount = String(provinceFeatures);
    container.dataset.prefectureBoundaryFeatureCount = String(prefectureFeatures);
    container.dataset.boundarySource = String(worldGroup.userData.boundarySource || "");
    container.dataset.boundaryRingCount = String(worldGroup.userData.boundaryRingCount || 0);
    container.dataset.boundaryFeatureCount = String(worldGroup.userData.boundaryFeatureCount || 0);
  }

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
  }

  function createTerrainSites() {
    Core.CHINA_TERRAIN_SITES.forEach((site) => {
      const group = new THREE.Group();
      const position = toVector3(Core.latLngToVector3({
        lat: site.lat,
        lng: site.lng,
        radius: terrainRadius(site.lat, site.lng, TERRAIN_SITE_LIFT),
      }));
      const color = SITE_COLORS[site.tone] || SITE_COLORS.cyan;

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.82,
          depthWrite: true,
          depthTest: true,
        })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );

      group.position.copy(position);
      group.add(halo, pin);
      group.userData.role = "terrain-site";
      group.userData.hotspot = site;
      worldGroup.add(group);
      hotspotMeshes.set(site.id, group);
    });
  }

  function createTerrainCities() {
    Core.CHINA_TERRAIN_CITIES.forEach((city) => {
      const group = new THREE.Group();
      const position = toVector3(Core.latLngToVector3({
        lat: city.lat,
        lng: city.lng,
        radius: terrainRadius(city.lat, city.lng, TERRAIN_SITE_LIFT),
      }));
      const color = SITE_COLORS[city.tone] || SITE_COLORS.cyan;

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.88,
          depthWrite: true,
          depthTest: true,
        })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 12, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.10,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );
      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          position.clone().normalize().multiplyScalar(0.042),
        ]),
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
          depthTest: true,
        })
      );

      group.position.copy(position);
      group.add(stem, halo, pin);
      group.userData.role = "terrain-city";
      group.userData.hotspot = city;
      stem.userData.role = "terrain-city-stem";
      halo.userData.role = "terrain-city";
      pin.userData.role = "terrain-city";
      worldGroup.add(group);
      cityMeshes.set(city.id, group);
      hotspotMeshes.set(city.id, group);
    });
    worldGroup.userData.terrainCityCount = Core.CHINA_TERRAIN_CITIES.length;
    container.dataset.terrainCityCount = String(Core.CHINA_TERRAIN_CITIES.length);
  }

  function createCityLabels() {
    Core.CHINA_TERRAIN_CITIES.forEach((city) => {
      const label = document.createElement("div");
      label.className = "terrain-city-label";
      label.dataset.cityId = city.id;
      label.setAttribute("data-city-id", city.id);
      label.dataset.role = "terrain-city-label";
      label.textContent = city.name;
      container.appendChild(label);
      cityLabelElements.set(city.id, label);
    });
  }

  function createTerrainBlockLabels() {
    Core.FIVE_TERRAIN_BLOCKS.forEach((block) => {
      const label = document.createElement("div");
      label.className = "terrain-block-label";
      label.dataset.terrainBlockId = block.id;
      label.dataset.terrainBlockTier = String(block.tier || 3);
      label.dataset.role = "terrain-block-label";
      label.textContent = block.name;
      label.hidden = true;
      container.appendChild(label);
      terrainBlockLabelElements.set(block.id, label);
    });
    container.dataset.terrainBlockLabelCount = String(Core.FIVE_TERRAIN_BLOCKS.length);
    container.dataset.terrainBlockLabelVisibleCount = "0";
    container.dataset.terrainBlockLabelVisibleIds = "";
    container.dataset.terrainBlockLabelVisibleNames = "";
  }

  function renderSiteButtons() {
    siteButtons.innerHTML = "";
    Core.CHINA_TERRAIN_SITES.forEach((site) => {
      const button = document.createElement("button");
      button.className = "site-button";
      button.type = "button";
      button.dataset.siteId = site.id;
      button.textContent = site.name;
      button.addEventListener("click", () => focusOnSite(site.id, { zoom: 4.65 }));
      siteButtons.appendChild(button);
    });
  }

  function renderCityButtons() {
    if (!cityButtons) return;
    cityButtons.innerHTML = "";
    Core.CHINA_TERRAIN_CITIES.forEach((city) => {
      const button = document.createElement("button");
      button.className = "city-button";
      button.type = "button";
      button.dataset.cityId = city.id;
      button.setAttribute("data-city-id", city.id);
      button.title = `${city.province} · ${city.region}`;
      button.innerHTML = `<span>${city.name}</span><small>${city.province}</small>`;
      button.addEventListener("click", () => focusOnCity(city.id, { zoom: 4.45 }));
      cityButtons.appendChild(button);
    });
    updateActiveCityButtons(state.selectedHotspotId || null);
  }

  function getTerrainDetailTileItems() {
    return terrainDetailTiles && Array.isArray(terrainDetailTiles.tiles)
      ? terrainDetailTiles.tiles.filter((tile) => tile && tile.id && tile.bounds)
      : [];
  }

  function isCityInsideTerrainTileFocus(city, tile) {
    if (!city || !tile || !tile.bounds) {
      return false;
    }
    const lat = Number(city.lat);
    const lng = Number(city.lng);
    const bounds = tile.bounds;
    const padding = TERRAIN_TILE_CITY_LABEL_PADDING_DEGREES;
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= Number(bounds.minLat) - padding &&
      lat <= Number(bounds.maxLat) + padding &&
      lng >= Number(bounds.minLng) - padding &&
      lng <= Number(bounds.maxLng) + padding;
  }

  function terrainTileLocalCities(tile) {
    if (!tile) {
      return [];
    }
    return Core.CHINA_TERRAIN_CITIES.filter((city) => isCityInsideTerrainTileFocus(city, tile));
  }

  function terrainTileLocalCityContext(tile) {
    const cities = terrainTileLocalCities(tile);
    const cityLabels = cities.map((city) => city.label).filter(Boolean);
    const cityNames = cities.map((city) => city.name || city.label).filter(Boolean);
    const provinceNames = Array.from(new Set(cities.map((city) => city.province).filter(Boolean)));
    const contextText = cities.length
      ? `${provinceNames.join(" / ")} | ${cityNames.join(" / ")}`
      : "No tested prefecture cities";
    return {
      cities,
      cityLabels,
      cityNames,
      provinceNames,
      contextText,
    };
  }

  function cityLabelDetailLevel(viewDistance) {
    const distance = Number(viewDistance);
    if (!Number.isFinite(distance) || distance <= CITY_LABEL_NEAR_DISTANCE) {
      return "near";
    }
    if (distance <= CITY_LABEL_MID_DISTANCE) {
      return "mid";
    }
    return "far";
  }

  function terrainDetailLodLevel(viewDistance) {
    const distance = Number(viewDistance);
    if (!Number.isFinite(distance) || distance <= TERRAIN_DETAIL_LOD_NEAR_DISTANCE) {
      return "near";
    }
    if (distance <= TERRAIN_DETAIL_LOD_MID_DISTANCE) {
      return "mid";
    }
    return "far";
  }

  function terrainObservationModeForDistance(viewDistance) {
    const level = terrainDetailLodLevel(viewDistance);
    if (level === "near") {
      return {
        id: "inspect",
        label: "Inspect",
        text: "Inspect | DEM relief, staged refs, subdued boundaries",
      };
    }
    if (level === "mid") {
      return {
        id: "locate",
        label: "Locate",
        text: "Locate | city relation, province and prefecture context",
      };
    }
    return {
      id: "explore",
      label: "Explore",
      text: "Explore | national terrain context",
    };
  }

  function effectiveTerrainDetailLodLevel(viewDistance) {
    if (terrainDetailDensityMode === "compact") {
      return "far";
    }
    if (terrainDetailDensityMode === "fine") {
      return "near";
    }
    return terrainDetailLodLevel(viewDistance);
  }

  function terrainViewPresetConfig(presetId) {
    return ({
      far: {
        id: "far",
        label: "Overview",
        zoom: 5.6,
        lod: "far",
        visibleLayerIds: ["terrain", "blocks", "water", "borders", "provinceBorders"],
        hiddenLayerIds: ["cityBoundaries", "contours", "waterRefs", "waterTributaries", "waterMinorTributaries", "coastRefs", "cities", "sites", "traces", "suggestions"],
      },
      mid: {
        id: "mid",
        label: "Regional",
        zoom: 4.1,
        lod: "mid",
        visibleLayerIds: ["terrain", "blocks", "water", "provinceBorders", "cityBoundaries", "cities"],
        hiddenLayerIds: ["contours", "waterRefs", "waterMinorTributaries", "coastRefs", "sites", "traces", "suggestions"],
      },
      near: {
        id: "near",
        label: "DEM inspection",
        zoom: 2.85,
        lod: "near",
        visibleLayerIds: ["terrain", "blocks", "water", "provinceBorders", "cityBoundaries", "contours", "waterRefs", "cities"],
        hiddenLayerIds: ["waterMinorTributaries", "coastRefs", "sites"],
      },
    })[presetId] || null;
  }

  function terrainViewPresetForDistance(viewDistance) {
    return terrainDetailLodLevel(viewDistance);
  }

  function detailRank(level) {
    return ({
      near: 0,
      mid: 1,
      far: 2,
    })[level] ?? 2;
  }

  function cityLabelImportance(city) {
    if (!city) {
      return 0;
    }
    if (MAJOR_CITY_LABEL_IDS.has(city.id)) {
      return 3;
    }
    if (city.terrainBlockId) {
      const blockAnchor = Core.CHINA_TERRAIN_CITIES.find((item) => item.terrainBlockId === city.terrainBlockId);
      if (blockAnchor && blockAnchor.id === city.id) {
        return 2;
      }
    }
    return 1;
  }

  function shouldShowCityForObservationDistance(city, detailLevel, isLocalTerrainCity, isSelectedTerrainCity = false) {
    if (!city) {
      return false;
    }
    if (isSelectedTerrainCity || isLocalTerrainCity || detailLevel === "near") {
      return true;
    }
    const importance = cityLabelImportance(city);
    if (detailLevel === "mid") {
      return importance >= 2;
    }
    return importance >= 3;
  }

  function shouldShowCityLabelForDistance(city, detailLevel, isLocalTerrainCity) {
    return shouldShowCityForObservationDistance(city, detailLevel, isLocalTerrainCity);
  }

  function updateTerrainCityMarkerVisibility(detailLevel, selectedTerrainTile) {
    const visibilityByCityId = new Map();
    const visibleIds = [];
    const visibilityPlan = Core.planCityObservationVisibility(Core.CHINA_TERRAIN_CITIES, {
      detailLevel,
      selectedTerrainTileBounds: selectedTerrainTile && selectedTerrainTile.bounds,
      selectedCityId: state.selectedHotspotId,
      majorCityIds: MAJOR_CITY_LABEL_IDS,
      tilePaddingDegrees: TERRAIN_TILE_CITY_LABEL_PADDING_DEGREES,
    });
    const plannedVisibilityByCityId = new Map(visibilityPlan.entries.map((entry) => [entry.cityId, entry]));
    cityMeshes.forEach((group, cityId) => {
      const plannedVisibility = plannedVisibilityByCityId.get(cityId) || {};
      const isLocalTerrainCity = Boolean(plannedVisibility.isLocalTerrainCity);
      const hiddenByTileFocus = Boolean(plannedVisibility.hiddenByTileFocus);
      const isSelectedTerrainCity = Boolean(plannedVisibility.isSelectedTerrainCity);
      const visible = layerVisibility.cities !== false && plannedVisibility.visible === true;

      visibilityByCityId.set(cityId, {
        visible,
        hiddenByTileFocus,
        isLocalTerrainCity,
        isSelectedTerrainCity,
        importance: plannedVisibility.importance || 0,
      });
      if (visible) {
        visibleIds.push(cityId);
      }
    });
    return {
      detailLevel,
      visibilityByCityId,
      visibleIds,
      hiddenByTileFocusCount: visibilityPlan.hiddenByTileFocusCount,
    };
  }

  function terrainCityMarkerVisibilityCacheKey(detailLevel, selectedTerrainTile) {
    return [
      detailLevel || "unknown",
      selectedTerrainTile && selectedTerrainTile.id ? selectedTerrainTile.id : "overview",
      state.selectedHotspotId || "none",
      layerVisibility.cities === false ? "cities-off" : "cities-on",
    ].join("|");
  }

  function syncCachedTerrainCityMarkerVisibility(cacheEntry) {
    const entry = cacheEntry || {};
    const visibilityByCityId = entry.visibilityByCityId || new Map();
    const visibleIds = Array.isArray(entry.visibleIds) ? entry.visibleIds : [];
    const detailLevel = entry.detailLevel || "";
    const visibleCount = visibleIds.length;
    cityMeshes.forEach((group, cityId) => {
      const markerState = visibilityByCityId.get(cityId) || {};
      if (group) {
        const visible = Boolean(markerState.visible);
        group.visible = visible;
        group.userData.cityLabelDetailLevel = detailLevel;
        group.userData.distanceVisible = visible;
        group.userData.localTerrainCity = Boolean(markerState.isLocalTerrainCity);
        group.userData.hiddenByTileFocus = Boolean(markerState.hiddenByTileFocus);
        group.userData.observationImportance = markerState.importance || 0;
      }
    });
    container.dataset.cityMarkerDetailLevel = detailLevel;
    container.dataset.cityMarkerVisibleCount = String(visibleCount);
    container.dataset.cityMarkerVisibleIds = visibleIds.join(",");
    container.dataset.cityMarkerHiddenByTileFocusCount = String(entry.hiddenByTileFocusCount || 0);
    container.dataset.cityMarkerVisibilityCacheKey = cityMarkerVisibilityCacheKey;
    container.dataset.cityMarkerVisibilityCacheHits = String(cityMarkerVisibilityCacheHitCount);
    container.dataset.cityMarkerVisibilityCacheMisses = String(cityMarkerVisibilityCacheMissCount);
    return visibilityByCityId;
  }

  function cachedTerrainCityMarkerVisibility(detailLevel, selectedTerrainTile) {
    const cacheKey = terrainCityMarkerVisibilityCacheKey(detailLevel, selectedTerrainTile);
    if (cityMarkerVisibilityCache && cityMarkerVisibilityCacheKey === cacheKey) {
      cityMarkerVisibilityCacheHitCount += 1;
      return syncCachedTerrainCityMarkerVisibility(cityMarkerVisibilityCache);
    }
    cityMarkerVisibilityCacheMissCount += 1;
    cityMarkerVisibilityCacheKey = cacheKey;
    cityMarkerVisibilityCache = updateTerrainCityMarkerVisibility(detailLevel, selectedTerrainTile);
    container.dataset.cityMarkerVisibilityCacheKey = cityMarkerVisibilityCacheKey;
    container.dataset.cityMarkerVisibilityCacheHits = String(cityMarkerVisibilityCacheHitCount);
    container.dataset.cityMarkerVisibilityCacheMisses = String(cityMarkerVisibilityCacheMissCount);
    return syncCachedTerrainCityMarkerVisibility(cityMarkerVisibilityCache);
  }

  function syncSelectedTerrainTileCityDebug(tile) {
    const context = terrainTileLocalCityContext(tile);
    container.dataset.selectedTerrainTileCityCount = String(context.cities.length);
    container.dataset.selectedTerrainTileCityIds = context.cities.map((city) => city.id).join(",");
    container.dataset.selectedTerrainTileCityLabels = context.cityLabels.join(",");
    container.dataset.selectedTerrainTileCityNames = context.cityNames.join(",");
    container.dataset.selectedTerrainTileProvinceNames = context.provinceNames.join(",");
  }

  function terrainTileForSuggestionSource(sourceTileId) {
    if (!sourceTileId) {
      return null;
    }
    return getTerrainDetailTileItems().find((tile) => tile.id === sourceTileId) || null;
  }

  function preserveSuggestionSourceTerrainTile(sourceTileId) {
    const tile = terrainTileForSuggestionSource(sourceTileId);
    if (!tile) {
      selectedTerrainTileId = null;
      refreshSelectedTerrainTileSurface(null);
      syncSelectedTerrainTileCityDebug(null);
      return null;
    }
    selectedTerrainTileId = tile.id;
    syncSelectedTerrainTileCityDebug(tile);
    refreshSelectedTerrainTileSurface(tile);
    ensureTerrainDetailTileLoaded(tile.id)
      .then((loadedTile) => {
        if (loadedTile && selectedTerrainTileId === loadedTile.id) {
          refreshSelectedTerrainTileSurface(loadedTile);
          syncSelectedTerrainTileCityDebug(loadedTile);
          updateSelectedPanel();
          renderTerrainTileButtons();
        }
      })
      .catch((error) => {
        console.warn(error);
        hoverLabel.textContent = "Local DEM tile detail failed to load";
      });
    return tile;
  }

  async function ensureTerrainDetailTileLoaded(tileId) {
    const tile = getTerrainDetailTileItems().find((item) => item.id === tileId);
    if (!tile || Array.isArray(tile.elevationsMeters)) {
      return tile || null;
    }
    if (!tile.sourcePath) {
      return tile;
    }
    if (!terrainDetailTileLoadPromises.has(tile.id)) {
      terrainDetailTileLoadPromises.set(tile.id, fetchTerrainDetailTile(tile));
    }
    return terrainDetailTileLoadPromises.get(tile.id);
  }

  async function fetchTerrainDetailTile(tile) {
    const response = await fetch(tile.sourcePath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Local DEM tile detail request failed: ${response.status}`);
    }
    const loadedTile = await response.json();
    if (!loadedTile || loadedTile.id !== tile.id || !Array.isArray(loadedTile.elevationsMeters)) {
      throw new Error(`Local DEM tile detail is invalid for ${tile.id}`);
    }
    const nextTile = {
      ...tile,
      ...loadedTile,
      sourcePath: tile.sourcePath,
    };
    terrainDetailTiles = {
      ...terrainDetailTiles,
      tiles: terrainDetailTiles.tiles.map((item) => item.id === tile.id ? nextTile : item),
    };
    worldGroup.userData.terrainDetailLoadedTileCount = countLoadedTerrainDetailTiles();
    syncTerrainDetailTileDebugState();
    return nextTile;
  }

  function terrainTileResolutionScore(tile) {
    const latCount = Array.isArray(tile && tile.latitudes) ? tile.latitudes.length : 0;
    const lngCount = Array.isArray(tile && tile.longitudes) ? tile.longitudes.length : 0;
    return latCount * lngCount;
  }

  function terrainTileSourceBadge(tile) {
    const gridLabel = terrainTileGridLabel(tile);
    if (tile && tile.dataset === "mapzen-terrarium") {
      return `Mapzen ${gridLabel}`;
    }
    if (tile && tile.dataset) {
      return `${tile.dataset} ${gridLabel}`;
    }
    return gridLabel;
  }

  function terrainTileButtonStatusItems(tile) {
    const isSelected = Boolean(tile && selectedTerrainTileId === tile.id);
    const surfaceLive = Boolean(tile && terrainDetailTileSurfaceGroup.userData.tileId === tile.id);
    const surfaceCached = Boolean(tile && terrainTileSurfaceCache.has(tile.id));
    const surfaceLoaded = Boolean(tile && Array.isArray(tile.elevationsMeters));
    const refsCached = Boolean(tile && terrainTileReferenceLayerCache.has(tile.id));
    const refsLive = Boolean(tile && terrainTileReferenceLayersReadyForCache(tile.id));
    const refsPending = Boolean(isSelected && terrainDetailTileSurfaceGroup.userData.referenceLayersPending);
    const surfaceState = surfaceCached
      ? "cached"
      : surfaceLive
        ? "live"
        : surfaceLoaded
          ? "loaded"
          : "idle";
    const refsState = refsCached
      ? "cached"
      : refsLive
        ? "live"
        : refsPending
          ? "pending"
          : "idle";
    const surfaceReady = surfaceState === "cached" || surfaceState === "live" || surfaceState === "loaded";
    const refsReady = refsState === "cached" || refsState === "live";
    const status = refsReady
      ? "ready"
      : isSelected
        ? container.dataset.terrainTileReferenceLayerStatus || (refsPending ? "loading" : "idle")
        : "idle";
    const readyStageText = `ready ${TERRAIN_TILE_REFERENCE_LAYER_STAGES.length}/${TERRAIN_TILE_REFERENCE_LAYER_STAGES.length}`;
    const stageText = refsReady ? readyStageText : isSelected ? terrainTileReferenceLayerStageText(status) : "idle";
    const stageReady = status === "ready" || stageText.includes("ready");
    return [
      { id: "surface", label: `Surface ${surfaceState}`, state: surfaceReady ? "ready" : isSelected ? "loading" : "idle" },
      { id: "refs", label: `Refs ${refsState}`, state: refsReady ? "ready" : refsPending ? "loading" : "idle" },
      { id: "stage", label: `Stage ${stageText}`, state: stageReady ? "ready" : isSelected ? "loading" : "idle" },
      { id: "cache", label: `Cache S:${surfaceState} R:${refsState}`, state: surfaceReady && refsReady ? "ready" : refsPending ? "loading" : "idle" },
    ];
  }

  function syncTerrainTileButtonStatus(button, tile) {
    if (!button || !tile) return;
    const items = terrainTileButtonStatusItems(tile);
    const surfaceItem = items.find((item) => item.id === "surface");
    const refsItem = items.find((item) => item.id === "refs");
    const stageItem = items.find((item) => item.id === "stage");
    button.dataset.terrainTileSurfaceCacheState = surfaceItem ? surfaceItem.label.replace(/^Surface\s+/, "") : "idle";
    button.dataset.terrainTileReferenceCacheState = refsItem ? refsItem.label.replace(/^Refs\s+/, "") : "idle";
    button.dataset.terrainTileStageState = stageItem ? stageItem.state : "idle";
    let status = button.querySelector(".terrain-tile-button-status");
    if (!status) {
      status = document.createElement("span");
      status.className = "terrain-tile-button-status";
      button.appendChild(status);
    }
    status.replaceChildren(...items.map((item) => {
      const chip = document.createElement("span");
      chip.className = "terrain-tile-button-chip";
      chip.dataset.state = item.state;
      chip.textContent = item.label;
      return chip;
    }));
  }

  function sortTerrainDetailTileItems(tiles) {
    return [...tiles].sort((left, right) => {
      const leftMapzen = left.dataset === "mapzen-terrarium" ? 1 : 0;
      const rightMapzen = right.dataset === "mapzen-terrarium" ? 1 : 0;
      if (leftMapzen !== rightMapzen) return rightMapzen - leftMapzen;
      const resolutionDiff = terrainTileResolutionScore(right) - terrainTileResolutionScore(left);
      if (resolutionDiff) return resolutionDiff;
      return terrainTileLabel(left).localeCompare(terrainTileLabel(right));
    });
  }

  function getTerrainSourceCatalogItems() {
    return terrainSourceCatalog && Array.isArray(terrainSourceCatalog.sources)
      ? terrainSourceCatalog.sources
        .filter((source) => source && source.id && source.name)
        .sort((left, right) => Number(left.priority || 999) - Number(right.priority || 999))
      : [];
  }

  function renderTerrainSourceButtons() {
    if (!terrainSourceButtons) return;
    const sources = getTerrainSourceCatalogItems();
    terrainSourceButtons.innerHTML = "";
    sources.forEach((source) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "terrain-source-button";
      button.dataset.terrainSourceId = source.id;
      button.setAttribute("data-terrain-source-id", source.id);
      const resolutionLabel = source.resolutionMeters ? `${source.resolutionMeters}m` : source.format;
      button.innerHTML = `<span>${source.name}</span><small>${resolutionLabel} · ${source.format}</small>`;
      button.addEventListener("click", () => inspectTerrainSource(source.id));
      terrainSourceButtons.appendChild(button);
    });
    terrainSourceButtons.hidden = sources.length === 0;
    if (terrainSourcePanel) {
      terrainSourcePanel.hidden = sources.length === 0;
      terrainSourcePanel.setAttribute("aria-hidden", String(terrainSourcePanel.hidden));
    }
    container.dataset.terrainSourceCatalogCount = String(sources.length);
    container.dataset.terrainSourceCatalogPrimary = sources[0] ? sources[0].id : "";
  }

  function inspectTerrainSource(sourceId) {
    const source = getTerrainSourceCatalogItems().find((item) => item.id === sourceId);
    if (!source) return;
    selectedTitle.textContent = source.name;
    selectedMeta.textContent = source.coverage || "China terrain source";
    selectedMetricLabel.textContent = "真实数据源";
    selectedMetric.textContent = `${source.kind || "DEM"} · ${source.resolutionMeters ? `${source.resolutionMeters}m` : source.format}`;
    hoverLabel.textContent = source.importPlan || "真实地形数据源：准备导入";
    updateActiveTerrainSourceButtons(source.id);
  }

  function renderTerrainTileButtons() {
    if (!terrainTileButtons) return;
    const tiles = sortTerrainDetailTileItems(getTerrainDetailTileItems());
    terrainTileButtons.innerHTML = "";
    tiles.forEach((tile) => {
      const button = document.createElement("button");
      button.className = "terrain-tile-button";
      button.type = "button";
      button.dataset.terrainTileId = tile.id;
      button.dataset.terrainTileDataset = tile.dataset || "";
      button.setAttribute("data-terrain-tile-id", tile.id);
      button.setAttribute("data-terrain-tile-dataset", tile.dataset || "");
      button.title = `${formatCoord(tile.bounds.minLat, "N", "S")}-${formatCoord(tile.bounds.maxLat, "N", "S")} · ${formatCoord(tile.bounds.minLng, "E", "W")}-${formatCoord(tile.bounds.maxLng, "E", "W")}`;
      const label = document.createElement("span");
      label.className = "terrain-tile-button-label";
      label.textContent = terrainTileLabel(tile);
      const source = document.createElement("small");
      source.className = "terrain-tile-button-source";
      source.textContent = terrainTileSourceBadge(tile);
      button.append(label, source);
      syncTerrainTileButtonStatus(button, tile);
      button.addEventListener("click", () => focusOnTerrainTile(tile.id));
      terrainTileButtons.appendChild(button);
    });
    if (terrainTilePanel) {
      terrainTilePanel.hidden = tiles.length === 0;
      terrainTilePanel.setAttribute("aria-hidden", String(terrainTilePanel.hidden));
    }
    container.dataset.terrainTileButtonCount = String(tiles.length);
    container.dataset.terrainMapzenTileCount = String(tiles.filter((tile) => tile.dataset === "mapzen-terrarium").length);
    container.dataset.terrainTilePrimaryDataset = tiles[0] ? (tiles[0].dataset || "") : "";
    updateActiveTerrainTileButtons(selectedTerrainTileId);
  }


  function renderPatchButtons() {
    if (!patchButtons) return;
    const patches = terrainDetailPatches && Array.isArray(terrainDetailPatches.patches)
      ? terrainDetailPatches.patches
      : [];
    patchButtons.innerHTML = "";
    patches.forEach((patch) => {
      const row = document.createElement("div");
      row.className = "patch-row";

      const toggle = document.createElement("button");
      const active = patchVisibility[patch.id] !== false;
      toggle.className = `patch-toggle${active ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset.patchToggleId = patch.id;
      toggle.setAttribute("aria-pressed", String(active));
      toggle.setAttribute("title", active ? "隐藏补丁" : "显示补丁");
      toggle.textContent = active ? "●" : "○";
      toggle.addEventListener("click", () => {
        patchVisibility = Core.toggleDetailPatchVisibility(patchVisibility, terrainDetailPatches, patch.id);
        applyLayerVisibility();
        renderPatchButtons();
        renderApprovedPatchButtons();
      });

      const focus = document.createElement("button");
      focus.className = "patch-focus";
      focus.type = "button";
      focus.dataset.patchFocusId = patch.id;
      focus.textContent = patch.label || patch.id;
      focus.addEventListener("click", () => focusOnPatch(patch.id));

      const delta = document.createElement("span");
      delta.className = Number(patch.deltaMeters) < 0 ? "patch-delta is-negative" : "patch-delta";
      delta.textContent = `${Number(patch.deltaMeters) > 0 ? "+" : ""}${Math.round(Number(patch.deltaMeters) || 0)}m`;

      row.append(toggle, focus, delta);
      patchButtons.appendChild(row);
    });
    updateActivePatchButtons(state.selectedPatchId || null);
  }

  function renderApprovedPatchButtons() {
    if (!patchButtons) return;
    const patches = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches
      : [];
    patches.forEach((patch) => {
      const row = document.createElement("div");
      row.className = "patch-row approved-row";

      const toggle = document.createElement("button");
      const active = approvedPatchVisibility[patch.id] !== false;
      toggle.className = `patch-toggle approved-toggle${active ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset.approvedPatchToggleId = patch.id;
      toggle.setAttribute("aria-pressed", String(active));
      toggle.setAttribute("title", active ? "隐藏已审补丁" : "显示已审补丁");
      toggle.textContent = active ? "●" : "○";
      toggle.addEventListener("click", () => {
        approvedPatchVisibility = Core.toggleDetailPatchVisibility(approvedPatchVisibility, terrainApprovedPatches, patch.id);
        applyLayerVisibility();
        if (approvedPatchTerrainPreviewEnabled) {
          refreshActiveTerrainSurfaces();
        }
        renderPatchButtons();
        renderApprovedPatchButtons();
      });

      const focus = document.createElement("button");
      focus.className = "patch-focus approved-focus";
      focus.type = "button";
      focus.dataset.approvedPatchFocusId = patch.id;
      focus.textContent = patch.label || patch.id;
      focus.addEventListener("click", () => focusOnApprovedPatch(patch.id));

      const status = document.createElement("span");
      status.className = "approved-status";
      status.textContent = patch.reviewStatus || "approved";

      row.append(toggle, focus, status);
      patchButtons.appendChild(row);
    });
    updateActiveApprovedPatchButtons(state.selectedApprovedPatchId || null);
  }

  function renderTraceButtons() {
    if (!traceButtons) return;
    const traces = terrainTraceGuides && Array.isArray(terrainTraceGuides.traces)
      ? terrainTraceGuides.traces
      : [];
    traceButtons.innerHTML = "";
    traces.forEach((trace) => {
      const row = document.createElement("div");
      row.className = "trace-row";

      const toggle = document.createElement("button");
      const active = traceVisibility[trace.id] !== false;
      toggle.className = `trace-toggle${active ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset.traceToggleId = trace.id;
      toggle.setAttribute("aria-pressed", String(active));
      toggle.setAttribute("title", active ? "隐藏临摹线" : "显示临摹线");
      toggle.textContent = active ? "●" : "○";
      toggle.addEventListener("click", () => {
        traceVisibility = Core.toggleTerrainTraceVisibility(traceVisibility, terrainTraceGuides, trace.id);
        applyLayerVisibility();
        renderTraceButtons();
      });

      const focus = document.createElement("button");
      focus.className = "trace-focus";
      focus.type = "button";
      focus.dataset.traceFocusId = trace.id;
      focus.textContent = trace.label || trace.id;
      focus.addEventListener("click", () => focusOnTrace(trace.id));

      const kind = document.createElement("span");
      kind.className = `trace-kind trace-kind-${trace.kind || "ridge"}`;
      kind.textContent = traceKindLabel(trace.kind);

      row.append(toggle, focus, kind);
      traceButtons.appendChild(row);
    });
    updateActiveTraceButtons(state.selectedTraceId || null);
  }

  function renderSuggestionButtons() {
    if (!suggestionButtons) return;
    const groups = Core.groupTerrainPatchSuggestionsByTrace(terrainPatchSuggestions);
    suggestionButtons.innerHTML = "";
    groups.forEach((group) => {
      const row = document.createElement("div");
      row.className = "suggestion-row";

      const toggle = document.createElement("button");
      const active = suggestionVisibility[group.id] !== false;
      toggle.className = `suggestion-toggle${active ? " is-active" : ""}`;
      toggle.type = "button";
      toggle.dataset.suggestionToggleId = group.id;
      toggle.setAttribute("aria-pressed", String(active));
      toggle.setAttribute("title", active ? "隐藏候选补丁" : "显示候选补丁");
      toggle.textContent = active ? "●" : "○";
      toggle.addEventListener("click", () => {
        suggestionVisibility = Core.toggleTerrainPatchSuggestionGroupVisibility(suggestionVisibility, terrainPatchSuggestions, group.id);
        applyLayerVisibility();
        renderSuggestionButtons();
      });

      const focus = document.createElement("button");
      focus.className = "suggestion-focus";
      focus.type = "button";
      focus.dataset.suggestionFocusId = group.id;
      focus.textContent = suggestionGroupLabel(group);
      focus.addEventListener("click", () => focusOnSuggestionGroup(group.id));

      const count = document.createElement("span");
      count.className = "suggestion-meta-stack";
      count.setAttribute("data-suggestion-source-tile-id", group.sourceTileId || "");
      count.setAttribute("data-suggestion-shape-summary", suggestionGroupShapeText(group));
      count.setAttribute("data-suggestion-review-status", group.reviewStatus || "draft");

      const total = document.createElement("span");
      total.className = "suggestion-count";
      total.textContent = `${group.total} 草稿`;

      const shapes = document.createElement("span");
      shapes.className = "suggestion-shapes";
      shapes.textContent = suggestionGroupShapeText(group);

      const source = document.createElement("span");
      source.className = "suggestion-source";
      source.textContent = suggestionGroupSourceText(group);
      source.title = suggestionGroupReviewText(group);

      count.append(total, shapes, source);

      row.append(toggle, focus, count);
      suggestionButtons.appendChild(row);
      if (state.selectedSuggestionGroupId === group.id) {
        suggestionButtons.appendChild(renderSuggestionPatchList(group));
      }
    });
    updateActiveSuggestionButtons(state.selectedSuggestionGroupId || null);
    updateActiveSuggestionPatchButtons(state.selectedSuggestionPatchId || null);
  }

  function renderSuggestionPatchList(group) {
    const list = document.createElement("div");
    list.className = "suggestion-patch-list";
    const actions = document.createElement("div");
    actions.className = "suggestion-bundle-actions";

    const selectGroup = document.createElement("button");
    selectGroup.className = "suggestion-bundle-action";
    selectGroup.type = "button";
    selectGroup.textContent = "组合当前组";
    selectGroup.addEventListener("click", () => selectSuggestionGroupPatches(group.id));

    const previewBundle = document.createElement("button");
    previewBundle.className = "suggestion-bundle-action";
    previewBundle.type = "button";
    previewBundle.setAttribute("data-suggestion-preview-selected", "true");
    previewBundle.textContent = "棰勮缁勫悎";
    previewBundle.disabled = getSelectedSuggestionBundle().count === 0;
    previewBundle.addEventListener("click", () => previewSelectedSuggestionPatchBundle());

    const clearBundle = document.createElement("button");
    clearBundle.className = "suggestion-bundle-action";
    clearBundle.type = "button";
    clearBundle.textContent = "清空组合";
    clearBundle.addEventListener("click", () => clearSelectedSuggestionPatchBundle());

    const bundle = getSelectedSuggestionBundle();
    const summary = document.createElement("span");
    summary.className = "suggestion-bundle-summary";
    summary.textContent = bundle.count ? `已组合 ${bundle.count}` : "未组合";

    actions.append(selectGroup, previewBundle, clearBundle, summary);
    list.appendChild(actions);

    group.patches.forEach((patch, index) => {
      const focusPoint = terrainDetailPatchFocusPoint(patch);
      if (!focusPoint) return;
      const row = document.createElement("div");
      row.className = "suggestion-patch-row";

      const select = document.createElement("button");
      const selected = selectedSuggestionPatchIds.has(patch.id);
      select.className = `suggestion-patch-select${selected ? " is-active" : ""}`;
      select.type = "button";
      select.setAttribute("data-suggestion-patch-select-id", patch.id);
      select.setAttribute("aria-pressed", String(selected));
      select.setAttribute("title", selected ? "从组合中移除" : "加入组合");
      select.textContent = selected ? "✓" : "+";
      select.addEventListener("click", () => toggleSuggestionPatchSelection(patch.id));

      const button = document.createElement("button");
      button.className = "suggestion-patch-focus";
      button.type = "button";
      button.setAttribute("data-suggestion-patch-focus-id", patch.id);
      button.setAttribute("data-suggestion-patch-shape", terrainDetailPatchShapeSummary(patch));
      patch.center = patch.center || focusPoint;
      button.textContent = `${String(index + 1).padStart(2, "0")} · ${formatCoord(patch.center.lat, "N", "S")} ${formatCoord(patch.center.lng, "E", "W")} · ${terrainDetailPatchShapeSummary(patch)} · ${formatDeltaMeters(patch.deltaMeters)}`;
      button.addEventListener("click", () => focusOnSuggestionPatch(patch.id));
      row.append(select, button);
      list.appendChild(row);
    });
    return list;
  }

  function syncInspectorPanelVisibility() {
    const patchButtonsHidden = layerVisibility.details === false && layerVisibility.approved === false;
    const suggestionButtonsHidden = layerVisibility.suggestions === false;
    if (patchButtons) {
      patchButtons.hidden = patchButtonsHidden;
      patchButtons.setAttribute("aria-hidden", String(patchButtons.hidden));
    }
    if (traceButtons) {
      traceButtons.hidden = layerVisibility.traces === false;
      traceButtons.setAttribute("aria-hidden", String(traceButtons.hidden));
    }
    if (suggestionButtons) {
      suggestionButtons.hidden = suggestionButtonsHidden;
      suggestionButtons.setAttribute("aria-hidden", String(suggestionButtons.hidden));
    }
    if (patchConsole) {
      patchConsole.hidden = patchButtonsHidden && suggestionButtonsHidden;
      patchConsole.setAttribute("aria-hidden", String(patchConsole.hidden));
    }
    if (siteButtons) {
      siteButtons.hidden = layerVisibility.sites === false;
      siteButtons.setAttribute("aria-hidden", String(siteButtons.hidden));
    }
    if (cityButtons) {
      cityButtons.hidden = layerVisibility.cities === false;
      cityButtons.setAttribute("aria-hidden", String(cityButtons.hidden));
    }
    if (cityPanel) {
      cityPanel.hidden = layerVisibility.cities === false;
      cityPanel.setAttribute("aria-hidden", String(cityPanel.hidden));
    }
  }

  function renderLayerSummary() {
    const summary = Core.summarizeTerrainCoverage();
    if (layerLegend) {
      const preservedOpenLayerGroupIds = rememberOpenLayerGroupState();
      const layerCounts = {
        waterMinorTributaries: Number(worldGroup.userData.waterMinorTributaryCount),
      };
      layerLegend.innerHTML = Core.getGroupedRenderableMapLayers(layerCounts)
        .map((group) => {
          const groupState = Core.getMapLayerGroupState(layerVisibility, group.id, layerCounts);
          const buttons = group.layers
            .map((layer) => {
              const active = layerVisibility[layer.id] !== false;
              return `<button class="legend-item legend-${legendKind(layer.id)}${active ? " is-active" : ""}" type="button" data-layer-id="${layer.id}" aria-pressed="${String(active)}">${layer.label}</button>`;
            })
            .join("");
          return `<section class="layer-group" data-layer-group="${group.id}"><div class="layer-group-header"><button class="layer-group-toggle${groupState.active ? " is-active" : ""}${groupState.mixed ? " is-mixed" : ""}" type="button" data-layer-group-toggle="${group.id}" aria-pressed="${String(groupState.active)}"><span class="layer-group-title">${group.label}</span><span class="layer-group-count">${groupState.visibleCount}/${groupState.totalCount}</span></button><details class="layer-group-details" data-layer-group-details="${group.id}"><summary>细项</summary><div class="layer-group-items">${buttons}</div></details></div></section>`;
        })
        .join("");
      layerLegend.querySelectorAll("[data-layer-group-details]").forEach((details) => {
        details.open = preservedOpenLayerGroupIds.has(details.dataset.layerGroupDetails);
        details.addEventListener("toggle", () => {
          if (details.open) {
            openLayerGroupIds.add(details.dataset.layerGroupDetails);
          } else {
            openLayerGroupIds.delete(details.dataset.layerGroupDetails);
          }
        });
      });
      layerLegend.querySelectorAll("[data-layer-group-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
          rememberOpenLayerGroupState();
          layerVisibility = Core.toggleMapLayerGroup(layerVisibility, button.dataset.layerGroupToggle, layerCounts);
          applyLayerVisibility();
          syncInspectorPanelVisibility();
          renderLayerSummary();
        });
      });
      layerLegend.querySelectorAll("[data-layer-id]").forEach((button) => {
        button.addEventListener("click", () => {
          rememberOpenLayerGroupState();
          layerVisibility = Core.toggleMapLayer(layerVisibility, button.dataset.layerId);
          applyLayerVisibility();
          syncInspectorPanelVisibility();
          renderLayerSummary();
        });
      });
    }
    if (layerSummary) {
      layerSummary.textContent = `已接入 ${terrainSourceLabel()}，勾勒 ${summary.blocks} 个地貌单元、${summary.waterSystems} 条主水系、${summary.boundaryGuides} 条省界引导线；待补：${summary.nextGaps[0]}。`;
    }
    if (layerSummary) {
      const waterSummary = waterSystemSummary();
      const waterReferences = waterReferenceSummary();
      layerSummary.textContent = `已接入 ${terrainSourceLabel()}，勾勒 ${summary.blocks} 个地貌单元、水系曲线（${waterLayerSummaryText(waterSummary, waterReferences)}）；省界引导 ${summary.boundaryGuides} 条。`;
    }
  }

  function getOpenLayerGroupIds() {
    if (!layerLegend) return new Set();
    return new Set(
      Array.from(layerLegend.querySelectorAll("[data-layer-group-details]"))
        .filter((details) => details.open)
        .map((details) => details.dataset.layerGroupDetails)
    );
  }

  function rememberOpenLayerGroupState() {
    const currentOpenLayerGroupIds = getOpenLayerGroupIds();
    if (currentOpenLayerGroupIds.size) {
      openLayerGroupIds = currentOpenLayerGroupIds;
    }
    return new Set(openLayerGroupIds);
  }

  syncInspectorPanelVisibility();

  function buildLatitude(lat) {
    const points = [];
    for (let lng = 73; lng <= 135; lng += 2) {
      points.push(Core.latLngToVector3({ lat, lng, radius: Core.DEFAULT_RADIUS + 0.025 }));
    }
    return points;
  }

  function buildLongitude(lng) {
    const points = [];
    for (let lat = 18; lat <= 54; lat += 2) {
      points.push(Core.latLngToVector3({ lat, lng, radius: Core.DEFAULT_RADIUS + 0.025 }));
    }
    return points;
  }

  function createLine(points, color, opacity) {
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points.map(toVector3)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: true })
    );
  }

  function createPathLine(path, color, opacity, lift) {
    const points = path.map((point) => Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, lift),
    }));
    return createLine(points, color, opacity);
  }

  function createRiverCurveLine(path, color, opacity, lift) {
    const points = path.map((point) => toVector3(Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, lift),
    })));
    if (points.length < 4) {
      return createLine(points, color, opacity);
    }
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
    const curvePoints = curve.getPoints(Math.min(180, Math.max(24, points.length * 3)));
    return createLine(curvePoints, color, opacity);
  }

  function createRiverCurveVisual(path, color, opacity, lift, radius, glowRadius) {
    const group = new THREE.Group();
    const glow = createRiverCurveMesh(path, color, Math.min(0.34, opacity * 0.52), lift, glowRadius);
    const core = createRiverCurveMesh(path, color, opacity, lift + 0.004, radius);
    glow.material.blending = THREE.AdditiveBlending;
    glow.userData.role = "water-system-glow";
    glow.userData.baseOpacity = Math.min(0.34, opacity * 0.52);
    core.userData.role = "water-system-core";
    core.userData.baseOpacity = opacity;
    group.add(glow, core);
    return group;
  }

  function createWaterFlowMarker(path, color, phase, river = null) {
    const points = path.map((point) => toVector3(Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, WATER_MARKER_LIFT),
    })));
    if (points.length < 2) {
      return null;
    }
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
    const marker = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(WATER_FLOW_DOT_RADIUS, 12, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        depthTest: true,
      })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(WATER_FLOW_HALO_RADIUS, 12, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      })
    );
    marker.add(halo, dot);
    marker.position.copy(curve.getPointAt(phase % 1));
    const flowSpeed = estimateRiverFlowSpeed(river, path);
    marker.userData.flowSpeed = flowSpeed.speed;
    marker.userData.hydrologySource = flowSpeed.hydrologySource;
    waterFlowMarkers.push({
      marker,
      curve,
      phase: phase % 1,
      speed: flowSpeed.speed,
      hydrologySource: flowSpeed.hydrologySource,
    });
    return marker;
  }

  function estimateRiverFlowSpeed(river, path = []) {
    const discharge = firstFinite([
      river && river.dischargeCms,
      river && river.discharge,
      river && river.qout,
      river && river.dischargeMean,
    ], NaN);
    if (Number.isFinite(discharge) && discharge > 0) {
      return {
        speed: Core.clamp(0.014 + Math.log10(discharge + 1) * 0.004, 0.014, 0.04),
        hydrologySource: "hydrosheds-discharge",
      };
    }

    const streamOrder = firstFinite([
      river && river.streamOrder,
      river && river.order,
      river && river.hydroOrder,
      river && river.ordFlow,
    ], NaN);
    if (Number.isFinite(streamOrder) && streamOrder > 0) {
      return {
        speed: Core.clamp(0.012 + streamOrder * 0.0026, 0.012, 0.038),
        hydrologySource: "hydrosheds-stream-order",
      };
    }

    const scaleRank = Number(river && river.scaleRank);
    const pathPointCount = Array.isArray(path) ? path.length : 0;
    const rankBoost = river && river.rank === "main" ? 0.006 : 0.002;
    const scaleBoost = Number.isFinite(scaleRank) ? Math.max(0, 8 - scaleRank) * 0.0014 : 0;
    const lengthBoost = Math.min(0.008, pathPointCount * 0.00018);
    return {
      speed: Core.clamp(0.012 + rankBoost + scaleBoost + lengthBoost, 0.01, 0.032),
      hydrologySource: "natural-earth-scale-rank-estimate",
    };
  }

  function createWaterFlowDirectionArrow(path, color, progress) {
    const points = path.map((point) => toVector3(Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, WATER_MARKER_LIFT + 0.006),
    })));
    if (points.length < 2) {
      return null;
    }
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
    const clampedProgress = Core.clamp(Number(progress) || 0.62, 0.08, 0.92);
    const position = curve.getPointAt(clampedProgress);
    const before = curve.getPointAt(Math.max(0, clampedProgress - 0.018));
    const after = curve.getPointAt(Math.min(1, clampedProgress + 0.018));
    const tangent = after.clone().sub(before).normalize();
    if (tangent.lengthSq() <= 0) {
      return null;
    }
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(WATER_FLOW_ARROW_RADIUS, WATER_FLOW_ARROW_LENGTH, 4),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      })
    );
    arrow.position.copy(position);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    arrow.userData.baseScale = 1;
    waterFlowDirectionArrows.push({ arrow, phase: clampedProgress });
    return arrow;
  }

  function createLakeRippleMarker(path, color, phase) {
    if (!Array.isArray(path) || path.length < 4) {
      return null;
    }
    const validPoints = path
      .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    if (validPoints.length < 4) {
      return null;
    }

    const center = validPoints.reduce((total, point) => ({
      lat: total.lat + point.lat / validPoints.length,
      lng: total.lng + point.lng / validPoints.length,
    }), { lat: 0, lng: 0 });
    const minLat = Math.min(...validPoints.map((point) => point.lat));
    const maxLat = Math.max(...validPoints.map((point) => point.lat));
    const minLng = Math.min(...validPoints.map((point) => point.lng));
    const maxLng = Math.max(...validPoints.map((point) => point.lng));
    const radiusDegrees = Core.clamp(Math.max(maxLat - minLat, maxLng - minLng) * 0.22, 0.08, 0.42);
    const centerPosition = toVector3(Core.latLngToVector3({
      lat: center.lat,
      lng: center.lng,
      radius: terrainRadius(center.lat, center.lng, WATER_LAKE_RIPPLE_LIFT),
    }));
    const east = toVector3(Core.latLngToVector3({
      lat: center.lat,
      lng: center.lng + 0.1,
      radius: terrainRadius(center.lat, center.lng + 0.1, WATER_LAKE_RIPPLE_LIFT),
    })).sub(centerPosition).normalize();
    const north = toVector3(Core.latLngToVector3({
      lat: center.lat + 0.1,
      lng: center.lng,
      radius: terrainRadius(center.lat + 0.1, center.lng, WATER_LAKE_RIPPLE_LIFT),
    })).sub(centerPosition).normalize();
    const radiusWorld = Core.clamp(radiusDegrees * 0.04, 0.018, 0.09);
    const weatherVector = nearestWeatherVector(center);
    const driftVector = createLakeWeatherDriftVector(center, centerPosition, radiusWorld, weatherVector.heading);
    const marker = new THREE.Group();
    marker.position.copy(centerPosition);
    marker.userData.phase = phase % 1;
    marker.userData.baseScale = 1;
    marker.userData.windHeading = weatherVector.heading;
    marker.userData.windSpeed = weatherVector.windSpeed;
    marker.userData.weatherPointId = weatherVector.weatherPointId;
    for (let ringIndex = 0; ringIndex < 2; ringIndex += 1) {
      const ringPoints = [];
      const ringRadius = radiusWorld * (1 + ringIndex * 0.55);
      for (let index = 0; index <= 48; index += 1) {
        const angle = (index / 48) * Math.PI * 2;
        ringPoints.push(east.clone().multiplyScalar(Math.cos(angle) * ringRadius).add(
          north.clone().multiplyScalar(Math.sin(angle) * ringRadius)
        ));
      }
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPoints),
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: ringIndex === 0 ? 0.24 : 0.14,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.userData.baseOpacity = ring.material.opacity;
      marker.add(ring);
    }
    lakeRippleMarkers.push({
      marker,
      center,
      centerPosition,
      radiusWorld,
      driftVector,
      windHeading: weatherVector.heading,
      windSpeed: weatherVector.windSpeed,
      weatherPointId: weatherVector.weatherPointId,
      windDriven: weatherVector.source === "weather",
      phase: phase % 1,
      speed: 0.16,
    });
    return marker;
  }

  function refreshLakeWeatherDrivenMotion() {
    lakeRippleMarkers.forEach((entry) => {
      if (!entry.center || !entry.centerPosition || !entry.radiusWorld) {
        return;
      }
      const weatherVector = nearestWeatherVector(entry.center);
      entry.driftVector = createLakeWeatherDriftVector(
        entry.center,
        entry.centerPosition,
        entry.radiusWorld,
        weatherVector.heading
      );
      entry.windHeading = weatherVector.heading;
      entry.windSpeed = weatherVector.windSpeed;
      entry.weatherPointId = weatherVector.weatherPointId;
      entry.windDriven = weatherVector.source === "weather";
      entry.marker.userData.windHeading = weatherVector.heading;
      entry.marker.userData.windSpeed = weatherVector.windSpeed;
      entry.marker.userData.weatherPointId = weatherVector.weatherPointId;
    });
    syncLakeMotionDebugState();
  }

  function createLakeWeatherDriftVector(center, centerPosition, radiusWorld, windHeading) {
    const driftPoint = movePointByHeading(center, windHeading, 0.12);
    return toVector3(Core.latLngToVector3({
      lat: driftPoint.lat,
      lng: driftPoint.lng,
      radius: terrainRadius(driftPoint.lat, driftPoint.lng, WATER_LAKE_RIPPLE_LIFT),
    })).sub(centerPosition).normalize().multiplyScalar(radiusWorld * 0.22);
  }

  function nearestWeatherVector(point) {
    const weatherPoints = weatherCloudFlow && Array.isArray(weatherCloudFlow.points)
      ? weatherCloudFlow.points
      : [];
    if (!weatherPoints.length) {
      return { heading: 90, windSpeed: 0, weatherPointId: "", source: "fallback" };
    }
    const nearest = weatherPoints.reduce((best, weatherPoint) => {
      const distance = Math.hypot(
        Number(weatherPoint.lat) - Number(point.lat),
        Number(weatherPoint.lng) - Number(point.lng)
      );
      return !best || distance < best.distance ? { weatherPoint, distance } : best;
    }, null);
    const heading = nearest && Number(nearest.weatherPoint.heading);
    const windSpeed = nearest && Number(nearest.weatherPoint.windSpeed);
    return {
      heading: Number.isFinite(heading) ? heading : 90,
      windSpeed: Number.isFinite(windSpeed) ? windSpeed : 0,
      weatherPointId: nearest && nearest.weatherPoint.id ? String(nearest.weatherPoint.id) : "",
      source: nearest ? "weather" : "fallback",
    };
  }

  function createRiverCurveMesh(path, color, opacity, lift, radius) {
    const points = path.map((point) => toVector3(Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, lift),
    })));
    if (points.length < 2) {
      return createLine(points, color, opacity);
    }
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
    const geometry = new THREE.TubeGeometry(
      curve,
      Math.min(180, Math.max(36, points.length * 8)),
      radius,
      6,
      false
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
    });
    return new THREE.Mesh(geometry, material);
  }

  function terrainRadius(lat, lng, lift) {
    return Core.DEFAULT_RADIUS + lift + terrainElevation(lat, lng) * TERRAIN_VERTICAL_EXAGGERATION * terrainReliefScale;
  }

  function terrainElevation(lat, lng) {
    return Core.sampleChinaTerrainElevation(lat, lng, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
  }

  function activeTerrainDetailPatchLayer() {
    const basePatches = terrainDetailPatches && Array.isArray(terrainDetailPatches.patches)
      ? terrainDetailPatches.patches
      : [];
    const approvedPatches = approvedPatchTerrainPreviewEnabled && terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.filter((patch) => approvedPatchVisibility[patch.id] !== false)
      : [];
    const selectedPreviewPatches = approvedPatchTerrainPreviewEnabled && selectedSuggestionApprovedPreviewLayer && Array.isArray(selectedSuggestionApprovedPreviewLayer.patches)
      ? selectedSuggestionApprovedPreviewLayer.patches
      : [];
    const previewPatches = [...approvedPatches, ...selectedPreviewPatches];
    if (!previewPatches.length) {
      return terrainDetailPatches;
    }
    return {
      ...(terrainDetailPatches || { id: "runtime-active-terrain-detail-patches", type: "terrain-detail-patches", units: "meters" }),
      id: "runtime-active-terrain-detail-patches",
      patches: [...basePatches, ...previewPatches],
    };
  }

  function terrainDetailPatchFocusPoint(patch) {
    if (!patch) return null;
    const centerLat = Number(patch.center && patch.center.lat);
    const centerLng = Number(patch.center && patch.center.lng);
    if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      return { lat: centerLat, lng: centerLng };
    }
    const pathCenter = Core.getTerrainTraceCenter({ points: patch.points || patch.path });
    if (pathCenter) {
      return pathCenter;
    }
    const ring = Core.buildTerrainDetailPatchRing(patch, 16);
    if (!Array.isArray(ring) || ring.length < 2) {
      return null;
    }
    const points = ring.slice(0, -1);
    const total = points.reduce((sum, point) => ({
      lat: sum.lat + Number(point.lat),
      lng: sum.lng + Number(point.lng),
    }), { lat: 0, lng: 0 });
    return {
      lat: total.lat / points.length,
      lng: total.lng / points.length,
    };
  }

  function terrainDetailPatchShapeLabel(patch) {
    if (patch && patch.kind === "polygon-mask") {
      const ring = Core.buildTerrainDetailPatchRing(patch, 16);
      const pointCount = Math.max(0, ring.length - 1);
      return `polygon-mask ${pointCount} points`;
    }
    if (patch && patch.kind === "line-band") {
      return `line-band width ${Number(patch.widthDegrees || 0).toFixed(2)}°`;
    }
    return `radius ${Number(patch && patch.radiusDegrees || 0).toFixed(2)}°`;
  }

  function terrainDetailPatchShapeSummary(patch) {
    if (patch && patch.kind === "polygon-mask") {
      const pointCount = Array.isArray(patch.points)
        ? patch.points.length
        : Math.max(0, Core.buildTerrainDetailPatchRing(patch, 16).length - 1);
      return `区域面 · ${pointCount} 点`;
    }
    if (patch && patch.kind === "line-band") {
      return `线带 · 宽 ${Number(patch.widthDegrees || 0).toFixed(2)}°`;
    }
    return `点状 · 半径 ${Number(patch && patch.radiusDegrees || 0).toFixed(2)}°`;
  }

  function terrainSourceLabel() {
    const terrainSource = worldGroup.userData.terrainSource;
    let base = "程序估算高程";
    if (terrainElevationGrid && terrainSource === "china-srtm90m-full") {
      base = "SRTM90m DEM full grid";
    } else if (terrainElevationGrid && terrainSource === "china-srtm90m-medium") {
      base = "SRTM90m DEM 中密度网格";
    } else if (terrainElevationGrid) {
      base = "SRTM90m DEM 低精度样本网格";
    }
    const patchCount = terrainDetailPatches && Array.isArray(terrainDetailPatches.patches)
      ? terrainDetailPatches.patches.length
      : 0;
    const traceCount = terrainTraceGuides && Array.isArray(terrainTraceGuides.traces)
      ? terrainTraceGuides.traces.length
      : 0;
    const suggestionCount = terrainPatchSuggestions && Array.isArray(terrainPatchSuggestions.patches)
      ? terrainPatchSuggestions.patches.length
      : 0;
    const approvedCount = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.length
      : 0;
    const contourCount = terrainContourGroup.userData.segmentCount || 0;
    const withPatches = patchCount ? `${base} + ${patchCount} 个局部细节补丁` : base;
    const withTraces = traceCount ? `${withPatches} + ${traceCount} 条临摹线` : withPatches;
    const withSuggestions = suggestionCount ? `${withTraces} + ${suggestionCount} 个候选补丁（未应用）` : withTraces;
    const withApproved = approvedCount ? `${withSuggestions} + ${approvedCount} 个已审补丁预览（未应用）` : withSuggestions;
    return contourCount ? `${withApproved} + ${contourCount} 段等高线` : withApproved;
  }

  function legendKind(layerId) {
    return ({
      terrain: "terrain",
      blocks: "terrain",
      water: "water",
      waterTributaries: "water",
      waterMinorTributaries: "water",
      waterRefs: "water",
      coastRefs: "water",
      borders: "province",
      provinceBorders: "province",
      cityBoundaries: "province",
      contours: "contour",
      details: "detail",
      traces: "trace",
      suggestions: "suggestion",
      approved: "approved",
      sites: "site",
      cities: "city",
    })[layerId] || "terrain";
  }

  function traceKindLabel(kind) {
    return ({
      ridge: "山脊",
      "basin-edge": "边缘",
      valley: "谷地",
    })[kind] || "线";
  }

  function applyTerrainDetailTileLayerVisibility() {
    const roleLayers = {
      "terrain-detail-tile-contour": "contours",
      "terrain-detail-tile-province-boundary": "provinceBorders",
      "terrain-detail-tile-prefecture-boundary": "cityBoundaries",
      "terrain-detail-tile-water-reference": "waterRefs",
      "terrain-detail-tile-trace-guide": "traces",
    };
    const roleDetailLevels = {
      "terrain-detail-tile-contour": "near",
      "terrain-detail-tile-province-boundary": "far",
      "terrain-detail-tile-prefecture-boundary": "near",
      "terrain-detail-tile-water-reference": "mid",
      "terrain-detail-tile-trace-guide": "near",
    };
    const detailLevel = effectiveTerrainDetailLodLevel(camera.position.z);
    const contourDistanceOpacity = terrainDetailTileContourDistanceOpacity(camera.position.z, terrainDetailTileContourGroup.userData.opacity);
    const waterReferenceOpacityDebug = { opacity: 0, mode: "idle" };
    let visibleCount = 0;
    let hiddenCount = 0;
    [
      terrainDetailTileContourGroup,
      terrainDetailTileBoundaryGroup,
      terrainDetailTileWaterGroup,
      terrainDetailTileTraceGuideGroup,
    ].forEach((group) => {
      group.visible = true;
      group.traverse((object) => {
        const role = object.userData && object.userData.role;
        const layerId = roleLayers[role];
        if (layerId) {
          const requiredDetail = roleDetailLevels[role] || "far";
          object.visible = layerVisibility[layerId] !== false && detailRank(detailLevel) <= detailRank(requiredDetail);
          if (role === "terrain-detail-tile-contour" && object.material) {
            object.material.opacity = contourDistanceOpacity.opacity;
          }
          if (role === "terrain-detail-tile-water-reference" && object.material) {
            const waterDistanceOpacity = terrainDetailTileWaterReferenceDistanceOpacity(camera.position.z, object.userData.baseOpacity);
            object.material.opacity = waterDistanceOpacity.opacity;
            if (waterDistanceOpacity.opacity > waterReferenceOpacityDebug.opacity) {
              waterReferenceOpacityDebug.opacity = waterDistanceOpacity.opacity;
              waterReferenceOpacityDebug.mode = waterDistanceOpacity.mode;
            }
          }
          if (object.visible) {
            visibleCount += 1;
          } else {
            hiddenCount += 1;
          }
        }
      });
    });
    container.dataset.terrainDetailLodLevel = detailLevel;
    container.dataset.terrainDetailLodViewDistance = camera.position.z.toFixed(2);
    container.dataset.terrainDetailDensityMode = terrainDetailDensityMode;
    container.dataset.terrainDetailLodVisibleCount = String(visibleCount);
    container.dataset.terrainDetailLodHiddenCount = String(hiddenCount);
    container.dataset.terrainDetailTileContourEffectiveOpacity = contourDistanceOpacity.opacity.toFixed(2);
    container.dataset.terrainDetailTileContourDistanceOpacityMode = contourDistanceOpacity.mode;
    container.dataset.terrainDetailTileWaterEffectiveOpacity = waterReferenceOpacityDebug.opacity.toFixed(2);
    container.dataset.terrainDetailTileWaterDistanceOpacityMode = waterReferenceOpacityDebug.mode;
    syncTerrainDetailDensityStatus(detailLevel);
  }

  function syncTerrainDetailDensityButtons() {
    terrainDetailDensityButtons.forEach((button) => {
      const active = button.dataset.detailDensityMode === terrainDetailDensityMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    container.dataset.terrainDetailDensityMode = terrainDetailDensityMode;
  }

  function syncTerrainTileVisualPresetControls() {
    const settings = terrainTileVisualSettings();
    terrainTileVisualPresetButtons.forEach((button) => {
      const active = button.dataset.terrainTileVisualPreset === settings.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    container.dataset.terrainTileVisualPreset = settings.id;
    container.dataset.terrainTileVisualPresetLabel = settings.label;
    container.dataset.terrainTileVisualSlopeGainScale = String(settings.slopeGainScale);
    container.dataset.terrainTileVisualEdgeBlendDegrees = String(settings.edgeBlendDegrees);
    container.dataset.terrainTileVisualPresetRevision = String(terrainTileVisualPresetRevision);
    updateTerrainTileVisualRecommendationApplied();
  }

  function setTerrainTileVisualPreset(presetId) {
    const nextPreset = TERRAIN_DETAIL_TILE_VISUAL_PRESETS[presetId] ? presetId : "natural";
    const changed = terrainTileVisualPreset !== nextPreset;
    terrainTileVisualPreset = nextPreset;
    if (changed) {
      terrainTileVisualPresetRevision += 1;
      terrainTileSurfaceCache.clear();
      const selectedTile = selectedTerrainTileId
        ? getTerrainDetailTileItems().find((tile) => tile.id === selectedTerrainTileId)
        : null;
      if (selectedTile) {
        refreshSelectedTerrainTileSurface(selectedTile);
        syncTerrainTileInspectStatus(selectedTile);
        scheduleSelectedTerrainTilePanelRefresh(selectedTile.id);
      }
      renderTerrainTileButtons();
    }
    syncTerrainTileVisualPresetControls();
  }

  function syncTerrainDetailDensityStatus(detailLevel) {
    const modeLabels = {
      auto: "Auto",
      compact: "Clean",
      fine: "Fine",
    };
    const level = detailLevel || effectiveTerrainDetailLodLevel(camera.position.z);
    const text = `${modeLabels[terrainDetailDensityMode] || "Auto"} | ${String(level).toUpperCase()} LOD | ${camera.position.z.toFixed(2)}`;
    const guidanceText = terrainDetailLodGuidanceText(level);
    const recipeItems = terrainDetailLodRecipeItems(level);
    const recipeText = recipeItems.map((item) => item.label).join(" / ");
    const recipeIds = recipeItems.map((item) => item.id).join(",");
    const recipeActiveItems = recipeItems.filter((item) => terrainDetailLodRecipeItemActive(item));
    const recipeMissingItems = recipeItems.filter((item) => !terrainDetailLodRecipeItemActive(item));
    const recipeActiveIds = recipeActiveItems.map((item) => item.id).join(",");
    const recipeMissingIds = recipeMissingItems.map((item) => item.id).join(",");
    const recipeStatusText = `Apply ${String(level).toUpperCase()} recipe ${recipeActiveItems.length}/${recipeItems.length}`;
    const summaryText = `${String(level).toUpperCase()} LOD | active ${recipeActiveItems.length}/${recipeItems.length} | missing ${recipeMissingItems.length}`;
    const summaryItems = [
      { label: `${String(level).toUpperCase()} LOD`, state: "level" },
      { label: `Active ${recipeActiveItems.length}/${recipeItems.length}`, state: recipeMissingItems.length ? "partial" : "ready" },
      { label: recipeMissingItems.length ? `Missing ${recipeMissingItems.length}` : "Ready", state: recipeMissingItems.length ? "missing" : "ready" },
    ];
    if (terrainDetailDensityStatus) {
      terrainDetailDensityStatus.textContent = text;
      terrainDetailDensityStatus.dataset.mode = terrainDetailDensityMode;
      terrainDetailDensityStatus.dataset.lod = level;
    }
    if (terrainDetailLodGuidance) {
      terrainDetailLodGuidance.textContent = guidanceText;
      terrainDetailLodGuidance.dataset.lod = level;
    }
    if (terrainDetailLodSummary) {
      terrainDetailLodSummary.replaceChildren(...summaryItems.map((item) => {
        const chip = document.createElement("span");
        chip.className = "lod-summary-chip";
        chip.dataset.state = item.state;
        chip.textContent = item.label;
        return chip;
      }));
      terrainDetailLodSummary.dataset.lod = level;
    }
    if (terrainDetailLodRecipe) {
      terrainDetailLodRecipe.replaceChildren(...recipeItems.map((item) => {
        const active = terrainDetailLodRecipeItemActive(item);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "lod-recipe-chip";
        chip.classList.toggle("is-muted", !active);
        chip.dataset.layerId = item.id;
        chip.dataset.lodRecipeLayerId = item.id;
        chip.dataset.active = String(active);
        chip.setAttribute("aria-pressed", String(active));
        chip.textContent = item.label;
        bindTerrainDetailLodRecipeChip(chip, item);
        return chip;
      }));
      terrainDetailLodRecipe.dataset.lod = level;
    }
    if (terrainDetailApplyRecipeBtn) {
      terrainDetailApplyRecipeBtn.textContent = recipeStatusText;
    }
    container.dataset.terrainDetailDensityStatusText = text;
    container.dataset.terrainDetailLodGuidanceText = guidanceText;
    container.dataset.terrainDetailLodRecipeText = recipeText;
    container.dataset.terrainDetailLodRecipeIds = recipeIds;
    container.dataset.terrainDetailLodRecipeActiveIds = recipeActiveIds;
    container.dataset.terrainDetailLodRecipeActiveCount = String(recipeActiveItems.length);
    container.dataset.terrainDetailLodRecipeTotalCount = String(recipeItems.length);
    container.dataset.terrainDetailLodRecipeMissingIds = recipeMissingIds;
    container.dataset.terrainDetailLodRecipeStatusText = recipeStatusText;
    container.dataset.terrainDetailLodSummaryText = summaryText;
    container.dataset.terrainDetailLodSummaryActiveCount = String(recipeActiveItems.length);
    container.dataset.terrainDetailLodSummaryMissingCount = String(recipeMissingItems.length);
    syncTerrainWorkflowSummary();
  }

  function terrainWorkflowSummaryItems() {
    const level = container.dataset.terrainDetailLodLevel || effectiveTerrainDetailLodLevel(camera.position.z);
    const observationMode = terrainObservationModeForDistance(camera.position.z);
    const activeCount = Number(container.dataset.terrainDetailLodRecipeActiveCount || 0);
    const totalCount = Number(container.dataset.terrainDetailLodRecipeTotalCount || terrainDetailLodRecipeItems(level).length);
    const missingCount = Math.max(0, totalCount - activeCount);
    const selectedTile = selectedTerrainTileId
      ? getTerrainDetailTileItems().find((tile) => tile.id === selectedTerrainTileId)
      : null;
    const tileStatus = container.dataset.terrainTileReferenceLayerStatus || "idle";
    const manualPointCount = Number(container.dataset.manualTracePointCount || 0);
    const traceReadiness = container.dataset.terrainTileTraceAidReadiness || "idle";
    const traceLabel = manualPointCount >= 2
      ? `Trace draft ${manualPointCount} pts`
      : selectedTile
        ? traceReadiness === "ready" ? "Trace ready" : "Trace waiting"
        : "Trace idle";
    return [
      { id: "view", label: `View ${String(level).toUpperCase()} ${observationMode.label}`, state: "ready" },
      { id: "layers", label: `Layers ${activeCount}/${totalCount}`, state: missingCount ? "partial" : "ready" },
      { id: "dem", label: selectedTile ? `DEM ${tileStatus}` : "DEM overview", state: selectedTile ? tileStatus === "ready" ? "ready" : "loading" : "idle" },
      { id: "trace", label: traceLabel, state: manualPointCount >= 2 || traceReadiness === "ready" ? "ready" : selectedTile ? "loading" : "idle" },
    ];
  }

  function syncTerrainObservationModeStatus() {
    const observationMode = terrainObservationModeForDistance(camera.position.z);
    if (terrainObservationModeStatus) {
      terrainObservationModeStatus.textContent = observationMode.text;
      terrainObservationModeStatus.dataset.mode = observationMode.id;
    }
    container.dataset.terrainObservationMode = observationMode.id;
    container.dataset.terrainObservationModeLabel = observationMode.label;
    container.dataset.terrainObservationModeText = observationMode.text;
    container.dataset.terrainObservationModeViewDistance = camera.position.z.toFixed(2);
  }

  function syncTerrainWorkflowSummary() {
    if (!terrainWorkflowSummary) return;
    const items = terrainWorkflowSummaryItems();
    terrainWorkflowSummary.replaceChildren(...items.map((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "terrain-workflow-chip";
      chip.dataset.workflowId = item.id;
      chip.dataset.state = item.state;
      chip.textContent = item.label;
      bindTerrainWorkflowChip(chip, item);
      return chip;
    }));
    container.dataset.terrainWorkflowSummaryText = items.map((item) => item.label).join(" | ");
    container.dataset.terrainWorkflowSummaryStates = items.map((item) => item.state).join(",");
  }

  function bindTerrainWorkflowChip(chip, item) {
    if (!chip || !item || !item.id) return;
    chip.addEventListener("click", () => handleTerrainWorkflowAction(item.id));
  }

  function handleTerrainWorkflowAction(workflowId) {
    container.dataset.terrainWorkflowLastAction = workflowId || "";
    if (workflowId === "view") {
      const panel = document.querySelector("#viewControlPanel");
      if (panel && panel.scrollIntoView) {
        panel.scrollIntoView({ block: "nearest" });
      }
      if (viewZoomRange && viewZoomRange.focus) {
        viewZoomRange.focus({ preventScroll: true });
      }
      return;
    }
    if (workflowId === "layers") {
      applyTerrainDetailLodRecipe();
      return;
    }
    if (workflowId === "dem") {
      if (terrainTilePanel) {
        terrainTilePanel.hidden = false;
        terrainTilePanel.setAttribute("aria-hidden", "false");
        if (terrainTilePanel.scrollIntoView) {
          terrainTilePanel.scrollIntoView({ block: "nearest" });
        }
      }
      return;
    }
    if (workflowId === "trace") {
      if (selectedTerrainTileId && startTerrainTileTraceBtn && !startTerrainTileTraceBtn.disabled) {
        startTraceInSelectedTerrainTile();
      } else if (focusInspectionLayersBtn) {
        focusInspectionLayers();
      }
    }
  }

  function applyTerrainDetailLodRecipe() {
    const level = effectiveTerrainDetailLodLevel(camera.position.z);
    const appliedIds = [];
    terrainDetailLodRecipeItems(level).forEach((item) => {
      if (!item || !item.id || item.id === "surface") {
        return;
      }
      layerVisibility = { ...layerVisibility, [item.id]: true };
      appliedIds.push(item.id);
    });
    container.dataset.terrainDetailLodRecipeAppliedIds = appliedIds.join(",");
    applyLayerVisibility();
    syncInspectorPanelVisibility();
    renderLayerSummary();
    syncTerrainDetailDensityStatus(level);
  }

  function applyTerrainViewPresetLayerFocus(config) {
    if (!config) return;
    const visibleIds = Array.isArray(config.visibleLayerIds) ? config.visibleLayerIds : [];
    const hiddenIds = Array.isArray(config.hiddenLayerIds) ? config.hiddenLayerIds : [];
    const nextVisibility = { ...layerVisibility };
    visibleIds.forEach((layerId) => {
      nextVisibility[layerId] = true;
    });
    hiddenIds.forEach((layerId) => {
      nextVisibility[layerId] = false;
    });
    layerVisibility = nextVisibility;
    container.dataset.terrainViewPresetLayerFocusVisibleIds = visibleIds.join(",");
    container.dataset.terrainViewPresetLayerFocusHiddenIds = hiddenIds.join(",");
  }

  function terrainDetailLodGuidanceText(detailLevel) {
    if (detailLevel === "near") {
      return "Near: DEM surface, contours, local water, city markers";
    }
    if (detailLevel === "mid") {
      return "Mid: prefecture boundaries, major cities, main rivers";
    }
    return "Far: province shape, major terrain, main water";
  }

  function terrainDetailLodRecipeItems(detailLevel) {
    if (detailLevel === "near") {
      return [
        { id: "surface", label: "DEM surface" },
        { id: "contours", label: "Contours" },
        { id: "waterRefs", label: "Local water" },
        { id: "cities", label: "City markers" },
      ];
    }
    if (detailLevel === "mid") {
      return [
        { id: "cityBoundaries", label: "Prefecture lines" },
        { id: "cities", label: "Major cities" },
        { id: "rivers", label: "Main rivers" },
      ];
    }
    return [
      { id: "provinceBorders", label: "Province shape" },
      { id: "terrain", label: "Major terrain" },
      { id: "rivers", label: "Main water" },
    ];
  }

  function terrainDetailLodRecipeItemActive(item) {
    if (!item || !item.id) {
      return false;
    }
    if (item.id === "surface") {
      return terrainDetailTileSurfaceGroup.visible !== false;
    }
    return layerVisibility[item.id] !== false;
  }

  function bindTerrainDetailLodRecipeChip(chip, item) {
    if (!chip || !item || !item.id || item.id === "surface") {
      if (chip) {
        chip.disabled = true;
        chip.setAttribute("aria-disabled", "true");
      }
      return;
    }
    chip.addEventListener("click", () => {
      layerVisibility = Core.toggleMapLayer(layerVisibility, item.id);
      applyLayerVisibility();
      syncInspectorPanelVisibility();
      renderLayerSummary();
      syncTerrainDetailDensityStatus();
    });
  }

  function refreshTerrainDetailLodForViewDistance() {
    const detailLevel = effectiveTerrainDetailLodLevel(camera.position.z);
    syncTerrainDetailDensityStatus(detailLevel);
    syncTerrainObservationModeStatus();
    if (container.dataset.terrainDetailLodLevel !== detailLevel) {
      applyLayerVisibility();
    }
  }

  function setTerrainDetailDensityMode(mode) {
    if (!["auto", "compact", "fine"].includes(mode)) {
      return;
    }
    terrainDetailDensityMode = mode;
    applyTerrainDetailTileLayerVisibility();
    syncTerrainDetailDensityButtons();
    syncTerrainDetailTileSurfaceDebugState();
  }

  function applyLayerVisibility() {
    const waterSystemOpacityDebug = { coreOpacity: 0, glowOpacity: 0, mode: "idle" };
    const boundaryOpacityDebug = { provinceOpacity: 0, prefectureOpacity: 0, mode: "idle" };
    const roleLayers = {
      "china-terrain": "terrain",
      "terrain-wire": "terrain",
      "terrain-block": "blocks",
      "terrain-block-outline": "blocks",
      "terrain-block-label": "blocks",
      "water-system": "water",
      "water-flow-marker": "water",
      "water-flow-direction-arrow": "water",
      "country-boundary": "borders",
      "province-boundary-guide": "provinceBorders",
      "province-boundary-real": "provinceBorders",
      "prefecture-boundary-real": "cityBoundaries",
      "terrain-contour": "contours",
      "terrain-detail-tile-province-boundary": "provinceBorders",
      "terrain-detail-tile-prefecture-boundary": "cityBoundaries",
      "terrain-detail-tile-water-reference": "waterRefs",
      "terrain-detail-tile-trace-guide": "traces",
      "terrain-detail-patch-ring": "details",
      "terrain-detail-patch-center": "details",
      "terrain-trace-guide": "traces",
      "terrain-manual-trace-line": "traces",
      "terrain-manual-trace-point": "traces",
      "terrain-trace-profile-marker-high": "traces",
      "terrain-trace-profile-marker-low": "traces",
      "terrain-suggestion-patch-ring": "suggestions",
      "terrain-suggestion-patch-center": "suggestions",
      "terrain-approved-patch-ring": "approved",
      "terrain-approved-patch-center": "approved",
      "terrain-water-lake-reference": "waterRefs",
      "terrain-water-coast-reference": "coastRefs",
      "terrain-site": "sites",
      "terrain-site-stem": "sites",
      "terrain-city": "cities",
      "terrain-city-stem": "cities",
      "terrain-city-label": "cities",
      "terrain-weather-cloud": "weather",
      "terrain-weather-vector": "weather",
    };
    worldGroup.traverse((object) => {
      if (object.userData && (object.userData.role === "water-system-core" || object.userData.role === "water-system-glow") && object.material) {
        const waterRibbonOpacity = waterSystemDistanceOpacity(camera.position.z, object.userData.baseOpacity, object.userData.role);
        object.material.opacity = waterRibbonOpacity.opacity;
        if (object.userData.role === "water-system-core") {
          waterSystemOpacityDebug.coreOpacity = Math.max(waterSystemOpacityDebug.coreOpacity, waterRibbonOpacity.opacity);
        } else {
          waterSystemOpacityDebug.glowOpacity = Math.max(waterSystemOpacityDebug.glowOpacity, waterRibbonOpacity.opacity);
        }
        if (waterRibbonOpacity.mode !== "idle") {
          waterSystemOpacityDebug.mode = waterRibbonOpacity.mode;
        }
      }
      if (object.userData && (object.userData.role === "province-boundary-real" || object.userData.role === "prefecture-boundary-real") && object.material) {
        const adminBoundaryOpacity = boundaryDistanceOpacity(camera.position.z, object.userData.baseOpacity, object.userData.boundaryLevel);
        object.material.opacity = adminBoundaryOpacity.opacity;
        if (object.userData.boundaryLevel === "province") {
          boundaryOpacityDebug.provinceOpacity = Math.max(boundaryOpacityDebug.provinceOpacity, adminBoundaryOpacity.opacity);
        } else {
          boundaryOpacityDebug.prefectureOpacity = Math.max(boundaryOpacityDebug.prefectureOpacity, adminBoundaryOpacity.opacity);
        }
        if (adminBoundaryOpacity.mode !== "idle") {
          boundaryOpacityDebug.mode = adminBoundaryOpacity.mode;
        }
      }
      const layerId = object.userData && object.userData.role === "water-system"
        ? Core.getWaterSystemLayerId(object.userData.river || { rank: object.userData.riverRank })
        : roleLayers[object.userData && object.userData.role];
      if (layerId) {
        const patchId = object.userData && object.userData.patchId;
        const traceId = object.userData && object.userData.traceId;
        const suggestionGroupId = object.userData && object.userData.suggestionGroupId;
        const approvedPatchId = object.userData && object.userData.approvedPatchId;
        const patchAllowed = !patchId || patchVisibility[patchId] !== false;
        const traceAllowed = !traceId || traceVisibility[traceId] !== false;
        const suggestionAllowed = !suggestionGroupId || suggestionVisibility[suggestionGroupId] !== false;
        const approvedAllowed = !approvedPatchId || approvedPatchVisibility[approvedPatchId] !== false;
        object.visible = layerVisibility[layerId] !== false && patchAllowed && traceAllowed && suggestionAllowed && approvedAllowed;
      }
    });
    container.dataset.waterSystemCoreEffectiveOpacity = waterSystemOpacityDebug.coreOpacity.toFixed(2);
    container.dataset.waterSystemGlowEffectiveOpacity = waterSystemOpacityDebug.glowOpacity.toFixed(2);
    container.dataset.waterSystemDistanceOpacityMode = waterSystemOpacityDebug.mode;
    container.dataset.provinceBoundaryEffectiveOpacity = boundaryOpacityDebug.provinceOpacity.toFixed(2);
    container.dataset.prefectureBoundaryEffectiveOpacity = boundaryOpacityDebug.prefectureOpacity.toFixed(2);
    container.dataset.boundaryDistanceOpacityMode = boundaryOpacityDebug.mode;
    syncTerrainObservationModeStatus();
    applyTerrainDetailTileLayerVisibility();
    updateTerrainBlockLabels(false);
    updateTraceProfileMarkerDebug();
    scheduleCityLabelUpdate();
  }

  function bindEvents() {
    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    autoRotateBtn.addEventListener("click", () => {
      state = { ...state, autoRotate: !state.autoRotate };
      autoRotateBtn.classList.toggle("is-active", state.autoRotate);
      autoRotateBtn.setAttribute("aria-pressed", String(state.autoRotate));
    });
    resetViewBtn.addEventListener("click", () => focusOnChina());
    focusChinaBtn.addEventListener("click", () => focusOnChina());
    manualTraceBtn.addEventListener("click", () => toggleManualTraceMode());
    if (startTerrainTileTraceBtn) {
      startTerrainTileTraceBtn.addEventListener("click", () => startTraceInSelectedTerrainTile());
    }
    if (seedRidgeTraceBtn) {
      seedRidgeTraceBtn.addEventListener("click", () => seedManualTraceFromTerrainTileGuide("ridge"));
    }
    if (seedValleyTraceBtn) {
      seedValleyTraceBtn.addEventListener("click", () => seedManualTraceFromTerrainTileGuide("valley"));
    }
    if (generateRecommendedTileSuggestionsBtn) {
      generateRecommendedTileSuggestionsBtn.addEventListener("click", () => generateRecommendedTerrainTileSuggestions());
    }
    generateManualTraceBtn.addEventListener("click", () => generateManualTraceSuggestions());
    undoManualTraceBtn.addEventListener("click", () => {
      manualTraceDraft = Core.undoManualTerrainTracePoint(manualTraceDraft);
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      renderManualTraceDraft();
      if (selectedManualTraceId === manualTraceDraft.id && Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      } else if (selectedManualTraceId === manualTraceDraft.id) {
        selectedManualTraceId = null;
        updateSelectedPanel();
      }
    });
    reverseManualTraceBtn.addEventListener("click", () => {
      manualTraceDraft = Core.reverseManualTerrainTraceDraft(manualTraceDraft);
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      renderManualTraceDraft();
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      }
    });
    closeManualTraceBtn.addEventListener("click", () => {
      manualTraceDraft = Core.closeManualTerrainTraceDraft(manualTraceDraft);
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      renderManualTraceDraft();
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      }
      hoverLabel.textContent = "临摹草稿：已闭合为区域";
    });
    simplifyManualTraceBtn.addEventListener("click", () => {
      const beforeCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
      manualTraceDraft = Core.simplifyManualTerrainTraceDraft(manualTraceDraft, { stride: 2 });
      const afterCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
      manualTraceDraft = {
        ...manualTraceDraft,
        simplifiedPointCount: Math.max(0, beforeCount - afterCount),
      };
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      renderManualTraceDraft();
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      }
    });
    smoothManualTraceBtn.addEventListener("click", () => {
      manualTraceDraft = Core.smoothManualTerrainTraceDraft(manualTraceDraft);
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      renderManualTraceDraft();
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      }
    });
    clearManualTraceBtn.addEventListener("click", () => {
      manualTraceDraft = {
        ...Core.clearManualTerrainTraceDraft(manualTraceDraft),
        simplifiedPointCount: 0,
        smoothedPointCount: 0,
      };
      selectedManualTraceId = null;
      clearSelectedManualTracePoint();
      selectedTerrainTileId = manualTraceDraft.sourceTileId || selectedTerrainTileId;
      saveManualTraceDraft();
      clearManualTraceSuggestions();
      suggestionVisibility = Core.createTerrainPatchSuggestionGroupVisibilityState(terrainPatchSuggestions, suggestionVisibility);
      createTerrainPatchSuggestions();
      renderSuggestionButtons();
      renderLayerSummary();
      renderManualTraceDraft();
      updateSelectedPanel();
    });
    if (deleteManualTracePointBtn) {
      deleteManualTracePointBtn.addEventListener("click", () => deleteSelectedManualTracePoint());
    }
    zoomInBtn.addEventListener("click", () => setZoom(state.zoom - 0.45));
    zoomOutBtn.addEventListener("click", () => setZoom(state.zoom + 0.45));
    if (viewZoomRange) {
      viewZoomRange.addEventListener("input", () => setZoom(viewZoomRange.value));
    }
    if (terrainReliefRange) {
      terrainReliefRange.addEventListener("input", () => setTerrainReliefScale(terrainReliefRange.value));
    }
    terrainDetailDensityButtons.forEach((button) => {
      button.addEventListener("click", () => setTerrainDetailDensityMode(button.dataset.detailDensityMode));
    });
    terrainTileVisualPresetButtons.forEach((button) => {
      button.addEventListener("click", () => setTerrainTileVisualPreset(button.dataset.terrainTileVisualPreset));
    });
    if (applyTerrainTileVisualRecommendationBtn) {
      applyTerrainTileVisualRecommendationBtn.addEventListener("click", () => {
        const recommendedPreset = TERRAIN_DETAIL_TILE_VISUAL_PRESETS[container.dataset.terrainTileVisualRecommendedPreset] || TERRAIN_DETAIL_TILE_VISUAL_PRESETS.natural;
        setTerrainTileVisualPreset(recommendedPreset.id);
      });
    }
    terrainViewPresetButtons.forEach((button) => {
      button.addEventListener("click", () => setTerrainViewPreset(button.dataset.viewPreset));
    });
    if (terrainDetailApplyRecipeBtn) {
      terrainDetailApplyRecipeBtn.addEventListener("click", () => applyTerrainDetailLodRecipe());
    }
    if (focusInspectionLayersBtn) {
      focusInspectionLayersBtn.addEventListener("click", () => focusInspectionLayers());
    }
    if (applyApprovedPatchesBtn) {
      applyApprovedPatchesBtn.addEventListener("click", () => toggleApprovedPatchTerrainPreview());
    }
    weatherRefreshTimer = window.setInterval(refreshWeatherCloudFlow, WEATHER_REFRESH_INTERVAL_MS);
  }

  function focusOnChina() {
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = { ...state, selectedHotspotId: null, selectedPatchId: null, selectedApprovedPatchId: null, selectedTraceId: null, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(5.6), autoRotate: false };
    rotationTarget.x = 0.42;
    rotationTarget.y = -toRadians(Core.CHINA_REGION.center.lng);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = "中国板块视图";
    updateSelectedPanel();
  }

  function focusOnSite(siteId, options = {}) {
    const site = Core.CHINA_TERRAIN_SITES.find((item) => item.id === siteId);
    if (!site) return;
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = Core.selectHotspot({ ...state, selectedPatchId: null, selectedApprovedPatchId: null, selectedTraceId: null, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(options.zoom || state.zoom), autoRotate: false }, siteId);
    rotationTarget.y = -toRadians(site.lng);
    rotationTarget.x = Core.clamp(toRadians(site.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    updateSelectedPanel();
  }

  function focusOnCity(cityId, options = {}) {
    const city = Core.CHINA_TERRAIN_CITIES.find((item) => item.id === cityId);
    if (!city) return;
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = Core.selectHotspot({ ...state, selectedPatchId: null, selectedApprovedPatchId: null, selectedTraceId: null, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(options.zoom || state.zoom), autoRotate: false }, cityId);
    rotationTarget.y = -toRadians(city.lng);
    rotationTarget.x = Core.clamp(toRadians(city.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    updateSelectedPanel();
  }

  function focusOnTerrainTile(tileId) {
    const tile = getTerrainDetailTileItems().find((item) => item.id === tileId);
    const center = terrainTileCenter(tile);
    if (!tile || !center) return;
    const reuseActiveTerrainTileSurface = selectedTerrainTileId === tile.id
      && terrainDetailTileSurfaceGroup.userData.tileId === tile.id
      && !terrainDetailTileSurfaceGroup.userData.referenceLayersPending;
    if (reuseActiveTerrainTileSurface) {
      return;
    }
    const cachedTerrainTileSurface = terrainTileSurfaceCache.has(tile.id);
    selectedManualTraceId = null;
    selectedTerrainTileId = tile.id;
    container.dataset.selectedTerrainTileId = tile.id;
    selectedSuggestionPatchIds = new Set();
    updateSelectedSuggestionBundleDebug();
    layerVisibility = {
      ...layerVisibility,
      provinceBorders: true,
      cityBoundaries: true,
    };
    if (cachedTerrainTileSurface) {
      window.requestAnimationFrame(() => renderLayerSummary());
    } else {
      renderLayerSummary();
    }
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: null,
      selectedSuggestionPatchId: null,
      zoom: Core.normalizeZoom(TERRAIN_TILE_INSPECTION_ZOOM),
      autoRotate: false,
    };
    rotationTarget.y = -toRadians(center.lng);
    rotationTarget.x = Core.clamp(toRadians(center.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = terrainTileLabel(tile);
    if (cachedTerrainTileSurface) {
      refreshSelectedTerrainTileSurface(tile);
      syncTerrainTileInspectStatus(tile);
      scheduleSelectedTerrainTilePanelRefresh(tile.id);
      return;
    }
    syncTerrainTileInspectStatus(tile);
    ensureTerrainDetailTileLoaded(tile.id)
      .then((loadedTile) => {
        if (loadedTile && selectedTerrainTileId === loadedTile.id) {
          refreshSelectedTerrainTileSurface(loadedTile);
          scheduleSelectedTerrainTilePanelRefresh(loadedTile.id);
        }
      })
      .catch((error) => {
        console.warn(error);
        container.dataset.terrainTilePanelRefreshPending = "false";
        hoverLabel.textContent = "Local DEM tile detail failed to load";
      });
  }

  function startTraceInSelectedTerrainTile() {
    const tile = getTerrainDetailTileItems().find((item) => item.id === selectedTerrainTileId);
    if (!tile || !tile.bounds) return;
    manualTraceDraft = {
      ...Core.createManualTerrainTraceDraft({
        id: `manual-terrain-trace-${tile.id}`,
        label: `${terrainTileLabel(tile)} 临摹`,
        kind: "ridge",
      }),
      sourceTileId: tile.id,
      sourceTileBounds: { ...tile.bounds },
      seedKind: "",
      simplifiedPointCount: 0,
      smoothedPointCount: 0,
    };
    selectedManualTraceId = null;
    clearSelectedManualTracePoint();
    selectedSuggestionPatchIds = new Set();
    clearManualTraceSuggestions();
    saveManualTraceDraft();
    manualTraceEditMode = true;
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: null,
      selectedSuggestionPatchId: null,
      autoRotate: false,
    };
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = `${terrainTileLabel(tile)}：点击区域内地形添加临摹点`;
    renderSuggestionButtons();
    renderManualTraceDraft();
    updateSelectedPanel();
  }

  function seedManualTraceFromTerrainTileGuide(kind) {
    const tile = getTerrainDetailTileItems().find((item) => item.id === selectedTerrainTileId);
    if (!tile || !tile.bounds) return;
    const guide = Core.buildTerrainTileTraceGuides(tile).find((item) => item.kind === kind);
    const points = guide && Array.isArray(guide.points) ? guide.points : [];
    if (points.length < 2) {
      hoverLabel.textContent = `${terrainTileLabel(tile)}：没有可用的${kind === "valley" ? "谷线" : "山脊线"}临摹参考`;
      return;
    }
    const baseDraft = {
      ...Core.createManualTerrainTraceDraft({
        id: `manual-terrain-trace-${tile.id}-${kind}`,
        label: `${terrainTileLabel(tile)} ${kind === "valley" ? "谷线" : "山脊线"}临摹`,
        kind,
      }),
      sourceTileId: tile.id,
      sourceTileBounds: { ...tile.bounds },
      seedKind: kind,
      simplifiedPointCount: 0,
      smoothedPointCount: 0,
    };
    manualTraceDraft = points.reduce(
      (draft, point) => Core.addManualTerrainTracePoint(draft, point),
      baseDraft
    );
    selectedManualTraceId = manualTraceDraft.id;
    clearSelectedManualTracePoint();
    selectedSuggestionPatchIds = new Set();
    clearManualTraceSuggestions();
    saveManualTraceDraft();
    manualTraceEditMode = true;
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: null,
      selectedSuggestionPatchId: null,
      zoom: Core.normalizeZoom(Math.min(state.zoom, TERRAIN_TILE_INSPECTION_ZOOM)),
      autoRotate: false,
    };
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = `${terrainTileLabel(tile)}：已用自动${kind === "valley" ? "谷线" : "山脊线"}生成临摹草稿，可继续编辑`;
    renderSuggestionButtons();
    renderManualTraceDraft();
    focusOnManualTraceDraft();
  }

  function generateRecommendedTerrainTileSuggestions() {
    const tile = getTerrainDetailTileItems().find((item) => item.id === selectedTerrainTileId);
    if (!tile || !tile.bounds) return;
    const guides = recommendedTerrainTileTraceGuides(tile);
    if (!guides.length) {
      container.dataset.terrainTileRecommendedSuggestionCount = "0";
      container.dataset.terrainTileRecommendedSuggestionGroupIds = "";
      hoverLabel.textContent = `${terrainTileLabel(tile)}：暂无推荐临摹线候选`;
      return;
    }
    const sourceTileStats = terrainTileElevationStats(tile);
    const generatedPatches = guides.flatMap((guide) => {
      const generated = Core.buildTerrainTracePatchSuggestions(guide, { includeLineBand: true });
      return (generated && Array.isArray(generated.patches) ? generated.patches : []).map((patch) => ({
        ...patch,
        sourceTraceLabel: guide.label || guide.id,
        sourceTileId: tile.id,
        sourceTileLabel: terrainTileLabel(tile),
        sourceTileBounds: tile.bounds ? { ...tile.bounds } : null,
        sourceTileDataset: tile.dataset || (terrainDetailTiles && terrainDetailTiles.dataset) || "",
        sourceTileReliefMeters: sourceTileStats && Number.isFinite(sourceTileStats.reliefMeters) ? sourceTileStats.reliefMeters : null,
        reviewStatus: "draft",
        recommendedTileSuggestion: true,
      }));
    });
    if (!generatedPatches.length) {
      container.dataset.terrainTileRecommendedSuggestionCount = "0";
      container.dataset.terrainTileRecommendedSuggestionGroupIds = guides.map((guide) => guide.id).join(",");
      hoverLabel.textContent = `${terrainTileLabel(tile)}：推荐线还不能生成候选`;
      return;
    }
    const guideIds = new Set(guides.map((guide) => guide.id));
    const existingPatches = terrainPatchSuggestions && Array.isArray(terrainPatchSuggestions.patches)
      ? terrainPatchSuggestions.patches
      : [];
    terrainPatchSuggestions = {
      id: "china-trace-patch-suggestions",
      type: "terrain-detail-patch-suggestions",
      units: "meters",
      patches: [
        ...existingPatches.filter((patch) => !guideIds.has(patch.sourceTraceId)),
        ...generatedPatches,
      ],
    };
    container.dataset.terrainTileRecommendedSuggestionCount = String(generatedPatches.length);
    container.dataset.terrainTileRecommendedSuggestionGroupIds = guides.map((guide) => guide.id).join(",");
    suggestionVisibility = Core.createTerrainPatchSuggestionGroupVisibilityState(terrainPatchSuggestions, suggestionVisibility);
    createTerrainPatchSuggestions();
    renderSuggestionButtons();
    renderLayerSummary();
    applyLayerVisibility();
    focusOnSuggestionGroup(guides[0].id);
    hoverLabel.textContent = `${terrainTileLabel(tile)}：已生成 ${generatedPatches.length} 个推荐候选`;
  }


  function focusOnPatch(patchId) {
    const patch = terrainDetailPatches && Array.isArray(terrainDetailPatches.patches)
      ? terrainDetailPatches.patches.find((item) => item.id === patchId)
      : null;
    const focusPoint = terrainDetailPatchFocusPoint(patch);
    if (!patch || !focusPoint) return;
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = { ...state, selectedHotspotId: null, selectedPatchId: patch.id, selectedApprovedPatchId: null, selectedTraceId: null, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(4.5), autoRotate: false };
    rotationTarget.y = -toRadians(focusPoint.lng);
    rotationTarget.x = Core.clamp(toRadians(focusPoint.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = patch.label || patch.id;
    updateSelectedPanel();
  }

  function focusOnApprovedPatch(patchId) {
    const patch = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.find((item) => item.id === patchId)
      : null;
    const focusPoint = terrainDetailPatchFocusPoint(patch);
    if (!patch || !focusPoint) return;
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = { ...state, selectedHotspotId: null, selectedPatchId: null, selectedApprovedPatchId: patch.id, selectedTraceId: null, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(4.34), autoRotate: false };
    rotationTarget.y = -toRadians(focusPoint.lng);
    rotationTarget.x = Core.clamp(toRadians(focusPoint.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = patch.label || patch.id;
    updateSelectedPanel();
  }

  function focusOnTrace(traceId) {
    const trace = terrainTraceGuides && Array.isArray(terrainTraceGuides.traces)
      ? terrainTraceGuides.traces.find((item) => item.id === traceId)
      : null;
    const center = Core.getTerrainTraceCenter(trace);
    if (!trace || !center) return;
    selectedManualTraceId = null;
    selectedTerrainTileId = null;
    refreshSelectedTerrainTileSurface(null);
    state = { ...state, selectedHotspotId: null, selectedPatchId: null, selectedApprovedPatchId: null, selectedTraceId: trace.id, selectedSuggestionGroupId: null, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(4.42), autoRotate: false };
    rotationTarget.y = -toRadians(center.lng);
    rotationTarget.x = Core.clamp(toRadians(center.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = trace.label || trace.id;
    updateSelectedPanel();
  }

  function focusOnManualTraceDraft() {
    const center = Core.getTerrainTraceCenter(manualTraceDraft);
    if (!center) return;
    const sourceTile = manualTraceDraft.sourceTileId
      ? getTerrainDetailTileItems().find((tile) => tile.id === manualTraceDraft.sourceTileId)
      : null;
    selectedManualTraceId = manualTraceDraft.id;
    selectedTerrainTileId = sourceTile ? sourceTile.id : null;
    refreshSelectedTerrainTileSurface(sourceTile);
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: null,
      selectedSuggestionPatchId: null,
      zoom: Core.normalizeZoom(Math.min(state.zoom, 4.5)),
      autoRotate: false,
    };
    rotationTarget.y = -toRadians(center.lng);
    rotationTarget.x = Core.clamp(toRadians(center.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = "临摹草稿：高程剖面";
    updateSelectedPanel();
  }

  function focusOnSuggestionGroup(groupId) {
    const group = Core.groupTerrainPatchSuggestionsByTrace(terrainPatchSuggestions)
      .find((item) => item.id === groupId);
    const center = suggestionGroupCenter(group);
    if (!group || !center) return;
    selectedManualTraceId = null;
    preserveSuggestionSourceTerrainTile(group.sourceTileId);
    state = { ...state, selectedHotspotId: null, selectedPatchId: null, selectedApprovedPatchId: null, selectedTraceId: null, selectedSuggestionGroupId: group.id, selectedSuggestionPatchId: null, zoom: Core.normalizeZoom(4.36), autoRotate: false };
    rotationTarget.y = -toRadians(center.lng);
    rotationTarget.x = Core.clamp(toRadians(center.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = `${suggestionGroupLabel(group)} 候选补丁`;
    renderSuggestionButtons();
    updateSelectedPanel();
  }

  function focusOnSuggestionPatch(patchId) {
    const patch = Core.findTerrainPatchSuggestion(terrainPatchSuggestions, patchId);
    const focusPoint = terrainDetailPatchFocusPoint(patch);
    if (!patch || !focusPoint) return;
    selectedManualTraceId = null;
    preserveSuggestionSourceTerrainTile(patch.sourceTileId);
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: patch.sourceTraceId || "unassigned",
      selectedSuggestionPatchId: patch.id,
      zoom: Core.normalizeZoom(4.12),
      autoRotate: false,
    };
    rotationTarget.y = -toRadians(focusPoint.lng);
    rotationTarget.x = Core.clamp(toRadians(focusPoint.lat) * 0.72, 0.16, 0.72);
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    hoverLabel.textContent = patch.label || patch.id;
    renderSuggestionButtons();
    updateSelectedPanel();
  }

  function getSelectedSuggestionBundle() {
    return Core.summarizeTerrainPatchSuggestionBundle(terrainPatchSuggestions, Array.from(selectedSuggestionPatchIds));
  }

  function updateSelectedSuggestionBundleDebug() {
    const bundle = getSelectedSuggestionBundle();
    container.dataset.suggestionBundlePatchCount = String(bundle.count);
    container.dataset.suggestionBundlePromoteCommand = bundle.promoteCommand;
  }

  function toggleSuggestionPatchSelection(patchId) {
    const patch = Core.findTerrainPatchSuggestion(terrainPatchSuggestions, patchId);
    if (!patch) return;
    selectedSuggestionPatchIds = new Set(selectedSuggestionPatchIds);
    if (selectedSuggestionPatchIds.has(patch.id)) {
      selectedSuggestionPatchIds.delete(patch.id);
    } else {
      selectedSuggestionPatchIds.add(patch.id);
    }
    selectedManualTraceId = null;
    preserveSuggestionSourceTerrainTile(patch.sourceTileId);
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: patch.sourceTraceId || "unassigned",
      selectedSuggestionPatchId: null,
    };
    updateSelectedSuggestionBundleDebug();
    renderSuggestionButtons();
    updateSelectedPanel();
  }

  function selectSuggestionGroupPatches(groupId) {
    const group = Core.groupTerrainPatchSuggestionsByTrace(terrainPatchSuggestions)
      .find((item) => item.id === groupId);
    if (!group) return;
    selectedSuggestionPatchIds = new Set(selectedSuggestionPatchIds);
    group.patches.forEach((patch) => selectedSuggestionPatchIds.add(patch.id));
    selectedManualTraceId = null;
    preserveSuggestionSourceTerrainTile(group.sourceTileId);
    state = {
      ...state,
      selectedHotspotId: null,
      selectedPatchId: null,
      selectedApprovedPatchId: null,
      selectedTraceId: null,
      selectedSuggestionGroupId: group.id,
      selectedSuggestionPatchId: null,
    };
    updateSelectedSuggestionBundleDebug();
    renderSuggestionButtons();
    updateSelectedPanel();
  }

  function clearSelectedSuggestionPatchBundle() {
    selectedSuggestionPatchIds = new Set();
    updateSelectedSuggestionBundleDebug();
    renderSuggestionButtons();
    updateSelectedPanel();
  }

  function selectedSuggestionApprovedPreviewPatchCount() {
    return selectedSuggestionApprovedPreviewLayer && Array.isArray(selectedSuggestionApprovedPreviewLayer.patches)
      ? selectedSuggestionApprovedPreviewLayer.patches.length
      : 0;
  }

  function approvedPatchTerrainPreviewAvailableCount() {
    const approvedCount = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.length
      : 0;
    return approvedCount + selectedSuggestionApprovedPreviewPatchCount();
  }

  function previewSelectedSuggestionPatchBundle() {
    const preview = Core.promoteTerrainPatchSuggestions(terrainPatchSuggestions, Array.from(selectedSuggestionPatchIds), {
      id: "runtime-selected-suggestion-approved-preview",
      labelPrefix: "Preview",
    });
    selectedSuggestionApprovedPreviewLayer = preview;
    if (!preview.patches.length) {
      approvedPatchTerrainPreviewEnabled = false;
      hoverLabel.textContent = "候选组合预览：请先选择候选补丁";
      syncViewControlPanel();
      renderSuggestionButtons();
      updateSelectedPanel();
      return;
    }
    approvedPatchTerrainPreviewEnabled = true;
    refreshActiveTerrainSurfaces();
    syncViewControlPanel();
    renderLayerSummary();
    renderSuggestionButtons();
    updateSelectedPanel();
    hoverLabel.textContent = `候选组合预览：${preview.patches.length} 个补丁已叠加到地形`;
  }

  function syncViewControlPanel() {
    const zoomText = state.zoom.toFixed(2);
    if (selectedZoom) {
      selectedZoom.textContent = zoomText;
    }
    if (viewZoomRange) {
      viewZoomRange.value = zoomText;
    }
    if (viewZoomValue) {
      viewZoomValue.textContent = zoomText;
    }
    if (terrainReliefRange) {
      terrainReliefRange.value = terrainReliefScale.toFixed(2);
    }
    if (terrainReliefValue) {
      terrainReliefValue.textContent = `${terrainReliefScale.toFixed(2)}x`;
    }
    refreshTerrainDetailLodForViewDistance();
    syncTerrainObservationModeStatus();
    syncTerrainDetailDensityButtons();
    syncTerrainViewPresetButtons();
    if (applyApprovedPatchesBtn) {
      applyApprovedPatchesBtn.classList.toggle("is-active", approvedPatchTerrainPreviewEnabled);
      applyApprovedPatchesBtn.setAttribute("aria-pressed", String(approvedPatchTerrainPreviewEnabled));
      applyApprovedPatchesBtn.disabled = approvedPatchTerrainPreviewAvailableCount() === 0;
    }
    container.dataset.viewZoomControlValue = zoomText;
    container.dataset.terrainReliefScale = terrainReliefScale.toFixed(2);
    container.dataset.approvedPatchTerrainPreviewEnabled = String(approvedPatchTerrainPreviewEnabled);
    container.dataset.approvedPatchTerrainPreviewPatchCount = String(approvedPatchTerrainPreviewPatchCount());
    container.dataset.selectedSuggestionApprovedPreviewCount = String(selectedSuggestionApprovedPreviewPatchCount());
  }

  function syncTerrainViewPresetButtons() {
    const presetId = terrainViewPresetForDistance(state.zoom);
    const config = terrainViewPresetConfig(presetId) || terrainViewPresetConfig("far");
    terrainViewPresetButtons.forEach((button) => {
      const active = button.dataset.viewPreset === config.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    container.dataset.terrainViewPreset = config.id;
    container.dataset.terrainViewPresetLabel = config.label;
    container.dataset.terrainViewPresetLod = effectiveTerrainDetailLodLevel(state.zoom);
    container.dataset.terrainViewPresetZoom = state.zoom.toFixed(2);
  }

  function setZoom(nextZoom) {
    state = { ...state, zoom: Core.normalizeZoom(nextZoom) };
    beginRenderInteraction();
    scheduleViewControlPanelSync();
  }

  function setTerrainViewPreset(presetId) {
    const config = terrainViewPresetConfig(presetId);
    if (!config) return;
    const nextZoom = Core.normalizeZoom(config.zoom);
    terrainDetailDensityMode = "auto";
    state = { ...state, zoom: nextZoom, autoRotate: false };
    camera.position.z = nextZoom;
    autoRotateBtn.classList.remove("is-active");
    autoRotateBtn.setAttribute("aria-pressed", "false");
    container.dataset.terrainViewPresetLastAction = config.id;
    beginRenderInteraction();
    applyTerrainViewPresetLayerFocus(config);
    applyTerrainDetailTileLayerVisibility();
    applyTerrainDetailLodRecipe();
    syncInspectorPanelVisibility();
    renderLayerSummary();
    scheduleViewControlPanelSync(true);
    updateCityLabels(true);
  }

  function scheduleViewControlPanelSync(force = false) {
    const nowMs = performance.now();
    if (force) {
      if (viewControlPanelSyncFrame) {
        window.cancelAnimationFrame(viewControlPanelSyncFrame);
        viewControlPanelSyncFrame = 0;
      }
      lastViewControlPanelSyncMs = nowMs;
      syncViewControlPanel();
      return;
    }
    if (viewControlPanelSyncFrame || nowMs - lastViewControlPanelSyncMs < INTERACTION_VIEW_CONTROL_SYNC_INTERVAL_MS) {
      return;
    }
    viewControlPanelSyncFrame = window.requestAnimationFrame(() => {
      viewControlPanelSyncFrame = 0;
      lastViewControlPanelSyncMs = performance.now();
      syncViewControlPanel();
    });
  }

  function scheduleWheelZoom(deltaY) {
    pendingWheelZoomDelta += Number(deltaY) || 0;
    beginRenderInteraction();
    if (wheelZoomFrame) {
      return;
    }
    wheelZoomFrame = window.requestAnimationFrame(() => {
      const delta = pendingWheelZoomDelta;
      pendingWheelZoomDelta = 0;
      wheelZoomFrame = 0;
      setZoom(state.zoom + delta * ZOOM_INPUT_SCALE);
    });
  }

  function beginRenderInteraction() {
    interactionPixelRatioActive = true;
    setInteractionDetailReduction(true);
    applyRendererPixelRatio();
    if (interactionPixelRatioRestoreTimer) {
      window.clearTimeout(interactionPixelRatioRestoreTimer);
    }
    interactionPixelRatioRestoreTimer = window.setTimeout(() => {
      interactionPixelRatioActive = false;
      interactionPixelRatioRestoreTimer = 0;
      applyRendererPixelRatio();
      setInteractionDetailReduction(false);
      scheduleViewControlPanelSync(true);
    }, INTERACTION_PIXEL_RATIO_RESTORE_MS);
  }

  function setInteractionDetailReduction(active) {
    if (interactionReducedDetailActive === active) {
      syncInteractionDetailDebugState();
      return;
    }
    interactionReducedDetailActive = active;
    if (active) {
      interactionDetailGroups.forEach((group) => {
        group.visible = false;
      });
    } else {
      interactionDetailGroups.forEach((group) => {
        group.visible = true;
      });
      applyLayerVisibility();
    }
    syncInteractionDetailDebugState();
  }

  function syncInteractionDetailDebugState() {
    container.dataset.interactionDetailMode = interactionReducedDetailActive ? "reduced" : "full";
    container.dataset.interactionDetailSuppressedGroupCount = String(
      interactionReducedDetailActive
        ? interactionDetailGroups.filter((group) => group.children.length > 0).length
        : 0
    );
  }

  function isCameraInteractionActive() {
    return interactionPixelRatioActive
      || pointer.down
      || Math.abs(state.zoom - camera.position.z) > CAMERA_SETTLE_EPSILON;
  }

  function shouldRunInteractionUpdate(nowMs, lastRunMs, intervalMs, cameraInteractionActive) {
    return !cameraInteractionActive || nowMs - lastRunMs >= intervalMs;
  }

  function shouldUpdateCityLabels(nowMs, cameraInteractionActive) {
    const intervalMs = cameraInteractionActive
      ? CITY_LABEL_INTERACTION_UPDATE_INTERVAL_MS
      : CITY_LABEL_IDLE_UPDATE_INTERVAL_MS;
    return lastCityLabelUpdateMs === 0 || nowMs - lastCityLabelUpdateMs >= intervalMs;
  }

  function scheduleCityLabelUpdate(cameraInteractionActive = false) {
    if (cityLabelUpdateFrame) {
      window.cancelAnimationFrame(cityLabelUpdateFrame);
    }
    container.dataset.cityLabelUpdateScheduled = "true";
    cityLabelUpdateFrame = window.requestAnimationFrame(() => {
      cityLabelUpdateFrame = 0;
      container.dataset.cityLabelUpdateScheduled = "false";
      lastCityLabelUpdateMs = performance.now();
      updateCityLabels(cameraInteractionActive);
    });
  }

  function setTerrainReliefScale(nextScale) {
    terrainReliefScale = Core.clamp(Number(nextScale), 0.6, 1.8);
    refreshActiveTerrainSurfaces();
    syncViewControlPanel();
  }

  function toggleApprovedPatchTerrainPreview() {
    approvedPatchTerrainPreviewEnabled = !approvedPatchTerrainPreviewEnabled;
    refreshActiveTerrainSurfaces();
    syncViewControlPanel();
    renderLayerSummary();
    updateSelectedPanel();
  }

  function approvedPatchTerrainPreviewPatchCount() {
    if (!approvedPatchTerrainPreviewEnabled) {
      return 0;
    }
    const approvedCount = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.filter((patch) => approvedPatchVisibility[patch.id] !== false).length
      : 0;
    return approvedCount + selectedSuggestionApprovedPreviewPatchCount();
  }

  function refreshActiveTerrainSurfaces() {
    const selectedTile = selectedTerrainTileId
      ? getTerrainDetailTileItems().find((item) => item.id === selectedTerrainTileId)
      : null;
    if (selectedTile && Array.isArray(selectedTile.elevationsMeters)) {
      refreshSelectedTerrainTileSurface(selectedTile);
    }
  }

  function focusInspectionLayers() {
    openLayerGroupIds.add("terrainOverview");
    layerVisibility = {
      ...layerVisibility,
      provinceBorders: true,
      cityBoundaries: true,
      contours: true,
      details: true,
      cities: true,
      waterRefs: true,
    };
    applyLayerVisibility();
    syncInspectorPanelVisibility();
    renderLayerSummary();
    hoverLabel.textContent = "高清检查图层：等高线、边界、城市已打开";
  }

  function onPointerDown(event) {
    beginRenderInteraction();
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.down = true;
    pointer.moved = false;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    document.body.classList.add("is-dragging");
  }

  function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;

    if (pointer.down) {
      beginRenderInteraction();
      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;
      pointer.moved = pointer.moved || Math.abs(dx) + Math.abs(dy) > 2;
      rotationTarget.y += dx * 0.006;
      rotationTarget.x = Core.clamp(rotationTarget.x + dy * 0.004, -0.72, 0.86);
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }
    updateHover();
  }

  function onPointerUp() {
    pointer.down = false;
    document.body.classList.remove("is-dragging");
  }

  function onWheel(event) {
    event.preventDefault();
    scheduleWheelZoom(event.deltaY);
  }

  function onClick(event) {
    if (pointer.moved) return;
    if (manualTraceEditMode) {
      const manualTracePointIndex = pickManualTracePointFromClick(event);
      if (manualTracePointIndex !== null) {
        selectManualTracePoint(manualTracePointIndex);
        return;
      }
      if (selectedManualTracePointIndex !== null) {
        moveSelectedManualTracePointFromClick(event);
        return;
      }
      addManualTracePointFromClick(event);
      return;
    }
    const nearest = Core.findNearestHotspot(hotspotScreen.filter((item) => item.visible), pointer, 22);
    if (nearest && nearest.kind === "prefecture") {
      focusOnCity(nearest.id, { zoom: 4.45 });
    } else if (nearest) {
      focusOnSite(nearest.id, { zoom: 4.65 });
    }
  }

  function toggleManualTraceMode() {
    manualTraceEditMode = !manualTraceEditMode;
    if (manualTraceEditMode) {
      state = { ...state, autoRotate: false };
      autoRotateBtn.classList.remove("is-active");
      autoRotateBtn.setAttribute("aria-pressed", "false");
      hoverLabel.textContent = "临摹草稿：点击中国地形表面添加点";
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      }
    } else {
      hoverLabel.textContent = "拖拽旋转，滚轮缩放，点击地点查看地形";
    }
    renderManualTraceDraft();
  }

  function pickManualTracePointFromClick(event) {
    if (!event) return null;
    const targets = terrainManualTraceGroup.children.filter((object) =>
      object.userData && object.userData.role === "terrain-manual-trace-point"
    );
    if (!targets.length) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    raycastMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    raycastMouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    worldGroup.updateMatrixWorld(true);
    raycaster.setFromCamera(raycastMouse, camera);
    const intersections = raycaster.intersectObjects(targets, false);
    if (!intersections.length) return null;
    const index = intersections[0].object.userData.manualTraceIndex;
    return Number.isInteger(index) ? index : null;
  }

  function selectManualTracePoint(index) {
    const points = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points : [];
    const nextIndex = Number(index);
    selectedManualTracePointIndex = Number.isInteger(nextIndex) && nextIndex >= 0 && nextIndex < points.length
      ? nextIndex
      : null;
    selectedManualTraceId = manualTraceDraft.id;
    renderManualTraceDraft();
    updateSelectedPanel();
    hoverLabel.textContent = selectedManualTracePointIndex === null
      ? "Manual trace point cleared"
      : `Manual trace point ${selectedManualTracePointIndex + 1} selected`;
  }

  function clearSelectedManualTracePoint() {
    selectedManualTracePointIndex = null;
  }

  function moveSelectedManualTracePointFromClick(event) {
    if (selectedManualTracePointIndex === null) return;
    const point = raycastTerrainPoint(event);
    if (!isPointInsideManualTraceTileBounds(point)) {
      hoverLabel.textContent = "Manual trace point move is outside the active tile";
      return;
    }
    const beforePoint = Array.isArray(manualTraceDraft.points)
      ? manualTraceDraft.points[selectedManualTracePointIndex]
      : null;
    manualTraceDraft = Core.updateManualTerrainTracePointAt(manualTraceDraft, selectedManualTracePointIndex, point);
    const afterPoint = Array.isArray(manualTraceDraft.points)
      ? manualTraceDraft.points[selectedManualTracePointIndex]
      : null;
    if (beforePoint && afterPoint && (beforePoint.lat !== afterPoint.lat || beforePoint.lng !== afterPoint.lng)) {
      manualTraceMovedPointCount += 1;
      saveManualTraceDraft();
      hoverLabel.textContent = `Manual trace point ${selectedManualTracePointIndex + 1} moved`;
    }
    renderManualTraceDraft();
    if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
      focusOnManualTraceDraft();
    }
  }

  function deleteSelectedManualTracePoint() {
    if (selectedManualTracePointIndex === null) return;
    const beforeCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
    manualTraceDraft = Core.removeManualTerrainTracePointAt(manualTraceDraft, selectedManualTracePointIndex);
    const afterCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
    if (afterCount < beforeCount) {
      manualTraceDeletedPointCount += 1;
      clearSelectedManualTracePoint();
      saveManualTraceDraft();
      hoverLabel.textContent = "Manual trace point deleted";
      renderManualTraceDraft();
      if (Core.buildTerrainTracePath(manualTraceDraft).length >= 2) {
        focusOnManualTraceDraft();
      } else {
        selectedManualTraceId = null;
        updateSelectedPanel();
      }
    }
  }

  function addManualTracePointFromClick(event) {
    const point = raycastTerrainPoint(event);
    if (!isPointInsideManualTraceTileBounds(point)) {
      const tileLabel = manualTraceDraft.sourceTileId
        ? terrainTileLabel(getTerrainDetailTileItems().find((tile) => tile.id === manualTraceDraft.sourceTileId))
        : "当前高清区域";
      hoverLabel.textContent = `临摹草稿：请点击 ${tileLabel} 范围内的地形`;
      return;
    }
    const beforeCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
    manualTraceDraft = Core.addManualTerrainTracePoint(manualTraceDraft, point);
    const afterCount = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points.length : 0;
    if (afterCount > beforeCount) {
      selectedManualTracePointIndex = afterCount - 1;
      saveManualTraceDraft();
      hoverLabel.textContent = `临摹草稿：已添加 ${afterCount} 点`;
    } else {
      hoverLabel.textContent = "临摹草稿：请点击中国地形区域";
    }
    renderManualTraceDraft();
    if (afterCount >= 2) {
      focusOnManualTraceDraft();
    }
  }

  function isPointInsideManualTraceTileBounds(point) {
    const bounds = manualTraceDraft && manualTraceDraft.sourceTileBounds;
    if (!bounds || !point) return true;
    return point.lat >= Number(bounds.minLat) &&
      point.lat <= Number(bounds.maxLat) &&
      point.lng >= Number(bounds.minLng) &&
      point.lng <= Number(bounds.maxLng);
  }

  function generateManualTraceSuggestions() {
    const generated = Core.buildTerrainTracePatchSuggestions(manualTraceDraft, { includeLineBand: true, includePolygonMask: true });
    if (!generated || !Array.isArray(generated.patches) || generated.patches.length < 2) {
      hoverLabel.textContent = "临摹草稿：至少需要 2 个点才能生成候选";
      return;
    }
    const existingPatches = terrainPatchSuggestions && Array.isArray(terrainPatchSuggestions.patches)
      ? terrainPatchSuggestions.patches
      : [];
    const sourceTile = manualTraceDraft.sourceTileId
      ? getTerrainDetailTileItems().find((tile) => tile.id === manualTraceDraft.sourceTileId)
      : null;
    const sourceTileStats = sourceTile ? terrainTileElevationStats(sourceTile) : null;
    const manualPatches = generated.patches.map((patch) => ({
      ...patch,
      sourceTraceLabel: manualTraceDraft.label || "临摹草稿",
      sourceTileId: manualTraceDraft.sourceTileId || "",
      sourceTileLabel: sourceTile ? terrainTileLabel(sourceTile) : "",
      sourceTileBounds: manualTraceDraft.sourceTileBounds ? { ...manualTraceDraft.sourceTileBounds } : null,
      sourceTileDataset: sourceTile ? sourceTile.dataset || (terrainDetailTiles && terrainDetailTiles.dataset) || "" : "",
      sourceTileReliefMeters: sourceTileStats && Number.isFinite(sourceTileStats.reliefMeters) ? sourceTileStats.reliefMeters : null,
      reviewStatus: "draft",
    }));
    terrainPatchSuggestions = {
      id: "china-trace-patch-suggestions",
      type: "terrain-detail-patch-suggestions",
      units: "meters",
      patches: [
        ...existingPatches.filter((patch) => patch.sourceTraceId !== manualTraceDraft.id),
        ...manualPatches,
      ],
    };
    manualTraceSuggestionCount = manualPatches.length;
    const shapeSummary = syncManualTraceSuggestionShapeCounts(manualPatches);
    saveManualTraceSuggestions(manualPatches);
    suggestionVisibility = Core.createTerrainPatchSuggestionGroupVisibilityState(terrainPatchSuggestions, suggestionVisibility);
    createTerrainPatchSuggestions();
    renderSuggestionButtons();
    renderLayerSummary();
    applyLayerVisibility();
    focusOnSuggestionGroup(manualTraceDraft.id);
    updateManualTraceUi();
    hoverLabel.textContent = `临摹草稿：已生成 ${manualTraceSuggestionCount} 个候选补丁${shapeSummary.polygonMask ? ` · ${shapeSummary.polygonMask} 个区域` : ""}`;
  }

  function raycastTerrainPoint(event) {
    if (!event || !terrainPickTargets.length) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    raycastMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    raycastMouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    worldGroup.updateMatrixWorld(true);
    raycaster.setFromCamera(raycastMouse, camera);
    const intersections = raycaster.intersectObjects(terrainPickTargets, false);
    if (!intersections.length) return null;
    const localPoint = worldGroup.worldToLocal(intersections[0].point.clone());
    return Core.vector3ToLatLng([localPoint.x, localPoint.y, localPoint.z]);
  }

  function updateHover() {
    const nearest = Core.findNearestHotspot(hotspotScreen.filter((item) => item.visible), pointer, 22);
    hoverLabel.textContent = nearest ? `${nearest.name} · ${nearest.region}` : "拖拽旋转，滚轮缩放，点击地点查看地形";
    state = { ...state, hoveredHotspotId: nearest ? nearest.id : null };
  }

  function updateSelectedPanel() {
    hideTraceProfile();
    hideTerrainTileTraceSummary();
    clearTraceProfileMarkers();
    updateSelectedSuggestionBundleDebug();
    container.dataset.selectedTerrainTileId = selectedTerrainTileId || "";
    syncViewControlPanel();
    syncSelectedTerrainTileCityDebug(null);
    updateStartTerrainTileTraceButton(null);
    updateActiveCityButtons(null);
    updateActiveTerrainTileButtons(null);
    const selectedSuggestionPatch = Core.findTerrainPatchSuggestion(terrainPatchSuggestions, state.selectedSuggestionPatchId);
    if (selectedSuggestionPatch) {
      const selectedSuggestionPatchSourceTile = terrainTileForSuggestionSource(selectedSuggestionPatch.sourceTileId);
      syncSelectedTerrainTileCityDebug(selectedSuggestionPatchSourceTile);
      updateStartTerrainTileTraceButton(selectedSuggestionPatchSourceTile);
      updateActiveTerrainTileButtons(selectedSuggestionPatchSourceTile ? selectedSuggestionPatchSourceTile.id : null);
      selectedTitle.textContent = selectedSuggestionPatch.label || selectedSuggestionPatch.id;
      selectedMeta.textContent = `${formatCoord(selectedSuggestionPatch.center.lat, "N", "S")} ${formatCoord(selectedSuggestionPatch.center.lng, "E", "W")} · ${terrainDetailPatchShapeSummary(selectedSuggestionPatch)} · ${selectedSuggestionPatch.reviewStatus || "draft"}，未应用到地形`;
      selectedMetricLabel.textContent = "候选修正";
      selectedMetric.textContent = `${formatDeltaMeters(selectedSuggestionPatch.deltaMeters)} 草稿`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(selectedSuggestionPatch.sourceTraceId || "unassigned");
      updateActiveSuggestionPatchButtons(selectedSuggestionPatch.id);
      return;
    }

    const selectedSuggestionBundle = getSelectedSuggestionBundle();
    if (selectedSuggestionBundle.count) {
      selectedTitle.textContent = "候选补丁组合";
      selectedMeta.textContent = selectedSuggestionBundle.center
        ? `${formatCoord(selectedSuggestionBundle.center.lat, "N", "S")} ${formatCoord(selectedSuggestionBundle.center.lng, "E", "W")} · ${selectedSuggestionBundle.count} 个候选，平均半径 ${selectedSuggestionBundle.averageRadiusDegrees.toFixed(2)}°，未应用到地形`
        : `${selectedSuggestionBundle.count} 个候选，未应用到地形`;
      selectedMetricLabel.textContent = "组合修正";
      selectedMetric.textContent = `${formatDeltaMeters(selectedSuggestionBundle.totalDeltaMeters)} 总量 · ${selectedSuggestionBundle.lifts} 抬升 / ${selectedSuggestionBundle.depressions} 下凹 · ${selectedSuggestionBundle.promoteCommand}`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(state.selectedSuggestionGroupId || null);
      updateActiveSuggestionPatchButtons(null);
      return;
    }

    const selectedSuggestionGroup = Core.groupTerrainPatchSuggestionsByTrace(terrainPatchSuggestions)
      .find((item) => item.id === state.selectedSuggestionGroupId);
    if (selectedSuggestionGroup) {
      const selectedSuggestionGroupSourceTile = terrainTileForSuggestionSource(selectedSuggestionGroup.sourceTileId);
      syncSelectedTerrainTileCityDebug(selectedSuggestionGroupSourceTile);
      updateStartTerrainTileTraceButton(selectedSuggestionGroupSourceTile);
      updateActiveTerrainTileButtons(selectedSuggestionGroupSourceTile ? selectedSuggestionGroupSourceTile.id : null);
      const center = suggestionGroupCenter(selectedSuggestionGroup);
      const shapeText = suggestionGroupShapeText(selectedSuggestionGroup);
      const sourceText = suggestionGroupSourceText(selectedSuggestionGroup);
      const reviewText = suggestionGroupReviewText(selectedSuggestionGroup);
      selectedTitle.textContent = suggestionGroupLabel(selectedSuggestionGroup);
      selectedMeta.textContent = center
        ? `${formatCoord(center.lat, "N", "S")} ${formatCoord(center.lng, "E", "W")} · ${selectedSuggestionGroup.total} 个草稿候选 · ${shapeText} · ${sourceText}，未应用到地形`
        : `${selectedSuggestionGroup.total} 个草稿候选 · ${shapeText} · ${sourceText}，未应用到地形`;
      selectedMetricLabel.textContent = "候选修正";
      selectedMetric.textContent = `${suggestionGroupMetric(selectedSuggestionGroup)} · ${reviewText}`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(selectedSuggestionGroup.id);
      updateActiveSuggestionPatchButtons(null);
      return;
    }

    const selectedTerrainTile = getTerrainDetailTileItems().find((tile) => tile.id === selectedTerrainTileId);
    if (selectedTerrainTile) {
      const center = terrainTileCenter(selectedTerrainTile);
      const stats = terrainTileElevationStats(selectedTerrainTile);
      const sourceBadge = terrainTileSourceBadge(selectedTerrainTile);
      const profileTrace = terrainTileProfileTrace(selectedTerrainTile);
      const profile = Core.buildTerrainTraceElevationProfile(profileTrace, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
      selectedTitle.textContent = terrainTileLabel(selectedTerrainTile);
      selectedMeta.textContent = center
        ? `${formatCoord(center.lat, "N", "S")} ${formatCoord(center.lng, "E", "W")} · ${terrainTileBoundsLabel(selectedTerrainTile)} · ${terrainTileGridLabel(selectedTerrainTile)}`
        : `${terrainTileBoundsLabel(selectedTerrainTile)} · ${terrainTileGridLabel(selectedTerrainTile)}`;
      selectedMetricLabel.textContent = "高清地形";
      selectedMetric.textContent = stats
        ? `${sourceBadge} · ${terrainTileReliefClassLabel(stats.reliefClass)} · ${terrainTileTraceWorkloadLabel(stats.traceWorkload)} · 陡峭 ${Math.round(Number(stats.steepCellRatio || 0) * 100)}% · 起伏 ${formatMeters(stats.reliefMeters)} · 均值 ${formatMeters(stats.averageMeters)} · 最大局部 ${formatMeters(stats.maxCellReliefMeters)}`
        : `${sourceBadge} · 已加载`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      syncSelectedTerrainTileCityDebug(selectedTerrainTile);
      renderTerrainTileTraceSummary(selectedTerrainTile);
      renderTraceProfile(profile);
      renderTraceProfileMarkers(profileTrace, profile);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(selectedTerrainTile.id);
      updateStartTerrainTileTraceButton(selectedTerrainTile);
      return;
    }

    const manualTraceSelected = selectedManualTraceId === manualTraceDraft.id && Core.buildTerrainTracePath(manualTraceDraft).length >= 2;
    if (manualTraceSelected) {
      const center = Core.getTerrainTraceCenter(manualTraceDraft);
      const tracePath = Core.buildTerrainTracePath(manualTraceDraft);
      const profile = Core.buildTerrainTraceElevationProfile(manualTraceDraft, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
      selectedTitle.textContent = manualTraceDraft.label || "临摹草稿";
      selectedMeta.textContent = center
        ? `${formatCoord(center.lat, "N", "S")} ${formatCoord(center.lng, "E", "W")} · ${tracePath.length} 点`
        : "临摹草稿";
      selectedMetricLabel.textContent = "高程剖面";
      selectedMetric.textContent = profile.sampleCount
        ? `${traceKindLabel(manualTraceDraft.kind)} · 起伏 ${formatMeters(profile.reliefMeters)} · 均值 ${formatMeters(profile.averageMeters)}`
        : traceKindLabel(manualTraceDraft.kind);
      renderTraceProfile(profile);
      renderTraceProfileMarkers(manualTraceDraft, profile);
      container.dataset.manualTraceProfileVisible = String(Boolean(profile.sampleCount));
      container.dataset.manualTraceProfileSampleCount = String(profile.sampleCount || 0);
      if (manualTraceStatus) {
        manualTraceStatus.textContent = `临摹草稿：${tracePath.length} 点 · 高程剖面${manualTraceSuggestionCount ? ` · ${manualTraceSuggestionCount} 候选` : ""}`;
      }
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(manualTraceDraft.id);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      updateActiveTerrainSourceButtons(null);
      return;
    }

    const selectedTrace = terrainTraceGuides && Array.isArray(terrainTraceGuides.traces)
      ? terrainTraceGuides.traces.find((item) => item.id === state.selectedTraceId)
      : null;
    if (selectedTrace) {
      const center = Core.getTerrainTraceCenter(selectedTrace);
      const tracePath = Core.buildTerrainTracePath(selectedTrace);
      const profile = Core.buildTerrainTraceElevationProfile(selectedTrace, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles);
      selectedTitle.textContent = selectedTrace.label || selectedTrace.id;
      selectedMeta.textContent = center
        ? `${formatCoord(center.lat, "N", "S")} ${formatCoord(center.lng, "E", "W")} · ${tracePath.length} 点`
        : "临摹线";
      selectedMetricLabel.textContent = "高程剖面";
      selectedMetric.textContent = profile.sampleCount
        ? `${traceKindLabel(selectedTrace.kind)} · 起伏 ${formatMeters(profile.reliefMeters)} · 均值 ${formatMeters(profile.averageMeters)}`
        : traceKindLabel(selectedTrace.kind);
      renderTraceProfile(profile);
      renderTraceProfileMarkers(selectedTrace, profile);
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(selectedTrace.id);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      return;
    }

    const selectedApprovedPatch = terrainApprovedPatches && Array.isArray(terrainApprovedPatches.patches)
      ? terrainApprovedPatches.patches.find((item) => item.id === state.selectedApprovedPatchId)
      : null;
    if (selectedApprovedPatch) {
      const focusPoint = terrainDetailPatchFocusPoint(selectedApprovedPatch);
      selectedTitle.textContent = selectedApprovedPatch.label || selectedApprovedPatch.id;
      selectedMeta.textContent = focusPoint
        ? `${formatCoord(focusPoint.lat, "N", "S")} ${formatCoord(focusPoint.lng, "E", "W")} · ${terrainDetailPatchShapeLabel(selectedApprovedPatch)} · ${selectedApprovedPatch.reviewStatus || "approved"}`
        : `${terrainDetailPatchShapeLabel(selectedApprovedPatch)} · ${selectedApprovedPatch.reviewStatus || "approved"}`;
      selectedMetricLabel.textContent = "已审修正";
      selectedMetric.textContent = `${formatDeltaMeters(selectedApprovedPatch.deltaMeters)} 预览`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(selectedApprovedPatch.id);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      return;
    }

    const selectedPatch = terrainDetailPatches && Array.isArray(terrainDetailPatches.patches)
      ? terrainDetailPatches.patches.find((item) => item.id === state.selectedPatchId)
      : null;
    if (selectedPatch) {
      const focusPoint = terrainDetailPatchFocusPoint(selectedPatch);
      selectedTitle.textContent = selectedPatch.label || selectedPatch.id;
      selectedMeta.textContent = focusPoint
        ? `${formatCoord(focusPoint.lat, "N", "S")} ${formatCoord(focusPoint.lng, "E", "W")} · ${terrainDetailPatchShapeLabel(selectedPatch)}`
        : terrainDetailPatchShapeLabel(selectedPatch);
      selectedMetricLabel.textContent = "局部修正";
      selectedMetric.textContent = `${Number(selectedPatch.deltaMeters) > 0 ? "+" : ""}${Math.round(Number(selectedPatch.deltaMeters) || 0)} m`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(selectedPatch.id);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      return;
    }
    const selectedCity = Core.CHINA_TERRAIN_CITIES.find((item) => item.id === state.selectedHotspotId);
    if (selectedCity) {
      const block = terrainBlockById(selectedCity.terrainBlockId);
      selectedTitle.textContent = selectedCity.name;
      selectedMeta.textContent = `${selectedCity.province} · ${selectedCity.region} · ${formatCoord(selectedCity.lat, "N", "S")} ${formatCoord(selectedCity.lng, "E", "W")}`;
      selectedMetricLabel.textContent = "采样海拔";
      selectedMetric.textContent = `${formatMeters(Core.sampleChinaTerrainMeters(selectedCity.lat, selectedCity.lng, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles))} · ${block ? block.name : selectedCity.terrainBlockId}`;
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveCityButtons(selectedCity.id);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      return;
    }

    const selected = Core.CHINA_TERRAIN_SITES.find((item) => item.id === state.selectedHotspotId);
    if (!selected) {
      selectedTitle.textContent = "中国板块";
      selectedMeta.textContent = "18°N-54°N · 73°E-135°E";
      selectedMetricLabel.textContent = "地势";
      selectedMetric.textContent = "西高东低";
      selectedZoom.textContent = state.zoom.toFixed(2);
      updateActiveSiteButtons(null);
      updateActivePatchButtons(null);
      updateActiveApprovedPatchButtons(null);
      updateActiveTraceButtons(null);
      updateActiveSuggestionButtons(null);
      updateActiveSuggestionPatchButtons(null);
      updateActiveTerrainTileButtons(null);
      return;
    }
    selectedTitle.textContent = selected.name;
    selectedMeta.textContent = `${selected.region} · ${formatCoord(selected.lat, "N", "S")} ${formatCoord(selected.lng, "E", "W")}`;
    selectedMetricLabel.textContent = "海拔";
    selectedMetric.textContent = `${Math.round(selected.elevation)} m`;
    selectedZoom.textContent = state.zoom.toFixed(2);
    updateActiveSiteButtons(selected.id);
    updateActivePatchButtons(null);
    updateActiveApprovedPatchButtons(null);
    updateActiveTraceButtons(null);
    updateActiveSuggestionButtons(null);
    updateActiveSuggestionPatchButtons(null);
    updateActiveTerrainTileButtons(null);
    updateActiveTerrainSourceButtons(null);
  }

  function terrainTileCenter(tile) {
    if (!tile || !tile.bounds) return null;
    return {
      lat: (Number(tile.bounds.minLat) + Number(tile.bounds.maxLat)) / 2,
      lng: (Number(tile.bounds.minLng) + Number(tile.bounds.maxLng)) / 2,
    };
  }

  function terrainTileLabel(tile) {
    const raw = tile && (tile.label || tile.id);
    if (!raw) return "DEM tile";
    return String(raw)
      .replace(/\s*SRTM\s*30m\s*local\s*tile/i, "")
      .replace(/\s*SRTM\s*90m\s*local\s*tile/i, "")
      .trim() || String(raw);
  }

  function terrainTileGridLabel(tile) {
    const latCount = Array.isArray(tile && tile.latitudes) ? tile.latitudes.length : 0;
    const lngCount = Array.isArray(tile && tile.longitudes) ? tile.longitudes.length : 0;
    return latCount && lngCount ? `${latCount}x${lngCount}` : "DEM";
  }

  function terrainTileBoundsLabel(tile) {
    if (!tile || !tile.bounds) return "区域";
    return `${formatCoord(tile.bounds.minLat, "N", "S")}-${formatCoord(tile.bounds.maxLat, "N", "S")} · ${formatCoord(tile.bounds.minLng, "E", "W")}-${formatCoord(tile.bounds.maxLng, "E", "W")}`;
  }

  function terrainTileElevationStats(tile) {
    const values = tile && Array.isArray(tile.elevationsMeters)
      ? tile.elevationsMeters.flat().map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [];
    if (!values.length) return null;
    const minMeters = Math.min(...values);
    const maxMeters = Math.max(...values);
    const analysis = Core.summarizeTerrainTileAnalysis(tile);
    return {
      minMeters,
      maxMeters,
      averageMeters: analysis.averageMeters,
      reliefMeters: maxMeters - minMeters,
      maxCellReliefMeters: analysis.maxCellReliefMeters,
      steepCellCount: analysis.steepCellCount,
      steepCellRatio: analysis.steepCellRatio,
      reliefClass: analysis.reliefClass,
      traceRecommendation: analysis.traceRecommendation,
      traceWorkload: analysis.traceWorkload,
    };
  }

  function terrainTileReliefClassLabel(reliefClass) {
    if (reliefClass === "rugged") return "崎岖山地";
    if (reliefClass === "rolling") return "起伏丘陵";
    if (reliefClass === "gentle") return "缓坡平原";
    return "待分析";
  }

  function terrainTileTraceRecommendationLabel(recommendation) {
    if (recommendation === "ridge-valley") return "优先临摹山脊/谷线";
    if (recommendation === "basin-edge") return "优先临摹盆地边缘";
    if (recommendation === "water-boundary") return "优先校准水系/边界";
    return "先查看等高线";
  }

  function terrainTileTraceWorkloadLabel(workload) {
    if (workload === "dense") return "密集临摹";
    if (workload === "moderate") return "分段临摹";
    if (workload === "light") return "少量校准";
    return "待判断";
  }

  function terrainTileProfileTrace(tile) {
    const bounds = tile && tile.bounds;
    const center = terrainTileCenter(tile);
    if (!bounds || !center) {
      return { id: "terrain-tile-profile", kind: "ridge", points: [] };
    }
    return {
      id: `${tile.id}-profile`,
      label: terrainTileLabel(tile),
      kind: "ridge",
      points: [
        { lat: bounds.minLat, lng: bounds.minLng },
        { lat: center.lat, lng: center.lng },
        { lat: bounds.maxLat, lng: bounds.maxLng },
      ],
    };
  }

  function hideTerrainTileTraceSummary() {
    if (!terrainTileTraceSummary) return;
    terrainTileTraceSummary.hidden = true;
    terrainTileTraceSummary.innerHTML = "";
    container.dataset.terrainTileTraceSummaryText = "";
    container.dataset.terrainTileTraceSummaryContourSegments = "0";
    container.dataset.terrainTileTraceSummaryBoundarySegments = "0";
    container.dataset.terrainTileTraceSummaryWaterSegments = "0";
    container.dataset.terrainTileTraceSummaryCityCount = "0";
    container.dataset.terrainTileAnalysisReliefClass = "";
    container.dataset.terrainTileAnalysisTraceRecommendation = "";
    container.dataset.terrainTileAnalysisMaxCellReliefMeters = "0";
    container.dataset.terrainTileAnalysisAverageMeters = "0";
    container.dataset.terrainTileAnalysisSteepCellCount = "0";
    container.dataset.terrainTileAnalysisSteepCellRatio = "0";
    container.dataset.terrainTileAnalysisTraceWorkload = "";
    container.dataset.terrainTileTraceAidReadiness = "";
    container.dataset.terrainTileTraceAidContourDensity = "0";
    container.dataset.terrainTileTraceAidReferenceLayerCount = "0";
    container.dataset.terrainTileTraceAidDetailPriority = "";
    container.dataset.terrainTileTraceAidGuideKinds = "";
  }

  function renderTerrainTileTraceSummary(tile) {
    if (!terrainTileTraceSummary || !tile) return;
    const loaded = terrainDetailTileSurfaceGroup.userData.tileId === tile.id;
    const contourSegments = loaded ? Number(terrainDetailTileContourGroup.userData.segmentCount) || 0 : 0;
    const boundarySegments = loaded ? Number(terrainDetailTileBoundaryGroup.userData.segmentCount) || 0 : 0;
    const waterSegments = loaded ? Number(terrainDetailTileWaterGroup.userData.segmentCount) || 0 : 0;
    const waterRivers = loaded ? Number(terrainDetailTileWaterGroup.userData.riverCount) || 0 : 0;
    const traceGuideCount = loaded ? Number(terrainDetailTileTraceGuideGroup.userData.guideCount) || 0 : 0;
    const recommendedTraceGuideCount = loaded ? Number(terrainDetailTileTraceGuideGroup.userData.recommendedGuideCount) || 0 : 0;
    const cities = terrainTileLocalCities(tile);
    const analysis = Core.summarizeTerrainTileAnalysis(tile);
    const traceAid = Core.summarizeTerrainTileTraceAid(tile, {
      contourSegments,
      boundarySegments,
      waterSegments,
      cityCount: cities.length,
      traceGuides: Core.buildTerrainTileTraceGuides(tile),
      recommendedTraceGuideCount,
    });
    const steepCellPercent = Math.round(Number(analysis.steepCellRatio || 0) * 100);
    const summaryText = loaded
      ? `临摹参考：等高线 ${contourSegments} 段 · 边界 ${boundarySegments} 段 · 水系 ${waterSegments} 段 / ${waterRivers} 河 · 自动临摹线 ${traceGuideCount} 条 · 推荐 ${recommendedTraceGuideCount} 条 · 城市 ${cities.length} 个 · ${terrainTileReliefClassLabel(analysis.reliefClass)} · 陡峭 ${steepCellPercent}% · ${terrainTileTraceWorkloadLabel(analysis.traceWorkload)} · ${terrainTileTraceRecommendationLabel(analysis.traceRecommendation)}`
      : `临摹参考：${terrainTileLabel(tile)} 正在载入高清图层`;
    terrainTileTraceSummary.hidden = false;
    terrainTileTraceSummary.innerHTML = `
      <strong>临摹参考</strong>
      <span>等高线 ${contourSegments}</span>
      <span>边界 ${boundarySegments}</span>
      <span>水系 ${waterSegments}</span>
      <span>临摹线 ${traceGuideCount}</span>
      <span>推荐 ${recommendedTraceGuideCount}</span>
      <span>城市 ${cities.length}</span>
      <span>${terrainTileReliefClassLabel(analysis.reliefClass)}</span>
      <span>陡峭 ${steepCellPercent}%</span>
      <span>${terrainTileTraceWorkloadLabel(analysis.traceWorkload)}</span>
      <span>${terrainTileTraceRecommendationLabel(analysis.traceRecommendation)}</span>
    `;
    terrainTileTraceSummary.insertAdjacentHTML("beforeend", `<span>${traceAid.traceReadiness}/${traceAid.detailPriority}</span>`);
    container.dataset.terrainTileTraceSummaryText = summaryText;
    container.dataset.terrainTileTraceSummaryContourSegments = String(contourSegments);
    container.dataset.terrainTileTraceSummaryBoundarySegments = String(boundarySegments);
    container.dataset.terrainTileTraceSummaryWaterSegments = String(waterSegments);
    container.dataset.terrainTileTraceSummaryCityCount = String(cities.length);
    container.dataset.terrainTileAnalysisReliefClass = analysis.reliefClass;
    container.dataset.terrainTileAnalysisTraceRecommendation = analysis.traceRecommendation;
    container.dataset.terrainTileAnalysisMaxCellReliefMeters = String(Math.round(analysis.maxCellReliefMeters));
    container.dataset.terrainTileAnalysisAverageMeters = String(Math.round(analysis.averageMeters));
    container.dataset.terrainTileAnalysisSteepCellCount = String(analysis.steepCellCount);
    container.dataset.terrainTileAnalysisSteepCellRatio = Number(analysis.steepCellRatio || 0).toFixed(3);
    container.dataset.terrainTileAnalysisTraceWorkload = analysis.traceWorkload;
    container.dataset.terrainTileTraceAidReadiness = traceAid.traceReadiness;
    container.dataset.terrainTileTraceAidContourDensity = traceAid.contourDensityPerCell.toFixed(2);
    container.dataset.terrainTileTraceAidReferenceLayerCount = String(traceAid.referenceLayerCount);
    container.dataset.terrainTileTraceAidDetailPriority = traceAid.detailPriority;
    container.dataset.terrainTileTraceAidGuideKinds = traceAid.guideKinds.join(",");
  }

  function updateActiveSiteButtons(siteId) {
    document.querySelectorAll(".site-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.siteId === siteId);
    });
  }

  function updateActiveCityButtons(cityId) {
    document.querySelectorAll(".city-button, .terrain-city-label").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.cityId === cityId);
    });
  }

  function updateActiveTerrainTileButtons(tileId) {
    const loadingTileId = terrainDetailTileSurfaceGroup.userData.referenceLayersPending
      ? selectedTerrainTileId
      : null;
    const tilesById = new Map(getTerrainDetailTileItems().map((tile) => [tile.id, tile]));
    document.querySelectorAll(".terrain-tile-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.terrainTileId === tileId);
      button.classList.toggle("is-loading", button.dataset.terrainTileId === loadingTileId);
      const tile = tilesById.get(button.dataset.terrainTileId);
      syncTerrainTileButtonStatus(button, tile);
    });
  }

  function updateActiveTerrainSourceButtons(sourceId) {
    document.querySelectorAll(".terrain-source-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.terrainSourceId === sourceId);
    });
  }

  function updateStartTerrainTileTraceButton(selectedTerrainTile) {
    if (startTerrainTileTraceBtn) {
    startTerrainTileTraceBtn.hidden = !selectedTerrainTile;
    startTerrainTileTraceBtn.disabled = !selectedTerrainTile;
    startTerrainTileTraceBtn.textContent = selectedTerrainTile
      ? `在 ${terrainTileLabel(selectedTerrainTile)} 临摹`
      : "在此区域临摹";
  }

    const guides = selectedTerrainTile ? Core.buildTerrainTileTraceGuides(selectedTerrainTile) : [];
    const hasRidgeGuide = guides.some((guide) => guide.kind === "ridge");
    const hasValleyGuide = guides.some((guide) => guide.kind === "valley");
    const recommendedGuides = selectedTerrainTile ? recommendedTerrainTileTraceGuides(selectedTerrainTile) : [];
    if (seedRidgeTraceBtn) {
      seedRidgeTraceBtn.hidden = !selectedTerrainTile;
      seedRidgeTraceBtn.disabled = !selectedTerrainTile || !hasRidgeGuide;
    }
    if (seedValleyTraceBtn) {
      seedValleyTraceBtn.hidden = !selectedTerrainTile;
      seedValleyTraceBtn.disabled = !selectedTerrainTile || !hasValleyGuide;
    }
    if (generateRecommendedTileSuggestionsBtn) {
      generateRecommendedTileSuggestionsBtn.hidden = !selectedTerrainTile;
      generateRecommendedTileSuggestionsBtn.disabled = !selectedTerrainTile || !recommendedGuides.length;
    }
  }

  function updateActivePatchButtons(patchId) {
    document.querySelectorAll(".patch-focus").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.patchFocusId === patchId);
    });
  }

  function updateActiveApprovedPatchButtons(patchId) {
    document.querySelectorAll(".approved-focus").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.approvedPatchFocusId === patchId);
    });
  }

  function updateActiveTraceButtons(traceId) {
    document.querySelectorAll(".trace-focus").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.traceFocusId === traceId);
    });
  }

  function updateActiveSuggestionButtons(groupId) {
    document.querySelectorAll(".suggestion-focus").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.suggestionFocusId === groupId);
    });
  }

  function updateActiveSuggestionPatchButtons(patchId) {
    document.querySelectorAll(".suggestion-patch-focus").forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute("data-suggestion-patch-focus-id") === patchId);
    });
  }

  function renderTraceProfile(profile) {
    if (!traceProfile || !profile || !profile.sampleCount) {
      hideTraceProfile();
      return;
    }
    const chart = Core.buildTerrainTraceProfileChart(profile, { width: 220, height: 72, padding: 9 });
    if (!chart.points) {
      hideTraceProfile();
      return;
    }
    const low = chart.lowMarker;
    const high = chart.highMarker;
    traceProfile.hidden = false;
    traceProfile.innerHTML = `
      <svg class="trace-profile-chart" viewBox="0 0 ${chart.width} ${chart.height}" role="img" aria-label="临摹线高程剖面折线">
        <line class="trace-profile-baseline" x1="9" y1="${chart.height - 9}" x2="${chart.width - 9}" y2="${chart.height - 9}"></line>
        <polyline class="trace-profile-line" points="${chart.points}"></polyline>
        ${low ? `<circle class="trace-profile-marker-low" cx="${low.x}" cy="${low.y}" r="3.2"></circle>` : ""}
        ${high ? `<circle class="trace-profile-marker-high" cx="${high.x}" cy="${high.y}" r="3.2"></circle>` : ""}
      </svg>
      <div class="trace-profile-labels">
        <span>低 ${low ? formatMeters(low.elevationMeters) : "--"}</span>
        <span>高 ${high ? formatMeters(high.elevationMeters) : "--"}</span>
      </div>
    `;
  }

  function renderTraceProfileMarkers(trace, profile) {
    clearTraceProfileMarkers();
    if (!trace || !profile || !profile.sampleCount) return;
    addTraceProfileMarker(trace, profile.lowPoint, "terrain-trace-profile-marker-low", "#79c7ff");
    addTraceProfileMarker(trace, profile.highPoint, "terrain-trace-profile-marker-high", "#f4d28a");
    updateTraceProfileMarkerDebug();
    applyLayerVisibility();
  }

  function renderManualTraceDraft() {
    clearGroup(terrainManualTraceGroup);
    const points = Array.isArray(manualTraceDraft.points) ? manualTraceDraft.points : [];
    const path = Core.buildTerrainTracePath(manualTraceDraft);
    if (path.length >= 2) {
      const line = createPathLine(path, 0xf4d28a, 0.9, 0.56);
      line.userData.role = "terrain-manual-trace-line";
      terrainManualTraceGroup.add(line);
    }
    points.forEach((point, index) => {
      const isSelected = index === selectedManualTracePointIndex;
      const position = toVector3(Core.latLngToVector3({
        lat: point.lat,
        lng: point.lng,
        radius: terrainRadius(point.lat, point.lng, 0.6),
      }));
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.034 : 0.026, 14, 14),
        new THREE.MeshBasicMaterial({ color: isSelected ? 0xffffff : 0xf4d28a })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 0.086 : 0.062, 14, 14),
        new THREE.MeshBasicMaterial({
          color: isSelected ? 0xffffff : 0xf4d28a,
          transparent: true,
          opacity: isSelected ? 0.28 : 0.16,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      marker.position.copy(position);
      halo.position.copy(position);
      marker.userData.role = "terrain-manual-trace-point";
      halo.userData.role = "terrain-manual-trace-point";
      marker.userData.traceId = manualTraceDraft.id;
      halo.userData.traceId = manualTraceDraft.id;
      marker.userData.manualTraceIndex = index;
      halo.userData.manualTraceIndex = index;
      marker.userData.manualTraceSelected = isSelected;
      halo.userData.manualTraceSelected = isSelected;
      terrainManualTraceGroup.add(halo, marker);
    });
    updateManualTraceUi();
    applyLayerVisibility();
  }

  function manualTraceQualitySummary(trace) {
    const rawPoints = trace && Array.isArray(trace.points) ? trace.points : [];
    const usablePoints = rawPoints
      .map((point) => ({ lat: Number(point && point.lat), lng: Number(point && point.lng) }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
    const path = Core.buildTerrainTracePath(trace);
    const segmentCount = Math.max(0, path.length - 1);
    const profile = segmentCount > 0
      ? Core.buildTerrainTraceElevationProfile(trace, terrainElevationGrid, activeTerrainDetailPatchLayer(), terrainDetailTiles)
      : null;
    const reliefMeters = profile && Number.isFinite(Number(profile.reliefMeters))
      ? Math.round(Number(profile.reliefMeters))
      : 0;
    const bounds = trace && trace.sourceTileBounds;
    let coveragePercent = 0;
    if (bounds && usablePoints.length) {
      const latValues = usablePoints.map((point) => point.lat);
      const lngValues = usablePoints.map((point) => point.lng);
      const latSpan = Math.max(...latValues) - Math.min(...latValues);
      const lngSpan = Math.max(...lngValues) - Math.min(...lngValues);
      const tileLatSpan = Math.max(0, Number(bounds.maxLat) - Number(bounds.minLat));
      const tileLngSpan = Math.max(0, Number(bounds.maxLng) - Number(bounds.minLng));
      const latCoverage = tileLatSpan > 0 ? latSpan / tileLatSpan : 0;
      const lngCoverage = tileLngSpan > 0 ? lngSpan / tileLngSpan : 0;
      coveragePercent = Math.round(Core.clamp(Math.max(latCoverage, lngCoverage) * 100, 0, 100));
    }
    const quality = segmentCount >= 2 && coveragePercent >= 15
      ? "ready"
      : segmentCount >= 1
        ? "minimal"
        : "draft";
    return {
      pointCount: rawPoints.length,
      segmentCount,
      reliefMeters,
      coverageText: `${coveragePercent}%`,
      quality,
    };
  }

  function updateManualTraceUi() {
    const summary = manualTraceQualitySummary(manualTraceDraft);
    const pointCount = summary.pointCount;
    const sourceTile = manualTraceDraft.sourceTileId
      ? getTerrainDetailTileItems().find((tile) => tile.id === manualTraceDraft.sourceTileId)
      : null;
    const sourceLabel = sourceTile ? ` · ${terrainTileLabel(sourceTile)}` : "";
    container.dataset.manualTracePointCount = String(pointCount);
    container.dataset.manualTraceSegmentCount = String(summary.segmentCount);
    container.dataset.manualTraceReliefMeters = String(summary.reliefMeters);
    container.dataset.manualTraceCoverageText = summary.coverageText;
    container.dataset.manualTraceEditMode = String(manualTraceEditMode);
    container.dataset.manualTraceReady = String(pointCount >= 2);
    container.dataset.manualTraceSuggestionCount = String(manualTraceSuggestionCount);
    container.dataset.manualTraceRadialSuggestionCount = String(manualTraceRadialSuggestionCount);
    container.dataset.manualTraceLineBandSuggestionCount = String(manualTraceLineBandSuggestionCount);
    container.dataset.manualTracePolygonMaskSuggestionCount = String(manualTracePolygonMaskSuggestionCount);
    container.dataset.manualTraceSourceTileId = manualTraceDraft.sourceTileId || "";
    container.dataset.manualTraceSeedKind = manualTraceDraft.seedKind || "";
    container.dataset.manualTraceClosed = String(Boolean(manualTraceDraft.closed));
    container.dataset.manualTraceSimplifiedPointCount = String(Number(manualTraceDraft.simplifiedPointCount) || 0);
    container.dataset.manualTraceSmoothedPointCount = String(Number(manualTraceDraft.smoothedPointCount) || 0);
    container.dataset.manualTraceSelectedPointIndex = selectedManualTracePointIndex === null ? "" : String(selectedManualTracePointIndex);
    container.dataset.manualTraceMovedPointCount = String(manualTraceMovedPointCount);
    container.dataset.manualTraceDeletedPointCount = String(manualTraceDeletedPointCount);
    if (manualTraceStatus) {
      manualTraceStatus.dataset.quality = summary.quality;
      manualTraceStatus.textContent = `临摹草稿：${pointCount} 点${sourceLabel}${manualTraceDraft.closed ? " · 已闭合" : ""} · ${summary.segmentCount} 段 · 起伏 ${formatMeters(summary.reliefMeters)} · 覆盖 ${summary.coverageText}${pointCount >= 2 ? " · 可生成候选" : ""}${manualTraceSuggestionCount ? ` · ${manualTraceSuggestionCount} 候选` : ""}${manualTracePolygonMaskSuggestionCount ? ` · ${manualTracePolygonMaskSuggestionCount} 区域` : ""}`;
    }
    manualTraceBtn.classList.toggle("is-active", manualTraceEditMode);
    manualTraceBtn.setAttribute("aria-pressed", String(manualTraceEditMode));
    generateManualTraceBtn.disabled = pointCount < 2;
    undoManualTraceBtn.disabled = pointCount === 0;
    reverseManualTraceBtn.disabled = pointCount < 2;
    closeManualTraceBtn.disabled = pointCount < 3 || Boolean(manualTraceDraft.closed);
    simplifyManualTraceBtn.disabled = pointCount < 4;
    smoothManualTraceBtn.disabled = pointCount < 3;
    if (deleteManualTracePointBtn) {
      deleteManualTracePointBtn.disabled = selectedManualTracePointIndex === null;
    }
    clearManualTraceBtn.disabled = pointCount === 0;
    syncTerrainWorkflowSummary();
  }

  function addTraceProfileMarker(trace, point, role, colorValue) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return;
    const color = new THREE.Color(colorValue);
    const position = toVector3(Core.latLngToVector3({
      lat: point.lat,
      lng: point.lng,
      radius: terrainRadius(point.lat, point.lng, 0.47),
    }));
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    marker.position.copy(position);
    halo.position.copy(position);
    marker.userData.role = role;
    halo.userData.role = role;
    marker.userData.traceId = trace.id;
    halo.userData.traceId = trace.id;
    marker.userData.elevationMeters = point.elevationMeters;
    halo.userData.elevationMeters = point.elevationMeters;
    terrainTraceProfileMarkerGroup.add(halo, marker);
  }

  function clearTraceProfileMarkers() {
    clearGroup(terrainTraceProfileMarkerGroup);
    updateTraceProfileMarkerDebug();
  }

  function updateTraceProfileMarkerDebug() {
    const roles = terrainTraceProfileMarkerGroup.children
      .map((object) => object.userData && object.userData.role)
      .filter(Boolean);
    const visibleCount = terrainTraceProfileMarkerGroup.children
      .filter((object) => object.visible)
      .length;
    worldGroup.userData.terrainTraceProfileMarkerCount = terrainTraceProfileMarkerGroup.children.length;
    worldGroup.userData.terrainTraceProfileMarkerRoles = roles;
    worldGroup.userData.terrainTraceProfileMarkerVisibleCount = visibleCount;
    container.dataset.traceProfileMarkerCount = String(terrainTraceProfileMarkerGroup.children.length);
    container.dataset.traceProfileMarkerVisibleCount = String(visibleCount);
    container.dataset.traceProfileMarkerRoles = roles.join(",");
  }

  function hideTraceProfile() {
    if (!traceProfile) return;
    traceProfile.hidden = true;
    traceProfile.innerHTML = "";
    container.dataset.manualTraceProfileVisible = "false";
    container.dataset.manualTraceProfileSampleCount = "0";
  }

  function suggestionGroupLabel(group) {
    if (!group) return "候选补丁";
    const trace = terrainTraceGuides && Array.isArray(terrainTraceGuides.traces)
      ? terrainTraceGuides.traces.find((item) => item.id === group.id)
      : null;
    return trace && trace.label ? trace.label : group.label || group.id;
  }

  function suggestionGroupCenter(group) {
    const patches = group && Array.isArray(group.patches) ? group.patches : [];
    const centers = patches
      .map((patch) => patch && patch.center)
      .filter((center) => center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng)));
    if (!centers.length) return null;
    const total = centers.reduce((sum, center) => ({
      lat: sum.lat + Number(center.lat),
      lng: sum.lng + Number(center.lng),
    }), { lat: 0, lng: 0 });
    return {
      lat: total.lat / centers.length,
      lng: total.lng / centers.length,
    };
  }

  function suggestionGroupMetric(group) {
    const patches = group && Array.isArray(group.patches) ? group.patches : [];
    const deltas = Array.from(new Set(
      patches
        .map((patch) => Math.round(Number(patch && patch.deltaMeters) || 0))
        .filter((value) => value !== 0)
    ));
    if (!deltas.length) return "0 m 草稿";
    if (deltas.length === 1) {
      return `${deltas[0] > 0 ? "+" : ""}${deltas[0]} m 草稿`;
    }
    return deltas
      .map((value) => `${value > 0 ? "+" : ""}${value} m`)
      .join(" / ");
  }

  function suggestionGroupShapeText(group) {
    const radial = Number(group && group.radialCount) || 0;
    const lineBand = Number(group && group.lineBandCount) || 0;
    const polygonMask = Number(group && group.polygonMaskCount) || 0;
    const parts = [];
    if (radial) parts.push(`${radial} 点`);
    if (lineBand) parts.push(`${lineBand} 线`);
    if (polygonMask) parts.push(`${polygonMask} 面`);
    return parts.length ? parts.join(" / ") : "0 点";
  }

  function suggestionGroupSourceText(group) {
    if (!group) return "未绑定图块";
    const source = group.sourceTileLabel || group.sourceTileId;
    if (!source) return "未绑定图块";
    return group.sourceTileDataset ? `${source} · ${group.sourceTileDataset}` : source;
  }

  function suggestionGroupReviewText(group) {
    const status = group && group.reviewStatus ? group.reviewStatus : "draft";
    if (status === "mixed") return "审查状态：混合";
    if (status === "approved") return "审查状态：已审";
    if (status === "reviewed") return "审查状态：已复核";
    return "审查状态：草稿";
  }

  function formatDeltaMeters(value) {
    const rounded = Math.round(Number(value) || 0);
    return `${rounded > 0 ? "+" : ""}${rounded} m`;
  }

  function formatMeters(value) {
    return `${Math.round(Number(value) || 0)} m`;
  }

  function formatCoord(value, positive, negative) {
    return `${Math.abs(value).toFixed(2)}°${value >= 0 ? positive : negative}`;
  }

  function terrainBlockById(blockId) {
    return Core.FIVE_TERRAIN_BLOCKS.find((block) => block.id === blockId) || null;
  }

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    applyRendererPixelRatio();
    renderer.setSize(width, height, false);
  }

  function applyRendererPixelRatio() {
    const maxPixelRatio = interactionPixelRatioActive ? INTERACTION_PIXEL_RATIO_MAX : IDLE_PIXEL_RATIO_MAX;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    container.dataset.renderQualityMode = interactionPixelRatioActive ? "interaction" : "idle";
    container.dataset.rendererPixelRatio = pixelRatio.toFixed(2);
    if (appliedRendererPixelRatio === pixelRatio) return;
    appliedRendererPixelRatio = pixelRatio;
    renderer.setPixelRatio(pixelRatio);
  }

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const nowMs = elapsed * 1000;
    const delta = clock.getDelta();
    if (state.autoRotate && !pointer.down) rotationTarget.y += delta * 0.075;

    camera.position.z += (state.zoom - camera.position.z) * 0.08;
    worldGroup.rotation.x += (rotationTarget.x - worldGroup.rotation.x) * 0.08;
    worldGroup.rotation.y += (rotationTarget.y - worldGroup.rotation.y) * 0.08;
    const cameraInteractionActive = isCameraInteractionActive();

    if (shouldRunInteractionUpdate(nowMs, lastHotspotPulseUpdateMs, INTERACTION_HOTSPOT_UPDATE_INTERVAL_MS, cameraInteractionActive)) {
      lastHotspotPulseUpdateMs = nowMs;
      updateHotspotMarkerPulse(elapsed);
    }

    if (shouldRunInteractionUpdate(nowMs, lastMotionEffectUpdateMs, INTERACTION_EFFECT_UPDATE_INTERVAL_MS, cameraInteractionActive)) {
      lastMotionEffectUpdateMs = nowMs;
      updateWaterMotion(elapsed);
      updateLakeMotion(elapsed);
      updateWeatherCloudMotion(elapsed);
    }
    if (shouldRunInteractionUpdate(nowMs, lastScreenProjectionUpdateMs, INTERACTION_SCREEN_UPDATE_INTERVAL_MS, cameraInteractionActive)) {
      lastScreenProjectionUpdateMs = nowMs;
      updateHotspotScreens();
      updateTerrainBlockLabels(cameraInteractionActive);
    }
    if (shouldUpdateCityLabels(nowMs, cameraInteractionActive)) {
      lastCityLabelUpdateMs = nowMs;
      updateCityLabels(cameraInteractionActive);
    }
    renderer.render(scene, camera);
  }

  function updateHotspotMarkerPulse(elapsed) {
    hotspotMeshes.forEach((group, id) => {
      const selected = id === state.selectedHotspotId;
      const hovered = id === state.hoveredHotspotId;
      const pulse = 1 + Math.sin(elapsed * 3.1 + group.position.x) * 0.07;
      group.scale.setScalar((selected ? 1.48 : hovered ? 1.24 : 1) * pulse);
    });
  }

  function updateWaterMotion(elapsed) {
    waterFlowMarkers.forEach((entry) => {
      const progress = (entry.phase + elapsed * entry.speed) % 1;
      entry.marker.position.copy(entry.curve.getPointAt(progress));
      entry.marker.scale.setScalar(1 + Math.sin(elapsed * 4.2 + entry.phase * 10) * 0.12);
    });
    waterFlowDirectionArrows.forEach((entry) => {
      const pulse = 1 + Math.sin(elapsed * 3.6 + entry.phase * 9) * 0.1;
      entry.arrow.scale.setScalar((entry.arrow.userData.baseScale || 1) * pulse);
    });
  }

  function updateLakeMotion(elapsed) {
    lakeReferenceMeshes.forEach((mesh, index) => {
      if (!mesh.material) return;
      const baseOpacity = Number(mesh.userData.baseOpacity) || 0.42;
      mesh.material.opacity = baseOpacity + Math.sin(elapsed * 1.7 + index * 0.41) * 0.06;
    });
    lakeRippleMarkers.forEach((entry) => {
      const progress = (entry.phase + elapsed * entry.speed) % 1;
      if (entry.centerPosition && entry.driftVector) {
        entry.marker.position.copy(entry.centerPosition).add(
          entry.driftVector.clone().multiplyScalar((progress - 0.5) * 2)
        );
      }
      entry.marker.scale.setScalar(0.78 + progress * 0.55);
      entry.marker.children.forEach((ring, index) => {
        if (!ring.material) return;
        const baseOpacity = Number(ring.userData.baseOpacity) || 0.16;
        ring.material.opacity = baseOpacity * (1 - progress * 0.72) * (index === 0 ? 1 : 0.72);
      });
    });
  }

  function updateWeatherCloudMotion(elapsed) {
    weatherCloudParticles.forEach((particle) => {
      const basePoint = particle.userData.basePoint;
      if (!basePoint) return;
      const driftDegrees = Number(particle.userData.driftDegrees) || 1.1;
      const phase = Number(particle.userData.phase) || 0;
      const speed = Number(particle.userData.speed) || 0.014;
      const heading = Number(particle.userData.heading) || 90;
      const progress = ((phase + elapsed * speed) % 1) - 0.5;
      const point = movePointByHeading(basePoint, heading, progress * driftDegrees);
      particle.position.copy(toVector3(Core.latLngToVector3({
        lat: point.lat,
        lng: point.lng,
        radius: terrainRadius(point.lat, point.lng, WEATHER_CLOUD_LIFT),
      })));
      particle.scale.setScalar(1 + Math.sin(elapsed * 1.8 + phase * 10) * 0.12);
    });
  }

  function updateHotspotScreens() {
    hotspotScreen.length = 0;
    hotspotMeshes.forEach((group, id) => {
      group.getWorldPosition(hotspotProjectionPosition);
      hotspotProjectionPosition.project(camera);
      const site = group.userData.hotspot;
      hotspotScreen.push({
        ...site,
        id,
        screenX: ((hotspotProjectionPosition.x + 1) / 2) * renderer.domElement.clientWidth,
        screenY: ((-hotspotProjectionPosition.y + 1) / 2) * renderer.domElement.clientHeight,
        visible: group.visible && hotspotProjectionPosition.z > -1 && hotspotProjectionPosition.z < 1,
      });
    });
  }

  function shouldProjectCityLabel(city, group, markerState, cityLabelDetail) {
    const isLocalTerrainCity = Boolean(markerState && markerState.isLocalTerrainCity);
    const isSelectedTerrainCity = Boolean(markerState && markerState.isSelectedTerrainCity);
    return Boolean(
      markerState &&
      markerState.visible &&
      group &&
      group.visible &&
      layerVisibility.cities !== false &&
      !markerState.hiddenByTileFocus &&
      (isSelectedTerrainCity || shouldShowCityLabelForDistance(city, cityLabelDetail, isLocalTerrainCity))
    );
  }

  function terrainBlockLabelDetailLevel(viewDistance) {
    return terrainDetailLodLevel(viewDistance);
  }

  function shouldShowTerrainBlockLabel(block, detailLevel) {
    const blocksLayerVisible = layerVisibility.blocks !== false;
    if (!block || !blocksLayerVisible) {
      return false;
    }
    const tier = Number(block.tier) || 3;
    if (detailLevel === "far") {
      return tier <= 2;
    }
    return tier <= 3;
  }

  function terrainBlockLabelProjectionCameraKey(detailLevel) {
    return [
      detailLevel,
      layerVisibility.blocks === false ? "blocks-off" : "blocks-on",
      Math.round(camera.position.z / CITY_LABEL_PROJECTION_Z_BUCKET),
      Math.round(worldGroup.rotation.x / CITY_LABEL_PROJECTION_ROTATION_BUCKET),
      Math.round(worldGroup.rotation.y / CITY_LABEL_PROJECTION_ROTATION_BUCKET),
      renderer.domElement.clientWidth,
      renderer.domElement.clientHeight,
    ].join("|");
  }

  function applyTerrainBlockLabelProjectionState(state) {
    const visibleIds = [];
    const visibleNames = [];
    const entries = state && Array.isArray(state.entries) ? state.entries : [];
    terrainBlockLabelElements.forEach((label, blockId) => {
      label.dataset.visible = "false";
      label.hidden = true;
    });
    entries.forEach((entry) => {
      const label = terrainBlockLabelElements.get(entry.id);
      if (!label) return;
      if (!entry.visible) {
        return;
      }
      label.dataset.visible = "true";
      label.dataset.screenX = String(entry.screenX);
      label.dataset.screenY = String(entry.screenY);
      label.hidden = false;
      label.style.transform = `translate3d(${entry.screenX}px, ${entry.screenY}px, 0) translate(-50%, -50%)`;
      visibleIds.push(entry.id);
      visibleNames.push(entry.name);
    });
    const visibleCount = visibleIds.length;
    container.dataset.terrainBlockLabelVisibleCount = String(visibleCount);
    container.dataset.terrainBlockLabelVisibleIds = visibleIds.join(",");
    container.dataset.terrainBlockLabelVisibleNames = visibleNames.join(",");
    container.dataset.terrainBlockLabelDetailLevel = state ? state.detailLevel || "" : "";
    container.dataset.terrainBlockLabelProjectionCacheHits = String(terrainBlockLabelProjectionCacheHitCount);
  }

  function updateTerrainBlockLabels(cameraInteractionActive = false) {
    const detailLevel = terrainBlockLabelDetailLevel(camera.position.z);
    const projectionCacheKey = terrainBlockLabelProjectionCameraKey(detailLevel);
    container.dataset.terrainBlockLabelCount = String(Core.FIVE_TERRAIN_BLOCKS.length);
    container.dataset.terrainBlockLabelViewDistance = camera.position.z.toFixed(2);
    if (terrainBlockLabelProjectionCacheState && terrainBlockLabelProjectionCacheKey === projectionCacheKey) {
      terrainBlockLabelProjectionCacheHitCount += 1;
      applyTerrainBlockLabelProjectionState(terrainBlockLabelProjectionCacheState);
      container.dataset.terrainBlockLabelProjectionMode = "reused";
      return;
    }
    const entries = Core.FIVE_TERRAIN_BLOCKS.map((block) => {
      if (!shouldShowTerrainBlockLabel(block, detailLevel) || !block.center) {
        return { id: block.id, name: block.name, visible: false };
      }
      terrainBlockLabelProjectionPosition.set(...Core.latLngToVector3({
        lat: block.center.lat,
        lng: block.center.lng,
        radius: terrainRadius(block.center.lat, block.center.lng, TERRAIN_BLOCK_LIFT + 0.035),
      }));
      terrainBlockLabelProjectionPosition.applyMatrix4(worldGroup.matrixWorld);
      terrainBlockLabelProjectionPosition.project(camera);
      const visible = terrainBlockLabelProjectionPosition.z > -1 && terrainBlockLabelProjectionPosition.z < 1;
      return {
        id: block.id,
        name: block.name,
        visible,
        screenX: Math.round(((terrainBlockLabelProjectionPosition.x + 1) / 2) * renderer.domElement.clientWidth),
        screenY: Math.round(((-terrainBlockLabelProjectionPosition.y + 1) / 2) * renderer.domElement.clientHeight),
      };
    });
    terrainBlockLabelProjectionCacheKey = projectionCacheKey;
    terrainBlockLabelProjectionCacheState = { detailLevel, entries };
    applyTerrainBlockLabelProjectionState(terrainBlockLabelProjectionCacheState);
    container.dataset.terrainBlockLabelProjectionMode = cameraInteractionActive ? "interaction" : "projected";
  }

  function cityLabelProjectionCameraKey(cityLabelDetail) {
    return [
      cityLabelDetail,
      selectedTerrainTileId || "none",
      layerVisibility.cities === false ? "cities-off" : "cities-on",
      Math.round(camera.position.z / CITY_LABEL_PROJECTION_Z_BUCKET),
      Math.round(worldGroup.rotation.x / CITY_LABEL_PROJECTION_ROTATION_BUCKET),
      Math.round(worldGroup.rotation.y / CITY_LABEL_PROJECTION_ROTATION_BUCKET),
      renderer.domElement.clientWidth,
      renderer.domElement.clientHeight,
    ].join("|");
  }

  function shouldReuseCityLabelProjection(cameraInteractionActive, projectionCacheKey) {
    return Boolean(
      cityLabelProjectionCacheState &&
      cityLabelProjectionCacheKey === projectionCacheKey
    );
  }

  function reuseCityLabelProjectionCache(cameraInteractionActive, cityLabelDetail) {
    cityLabelProjectionCacheHitCount += 1;
    const cachedState = cityLabelProjectionCacheState || {};
    const visibleCount = Number(cachedState.visibleCount) || 0;
    cityLabelSkippedWriteCount += visibleCount;
    container.dataset.cityLabelUpdateMode = cameraInteractionActive ? "interaction" : "idle";
    container.dataset.cityLabelDetailLevel = cityLabelDetail;
    container.dataset.cityLabelViewDistance = camera.position.z.toFixed(2);
    container.dataset.cityLabelVisibleCount = String(visibleCount);
    container.dataset.cityLabelSkippedWriteCount = String(cityLabelSkippedWriteCount);
    container.dataset.cityLabelProjectionCandidateCount = String(Number(cachedState.projectionCandidateCount) || 0);
    container.dataset.cityLabelHiddenEarlySkipCount = String(Number(cachedState.hiddenEarlySkipCount) || 0);
    container.dataset.cityLabelProjectionCacheKey = cityLabelProjectionCacheKey;
    container.dataset.cityLabelProjectionCacheHits = String(cityLabelProjectionCacheHitCount);
    container.dataset.cityLabelProjectionCacheMode = "reused";
    return cachedState;
  }

  function updateCityLabels(cameraInteractionActive = false) {
    const selectedTerrainTile = selectedTerrainTileId
      ? getTerrainDetailTileItems().find((tile) => tile.id === selectedTerrainTileId)
      : null;
    const cityLabelDetail = cityLabelDetailLevel(camera.position.z);
    const cityMarkerVisibility = cachedTerrainCityMarkerVisibility(cityLabelDetail, selectedTerrainTile);
    const projectionCacheKey = cityLabelProjectionCameraKey(cityLabelDetail);
    let visibleCount = 0;
    let skippedWriteCount = 0;
    let projectionCandidateCount = 0;
    let hiddenEarlySkipCount = 0;
    container.dataset.cityLabelDetailLevel = cityLabelDetail;
    container.dataset.cityLabelViewDistance = camera.position.z.toFixed(2);
    if (shouldReuseCityLabelProjection(cameraInteractionActive, projectionCacheKey)) {
      return reuseCityLabelProjectionCache(cameraInteractionActive, cityLabelDetail);
    }
    cityLabelElements.forEach((label, cityId) => {
      const group = cityMeshes.get(cityId);
      const city = Core.CHINA_TERRAIN_CITIES.find((item) => item.id === cityId);
      const markerState = cityMarkerVisibility.get(cityId);
      const isLocalTerrainCity = Boolean(markerState && markerState.isLocalTerrainCity);
      const localState = String(isLocalTerrainCity);
      if (label.dataset.localTerrainCity !== localState) {
        label.dataset.localTerrainCity = localState;
        label.classList.toggle("is-local-terrain-city", isLocalTerrainCity);
      }
      const hiddenByTileFocus = Boolean(markerState && markerState.hiddenByTileFocus);
      const isSelectedTerrainCity = Boolean(markerState && markerState.isSelectedTerrainCity);
      if (!shouldProjectCityLabel(city, group, markerState, cityLabelDetail)) {
        hiddenEarlySkipCount += 1;
        if (label.dataset.visible === "false" && label.hidden) {
          skippedWriteCount += 1;
          return;
        }
        label.dataset.visible = "false";
        label.hidden = true;
        return;
      }
      projectionCandidateCount += 1;
      group.getWorldPosition(cityLabelProjectionPosition);
      cityLabelProjectionPosition.project(camera);
      const visible = cityLabelProjectionPosition.z > -1 && cityLabelProjectionPosition.z < 1;
      if (!visible) {
        if (label.dataset.visible === "false" && label.hidden) {
          skippedWriteCount += 1;
          return;
        }
        label.dataset.visible = "false";
        label.hidden = true;
        return;
      }
      const screenX = Math.round(((cityLabelProjectionPosition.x + 1) / 2) * renderer.domElement.clientWidth);
      const screenY = Math.round(((-cityLabelProjectionPosition.y + 1) / 2) * renderer.domElement.clientHeight);
      if (
        label.dataset.visible === "true" &&
        label.dataset.screenX === String(screenX) &&
        label.dataset.screenY === String(screenY)
      ) {
        visibleCount += 1;
        skippedWriteCount += 1;
        return;
      }
      label.dataset.visible = "true";
      label.dataset.screenX = String(screenX);
      label.dataset.screenY = String(screenY);
      label.hidden = false;
      label.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -150%)`;
      visibleCount += 1;
    });
    cityLabelProjectionCacheKey = projectionCacheKey;
    cityLabelProjectionCacheState = { visibleCount, projectionCandidateCount, hiddenEarlySkipCount };
    cityLabelSkippedWriteCount += skippedWriteCount;
    container.dataset.cityLabelUpdateMode = cameraInteractionActive ? "interaction" : "idle";
    container.dataset.cityLabelVisibleCount = String(visibleCount);
    container.dataset.cityLabelSkippedWriteCount = String(cityLabelSkippedWriteCount);
    container.dataset.cityLabelProjectionCandidateCount = String(projectionCandidateCount);
    container.dataset.cityLabelHiddenEarlySkipCount = String(hiddenEarlySkipCount);
    container.dataset.cityLabelProjectionCacheKey = cityLabelProjectionCacheKey;
    container.dataset.cityLabelProjectionCacheHits = String(cityLabelProjectionCacheHitCount);
    container.dataset.cityLabelProjectionCacheMode = "projected";
  }

  function toVector3(values) {
    return new THREE.Vector3(values[0], values[1], values[2]);
  }

  function toRadians(degrees) {
    return (Number(degrees) * Math.PI) / 180;
  }

  function movePointByHeading(point, headingDegrees, distanceDegrees) {
    const heading = toRadians(headingDegrees);
    const lat = Number(point.lat) + Math.cos(heading) * distanceDegrees;
    const lngScale = Math.max(0.28, Math.cos(toRadians(Number(point.lat))));
    const lng = Number(point.lng) + (Math.sin(heading) * distanceDegrees) / lngScale;
    return { lat, lng };
  }
})();
