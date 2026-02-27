// src/components/hook/useMeasurementMode.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LngLat } from "@/features/types";

const getGMaps = () =>
  (window as any).google.maps as typeof google.maps;

export type MeasurementType = "path" | "line";

export function useMeasurementMode(
  mapRef: React.MutableRefObject<google.maps.Map | null>,
  mapReady = false
) {
  const mountedRef = useRef(true);
  const [measurementMode, setMeasurementMode] = useState(false);
  const measurementModeRef = useRef(false);
  const [measurementType, setMeasurementType] = useState<MeasurementType>("path");
  const [points, setPoints] = useState<LngLat[]>([]);
  const pointsRef = useRef<LngLat[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Polyline / markers / labels（MapGeometry とは別管理）
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const labelsRef = useRef<google.maps.Marker[]>([]);

  // ドラッグ中のプレビュー（最後の点→カーソル位置）
  const previewPolylineRef = useRef<google.maps.Polyline | null>(null);
  const previewLabelRef = useRef<google.maps.Marker | null>(null);
  const [previewDistance_m, setPreviewDistance_m] = useState(0);
  /** ライン2点時、ドラッグ中のリアルタイム距離（ドラッグ中のみセット） */
  const [dragDistance_m, setDragDistance_m] = useState<number | null>(null);

  const measurementTypeRef = useRef<MeasurementType>("path");
  const syncRefs = useCallback(() => {
    measurementModeRef.current = measurementMode;
    measurementTypeRef.current = measurementType;
    pointsRef.current = points;
  }, [measurementMode, measurementType, points]);

  useEffect(() => {
    syncRefs();
  }, [syncRefs]);

  /** プレビュー（ドラッグ中の仮線）をクリア */
  const clearPreview = useCallback(() => {
    try {
      if (previewPolylineRef.current) {
        previewPolylineRef.current.setMap(null);
        previewPolylineRef.current = null;
      }
      if (previewLabelRef.current) {
        previewLabelRef.current.setMap(null);
        previewLabelRef.current = null;
      }
      if (mountedRef.current) setPreviewDistance_m(0);
    } catch (e) {
      console.warn("[useMeasurementMode] clearPreview error:", e);
    }
  }, []);

  /** オーバーレイをクリア */
  const clearOverlays = useCallback(() => {
    clearPreview();
    if (mountedRef.current) setDragDistance_m(null);
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    markersRef.current.forEach((m) => {
      m.setMap(null);
    });
    markersRef.current = [];
    labelsRef.current.forEach((m) => {
      m.setMap(null);
    });
    labelsRef.current = [];
  }, [clearPreview]);

  /** 測定モードを終了 */
  const cancelMeasurementMode = useCallback(() => {
    measurementModeRef.current = false;
    setMeasurementMode(false);
    setPoints([]);
    pointsRef.current = [];
    clearOverlays();

    window.dispatchEvent(
      new CustomEvent("map:measurement-mode-changed", {
        detail: { active: false },
      })
    );
  }, [clearOverlays]);

  /** 頂点をクリア（モードは維持） */
  const clearPoints = useCallback(() => {
    setPoints([]);
    pointsRef.current = [];
    clearOverlays();
  }, [clearOverlays]);

  /** 測定タイプを切り替え（切り替え時にポイントをクリア） */
  const switchMeasurementType = useCallback(
    (type: MeasurementType) => {
      setMeasurementType((prev) => {
        if (prev === type) return prev;
        setPoints([]);
        pointsRef.current = [];
        clearOverlays();
        return type;
      });
    },
    [clearOverlays]
  );

  /** オーバーレイを描画・更新 */
  const renderOverlays = useCallback(
    (pts: LngLat[]) => {
      try {
        const map = mapRef.current;
        const gmaps = getGMaps();
        if (!map || !gmaps?.geometry?.spherical) return;

        clearOverlays();

        if (pts.length === 0) return;

        const isLineWith2Points =
          measurementType === "line" && pts.length === 2;

        // 頂点マーカー（1点目から表示）
        const markers: google.maps.Marker[] = [];
        pts.forEach(([lng, lat], index) => {
          const marker = new gmaps.Marker({
            position: new gmaps.LatLng(lat, lng),
            map,
            icon: {
              path: gmaps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#2196f3",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            } as google.maps.Symbol,
            zIndex: 101,
            clickable: isLineWith2Points, // ライン2点時はドラッグ用にクリック可能
            draggable: isLineWith2Points,
          });
          if (isLineWith2Points) {
            const updateLineFromMarkers = () => {
              const ms = markersRef.current;
              const m0 = ms[0]?.getPosition();
              const m1 = ms[1]?.getPosition();
              if (!m0 || !m1 || !gmaps.geometry?.spherical) return;
              const dist = gmaps.geometry.spherical.computeDistanceBetween(m0, m1);
              const mid = gmaps.geometry.spherical.interpolate(m0, m1, 0.5);
              polylineRef.current?.setPath([m0, m1]);
              const labelMarker = labelsRef.current[0];
              if (labelMarker) {
                labelMarker.setPosition(mid);
                labelMarker.setLabel({
                  text: `${Math.round(dist)}m`,
                  className: "measurement-label",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                } as google.maps.MarkerLabel);
              }
              if (mountedRef.current) setDragDistance_m(Math.round(dist));
            };
            marker.addListener("drag", updateLineFromMarkers);
            marker.addListener("dragend", () => {
              const pos = marker.getPosition();
              if (!pos) return;
              const newLng = pos.lng();
              const newLat = pos.lat();
              setPoints((prev) => {
                const next = [...prev];
                next[index] = [newLng, newLat];
                pointsRef.current = next;
                return next;
              });
              if (mountedRef.current) setDragDistance_m(null);
            });
          }
          markers.push(marker);
        });
        markersRef.current = markers;

        // 2点以上で Polyline とセグメント距離ラベルを描画
        if (pts.length >= 2) {
          const path = pts.map(([lng, lat]) => new gmaps.LatLng(lat, lng));
          const polyline = new gmaps.Polyline({
            path,
            strokeColor: "#2196f3",
            strokeOpacity: 1,
            strokeWeight: 3,
            clickable: false,
            zIndex: 100,
            map,
          });
          polylineRef.current = polyline;
        }

        // セグメント距離ラベル（2点以上で各セグメントの中点に表示）
        const labels: google.maps.Marker[] = [];
        for (let i = 0; i < Math.max(0, pts.length - 1); i++) {
          const a = new gmaps.LatLng(pts[i][1], pts[i][0]);
          const b = new gmaps.LatLng(pts[i + 1][1], pts[i + 1][0]);
          const dist = gmaps.geometry.spherical.computeDistanceBetween(a, b);
          const mid = gmaps.geometry.spherical.interpolate(a, b, 0.5);

          const label = new gmaps.Marker({
            position: mid,
            map,
            icon: {
              path: gmaps.SymbolPath.CIRCLE,
              scale: 0,
              strokeWeight: 0,
            },
            label: {
              text: `${Math.round(dist)}m`,
              className: "measurement-label",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "bold",
            },
            zIndex: 102,
            clickable: false,
          });
          labels.push(label);
        }
        labelsRef.current = labels;
      } catch (e) {
        console.warn("[useMeasurementMode] renderOverlays error:", e);
      }
    },
    [mapRef, clearOverlays, measurementType]
  );

  useEffect(() => {
    renderOverlays(points);
  }, [points, renderOverlays]);

  /** 測定モード開始イベント */
  useEffect(() => {
    const onStart = () => {
      setMeasurementMode(true);
      measurementModeRef.current = true;
      setPoints([]);
      pointsRef.current = [];
      clearOverlays();
      // エリア追加モードと排他（高さ制限チェックは維持し、測定中は表示のみ非表示）
      window.dispatchEvent(new CustomEvent("map:cancel-add-area"));
      window.dispatchEvent(
        new CustomEvent("map:measurement-mode-changed", {
          detail: { active: true },
        })
      );
    };

    const onCancel = () => {
      cancelMeasurementMode();
    };

    const onAddAreaStart = () => {
      cancelMeasurementMode();
    };

    window.addEventListener("map:start-measurement", onStart);
    window.addEventListener("map:cancel-measurement", onCancel);
    window.addEventListener("map:start-add-area", onAddAreaStart);
    return () => {
      window.removeEventListener("map:start-measurement", onStart);
      window.removeEventListener("map:cancel-measurement", onCancel);
      window.removeEventListener("map:start-add-area", onAddAreaStart);
    };
  }, [clearOverlays, clearPreview, cancelMeasurementMode]);

  /** マップ上でマウス移動時、最後の点→カーソル位置のプレビュー線を表示 */
  useEffect(() => {
    if (!mapReady) return undefined;
    const map = mapRef.current;
    const gmaps = getGMaps();
    if (!map || !gmaps?.geometry?.spherical) return undefined;

    const onMouseMove = (e: google.maps.MapMouseEvent) => {
      try {
        const latLng = e.latLng;
        if (!latLng || !measurementModeRef.current) {
          clearPreview();
          return;
        }
        const pts = pointsRef.current;
        const type = measurementTypeRef.current;
        if (pts.length === 0) {
          clearPreview();
          return;
        }
        // ライン2点確定後はプレビューを表示しない
        if (type === "line" && pts.length >= 2) {
          clearPreview();
          return;
        }

        const last = pts[pts.length - 1];
        const lastLL = new gmaps.LatLng(last[1], last[0]);
        const cursorLL = latLng;
        const dist = gmaps.geometry.spherical.computeDistanceBetween(lastLL, cursorLL);
        const mid = gmaps.geometry.spherical.interpolate(lastLL, cursorLL, 0.5);

        if (mountedRef.current) setPreviewDistance_m(Math.round(dist));

        if (previewPolylineRef.current) {
          previewPolylineRef.current.setPath([lastLL, cursorLL]);
          previewPolylineRef.current.setMap(map);
        } else {
          previewPolylineRef.current = new gmaps.Polyline({
          path: [lastLL, cursorLL],
          strokeColor: "#2196f3",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          clickable: false,
          zIndex: 99,
          map,
        });
      }

      if (previewLabelRef.current) {
        previewLabelRef.current.setPosition(mid);
        previewLabelRef.current.setLabel({ text: `${Math.round(dist)}m`, className: "measurement-label", color: "#fff", fontSize: "12px", fontWeight: "bold" } as google.maps.MarkerLabel);
        previewLabelRef.current.setMap(map);
      } else {
        previewLabelRef.current = new gmaps.Marker({
          position: mid,
          map,
          icon: { path: gmaps.SymbolPath.CIRCLE, scale: 0, strokeWeight: 0 },
          label: { text: `${Math.round(dist)}m`, className: "measurement-label", color: "#fff", fontSize: "12px", fontWeight: "bold" } as google.maps.MarkerLabel,
          zIndex: 100,
          clickable: false,
        });
      }
      } catch (err) {
        console.warn("[useMeasurementMode] mousemove error:", err);
        clearPreview();
      }
    };

    const onMouseOut = () => {
      clearPreview();
    };

    const moveListener = map.addListener("mousemove", onMouseMove);
    const outListener = map.addListener("mouseout", onMouseOut);

    return () => {
      moveListener?.remove?.();
      outListener?.remove?.();
      clearPreview();
    };
  }, [mapRef, mapReady, measurementMode, clearPreview]);

  /** マップクリックで頂点追加 */
  useEffect(() => {
    if (!mapReady) return undefined;
    const map = mapRef.current;
    if (!map) return undefined;

    const listener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng;
        if (!latLng || !measurementModeRef.current) return;

        const lng = latLng.lng();
        const lat = latLng.lat();
        const newPoint: LngLat = [lng, lat];
        const type = measurementTypeRef.current;

        clearPreview();
        setPoints((prev) => {
          let next: LngLat[];
          if (type === "line") {
            if (prev.length === 0) {
              next = [newPoint];
            } else if (prev.length === 1) {
              next = [prev[0], newPoint];
            } else {
              // 2点ある場合: それ以上は追加しない
              next = prev;
            }
          } else {
            next = [...prev, newPoint];
          }
          pointsRef.current = next;
          return next;
        });
      }
    );

    return () => {
      listener?.remove?.();
    };
  }, [mapRef, mapReady, measurementMode, clearPreview]);

  /** モード中のカーソル変更 */
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    try {
      if (measurementMode) {
        map.setOptions({ draggableCursor: "crosshair" });
      } else {
        map.setOptions({ draggableCursor: undefined });
      }
    } catch (e) {
      console.warn("[useMeasurementMode] cursor update error:", e);
    }
  }, [measurementMode, mapRef, mapReady]);

  /** Esc でモード終了 */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && measurementModeRef.current) {
        cancelMeasurementMode();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelMeasurementMode]);

  /** 合計距離を計算（パス: 全セグメント合計、ライン: 2点間の距離のみ） */
  const totalDistance_m = useMemo(() => {
    try {
      if (points.length < 2) return 0;
      const gmaps = getGMaps();
      if (!gmaps?.geometry?.spherical) return 0;
      if (measurementType === "line") {
        const a = new gmaps.LatLng(points[0][1], points[0][0]);
        const b = new gmaps.LatLng(points[1][1], points[1][0]);
        return gmaps.geometry.spherical.computeDistanceBetween(a, b);
      }
      const path = points.map(([lng, lat]) => new gmaps.LatLng(lat, lng));
      return gmaps.geometry.spherical.computeLength(path);
    } catch {
      return 0;
    }
  }, [points, measurementType]);

  return {
    measurementMode,
    measurementType,
    switchMeasurementType,
    points,
    totalDistance_m,
    previewDistance_m,
    dragDistance_m,
    cancelMeasurementMode,
    clearPoints,
  };
}
