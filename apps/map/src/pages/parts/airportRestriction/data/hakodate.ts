/**
 * 函館空港 制限表面データ
 * データソース: 函館空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/hakodate-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面あり。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** 制限表面座標 */
export type HakodateCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16" | "cd17" | "cd18"
  | "cd19" | "cd20" | "cd21" | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** 制限表面座標 */
export const surfacePoints: HakodateCoords = {
  cd01: { lat: 41.83680544, lng: 140.6415008 },
  cd02: { lat: 41.81622713, lng: 140.6325427 },
  cd03: { lat: 41.79571654, lng: 140.6236244 },
  cd04: { lat: 41.78801123, lng: 140.7721106 },
  cd05: { lat: 41.78287436, lng: 140.7698771 },
  cd06: { lat: 41.77773746, lng: 140.7676437 },
  cd07: { lat: 41.78617878, lng: 140.777006 },
  cd08: { lat: 41.77706071, lng: 140.773042 },
  cd11: { lat: 41.77885117, lng: 140.8060755 },
  cd12: { lat: 41.77579472, lng: 140.8047467 },
  cd13: { lat: 41.7745105, lng: 140.8041884 },
  cd14: { lat: 41.77322611, lng: 140.80363 },
  cd15: { lat: 41.77016966, lng: 140.8023013 },
  cd16: { lat: 41.77, lng: 140.821944 },
  cd17: { lat: 41.7690793, lng: 140.8412921 },
  cd18: { lat: 41.76709583, lng: 140.8404289 },
  cd19: { lat: 41.76581176, lng: 140.83987 },
  cd20: { lat: 41.7645275, lng: 140.8393111 },
  cd21: { lat: 41.76254404, lng: 140.8384479 },
  cd24: { lat: 41.76460704, lng: 140.8602778 },
  cd25: { lat: 41.75778851, lng: 140.8573103 },
  cd26: { lat: 41.76258457, lng: 140.8764076 },
  cd27: { lat: 41.75744829, lng: 140.8741724 },
  cd28: { lat: 41.75231198, lng: 140.8719375 },
};

/** 空港標点（CD16） */
export const HAKODATE_REFERENCE_POINT: Coord = {
  lat: 41.77,
  lng: 140.821944,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 34.1;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** 着陸帯: 長(m), 幅(m), 高さ(m) 北西端/南東端 */
export const LENGTH_OF_LANDING_AREA = 3120;
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 28.1; // 北西
export const HEIGHT_OF_LANDING_AREA_2 = 46.0; // 南東

/** 進入表面・延長進入表面の勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;

/** 延長進入表面の勾配（公式 PITCH_OF_EXTENDED_APPROACH_SURFACE） */
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き用座標（公式 SURFACE_POINTS の CDA〜CDE）
 * 公式は真円ではなく GetCirclePaths(CDA〜CDE) で切ったポリゴン。
 */
export const interceptPoints = {
  cda: { lat: 41.675015, lng: 141.081201 },
  cdb: { lat: 41.716905, lng: 141.007279 },
  cdc: { lat: 41.8025, lng: 140.85555555555555 },
  cdd: { lat: 41.87083333333333, lng: 140.6761111111111 },
  cde: { lat: 41.90222222222222, lng: 140.59333333333333 },
} as const satisfies Record<string, Coord>;

/** 公式 map.bundle.js の destinationPoint（地球半径 6371 km） */
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

/**
 * 公式 GetCirclePaths。関西版と違い 5° 刻みで、弧点を間引かずそのまま積む。
 * 第3引数 _center は標点ではなく intercept_center（CDC）。
 * 経度が CDC と一致する分岐は公式が `point.push(point)` になっており、実質スキップ。
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

  const distKm = radiusM / 1000;
  for (let i = 0; i < 360; i += 5) {
    const point = destinationPoint(arp, i, distKm);
    if (!point) continue;
    if (point.lng > interceptCenter.lng) {
      if (point.lng <= right1.lng && point.lat <= right1.lat) {
        paths.push(point);
      }
    } else if (point.lng < interceptCenter.lng) {
      if (point.lat <= left1.lat) {
        paths.push(point);
      }
    }
  }

  paths.push(left1);
  if (left2 !== 0) paths.push(left2);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m, CDC / CDB / CDD） */
export const conicalCutPath: Coord[] = getCirclePaths(
  HAKODATE_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cdc,
  interceptPoints.cdb,
  interceptPoints.cdd,
  0,
  0
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m, CDC / CDA / CDE / CDB / CDD） */
export const outerCutPath: Coord[] = getCirclePaths(
  HAKODATE_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdc,
  interceptPoints.cda,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd
);
