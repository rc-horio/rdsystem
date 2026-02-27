/**
 * 新千歳空港 制限表面データ
 * データソース: 新千歳空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/shinchitose-airport/
 *
 * 新千歳空港は水平表面のみ（半径4000m）。円錐表面・外側水平表面はなし。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** A滑走路 制限表面座標 */
export type ShinchitoseCoordsA = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** B滑走路 制限表面座標 */
export type ShinchitoseCoordsB = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28",
  Coord
>;

/** A滑走路 制限表面座標 */
export const runwayA: ShinchitoseCoordsA = {
  cd04: { lat: 42.816444925, lng: 141.69056583 },
  cd05: { lat: 42.8157458333333, lng: 141.683290555555 },
  cd06: { lat: 42.8150502777777, lng: 141.676014722222 },
  cd07: { lat: 42.8079313888888, lng: 141.690336944444 },
  cd08: { lat: 42.8068655555555, lng: 141.679188055555 },
  cd11: { lat: 42.7894719444444, lng: 141.693334722222 },
  cd12: { lat: 42.7891369444444, lng: 141.689830277777 },
  cd13: { lat: 42.7889633333333, lng: 141.688012222222 },
  cd14: { lat: 42.7887894444444, lng: 141.686193888888 },
  cd15: { lat: 42.7884544444444, lng: 141.682689722222 },
  cd17: { lat: 42.7616669444444, lng: 141.6987575 },
  cd18: { lat: 42.7612827777777, lng: 141.694735833333 },
  cd19: { lat: 42.7611088888888, lng: 141.692918333333 },
  cd20: { lat: 42.7609352777777, lng: 141.691100833333 },
  cd21: { lat: 42.76055055555556, lng: 141.68707916666665 },
  cd24: { lat: 42.7405263888888, lng: 141.702768055555 },
  cd25: { lat: 42.7393555555555, lng: 141.690519444444 },
  cd26: { lat: 42.73502, lng: 141.704898055555 },
  cd27: { lat: 42.7343255555555, lng: 141.697631388888 },
  cd28: { lat: 42.7336308333333, lng: 141.690365 },
};

/** B滑走路 制限表面座標 */
export const runwayB: ShinchitoseCoordsB = {
  cd04: { lat: 42.8167813888888, lng: 141.694207222222 },
  cd05: { lat: 42.8160866666666, lng: 141.686931111111 },
  cd06: { lat: 42.8153913888888, lng: 141.679655277777 },
  cd07: { lat: 42.8089544444444, lng: 141.693995277777 },
  cd08: { lat: 42.8078633333333, lng: 141.682573333333 },
  cd11: { lat: 42.7898241666666, lng: 141.697099722222 },
  cd12: { lat: 42.7894775, lng: 141.693468055555 },
  cd13: { lat: 42.7893036111111, lng: 141.69165 },
  cd14: { lat: 42.7891299999999, lng: 141.689831666666 },
  cd15: { lat: 42.7887830555555, lng: 141.686199999999 },
  cd17: { lat: 42.7620191666666, lng: 141.702519444444 },
  cd18: { lat: 42.7616227777777, lng: 141.698370277777 },
  cd19: { lat: 42.7614491666666, lng: 141.696552777777 },
  cd20: { lat: 42.7612752777777, lng: 141.694735277777 },
  cd21: { lat: 42.7608788888888, lng: 141.690586388888 },
  cd24: { lat: 42.7402091666666, lng: 141.706654166666 },
  cd25: { lat: 42.7390133333333, lng: 141.694132777777 },
  cd26: { lat: 42.7353591666666, lng: 141.708529722222 },
  cd27: { lat: 42.7346655555555, lng: 141.701263055555 },
  cd28: { lat: 42.7339711111111, lng: 141.693996388888 },
};

/** 空港標点（ARP） */
export const SHINCHITOSE_REFERENCE_POINT: Coord = {
  lat: 42.77527778,
  lng: 141.6925,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 21.3;

/** 水平表面: 半径(m), 制限高(m) ※新千歳は水平表面のみ */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 北/南, 進入勾配 1/50 */
export const LENGTH_OF_LANDING_AREA_A = 3120;
export const WIDTH_OF_LANDING_AREA_A = 300;
export const HEIGHT_OF_LANDING_AREA_A_1 = 25; // 北（19R）
export const HEIGHT_OF_LANDING_AREA_A_2 = 19; // 南（01L）
export const PITCH_OF_APPROACH_A = 1 / 50;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 北/南, 進入勾配 1/50 */
export const LENGTH_OF_LANDING_AREA_B = 3120;
export const WIDTH_OF_LANDING_AREA_B = 300;
export const HEIGHT_OF_LANDING_AREA_B_1 = 23.5; // 北（19L）
export const HEIGHT_OF_LANDING_AREA_B_2 = 17.5; // 南（01R）
export const PITCH_OF_APPROACH_B = 1 / 50;
