import type { AirportRestrictionItem, AirportRestrictionResult, SurfaceType } from "../types";
import type { Coord } from "../data/nagasaki";
import {
  mp as ngsMp,
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_RADIUS,
  HEIGHT_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ_HEIGHT,
  HEIGHT_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_HEIGHT,
  LENGTH_OF_LANDING_AREA as NAGASAKI_LENGTH,
  WIDTH_OF_LANDING_AREA as NAGASAKI_WIDTH,
  HEIGHT_OF_LANDING_AREA_N as NAGASAKI_HEIGHT_N,
  HEIGHT_OF_LANDING_AREA_S as NAGASAKI_HEIGHT_S,
  landingKiE as ngsLandingKiE,
  landingKiN as ngsLandingKiN,
  landingKiS as ngsLandingKiS,
} from "../data/nagasaki";
import {
  STR_TO_SURFACE,
  mathSinnyu,
  mathTennibHei,
  chkInclusion,
  isPointInPolygon,
} from "./shared";
import type { HeightEntry } from "./shared";

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
