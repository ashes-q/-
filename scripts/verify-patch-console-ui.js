const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const {
  installBrokenPipeProcessGuards,
  safeWriteStream,
  writeVerificationOutput,
} = require("./safe-script-output");

const ROOT = path.resolve(__dirname, "..");
let activeServer = null;
let activeWindow = null;

function exitAfterBrokenPipe() {
  if (activeWindow && !activeWindow.isDestroyed()) {
    activeWindow.destroy();
  }
  if (activeServer && activeServer.listening) {
    activeServer.close();
  }
  app.exit(0);
}

installBrokenPipeProcessGuards({
  consoleObject: console,
  onBrokenPipeException: exitAfterBrokenPipe,
});

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

function serveFile(requestPath, response) {
  const urlPath = decodeURIComponent(new URL(requestPath, "http://localhost").pathname);
  const relativePath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(data);
  });
}

function createServer() {
  const server = http.createServer((request, response) => serveFile(request.url, response));
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function waitForLoad(window) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Page load timed out")), 45000);
    window.webContents.once("did-finish-load", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function waitForPage(window, expression, label, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await window.webContents.executeJavaScript(expression, true);
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function getSmokePageSnapshot(window) {
  return window.webContents.executeJavaScript(`
    ({
      title: document.title,
      readyState: document.readyState,
      suggestionLayerButtons: document.querySelectorAll('[data-layer-id="suggestions"]').length,
      layerButtonCount: document.querySelectorAll('[data-layer-id]').length,
      bodyIncludes49: document.body.innerText.includes('49'),
      bodyText: document.body.innerText.slice(0, 1200),
      canvasDataset: Object.assign({}, document.querySelector('#mapCanvas')?.dataset),
    })
  `, true);
}

async function captureTerrainTileRenderQa(window, tileId) {
  await window.webContents.executeJavaScript(`
    document.querySelector('[data-terrain-tile-id="${tileId}"]').click();
  `, true);
  await waitForPage(window, `
    document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId === '${tileId}' &&
    document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVisible === 'true' &&
    Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVertexCount) > 0 &&
    document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayersPending === 'false' &&
    document.querySelector('#mapCanvas').dataset.terrainTileRenderQaText &&
    document.querySelector('#mapCanvas').dataset.terrainTileRenderQaVisibleText
  `, `DEM render QA metrics for ${tileId}`);
  return window.webContents.executeJavaScript(`
    (() => {
      const container = document.querySelector('#mapCanvas');
      return {
        tileId: '${tileId}',
        selectedTerrainTileId: container.dataset.selectedTerrainTileId,
        text: container.dataset.terrainTileRenderQaText,
        visibleText: container.dataset.terrainTileRenderQaVisibleText,
        state: container.dataset.terrainTileRenderQaState,
        terrainTileRenderQaVerdict: container.dataset.terrainTileRenderQaVerdict,
        terrainTileRenderQaFlags: container.dataset.terrainTileRenderQaFlags,
        slopeShadeRange: container.dataset.terrainTileRenderQaSlopeShadeRange,
        edgeBlendRange: container.dataset.terrainTileRenderQaEdgeBlendRange,
        bandLabels: container.dataset.terrainTileRenderQaBandLabels,
        contourSegmentCount: container.dataset.terrainTileRenderQaContourSegmentCount,
        contourLevelCount: container.dataset.terrainTileRenderQaContourLevelCount,
        contourReadiness: container.dataset.terrainTileRenderQaContourReadiness,
        contourOpacity: container.dataset.terrainTileRenderQaContourOpacity,
        contourEffectiveOpacity: container.dataset.terrainDetailTileContourEffectiveOpacity,
        contourDistanceOpacityMode: container.dataset.terrainDetailTileContourDistanceOpacityMode,
        vertexCount: container.dataset.terrainDetailTileSurfaceVertexCount,
        cellCount: container.dataset.terrainDetailTileSurfaceCellCount,
      };
    })()
  `, true);
}

async function main() {
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-http-cache");
  app.setPath("userData", path.join(ROOT, ".tmp", "electron-patch-console-smoke"));
  app.setPath("sessionData", path.join(ROOT, ".tmp", "electron-patch-console-smoke-session"));
  await app.whenReady();

  const server = await createServer();
  activeServer = server;
  const { port } = server.address();
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  activeWindow = window;

  try {
    const url = `http://127.0.0.1:${port}/index.html?patch-console-smoke=${Date.now()}`;
    const loaded = waitForLoad(window);
    await window.loadURL(url);
    await loaded;

    await waitForPage(window, `
      Boolean(document.querySelector('[data-layer-id="suggestions"]')) &&
      document.body.innerText.includes('49')
    `, "terrain legend and candidate count").catch(async (error) => {
      const snapshot = await getSmokePageSnapshot(window);
      throw new Error(`${error.message}\n${JSON.stringify(snapshot, null, 2)}`);
    });

    await waitForPage(window, `
      document.querySelectorAll('.terrain-tile-button').length >= 16 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainMapzenTileCount) >= 10 &&
      document.querySelector('#mapCanvas').dataset.terrainTilePrimaryDataset === 'mapzen-terrarium' &&
      document.querySelector('.terrain-tile-button').dataset.terrainTileDataset === 'mapzen-terrarium' &&
      Boolean(document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="tianshan-urumqi-bogda-mapzen-terrarium-z7-95-46"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="hengduan-dali-lijiang-mapzen-terrarium-z7-99-53"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="himalaya-everest-mapzen-terrarium-z7-94-53"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="qilian-qinghai-mapzen-terrarium-z7-99-49"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="loess-ordos-mapzen-terrarium-z7-103-49"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="yungui-karst-mapzen-terrarium-z7-101-54"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="changbai-mountain-mapzen-terrarium-z7-109-47"]')) &&
      Boolean(document.querySelector('[data-terrain-tile-id="kunlun-tarim-edge-mapzen-terrarium-z7-94-49"]'))
    `, "local DEM terrain tile controls");

    await waitForPage(window, `
      Number(document.querySelector('#mapCanvas').dataset.terrainSourceCatalogCount) >= 3 &&
      document.querySelector('#mapCanvas').dataset.terrainSourceCatalogPrimary === 'mapzen-terrain-tiles-aws'
    `, "real terrain source catalog controls");

    await window.webContents.executeJavaScript(`
      document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]').click();
    `, true);

    await window.webContents.executeJavaScript(`
      document.querySelector('[data-layer-id="cities"]').click();
    `, true);

    await waitForPage(window, `
      Boolean(document.querySelector('#mapCanvas').dataset.cityLabelUpdateMode) &&
      document.querySelector('#mapCanvas').dataset.cityLabelUpdateScheduled === 'false' &&
      ['near', 'mid', 'far'].includes(document.querySelector('#mapCanvas').dataset.cityLabelDetailLevel) &&
      Number.isFinite(Number(document.querySelector('#mapCanvas').dataset.cityLabelViewDistance)) &&
      document.querySelector('#mapCanvas').dataset.cityMarkerDetailLevel === document.querySelector('#mapCanvas').dataset.cityLabelDetailLevel &&
      Number(document.querySelector('#mapCanvas').dataset.cityMarkerVisibleCount) === Number(document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityCount) &&
      document.querySelector('#mapCanvas').dataset.cityMarkerVisibleIds.includes('hanzhong') &&
      document.querySelector('#mapCanvas').dataset.cityMarkerVisibleIds.includes('ankang')
    `, "city label and marker distance debug state");

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVisible === 'true' &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVertexCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileProvinceBoundarySegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTilePrefectureBoundarySegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterSegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryWaterSegments) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryCityCount) > 0
    `, "selected terrain tile high-resolution surface, contours, boundaries, water references, and trace summary").catch(async (error) => {
      const snapshot = await window.webContents.executeJavaScript(`
        (() => {
          const container = document.querySelector('#mapCanvas');
          return {
            selectedTerrainTileId: container.dataset.selectedTerrainTileId,
            terrainDetailTileSurfaceVisible: container.dataset.terrainDetailTileSurfaceVisible,
            terrainDetailTileSurfaceTileId: container.dataset.terrainDetailTileSurfaceTileId,
            terrainDetailTileSurfaceVertexCount: container.dataset.terrainDetailTileSurfaceVertexCount,
            terrainDetailTileReferenceLayersPending: container.dataset.terrainDetailTileReferenceLayersPending,
            terrainDetailTileReferenceLayerStage: container.dataset.terrainDetailTileReferenceLayerStage,
            terrainDetailTileReferenceLayerStageIndex: container.dataset.terrainDetailTileReferenceLayerStageIndex,
            terrainDetailTileReferenceLayerStageTotal: container.dataset.terrainDetailTileReferenceLayerStageTotal,
            terrainDetailTileContourSegmentCount: container.dataset.terrainDetailTileContourSegmentCount,
            terrainDetailTileBoundarySegmentCount: container.dataset.terrainDetailTileBoundarySegmentCount,
            terrainDetailTileProvinceBoundarySegmentCount: container.dataset.terrainDetailTileProvinceBoundarySegmentCount,
            terrainDetailTilePrefectureBoundarySegmentCount: container.dataset.terrainDetailTilePrefectureBoundarySegmentCount,
            terrainDetailTileWaterSegmentCount: container.dataset.terrainDetailTileWaterSegmentCount,
            terrainTileTraceSummaryWaterSegments: container.dataset.terrainTileTraceSummaryWaterSegments,
            terrainTileTraceSummaryCityCount: container.dataset.terrainTileTraceSummaryCityCount,
            terrainTileReferenceLayerStatus: container.dataset.terrainTileReferenceLayerStatus,
            terrainTileInspectMode: container.dataset.terrainTileInspectMode,
            terrainTileInspectStatusText: document.querySelector('#terrainTileInspectStatus') && document.querySelector('#terrainTileInspectStatus').textContent,
            terrainTileInspectContextText: container.dataset.terrainTileInspectContextText,
            terrainDetailDensityMode: container.dataset.terrainDetailDensityMode,
            terrainDetailLodLevel: container.dataset.terrainDetailLodLevel,
            terrainDetailDensityStatusText: container.dataset.terrainDetailDensityStatusText,
          };
        })()
      `, true);
      throw new Error(`${error.message}\n${JSON.stringify(snapshot, null, 2)}`);
    });

    const terrainTileReclickPerf = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const button = document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]');
        const start = performance.now();
        button.click();
        const durationMs = performance.now() - start;
        await Promise.resolve();
        return {
          terrainTileReclickDurationMs: durationMs.toFixed(2),
          terrainTileReferenceLayersPendingAfterReclick: container.dataset.terrainDetailTileReferenceLayersPending,
          terrainTileReferenceLayerStageAfterReclick: container.dataset.terrainDetailTileReferenceLayerStage,
          terrainTileReferenceLayerStageIndexAfterReclick: container.dataset.terrainDetailTileReferenceLayerStageIndex,
          terrainTileReferenceLayerStageTotalAfterReclick: container.dataset.terrainDetailTileReferenceLayerStageTotal,
          terrainTilePanelRefreshPendingAfterReclick: container.dataset.terrainTilePanelRefreshPending,
          terrainTileContourSegmentsAfterReclick: container.dataset.terrainDetailTileContourSegmentCount,
          terrainTileReclickReusedSurface: String(container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' && Number(container.dataset.terrainDetailTileContourSegmentCount) > 0),
        };
      })()
    `, true);

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayersPending === 'false' &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterSegmentCount) > 0
    `, "selected terrain tile deferred reference layers after reclick");

    await window.webContents.executeJavaScript(`
      document.querySelector('[data-terrain-tile-id="sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52"]').click();
    `, true);

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId === 'sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52' &&
      document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayersPending === 'false' &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount) > 0
    `, "second DEM tile generated before cached return");

    const terrainTileCacheReturnPerf = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const button = document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]');
        const start = performance.now();
        button.click();
        while (performance.now() - start < 1200) {
          if (
            container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
            container.dataset.terrainDetailTileSurfaceVisible === 'true' &&
            Number(container.dataset.terrainDetailTileSurfaceVertexCount) > 0
          ) {
            break;
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        const durationMs = performance.now() - start;
        return {
          terrainTileCacheReturnDurationMs: durationMs.toFixed(2),
          terrainTileCacheReturnSurfaceTileId: container.dataset.terrainDetailTileSurfaceTileId,
          terrainTileCacheReturnSurfaceReady: String(
            container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
            container.dataset.terrainDetailTileSurfaceVisible === 'true' &&
            Number(container.dataset.terrainDetailTileSurfaceVertexCount) > 0
          ),
          terrainTileCacheReturnPendingAfterClick: container.dataset.terrainDetailTileReferenceLayersPending,
          terrainTileCacheReturnStageAfterClick: container.dataset.terrainDetailTileReferenceLayerStage,
          terrainTilePanelRefreshPendingAfterClick: container.dataset.terrainTilePanelRefreshPending,
        };
      })()
    `, true);

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
      document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayersPending === 'false' &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount) > 0 &&
      Number(document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterSegmentCount) > 0
    `, "cached DEM tile reference layers restored after surface-first return");

    const terrainTileCacheReturnRefs = await window.webContents.executeJavaScript(`
      (() => {
        const container = document.querySelector('#mapCanvas');
        return {
          terrainTileCacheReturnPending: container.dataset.terrainDetailTileReferenceLayersPending,
          terrainTileCacheReturnStage: container.dataset.terrainDetailTileReferenceLayerStage,
          terrainTileCacheReturnStageIndex: container.dataset.terrainDetailTileReferenceLayerStageIndex,
          terrainTileCacheReturnStageTotal: container.dataset.terrainDetailTileReferenceLayerStageTotal,
          terrainTilePanelRefreshPending: container.dataset.terrainTilePanelRefreshPending,
          terrainTileCacheReturnContourSegments: container.dataset.terrainDetailTileContourSegmentCount,
          terrainTileCacheReturnBoundarySegments: container.dataset.terrainDetailTileBoundarySegmentCount,
          terrainTileCacheReturnWaterSegments: container.dataset.terrainDetailTileWaterSegmentCount,
          terrainTileCacheReturnReferencesReady: String(
            container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
            container.dataset.terrainDetailTileReferenceLayersPending === 'false' &&
            Number(container.dataset.terrainDetailTileContourSegmentCount) > 0 &&
            Number(container.dataset.terrainDetailTileBoundarySegmentCount) > 0 &&
            Number(container.dataset.terrainDetailTileWaterSegmentCount) > 0
          ),
        };
      })()
    `, true);

    const multiRegionTerrainRenderQa = [];
    for (const tileId of [
      "qinling-mapzen-terrarium-z7-102-51",
      "sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52",
      "hengduan-dali-lijiang-mapzen-terrarium-z7-99-53",
    ]) {
      multiRegionTerrainRenderQa.push(await captureTerrainTileRenderQa(window, tileId));
    }

    await window.webContents.executeJavaScript(`
      document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]').click();
    `, true);
    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
      document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayersPending === 'false' &&
      document.querySelector('#mapCanvas').dataset.terrainTileRenderQaState === 'ready'
    `, "Qinling DEM tile restored after multi-region render QA").catch(async (error) => {
      const snapshot = await window.webContents.executeJavaScript(`
        (() => {
          const container = document.querySelector('#mapCanvas');
          return {
            selectedTerrainTileId: container.dataset.selectedTerrainTileId,
            surfaceTileId: container.dataset.terrainDetailTileSurfaceTileId,
            surfaceVisible: container.dataset.terrainDetailTileSurfaceVisible,
            surfaceVertexCount: container.dataset.terrainDetailTileSurfaceVertexCount,
            referencePending: container.dataset.terrainDetailTileReferenceLayersPending,
            referenceStage: container.dataset.terrainDetailTileReferenceLayerStage,
            referenceStageIndex: container.dataset.terrainDetailTileReferenceLayerStageIndex,
            referenceStageTotal: container.dataset.terrainDetailTileReferenceLayerStageTotal,
            referenceRestoreMode: container.dataset.terrainTileReferenceLayerRestoreMode,
            contourSegments: container.dataset.terrainDetailTileContourSegmentCount,
            boundarySegments: container.dataset.terrainDetailTileBoundarySegmentCount,
            waterSegments: container.dataset.terrainDetailTileWaterSegmentCount,
            qaState: container.dataset.terrainTileRenderQaState,
            qaVerdict: container.dataset.terrainTileRenderQaVerdict,
            qaText: container.dataset.terrainTileRenderQaText,
            panelRefreshPending: container.dataset.terrainTilePanelRefreshPending,
          };
        })()
      `, true);
      throw new Error(`${error.message}\n${JSON.stringify(snapshot, null, 2)}`);
    });

    const terrainTileVisualPresetInteractions = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const snapshot = (expectedPreset) => ({
          expectedPreset,
          preset: container.dataset.terrainTileVisualPreset,
          label: container.dataset.terrainTileVisualPresetLabel,
          slopeGainScale: container.dataset.terrainTileVisualSlopeGainScale,
          edgeBlendDegrees: container.dataset.terrainTileVisualEdgeBlendDegrees,
          revision: container.dataset.terrainTileVisualPresetRevision,
          selectedTileId: container.dataset.selectedTerrainTileId,
          surfaceTileId: container.dataset.terrainDetailTileSurfaceTileId,
          qaText: container.dataset.terrainTileRenderQaText,
          activePreset: document.querySelector('.terrain-tile-visual-preset-button.is-active')?.dataset.terrainTileVisualPreset,
          naturalPressed: document.querySelector('[data-terrain-tile-visual-preset="natural"]').getAttribute('aria-pressed'),
          reliefPressed: document.querySelector('[data-terrain-tile-visual-preset="relief"]').getAttribute('aria-pressed'),
          softEdgePressed: document.querySelector('[data-terrain-tile-visual-preset="soft-edge"]').getAttribute('aria-pressed'),
        });
        const clickPreset = async (preset) => {
          document.querySelector('[data-terrain-tile-visual-preset="' + preset + '"]').click();
          const start = performance.now();
          while (performance.now() - start < 4200) {
            if (
              container.dataset.terrainTileVisualPreset === preset &&
              container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
              container.dataset.terrainDetailTileSurfaceVisible === 'true' &&
              Number(container.dataset.terrainDetailTileSurfaceVertexCount) > 0 &&
              container.dataset.terrainDetailTileReferenceLayersPending === 'false' &&
              container.dataset.terrainTileRenderQaVerdict === 'pass' &&
              String(container.dataset.terrainTileRenderQaText || '').includes('Style ' + container.dataset.terrainTileVisualPresetLabel)
            ) {
              break;
            }
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          return snapshot(preset);
        };
        return {
          relief: await clickPreset('relief'),
          softEdge: await clickPreset('soft-edge'),
          natural: await clickPreset('natural'),
        };
      })()
    `, true);

    const terrainTileVisualRecommendationInteraction = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const button = document.querySelector('#applyTerrainTileVisualRecommendationBtn');
        const beforeRevision = container.dataset.terrainTileVisualPresetRevision;
        const recommendedPreset = container.dataset.terrainTileVisualRecommendedPreset;
        button.click();
        const start = performance.now();
        while (performance.now() - start < 4200) {
          if (
            container.dataset.terrainTileVisualPreset === recommendedPreset &&
            container.dataset.terrainTileVisualRecommendationApplied === 'true' &&
            container.dataset.terrainDetailTileSurfaceTileId === 'qinling-mapzen-terrarium-z7-102-51' &&
            container.dataset.terrainDetailTileSurfaceVisible === 'true' &&
            Number(container.dataset.terrainDetailTileSurfaceVertexCount) > 0 &&
            container.dataset.terrainDetailTileReferenceLayersPending === 'false' &&
            container.dataset.terrainTileRenderQaVerdict === 'pass' &&
            String(container.dataset.terrainTileRenderQaText || '').includes('Style ' + container.dataset.terrainTileVisualPresetLabel)
          ) {
            break;
          }
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return {
          recommendedPreset,
          recommendedLabel: container.dataset.terrainTileVisualRecommendedLabel,
          recommendationReason: container.dataset.terrainTileVisualRecommendationReason,
          recommendationText: container.dataset.terrainTileVisualRecommendationText,
          recommendationApplied: container.dataset.terrainTileVisualRecommendationApplied,
          beforeRevision,
          afterRevision: container.dataset.terrainTileVisualPresetRevision,
          preset: container.dataset.terrainTileVisualPreset,
          label: container.dataset.terrainTileVisualPresetLabel,
          selectedTileId: container.dataset.selectedTerrainTileId,
          surfaceTileId: container.dataset.terrainDetailTileSurfaceTileId,
          qaVerdict: container.dataset.terrainTileRenderQaVerdict,
          qaText: container.dataset.terrainTileRenderQaText,
          buttonText: button.textContent,
          visibleText: document.querySelector('#terrainTileVisualRecommendation')?.textContent.trim(),
        };
      })()
    `, true);

    const terrainDetailDensityInteractions = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const snapshot = (expectedMode) => {
          const activeButton = document.querySelector('.density-button.is-active');
          return {
            expectedMode,
            mode: container.dataset.terrainDetailDensityMode,
            lod: container.dataset.terrainDetailLodLevel,
            statusText: container.dataset.terrainDetailDensityStatusText,
            guidanceText: container.dataset.terrainDetailLodGuidanceText,
            recipeText: container.dataset.terrainDetailLodRecipeText,
            recipeIds: container.dataset.terrainDetailLodRecipeIds,
            recipeActiveIds: container.dataset.terrainDetailLodRecipeActiveIds,
            recipeActiveCount: container.dataset.terrainDetailLodRecipeActiveCount,
            recipeTotalCount: container.dataset.terrainDetailLodRecipeTotalCount,
            recipeMissingIds: container.dataset.terrainDetailLodRecipeMissingIds,
            recipeStatusText: container.dataset.terrainDetailLodRecipeStatusText,
            visibleCount: container.dataset.terrainDetailLodVisibleCount,
            hiddenCount: container.dataset.terrainDetailLodHiddenCount,
            activeMode: activeButton && activeButton.dataset.detailDensityMode,
            autoPressed: document.querySelector('[data-detail-density-mode="auto"]').getAttribute('aria-pressed'),
            compactPressed: document.querySelector('[data-detail-density-mode="compact"]').getAttribute('aria-pressed'),
            finePressed: document.querySelector('[data-detail-density-mode="fine"]').getAttribute('aria-pressed'),
          };
        };
        const clickMode = async (mode) => {
          document.querySelector('[data-detail-density-mode="' + mode + '"]').click();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return snapshot(mode);
        };
        return {
          clean: await clickMode('compact'),
          fine: await clickMode('fine'),
          auto: await clickMode('auto'),
        };
      })()
    `, true);

    const terrainViewPresetInteractions = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const snapshot = (expectedPreset) => {
          const activeButton = document.querySelector('.view-preset-button.is-active');
          return {
            expectedPreset,
            preset: container.dataset.terrainViewPreset,
            label: container.dataset.terrainViewPresetLabel,
            lod: container.dataset.terrainViewPresetLod,
            zoom: container.dataset.terrainViewPresetZoom,
            zoomControl: container.dataset.viewZoomControlValue,
            densityMode: container.dataset.terrainDetailDensityMode,
            statusText: container.dataset.terrainDetailDensityStatusText,
            recipeIds: container.dataset.terrainDetailLodRecipeIds,
            appliedIds: container.dataset.terrainDetailLodRecipeAppliedIds,
            activeCount: container.dataset.terrainDetailLodRecipeActiveCount,
            totalCount: container.dataset.terrainDetailLodRecipeTotalCount,
            layerFocusVisibleIds: container.dataset.terrainViewPresetLayerFocusVisibleIds,
            layerFocusHiddenIds: container.dataset.terrainViewPresetLayerFocusHiddenIds,
            workflowText: container.dataset.terrainWorkflowSummaryText,
            activePreset: activeButton && activeButton.dataset.viewPreset,
            farPressed: document.querySelector('[data-view-preset="far"]').getAttribute('aria-pressed'),
            midPressed: document.querySelector('[data-view-preset="mid"]').getAttribute('aria-pressed'),
            nearPressed: document.querySelector('[data-view-preset="near"]').getAttribute('aria-pressed'),
          };
        };
        const clickPreset = async (preset) => {
          document.querySelector('[data-view-preset="' + preset + '"]').click();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return snapshot(preset);
        };
        const result = {
          far: await clickPreset('far'),
          mid: await clickPreset('mid'),
          near: await clickPreset('near'),
        };
        const contourChip = document.querySelector('[data-lod-recipe-layer-id="contours"]');
        if (contourChip && contourChip.getAttribute('aria-pressed') === 'true') {
          contourChip.click();
        }
        const zoomRange = document.querySelector('#viewZoomRange');
        if (zoomRange) {
          zoomRange.value = '2.58';
          zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
        return result;
      })()
    `, true);

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.cityLabelUpdateScheduled === 'false'
    `, "city label scheduled refresh after view preset interactions");

    const terrainTileResult = await window.webContents.executeJavaScript(`
      const traceSummaryBeforeStart = {
        terrainTileTraceSummaryText: document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryText,
        terrainTileTraceSummaryContourSegments: document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryContourSegments,
        terrainTileTraceSummaryBoundarySegments: document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryBoundarySegments,
        terrainTileTraceSummaryWaterSegments: document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryWaterSegments,
        terrainTileTraceSummaryCityCount: document.querySelector('#mapCanvas').dataset.terrainTileTraceSummaryCityCount,
        terrainDetailTileSurfaceVisible: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVisible,
        terrainDetailTileSurfaceTileId: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId,
        terrainDetailTileSurfaceVertexCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVertexCount,
        terrainDetailTileSurfaceCellCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceCellCount,
        terrainDetailTileSurfaceColorBandCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceColorBandCount,
        terrainDetailTileSurfaceColorBandLabels: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceColorBandLabels,
        terrainDetailTileSurfaceSlopeShadeMin: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceSlopeShadeMin,
        terrainDetailTileSurfaceSlopeShadeMax: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceSlopeShadeMax,
        terrainDetailTileSurfaceEdgeBlendMin: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceEdgeBlendMin,
        terrainDetailTileSurfaceEdgeBlendMax: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceEdgeBlendMax,
        terrainDetailTileReferenceLayerStage: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStage,
        terrainDetailTileReferenceLayerStageIndex: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStageIndex,
        terrainDetailTileReferenceLayerStageTotal: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStageTotal,
        terrainDetailTileContourSegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount,
        terrainDetailTileContourLevels: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourLevels,
        terrainDetailTileContourOpacity: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourOpacity,
        terrainDetailTileContourOpacityMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourOpacityMode,
        terrainDetailTileContourEffectiveOpacity: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourEffectiveOpacity,
        terrainDetailTileContourDistanceOpacityMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourDistanceOpacityMode,
        terrainDetailTileBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount,
        terrainDetailTileProvinceBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileProvinceBoundarySegmentCount,
        terrainDetailTilePrefectureBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTilePrefectureBoundarySegmentCount,
        terrainDetailTileBoundaryFeatureCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundaryFeatureCount,
        terrainDetailTileBoundaryRingCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundaryRingCount,
        terrainDetailTileWaterSegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterSegmentCount,
        terrainDetailTileWaterEffectiveOpacity: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterEffectiveOpacity,
        terrainDetailTileWaterDistanceOpacityMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterDistanceOpacityMode,
        terrainDetailTileWaterRiverCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterRiverCount,
        terrainDetailTileWaterLakeCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterLakeCount,
        terrainDetailTileTraceGuideCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuideCount,
        terrainDetailTileTraceGuideKinds: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuideKinds,
        terrainDetailTileRecommendedTraceGuideCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileRecommendedTraceGuideCount,
        terrainDetailTileRecommendedTraceGuideKinds: document.querySelector('#mapCanvas').dataset.terrainDetailTileRecommendedTraceGuideKinds,
        terrainDetailTileTraceGuidePointCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuidePointCount,
        terrainDetailDensityMode: document.querySelector('#mapCanvas').dataset.terrainDetailDensityMode,
        terrainDetailLodLevel: document.querySelector('#mapCanvas').dataset.terrainDetailLodLevel,
        terrainDetailLodViewDistance: document.querySelector('#mapCanvas').dataset.terrainDetailLodViewDistance,
        terrainDetailLodVisibleCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodVisibleCount,
        terrainDetailLodHiddenCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodHiddenCount,
        terrainDetailDensityStatusText: document.querySelector('#mapCanvas').dataset.terrainDetailDensityStatusText,
        terrainTileReferenceLayerStageText: document.querySelector('#mapCanvas').dataset.terrainTileReferenceLayerStageText,
        terrainDetailLodGuidanceText: document.querySelector('#mapCanvas').dataset.terrainDetailLodGuidanceText,
        terrainDetailLodSummaryText: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryText,
        terrainDetailLodSummaryVisibleText: Array.from(document.querySelectorAll('#terrainDetailLodSummary .lod-summary-chip')).map((item) => item.textContent).join(' | '),
        terrainDetailLodSummaryActiveCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryActiveCount,
        terrainDetailLodSummaryMissingCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryMissingCount,
        terrainDetailLodRecipeText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeText,
        terrainDetailLodRecipeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeIds,
        terrainDetailLodRecipeActiveIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        terrainDetailLodRecipeActiveCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        terrainDetailLodRecipeTotalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        terrainDetailLodRecipeMissingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        terrainDetailLodRecipeStatusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
        recommendedTileSuggestionButtonHidden: String(document.querySelector('#generateRecommendedTileSuggestionsBtn').hidden),
        recommendedTileSuggestionButtonDisabled: String(document.querySelector('#generateRecommendedTileSuggestionsBtn').disabled),
        terrainTileAnalysisReliefClass: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisReliefClass,
        terrainTileAnalysisTraceRecommendation: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisTraceRecommendation,
        terrainTileAnalysisMaxCellReliefMeters: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisMaxCellReliefMeters,
        terrainTileAnalysisAverageMeters: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisAverageMeters,
        terrainTileAnalysisSteepCellCount: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisSteepCellCount,
        terrainTileAnalysisSteepCellRatio: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisSteepCellRatio,
        terrainTileAnalysisTraceWorkload: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisTraceWorkload,
        terrainTileTraceAidReadiness: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidReadiness,
        terrainTileTraceAidContourDensity: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidContourDensity,
        terrainTileTraceAidReferenceLayerCount: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidReferenceLayerCount,
        terrainTileTraceAidDetailPriority: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidDetailPriority,
        terrainTileTraceAidGuideKinds: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidGuideKinds,
        terrainTileInspectMode: document.querySelector('#mapCanvas').dataset.terrainTileInspectMode,
        terrainTileReferenceLayerStatus: document.querySelector('#mapCanvas').dataset.terrainTileReferenceLayerStatus,
        terrainTilePanelRefreshPending: document.querySelector('#mapCanvas').dataset.terrainTilePanelRefreshPending,
        terrainTileInspectStatusText: document.querySelector('#terrainTileInspectStatus') && document.querySelector('#terrainTileInspectStatus').textContent,
        terrainTileInspectStatusState: document.querySelector('#terrainTileInspectStatus') && document.querySelector('#terrainTileInspectStatus').dataset.state,
        terrainTileInspectContextVisibleText: document.querySelector('#terrainTileInspectContext') && document.querySelector('#terrainTileInspectContext').textContent,
        terrainTileInspectContextText: document.querySelector('#mapCanvas').dataset.terrainTileInspectContextText,
        terrainTilePipelineStatusVisibleText: document.querySelector('#terrainTilePipelineStatus') && document.querySelector('#terrainTilePipelineStatus').textContent,
        terrainTilePipelineStatusText: document.querySelector('#mapCanvas').dataset.terrainTilePipelineStatusText,
        terrainTilePipelineChipText: document.querySelector('#mapCanvas').dataset.terrainTilePipelineChipText,
        terrainTilePipelineChipStates: document.querySelector('#mapCanvas').dataset.terrainTilePipelineChipStates,
        terrainTilePipelineChipVisibleText: Array.from(document.querySelectorAll('#terrainTilePipelineChips .terrain-tile-pipeline-chip')).map((item) => item.textContent).join(' | '),
        terrainTileWorkflowInspectorText: document.querySelector('#mapCanvas').dataset.terrainTileWorkflowInspectorText,
        terrainTileWorkflowInspectorBandLabels: document.querySelector('#mapCanvas').dataset.terrainTileWorkflowInspectorBandLabels,
        terrainTileWorkflowInspectorTraceState: document.querySelector('#mapCanvas').dataset.terrainTileWorkflowInspectorTraceState,
        terrainTileWorkflowInspectorContextText: document.querySelector('#mapCanvas').dataset.terrainTileWorkflowInspectorContextText,
        terrainTileWorkflowInspectorVisibleText: Array.from(document.querySelectorAll('#terrainTileWorkflowInspector .terrain-tile-workflow-chip')).map((item) => item.textContent).join(' | '),
        terrainTileRenderQaText: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaText,
        terrainTileRenderQaVisibleText: Array.from(document.querySelectorAll('#terrainTileRenderQa .terrain-tile-render-qa-chip')).map((item) => item.textContent).join(' | '),
        terrainTileRenderQaState: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaState,
        terrainTileRenderQaVerdict: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaVerdict,
        terrainTileRenderQaFlags: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaFlags,
        terrainTileRenderQaSlopeShadeRange: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaSlopeShadeRange,
        terrainTileRenderQaEdgeBlendRange: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaEdgeBlendRange,
        terrainTileRenderQaBandLabels: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaBandLabels,
        terrainTileRenderQaContourSegmentCount: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaContourSegmentCount,
        terrainTileRenderQaContourLevelCount: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaContourLevelCount,
        terrainTileRenderQaContourReadiness: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaContourReadiness,
        terrainTileRenderQaContourOpacity: document.querySelector('#mapCanvas').dataset.terrainTileRenderQaContourOpacity,
        terrainDetailTileContourEffectiveOpacity: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourEffectiveOpacity,
        terrainDetailTileContourDistanceOpacityMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourDistanceOpacityMode,
        terrainTileVisualPreset: document.querySelector('#mapCanvas').dataset.terrainTileVisualPreset,
        terrainTileVisualPresetLabel: document.querySelector('#mapCanvas').dataset.terrainTileVisualPresetLabel,
        terrainTileVisualSlopeGainScale: document.querySelector('#mapCanvas').dataset.terrainTileVisualSlopeGainScale,
        terrainTileVisualEdgeBlendDegrees: document.querySelector('#mapCanvas').dataset.terrainTileVisualEdgeBlendDegrees,
        terrainTileVisualPresetRevision: document.querySelector('#mapCanvas').dataset.terrainTileVisualPresetRevision,
        terrainTileVisualRecommendedPreset: document.querySelector('#mapCanvas').dataset.terrainTileVisualRecommendedPreset,
        terrainTileVisualRecommendedLabel: document.querySelector('#mapCanvas').dataset.terrainTileVisualRecommendedLabel,
        terrainTileVisualRecommendationReason: document.querySelector('#mapCanvas').dataset.terrainTileVisualRecommendationReason,
        terrainTileVisualRecommendationText: document.querySelector('#mapCanvas').dataset.terrainTileVisualRecommendationText,
        terrainTileVisualRecommendationApplied: document.querySelector('#mapCanvas').dataset.terrainTileVisualRecommendationApplied,
        terrainWorkflowSummaryText: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryText,
        terrainWorkflowSummaryStates: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryStates,
        terrainWorkflowSummaryVisibleText: Array.from(document.querySelectorAll('#terrainWorkflowSummary .terrain-workflow-chip')).map((item) => item.textContent).join(' | '),
        terrainBlockLabelCount: document.querySelector('#mapCanvas').dataset.terrainBlockLabelCount,
        terrainBlockLabelVisibleCount: document.querySelector('#mapCanvas').dataset.terrainBlockLabelVisibleCount,
        terrainBlockLabelVisibleIds: document.querySelector('#mapCanvas').dataset.terrainBlockLabelVisibleIds,
        terrainBlockLabelVisibleNames: document.querySelector('#mapCanvas').dataset.terrainBlockLabelVisibleNames,
        terrainBlockLabelDetailLevel: document.querySelector('#mapCanvas').dataset.terrainBlockLabelDetailLevel,
        terrainBlockLabelProjectionMode: document.querySelector('#mapCanvas').dataset.terrainBlockLabelProjectionMode,
        selectedTerrainTileId: document.querySelector('#mapCanvas').dataset.selectedTerrainTileId,
        selectedTerrainTileMetricLabel: document.querySelector('#selectedMetricLabel').textContent,
        selectedTerrainTileTitle: document.querySelector('#selectedTitle').textContent,
        selectedTerrainTileZoom: document.querySelector('#selectedZoom').textContent,
        selectedTerrainTileCityCount: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityCount,
        selectedTerrainTileCityIds: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityIds,
        selectedTerrainTileCityLabels: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityLabels,
        selectedTerrainTileCityNames: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityNames,
        selectedTerrainTileProvinceNames: document.querySelector('#mapCanvas').dataset.selectedTerrainTileProvinceNames,
        terrainViewPresetInteractions: ${JSON.stringify(terrainViewPresetInteractions)},
      };
      document.querySelector('#generateRecommendedTileSuggestionsBtn').click();
      const recommendedTileSuggestionCount = document.querySelector('#mapCanvas').dataset.terrainTileRecommendedSuggestionCount;
      const recommendedTileSuggestionGroupIds = document.querySelector('#mapCanvas').dataset.terrainTileRecommendedSuggestionGroupIds;
      const contourRecipeChip = document.querySelector('[data-lod-recipe-layer-id="contours"]');
      const contourRecipeBefore = {
        activeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        activeCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        totalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        missingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        statusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
        pressed: contourRecipeChip && contourRecipeChip.getAttribute('aria-pressed'),
      };
      if (contourRecipeChip) {
        contourRecipeChip.click();
      }
      const terrainDetailLodRecipeClickResult = {
        activeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        activeCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        totalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        missingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        statusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
        pressed: contourRecipeChip && document.querySelector('[data-lod-recipe-layer-id="contours"]').getAttribute('aria-pressed'),
        beforeActiveIds: contourRecipeBefore.activeIds,
        beforeActiveCount: contourRecipeBefore.activeCount,
        beforeTotalCount: contourRecipeBefore.totalCount,
        beforeMissingIds: contourRecipeBefore.missingIds,
        beforeStatusText: contourRecipeBefore.statusText,
        beforePressed: contourRecipeBefore.pressed,
      };
      if (contourRecipeChip) {
        contourRecipeChip.click();
      }
      const applyRecipeBefore = {
        activeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        activeCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        totalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        missingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        statusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
      };
      document.querySelector('#terrainDetailApplyRecipeBtn').click();
      const terrainDetailLodRecipeApplyResult = {
        beforeActiveIds: applyRecipeBefore.activeIds,
        beforeActiveCount: applyRecipeBefore.activeCount,
        beforeTotalCount: applyRecipeBefore.totalCount,
        beforeMissingIds: applyRecipeBefore.missingIds,
        beforeStatusText: applyRecipeBefore.statusText,
        activeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        activeCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        totalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        missingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        statusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
        appliedIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeAppliedIds,
        contourPressed: document.querySelector('[data-lod-recipe-layer-id="contours"]') && document.querySelector('[data-lod-recipe-layer-id="contours"]').getAttribute('aria-pressed'),
      };
      document.querySelector('[data-workflow-id="view"]').click();
      const workflowViewAction = document.querySelector('#mapCanvas').dataset.terrainWorkflowLastAction;
      document.querySelector('[data-workflow-id="dem"]').click();
      const workflowDemAction = document.querySelector('#mapCanvas').dataset.terrainWorkflowLastAction;
      document.querySelector('[data-workflow-id="layers"]').click();
      const terrainWorkflowActionResult = {
        viewAction: workflowViewAction,
        demAction: workflowDemAction,
        layersAction: document.querySelector('#mapCanvas').dataset.terrainWorkflowLastAction,
        summaryText: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryText,
        visibleText: Array.from(document.querySelectorAll('#terrainWorkflowSummary .terrain-workflow-chip')).map((item) => item.textContent).join(' | '),
        appliedIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeAppliedIds,
        activeCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        totalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
      };
      document.querySelector('[data-workflow-id="trace"]').click();
      const terrainWorkflowTraceActionResult = {
        traceAction: document.querySelector('#mapCanvas').dataset.terrainWorkflowLastAction,
        manualTraceEditMode: document.querySelector('#mapCanvas').dataset.manualTraceEditMode,
        manualTraceSourceTileId: document.querySelector('#mapCanvas').dataset.manualTraceSourceTileId,
        summaryText: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryText,
        visibleText: Array.from(document.querySelectorAll('#terrainWorkflowSummary .terrain-workflow-chip')).map((item) => item.textContent).join(' | '),
      };
      document.querySelector('#seedRidgeTraceBtn').click();
      document.querySelector('#smoothManualTraceBtn').click();
      const seededManualTraceSegmentCount = document.querySelector('#mapCanvas').dataset.manualTraceSegmentCount;
      document.querySelector('#simplifyManualTraceBtn').click();
      document.querySelector('#closeManualTraceBtn').click();
      document.querySelector('#generateManualTraceBtn').click();
      const deleteManualTracePointBtn = document.querySelector('#deleteManualTracePointBtn');
      const closeManualTraceBtn = document.querySelector('#closeManualTraceBtn');
      const approvedPreviewBefore = document.querySelector('#mapCanvas').dataset.approvedPatchTerrainPreviewEnabled;
      document.querySelector('#applyApprovedPatchesBtn').click();
      const terrainTileButtonStatusText = (button) => Array.from(button ? button.querySelectorAll('.terrain-tile-button-chip') : []).map((item) => item.textContent).join(' | ');
      const terrainTileButtonStatusStates = (button) => Array.from(button ? button.querySelectorAll('.terrain-tile-button-chip') : []).map((item) => item.dataset.state).join(',');
      const firstTerrainTileButton = document.querySelector('.terrain-tile-button');
      const selectedTerrainTileButton = document.querySelector('[data-terrain-tile-id="qinling-mapzen-terrarium-z7-102-51"]');
      ({
        ...${JSON.stringify(terrainTileReclickPerf)},
        ...${JSON.stringify(terrainTileCacheReturnPerf)},
        ...${JSON.stringify(terrainTileCacheReturnRefs)},
        ...traceSummaryBeforeStart,
        terrainDetailDensityInteractions: ${JSON.stringify(terrainDetailDensityInteractions)},
        terrainTileVisualPresetInteractions: ${JSON.stringify(terrainTileVisualPresetInteractions)},
        terrainTileVisualRecommendationInteraction: ${JSON.stringify(terrainTileVisualRecommendationInteraction)},
        multiRegionTerrainRenderQa: ${JSON.stringify(multiRegionTerrainRenderQa)},
        terrainTileButtonCount: document.querySelectorAll('.terrain-tile-button').length,
        terrainMapzenTileCount: document.querySelector('#mapCanvas').dataset.terrainMapzenTileCount,
        terrainTilePrimaryDataset: document.querySelector('#mapCanvas').dataset.terrainTilePrimaryDataset,
        firstTerrainTileDataset: document.querySelector('.terrain-tile-button').dataset.terrainTileDataset,
        firstTerrainTileStatusText: terrainTileButtonStatusText(firstTerrainTileButton),
        firstTerrainTileStatusStates: terrainTileButtonStatusStates(firstTerrainTileButton),
        selectedTerrainTileStatusText: terrainTileButtonStatusText(selectedTerrainTileButton),
        selectedTerrainTileStatusStates: terrainTileButtonStatusStates(selectedTerrainTileButton),
        terrainDetailTileMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileMode,
        terrainDetailLoadedTileCount: document.querySelector('#mapCanvas').dataset.terrainDetailLoadedTileCount,
        terrainDetailTileSurfaceVisible: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVisible,
        terrainDetailTileSurfaceTileId: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceTileId,
        terrainDetailTileSurfaceVertexCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceVertexCount,
        terrainDetailTileSurfaceCellCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileSurfaceCellCount,
        terrainDetailTileReferenceLayerStage: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStage,
        terrainDetailTileReferenceLayerStageIndex: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStageIndex,
        terrainDetailTileReferenceLayerStageTotal: document.querySelector('#mapCanvas').dataset.terrainDetailTileReferenceLayerStageTotal,
        terrainDetailTileContourSegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourSegmentCount,
        terrainDetailTileContourLevels: document.querySelector('#mapCanvas').dataset.terrainDetailTileContourLevels,
        terrainDetailTileBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundarySegmentCount,
        terrainDetailTileProvinceBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileProvinceBoundarySegmentCount,
        terrainDetailTilePrefectureBoundarySegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTilePrefectureBoundarySegmentCount,
        terrainDetailTileBoundaryFeatureCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundaryFeatureCount,
        terrainDetailTileBoundaryRingCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileBoundaryRingCount,
        terrainDetailTileWaterSegmentCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterSegmentCount,
        terrainDetailTileWaterRiverCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterRiverCount,
        terrainDetailTileWaterLakeCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileWaterLakeCount,
        terrainDetailTileTraceGuideCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuideCount,
        terrainDetailTileTraceGuideKinds: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuideKinds,
        terrainDetailTileRecommendedTraceGuideCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileRecommendedTraceGuideCount,
        terrainDetailTileRecommendedTraceGuideKinds: document.querySelector('#mapCanvas').dataset.terrainDetailTileRecommendedTraceGuideKinds,
        terrainDetailTileTraceGuidePointCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileTraceGuidePointCount,
        terrainDetailDensityMode: document.querySelector('#mapCanvas').dataset.terrainDetailDensityMode,
        terrainDetailLodLevel: document.querySelector('#mapCanvas').dataset.terrainDetailLodLevel,
        terrainDetailLodViewDistance: document.querySelector('#mapCanvas').dataset.terrainDetailLodViewDistance,
        terrainDetailLodVisibleCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodVisibleCount,
        terrainDetailLodHiddenCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodHiddenCount,
        terrainDetailDensityStatusText: document.querySelector('#mapCanvas').dataset.terrainDetailDensityStatusText,
        terrainTileReferenceLayerStageText: document.querySelector('#mapCanvas').dataset.terrainTileReferenceLayerStageText,
        terrainDetailLodGuidanceText: document.querySelector('#mapCanvas').dataset.terrainDetailLodGuidanceText,
        terrainDetailLodSummaryText: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryText,
        terrainDetailLodSummaryVisibleText: Array.from(document.querySelectorAll('#terrainDetailLodSummary .lod-summary-chip')).map((item) => item.textContent).join(' | '),
        terrainDetailLodSummaryActiveCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryActiveCount,
        terrainDetailLodSummaryMissingCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodSummaryMissingCount,
        terrainDetailLodRecipeText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeText,
        terrainDetailLodRecipeIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeIds,
        terrainDetailLodRecipeActiveIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveIds,
        terrainDetailLodRecipeActiveCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeActiveCount,
        terrainDetailLodRecipeTotalCount: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeTotalCount,
        terrainDetailLodRecipeMissingIds: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeMissingIds,
        terrainDetailLodRecipeStatusText: document.querySelector('#mapCanvas').dataset.terrainDetailLodRecipeStatusText,
        recommendedTileSuggestionButtonHidden: String(document.querySelector('#generateRecommendedTileSuggestionsBtn').hidden),
        recommendedTileSuggestionButtonDisabled: String(document.querySelector('#generateRecommendedTileSuggestionsBtn').disabled),
        terrainTileRecommendedSuggestionCount: recommendedTileSuggestionCount,
        terrainTileRecommendedSuggestionGroupIds: recommendedTileSuggestionGroupIds,
        terrainDetailLodRecipeClickResult,
        terrainDetailLodRecipeApplyResult,
        terrainWorkflowActionResult,
        terrainWorkflowTraceActionResult,
        terrainTileAnalysisReliefClass: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisReliefClass,
        terrainTileAnalysisTraceRecommendation: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisTraceRecommendation,
        terrainTileAnalysisMaxCellReliefMeters: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisMaxCellReliefMeters,
        terrainTileAnalysisAverageMeters: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisAverageMeters,
        terrainTileAnalysisSteepCellCount: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisSteepCellCount,
        terrainTileAnalysisSteepCellRatio: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisSteepCellRatio,
        terrainTileAnalysisTraceWorkload: document.querySelector('#mapCanvas').dataset.terrainTileAnalysisTraceWorkload,
        terrainTileTraceAidReadiness: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidReadiness,
        terrainTileTraceAidContourDensity: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidContourDensity,
        terrainTileTraceAidReferenceLayerCount: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidReferenceLayerCount,
        terrainTileTraceAidDetailPriority: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidDetailPriority,
        terrainTileTraceAidGuideKinds: document.querySelector('#mapCanvas').dataset.terrainTileTraceAidGuideKinds,
        terrainTileInspectMode: document.querySelector('#mapCanvas').dataset.terrainTileInspectMode,
        terrainTileReferenceLayerStatus: document.querySelector('#mapCanvas').dataset.terrainTileReferenceLayerStatus,
        terrainTilePanelRefreshPending: document.querySelector('#mapCanvas').dataset.terrainTilePanelRefreshPending,
        terrainTileInspectStatusText: document.querySelector('#terrainTileInspectStatus') && document.querySelector('#terrainTileInspectStatus').textContent,
        terrainTileInspectStatusState: document.querySelector('#terrainTileInspectStatus') && document.querySelector('#terrainTileInspectStatus').dataset.state,
        terrainTileInspectContextVisibleText: document.querySelector('#terrainTileInspectContext') && document.querySelector('#terrainTileInspectContext').textContent,
        terrainTileInspectContextText: document.querySelector('#mapCanvas').dataset.terrainTileInspectContextText,
        terrainTilePipelineStatusVisibleText: document.querySelector('#terrainTilePipelineStatus') && document.querySelector('#terrainTilePipelineStatus').textContent,
        terrainTilePipelineStatusText: document.querySelector('#mapCanvas').dataset.terrainTilePipelineStatusText,
        terrainTilePipelineChipText: document.querySelector('#mapCanvas').dataset.terrainTilePipelineChipText,
        terrainTilePipelineChipStates: document.querySelector('#mapCanvas').dataset.terrainTilePipelineChipStates,
        terrainTilePipelineChipVisibleText: Array.from(document.querySelectorAll('#terrainTilePipelineChips .terrain-tile-pipeline-chip')).map((item) => item.textContent).join(' | '),
        terrainWorkflowSummaryText: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryText,
        terrainWorkflowSummaryStates: document.querySelector('#mapCanvas').dataset.terrainWorkflowSummaryStates,
        terrainWorkflowSummaryVisibleText: Array.from(document.querySelectorAll('#terrainWorkflowSummary .terrain-workflow-chip')).map((item) => item.textContent).join(' | '),
        selectedTerrainTileId: document.querySelector('#mapCanvas').dataset.selectedTerrainTileId,
        selectedTerrainTileMetricLabel: document.querySelector('#selectedMetricLabel').textContent,
        selectedTerrainTileTitle: document.querySelector('#selectedTitle').textContent,
        selectedTerrainTileZoom: document.querySelector('#selectedZoom').textContent,
        selectedTerrainTileCityCount: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityCount,
        selectedTerrainTileCityIds: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityIds,
        selectedTerrainTileCityLabels: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityLabels,
        selectedTerrainTileCityNames: document.querySelector('#mapCanvas').dataset.selectedTerrainTileCityNames,
        selectedTerrainTileProvinceNames: document.querySelector('#mapCanvas').dataset.selectedTerrainTileProvinceNames,
        manualTraceEditMode: document.querySelector('#mapCanvas').dataset.manualTraceEditMode,
        manualTraceSourceTileId: document.querySelector('#mapCanvas').dataset.manualTraceSourceTileId,
        manualTraceSegmentCount: document.querySelector('#mapCanvas').dataset.manualTraceSegmentCount,
        manualTraceReliefMeters: document.querySelector('#mapCanvas').dataset.manualTraceReliefMeters,
        manualTraceCoverageText: document.querySelector('#mapCanvas').dataset.manualTraceCoverageText,
        manualTraceClosed: document.querySelector('#mapCanvas').dataset.manualTraceClosed,
        manualTraceSuggestionCount: document.querySelector('#mapCanvas').dataset.manualTraceSuggestionCount,
        manualTraceRadialSuggestionCount: document.querySelector('#mapCanvas').dataset.manualTraceRadialSuggestionCount,
        manualTraceLineBandSuggestionCount: document.querySelector('#mapCanvas').dataset.manualTraceLineBandSuggestionCount,
        manualTracePolygonMaskSuggestionCount: document.querySelector('#mapCanvas').dataset.manualTracePolygonMaskSuggestionCount,
        manualTraceSeedKind: document.querySelector('#mapCanvas').dataset.manualTraceSeedKind,
        manualTraceSeededSegmentCount: seededManualTraceSegmentCount,
        manualTraceSimplifiedPointCount: document.querySelector('#mapCanvas').dataset.manualTraceSimplifiedPointCount,
        manualTraceSmoothedPointCount: document.querySelector('#mapCanvas').dataset.manualTraceSmoothedPointCount,
        manualTraceSelectedPointIndex: document.querySelector('#mapCanvas').dataset.manualTraceSelectedPointIndex,
        manualTraceMovedPointCount: document.querySelector('#mapCanvas').dataset.manualTraceMovedPointCount,
        manualTraceDeletedPointCount: document.querySelector('#mapCanvas').dataset.manualTraceDeletedPointCount,
        closeManualTracePointDisabled: String(closeManualTraceBtn.disabled),
        deleteManualTracePointDisabled: String(deleteManualTracePointBtn.disabled),
        approvedPatchTerrainPreviewBefore: approvedPreviewBefore,
        approvedPatchTerrainPreviewEnabled: document.querySelector('#mapCanvas').dataset.approvedPatchTerrainPreviewEnabled,
        approvedPatchTerrainPreviewPatchCount: document.querySelector('#mapCanvas').dataset.approvedPatchTerrainPreviewPatchCount,
        cityLabelUpdateMode: document.querySelector('#mapCanvas').dataset.cityLabelUpdateMode,
        cityLabelUpdateScheduled: document.querySelector('#mapCanvas').dataset.cityLabelUpdateScheduled,
        cityLabelDetailLevel: document.querySelector('#mapCanvas').dataset.cityLabelDetailLevel,
        cityLabelViewDistance: document.querySelector('#mapCanvas').dataset.cityLabelViewDistance,
        cityLabelVisibleCount: document.querySelector('#mapCanvas').dataset.cityLabelVisibleCount,
        cityLabelSkippedWriteCount: document.querySelector('#mapCanvas').dataset.cityLabelSkippedWriteCount,
        cityLabelProjectionCandidateCount: document.querySelector('#mapCanvas').dataset.cityLabelProjectionCandidateCount,
        cityLabelHiddenEarlySkipCount: document.querySelector('#mapCanvas').dataset.cityLabelHiddenEarlySkipCount,
        cityLabelProjectionCacheKey: document.querySelector('#mapCanvas').dataset.cityLabelProjectionCacheKey,
        cityLabelProjectionCacheHits: document.querySelector('#mapCanvas').dataset.cityLabelProjectionCacheHits,
        cityLabelProjectionCacheMode: document.querySelector('#mapCanvas').dataset.cityLabelProjectionCacheMode,
        cityMarkerDetailLevel: document.querySelector('#mapCanvas').dataset.cityMarkerDetailLevel,
        cityMarkerVisibleCount: document.querySelector('#mapCanvas').dataset.cityMarkerVisibleCount,
        cityMarkerVisibleIds: document.querySelector('#mapCanvas').dataset.cityMarkerVisibleIds,
        cityMarkerVisibilityCacheKey: document.querySelector('#mapCanvas').dataset.cityMarkerVisibilityCacheKey,
        cityMarkerVisibilityCacheHits: document.querySelector('#mapCanvas').dataset.cityMarkerVisibilityCacheHits,
        cityMarkerVisibilityCacheMisses: document.querySelector('#mapCanvas').dataset.cityMarkerVisibilityCacheMisses,
        manualTraceQuality: document.querySelector('#manualTraceStatus').dataset.quality,
        manualTraceStatus: document.querySelector('#manualTraceStatus').textContent,
        ...traceSummaryBeforeStart,
      })
    `, true);

    await waitForPage(window, `
      document.querySelector('#mapCanvas').dataset.cityLabelUpdateScheduled === 'false'
    `, "city label scheduled refresh after terrain tile result interactions");
    const cityLabelUpdateScheduledSettled = await window.webContents.executeJavaScript(`
      document.querySelector('#mapCanvas').dataset.cityLabelUpdateScheduled
    `, true);

    const zoomInteractionResult = await window.webContents.executeJavaScript(`
      (async () => {
        const container = document.querySelector('#mapCanvas');
        const canvas = container.querySelector('canvas');
        const before = {
          renderQualityMode: container.dataset.renderQualityMode,
          rendererPixelRatio: container.dataset.rendererPixelRatio,
          interactionDetailMode: container.dataset.interactionDetailMode,
          interactionDetailSuppressedGroupCount: container.dataset.interactionDetailSuppressedGroupCount,
          zoom: container.dataset.viewZoomControlValue,
        };
        for (let index = 0; index < 8; index += 1) {
          canvas.dispatchEvent(new WheelEvent('wheel', {
            deltaY: -90,
            bubbles: true,
            cancelable: true,
            clientX: Math.round(canvas.clientWidth / 2),
            clientY: Math.round(canvas.clientHeight / 2),
          }));
        }
        const immediate = {
          renderQualityMode: container.dataset.renderQualityMode,
          rendererPixelRatio: container.dataset.rendererPixelRatio,
          interactionDetailMode: container.dataset.interactionDetailMode,
          interactionDetailSuppressedGroupCount: container.dataset.interactionDetailSuppressedGroupCount,
          zoom: container.dataset.viewZoomControlValue,
        };
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const during = {
          renderQualityMode: container.dataset.renderQualityMode,
          rendererPixelRatio: container.dataset.rendererPixelRatio,
          interactionDetailMode: container.dataset.interactionDetailMode,
          interactionDetailSuppressedGroupCount: container.dataset.interactionDetailSuppressedGroupCount,
          zoom: container.dataset.viewZoomControlValue,
        };
        await new Promise((resolve) => setTimeout(resolve, 360));
        const after = {
          renderQualityMode: container.dataset.renderQualityMode,
          rendererPixelRatio: container.dataset.rendererPixelRatio,
          interactionDetailMode: container.dataset.interactionDetailMode,
          interactionDetailSuppressedGroupCount: container.dataset.interactionDetailSuppressedGroupCount,
          zoom: container.dataset.viewZoomControlValue,
        };
        return { before, immediate, during, after };
      })()
    `, true);

    await window.webContents.executeJavaScript(`
      document.querySelector('[data-layer-group-details]').open = true;
      document.querySelector('[data-layer-id="suggestions"]').click();
    `, true);

    await waitForPage(window, `
      !document.querySelector('#suggestionButtons').hidden &&
      document.querySelectorAll('.suggestion-row').length > 0 &&
      Boolean(document.querySelector('[data-suggestion-shape-summary]')) &&
      Boolean(document.querySelector('[data-suggestion-source-tile-id]')) &&
      Boolean(document.querySelector('[data-suggestion-review-status]'))
    `, "candidate patch rows");

    await window.webContents.executeJavaScript(`
      document.querySelector('.suggestion-focus').click();
    `, true);

    await waitForPage(window, `
      document.querySelectorAll('.suggestion-patch-select').length > 1 &&
      Boolean(document.querySelector('.suggestion-bundle-actions'))
    `, "candidate patch bundle controls");

    const result = await window.webContents.executeJavaScript(`
      const groupPanelBeforeBundle = {
        meta: document.querySelector('#selectedMeta').textContent,
        metric: document.querySelector('#selectedMetric').textContent,
      };
      document.querySelectorAll('.suggestion-patch-select')[0].click();
      document.querySelectorAll('.suggestion-patch-select')[1].click();
      const previewSelectedButton = document.querySelector('[data-suggestion-preview-selected]');
      const suggestionPreviewButtonDisabled = String(previewSelectedButton.disabled);
      previewSelectedButton.click();
      ({
        bundleCount: document.querySelector('#mapCanvas').dataset.suggestionBundlePatchCount,
        selectedSuggestionApprovedPreviewCount: document.querySelector('#mapCanvas').dataset.selectedSuggestionApprovedPreviewCount,
        approvedPatchTerrainPreviewAfterSuggestionPreview: document.querySelector('#mapCanvas').dataset.approvedPatchTerrainPreviewEnabled,
        approvedPatchTerrainPreviewPatchCountAfterSuggestionPreview: document.querySelector('#mapCanvas').dataset.approvedPatchTerrainPreviewPatchCount,
        suggestionPreviewButtonDisabled,
        title: document.querySelector('#selectedTitle').textContent,
        metric: document.querySelector('#selectedMetric').textContent,
        groupPanelMeta: groupPanelBeforeBundle.meta,
        groupPanelMetric: groupPanelBeforeBundle.metric,
        selectButtons: document.querySelectorAll('.suggestion-patch-select').length,
        actions: document.querySelectorAll('.suggestion-bundle-actions').length,
        suggestionShapeSummary: document.querySelector('[data-suggestion-shape-summary]') && document.querySelector('[data-suggestion-shape-summary]').getAttribute('data-suggestion-shape-summary'),
        suggestionSourceTileId: document.querySelector('[data-suggestion-source-tile-id]') && document.querySelector('[data-suggestion-source-tile-id]').getAttribute('data-suggestion-source-tile-id'),
        suggestionSourceText: document.querySelector('.suggestion-source') && document.querySelector('.suggestion-source').textContent,
        suggestionReviewStatus: document.querySelector('[data-suggestion-review-status]') && document.querySelector('[data-suggestion-review-status]').getAttribute('data-suggestion-review-status'),
        weatherAverageWindSpeed: document.querySelector('#mapCanvas').dataset.weatherAverageWindSpeed,
        weatherAverageWindHeading: document.querySelector('#mapCanvas').dataset.weatherAverageWindHeading,
        weatherWindHeadingRange: document.querySelector('#mapCanvas').dataset.weatherWindHeadingRange,
        lakeWindDrivenRippleCount: document.querySelector('#mapCanvas').dataset.lakeWindDrivenRippleCount,
        waterFlowSpeedAverage: document.querySelector('#mapCanvas').dataset.waterFlowSpeedAverage,
        waterFlowSpeedRange: document.querySelector('#mapCanvas').dataset.waterFlowSpeedRange,
        waterFlowHydrologySource: document.querySelector('#mapCanvas').dataset.waterFlowHydrologySource,
        waterSystemCoreEffectiveOpacity: document.querySelector('#mapCanvas').dataset.waterSystemCoreEffectiveOpacity,
        waterSystemGlowEffectiveOpacity: document.querySelector('#mapCanvas').dataset.waterSystemGlowEffectiveOpacity,
        waterSystemDistanceOpacityMode: document.querySelector('#mapCanvas').dataset.waterSystemDistanceOpacityMode,
        terrainObservationMode: document.querySelector('#mapCanvas').dataset.terrainObservationMode,
        terrainObservationModeLabel: document.querySelector('#mapCanvas').dataset.terrainObservationModeLabel,
        terrainObservationModeText: document.querySelector('#mapCanvas').dataset.terrainObservationModeText,
        provinceBoundaryEffectiveOpacity: document.querySelector('#mapCanvas').dataset.provinceBoundaryEffectiveOpacity,
        prefectureBoundaryEffectiveOpacity: document.querySelector('#mapCanvas').dataset.prefectureBoundaryEffectiveOpacity,
        boundaryDistanceOpacityMode: document.querySelector('#mapCanvas').dataset.boundaryDistanceOpacityMode,
        boundarySource: document.querySelector('#mapCanvas').dataset.boundarySource,
        boundaryRingCount: document.querySelector('#mapCanvas').dataset.boundaryRingCount,
        boundaryFeatureCount: document.querySelector('#mapCanvas').dataset.boundaryFeatureCount,
        provinceBoundarySource: document.querySelector('#mapCanvas').dataset.provinceBoundarySource,
        provinceBoundaryRingCount: document.querySelector('#mapCanvas').dataset.provinceBoundaryRingCount,
        provinceBoundaryFeatureCount: document.querySelector('#mapCanvas').dataset.provinceBoundaryFeatureCount,
        prefectureBoundarySource: document.querySelector('#mapCanvas').dataset.prefectureBoundarySource,
        prefectureBoundaryRingCount: document.querySelector('#mapCanvas').dataset.prefectureBoundaryRingCount,
        prefectureBoundaryFeatureCount: document.querySelector('#mapCanvas').dataset.prefectureBoundaryFeatureCount,
        terrainDetailTileSource: document.querySelector('#mapCanvas').dataset.terrainDetailTileSource,
        terrainDetailTileCount: document.querySelector('#mapCanvas').dataset.terrainDetailTileCount,
        terrainDetailTileMode: document.querySelector('#mapCanvas').dataset.terrainDetailTileMode,
        terrainDetailLoadedTileCount: document.querySelector('#mapCanvas').dataset.terrainDetailLoadedTileCount,
        terrainSourceCatalogCount: document.querySelector('#mapCanvas').dataset.terrainSourceCatalogCount,
        terrainSourceCatalogPrimary: document.querySelector('#mapCanvas').dataset.terrainSourceCatalogPrimary,
      })
    `, true);

    if (Number(terrainTileResult.terrainTileButtonCount) < 16) {
      throw new Error(`Expected at least sixteen terrain tile buttons, got ${terrainTileResult.terrainTileButtonCount}`);
    }
    if (Number(terrainTileResult.terrainMapzenTileCount) < 10) {
      throw new Error(`Expected at least ten Mapzen terrain tiles, got ${terrainTileResult.terrainMapzenTileCount}`);
    }
    if (terrainTileResult.terrainTilePrimaryDataset !== "mapzen-terrarium" || terrainTileResult.firstTerrainTileDataset !== "mapzen-terrarium") {
      throw new Error(`Expected Mapzen terrain tiles to render first, got primary=${terrainTileResult.terrainTilePrimaryDataset} first=${terrainTileResult.firstTerrainTileDataset}`);
    }
    if (!String(terrainTileResult.firstTerrainTileStatusText || "").includes("Surface") || !String(terrainTileResult.firstTerrainTileStatusText || "").includes("Refs") || !String(terrainTileResult.firstTerrainTileStatusText || "").includes("Stage") || !String(terrainTileResult.firstTerrainTileStatusText || "").includes("Cache")) {
      throw new Error(`Expected first DEM tile button readiness chips, got ${terrainTileResult.firstTerrainTileStatusText}`);
    }
    if (!String(terrainTileResult.selectedTerrainTileStatusText || "").includes("Surface") || !String(terrainTileResult.selectedTerrainTileStatusText || "").includes("Refs") || !String(terrainTileResult.selectedTerrainTileStatusText || "").includes("Stage ready") || !String(terrainTileResult.selectedTerrainTileStatusText || "").includes("Cache") || !String(terrainTileResult.selectedTerrainTileStatusStates || "").split(",").every((item) => item === "ready")) {
      throw new Error(`Expected selected DEM tile button readiness chips to be ready, got text=${terrainTileResult.selectedTerrainTileStatusText} states=${terrainTileResult.selectedTerrainTileStatusStates}`);
    }
    if (terrainTileResult.terrainDetailTileMode !== "index") {
      throw new Error(`Expected terrain tile index mode, got ${terrainTileResult.terrainDetailTileMode}`);
    }
    if (Number(terrainTileResult.terrainDetailLoadedTileCount) > 3) {
      throw new Error(`Expected on-demand tile loading to keep startup light, got ${terrainTileResult.terrainDetailLoadedTileCount} loaded tiles`);
    }
    if (terrainTileResult.terrainDetailTileSurfaceVisible !== "true") {
      throw new Error("Expected selected DEM tile surface to render");
    }
    if (Number(terrainTileResult.terrainDetailTileSurfaceVertexCount) < 1000) {
      throw new Error(`Expected selected DEM tile surface vertices, got ${terrainTileResult.terrainDetailTileSurfaceVertexCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileSurfaceColorBandCount) < 2 || !String(terrainTileResult.terrainDetailTileSurfaceColorBandLabels || "").includes("Mountain")) {
      throw new Error(`Expected selected DEM tile terrain color bands, got count=${terrainTileResult.terrainDetailTileSurfaceColorBandCount} labels=${terrainTileResult.terrainDetailTileSurfaceColorBandLabels}`);
    }
    if (Number(terrainTileResult.terrainDetailTileSurfaceSlopeShadeMin) >= 0.96 || Number(terrainTileResult.terrainDetailTileSurfaceSlopeShadeMax) <= 1.04) {
      throw new Error(`Expected selected DEM tile slope shade range, got min=${terrainTileResult.terrainDetailTileSurfaceSlopeShadeMin} max=${terrainTileResult.terrainDetailTileSurfaceSlopeShadeMax}`);
    }
    if (Number(terrainTileResult.terrainDetailTileSurfaceEdgeBlendMin) > 0.05 || Number(terrainTileResult.terrainDetailTileSurfaceEdgeBlendMax) < 0.95) {
      throw new Error(`Expected selected DEM tile edge blending range, got min=${terrainTileResult.terrainDetailTileSurfaceEdgeBlendMin} max=${terrainTileResult.terrainDetailTileSurfaceEdgeBlendMax}`);
    }
    if (!String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes("Bands") || !String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes("Mountain") || !String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes("Surface ready") || !String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes("Refs ready") || !String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes("Trace") || !String(terrainTileResult.terrainTileWorkflowInspectorVisibleText || "").includes("Bands")) {
      throw new Error(`Expected selected DEM tile workflow inspector, got text=${terrainTileResult.terrainTileWorkflowInspectorText} visible=${terrainTileResult.terrainTileWorkflowInspectorVisibleText}`);
    }
    if (!String(terrainTileResult.terrainTileRenderQaText || "").includes("QA") || !String(terrainTileResult.terrainTileRenderQaText || "").includes("Contours") || !String(terrainTileResult.terrainTileRenderQaText || "").includes("opacity") || terrainTileResult.terrainTileRenderQaVisibleText !== terrainTileResult.terrainTileRenderQaText || terrainTileResult.terrainTileRenderQaState !== "ready" || !String(terrainTileResult.terrainTileRenderQaBandLabels || "").includes("Mountain") || !String(terrainTileResult.terrainTileRenderQaSlopeShadeRange || "").includes("-") || !String(terrainTileResult.terrainTileRenderQaEdgeBlendRange || "").includes("-") || Number(terrainTileResult.terrainTileRenderQaContourSegmentCount) < 24 || Number(terrainTileResult.terrainTileRenderQaContourLevelCount) < 2 || terrainTileResult.terrainTileRenderQaContourReadiness !== "ready" || Number(terrainTileResult.terrainTileRenderQaContourOpacity) <= 0 || Number(terrainTileResult.terrainTileRenderQaContourOpacity) >= 1) {
      throw new Error(`Expected selected DEM tile render QA metrics, got text=${terrainTileResult.terrainTileRenderQaText} visible=${terrainTileResult.terrainTileRenderQaVisibleText} state=${terrainTileResult.terrainTileRenderQaState} bands=${terrainTileResult.terrainTileRenderQaBandLabels} slope=${terrainTileResult.terrainTileRenderQaSlopeShadeRange} edge=${terrainTileResult.terrainTileRenderQaEdgeBlendRange} contours=${terrainTileResult.terrainTileRenderQaContourSegmentCount}/${terrainTileResult.terrainTileRenderQaContourLevelCount}/${terrainTileResult.terrainTileRenderQaContourReadiness}/${terrainTileResult.terrainTileRenderQaContourOpacity}`);
    }
    if (Number(terrainTileResult.terrainDetailTileContourEffectiveOpacity) <= 0 || Number(terrainTileResult.terrainDetailTileContourEffectiveOpacity) > Number(terrainTileResult.terrainDetailTileContourOpacity) || !terrainTileResult.terrainDetailTileContourDistanceOpacityMode || terrainTileResult.terrainDetailTileContourDistanceOpacityMode === "idle") {
      throw new Error(`Expected DEM contour distance opacity tuning, got base=${terrainTileResult.terrainDetailTileContourOpacity} effective=${terrainTileResult.terrainDetailTileContourEffectiveOpacity} mode=${terrainTileResult.terrainDetailTileContourDistanceOpacityMode}`);
    }
    if (Number(terrainTileResult.terrainDetailTileWaterSegmentCount) > 0 && (Number(terrainTileResult.terrainDetailTileWaterEffectiveOpacity) <= 0 || Number(terrainTileResult.terrainDetailTileWaterEffectiveOpacity) >= 0.72 || !terrainTileResult.terrainDetailTileWaterDistanceOpacityMode || terrainTileResult.terrainDetailTileWaterDistanceOpacityMode === "idle")) {
      throw new Error(`Expected DEM water reference distance opacity tuning, got segments=${terrainTileResult.terrainDetailTileWaterSegmentCount} effective=${terrainTileResult.terrainDetailTileWaterEffectiveOpacity} mode=${terrainTileResult.terrainDetailTileWaterDistanceOpacityMode}`);
    }
    if (terrainTileResult.terrainTileRenderQaVerdict !== "pass" || terrainTileResult.terrainTileRenderQaFlags !== "" || !String(terrainTileResult.terrainTileRenderQaText || "").includes("Verdict pass") || !String(terrainTileResult.terrainTileRenderQaText || "").includes("Flags none")) {
      throw new Error(`Expected selected DEM tile render QA verdict, got verdict=${terrainTileResult.terrainTileRenderQaVerdict} flags=${terrainTileResult.terrainTileRenderQaFlags} text=${terrainTileResult.terrainTileRenderQaText}`);
    }
    const visualPresetInteractions = terrainTileResult.terrainTileVisualPresetInteractions || {};
    if (
      terrainTileResult.terrainTileVisualPreset !== "natural" ||
      terrainTileResult.terrainTileVisualPresetLabel !== "Natural" ||
      terrainTileResult.terrainTileVisualSlopeGainScale !== "1" ||
      terrainTileResult.terrainTileVisualEdgeBlendDegrees !== "0.18" ||
      !visualPresetInteractions.relief ||
      !visualPresetInteractions.softEdge ||
      !visualPresetInteractions.natural ||
      visualPresetInteractions.relief.preset !== "relief" ||
      visualPresetInteractions.relief.activePreset !== "relief" ||
      visualPresetInteractions.relief.slopeGainScale !== "1.24" ||
      visualPresetInteractions.relief.surfaceTileId !== "qinling-mapzen-terrarium-z7-102-51" ||
      !String(visualPresetInteractions.relief.qaText || "").includes("Style Relief") ||
      visualPresetInteractions.softEdge.preset !== "soft-edge" ||
      visualPresetInteractions.softEdge.activePreset !== "soft-edge" ||
      visualPresetInteractions.softEdge.edgeBlendDegrees !== "0.28" ||
      visualPresetInteractions.softEdge.surfaceTileId !== "qinling-mapzen-terrarium-z7-102-51" ||
      !String(visualPresetInteractions.softEdge.qaText || "").includes("Style Soft edge") ||
      visualPresetInteractions.natural.preset !== "natural" ||
      visualPresetInteractions.natural.activePreset !== "natural" ||
      !String(visualPresetInteractions.natural.qaText || "").includes("Style Natural") ||
      Number(visualPresetInteractions.natural.revision) < 3
    ) {
      throw new Error(`Expected DEM tile visual tuning presets, got current=${terrainTileResult.terrainTileVisualPreset}/${terrainTileResult.terrainTileVisualPresetLabel}/${terrainTileResult.terrainTileVisualSlopeGainScale}/${terrainTileResult.terrainTileVisualEdgeBlendDegrees} interactions=${JSON.stringify(visualPresetInteractions)}`);
    }
    const recommendationInteraction = terrainTileResult.terrainTileVisualRecommendationInteraction || {};
    if (
      terrainTileResult.terrainTileVisualRecommendedPreset !== "natural" ||
      terrainTileResult.terrainTileVisualRecommendedLabel !== "Natural" ||
      terrainTileResult.terrainTileVisualRecommendationApplied !== "true" ||
      !String(terrainTileResult.terrainTileVisualRecommendationReason || "").includes("QA pass") ||
      !String(terrainTileResult.terrainTileVisualRecommendationText || "").includes("Recommend Natural") ||
      recommendationInteraction.recommendedPreset !== "natural" ||
      recommendationInteraction.recommendedLabel !== "Natural" ||
      recommendationInteraction.recommendationApplied !== "true" ||
      recommendationInteraction.preset !== "natural" ||
      recommendationInteraction.surfaceTileId !== "qinling-mapzen-terrarium-z7-102-51" ||
      recommendationInteraction.qaVerdict !== "pass" ||
      !String(recommendationInteraction.qaText || "").includes("Style Natural") ||
      !String(recommendationInteraction.visibleText || "").includes("Recommend Natural") ||
      recommendationInteraction.beforeRevision !== recommendationInteraction.afterRevision
    ) {
      throw new Error(`Expected DEM tile visual preset recommendation, got current=${terrainTileResult.terrainTileVisualRecommendedPreset}/${terrainTileResult.terrainTileVisualRecommendedLabel}/${terrainTileResult.terrainTileVisualRecommendationReason}/${terrainTileResult.terrainTileVisualRecommendationApplied} interaction=${JSON.stringify(recommendationInteraction)}`);
    }
    const expectedRenderQaTileIds = [
      "qinling-mapzen-terrarium-z7-102-51",
      "sichuan-basin-east-wushan-mapzen-terrarium-z7-102-52",
      "hengduan-dali-lijiang-mapzen-terrarium-z7-99-53",
    ];
    const renderQaByTile = new Map((terrainTileResult.multiRegionTerrainRenderQa || []).map((item) => [item.tileId, item]));
    const missingRenderQa = expectedRenderQaTileIds.filter((tileId) => !renderQaByTile.has(tileId));
    const invalidRenderQa = expectedRenderQaTileIds
      .map((tileId) => renderQaByTile.get(tileId))
      .filter((item) => !item || item.selectedTerrainTileId !== item.tileId || item.state !== "ready" || item.text !== item.visibleText || Number(item.vertexCount) < 1000 || !String(item.bandLabels || "").includes("Mountain") || !String(item.slopeShadeRange || "").includes("-") || !String(item.edgeBlendRange || "").includes("-"));
    if (missingRenderQa.length || invalidRenderQa.length) {
      throw new Error(`Expected multi-region DEM render QA metrics, missing=${missingRenderQa.join(",")} invalid=${JSON.stringify(invalidRenderQa)} all=${JSON.stringify(terrainTileResult.multiRegionTerrainRenderQa)}`);
    }
    const invalidContourQa = expectedRenderQaTileIds
      .map((tileId) => renderQaByTile.get(tileId))
      .filter((item) => !item || Number(item.contourSegmentCount) < 24 || Number(item.contourLevelCount) < 2 || item.contourReadiness !== "ready" || !String(item.text || "").includes("Contours"));
    if (invalidContourQa.length) {
      throw new Error(`Expected multi-region DEM contour QA metrics, got ${JSON.stringify(invalidContourQa)}`);
    }
    const invalidContourOpacityQa = expectedRenderQaTileIds
      .map((tileId) => renderQaByTile.get(tileId))
      .filter((item) => !item || Number(item.contourOpacity) <= 0 || Number(item.contourOpacity) >= 1 || !String(item.text || "").includes("opacity"));
    if (invalidContourOpacityQa.length) {
      throw new Error(`Expected multi-region DEM contour opacity tuning, got ${JSON.stringify(invalidContourOpacityQa)}`);
    }
    const invalidContourDistanceOpacityQa = expectedRenderQaTileIds
      .map((tileId) => renderQaByTile.get(tileId))
      .filter((item) => !item || Number(item.contourEffectiveOpacity) <= 0 || Number(item.contourEffectiveOpacity) > Number(item.contourOpacity) || !item.contourDistanceOpacityMode || item.contourDistanceOpacityMode === "idle");
    if (invalidContourDistanceOpacityQa.length) {
      throw new Error(`Expected DEM contour distance opacity tuning, got ${JSON.stringify(invalidContourDistanceOpacityQa)}`);
    }
    const invalidRenderQaVerdicts = expectedRenderQaTileIds
      .map((tileId) => renderQaByTile.get(tileId))
      .filter((item) => !item || item.terrainTileRenderQaVerdict !== "pass" || item.terrainTileRenderQaFlags !== "" || !String(item.text || "").includes("Verdict pass") || !String(item.text || "").includes("Flags none"));
    if (invalidRenderQaVerdicts.length) {
      throw new Error(`Expected multi-region DEM render QA verdicts, got ${JSON.stringify(invalidRenderQaVerdicts)}`);
    }
    if (Number(terrainTileResult.terrainDetailTileContourSegmentCount) < 1) {
      throw new Error(`Expected selected DEM tile contour segments, got ${terrainTileResult.terrainDetailTileContourSegmentCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileBoundarySegmentCount) < 1) {
      throw new Error(`Expected selected DEM tile boundary segments, got ${terrainTileResult.terrainDetailTileBoundarySegmentCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileProvinceBoundarySegmentCount) < 1 || Number(terrainTileResult.terrainDetailTilePrefectureBoundarySegmentCount) < 1) {
      throw new Error(`Expected selected DEM tile province and prefecture boundary segments, got province=${terrainTileResult.terrainDetailTileProvinceBoundarySegmentCount} prefecture=${terrainTileResult.terrainDetailTilePrefectureBoundarySegmentCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileWaterSegmentCount) < 1) {
      throw new Error(`Expected selected DEM tile water reference segments, got ${terrainTileResult.terrainDetailTileWaterSegmentCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileWaterRiverCount) < 1) {
      throw new Error(`Expected selected DEM tile water reference rivers, got ${terrainTileResult.terrainDetailTileWaterRiverCount}`);
    }
    if (Number(terrainTileResult.terrainDetailTileTraceGuideCount) < 2 || !String(terrainTileResult.terrainDetailTileTraceGuideKinds || "").includes("ridge") || !String(terrainTileResult.terrainDetailTileTraceGuideKinds || "").includes("valley")) {
      throw new Error(`Expected selected DEM tile automatic trace guides, got count=${terrainTileResult.terrainDetailTileTraceGuideCount} kinds=${terrainTileResult.terrainDetailTileTraceGuideKinds}`);
    }
    if (Number(terrainTileResult.terrainDetailTileRecommendedTraceGuideCount) < 2 || !String(terrainTileResult.terrainDetailTileRecommendedTraceGuideKinds || "").includes("ridge") || !String(terrainTileResult.terrainDetailTileRecommendedTraceGuideKinds || "").includes("valley")) {
      throw new Error(`Expected selected DEM tile recommended trace guides, got count=${terrainTileResult.terrainDetailTileRecommendedTraceGuideCount} kinds=${terrainTileResult.terrainDetailTileRecommendedTraceGuideKinds}`);
    }
    if (terrainTileResult.recommendedTileSuggestionButtonHidden !== "false" || terrainTileResult.recommendedTileSuggestionButtonDisabled !== "false" || Number(terrainTileResult.terrainTileRecommendedSuggestionCount) < 4 || !String(terrainTileResult.terrainTileRecommendedSuggestionGroupIds || "").includes("ridge") || !String(terrainTileResult.terrainTileRecommendedSuggestionGroupIds || "").includes("valley")) {
      throw new Error(`Expected recommended tile suggestions, got hidden=${terrainTileResult.recommendedTileSuggestionButtonHidden} disabled=${terrainTileResult.recommendedTileSuggestionButtonDisabled} count=${terrainTileResult.terrainTileRecommendedSuggestionCount} groups=${terrainTileResult.terrainTileRecommendedSuggestionGroupIds}`);
    }
    if (!terrainTileResult.terrainTileAnalysisReliefClass || terrainTileResult.terrainTileAnalysisReliefClass === "unknown" || !terrainTileResult.terrainTileAnalysisTraceRecommendation || !Number.isFinite(Number(terrainTileResult.terrainTileAnalysisMaxCellReliefMeters)) || !Number.isFinite(Number(terrainTileResult.terrainTileAnalysisSteepCellRatio)) || !["dense", "moderate", "light"].includes(terrainTileResult.terrainTileAnalysisTraceWorkload)) {
      throw new Error(`Expected selected DEM tile terrain analysis, got class=${terrainTileResult.terrainTileAnalysisReliefClass} recommendation=${terrainTileResult.terrainTileAnalysisTraceRecommendation} maxCell=${terrainTileResult.terrainTileAnalysisMaxCellReliefMeters} steepRatio=${terrainTileResult.terrainTileAnalysisSteepCellRatio} workload=${terrainTileResult.terrainTileAnalysisTraceWorkload}`);
    }
    if (!String(terrainTileResult.terrainTileTraceSummaryText || "").includes("临摹参考")) {
      throw new Error(`Expected selected DEM tile trace summary, got ${terrainTileResult.terrainTileTraceSummaryText}`);
    }
    if (Number(terrainTileResult.terrainTileTraceSummaryWaterSegments) < 1 || Number(terrainTileResult.terrainTileTraceSummaryCityCount) < 1) {
      throw new Error(`Expected selected DEM tile trace summary counts, got water=${terrainTileResult.terrainTileTraceSummaryWaterSegments} city=${terrainTileResult.terrainTileTraceSummaryCityCount}`);
    }
    if (!String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes(terrainTileResult.selectedTerrainTileProvinceNames) || !String(terrainTileResult.terrainTileWorkflowInspectorText || "").includes(String(terrainTileResult.selectedTerrainTileCityNames || "").split(",")[0])) {
      throw new Error(`Expected selected DEM tile workflow inspector to include province and city context, got text=${terrainTileResult.terrainTileWorkflowInspectorText} province=${terrainTileResult.selectedTerrainTileProvinceNames} cities=${terrainTileResult.selectedTerrainTileCityNames}`);
    }
    if (terrainTileResult.selectedTerrainTileId !== "qinling-mapzen-terrarium-z7-102-51") {
      throw new Error(`Expected Qinling terrain tile selection, got ${terrainTileResult.selectedTerrainTileId}`);
    }
    if (terrainTileResult.selectedTerrainTileMetricLabel !== "高清地形") {
      throw new Error(`Expected terrain tile metric label, got ${terrainTileResult.selectedTerrainTileMetricLabel}`);
    }
    if (Number(terrainTileResult.selectedTerrainTileZoom) > 2.7) {
      throw new Error(`Expected selected DEM tile inspection zoom, got ${terrainTileResult.selectedTerrainTileZoom}`);
    }
    if (Number(terrainTileResult.terrainTileReclickDurationMs) > 80 || terrainTileResult.terrainTileReferenceLayersPendingAfterReclick !== "false" || terrainTileResult.terrainTileReclickReusedSurface !== "true" || Number(terrainTileResult.terrainTileContourSegmentsAfterReclick) < 1) {
      throw new Error(`Expected loaded DEM tile reclick to reuse rendered layers, got duration=${terrainTileResult.terrainTileReclickDurationMs} pending=${terrainTileResult.terrainTileReferenceLayersPendingAfterReclick} reused=${terrainTileResult.terrainTileReclickReusedSurface} contour=${terrainTileResult.terrainTileContourSegmentsAfterReclick}`);
    }
    if (Number(terrainTileResult.terrainTileCacheReturnDurationMs) > 120 || terrainTileResult.terrainTileCacheReturnSurfaceReady !== "true" || terrainTileResult.terrainTileCacheReturnPending !== "false" || terrainTileResult.terrainTileCacheReturnReferencesReady !== "true" || Number(terrainTileResult.terrainTileCacheReturnContourSegments) < 1 || Number(terrainTileResult.terrainTileCacheReturnBoundarySegments) < 1 || Number(terrainTileResult.terrainTileCacheReturnWaterSegments) < 1) {
      throw new Error(`Expected cached DEM tile return to show surface quickly and restore reference layers, got duration=${terrainTileResult.terrainTileCacheReturnDurationMs} tile=${terrainTileResult.terrainTileCacheReturnSurfaceTileId} surface=${terrainTileResult.terrainTileCacheReturnSurfaceReady} pendingAfterClick=${terrainTileResult.terrainTileCacheReturnPendingAfterClick} pending=${terrainTileResult.terrainTileCacheReturnPending} ready=${terrainTileResult.terrainTileCacheReturnReferencesReady} contour=${terrainTileResult.terrainTileCacheReturnContourSegments} boundary=${terrainTileResult.terrainTileCacheReturnBoundarySegments} water=${terrainTileResult.terrainTileCacheReturnWaterSegments}`);
    }
    if (terrainTileResult.terrainTileCacheReturnStage !== "ready" || Number(terrainTileResult.terrainTileCacheReturnStageIndex) < 4 || Number(terrainTileResult.terrainTileCacheReturnStageTotal) < 4) {
      throw new Error(`Expected staged DEM tile reference layer generation to finish, got stage=${terrainTileResult.terrainTileCacheReturnStage} index=${terrainTileResult.terrainTileCacheReturnStageIndex} total=${terrainTileResult.terrainTileCacheReturnStageTotal}`);
    }
    if (terrainTileResult.terrainTileInspectMode !== "tile" || terrainTileResult.terrainTileReferenceLayerStatus !== "ready" || terrainTileResult.terrainTileInspectStatusState !== "ready" || !String(terrainTileResult.terrainTileInspectStatusText || "").includes("DEM")) {
      throw new Error(`Expected DEM inspect mode status, got mode=${terrainTileResult.terrainTileInspectMode} reference=${terrainTileResult.terrainTileReferenceLayerStatus} state=${terrainTileResult.terrainTileInspectStatusState} text=${terrainTileResult.terrainTileInspectStatusText}`);
    }
    if (terrainTileResult.selectedTerrainTileCityCount !== "2" || terrainTileResult.selectedTerrainTileCityIds !== "hanzhong,ankang") {
      throw new Error(`Expected Qinling local city labels, got count=${terrainTileResult.selectedTerrainTileCityCount} ids=${terrainTileResult.selectedTerrainTileCityIds}`);
    }
    if (Number(terrainTileResult.terrainBlockLabelCount) < 40 || Number(terrainTileResult.terrainBlockLabelVisibleCount) < 4 || !terrainTileResult.terrainBlockLabelVisibleNames || !terrainTileResult.terrainBlockLabelVisibleIds || !["near", "mid", "far"].includes(terrainTileResult.terrainBlockLabelDetailLevel)) {
      throw new Error(`Expected terrain block labels on the map, got count=${terrainTileResult.terrainBlockLabelCount} visible=${terrainTileResult.terrainBlockLabelVisibleCount} ids=${terrainTileResult.terrainBlockLabelVisibleIds} names=${terrainTileResult.terrainBlockLabelVisibleNames} detail=${terrainTileResult.terrainBlockLabelDetailLevel} mode=${terrainTileResult.terrainBlockLabelProjectionMode}`);
    }
    if (!String(terrainTileResult.selectedTerrainTileCityLabels || "").includes("Hanzhong") || !String(terrainTileResult.selectedTerrainTileCityLabels || "").includes("Ankang") || !terrainTileResult.selectedTerrainTileCityNames || !terrainTileResult.selectedTerrainTileProvinceNames || !String(terrainTileResult.terrainTileInspectContextText || "").includes(terrainTileResult.selectedTerrainTileCityNames.split(",")[0])) {
      throw new Error(`Expected DEM inspect context to expose local prefecture city names and province context, got labels=${terrainTileResult.selectedTerrainTileCityLabels} names=${terrainTileResult.selectedTerrainTileCityNames} provinces=${terrainTileResult.selectedTerrainTileProvinceNames} context=${terrainTileResult.terrainTileInspectContextText}`);
    }
    if (terrainTileResult.terrainTileInspectContextVisibleText !== terrainTileResult.terrainTileInspectContextText || !String(terrainTileResult.terrainTileInspectContextVisibleText || "").includes(terrainTileResult.selectedTerrainTileCityNames.split(",")[1])) {
      throw new Error(`Expected visible DEM inspect context to match runtime context, got visible=${terrainTileResult.terrainTileInspectContextVisibleText} context=${terrainTileResult.terrainTileInspectContextText}`);
    }
    if (terrainTileResult.terrainTilePipelineStatusVisibleText !== terrainTileResult.terrainTilePipelineStatusText || !String(terrainTileResult.terrainTilePipelineStatusText || "").includes("Surface") || !String(terrainTileResult.terrainTilePipelineStatusText || "").includes("Refs ready") || !String(terrainTileResult.terrainTilePipelineStatusText || "").includes("Stage") || !String(terrainTileResult.terrainTilePipelineStatusText || "").includes("Cache surface") || !String(terrainTileResult.terrainTilePipelineStatusText || "").includes("refs") || !String(terrainTileResult.terrainTileReferenceLayerStageText || "").includes("ready")) {
      throw new Error(`Expected visible DEM pipeline status to expose surface, refs, stage, and cache state, got visible=${terrainTileResult.terrainTilePipelineStatusVisibleText} runtime=${terrainTileResult.terrainTilePipelineStatusText} stage=${terrainTileResult.terrainTileReferenceLayerStageText}`);
    }
    if (terrainTileResult.terrainTilePipelineChipVisibleText !== terrainTileResult.terrainTilePipelineChipText || !String(terrainTileResult.terrainTilePipelineChipText || "").includes("Surface") || !String(terrainTileResult.terrainTilePipelineChipText || "").includes("Refs ready") || !String(terrainTileResult.terrainTilePipelineChipText || "").includes("Stage ready") || !String(terrainTileResult.terrainTilePipelineChipText || "").includes("Cache") || !String(terrainTileResult.terrainTilePipelineChipStates || "").split(",").every((item) => item === "ready")) {
      throw new Error(`Expected DEM pipeline chips to expose surface, refs, stage, and cache readiness, got visible=${terrainTileResult.terrainTilePipelineChipVisibleText} runtime=${terrainTileResult.terrainTilePipelineChipText} states=${terrainTileResult.terrainTilePipelineChipStates}`);
    }
    if (terrainTileResult.terrainWorkflowSummaryVisibleText !== terrainTileResult.terrainWorkflowSummaryText || !String(terrainTileResult.terrainWorkflowSummaryText || "").includes("View") || !String(terrainTileResult.terrainWorkflowSummaryText || "").includes("Layers") || !String(terrainTileResult.terrainWorkflowSummaryText || "").includes("DEM") || !String(terrainTileResult.terrainWorkflowSummaryText || "").includes("Trace") || !String(terrainTileResult.terrainWorkflowSummaryStates || "").split(",").includes("ready")) {
      throw new Error(`Expected terrain workflow summary to expose view, layer, DEM, and trace state, got visible=${terrainTileResult.terrainWorkflowSummaryVisibleText} runtime=${terrainTileResult.terrainWorkflowSummaryText} states=${terrainTileResult.terrainWorkflowSummaryStates}`);
    }
    if (!terrainTileResult.terrainWorkflowActionResult || terrainTileResult.terrainWorkflowActionResult.viewAction !== "view" || terrainTileResult.terrainWorkflowActionResult.demAction !== "dem" || terrainTileResult.terrainWorkflowActionResult.layersAction !== "layers" || terrainTileResult.terrainWorkflowActionResult.visibleText !== terrainTileResult.terrainWorkflowActionResult.summaryText || !String(terrainTileResult.terrainWorkflowActionResult.appliedIds || "").includes("contours")) {
      throw new Error(`Expected terrain workflow summary actions to route view, DEM, and layer operations, got ${JSON.stringify(terrainTileResult.terrainWorkflowActionResult)}`);
    }
    if (!terrainTileResult.terrainWorkflowTraceActionResult || terrainTileResult.terrainWorkflowTraceActionResult.traceAction !== "trace" || terrainTileResult.terrainWorkflowTraceActionResult.manualTraceEditMode !== "true" || terrainTileResult.terrainWorkflowTraceActionResult.manualTraceSourceTileId !== "qinling-mapzen-terrarium-z7-102-51" || terrainTileResult.terrainWorkflowTraceActionResult.visibleText !== terrainTileResult.terrainWorkflowTraceActionResult.summaryText) {
      throw new Error(`Expected terrain workflow trace action to start selected DEM tile tracing, got ${JSON.stringify(terrainTileResult.terrainWorkflowTraceActionResult)}`);
    }
    if (terrainTileResult.manualTraceEditMode !== "true") {
      throw new Error(`Expected tile-scoped manual trace edit mode, got ${terrainTileResult.manualTraceEditMode}`);
    }
    if (terrainTileResult.manualTraceSourceTileId !== "qinling-mapzen-terrarium-z7-102-51") {
      throw new Error(`Expected manual trace source tile id, got ${terrainTileResult.manualTraceSourceTileId}`);
    }
    if (terrainTileResult.manualTraceSeedKind !== "ridge" || Number(terrainTileResult.manualTraceSegmentCount) < 8 || Number(terrainTileResult.manualTraceReliefMeters) < 1) {
      throw new Error(`Expected automatic ridge guide to seed manual trace draft, got kind=${terrainTileResult.manualTraceSeedKind} segments=${terrainTileResult.manualTraceSegmentCount} relief=${terrainTileResult.manualTraceReliefMeters}`);
    }
    if (Number(terrainTileResult.manualTraceSmoothedPointCount) < 1) {
      throw new Error(`Expected smoothed manual trace draft, got smoothed=${terrainTileResult.manualTraceSmoothedPointCount}`);
    }
    if (Number(terrainTileResult.manualTraceSimplifiedPointCount) < 1 || Number(terrainTileResult.manualTraceSegmentCount) >= Number(terrainTileResult.manualTraceSeededSegmentCount)) {
      throw new Error(`Expected simplified manual trace draft, got removed=${terrainTileResult.manualTraceSimplifiedPointCount} seededSegments=${terrainTileResult.manualTraceSeededSegmentCount} currentSegments=${terrainTileResult.manualTraceSegmentCount}`);
    }
    if (!Number.isFinite(Number(terrainTileResult.manualTraceReliefMeters)) || !terrainTileResult.manualTraceCoverageText || !terrainTileResult.manualTraceQuality) {
      throw new Error(`Expected manual trace quality state, got segments=${terrainTileResult.manualTraceSegmentCount} relief=${terrainTileResult.manualTraceReliefMeters} coverage=${terrainTileResult.manualTraceCoverageText} quality=${terrainTileResult.manualTraceQuality}`);
    }
    if (terrainTileResult.manualTraceClosed !== "true" || terrainTileResult.closeManualTracePointDisabled !== "true") {
      throw new Error(`Expected manual trace area to close for polygon-mask sculpting, got closed=${terrainTileResult.manualTraceClosed} closeDisabled=${terrainTileResult.closeManualTracePointDisabled}`);
    }
    if (Number(terrainTileResult.manualTracePolygonMaskSuggestionCount) < 1 || Number(terrainTileResult.manualTraceLineBandSuggestionCount) < 1 || Number(terrainTileResult.manualTraceRadialSuggestionCount) < 3) {
      throw new Error(`Expected closed manual trace to generate radial, line-band, and polygon-mask suggestions, got radial=${terrainTileResult.manualTraceRadialSuggestionCount} line=${terrainTileResult.manualTraceLineBandSuggestionCount} mask=${terrainTileResult.manualTracePolygonMaskSuggestionCount} total=${terrainTileResult.manualTraceSuggestionCount}`);
    }
    if (terrainTileResult.deleteManualTracePointDisabled !== "true" || terrainTileResult.manualTraceSelectedPointIndex !== "" || Number(terrainTileResult.manualTraceDeletedPointCount) !== 0) {
      throw new Error(`Expected no selected manual trace point after smoothing/simplifying, got selected=${terrainTileResult.manualTraceSelectedPointIndex} deleted=${terrainTileResult.manualTraceDeletedPointCount} disabled=${terrainTileResult.deleteManualTracePointDisabled}`);
    }
    if (terrainTileResult.approvedPatchTerrainPreviewBefore !== "false" || terrainTileResult.approvedPatchTerrainPreviewEnabled !== "true" || Number(terrainTileResult.approvedPatchTerrainPreviewPatchCount) < 1) {
      throw new Error(`Expected approved patch terrain preview to toggle on, got before=${terrainTileResult.approvedPatchTerrainPreviewBefore} after=${terrainTileResult.approvedPatchTerrainPreviewEnabled} count=${terrainTileResult.approvedPatchTerrainPreviewPatchCount}`);
    }
    if (terrainTileResult.terrainTileTraceAidReadiness !== "ready" || terrainTileResult.terrainTileTraceAidDetailPriority !== "high" || Number(terrainTileResult.terrainTileTraceAidContourDensity) <= 0 || Number(terrainTileResult.terrainTileTraceAidReferenceLayerCount) < 4 || !String(terrainTileResult.terrainTileTraceAidGuideKinds).includes("ridge")) {
      throw new Error(`Expected DEM tile tracing aid readiness, got readiness=${terrainTileResult.terrainTileTraceAidReadiness} priority=${terrainTileResult.terrainTileTraceAidDetailPriority} density=${terrainTileResult.terrainTileTraceAidContourDensity} references=${terrainTileResult.terrainTileTraceAidReferenceLayerCount} guides=${terrainTileResult.terrainTileTraceAidGuideKinds}`);
    }
    if (terrainTileResult.terrainDetailDensityMode !== "auto" || !["near", "mid", "far"].includes(terrainTileResult.terrainDetailLodLevel) || !Number.isFinite(Number(terrainTileResult.terrainDetailLodViewDistance)) || !Number.isFinite(Number(terrainTileResult.terrainDetailLodVisibleCount)) || !Number.isFinite(Number(terrainTileResult.terrainDetailLodHiddenCount))) {
      throw new Error(`Expected DEM tile detail LOD debug state, got mode=${terrainTileResult.terrainDetailDensityMode} level=${terrainTileResult.terrainDetailLodLevel} distance=${terrainTileResult.terrainDetailLodViewDistance} visible=${terrainTileResult.terrainDetailLodVisibleCount} hidden=${terrainTileResult.terrainDetailLodHiddenCount}`);
    }
    if (!terrainTileResult.terrainDetailDensityStatusText || !String(terrainTileResult.terrainDetailDensityStatusText).includes("LOD")) {
      throw new Error(`Expected visible DEM detail density status text, got ${terrainTileResult.terrainDetailDensityStatusText}`);
    }
    if (!terrainTileResult.terrainDetailLodGuidanceText || !String(terrainTileResult.terrainDetailLodGuidanceText).includes("DEM") || !String(terrainTileResult.terrainDetailLodGuidanceText).includes("city")) {
      throw new Error(`Expected DEM detail LOD guidance to describe the current map layer intent, got ${terrainTileResult.terrainDetailLodGuidanceText}`);
    }
    if (!terrainTileResult.terrainDetailLodSummaryText || !String(terrainTileResult.terrainDetailLodSummaryText).includes("LOD") || !String(terrainTileResult.terrainDetailLodSummaryText).includes("active") || !String(terrainTileResult.terrainDetailLodSummaryText).includes("missing") || !String(terrainTileResult.terrainDetailLodSummaryVisibleText || "").includes("Active") || Number(terrainTileResult.terrainDetailLodSummaryMissingCount) !== Number(terrainTileResult.terrainDetailLodRecipeTotalCount) - Number(terrainTileResult.terrainDetailLodRecipeActiveCount)) {
      throw new Error(`Expected DEM detail LOD summary to expose current mode readiness, got text=${terrainTileResult.terrainDetailLodSummaryText} visible=${terrainTileResult.terrainDetailLodSummaryVisibleText} active=${terrainTileResult.terrainDetailLodSummaryActiveCount} missing=${terrainTileResult.terrainDetailLodSummaryMissingCount}`);
    }
    if (!String(terrainTileResult.terrainDetailLodRecipeText || "").includes("DEM surface") || !String(terrainTileResult.terrainDetailLodRecipeText || "").includes("Contours") || !String(terrainTileResult.terrainDetailLodRecipeText || "").includes("City markers") || !String(terrainTileResult.terrainDetailLodRecipeIds || "").includes("contours")) {
      throw new Error(`Expected DEM detail LOD recipe to expose active near-view layer stack, got text=${terrainTileResult.terrainDetailLodRecipeText} ids=${terrainTileResult.terrainDetailLodRecipeIds}`);
    }
    if (!String(terrainTileResult.terrainDetailLodRecipeClickResult && terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveIds || "").includes("surface") || !String(terrainTileResult.terrainDetailLodRecipeClickResult && terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveIds || "").includes("cities") || String(terrainTileResult.terrainDetailLodRecipeClickResult && terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveIds || "").includes("contours")) {
      throw new Error(`Expected DEM detail LOD recipe active state to follow enabled near-view layers before chip toggle, got ${terrainTileResult.terrainDetailLodRecipeClickResult && terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveIds}`);
    }
    if (!terrainTileResult.terrainDetailLodRecipeClickResult || String(terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveIds || "").includes("contours") || !String(terrainTileResult.terrainDetailLodRecipeClickResult.activeIds || "").includes("contours") || terrainTileResult.terrainDetailLodRecipeClickResult.pressed !== "true") {
      throw new Error(`Expected DEM detail LOD recipe chip to toggle contours, got ${JSON.stringify(terrainTileResult.terrainDetailLodRecipeClickResult)}`);
    }
    if (!terrainTileResult.terrainDetailLodRecipeApplyResult || String(terrainTileResult.terrainDetailLodRecipeApplyResult.beforeActiveIds || "").includes("contours") || !String(terrainTileResult.terrainDetailLodRecipeApplyResult.activeIds || "").includes("contours") || !String(terrainTileResult.terrainDetailLodRecipeApplyResult.appliedIds || "").includes("contours") || terrainTileResult.terrainDetailLodRecipeApplyResult.contourPressed !== "true") {
      throw new Error(`Expected DEM detail LOD recipe apply button to enable current recipe layers, got ${JSON.stringify(terrainTileResult.terrainDetailLodRecipeApplyResult)}`);
    }
    if (Number(terrainTileResult.terrainDetailLodRecipeClickResult.beforeActiveCount) !== 3 || Number(terrainTileResult.terrainDetailLodRecipeClickResult.beforeTotalCount) !== 4 || !String(terrainTileResult.terrainDetailLodRecipeClickResult.beforeMissingIds || "").includes("contours") || Number(terrainTileResult.terrainDetailLodRecipeApplyResult.activeCount) !== 4 || Number(terrainTileResult.terrainDetailLodRecipeApplyResult.totalCount) !== 4 || String(terrainTileResult.terrainDetailLodRecipeApplyResult.missingIds || "").includes("contours") || !String(terrainTileResult.terrainDetailLodRecipeApplyResult.statusText || "").includes("4/4")) {
      throw new Error(`Expected DEM detail LOD recipe status counts, got click=${JSON.stringify(terrainTileResult.terrainDetailLodRecipeClickResult)} apply=${JSON.stringify(terrainTileResult.terrainDetailLodRecipeApplyResult)}`);
    }
    const densityInteractions = terrainTileResult.terrainDetailDensityInteractions || {};
    if (!densityInteractions.clean || densityInteractions.clean.mode !== "compact" || densityInteractions.clean.lod !== "far" || densityInteractions.clean.activeMode !== "compact" || densityInteractions.clean.compactPressed !== "true" || !String(densityInteractions.clean.statusText || "").includes("Clean")) {
      throw new Error(`Expected Clean density control to force far LOD, got ${JSON.stringify(densityInteractions.clean)}`);
    }
    if (!densityInteractions.fine || densityInteractions.fine.mode !== "fine" || densityInteractions.fine.lod !== "near" || densityInteractions.fine.activeMode !== "fine" || densityInteractions.fine.finePressed !== "true" || !String(densityInteractions.fine.statusText || "").includes("Fine")) {
      throw new Error(`Expected Fine density control to force near LOD, got ${JSON.stringify(densityInteractions.fine)}`);
    }
    if (!densityInteractions.auto || densityInteractions.auto.mode !== "auto" || !["near", "mid", "far"].includes(densityInteractions.auto.lod) || densityInteractions.auto.activeMode !== "auto" || densityInteractions.auto.autoPressed !== "true" || !String(densityInteractions.auto.statusText || "").includes("Auto")) {
      throw new Error(`Expected Auto density control to restore distance-based LOD, got ${JSON.stringify(densityInteractions.auto)}`);
    }
    const viewPresets = terrainTileResult.terrainViewPresetInteractions || {};
    if (!viewPresets.far || viewPresets.far.preset !== "far" || viewPresets.far.lod !== "far" || viewPresets.far.activePreset !== "far" || viewPresets.far.farPressed !== "true" || !String(viewPresets.far.recipeIds || "").includes("provinceBorders") || !String(viewPresets.far.appliedIds || "").includes("provinceBorders") || !String(viewPresets.far.layerFocusVisibleIds || "").includes("provinceBorders") || !String(viewPresets.far.layerFocusHiddenIds || "").includes("contours") || !String(viewPresets.far.layerFocusHiddenIds || "").includes("cities") || !String(viewPresets.far.layerFocusHiddenIds || "").includes("cityBoundaries")) {
      throw new Error(`Expected terrain view presets to switch to far overview with province layers, got ${JSON.stringify(viewPresets.far)}`);
    }
    if (!viewPresets.mid || viewPresets.mid.preset !== "mid" || viewPresets.mid.lod !== "mid" || viewPresets.mid.activePreset !== "mid" || viewPresets.mid.midPressed !== "true" || !String(viewPresets.mid.recipeIds || "").includes("cityBoundaries") || !String(viewPresets.mid.appliedIds || "").includes("cityBoundaries") || !String(viewPresets.mid.layerFocusVisibleIds || "").includes("cityBoundaries") || !String(viewPresets.mid.layerFocusVisibleIds || "").includes("cities") || !String(viewPresets.mid.layerFocusHiddenIds || "").includes("contours") || !String(viewPresets.mid.layerFocusHiddenIds || "").includes("waterRefs")) {
      throw new Error(`Expected terrain view presets to switch to mid regional context with prefecture layers, got ${JSON.stringify(viewPresets.mid)}`);
    }
    if (!viewPresets.near || viewPresets.near.preset !== "near" || viewPresets.near.lod !== "near" || viewPresets.near.activePreset !== "near" || viewPresets.near.nearPressed !== "true" || !String(viewPresets.near.recipeIds || "").includes("contours") || !String(viewPresets.near.appliedIds || "").includes("contours") || !String(viewPresets.near.layerFocusVisibleIds || "").includes("contours") || !String(viewPresets.near.layerFocusVisibleIds || "").includes("waterRefs") || !String(viewPresets.near.workflowText || "").includes("View NEAR")) {
      throw new Error(`Expected terrain view presets to switch to near DEM inspection with contour layers, got ${JSON.stringify(viewPresets.near)}`);
    }
    if (!["idle", "interaction"].includes(terrainTileResult.cityLabelUpdateMode) || !["true", "false"].includes(terrainTileResult.cityLabelUpdateScheduled) || cityLabelUpdateScheduledSettled !== "false" || !["near", "mid", "far"].includes(terrainTileResult.cityLabelDetailLevel) || !Number.isFinite(Number(terrainTileResult.cityLabelViewDistance)) || !Number.isFinite(Number(terrainTileResult.cityLabelVisibleCount)) || !Number.isFinite(Number(terrainTileResult.cityLabelSkippedWriteCount)) || !Number.isFinite(Number(terrainTileResult.cityLabelProjectionCandidateCount)) || !Number.isFinite(Number(terrainTileResult.cityLabelHiddenEarlySkipCount)) || !Number.isFinite(Number(terrainTileResult.cityLabelProjectionCacheHits)) || !["projected", "reused"].includes(terrainTileResult.cityLabelProjectionCacheMode)) {
      throw new Error(`Expected city label throttling debug state, got mode=${terrainTileResult.cityLabelUpdateMode} scheduled=${terrainTileResult.cityLabelUpdateScheduled} settled=${cityLabelUpdateScheduledSettled} detail=${terrainTileResult.cityLabelDetailLevel} distance=${terrainTileResult.cityLabelViewDistance} visible=${terrainTileResult.cityLabelVisibleCount} skipped=${terrainTileResult.cityLabelSkippedWriteCount} candidates=${terrainTileResult.cityLabelProjectionCandidateCount} early=${terrainTileResult.cityLabelHiddenEarlySkipCount} projectionCache=${terrainTileResult.cityLabelProjectionCacheMode}/${terrainTileResult.cityLabelProjectionCacheHits}`);
    }
    if (Number(terrainTileResult.cityLabelProjectionCandidateCount) > Number(terrainTileResult.cityMarkerVisibleCount) || Number(terrainTileResult.cityLabelHiddenEarlySkipCount) < 1) {
      throw new Error(`Expected hidden city labels to be skipped before projection, got candidates=${terrainTileResult.cityLabelProjectionCandidateCount} markerVisible=${terrainTileResult.cityMarkerVisibleCount} early=${terrainTileResult.cityLabelHiddenEarlySkipCount}`);
    }
    if (Number(terrainTileResult.cityLabelProjectionCacheHits) < 1) {
      throw new Error(`Expected city label projection cache to be reused at least once, got key=${terrainTileResult.cityLabelProjectionCacheKey} mode=${terrainTileResult.cityLabelProjectionCacheMode} hits=${terrainTileResult.cityLabelProjectionCacheHits}`);
    }
    if (!String(terrainTileResult.cityMarkerVisibilityCacheKey || "").includes("qinling-mapzen-terrarium-z7-102-51") || Number(terrainTileResult.cityMarkerVisibilityCacheHits) < 1 || Number(terrainTileResult.cityMarkerVisibilityCacheMisses) < 1) {
      throw new Error(`Expected city marker visibility cache debug state, got key=${terrainTileResult.cityMarkerVisibilityCacheKey} hits=${terrainTileResult.cityMarkerVisibilityCacheHits} misses=${terrainTileResult.cityMarkerVisibilityCacheMisses}`);
    }
    if (zoomInteractionResult.immediate.renderQualityMode !== "interaction") {
      throw new Error(`Expected zoom interaction render mode, got ${JSON.stringify(zoomInteractionResult)}`);
    }
    if (zoomInteractionResult.immediate.interactionDetailMode !== "reduced" || Number(zoomInteractionResult.immediate.interactionDetailSuppressedGroupCount) < 3) {
      throw new Error(`Expected zoom to temporarily reduce heavy detail layers, got ${JSON.stringify(zoomInteractionResult)}`);
    }
    if (zoomInteractionResult.after.renderQualityMode !== "idle") {
      throw new Error(`Expected zoom idle render mode after settling, got ${JSON.stringify(zoomInteractionResult)}`);
    }
    if (zoomInteractionResult.after.interactionDetailMode !== "full" || Number(zoomInteractionResult.after.interactionDetailSuppressedGroupCount) !== 0) {
      throw new Error(`Expected zoom detail layers to restore after settling, got ${JSON.stringify(zoomInteractionResult)}`);
    }
    if (!Number.isFinite(Number(zoomInteractionResult.during.rendererPixelRatio)) || !Number.isFinite(Number(zoomInteractionResult.after.rendererPixelRatio))) {
      throw new Error(`Expected finite zoom renderer pixel ratios, got ${JSON.stringify(zoomInteractionResult)}`);
    }
    if (result.bundleCount !== "2") {
      throw new Error(`Expected bundle count 2, got ${result.bundleCount}`);
    }
    if (result.suggestionPreviewButtonDisabled !== "false" || result.selectedSuggestionApprovedPreviewCount !== "2" || result.approvedPatchTerrainPreviewAfterSuggestionPreview !== "true" || Number(result.approvedPatchTerrainPreviewPatchCountAfterSuggestionPreview) < 2) {
      throw new Error(`Expected selected candidate preview to apply, got disabled=${result.suggestionPreviewButtonDisabled} preview=${result.selectedSuggestionApprovedPreviewCount} enabled=${result.approvedPatchTerrainPreviewAfterSuggestionPreview} count=${result.approvedPatchTerrainPreviewPatchCountAfterSuggestionPreview}`);
    }
    if (!result.metric.includes("promote-trace-patch-suggestions.js")) {
      throw new Error("Bundle promotion command is missing from selected metric");
    }
    if (!result.suggestionShapeSummary || !String(result.suggestionShapeSummary).includes("点")) {
      throw new Error(`Expected candidate group shape metadata, got ${result.suggestionShapeSummary}`);
    }
    if (!result.suggestionSourceText) {
      throw new Error(`Expected candidate group source metadata text, got ${result.suggestionSourceText}`);
    }
    if (!result.suggestionReviewStatus) {
      throw new Error(`Expected candidate group review status metadata, got ${result.suggestionReviewStatus}`);
    }
    if (!String(result.groupPanelMeta || "").includes(result.suggestionShapeSummary) || !String(result.groupPanelMeta || "").includes(result.suggestionSourceText)) {
      throw new Error(`Expected selected candidate group panel to show source and shape metadata, got meta=${result.groupPanelMeta}`);
    }
    if (!String(result.groupPanelMetric || "").includes("审查状态")) {
      throw new Error(`Expected selected candidate group metric to show review status, got metric=${result.groupPanelMetric}`);
    }
    if (!Number.isFinite(Number(result.weatherAverageWindSpeed))) {
      throw new Error("Weather average wind speed debug state is missing");
    }
    if (!Number.isFinite(Number(result.weatherAverageWindHeading))) {
      throw new Error("Weather average wind heading debug state is missing");
    }
    if (!result.weatherWindHeadingRange || result.weatherWindHeadingRange === "none") {
      throw new Error("Weather wind heading range debug state is missing");
    }
    if (!Number.isFinite(Number(result.lakeWindDrivenRippleCount))) {
      throw new Error("Lake wind-driven ripple debug state is missing");
    }
    if (!Number.isFinite(Number(result.waterFlowSpeedAverage))) {
      throw new Error("Water flow speed debug state is missing");
    }
    if (!result.waterFlowSpeedRange || result.waterFlowSpeedRange === "none") {
      throw new Error("Water flow speed range debug state is missing");
    }
    if (!result.waterFlowHydrologySource) {
      throw new Error("Water flow hydrology source debug state is missing");
    }
    if (!Number.isFinite(Number(result.waterSystemCoreEffectiveOpacity)) || Number(result.waterSystemCoreEffectiveOpacity) <= 0 || Number(result.waterSystemCoreEffectiveOpacity) >= 0.58 || !Number.isFinite(Number(result.waterSystemGlowEffectiveOpacity)) || Number(result.waterSystemGlowEffectiveOpacity) <= 0 || !result.waterSystemDistanceOpacityMode || result.waterSystemDistanceOpacityMode === "idle") {
      throw new Error(`Expected national water ribbon distance opacity tuning, got core=${result.waterSystemCoreEffectiveOpacity} glow=${result.waterSystemGlowEffectiveOpacity} mode=${result.waterSystemDistanceOpacityMode}`);
    }
    if (result.terrainObservationMode !== "inspect" || result.terrainObservationModeLabel !== "Inspect" || !String(result.terrainObservationModeText || "").includes("Inspect") || !Number.isFinite(Number(result.provinceBoundaryEffectiveOpacity)) || Number(result.provinceBoundaryEffectiveOpacity) <= 0 || Number(result.provinceBoundaryEffectiveOpacity) >= 0.38 || !Number.isFinite(Number(result.prefectureBoundaryEffectiveOpacity)) || Number(result.prefectureBoundaryEffectiveOpacity) <= 0 || Number(result.prefectureBoundaryEffectiveOpacity) >= 0.16 || !result.boundaryDistanceOpacityMode || result.boundaryDistanceOpacityMode === "idle") {
      throw new Error(`Expected terrain observation mode and boundary opacity tuning, got mode=${result.terrainObservationMode}/${result.terrainObservationModeLabel} province=${result.provinceBoundaryEffectiveOpacity} prefecture=${result.prefectureBoundaryEffectiveOpacity} boundaryMode=${result.boundaryDistanceOpacityMode} text=${result.terrainObservationModeText}`);
    }
    if (result.provinceBoundarySource !== "geoboundaries-adm1") {
      throw new Error(`Expected geoboundaries-adm1 province boundary source, got ${result.provinceBoundarySource}`);
    }
    if (result.prefectureBoundarySource !== "cn-atlas-prefectures") {
      throw new Error(`Expected cn-atlas-prefectures prefecture boundary source, got ${result.prefectureBoundarySource}`);
    }
    if (!String(result.boundarySource || "").includes("geoboundaries-adm1") || !String(result.boundarySource || "").includes("cn-atlas-prefectures")) {
      throw new Error(`Expected combined boundary source, got ${result.boundarySource}`);
    }
    if (Number(result.provinceBoundaryRingCount) < 34 || Number(result.provinceBoundaryFeatureCount) < 34) {
      throw new Error(`Expected province boundary rings/features, got rings=${result.provinceBoundaryRingCount} features=${result.provinceBoundaryFeatureCount}`);
    }
    if (Number(result.prefectureBoundaryRingCount) < 330 || Number(result.prefectureBoundaryFeatureCount) < 330) {
      throw new Error(`Expected prefecture-level boundary rings/features, got rings=${result.prefectureBoundaryRingCount} features=${result.prefectureBoundaryFeatureCount}`);
    }
    if (result.terrainDetailTileSource !== "china-local-dem-tile-index") {
      throw new Error(`Expected local DEM tile index source, got ${result.terrainDetailTileSource}`);
    }
    if (result.terrainDetailTileMode !== "index") {
      throw new Error(`Expected local DEM tile index mode, got ${result.terrainDetailTileMode}`);
    }
    if (Number(result.terrainDetailTileCount) < 16) {
      throw new Error(`Expected at least sixteen local DEM tiles, got ${result.terrainDetailTileCount}`);
    }
    if (Number(result.terrainSourceCatalogCount) < 3) {
      throw new Error(`Expected at least three real terrain source catalog entries, got ${result.terrainSourceCatalogCount}`);
    }
    if (result.terrainSourceCatalogPrimary !== "mapzen-terrain-tiles-aws") {
      throw new Error(`Expected Mapzen terrain source as first import target, got ${result.terrainSourceCatalogPrimary}`);
    }

    const output = `${JSON.stringify({ ...terrainTileResult, ...result, cityLabelUpdateScheduledSettled }, null, 2)}\n`;
    writeVerificationOutput({
      outputPath: process.env.PATCH_CONSOLE_VERIFY_OUTPUT,
      defaultOutputPath: path.join(ROOT, ".tmp", "patch-console-verify-result.json"),
      text: output,
    });
  } finally {
    window.destroy();
    server.close();
    activeWindow = null;
    activeServer = null;
    app.quit();
  }
}

main().catch((error) => {
  safeWriteStream(process.stderr, `${error.stack || error.message}\n`);
  app.exit(1);
});
