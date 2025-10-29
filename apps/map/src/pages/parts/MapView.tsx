// src/pages/parts/MapView.tsx
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { createMarkerIcon } from "@/components";
import type { Props, Point, Geometry } from "@/features/types";
import { fetchAreaInfo, fetchProjectIndex } from "./areasApi";
import {
  EV_DETAILBAR_SELECTED,
  OPEN_INFO_ON_SELECT,
  S3_BASE,
} from "./constants/events";
import "../map.css";
import {
  openDetailBar,
  setDetailBarTitle,
  setDetailBarHistory,
  setDetailBarMeta,
  setDetailBarMetrics,
} from "./SideDetailBar";
import { MapGeometry } from "./MapGeometry";
import {
  NAME_UNSET,
  AREA_NAME_NONE,
  SELECT_ZOOM_DESKTOP,
  SELECT_ZOOM_MOBILE,
  MIN_ZOOM_DELTA_TO_CHANGE,
  EV_MAP_FOCUS_ONLY,
  EV_SIDEBAR_OPEN,
  EV_SIDEBAR_SET_ACTIVE,
  EV_DETAILBAR_SELECT_HISTORY,
  EV_DETAILBAR_SELECT_CANDIDATE,
  MARKERS_HIDE_ZOOM,
} from "./constants/events";

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
  const [showCreateGeomCta, setShowCreateGeomCta] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  // Bodyクラスで編集状態を共有（editing-on で活性）
  const getEditable = () => document.body.classList.contains("editing-on");
  const [editable, setEditable] = useState<boolean>(getEditable);

  /** マーカー管理（キー検索/逆引き用） */
  const markerByKeyRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const pointByMarkerRef = useRef<WeakMap<google.maps.Marker, Point>>(
    new WeakMap()
  );
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const selectByKeyRef = useRef<
    (keys: { areaId?: string; areaName?: string }) => void
  >(() => {});

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

  /** ズームに応じてマーカーの可視状態を同期 */
  const syncMarkersVisibilityForZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? 0;
    const hide = z >= MARKERS_HIDE_ZOOM;
    markersRef.current.forEach((m) => m.setVisible(!hide));
    if (hide) {
      // マーカーを隠すときは InfoWindow も閉じる
      infoRef.current?.close();
    }
  };

  /** =========================
   *  Data loading
   *  ========================= */
  async function loadAreasPoints(): Promise<Point[]> {
    try {
      const resp = await fetch(S3_BASE + "areas.json", {
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
            console.warn("[areas] areaName missing for areaId=", a?.areaId);
          }

          return {
            name: areaName,
            areaName,
            lat: Number(lat),
            lng: Number(lon),
            areaId: typeof a?.areaId === "string" ? a.areaId : undefined,
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
        { name: "デモA", lat: 35.6861, lng: 139.4077, areaName: "デモA" },
        { name: "デモB", lat: 35.9596, lng: 137.8075, areaName: "デモB" },
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
      const map = mapRef.current!;
      const gmaps = getGMaps();

      window.dispatchEvent(new Event(EV_SIDEBAR_OPEN));

      if (OPEN_INFO_ON_SELECT) {
        infoRef.current?.setContent(
          `<div style="min-width:160px">${p.name}</div>`
        );
        infoRef.current?.open({ map, anchor: marker });
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

      if (p.areaId) markerByKeyRef.current.set(p.areaId, marker);
      const areaKey = p.areaName?.trim() || AREA_NAME_NONE;
      markerByKeyRef.current.set(areaKey, marker);
      pointByMarkerRef.current.set(marker, p);

      marker.addListener("click", () => selectMarker(marker, p));
    });

    if (!bounds.isEmpty()) map.fitBounds(bounds);

    // サイドバーからのフォーカス要求に対応
    selectByKeyRef.current = ({ areaId, areaName }) => {
      const byKey = markerByKeyRef.current;
      let marker: google.maps.Marker | undefined =
        (areaId && byKey.get(areaId)) || undefined;

      if (!marker && areaName) marker = byKey.get(areaName);

      if (marker) {
        const p = pointByMarkerRef.current.get(marker);
        if (p) {
          if (
            selectedMarkerRef.current &&
            selectedMarkerRef.current !== marker
          ) {
            applySelection(selectedMarkerRef.current, false);
          }
          applySelection(marker, true);
          selectedMarkerRef.current = marker;

          focusMapOnMarker(marker, { onlyPanIfClose: true });

          // UI更新のみ（fetch 済）
          openMarker(marker, p, true);
        }
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
        libraries: ["geometry", "marker"],
      });
      await loader.load();
      if (cancelled) return;

      const gmaps = getGMaps();
      const map = new gmaps.Map(mapDivRef.current as HTMLDivElement, {
        center: { lat: 35.0, lng: 137.0 },
        zoom: 6,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: gmaps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: gmaps.ControlPosition.TOP_CENTER,
        },
        zoomControl: true,
        zoomControlOptions: { position: gmaps.ControlPosition.RIGHT_CENTER },
      });
      mapRef.current = map;
      if (OPEN_INFO_ON_SELECT) {
        infoRef.current = new gmaps.InfoWindow();
      }

      // Geometry controller
      geomRef.current = new MapGeometry(() => mapRef.current);

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
      // リスナーのクリーンアップ
      zoomListenerRef.current?.remove();
      zoomListenerRef.current = null;
      
      // マップと付随オブジェクトをクリーンアップ
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      markerByKeyRef.current.clear();
      pointByMarkerRef.current = new WeakMap();
      selectedMarkerRef.current = null;
      if (OPEN_INFO_ON_SELECT) {
        infoRef.current?.close();
      }
      infoRef.current = null;

      // ジオメトリもクリーンアップ
      clearGeometryOverlays();
    };
  }, []);

  // 外部イベント：map:focus-only -> 指定マーカーへフォーカス
  useEffect(() => {
    const onFocusOnly = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            areaId?: string;
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

  // メトリクスパネルのドラッグ&ドロップ
  useEffect(() => {
    const panel = document.querySelector(
      ".geom-metrics-panel"
    ) as HTMLDivElement | null;
    if (!panel) return;

    let offsetX = 0,
      offsetY = 0,
      isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      panel.classList.add("dragging");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      panel.classList.remove("dragging");
    };

    panel.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      panel.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // 外部イベント：detailbar:select-history -> ジオメトリを取得/描画（統合版）
  useEffect(() => {
    const onSelect = async (e: Event) => {
      try {
        const { projectUuid, scheduleUuid } =
          (
            e as CustomEvent<{
              projectUuid?: string;
              scheduleUuid?: string;
            }>
          ).detail || {};

        // まずは非表示に（必要なケースのみ true にする）
        setShowCreateGeomCta(false);

        // 参照点変更イベント用に現在のスケジュールを共有
        geomRef.current?.setCurrentSchedule(projectUuid, scheduleUuid);

        if (!projectUuid || !scheduleUuid) {
          if (import.meta.env.DEV)
            console.warn("[map] missing uuids in select-history");
          clearGeometryOverlays();
          setDetailBarMetrics({});
          return;
        }

        const proj = await fetchProjectIndex(projectUuid);
        const schedules = Array.isArray(proj?.schedules) ? proj.schedules : [];
        const sch: any = schedules.find((s: any) => s?.id === scheduleUuid);

        if (!sch) {
          if (import.meta.env.DEV)
            console.warn("[map] schedule not found", scheduleUuid);
          console.info(
            `[map] geometry: UNKNOWN (schedule not found) project=${projectUuid}, schedule=${scheduleUuid}`
          );
          clearGeometryOverlays();
          setDetailBarMetrics({});
          return;
        }

        // geometry の有無判定
        const geom = sch?.geometry;
        const hasGeom =
          !!geom && typeof geom === "object" && Object.keys(geom).length > 0;

        const label =
          typeof sch?.label === "string" ? sch.label : String(scheduleUuid);

        if (hasGeom) {
          const center =
            geom?.flightArea?.type === "ellipse" &&
            Array.isArray(geom?.flightArea?.center)
              ? geom.flightArea.center
              : undefined;

          console.info(
            `[map] geometry: PRESENT for "${label}" (id=${sch?.id}) on ${
              sch?.date ?? "N/A"
            }`,
            {
              geometryKeys: Object.keys(geom),
              updatedAt: geom?.updatedAt,
              updatedBy: geom?.updatedBy,
              center, // 例: [lng, lat]
            }
          );

          // 初回は fit あり
          geomRef.current?.renderGeometry(geom);
        } else {
          // 既存スケジュールだが geometry が無い → CTA を出す
          setShowCreateGeomCta(true);
          console.info(
            `[map] geometry: ABSENT for "${label}" (id=${sch?.id}) on ${
              sch?.date ?? "N/A"
            }`
          );
          clearGeometryOverlays();
          setDetailBarMetrics({});
        }
      } catch (err) {
        setShowCreateGeomCta(false);
        console.error("[map] render geometry error", err);
        clearGeometryOverlays();
        setDetailBarMetrics({});
      }
    };

    window.addEventListener(
      EV_DETAILBAR_SELECT_HISTORY,
      onSelect as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SELECT_HISTORY,
        onSelect as EventListener
      );
  }, []);

  // 外部イベント：detailbar:select-candidate -> ジオメトリを描画
  useEffect(() => {
    const onCandidateSelect = async (e: Event) => {
      const { detail } = e as CustomEvent<{ geometry: Geometry }>;
      if (detail) {
        geomRef.current?.renderGeometry(detail); // ここでジオメトリを描画
      }
    };

    window.addEventListener(
      EV_DETAILBAR_SELECT_CANDIDATE,
      onCandidateSelect as EventListener
    );

    return () => {
      window.removeEventListener(
        EV_DETAILBAR_SELECT_CANDIDATE,
        onCandidateSelect as EventListener
      );
    };
  }, []);

  // Bodyクラスで編集状態を共有（editing-on で活性）
  useEffect(() => {
    const update = () => setEditable(getEditable());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // SideDetailBar から選択状態を受け取る
  useEffect(() => {
    const onSelectedStateChange = (e: Event) => {
      const { isSelected } = (e as CustomEvent).detail;
      setIsSelected(isSelected);
    };

    window.addEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    return () => {
      window.removeEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    };
  }, []);

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
    }
  }, [isSelected]);

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div className="map-page app-fullscreen">
      <div id="map" ref={mapDivRef} />
      <div id="controls" className="cta-overlay">
        {editable && showCreateGeomCta && isSelected && (
          <button
            id="create-geom-button"
            type="button"
            className="create-geom-button"
            onClick={() => {
              console.info(
                "[map] 'エリア情報を作成する' clicked (not implemented yet)"
              );
            }}
            aria-label="エリア情報を作成する"
          >
            エリア情報を作成する
          </button>
        )}

        {editable && !showCreateGeomCta && isSelected && (
          <button
            id="delete-geom-button"
            type="button"
            className="delete-geom-button"
            onClick={() => {
              // 現在の図形を全て消去し、未設定フラグを立てる
              geomRef.current?.deleteCurrentGeometry();
              setShowCreateGeomCta(true);
              console.info("[map] geometry delete requested (not saved yet)");
            }}
            aria-label="エリア情報を削除する"
          >
            エリア情報を削除する
          </button>
        )}
      </div>
    </div>
  );
}
