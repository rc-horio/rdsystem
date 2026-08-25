/**
 * 那覇空港 制限表面データ
 * データソース: 那覇空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/naha-airport/
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** CD01〜CD31 を持つ制限表面用座標オブジェクト（cd09, cd10, cd22, cd23 は未使用） */
export type NahaCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16" | "cd17" | "cd18"
  | "cd19" | "cd20" | "cd21" | "cd24" | "cd25" | "cd26" | "cd27" | "cd28"
  | "cd29" | "cd30" | "cd31",
  Coord
>;

/** A滑走路 制限表面座標 (SURFACE_POINTS) */
export const surfacePointsA: NahaCoords = {
  cd01: { lat: 26.3460617722222, lng: 127.662866175 },
  cd02: { lat: 26.34514625, lng: 127.638844983333 },
  cd03: { lat: 26.3442267027778, lng: 127.614824147222 },
  cd04: { lat: 26.2371613055556, lng: 127.649932033333 },
  cd05: { lat: 26.2369322361111, lng: 127.643932333333 },
  cd06: { lat: 26.2367029138889, lng: 127.637932652778 },
  cd07: { lat: 26.2303499388889, lng: 127.649123877778 },
  cd08: { lat: 26.2299775777778, lng: 127.639376591667 },
  cd11: { lat: 26.210064525, lng: 127.650075580556 },
  cd12: { lat: 26.2099357333333, lng: 127.646702352778 },
  cd13: { lat: 26.2098784555556, lng: 127.645202775 },
  cd14: { lat: 26.2098211583333, lng: 127.6437032 },
  cd15: { lat: 26.2096922194444, lng: 127.640329983333 },
  cd16: { lat: 26.1933333333333, lng: 127.639722222222 },
  cd17: { lat: 26.1819300444444, lng: 127.651437211111 },
  cd18: { lat: 26.1817996722222, lng: 127.648022663889 },
  cd19: { lat: 26.1817424055556, lng: 127.646523447222 },
  cd20: { lat: 26.1816851222222, lng: 127.645024230556 },
  cd21: { lat: 26.1815545972222, lng: 127.641609697222 },
  cd24: { lat: 26.161391075, lng: 127.652400041667 },
  cd25: { lat: 26.1610156861111, lng: 127.642574247222 },
  cd26: { lat: 26.1549173305556, lng: 127.653788255556 },
  cd27: { lat: 26.1546883972222, lng: 127.647792758333 },
  cd28: { lat: 26.1544592194444, lng: 127.641797286111 },
  cd29: { lat: 26.0473847777778, lng: 127.676824575 },
  cd30: { lat: 26.0464712722222, lng: 127.652864494444 },
  cd31: { lat: 26.0455537916667, lng: 127.628904763889 },
};

/** B滑走路 制限表面座標 (SURFACE_POINTS2) */
export const surfacePointsB: NahaCoords = {
  cd01: { lat: 26.3397911611111, lng: 127.650025575 },
  cd02: { lat: 26.3388734833333, lng: 127.626005766667 },
  cd03: { lat: 26.3379517777778, lng: 127.601986319444 },
  cd04: { lat: 26.2308893916667, lng: 127.637104138889 },
  cd05: { lat: 26.2306597833333, lng: 127.631104780556 },
  cd06: { lat: 26.2304299222222, lng: 127.625105444444 },
  cd07: { lat: 26.2233301388889, lng: 127.636208141667 },
  cd08: { lat: 26.2229663694444, lng: 127.626708636111 },
  cd11: { lat: 26.2037878583333, lng: 127.637127097222 },
  cd12: { lat: 26.2036634944444, lng: 127.633877619444 },
  cd13: { lat: 26.2036060805556, lng: 127.632378127778 },
  cd14: { lat: 26.20354865, lng: 127.630878638889 },
  cd15: { lat: 26.2034241444444, lng: 127.627629175 },
  cd16: { lat: 26.1933333333333, lng: 127.639722222222 },
  cd17: { lat: 26.17835925, lng: 127.638374977778 },
  cd18: { lat: 26.1782329027778, lng: 127.635073733333 },
  cd19: { lat: 26.1781754972222, lng: 127.633574566667 },
  cd20: { lat: 26.1781180805556, lng: 127.632075402778 },
  cd21: { lat: 26.1779915861111, lng: 127.628774172222 },
  cd24: { lat: 26.1585012083333, lng: 127.639308083333 },
  cd25: { lat: 26.1581336, lng: 127.629708902778 },
  cd26: { lat: 26.1513510527778, lng: 127.640842125 },
  cd27: { lat: 26.1511215805556, lng: 127.634846833333 },
  cd28: { lat: 26.1508918611111, lng: 127.628851566667 },
  cd29: { lat: 26.0438204611111, lng: 127.663889611111 },
  cd30: { lat: 26.0429048083333, lng: 127.639930341667 },
  cd31: { lat: 26.0419851805556, lng: 127.615971425 },
};

/** 空港標点（那覇空港・CD16） */
export const NAHA_REFERENCE_POINT: Coord = {
  lat: 26.1933333333333,
  lng: 127.639722222222,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 3.3;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_A = 3120;
export const WIDTH_OF_LANDING_AREA_A = 300;
export const HEIGHT_OF_LANDING_AREA_A_1 = 3.311;
export const HEIGHT_OF_LANDING_AREA_A_2 = 2.749;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_B = 2820;
export const WIDTH_OF_LANDING_AREA_B = 300;
export const HEIGHT_OF_LANDING_AREA_B_1 = 4.959;
export const HEIGHT_OF_LANDING_AREA_B_2 = 4.259;

/** 進入表面・延長進入表面勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 SURFACE_POINTS CDA〜CDH）
 * 弧の発生と lng/lat フィルタは標点 CD16。パス先頭は CDG。
 * CDC=CDD=CDG、CDF=CDH は公式どおり同一座標。
 * 円錐: right1=CDE, left1=CDB, right2=CDD, left2=CDC, right3=0, left3=0, right12=0
 * 外側水平: right1=CDF, left1=CDA, right2=CDE, left2=CDB, right3=CDD, left3=CDC, right12=CDH
 */
export const interceptPoints = {
  cda: { lat: 26.3986544583333, lng: 127.716400138889 },
  cdb: { lat: 26.3322914, lng: 127.699184602778 },
  cdc: { lat: 26.2427777777778, lng: 127.676111111111 },
  cdd: { lat: 26.2427777777778, lng: 127.676111111111 },
  cde: { lat: 26.097359325, lng: 127.765920438889 },
  cdf: { lat: 26.0355519111111, lng: 127.804168922222 },
  cdg: { lat: 26.2427777777778, lng: 127.676111111111 },
  cdh: { lat: 26.0355519111111, lng: 127.804168922222 },
} as const satisfies Record<string, Coord>;

/** 公式 destinationPoint（地球半径 6371 km） */
function destinationPoint(from: Coord, headingDeg: number, distKm: number): Coord | null {
  const dist = distKm / 6371;
  const brng = (headingDeg * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lon1 = (from.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dist) +
      Math.cos(lat1) * Math.sin(dist) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
      Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2)
    );
  if (Number.isNaN(lat2) || Number.isNaN(lon2)) return null;
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

function sortByLngLat(
  a: Coord,
  b: Coord,
  lngDir: 1 | -1,
  latDir: 1 | -1
): number {
  const alng = Number(a.lng.toFixed(8));
  const blng = Number(b.lng.toFixed(8));
  if (alng < blng) return lngDir;
  if (alng > blng) return -lngDir as 1 | -1;
  const alat = Number(a.lat.toFixed(8));
  const blat = Number(b.lat.toFixed(8));
  if (alat < blat) return latDir;
  if (alat > blat) return -latDir as 1 | -1;
  return 0;
}

/**
 * 那覇公式 GetCirclePaths。6°刻み。
 * 弧の発生とフィルタ基準は標点（CD16）。パス先頭は CDG（_mid）。
 * right3 → right2 → right12 → right1 のあと弧、left1 → left2 → left3。
 */
function getCirclePaths(
  arp: Coord,
  radiusM: number,
  mid: Coord,
  right1: Coord,
  left1: Coord,
  right2: Coord | 0,
  left2: Coord | 0,
  right3: Coord | 0,
  left3: Coord | 0,
  right12: Coord | 0
): Coord[] {
  const paths: Coord[] = [mid];
  if (right3 !== 0) paths.push(right3);
  if (right2 !== 0) paths.push(right2);
  if (right12 !== 0) paths.push(right12);
  paths.push(right1);

  const tmpA: Coord[] = [];
  const tmpB: Coord[] = [];
  const tmpC: Coord[] = [];
  const tmpD1: Coord[] = [];
  const tmpD2: Coord[] = [];
  const tmpD3: Coord[] = [];
  const tmpE: Coord[] = [];
  const tmpF: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let i = 0; i < 360; i += 6) {
    const point = destinationPoint(arp, i, distKm);
    if (!point) continue;
    if (point.lng > arp.lng) {
      if (point.lng <= right1.lng && point.lat <= right1.lat) {
        tmpA.push(point);
      } else if (point.lng < left1.lng && point.lat > left1.lat) {
        tmpF.push(point);
      }
    } else if (point.lng < arp.lng) {
      if (point.lat <= right1.lat) {
        tmpC.push(point);
      } else if (point.lat < arp.lat && point.lat <= left1.lat) {
        tmpD1.push(point);
      } else if (point.lat >= arp.lat && point.lat <= left1.lat) {
        tmpD2.push(point);
      } else if (point.lat >= left1.lat) {
        tmpD3.push(point);
      }
    } else if (point.lat <= right1.lat) {
      tmpB.push(point);
    } else if (point.lat >= left1.lat) {
      tmpE.push(point);
    }
  }

  tmpA.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpB.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpC.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpD1.sort((a, b) => sortByLngLat(a, b, 1, -1));
  tmpD2.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpD3.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpE.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpF.sort((a, b) => sortByLngLat(a, b, -1, -1));

  paths.push(...tmpA, ...tmpB, ...tmpC, ...tmpD1, ...tmpD2, ...tmpD3, ...tmpE, ...tmpF, left1);
  if (left2 !== 0) paths.push(left2);
  if (left3 !== 0) paths.push(left3);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  NAHA_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  0,
  0,
  0
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  NAHA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cdf,
  interceptPoints.cda,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  interceptPoints.cdh
);
