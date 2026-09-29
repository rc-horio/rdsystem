import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/matsuyama";
import {
  surfacePoints as mM,
  conicalCutPath as matsuyamaConicalCutPath,
  outerCutPath as matsuyamaOuterCutPath,
  MATSUYAMA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MATSUYAMA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MATSUYAMA_LENGTH,
  WIDTH_OF_LANDING_AREA as MATSUYAMA_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MATSUYAMA_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MATSUYAMA_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as MATSUYAMA_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as MATSUYAMA_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as MATSUYAMA_PITCH_CONICAL,
} from "../data/matsuyama";
import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsDivision,
  decimalsMultiplication,
  decimalsSubstract,
  hakodateApproachHeight,
  hakodateTransTriHeight,
  isPointInPolygon,
  pickSendaiSurfaceName,
} from "./shared";
import type { HeightEntry } from "./shared";

/**
 * 松山公式 TransitionalSurface.getLimitHeightOfQuadrangleArea。
 * 原点は landing_area_center1。低/高の割り当てが公式どおり逆転している。
 */
function matsuyamaTransQuadHeight(
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
  const degree = Math.abs(decimalsSubstract(heading1, heading2));
  const radian = decimalsMultiplication(degree, decimalsDivision(Math.PI, 180));
  const hypotenuse = g.geometry!.spherical.computeDistanceBetween(c1, clickP);
  const opposite = decimalsMultiplication(hypotenuse, Math.sin(radian));
  const adjacent = decimalsMultiplication(hypotenuse, Math.cos(radian));
  let lowHeight: number;
  let highHeight: number;
  if (height1 < height2) {
    lowHeight = height2;
    highHeight = height1;
  } else {
    lowHeight = height1;
    highHeight = height2;
  }
  const addHeight = decimalsMultiplication(
    highHeight - lowHeight,
    decimalsDivision(adjacent, landingLength)
  );
  const edgeHeight = lowHeight + addHeight;
  const fromEdge = decimalsSubstract(opposite, decimalsDivision(landingWidth, 2));
  const addFromEdge = decimalsMultiplication(fromEdge, pitch);
  return decimalsAddition(edgeHeight, addFromEdge);
}

/** 松山: ポリゴン内に点が含まれるか */
function isMatsuyamaPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 松山: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 進入内では水平を除外、進入または延長進入内では円錐を除外（公式 ClickSurface の flg）。
 * 円錐は切り欠き内かつ 3500m 超。外側水平は切り欠き内（inner_radius は見ない）。
 */
function calcMatsuyamaSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMatsuyamaPointInPolygon(g, lat, lng, path);
  const pitchT = MATSUYAMA_PITCH_TRANS;

  const inLanding = inPoly([mM.cd12, mM.cd14, mM.cd20, mM.cd18]);
  const inApproachW = inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14]);
  const inApproachE = inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26]);
  const inExtW = inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01]);
  const inApproach = inApproachW || inApproachE;
  const inExtended = inExtW;

  if (inLanding) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inApproachW) {
    height.push({
      val: hakodateApproachHeight(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1, MATSUYAMA_PITCH),
      str: "進入表面",
    });
  }
  if (inApproachE) {
    height.push({
      val: hakodateApproachHeight(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2, MATSUYAMA_PITCH),
      str: "進入表面",
    });
  }
  if (inExtW) {
    height.push({
      val: hakodateApproachHeight(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1, MATSUYAMA_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([mM.cd11, mM.cd12, mM.cd18, mM.cd17])) {
    height.push({
      val: matsuyamaTransQuadHeight(
        g,
        mM.cd13,
        mM.cd19,
        MATSUYAMA_HEIGHT_1,
        MATSUYAMA_HEIGHT_2,
        latLng,
        MATSUYAMA_LENGTH,
        MATSUYAMA_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mM.cd14, mM.cd15, mM.cd21, mM.cd20])) {
    height.push({
      val: matsuyamaTransQuadHeight(
        g,
        mM.cd13,
        mM.cd19,
        MATSUYAMA_HEIGHT_1,
        MATSUYAMA_HEIGHT_2,
        latLng,
        MATSUYAMA_LENGTH,
        MATSUYAMA_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mM.cd07, mM.cd12, mM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mM.cd13,
        mM.cd12,
        mM.cd05,
        mM.cd04,
        latLng,
        MATSUYAMA_HEIGHT_1,
        MATSUYAMA_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mM.cd08, mM.cd15, mM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mM.cd13,
        mM.cd14,
        mM.cd05,
        mM.cd06,
        latLng,
        MATSUYAMA_HEIGHT_1,
        MATSUYAMA_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mM.cd17, mM.cd18, mM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mM.cd19,
        mM.cd18,
        mM.cd27,
        mM.cd26,
        latLng,
        MATSUYAMA_HEIGHT_2,
        MATSUYAMA_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mM.cd20, mM.cd21, mM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mM.cd19,
        mM.cd20,
        mM.cd27,
        mM.cd28,
        latLng,
        MATSUYAMA_HEIGHT_2,
        MATSUYAMA_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (!inApproach && distance > 0 && distance <= MATSUYAMA_HORIZ_RADIUS) {
    height.push({
      val: MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (
    !inApproach &&
    !inExtended &&
    inPoly(matsuyamaConicalCutPath) &&
    distance > MATSUYAMA_HORIZ_RADIUS
  ) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, MATSUYAMA_HORIZ_RADIUS),
      MATSUYAMA_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(matsuyamaOuterCutPath)) {
    height.push({
      val: MATSUYAMA_REF_HEIGHT + MATSUYAMA_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  const st = STR_TO_SURFACE[picked.name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 松山空港の高さ制限を計算する。
 * 公式 GetCirclePaths(CDA〜CDE) の切り欠きを円錐・外側水平に使う。
 */
export function calculateMatsuyamaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(MATSUYAMA_REFERENCE_POINT.lat, MATSUYAMA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcMatsuyamaSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "matsuyama",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
