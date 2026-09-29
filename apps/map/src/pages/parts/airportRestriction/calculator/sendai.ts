import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/sendai";
import {
  runwayA as sA,
  runwayB as sB,
  conicalCutPath as sendaiConicalCutPath,
  outerCutPath as sendaiOuterCutPath,
  SENDAI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as SENDAI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as SENDAI_CONICAL_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as SENDAI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as SENDAI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as SENDAI_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as SENDAI_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as SENDAI_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as SENDAI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SENDAI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SENDAI_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SENDAI_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SENDAI_PITCH_B,
  PITCH_OF_TRANSITIONAL_SURFACE as SENDAI_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as SENDAI_PITCH_CONICAL,
} from "../data/sendai";
import {
  STR_TO_SURFACE,
  isPointInPolygon,
  mathSinnyuWithPitch,
  pickSendaiSurfaceName,
} from "./shared";
import type { HeightEntry } from "./shared";

/** 仙台: ポリゴン内に点が含まれるか */
function isSendaiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(g, lat, lng, path.map((c) => ({ lat: c.lat, lng: c.lng })));
}

/**
 * 仙台公式 TransitionalSurface.getLimitHeightOfSquareArea。
 * 滑走路端高さは斜辺距離 o で按分する（底辺ではない）。
 */
function sendaiTransSquareHeight(
  g: typeof google.maps,
  center1: Coord,
  center2: Coord,
  height1: number,
  height2: number,
  clickP: google.maps.LatLng,
  landingLength: number,
  landingWidth: number,
  pitch: number
): number {
  const c1 = new g.LatLng(center1.lat, center1.lng);
  const c2 = new g.LatLng(center2.lat, center2.lng);
  const heading1 = g.geometry!.spherical.computeHeading(c1, c2);
  let heading2 = g.geometry!.spherical.computeHeading(c1, clickP);
  if (heading2 < 0) heading2 += 180;
  const n = Math.abs(heading1 - heading2);
  const o = g.geometry!.spherical.computeDistanceBetween(c1, clickP);
  const opposite = o * Math.sin((n * Math.PI) / 180);
  const edgeHeight = height1 + ((height2 - height1) * o) / landingLength;
  const fromEdge = opposite - landingWidth / 2;
  return edgeHeight + fromEdge * pitch;
}

/**
 * 仙台公式 TransitionalSurface.getLimitHeightOfTriangleArea。
 * 滑走路軸の垂線と、cross〜long_side の交点までの距離を使う。
 */
function sendaiTransTriHeight(
  g: typeof google.maps,
  center1: Coord,
  center2: Coord,
  crossPoint: Coord,
  longSidePoint: Coord,
  clickP: google.maps.LatLng,
  approachHeight: number,
  pitchApproach: number,
  pitchTransition: number
): number {
  const approachEdgeHeight = mathSinnyuWithPitch(
    g,
    center1,
    center2,
    clickP,
    approachHeight,
    pitchApproach
  );
  const r = Number(center1.lat.toFixed(8));
  const n = Number(center1.lng.toFixed(8));
  const o = Number(center2.lat.toFixed(8));
  const a = Number(center2.lng.toFixed(8));
  const i = Number(crossPoint.lat.toFixed(8));
  const c = Number(crossPoint.lng.toFixed(8));
  const s = Number(longSidePoint.lat.toFixed(8));
  const p = Number(longSidePoint.lng.toFixed(8));
  const clickLat = Number(clickP.lat().toFixed(8));
  const clickLng = Number(clickP.lng().toFixed(8));
  const u = (o - r) / (a - n);
  const h = -1 / u;
  const d = -(h * clickLng) + clickLat;
  const longSlope = (s - i) / (p - c);
  const longIntercept = -(longSlope * c) + i;
  const crossX = (longIntercept - d) / (h - longSlope);
  const crossY = h * crossX + d;
  const distanceFromEdge = g.geometry!.spherical.computeDistanceBetween(
    clickP,
    new g.LatLng(crossY, crossX)
  );
  return approachEdgeHeight + distanceFromEdge * pitchTransition;
}

/**
 * 仙台: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 円錐は切り欠き内かつ 4000m 超、外側水平は切り欠き内かつ 16500m 超。
 * 水平は標点から 0m 超〜4000m の円（公式 HorizontalSurface.isContain）。
 */
function calcSendaiSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);
  const pitchT = SENDAI_PITCH_TRANS;

  if (inPoly([sA.cd07, sA.cd09, sA.cd14, sA.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09])) {
    height.push({
      val: mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A),
      str: "進入表面",
    });
  }
  if (inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18])) {
    height.push({
      val: mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A),
      str: "進入表面",
    });
  }
  if (inPoly([sA.cd06, sA.cd07, sA.cd12, sA.cd11])) {
    height.push({
      val: sendaiTransSquareHeight(
        g,
        sA.cd08,
        sA.cd13,
        SENDAI_HEIGHT_A_1,
        SENDAI_HEIGHT_A_2,
        latLng,
        SENDAI_LENGTH_A,
        SENDAI_WIDTH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sA.cd09, sA.cd10, sA.cd15, sA.cd14])) {
    height.push({
      val: sendaiTransSquareHeight(
        g,
        sA.cd08,
        sA.cd13,
        SENDAI_HEIGHT_A_1,
        SENDAI_HEIGHT_A_2,
        latLng,
        SENDAI_LENGTH_A,
        SENDAI_WIDTH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sA.cd04, sA.cd07, sA.cd06])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sA.cd08,
        sA.cd02,
        sA.cd07,
        sA.cd01,
        latLng,
        SENDAI_HEIGHT_A_1,
        SENDAI_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sA.cd05, sA.cd10, sA.cd09])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sA.cd08,
        sA.cd02,
        sA.cd09,
        sA.cd03,
        latLng,
        SENDAI_HEIGHT_A_1,
        SENDAI_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sA.cd11, sA.cd12, sA.cd16])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sA.cd13,
        sA.cd19,
        sA.cd12,
        sA.cd18,
        latLng,
        SENDAI_HEIGHT_A_2,
        SENDAI_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sA.cd14, sA.cd15, sA.cd17])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sA.cd13,
        sA.cd19,
        sA.cd14,
        sA.cd20,
        latLng,
        SENDAI_HEIGHT_A_2,
        SENDAI_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (inPoly([sB.cd07, sB.cd09, sB.cd14, sB.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09])) {
    height.push({
      val: mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B),
      str: "進入表面",
    });
  }
  if (inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])) {
    height.push({
      val: mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B),
      str: "進入表面",
    });
  }
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({
      val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B),
      str: "延長進入表面",
    });
  }
  if (inPoly([sB.cd06, sB.cd07, sB.cd12, sB.cd11])) {
    height.push({
      val: sendaiTransSquareHeight(
        g,
        sB.cd08,
        sB.cd13,
        SENDAI_HEIGHT_B_1,
        SENDAI_HEIGHT_B_2,
        latLng,
        SENDAI_LENGTH_B,
        SENDAI_WIDTH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sB.cd09, sB.cd10, sB.cd15, sB.cd14])) {
    height.push({
      val: sendaiTransSquareHeight(
        g,
        sB.cd08,
        sB.cd13,
        SENDAI_HEIGHT_B_1,
        SENDAI_HEIGHT_B_2,
        latLng,
        SENDAI_LENGTH_B,
        SENDAI_WIDTH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sB.cd04, sB.cd07, sB.cd06])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sB.cd08,
        sB.cd02,
        sB.cd07,
        sB.cd01,
        latLng,
        SENDAI_HEIGHT_B_1,
        SENDAI_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sB.cd05, sB.cd10, sB.cd09])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sB.cd08,
        sB.cd02,
        sB.cd09,
        sB.cd03,
        latLng,
        SENDAI_HEIGHT_B_1,
        SENDAI_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sB.cd11, sB.cd12, sB.cd16])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sB.cd13,
        sB.cd19,
        sB.cd12,
        sB.cd18,
        latLng,
        SENDAI_HEIGHT_B_2,
        SENDAI_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([sB.cd14, sB.cd15, sB.cd17])) {
    height.push({
      val: sendaiTransTriHeight(
        g,
        sB.cd13,
        sB.cd19,
        sB.cd14,
        sB.cd20,
        latLng,
        SENDAI_HEIGHT_B_2,
        SENDAI_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (distance > 0 && distance <= SENDAI_HORIZ_RADIUS) {
    height.push({
      val: SENDAI_REF_HEIGHT + SENDAI_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (inPoly(sendaiConicalCutPath) && distance > SENDAI_HORIZ_RADIUS) {
    height.push({
      val:
        SENDAI_REF_HEIGHT +
        (distance - SENDAI_HORIZ_RADIUS) * SENDAI_PITCH_CONICAL +
        SENDAI_HORIZ_HEIGHT,
      str: "円錐表面",
    });
  }

  if (inPoly(sendaiOuterCutPath) && distance > SENDAI_CONICAL_RADIUS) {
    height.push({
      val: SENDAI_OUTER_HEIGHT + SENDAI_REF_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  const st = STR_TO_SURFACE[picked.name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 仙台空港の高さ制限を計算する。
 * 公式 GetCirclePaths(cd01〜cd05) の切り欠きを円錐・外側水平に使う。
 */
export function calculateSendaiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(SENDAI_REFERENCE_POINT.lat, SENDAI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcSendaiSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "sendai",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
