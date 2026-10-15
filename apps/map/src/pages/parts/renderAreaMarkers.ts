import { createMarkerIcon, markerIconUrlForFlags } from "@/components";
import type { Point } from "@/features/types";
import type { MutableRefObject } from "react";
import { fetchAreaInfo } from "./areasApi";
import {
  AREA_NAME_NONE,
  EV_SIDEBAR_OPEN,
  EV_SIDEBAR_SET_ACTIVE,
  MARKERS_HIDE_ZOOM,
  MIN_ZOOM_DELTA_TO_CHANGE,
  SELECT_ZOOM_DESKTOP,
  SELECT_ZOOM_MOBILE,
} from "./constants/events";
import { getGMaps } from "./getGMaps";
import type { OverlayVisibility } from "./overlayVisibility";
import {
  openDetailBar,
  setDetailBarHistory,
  setDetailBarMeta,
  setDetailBarMetrics,
  setDetailBarTitle,
} from "./SideDetailBar";

type KindFlags = { own: boolean; other: boolean; considering?: boolean };

export function syncAreaMarkersVisibility(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  markersRef: MutableRefObject<google.maps.Marker[]>;
  pointByMarkerRef: MutableRefObject<WeakMap<google.maps.Marker, Point>>;
  visibleAreaNamesRef: MutableRefObject<Set<string> | null>;
  overlayVisibilityRef: MutableRefObject<OverlayVisibility>;
  infoRef: MutableRefObject<google.maps.InfoWindow | null>;
}) {
  const {
    mapRef,
    markersRef,
    pointByMarkerRef,
    visibleAreaNamesRef,
    overlayVisibilityRef,
    infoRef,
  } = args;

    const map = mapRef.current;
    if (!map) return;
    const z = map.getZoom() ?? 0;
    const hideByZoom = z >= MARKERS_HIDE_ZOOM;
    const visibleAreas = visibleAreaNamesRef.current;
    const companyMarkersOn = overlayVisibilityRef.current.companyMarkers;

    markersRef.current.forEach((m) => {
      const p = pointByMarkerRef.current.get(m);
      const areaKey = p?.areaName?.trim() || AREA_NAME_NONE;
      const visibleByFilter =
        !visibleAreas || visibleAreas.has(areaKey);
      const visible =
        companyMarkersOn && !hideByZoom && visibleByFilter;
      m.setVisible(visible);
    });

    if (hideByZoom || !companyMarkersOn) {
      // マーカーを隠すときは InfoWindow も閉じる
      infoRef.current?.close();
    }
}

export function renderAreaMarkers(args: {
  points: Point[];
  opts?: { fit?: boolean };
  mapRef: MutableRefObject<google.maps.Map | null>;
  markersRef: MutableRefObject<google.maps.Marker[]>;
  markerByKeyRef: MutableRefObject<Map<string, google.maps.Marker>>;
  pointByMarkerRef: MutableRefObject<WeakMap<google.maps.Marker, Point>>;
  selectedMarkerRef: MutableRefObject<google.maps.Marker | null>;
  kindFlagsRef: MutableRefObject<Record<string, KindFlags>>;
  clearSelectedMarkerRef: MutableRefObject<() => void>;
  syncMarkerIconsRef: MutableRefObject<() => void>;
  desiredHeadingRef: MutableRefObject<number>;
  infoRef: MutableRefObject<google.maps.InfoWindow | null>;
  currentPointRef: MutableRefObject<Point | null>;
  currentAreaUuidRef: MutableRefObject<string | undefined>;
  editableRef: MutableRefObject<boolean>;
  addingAreaModeRef: MutableRefObject<boolean>;
  measurementModeRef: MutableRefObject<boolean>;
  openRestrictionInfoAtRef: MutableRefObject<(latLng: google.maps.LatLng) => void>;
  selectByKeyRef: MutableRefObject<
    (keys: { areaUuid?: string; areaName?: string }) => boolean
  >;
  syncMarkersVisibilityForZoom: () => void;
  cancelAddMode: () => void;
  startChangePositionMode: () => void;
  syncAreaUuidQuery: (areaUuid?: string) => void;
}) {
  const {
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
  } = args;

    const shouldFit = opts?.fit !== false;
    const map = mapRef.current!;
    const gmaps = getGMaps();

    // 既存マーカーをクリア
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerByKeyRef.current.clear();
    pointByMarkerRef.current = new WeakMap();
    selectedMarkerRef.current = null;

    const iconFor = (p: Point, selected: boolean) => {
      const flags = p.areaUuid
        ? kindFlagsRef.current[p.areaUuid]
        : undefined;
      return createMarkerIcon(gmaps, {
        url: markerIconUrlForFlags(flags),
        width: selected ? 38 : 30,
        height: selected ? 46 : 36,
        anchor: "bottom",
      });
    };

    const bounds = new gmaps.LatLngBounds();

    const applySelection = (marker: google.maps.Marker, selected: boolean) => {
      const p = pointByMarkerRef.current.get(marker);
      if (!p) return;
      marker.setIcon(iconFor(p, selected));
      if (selected) {
        marker.setZIndex(google.maps.Marker.MAX_ZINDEX ?? 999999);
      } else {
        marker.setZIndex(undefined);
      }
    };
    clearSelectedMarkerRef.current = () => {
      if (!selectedMarkerRef.current) return;
      applySelection(selectedMarkerRef.current, false);
      selectedMarkerRef.current = null;
    };
    syncMarkerIconsRef.current = () => {
      const selected = selectedMarkerRef.current;
      markersRef.current.forEach((marker) => {
        const p = pointByMarkerRef.current.get(marker);
        if (!p) return;
        marker.setIcon(iconFor(p, marker === selected));
      });
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
      syncAreaUuidQuery(p.areaUuid || undefined);
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
        icon: iconFor(p, false),
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

        // マーカークリック時はマーカー選択を優先（高さ制限照会モードでも同様）
        selectMarker(marker, p);
      });
      marker.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng ?? marker.getPosition();
        if (latLng) openRestrictionInfoAtRef.current(latLng);
      });
    });

    // 初回読込だけ全マーカーに合わせる。エリア追加後は今の位置・ズームを保つ
    if (shouldFit && !bounds.isEmpty()) {
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
        return false;
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
        return true;
      }
      return false;
    };

    syncMarkersVisibilityForZoom();
}
