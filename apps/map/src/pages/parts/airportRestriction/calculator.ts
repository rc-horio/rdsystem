/**
 * 羽田空港 高さ制限計算ロジック
 * データソース: 羽田空港高さ制限回答システム map.js
 * https://secure.kix-ap.ne.jp/haneda-airport/
 */

import type { SurfaceType } from "./types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "./types";
import {
  mpA,
  mpB,
  mpC,
  mpD,
  HANEDA_REFERENCE_POINT,
  HORIZONTAL_SURFACE_RADIUS_M,
  HORIZONTAL_SURFACE_HEIGHT_M,
  CONICAL_SURFACE_RADIUS_M,
  CONICAL_SURFACE_MAX_HEIGHT_M,
  OUTER_HORIZONTAL_SURFACE_RADIUS_M,
  OUTER_HORIZONTAL_SURFACE_HEIGHT_M,
  landingKi,
  landingKi_s,
} from "./data/haneda";
import type { Coord } from "./data/haneda";
import {
  surfacePointsA as nA,
  surfacePointsC as nC,
  NARITA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NARITA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NARITA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NARITA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NARITA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A,
  WIDTH_OF_LANDING_AREA_A,
  HEIGHT_OF_LANDING_AREA_A_1,
  HEIGHT_OF_LANDING_AREA_A_2,
  LENGTH_OF_LANDING_AREA_C,
  WIDTH_OF_LANDING_AREA_C,
  HEIGHT_OF_LANDING_AREA_C_1,
  HEIGHT_OF_LANDING_AREA_C_2,
} from "./data/narita";
import {
  surfacePointsA as kA,
  surfacePointsB as kB,
  KANSAI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KANSAI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KANSAI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KANSAI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as KANSAI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as KANSAI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as KANSAI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_1 as KANSAI_HEIGHT_A_1,
  HEIGHT_OF_LANDING_AREA_A_2 as KANSAI_HEIGHT_A_2,
  LENGTH_OF_LANDING_AREA_B as KANSAI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as KANSAI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as KANSAI_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as KANSAI_HEIGHT_B_2,
} from "./data/kansai";
import {
  surfacePointsA as nAha,
  surfacePointsB as nBha,
  NAHA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAHA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAHA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NAHA_CONICAL_RADIUS,
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
} from "./data/naha";
import {
  mpA as fA,
  mpB as fB,
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as FUKUOKA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as FUKUOKA_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as FUKUOKA_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_N as FUKUOKA_HEIGHT_A_N,
  HEIGHT_OF_LANDING_AREA_A_S as FUKUOKA_HEIGHT_A_S,
  LENGTH_OF_LANDING_AREA_B as FUKUOKA_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as FUKUOKA_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_N as FUKUOKA_HEIGHT_B_N,
  HEIGHT_OF_LANDING_AREA_B_S as FUKUOKA_HEIGHT_B_S,
  landingKiE,
  landingKiN,
} from "./data/fukuoka";
import {
  surfacePoints as mM,
  MATSUYAMA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MATSUYAMA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as MATSUYAMA_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MATSUYAMA_LENGTH,
  WIDTH_OF_LANDING_AREA as MATSUYAMA_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MATSUYAMA_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MATSUYAMA_HEIGHT_2,
} from "./data/matsuyama";
import {
  runwayA as sA,
  runwayB as sB,
  SENDAI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as SENDAI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as SENDAI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_RADIUS,
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
} from "./data/sendai";
import {
  runwayA as yA,
  runwayB as yB,
  YAO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as YAO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as YAO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as YAO_HORIZ_HEIGHT,
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
  LENGTH_OF_LANDING_AREA_B as SHINCHITOSE_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as SHINCHITOSE_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_1 as SHINCHITOSE_HEIGHT_B_1,
  HEIGHT_OF_LANDING_AREA_B_2 as SHINCHITOSE_HEIGHT_B_2,
  PITCH_OF_APPROACH_B as SHINCHITOSE_PITCH_B,
} from "./data/shinchitose";
import {
  surfacePoints as hM,
  HAKODATE_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as HAKODATE_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as HAKODATE_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as HAKODATE_LENGTH,
  WIDTH_OF_LANDING_AREA as HAKODATE_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as HAKODATE_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as HAKODATE_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as HAKODATE_PITCH,
} from "./data/hakodate";
import {
  surfacePoints as mzM,
  MIYAZAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as MIYAZAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as MIYAZAKI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as MIYAZAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as MIYAZAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as MIYAZAKI_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as MIYAZAKI_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as MIYAZAKI_PITCH,
} from "./data/miyazaki";
import {
  mp as itMp,
  exmp as itExmp,
  ITAMI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as ITAMI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as ITAMI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as ITAMI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as ITAMI_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA_A as ITAMI_LENGTH_A,
  WIDTH_OF_LANDING_AREA_A as ITAMI_WIDTH_A,
  HEIGHT_OF_LANDING_AREA_A_N as ITAMI_HEIGHT_A_N,
  HEIGHT_OF_LANDING_AREA_A_S as ITAMI_HEIGHT_A_S,
  LENGTH_OF_LANDING_AREA_B as ITAMI_LENGTH_B,
  WIDTH_OF_LANDING_AREA_B as ITAMI_WIDTH_B,
  HEIGHT_OF_LANDING_AREA_B_N as ITAMI_HEIGHT_B_N,
  HEIGHT_OF_LANDING_AREA_B_S as ITAMI_HEIGHT_B_S,
  landingKi as itamiLandingKi,
  landingKi_s as itamiLandingKi_s,
  s_surface_s as itamiS_surface_s,
} from "./data/itami";
import {
  runwayA as ngA,
  runwayB as ngB,
  NIIGATA_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NIIGATA_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_HEIGHT,
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
  surfacePoints as cM,
  CENTRAIR_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as CENTRAIR_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as CENTRAIR_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as CENTRAIR_LENGTH,
  WIDTH_OF_LANDING_AREA as CENTRAIR_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as CENTRAIR_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as CENTRAIR_HEIGHT_2,
  PITCH_OF_APPROACH_SURFACE as CENTRAIR_PITCH,
} from "./data/centrair";
import {
  mp as ngsMp,
  NAGASAKI_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as NAGASAKI_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as NAGASAKI_CONICAL_RADIUS,
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
  KUMAMOTO_REFERENCE_POINT,
  HEIGHT_OF_AIRPORT_REFERENCE_POINT as KUMAMOTO_REF_HEIGHT,
  RADIUS_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ_HEIGHT,
  RADIUS_OF_CONICAL_SURFACE as KUMAMOTO_CONICAL_RADIUS,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_RADIUS,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as KUMAMOTO_LENGTH,
  WIDTH_OF_LANDING_AREA as KUMAMOTO_WIDTH,
  HEIGHT_OF_LANDING_AREA_1 as KUMAMOTO_HEIGHT_1,
  HEIGHT_OF_LANDING_AREA_2 as KUMAMOTO_HEIGHT_2,
} from "./data/kumamoto";

/** 表面タイプ文字列から SurfaceType へのマッピング */
const STR_TO_SURFACE: Record<string, SurfaceType> = {
  着陸帯: "landing_strip",
  進入表面: "approach",
  延長進入表面: "extended_approach",
  転移表面: "transition",
  水平表面: "horizontal",
  円錐表面: "conical",
  外側水平表面: "outer_horizontal",
};

/** 高さと表面タイプ文字列のペア */
interface HeightEntry {
  val: number;
  str: string;
}

/** 進入表面の高さ計算（math_sinnyu）勾配1/50 */
function mathSinnyu(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * (1 / 50);
}

/** 進入表面の高さ計算（math_sinnyu40）勾配1/40 */
function mathSinnyu40(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * (1 / 40);
}

/** 進入表面の高さ計算（勾配指定） */
function mathSinnyuWithPitch(
  g: typeof google.maps,
  chakP: Coord,
  sinnP: Coord,
  clickP: google.maps.LatLng,
  he: number,
  pitch: number
): number {
  const chakLatlng = new g.LatLng(chakP.lat, chakP.lng);
  const sinnLatlng = new g.LatLng(sinnP.lat, sinnP.lng);
  const d1 = g.geometry!.spherical.computeHeading(chakLatlng, sinnLatlng);
  const d2 = g.geometry!.spherical.computeHeading(chakLatlng, clickP);
  const d = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(chakLatlng, clickP);
  const teihen = shahen * Math.cos((d * Math.PI) / 180);
  return he + teihen * pitch;
}

/** 転移表面の計算(a)（math_tennia）
 * 公式: edgeHeight は滑走路中心線に沿った距離（底辺）で算出。斜辺ではない。
 */
function mathTennia(
  g: typeof google.maps,
  np: Coord,
  sp: Coord,
  nh: number,
  sh: number,
  cp: google.maps.LatLng,
  ta: number,
  hb: number
): number {
  const npLatlng = new g.LatLng(np.lat, np.lng);
  const spLatlng = new g.LatLng(sp.lat, sp.lng);
  let d1 = g.geometry!.spherical.computeHeading(npLatlng, spLatlng);
  let d2 = g.geometry!.spherical.computeHeading(npLatlng, cp);
  if (d2 < 0) d2 += 180;
  const kakudo = Math.abs(d1 - d2);
  const shahen = g.geometry!.spherical.computeDistanceBetween(npLatlng, cp);
  const takasa = shahen * Math.sin((kakudo * Math.PI) / 180);
  const teihen = shahen * Math.cos((kakudo * Math.PI) / 180);
  const hm = nh + ((sh - nh) * teihen) / ta;
  const dm = takasa - hb / 2;
  return hm + dm * (1 / 7);
}

/** 転移表面の計算(b)（math_tennib）
 * 公式: クリック点を通る、着陸帯短辺と平行な直線と、進入表面辺の交点までの距離を使用。
 * p1=landing_area_center, p2=landing_area_vertex, p3=landing_area_vertex, p4=approach_surface_vertex
 */
function mathTennib(
  g: typeof google.maps,
  p1: Coord,
  p2: Coord,
  p3: Coord,
  p4: Coord,
  cp: google.maps.LatLng,
  hm: number
): number {
  const p1y = p1.lat;
  const p1x = p1.lng;
  const p2y = p2.lat;
  const p2x = p2.lng;
  const p3y = p3.lat;
  const p3x = p3.lng;
  const p4y = p4.lat;
  const p4x = p4.lng;
  const p5y = Number(cp.lat().toFixed(8));
  const p5x = Number(cp.lng().toFixed(8));

  const parallelSlope = (p2y - p1y) / (p2x - p1x);
  const parallelIntercept = -(parallelSlope * p5x) + p5y;
  const approachSlope = (p4y - p3y) / (p4x - p3x);
  const approachIntercept = -(approachSlope * p3x) + p3y;
  const xc = (approachIntercept - parallelIntercept) / (parallelSlope - approachSlope);
  const yc = parallelSlope * xc + parallelIntercept;
  const dmP = new g.LatLng(yc, xc);
  const dm = g.geometry!.spherical.computeDistanceBetween(cp, dmP);
  return hm + dm * (1 / 7);
}

/** 転移表面の計算(b)（math_tennib_hei）着陸帯端 pA,pB を考慮 */
function mathTennibHei(
  g: typeof google.maps,
  _p1: Coord,
  _p2: Coord,
  p3: Coord,
  p4: Coord,
  cp: google.maps.LatLng,
  hm: number,
  pA: Coord,
  pB: Coord
): number {
  const p3y = p3.lat;
  const p3x = p3.lng;
  const p4y = p4.lat;
  const p4x = p4.lng;
  const p5y = Number(cp.lat().toFixed(8));
  const p5x = Number(cp.lng().toFixed(8));
  const pAy = pA.lat;
  const pAx = pA.lng;
  const pBy = pB.lat;
  const pBx = pB.lng;

  const pABAngle = (pBy - pAy) / (pBx - pAx);
  const p5ABAngle = pABAngle;
  const p5ABBase = -(p5ABAngle * p5x) + p5y;
  const p34Angle = (p4y - p3y) / (p4x - p3x);
  const p34Base = -(p34Angle * p3x) + p3y;
  const xc = (p34Base - p5ABBase) / (p5ABAngle - p34Angle);
  const yc = p5ABAngle * xc + p5ABBase;
  const dmP = new g.LatLng(yc, xc);
  const dm = g.geometry!.spherical.computeDistanceBetween(cp, dmP);
  return hm + dm * (1 / 7);
}

/** 円錐表面の高さ計算（math_ensui） */
function mathEnsui(kyori: number): number {
  return 6.4 + ((kyori - 4000) * 1) / 50 + 45;
}

/** 直線の交差判定（intersectM） */
function intersectM(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): number {
  return (
    (p1.x - p2.x) * (p3.y - p1.y) +
    (p1.y - p2.y) * (p1.x - p3.x)
  ) * (
    (p1.x - p2.x) * (p4.y - p1.y) +
    (p1.y - p2.y) * (p1.x - p4.x)
  );
}

/** 三角形の包含判定（PosIncludeTri） */
function posIncludeTri(
  tp1: { x: number; y: number },
  tp2: { x: number; y: number },
  tp3: { x: number; y: number },
  xp: { x: number; y: number }
): boolean {
  const c = {
    x: (tp1.x + tp2.x + tp3.x) / 3,
    y: (tp1.y + tp2.y + tp3.y) / 3,
  };
  const chk1 = intersectM(tp1, tp2, xp, c);
  if (chk1 < 0) return false;
  const chk2 = intersectM(tp1, tp3, xp, c);
  if (chk2 < 0) return false;
  const chk3 = intersectM(tp2, tp3, xp, c);
  if (chk3 < 0) return false;
  return true;
}

/** 包含判定（chk_Inclusion） */
function chkInclusion(
  point1: Coord,
  point2: Coord,
  point3: Coord,
  clickPoint: google.maps.LatLng
): boolean {
  const p1 = { x: point1.lat, y: point1.lng };
  const p2 = { x: point2.lat, y: point2.lng };
  const p3 = { x: point3.lat, y: point3.lng };
  const cp = {
    x: Number(clickPoint.lat().toFixed(8)),
    y: Number(clickPoint.lng().toFixed(8)),
  };
  return posIncludeTri(p1, p2, p3, cp);
}

/** ポリゴン内に点が含まれるか */
function isPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  polygonCoords: readonly { lat: number; lng: number }[]
): boolean {
  const point = new g.LatLng(lat, lng);
  const path = polygonCoords.map((c) => new g.LatLng(c.lat, c.lng));
  return g.geometry!.poly.containsLocation(point, new g.Polygon({ paths: path }));
}

/** 水平表面ゾーンの高さ計算（s_surface_event 相当） */
function calcHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(mpA.cd07, mpA.cd09, mpA.cd12) || chk(mpA.cd09, mpA.cd12, mpA.cd14)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(mpA.cd01, mpA.cd03, mpA.cd07) || chk(mpA.cd03, mpA.cd07, mpA.cd09)) {
    height.push({ val: mathSinnyu(g, mpA.cd08, mpA.cd02, latLng, 6.1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (chk(mpA.cd06, mpA.cd07, mpA.cd11) || chk(mpA.cd07, mpA.cd11, mpA.cd12)) {
    height.push({ val: mathTennia(g, mpA.cd08, mpA.cd13, 6.1, 6.2, latLng, 3120, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd04, mpA.cd06, mpA.cd07)) {
    const hm0 = mathSinnyu(g, mpA.cd08, mpA.cd02, latLng, 6.1);
    height.push({ val: mathTennib(g, mpA.cd08, mpA.cd02, mpA.cd07, mpA.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd11, mpA.cd12, mpA.cd16)) {
    const hm0 = mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2);
    height.push({ val: mathTennib(g, mpA.cd13, mpA.cd19, mpA.cd12, mpA.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd09, mpA.cd10, mpA.cd14) || chk(mpA.cd10, mpA.cd14, mpA.cd15)) {
    height.push({ val: mathTennia(g, mpA.cd08, mpA.cd13, 6.1, 6.2, latLng, 3120, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd05, mpA.cd09, mpA.cd10)) {
    const hm0 = mathSinnyu(g, mpA.cd08, mpA.cd02, latLng, 6.1);
    height.push({ val: mathTennib(g, mpA.cd08, mpA.cd02, mpA.cd09, mpA.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd14, mpA.cd15, mpA.cd17)) {
    const hm0 = mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2);
    height.push({ val: mathTennib(g, mpA.cd13, mpA.cd19, mpA.cd14, mpA.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpA.cd12, mpA.cd14, mpA.cd18) || chk(mpA.cd14, mpA.cd18, mpA.cd20)) {
    height.push({ val: mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }

  // B滑走路
  if (chk(mpB.cd07, mpB.cd09, mpB.cd12) || chk(mpB.cd09, mpB.cd12, mpB.cd14)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(mpB.cd01, mpB.cd03, mpB.cd07) || chk(mpB.cd03, mpB.cd07, mpB.cd09)) {
    height.push({ val: mathSinnyu(g, mpB.cd08, mpB.cd02, latLng, 5.8), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (chk(mpB.cd06, mpB.cd07, mpB.cd11) || chk(mpB.cd07, mpB.cd11, mpB.cd12)) {
    height.push({ val: mathTennia(g, mpB.cd08, mpB.cd13, 5.8, 10.7, latLng, 2620, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd04, mpB.cd06, mpB.cd07)) {
    const hm0 = mathSinnyu(g, mpB.cd08, mpB.cd02, latLng, 5.8);
    height.push({ val: mathTennib(g, mpB.cd08, mpB.cd02, mpB.cd07, mpB.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd11, mpB.cd12, mpB.cd16)) {
    const hm0 = mathSinnyu(g, mpB.cd13, mpB.cd19, latLng, 10.7);
    height.push({ val: mathTennib(g, mpB.cd13, mpB.cd19, mpB.cd12, mpB.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd09, mpB.cd10, mpB.cd14) || chk(mpB.cd10, mpB.cd14, mpB.cd15)) {
    height.push({ val: mathTennia(g, mpB.cd08, mpB.cd13, 5.8, 10.7, latLng, 2620, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd05, mpB.cd09, mpB.cd10)) {
    const hm0 = mathSinnyu(g, mpB.cd08, mpB.cd02, latLng, 5.8);
    height.push({ val: mathTennib(g, mpB.cd08, mpB.cd02, mpB.cd09, mpB.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd14, mpB.cd15, mpB.cd17)) {
    const hm0 = mathSinnyu(g, mpB.cd13, mpB.cd19, latLng, 10.7);
    height.push({ val: mathTennib(g, mpB.cd13, mpB.cd19, mpB.cd14, mpB.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpB.cd12, mpB.cd14, mpB.cd18) || chk(mpB.cd14, mpB.cd18, mpB.cd20)) {
    height.push({ val: mathSinnyu(g, mpB.cd13, mpB.cd19, latLng, 10.7), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }

  // C滑走路
  if (chk(mpC.cd07, mpC.cd09, mpC.cd12) || chk(mpC.cd09, mpC.cd12, mpC.cd14)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(mpC.cd01, mpC.cd03, mpC.cd07) || chk(mpC.cd03, mpC.cd07, mpC.cd09)) {
    height.push({ val: mathSinnyu(g, mpC.cd08, mpC.cd02, latLng, 6.6), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (chk(mpC.cd06, mpC.cd07, mpC.cd11) || chk(mpC.cd07, mpC.cd11, mpC.cd12)) {
    height.push({ val: mathTennia(g, mpC.cd08, mpC.cd13, 6.6, 8.5, latLng, 3480, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd04, mpC.cd06, mpC.cd07)) {
    const hm0 = mathSinnyu(g, mpC.cd08, mpC.cd02, latLng, 6.6);
    height.push({ val: mathTennib(g, mpC.cd08, mpC.cd02, mpC.cd07, mpC.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd11, mpC.cd12, mpC.cd16)) {
    const hm0 = mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5);
    height.push({ val: mathTennib(g, mpC.cd13, mpC.cd19, mpC.cd12, mpC.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd09, mpC.cd10, mpC.cd14) || chk(mpC.cd10, mpC.cd14, mpC.cd15)) {
    height.push({ val: mathTennia(g, mpC.cd08, mpC.cd13, 6.6, 8.5, latLng, 3480, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd05, mpC.cd09, mpC.cd10)) {
    const hm0 = mathSinnyu(g, mpC.cd08, mpC.cd02, latLng, 6.6);
    height.push({ val: mathTennib(g, mpC.cd08, mpC.cd02, mpC.cd09, mpC.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd14, mpC.cd15, mpC.cd17)) {
    const hm0 = mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5);
    height.push({ val: mathTennib(g, mpC.cd13, mpC.cd19, mpC.cd14, mpC.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpC.cd12, mpC.cd14, mpC.cd18) || chk(mpC.cd14, mpC.cd18, mpC.cd20)) {
    height.push({ val: mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }

  // D滑走路
  const dChaku1 = chk(mpD.cd07, mpD.cd09, mpD.cd12) || chk(mpD.cd09, mpD.cd12, mpD.cd14);
  if (dChaku1) height.push({ val: 0, str: "着陸帯" });
  if (chk(mpD.cd01, mpD.cd03, mpD.cd07) || chk(mpD.cd03, mpD.cd07, mpD.cd09)) {
    height.push({ val: mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (chk(mpD.cd06, mpD.cd07, mpD.cd11) || chk(mpD.cd07, mpD.cd11, mpD.cd12)) {
    height.push({ val: mathTennia(g, mpD.cd08, mpD.cd13, 13.866, 15.966, latLng, 2620, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpD.cd04, mpD.cd06, mpD.cd07)) {
    const hm0 = mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866);
    height.push({ val: mathTennib(g, mpD.cd08, mpD.cd02, mpD.cd07, mpD.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpD.cd11, mpD.cd12, mpD.cd16)) {
    const hm0 = mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966);
    height.push({ val: mathTennib(g, mpD.cd13, mpD.cd19, mpD.cd12, mpD.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpD.cd09, mpD.cd10, mpD.cd14) || chk(mpD.cd10, mpD.cd14, mpD.cd15)) {
    height.push({ val: mathTennia(g, mpD.cd08, mpD.cd13, 13.866, 15.966, latLng, 2620, 300), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpD.cd05, mpD.cd09, mpD.cd10)) {
    const hm0 = mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866);
    height.push({ val: mathTennib(g, mpD.cd08, mpD.cd02, mpD.cd09, mpD.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (chk(mpD.cd14, mpD.cd15, mpD.cd17)) {
    const hm0 = mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966);
    height.push({ val: mathTennib(g, mpD.cd13, mpD.cd19, mpD.cd14, mpD.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  const cSinS1 = chk(mpD.cd12, mpD.cd14, mpD.cd18) || chk(mpD.cd14, mpD.cd18, mpD.cd20);
  if (cSinS1) {
    height.push({ val: mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }

  height.push({ val: HORIZONTAL_SURFACE_HEIGHT_M, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (cSinS1) reStr = "進入表面";
  if (dChaku1) reStr = "着陸帯";

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 円錐表面ゾーンの高さ計算（Kikkake_event 相当） */
function calcConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hEnsui = mathEnsui(kyori);
  if (hEnsui > CONICAL_SURFACE_MAX_HEIGHT_M) hEnsui = CONICAL_SURFACE_MAX_HEIGHT_M;
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(mpA.cd01, mpA.cd03, mpA.cd07) || chk(mpA.cd03, mpA.cd07, mpA.cd09)) {
    height.push({ val: mathSinnyu(g, mpA.cd08, mpA.cd02, latLng, 6.1), str: "進入表面" });
  }
  if (chk(mpA.cd12, mpA.cd14, mpA.cd18) || chk(mpA.cd14, mpA.cd18, mpA.cd20)) {
    height.push({ val: mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2), str: "進入表面" });
  }
  if (chk(mpA.cd11, mpA.cd12, mpA.cd16)) {
    const hm0 = mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2);
    height.push({ val: mathTennib(g, mpA.cd13, mpA.cd19, mpA.cd12, mpA.cd18, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpA.cd14, mpA.cd15, mpA.cd17)) {
    const hm0 = mathSinnyu(g, mpA.cd13, mpA.cd19, latLng, 6.2);
    height.push({ val: mathTennib(g, mpA.cd13, mpA.cd19, mpA.cd14, mpA.cd20, latLng, hm0), str: "転移表面" });
  }
  const aSinE1 = chk(mpA.cd18, mpA.cd20, mpA.cd21) || chk(mpA.cd20, mpA.cd21, mpA.cd23);
  if (aSinE1) height.push({ val: mathSinnyu(g, mpA.cd13, mpA.cd22, latLng, 6.2), str: "延長進入表面" });

  // B滑走路
  if (chk(mpB.cd01, mpB.cd03, mpB.cd07) || chk(mpB.cd03, mpB.cd07, mpB.cd09)) {
    height.push({ val: mathSinnyu(g, mpB.cd08, mpB.cd02, latLng, 5.8), str: "進入表面" });
  }
  if (chk(mpB.cd04, mpB.cd06, mpB.cd07)) {
    const hm0 = mathSinnyu(g, mpB.cd08, mpB.cd02, latLng, 5.8);
    height.push({ val: mathTennib(g, mpB.cd08, mpB.cd02, mpB.cd07, mpB.cd01, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpB.cd12, mpB.cd14, mpB.cd18) || chk(mpB.cd14, mpB.cd18, mpB.cd20)) {
    height.push({ val: mathSinnyu(g, mpB.cd13, mpB.cd19, latLng, 10.7), str: "進入表面" });
  }
  const bSinE1 = chk(mpB.cd18, mpB.cd20, mpB.cd21) || chk(mpB.cd20, mpB.cd21, mpB.cd23);
  if (bSinE1) height.push({ val: mathSinnyu(g, mpB.cd13, mpB.cd22, latLng, 10.7), str: "延長進入表面" });

  // C滑走路
  if (chk(mpC.cd01, mpC.cd03, mpC.cd07) || chk(mpC.cd03, mpC.cd07, mpC.cd09)) {
    height.push({ val: mathSinnyu(g, mpC.cd08, mpC.cd02, latLng, 6.6), str: "進入表面" });
  }
  if (chk(mpC.cd11, mpC.cd12, mpC.cd16)) {
    const hm0 = mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5);
    height.push({ val: mathTennib(g, mpC.cd13, mpC.cd19, mpC.cd12, mpC.cd18, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpC.cd14, mpC.cd15, mpC.cd17)) {
    const hm0 = mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5);
    height.push({ val: mathTennib(g, mpC.cd13, mpC.cd19, mpC.cd14, mpC.cd20, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpC.cd12, mpC.cd14, mpC.cd18) || chk(mpC.cd14, mpC.cd18, mpC.cd20)) {
    height.push({ val: mathSinnyu(g, mpC.cd13, mpC.cd19, latLng, 8.5), str: "進入表面" });
  }
  const cSinE1 = chk(mpC.cd18, mpC.cd20, mpC.cd21) || chk(mpC.cd20, mpC.cd21, mpC.cd23);
  if (cSinE1) height.push({ val: mathSinnyu(g, mpC.cd13, mpC.cd22, latLng, 8.5), str: "延長進入表面" });

  // D滑走路
  const dChaku1 = chk(mpD.cd07, mpD.cd09, mpD.cd12) || chk(mpD.cd09, mpD.cd12, mpD.cd14);
  if (dChaku1) height.push({ val: 0, str: "着陸帯" });
  if (chk(mpD.cd01, mpD.cd03, mpD.cd07) || chk(mpD.cd03, mpD.cd07, mpD.cd09)) {
    height.push({ val: mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866), str: "進入表面" });
  }
  if (chk(mpD.cd09, mpD.cd10, mpD.cd14) || chk(mpD.cd10, mpD.cd14, mpD.cd15)) {
    height.push({ val: mathTennia(g, mpD.cd08, mpD.cd13, 13.866, 15.966, latLng, 2620, 300), str: "転移表面" });
  }
  if (chk(mpD.cd04, mpD.cd06, mpD.cd07)) {
    const hm0 = mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866);
    height.push({ val: mathTennib(g, mpD.cd08, mpD.cd02, mpD.cd07, mpD.cd01, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpD.cd05, mpD.cd09, mpD.cd10)) {
    const hm0 = mathSinnyu(g, mpD.cd08, mpD.cd02, latLng, 13.866);
    height.push({ val: mathTennib(g, mpD.cd08, mpD.cd02, mpD.cd09, mpD.cd03, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpD.cd11, mpD.cd12, mpD.cd16)) {
    const hm0 = mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966);
    height.push({ val: mathTennib(g, mpD.cd13, mpD.cd19, mpD.cd12, mpD.cd18, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpD.cd14, mpD.cd15, mpD.cd17)) {
    const hm0 = mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966);
    height.push({ val: mathTennib(g, mpD.cd13, mpD.cd19, mpD.cd14, mpD.cd20, latLng, hm0), str: "転移表面" });
  }
  if (chk(mpD.cd12, mpD.cd14, mpD.cd18) || chk(mpD.cd14, mpD.cd18, mpD.cd20)) {
    height.push({ val: mathSinnyu(g, mpD.cd13, mpD.cd19, latLng, 15.966), str: "進入表面" });
  }
  const dSinE1 = chk(mpD.cd18, mpD.cd20, mpD.cd21) || chk(mpD.cd20, mpD.cd21, mpD.cd23);
  if (dSinE1) height.push({ val: mathSinnyu(g, mpD.cd13, mpD.cd22, latLng, 15.966), str: "延長進入表面" });

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (aSinE1 || bSinE1 || cSinE1 || dSinE1) reStr = "延長進入表面";
  else if (
    chk(mpA.cd01, mpA.cd03, mpA.cd07) || chk(mpA.cd03, mpA.cd07, mpA.cd09) ||
    chk(mpA.cd12, mpA.cd14, mpA.cd18) || chk(mpA.cd14, mpA.cd18, mpA.cd20) ||
    chk(mpB.cd01, mpB.cd03, mpB.cd07) || chk(mpB.cd03, mpB.cd07, mpB.cd09) ||
    chk(mpB.cd12, mpB.cd14, mpB.cd18) || chk(mpB.cd14, mpB.cd18, mpB.cd20) ||
    chk(mpC.cd01, mpC.cd03, mpC.cd07) || chk(mpC.cd03, mpC.cd07, mpC.cd09) ||
    chk(mpC.cd12, mpC.cd14, mpC.cd18) || chk(mpC.cd14, mpC.cd18, mpC.cd20) ||
    chk(mpD.cd01, mpD.cd03, mpD.cd07) || chk(mpD.cd03, mpD.cd07, mpD.cd09) ||
    chk(mpD.cd12, mpD.cd14, mpD.cd18) || chk(mpD.cd14, mpD.cd18, mpD.cd20)
  ) reStr = "進入表面";

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 外側水平表面ゾーンの高さ計算（Kikkake_s_event 相当） */
function calcOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  height.push({ val: OUTER_HORIZONTAL_SURFACE_HEIGHT_M, str: "外側水平表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  const aSinE1 = chk(mpA.cd18, mpA.cd20, mpA.cd21) || chk(mpA.cd20, mpA.cd21, mpA.cd23);
  if (aSinE1) height.push({ val: mathSinnyu(g, mpA.cd13, mpA.cd22, latLng, 6.2), str: "延長進入表面" });

  const bSinE1 = chk(mpB.cd18, mpB.cd20, mpB.cd21) || chk(mpB.cd20, mpB.cd21, mpB.cd23);
  if (bSinE1) height.push({ val: mathSinnyu(g, mpB.cd13, mpB.cd22, latLng, 10.7), str: "延長進入表面" });

  const cSinE1 = chk(mpC.cd18, mpC.cd20, mpC.cd21) || chk(mpC.cd20, mpC.cd21, mpC.cd23);
  if (cSinE1) height.push({ val: mathSinnyu(g, mpC.cd13, mpC.cd22, latLng, 8.5), str: "延長進入表面" });

  const dSinE1 = chk(mpD.cd18, mpD.cd20, mpD.cd21) || chk(mpD.cd20, mpD.cd21, mpD.cd23);
  if (dSinE1) height.push({ val: mathSinnyu(g, mpD.cd13, mpD.cd22, latLng, 15.966), str: "延長進入表面" });

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (aSinE1 || bSinE1 || cSinE1 || dSinE1) reStr = "延長進入表面";

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 羽田空港の高さ制限を計算する
 * @param lat 緯度
 * @param lng 経度
 * @param gmaps google.maps（geometry ライブラリ必須）
 * @returns 制限結果。制限表面外の場合は items が空
 */
export function calculateHanedaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(HANEDA_REFERENCE_POINT.lat, HANEDA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= HORIZONTAL_SURFACE_RADIUS_M) {
      result = calcHorizontalSurface(g, point);
    } else if (distance <= CONICAL_SURFACE_RADIUS_M && isPointInPolygon(g, lat, lng, landingKi)) {
      result = calcConicalSurface(g, point, distance);
    } else if (distance <= OUTER_HORIZONTAL_SURFACE_RADIUS_M && isPointInPolygon(g, lat, lng, landingKi_s)) {
      result = calcOuterHorizontalSurface(g, point);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "haneda",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

/** 成田: ポリゴン内に点が含まれるか */
function isNaritaPointInPolygon(
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

/** 成田: 水平表面ゾーン（半径4000m以内） */
function calcNaritaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([nA.cd12, nA.cd14, nA.cd20, nA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nA.cd11, nA.cd12, nA.cd18, nA.cd17])) {
    height.push({
      val: mathTennia(g, nA.cd13, nA.cd19, HEIGHT_OF_LANDING_AREA_A_1, HEIGHT_OF_LANDING_AREA_A_2, latLng, LENGTH_OF_LANDING_AREA_A, WIDTH_OF_LANDING_AREA_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd14, nA.cd15, nA.cd21, nA.cd20])) {
    height.push({
      val: mathTennia(g, nA.cd13, nA.cd19, HEIGHT_OF_LANDING_AREA_A_1, HEIGHT_OF_LANDING_AREA_A_2, latLng, LENGTH_OF_LANDING_AREA_A, WIDTH_OF_LANDING_AREA_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd07, nA.cd12, nA.cd11])) {
    const hm0 = mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1);
    height.push({ val: mathTennib(g, nA.cd13, nA.cd12, nA.cd12, nA.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd08, nA.cd15, nA.cd14])) {
    const hm0 = mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1);
    height.push({ val: mathTennib(g, nA.cd13, nA.cd14, nA.cd14, nA.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd17, nA.cd18, nA.cd24])) {
    const hm0 = mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2);
    height.push({ val: mathTennib(g, nA.cd19, nA.cd18, nA.cd18, nA.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nA.cd20, nA.cd21, nA.cd25])) {
    const hm0 = mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2);
    height.push({ val: mathTennib(g, nA.cd19, nA.cd20, nA.cd20, nA.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // C滑走路
  if (inPoly([nC.cd12, nC.cd14, nC.cd20, nC.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nC.cd11, nC.cd12, nC.cd18, nC.cd17])) {
    height.push({
      val: mathTennia(g, nC.cd13, nC.cd19, HEIGHT_OF_LANDING_AREA_C_1, HEIGHT_OF_LANDING_AREA_C_2, latLng, LENGTH_OF_LANDING_AREA_C, WIDTH_OF_LANDING_AREA_C),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd14, nC.cd15, nC.cd21, nC.cd20])) {
    height.push({
      val: mathTennia(g, nC.cd13, nC.cd19, HEIGHT_OF_LANDING_AREA_C_1, HEIGHT_OF_LANDING_AREA_C_2, latLng, LENGTH_OF_LANDING_AREA_C, WIDTH_OF_LANDING_AREA_C),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd07, nC.cd12, nC.cd11])) {
    const hm0 = mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1);
    height.push({ val: mathTennib(g, nC.cd13, nC.cd12, nC.cd12, nC.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd08, nC.cd15, nC.cd14])) {
    const hm0 = mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1);
    height.push({ val: mathTennib(g, nC.cd13, nC.cd14, nC.cd14, nC.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd17, nC.cd18, nC.cd24])) {
    const hm0 = mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2);
    height.push({ val: mathTennib(g, nC.cd19, nC.cd18, nC.cd18, nC.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nC.cd20, nC.cd21, nC.cd25])) {
    const hm0 = mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2);
    height.push({ val: mathTennib(g, nC.cd19, nC.cd20, nC.cd20, nC.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: NARITA_REF_HEIGHT + NARITA_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14]) || inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26]) ||
      inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14]) || inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([nA.cd12, nA.cd14, nA.cd20, nA.cd18]) || inPoly([nC.cd12, nC.cd14, nC.cd20, nC.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 成田: 円錐表面ゾーン（4000m超〜16500m、切欠きなし） */
function calcNaritaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = NARITA_REF_HEIGHT + NARITA_HORIZ_HEIGHT + (distance - NARITA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  // A滑走路（円錐ゾーンに進入/延長進入が突き出す場合）
  if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd05, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "進入表面" });
  }
  if (inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd27, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "進入表面" });
  }
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
  }

  // C滑走路
  if (inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd05, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "進入表面" });
  }
  if (inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd27, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "進入表面" });
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nA.cd12, nA.cd04, nA.cd06, nA.cd14]) || inPoly([nA.cd18, nA.cd20, nA.cd28, nA.cd26]) ||
      inPoly([nC.cd12, nC.cd04, nC.cd06, nC.cd14]) || inPoly([nC.cd18, nC.cd20, nC.cd28, nC.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 成田: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNaritaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = NARITA_REF_HEIGHT + NARITA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isNaritaPointInPolygon(g, lat, lng, path);

  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01])) {
    height.push({ val: mathSinnyu(g, nA.cd13, nA.cd02, latLng, HEIGHT_OF_LANDING_AREA_A_1), str: "延長進入表面" });
  }
  if (inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29])) {
    height.push({ val: mathSinnyu(g, nA.cd19, nA.cd30, latLng, HEIGHT_OF_LANDING_AREA_A_2), str: "延長進入表面" });
  }
  if (inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01])) {
    height.push({ val: mathSinnyu(g, nC.cd13, nC.cd02, latLng, HEIGHT_OF_LANDING_AREA_C_1), str: "延長進入表面" });
  }
  if (inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    height.push({ val: mathSinnyu(g, nC.cd19, nC.cd30, latLng, HEIGHT_OF_LANDING_AREA_C_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nA.cd04, nA.cd06, nA.cd03, nA.cd01]) || inPoly([nA.cd26, nA.cd28, nA.cd31, nA.cd29]) ||
      inPoly([nC.cd04, nC.cd06, nC.cd03, nC.cd01]) || inPoly([nC.cd26, nC.cd28, nC.cd31, nC.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 成田空港の高さ制限を計算する
 * @param lat 緯度
 * @param lng 経度
 * @param gmaps google.maps（geometry ライブラリ必須）
 * @returns 制限結果。制限表面外の場合は items が空
 */
export function calculateNaritaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(NARITA_REFERENCE_POINT.lat, NARITA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NARITA_HORIZ_RADIUS) {
      result = calcNaritaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= NARITA_CONICAL_RADIUS) {
      result = calcNaritaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= NARITA_OUTER_RADIUS) {
      result = calcNaritaOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "narita",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

/** 関西: ポリゴン内に点が含まれるか */
function isKansaiPointInPolygon(
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

/** 関西: 水平表面ゾーン（半径4000m以内） */
function calcKansaiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([kA.cd12, kA.cd14, kA.cd20, kA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kA.cd11, kA.cd12, kA.cd18, kA.cd17])) {
    height.push({
      val: mathTennia(g, kA.cd13, kA.cd19, KANSAI_HEIGHT_A_1, KANSAI_HEIGHT_A_2, latLng, KANSAI_LENGTH_A, KANSAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd14, kA.cd15, kA.cd21, kA.cd20])) {
    height.push({
      val: mathTennia(g, kA.cd13, kA.cd19, KANSAI_HEIGHT_A_1, KANSAI_HEIGHT_A_2, latLng, KANSAI_LENGTH_A, KANSAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd07, kA.cd12, kA.cd11])) {
    const hm0 = mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1);
    height.push({ val: mathTennib(g, kA.cd13, kA.cd12, kA.cd12, kA.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd08, kA.cd15, kA.cd14])) {
    const hm0 = mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1);
    height.push({ val: mathTennib(g, kA.cd13, kA.cd14, kA.cd14, kA.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd17, kA.cd18, kA.cd24])) {
    const hm0 = mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2);
    height.push({ val: mathTennib(g, kA.cd19, kA.cd18, kA.cd18, kA.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kA.cd20, kA.cd21, kA.cd25])) {
    const hm0 = mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2);
    height.push({ val: mathTennib(g, kA.cd19, kA.cd20, kA.cd20, kA.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([kB.cd12, kB.cd14, kB.cd20, kB.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([kB.cd11, kB.cd12, kB.cd18, kB.cd17])) {
    height.push({
      val: mathTennia(g, kB.cd13, kB.cd19, KANSAI_HEIGHT_B_1, KANSAI_HEIGHT_B_2, latLng, KANSAI_LENGTH_B, KANSAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd14, kB.cd15, kB.cd21, kB.cd20])) {
    height.push({
      val: mathTennia(g, kB.cd13, kB.cd19, KANSAI_HEIGHT_B_1, KANSAI_HEIGHT_B_2, latLng, KANSAI_LENGTH_B, KANSAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd07, kB.cd12, kB.cd11])) {
    const hm0 = mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1);
    height.push({ val: mathTennib(g, kB.cd13, kB.cd12, kB.cd12, kB.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd08, kB.cd15, kB.cd14])) {
    const hm0 = mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1);
    height.push({ val: mathTennib(g, kB.cd13, kB.cd14, kB.cd14, kB.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd17, kB.cd18, kB.cd24])) {
    const hm0 = mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2);
    height.push({ val: mathTennib(g, kB.cd19, kB.cd18, kB.cd18, kB.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([kB.cd20, kB.cd21, kB.cd25])) {
    const hm0 = mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2);
    height.push({ val: mathTennib(g, kB.cd19, kB.cd20, kB.cd20, kB.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: KANSAI_REF_HEIGHT + KANSAI_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14]) || inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26]) ||
      inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14]) || inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([kA.cd12, kA.cd14, kA.cd20, kA.cd18]) || inPoly([kB.cd12, kB.cd14, kB.cd20, kB.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 関西: 円錐表面ゾーン（4000m超〜16500m） */
function calcKansaiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = KANSAI_REF_HEIGHT + KANSAI_HORIZ_HEIGHT + (distance - KANSAI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd05, latLng, KANSAI_HEIGHT_A_1), str: "進入表面" });
  }
  if (inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd27, latLng, KANSAI_HEIGHT_A_2), str: "進入表面" });
  }
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd05, latLng, KANSAI_HEIGHT_B_1), str: "進入表面" });
  }
  if (inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd27, latLng, KANSAI_HEIGHT_B_2), str: "進入表面" });
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([kA.cd12, kA.cd04, kA.cd06, kA.cd14]) || inPoly([kA.cd18, kA.cd20, kA.cd28, kA.cd26]) ||
      inPoly([kB.cd12, kB.cd04, kB.cd06, kB.cd14]) || inPoly([kB.cd18, kB.cd20, kB.cd28, kB.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 関西: 外側水平表面ゾーン（16500m超〜24000m） */
function calcKansaiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = KANSAI_REF_HEIGHT + KANSAI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isKansaiPointInPolygon(g, lat, lng, path);

  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01])) {
    height.push({ val: mathSinnyu(g, kA.cd13, kA.cd02, latLng, KANSAI_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29])) {
    height.push({ val: mathSinnyu(g, kA.cd19, kA.cd30, latLng, KANSAI_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01])) {
    height.push({ val: mathSinnyu(g, kB.cd13, kB.cd02, latLng, KANSAI_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    height.push({ val: mathSinnyu(g, kB.cd19, kB.cd30, latLng, KANSAI_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([kA.cd04, kA.cd06, kA.cd03, kA.cd01]) || inPoly([kA.cd26, kA.cd28, kA.cd31, kA.cd29]) ||
      inPoly([kB.cd04, kB.cd06, kB.cd03, kB.cd01]) || inPoly([kB.cd26, kB.cd28, kB.cd31, kB.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 関西国際空港の高さ制限を計算する
 */
export function calculateKansaiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(KANSAI_REFERENCE_POINT.lat, KANSAI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= KANSAI_HORIZ_RADIUS) {
      result = calcKansaiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= KANSAI_CONICAL_RADIUS) {
      result = calcKansaiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= KANSAI_OUTER_RADIUS) {
      result = calcKansaiOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "kansai",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
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

/** 那覇: 水平表面ゾーン（半径4000m以内） */
function calcNahaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([nAha.cd12, nAha.cd14, nAha.cd20, nAha.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nAha.cd11, nAha.cd12, nAha.cd18, nAha.cd17])) {
    height.push({
      val: mathTennia(g, nAha.cd13, nAha.cd19, NAHA_HEIGHT_A_1, NAHA_HEIGHT_A_2, latLng, NAHA_LENGTH_A, NAHA_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd14, nAha.cd15, nAha.cd21, nAha.cd20])) {
    height.push({
      val: mathTennia(g, nAha.cd13, nAha.cd19, NAHA_HEIGHT_A_1, NAHA_HEIGHT_A_2, latLng, NAHA_LENGTH_A, NAHA_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd07, nAha.cd12, nAha.cd11])) {
    const hm0 = mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1);
    height.push({ val: mathTennib(g, nAha.cd13, nAha.cd12, nAha.cd12, nAha.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd08, nAha.cd15, nAha.cd14])) {
    const hm0 = mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1);
    height.push({ val: mathTennib(g, nAha.cd13, nAha.cd14, nAha.cd14, nAha.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd17, nAha.cd18, nAha.cd24])) {
    const hm0 = mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2);
    height.push({ val: mathTennib(g, nAha.cd19, nAha.cd18, nAha.cd18, nAha.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nAha.cd20, nAha.cd21, nAha.cd25])) {
    const hm0 = mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2);
    height.push({ val: mathTennib(g, nAha.cd19, nAha.cd20, nAha.cd20, nAha.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([nBha.cd12, nBha.cd14, nBha.cd20, nBha.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([nBha.cd11, nBha.cd12, nBha.cd18, nBha.cd17])) {
    height.push({
      val: mathTennia(g, nBha.cd13, nBha.cd19, NAHA_HEIGHT_B_1, NAHA_HEIGHT_B_2, latLng, NAHA_LENGTH_B, NAHA_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd14, nBha.cd15, nBha.cd21, nBha.cd20])) {
    height.push({
      val: mathTennia(g, nBha.cd13, nBha.cd19, NAHA_HEIGHT_B_1, NAHA_HEIGHT_B_2, latLng, NAHA_LENGTH_B, NAHA_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd07, nBha.cd12, nBha.cd11])) {
    const hm0 = mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1);
    height.push({ val: mathTennib(g, nBha.cd13, nBha.cd12, nBha.cd12, nBha.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd08, nBha.cd15, nBha.cd14])) {
    const hm0 = mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1);
    height.push({ val: mathTennib(g, nBha.cd13, nBha.cd14, nBha.cd14, nBha.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd17, nBha.cd18, nBha.cd24])) {
    const hm0 = mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2);
    height.push({ val: mathTennib(g, nBha.cd19, nBha.cd18, nBha.cd18, nBha.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([nBha.cd20, nBha.cd21, nBha.cd25])) {
    const hm0 = mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2);
    height.push({ val: mathTennib(g, nBha.cd19, nBha.cd20, nBha.cd20, nBha.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14]) || inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26]) ||
      inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14]) || inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([nAha.cd12, nAha.cd14, nAha.cd20, nAha.cd18]) || inPoly([nBha.cd12, nBha.cd14, nBha.cd20, nBha.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 那覇: 円錐表面ゾーン（4000m超〜16500m） */
function calcNahaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = NAHA_REF_HEIGHT + NAHA_HORIZ_HEIGHT + (distance - NAHA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd05, latLng, NAHA_HEIGHT_A_1), str: "進入表面" });
  }
  if (inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd27, latLng, NAHA_HEIGHT_A_2), str: "進入表面" });
  }
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd05, latLng, NAHA_HEIGHT_B_1), str: "進入表面" });
  }
  if (inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd27, latLng, NAHA_HEIGHT_B_2), str: "進入表面" });
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([nAha.cd12, nAha.cd04, nAha.cd06, nAha.cd14]) || inPoly([nAha.cd18, nAha.cd20, nAha.cd28, nAha.cd26]) ||
      inPoly([nBha.cd12, nBha.cd04, nBha.cd06, nBha.cd14]) || inPoly([nBha.cd18, nBha.cd20, nBha.cd28, nBha.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 那覇: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNahaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = NAHA_REF_HEIGHT + NAHA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isNahaPointInPolygon(g, lat, lng, path);

  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01])) {
    height.push({ val: mathSinnyu(g, nAha.cd13, nAha.cd02, latLng, NAHA_HEIGHT_A_1), str: "延長進入表面" });
  }
  if (inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29])) {
    height.push({ val: mathSinnyu(g, nAha.cd19, nAha.cd30, latLng, NAHA_HEIGHT_A_2), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01])) {
    height.push({ val: mathSinnyu(g, nBha.cd13, nBha.cd02, latLng, NAHA_HEIGHT_B_1), str: "延長進入表面" });
  }
  if (inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    height.push({ val: mathSinnyu(g, nBha.cd19, nBha.cd30, latLng, NAHA_HEIGHT_B_2), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([nAha.cd04, nAha.cd06, nAha.cd03, nAha.cd01]) || inPoly([nAha.cd26, nAha.cd28, nAha.cd31, nAha.cd29]) ||
      inPoly([nBha.cd04, nBha.cd06, nBha.cd03, nBha.cd01]) || inPoly([nBha.cd26, nBha.cd28, nBha.cd31, nBha.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 那覇空港の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= NAHA_HORIZ_RADIUS) {
      result = calcNahaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= NAHA_CONICAL_RADIUS) {
      result = calcNahaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= NAHA_OUTER_RADIUS) {
      result = calcNahaOuterHorizontalSurface(g, point, lat, lng);
    }

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

/** 福岡: 円錐表面の高さ math_ensui = 9.1 + (kyori - 4000) * (1/50) + 45 */
function mathEnsuiFukuoka(kyori: number): number {
  return 9.1 + (kyori - 4000) * (1 / 50) + 45;
}

/** 福岡: 水平表面ゾーン（4000m以内） */
function calcFukuokaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  height.push({ val: FUKUOKA_HORIZ_HEIGHT, str: "水平表面" });

  // A滑走路
  if (chk(fA.cd21, fA.cd22, fA.cd23) || chk(fA.cd22, fA.cd23, fA.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd22, fA.cd18, fA.cd24) || chk(fA.cd18, fA.cd24, fA.cd20)) {
    height.push({ val: mathTennia(g, fA.cd25, fA.cd26, FUKUOKA_HEIGHT_A_N, FUKUOKA_HEIGHT_A_S, latLng, FUKUOKA_LENGTH_A, FUKUOKA_WIDTH_A), str: "転移表面" });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd20, fA.cd24, fA.cd16)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({ val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd24, fA.cd16, latLng, hm0, fA.cd23, fA.cd24), str: "転移表面" });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" });
  }
  if (chk(fA.cd21, fA.cd17, fA.cd23) || chk(fA.cd17, fA.cd23, fA.cd19)) {
    height.push({ val: mathTennia(g, fA.cd25, fA.cd26, FUKUOKA_HEIGHT_A_N, FUKUOKA_HEIGHT_A_S, latLng, FUKUOKA_LENGTH_A, FUKUOKA_WIDTH_A), str: "転移表面" });
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd15, fA.cd19, fA.cd23)) {
    const hm0 = mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S);
    height.push({ val: mathTennibHei(g, fA.cd26, fA.cd12, fA.cd23, fA.cd15, latLng, hm0, fA.cd23, fA.cd24), str: "転移表面" });
  }

  // B滑走路
  if (chk(fB.cd5, fB.cd6, fB.cd9) || chk(fB.cd5, fB.cd9, fB.cd8)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    height.push({ val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N), str: "進入表面" });
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    height.push({ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" });
  }
  if (chk(fB.cd5, fB.cd15, fB.cd8) || chk(fB.cd15, fB.cd8, fB.cd16)) {
    height.push({ val: mathTennia(g, fB.cd18, fB.cd19, FUKUOKA_HEIGHT_B_N, FUKUOKA_HEIGHT_B_S, latLng, FUKUOKA_LENGTH_B, FUKUOKA_WIDTH_B), str: "転移表面" });
  }
  if (chk(fB.cd3, fB.cd5, fB.cd15)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    height.push({ val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd5, fB.cd3, latLng, hm0, fB.cd6, fB.cd5), str: "転移表面" });
  }
  if (chk(fB.cd16, fB.cd8, fB.cd11)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    height.push({ val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd8, fB.cd11, latLng, hm0, fB.cd9, fB.cd8), str: "転移表面" });
  }
  if (chk(fB.cd6, fB.cd7, fB.cd10) || chk(fB.cd6, fB.cd10, fB.cd9)) {
    height.push({ val: mathTennia(g, fB.cd18, fB.cd19, FUKUOKA_HEIGHT_B_N, FUKUOKA_HEIGHT_B_S, latLng, FUKUOKA_LENGTH_B, FUKUOKA_WIDTH_B), str: "転移表面" });
  }
  if (chk(fB.cd4, fB.cd7, fB.cd6)) {
    const hm0 = mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N);
    height.push({ val: mathTennibHei(g, fB.cd18, fB.cd17, fB.cd6, fB.cd4, latLng, hm0, fB.cd6, fB.cd5), str: "転移表面" });
  }
  if (chk(fB.cd10, fB.cd12, fB.cd9)) {
    const hm0 = mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S);
    height.push({ val: mathTennibHei(g, fB.cd19, fB.cd20, fB.cd9, fB.cd14, latLng, hm0, fB.cd9, fB.cd8), str: "転移表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str] ?? "outer_horizontal";
  return { surfaceType: st, heightM: d.val };
}

/** 福岡: 円錐表面ゾーン（landingKiE ポリゴン内、4000m超〜16500m） */
function calcFukuokaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiFukuoka(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(fA.cd7, fA.cd8, fA.cd22) || chk(fA.cd7, fA.cd22, fA.cd21)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N), str: "進入表面" });
  }
  if (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd8, fA.cd7)) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }
  if (chk(fA.cd14, fA.cd18, fA.cd22)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd22, fA.cd14, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }
  if (chk(fA.cd9, fA.cd10, fA.cd23) || chk(fA.cd10, fA.cd23, fA.cd24)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd12, latLng, FUKUOKA_HEIGHT_A_S), str: "進入表面" });
  }
  if (chk(fA.cd3, fA.cd4, fA.cd9) || chk(fA.cd4, fA.cd9, fA.cd10)) {
    height.push({ val: mathSinnyu(g, fA.cd26, fA.cd6, latLng, FUKUOKA_HEIGHT_A_S), str: "延長進入表面" });
  }
  if (chk(fA.cd13, fA.cd21, fA.cd17)) {
    const hm0 = mathSinnyu(g, fA.cd25, fA.cd11, latLng, FUKUOKA_HEIGHT_A_N);
    height.push({ val: mathTennibHei(g, fA.cd25, fA.cd11, fA.cd21, fA.cd13, latLng, hm0, fA.cd21, fA.cd22), str: "転移表面" });
  }

  // B滑走路
  if (chk(fB.cd1, fB.cd2, fB.cd6) || chk(fB.cd1, fB.cd6, fB.cd5)) {
    height.push({ val: mathSinnyu40(g, fB.cd18, fB.cd17, latLng, FUKUOKA_HEIGHT_B_N), str: "進入表面" });
  }
  if (chk(fB.cd8, fB.cd9, fB.cd14) || chk(fB.cd8, fB.cd14, fB.cd13)) {
    height.push({ val: mathSinnyu40(g, fB.cd19, fB.cd20, latLng, FUKUOKA_HEIGHT_B_S), str: "進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 福岡: 外側水平表面ゾーン（16500m超〜24000m） */
function calcFukuokaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } {
  const height: HeightEntry[] = [{ val: FUKUOKA_OUTER_HEIGHT, str: "外側水平表面" }];

  const inNorth = isPointInPolygon(g, lat, lng, landingKiN);
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (inNorth && (chk(fA.cd1, fA.cd2, fA.cd8) || chk(fA.cd1, fA.cd7, fA.cd8))) {
    height.push({ val: mathSinnyu(g, fA.cd25, fA.cd5, latLng, FUKUOKA_HEIGHT_A_N), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const st = STR_TO_SURFACE[d.str] ?? "outer_horizontal";
  return { surfaceType: st, heightM: d.val };
}

/**
 * 福岡空港の高さ制限を計算する
 */
export function calculateFukuokaRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(FUKUOKA_REFERENCE_POINT.lat, FUKUOKA_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= FUKUOKA_HORIZ_RADIUS) {
      result = calcFukuokaHorizontalSurface(g, point);
    } else if (distance <= FUKUOKA_CONICAL_RADIUS) {
      if (isPointInPolygon(g, lat, lng, landingKiE)) {
        result = calcFukuokaConicalSurface(g, point, distance);
      } else {
        result = { surfaceType: "conical", heightM: mathEnsuiFukuoka(distance) };
      }
    } else if (distance <= FUKUOKA_OUTER_RADIUS) {
      result = calcFukuokaOuterHorizontalSurface(g, point, lat, lng);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "fukuoka",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

/** 松山: ポリゴン内に点が含まれるか */
function isMatsuyamaPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(g, lat, lng, path.map((c) => ({ lat: c.lat, lng: c.lng })));
}

/** 松山: 水平表面ゾーン（半径3500m以内） */
function calcMatsuyamaHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd12, mM.cd14, mM.cd20, mM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    height.push({ val: mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([mM.cd11, mM.cd12, mM.cd18, mM.cd17])) {
    height.push({
      val: mathTennia(g, mM.cd13, mM.cd19, MATSUYAMA_HEIGHT_1, MATSUYAMA_HEIGHT_2, latLng, MATSUYAMA_LENGTH, MATSUYAMA_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd14, mM.cd15, mM.cd21, mM.cd20])) {
    height.push({
      val: mathTennia(g, mM.cd13, mM.cd19, MATSUYAMA_HEIGHT_1, MATSUYAMA_HEIGHT_2, latLng, MATSUYAMA_LENGTH, MATSUYAMA_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd07, mM.cd12, mM.cd11])) {
    const hm0 = mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1);
    height.push({ val: mathTennib(g, mM.cd13, mM.cd12, mM.cd12, mM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd08, mM.cd15, mM.cd14])) {
    const hm0 = mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1);
    height.push({ val: mathTennib(g, mM.cd13, mM.cd14, mM.cd14, mM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd17, mM.cd18, mM.cd24])) {
    const hm0 = mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2);
    height.push({ val: mathTennib(g, mM.cd19, mM.cd18, mM.cd18, mM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mM.cd20, mM.cd21, mM.cd25])) {
    const hm0 = mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2);
    height.push({ val: mathTennib(g, mM.cd19, mM.cd20, mM.cd20, mM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14]) || inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([mM.cd12, mM.cd14, mM.cd20, mM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 松山: 円錐表面ゾーン（3500m超〜16500m） */
function calcMatsuyamaConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    MATSUYAMA_REF_HEIGHT + MATSUYAMA_HORIZ_HEIGHT + (distance - MATSUYAMA_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd05, latLng, MATSUYAMA_HEIGHT_1), str: "進入表面" });
  }
  if (inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    height.push({ val: mathSinnyu(g, mM.cd19, mM.cd27, latLng, MATSUYAMA_HEIGHT_2), str: "進入表面" });
  }
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([mM.cd12, mM.cd04, mM.cd06, mM.cd14]) || inPoly([mM.cd18, mM.cd20, mM.cd28, mM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 松山: 外側水平表面ゾーン（16500m超〜24000m） */
function calcMatsuyamaOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = MATSUYAMA_REF_HEIGHT + MATSUYAMA_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isMatsuyamaPointInPolygon(g, lat, lng, path);

  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    height.push({ val: mathSinnyu(g, mM.cd13, mM.cd02, latLng, MATSUYAMA_HEIGHT_1), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mM.cd04, mM.cd06, mM.cd03, mM.cd01])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 松山空港の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= MATSUYAMA_HORIZ_RADIUS) {
      result = calcMatsuyamaHorizontalSurface(g, point, lat, lng);
    } else if (distance <= MATSUYAMA_CONICAL_RADIUS) {
      result = calcMatsuyamaConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= MATSUYAMA_OUTER_RADIUS) {
      result = calcMatsuyamaOuterHorizontalSurface(g, point, lat, lng);
    }

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

/** 仙台: ポリゴン内に点が含まれるか */
function isSendaiPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: Coord[]
): boolean {
  return isPointInPolygon(g, lat, lng, path.map((c) => ({ lat: c.lat, lng: c.lng })));
}

/** 仙台: 水平表面ゾーン（半径4000m以内） */
function calcSendaiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = SENDAI_REF_HEIGHT + SENDAI_HORIZ_HEIGHT;

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([sA.cd07, sA.cd09, sA.cd14, sA.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sA.cd06, sA.cd07, sA.cd12, sA.cd11]) || inPoly([sA.cd09, sA.cd10, sA.cd15, sA.cd14])) {
    height.push({
      val: mathTennia(g, sA.cd08, sA.cd13, SENDAI_HEIGHT_A_1, SENDAI_HEIGHT_A_2, latLng, SENDAI_LENGTH_A, SENDAI_WIDTH_A),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd04, sA.cd07, sA.cd06])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd08, sA.cd02, sA.cd07, sA.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd05, sA.cd10, sA.cd09])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd08, sA.cd02, sA.cd09, sA.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd11, sA.cd12, sA.cd16])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd13, sA.cd19, sA.cd12, sA.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sA.cd14, sA.cd15, sA.cd17])) {
    const hm0 = mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A);
    height.push({ val: mathTennib(g, sA.cd13, sA.cd19, sA.cd14, sA.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (inPoly([sB.cd07, sB.cd09, sB.cd14, sB.cd12])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "進入表面" });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([sB.cd06, sB.cd07, sB.cd12, sB.cd11]) || inPoly([sB.cd09, sB.cd10, sB.cd15, sB.cd14])) {
    height.push({
      val: mathTennia(g, sB.cd08, sB.cd13, SENDAI_HEIGHT_B_1, SENDAI_HEIGHT_B_2, latLng, SENDAI_LENGTH_B, SENDAI_WIDTH_B),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd04, sB.cd07, sB.cd06])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd08, sB.cd02, sB.cd07, sB.cd01, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd05, sB.cd10, sB.cd09])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd08, sB.cd02, sB.cd09, sB.cd03, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd11, sB.cd12, sB.cd16])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd13, sB.cd19, sB.cd12, sB.cd18, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([sB.cd14, sB.cd15, sB.cd17])) {
    const hm0 = mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B);
    height.push({ val: mathTennib(g, sB.cd13, sB.cd19, sB.cd14, sB.cd20, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09]) || inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18]) ||
    inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09]) || inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])
  ) {
    reStr = "進入表面";
  }
  if (inPoly([sA.cd07, sA.cd09, sA.cd14, sA.cd12]) || inPoly([sB.cd07, sB.cd09, sB.cd14, sB.cd12])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 仙台: 円錐表面ゾーン（4000m超〜16500m） */
function calcSendaiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    SENDAI_REF_HEIGHT + SENDAI_HORIZ_HEIGHT + (distance - SENDAI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  if (inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd08, sA.cd02, latLng, SENDAI_HEIGHT_A_1, SENDAI_PITCH_A), str: "進入表面" });
  }
  if (inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sA.cd13, sA.cd19, latLng, SENDAI_HEIGHT_A_2, SENDAI_PITCH_A), str: "進入表面" });
  }
  if (inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd08, sB.cd02, latLng, SENDAI_HEIGHT_B_1, SENDAI_PITCH_B), str: "進入表面" });
  }
  if (inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd19, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "進入表面" });
  }
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  } else if (
    inPoly([sA.cd07, sA.cd01, sA.cd03, sA.cd09]) || inPoly([sA.cd12, sA.cd14, sA.cd20, sA.cd18]) ||
    inPoly([sB.cd07, sB.cd01, sB.cd03, sB.cd09]) || inPoly([sB.cd12, sB.cd14, sB.cd20, sB.cd18])
  ) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 仙台: 外側水平表面ゾーン（16500m超〜24000m） */
function calcSendaiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = SENDAI_REF_HEIGHT + SENDAI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: Coord[]) => isSendaiPointInPolygon(g, lat, lng, path);

  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    height.push({ val: mathSinnyuWithPitch(g, sB.cd13, sB.cd22, latLng, SENDAI_HEIGHT_B_2, SENDAI_PITCH_B), str: "延長進入表面" });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([sB.cd18, sB.cd20, sB.cd23, sB.cd21])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
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

/** 八尾: 水平表面ゾーン（半径2000m以内）※八尾は水平表面のみ */
function calcYaoHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
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

  height.push({ val: horizHeight, str: hSuiheiStr });
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

    if (distance > YAO_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcYaoHorizontalSurface(g, point, lat, lng);
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

/** 新千歳: 水平表面ゾーン（半径4000m以内）※新千歳は水平表面のみ */
function calcShinchitoseHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = SHINCHITOSE_REF_HEIGHT + SHINCHITOSE_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isShinchitosePointInPolygon(g, lat, lng, path);

  // A滑走路
  if (inPoly([scA.cd12, scA.cd14, scA.cd20, scA.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([scA.cd12, scA.cd04, scA.cd06, scA.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd18, scA.cd20, scA.cd28, scA.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scA.cd11, scA.cd12, scA.cd18, scA.cd17])) {
    height.push({
      val: mathTennia(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd14, scA.cd15, scA.cd21, scA.cd20])) {
    height.push({
      val: mathTennia(
        g,
        scA.cd13,
        scA.cd19,
        SHINCHITOSE_HEIGHT_A_1,
        SHINCHITOSE_HEIGHT_A_2,
        latLng,
        SHINCHITOSE_LENGTH_A,
        SHINCHITOSE_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd07, scA.cd12, scA.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd13, scA.cd05, scA.cd12, scA.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd08, scA.cd15, scA.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd13, scA.cd05, latLng, SHINCHITOSE_HEIGHT_A_1, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd13, scA.cd05, scA.cd14, scA.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd17, scA.cd18, scA.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd19, scA.cd27, scA.cd18, scA.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scA.cd20, scA.cd21, scA.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, scA.cd19, scA.cd27, latLng, SHINCHITOSE_HEIGHT_A_2, SHINCHITOSE_PITCH_A);
    height.push({
      val: mathTennib(g, scA.cd19, scA.cd27, scA.cd20, scA.cd28, latLng, hm0),
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
      val: mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd18, scB.cd20, scB.cd28, scB.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([scB.cd11, scB.cd12, scB.cd18, scB.cd17])) {
    height.push({
      val: mathTennia(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd14, scB.cd15, scB.cd21, scB.cd20])) {
    height.push({
      val: mathTennia(
        g,
        scB.cd13,
        scB.cd19,
        SHINCHITOSE_HEIGHT_B_1,
        SHINCHITOSE_HEIGHT_B_2,
        latLng,
        SHINCHITOSE_LENGTH_B,
        SHINCHITOSE_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd07, scB.cd12, scB.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd13, scB.cd05, scB.cd12, scB.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd08, scB.cd15, scB.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd13, scB.cd05, latLng, SHINCHITOSE_HEIGHT_B_1, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd13, scB.cd05, scB.cd14, scB.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd17, scB.cd18, scB.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd19, scB.cd27, scB.cd18, scB.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([scB.cd20, scB.cd21, scB.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, scB.cd19, scB.cd27, latLng, SHINCHITOSE_HEIGHT_B_2, SHINCHITOSE_PITCH_B);
    height.push({
      val: mathTennib(g, scB.cd19, scB.cd27, scB.cd20, scB.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
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
 * 新千歳空港の高さ制限を計算する
 * 新千歳は水平表面のみ（半径4000m）。円錐・外側水平表面なし。
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

    if (distance > SHINCHITOSE_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcShinchitoseHorizontalSurface(g, point, lat, lng);
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

/** 函館: 水平表面ゾーン（半径4000m以内） */
function calcHakodateHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([hM.cd11, hM.cd12, hM.cd18, hM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd14, hM.cd15, hM.cd21, hM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        hM.cd13,
        hM.cd19,
        HAKODATE_HEIGHT_1,
        HAKODATE_HEIGHT_2,
        latLng,
        HAKODATE_LENGTH,
        HAKODATE_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd07, hM.cd12, hM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd13, hM.cd12, hM.cd12, hM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd08, hM.cd15, hM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd13, hM.cd14, hM.cd14, hM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd17, hM.cd18, hM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd19, hM.cd18, hM.cd18, hM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([hM.cd20, hM.cd21, hM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH);
    height.push({ val: mathTennib(g, hM.cd19, hM.cd20, hM.cd20, hM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) || inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([hM.cd12, hM.cd14, hM.cd20, hM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 函館: 円錐表面ゾーン（4000m超〜16500m） */
function calcHakodateConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    HAKODATE_REF_HEIGHT + HAKODATE_HORIZ_HEIGHT + (distance - HAKODATE_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd05, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd19, hM.cd27, latLng, HAKODATE_HEIGHT_2, HAKODATE_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  } else if (inPoly([hM.cd12, hM.cd04, hM.cd06, hM.cd14]) || inPoly([hM.cd18, hM.cd20, hM.cd28, hM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 函館: 外側水平表面ゾーン（16500m超〜24000m） */
function calcHakodateOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = HAKODATE_REF_HEIGHT + HAKODATE_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isHakodatePointInPolygon(g, lat, lng, path);

  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, hM.cd13, hM.cd02, latLng, HAKODATE_HEIGHT_1, HAKODATE_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([hM.cd04, hM.cd06, hM.cd03, hM.cd01])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 函館空港の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= HAKODATE_HORIZ_RADIUS) {
      result = calcHakodateHorizontalSurface(g, point, lat, lng);
    } else if (distance <= HAKODATE_CONICAL_RADIUS) {
      result = calcHakodateConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= HAKODATE_OUTER_RADIUS) {
      result = calcHakodateOuterHorizontalSurface(g, point, lat, lng);
    }

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

/** 宮崎: 水平表面ゾーン（半径3500m以内） */
function calcMiyazakiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([mzM.cd11, mzM.cd12, mzM.cd18, mzM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd14, mzM.cd15, mzM.cd21, mzM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        mzM.cd13,
        mzM.cd19,
        MIYAZAKI_HEIGHT_1,
        MIYAZAKI_HEIGHT_2,
        latLng,
        MIYAZAKI_LENGTH,
        MIYAZAKI_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd07, mzM.cd12, mzM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd13, mzM.cd12, mzM.cd12, mzM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd08, mzM.cd15, mzM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd13, mzM.cd14, mzM.cd14, mzM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd17, mzM.cd18, mzM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd19, mzM.cd18, mzM.cd18, mzM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([mzM.cd20, mzM.cd21, mzM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH);
    height.push({ val: mathTennib(g, mzM.cd19, mzM.cd20, mzM.cd20, mzM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]) || inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([mzM.cd12, mzM.cd14, mzM.cd20, mzM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 宮崎: 円錐表面ゾーン（3500m超〜16500m） */
function calcMiyazakiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    MIYAZAKI_REF_HEIGHT + MIYAZAKI_HORIZ_HEIGHT + (distance - MIYAZAKI_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd13, mzM.cd05, latLng, MIYAZAKI_HEIGHT_1, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd27, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([mzM.cd12, mzM.cd04, mzM.cd06, mzM.cd14]) || inPoly([mzM.cd18, mzM.cd20, mzM.cd28, mzM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 宮崎: 外側水平表面ゾーン（16500m超〜24000m） */
function calcMiyazakiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = MIYAZAKI_REF_HEIGHT + MIYAZAKI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isMiyazakiPointInPolygon(g, lat, lng, path);

  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, mzM.cd19, mzM.cd30, latLng, MIYAZAKI_HEIGHT_2, MIYAZAKI_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([mzM.cd26, mzM.cd28, mzM.cd31, mzM.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 宮崎空港の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= MIYAZAKI_HORIZ_RADIUS) {
      result = calcMiyazakiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= MIYAZAKI_CONICAL_RADIUS) {
      result = calcMiyazakiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= MIYAZAKI_OUTER_RADIUS) {
      result = calcMiyazakiOuterHorizontalSurface(g, point, lat, lng);
    }

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

/** 伊丹: 円錐表面の高さ計算 math_ensui */
function mathEnsuiItami(kyori: number): number {
  return ITAMI_REF_HEIGHT + (kyori - ITAMI_HORIZ_RADIUS) * (1 / 50) + ITAMI_HORIZ_HEIGHT;
}

/** 伊丹: 水平表面ゾーン（半径4000m以内） */
function calcItamiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = ITAMI_REF_HEIGHT + ITAMI_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  // A滑走路
  if (chk(itMp.cd3, itMp.cd4, itMp.cd5) || chk(itMp.cd4, itMp.cd5, itMp.cd6)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(itMp.cd1, itMp.cd2, itMp.cd3) || chk(itMp.cd2, itMp.cd3, itMp.cd4)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd5, itMp.cd6, itMp.cd7) || chk(itMp.cd6, itMp.cd7, itMp.cd8)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd4, itMp.cd22, itMp.cd6) || chk(itMp.cd22, itMp.cd6, itMp.cd24)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.ac_n,
        itExmp.ac_s,
        ITAMI_HEIGHT_A_N,
        ITAMI_HEIGHT_A_S,
        latLng,
        ITAMI_LENGTH_A,
        ITAMI_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd4, itMp.cd22, itMp.cd20)) {
    const hm0 = mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N);
    height.push({
      val: mathTennib(g, itExmp.ac_n, itExmp.as_n, itMp.cd4, itMp.cd20, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd3, itMp.cd19, itMp.cd21)) {
    const hm0 = mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N);
    height.push({
      val: mathTennib(g, itExmp.ac_n, itExmp.as_n, itMp.cd3, itMp.cd19, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd21, itMp.cd3, itMp.cd23) || chk(itMp.cd3, itMp.cd23, itMp.cd5)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.ac_n,
        itExmp.ac_s,
        ITAMI_HEIGHT_A_N,
        ITAMI_HEIGHT_A_S,
        latLng,
        ITAMI_LENGTH_A,
        ITAMI_WIDTH_A
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd6, itMp.cd24, itMp.cd26)) {
    const hm0 = mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S);
    height.push({
      val: mathTennib(g, itExmp.ac_s, itExmp.as_s, itMp.cd6, itMp.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd5, itMp.cd23, itMp.cd25)) {
    const hm0 = mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S);
    height.push({
      val: mathTennib(g, itExmp.ac_s, itExmp.as_s, itMp.cd5, itMp.cd25, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  // B滑走路
  if (chk(itMp.cd11, itMp.cd12, itMp.cd13) || chk(itMp.cd12, itMp.cd13, itMp.cd14)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(itMp.cd9, itMp.cd10, itMp.cd11) || chk(itMp.cd10, itMp.cd11, itMp.cd12)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd13, itMp.cd14, itMp.cd15) || chk(itMp.cd14, itMp.cd15, itMp.cd16)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(itMp.cd12, itMp.cd30, itMp.cd14) || chk(itMp.cd30, itMp.cd14, itMp.cd32)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.bc_n,
        itExmp.bc_s,
        ITAMI_HEIGHT_B_N,
        ITAMI_HEIGHT_B_S,
        latLng,
        ITAMI_LENGTH_B,
        ITAMI_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd28, itMp.cd12, itMp.cd30)) {
    const hm0 = mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N);
    height.push({
      val: mathTennib(g, itExmp.bc_n, itExmp.bs_n, itMp.cd12, itMp.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd27, itMp.cd11, itMp.cd29)) {
    const hm0 = mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N);
    height.push({
      val: mathTennib(g, itExmp.bc_n, itExmp.bs_n, itMp.cd11, itMp.cd27, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd29, itMp.cd11, itMp.cd31) || chk(itMp.cd11, itMp.cd31, itMp.cd13)) {
    height.push({
      val: mathTennia(
        g,
        itExmp.bc_n,
        itExmp.bc_s,
        ITAMI_HEIGHT_B_N,
        ITAMI_HEIGHT_B_S,
        latLng,
        ITAMI_LENGTH_B,
        ITAMI_WIDTH_B
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd14, itMp.cd32, itMp.cd34)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd14, itMp.cd34, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(itMp.cd13, itMp.cd31, itMp.cd33)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd13, itMp.cd33, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 伊丹: 円錐表面ゾーン（4000m超〜16500m） */
function calcItamiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight = mathEnsuiItami(distance);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(itMp.cd1, itMp.cd2, itMp.cd3) || chk(itMp.cd2, itMp.cd3, itMp.cd4)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_n, itExmp.as_n, latLng, ITAMI_HEIGHT_A_N),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd5, itMp.cd6, itMp.cd7) || chk(itMp.cd6, itMp.cd7, itMp.cd8)) {
    height.push({
      val: mathSinnyu(g, itExmp.ac_s, itExmp.as_s, latLng, ITAMI_HEIGHT_A_S),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd9, itMp.cd10, itMp.cd11) || chk(itMp.cd10, itMp.cd11, itMp.cd12)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_n, itExmp.bs_n, latLng, ITAMI_HEIGHT_B_N),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd13, itMp.cd14, itMp.cd15) || chk(itMp.cd14, itMp.cd15, itMp.cd16)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S),
      str: "進入表面",
    });
  }
  if (chk(itMp.cd15, itMp.cd16, itMp.cd17) || chk(itMp.cd16, itMp.cd17, itMp.cd18)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.be_s, latLng, ITAMI_HEIGHT_B_S),
      str: "延長進入表面",
    });
  }
  if (chk(itMp.cd14, itMp.cd32, itMp.cd34)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd14, itMp.cd34, latLng, hm0),
      str: "転移表面",
    });
  }
  if (chk(itMp.cd13, itMp.cd31, itMp.cd33)) {
    const hm0 = mathSinnyu(g, itExmp.bc_s, itExmp.bs_s, latLng, ITAMI_HEIGHT_B_S);
    height.push({
      val: mathTennib(g, itExmp.bc_s, itExmp.bs_s, itMp.cd13, itMp.cd33, latLng, hm0),
      str: "転移表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 伊丹: 外側水平表面ゾーン（16500m超〜24000m） */
function calcItamiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = ITAMI_REF_HEIGHT + ITAMI_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(itMp.cd15, itMp.cd16, itMp.cd17) || chk(itMp.cd16, itMp.cd17, itMp.cd18)) {
    height.push({
      val: mathSinnyu(g, itExmp.bc_s, itExmp.be_s, latLng, ITAMI_HEIGHT_B_S),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  const reStr = d.str;
  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 伊丹空港の高さ制限を計算する
 */
export function calculateItamiRestriction(
  lat: number,
  lng: number,
  gmaps: typeof google.maps
): AirportRestrictionResult {
  try {
    if (!gmaps?.geometry) {
      return { items: [], error: true };
    }
    const g = gmaps;
    const ref = new g.LatLng(ITAMI_REFERENCE_POINT.lat, ITAMI_REFERENCE_POINT.lng);
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (
      distance <= ITAMI_HORIZ_RADIUS &&
      isPointInPolygon(g, lat, lng, itamiS_surface_s)
    ) {
      result = calcItamiHorizontalSurface(g, point);
    } else if (
      distance > ITAMI_HORIZ_RADIUS &&
      distance <= ITAMI_CONICAL_RADIUS &&
      isPointInPolygon(g, lat, lng, itamiLandingKi)
    ) {
      result = calcItamiConicalSurface(g, point, distance);
    } else if (
      distance > ITAMI_CONICAL_RADIUS &&
      distance <= ITAMI_OUTER_RADIUS &&
      isPointInPolygon(g, lat, lng, itamiLandingKi_s)
    ) {
      result = calcItamiOuterHorizontalSurface(g, point);
    }

    if (!result) {
      return { items: [] };
    }

    const item: AirportRestrictionItem = {
      airportId: "itami",
      surfaceType: result.surfaceType,
      heightM: result.heightM,
    };
    return { items: [item] };
  } catch {
    return { items: [], error: true };
  }
}

function isCentrairPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 中部国際: 水平表面ゾーン（半径4000m以内） */
function calcCentrairHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT;

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd12, cM.cd14, cM.cd20, cM.cd18])) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (inPoly([cM.cd11, cM.cd12, cM.cd18, cM.cd17])) {
    height.push({
      val: mathTennia(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd14, cM.cd15, cM.cd21, cM.cd20])) {
    height.push({
      val: mathTennia(
        g,
        cM.cd13,
        cM.cd19,
        CENTRAIR_HEIGHT_1,
        CENTRAIR_HEIGHT_2,
        latLng,
        CENTRAIR_LENGTH,
        CENTRAIR_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd07, cM.cd12, cM.cd11])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd13, cM.cd12, cM.cd12, cM.cd04, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd08, cM.cd15, cM.cd14])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd13, cM.cd14, cM.cd14, cM.cd06, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd17, cM.cd18, cM.cd24])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd19, cM.cd18, cM.cd18, cM.cd26, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }
  if (inPoly([cM.cd20, cM.cd21, cM.cd25])) {
    const hm0 = mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH);
    height.push({ val: mathTennib(g, cM.cd19, cM.cd20, cM.cd20, cM.cd28, latLng, hm0), str: "転移表面" });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14]) || inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    reStr = "進入表面";
  }
  if (inPoly([cM.cd12, cM.cd14, cM.cd20, cM.cd18])) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 中部国際: 円錐表面ゾーン（4000m超〜16500m） */
function calcCentrairConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  distance: number,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const conicalHeight =
    CENTRAIR_REF_HEIGHT + CENTRAIR_HORIZ_HEIGHT + (distance - CENTRAIR_HORIZ_RADIUS) * (1 / 50);
  const height: HeightEntry[] = [{ val: conicalHeight, str: "円錐表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd05, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd27, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "進入表面",
    });
  }
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  } else if (inPoly([cM.cd12, cM.cd04, cM.cd06, cM.cd14]) || inPoly([cM.cd18, cM.cd20, cM.cd28, cM.cd26])) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 中部国際: 外側水平表面ゾーン（16500m超〜24000m） */
function calcCentrairOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const outerHeight = CENTRAIR_REF_HEIGHT + CENTRAIR_OUTER_HEIGHT;
  const height: HeightEntry[] = [{ val: outerHeight, str: "外側水平表面" }];

  const inPoly = (path: { lat: number; lng: number }[]) =>
    isCentrairPointInPolygon(g, lat, lng, path);

  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd13, cM.cd02, latLng, CENTRAIR_HEIGHT_1, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }
  if (inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    height.push({
      val: mathSinnyuWithPitch(g, cM.cd19, cM.cd30, latLng, CENTRAIR_HEIGHT_2, CENTRAIR_PITCH),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inPoly([cM.cd04, cM.cd06, cM.cd03, cM.cd01]) || inPoly([cM.cd26, cM.cd28, cM.cd31, cM.cd29])) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 中部国際空港（セントレア）の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= CENTRAIR_HORIZ_RADIUS) {
      result = calcCentrairHorizontalSurface(g, point, lat, lng);
    } else if (distance <= CENTRAIR_CONICAL_RADIUS) {
      result = calcCentrairConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= CENTRAIR_OUTER_RADIUS) {
      result = calcCentrairOuterHorizontalSurface(g, point, lat, lng);
    }

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

function isNiigataPointInPolygon(
  g: typeof google.maps,
  lat: number,
  lng: number,
  path: { lat: number; lng: number }[]
): boolean {
  return isPointInPolygon(g, lat, lng, path);
}

/** 新潟: 水平表面ゾーン（半径3500m以内）※新潟は水平表面のみ */
function calcNiigataHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
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

  height.push({ val: horizHeight, str: hSuiheiStr });
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

    if (distance > NIIGATA_HORIZ_RADIUS) {
      return { items: [] };
    }

    const result = calcNiigataHorizontalSurface(g, point, lat, lng);
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

/** 長崎: 円錐表面の高さ計算 */
function mathEnsuiNagasaki(kyori: number): number {
  return NAGASAKI_REF_HEIGHT + (kyori - NAGASAKI_HORIZ_RADIUS) * (1 / 50) + NAGASAKI_HORIZ_HEIGHT;
}

/** 長崎: 水平表面ゾーン（半径4000m以内） */
function calcNagasakiHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = NAGASAKI_REF_HEIGHT + NAGASAKI_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(m.cd21, m.cd22, m.cd23) || chk(m.cd22, m.cd23, m.cd24)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height.push({
      val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(m.cd22, m.cd18, m.cd24) || chk(m.cd18, m.cd24, m.cd20)) {
    height.push({
      val: mathTennia(g, m.cd25, m.cd26, NAGASAKI_HEIGHT_N, NAGASAKI_HEIGHT_S, latLng, NAGASAKI_LENGTH, NAGASAKI_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd14, m.cd18, m.cd22)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd22, m.cd14, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd20, m.cd24, m.cd16)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd24, m.cd16, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(m.cd21, m.cd17, m.cd23) || chk(m.cd17, m.cd23, m.cd19)) {
    height.push({
      val: mathTennia(g, m.cd25, m.cd26, NAGASAKI_HEIGHT_N, NAGASAKI_HEIGHT_S, latLng, NAGASAKI_LENGTH, NAGASAKI_WIDTH),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd13, m.cd17, m.cd21)) {
    const hm0 = mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N);
    height.push({
      val: mathTennibHei(g, m.cd25, m.cd11, m.cd21, m.cd13, latLng, hm0, m.cd21, m.cd22),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd15, m.cd19, m.cd23)) {
    const hm0 = mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S);
    height.push({
      val: mathTennibHei(g, m.cd26, m.cd12, m.cd23, m.cd15, latLng, hm0, m.cd23, m.cd24),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    reStr = "延長進入表面";
  } else if (
    chk(m.cd7, m.cd8, m.cd22) ||
    chk(m.cd7, m.cd22, m.cd21) ||
    chk(m.cd9, m.cd10, m.cd23) ||
    chk(m.cd10, m.cd23, m.cd24)
  ) {
    reStr = "進入表面";
  }
  if (chk(m.cd21, m.cd22, m.cd23) || chk(m.cd22, m.cd23, m.cd24)) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 長崎: 円錐表面ゾーン（landingKiE ポリゴン内、4000m超〜16500m） */
function calcNagasakiConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiNagasaki(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(m.cd7, m.cd8, m.cd22) || chk(m.cd7, m.cd22, m.cd21)) {
    height.push({
      val: mathSinnyu(g, m.cd25, m.cd11, latLng, NAGASAKI_HEIGHT_N),
      str: "進入表面",
    });
  }
  if (chk(m.cd9, m.cd10, m.cd23) || chk(m.cd10, m.cd23, m.cd24)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd12, latLng, NAGASAKI_HEIGHT_S),
      str: "進入表面",
    });
  }
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    height.push({
      val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4)) {
    reStr = "延長進入表面";
  } else if (
    chk(m.cd7, m.cd8, m.cd22) ||
    chk(m.cd7, m.cd22, m.cd21) ||
    chk(m.cd9, m.cd10, m.cd23) ||
    chk(m.cd10, m.cd23, m.cd24)
  ) {
    reStr = "進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 長崎: 外側水平表面ゾーン（16500m超〜24000m） */
function calcNagasakiOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  lat: number,
  lng: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const m = ngsMp;
  const height: HeightEntry[] = [{ val: NAGASAKI_OUTER_HEIGHT, str: "外側水平表面" }];

  const inSouth = isPointInPolygon(g, lat, lng, ngsLandingKiS);
  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (inSouth) {
    const sinS1 = chk(m.cd9, m.cd10, m.cd3);
    const sinS2 = chk(m.cd10, m.cd3, m.cd4);
    if (sinS1 || sinS2) {
      height.push({
        val: mathSinnyu(g, m.cd26, m.cd6, latLng, NAGASAKI_HEIGHT_S),
        str: "延長進入表面",
      });
    }
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (inSouth && (chk(m.cd9, m.cd10, m.cd3) || chk(m.cd10, m.cd3, m.cd4))) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 長崎空港の高さ制限を計算する
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
    } else if (distance <= NAGASAKI_CONICAL_RADIUS) {
      if (isPointInPolygon(g, lat, lng, ngsLandingKiE)) {
        result = calcNagasakiConicalSurface(g, point, distance);
      } else {
        result = { surfaceType: "conical", heightM: mathEnsuiNagasaki(distance) };
      }
    } else if (distance <= NAGASAKI_OUTER_RADIUS) {
      if (isPointInPolygon(g, lat, lng, ngsLandingKiN) || isPointInPolygon(g, lat, lng, ngsLandingKiS)) {
        result = calcNagasakiOuterHorizontalSurface(g, point, lat, lng);
      } else {
        result = { surfaceType: "outer_horizontal", heightM: NAGASAKI_OUTER_HEIGHT };
      }
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

/** 熊本: 円錐表面の高さ計算 */
function mathEnsuiKumamoto(kyori: number): number {
  return (
    KUMAMOTO_REF_HEIGHT +
    (kyori - KUMAMOTO_HORIZ_RADIUS) * (1 / 50) +
    KUMAMOTO_HORIZ_HEIGHT
  );
}

/** 熊本: 水平表面ゾーン（半径4000m以内） */
function calcKumamotoHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [];
  let hSuiheiStr = "水平表面";
  const horizHeight = KUMAMOTO_REF_HEIGHT + KUMAMOTO_HORIZ_HEIGHT;

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd12, p.cd14, p.cd20) || chk(p.cd14, p.cd20, p.cd18)) {
    height.push({ val: 0, str: "着陸帯" });
  }
  if (chk(p.cd12, p.cd04, p.cd06) || chk(p.cd12, p.cd06, p.cd14)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(p.cd18, p.cd20, p.cd28) || chk(p.cd18, p.cd28, p.cd26)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2),
      str: "進入表面",
    });
    hSuiheiStr = "進入表面";
  }
  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
    hSuiheiStr = "延長進入表面";
  }
  if (chk(p.cd11, p.cd12, p.cd18) || chk(p.cd12, p.cd18, p.cd17)) {
    height.push({
      val: mathTennia(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd14, p.cd15, p.cd21) || chk(p.cd15, p.cd21, p.cd20)) {
    height.push({
      val: mathTennia(
        g,
        p.cd13,
        p.cd19,
        KUMAMOTO_HEIGHT_1,
        KUMAMOTO_HEIGHT_2,
        latLng,
        KUMAMOTO_LENGTH,
        KUMAMOTO_WIDTH
      ),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd07, p.cd12, p.cd11)) {
    const hm0 = mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1);
    height.push({
      val: mathTennib(g, p.cd13, p.cd05, p.cd12, p.cd04, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd08, p.cd15, p.cd14)) {
    const hm0 = mathSinnyu(g, p.cd13, p.cd05, latLng, KUMAMOTO_HEIGHT_1);
    height.push({
      val: mathTennib(g, p.cd13, p.cd05, p.cd14, p.cd06, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd17, p.cd18, p.cd24)) {
    const hm0 = mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2);
    height.push({
      val: mathTennib(g, p.cd19, p.cd27, p.cd18, p.cd26, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }
  if (chk(p.cd20, p.cd21, p.cd25)) {
    const hm0 = mathSinnyu(g, p.cd19, p.cd27, latLng, KUMAMOTO_HEIGHT_2);
    height.push({
      val: mathTennib(g, p.cd19, p.cd27, p.cd20, p.cd28, latLng, hm0),
      str: "転移表面",
    });
    hSuiheiStr = "転移表面";
  }

  height.push({ val: horizHeight, str: hSuiheiStr });
  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  } else if (
    chk(p.cd12, p.cd04, p.cd06) ||
    chk(p.cd12, p.cd06, p.cd14) ||
    chk(p.cd18, p.cd20, p.cd28) ||
    chk(p.cd18, p.cd28, p.cd26)
  ) {
    reStr = "進入表面";
  }
  if (chk(p.cd12, p.cd14, p.cd20) || chk(p.cd14, p.cd20, p.cd18)) {
    reStr = "着陸帯";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 熊本: 円錐表面ゾーン（4000m超〜16500m） */
function calcKumamotoConicalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng,
  kyori: number
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [];
  const hEnsui = mathEnsuiKumamoto(kyori);
  height.push({ val: hEnsui, str: "円錐表面" });

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/** 熊本: 外側水平表面ゾーン（16500m超〜24000m） */
function calcKumamotoOuterHorizontalSurface(
  g: typeof google.maps,
  latLng: google.maps.LatLng
): { surfaceType: SurfaceType; heightM: number } | null {
  const p = kmPoints;
  const height: HeightEntry[] = [
    {
      val: KUMAMOTO_REF_HEIGHT + KUMAMOTO_OUTER_HEIGHT,
      str: "外側水平表面",
    },
  ];

  const chk = (p1: Coord, p2: Coord, p3: Coord) => chkInclusion(p1, p2, p3, latLng);

  if (chk(p.cd04, p.cd06, p.cd03) || chk(p.cd04, p.cd03, p.cd01)) {
    height.push({
      val: mathSinnyu(g, p.cd13, p.cd02, latLng, KUMAMOTO_HEIGHT_1),
      str: "延長進入表面",
    });
  }
  if (chk(p.cd26, p.cd28, p.cd31) || chk(p.cd26, p.cd31, p.cd29)) {
    height.push({
      val: mathSinnyu(g, p.cd19, p.cd30, latLng, KUMAMOTO_HEIGHT_2),
      str: "延長進入表面",
    });
  }

  height.sort((a, b) => a.val - b.val);
  const d = height[0];
  let reStr = d.str;
  if (
    chk(p.cd04, p.cd06, p.cd03) ||
    chk(p.cd04, p.cd03, p.cd01) ||
    chk(p.cd26, p.cd28, p.cd31) ||
    chk(p.cd26, p.cd31, p.cd29)
  ) {
    reStr = "延長進入表面";
  }

  const st = STR_TO_SURFACE[reStr];
  return st ? { surfaceType: st, heightM: d.val } : null;
}

/**
 * 熊本空港の高さ制限を計算する
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
    const ref = new g.LatLng(
      KUMAMOTO_REFERENCE_POINT.lat,
      KUMAMOTO_REFERENCE_POINT.lng
    );
    const point = new g.LatLng(lat, lng);
    const distance = g.geometry.spherical.computeDistanceBetween(ref, point);

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= KUMAMOTO_HORIZ_RADIUS) {
      result = calcKumamotoHorizontalSurface(g, point);
    } else if (distance <= KUMAMOTO_CONICAL_RADIUS) {
      result = calcKumamotoConicalSurface(g, point, distance);
    } else if (distance <= KUMAMOTO_OUTER_RADIUS) {
      result = calcKumamotoOuterHorizontalSurface(g, point);
    }

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
 * 仙台空港の高さ制限を計算する
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

    let result: { surfaceType: SurfaceType; heightM: number } | null = null;

    if (distance <= SENDAI_HORIZ_RADIUS) {
      result = calcSendaiHorizontalSurface(g, point, lat, lng);
    } else if (distance <= SENDAI_CONICAL_RADIUS) {
      result = calcSendaiConicalSurface(g, point, distance, lat, lng);
    } else if (distance <= SENDAI_OUTER_RADIUS) {
      result = calcSendaiOuterHorizontalSurface(g, point, lat, lng);
    }

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
    return calculateKansaiRestriction(lat, lng, gmaps);
  }
  if (distToItami <= ITAMI_OUTER_RADIUS) {
    return calculateItamiRestriction(lat, lng, gmaps);
  }
  if (distToCentrair <= CENTRAIR_OUTER_RADIUS) {
    return calculateCentrairRestriction(lat, lng, gmaps);
  }
  if (distToFukuoka <= FUKUOKA_OUTER_RADIUS) {
    return calculateFukuokaRestriction(lat, lng, gmaps);
  }
  if (distToMatsuyama <= MATSUYAMA_OUTER_RADIUS) {
    return calculateMatsuyamaRestriction(lat, lng, gmaps);
  }
  if (distToSendai <= SENDAI_OUTER_RADIUS) {
    return calculateSendaiRestriction(lat, lng, gmaps);
  }
  if (distToYao <= YAO_HORIZ_RADIUS) {
    return calculateYaoRestriction(lat, lng, gmaps);
  }
  if (distToShinchitose <= SHINCHITOSE_HORIZ_RADIUS) {
    return calculateShinchitoseRestriction(lat, lng, gmaps);
  }
  if (distToHakodate <= HAKODATE_OUTER_RADIUS) {
    return calculateHakodateRestriction(lat, lng, gmaps);
  }
  if (distToNiigata <= NIIGATA_HORIZ_RADIUS) {
    return calculateNiigataRestriction(lat, lng, gmaps);
  }
  if (distToNagasaki <= NAGASAKI_OUTER_RADIUS) {
    return calculateNagasakiRestriction(lat, lng, gmaps);
  }
  if (distToKumamoto <= KUMAMOTO_OUTER_RADIUS) {
    return calculateKumamotoRestriction(lat, lng, gmaps);
  }
  if (distToNaha <= NAHA_OUTER_RADIUS) {
    return calculateNahaRestriction(lat, lng, gmaps);
  }
  if (distToMiyazaki <= MIYAZAKI_OUTER_RADIUS) {
    return calculateMiyazakiRestriction(lat, lng, gmaps);
  }
  return { items: [] };
}
