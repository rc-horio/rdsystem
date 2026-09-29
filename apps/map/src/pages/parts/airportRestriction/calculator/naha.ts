import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/naha";
import {
  surfacePointsA as nAha,
  surfacePointsB as nBha,
  conicalCutPath as nahaConicalCutPath,
  outerCutPath as nahaOuterCutPath,
  NAHA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAHA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as NAHA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as NAHA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as NAHA_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as NAHA_HEIGHT_A_2,
  LENGTH_OF_LANDING_AREA_B as NAHA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as NAHA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as NAHA_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as NAHA_HEIGHT_B_2,
  PITCH_OF_APPROACH_SURFACE as NAHA_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as NAHA_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as NAHA_PITCH_CONICAL,
} from "../data/naha";
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
 * 那覇公式 TransitionalSurface.getLimitHeightOfQuadrangleArea。
 * 原点は landing_area_center1。sin/cos に abs。高低差は height2 - height1（min/max しない）。
 */
function nahaTransQuadHeight(
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
  const opposite = decimalsMultiplication(hypotenuse, Math.abs(Math.sin(radian)));
  const adjacent = decimalsMultiplication(hypotenuse, Math.abs(Math.cos(radian)));
  const diffHeight = height2 - height1;
  const addHeight = decimalsMultiplication(
    diffHeight,
    decimalsDivision(adjacent, landingLength)
  );
  const edgeHeight = height1 + addHeight;
  const fromEdge = decimalsSubstract(opposite, decimalsDivision(landingWidth, 2));
  const addFromEdge = decimalsMultiplication(fromEdge, pitch);
  return decimalsAddition(edgeHeight, addFromEdge);
}

/** 那覇: ポリゴン内判定 */
function isNahaPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(
    g,
    lat,
    lng,
    path.map((c) => ({ lat: c.lat, lng: c.lng }))
  );
}

/**
 * 那覇: A/B 両滑走路の進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 進入内では水平と円錐を除外、延長進入内では円錐を除外（公式 ClickSurface の continue）。
 * 円錐は GetCirclePaths 切り欠き内かつ 4000m 超。外側水平は切り欠き内。
 * 円錐内なのに名称が外側水平になった場合は円錐に差し替える（公式 flg55）。
 */
function calcNahaSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);
  const pitchT = NAHA_PITCH_TRANS;

  const pushRunway = (
    p: typeof nAha,
    h1: number,
    h2: number,
    length: number,
    width: number
  ) => {
    if (inPoly([p.cd12, p.cd14, p.cd20, p.cd18])) {
      height.push({ val: 0, str: "着陸帯" });
    }
    if (inPoly([p.cd12, p.cd04, p.cd06, p.cd14])) {
      height.push({
        val: hakodateApproachHeight(g, p.cd13, p.cd05, latLng, h1, NAHA_PITCH),
        str: "進入表面",
      });
    }
    if (inPoly([p.cd18, p.cd20, p.cd28, p.cd26])) {
      height.push({
        val: hakodateApproachHeight(g, p.cd19, p.cd27, latLng, h2, NAHA_PITCH),
        str: "進入表面",
      });
    }
    if (inPoly([p.cd04, p.cd06, p.cd03, p.cd01])) {
      height.push({
        val: hakodateApproachHeight(g, p.cd13, p.cd02, latLng, h1, NAHA_PITCH),
        str: "延長進入表面",
      });
    }
    if (inPoly([p.cd26, p.cd28, p.cd31, p.cd29])) {
      height.push({
        val: hakodateApproachHeight(g, p.cd19, p.cd30, latLng, h2, NAHA_PITCH),
        str: "延長進入表面",
      });
    }
    if (inPoly([p.cd11, p.cd12, p.cd18, p.cd17])) {
      height.push({
        val: nahaTransQuadHeight(g, p.cd13, p.cd19, h1, h2, latLng, length, width, pitchT),
        str: "転移表面",
      });
    }
    if (inPoly([p.cd14, p.cd15, p.cd21, p.cd20])) {
      height.push({
        val: nahaTransQuadHeight(g, p.cd13, p.cd19, h1, h2, latLng, length, width, pitchT),
        str: "転移表面",
      });
    }
    if (inPoly([p.cd07, p.cd12, p.cd11])) {
      height.push({
        val: hakodateTransTriHeight(g, p.cd13, p.cd12, p.cd05, p.cd04, latLng, h1, NAHA_PITCH, pitchT),
        str: "転移表面",
      });
    }
    if (inPoly([p.cd08, p.cd15, p.cd14])) {
      height.push({
        val: hakodateTransTriHeight(g, p.cd13, p.cd14, p.cd05, p.cd06, latLng, h1, NAHA_PITCH, pitchT),
        str: "転移表面",
      });
    }
    if (inPoly([p.cd17, p.cd18, p.cd24])) {
      height.push({
        val: hakodateTransTriHeight(g, p.cd19, p.cd18, p.cd27, p.cd26, latLng, h2, NAHA_PITCH, pitchT),
        str: "転移表面",
      });
    }
    if (inPoly([p.cd20, p.cd21, p.cd25])) {
      height.push({
        val: hakodateTransTriHeight(g, p.cd19, p.cd20, p.cd27, p.cd28, latLng, h2, NAHA_PITCH, pitchT),
        str: "転移表面",
      });
    }
  };

  pushRunway(nAha, NAHA_HEIGHT_A_1, NAHA_HEIGHT_A_2, NAHA_LENGTH_A, NAHA_WIDTH_A);
  pushRunway(nBha, NAHA_HEIGHT_B_1, NAHA_HEIGHT_B_2, NAHA_LENGTH_B, NAHA_WIDTH_B);

  const inApproach =
    inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14]) ||
    inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26]) ||
    inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14]) ||
    inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26]);
  const inExtended =
    inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) ||
    inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
    inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) ||
    inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29]);

  if (!inApproach && distance > 0 && distance <= NAHA_HORIZ_RADIUS) {
    height.push({
      val: NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  const inConical =
    inPoly(nahaConicalCutPath) && distance > NAHA_HORIZ_RADIUS;
  if (!inApproach && !inExtended && inConical) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, NAHA_HORIZ_RADIUS),
      NAHA_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(nahaOuterCutPath)) {
    height.push({
      val: NAHA_REF_HEIGHT + NAHA_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  let name = picked.name;
  if (inConical && !inApproach && name === "外側水平表面") {
    name = "円錐表面";
  }
  const st = STR_TO_SURFACE[name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 那覇空港の高さ制限を計算する。
 * 公式 GetCirclePaths（CD16 中心、CDA〜CDH）の切り欠きを円錐・外側水平に使う。
 */
export function calculateNahaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NAHA_REFERENCE_POINT.lat, NAHA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcNahaSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "naha",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
