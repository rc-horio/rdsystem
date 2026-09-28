import {
  calculateAirportRestriction,
  calculateCentrairRestriction,
  calculateFukuokaRestriction,
  calculateHakodateRestriction,
  calculateHanedaRestriction,
  calculateItamiRestriction,
  calculateKansaiRestriction,
  calculateKumamotoRestriction,
  calculateMatsuyamaRestriction,
  calculateMiyazakiRestriction,
  calculateNagasakiRestriction,
  calculateNahaRestriction,
  calculateNaritaRestriction,
  calculateNiigataRestriction,
  calculateSendaiRestriction,
  calculateShinchitoseRestriction,
  calculateYaoRestriction,
} from "../src/pages/parts/airportRestriction/calculator.ts";
import {
  HANEDA_REFERENCE_POINT,
  OUTER_HORIZONTAL_SURFACE_RADIUS_M as HANEDA_OUTER,
} from "../src/pages/parts/airportRestriction/data/haneda.ts";
import {
  NARITA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER,
} from "../src/pages/parts/airportRestriction/data/narita.ts";
import {
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KANSAI_OUTER,
} from "../src/pages/parts/airportRestriction/data/kansai.ts";
import {
  ITAMI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as ITAMI_OUTER,
} from "../src/pages/parts/airportRestriction/data/itami.ts";
import {
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as CENTRAIR_OUTER,
} from "../src/pages/parts/airportRestriction/data/centrair.ts";
import {
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER,
} from "../src/pages/parts/airportRestriction/data/fukuoka.ts";
import {
  MATSUYAMA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER,
} from "../src/pages/parts/airportRestriction/data/matsuyama.ts";
import {
  SENDAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as SENDAI_OUTER,
} from "../src/pages/parts/airportRestriction/data/sendai.ts";
import {
  YAO_REFERENCE_POINT,
  YAO_SURFACE_EXTENT_M,
} from "../src/pages/parts/airportRestriction/data/yao.ts";
import {
  SHINCHITOSE_REFERENCE_POINT,
  SHINCHITOSE_SURFACE_EXTENT_M,
} from "../src/pages/parts/airportRestriction/data/shinchitose.ts";
import {
  HAKODATE_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as HAKODATE_OUTER,
} from "../src/pages/parts/airportRestriction/data/hakodate.ts";
import {
  NIIGATA_REFERENCE_POINT,
  NIIGATA_SURFACE_EXTENT_M,
} from "../src/pages/parts/airportRestriction/data/niigata.ts";
import {
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER,
} from "../src/pages/parts/airportRestriction/data/nagasaki.ts";
import {
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER,
} from "../src/pages/parts/airportRestriction/data/kumamoto.ts";
import {
  NAHA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER,
} from "../src/pages/parts/airportRestriction/data/naha.ts";
import {
  MIYAZAKI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER,
} from "../src/pages/parts/airportRestriction/data/miyazaki.ts";
import type { AirportRestrictionResult } from "../src/pages/parts/airportRestriction/types.ts";

type Fn = (
  lat: number,
  lng: number,
  gmaps: typeof google.maps
) => AirportRestrictionResult;

const airports: { id: string; lat: number; lng: number; outerM: number; fn: Fn }[] = [
  { id: "haneda", ...HANEDA_REFERENCE_POINT, outerM: HANEDA_OUTER, fn: calculateHanedaRestriction },
  { id: "narita", ...NARITA_REFERENCE_POINT, outerM: NARITA_OUTER, fn: calculateNaritaRestriction },
  { id: "kansai", ...KANSAI_REFERENCE_POINT, outerM: KANSAI_OUTER, fn: calculateKansaiRestriction },
  { id: "itami", ...ITAMI_REFERENCE_POINT, outerM: ITAMI_OUTER, fn: calculateItamiRestriction },
  { id: "centrair", ...CENTRAIR_REFERENCE_POINT, outerM: CENTRAIR_OUTER, fn: calculateCentrairRestriction },
  { id: "fukuoka", ...FUKUOKA_REFERENCE_POINT, outerM: FUKUOKA_OUTER, fn: calculateFukuokaRestriction },
  { id: "matsuyama", ...MATSUYAMA_REFERENCE_POINT, outerM: MATSUYAMA_OUTER, fn: calculateMatsuyamaRestriction },
  { id: "sendai", ...SENDAI_REFERENCE_POINT, outerM: SENDAI_OUTER, fn: calculateSendaiRestriction },
  { id: "yao", ...YAO_REFERENCE_POINT, outerM: YAO_SURFACE_EXTENT_M, fn: calculateYaoRestriction },
  {
    id: "shinchitose",
    ...SHINCHITOSE_REFERENCE_POINT,
    outerM: SHINCHITOSE_SURFACE_EXTENT_M,
    fn: calculateShinchitoseRestriction,
  },
  { id: "hakodate", ...HAKODATE_REFERENCE_POINT, outerM: HAKODATE_OUTER, fn: calculateHakodateRestriction },
  { id: "niigata", ...NIIGATA_REFERENCE_POINT, outerM: NIIGATA_SURFACE_EXTENT_M, fn: calculateNiigataRestriction },
  { id: "nagasaki", ...NAGASAKI_REFERENCE_POINT, outerM: NAGASAKI_OUTER, fn: calculateNagasakiRestriction },
  { id: "kumamoto", ...KUMAMOTO_REFERENCE_POINT, outerM: KUMAMOTO_OUTER, fn: calculateKumamotoRestriction },
  { id: "naha", ...NAHA_REFERENCE_POINT, outerM: NAHA_OUTER, fn: calculateNahaRestriction },
  { id: "miyazaki", ...MIYAZAKI_REFERENCE_POINT, outerM: MIYAZAKI_OUTER, fn: calculateMiyazakiRestriction },
];

function snap(result: AirportRestrictionResult) {
  return {
    error: result.error === true,
    itemCount: result.items.length,
    items: result.items.map((item) => ({
      airportId: item.airportId,
      surfaceType: item.surfaceType,
      heightM: item.heightM,
    })),
  };
}

function recordRestrictionBaseline() {
  const g = google.maps;
  const cases: unknown[] = [];

  const add = (
    kind: "dispatcher" | "direct",
    id: string,
    place: string,
    lat: number,
    lng: number,
    fn?: Fn
  ) => {
    const result = fn ? fn(lat, lng, g) : calculateAirportRestriction(lat, lng, g);
    cases.push({ kind, id, place, lat, lng, ...snap(result) });
  };

  const offsetNorth = (lat: number, lng: number, distanceM: number) => {
    const point = g.geometry.spherical.computeOffset(new g.LatLng(lat, lng), distanceM, 0);
    return { lat: point.lat(), lng: point.lng() };
  };

  for (const airport of airports) {
    const boundary = offsetNorth(airport.lat, airport.lng, airport.outerM);
    const beyond = offsetNorth(airport.lat, airport.lng, airport.outerM + 1000);
    const places = [
      { place: "reference", lat: airport.lat, lng: airport.lng },
      { place: "outer-boundary", ...boundary },
      { place: "beyond-outer", ...beyond },
    ];
    for (const place of places) {
      add("dispatcher", airport.id, place.place, place.lat, place.lng);
      add("direct", airport.id, place.place, place.lat, place.lng, airport.fn);
    }
  }

  add("dispatcher", "none", "far", 20, 140);

  return cases;
}

(
  window as unknown as { recordRestrictionBaseline: typeof recordRestrictionBaseline }
).recordRestrictionBaseline = recordRestrictionBaseline;
