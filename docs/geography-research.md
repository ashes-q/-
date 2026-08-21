# China Terrain Atlas Geography Notes

## Sources Consulted

- IKCEST DRR map note: China's mainland terrain is higher in the west and lower in the east, forming three terrain steps. Source: `https://ikcest-drr.data.ac.cn/map/mb976`
- China Briefing physical geography note: the Yangtze, Yellow, Heilongjiang, Pearl, Liaohe, Haihe, Huaihe and Lancang rivers flow east and empty into the Pacific Ocean. Source: `https://th.china-embassy.gov.cn/eng/ztbd/AboutChina/ChinaBriefing/PhysicalGeography/200011/t20001115_1433186.htm`
- Natural Earth: public-domain Admin 0 and Admin 1 vector data are suitable for replacing hand-drawn country/province boundary guides. Source: `https://www.naturalearthdata.com/`
- geoBoundaries: ADM0/ADM1/ADM2 administrative boundaries are available under CC BY 4.0 and can provide future province-level precision. Source: `https://www.geoboundaries.org/`
- TopoExport: useful as a small-area terrain export reference, not as the primary nationwide China DEM source. Public pages advertise contour lines, DTM terrain, vector layers, and 2D/3D export formats. Source: `https://topoexport.com/`

## TopoExport Findings

- Export scope: free/basic exports are limited to 1 km2, Pro to 10 km2, and Pro+ to 50 km2. This is suitable for city/site samples, not for a whole-China terrain base.
- Formats relevant to this project: GLB/glTF and TIFF are the most useful if a real export is later obtained; OBJ/STL are less suitable as long-term browser runtime assets unless optimized.
- Terrain data: TopoExport's public regions API lists a WORLD `RASTER_DTM` source, `Ensemble Digital Terrain Model (EDTM)` by OpenGeoHub, license CC BY 4.0, year 2023, SRID 4326, precision 30. The pricing page describes worldwide DTM resolution as 5m for paid plans, but the public dataset metadata for the global source exposes 30 precision.
- China coverage: the `CN` region exists but has no China-mainland-specific datasets in the public `/regions` response. It inherits common/world datasets. Hong Kong has a separate `RASTER_DTM` LiDAR dataset from the Civil Engineering and Development Department, 2019-2020, SRID 2326, precision 0.5.
- Access limit: `/regions` is public, but point lookup such as `/regions/whereami` returned 401 without login. No TopoExport export file was downloaded or added to this project.
- Decision: keep TopoExport as an optional tool for detailed local terrain patches after login/export approval. For the China terrain atlas baseline, prefer openly downloadable DEM sources that can cover all of China directly.

## Current Model

- Terrain pattern: the runtime now samples a low-resolution SRTM90m height grid first, derives DEM contour segments, layers local meter-offset detail patches over it, draws those patches as visible 3D reference rings, overlays manual tracing guide lines, then falls back to the west-high/east-low procedural estimator when DEM coverage is missing.
- Inspection controls: the map legend can independently toggle terrain grid, terrain blocks, water systems, borders, DEM contours, local detail patches, manual tracing guide lines, and observation points. Local detail patches and tracing guide lines also have individual hide/show and focus controls. This keeps the baseline DEM, contour reference, hand-tracing guides, and hand-sculpting patches separable while tracing terrain detail.
- Trace-to-sculpt bridge: trace guides can produce `terrain-detail-patch-suggestions` through `buildTerrainTracePatchSuggestions(trace)`. The default mapping is ridge lift, basin-edge moderate lift, and valley depression. These suggestions are review artifacts, not automatically applied terrain corrections.
- Draft suggestion artifact: `data/terrain/china-trace-patch-suggestions.json` is generated from `data/terrain/china-trace-guides.json` by `scripts/generate-trace-patch-suggestions.js`. It currently records draft candidates only; accepted candidates should be copied into the applied patch layer after visual review.
- Terrain blocks: Himalaya Mountains, Kunlun Mountains, Qinghai-Tibet Plateau, Qaidam Basin, Tarim Basin, Altai Mountains, Junggar Basin, Turpan-Hami Basin, Tian Shan, Hexi Corridor, Qilian Mountains, Alxa Plateau Desert, Inner Mongolia Plateau, Loess Plateau, Sichuan Basin, Yunnan-Guizhou Plateau, Greater/Lesser Khingan, Changbai/eastern Northeast Mountains, Northeast Plain, North China Plain, Taihang-Yan Mountains, Shandong/Liaodong hills, Jiangnan/Southeast hills, Guangxi karst basin, Nanling Mountains, Middle-Lower Yangtze Plain, Pearl River Delta Plain, Taiwan Mountains, and Hainan island hills.
- Water systems: Yangtze, Yellow River, Pearl River, Heilongjiang, and Lancang.
- Boundary layers: coarse national outline plus province boundary guide lines. These are visual scaffolds, not legal or survey-grade boundaries.

## Self-Review Gaps

- Replace the low-resolution SRTM90m sample grid with denser DEM tiles or GeoTIFF-derived terrain patches.
- Expand `data/terrain/china-detail-patches.json` with reference-driven local sculpting for specific mountains, basin rims, valleys, and terrain edges.
- Expand `data/terrain/china-trace-guides.json` with more ridge, basin-edge, valley, coastline, and lake-edge tracing guides before turning them into patch masks.
- Merge short DEM contour segments into smoother contour paths once higher-resolution terrain data is available.
- Replace the hand-drawn national outline and province guide lines with Natural Earth or geoBoundaries GeoJSON.
- Add lakes, coastline detail, Taiwan island, Hainan island, and South China Sea island handling.
- Add labels for mountain ranges: Himalaya, Kunlun, Tianshan, Qinling, Taihang, Hengduan, Daxing'anling.
- Add grouped patch sets once the local detail data grows beyond the current coarse reference patches.

## Next Task Started

The next implementation task is to improve the terrain source quality:

1. Replace the low-resolution SRTM90m sample with denser GeoTIFF-derived DEM tiles for China.
2. Review trace-derived patch suggestions, then convert accepted candidates and radial detail patches into named regional patch groups for manual tracing and comparison.
3. Replace hand-drawn national outline and river guides with Natural Earth-derived geometries.
