# China Terrain Atlas

Interactive 3D terrain map prototype focused on China. The current app uses Three.js to render a spherical China terrain surface, real province boundary GeoJSON, major terrain blocks, major river guides, and terrain inspection hotspots.

## Current Terrain Pipeline

- Runtime entry: `index.html`
- Scene code: `world-map.js`
- Pure geography and sampling helpers: `world-map-core.js`
- Data manifest: `data/manifest.json`
- Real province boundaries: `data/raw/geoboundaries-chn-adm1-simplified.geojson`
- Medium DEM grid: `data/terrain/china-srtm90m-medium.json`
- River centerlines: `data/terrain/china-rivers-natural-earth.json` plus `data/terrain/china-supplemental-tributaries.json`
- Lake/coastline references: `data/terrain/china-water-references-natural-earth.json` plus `data/terrain/china-supplemental-water-references.json`
- Local detail patches: `data/terrain/china-detail-patches.json`
- Manual tracing guides: `data/terrain/china-trace-guides.json`
- Draft trace-derived patch suggestions: `data/terrain/china-trace-patch-suggestions.json`

The terrain mesh now samples the SRTM90m height grid first, renders DEM-derived contour segments, then applies local meter-offset detail patches. Detail patches can be radial corrections, line-band corrections traced along a ridge/valley path, or polygon-mask corrections for hand-traced terrain areas with optional edge feathering; each patch is drawn as a visible range outline and marker on the 3D map. The browser renders Natural Earth river centerlines, project-authored missing tributaries, Natural Earth lake/coastline references, and supplemental major lake outlines such as Dianchi Lake and Erhai Lake. It also renders manual tracing guide lines for ridges, basin edges, and valleys. If the DEM file cannot be loaded, or a coordinate is outside the grid, the renderer falls back to the procedural China elevation estimator so the map still renders.

The right-side legend is interactive. It can turn terrain grid, terrain blocks, main water systems, tributary references, lake references, coastline references, borders, DEM contours, local detail patches, manual tracing guide lines, trace-derived candidate patches, and observation points on or off independently. Terrain, main rivers, lake references, and national borders are visible by default; tributaries and other clutter-heavy references stay behind separate toggles. Each local detail patch, tracing guide line, and candidate patch group also has its own control row for hiding/showing and focusing the camera. Selecting a tracing guide now samples a DEM-based elevation profile along the line, reports relief and average elevation, draws a compact profile chart, and marks the high/low profile points directly on the 3D terrain, so ridges, basin edges, and valleys can be reviewed before sculpting. Selecting a candidate patch group expands its individual draft points so each point can be reviewed by coordinate, radius, and meter delta before any hand-sculpted change is promoted. This is intended for terrain inspection and later hand-tracing: isolate the DEM surface, compare contour lines, trace ridges or basin edges, then switch individual local patches on while sculpting specific mountain, basin, valley, or terrain-edge detail.

Tracing guides now have a core conversion path: `buildTerrainTracePatchSuggestions(trace)` converts a ridge, basin-edge, or valley guide into a `terrain-detail-patch-suggestions` layer of radial patch candidates. The browser renders these candidates as a separate "候选补丁" inspection layer grouped by source trace, but they are not sampled by the terrain mesh. Review and tune them before merging any candidate into `data/terrain/china-detail-patches.json`.

To regenerate the draft suggestion file after editing trace guides:

The generator now emits radial and line-band candidates for open traces, and adds polygon-mask candidates when a trace is closed or nearly closed. Manual tracing in the browser uses the same options, so a closed hand-traced area can become a reviewable area mask instead of only separate point patches.

```powershell
node scripts/generate-trace-patch-suggestions.js
```

After reviewing individual candidate points, promote explicit IDs into a separate approved patch file:

```powershell
node scripts/promote-trace-patch-suggestions.js himalaya-main-ridge-sculpt-01 qinling-ridge-sculpt-03
```

This writes `data/terrain/china-approved-detail-patches.json` by default. The browser reads that file as an independent "approved patch" preview layer, so reviewed candidates can be focused, toggled, and inspected without changing the terrain mesh. It does not overwrite `data/terrain/china-detail-patches.json`; copy or merge approved patches into the active file only after visual review.

To import a real Mapzen/Terrarium elevation tile into the local DEM tile layer:

```powershell
npm run terrain:mapzen:tile -- --id=qinling-mapzen-z7 --label="Qinling Mapzen z7" --z=7 --x=102 --y=51
```

The command runs `scripts/import-mapzen-terrain-tile.js`, downloads `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, decodes Terrarium RGB meters, and merges the result into `data/terrain/china-local-dem-tiles.json`. Use `--input=tile.png` to decode a downloaded PNG without a network request, or `--output=.tmp/mapzen-test.json` for a dry-run file before replacing project terrain data.

Current high-resolution Mapzen/Terrarium local DEM coverage includes ten z7 256x256 tiles: Qinling, Sichuan Basin east Wushan, Tian Shan Urumqi-Bogda, Hengduan Dali-Lijiang, Himalaya Everest, Qilian Qinghai, Loess-Ordos, Yungui Karst, Changbai Mountain, and Kunlun-Tarim edge. These tiles load before the older sparse local SRTM tiles in the terrain detail panel, so close-up inspection uses the sharper real elevation data first.

After adding or replacing local DEM tiles, regenerate the lightweight browser index and per-tile files:

```powershell
npm run terrain:dem:split
```

The app loads `data/terrain/china-local-dem-tile-index.json` at startup and fetches each full tile from `data/terrain/local-dem-tiles/*.json` on demand. The older combined `china-local-dem-tiles.json` stays as the editable source layer and as a fallback if the index is missing.

If Node is not on `PATH`, use the bundled Node runtime shown in the Verification section.

## Local Preview

For browser preview:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/index.html
```

The old class-management source files, mobile wrappers, and stale build output have been removed. The active app surface is the web/Electron China terrain atlas.

If Python is not on `PATH`, use the bundled runtime under:

```text
C:\Users\王号哲\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
```

## Verification

Use bundled Node when `node` is not on `PATH`:

```powershell
$node = "C:\Users\王号哲\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
& $node --test world-map-core.test.js geodata.test.js
& $node --check main.js
& $node --check world-map-core.js
& $node --check world-map.js
& $node --check geodata.test.js
& $node --check scripts/generate-trace-patch-suggestions.js
& $node --check scripts/promote-trace-patch-suggestions.js
```

## Next Data Work

1. Replace the low-resolution SRTM sample grid with a denser GeoTIFF-derived DEM.
2. Continue expanding local-detail patches for later hand-sculpted or TopoExport-derived terrain details, using radial, line-band, and polygon-mask formats where each terrain feature needs different control.
3. Review trace-derived patch suggestions and promote selected candidates into named patch groups or masks where hand-sculpting needs more control than radial patches.
4. Merge contour segments into smoother contour paths once the DEM grid is denser.
5. Add South China Sea island and inset references beyond the ADM1 land mask.
6. Continue improving river and lake guide geometry where Natural Earth is too sparse for local terrain tracing.
