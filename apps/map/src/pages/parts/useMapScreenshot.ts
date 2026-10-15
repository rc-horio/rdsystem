import { useEffect, useRef, type MutableRefObject } from "react";
import html2canvas from "html2canvas";

export function useMapScreenshot(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  mapDivRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const { mapRef, mapDivRef } = args;
  const tileSessionRef = useRef<TileSession | null>(null);

  const waitForMapIdle = () =>
    new Promise<void>((resolve) => {
      const map = mapRef.current;
      if (!map) {
        resolve();
        return;
      }

      let settled = false;
      const fallback = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve();
      }, 2000);

      const listener = map.addListener("idle", () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallback);
        listener.remove();
        resolve();
      });
    });

  type StaticMapResult = {
    img: HTMLImageElement;
    url: string;
    params: {
      center: { lat: number; lng: number };
      zoom: number;
      baseZoom: number;
      zoomFraction: number;
      zoomScale: number;
      safeZoom: number;
      safeCenter: { lat: number; lng: number };
      size: { width: number; height: number };
      scale: number;
      heading: number;
    };
  };

  type ScreenshotResult = {
    dataUrl: string;
    debug: {
      view: {
        center: { lat: number; lng: number } | null;
        zoom: number | null;
        bounds: google.maps.LatLngBoundsLiteral | null;
        heading: number;
      };
      captureView: {
        center: { lat: number; lng: number } | null;
        zoom: number | null;
        bounds: google.maps.LatLngBoundsLiteral | null;
        heading: number;
      };
      originalView: {
        center: { lat: number; lng: number } | null;
        zoom: number | null;
        bounds: google.maps.LatLngBoundsLiteral | null;
        heading: number;
      };
      staticMap: { url: string; params: StaticMapResult["params"] } | null;
      tileMeta: {
        devicePixelRatio: number;
        output: { widthPx: number; heightPx: number };
        baseCoveragePx: number;
        tileWidth: number | null;
        tileHeight: number | null;
        zoom: number;
        baseZoom: number;
        zoomScale: number;
        css: { width: number; height: number };
      } | null;
    };
  };

  type TileSession = {
    session: string;
    expiry: number;
    tileWidth: number;
    tileHeight: number;
    imageFormat: string;
  };

  const loadImageFromBlob = (blob: Blob) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("static map image load failed"));
      };
      img.src = url;
    });

  const buildTileMapImage = async (
    cssWidth: number,
    cssHeight: number,
    widthPx: number,
    heightPx: number,
    heading: number,
    sessionRef: MutableRefObject<TileSession | null>
  ): Promise<StaticMapResult> => {
    const map = mapRef.current;
    if (!map) throw new Error("map not ready");

    const apiKey = import.meta.env.VITE_GMAPS_API_KEY;
    if (!apiKey) throw new Error("VITE_GMAPS_API_KEY is missing");

    const tileBase =
      import.meta.env.VITE_TILE_API_BASE_URL || "/__gtile";

    const nowSec = Math.floor(Date.now() / 1000);
    if (!sessionRef.current || sessionRef.current.expiry - nowSec < 60) {
      const res = await fetch(
        `${tileBase}/v1/createSession?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mapType: "satellite",
            language: "ja",
            region: "JP",
          }),
        }
      );
      if (!res.ok) {
        throw new Error("tile session create failed");
      }
      const data = (await res.json()) as TileSession;
      sessionRef.current = {
        session: data.session,
        expiry: Number(data.expiry),
        tileWidth: data.tileWidth,
        tileHeight: data.tileHeight,
        imageFormat: data.imageFormat,
      };
    }

    const session = sessionRef.current!;
    const tileSize = session.tileWidth || 256;

    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!center || zoom == null) throw new Error("map view not ready");

    const baseZoom = Math.max(0, Math.min(22, Math.floor(zoom)));
    const zoomFraction = zoom - baseZoom;
    const zoomScale =
      zoomFraction > 0 ? Math.pow(2, zoomFraction) : 1;

    const diagCss = Math.ceil(Math.sqrt(cssWidth ** 2 + cssHeight ** 2));
    const baseCoverageCss = Math.ceil(diagCss / zoomScale);

    const lat = center.lat();
    const lng = center.lng();

    const siny = Math.min(
      Math.max(Math.sin((lat * Math.PI) / 180), -0.9999),
      0.9999
    );
    const worldX = tileSize * (lng / 360 + 0.5);
    const worldY =
      tileSize *
      (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
    const scale = Math.pow(2, baseZoom);
    const centerPx = { x: worldX * scale, y: worldY * scale };

    const topLeft = {
      x: centerPx.x - baseCoverageCss / 2,
      y: centerPx.y - baseCoverageCss / 2,
    };
    const bottomRight = {
      x: centerPx.x + baseCoverageCss / 2,
      y: centerPx.y + baseCoverageCss / 2,
    };

    const maxTile = Math.pow(2, baseZoom);
    const xStart = Math.floor(topLeft.x / tileSize);
    const yStart = Math.floor(topLeft.y / tileSize);
    const xEnd = Math.floor((bottomRight.x - 1) / tileSize);
    const yEnd = Math.floor((bottomRight.y - 1) / tileSize);

    const mosaic = document.createElement("canvas");
    mosaic.width = baseCoverageCss;
    mosaic.height = baseCoverageCss;
    const mctx = mosaic.getContext("2d");
    if (!mctx) throw new Error("tile mosaic context failed");
    mctx.imageSmoothingEnabled = false;

    const tasks: Array<Promise<void>> = [];
    for (let ty = yStart; ty <= yEnd; ty += 1) {
      if (ty < 0 || ty >= maxTile) continue;
      for (let tx = xStart; tx <= xEnd; tx += 1) {
        const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
        const url = `${tileBase}/v1/2dtiles/${baseZoom}/${wrappedX}/${ty}?session=${encodeURIComponent(
          session.session
        )}&key=${encodeURIComponent(apiKey)}`;
        const dx = Math.round(tx * tileSize - topLeft.x);
        const dy = Math.round(ty * tileSize - topLeft.y);
        tasks.push(
          (async () => {
            const res = await fetch(url);
            if (!res.ok) return;
            const img = await loadImageFromBlob(await res.blob());
            // 1px オーバーラップでタイルの継ぎ目を消す
            mctx.drawImage(img, dx, dy, tileSize + 1, tileSize + 1);
          })()
        );
      }
    }
    await Promise.all(tasks);

    let img: HTMLImageElement = await loadImageFromBlob(
      await new Promise<Blob>((resolve, reject) =>
        mosaic.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("tile mosaic failed"))),
          "image/png"
        )
      )
    );

    if (zoomScale !== 1) {
      const scaled = document.createElement("canvas");
      scaled.width = Math.max(1, Math.round(img.width * zoomScale));
      scaled.height = Math.max(1, Math.round(img.height * zoomScale));
      const sctx = scaled.getContext("2d");
      if (sctx) {
        sctx.drawImage(img, 0, 0, scaled.width, scaled.height);
        img = await loadImageFromBlob(
          await new Promise<Blob>((resolve, reject) =>
            scaled.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("tile scale failed"))),
              "image/png"
            )
          )
        );
      }
    }

    const dpr = window.devicePixelRatio || 1;
    if (dpr !== 1) {
      const scaled = document.createElement("canvas");
      scaled.width = Math.max(1, Math.round(img.width * dpr));
      scaled.height = Math.max(1, Math.round(img.height * dpr));
      const sctx = scaled.getContext("2d");
      if (sctx) {
        sctx.drawImage(img, 0, 0, scaled.width, scaled.height);
        img = await loadImageFromBlob(
          await new Promise<Blob>((resolve, reject) =>
            scaled.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("tile dpr scale failed"))),
              "image/png"
            )
          )
        );
      }
    }

    const rad = (-heading * Math.PI) / 180;
    const baseW = img.width;
    const baseH = img.height;
    const tempDiag = Math.ceil(Math.sqrt(baseW ** 2 + baseH ** 2));
    const temp = document.createElement("canvas");
    temp.width = tempDiag;
    temp.height = tempDiag;
    const tctx = temp.getContext("2d");
    if (!tctx) throw new Error("tile rotate context failed");
    tctx.translate(tempDiag / 2, tempDiag / 2);
    tctx.rotate(rad);
    tctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);

    const out = document.createElement("canvas");
    out.width = widthPx;
    out.height = heightPx;
    const octx = out.getContext("2d");
    if (!octx) throw new Error("tile crop context failed");
    const sx = Math.max(0, Math.round((tempDiag - widthPx) / 2));
    const sy = Math.max(0, Math.round((tempDiag - heightPx) / 2));
    octx.drawImage(temp, sx, sy, widthPx, heightPx, 0, 0, widthPx, heightPx);

    const rotatedImg = await loadImageFromBlob(
      await new Promise<Blob>((resolve, reject) =>
        out.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("tile crop failed"))),
          "image/png"
        )
      )
    );

    return {
      img: rotatedImg,
      url: `tiles://${baseZoom}/${xStart}-${xEnd}/${yStart}-${yEnd}`,
      params: {
        center: { lat, lng },
        zoom,
        baseZoom,
        zoomFraction,
        zoomScale,
        safeZoom: baseZoom,
        safeCenter: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) },
        size: { width: baseCoverageCss, height: baseCoverageCss },
        scale: 1,
        heading,
      },
    };
  };

  const buildStaticMapImage = async (
    widthPx: number,
    heightPx: number,
    heading: number
  ): Promise<StaticMapResult> => {
    const map = mapRef.current;
    if (!map) throw new Error("map not ready");

    const isDefaultView = (center: google.maps.LatLng, zoom: number) =>
      Math.abs(center.lat()) < 1e-3 && Math.abs(center.lng()) < 1e-3 && zoom <= 2;

    const getStableView = async () => {
      let lastCenter: google.maps.LatLng | null | undefined = null;
      let lastZoom: number | null = null;
      let lastBounds: google.maps.LatLngBounds | null = null;

      for (let i = 0; i < 6; i += 1) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = map.getBounds();

        lastCenter = center;
        lastZoom = zoom ?? null;
        lastBounds = bounds ?? null;

        if (center && zoom != null && !isDefaultView(center, zoom)) {
          return { center, zoom, bounds };
        }

        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      }

      if (!lastCenter || lastZoom == null) {
        throw new Error("map view not ready");
      }
      if (isDefaultView(lastCenter, lastZoom)) {
        throw new Error("map view not stabilized (default view)");
      }
      return { center: lastCenter, zoom: lastZoom, bounds: lastBounds };
    };

    const { center, zoom } = await getStableView();

    const apiKey = import.meta.env.VITE_GMAPS_API_KEY;
    if (!apiKey) throw new Error("VITE_GMAPS_API_KEY is missing");

    const staticScale = Math.min(
      2,
      Math.max(1, Math.round(window.devicePixelRatio || 1))
    );
    const diag = Math.ceil(Math.sqrt(widthPx ** 2 + heightPx ** 2));
    const overscan = 1.2;
    const sizeW = Math.min(
      640,
      Math.round((diag * overscan) / staticScale)
    );
    const sizeH = Math.min(
      640,
      Math.round((diag * overscan) / staticScale)
    );

    const base =
      import.meta.env.VITE_STATIC_MAP_BASE_URL ||
      "/__gstatic/maps/api/staticmap";
    const u = new URL(base, window.location.origin);
    u.searchParams.set("size", `${sizeW}x${sizeH}`);
    u.searchParams.set("scale", String(staticScale));
    u.searchParams.set("format", "png");
    u.searchParams.set(
      "maptype",
      String(map.getMapTypeId() || "satellite")
    );

    const mapId = import.meta.env.VITE_GMAPS_MAP_ID;
    if (mapId) u.searchParams.set("map_id", mapId);

    // center/zoom をそのまま使って地理的整合を優先
    const baseZoom = Math.max(1, Math.min(21, Math.floor(zoom)));
    const zoomFraction = zoom - baseZoom;
    const zoomScale =
      zoomFraction > 0 ? Math.pow(2, zoomFraction) : 1;
    const safeZoom = baseZoom;
    const safeLat = Number(center.lat().toFixed(6));
    const safeLng = Number(center.lng().toFixed(6));
    u.searchParams.set("center", `${safeLat},${safeLng}`);
    u.searchParams.set("zoom", String(safeZoom));

    u.searchParams.set("key", apiKey);

    const url = u.toString();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        "static map fetch failed (check /__gstatic proxy or VITE_STATIC_MAP_BASE_URL)"
      );
    }

    let img = await loadImageFromBlob(await res.blob());
    if (zoomScale !== 1) {
      const scaled = document.createElement("canvas");
      scaled.width = Math.max(1, Math.round(img.width * zoomScale));
      scaled.height = Math.max(1, Math.round(img.height * zoomScale));
      const sctx = scaled.getContext("2d");
      if (sctx) {
        sctx.drawImage(img, 0, 0, scaled.width, scaled.height);
        img = await loadImageFromBlob(
          await new Promise<Blob>((resolve, reject) =>
            scaled.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("scale failed"))),
              "image/png"
            )
          )
        );
      }
    }

    // 回転が必要なら中心で回転して切り抜く
    if (!heading) {
      const result: StaticMapResult = {
        img,
        url,
        params: {
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
          baseZoom,
          zoomFraction,
          zoomScale,
          safeZoom,
          safeCenter: { lat: safeLat, lng: safeLng },
          size: { width: sizeW, height: sizeH },
          scale: staticScale,
          heading,
        },
      };
      return result;
    }

    const rad = (-heading * Math.PI) / 180;
    const baseW = img.width;
    const baseH = img.height;
    const tempDiag = Math.ceil(Math.sqrt(baseW ** 2 + baseH ** 2));

    const temp = document.createElement("canvas");
    temp.width = tempDiag;
    temp.height = tempDiag;
    const tctx = temp.getContext("2d");
    if (!tctx) {
      return {
        img,
        url,
        params: {
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
          baseZoom,
          zoomFraction,
          zoomScale,
          safeZoom,
          safeCenter: { lat: safeLat, lng: safeLng },
          size: { width: sizeW, height: sizeH },
          scale: staticScale,
          heading,
        },
      };
    }

    tctx.translate(tempDiag / 2, tempDiag / 2);
    tctx.rotate(rad);
    tctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);

    const out = document.createElement("canvas");
    out.width = widthPx;
    out.height = heightPx;
    const octx = out.getContext("2d");
    if (!octx) {
      return {
        img,
        url,
        params: {
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
          baseZoom,
          zoomFraction,
          zoomScale,
          safeZoom,
          safeCenter: { lat: safeLat, lng: safeLng },
          size: { width: sizeW, height: sizeH },
          scale: staticScale,
          heading,
        },
      };
    }

    const sx = Math.max(0, Math.round((tempDiag - widthPx) / 2));
    const sy = Math.max(0, Math.round((tempDiag - heightPx) / 2));
    octx.drawImage(temp, sx, sy, widthPx, heightPx, 0, 0, widthPx, heightPx);

    const rotatedImg = await loadImageFromBlob(
      await new Promise<Blob>((resolve, reject) =>
        out.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("rotate failed"))),
          "image/png"
        )
      )
    );

    const result: StaticMapResult = {
      img: rotatedImg,
      url,
      params: {
        center: { lat: center.lat(), lng: center.lng() },
        zoom,
        baseZoom,
        zoomFraction,
        zoomScale,
        safeZoom,
        safeCenter: { lat: safeLat, lng: safeLng },
        size: { width: sizeW, height: sizeH },
        scale: staticScale,
        heading,
      },
    };
    return result;
  };

  const captureScreenshot = async (): Promise<ScreenshotResult> => {
    const target =
      (document.querySelector(".map-page") as HTMLElement | null) ||
      mapDivRef.current ||
      document.body;

    const rect = target.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    const widthPx = Math.round(cssWidth * scale);
    const heightPx = Math.round(cssHeight * scale);

    const labelNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".arrow-label")
    );
    const labelSnapshots = labelNodes.map((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize || "17");
      const fontWeight = style.fontWeight || "400";
      const fontFamily = style.fontFamily || "Roboto, Arial, sans-serif";
      let textRect: DOMRect | null = null;
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.selectNodeContents(el);
        textRect = range.getBoundingClientRect();
      }
      return {
        text: el.textContent || "",
        rect,
        textRect,
        fontSize,
        fontWeight,
        fontFamily,
      };
    });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const overlayCanvas = await html2canvas(target, {
      useCORS: true,
      backgroundColor: null,
      scale,
      logging: false,
      ignoreElements: (el) => {
        if (el instanceof HTMLImageElement) {
          const src = el.src || "";
          if (
            src.includes("googleapis.com/maps/vt") ||
            src.includes("google.com/maps/vt") ||
            src.includes("gstatic.com/maps/vt")
          ) {
            return true; // 走査タイルだけ除外
          }
        }
        return false;
      },
      onclone: (doc) => {
        const root = doc.querySelector(".map-page") as HTMLElement | null;
        if (root) {
          root.style.background = "transparent";
          root.style.backgroundColor = "transparent";
        }

        const mapRoot = doc.querySelector("#map") as HTMLElement | null;
        if (mapRoot) {
          mapRoot.style.background = "transparent";
          mapRoot.style.backgroundColor = "transparent";

          const images = mapRoot.querySelectorAll("img");
          images.forEach((img) => {
            const src = img.getAttribute("src") || "";
            if (
              src.includes("googleapis.com/maps/vt") ||
              src.includes("google.com/maps/vt") ||
              src.includes("gstatic.com/maps/vt")
            ) {
              (img as HTMLElement).style.display = "none";
            }
          });

          const elements = mapRoot.querySelectorAll<HTMLElement>("*");
          elements.forEach((el) => {
            const bg = el.style.backgroundImage || "";
            if (
              bg.includes("googleapis.com/maps/vt") ||
              bg.includes("google.com/maps/vt") ||
              bg.includes("gstatic.com/maps/vt")
            ) {
              el.style.backgroundImage = "none";
            }
            if (el.style.backgroundColor) {
              el.style.backgroundColor = "transparent";
            }
          });
        }

        doc.querySelectorAll(".arrow-label").forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      },
    });

    const map = mapRef.current;
    const heading = map?.getHeading?.() ?? 0;
    const originalView = map
      ? {
          center: map.getCenter()
            ? { lat: map.getCenter()!.lat(), lng: map.getCenter()!.lng() }
            : null,
          zoom: map.getZoom() ?? null,
          bounds: map.getBounds()?.toJSON() ?? null,
          heading,
        }
      : {
          center: null,
          zoom: null,
          bounds: null,
          heading,
        };

    const captureView = originalView;

    let backgroundImg: HTMLImageElement | null = null;
    let staticDebug: { url: string; params: StaticMapResult["params"] } | null =
      null;
    try {
      const result = await buildTileMapImage(
        cssWidth,
        cssHeight,
        widthPx,
        heightPx,
        heading,
        tileSessionRef
      );
      backgroundImg = result.img;
      staticDebug = { url: result.url, params: result.params };
    } catch (e) {
      console.warn("[map] tiles map failed, fallback to static:", e);
      try {
        const staticBase =
          import.meta.env.VITE_STATIC_MAP_BASE_URL ||
          (import.meta.env.DEV ? "/__gstatic/maps/api/staticmap" : "");
        if (staticBase) {
          const fallback = await buildStaticMapImage(
            widthPx,
            heightPx,
            heading
          );
          backgroundImg = fallback.img;
          staticDebug = { url: fallback.url, params: fallback.params };
        }
      } catch (err) {
        console.warn("[map] static map fallback failed:", err);
      }
    }
    if (!backgroundImg) {
      throw new Error(
        "static map image not available (check proxy/API key/restrictions)"
      );
    }

    const output = document.createElement("canvas");
    output.width = overlayCanvas.width;
    output.height = overlayCanvas.height;
    const ctx = output.getContext("2d");
    if (!ctx) {
      throw new Error("screenshot canvas context unavailable");
    }

    ctx.drawImage(backgroundImg, 0, 0, output.width, output.height);
    ctx.drawImage(overlayCanvas, 0, 0);

    // ラベルは DOM 位置から直接描画（html2canvasの文字ズレ回避）
    const targetRect = target.getBoundingClientRect();
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    ctx.save();
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    for (const item of labelSnapshots) {
      if (!item.text || !item.rect) continue;
      const rect = item.rect;
      const rx = (rect.left - targetRect.left) * scale;
      const ry = (rect.top - targetRect.top) * scale;
      const rw = rect.width * scale;
      const rh = rect.height * scale;

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      drawRoundRect(rx, ry, rw, rh, 4 * scale);
      ctx.fill();

      const textRect = item.textRect || rect;
      const dx = textRect.left - rect.left;
      const dy = textRect.top - rect.top;
      const tx = rx + dx * scale;
      const ty = ry + dy * scale + 3 * scale;
      const fontPx = Math.max(1, item.fontSize * scale);
      ctx.font = `${item.fontWeight} ${fontPx}px ${item.fontFamily}`;
      ctx.fillStyle = "#000";
      ctx.fillText(item.text, tx, ty);
    }
    ctx.restore();

    const result: ScreenshotResult = {
      dataUrl: output.toDataURL("image/png"),
      debug: {
        view: captureView,
        captureView,
        originalView,
        staticMap: staticDebug,
        tileMeta: staticDebug
          ? {
              devicePixelRatio: window.devicePixelRatio || 1,
              output: { widthPx, heightPx },
              baseCoveragePx: staticDebug.params.size.width,
              tileWidth: tileSessionRef.current?.tileWidth ?? null,
              tileHeight: tileSessionRef.current?.tileHeight ?? null,
              zoom: staticDebug.params.zoom,
              baseZoom: staticDebug.params.baseZoom,
              zoomScale: staticDebug.params.zoomScale,
              css: { width: cssWidth, height: cssHeight },
            }
          : null,
      },
    };
    return result;
  };

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; requestId?: string }
        | undefined;
      if (!data || data.type !== "RDHUB_REQUEST_SCREENSHOT") return;
      if (!import.meta.env.DEV && event.origin !== window.location.origin) {
        return;
      }

      const requestId = data.requestId || "";
      try {
        await waitForMapIdle();
        const result = await captureScreenshot();
        if (event.source && "postMessage" in event.source) {
          (event.source as Window).postMessage(
            {
              type: "RDHUB_SCREENSHOT_RESULT",
              requestId,
              ok: true,
              dataUrl: result.dataUrl,
              debug: result.debug,
            },
            event.origin
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "screenshot failed";
        if (event.source && "postMessage" in event.source) {
          (event.source as Window).postMessage(
            {
              type: "RDHUB_SCREENSHOT_RESULT",
              requestId,
              ok: false,
              error: message,
            },
            event.origin
          );
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
}
