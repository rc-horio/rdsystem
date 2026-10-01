import { useCallback, useEffect, type MutableRefObject } from "react";
import {
  buildAirportHeightRestrictionPopupHtml,
  calculateAirportRestriction,
} from "./airportRestriction";
import {
  createAllAirportRestrictionOverlays,
  setRestrictionOverlaysMap,
  type RestrictionOverlay,
} from "./airportRestriction/overlays";
import { buildDjiNfzPopupHtml, collectDjiNfzEntriesAtPoint } from "./djiNfz";
import { getGMaps } from "./getGMaps";
import type { OverlayVisibility } from "./overlayVisibility";

export function useAirportRestrictionLayer(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  mapReady: boolean;
  airportHeightRestrictionMode: boolean;
  airportHeightRestrictionModeRef: MutableRefObject<boolean>;
  airportHeightRestrictionInfoRef: MutableRefObject<google.maps.InfoWindow | null>;
  airportRestrictionOverlaysRef: MutableRefObject<RestrictionOverlay[]>;
  openRestrictionInfoAtRef: MutableRefObject<(latLng: google.maps.LatLng) => void>;
  measurementModeRef: MutableRefObject<boolean>;
  addingAreaModeRef: MutableRefObject<boolean>;
  changingPositionRef: MutableRefObject<boolean>;
  infoRef: MutableRefObject<google.maps.InfoWindow | null>;
  djiNfzInfoRef: MutableRefObject<google.maps.InfoWindow | null>;
  overlayVisibilityRef: MutableRefObject<OverlayVisibility>;
}) {
  const {
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
  } = args;

  const openRestrictionInfoAt = useCallback((latLng: google.maps.LatLng) => {
    if (
      measurementModeRef.current ||
      addingAreaModeRef.current ||
      changingPositionRef.current
    ) {
      return;
    }

    const map = mapRef.current;
    const gmaps = (window as any).google.maps as typeof google.maps | undefined;
    if (!map || !gmaps) return;

    if (airportHeightRestrictionModeRef.current) {
      infoRef.current?.close();
      djiNfzInfoRef.current?.close();
      try {
        const result = calculateAirportRestriction(
          latLng.lat(),
          latLng.lng(),
          gmaps
        );
        const html = buildAirportHeightRestrictionPopupHtml({
          airportResult: result,
        });
        const info = airportHeightRestrictionInfoRef.current;
        if (info) {
          info.setContent(html);
          info.setPosition(latLng);
          info.open(map);
        }
      } catch {
        const html = buildAirportHeightRestrictionPopupHtml({
          airportResult: { items: [], error: true },
        });
        const info = airportHeightRestrictionInfoRef.current;
        if (info) {
          info.setContent(html);
          info.setPosition(latLng);
          info.open(map);
        }
      }
      return;
    }

    if (!overlayVisibilityRef.current.djiNfz || !map.data) return;

    const entries = collectDjiNfzEntriesAtPoint(map, latLng);
    if (entries.length === 0) return;

    infoRef.current?.close();
    airportHeightRestrictionInfoRef.current?.close();
    const info = djiNfzInfoRef.current;
    if (info) {
      info.setContent(buildDjiNfzPopupHtml(entries));
      info.setPosition(latLng);
      info.open(map);
    }
  }, []);

  openRestrictionInfoAtRef.current = openRestrictionInfoAt;

  // 空港高さ制限モード: 吹き出しクリアと全空港制限表面の表示
  useEffect(() => {
    const map = mapRef.current;
    if (!airportHeightRestrictionMode) {
      airportHeightRestrictionInfoRef.current?.close();
      setRestrictionOverlaysMap(airportRestrictionOverlaysRef.current, null);
      return;
    }
    if (!map || !mapReady) return;
    if (airportRestrictionOverlaysRef.current.length === 0) {
      airportRestrictionOverlaysRef.current =
        createAllAirportRestrictionOverlays(getGMaps());
    }
    setRestrictionOverlaysMap(airportRestrictionOverlaysRef.current, map);
    return () => {
      setRestrictionOverlaysMap(airportRestrictionOverlaysRef.current, null);
    };
  }, [airportHeightRestrictionMode, mapReady]);
}
