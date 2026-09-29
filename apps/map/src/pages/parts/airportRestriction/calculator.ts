import type { SurfaceType } from "./types";
import type { AirportRestrictionResult, AirportRestrictionItem } from "./types";
import {
  HANEDA_REFERENCE_POINT,
  OUTER_HORIZONTAL_SURFACE_RADIUS_M,
} from "./data/haneda";
import { calculateHanedaRestriction } from "./calculator/haneda";
export { calculateHanedaRestriction };

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
  NAHA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_RADIUS,
} from "./data/naha";
import { calculateNahaRestriction } from "./calculator/naha";
export { calculateNahaRestriction };

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
  YAO_REFERENCE_POINT,
  YAO_SURFACE_EXTENT_M,
} from "./data/yao";
import { calculateYaoRestriction } from "./calculator/yao";
export { calculateYaoRestriction };

import {
  SHINCHITOSE_REFERENCE_POINT,
  SHINCHITOSE_SURFACE_EXTENT_M,
} from "./data/shinchitose";
import { calculateShinchitoseRestriction } from "./calculator/shinchitose";
export { calculateShinchitoseRestriction };

import {
  HAKODATE_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_RADIUS,
} from "./data/hakodate";
import { calculateHakodateRestriction } from "./calculator/hakodate";
export { calculateHakodateRestriction };

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
  NIIGATA_REFERENCE_POINT,
  NIIGATA_SURFACE_EXTENT_M,
} from "./data/niigata";
import { calculateNiigataRestriction } from "./calculator/niigata";
export { calculateNiigataRestriction };

import {
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_RADIUS,
} from "./data/centrair";
import { calculateCentrairRestriction } from "./calculator/centrair";
export { calculateCentrairRestriction };

import {
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_RADIUS,
} from "./data/nagasaki";
import { calculateNagasakiRestriction } from "./calculator/nagasaki";
export { calculateNagasakiRestriction };

import {
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_RADIUS,
} from "./data/kumamoto";
import { calculateKumamotoRestriction } from "./calculator/kumamoto";
export { calculateKumamotoRestriction };

import {
  STR_TO_SURFACE,
  decimalsAddition,
  decimalsSubstract,
  decimalsMultiplication,
  hakodateApproachHeight,
  hakodateTransQuadHeight,
  hakodateTransTriHeight,
  isPointInPolygon,
  pickSendaiSurfaceName,
} from "./calculator/shared";
import type { HeightEntry } from "./calculator/shared";

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
