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
