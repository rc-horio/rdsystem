import type { SurfaceType } from "./types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "./types";
import {
  HANEDA_REFERENCE_POINT,
  OUTER_HORIZONTAL_SURFACE_RADIUS_M,
} from "./data/haneda";
import { calculateHanedaRestriction } from "./calculator/haneda";
export { calculateHanedaRestriction };

import type { Coord } from "./data/haneda";
import {
  NARITA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_RADIUS,
} from "./data/narita";
import { calculateNaritaRestriction } from "./calculator/narita";
export { calculateNaritaRestriction };

import {
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_RADIUS,
} from "./data/kansai";
import { calculateKansaiRestriction } from "./calculator/kansai";
export { calculateKansaiRestriction };

import {
  surfacePointsA as nAha,
  surfacePointsB as nBha,
  conicalCutPath as nahaConicalCutPath,
  outerCutPath as nahaOuterCutPath,
  NAHA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAHA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_HEIGHT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_RADIUS,
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
} from "./data/naha";
import {
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_RADIUS,
} from "./data/fukuoka";
import { calculateFukuokaRestriction } from "./calculator/fukuoka";
export { calculateFukuokaRestriction };

import {
  MATSUYAMA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_RADIUS,
} from "./data/matsuyama";
import { calculateMatsuyamaRestriction } from "./calculator/matsuyama";
export { calculateMatsuyamaRestriction };

import {
  SENDAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_RADIUS,
} from "./data/sendai";
import { calculateSendaiRestriction } from "./calculator/sendai";
export { calculateSendaiRestriction };

import {
  runwayA as yA,
  runwayB as yB,
  YAO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as YAO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as YAO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as YAO_HORIZ_HEIGHT,
  YAO_SURFACE_EXTENT_M,
  LENGTH_OF_LANDING_AREA_A as YAO_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as YAO_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as YAO_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as YAO_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as YAO_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as YAO_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as YAO_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as YAO_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as YAO_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as YAO_PITCH_B,
} from "./data/yao";
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
  SHINCHITOSE_SURFACE_EXTENT_M,
  LENGTH_OF_LANDING_AREA_B as SHINCHITOSE_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SHINCHITOSE_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SHINCHITOSE_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SHINCHITOSE_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SHINCHITOSE_PITCH_B,
} from "./data/shinchitose";
import {
  surfacePoints as hM,
  conicalCutPath as hakodateConicalCutPath,
  outerCutPath as hakodateOuterCutPath,
  HAKODATE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as HAKODATE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_HEIGHT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as HAKODATE_LENGTH,
  WIDTH_OF_LANDING_AREA as HAKODATE_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as HAKODATE_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as HAKODATE_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as HAKODATE_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as HAKODATE_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as HAKODATE_PITCH_CONICAL,
} from "./data/hakodate";
import {
  surfacePoints as mzM,
  conicalCutPath as miyazakiConicalCutPath,
  outerCutPath as miyazakiOuterCutPath,
  MIYAZAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MIYAZAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_HEIGHT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MIYAZAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as MIYAZAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MIYAZAKI_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MIYAZAKI_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as MIYAZAKI_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as MIYAZAKI_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as MIYAZAKI_PITCH_CONICAL,
} from "./data/miyazaki";
import {
  ITAMI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_RADIUS,
} from "./data/itami";
import { calculateItamiRestriction } from "./calculator/itami";
export { calculateItamiRestriction };

import {
  runwayA as ngA,
  runwayB as ngB,
  NIIGATA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NIIGATA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_HEIGHT,
  NIIGATA_SURFACE_EXTENT_M,
  LENGTH_OF_LANDING_AREA_A as NIIGATA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as NIIGATA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as NIIGATA_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as NIIGATA_HEIGHT_A_2,
  PITCH_OF_APPROACH_A as NIIGATA_PITCH_A,
  LENGTH_OF_LANDING_AREA_B as NIIGATA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as NIIGATA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as NIIGATA_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as NIIGATA_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as NIIGATA_PITCH_B,
} from "./data/niigata";
import {
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_RADIUS,
} from "./data/centrair";
import { calculateCentrairRestriction } from "./calculator/centrair";
export { calculateCentrairRestriction };

import {
  mp as ngsMp,
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_HEIGHT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as NAGASAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as NAGASAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_N as NAGASAKI_HEIGHT_N,
  HEIGHT_OF_LANDING_AREA_S as NAGASAKI_HEIGHT_S,
  landingKiE as ngsLandingKiE,
  landingKiN as ngsLandingKiN,
  landingKiS as ngsLandingKiS,
} from "./data/nagasaki";
import {
  surfacePoints as kmPoints,
  conicalCutPath as kumamotoConicalCutPath,
  outerCutPath as kumamotoOuterCutPath,
  KUMAMOTO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KUMAMOTO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_HEIGHT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as KUMAMOTO_LENGTH,
  WIDTH_OF_LANDING_AREA as KUMAMOTO_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as KUMAMOTO_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as KUMAMOTO_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as KUMAMOTO_PITCH,
  PITCH_OF_TRANSITIONAL_SURFACE as KUMAMOTO_PITCH_TRANS,
  PITCH_OF_CONICAL_SURFACE as KUMAMOTO_PITCH_CONICAL,
} from "./data/kumamoto";

import {
  STR_TO_SURFACE,
  mathSinnyu,
  mathSinnyuWithPitch,
  mathTennia,
  mathTennib,
  decimalsAddition,
  decimalsSubstract,
  decimalsMultiplication,
  decimalsDivision,
  hakodateApproachHeight,
  hakodateTransQuadHeight,
  hakodateTransTriHeight,
  mathTennibHei,
  chkInclusion,
  isPointInPolygon,
  pickSendaiSurfaceName,
} from "./calculator/shared";
import type { HeightEntry } from "./calculator/shared";

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

/** 八尾: ポリゴン内に点が含まれるか */
function isYaoPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 八尾: 進入・転移は水平円の外側でも判定する */
function calcYaoHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  includeHorizontal: boolean
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = YAO_REF_HEIGHT + YAO_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isYaoPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([yA.cd12, yA.cd14, yA.cd20, yA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([yA.cd12, yA.cd04, yA.cd06, yA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yA.cd18, yA.cd20, yA.cd28, yA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yA.cd11, yA.cd12, yA.cd18, yA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        yA.cd13,
        yA.cd19,
        YAO_HEIGHT_A_1,
        YAO_HEIGHT_A_2,
        latLng,
        YAO_LENGTH_A,
        YAO_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd14, yA.cd15, yA.cd21, yA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        yA.cd13,
        yA.cd19,
        YAO_HEIGHT_A_1,
        YAO_HEIGHT_A_2,
        latLng,
        YAO_LENGTH_A,
        YAO_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd07, yA.cd12, yA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd13, yA.cd05, yA.cd12, yA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd08, yA.cd15, yA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd13, yA.cd05, latLng, YAO_HEIGHT_A_1, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd13, yA.cd05, yA.cd14, yA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd17, yA.cd18, yA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd19, yA.cd27, yA.cd18, yA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yA.cd20, yA.cd21, yA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, yA.cd19, yA.cd27, latLng, YAO_HEIGHT_A_2, YAO_PITCH_A);
    height.push({
      val: mathTennib(g, yA.cd19, yA.cd27, yA.cd20, yA.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([yB.cd12, yB.cd14, yB.cd20, yB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([yB.cd12, yB.cd04, yB.cd06, yB.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yB.cd18, yB.cd20, yB.cd28, yB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([yB.cd11, yB.cd12, yB.cd18, yB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        yB.cd13,
        yB.cd19,
        YAO_HEIGHT_B_1,
        YAO_HEIGHT_B_2,
        latLng,
        YAO_LENGTH_B,
        YAO_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd14, yB.cd15, yB.cd21, yB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        yB.cd13,
        yB.cd19,
        YAO_HEIGHT_B_1,
        YAO_HEIGHT_B_2,
        latLng,
        YAO_LENGTH_B,
        YAO_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd07, yB.cd12, yB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd13, yB.cd05, yB.cd12, yB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd08, yB.cd15, yB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd13, yB.cd05, latLng, YAO_HEIGHT_B_1, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd13, yB.cd05, yB.cd14, yB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd17, yB.cd18, yB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd19, yB.cd27, yB.cd18, yB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([yB.cd20, yB.cd21, yB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, yB.cd19, yB.cd27, latLng, YAO_HEIGHT_B_2, YAO_PITCH_B);
    height.push({
      val: mathTennib(g, yB.cd19, yB.cd27, yB.cd20, yB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

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
    inPoly([yA.cd12, yA.cd04, yA.cd06, yA.cd14]) ||
    inPoly([yA.cd18, yA.cd20, yA.cd28, yA.cd26]) ||
    inPoly([yB.cd12, yB.cd04, yB.cd06, yB.cd14]) ||
    inPoly([yB.cd18, yB.cd20, yB.cd28, yB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([yA.cd12, yA.cd14, yA.cd20, yA.cd18]) ||
    inPoly([yB.cd12, yB.cd14, yB.cd20, yB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 八尾空港の高さ制限を計算する
 * 八尾は水平表面のみ（半径2000m）。円錐・外側水平表面なし。
 */
export function calculateYaoRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(YAO_REFERENCE_POINT.lat, YAO_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcYaoHorizontalSurface(
      g,
      point,
      lat,
      lng,
      distance <= YAO_HORIZ_RADIUS
    );
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "yao",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
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

function isHakodatePointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 函館: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 円錐は切り欠き内かつ 4000m 超、外側水平は切り欠き内。水平は 4000m 以内の円のみ。
 */
function calcHakodateSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);
  const pitchT = HAKODATE_PITCH_TRANS;

  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: hakodateApproachHeight(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([hM.cd11, hM.cd12, hM.cd18, hM.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd14, hM.cd15, hM.cd21, hM.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd07, hM.cd12, hM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd13,
        hM.cd12,
        hM.cd05,
        hM.cd04,
        latLng,
        HAKODATE_HEIGHT_1,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd08, hM.cd15, hM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd13,
        hM.cd14,
        hM.cd05,
        hM.cd06,
        latLng,
        HAKODATE_HEIGHT_1,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd17, hM.cd18, hM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd19,
        hM.cd18,
        hM.cd27,
        hM.cd26,
        latLng,
        HAKODATE_HEIGHT_2,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([hM.cd20, hM.cd21, hM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        hM.cd19,
        hM.cd20,
        hM.cd27,
        hM.cd28,
        latLng,
        HAKODATE_HEIGHT_2,
        HAKODATE_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (distance <= HAKODATE_HORIZ_RADIUS) {
    height.push({
      val: HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (inPoly(hakodateConicalCutPath) && distance > HAKODATE_HORIZ_RADIUS) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, HAKODATE_HORIZ_RADIUS),
      HAKODATE_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(hakodateOuterCutPath)) {
    height.push({
      val: HAKODATE_REF_HEIGHT + HAKODATE_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) ||
    inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])
  ) {
    reStr = "進入表面";
  }
  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 函館空港の高さ制限を計算する。
 * 公式 GetCirclePaths(CDA〜CDE) の切り欠きを円錐・外側水平に使う。
 */
export function calculateHakodateRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(HAKODATE_REFERENCE_POINT.lat, HAKODATE_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcHakodateSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "hakodate",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

function isMiyazakiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/**
 * 宮崎: 公式どおり進入・転移・延長は距離帯に関係なくポリゴン判定。
 * 進入内では水平を除外、延長進入内では円錐を除外（公式 ClickSurface の continue）。
 * 円錐は GetCirclePaths1 切り欠き内かつ 3500m 超。外側水平は GetCirclePaths2 切り欠き内。
 */
function calcMiyazakiSurfaces(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);
  const pitchT = MIYAZAKI_PITCH_TRANS;

  const inLanding = inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18]);
  const inApproachW = inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]);
  const inApproachE = inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26]);
  const inExtE = inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29]);
  const inApproach = inApproachW || inApproachE;

  if (inLanding) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inApproachW) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inApproachE) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inExtE) {
    height.push({
      val: hakodateApproachHeight(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([mzM.cd11, mzM.cd12, mzM.cd18, mzM.cd17])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd14, mzM.cd15, mzM.cd21, mzM.cd20])) {
    height.push({
      val: hakodateTransQuadHeight(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd07, mzM.cd12, mzM.cd11])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd13,
        mzM.cd12,
        mzM.cd05,
        mzM.cd04,
        latLng,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd08, mzM.cd15, mzM.cd14])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd13,
        mzM.cd14,
        mzM.cd05,
        mzM.cd06,
        latLng,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd17, mzM.cd18, mzM.cd24])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd19,
        mzM.cd18,
        mzM.cd27,
        mzM.cd26,
        latLng,
        MIYAZAKI_HEIGHT_2,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }
  if (inPoly([mzM.cd20, mzM.cd21, mzM.cd25])) {
    height.push({
      val: hakodateTransTriHeight(
        g,
        mzM.cd19,
        mzM.cd20,
        mzM.cd27,
        mzM.cd28,
        latLng,
        MIYAZAKI_HEIGHT_2,
        MIYAZAKI_PITCH,
        pitchT
      ),
      str: "転移表面",
    });
  }

  if (!inApproach && distance > 0 && distance <= MIYAZAKI_HORIZ_RADIUS) {
    height.push({
      val: MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT,
      str: "水平表面",
    });
  }

  if (
    !inExtE &&
    inPoly(miyazakiConicalCutPath) &&
    distance > MIYAZAKI_HORIZ_RADIUS
  ) {
    const addHeight = decimalsMultiplication(
      decimalsSubstract(distance, MIYAZAKI_HORIZ_RADIUS),
      MIYAZAKI_PITCH_CONICAL
    );
    height.push({
      val: decimalsAddition(MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT, addHeight),
      str: "円錐表面",
    });
  }

  if (inPoly(miyazakiOuterCutPath)) {
    height.push({
      val: MIYAZAKI_REF_HEIGHT + MIYAZAKI_OUTER_HEIGHT,
      str: "外側水平表面",
    });
  }

  if (height.length === 0) return null;

  const picked = pickSendaiSurfaceName(height);
  const st = STR_TO_SURFACE[picked.name];
  return st ? { surfaceType: st, heightM: picked.heightM } : null;
}

/**
 * 宮崎空港の高さ制限を計算する。
 * 公式 GetCirclePaths1（円錐）/ GetCirclePaths2（外側、CDB1〜CDB17）の切り欠きを使う。
 */
export function calculateMiyazakiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(MIYAZAKI_REFERENCE_POINT.lat, MIYAZAKI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcMiyazakiSurfaces(g, point, lat, lng, distance);
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "miyazaki",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

function isNiigataPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 新潟: 進入・転移は水平円の外側でも判定する */
function calcNiigataHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number,
  includeHorizontal: boolean
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = NIIGATA_REF_HEIGHT + NIIGATA_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isNiigataPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([ngA.cd12, ngA.cd14, ngA.cd20, ngA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([ngA.cd12, ngA.cd04, ngA.cd06, ngA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngA.cd18, ngA.cd20, ngA.cd28, ngA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngA.cd11, ngA.cd12, ngA.cd18, ngA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        ngA.cd13,
        ngA.cd19,
        NIIGATA_HEIGHT_A_1,
        NIIGATA_HEIGHT_A_2,
        latLng,
        NIIGATA_LENGTH_A,
        NIIGATA_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd14, ngA.cd15, ngA.cd21, ngA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        ngA.cd13,
        ngA.cd19,
        NIIGATA_HEIGHT_A_1,
        NIIGATA_HEIGHT_A_2,
        latLng,
        NIIGATA_LENGTH_A,
        NIIGATA_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd07, ngA.cd12, ngA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd13, ngA.cd05, ngA.cd12, ngA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd08, ngA.cd15, ngA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd13, ngA.cd05, latLng, NIIGATA_HEIGHT_A_1, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd13, ngA.cd05, ngA.cd14, ngA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd17, ngA.cd18, ngA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd19, ngA.cd27, ngA.cd18, ngA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngA.cd20, ngA.cd21, ngA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, ngA.cd19, ngA.cd27, latLng, NIIGATA_HEIGHT_A_2, NIIGATA_PITCH_A);
    height.push({
      val: mathTennib(g, ngA.cd19, ngA.cd27, ngA.cd20, ngA.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([ngB.cd12, ngB.cd14, ngB.cd20, ngB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([ngB.cd12, ngB.cd04, ngB.cd06, ngB.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngB.cd18, ngB.cd20, ngB.cd28, ngB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([ngB.cd11, ngB.cd12, ngB.cd18, ngB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        ngB.cd19,
        ngB.cd13,
        NIIGATA_HEIGHT_B_2,
        NIIGATA_HEIGHT_B_1,
        latLng,
        NIIGATA_LENGTH_B,
        NIIGATA_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd14, ngB.cd15, ngB.cd21, ngB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        ngB.cd19,
        ngB.cd13,
        NIIGATA_HEIGHT_B_2,
        NIIGATA_HEIGHT_B_1,
        latLng,
        NIIGATA_LENGTH_B,
        NIIGATA_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd07, ngB.cd12, ngB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd13, ngB.cd05, ngB.cd12, ngB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd08, ngB.cd15, ngB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd13, ngB.cd05, latLng, NIIGATA_HEIGHT_B_1, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd13, ngB.cd05, ngB.cd14, ngB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd17, ngB.cd18, ngB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd19, ngB.cd27, ngB.cd18, ngB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([ngB.cd20, ngB.cd21, ngB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, ngB.cd19, ngB.cd27, latLng, NIIGATA_HEIGHT_B_2, NIIGATA_PITCH_B);
    height.push({
      val: mathTennib(g, ngB.cd19, ngB.cd27, ngB.cd20, ngB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

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
    inPoly([ngA.cd12, ngA.cd04, ngA.cd06, ngA.cd14]) ||
    inPoly([ngA.cd18, ngA.cd20, ngA.cd28, ngA.cd26]) ||
    inPoly([ngB.cd12, ngB.cd04, ngB.cd06, ngB.cd14]) ||
    inPoly([ngB.cd18, ngB.cd20, ngB.cd28, ngB.cd26])
  ) {
    reStr = "進入表面";
  }
  if (
    inPoly([ngA.cd12, ngA.cd14, ngA.cd20, ngA.cd18]) ||
    inPoly([ngB.cd12, ngB.cd14, ngB.cd20, ngB.cd18])
  ) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 新潟空港の高さ制限を計算する
 * 新潟は水平表面のみ（半径3500m）。円錐・外側水平表面なし。
 */
export function calculateNiigataRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NIIGATA_REFERENCE_POINT.lat, NIIGATA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    const result = calcNiigataHorizontalSurface(
      g,
      point,
      lat,
      lng,
      distance <= NIIGATA_HORIZ_RADIUS
    );
    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "niigata",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

/**
 * 長崎公式 math_tennia。hm の補間に底辺 teihen ではなく斜辺 shahen を使う。
 * mathTennia / hakodateTransQuadHeight とは別式。
 */
function nagasakiTransQuadHeight(
  g: typeof google.maps,
  np: Coord,
  sp: Coord,
  nh: number,
  sh: number,
  cp: google.maps.LatLng,
  ta: number,
  hb: number
): number {
  const npLatLng = new g.LatLng(np.lat, np.lng);
  const spLatLng = new g.LatLng(sp.lat, sp.lng);
  const d1 = g.geometry!.spherical.computeHeading(npLatLng, spLatLng);
  let d2 = g.geometry!.spherical.computeHeading(npLatLng, cp);
  if (d2 < 0) d2 += 180;
  const kakudo = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(npLatLng, cp);
  const takasa = shahen * Math.sin((kakudo * Math.PI) / 180);
  const hm = nh + ((sh - nh) * shahen) / ta;
  const dm = takasa - hb / 2;
  return hm + dm * (1 / 7);
}

/** 長崎公式 math_ensui = 2.4 + (kyori - 4000) * (1/50) + 45 */
function mathEnsuiNagasaki(kyori: number): number {
  return 2.4 + (kyori - 4000) * (1 / 50) + 45;
}

function nagasakiEntryToResult(
  d: HeightEntry | null
): { surfaceType: SurfaceType; heightM: number } | null {
  if (!d) return null;
  const st = STR_TO_SURFACE[d.str];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 長崎: 水平表面（公式 s_surface_event。円 zIndex 104） */
function calcNagasakiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  let height: HeightEntry[] = [{ val: NAGASAKI_HORIZ_HEIGHT, str: "水平表面" }];

  if (chk(m.cd21, m.cd22, m.cd23) || chk(m.cd22, m.cd23, m.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height = [{ val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N), str: "進入表面" }];
  }
  if (chk(m.cd22, m.cd18, m.cd24) || chk(m.cd18, m.cd24, m.cd20)) {
    height.push({
      val: nagasakiTransQuadHeight(
        g,
        m.cd25,
        m.cd26,
        NAGASAKI_HEIGHT_N,
        NAGASAKI_HEIGHT_S,
        latLng,
        NAGASAKI_LENGTH,
        NAGASAKI_WIDTH
      ),
      str: "転移表面",
    });
  }
  if (chk(m.cd14, m.cd18, m.cd22)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd22, m.cd14, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
  }
  if (chk(m.cd20, m.cd24, m.cd16)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd24, m.cd16, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height = [{ val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S), str: "進入表面" }];
  }
  if (chk(m.cd21, m.cd17, m.cd23) || chk(m.cd17, m.cd23, m.cd19)) {
    height.push({
      val: nagasakiTransQuadHeight(
        g,
        m.cd25,
        m.cd26,
        NAGASAKI_HEIGHT_N,
        NAGASAKI_HEIGHT_S,
        latLng,
        NAGASAKI_LENGTH,
        NAGASAKI_WIDTH
      ),
      str: "転移表面",
    });
  }
  if (chk(m.cd13, m.cd21, m.cd17)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd21, m.cd13, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
  }
  if (chk(m.cd15, m.cd19, m.cd23)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd23, m.cd15, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  return nagasakiEntryToResult(height[0] ?? null);
}

/** 長崎: 円錐表面（公式 Kikkake_e_event。切り欠き landingKi_e） */
function calcNagasakiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  let height: HeightEntry[] = [{ val: mathEnsuiNagasaki(kyori), str: "円錐表面" }];

  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height = [{ val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N), str: "進入表面" }];
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height = [{ val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S), str: "進入表面" }];
  }
  if (chk(m.cd3, m.cd4, m.cd9) || chk(m.cd4, m.cd9, m.cd10)) {
    height = [{ val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S), str: "延長進入表面" }];
  }

  height.sort((a, b) => a.val - b.val);
  return nagasakiEntryToResult(height[0] ?? null);
}

/** 長崎: 外側水平表面・南（公式 Kikkake_s_event） */
function calcNagasakiOuterSouth(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);
  let height: HeightEntry[] = [{ val: NAGASAKI_OUTER_HEIGHT, str: "外側水平表面" }];
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    height = [{ val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S), str: "延長進入表面" }];
  }
  height.sort((a, b) => a.val - b.val);
  return nagasakiEntryToResult(height[0] ?? null);
}

/**
 * 長崎空港の高さ制限を計算する。
 * 公式は水平円・円錐切欠き・外側北/南のポリゴンクリックのみ応答する。
 * zIndex: 水平104 → 外側南103 → 円錐102 → 外側北101。
 */
export function calculateNagasakiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NAGASAKI_REFERENCE_POINT.lat, NAGASAKI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NAGASAKI_HORIZ_RADIUS) {
      result = calcNagasakiHorizontalSurface(g, point);
    } else if (isPointInPolygon(g, lat, lng, ngsLandingKiS)) {
      result = calcNagasakiOuterSouth(g, point);
    } else if (isPointInPolygon(g, lat, lng, ngsLandingKiE)) {
      result = calcNagasakiConicalSurface(g, point, distance);
    } else if (isPointInPolygon(g, lat, lng, ngsLandingKiN)) {
      result = { surfaceType: "outer_horizontal", heightM: NAGASAKI_OUTER_HEIGHT };
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "nagasaki",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

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

/**
 * クリック位置に応じて羽田・成田・関西・中部・福岡・松山・仙台・八尾・新千歳・函館・新潟・長崎・熊本・那覇の高さ制限を計算する
 * いずれの範囲外の場合は items が空
 */
export function calculateAirportRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  if (!gmaps?.geometry) {
    return { items: [], error: true };
  }
  const g = gmaps;
  const point = new g.LatLng(lat, lng);

  const hanedaRef = new g.LatLng(HANEDA_REFERENCE_POINT.lat, HANEDA_REFERENCE_POINT.lng);
  const naritaRef = new g.LatLng(NARITA_REFERENCE_POINT.lat, NARITA_REFERENCE_POINT.lng);
  const kansaiRef = new g.LatLng(KANSAI_REFERENCE_POINT.lat, KANSAI_REFERENCE_POINT.lng);
  const centrairRef = new g.LatLng(
    CENTRAIR_REFERENCE_POINT.lat,
    CENTRAIR_REFERENCE_POINT.lng
  );
  const fukuokaRef = new g.LatLng(FUKUOKA_REFERENCE_POINT.lat, FUKUOKA_REFERENCE_POINT.lng);
  const matsuyamaRef = new g.LatLng(MATSUYAMA_REFERENCE_POINT.lat, MATSUYAMA_REFERENCE_POINT.lng);
  const sendaiRef = new g.LatLng(SENDAI_REFERENCE_POINT.lat, SENDAI_REFERENCE_POINT.lng);
  const yaoRef = new g.LatLng(YAO_REFERENCE_POINT.lat, YAO_REFERENCE_POINT.lng);
  const shinchitoseRef = new g.LatLng(
    SHINCHITOSE_REFERENCE_POINT.lat,
    SHINCHITOSE_REFERENCE_POINT.lng
  );
  const hakodateRef = new g.LatLng(
    HAKODATE_REFERENCE_POINT.lat,
    HAKODATE_REFERENCE_POINT.lng
  );
  const niigataRef = new g.LatLng(
    NIIGATA_REFERENCE_POINT.lat,
    NIIGATA_REFERENCE_POINT.lng
  );
  const nagasakiRef = new g.LatLng(NAGASAKI_REFERENCE_POINT.lat, NAGASAKI_REFERENCE_POINT.lng);
  const kumamotoRef = new g.LatLng(
    KUMAMOTO_REFERENCE_POINT.lat,
    KUMAMOTO_REFERENCE_POINT.lng
  );
  const nahaRef = new g.LatLng(NAHA_REFERENCE_POINT.lat, NAHA_REFERENCE_POINT.lng);
  const miyazakiRef = new g.LatLng(
    MIYAZAKI_REFERENCE_POINT.lat,
    MIYAZAKI_REFERENCE_POINT.lng
  );
  const itamiRef = new g.LatLng(
    ITAMI_REFERENCE_POINT.lat,
    ITAMI_REFERENCE_POINT.lng
  );

  const distToHaneda = g.geometry.spherical.computeDistanceBetween(point, hanedaRef);
  const distToNarita = g.geometry.spherical.computeDistanceBetween(point, naritaRef);
  const distToKansai = g.geometry.spherical.computeDistanceBetween(point, kansaiRef);
  const distToCentrair = g.geometry.spherical.computeDistanceBetween(point, centrairRef);
  const distToFukuoka = g.geometry.spherical.computeDistanceBetween(point, fukuokaRef);
  const distToMatsuyama = g.geometry.spherical.computeDistanceBetween(point, matsuyamaRef);
  const distToSendai = g.geometry.spherical.computeDistanceBetween(point, sendaiRef);
  const distToYao = g.geometry.spherical.computeDistanceBetween(point, yaoRef);
  const distToShinchitose = g.geometry.spherical.computeDistanceBetween(point, shinchitoseRef);
  const distToHakodate = g.geometry.spherical.computeDistanceBetween(point, hakodateRef);
  const distToNiigata = g.geometry.spherical.computeDistanceBetween(point, niigataRef);
  const distToNagasaki = g.geometry.spherical.computeDistanceBetween(point, nagasakiRef);
  const distToKumamoto = g.geometry.spherical.computeDistanceBetween(point, kumamotoRef);
  const distToNaha = g.geometry.spherical.computeDistanceBetween(point, nahaRef);
  const distToMiyazaki = g.geometry.spherical.computeDistanceBetween(point, miyazakiRef);
  const distToItami = g.geometry.spherical.computeDistanceBetween(point, itamiRef);

  const HANEDA_OUTER = OUTER_HORIZONTAL_SURFACE_RADIUS_M;

  if (distToHaneda <= HANEDA_OUTER) {
    return calculateHanedaRestriction(lat, lng, gmaps);
  }
  if (distToNarita <= NARITA_OUTER_RADIUS) {
    return calculateNaritaRestriction(lat, lng, gmaps);
  }
  if (distToKansai <= KANSAI_OUTER_RADIUS) {
    const kansai = calculateKansaiRestriction(lat, lng, gmaps);
    if (kansai.error || kansai.items.length > 0) return kansai;
  }
  if (distToItami <= ITAMI_OUTER_RADIUS) {
    return calculateItamiRestriction(lat, lng, gmaps);
  }
  if (distToCentrair <= CENTRAIR_OUTER_RADIUS) {
    const centrair = calculateCentrairRestriction(lat, lng, gmaps);
    if (centrair.error || centrair.items.length > 0) return centrair;
  }
  if (distToFukuoka <= FUKUOKA_OUTER_RADIUS) {
    const fukuoka = calculateFukuokaRestriction(lat, lng, gmaps);
    if (fukuoka.error || fukuoka.items.length > 0) return fukuoka;
  }
  if (distToMatsuyama <= MATSUYAMA_OUTER_RADIUS) {
    const matsuyama = calculateMatsuyamaRestriction(lat, lng, gmaps);
    if (matsuyama.error || matsuyama.items.length > 0) return matsuyama;
  }
  if (distToSendai <= SENDAI_OUTER_RADIUS) {
    const sendai = calculateSendaiRestriction(lat, lng, gmaps);
    if (sendai.error || sendai.items.length > 0) return sendai;
  }
  if (distToYao <= YAO_SURFACE_EXTENT_M) {
    const yao = calculateYaoRestriction(lat, lng, gmaps);
    if (yao.error || yao.items.length > 0) return yao;
  }
  if (distToShinchitose <= SHINCHITOSE_SURFACE_EXTENT_M) {
    const shinchitose = calculateShinchitoseRestriction(lat, lng, gmaps);
    if (shinchitose.error || shinchitose.items.length > 0) return shinchitose;
  }
  if (distToHakodate <= HAKODATE_OUTER_RADIUS) {
    const hakodate = calculateHakodateRestriction(lat, lng, gmaps);
    if (hakodate.error || hakodate.items.length > 0) return hakodate;
  }
  if (distToNiigata <= NIIGATA_SURFACE_EXTENT_M) {
    const niigata = calculateNiigataRestriction(lat, lng, gmaps);
    if (niigata.error || niigata.items.length > 0) return niigata;
  }
  if (distToNagasaki <= NAGASAKI_OUTER_RADIUS) {
    const nagasaki = calculateNagasakiRestriction(lat, lng, gmaps);
    if (nagasaki.error || nagasaki.items.length > 0) return nagasaki;
  }
  if (distToKumamoto <= KUMAMOTO_OUTER_RADIUS) {
    const kumamoto = calculateKumamotoRestriction(lat, lng, gmaps);
    if (kumamoto.error || kumamoto.items.length > 0) return kumamoto;
  }
  if (distToNaha <= NAHA_OUTER_RADIUS) {
    const naha = calculateNahaRestriction(lat, lng, gmaps);
    if (naha.error || naha.items.length > 0) return naha;
  }
  if (distToMiyazaki <= MIYAZAKI_OUTER_RADIUS) {
    const miyazaki = calculateMiyazakiRestriction(lat, lng, gmaps);
    if (miyazaki.error || miyazaki.items.length > 0) return miyazaki;
  }
  return { items: [] };
}
