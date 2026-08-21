/**
 * 関西国際空港 制限表面の地図描画
 * 公式 https://secure.kix-ap.ne.jp/kix/ と同じ 25 枚（円 3 + A/B 滑走路 11×2）
 */

import {
  surfacePointsA,
  surfacePointsB,
  conicalCutPath,
  outerCutPath,
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE,
  type Coord,
  type KansaiCoords,
} from "../data/kansai";

export type RestrictionOverlay = google.maps.Polygon | google.maps.Circle;

const QUAD_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#FF3B30",
  strokeOpacity: 0.95,
  strokeWeight: 2,
  fillColor: "#FF3B30",
  fillOpacity: 0.18,
  zIndex: 50,
  clickable: false,
};

const HORIZONTAL_STYLE: google.maps.CircleOptions = {
  strokeColor: "#7CFF00",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#7CFF00",
  fillOpacity: 0.1,
  zIndex: 100,
  clickable: false,
};

const CONICAL_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#00E5FF",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#00E5FF",
  fillOpacity: 0.08,
  zIndex: 100,
  clickable: false,
};

const OUTER_STYLE: google.maps.PolygonOptions = {
  strokeColor: "#FFEB3B",
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  fillColor: "#FFEB3B",
  fillOpacity: 0.08,
  zIndex: 200,
  clickable: false,
};

/** 公式 quadrangle tables と同じ頂点順 */
function shapesForRunway(p: KansaiCoords): Coord[][] {
  return [
    [p.cd12, p.cd14, p.cd20, p.cd18],
    [p.cd12, p.cd04, p.cd06, p.cd14],
    [p.cd18, p.cd20, p.cd28, p.cd26],
    [p.cd04, p.cd06, p.cd03, p.cd01],
    [p.cd26, p.cd28, p.cd31, p.cd29],
    [p.cd11, p.cd12, p.cd18, p.cd17],
    [p.cd14, p.cd15, p.cd21, p.cd20],
    [p.cd07, p.cd12, p.cd11],
    [p.cd08, p.cd15, p.cd14],
    [p.cd17, p.cd18, p.cd24],
    [p.cd20, p.cd21, p.cd25],
  ];
}

function makePolygon(
  gmaps: typeof google.maps,
  path: Coord[],
  style: google.maps.PolygonOptions
): google.maps.Polygon {
  return new gmaps.Polygon({
    ...style,
    paths: path.map((c) => ({ lat: c.lat, lng: c.lng })),
  });
}

export function createKansaiRestrictionOverlays(
  gmaps: typeof google.maps
): RestrictionOverlay[] {
  const overlays: RestrictionOverlay[] = [
    new gmaps.Circle({
      ...HORIZONTAL_STYLE,
      center: KANSAI_REFERENCE_POINT,
      radius: RADIUS_OF_HORIZONTAL_SURFACE,
    }),
    makePolygon(gmaps, conicalCutPath, CONICAL_STYLE),
    makePolygon(gmaps, outerCutPath, OUTER_STYLE),
  ];

  for (const pts of [surfacePointsA, surfacePointsB]) {
    for (const path of shapesForRunway(pts)) {
      overlays.push(makePolygon(gmaps, path, QUAD_STYLE));
    }
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
