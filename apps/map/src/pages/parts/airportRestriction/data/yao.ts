/**
 * 八尾空港 制限表面データ
 * データソース: 八尾空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/yao-airport/
 *
 * 八尾空港は水平表面のみ（半径2000m）。円錐表面・外側水平表面はなし。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** A滑走路 制限表面座標 */
export type YaoCoordsA = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** B滑走路 制限表面座標 */
export type YaoCoordsB = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** A滑走路 制限表面座標 */
export const runwayA: YaoCoordsA = {
  cd04: { lat: 34.5973653333333, lng: 135.555834472222 },
  cd05: { lat: 34.5939904722222, lng: 135.5560745 },
  cd06: { lat: 34.5906156388889, lng: 135.556314527778 },
  cd07: { lat: 34.5966775555556, lng: 135.574249916667 },
  cd08: { lat: 34.5930810555556, lng: 135.574504916667 },
  cd11: { lat: 34.5989046944444, lng: 135.588488027778 },
  cd12: { lat: 34.5961365277778, lng: 135.588683833333 },
  cd13: { lat: 34.5955740555556, lng: 135.588723611111 },
  cd14: { lat: 34.5950115555556, lng: 135.588763388889 },
  cd15: { lat: 34.5922434166667, lng: 135.588959194444 },
  cd17: { lat: 34.5997018333333, lng: 135.606014416667 },
  cd18: { lat: 34.5969828055556, lng: 135.606206166667 },
  cd19: { lat: 34.5964203055556, lng: 135.606245833333 },
  cd20: { lat: 34.5958578055556, lng: 135.606285527778 },
  cd21: { lat: 34.59313875, lng: 135.60647725 },
  cd24: { lat: 34.5988754166667, lng: 135.620212944444 },
  cd25: { lat: 34.5953226666667, lng: 135.620462888889 },
  cd26: { lat: 34.6013655, lng: 135.638660277778 },
  cd27: { lat: 34.5979904444444, lng: 135.638897 },
  cd28: { lat: 34.5946154166667, lng: 135.639133666667 },
};

/** B滑走路 制限表面座標 */
export const runwayB: YaoCoordsB = {
  cd04: { lat: 34.6190940833333, lng: 135.573411666667 },
  cd05: { lat: 34.6164058055556, lng: 135.570932083333 },
  cd06: { lat: 34.6137175, lng: 135.568452638889 },
  cd07: { lat: 34.6073523611111, lng: 135.588493611111 },
  cd08: { lat: 34.6047982222222, lng: 135.586137333333 },
  cd11: { lat: 34.6026801944444, lng: 135.599410111111 },
  cd12: { lat: 34.6004518333333, lng: 135.597354027778 },
  cd13: { lat: 34.6000038611111, lng: 135.596940694444 },
  cd14: { lat: 34.5995559166667, lng: 135.596527388889 },
  cd15: { lat: 34.5973275, lng: 135.594471444444 },
  cd17: { lat: 34.5967306111111, lng: 135.608662305556 },
  cd18: { lat: 34.5945730555556, lng: 135.606671305556 },
  cd19: { lat: 34.5941251111111, lng: 135.606257972222 },
  cd20: { lat: 34.5936771944444, lng: 135.605844638889 },
  cd21: { lat: 34.5915195833333, lng: 135.603853777778 },
  cd24: { lat: 34.5894952222222, lng: 135.616729555556 },
  cd25: { lat: 34.5869941666667, lng: 135.614421416667 },
  cd26: { lat: 34.5804025277778, lng: 135.634733194444 },
  cd27: { lat: 34.5777154722222, lng: 135.63225275 },
  cd28: { lat: 34.5750283888889, lng: 135.629772472222 },
};

/** 空港標点（ARP） */
export const YAO_REFERENCE_POINT: Coord = {
  lat: 34.5966666666667,
  lng: 135.600555555556,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 10.0;

/** 水平表面: 半径(m), 制限高(m) ※八尾は水平表面のみ */
export const RADIUS_OF_HORIZONTAL_SURFACE = 2000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 北/南, 進入勾配 */
export const LENGTH_OF_LANDING_AREA_A = 1610;
export const WIDTH_OF_LANDING_AREA_A = 125;
export const HEIGHT_OF_LANDING_AREA_A_1 = 11.06 + 0.08; // 北 + 微調整
export const HEIGHT_OF_LANDING_AREA_A_2 = 11.84 + 0.08; // 南 + 微調整
export const PITCH_OF_APPROACH_A = 1 / 30;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 北/南, 進入勾配 */
export const LENGTH_OF_LANDING_AREA_B = 1075;
export const WIDTH_OF_LANDING_AREA_B = 125;
export const HEIGHT_OF_LANDING_AREA_B_1 = 10.58 + 0.08; // 北 + 微調整
export const HEIGHT_OF_LANDING_AREA_B_2 = 11.99; // 南（微調整なし）
export const PITCH_OF_APPROACH_B = 1 / 25;
