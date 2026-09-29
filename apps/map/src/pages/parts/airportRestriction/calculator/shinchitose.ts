import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/shinchitose";
import {
  runwayA as scA,
  runwayB as scB,
  SHINCHITOSE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as SHINCHITOSE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as SHINCHITOSE_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as SHINCHITOSE_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as SHINCHITOSE_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as SHINCHITOSE_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as SHINCHITOSE_PITCH_A,
  PITCH_OF_TRANSITIONAL_SURFACE as SHINCHITOSE_PITCH_TRANS,
  LENGTH_OF_LANDING_AREA_B as SHINCHITOSE_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SHINCHITOSE_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SHINCHITOSE_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SHINCHITOSE_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SHINCHITOSE_PITCH_B,
} from "../data/shinchitose";
import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsDivision,
  decimalsMultiplication,
  decimalsSubstract,
  isPointInPolygon,
} from "./shared";
import type { HeightEntry } from "./shared";

/** 公式 ApproachSurface.getLimitHeightOfApproachSurface */
function kixApproachHeight(
  g: typeof google.maps,
  landingCenter: Coord,
  approachCenter: Coord,
  clickP: google.maps.LatLng,
  runwayHeight: number,
  pitch: number
): number {
  const landing = new g.LatLng(landingCenter.lat, landingCenter.lng);
  const approach = new g.LatLng(approachCenter.lat, approachCenter.lng);
  const heading1 = g.geometry!.spherical.computeHeading(landing, approach);
  const heading2 = g.geometry!.spherical.computeHeading(landing, clickP);
  const degree = Math.abs(decimalsSubstract(heading1, heading2));
  const radian = decimalsMultiplication(degree, decimalsDivision(Math.PI, 180));
  const hypotenuse = g.geometry!.spherical.computeDistanceBetween(landing, clickP);
  const adjacent = decimalsMultiplication(hypotenuse, Math.abs(Math.cos(radian)));
  const addHeight = decimalsMultiplication(adjacent, pitch);
  return decimalsAddition(runwayHeight, addHeight);
}

/**
 * 公式 TransitionalSurface.getLimitHeightOfQuadrangleArea
 * origin は着陸帯の南側中心（center2 / 低い方）。
 */
function kixTransQuadHeight(
  g: typeof google.maps,
  centerNorth: Coord,
  centerSouth: Coord,
  heightNorth: number,
  heightSouth: number,
  clickP: google.maps.LatLng,
  landingLength: number,
  landingWidth: number,
  pitch: number
): number {
  const north = new g.LatLng(centerNorth.lat, centerNorth.lng);
  const south = new g.LatLng(centerSouth.lat, centerSouth.lng);
  let heading1 = g.geometry!.spherical.computeHeading(south, north);
  if (heading1 < 0) heading1 += 180;
  let heading2 = g.geometry!.spherical.computeHeading(south, clickP);
  if (heading2 < 0) heading2 += 180;
  const degree = Math.abs(decimalsSubstract(heading1, heading2));
  const radian = decimalsMultiplication(degree, decimalsDivision(Math.PI, 180));
  const hypotenuse = g.geometry!.spherical.computeDistanceBetween(south, clickP);
  const opposite = decimalsMultiplication(hypotenuse, Math.abs(Math.sin(radian)));
  const adjacent = decimalsMultiplication(hypotenuse, Math.abs(Math.cos(radian)));
  const diffHeight = heightNorth - heightSouth;
  const ratio = decimalsDivision(adjacent, landingLength);
  const addHeight = decimalsMultiplication(diffHeight, ratio);
  const edgeHeight = decimalsAddition(heightSouth, addHeight);
  const fromEdge = decimalsSubstract(opposite, decimalsDivision(landingWidth, 2));
  const addFromEdge = decimalsMultiplication(fromEdge, pitch);
  return decimalsAddition(edgeHeight, addFromEdge);
}

/** 公式 TransitionalSurface.getLimitHeightOfTriangleArea */
function kixTransTriHeight(
  g: typeof google.maps,
  landingCenter: Coord,
  landingVertex: Coord,
  approachCenter: Coord,
  approachVertex: Coord,
  clickP: google.maps.LatLng,
  approachAreaHeight: number,
  pitchApproach: number,
  pitchTransition: number
): number {
  const approachEdgeHeight = kixApproachHeight(
    g,
    landingCenter,
    approachCenter,
    clickP,
    approachAreaHeight,
    pitchApproach
  );
  const landingAreaCenter = {
    x: Number(landingCenter.lng.toFixed(8)),
    y: Number(landingCenter.lat.toFixed(8)),
  };
  const landingAreaVertex = {
    x: Number(landingVertex.lng.toFixed(8)),
    y: Number(landingVertex.lat.toFixed(8)),
  };
  const approachSurfaceVertex = {
    x: Number(approachVertex.lng.toFixed(8)),
    y: Number(approachVertex.lat.toFixed(8)),
  };
  const clickPoint = {
    x: Number(clickP.lng().toFixed(8)),
    y: Number(clickP.lat().toFixed(8)),
  };
  const parallelSlope = decimalsDivision(
    decimalsSubstract(landingAreaCenter.y, landingAreaVertex.y),
    decimalsSubstract(landingAreaCenter.x, landingAreaVertex.x)
  );
  const parallelIntercept = decimalsAddition(
    decimalsMultiplication(decimalsMultiplication(parallelSlope, clickPoint.x), -1),
    clickPoint.y
  );
  const approachSlope = decimalsDivision(
    decimalsSubstract(approachSurfaceVertex.y, landingAreaVertex.y),
    decimalsSubstract(approachSurfaceVertex.x, landingAreaVertex.x)
  );
  const approachIntercept = decimalsAddition(
    decimalsMultiplication(decimalsMultiplication(approachSlope, landingAreaVertex.x), -1),
    landingAreaVertex.y
  );
  const crossX = decimalsDivision(
    decimalsSubstract(approachIntercept, parallelIntercept),
    decimalsSubstract(parallelSlope, approachSlope)
  );
  const crossY = decimalsAddition(decimalsMultiplication(parallelSlope, crossX), parallelIntercept);
  const distanceFromApproachEdge = g.geometry!.spherical.computeDistanceBetween(
    clickP,
    new g.LatLng(crossY, crossX)
  );
  const addFromEdge = decimalsMultiplication(distanceFromApproachEdge, pitchTransition);
  return decimalsAddition(approachEdgeHeight, addFromEdge);
}

function isShinchitosePointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 新千歳: 公式 map.bundle.js と同じ進入・転移・水平の判定 */
function calcShinchitoseHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  includeHorizontal: boolean
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = SHINCHITOSE_REF_HEIGHT + SHINCHITOSE_HORIZ_HEIGHT;
  const pitchT = SHINCHITOSE_PITCH_TRANS;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isShinchitosePointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([scA.cd12, scA.cd14, scA.cd20, scA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([scA.cd12, scA.cd04, scA.cd06, scA.cd14])) {
    height.push({
      val: kixApproachHeight(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd18, scA.cd20, scA.cd28, scA.cd26])) {
    height.push({
      val: kixApproachHeight(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd11, scA.cd12, scA.cd18, scA.cd17])) {
    height.push({
      val: kixTransQuadHeight(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd14, scA.cd15, scA.cd21, scA.cd20])) {
    height.push({
      val: kixTransQuadHeight(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd07, scA.cd12, scA.cd11])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scA.cd13,
        scA.cd12,
        scA.cd05,
        scA.cd04,
        latLng,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd08, scA.cd15, scA.cd14])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scA.cd13,
        scA.cd14,
        scA.cd05,
        scA.cd06,
        latLng,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd17, scA.cd18, scA.cd24])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scA.cd19,
        scA.cd18,
        scA.cd27,
        scA.cd26,
        latLng,
        SHINCHITOSE_HEIGHT_A_2,
        SHINCHITOSE_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd20, scA.cd21, scA.cd25])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scA.cd19,
        scA.cd20,
        scA.cd27,
        scA.cd28,
        latLng,
        SHINCHITOSE_HEIGHT_A_2,
        SHINCHITOSE_PITCH_A,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([scB.cd12, scB.cd14, scB.cd20, scB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([scB.cd12, scB.cd04, scB.cd06, scB.cd14])) {
    height.push({
      val: kixApproachHeight(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd18, scB.cd20, scB.cd28, scB.cd26])) {
    height.push({
      val: kixApproachHeight(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd11, scB.cd12, scB.cd18, scB.cd17])) {
    height.push({
      val: kixTransQuadHeight(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd14, scB.cd15, scB.cd21, scB.cd20])) {
    height.push({
      val: kixTransQuadHeight(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd07, scB.cd12, scB.cd11])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scB.cd13,
        scB.cd12,
        scB.cd05,
        scB.cd04,
        latLng,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd08, scB.cd15, scB.cd14])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scB.cd13,
        scB.cd14,
        scB.cd05,
        scB.cd06,
        latLng,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd17, scB.cd18, scB.cd24])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scB.cd19,
        scB.cd18,
        scB.cd27,
        scB.cd26,
        latLng,
        SHINCHITOSE_HEIGHT_B_2,
        SHINCHITOSE_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd20, scB.cd21, scB.cd25])) {
    height.push({
      val: kixTransTriHeight(
        g,
        scB.cd19,
        scB.cd20,
        scB.cd27,
        scB.cd28,
        latLng,
        SHINCHITOSE_HEIGHT_B_2,
        SHINCHITOSE_PITCH_B,
        pitchT
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // 公式は水平円の isContain のみ。進入ポリゴン内でも円の外なら水平は載せない
  if (includeHorizontal) {
    height.push({ val: horizHeight, str: hSuiheiStr });
  }
  if (height.length === 0) {
    return null;
  }
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    inPoly([scA.cd12, scA.cd04, scA.cd06, scA.cd14]) ||
    inPoly([scA.cd18, scA.cd20, scA.cd28, scA.cd26]) ||
    inPoly([scB.cd12, scB.cd04, scB.cd06, scB.cd14]) ||
    inPoly([scB.cd18, scB.cd20, scB.cd28, scB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([scA.cd12, scA.cd14, scA.cd20, scA.cd18]) ||
    inPoly([scB.cd12, scB.cd14, scB.cd20, scB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 新千歳空港の高さ制限を計算する。
 * 公式どおり進入・転移は水平円（4000m）の外側でも判定する。
 */
export function calculateShinchitoseRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(SHINCHITOSE_REFERENCE_POINT.lat, SHINCHITOSE_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcShinchitoseHorizontalSurface(
      g,
      point,
      lat,
      lng,
      distance <= SHINCHITOSE_HORIZ_RADIUS
    );
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "shinchitose",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}
