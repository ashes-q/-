# 3D Interactive Terrain Map Next Steps

## Saved State

- The map remains focused on China terrain and local DEM inspection.
- High-resolution terrain tile buttons now show compact Surface, Refs, Stage, and Cache readiness chips, so the operator can see cached, live, pending, and idle tile state before clicking.
- High-resolution DEM tile clicks now render the main terrain surface first, then defer heavy reference layers such as contours, boundaries, water references, and automatic trace guides to the next frame.
- City markers are distance-aware: close views emphasize cities inside the inspected DEM tile, mid/far views reduce label density.
- The view control panel now exposes the current DEM detail density state. Auto follows observation distance, Clean forces far LOD, and Fine forces near LOD.
- The control console now has a compact workflow summary for View, Layers, DEM, and Trace state, so the operator can scan the current 3D map workflow before opening deeper controls.
- Workflow summary chips are now actionable: View focuses the view controls, Layers applies the active LOD recipe, DEM brings the terrain tile panel into focus, and Trace can start the selected tile tracing workflow.
- The smoke flow now starts selected-tile tracing through the Trace workflow chip, so the top workflow summary is verified as a real entry point rather than only a status strip.
- The view control panel now has Far, Mid, and Near observation presets. They switch back to Auto density, move the camera to the intended terrain scale, apply the matching LOD layer recipe, and expose the active preset in runtime state for smoke verification.
- Observation presets now also apply focused layer stacks: Far hides city/detail clutter while keeping province shape and major water, Mid opens prefecture/city context while keeping DEM contours hidden, and Near restores DEM contours, local water, and city markers for close inspection.
- The view control panel now explains the current LOD intent: far view favors province shape and major water, mid view favors prefecture/city context, and near view favors DEM surface, contours, local water, and city markers.
- The view control panel now includes an LOD readiness summary with the current near/mid/far mode, active layer count, and missing layer count before the operator applies the recipe.
- The view control panel now also renders the current LOD layer recipe as compact chips, so the control surface shows which map layers belong to the active far/mid/near observation mode. Chips are bound to real layer visibility and mute themselves when a recipe layer is currently disabled.
- Toggleable LOD recipe chips now act as direct layer shortcuts; for example, clicking the near-view Contours chip opens the contour layer without digging into the detailed layer list.
- The view control panel now has an Apply LOD recipe action that enables every toggleable layer in the current far/mid/near recipe at once, so close DEM inspection can quickly open contours, local water, and city markers together.
- The LOD recipe action now reports active/total layer counts and missing layer ids, so the operator can see whether the current observation mode is fully applied before tracing a DEM tile.
- DEM detail LOD refresh is guarded so zooming inside the same near/mid/far tier updates the status text without rebuilding heavy reference-layer visibility.
- DEM tile reference-layer cache now rejects incomplete cache entries; contours, boundaries, water references, and trace guides must all be generated for the same tile before a cached restore is allowed.
- DEM inspect state now exposes the selected tile's local prefecture-city context in both runtime state and a visible compact status line, including city labels, city names, province names, and summaries such as "陕西 | 汉中 / 安康".
- DEM inspect state also exposes a compact pipeline line for Surface, Refs, and Cache state so tomorrow's performance work can tell whether a tile is live, pending, or restored from cache.
- DEM tile selection now defers the heavy selected-panel rebuild to the next animation frame, so the click path can update inspect status first instead of rebuilding trace summaries, profiles, and tile buttons synchronously.
- DEM tile reference layers now generate as a staged animation-frame queue: contours, boundaries, water references, then trace guides. The runtime exposes the active stage so first-click performance work can distinguish surface-ready from reference-layer progress.
- The DEM pipeline status line now includes the staged reference-layer progress, for example Stage ready 4/4, so the control console shows what the terrain worker is doing instead of only showing a generic Refs state.
- The DEM pipeline also renders compact status chips for Surface, Refs, Stage, and Cache so the operator can scan tile readiness without parsing a long status sentence.
- Manual tracing keeps source DEM tile provenance and rejects points outside the selected tile bounds.
- Candidate patch bundles can be previewed as temporary approved terrain corrections without writing files.
- DEM tile tracing aid data is exposed for later hand-detail work: readiness, contour density, reference layer count, priority, and guide kinds.
- Close-up DEM tile surfaces now expose realistic terrain color bands in runtime state. A selected tile can report Lowland, Foothill, Mountain, and Alpine bands, so visual terrain color can be tested instead of only inspected by eye.
- The DEM tile panel now includes a compact selected-tile workflow inspector. It keeps the tile label, terrain color bands, province/city context, surface readiness, reference readiness, and trace readiness beside the tile buttons so the operator can see the selected region's state without scrolling back to the top of the console.
- Close-up DEM tile surfaces now add tile-local slope shading. The selected Qinling tile exposes a verified slope shade range from 0.680 to 1.280, giving ridges and valleys stronger local light/dark relief at inspection distance.
- Close-up DEM tile surfaces now blend their edges back into the base DEM surface. The selected Qinling tile exposes a verified edge blend range from 0.002 to 1.000, so tile borders can transition toward the national terrain surface instead of ending as hard patches.
- The selected DEM tile panel now includes a compact render QA strip. It shows mesh size, terrain bands, slope shade range, edge blend range, and reference-layer readiness directly under the workflow inspector.
- Electron smoke now captures render QA for three representative high-detail regions: Qinling, Wushan, and Hengduan. This gives tomorrow's visual tuning a comparable baseline instead of judging each tile by memory.
- Render QA now also reports an actionable verdict. `pass` means mesh density, terrain bands, slope shade, edge blend, and reference layers all meet the current tuning baseline. `inspect` or `loading` flags name the specific area to tune next, such as Mesh, Bands, Slope, Edge, or Refs.
- The selected DEM tile panel now has visual tuning presets for close inspection. Natural keeps the current baseline, Relief increases tile-local slope shading for stronger ridge/valley read, and Soft edge widens tile-edge blending so close-up DEM patches transition more gently into the national surface.
- Cached DEM tile switching now defers the layer-summary refresh to the next frame, keeping surface restoration on the short path. The latest smoke run restored the cached Qinling surface in 73.20 ms.

## Tomorrow Direction

1. Make the map interaction feel like a real 3D terrain workstation:
   - Keep zoom, rotation, and tile selection responsive even when DEM reference layers are loading.
   - Add a clear inspect state for the selected DEM tile, including current province/city context.
   - Let close-up observation continue to shrink the camera distance, but cap label and boundary density by distance.

2. Rebuild the control console around actual map work:
   - Continue grouping controls by task: view, terrain detail, boundaries, water, city labels, DEM inspection, and patch preview.
   - Keep high-frequency controls as compact buttons or segmented controls instead of long text blocks.
   - Show only the status that helps the current operation, such as selected tile, detail level, loading state, and cache state.

3. Make terrain detail readable at different scales:
   - Use province boundaries, prefecture boundaries, rivers, contours, and city labels as one coordinated map layer, not stacked clutter.
   - Keep far view clean: province shape, major terrain color, major water.
   - Keep mid view informative: prefecture boundaries, major cities, main rivers.
   - Keep near view detailed: DEM surface, contours, city positions, water references, trace guides.

4. Improve realism of the China terrain surface:
   - Continue replacing blurry texture-like effects with DEM-driven relief and region-specific terrain colors.
   - Use altitude, slope, water proximity, and administrative region to color terrain more naturally.
   - Preserve the current China-first scope before expanding to surrounding countries or a full globe dataset.
   - Treat local DEM tiles as the main high-detail truth source: first make each tile visually clear, then blend tile edges so close-up inspection does not feel patched together.

5. Continue performance hardening:
   - Keep smoke interactions for the terrain density buttons: Auto, Clean, and Fine.
   - Keep reclicking an inspected DEM tile near-instant by reusing the cached surface and deferred reference layers.
   - Avoid rebuilding labels, contours, and boundary geometry when only camera distance or selection highlight changes.

## Tonight Design Note

The next version should feel less like a stack of optional overlays and more like a 3D terrain instrument. The map should decide what belongs on the surface by observation distance: far view for national terrain shape, mid view for province and prefecture relationships, and near view for DEM tile relief, contour confirmation, water references, and city context. The control console should expose those decisions as simple modes and status chips, while keeping expensive reference generation staged and cache-aware.

Tomorrow's best first task is to make the selected DEM tile the center of the workflow: show its terrain bands, city/province context, reference-layer readiness, and trace readiness in one compact inspector. After that, improve close-up rendering tile by tile by adding slope-aware shading, smoother tile-edge blending, and distance-gated labels.

## Latest Progress

The selected DEM tile workflow inspector is now implemented and covered by static tests plus Electron smoke. The verified Qinling tile summary reports Lowland, Foothill, Mountain, and Alpine bands, Shaanxi province context, Hanzhong and Ankang city context, ready surface/reference layers, and ready/high trace state. Close-up DEM tile rendering also uses local slope shade and edge blending, with smoke coverage for both rendered ranges.

The render QA strip is now available in the tile panel and smoke captures a multi-region baseline:

- Qinling `qinling-mapzen-terrarium-z7-102-51`: 5184 verts, 5041 cells, Lowland/Foothill/Mountain/Alpine, slope 0.680-1.280, edge 0.002-1.000.
- Wushan `sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52`: 5184 verts, 5041 cells, Lowland/Foothill/Mountain, slope 0.680-1.280, edge 0.002-1.000.
- Hengduan `hengduan-dali-lijiang-mapzen-terrarium-z7-99-53`: 5184 verts, 4911 cells, Mountain/Alpine/Foothill, slope 0.680-1.280, edge 0.002-1.000.

Each baseline tile currently reports `Verdict pass` and `Flags none`. If later visual tuning makes one tile look weak, use these flags to separate data quality problems from styling problems before changing constants.

The visual tuning presets should be used after QA passes:

- Use `Natural` as the default terrain read.
- Use `Relief` when DEM ridges and valleys look too flat at close range.
- Use `Soft edge` when a high-detail tile still reads like a rectangular patch against the surrounding terrain.

Next, continue on terrain readability itself: visually inspect the blended Qinling, Wushan, and Hengduan tiles, then tune blend width and slope shade gains if any high-detail tile still looks like a separate patch.

## Recommended Next Step

Continue with the control console and LOD behavior together. This gives the biggest visible improvement: the map becomes easier to understand, and the expensive terrain detail only appears when the camera is close enough to need it. After that, continue improving real terrain rendering tile by tile.

## 2026-07-05 Night Handoff

The project is saved at a stable China-first terrain-map checkpoint. The current build has a working 3D terrain surface, observation-distance layer behavior, high-detail DEM tiles, staged reference-layer loading, render QA, visual presets, and cached tile restoration. The next phase should not add more loose overlays first; it should make the selected terrain area feel like a precise 3D inspection object.

Recommended product direction:

1. Build the map around three clear interaction modes:
   - Explore: rotate and zoom the China terrain cleanly with province outlines, major water, and coarse elevation color.
   - Locate: show prefecture-city positions and boundaries only when the camera is near enough to read them.
   - Inspect: when a high-detail DEM tile is selected, prioritize real relief, contour/water references, city context, and trace tools.

2. Make the selected DEM tile the center of the console:
   - Show tile name, province/city context, altitude bands, slope/edge QA, surface cache state, and reference-layer progress in one compact inspector.
   - Add a recommended visual preset based on QA state, so the console can suggest Natural, Relief, or Soft edge instead of leaving the choice entirely manual.
   - Keep an Apply button for the recommendation, and verify it does not reload terrain data unnecessarily.

3. Reduce click-time work on high-detail terrain:
   - On tile click, render only the core surface immediately.
   - Defer labels, contours, water references, boundaries, and trace guides into staged frames.
   - Cache generated reference layers per tile and avoid rebuilding them when only the view distance changes.

4. Improve terrain realism in visible layers:
   - Use DEM altitude and slope as the primary truth, not a blurry texture effect.
   - Color different terrain types with restrained regional palettes: basin, plains, mountains, plateau, alpine.
   - Blend local DEM tiles into the national terrain surface so no tile looks like a rectangular patch.

5. Keep the console simpler:
   - Replace long lists with task groups: View, Layers, Terrain Detail, Cities, Water, Boundaries, Trace.
   - Use distance-aware defaults so the operator does not need to manually hide every layer.
   - Keep status chips visible only when they help diagnose the current action.

Best first task tomorrow:

Add the selected-tile visual recommendation row under the DEM render QA strip. This is small, testable, and useful: it ties the current QA metrics to an actual operator decision. After that, continue performance work on the high-detail tile click path and near-distance label behavior.

## 2026-07-05 Continuation Progress

The selected DEM tile visual recommendation row is implemented under the render QA strip. It reads the same QA metrics used by the render verdict:

- `Natural` is recommended when the selected tile has a passing baseline.
- `Relief` is reserved for weak local slope read.
- `Soft edge` is reserved for suspect edge blending.
- Loading or missing tile state stays pending instead of forcing a style decision.

The runtime now exposes `terrainTileVisualRecommendedPreset`, `terrainTileVisualRecommendedLabel`, `terrainTileVisualRecommendationReason`, `terrainTileVisualRecommendationText`, and `terrainTileVisualRecommendationApplied`. The recommendation button applies the suggested preset through the existing visual preset pipeline, so it does not introduce a separate rendering path.

Latest verified Qinling smoke state:

- Recommendation: `Natural`.
- Reason: `QA pass baseline`.
- Render QA: `Verdict pass`, `Flags none`, slope `0.680-1.280`, edge `0.002-1.000`.
- Cached return: `84.30 ms`.

## 2026-07-05 Click Path Progress

The cached DEM tile switch path no longer clears the DEM inspector to overview while it is canceling the previous reference-layer frame. That previous clear caused an unnecessary workflow/QA/button DOM refresh during the same click setup, before the cached surface could be restored. `cancelTerrainTileReferenceLayerFrame` now accepts `deferInspectSync`, and tile surface refreshes use it when a real tile is being selected.

Latest verified smoke state:

- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `60.00 ms`.
- Cached return surface ready: `true`.
- Render QA: `Verdict pass`, `Flags none`.
- Visual recommendation: `Natural`, reason `QA pass baseline`.

Next best task:

Continue reducing high-detail tile click cost. The next useful step is to give cached reference-layer restore its own lightweight debug sync, so the cache restore frame does not also rebuild the full selected panel unless the user is still on that tile and the reference layers have actually changed.

## 2026-07-05 Reference Cache Progress

Cached reference-layer restore now has a lighter path:

- It restores cached contours, boundaries, water references, and trace guides without directly rebuilding the full selected panel.
- It refreshes DEM inspector and render QA immediately after cached refs are restored, so QA no longer remains stuck on `Refs loading`.
- It preserves the target tile's reference-cache entry before caching the outgoing tile. This prevents the LRU cache from evicting the tile that is about to be restored.
- It syncs `selectedTerrainTileId` into `mapCanvas.dataset` during tile focus, before deferred panel refresh runs.
- If the target reference cache is missing, it falls back to staged reference-layer generation instead of marking the tile ready incorrectly.

Latest verified smoke state:

- Same-tile reclick: `0.20 ms`.
- Cached Qinling return: `42.60 ms`.
- Render QA: `Verdict pass`, `Flags none`.
- Visual recommendation: `Natural`, reason `QA pass baseline`.

Next best task:

Continue the click-path work by measuring and reducing the remaining cost between cached surface restore and cached reference restore. The next likely target is city label/marker refresh during near-distance tile switching.

## 2026-07-05 City Label Scheduling Progress

The remaining near-distance tile-switch cost is now reduced by moving city label refreshes out of synchronous layer visibility work.

- `applyLayerVisibility()` no longer calls `updateCityLabels()` directly.
- `scheduleCityLabelUpdate()` coalesces pending city label refreshes into `requestAnimationFrame`.
- Runtime state now exposes `cityLabelUpdateScheduled` so smoke runs can see whether a scheduled label refresh is pending or settled.
- The smoke script records both the sampled scheduled state and a settled state after waiting for the queued frame.

Latest verified state:

- Node tests: 204/204 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.00 ms`.
- Cached Qinling return: `42.60 ms`.
- City labels: near mode, 2 visible labels, `hanzhong,ankang`.
- City label scheduler: sampled `true` during later interaction capture, then settled to `false`.
- Render QA: `Verdict pass`, `Flags none`, `Natural`.

Next best task:

Continue reducing near-distance interaction cost by separating the remaining city marker visibility work from label DOM projection. The marker visibility calculation can likely be cached by detail level plus selected DEM tile id, while DOM label transforms should remain frame-gated.

## 2026-07-05 City Marker Cache Progress

City marker visibility planning is now cached while the observation distance tier, selected DEM tile, selected city, and city layer visibility stay stable.

- `updateCityLabels()` now uses `cachedTerrainCityMarkerVisibility()` instead of recalculating city marker visibility every label refresh.
- Cache keys include detail tier, selected DEM tile id, selected city id, and whether the city layer is enabled.
- Cache hits still sync marker visibility, userData, and debug datasets, but avoid rerunning `Core.planCityObservationVisibility`.
- Runtime state now exposes `cityMarkerVisibilityCacheKey`, `cityMarkerVisibilityCacheHits`, and `cityMarkerVisibilityCacheMisses`.
- Electron smoke records the cache counters so later performance work can tell whether label updates are reusing marker visibility state.

Latest verified state:

- Node tests: 205/205 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `40.20 ms`.
- City marker cache: key `near|qinling-mapzen-terrarium-z7-102-51|none|cities-on`, hits `12`, misses `11`.
- City labels: near mode, visible cities `hanzhong,ankang`, scheduled refresh settled to `false`.
- Render QA: `Verdict pass`, `Flags none`, `Natural`.

Next best task:

Continue the city-label path by reducing label DOM writes themselves. The current cache avoids repeated marker visibility planning; the next gain should come from only projecting visible/local city labels and skipping hidden labels earlier.

## 2026-07-05 Project Save

Tonight's checkpoint should be treated as a saved, stable handoff point. The project is currently a China-first 3D terrain atlas, not a class-management project. The useful working surface is:

- `index.html` and `world-map.html` are the mirrored app entries.
- `world-map.js` owns the Three.js scene, control console, DEM tile workflow, city labels, layer visibility, and animation loop.
- `world-map-core.js` owns reusable terrain/geography calculations.
- `data/terrain/` contains the national DEM grid, local high-detail DEM tiles, rivers, water references, trace guides, and patch data.
- `world-map-core.test.js` and `scripts/verify-patch-console-ui.js` are the main safety net for behavior and browser smoke verification.

Current strongest direction:

Make the map feel like a real 3D terrain inspection instrument. The user should be able to zoom from national shape, into province/prefecture context, and then into a selected high-detail DEM tile without the interface becoming a pile of unrelated overlays. Observation distance should decide how much information is visible.

Tomorrow's implementation order:

1. First reduce the remaining near-distance click stutter.
   - The likely target is city label/marker refresh during high-detail DEM tile switching.
   - Replace synchronous label refreshes from layer-visibility paths with a coalesced animation-frame refresh.
   - Keep city markers distance-aware, but avoid DOM writes while the tile click path is restoring cached surfaces and reference layers.

2. Then sharpen the 3D interaction model.
   - Keep three operator modes: Explore, Locate, Inspect.
   - Explore: national terrain shape, province boundaries, major water.
   - Locate: prefecture/city relationship when camera distance is close enough.
   - Inspect: selected DEM tile, local relief, contours, water references, city context, and trace tools.

3. Then improve terrain realism tile by tile.
   - Continue using DEM altitude and slope as the main visual truth.
   - Tune Qinling, Wushan, and Hengduan first because they already have smoke QA baselines.
   - Make local DEM tiles blend into the national surface so the user sees one terrain system instead of rectangular patches.

4. Keep the control console quieter.
   - Keep controls grouped by View, Layers, Terrain Detail, Cities, Water, Boundaries, Trace.
   - Prefer compact mode buttons and status chips over long explanatory text.
   - Show status only when it helps the current operation: selected tile, distance mode, layer recipe, cache state, reference-layer stage, and QA verdict.

Design thought for tomorrow:

The next visible leap should come from making the camera distance, selected tile, and console state work as one system. When the user zooms out, the map should read as China terrain. When the user moves closer, administrative and city context should appear only where it is readable. When the user clicks a high-detail terrain region, the app should behave like an inspector: surface first, references staged, labels throttled, cache reused, QA visible.

## 2026-07-05 Night Save

This is the saved checkpoint for tomorrow. The latest performance work reduced near-distance city label cost by skipping hidden labels before world-position projection.

Latest verified state:

- Node syntax checks: passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: 206/206 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `14.60 ms`.
- City label projection candidates: `2`.
- Hidden city labels skipped before projection: `81`.
- Visible near-distance cities: `hanzhong,ankang`.
- City marker visibility cache: key `near|qinling-mapzen-terrarium-z7-102-51|none|cities-on`, hits `11`, misses `11`.
- Render QA: `Verdict pass`, `Flags none`, `Natural`, Qinling mesh `5184 verts / 5041 cells`.

Tomorrow's direction:

1. Keep hardening close-up interaction first. The current biggest win is to keep high-detail tile clicks on the short path: surface restore first, staged refs after, labels projected only when visible and readable.
2. Turn the map into three coherent operator modes instead of many loose toggles:
   - Explore: national terrain shape, province outline, major water, clean camera motion.
   - Locate: province/prefecture/city relationships appear by distance.
   - Inspect: selected DEM tile, local relief, contours, water references, city context, and trace tools.
3. Make the console clearer around the selected terrain area. The selected tile should keep one compact inspector for tile name, province/city context, QA verdict, visual preset, cache state, and staged reference progress.
4. Improve terrain realism tile by tile, starting with Qinling, Wushan, and Hengduan because they already have QA baselines. Tune altitude color, slope shading, contour readability, and tile-edge blending before expanding scope.
5. Avoid adding more overlay noise. New map detail should be distance-gated, cache-aware, and tied to a real inspection workflow.

Best first task tomorrow:

Refine the close-up city label pipeline one more step: cache DOM label positions while camera movement is small, and only refresh label transforms after the camera settles or crosses an observation-distance tier. Then visually inspect whether Qinling close-up zoom and tile clicking feel smooth enough to move on to terrain realism.

## 2026-07-05 City Label Projection Cache Progress

The close-up city label pipeline now reuses projected DOM label positions while the camera stays inside the same small view bucket.

- The projection cache key includes city label distance tier, selected DEM tile id, city layer state, camera zoom bucket, world rotation bucket, and canvas size.
- `updateCityLabels()` now checks the projection cache before calling `group.getWorldPosition(...)` and `.project(camera)`.
- Hidden labels are still skipped before projection, and visible/local city labels still project normally when the view crosses a bucket.
- Runtime state now exposes `cityLabelProjectionCacheKey`, `cityLabelProjectionCacheHits`, and `cityLabelProjectionCacheMode`.
- Electron smoke now requires at least one projection-cache hit, so a future regression cannot leave the field present but unused.

Latest verified state:

- Node syntax checks: passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: 207/207 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `15.50 ms`.
- City label projection candidates: `2`.
- Hidden city labels skipped before projection: `81`.
- City label projection cache hits: `4`.
- Visible near-distance cities: `hanzhong,ankang`.
- City marker visibility cache hits: `11`.
- Render QA: `Verdict pass`, `Flags none`, `Natural`, Qinling mesh `5184 verts / 5041 cells`.

Next best task:

Move from label-performance work back into visible terrain quality. Start with the Qinling, Wushan, and Hengduan DEM tiles: inspect whether contour density, slope shading, and tile-edge blending read clearly at near distance, then tune one visual variable at a time with the render QA strip as the baseline.

## 2026-07-05 Contour QA Progress

The selected DEM tile render QA now includes contour readability instead of treating contours as a separate debug count.

- The QA strip now shows `Contours N seg / M levels` beside mesh, bands, slope, edge, and refs.
- Runtime state now exposes `terrainTileRenderQaContourSegmentCount`, `terrainTileRenderQaContourLevelCount`, and `terrainTileRenderQaContourReadiness`.
- `terrainTileRenderQaVerdict()` can flag `Contours` when reference layers are ready but the selected tile does not have enough contour geometry to support close terrain reading.
- Electron smoke now captures contour QA for the three baseline terrain regions and requires each one to be `ready`.

Latest verified contour baselines:

- Qinling `qinling-mapzen-terrarium-z7-102-51`: `15446` contour segments, `14` levels, `ready`.
- Wushan `sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52`: `13301` contour segments, `12` levels, `ready`.
- Hengduan `hengduan-dali-lijiang-mapzen-terrarium-z7-99-53`: `13142` contour segments, `11` levels, `ready`.

Latest verified state:

- Node syntax checks: passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: 207/207 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `17.80 ms`.
- Qinling render QA: `Verdict pass`, `Flags none`, `Natural`, `Contours 15446 seg / 14 levels`.
- City label projection cache hits remain present: `4`.

Next best task:

Use the contour QA baseline to tune visible close-up terrain. The first useful visual adjustment is to make contour presentation distance-aware: keep near-view contours readable on selected DEM tiles, but reduce contour dominance when the camera is slightly farther out or when the tile has very dense contour geometry.

## 2026-07-05 Contour Opacity Progress

High-density DEM tile contours now use a density-aware opacity profile so close-up terrain keeps contour reference without the line layer overpowering terrain color bands.

- `terrainDetailTileContourOpacityProfile()` classifies contour density from segment count and level count.
- Dense contour tiles now render at `0.16` opacity.
- The render QA strip now reports contour opacity in the contour chip: `Contours N seg / M levels / O opacity`.
- Runtime state now exposes `terrainTileRenderQaContourOpacity`, `terrainDetailTileContourOpacity`, and `terrainDetailTileContourOpacityMode`.
- Electron smoke now verifies that Qinling, Wushan, and Hengduan all expose contour opacity tuning in multi-region QA.

Latest verified contour opacity baselines:

- Qinling `qinling-mapzen-terrarium-z7-102-51`: `15446` segments, `14` levels, `0.16` opacity, `dense`.
- Wushan `sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52`: `13301` segments, `12` levels, `0.16` opacity.
- Hengduan `hengduan-dali-lijiang-mapzen-terrarium-z7-99-53`: `13142` segments, `11` levels, `0.16` opacity.

Latest verified state:

- Node syntax checks: passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: 207/207 passed.
- Electron smoke: exit code 0.
- Same-tile reclick: `0.00 ms`.
- Cached Qinling return: `20.10 ms`.
- Qinling render QA: `Verdict pass`, `Flags none`, `Natural`, `Contours 15446 seg / 14 levels / 0.16 opacity`.

Next best task:

Run visual inspection screenshots for Qinling, Wushan, and Hengduan at near distance and confirm the lowered contours actually read better on the terrain surface. If the screenshots still look busy, add a distance-based fade in `applyTerrainDetailTileLayerVisibility()` so contours remain strongest only in close Inspect mode.

## 2026-07-05 Final Night Save

This is the checkpoint to resume from tomorrow. No new runtime changes were made after the contour opacity work; the project should continue from the latest verified terrain baseline:

- Core tests last verified at `207/207` passing.
- Syntax checks last passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Electron smoke last exited with code `0`.
- Same-tile reclick was measured at `0.00 ms`.
- Cached Qinling return was measured at `20.10 ms`.
- Qinling render QA was `Verdict pass`, `Flags none`, `Natural`, `Contours 15446 seg / 14 levels / 0.16 opacity`.
- Wushan and Hengduan also expose dense contour opacity baselines at `0.16`.

Tomorrow should start with visual inspection, not another overlay:

1. Capture near-distance screenshots for Qinling, Wushan, and Hengduan.
2. Judge whether the dense contour layer reads as useful terrain reference or still creates visual noise.
3. If contours still dominate, add distance-based contour fade so only close Inspect mode shows the strongest contour reference.
4. Keep `index.html` and `world-map.html` mirrored after any app entry change.
5. Clean `.tmp/patch-console-verify-result.json` after smoke runs and check for lingering `node` or `electron` processes before final handoff.

Next product direction:

- Treat the app as a 3D terrain inspection instrument, not a general overlay demo.
- Use three operator modes as the mental model:
  - Explore: national terrain shape, province boundaries, major rivers, smooth camera movement.
  - Locate: prefecture-city relationships and readable city positions when the camera is close enough.
  - Inspect: selected DEM tile, realistic relief, contour/water references, city context, trace tools, QA, and cache state.
- Make the selected DEM tile the center of the console. The console should answer: where am I, what terrain am I seeing, what references are ready, what visual preset is active, and whether the current click path stayed fast.
- Keep every new layer distance-gated and cache-aware. If it does not help the current observation distance, it should stay hidden or delayed.

## 2026-07-05 Contour Distance Fade Progress

Near-distance screenshots were captured for the three visual baseline DEM tiles:

- `.tmp/terrain-visual-checks/qinling-near.png`
- `.tmp/terrain-visual-checks/wushan-near.png`
- `.tmp/terrain-visual-checks/hengduan-near.png`

The screenshots showed that dense contour geometry was technically readable after the `0.16` opacity baseline, but it still competed with local water, prefecture boundaries, and terrain color at the edge of Near/Inspect view. The runtime now keeps the density opacity as a base value and applies an observation-distance multiplier in `applyTerrainDetailTileLayerVisibility()`.

New runtime state:

- `terrainDetailTileContourEffectiveOpacity`
- `terrainDetailTileContourDistanceOpacityMode`

Latest verified smoke state:

- Node syntax checks passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: `208/208` passed.
- Electron smoke: exit code `0`.
- Qinling same-tile reclick: `0.10 ms`.
- Qinling cached return: `15.90 ms`.
- Qinling contour base opacity: `0.16`.
- Qinling contour effective opacity at Near edge: `0.12`.
- Qinling contour distance mode at Near edge: `near-fade`.
- Multi-region contour effective opacity for Qinling, Wushan, and Hengduan: `0.12`.
- Browser screenshot after reload: `.tmp/terrain-visual-checks/qinling-near-distance-fade.png`.

Next best task:

Move from line-layer tuning to terrain readability. The remaining visible issue is not primarily contour count anymore; it is how high-detail DEM tiles, water ribbons, and reference boundaries share the surface. Inspect Qinling and Hengduan first for rectangular patch feel, jagged relief curtains, and water layer dominance. Tune one visual variable at a time: tile-edge blending, water reference thickness/opacity, then DEM slope/altitude color.

## 2026-07-05 Water Reference Distance Progress

The local DEM water reference layer was the next strongest line layer after contour tuning. Qinling screenshots showed the local rivers and water references still reading too brightly against the terrain surface, especially when combined with city labels, prefecture boundaries, and the national river ribbon.

Runtime now stores a `baseOpacity` for each high-detail DEM water reference line and applies an observation-distance multiplier in `applyTerrainDetailTileLayerVisibility()`.

New runtime state:

- `terrainDetailTileWaterEffectiveOpacity`
- `terrainDetailTileWaterDistanceOpacityMode`

Latest verified state:

- Node syntax checks passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Node tests: `209/209` passed.
- Electron smoke: exit code `0`.
- Qinling same-tile reclick: `0.00 ms`.
- Qinling cached return: `15.80 ms`.
- Qinling local water reference segments: `31`.
- Qinling local water effective opacity at Near edge: `0.29`, mode `near-subtle`.
- Browser screenshot after reload: `.tmp/terrain-visual-checks/qinling-near-water-subtle.png`.

Next best task:

Continue on the visible terrain stack, but shift from local water references to the larger national water ribbons. The local reference lines are now subdued; the thick blue river ribbons still dominate some Qinling and Hengduan close-up views. The next change should make main water ribbons distance-aware or inspection-aware, while keeping them readable in Explore mode.

## 2026-07-05 National Water Ribbon Distance Progress

National river ribbons now follow the same observation-distance discipline as contours and local DEM water references. Each river ribbon keeps its original base opacity for Explore mode, then `applyLayerVisibility()` lowers the core and glow opacity when the camera is close enough for DEM inspection.

New runtime state:

- `waterSystemCoreEffectiveOpacity`
- `waterSystemGlowEffectiveOpacity`
- `waterSystemDistanceOpacityMode`

Latest verified state:

- Node syntax checks passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Full Node tests: `210/210` passed.
- Electron smoke: exit code `0`.
- Qinling same-tile reclick: `0.00 ms`.
- Qinling cached return: `20.10 ms`.
- Qinling contour effective opacity at Near edge: `0.12`.
- Qinling local water effective opacity at Near edge: `0.29`.
- National water ribbon effective opacity at Near edge: core `0.29`, glow `0.11`, mode `near-subtle`.
- `index.html` and `world-map.html` remain byte-identical.

Tomorrow's product direction:

The map should develop as a 3D terrain inspection tool with three clear operating distances:

1. Explore: national terrain shape, province boundaries, major rivers, and smooth zoom/pan should be the only dominant signals.
2. Locate: prefecture boundaries and city names should appear only when their geographic relationship is readable at the current distance.
3. Inspect: a selected DEM tile should behave like a focused terrain object: high-resolution relief first, reference layers staged, water/contours subdued by distance, city context available, and QA/cache state visible in the console.

The next implementation step should improve the selected DEM tile as a single coherent surface, not add another loose overlay. Start with DEM tile edge blending and boundary hierarchy: make rectangular tile edges less obvious, keep province/prefecture boundaries readable but secondary, and expose one console mode that says exactly which distance tier and inspection state the user is in.

## 2026-07-05 Terrain Region Label Progress

Terrain region names are now attached to the map as their own distance-aware label layer under the terrain block layer, separate from prefecture-city labels.

- `createTerrainBlockLabels()` creates DOM labels from `Core.FIVE_TERRAIN_BLOCKS`.
- Labels are anchored to each terrain block center and projected through the Three.js camera.
- The label layer follows `blocks` visibility, so hiding terrain blocks also hides terrain-region names.
- Far views show only higher-priority terrain regions; mid/near views can show the full tested region set.
- Projection is bucket-cached by view distance, rotation, canvas size, and block-layer visibility to avoid rewriting all label positions during small camera movement.
- Runtime state now exposes `terrainBlockLabelCount`, visible ids/names, detail level, and projection mode for smoke verification.

Latest verified state:

- Node syntax checks passed for `main.js`, `world-map-core.js`, `world-map.js`, and `scripts/verify-patch-console-ui.js`.
- Full Node tests: `212/212` passed.
- Electron smoke: exit code `0`.
- Terrain block labels: `121` total, `121` visible in near detail.
- Near visible names include major regions such as `青藏高原`, `塔里木盆地`, `天山山脉`, `四川盆地`, `东北平原`, `华北平原`, `长江中下游平原`, and `珠江三角洲平原`.
- Same-tile reclick: `0.10 ms`.
- Cached Qinling return: `43.40 ms`.

Next best task:

Visually inspect the new terrain-region names at far, mid, and near distances. If near view feels crowded, keep all 121 names available in data but add stronger priority gating or collision avoidance so labels appear as a readable hierarchy instead of a flat list.
