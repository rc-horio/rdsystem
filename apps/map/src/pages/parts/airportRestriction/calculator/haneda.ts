/**
 * 羽田空港 高さ制限計算ロジック
 * データソース: 羽田空港高さ制限回答システム map.js
 * https://secure.kix-ap.ne.jp/haneda-airport/
 */

import type { SurfaceType } from "../types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "../types";
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
} from "../data/haneda";
import type { Coord } from "../data/haneda";
import {
  STR_TO_SURFACE,
  type HeightEntry,
  mathSinnyu,
  mathTennia,
  mathTennib,
  mathEnsui,
  chkInclusion,
  isPointInPolygon,
} from "./shared";

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
