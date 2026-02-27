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
