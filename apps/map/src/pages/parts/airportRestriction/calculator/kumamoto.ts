import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import {
  surfacePoints as kmPoints,
  conicalCutPath as kumamotoConicalCutPath,
  outerCutPath as kumamotoOuterCutPath,
  KUMAMOTO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KUMAMOTO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as KUMAMOTO_LENGTH,
  WIDTH_OF_LANDING_AREA as KUMAMOTO_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as KUMAMOTO_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as KUMAMOTO_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as KUMAMOTO_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as KUMAMOTO_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as KUMAMOTO_PITCH_CONICAL,
} from "../data/kumamoto";
import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsMultiplication,
  decimalsSubstract,
  hakodateApproachHeight,
  hakodateTransQuadHeight,
  hakodateTransTriHeight,
  isPointInPolygon,
  pickSendaiSurfaceName,
} from "./shared";
import type { HeightEntry } from "./shared";

function isKumamotoPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 熊本: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * ClickSurface の continue はコメントアウト済みのため、進入内でも水平、延長内でも円錐を残す。
 * 円錐は切り欠き内かつ 4000m 超。外側水平は切り欠き内（inner_radius は見ない）。
 * 円錐内なのに名称が外側水平になった場合は円錐に差し替える（公式 flg55）。
 */
function calcKumamotoSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isKumamotoPointInPolygon(g, lat, lng, path);
  const pitchT = KUMAMOTO_PITCH_TRANS;
  const p = kmPoints;

  const inLanding = inPoly([p.cd12, p.cd14, p.cd20, p.cd18]);
  const inApproachW = inPoly([p.cd12, p.cd04, p.cd06, p.cd14]);
  const inApproachE = inPoly([p.cd18, p.cd20, p.cd28, p.cd26]);
  const inExtW = inPoly([p.cd04, p.cd06, p.cd03, p.cd01]);
  const inExtE = inPoly([p.cd26, p.cd28, p.cd31, p.cd29]);

  if (inLanding) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inApproachW) {
    height.push({
      val: hakodateApproachHeight(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1, KUMAMOTO_PITCH),
      str: "進入表面",
    });
  }
  if (inApproachE) {
    height.push({
      val: hakodateApproachHeight(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2, KUMAMOTO_PITCH),
      str: "進入表面",
    });
  }
  if (inExtW) {
    height.push({
      val: hakodateApproachHeight(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1, KUMAMOTO_PITCH),
      str: "延長進入表面",
    });
  }
  if (inExtE) {
    height.push({
      val: hakodateApproachHeight(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2, KUMAMOTO_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([p.cd11, p.cd12, p.cd18, p.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([p.cd14, p.cd15, p.cd21, p.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([p.cd07, p.cd12, p.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        p.cd13,
        p.cd12,
        p.cd05,
        p.cd04,
        latLng,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([p.cd08, p.cd15, p.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        p.cd13,
        p.cd14,
        p.cd05,
        p.cd06,
        latLng,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([p.cd17, p.cd18, p.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        p.cd19,
        p.cd18,
        p.cd27,
        p.cd26,
        latLng,
        KUMAMOTO_HEIGHT_2,
        KUMAMOTO_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([p.cd20, p.cd21, p.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        p.cd19,
        p.cd20,
        p.cd27,
        p.cd28,
        latLng,
        KUMAMOTO_HEIGHT_2,
        KUMAMOTO_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (distance > 0 && distance <= KUMAMOTO_HORIZ_RADIUS) {
    height.push({
      val: KUMAMOTO_REF_HEIGHT + KUMAMOTO_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  const inConical =
    inPoly(kumamotoConicalCutPath) && distance > KUMAMOTO_HORIZ_RADIUS;
  if (inConical) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, KUMAMOTO_HORIZ_RADIUS),
      KUMAMOTO_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(KUMAMOTO_REF_HEIGHT + KUMAMOTO_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(kumamotoOuterCutPath)) {
    height.push({
      val: KUMAMOTO_REF_HEIGHT + KUMAMOTO_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  let name = picked.name;
  if (inConical && name === "外側水平表面") {
    name = "円錐表面";
  }
  const st = STR_TO_SURFACE[name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 熊本空港の高さ制限を計算する。
 * 公式 GetCirclePaths（CD16 中心、CDA〜CDG、CD101〜CD116）の切り欠きを使う。
 */
export function calculateKumamotoRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(KUMAMOTO_REFERENCE_POINT.lat, KUMAMOTO_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcKumamotoSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "kumamoto",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
