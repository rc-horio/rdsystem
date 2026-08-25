import type { Point } from "@/features/types";
import {
  EV_MAP_REQUEST_CURRENT_POINT,
  EV_MAP_RESPOND_CURRENT_POINT,
} from "../constants/events";

export function hasValidLatLng(point: Point | null | undefined): boolean {
  return (
    point != null &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng)
  );
}

export function requestCurrentPoint(): Promise<Point | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (point: Point | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener(
        EV_MAP_RESPOND_CURRENT_POINT,
        onRespond as EventListener
      );
      window.clearTimeout(timer);
      resolve(point);
    };

    const onRespond = (e: Event) => {
      const detail = (e as CustomEvent<Point | null>).detail;
      finish(detail ?? null);
    };

    const timer = window.setTimeout(() => finish(null), 250);
    window.addEventListener(
      EV_MAP_RESPOND_CURRENT_POINT,
      onRespond as EventListener
    );
    window.dispatchEvent(new Event(EV_MAP_REQUEST_CURRENT_POINT));
  });
}

export async function openGoogleMapsForCurrentPoint(): Promise<boolean> {
  const point = await requestCurrentPoint();
  if (!hasValidLatLng(point) || !point) return false;
  const url = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
