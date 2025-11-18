// src/pages/parts/MapView.tsx
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  createMarkerIcon,
  useDraggableMetricsPanel,
  useEditableBodyClass,
  useAddAreaMode,
} from "@/components";
import type { Props, Point, Geometry } from "@/features/types";
import {
  appendAreaCandidate,
  fetchAreaInfo,
  fetchProjectIndex,
  upsertScheduleGeometry,
  upsertAreaCandidateAtIndex,
  clearAreaCandidateGeometryAtIndex,
  clearScheduleGeometry,
  createNewArea,
} from "./areasApi";
import {
  EV_DETAILBAR_SELECTED,
  OPEN_INFO_ON_SELECT,
  S3_BASE,
} from "./constants/events";
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
  EV_DETAILBAR_SELECT_HISTORY,
  EV_DETAILBAR_SELECT_CANDIDATE,
  MARKERS_HIDE_ZOOM,
  DEFAULTS,
} from "./constants/events";
import { AddAreaModal } from "./AddAreaModal";

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

  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentProjectUuidRef = useRef<string | undefined>(undefined);
  const currentScheduleUuidRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);

  const [showCreateGeomCta, setShowCreateGeomCta] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [showAreaCreatedToast, setShowAreaCreatedToast] = useState(false);
  const areaCreatedToastTimerRef = useRef<number | null>(null);

  // 追加：座標変更完了トースト
  const [showPositionUpdatedToast, setShowPositionUpdatedToast] =
    useState(false);
  const positionUpdatedToastTimerRef = useRef<number | null>(null);

  useDraggableMetricsPanel();
  const editable = useEditableBodyClass();
  const editableRef = useRef(editable);

  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

  const {
    addingAreaMode,
    newAreaDraft,
    areaNameInput,
    setAreaNameInput,
    cancelAddMode,
    resetDraft,
  } = useAddAreaMode(mapRef);

  // エリア追加モードの現在値を参照するための ref
  const addingAreaModeRef = useRef(addingAreaMode);
  useEffect(() => {
    addingAreaModeRef.current = addingAreaMode;
  }, [addingAreaMode]);

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

  /** 座標変更完了トーストを一定時間表示（★追加） */
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
  >(() => {});
  const currentPointRef = useRef<Point | null>(null);

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

    // 矢印ラベルを削除
    if (geomRef.current?.arrowLabel) {
      geomRef.current?.arrowLabel.setMap(null);
      geomRef.current.arrowLabel = null;
    }
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

  // 候補ジオメトリの有無判定
  const hasCandidateGeometry = (g?: Geometry | null): boolean => {
    if (!g || typeof g !== "object") return false;

    const hasCoords = (coords?: any) =>
      Array.isArray(coords) && coords.length >= 3;

    const hasEllipse = (ea?: any) =>
      ea &&
      ea.type === "ellipse" &&
      Array.isArray(ea.center) &&
      ea.center.length === 2 &&
      Number.isFinite(ea.radiusX_m) &&
      Number.isFinite(ea.radiusY_m);

    const hasRect = (ra?: any) =>
      ra && ra.type === "rectangle" && hasCoords(ra.coordinates);

    const takeoff = hasRect(g.takeoffArea);
    const flight = hasEllipse(g.flightArea) || hasRect(g.flightArea); // 念のため rectangle も許容
    const safety =
      (g.safetyArea &&
        g.safetyArea.type === "ellipse" &&
        Number.isFinite(g.safetyArea.buffer_m)) ||
      hasRect(g.safetyArea);
    const audience = hasRect(g.audienceArea);

    return !!(takeoff || flight || safety || audience);
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

        // 通常モード時のみ、マーカー選択処理を実行
        selectMarker(marker, p);
      });
    });

    if (!bounds.isEmpty()) map.fitBounds(bounds);

    // サイドバーからのフォーカス要求に対応
    selectByKeyRef.current = ({ areaUuid, areaName }) => {
      const byKey = markerByKeyRef.current;
      let marker: google.maps.Marker | undefined =
        (areaUuid && byKey.get(areaUuid)) || undefined;

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

  async function saveGeometryToS3(geometry: Geometry) {
    const pj = currentProjectUuidRef.current;
    const sch = currentScheduleUuidRef.current;
    const areaUuid = currentAreaUuidRef.current;

    // 1) 履歴（プロジェクト/スケジュール）優先
    // if (pj && sch) {
    //   return await upsertScheduleGeometry({
    //     projectUuid: pj,
    //     scheduleUuid: sch,
    //     geometry,
    //   });
    // }

    // 2) 候補（エリア）
    if (areaUuid) {
      const idx = currentCandidateIndexRef.current;
      if (typeof idx === "number" && idx >= 0) {
        // ← ★ 編集中の候補があれば上書き
        return await upsertAreaCandidateAtIndex({
          areaUuid,
          index: idx,
          candidate: {
            title: currentCandidateTitleRef.current, // 既存タイトルを維持
            flightAltitude_m: geometry.flightAltitude_m,
            takeoffArea: geometry.takeoffArea,
            flightArea: geometry.flightArea!,
            safetyArea: geometry.safetyArea!,
            audienceArea: geometry.audienceArea,
          },
          preserveTitle: true,
        });
      } else {
        // 新規作成時のみ追記
        const title =
          currentCandidateTitleRef.current ??
          `候補 ${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12)}`;
        return await appendAreaCandidate({
          areaUuid,
          candidate: {
            title,
            flightAltitude_m: geometry.flightAltitude_m,
            takeoffArea: geometry.takeoffArea,
            flightArea: geometry.flightArea!,
            safetyArea: geometry.safetyArea!,
            audienceArea: geometry.audienceArea,
          },
        });
      }
    }

    // 2) 履歴（プロジェクト/スケジュール）
    if (pj && sch) {
      return await upsertScheduleGeometry({
        projectUuid: pj,
        scheduleUuid: sch,
        geometry,
      });
    }

    console.warn("[saveGeometryToS3] no context to save.");
    return false;
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

      // Geometry controller
      mapRef.current = map;
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

        // 現在のスケジュールを覚えておく（保存先の判定に使う）
        currentProjectUuidRef.current = projectUuid || undefined;
        currentScheduleUuidRef.current = scheduleUuid || undefined;

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
      const { detail } = e as CustomEvent<{
        geometry: Geometry;
        index?: number;
        title?: string;
      }>;
      if (!detail) return;
      currentCandidateIndexRef.current =
        typeof detail.index === "number" ? detail.index : null;
      currentCandidateTitleRef.current =
        typeof detail.title === "string" ? detail.title : undefined;

      // 履歴（プロジェクト）文脈はここで確実に無効化
      currentProjectUuidRef.current = undefined;
      currentScheduleUuidRef.current = undefined;
      // MapGeometry がスケジュール文脈を内部保持している場合に備え、明示的に解除
      geomRef.current?.setCurrentSchedule?.(undefined as any, undefined as any);

      //  ここで有無判定して CTA を制御
      const hasGeom = hasCandidateGeometry(detail.geometry);
      if (hasGeom) {
        setShowCreateGeomCta(false); // 既存あり → 「削除」ボタンを見せる
        geomRef.current?.renderGeometry(detail.geometry);
      } else {
        setShowCreateGeomCta(true); // 既存なし → 「作成」ボタンを見せる
        clearGeometryOverlays(); // 何も描かない
        setDetailBarMetrics({}); // メトリクスもリセット
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

  // 新規エリア追加モード中に、マップ以外がクリックされたらモード解除
  useEffect(() => {
    if (!editable) return;

    const handleDocumentClickForAddArea = (e: MouseEvent) => {
      // 追加モードでなければ何もしない
      if (!addingAreaMode) return;

      const target = e.target as Node | null;
      const mapEl = mapDivRef.current;
      const hintLayer = document.querySelector(".add-area-hint-layer");

      const clickedInsideMap = !!(mapEl && target && mapEl.contains(target));
      const clickedInsideHint = !!(
        hintLayer &&
        target &&
        hintLayer.contains(target)
      );

      // マップ上の座標（map要素）でもヒントレイヤー内でもない → 追加モードを終了
      if (!clickedInsideMap && !clickedInsideHint) {
        cancelAddMode();
      }
    };

    // キャプチャフェーズで拾う（他のハンドラより前に動かしたいので true）
    document.addEventListener("click", handleDocumentClickForAddArea, true);

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClickForAddArea,
        true
      );
    };
  }, [editable, addingAreaMode, cancelAddMode]);

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

  async function createDefaultGeometry() {
    const map = mapRef.current;
    const gmaps = getGMaps();
    if (!map || !geomRef.current) {
      console.warn("[map] cannot create geometry: map or geom is null");
      return;
    }
    const prevZoom = map.getZoom();
    const prevCenter = map.getCenter();
    const c = prevCenter;
    if (!c) return;

    // === 便利関数: 向き付き矩形（中心・幅W・奥行H・回転deg）→ 4頂点座標[LNG,LAT] ===
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

    // 中心（マップ中央）
    const centerLngLat: [number, number] = [c.lng(), c.lat()];

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
      flightAltitude_m: DEFAULTS.flight.altitude,
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
        buffer_m: DEFAULTS.flight.buffer, // 保安距離（飛行楕円に外付け）
      },
      audienceArea: {
        type: "rectangle",
        coordinates: audienceCoords,
      },
    };

    // 描画（※カメラは動かさない）
    geomRef.current.renderGeometry(geometry, { fit: false });

    // 保存は共通関数に一本化
    try {
      const ok = await saveGeometryToS3(geometry);
      if (!ok) console.error("[map] saveGeometryToS3 failed");
    } catch (e) {
      console.error("[map] save created geometry error", e);
    }

    // 作成後はCTAを隠し、削除ボタンを出す側へ遷移（既存）
    setShowCreateGeomCta(false);

    gmaps.event.addListenerOnce(map, "idle", () => {
      if (prevCenter) map.setCenter(prevCenter);
      if (typeof prevZoom === "number") map.setZoom(prevZoom);
    });

    // 作成後はCTAを隠し、削除ボタンを出す側へ遷移
    setShowCreateGeomCta(false);
  }

  async function deleteGeometry() {
    const pj = currentProjectUuidRef.current;
    const sch = currentScheduleUuidRef.current;
    const areaUuid = currentAreaUuidRef.current;
    const cIdx = currentCandidateIndexRef.current;

    // 画面上の図形は先に消してOK（失敗してもUI破綻しない）
    geomRef.current?.deleteCurrentGeometry();

    let ok = true;
    if (pj && sch) {
      // 履歴（プロジェクト配下）
      ok = await clearScheduleGeometry({
        projectUuid: pj,
        scheduleUuid: sch,
      });
      if (!ok)
        console.error("[map] clearScheduleGeometry failed", {
          pj,
          sch,
        });
    } else if (areaUuid && typeof cIdx === "number" && cIdx >= 0) {
      // 候補（エリア配下）
      ok = await clearAreaCandidateGeometryAtIndex({
        areaUuid,
        index: cIdx,
      });
      if (!ok)
        console.error("[map] clearAreaCandidateGeometryAtIndex failed", {
          areaUuid,
          cIdx,
        });
    } else {
      console.warn(
        "[map] delete requested but no context (project/schedule or area/candidate)."
      );
    }

    // “未設定” 用の CTA を出す
    setShowCreateGeomCta(true);
    if (ok) {
      console.info("[map] geometry delete persisted");
    }
  }

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div className="map-page app-fullscreen">
      <div id="map" ref={mapDivRef} />
      {editable && addingAreaMode && (
        <div className="add-area-hint-layer">
          <div className="add-area-hint" aria-live="polite">
            <span className="add-area-hint__text">
              追加したいエリアを地図上でクリックして選択してください
            </span>
            <button
              type="button"
              className="add-area-hint__cancel"
              onClick={cancelAddMode}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
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
      <div id="controls" className="cta-overlay">
        {editable && showCreateGeomCta && isSelected && (
          <button
            id="create-geom-button"
            type="button"
            className="create-geom-button"
            onClick={() => {
              createDefaultGeometry();
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
              deleteGeometry();
            }}
            aria-label="エリア情報を削除する"
          >
            エリア情報を削除する
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
