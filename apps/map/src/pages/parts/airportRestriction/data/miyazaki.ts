/**
 * 宮崎空港 制限表面データ
 * データソース: 宮崎空港高さ制限回答システム constants.js / map.bundle.js
 * https://secure.kix-ap.ne.jp/miyazaki-airport/
 *
 * 単一滑走路。水平表面・円錐表面・外側水平表面・延長進入表面（南東のみ）あり。
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** 制限表面座標 */
export type MiyazakiCoords = Record<
  | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd11" | "cd12" | "cd13" | "cd14" | "cd15"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21"
  | "cd24" | "cd25" | "cd26" | "cd27" | "cd28"
  | "cd29" | "cd30" | "cd31",
  Coord
>;

/** 制限表面座標 */
export const surfacePoints: MiyazakiCoords = {
  cd04: { lat: 31.87926, lng: 131.402525 },
  cd05: { lat: 31.873868, lng: 131.403057 },
  cd06: { lat: 31.868476, lng: 131.403589 },
  cd07: { lat: 31.878856, lng: 131.409815 },
  cd08: { lat: 31.869915, lng: 131.410698 },
  cd11: { lat: 31.8804, lng: 131.434231 },
  cd12: { lat: 31.877486, lng: 131.434518 },
  cd13: { lat: 31.876138, lng: 131.434651 },
  cd14: { lat: 31.87479, lng: 131.434784 },
  cd15: { lat: 31.871876, lng: 131.435072 },
  cd17: { lat: 31.882271, lng: 131.461833 },
  cd18: { lat: 31.879466, lng: 131.46211 },
  cd19: { lat: 31.878118, lng: 131.462243 },
  cd20: { lat: 31.87677, lng: 131.462376 },
  cd21: { lat: 31.873965, lng: 131.462653 },
  cd24: { lat: 31.884158, lng: 131.485294 },
  cd25: { lat: 31.875451, lng: 131.486153 },
  cd26: { lat: 31.88578, lng: 131.493305 },
  cd27: { lat: 31.880388, lng: 131.493837 },
  cd28: { lat: 31.874996, lng: 131.494369 },
  cd29: { lat: 31.911036, lng: 131.618087 },
  cd30: { lat: 31.889468, lng: 131.620215 },
  cd31: { lat: 31.8679, lng: 131.622343 },
};

/** 空港標点 */
export const MIYAZAKI_REFERENCE_POINT: Coord = {
  lat: 31.8770919444444,
  lng: 131.448473055556,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 5.9;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 3500;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 305;

/** 着陸帯: 長(m), 幅(m), 高さ(m) 北西端/南東端 */
export const LENGTH_OF_LANDING_AREA = 2620;
export const WIDTH_OF_LANDING_AREA = 300;
export const HEIGHT_OF_LANDING_AREA_1 = 4.2; // 北西
export const HEIGHT_OF_LANDING_AREA_2 = 6.105; // 南東

/** 進入表面・延長進入表面の勾配 1/50 */
export const PITCH_OF_APPROACH_SURFACE = 1 / 50;
