/**
 * 熊本空港 制限表面データ
 * データソース: 熊本空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/kumamoto-airport/
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** 制限表面座標 (SURFACE_POINTS) */
export type KumamotoCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16" | "cd17" | "cd18"
  | "cd19" | "cd20" | "cd21" | "cd24" | "cd25" | "cd26" | "cd27" | "cd28"
  | "cd29" | "cd30" | "cd31",
  Coord
>;

/** 制限表面座標 */
export const surfacePoints: KumamotoCoords = {
  cd01: { lat: 32.7926705555556, lng: 130.684345583333 },
  cd02: { lat: 32.7731357222222, lng: 130.695375111111 },
  cd03: { lat: 32.7535998333333, lng: 130.706399805556 },
  cd04: { lat: 32.8245488055556, lng: 130.808301222222 },
  cd05: { lat: 32.8196624722222, lng: 130.811053277778 },
  cd06: { lat: 32.8147760555556, lng: 130.813805055556 },
  cd07: { lat: 32.8252712777778, lng: 130.811117083333 },
  cd08: { lat: 32.8161641944444, lng: 130.81624575 },
  cd11: { lat: 32.8356093611111, lng: 130.837553333333 },
  cd12: { lat: 32.8324992222222, lng: 130.839304055556 },
  cd13: { lat: 32.8312774722222, lng: 130.839991722222 },
  cd14: { lat: 32.8300557222222, lng: 130.840679388889 },
  cd15: { lat: 32.8269455277778, lng: 130.842429888889 },
  cd16: { lat: 32.8372597222222, lng: 130.855152633333 },
  cd17: { lat: 32.8469656944444, lng: 130.868061722222 },
  cd18: { lat: 32.8445718888889, lng: 130.869408361111 },
  cd19: { lat: 32.8433499722222, lng: 130.87009575 },
  cd20: { lat: 32.8421280555556, lng: 130.870783083333 },
  cd21: { lat: 32.8397342222222, lng: 130.872129583333 },
  cd24: { lat: 32.8552547777778, lng: 130.888223444444 },
  cd25: { lat: 32.8476806666667, lng: 130.892482361111 },
  cd26: { lat: 32.8598395833333, lng: 130.89630125 },
  cd27: { lat: 32.8549513055556, lng: 130.899049583333 },
  cd28: { lat: 32.850063, lng: 130.901797638889 },
  cd29: { lat: 32.8598395833333, lng: 130.89630125 },
  cd30: { lat: 32.8549513055556, lng: 130.899049583333 },
  cd31: { lat: 32.850063, lng: 130.901797638889 },
};

/** 空港標点（cd16） */
export const KUMAMOTO_REFERENCE_POINT: Coord = {
  lat: 32.8372597222222,
  lng: 130.855152633333,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 192.7;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** 着陸帯: 長(m), 幅(m), 西端高さ(m), 東端高さ(m) */
export const LENGTH_OF_LANDING_AREA = 3120;
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 183.15; // 西
export const HEIGHT_OF_LANDING_AREA_2 = 195.72; // 東

/** 進入表面・延長進入表面勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 SURFACE_POINTS CDA〜CDG, CD101〜CD116）
 * 弧の中心・フィルタ基準は標点 CD16。パス先頭は CDG。
 * 円錐: right1=CDE, left1=CDB, right2=CDE, left2=CDB, right3=CDD, left3=CDC
 * 外側水平: right1=CDF, left1=CDA, right2=CDE, left2=CDB, right3=CDD, left3=CDC
 */
export const interceptPoints = {
  cda: { lat: 33.0530735, lng: 130.877088472222 },
  cdb: { lat: 32.9855795, lng: 130.871257472222 },
  cdc: { lat: 32.8000443888889, lng: 131.025694166667 },
  cdd: { lat: 32.7730997777778, lng: 130.909038888889 },
  cde: { lat: 32.6950518333333, lng: 130.907097777778 },
  cdf: { lat: 32.62505975, lng: 130.905433472222 },
  cdg: { lat: 32.7730997777778, lng: 130.909038888889 },
} as const satisfies Record<string, Coord>;

/** 公式が GetCirclePaths 末尾に積む北東弧（円錐半径上） */
export const conicalArcPoints: readonly Coord[] = [
  { lat: 32.982399775503346, lng: 130.89193159102155 },
  { lat: 32.97837328243799, lng: 130.90981432924664 },
  { lat: 32.97279839278414, lng: 130.92709532285337 },
  { lat: 32.96573647252, lng: 130.94358448347631 },
  { lat: 32.95726523947, lng: 130.95910055736738 },
  { lat: 32.947477896555654, lng: 130.9734731373166 },
  { lat: 32.93648209344931, lng: 130.98654454751806 },
  { lat: 32.92439872877234, lng: 130.9981715799582 },
  { lat: 32.911360606775915, lng: 131.00822706293215 },
  { lat: 32.897510964050134, lng: 131.01660124455222 },
  { lat: 32.883001883207235, lng: 131.02320297655467 },
  { lat: 32.86799261166331, lng: 131.02796068628706 },
  { lat: 32.85264780459015, lng: 131.03082312743055 },
  { lat: 32.83713571181922, lng: 131.03175990272624 },
  { lat: 32.8216263289503, lng: 131.03076175469897 },
  { lat: 32.80628953315036, lng: 131.0278406230591 },
];

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
 * 熊本公式 GetCirclePaths。6°刻み。
 * 弧の発生と lng/lat フィルタの基準は標点（CD16）。パス先頭は CDG。
 * left2 のあと CD101〜CD116 を積み、最後に left3。
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
  cerPoints: readonly Coord[]
): Coord[] {
  const paths: Coord[] = [mid];
  if (right3 !== 0) paths.push(right3);
  if (right2 !== 0) paths.push(right2);
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
  paths.push(...cerPoints);
  if (left3 !== 0) paths.push(left3);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  conicalArcPoints
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cdf,
  interceptPoints.cda,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  conicalArcPoints
);
