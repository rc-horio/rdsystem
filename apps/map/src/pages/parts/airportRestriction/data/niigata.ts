/**
 * 新潟空港 制限表面データ
 * データソース: 新潟空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/niigata-airport/
 *
 * 新潟空港は水平表面のみ（半径3500m）。円錐表面・外側水平表面はなし。
 * A/B 2本の滑走路。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** A滑走路 制限表面座標 */
export type NiigataCoordsA = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** B滑走路 制限表面座標 */
export type NiigataCoordsB = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** A滑走路 制限表面座標 */
export const runwayA: NiigataCoordsA = {
  cd04: { lat: 37.9799305555556, lng: 139.144616666667 },
  cd05: { lat: 37.981716666666664, lng: 139.14099444444446 },
  cd06: { lat: 37.9835027777778, lng: 139.137369444444 },
  cd07: { lat: 37.9680126553434, lng: 139.13301033899188 },
  cd08: { lat: 37.9700029307611, lng: 139.1289752908051 },
  cd11: { lat: 37.95693055555555, lng: 139.12668055555557 },
  cd12: { lat: 37.958416666666665, lng: 139.12366666666665 },
  cd13: { lat: 37.958775, lng: 139.12294166666666 },
  cd14: { lat: 37.959130555555554, lng: 139.12221666666665 },
  cd15: { lat: 37.96061944444445, lng: 139.1192 },
  cd17: { lat: 37.946133333333336, lng: 139.1177111111111 },
  cd18: { lat: 37.94745, lng: 139.11504166666666 },
  cd19: { lat: 37.947805555555554, lng: 139.11431666666667 },
  cd20: { lat: 37.948163888888885, lng: 139.11359166666665 },
  cd21: { lat: 37.94947777777777, lng: 139.110925 },
  cd24: { lat: 37.93782760085781, lng: 139.10906525328755 },
  cd25: { lat: 37.93966903358645, lng: 139.10532843321562 },
  cd26: { lat: 37.923072222222224, lng: 139.0999027777778 },
  cd27: { lat: 37.92485833333333, lng: 139.09628055555555 },
  cd28: { lat: 37.92664444444445, lng: 139.0926611111111 },
};

/** B滑走路 制限表面座標 */
export const runwayB: NiigataCoordsB = {
  cd04: { lat: 37.9635527777778, lng: 139.060469444444 },
  cd05: { lat: 37.9581527777778, lng: 139.060152777778 },
  cd06: { lat: 37.9527527777778, lng: 139.059836111111 },
  cd07: { lat: 37.9615666666667, lng: 139.073147222222 },
  cd08: { lat: 37.9537972222222, lng: 139.072688888889 },
  cd11: { lat: 37.9606111111111, lng: 139.094472222222 },
  cd12: { lat: 37.9582444444444, lng: 139.094333333333 },
  cd13: { lat: 37.9568944444444, lng: 139.094252777778 },
  cd14: { lat: 37.9555444444444, lng: 139.094175 },
  cd15: { lat: 37.9531805555556, lng: 139.094033333333 },
  cd17: { lat: 37.9598222222222, lng: 139.124275 },
  cd18: { lat: 37.9571388888889, lng: 139.124113888889 },
  cd19: { lat: 37.9557888888889, lng: 139.124036111111 },
  cd20: { lat: 37.9544388888889, lng: 139.123955555556 },
  cd21: { lat: 37.9517555555556, lng: 139.123794444444 },
  cd24: { lat: 37.9591194444444, lng: 139.148611111111 },
  cd25: { lat: 37.9506388888889, lng: 139.148111111111 },
  cd26: { lat: 37.9599111111111, lng: 139.158458333333 },
  cd27: { lat: 37.9545138888889, lng: 139.158133333333 },
  cd28: { lat: 37.9491138888889, lng: 139.157813888889 },
};

/** 空港標点（ARP） */
export const NIIGATA_REFERENCE_POINT: Coord = {
  lat: 37.95583333333334,
  lng: 139.11166666666665,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 1.4;

/** 水平表面: 半径(m), 制限高(m) ※新潟は水平表面のみ */
export const RADIUS_OF_HORIZONTAL_SURFACE = 3500;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) RWY22/RWY04, 進入勾配 1/30 */
export const LENGTH_OF_LANDING_AREA_A = 1434;
export const WIDTH_OF_LANDING_AREA_A = 150;
export const HEIGHT_OF_LANDING_AREA_A_1 = 1.8; // RWY22
export const HEIGHT_OF_LANDING_AREA_A_2 = 6.93; // RWY04
export const PITCH_OF_APPROACH_A = 1 / 30;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) RWY10/RWY28, 進入勾配 1/50 */
export const LENGTH_OF_LANDING_AREA_B = 2620;
export const WIDTH_OF_LANDING_AREA_B = 300;
export const HEIGHT_OF_LANDING_AREA_B_1 = 8.86; // RWY10
export const HEIGHT_OF_LANDING_AREA_B_2 = 3.6; // RWY28
export const PITCH_OF_APPROACH_B = 1 / 50;
