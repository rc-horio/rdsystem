/**
 * 成田空港 制限表面データ
 * データソース: 成田空港高さ制限回答システム constants.js / index.bundle.js
 * https://secure.kix-ap.ne.jp/narita-airport/Temporary/index.html
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** CD01〜CD31 を持つ制限表面用座標オブジェクト */
export type NaritaCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd17" | "cd18" | "cd19"
  | "cd20" | "cd21" | "cd24" | "cd25" | "cd26" | "cd27" | "cd28"
  | "cd29" | "cd30" | "cd31",
  Coord
>;

/** A滑走路 制限表面座標 */
export const surfacePointsA: NaritaCoords = {
  cd01: { lat: 35.9022944444444, lng: 140.306496944444 },
  cd02: { lat: 35.8913002777778, lng: 140.283601944444 },
  cd03: { lat: 35.8803002777778, lng: 140.260712777778 },
  cd04: { lat: 35.8008911111111, lng: 140.356814722222 },
  cd05: { lat: 35.798145, lng: 140.351096111111 },
  cd06: { lat: 35.7953988888889, lng: 140.345377777778 },
  cd07: { lat: 35.7951863888889, lng: 140.359641111111 },
  cd08: { lat: 35.7906211111111, lng: 140.350135 },
  cd11: { lat: 35.7770258333333, lng: 140.372476111111 },
  cd12: { lat: 35.7755366666667, lng: 140.369374166667 },
  cd13: { lat: 35.7748502777778, lng: 140.367945 },
  cd14: { lat: 35.7741638888889, lng: 140.366515833333 },
  cd15: { lat: 35.7726741666667, lng: 140.363414166667 },
  cd17: { lat: 35.7449327777778, lng: 140.395398333333 },
  cd18: { lat: 35.74354, lng: 140.392497222222 },
  cd19: { lat: 35.7428538888889, lng: 140.391068333333 },
  cd20: { lat: 35.7421677777778, lng: 140.389639722222 },
  cd21: { lat: 35.740775, lng: 140.386738888889 },
  cd24: { lat: 35.7281388888889, lng: 140.407803888889 },
  cd25: { lat: 35.7237833333333, lng: 140.398731944444 },
  cd26: { lat: 35.7222969444444, lng: 140.413608333333 },
  cd27: { lat: 35.7195533333333, lng: 140.407893611111 },
  cd28: { lat: 35.7168094444444, lng: 140.402179722222 },
  cd29: { lat: 35.6372872222222, lng: 140.497949722222 },
  cd30: { lat: 35.6263252777778, lng: 140.475103888889 },
  cd31: { lat: 35.6153613888889, lng: 140.452265 },
};

/** C滑走路 制限表面座標 */
export const surfacePointsC: NaritaCoords = {
  cd01: { lat: 35.934485, lng: 140.319170833333 },
  cd02: { lat: 35.9221186111111, lng: 140.293401388889 },
  cd03: { lat: 35.9097463888889, lng: 140.267640555556 },
  cd04: { lat: 35.8317044444444, lng: 140.366630833333 },
  cd05: { lat: 35.8289591666667, lng: 140.360909722222 },
  cd06: { lat: 35.8262133333333, lng: 140.355188611111 },
  cd07: { lat: 35.82528, lng: 140.369593055556 },
  cd08: { lat: 35.8209905555556, lng: 140.360654444444 },
  cd11: { lat: 35.8074472222222, lng: 140.381480277778 },
  cd12: { lat: 35.8060061111111, lng: 140.378477222222 },
  cd13: { lat: 35.8056630555556, lng: 140.3777625 },
  cd14: { lat: 35.80532, lng: 140.3770475 },
  cd15: { lat: 35.8038788888889, lng: 140.374044444444 },
  cd17: { lat: 35.7870355555556, lng: 140.396056111111 },
  cd18: { lat: 35.7856591666667, lng: 140.393187222222 },
  cd19: { lat: 35.7853161111111, lng: 140.3924725 },
  cd20: { lat: 35.7849730555556, lng: 140.3917575 },
  cd21: { lat: 35.7835963888889, lng: 140.388888611111 },
  cd24: { lat: 35.7706808333333, lng: 140.408839166667 },
  cd25: { lat: 35.7665536111111, lng: 140.400237777778 },
  cd26: { lat: 35.7647583333333, lng: 140.415025 },
  cd27: { lat: 35.7620147222222, lng: 140.409306944444 },
  cd28: { lat: 35.7592713888889, lng: 140.403589166667 },
  cd29: { lat: 35.6811183333333, lng: 140.502262222222 },
  cd30: { lat: 35.6687891666667, lng: 140.476548333333 },
  cd31: { lat: 35.6564536111111, lng: 140.450840555556 },
};

/** 空港標点（成田空港） */
export const NARITA_REFERENCE_POINT: Coord = {
  lat: 35.7652777777778,
  lng: 140.385555555556,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 41.0;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m) */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_A = 4120;
export const WIDTH_OF_LANDING_AREA_A = 300;
export const HEIGHT_OF_LANDING_AREA_A_1 = 39.5;
export const HEIGHT_OF_LANDING_AREA_A_2 = 42.5;

/** C滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_C = 2620;
export const WIDTH_OF_LANDING_AREA_C = 150;
export const HEIGHT_OF_LANDING_AREA_C_1 = 41.0;
export const HEIGHT_OF_LANDING_AREA_C_2 = 43.0;
