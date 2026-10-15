// src/pages/parts/MapView.tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loader } from "@googlemaps/js-api-loader";
import {
  useEditableBodyClass,
  useAddAreaMode,
  useMeasurementMode,
  useAirportHeightRestrictionMode,
  useScheduleSection,
  useCandidateSection,
  detectEmbedMode,
} from "@/components";
import type { Props, Point, Geometry } from "@/features/types";
import {
  createNewArea,
  FETCH_AREAS_LIST_ERROR_MSG,
} from "./areasApi";
import { EV_DETAILBAR_SELECTED, OPEN_INFO_ON_SELECT } from "./constants/events";
import "../map.css";
import {
  closeDetailBar,
  setDetailBarMetrics,
} from "./SideDetailBar";
import { MapGeometry } from "./MapGeometry";
import { fromLocalXY } from "./geometry/math";
import {
  EV_MAP_FOCUS_ONLY,
  EV_SIDEBAR_SET_ACTIVE,
  EV_SIDEBAR_VISIBLE_AREAS,
  EV_SIDEBAR_AREA_KINDS,
  DEFAULTS,
  EV_PROJECT_MODAL_OPEN,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_OVERLAY_VISIBILITY_CHANGED,
} from "./constants/events";
import { AddAreaModal } from "./AddAreaModal";
import { RegisterProjectModal } from "./RegisterProjectModal";
import MapToolsPanel from "./MapToolsPanel";
import PlaceSearchOverlay from "./PlaceSearchOverlay";
import {
  DEFAULT_OVERLAY_VISIBILITY,
  OTHER_FIGURE_OVERLAY_PATCH,
  type OverlayVisibility,
} from "./overlayVisibility";
import { systemError, E004_NEW_AREA_S3 } from "@/lib/errorMessages";
import {
  calculateAirportRestriction,
  buildAirportHeightRestrictionPopupHtml,
  buildAreaRemarksFromRestrictions,
} from "./airportRestriction";
import {
  setRestrictionOverlaysMap,
  type RestrictionOverlay,
} from "./airportRestriction/overlays";
import { useAirportRestrictionLayer } from "./useAirportRestrictionLayer";

import { usePlaceSearch } from "./usePlaceSearch";

import {
  collectDjiNfzEntriesAtPoint,
  lookupDjiNfzEntriesAt,
} from "./djiNfz";
import type { DjiNfzEntryHit } from "./djiNfz";
import { useDjiNfzLayer } from "./useDjiNfzLayer";

import { getGMaps } from "./getGMaps";
import {
  renderAreaMarkers,
  syncAreaMarkersVisibility,
} from "./renderAreaMarkers";
import { useMapScreenshot } from "./useMapScreenshot";
import { loadAreasPoints } from "./loadAreaPoints";

/** =========================
 *  Component
 *  ========================= */
export default function MapView({ onLoaded }: Props) {
  /** ---- Refs (Map / UI state) ---- */
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapPageRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const desiredHeadingRef = useRef(0);
  const djiNfzLoadedRef = useRef(false);
  const djiNfzInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const djiNfzClickedRef = useRef(false);
  const airportHeightRestrictionInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const placePreviewInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const placePreviewPlaceRef = useRef<{
    lat: number;
    lng: number;
    label: string;
    name: string;
    postalCode: string;
    address: string;
    placeId: string;
  } | null>(null);
  const airportRestrictionOverlaysRef = useRef<RestrictionOverlay[]>([]);

  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentProjectUuidRef = useRef<string | undefined>(undefined);
  const currentScheduleUuidRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);

  const [mapReady, setMapReady] = useState(false);
  const [showCreateGeomCta, setShowCreateGeomCta] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;
  // 「どのセクション由来の選択か」を保持（案件 / 候補 / 他社）
  const [selectionKind, setSelectionKind] = useState<
    "schedule" | "candidate" | "other" | "sales" | null
  >(null);
  const selectionKindRef = useRef(selectionKind);
  selectionKindRef.current = selectionKind;
  const figureOverlayBeforeOtherRef = useRef<typeof OTHER_FIGURE_OVERLAY_PATCH | null>(
    null
  );

  const [showAreaCreatedToast, setShowAreaCreatedToast] = useState(false);
  const areaCreatedToastTimerRef = useRef<number | null>(null);

  // 座標変更完了トースト
  const [showPositionUpdatedToast, setShowPositionUpdatedToast] =
    useState(false);
  const positionUpdatedToastTimerRef = useRef<number | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  // ジオメトリ未作成メッセージ（マップ上に表示）
  const [showNoGeometryHint, setShowNoGeometryHint] = useState(false);
  // オーバーレイ表示切り替え（セッション中のみ保持）
  const [overlayVisibility, setOverlayVisibility] =
    useState<OverlayVisibility>(DEFAULT_OVERLAY_VISIBILITY);
  const overlayVisibilityRef = useRef(overlayVisibility);
  overlayVisibilityRef.current = overlayVisibility;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EV_OVERLAY_VISIBILITY_CHANGED, {
        detail: overlayVisibility,
      })
    );
  }, [overlayVisibility]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 色変更時にパネルを再描画するためのリビジョン（setGeometryRevision で re-render をトリガー）
  const [, setGeometryRevision] = useState(0);

  const editable = useEditableBodyClass();
  const editableRef = useRef(editable);

  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

  useMapScreenshot({ mapRef, mapDivRef });

  const getAddAreaConfirmExtraContent = useCallback(
    async (lat: number, lng: number) => {
      const map = mapRef.current;
      const gmaps = getGMaps();
      if (!map || !gmaps) return { html: "" };

      let djiNfzEntries: DjiNfzEntryHit[] = [];
      try {
        if (overlayVisibilityRef.current.djiNfz && map.data.getMap() === map) {
          djiNfzEntries = collectDjiNfzEntriesAtPoint(
            map,
            new gmaps.LatLng(lat, lng)
          );
        } else {
          djiNfzEntries = await lookupDjiNfzEntriesAt(lat, lng);
        }
      } catch (e) {
        console.warn("[add-area] DJI NFZ lookup failed:", e);
      }

      let airportResult;
      try {
        airportResult = calculateAirportRestriction(lat, lng, gmaps);
      } catch {
        airportResult = { items: [], error: true };
      }

      const html = buildAirportHeightRestrictionPopupHtml({
        airportResult,
        djiNfzEntries,
      });

      const heightLimitM =
        !airportResult.error &&
        airportResult.items.length > 0
          ? String(Math.floor(airportResult.items[0].heightM))
          : undefined;

      const remarks = buildAreaRemarksFromRestrictions({
        airportResult,
        djiNfzEntries,
      });

      return { html, heightLimitM, remarks };
    },
    []
  );

  const {
    addingAreaMode,
    newAreaDraft,
    areaNameInput,
    setAreaNameInput,
    cancelAddMode,
    resetDraft,
  } = useAddAreaMode(mapRef, { getAddAreaConfirmExtraContent });

  const {
    measurementMode,
    measurementType,
    switchMeasurementType,
    points: measurementPoints,
    totalDistance_m,
    previewDistance_m,
    dragDistance_m,
    cancelMeasurementMode,
    clearPoints: clearMeasurementPoints,
  } = useMeasurementMode(mapRef, mapReady);

  const {
    airportHeightRestrictionMode,
    airportHeightRestrictionModeRef,
  } = useAirportHeightRestrictionMode();

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
  const kindFlagsRef = useRef<
    Record<string, { own: boolean; other: boolean; considering?: boolean }>
  >(
    {}
  );
  const syncMarkerIconsRef = useRef<() => void>(() => {});
  const clearSelectedMarkerRef = useRef<() => void>(() => {});
  const changingPositionRef = useRef(false);

  const openRestrictionInfoAtRef = useRef<(latLng: google.maps.LatLng) => void>(
    () => {}
  );

  const [isChangingPosition, setIsChangingPosition] = useState(false);
  const changePositionInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const changePositionCandidateRef = useRef<{
    lat: number;
    lng: number;
  } | null>(null);
  const selectByKeyRef = useRef<
    (keys: { areaUuid?: string; areaName?: string }) => boolean
  >(() => false);
  const currentPointRef = useRef<Point | null>(null);
  const syncAreaUuidQuery = useCallback((areaUuid?: string) => {
    try {
      const url = new URL(window.location.href);
      const currentArea = url.searchParams.get("areaUuid") || undefined;
      const nextArea = areaUuid?.trim() || undefined;

      // areaUuid が全く変わらない場合は何もしない
      if (currentArea === nextArea) return;

      if (nextArea) {
        // 別のエリアが選択されたタイミングで areaUuid を更新し、
        // Hub 由来の projectUuid / scheduleUuid は URL から取り除く
        url.searchParams.set("areaUuid", nextArea);
        url.searchParams.delete("projectUuid");
        url.searchParams.delete("scheduleUuid");
      } else {
        // 未選択になった場合は areaUuid / projectUuid / scheduleUuid をすべて削除
        url.searchParams.delete("areaUuid");
        url.searchParams.delete("projectUuid");
        url.searchParams.delete("scheduleUuid");
      }

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    } catch (e) {
      console.warn("[MapView] failed to sync areaUuid query:", e);
    }
  }, []);
  const clearCurrentAreaSelection = useCallback(() => {
    clearSelectedMarkerRef.current();
    infoRef.current?.close();
    djiNfzInfoRef.current?.close();
    airportHeightRestrictionInfoRef.current?.close();
    currentPointRef.current = null;
    currentAreaUuidRef.current = undefined;
    closeDetailBar();
    window.dispatchEvent(
      new CustomEvent(EV_SIDEBAR_SET_ACTIVE, { detail: { clear: true } })
    );
    syncAreaUuidQuery(undefined);
  }, [syncAreaUuidQuery]);

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
      const ok = selectByKeyRef.current?.({ areaUuid: areaUuidFromUrl });
      if (!ok) {
        // URLの areaUuid が無効な場合は未選択状態へ自己修復
        syncAreaUuidQuery(undefined);
      }
      console.log("[MapView] auto-selected from URL:", {
        areaUuidFromUrl,
        projectUuidFromUrl,
        scheduleUuidFromUrl,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [syncAreaUuidQuery]);

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

  // フルスクリーン状態の同期
  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setIsFullscreen(!!(document.fullscreenElement ?? doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = mapPageRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const isFs = !!(document.fullscreenElement ?? doc.webkitFullscreenElement);
    try {
      if (isFs) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else {
        const elem = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      }
    } catch (e) {
      console.warn("[MapView] fullscreen error:", e);
    }
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

  usePlaceSearch({
    mapRef,
    placePreviewInfoRef,
    placePreviewPlaceRef,
  });

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

  /** 空港高さ制限照会モード開始時に座標変更モードを終了 */
  useEffect(() => {
    const onStart = () => {
      cancelChangePosition();
    };
    window.addEventListener("map:start-airport-height-restriction", onStart);
    return () => window.removeEventListener("map:start-airport-height-restriction", onStart);
  }, []);

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

  /** 指定の全オーバーレイ（ジオメトリ側）を削除 */
  const clearGeometryOverlays = () => {
    geomRef.current?.clearOverlays();
  };

  /** フィルタで表示するエリア名（null = 全表示） */
  const visibleAreaNamesRef = useRef<Set<string> | null>(null);

  /** ズーム・フィルタ・表示パネルに応じてマーカーの可視状態を同期 */
  const syncMarkersVisibilityForZoom = useCallback(() => {
    syncAreaMarkersVisibility({
      mapRef,
      markersRef,
      pointByMarkerRef,
      visibleAreaNamesRef,
      overlayVisibilityRef,
      infoRef,
    });
  }, []);


  useEffect(() => {
    syncMarkersVisibilityForZoom();
  }, [overlayVisibility.companyMarkers, syncMarkersVisibilityForZoom]);

  /** =========================
   *  Marker rendering
   *  ========================= */
  function renderMarkers(points: Point[], opts?: { fit?: boolean }) {
    renderAreaMarkers({
      points,
      opts,
      mapRef,
      markersRef,
      markerByKeyRef,
      pointByMarkerRef,
      selectedMarkerRef,
      kindFlagsRef,
      clearSelectedMarkerRef,
      syncMarkerIconsRef,
      desiredHeadingRef,
      infoRef,
      currentPointRef,
      currentAreaUuidRef,
      editableRef,
      addingAreaModeRef,
      measurementModeRef,
      openRestrictionInfoAtRef,
      selectByKeyRef,
      syncMarkersVisibilityForZoom,
      cancelAddMode,
      startChangePositionMode,
      syncAreaUuidQuery,
    });
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

        // デフォルトのフルスクリーンは #map の内部要素のみ対象になるため、
        // ツールパネルが含まれる map-page 全体をフルスクリーンにする独自ボタンを使用
        fullscreenControl: false,

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
      djiNfzInfoRef.current = new gmaps.InfoWindow();
      airportHeightRestrictionInfoRef.current = new gmaps.InfoWindow();
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng;

        // NFZ ポリゴンクリック直後は閉じない（map.data click と map click の両方が発火するため）
        if (djiNfzClickedRef.current) {
          djiNfzClickedRef.current = false;
          return;
        }

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

        // 測定中は頂点追加のみ行い、選択・詳細バー・ジオメトリは維持する
        if (measurementModeRef.current) {
          return;
        }

        // 通常時はマーカー・NFZ・空港高さ制限の InfoWindow を閉じる
        infoRef.current?.close();
        djiNfzInfoRef.current?.close();
        airportHeightRestrictionInfoRef.current?.close();

        // 編集ONかつ図が選択中は、空クリックで選択・詳細バー・ジオメトリを維持する
        if (editableRef.current && isSelectedRef.current) {
          return;
        }

        // 地図空クリックで選択解除（未選択）にする
        clearCurrentAreaSelection();
      });

      map.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
        const domEvent = (e as google.maps.MapMouseEvent & { domEvent?: Event }).domEvent;
        if (domEvent && "preventDefault" in domEvent) {
          (domEvent as Event).preventDefault();
        }
        if (e.latLng) openRestrictionInfoAtRef.current(e.latLng);
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
      djiNfzInfoRef.current?.close();
      djiNfzInfoRef.current = null;
      airportHeightRestrictionInfoRef.current?.close();
      airportHeightRestrictionInfoRef.current = null;
      setRestrictionOverlaysMap(airportRestrictionOverlaysRef.current, null);
      airportRestrictionOverlaysRef.current = [];

      clearGeometryOverlays();
      // DJI NFZ Data レイヤーの後始末
      const map = mapRef.current;
      if (map?.data) {
        map.data.forEach((f) => map.data.remove(f));
        map.data.setMap(null);
      }
      djiNfzLoadedRef.current = false;
      // トースト用タイマーの後始末
      if (areaCreatedToastTimerRef.current != null) {
        window.clearTimeout(areaCreatedToastTimerRef.current);
      }

      // 座標変更トーストのタイマー後始末
      if (positionUpdatedToastTimerRef.current != null) {
        window.clearTimeout(positionUpdatedToastTimerRef.current);
      }
    };
  }, [clearCurrentAreaSelection, syncMarkersVisibilityForZoom]);

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

      // フィルタ/検索で選択中エリアが非表示になったら未選択へ遷移
      const currentAreaName = currentPointRef.current?.areaName?.trim() || "";
      if (
        currentAreaName &&
        Array.isArray(names) &&
        !visibleAreaNamesRef.current?.has(currentAreaName)
      ) {
        clearCurrentAreaSelection();
      }
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
  }, [clearCurrentAreaSelection]);

  useEffect(() => {
    const onAreaKinds = (e: Event) => {
      const d = (
        e as CustomEvent<{
          kinds?: Record<
            string,
            { own: boolean; other: boolean; considering?: boolean }
          >;
        }>
      ).detail;
      kindFlagsRef.current = d?.kinds ?? {};
      syncMarkerIconsRef.current();
    };
    window.addEventListener(EV_SIDEBAR_AREA_KINDS, onAreaKinds as EventListener);
    return () =>
      window.removeEventListener(
        EV_SIDEBAR_AREA_KINDS,
        onAreaKinds as EventListener
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
    createDefaultGeometryForFigure: createDefaultGeometry,
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
    const applyOverlayPatch = (patch: Partial<OverlayVisibility>) => {
      const next = { ...overlayVisibilityRef.current, ...patch };
      overlayVisibilityRef.current = next;
      setOverlayVisibility(next);
      geomRef.current?.setOverlayVisibility(next);
    };

    const onSelectedStateChange = (e: Event) => {
      const detail =
        (
          e as CustomEvent<{
            isSelected?: boolean;
            kind?: "schedule" | "candidate" | "other" | "sales" | null;
          }>
        ).detail || {};
      const nextKind = detail.isSelected ? (detail.kind ?? null) : null;
      const wasOther = selectionKindRef.current === "other";
      const isOther = nextKind === "other";

      if (isOther && !wasOther) {
        const current = overlayVisibilityRef.current;
        figureOverlayBeforeOtherRef.current = {
          safety: current.safety,
          referencePoint: current.referencePoint,
          arrows: current.arrows,
          directLine: current.directLine,
          labels: current.labels,
          diameterLines: current.diameterLines,
        };
        applyOverlayPatch(OTHER_FIGURE_OVERLAY_PATCH);
      } else if (!isOther && wasOther) {
        applyOverlayPatch(
          figureOverlayBeforeOtherRef.current ?? {
            safety: true,
            referencePoint: true,
            arrows: true,
            directLine: true,
            labels: true,
            diameterLines: true,
          }
        );
        figureOverlayBeforeOtherRef.current = null;
      }

      setIsSelected(!!detail.isSelected);
      setSelectionKind(nextKind);
      selectionKindRef.current = nextKind;
    };

    window.addEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    return () => {
      window.removeEventListener(EV_DETAILBAR_SELECTED, onSelectedStateChange);
    };
  }, []);

  // エリア追加モード開始時は「未選択」に揃える（URLもクリア）
  useEffect(() => {
    const onStartAddArea = () => {
      clearCurrentAreaSelection();
      placePreviewInfoRef.current?.close();
    };
    window.addEventListener("map:start-add-area", onStartAddArea);
    return () => window.removeEventListener("map:start-add-area", onStartAddArea);
  }, [clearCurrentAreaSelection]);

  // 選択中エリアが論理削除されたら未選択へ遷移
  useEffect(() => {
    const onDeleteArea = (e: Event) => {
      const d =
        (e as CustomEvent<{ areaUuid?: string; areaName?: string }>).detail || {};
      const selected = currentPointRef.current;
      if (!selected) return;
      const sameUuid =
        !!d.areaUuid && !!selected.areaUuid && d.areaUuid === selected.areaUuid;
      const selectedAreaName = (selected.areaName || "").trim();
      const sameName =
        !!d.areaName && !!selectedAreaName && d.areaName === selectedAreaName;
      if (sameUuid || sameName) {
        clearCurrentAreaSelection();
      }
    };
    window.addEventListener("sidebar:delete-area", onDeleteArea as EventListener);
    return () =>
      window.removeEventListener("sidebar:delete-area", onDeleteArea as EventListener);
  }, [clearCurrentAreaSelection]);

  const { djiNfzLoading, djiNfzError } = useDjiNfzLayer({
    mapRef,
    mapReady,
    overlayVisibility,
    djiNfzInfoRef,
    djiNfzLoadedRef,
    measurementModeRef,
    addingAreaModeRef,
    measurementMode,
    addingAreaMode,
    airportHeightRestrictionInfoRef,
  });

  // 制限照会中はブラウザ／Maps のコンテキストメニューを出さない
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el || !mapReady) return;
    const onContextMenu = (ev: Event) => {
      if (
        airportHeightRestrictionModeRef.current ||
        overlayVisibilityRef.current.djiNfz
      ) {
        ev.preventDefault();
      }
    };
    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [mapReady, overlayVisibility.djiNfz, airportHeightRestrictionMode]);

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

  useAirportRestrictionLayer({
    mapRef,
    mapReady,
    airportHeightRestrictionMode,
    airportHeightRestrictionModeRef,
    airportHeightRestrictionInfoRef,
    airportRestrictionOverlaysRef,
    openRestrictionInfoAtRef,
    measurementModeRef,
    addingAreaModeRef,
    changingPositionRef,
    infoRef,
    djiNfzInfoRef,
    overlayVisibilityRef,
  });

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

    // === Geometry 一式（飛行＋保安／離着陸／観客） ===
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

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div className="map-page app-fullscreen" ref={mapPageRef}>
      <div id="map" ref={mapDivRef} />
      {!detectEmbedMode() && <PlaceSearchOverlay />}
      {/* フルスクリーン切替（map-page 全体を対象にし、ツールパネルも含める） */}
      <button
        type="button"
        className="map-fullscreen-btn"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "フルスクリーンを終了" : "フルスクリーン"}
        title={isFullscreen ? "フルスクリーンを終了" : "フルスクリーン"}
      >
        {isFullscreen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
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
            <div className="measurement-hint__type-switch">
              <button
                type="button"
                className={`measurement-hint__type-btn ${measurementType === "path" ? "measurement-hint__type-btn--active" : ""}`}
                onClick={() => switchMeasurementType("path")}
              >
                パス
              </button>
              <button
                type="button"
                className={`measurement-hint__type-btn ${measurementType === "line" ? "measurement-hint__type-btn--active" : ""}`}
                onClick={() => switchMeasurementType("line")}
              >
                ライン
              </button>
            </div>
            <span className="add-area-hint__text">
              計測モード
              <br />
              {measurementType === "line" ? (
                /* ライン: 1点時はプレビュー、2点時は確定距離、ドラッグ中は dragDistance_m */
                ((measurementPoints?.length ?? 0) >= 1 &&
                  (dragDistance_m != null ||
                    ((measurementPoints?.length ?? 0) >= 2 && Number.isFinite(totalDistance_m)) ||
                    ((measurementPoints?.length ?? 0) === 1 && (previewDistance_m ?? 0) > 0))) ? (
                  <>
                    距離:{" "}
                    {Math.round(
                      dragDistance_m ??
                        ((measurementPoints?.length ?? 0) >= 2
                          ? (totalDistance_m ?? 0)
                          : (previewDistance_m ?? 0))
                    )}
                    m
                  </>
                ) : null
              ) : (
                /* パス: 従来どおり合計＋プレビュー */
                ((measurementPoints?.length ?? 0) >= 2 && Number.isFinite(totalDistance_m)) ||
                (previewDistance_m ?? 0) > 0 ? (
                  <>
                    合計: {Math.round(totalDistance_m ?? 0)}m
                    {(previewDistance_m ?? 0) > 0 && (
                      <>
                        <br />
                        (+ {previewDistance_m}m)
                      </>
                    )}
                  </>
                ) : null
              )}
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

      <MapToolsPanel
        overlayVisibility={overlayVisibility}
        djiNfzLoading={djiNfzLoading}
        djiNfzError={djiNfzError}
        onOverlayVisibilityChange={(v) => {
          setOverlayVisibility(v);
          geomRef.current?.setOverlayVisibility(v);
        }}
        showOverlaySection={isSelected && !showCreateGeomCta}
        currentGeometry={geomRef.current?.getCurrentGeometry() ?? null}
        onGeometryColorChange={(areaKey, color) => {
          const geom = geomRef.current?.getCurrentGeometry();
          if (!geom) return;
          const area = geom[areaKey];
          if (!area || typeof area !== "object") return;
          const updated = {
            ...geom,
            [areaKey]: { ...area, color },
          };
          geomRef.current?.renderGeometry(updated, { fit: false });
          setGeometryRevision((r) => r + 1);
        }}
        onGeometryOpacityChange={(areaKey, fillOpacity) => {
          const geom = geomRef.current?.getCurrentGeometry();
          if (!geom) return;
          const area = geom[areaKey];
          if (!area || typeof area !== "object") return;
          const updated = {
            ...geom,
            [areaKey]: { ...area, fillOpacity },
          };
          geomRef.current?.renderGeometry(updated, { fit: false });
          setGeometryRevision((r) => r + 1);
        }}
        onStartMeasurement={() => window.dispatchEvent(new CustomEvent("map:start-measurement"))}
        onAirportHeightRestrictionChange={(checked) => {
          if (checked) {
            window.dispatchEvent(new CustomEvent("map:start-airport-height-restriction"));
          } else {
            window.dispatchEvent(new CustomEvent("map:cancel-airport-height-restriction"));
          }
        }}
        showMeasureButton={!measurementMode && window === window.top}
        showAirportHeightRestrictionCheckbox
        airportHeightRestrictionMode={airportHeightRestrictionMode}
        airportHeightRestrictionDisabled={measurementMode}
      />

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
            heightLimitM: newAreaDraft.heightLimitM ?? undefined,
            remarks: newAreaDraft.remarks ?? undefined,
          });

          if (!result.ok) {
            if (result.reason === "duplicate") {
              window.alert(
                `エリア名「${areaNameInput.trim()}」は既に存在します。\n別の名称を指定してください。`
              );
            } else if (result.reason === "fetch-list-failed") {
              window.alert(FETCH_AREAS_LIST_ERROR_MSG);
            } else {
              window.alert(
                systemError(
                  E004_NEW_AREA_S3,
                  `新規エリアの保存に失敗。S3 の設定（CORS / 権限）をご確認ください${areaNameInput.trim() ? `（area_name: ${areaNameInput.trim()}）` : ""}`
                )
              );
            }
            // モーダルは開いたまま & 入力も保持 → ユーザーが名前を修正して再トライできる
            return;
          }

          // ② 最新の areas.json を読み込み直してマーカー再描画
          //    地図の位置・ズームは変えない
          const points = await loadAreasPoints();
          onLoaded?.(points);
          renderMarkers(points, { fit: false });

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
