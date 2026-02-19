// src/pages/parts/MapView.tsx
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import html2canvas from "html2canvas";
import { Loader } from "@googlemaps/js-api-loader";
import {
  createMarkerIcon,
  useDraggableMetricsPanel,
  useEditableBodyClass,
  useAddAreaMode,
  useMeasurementMode,
  useScheduleSection,
  useCandidateSection,
} from "@/components";
import type { Props, Point, Geometry } from "@/features/types";
import { fetchAreaInfo, createNewArea } from "./areasApi";
import { EV_DETAILBAR_SELECTED, OPEN_INFO_ON_SELECT } from "./constants/events";
import "../map.css";
import {
  openDetailBar,
  closeDetailBar,
  setDetailBarTitle,
  setDetailBarHistory,
  setDetailBarMeta,
  setDetailBarMetrics,
} from "./SideDetailBar";
import { MapGeometry } from "./MapGeometry";
import { fromLocalXY } from "./geometry/math";
import {
  NAME_UNSET,
  AREA_NAME_NONE,
  SELECT_ZOOM_DESKTOP,
  SELECT_ZOOM_MOBILE,
  MIN_ZOOM_DELTA_TO_CHANGE,
  EV_MAP_FOCUS_ONLY,
  EV_SIDEBAR_OPEN,
  EV_SIDEBAR_SET_ACTIVE,
  EV_SIDEBAR_VISIBLE_AREAS,
  MARKERS_HIDE_ZOOM,
  DEFAULTS,
  EV_PROJECT_MODAL_OPEN,
  ADD_AREA_EMPTY_MESSAGE,
  ADD_AREA_ERROR_MESSAGE,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_ADD_AREA_SELECT_RESULT,
  EV_ADD_AREA_RESULT_COORDS,
} from "./constants/events";
import { AddAreaModal } from "./AddAreaModal";
import { RegisterProjectModal } from "./RegisterProjectModal";

// 本番用のCatalogのベースURL
const CATALOG =
  String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(/\/+$/, "") + "/";

type AddAreaSearchResult = {
  placeId: string;
  label: string; // 表示用（name / formatted_address）
};

/** =========================
 *  Component
 *  ========================= */
export default function MapView({ onLoaded }: Props) {
  /** ---- Refs (Map / UI state) ---- */
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const desiredHeadingRef = useRef(0);
  const tileSessionRef = useRef<TileSession | null>(null);

  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentProjectUuidRef = useRef<string | undefined>(undefined);
  const currentScheduleUuidRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);

  const [mapReady, setMapReady] = useState(false);
  const [showCreateGeomCta, setShowCreateGeomCta] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  // 「どのセクション由来の選択か」を保持（案件 or 候補）
  const [selectionKind, setSelectionKind] = useState<
    "schedule" | "candidate" | null
  >(null);

  const [showAreaCreatedToast, setShowAreaCreatedToast] = useState(false);
  const areaCreatedToastTimerRef = useRef<number | null>(null);

  // 座標変更完了トースト
  const [showPositionUpdatedToast, setShowPositionUpdatedToast] =
    useState(false);
  const positionUpdatedToastTimerRef = useRef<number | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  // ジオメトリ未作成メッセージ（マップ上に表示）
  const [showNoGeometryHint, setShowNoGeometryHint] = useState(false);

  useDraggableMetricsPanel();
  const editable = useEditableBodyClass();
  const editableRef = useRef(editable);

  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

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

    let overlayCanvas: HTMLCanvasElement;
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
    overlayCanvas = await html2canvas(target, {
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

  const {
    addingAreaMode,
    newAreaDraft,
    areaNameInput,
    setAreaNameInput,
    cancelAddMode,
    resetDraft,
  } = useAddAreaMode(mapRef);

  const {
    measurementMode,
    points: measurementPoints,
    totalDistance_m,
    previewDistance_m,
    cancelMeasurementMode,
    clearPoints: clearMeasurementPoints,
  } = useMeasurementMode(mapRef, mapReady);

  // エリア追加モードの現在値を参照するための ref
  const addingAreaModeRef = useRef(addingAreaMode);
  useEffect(() => {
    addingAreaModeRef.current = addingAreaMode;
  }, [addingAreaMode]);

  // 測定モードの現在値を参照するための ref
  const measurementModeRef = useRef(measurementMode);
  useEffect(() => {
    measurementModeRef.current = measurementMode;
  }, [measurementMode]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = selectedMarkerRef.current;
    const info = infoRef.current;

    // マップ or マーカー or InfoWindow が無ければ何もしない
    if (!map || !marker || !info) return;

    // 追加モード中 or 非編集モード のときは吹き出しを閉じる
    if (!editable || addingAreaModeRef.current) {
      info.close();
      return;
    }

    // 編集ON & エリア追加モードではない → 吹き出しを再表示（座標を変更ボタンだけ）
    const container = document.createElement("div");
    container.style.minWidth = "80px";
    container.style.textAlign = "center";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "座標を変更";
    btn.className = "marker-update-position-button";

    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      startChangePositionMode();

      const p = currentPointRef.current;
      if (!p) return;
      console.log("[marker] 座標を変更 clicked:", {
        areaUuid: p.areaUuid,
        lat: p.lat,
        lng: p.lng,
      });
    });

    container.appendChild(btn);
    info.setContent(container);
    info.open({ map, anchor: marker });
  }, [editable, addingAreaMode]);

  /** エリア追加モードをキャンセル */
  useEffect(() => {
    const onCancel = () => {
      cancelAddMode();
    };
    window.addEventListener("map:cancel-add-area", onCancel);
    return () => window.removeEventListener("map:cancel-add-area", onCancel);
  }, [cancelAddMode]);

  /** 新規エリア作成完了トーストを一定時間表示 */
  const notifyAreaCreated = () => {
    // 既存タイマーがあればクリア
    if (areaCreatedToastTimerRef.current != null) {
      window.clearTimeout(areaCreatedToastTimerRef.current);
    }
    setShowAreaCreatedToast(true);
    areaCreatedToastTimerRef.current = window.setTimeout(() => {
      setShowAreaCreatedToast(false);
      areaCreatedToastTimerRef.current = null;
    }, 3000); // 3秒表示
  };

  /** 座標変更完了トーストを一定時間表示 */
  const notifyPositionUpdated = () => {
    if (positionUpdatedToastTimerRef.current != null) {
      window.clearTimeout(positionUpdatedToastTimerRef.current);
    }
    setShowPositionUpdatedToast(true);
    positionUpdatedToastTimerRef.current = window.setTimeout(() => {
      setShowPositionUpdatedToast(false);
      positionUpdatedToastTimerRef.current = null;
    }, 3000); // 3秒表示
  };

  /** マーカー管理（キー検索/逆引き用） */
  const markerByKeyRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const pointByMarkerRef = useRef<WeakMap<google.maps.Marker, Point>>(
    new WeakMap()
  );
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const changingPositionRef = useRef(false);
  const [isChangingPosition, setIsChangingPosition] = useState(false);
  const changePositionInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const changePositionCandidateRef = useRef<{
    lat: number;
    lng: number;
  } | null>(null);
  const selectByKeyRef = useRef<
    (keys: { areaUuid?: string; areaName?: string }) => void
  >(() => { });
  const currentPointRef = useRef<Point | null>(null);

  // 初期コンテキスト（URLパラメータ）からの自動選択
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // モードと初期傾きを取得
    const areaUuidFromUrl = params.get("areaUuid") || undefined;
    const projectUuidFromUrl = params.get("projectUuid") || undefined;
    const scheduleUuidFromUrl = params.get("scheduleUuid") || undefined;

    // refs に保持（schedule 選択で利用する想定）
    currentProjectUuidRef.current = projectUuidFromUrl;
    currentScheduleUuidRef.current = scheduleUuidFromUrl;

    if (!areaUuidFromUrl) return;

    const timer = setTimeout(() => {
      selectByKeyRef.current?.({ areaUuid: areaUuidFromUrl });
      console.log("[MapView] auto-selected from URL:", {
        areaUuidFromUrl,
        projectUuidFromUrl,
        scheduleUuidFromUrl,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // サイドバー等から「今の代表点座標」を問い合わせるためのイベント
  useEffect(() => {
    const onRequestCurrentPoint = () => {
      window.dispatchEvent(
        new CustomEvent("map:respond-current-point", {
          detail: currentPointRef.current,
        })
      );
    };

    window.addEventListener(
      "map:request-current-point",
      onRequestCurrentPoint as EventListener
    );
    return () => {
      window.removeEventListener(
        "map:request-current-point",
        onRequestCurrentPoint as EventListener
      );
    };
  }, []);

  // 案件情報モーダルを開くイベント
  useEffect(() => {
    const onOpen = () => {
      setIsProjectModalOpen(true);
    };
    window.addEventListener(EV_PROJECT_MODAL_OPEN, onOpen as EventListener);
    return () => {
      window.removeEventListener(
        EV_PROJECT_MODAL_OPEN,
        onOpen as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const onSelectCandidate = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            geometry?: Partial<Geometry>;
            index?: number;
            title?: string;
          }>
        ).detail || {};

      const g = d.geometry;

      const missing =
        !g ||
        (!g.takeoffArea &&
          !g.flightArea &&
          !g.safetyArea &&
          !g.audienceArea &&
          g.flightAltitude_min_m == null &&
          g.flightAltitude_Max_m == null);

      // 候補選択中で未作成なら表示、作成済みなら非表示
      // ※表示/非表示の最終決定は後段（selectionKind も加味）でやるが、
      // ここでは候補側の未作成フラグとして保持する
      candidateGeomMissingRef.current = missing;
      updateNoGeomHint();
    };

    window.addEventListener(
      EV_DETAILBAR_SELECT_CANDIDATE,
      onSelectCandidate as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SELECT_CANDIDATE,
        onSelectCandidate as EventListener
      );
  }, []);

  // エリア追加モード時の検索を送信
  useEffect(() => {
    const onSearch = async (e: Event) => {
      const q =
        (e as CustomEvent<{ query?: string }>).detail?.query?.trim() ?? "";
      if (!q) return;

      const map = mapRef.current;
      if (!map) return;

      try {
        const gmaps = getGMaps();
        const { Place } = (await gmaps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const req = {
          textQuery: q,
          region: "JP",
          language: "ja",
          maxResultCount: 10,
          // 任意：地図中心付近を優先（要件に合わせて調整）
          locationBias: map.getCenter() ?? undefined,
          fields: ["displayName", "formattedAddress"],
        };

        const { places } = await Place.searchByText(req);

        if (!places || places.length === 0) {
          window.dispatchEvent(
            new CustomEvent("map:add-area-search-result", {
              detail: {
                status: "empty" as const,
                results: [],
                message: ADD_AREA_EMPTY_MESSAGE,
              },
            })
          );
          return;
        }

        const formatted: AddAreaSearchResult[] = places
          .slice(0, 10)
          .flatMap((p) => {
            const placeId = p.id;
            if (!placeId) return [];

            const name = typeof p.displayName === "string" ? p.displayName : "";
            const addr =
              typeof p.formattedAddress === "string" ? p.formattedAddress : "";
            const label = `${name}${addr ? " / " + addr : ""}`.trim();

            return [{ placeId, label: label || "(名称不明)" }];
          });

        window.dispatchEvent(
          new CustomEvent("map:add-area-search-result", {
            detail: {
              status: "ok" as const,
              results: formatted,
              message: null,
            },
          })
        );
      } catch (err) {
        console.warn("[add-area] Place.searchByText failed:", err);
        window.dispatchEvent(
          new CustomEvent("map:add-area-search-result", {
            detail: {
              status: "error" as const,
              results: [],
              message: ADD_AREA_ERROR_MESSAGE,
            },
          })
        );
      }
    };

    window.addEventListener("map:search-add-area", onSearch as EventListener);
    return () =>
      window.removeEventListener(
        "map:search-add-area",
        onSearch as EventListener
      );
  }, []);

  // 検索結果を選択した場合の座標を取得
  useEffect(() => {
    const onSelectResult = async (e: Event) => {
      const placeId =
        (e as CustomEvent<{ placeId?: string }>).detail?.placeId ?? "";
      if (!placeId) return;

      const map = mapRef.current;
      if (!map) return;

      try {
        const gmaps = getGMaps();
        const { Place } = (await gmaps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const place = new Place({ id: placeId });

        // geometry ではなく location を取る（Place の新API）
        await place.fetchFields({ fields: ["location"] });

        const loc = place.location;
        if (!loc) {
          console.warn("[add-area] location missing:", { placeId });
          window.dispatchEvent(
            new CustomEvent(EV_ADD_AREA_RESULT_COORDS, { detail: { placeId } })
          );
          return;
        }

        const lat = loc.lat();
        const lng = loc.lng();

        console.log("[add-area] resolved coords:", { placeId, lat, lng });

        window.dispatchEvent(
          new CustomEvent(EV_ADD_AREA_RESULT_COORDS, {
            detail: { placeId, lat, lng },
          })
        );
      } catch (err) {
        console.warn("[add-area] Place.fetchFields failed:", { placeId, err });
        window.dispatchEvent(
          new CustomEvent(EV_ADD_AREA_RESULT_COORDS, { detail: { placeId } })
        );
      }
    };

    window.addEventListener(
      EV_ADD_AREA_SELECT_RESULT,
      onSelectResult as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_ADD_AREA_SELECT_RESULT,
        onSelectResult as EventListener
      );
  }, []);

  const candidateGeomMissingRef = useRef(false);

  const updateNoGeomHint = () => {
    // 選択されていない or 案件以外なら出さない
    if (!isSelected || selectionKind !== "schedule") {
      setShowNoGeometryHint(false);
      return;
    }

    // 案件：未作成なら showCreateGeomCta が true になる前提
    setShowNoGeometryHint(!!showCreateGeomCta);
  };

  useEffect(() => {
    updateNoGeomHint();
  }, [isSelected, selectionKind, showCreateGeomCta]);

  const startChangePositionMode = () => {
    // 座標変更モード開始
    changingPositionRef.current = true;
    setIsChangingPosition(true);
    changePositionCandidateRef.current = null;

    // カーソル変更
    const map = mapRef.current;
    map?.setOptions({ draggableCursor: "copy" });

    // いったん既存のマーカー吹き出しは閉じる
    infoRef.current?.close();

    // 座標変更モードに入ったら詳細バーを閉じる（リストバーの選択はそのまま）
    closeDetailBar();
  };

  const cancelChangePosition = () => {
    // 座標変更モードを終了
    changingPositionRef.current = false;
    setIsChangingPosition(false);

    // 候補クリア & 吹き出しを閉じる
    changePositionCandidateRef.current = null;
    changePositionInfoRef.current?.close();
    infoRef.current?.close();

    // カーソルを元に戻す
    const map = mapRef.current;
    map?.setOptions({ draggableCursor: undefined });
  };

  const openChangePositionConfirm = (
    latLng: google.maps.LatLng,
    lat: number,
    lng: number
  ) => {
    const map = mapRef.current;
    const gmaps = getGMaps();
    if (!map) return;

    if (!changePositionInfoRef.current) {
      changePositionInfoRef.current = new gmaps.InfoWindow();
    }

    changePositionCandidateRef.current = { lat, lng };

    const container = document.createElement("div");
    container.style.background = "white";
    container.style.padding = "8px 10px";
    container.style.borderRadius = "6px";
    container.style.fontSize = "13px";
    container.style.minWidth = "200px";
    container.style.color = "#222";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.marginBottom = "4px";
    title.textContent = "この地点にマーカーを移動しますか？";

    const coord = document.createElement("div");
    coord.style.fontFamily = "monospace";
    coord.style.fontSize = "12px";
    coord.style.color = "#444";
    coord.style.marginBottom = "6px";
    coord.textContent = `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`;

    const btnWrap = document.createElement("div");
    btnWrap.style.textAlign = "right";

    const yesBtn = document.createElement("button");
    yesBtn.textContent = "はい";
    yesBtn.style.padding = "2px 8px";
    yesBtn.style.marginRight = "4px";

    const noBtn = document.createElement("button");
    noBtn.textContent = "キャンセル";
    noBtn.style.padding = "2px 8px";

    btnWrap.appendChild(yesBtn);
    btnWrap.appendChild(noBtn);

    container.appendChild(title);
    container.appendChild(coord);
    container.appendChild(btnWrap);

    yesBtn.addEventListener("click", () => {
      const candidate = changePositionCandidateRef.current;
      const marker = selectedMarkerRef.current;
      const point = currentPointRef.current;

      if (candidate && marker && point) {
        const newLatLng = new gmaps.LatLng(candidate.lat, candidate.lng);
        marker.setPosition(newLatLng);

        const updatedPoint: Point = {
          ...point,
          lat: candidate.lat,
          lng: candidate.lng,
        };

        currentPointRef.current = updatedPoint;
        pointByMarkerRef.current.set(marker, updatedPoint);
      }

      // モード終了
      cancelChangePosition();

      // トースト表示
      notifyPositionUpdated();
    });

    noBtn.addEventListener("click", () => {
      // もう一度クリックさせたいので、ヒントだけ再表示
      setIsChangingPosition(true);
      changePositionCandidateRef.current = null;
      changePositionInfoRef.current?.close();
    });

    changePositionInfoRef.current.setContent(container);
    changePositionInfoRef.current.setPosition(latLng);
    changePositionInfoRef.current.open(map);
  };

  /** ジオメトリ描画/編集コントローラ */
  const geomRef = useRef<MapGeometry | null>(null);

  /** =========================
   *  Utils
   *  ========================= */

  const getGMaps = () =>
    (window as any).google.maps as unknown as typeof google.maps;

  const isFiniteNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

  /** 指定の全オーバーレイ（ジオメトリ側）を削除 */
  const clearGeometryOverlays = () => {
    geomRef.current?.clearOverlays();
  };

  /** フィルタで表示するエリア名（null = 全表示） */
  const visibleAreaNamesRef = useRef<Set<string> | null>(null);

  /** ズーム・フィルタに応じてマーカーの可視状態を同期 */
  const syncMarkersVisibilityForZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? 0;
    const hideByZoom = z >= MARKERS_HIDE_ZOOM;
    const visibleAreas = visibleAreaNamesRef.current;

    markersRef.current.forEach((m) => {
      const p = pointByMarkerRef.current.get(m);
      const areaKey = p?.areaName?.trim() || AREA_NAME_NONE;
      const visibleByFilter =
        !visibleAreas || visibleAreas.has(areaKey);
      const visible = !hideByZoom && visibleByFilter;
      m.setVisible(visible);
    });

    if (hideByZoom) {
      // マーカーを隠すときは InfoWindow も閉じる
      infoRef.current?.close();
    }
  };

  /** =========================
   *  Data loading
   *  ========================= */
  async function loadAreasPoints(): Promise<Point[]> {
    try {
      const resp = await fetch(CATALOG + "areas.json", {
        mode: "cors",
        cache: "no-store",
      });
      if (!resp.ok) throw new Error(`areas.json ${resp.status}`);
      const areasJson: any[] = await resp.json();

      const points: Point[] = (areasJson ?? [])
        .map((a) => {
          const lat = a?.representative_coordinate?.lat;
          const lon =
            a?.representative_coordinate?.lon ??
            a?.representative_coordinate?.lng;
          if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) return null;

          const areaName =
            typeof a?.areaName === "string" && a.areaName.trim()
              ? a.areaName
              : NAME_UNSET;
          if (import.meta.env.DEV && areaName === NAME_UNSET) {
            console.warn("[areas] areaName missing for areaUuid=", a?.areaUuid);
          }

          return {
            name: areaName,
            areaName,
            lat: Number(lat),
            lng: Number(lon),
            areaUuid:
              typeof a?.areaUuid === "string"
                ? a.areaUuid
                : typeof a?.uuid === "string"
                  ? a.uuid
                  : undefined,
          } as Point;
        })
        .filter((p): p is Point => !!p);

      if (import.meta.env.DEV)
        console.debug("[map] areas points=", points.length);
      return points;
    } catch (e) {
      console.warn("loadAreasPoints() fallback to local dev data.", e);
      return [
        {
          name: "エリアが登録されていません。",
          lat: 35.6861,
          lng: 139.4077,
          areaName: "エリアが登録されていません。",
        },
      ];
    }
  }

  /** =========================
   *  Marker rendering
   *  ========================= */
  function renderMarkers(points: Point[]) {
    const map = mapRef.current!;
    const gmaps = getGMaps();

    // 既存マーカーをクリア
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerByKeyRef.current.clear();
    pointByMarkerRef.current = new WeakMap();
    selectedMarkerRef.current = null;

    const normalIcon = createMarkerIcon(gmaps, {
      width: 30,
      height: 36,
      anchor: "bottom",
    });
    const selectedIcon = createMarkerIcon(gmaps, {
      width: 38,
      height: 46,
      anchor: "bottom",
    });

    const bounds = new gmaps.LatLngBounds();

    const applySelection = (marker: google.maps.Marker, selected: boolean) => {
      if (selected) {
        marker.setIcon(selectedIcon);
        marker.setZIndex(google.maps.Marker.MAX_ZINDEX ?? 999999);
      } else {
        marker.setIcon(normalIcon);
        marker.setZIndex(undefined);
      }
    };

    /** マーカーを選択した場合に地図を寄せる */
    const focusMapOnMarker = (
      mk: google.maps.Marker,
      opts?: { zoomTarget?: number; onlyPanIfClose?: boolean }
    ) => {
      const pos = mk.getPosition();
      if (!pos) return;

      map.panTo(pos);

      const currentZoom = map.getZoom() ?? 6;
      const target =
        opts?.zoomTarget ??
        (window.matchMedia?.("(max-width: 767px)").matches
          ? SELECT_ZOOM_MOBILE
          : SELECT_ZOOM_DESKTOP);

      const delta = Math.abs(target - currentZoom);
      if (opts?.onlyPanIfClose && delta < MIN_ZOOM_DELTA_TO_CHANGE) return;

      window.setTimeout(() => {
        map.setZoom(target);
      }, 120);
    };

    const openMarker = async (
      marker: google.maps.Marker,
      p: Point,
      skipFetch = false
    ) => {
      // 現在のポイントを保持
      currentPointRef.current = p;
      // エリアUUIDを保持（候補保存時に使用）
      currentAreaUuidRef.current = p.areaUuid || undefined;
      const map = mapRef.current!;
      const gmaps = getGMaps();

      window.dispatchEvent(new Event(EV_SIDEBAR_OPEN));

      // 編集モード & 追加モードではないときだけ吹き出し＋ボタンを表示
      if (
        infoRef.current &&
        editableRef.current &&
        !addingAreaModeRef.current
      ) {
        const container = document.createElement("div");
        container.style.minWidth = "80px";
        container.style.textAlign = "center";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "座標を変更";
        btn.className = "marker-update-position-button";

        btn.addEventListener("click", (e) => {
          e.stopPropagation();

          startChangePositionMode();

          const p = currentPointRef.current;
          if (!p) return;

          console.log("[marker] 座標を変更 clicked:", {
            areaUuid: p.areaUuid,
            lat: p.lat,
            lng: p.lng,
          });
        });

        container.appendChild(btn);

        infoRef.current.setContent(container);
        infoRef.current.open({ map, anchor: marker });
      } else {
        // 閲覧モード or 追加モードのときは吹き出しを出さない
        infoRef.current?.close();
      }

      marker.setAnimation(gmaps.Animation.DROP);
      setTimeout(() => marker.setAnimation(null), 700);

      const area = p.areaName?.trim() || AREA_NAME_NONE;
      openDetailBar();
      setDetailBarMetrics({});

      if (!skipFetch) {
        const { title, history, meta } = await fetchAreaInfo(p.areaUuid, area);
        setDetailBarTitle(title);
        setDetailBarHistory(history);
        setDetailBarMeta(meta);
      }

      window.dispatchEvent(
        new CustomEvent(EV_SIDEBAR_SET_ACTIVE, {
          detail: {
            areaName: area,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            skipFetch: true,
          },
        })
      );
    };

    const selectMarker = async (marker: google.maps.Marker, p: Point) => {
      if (selectedMarkerRef.current && selectedMarkerRef.current !== marker) {
        applySelection(selectedMarkerRef.current, false);
      }
      applySelection(marker, true);
      selectedMarkerRef.current = marker;

      focusMapOnMarker(marker, { onlyPanIfClose: true });
      await openMarker(marker, p);
    };

    points.forEach((p) => {
      const pos = new gmaps.LatLng(p.lat, p.lng);
      bounds.extend(pos);

      const marker = new gmaps.Marker({
        position: pos,
        map,
        title: p.name,
        icon: normalIcon,
      });
      markersRef.current.push(marker);

      if (p.areaUuid) markerByKeyRef.current.set(p.areaUuid, marker);
      const areaKey = p.areaName?.trim() || AREA_NAME_NONE;
      markerByKeyRef.current.set(areaKey, marker);
      pointByMarkerRef.current.set(marker, p);

      marker.addListener("click", () => {
        // エリア追加モード中なら、追加モードを解除して何もしない
        if (addingAreaModeRef.current) {
          cancelAddMode();
          return;
        }

        // 測定モード中ならマーカー選択は行わない
        if (measurementModeRef.current) {
          return;
        }

        // 通常モード時のみ、マーカー選択処理を実行
        selectMarker(marker, p);
      });
    });

    // 地図の初期方位を適用
    if (!bounds.isEmpty()) {
      if (desiredHeadingRef.current !== 0) {
        const h = desiredHeadingRef.current;
        const start = performance.now();
        const maxDurationMs = 1500;

        const enforceHeading = () => {
          if (map.getHeading() !== h) {
            map.moveCamera({ heading: h, tilt: 0 });
          }
          if (performance.now() - start > maxDurationMs) {
            idleListener.remove();
            headingListener.remove();
          }
        };

        const idleListener = map.addListener("idle", enforceHeading);
        const headingListener = map.addListener("heading_changed", enforceHeading);
        window.setTimeout(() => {
          idleListener.remove();
          headingListener.remove();
        }, maxDurationMs + 200);
      }
      map.fitBounds(bounds);
    }

    // サイドバーからのフォーカス要求に対応
    selectByKeyRef.current = ({ areaUuid, areaName }) => {
      const byKey = markerByKeyRef.current;

      let marker: google.maps.Marker | undefined =
        (areaUuid && byKey.get(areaUuid)) || undefined;

      if (!marker && areaName) {
        marker = byKey.get(areaName);
      }

      if (!marker) {
        console.warn("[map] marker NOT found for", { areaUuid, areaName });
        return;
      }

      // マーカーに対応するポイントを取得
      const p = pointByMarkerRef.current.get(marker);

      if (p) {
        // マーカーが選択されている場合は、選択されているマーカーを解除
        if (selectedMarkerRef.current && selectedMarkerRef.current !== marker) {
          applySelection(selectedMarkerRef.current, false);
        }
        applySelection(marker, true);
        selectedMarkerRef.current = marker;

        focusMapOnMarker(marker, { onlyPanIfClose: true });

        // UI更新のみ（fetch 済）
        openMarker(marker, p, true);
      }
    };

    syncMarkersVisibilityForZoom();
  }

  /** =========================
   *  Effects
   *  ========================= */

  // 初期化（Maps JS API 読み込み→地図生成→ポイント描画）
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapDivRef.current) return;

      const apiKey = import.meta.env.VITE_GMAPS_API_KEY;
      if (!apiKey) {
        console.error("VITE_GMAPS_API_KEY が .env にありません");
        return;
      }

      const loader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["geometry", "marker", "places"],
      });
      await loader.load();
      if (cancelled) return;

      // 地図の初期方位を決定（矩形の基準点が必ず矩形の左下に来るように回転）
      const params = new URLSearchParams(window.location.search);
      let desiredHeading = 0; // デフォルトは北上固定

      if (window !== window.top) {
        const rectStr = params.get("takeoffRect") || "";
        const refRaw = params.get("takeoffRef");
        const refIndex = Number(refRaw ?? 0);

        type LngLat = [number, number]; // [lng, lat]
        const normDeg = (d: number) => ((d % 360) + 360) % 360;

        const parseRect = (s: string): LngLat[] | null => {
          const parts = s
            .split(";")
            .map((t) => t.trim())
            .filter(Boolean);
          if (parts.length !== 4) return null;

          const pts: LngLat[] = [];
          for (const part of parts) {
            const [lngS, latS] = part.split(",").map((x) => x.trim());
            const lng = Number(lngS);
            const lat = Number(latS);
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
            pts.push([lng, lat]);
          }
          return pts;
        };

        // 緯度経度をローカルXYに変換（m近似）
        const toXY = (origin: LngLat, pt: LngLat) => {
          const R = 6378137; // WGS84
          const [lng0, lat0] = origin;
          const [lng, lat] = pt;
          const rad = Math.PI / 180;
          const x = (lng - lng0) * rad * R * Math.cos(lat0 * rad);
          const y = (lat - lat0) * rad * R;
          return { x, y };
        };

        // 北からの方位角（0=北, 90=東）
        const bearingDeg = (p: LngLat, q: LngLat) => {
          const v = toXY(p, q);
          return normDeg(Math.atan2(v.x, v.y) * (180 / Math.PI));
        };

        // Pを左下にするheadingを計算
        const computeEmbedHeading = () => {
          const rect = parseRect(rectStr);
          if (!rect) return 0;
          if (!Number.isFinite(refIndex)) return 0;

          const i0 = ((refIndex % 4) + 4) % 4; // 基準点
          const i1 = (i0 + 1) % 4;            // “次の要素”
          const P = rect[i0];
          const Q = rect[i1];

          const b = bearingDeg(P, Q);
          const h0 = normDeg(b - 90);        // P->Q を右向きにする候補
          const h1 = normDeg(h0 + 180);      // 反対向き候補

          // heading を適用した「画面座標(x=右, y=上)」を返す（Pを原点）
          // heading を適用した「画面座標(x=右, y=上)」を返す（Pを原点）
          const toScreenXY = (base: LngLat, pt: LngLat, heading: number) => {
            const pr = toXY(base, pt);               // pr.x=東, pr.y=北

            // heading を適用した「画面座標(x=右, y=上)」を返す（Pを原点）
            const a = (heading * Math.PI) / 180;

            const cos = Math.cos(a);
            const sin = Math.sin(a);
            return {
              x: pr.x * cos - pr.y * sin,
              y: pr.x * sin + pr.y * cos,
            };
          };

          const score = (h: number) => {
            const EPS = 1e-6;

            const q = toScreenXY(P, Q, h);
            const others = [0, 1, 2, 3].filter((i) => i !== i0);

            // 「基準点Pが左下」＝他3点が x>=0 かつ y>=0
            const allInFirstQuadrant = others.every((i) => {
              const v = toScreenXY(P, rect[i], h);
              return v.x >= -EPS && v.y >= -EPS;
            });

            // さらに「底辺」っぽさを強化：Qが右、かつほぼ水平
            const qRight = q.x > 0;
            const qFlat = Math.abs(q.y) < 5e-3; // 多少ゆるめ（距離による誤差吸収）

            // ok を最優先、ダメでもより近い方を選ぶ
            const ok = allInFirstQuadrant && qRight;
            const s =
              (ok ? 1000 : 0) +
              (allInFirstQuadrant ? 100 : 0) +
              (qRight ? 10 : 0) +
              (qFlat ? 1 : 0);

            return { ok, s };
          };

          const s0 = score(h0);
          const s1 = score(h1);

          if (s0.ok && !s1.ok) return h0;
          if (!s0.ok && s1.ok) return h1;
          return s0.s >= s1.s ? h0 : h1;
        };

        desiredHeading = computeEmbedHeading();
      }

      desiredHeadingRef.current = desiredHeading;
      // 地図の初期方位を保持
      desiredHeadingRef.current = desiredHeading;
      // Google Maps API を使用して地図を初期化
      const gmaps = getGMaps();
      const map = new gmaps.Map(mapDivRef.current as HTMLDivElement, {
        center: { lat: 35.0, lng: 137.0 },
        zoom: 6,

        // ストリートビュー、地図/航空写真の切替、ズームイン/アウトボタン非表示
        streetViewControl: false,
        mapTypeControl: false,

        // 航空写真モードを選択
        mapTypeId: gmaps.MapTypeId.SATELLITE,

        // 初期傾きを 0°（真上からの俯瞰）に固定
        tilt: 0,

        // 角度を指定
        heading: desiredHeadingRef.current,

        // 地図IDを指定
        mapId: import.meta.env.VITE_GMAPS_MAP_ID || undefined,
      });

      // Geometry controller
      mapRef.current = map;
      setMapReady(true);
      // デバッグ用に参照を公開（必要になったら削除）
      (window as any).__RD_MAP__ = map;
      infoRef.current = new gmaps.InfoWindow();
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng;

        // 座標変更モード中なら、クリック地点で確認用の吹き出しを出す
        if (changingPositionRef.current && latLng) {
          const lat = latLng.lat();
          const lng = latLng.lng();

          // 「変更後の地点をクリックしてください」ヒントはここで役目終了
          setIsChangingPosition(false);

          // 確認用の吹き出しを表示
          openChangePositionConfirm(latLng, lat, lng);
          return;
        }

        // 通常時はマーカーの InfoWindow を閉じるだけ
        infoRef.current?.close();
      });

      geomRef.current = new MapGeometry(() => mapRef.current, {
        getMeasurementMode: () => measurementModeRef.current,
      });

      // ズーム変更でマーカーの可視状態を更新
      zoomListenerRef.current = map.addListener("zoom_changed", () => {
        syncMarkersVisibilityForZoom();
      });

      const points = await loadAreasPoints();
      if (cancelled) return;

      onLoaded?.(points);
      renderMarkers(points);
    }

    init();
    return () => {
      cancelled = true;
      zoomListenerRef.current?.remove();
      zoomListenerRef.current = null;

      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      markerByKeyRef.current.clear();
      pointByMarkerRef.current = new WeakMap();
      selectedMarkerRef.current = null;
      if (OPEN_INFO_ON_SELECT) {
        infoRef.current?.close();
      }
      infoRef.current = null;

      clearGeometryOverlays();
      // トースト用タイマーの後始末
      if (areaCreatedToastTimerRef.current != null) {
        window.clearTimeout(areaCreatedToastTimerRef.current);
      }

      // 座標変更トーストのタイマー後始末
      if (positionUpdatedToastTimerRef.current != null) {
        window.clearTimeout(positionUpdatedToastTimerRef.current);
      }
    };
  }, []);

  // 座標変更モード中に、マップ以外がクリックされたらモード解除
  useEffect(() => {
    if (!editable) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // モード中でなければ何もしない
      if (!changingPositionRef.current) return;

      const target = e.target as Node | null;
      const mapEl = mapDivRef.current;
      const hintLayer = document.querySelector(".add-area-hint-layer");

      const clickedInsideMap = !!(mapEl && target && mapEl.contains(target));
      const clickedInsideHint = !!(
        hintLayer &&
        target &&
        hintLayer.contains(target)
      );

      // マップでもヒントレイヤーでもなければ、座標変更モードを終了
      if (!clickedInsideMap && !clickedInsideHint) {
        cancelChangePosition();
      }
    };

    // キャプチャフェーズで拾っておく（他のハンドラより前に動く）
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [editable]);

  // 外部イベント：map:focus-only -> 指定マーカーへフォーカス
  useEffect(() => {
    const onFocusOnly = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            areaUuid?: string;
            areaName?: string;
          }>
        ).detail || {};
      selectByKeyRef.current?.(d);
    };

    window.addEventListener(EV_MAP_FOCUS_ONLY, onFocusOnly as EventListener);
    return () =>
      window.removeEventListener(
        EV_MAP_FOCUS_ONLY,
        onFocusOnly as EventListener
      );
  }, []);

  // サイドバーのフィルタ結果：表示するエリアのマーカーのみ表示
  useEffect(() => {
    const onVisibleAreas = (e: Event) => {
      const d = (e as CustomEvent<{ visibleAreaNames?: string[] }>).detail;
      const names = d?.visibleAreaNames;
      visibleAreaNamesRef.current = Array.isArray(names)
        ? new Set(names)
        : null;
      syncMarkersVisibilityForZoom();
    };

    window.addEventListener(
      EV_SIDEBAR_VISIBLE_AREAS,
      onVisibleAreas as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_SIDEBAR_VISIBLE_AREAS,
        onVisibleAreas as EventListener
      );
  }, []);

  // 案件情報セクション（履歴）用の処理をフックに委譲
  useScheduleSection({
    geomRef,
    setShowCreateGeomCta,
    clearGeometryOverlays,
    setDetailBarMetrics,
    currentProjectUuidRef,
    currentScheduleUuidRef,
  });

  // 候補セクション用の処理をフックに委譲
  useCandidateSection({
    geomRef,
    setShowCreateGeomCta,
    clearGeometryOverlays,
    setDetailBarMetrics,
    currentProjectUuidRef,
    currentScheduleUuidRef,
    currentCandidateIndexRef,
    currentCandidateTitleRef,
    // 候補セクションでは CTA を使わないため、
    // タイトル確定時などに自動でデフォルトジオメトリを生成する
    createDefaultGeometryForCandidate: createDefaultGeometry,
  });

  // SideDetailBar から選択状態を受け取る
  useEffect(() => {
    const onSelectedStateChange = (e: Event) => {
      const detail =
        (
          e as CustomEvent<{
            isSelected?: boolean;
            kind?: "schedule" | "candidate" | null;
          }>
        ).detail || {};
      setIsSelected(!!detail.isSelected);
      setSelectionKind(detail.kind ?? null);
    };

    window.addEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    return () => {
      window.removeEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    };
  }, []);

  // 新規エリア追加モード中に、マップ以外がクリックされたらモード解除
  useEffect(() => {
    if (!editable) return;

    const handleDocumentClickForAddArea = (e: MouseEvent) => {
      if (!addingAreaMode) return;

      const target = e.target as Node | null;
      const mapEl = mapDivRef.current;
      const hintLayer = document.querySelector(".add-area-hint-layer");
      const sidebarEl = document.getElementById("sidebar");

      const clickedInsideMap = !!(mapEl && target && mapEl.contains(target));
      const clickedInsideHint = !!(
        hintLayer &&
        target &&
        hintLayer.contains(target)
      );
      const clickedInsideSidebar = !!(
        sidebarEl &&
        target &&
        sidebarEl.contains(target)
      );

      // 地図・ヒント・サイドバー以外をクリックしたらキャンセル
      if (!clickedInsideMap && !clickedInsideHint && !clickedInsideSidebar) {
        cancelAddMode();
      }
    };

    document.addEventListener("click", handleDocumentClickForAddArea, true);
    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClickForAddArea,
        true
      );
    };
  }, [editable, addingAreaMode, cancelAddMode]);

  // 測定モード中に、マップ・ヒント以外がクリックされたらモード解除
  useEffect(() => {
    const handleDocumentClickForMeasurement = (e: MouseEvent) => {
      if (!measurementModeRef.current) return;

      const target = e.target as Node | null;
      const mapEl = mapDivRef.current;
      const hintLayer = document.querySelector(".measurement-hint-layer");

      const clickedInsideMap = !!(mapEl && target && mapEl.contains(target));
      const clickedInsideHint = !!(
        hintLayer &&
        target &&
        hintLayer.contains(target)
      );

      if (!clickedInsideMap && !clickedInsideHint) {
        cancelMeasurementMode();
      }
    };

    document.addEventListener(
      "click",
      handleDocumentClickForMeasurement,
      true
    );
    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClickForMeasurement,
        true
      );
    };
  }, [measurementMode, cancelMeasurementMode]);

  // 測定モード切替時にジオメトリオーバーレイのクリック可否・カーソルを更新
  useEffect(() => {
    geomRef.current?.syncInteractivity();
  }, [measurementMode]);

  // 選択状態を表示
  useEffect(() => {
    if (isSelected) {
      // 履歴か候補が選ばれている状態の処理
      console.log("Selected history or candidate");
    } else {
      // 何も選ばれていない状態の処理
      console.log("No selection");
      clearGeometryOverlays(); // すべての図形を消す
      setShowCreateGeomCta(false); // CTAも隠す
      setDetailBarMetrics({}); // メトリクス（寸法表示など）リセット
      setSelectionKind(null);
    }
  }, [isSelected]);

  async function createDefaultGeometry() {
    const map = mapRef.current;
    if (!map || !geomRef.current) {
      console.warn("[map] cannot create geometry: map or geom is null");
      return;
    }

    const center = map.getCenter();
    if (!center) return;

    // --- ここから下は既存ロジックそのまま（中心＝今のマップ中央） ---
    const rectCornersFromParams = (
      centerLngLat: [number, number],
      w: number,
      h: number,
      rotation_deg: number
    ): [number, number][] => {
      const theta = (rotation_deg * Math.PI) / 180;
      const ux = Math.cos(theta),
        uy = Math.sin(theta); // U軸（幅）
      const vx = -Math.sin(theta),
        vy = Math.cos(theta); // V軸（奥行）
      const hw = w / 2,
        hh = h / 2;
      const off = (x: number, y: number) => fromLocalXY(centerLngLat, x, y); // x=東(+)m, y=北(+)m
      const p0 = off(-hw * ux - hh * vx, -hw * uy - hh * vy);
      const p1 = off(+hw * ux - hh * vx, +hw * uy - hh * vy);
      const p2 = off(+hw * ux + hh * vx, +hw * uy + hh * vy);
      const p3 = off(-hw * ux + hh * vx, -hw * uy + hh * vy);
      return [p0, p1, p2, p3];
    };

    const centerLngLat: [number, number] = [center.lng(), center.lat()];

    // 各エリア中心（マップ中央からのオフセット配置）
    const takeoffCenter = fromLocalXY(
      centerLngLat,
      DEFAULTS.takeoff.offsetX,
      DEFAULTS.takeoff.offsetY
    );
    const audienceCenter = fromLocalXY(
      centerLngLat,
      DEFAULTS.audience.offsetX,
      DEFAULTS.audience.offsetY
    );

    // コーナー座標
    const takeoffCoords = rectCornersFromParams(
      takeoffCenter,
      DEFAULTS.takeoff.w,
      DEFAULTS.takeoff.h,
      DEFAULTS.takeoff.rot
    );
    const audienceCoords = rectCornersFromParams(
      audienceCenter,
      DEFAULTS.audience.w,
      DEFAULTS.audience.h,
      DEFAULTS.audience.rot
    );

    // === Geometry 一式（飛行＋保安／離発着／観客） ===
    const geometry: Geometry = {
      flightAltitude_min_m: DEFAULTS.flight.altitudeMin,
      flightAltitude_Max_m: DEFAULTS.flight.altitudeMax,
      takeoffArea: {
        type: "rectangle",
        coordinates: takeoffCoords,
        referencePointIndex: 0,
      },
      flightArea: {
        type: "ellipse",
        center: centerLngLat, // マップ中央
        radiusX_m: DEFAULTS.flight.rx,
        radiusY_m: DEFAULTS.flight.ry,
        rotation_deg: DEFAULTS.flight.rot,
      },
      safetyArea: {
        type: "ellipse",
        buffer_m: DEFAULTS.flight.buffer,
      },
      audienceArea: {
        type: "rectangle",
        coordinates: audienceCoords,
      },
    };

    // 描画（※カメラは動かさない）
    geomRef.current.renderGeometry(geometry, { fit: true });

    // 作成後はCTAを隠す（案件用のボタン）
    setShowCreateGeomCta(false);
  }

  async function deleteGeometry() {
    // 画面上の図形を削除し、「削除ペンディング」の状態にするだけ
    geomRef.current?.deleteCurrentGeometry();

    // “未設定” 用の CTA を出す（「飛行エリアを作図する」ボタン）
    setShowCreateGeomCta(true);

    // ログだけ出しておく（S3 にはまだ反映していない）
    console.info("[map] geometry marked as deleted (pending Save)");
  }

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div className="map-page app-fullscreen">
      <div id="map" ref={mapDivRef} />
      {/* 座標変更モード中のヒント */}
      {editable && isChangingPosition && (
        <div className="add-area-hint-layer">
          <div className="add-area-hint" aria-live="polite">
            <span className="add-area-hint__text">
              変更後の地点を地図上でクリックしてください
            </span>
            <button
              type="button"
              className="add-area-hint__cancel"
              onClick={cancelChangePosition}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ジオメトリ未作成ヒント（マップ上に表示） */}
      {showNoGeometryHint && !addingAreaMode && !isChangingPosition && (
        <div className="add-area-hint-layer">
          <div className="add-area-hint" aria-live="polite">
            <span className="add-area-hint__text">
              飛行エリアが作成されていません。
            </span>
          </div>
        </div>
      )}

      {/* 測定モード中のヒント */}
      {measurementMode && (
        <div className="measurement-hint-layer add-area-hint-layer">
          <div className="add-area-hint measurement-hint" aria-live="polite">
            <span className="add-area-hint__text">
              計測モード
              <br />
              {(
                (measurementPoints?.length >= 2 && Number.isFinite(totalDistance_m)) ||
                (previewDistance_m ?? 0) > 0
              ) ? (
                <>
                  合計: {Math.round(totalDistance_m ?? 0)}m
                  {(previewDistance_m ?? 0) > 0 && (
                    <>
                      <br />
                      (+ {previewDistance_m}m)
                    </>
                  )}
                </>
              ) : null}
            </span>
            <div className="measurement-hint__actions">
              <button
                type="button"
                className="add-area-hint__cancel"
                onClick={clearMeasurementPoints}
                disabled={(measurementPoints?.length ?? 0) < 2}
              >
                クリア
              </button>
              <button
                type="button"
                className="add-area-hint__cancel measurement-hint__complete"
                onClick={cancelMeasurementMode}
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="controls" className="cta-overlay">
        {/* 案件情報セクションのときだけ CTA を表示 */}
        {editable &&
          selectionKind === "schedule" &&
          showCreateGeomCta &&
          isSelected && (
            <button
              id="create-geom-button"
              type="button"
              className="create-geom-button"
              onClick={() => {
                createDefaultGeometry();
              }}
              aria-label="飛行エリアを作図する"
            >
              飛行エリアを作図する
            </button>
          )}

        {editable &&
          selectionKind === "schedule" &&
          !showCreateGeomCta &&
          isSelected && (
            <button
              id="delete-geom-button"
              type="button"
              className="delete-geom-button"
              onClick={() => {
                deleteGeometry();
              }}
              aria-label="エリア情報を削除する"
            >
              エリア情報を削除する
            </button>
          )}

        {/* 距離測定ボタン（iframe埋め込み時は非表示） */}
        {!measurementMode && window === window.top && (
          <button
            id="measure-distance-button"
            type="button"
            className="measure-distance-button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("map:start-measurement"));
            }}
            aria-label="距離を測る"
          >
            距離を測る
          </button>
        )}
      </div>
      <AddAreaModal
        open={editable && !!newAreaDraft}
        draft={newAreaDraft}
        areaName={areaNameInput}
        onChangeAreaName={setAreaNameInput}
        onCancel={() => {
          resetDraft();
        }}
        onOk={async () => {
          if (!areaNameInput.trim() || !newAreaDraft) return;

          // ① エリア作成（areaName 重複チェック込み）
          const result = await createNewArea({
            areaName: areaNameInput.trim(),
            lat: newAreaDraft.lat,
            lon: newAreaDraft.lng,
            prefecture: newAreaDraft.prefecture,
            address: newAreaDraft.address,
          });

          if (!result.ok) {
            if (result.reason === "duplicate") {
              window.alert(
                `エリア名「${areaNameInput.trim()}」は既に存在します。\n別の名称を指定してください。`
              );
            } else {
              window.alert(
                "エリア情報の保存に失敗しました。S3 の設定（CORS / 権限）をご確認ください。"
              );
            }
            // モーダルは開いたまま & 入力も保持 → ユーザーが名前を修正して再トライできる
            return;
          }

          // ② 最新の areas.json を読み込み直してマーカー再描画
          const points = await loadAreasPoints();
          onLoaded?.(points);
          renderMarkers(points);

          // ③ 入力状態リセット & トースト表示
          resetDraft();
          setAreaNameInput("");
          notifyAreaCreated();
        }}
      />

      <RegisterProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
      {/* 新規エリア作成完了トースト */}
      {showAreaCreatedToast && (
        <div className="area-created-toast-layer" aria-live="polite">
          <div className="area-created-toast">新規エリアを作成しました</div>
        </div>
      )}
      {/* 座標変更完了トースト */}
      {showPositionUpdatedToast && (
        <div className="area-created-toast-layer" aria-live="polite">
          <div className="area-created-toast">座標を変更しました。</div>
        </div>
      )}
    </div>
  );
}
