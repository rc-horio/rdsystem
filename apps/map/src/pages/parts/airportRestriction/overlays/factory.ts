/**
 * 空港制限表面の地図描画（共有）
 * 進入・転移は赤、水平は緑、円錐はシアン、外側水平は黄。
 * clickable: false で左クリックの選択・描画を妨げない。
 */

export type OverlayCoord = { lat: number; lng: number };
export type RestrictionOverlay = google.maps.Polygon | google.maps.Circle;

const RING_STEPS = 120;

export const QUAD_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#FF3B30",
  strokeOpacity: 0.95,
  strokeWeight: 2,
  fillColor: "#FF3B30",
  fillOpacity: 0.18,
  zIndex: 50,
  clickable: false,
};

export const HORIZONTAL_STYLE: google.maps.CircleOptions = {
  strokeColor: "#7CFF00",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#7CFF00",
  fillOpacity: 0.1,
  zIndex: 100,
  clickable: false,
};

export const HORIZONTAL_POLYGON_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#7CFF00",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#7CFF00",
  fillOpacity: 0.1,
  zIndex: 100,
  clickable: false,
};

export const CONICAL_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#00E5FF",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#00E5FF",
  fillOpacity: 0.08,
  zIndex: 100,
  clickable: false,
};

export const OUTER_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#FFEB3B",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#FFEB3B",
  fillOpacity: 0.08,
  zIndex: 200,
  clickable: false,
};

export type AirportOverlaySpec = {
  horizontalCircle?: { center: OverlayCoord; radius: number };
  horizontalPolygon?: readonly OverlayCoord[];
  conicalPolygon?: readonly OverlayCoord[];
  outerPolygon?: readonly OverlayCoord[];
  conicalRing?: {
    center: OverlayCoord;
    innerRadius: number;
    outerRadius: number;
  };
  outerRing?: {
    center: OverlayCoord;
    innerRadius: number;
    outerRadius: number;
  };
  quads: readonly OverlayCoord[][];
  /** 未指定なら QUAD_STYLE */
  quadStyle?: google.maps.PolygonOptions;
  /** 未指定なら HORIZONTAL_STYLE */
  horizontalStyle?: google.maps.CircleOptions;
  /** 未指定なら CONICAL_STYLE */
  conicalStyle?: google.maps.PolygonOptions;
  /** 未指定なら OUTER_STYLE */
  outerStyle?: google.maps.PolygonOptions;
};

export function makePolygon(
  gmaps: typeof google.maps,
  path: readonly OverlayCoord[],
  style: google.maps.PolygonOptions
): google.maps.Polygon {
  return new gmaps.Polygon({
    ...style,
    paths: path.map((c) => ({ lat: c.lat, lng: c.lng })),
  });
}

function circlePath(
  gmaps: typeof google.maps,
  center: OverlayCoord,
  radiusM: number,
  clockwise: boolean
): OverlayCoord[] {
  const c = new gmaps.LatLng(center.lat, center.lng);
  const path: OverlayCoord[] = [];
  for (let i = 0; i < RING_STEPS; i++) {
    const t = i / RING_STEPS;
    const heading = clockwise ? t * 360 : -t * 360;
    const p = gmaps.geometry.spherical.computeOffset(c, radiusM, heading);
    path.push({ lat: p.lat(), lng: p.lng() });
  }
  return path;
}

function makeRing(
  gmaps: typeof google.maps,
  center: OverlayCoord,
  innerRadius: number,
  outerRadius: number,
  style: google.maps.PolygonOptions
): google.maps.Polygon {
  const outer = circlePath(gmaps, center, outerRadius, true);
  const inner = circlePath(gmaps, center, innerRadius, false);
  return new gmaps.Polygon({
    ...style,
    paths: [outer, inner],
  });
}

function makeStrokeCircle(
  gmaps: typeof google.maps,
  center: OverlayCoord,
  radius: number,
  style: google.maps.PolygonOptions
): google.maps.Circle {
  return new gmaps.Circle({
    center,
    radius,
    strokeColor: style.strokeColor,
    strokeOpacity: style.strokeOpacity,
    strokeWeight: style.strokeWeight,
    fillOpacity: 0,
    zIndex: style.zIndex,
    clickable: false,
  });
}

export function createOverlaysFromSpec(
  gmaps: typeof google.maps,
  spec: AirportOverlaySpec
): RestrictionOverlay[] {
  const overlays: RestrictionOverlay[] = [];
  const canOffset = Boolean(gmaps.geometry?.spherical?.computeOffset);

  if (spec.horizontalCircle) {
    overlays.push(
      new gmaps.Circle({
        ...(spec.horizontalStyle ?? HORIZONTAL_STYLE),
        center: spec.horizontalCircle.center,
        radius: spec.horizontalCircle.radius,
      })
    );
  }
  if (spec.horizontalPolygon) {
    overlays.push(
      makePolygon(gmaps, spec.horizontalPolygon, HORIZONTAL_POLYGON_STYLE)
    );
  }
  if (spec.conicalPolygon) {
    overlays.push(
      makePolygon(gmaps, spec.conicalPolygon, spec.conicalStyle ?? CONICAL_STYLE)
    );
  }
  if (spec.outerPolygon) {
    overlays.push(
      makePolygon(gmaps, spec.outerPolygon, spec.outerStyle ?? OUTER_STYLE)
    );
  }
  if (spec.conicalRing) {
    overlays.push(
      canOffset
        ? makeRing(
            gmaps,
            spec.conicalRing.center,
            spec.conicalRing.innerRadius,
            spec.conicalRing.outerRadius,
            CONICAL_STYLE
          )
        : makeStrokeCircle(
            gmaps,
            spec.conicalRing.center,
            spec.conicalRing.outerRadius,
            CONICAL_STYLE
          )
    );
  }
  if (spec.outerRing) {
    overlays.push(
      canOffset
        ? makeRing(
            gmaps,
            spec.outerRing.center,
            spec.outerRing.innerRadius,
            spec.outerRing.outerRadius,
            OUTER_STYLE
          )
        : makeStrokeCircle(
            gmaps,
            spec.outerRing.center,
            spec.outerRing.outerRadius,
            OUTER_STYLE
          )
    );
  }
  const quadStyle = spec.quadStyle ?? QUAD_STYLE;
  for (const path of spec.quads) {
    overlays.push(makePolygon(gmaps, path, quadStyle));
  }
  return overlays;
}

export function setRestrictionOverlaysMap(
  overlays: RestrictionOverlay[],
  map: google.maps.Map | null
): void {
  for (const ov of overlays) {
    ov.setMap(map);
  }
}
