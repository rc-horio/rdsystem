import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import type { OverlayVisibility } from "./overlayVisibility";
import {
  DJI_DEFAULT_COLOR,
  DJI_LEVEL_COLORS,
  DJI_NFZ_PROXY_URL,
  djiApiResponseToGeoJson,
  loadDjiNfzKmlGeoJson,
} from "./djiNfz";
import type { GeoJsonFeature } from "./djiNfz";

export function useDjiNfzLayer(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  mapReady: boolean;
  overlayVisibility: OverlayVisibility;
  djiNfzInfoRef: MutableRefObject<google.maps.InfoWindow | null>;
  djiNfzLoadedRef: MutableRefObject<boolean>;
  measurementModeRef: MutableRefObject<boolean>;
  addingAreaModeRef: MutableRefObject<boolean>;
  measurementMode: boolean;
  addingAreaMode: boolean;
  airportHeightRestrictionInfoRef: MutableRefObject<google.maps.InfoWindow | null>;
}) {
  const [djiNfzLoading, setDjiNfzLoading] = useState(false);
  const [djiNfzError, setDjiNfzError] = useState<string | null>(null);
  const {
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
  } = args;

  /** NFZ ポリゴンのスタイル（測定中は地図クリックを通す／エリア追加中は copy カーソル） */
  const getDjiNfzFeatureStyle = useCallback(
    (feature: google.maps.Data.Feature) => {
      const level = feature.getProperty("level") as number | undefined;
      const c =
        level != null && level in DJI_LEVEL_COLORS
          ? DJI_LEVEL_COLORS[level]
          : DJI_DEFAULT_COLOR;
      const isMeasurement = measurementModeRef.current;
      const isAddingArea = addingAreaModeRef.current;
      return {
        fillColor: c.fill,
        fillOpacity: 0.25,
        strokeColor: c.stroke,
        strokeWeight: 1,
        // 照会は右クリック。左クリックは地図へ通す（エリア追加中のみポリゴンがクリックを受ける）
        clickable: isAddingArea && !isMeasurement,
        cursor: isAddingArea
          ? "copy"
          : isMeasurement
            ? "crosshair"
            : "default",
      };
    },
    []
  );

  // エリア追加・測定モード切替時に NFZ ポリゴンのクリック可否・カーソルを更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !overlayVisibility.djiNfz) return;
    if (map.data.getMap() !== map) return;

    map.data.setStyle((feature) => getDjiNfzFeatureStyle(feature));
  }, [addingAreaMode, measurementMode, mapReady, overlayVisibility.djiNfz, getDjiNfzFeatureStyle]);

  // DJI NFZ レイヤー：プロキシ URL ありなら API（範囲変更で再取得）、なければ KML を Data レイヤーで表示
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const show = overlayVisibility.djiNfz;
    const useApi = !!DJI_NFZ_PROXY_URL;

    const fetchAndApplyDjiNfz = async () => {
      const applyGeoJson = async (
        geoJson: { type: "FeatureCollection"; features: GeoJsonFeature[] }
      ) => {
        map.data.setStyle((feature) => getDjiNfzFeatureStyle(feature));
        if (useApi) {
          map.data.forEach((f) => map.data.remove(f));
        }
        const BATCH_SIZE = 200;
        const feats = geoJson.features || [];
        for (let i = 0; i < feats.length; i += BATCH_SIZE) {
          const batch = feats.slice(i, i + BATCH_SIZE);
          map.data.addGeoJson({ type: "FeatureCollection", features: batch });
          if (i + BATCH_SIZE < feats.length) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      };

      const loadKml = () => loadDjiNfzKmlGeoJson();

      setDjiNfzError(null);
      setDjiNfzLoading(true);
      try {
        let geoJson: { type: "FeatureCollection"; features: GeoJsonFeature[] };

        if (useApi) {
          try {
            const center = map.getCenter();
            const bounds = map.getBounds();
            const zoom = map.getZoom() ?? 10;
            const lng = center?.lng() ?? 139.7;
            const lat = center?.lat() ?? 35.6;
            let searchRadius = 50000;
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const latRad = (lat * Math.PI) / 180;
              const mPerDegLat = 111320;
              const mPerDegLng = 111320 * Math.cos(latRad);
              const dy = Math.abs(ne.lat() - sw.lat()) * mPerDegLat;
              const dx = Math.abs(ne.lng() - sw.lng()) * mPerDegLng;
              searchRadius = Math.max(
                20000,
                Math.min(100000, Math.ceil(Math.max(dy, dx) * 0.6) + 5000)
              );
              if (zoom >= 15) {
                searchRadius = Math.max(searchRadius, 25000);
              }
            }
            const url = `${DJI_NFZ_PROXY_URL}?lng=${lng}&lat=${lat}&search_radius=${searchRadius}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`DJI API fetch failed: ${res.status}`);
            const body = await res.json();
            if (body.status === "422" || body.error) {
              throw new Error(body.extra?.msg || body.error || "API error");
            }
            geoJson = djiApiResponseToGeoJson(body);
          } catch (apiErr) {
            console.warn("[map] DJI API failed, fallback to KML:", apiErr);
            geoJson = await loadKml();
          }
        } else {
          geoJson = await loadKml();
        }

        if (geoJson.features.length > 0) {
          await applyGeoJson(geoJson);
        }
        setDjiNfzError(null);
      } catch (err) {
        console.warn("[map] DJI NFZ load failed:", err);
        setDjiNfzError("飛行禁止エリアの情報を取得できませんでした。しばらく時間をおいて、もう一度お試しください。繰り返す場合は担当者にお問い合わせください。（エラー内容: 飛行禁止エリア照会エラー）");
      } finally {
        setDjiNfzLoading(false);
      }
    };

    const handleNfzDataClickForAddArea = (e: google.maps.Data.MouseEvent) => {
      const latLng = e.latLng;
      if (!latLng) return;
      if (measurementModeRef.current) return;
      if (!addingAreaModeRef.current) return;
      airportHeightRestrictionInfoRef.current?.close();
      djiNfzInfoRef.current?.close();
      window.dispatchEvent(
        new CustomEvent("map:add-area-picked", {
          detail: { lat: latLng.lat(), lng: latLng.lng() },
        })
      );
    };

    if (show) {
      if (useApi) {
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const scheduleFetch = () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            fetchAndApplyDjiNfz();
          }, 400);
        };
        scheduleFetch();
        const idleListener = map.addListener("idle", scheduleFetch);
        map.data.setMap(map);
        const dataClickListener = map.data.addListener(
          "click",
          handleNfzDataClickForAddArea
        );
        return () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          google.maps.event.removeListener(idleListener);
          google.maps.event.removeListener(dataClickListener);
        };
      } else {
        if (!djiNfzLoadedRef.current) {
          fetchAndApplyDjiNfz().then(() => {
            djiNfzLoadedRef.current = true;
          });
        }
        map.data.setMap(map);
        const dataClickListener = map.data.addListener(
          "click",
          handleNfzDataClickForAddArea
        );
        return () => {
          google.maps.event.removeListener(dataClickListener);
        };
      }
    } else {
      map.data.setMap(null);
      djiNfzInfoRef.current?.close();
      setDjiNfzError(null);
    }
  }, [mapReady, overlayVisibility.djiNfz, getDjiNfzFeatureStyle]);

  return { djiNfzLoading, djiNfzError };
}
