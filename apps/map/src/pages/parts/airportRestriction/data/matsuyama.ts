/**
 * 松山空港 制限表面データ
 * データソース: 松山空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/matsuyama-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（西方向のみ）あり。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** CD01〜CD28 等を持つ制限表面用座標オブジェクト */
export type MatsuyamaCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16" | "cd17" | "cd18"
  | "cd19" | "cd20" | "cd21" | "cd22" | "cd23" | "cd24" | "cd25" | "cd26"
  | "cd27" | "cd28",
  Coord
>;

/** 制限表面座標（公式 SURFACE_POINTS） */
export const surfacePoints: MatsuyamaCoords = {
  cd01: { lat: 33.9394469444444, lng: 132.582808055556 },
  cd02: { lat: 33.9226847222222, lng: 132.565413055556 },
  cd03: { lat: 33.9059788888889, lng: 132.548552222222 },
  cd04: { lat: 33.8565622222222, lng: 132.668531388889 },
  cd05: { lat: 33.8524769444444, lng: 132.664218055556 },
  cd06: { lat: 33.8483388888889, lng: 132.660104722222 },
  cd07: { lat: 33.8513797222222, lng: 132.673883333333 },
  cd08: { lat: 33.8447330555556, lng: 132.667071944444 },
  cd11: { lat: 33.8379891666667, lng: 132.692148333333 },
  cd12: { lat: 33.8358311111111, lng: 132.689936111111 },
  cd13: { lat: 33.8349313888889, lng: 132.688876944444 },
  cd14: { lat: 33.8339127777778, lng: 132.687969722222 },
  cd15: { lat: 33.8317544444444, lng: 132.685757777778 },
  cd16: { lat: 33.8272013888889, lng: 132.699692777778 },
  cd17: { lat: 33.8226322222222, lng: 132.713655 },
  cd18: { lat: 33.8204747222222, lng: 132.7114425 },
  cd19: { lat: 33.8195761111111, lng: 132.710382222222 },
  cd20: { lat: 33.8185566666667, lng: 132.709476111111 },
  cd21: { lat: 33.8163986111111, lng: 132.707263888889 },
  cd22: { lat: 33.8101602777778, lng: 132.731507222222 },
  cd23: { lat: 33.8036044444444, lng: 132.724788333333 },
  cd24: { lat: 33.8096466666667, lng: 132.732328888889 },
  cd25: { lat: 33.8030030555555, lng: 132.725516111111 },
  cd26: { lat: 33.8060369444444, lng: 132.73929 },
  cd27: { lat: 33.8019891666667, lng: 132.734999166667 },
  cd28: { lat: 33.7978177777778, lng: 132.730861944444 },
};

/** 空港標点（CD16） */
export const MATSUYAMA_REFERENCE_POINT: Coord = {
  lat: 33.8272013888889,
  lng: 132.699692777778,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 4.0;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 3500;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 305;

/** 着陸帯: 長(m), 幅(m), 高さ(m) 西端/東端 */
export const LENGTH_OF_LANDING_AREA = 2620;
export const WIDTH_OF_LANDING_AREA = 280;
export const HEIGHT_OF_LANDING_AREA_1 = 8.0; // 西
export const HEIGHT_OF_LANDING_AREA_2 = 5.0; // 東

/** 進入表面・延長進入表面の勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;

/** 延長進入表面の勾配（公式 PITCH_OF_EXTENDED_APPROACH_SURFACE） */
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 SURFACE_POINTS CDA〜CDE）
 * 円錐: center=CDC, right1=CDD, left1=CDB, right2=0, left2=0
 * 外側水平: center=CDC, right1=CDE, left1=CDA, right2=CDD, left2=CDB
 */
export const interceptPoints = {
  cda: { lat: 34.0376963888889, lng: 132.639197777778 },
  cdb: { lat: 33.9742872222222, lng: 132.673457777778 },
  cdc: { lat: 33.7550816666667, lng: 132.792735833333 },
  cdd: { lat: 33.6810763888889, lng: 132.666925555556 },
  cde: { lat: 33.6333330555556, lng: 132.584983055556 },
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
 * 公式 GetCirclePaths。6°刻み。
 * 弧の中心は標点（CD16）。intercept_center はパス先頭の頂点のみ。
 * 公式は経度で CDC と比較せず、標点緯度で tmpA / tmpB に分ける。
 */
function getCirclePaths(
  arp: Coord,
  radiusM: number,
  interceptCenter: Coord,
  right1: Coord,
  left1: Coord,
  right2: Coord | 0,
  left2: Coord | 0
): Coord[] {
  const paths: Coord[] = [interceptCenter];
  if (right2 !== 0) paths.push(right2);
  paths.push(right1);

  const tmpA: Coord[] = [];
  const tmpB: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let i = 0; i < 360; i += 6) {
    const point = destinationPoint(arp, i, distKm);
    if (!point) continue;
    if (point.lng <= right1.lng && point.lat <= arp.lat) {
      tmpA.push(point);
    } else if (point.lat > arp.lat && point.lng <= left1.lng) {
      tmpB.push(point);
    }
  }

  tmpA.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpB.sort((a, b) => sortByLngLat(a, b, -1, -1));

  paths.push(...tmpA, ...tmpB, left1);
  if (left2 !== 0) paths.push(left2);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  MATSUYAMA_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cdc,
  interceptPoints.cdd,
  interceptPoints.cdb,
  0,
  0
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  MATSUYAMA_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdc,
  interceptPoints.cde,
  interceptPoints.cda,
  interceptPoints.cdd,
  interceptPoints.cdb
);
