/**
 * 松山空港 制限表面データ
 * データソース: 松山空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/matsuyama-airport/
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

/** 制限表面座標 */
export const surfacePoints: MatsuyamaCoords = {
  cd01: { lat: 33.9391161111111, lng: 132.582333888889 },
  cd02: { lat: 33.9226848611111, lng: 132.565413333333 },
  cd03: { lat: 33.9062536111111, lng: 132.548492777778 },
  cd04: { lat: 33.8565891666667, lng: 132.668428611111 },
  cd05: { lat: 33.8524772222222, lng: 132.664218194444 },
  cd06: { lat: 33.8483652777778, lng: 132.660007777778 },
  cd07: { lat: 33.8501611111111, lng: 132.675111388889 },
  cd08: { lat: 33.84386, lng: 132.668646944444 },
  cd11: { lat: 33.837947, lng: 132.691964 },
  cd12: { lat: 33.8359588888889, lng: 132.68993 },
  cd13: { lat: 33.8349313888889, lng: 132.688876944444 },
  cd14: { lat: 33.8339036111111, lng: 132.687823611111 },
  cd15: { lat: 33.831923, lng: 132.68579 },
  cd16: { lat: 33.8272013888889, lng: 132.699692777778 },
  cd17: { lat: 33.8227613888889, lng: 132.713647777778 },
  cd18: { lat: 33.8206036111111, lng: 132.711435555556 },
  cd19: { lat: 33.8195761111111, lng: 132.710382222222 },
  cd20: { lat: 33.8185483333333, lng: 132.709328888889 },
  cd21: { lat: 33.8163905555556, lng: 132.707116666667 },
  cd22: { lat: 33.8101602777778, lng: 132.731507222222 },
  cd23: { lat: 33.8036044444444, lng: 132.724788333333 },
  cd24: { lat: 33.810019, lng: 132.731731 },
  cd25: { lat: 33.8034636111111, lng: 132.724986388889 },
  cd26: { lat: 33.8060980555556, lng: 132.739214722222 },
  cd27: { lat: 33.8019894444444, lng: 132.734999305556 },
  cd28: { lat: 33.7978808333333, lng: 132.730783888889 },
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
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 8.0; // 西
export const HEIGHT_OF_LANDING_AREA_2 = 5.0; // 東
