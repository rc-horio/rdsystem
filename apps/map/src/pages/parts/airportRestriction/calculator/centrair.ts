import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import {
  surfacePoints as cM,
  conicalCutPath as centrairConicalCutPath,
  outerCutPath as centrairOuterCutPath,
  CENTRAIR_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as CENTRAIR_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as CENTRAIR_LENGTH,
  WIDTH_OF_LANDING_AREA as CENTRAIR_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as CENTRAIR_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as CENTRAIR_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as CENTRAIR_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as CENTRAIR_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as CENTRAIR_PITCH_CONICAL,
} from "../data/centrair";
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

function isCentrairPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 中部国際: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 進入内では水平を除外、延長進入内では円錐を除外（公式 ClickSurface の flg）。
 * 円錐は切り欠き内かつ 4000m 超。外側水平は切り欠き内（inner_radius は見ない）。
 */
function calcCentrairSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);
  const pitchT = CENTRAIR_PITCH_TRANS;

  const inLanding = inPoly([cM.cd12, cM.cd14, cM.cd20, cM.cd18]);
  const inApproachNw = inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14]);
  const inApproachSe = inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26]);
  const inExtNw = inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]);
  const inExtSe = inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29]);
  const inApproach = inApproachNw || inApproachSe;
  const inExtended = inExtNw || inExtSe;

  if (inLanding) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inApproachNw) {
    height.push({
      val: hakodateApproachHeight(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inApproachSe) {
    height.push({
      val: hakodateApproachHeight(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inExtNw) {
    height.push({
      val: hakodateApproachHeight(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inExtSe) {
    height.push({
      val: hakodateApproachHeight(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([cM.cd11, cM.cd12, cM.cd18, cM.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([cM.cd14, cM.cd15, cM.cd21, cM.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([cM.cd07, cM.cd12, cM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        cM.cd13,
        cM.cd12,
        cM.cd05,
        cM.cd04,
        latLng,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([cM.cd08, cM.cd15, cM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        cM.cd13,
        cM.cd14,
        cM.cd05,
        cM.cd06,
        latLng,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([cM.cd17, cM.cd18, cM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        cM.cd19,
        cM.cd18,
        cM.cd27,
        cM.cd26,
        latLng,
        CENTRAIR_HEIGHT_2,
        CENTRAIR_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([cM.cd20, cM.cd21, cM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        cM.cd19,
        cM.cd20,
        cM.cd27,
        cM.cd28,
        latLng,
        CENTRAIR_HEIGHT_2,
        CENTRAIR_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (!inApproach && distance > 0 && distance <= CENTRAIR_HORIZ_RADIUS) {
    height.push({
      val: CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (
    !inExtended &&
    inPoly(centrairConicalCutPath) &&
    distance > CENTRAIR_HORIZ_RADIUS
  ) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, CENTRAIR_HORIZ_RADIUS),
      CENTRAIR_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(centrairOuterCutPath)) {
    height.push({
      val: CENTRAIR_REF_HEIGHT + CENTRAIR_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  const st = STR_TO_SURFACE[picked.name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 中部国際空港（セントレア）の高さ制限を計算する。
 * 公式 GetCirclePaths(CDA〜CDG) の切り欠きを円錐・外側水平に使う。
 */
export function calculateCentrairRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(CENTRAIR_REFERENCE_POINT.lat, CENTRAIR_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcCentrairSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "centrair",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
