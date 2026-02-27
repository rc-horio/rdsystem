/**
 * 中部国際空港（セントレア） 制限表面データ
 * データソース: 中部国際空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/centrair/Temporary/index.html
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（北西・南東の2方向）あり。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** 制限表面座標 */
export type CentrairCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16" | "cd17" | "cd18"
  | "cd19" | "cd20" | "cd21" | "cd22" | "cd23" | "cd24" | "cd25" | "cd26"
  | "cd27" | "cd28" | "cd29" | "cd30" | "cd31",
  Coord
>;

/** 制限表面座標 */
export const surfacePoints: CentrairCoords = {
  cd01: { lat: 35.0112680555556, lng: 136.795393005556 },
  cd02: { lat: 35.0070582333333, lng: 136.769600086111 },
  cd03: { lat: 35.0028429444444, lng: 136.743809866667 },
  cd04: { lat: 34.9020013944444, lng: 136.801605841667 },
  cd05: { lat: 34.9009498194444, lng: 136.795165819444 },
  cd06: { lat: 34.8998978944444, lng: 136.788725955556 },
  cd07: { lat: 34.8951721527778, lng: 136.801993580556 },
  cd08: { lat: 34.8934632, lng: 136.791529475 },
  cd11: { lat: 34.87523625, lng: 136.806536241667 },
  cd12: { lat: 34.8746843638889, lng: 136.803156275 },
  cd13: { lat: 34.8744215166667, lng: 136.801546780556 },
  cd14: { lat: 34.8741586583333, lng: 136.799937297222 },
  cd15: { lat: 34.8736065805556, lng: 136.796557408333 },
  cd16: { lat: 34.8584158805556, lng: 136.805394605556 },
  cd17: { lat: 34.8432244833333, lng: 136.814228533333 },
  cd18: { lat: 34.8426728055556, lng: 136.810849808333 },
  cd19: { lat: 34.8424100722222, lng: 136.809240911111 },
  cd20: { lat: 34.8421473111111, lng: 136.807632025 },
  cd21: { lat: 34.8415954583333, lng: 136.8042534 },
  cd22: { lat: 34.8241584527778, lng: 136.8190478 },
  cd23: { lat: 34.8224541388889, lng: 136.808611555556 },
  cd24: { lat: 34.8233667083333, lng: 136.819247880556 },
  cd25: { lat: 34.821659275, lng: 136.808792480556 },
  cd26: { lat: 34.8169312, lng: 136.822046358333 },
  cd27: { lat: 34.8158807222222, lng: 136.815612672222 },
  cd28: { lat: 34.8148299138889, lng: 136.809179166667 },
  cd29: { lat: 34.7139529888889, lng: 136.866762405556 },
  cd30: { lat: 34.7097586083333, lng: 136.841058244444 },
  cd31: { lat: 34.7055588194444, lng: 136.815356722222 },
};

/** 空港標点（CD16） */
export const CENTRAIR_REFERENCE_POINT: Coord = {
  lat: 34.8584158805556,
  lng: 136.805394605556,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 3.79;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** 着陸帯: 長(m), 幅(m), 高さ(m) 北西端/南東端 */
export const LENGTH_OF_LANDING_AREA = 3620;
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 5; // 北西
export const HEIGHT_OF_LANDING_AREA_2 = 5; // 南東

/** 進入表面・延長進入表面の勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;
