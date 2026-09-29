/**
 * Places SearchText は locationBias を円の中心として検証する。
 * 世界地図の横繰り返しでは map.getCenter() の経度が [-180, 180] を超える。
 */
export function placesLocationBiasFromMapCenter(
  center: google.maps.LatLng | null | undefined
): google.maps.LatLngLiteral | undefined {
  if (!center) return undefined;
  const lat = center.lat();
  const lng = center.lng();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90) return undefined;
  const wrappedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat, lng: wrappedLng };
}

/** Google の日本語 formattedAddress から郵便番号と住所を分ける */
export function splitPlaceFormattedAddress(formatted: string): {
  postalCode: string;
  address: string;
} {
  const stripped = formatted.replace(/^日本[、,]\s*/, "").trim();
  const matched = stripped.match(/^(〒?\d{3}-?\d{4})\s+(.*)$/);
  if (!matched) return { postalCode: "", address: stripped };
  const rawPostal = matched[1];
  const postalCode = rawPostal.startsWith("〒") ? rawPostal : `〒${rawPostal}`;
  return { postalCode, address: matched[2].trim() };
}

export function placeDisplayName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value) {
    const text = (value as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }
  return "";
}

export function googleMapsUrlForPlace(opts: {
  placeId?: string;
  name?: string;
  lat: number;
  lng: number;
}): string {
  if (opts.placeId) {
    const query = opts.name?.trim() || `${opts.lat},${opts.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${encodeURIComponent(opts.placeId)}`;
  }
  return `https://www.google.com/maps?q=${opts.lat},${opts.lng}`;
}

/** 場所検索の候補一覧と吹き出しが被らないよう、地図中心から右へずらす量 */
export function placePreviewPanOffsetX(map: google.maps.Map): number {
  const overlay = document.querySelector(".place-search-overlay__dropdown");
  const mapDiv = map.getDiv();
  if (!(overlay instanceof HTMLElement) || !mapDiv) return 0;
  const overlayRight = overlay.getBoundingClientRect().right;
  const mapRect = mapDiv.getBoundingClientRect();
  const balloonHalfPx = 160;
  const gapPx = 12;
  const desiredX = overlayRight - mapRect.left + gapPx + balloonHalfPx;
  return Math.max(0, Math.round(desiredX - mapRect.width / 2));
}

export type AddAreaSearchResult = {
  placeId: string;
  label: string;
  name: string;
  postalCode: string;
  address: string;
};
