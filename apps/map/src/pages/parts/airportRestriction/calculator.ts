/**
 * 空港高さ制限計算
 * 羽田は calculator/haneda.ts に分離
 */

import type { AirportRestrictionResult } from "./types";
import { HANEDA_REFERENCE_POINT, OUTER_HORIZONTAL_SURFACE_RADIUS_M } from "./data/haneda";
import { calculateHanedaRestriction } from "./calculator/haneda";
export { calculateHanedaRestriction } from "./calculator/haneda";
import { calculateNaritaRestriction } from "./calculator/narita";
export { calculateNaritaRestriction } from "./calculator/narita";
import { NARITA_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER_RADIUS } from "./data/narita";
import { calculateKansaiRestriction } from "./calculator/kansai";
export { calculateKansaiRestriction } from "./calculator/kansai";
import { KANSAI_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER_RADIUS } from "./data/kansai";
import { calculateNahaRestriction } from "./calculator/naha";
export { calculateNahaRestriction } from "./calculator/naha";
import { NAHA_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER_RADIUS } from "./data/naha";
import { calculateFukuokaRestriction } from "./calculator/fukuoka";
export { calculateFukuokaRestriction } from "./calculator/fukuoka";
import { FUKUOKA_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER_RADIUS } from "./data/fukuoka";
import { calculateMatsuyamaRestriction } from "./calculator/matsuyama";
export { calculateMatsuyamaRestriction } from "./calculator/matsuyama";
import { MATSUYAMA_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER_RADIUS } from "./data/matsuyama";
import { calculateSendaiRestriction } from "./calculator/sendai";
export { calculateSendaiRestriction } from "./calculator/sendai";
import { SENDAI_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER_RADIUS } from "./data/sendai";
import { calculateYaoRestriction } from "./calculator/yao";
export { calculateYaoRestriction } from "./calculator/yao";
import { YAO_REFERENCE_POINT, RADIUS_OF_HORIZONTAL_SURFACE as YAO_HORIZ_RADIUS } from "./data/yao";
import { calculateShinchitoseRestriction } from "./calculator/shinchitose";
export { calculateShinchitoseRestriction } from "./calculator/shinchitose";
import { SHINCHITOSE_REFERENCE_POINT, RADIUS_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ_RADIUS } from "./data/shinchitose";
import { calculateHakodateRestriction } from "./calculator/hakodate";
export { calculateHakodateRestriction } from "./calculator/hakodate";
import { HAKODATE_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER_RADIUS } from "./data/hakodate";
import { calculateMiyazakiRestriction } from "./calculator/miyazaki";
export { calculateMiyazakiRestriction } from "./calculator/miyazaki";
import { MIYAZAKI_REFERENCE_POINT, RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER_RADIUS } from "./data/miyazaki";
import { calculateItamiRestriction } from "./calculator/itami";
export { calculateItamiRestriction } from "./calculator/itami";
import {
  ITAMI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER_RADIUS,
} from "./data/itami";
import { calculateNiigataRestriction } from "./calculator/niigata";
export { calculateNiigataRestriction } from "./calculator/niigata";
import {
  NIIGATA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ_RADIUS,
} from "./data/niigata";
import { calculateCentrairRestriction } from "./calculator/centrair";
export { calculateCentrairRestriction } from "./calculator/centrair";
import {
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER_RADIUS,
} from "./data/centrair";
import { calculateNagasakiRestriction } from "./calculator/nagasaki";
export { calculateNagasakiRestriction } from "./calculator/nagasaki";
import {
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER_RADIUS,
} from "./data/nagasaki";
import { calculateKumamotoRestriction } from "./calculator/kumamoto";
export { calculateKumamotoRestriction } from "./calculator/kumamoto";
import {
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER_RADIUS,
} from "./data/kumamoto";

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
