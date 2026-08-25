/**
 * 宮崎空港 制限表面データ
 * データソース: 宮崎空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/miyazaki-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（南東のみ）あり。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** 制限表面座標 */
export type MiyazakiCoords = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28"
  | "cd29" | "cd30" | "cd31",
  Coord
>;

/** 制限表面座標 */
export const surfacePoints: MiyazakiCoords = {
  cd04: { lat: 31.87926, lng: 131.402525 },
  cd05: { lat: 31.873868, lng: 131.403057 },
  cd06: { lat: 31.868476, lng: 131.403589 },
  cd07: { lat: 31.878856, lng: 131.409815 },
  cd08: { lat: 31.869915, lng: 131.410698 },
  cd11: { lat: 31.8804, lng: 131.434231 },
  cd12: { lat: 31.877486, lng: 131.434518 },
  cd13: { lat: 31.876138, lng: 131.434651 },
  cd14: { lat: 31.87479, lng: 131.434784 },
  cd15: { lat: 31.871876, lng: 131.435072 },
  cd17: { lat: 31.882271, lng: 131.461833 },
  cd18: { lat: 31.879466, lng: 131.46211 },
  cd19: { lat: 31.878118, lng: 131.462243 },
  cd20: { lat: 31.87677, lng: 131.462376 },
  cd21: { lat: 31.873965, lng: 131.462653 },
  cd24: { lat: 31.884158, lng: 131.485294 },
  cd25: { lat: 31.875451, lng: 131.486153 },
  cd26: { lat: 31.88578, lng: 131.493305 },
  cd27: { lat: 31.880388, lng: 131.493837 },
  cd28: { lat: 31.874996, lng: 131.494369 },
  cd29: { lat: 31.911036, lng: 131.618087 },
  cd30: { lat: 31.889468, lng: 131.620215 },
  cd31: { lat: 31.8679, lng: 131.622343 },
};

/** 空港標点 */
export const MIYAZAKI_REFERENCE_POINT: Coord = {
  lat: 31.8770919444444,
  lng: 131.448473055556,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 5.9;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 3500;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 305;

/** 着陸帯: 長(m), 幅(m), 高さ(m) 北西端/南東端 */
export const LENGTH_OF_LANDING_AREA = 2620;
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 4.2; // 北西
export const HEIGHT_OF_LANDING_AREA_2 = 6.105; // 南東

/** 進入表面・延長進入表面の勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 SURFACE_POINTS CD0A〜CD0I, CDB1〜CDB17）
 * 弧の中心は標点 CENTER_POINTS。
 */
export const interceptPoints = {
  cda: { lat: 32.0033327777778, lng: 131.242438888889 },
  cdb: { lat: 31.8469938888889, lng: 131.197413888889 },
  cdc: { lat: 31.8380558333333, lng: 131.280330833333 },
  cdd: { lat: 31.8369438888889, lng: 131.333055833333 },
  cde: { lat: 31.7578108333333, lng: 131.552682777778 },
  cdf: { lat: 31.7287608333333, lng: 131.633185833333 },
  cdg: { lat: 32.0033327777778, lng: 131.654780833333 },
  cdh: { lat: 32.0033327777778, lng: 131.541218888889 },
  cdi: { lat: 32.0033327777778, lng: 131.355999722222 },
} as const satisfies Record<string, Coord>;

/** 公式 GetCirclePaths2 が積む南西弧 CDB1→CDB17 */
export const outerArcPoints: readonly Coord[] = [
  { lat: 31.8386138888889, lng: 131.262221944444 },
  { lat: 31.8367969444444, lng: 131.246777777778 },
  { lat: 31.8365588888889, lng: 131.245553888889 },
  { lat: 31.8362661111111, lng: 131.241983888889 },
  { lat: 31.8361319444444, lng: 131.238401111111 },
  { lat: 31.8361588888889, lng: 131.234815 },
  { lat: 31.8363461111111, lng: 131.231235 },
  { lat: 31.8366919444444, lng: 131.227671111111 },
  { lat: 31.8371969444444, lng: 131.224133888889 },
  { lat: 31.83786, lng: 131.220631944444 },
  { lat: 31.8386780555556, lng: 131.217176111111 },
  { lat: 31.8396488888889, lng: 131.213775 },
  { lat: 31.84077, lng: 131.210438055556 },
  { lat: 31.84204, lng: 131.207173888889 },
  { lat: 31.8434530555556, lng: 131.203993055556 },
  { lat: 31.8450061111111, lng: 131.200903055556 },
  { lat: 31.846695, lng: 131.197911944444 },
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

function sortByLat(a: Coord, b: Coord, dir: 1 | -1): number {
  const alat = Number(a.lat.toFixed(8));
  const blat = Number(b.lat.toFixed(8));
  if (alat < blat) return dir;
  if (alat > blat) return -dir as 1 | -1;
  return 0;
}

/**
 * 宮崎公式 GetCirclePaths1（円錐）。6°刻み。パス先頭は CD0H。
 */
function getCirclePaths1(center: Coord, radiusM: number): Coord[] {
  const h = interceptPoints.cdh;
  const e = interceptPoints.cde;
  const d = interceptPoints.cdd;
  const c = interceptPoints.cdc;
  const i = interceptPoints.cdi;
  const paths: Coord[] = [h];
  const tmpA: Coord[] = [];
  const tmpB: Coord[] = [];
  const tmpC: Coord[] = [];
  const tmpD: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let deg = 0; deg < 360; deg += 6) {
    const point = destinationPoint(center, deg, distKm);
    if (!point) continue;
    if (point.lng >= center.lng) {
      if (point.lat < h.lat && point.lat >= center.lat) {
        tmpA.push(point);
      } else if (point.lat >= e.lat && point.lat < center.lat) {
        tmpB.push(point);
      }
    } else if (point.lng < center.lng) {
      if (point.lat <= i.lat && point.lat >= center.lat) {
        tmpD.push(point);
      } else if (point.lat >= c.lat && point.lat < center.lat) {
        tmpC.push(point);
      }
    }
  }

  tmpA.sort((a, b) => sortByLat(a, b, 1));
  tmpB.sort((a, b) => sortByLat(a, b, 1));
  tmpC.sort((a, b) => sortByLat(a, b, -1));
  tmpD.sort((a, b) => sortByLat(a, b, -1));

  paths.push(...tmpA, ...tmpB, e, d, c, ...tmpC, ...tmpD, i);
  return paths;
}

/**
 * 宮崎公式 GetCirclePaths2（外側水平）。6°刻み。パス先頭は CD0G。
 * F,E,D,C のあと CDB1〜CDB17, CD0B、弧の西半分のあと A,I,H。
 */
function getCirclePaths2(center: Coord, radiusM: number): Coord[] {
  const g = interceptPoints.cdg;
  const f = interceptPoints.cdf;
  const e = interceptPoints.cde;
  const d = interceptPoints.cdd;
  const c = interceptPoints.cdc;
  const b = interceptPoints.cdb;
  const a = interceptPoints.cda;
  const i = interceptPoints.cdi;
  const h = interceptPoints.cdh;
  const paths: Coord[] = [g];
  const tmpA: Coord[] = [];
  const tmpB: Coord[] = [];
  const tmpC: Coord[] = [];
  const tmpD: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let deg = 0; deg < 360; deg += 6) {
    const point = destinationPoint(center, deg, distKm);
    if (!point) continue;
    if (point.lng >= center.lng) {
      if (point.lat < g.lat && point.lat >= center.lat) {
        tmpA.push(point);
      } else if (point.lat >= f.lat && point.lat < center.lat) {
        tmpB.push(point);
      }
    } else if (point.lng < center.lng) {
      if (point.lat <= a.lat && point.lat >= center.lat) {
        tmpD.push(point);
      } else if (point.lat >= b.lat && point.lat < center.lat) {
        tmpC.push(point);
      }
    }
  }

  tmpA.sort((x, y) => sortByLat(x, y, 1));
  tmpB.sort((x, y) => sortByLat(x, y, 1));
  tmpC.sort((x, y) => sortByLat(x, y, -1));
  tmpD.sort((x, y) => sortByLat(x, y, -1));

  paths.push(
    ...tmpA,
    ...tmpB,
    f,
    e,
    d,
    c,
    ...outerArcPoints,
    b,
    ...tmpC,
    ...tmpD,
    a,
    i,
    h
  );
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths1(
  MIYAZAKI_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths2(
  MIYAZAKI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE
);
