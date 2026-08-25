/**
 * 仙台空港 制限表面データ
 * データソース: 仙台空港高さ制限回答システム constants.js / index.bundle.js
 * https://secure.kix-ap.ne.jp/sendai-airport/
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** A滑走路 制限表面座標 */
export type SendaiCoordsA = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd09" | "cd10" | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16"
  | "cd17" | "cd18" | "cd19" | "cd20",
  Coord
>;

/** B滑走路 制限表面座標 */
export type SendaiCoordsB = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd09" | "cd10" | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21" | "cd22" | "cd23",
  Coord
>;

/** A滑走路 制限表面座標 */
export const runwayA: SendaiCoordsA = {
  cd01: { lat: 38.15525972, lng: 140.88581833 },
  cd02: { lat: 38.15226778, lng: 140.88383139 },
  cd03: { lat: 38.14927556, lng: 140.88184417 },
  cd04: { lat: 38.1469925, lng: 140.90170222 },
  cd05: { lat: 38.14365556, lng: 140.89948528 },
  cd06: { lat: 38.14280417, lng: 140.91619722 },
  cd07: { lat: 38.14030806, lng: 140.91453833 },
  cd08: { lat: 38.13970972, lng: 140.91414056 },
  cd09: { lat: 38.13911139, lng: 140.91374333 },
  cd10: { lat: 38.136615, lng: 140.91208444 },
  cd11: { lat: 38.13729861, lng: 140.929545 },
  cd12: { lat: 38.13478, lng: 140.92787083 },
  cd13: { lat: 38.13418167, lng: 140.92747306 },
  cd14: { lat: 38.13358333, lng: 140.92707556 },
  cd15: { lat: 38.131065, lng: 140.92540139 },
  cd16: { lat: 38.13019167, lng: 140.94225222 },
  cd17: { lat: 38.12683667, lng: 140.94002111 },
  cd18: { lat: 38.12460972, lng: 140.95974528 },
  cd19: { lat: 38.12161861, lng: 140.95775556 },
  cd20: { lat: 38.11862778, lng: 140.95576611 },
};

/** B滑走路 制限表面座標 */
export const runwayB: SendaiCoordsB = {
  cd01: { lat: 38.14055222, lng: 140.86321806 },
  cd02: { lat: 38.13519194, lng: 140.86410806 },
  cd03: { lat: 38.12983194, lng: 140.86499806 },
  cd04: { lat: 38.14041056, lng: 140.87290667 },
  cd05: { lat: 38.13194139, lng: 140.87431167 },
  cd06: { lat: 38.14274361, lng: 140.89737278 },
  cd07: { lat: 38.14004194, lng: 140.89782 },
  cd08: { lat: 38.13870194, lng: 140.89804194 },
  cd09: { lat: 38.13736167, lng: 140.89826389 },
  cd10: { lat: 38.13466028, lng: 140.89871111 },
  cd11: { lat: 38.14631528, lng: 140.93268 },
  cd12: { lat: 38.14368222, lng: 140.93311444 },
  cd13: { lat: 38.14234222, lng: 140.93333583 },
  cd14: { lat: 38.14100194, lng: 140.93355722 },
  cd15: { lat: 38.13836917, lng: 140.93399167 },
  cd16: { lat: 38.14895389, lng: 140.95646361 },
  cd17: { lat: 38.14063111, lng: 140.957835 },
  cd18: { lat: 38.15119861, lng: 140.96638194 },
  cd19: { lat: 38.14583778, lng: 140.96726472 },
  cd20: { lat: 38.14047694, lng: 140.96814722 },
  cd21: { lat: 38.181145, lng: 141.09956361 },
  cd22: { lat: 38.15969778, lng: 141.10305528 },
  cd23: { lat: 38.13825028, lng: 141.10654528 },
};

/** 空港標点（cd00） */
export const SENDAI_REFERENCE_POINT: Coord = {
  lat: 38.13972222,
  lng: 140.91694444,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 1.7;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m), 勾配 1/50 */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端, 進入勾配 */
export const LENGTH_OF_LANDING_AREA_A = 1320;
export const WIDTH_OF_LANDING_AREA_A = 150;
export const HEIGHT_OF_LANDING_AREA_A_1 = 2; // 北西
export const HEIGHT_OF_LANDING_AREA_A_2 = 1.6; // 南東
export const PITCH_OF_APPROACH_A = 1 / 30;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端, 進入勾配 */
export const LENGTH_OF_LANDING_AREA_B = 3120;
export const WIDTH_OF_LANDING_AREA_B = 300;
export const HEIGHT_OF_LANDING_AREA_B_1 = 3.5; // 北西
export const HEIGHT_OF_LANDING_AREA_B_2 = 4.6; // 南東
export const PITCH_OF_APPROACH_B = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 circleSurface cd01〜cd05）
 * 円錐: center=cd01, right=cd03, left=cd02
 * 外側水平: center=cd01, right=cd04, left=cd05
 */
export const interceptPoints = {
  cd01: { lat: 38.17027778, lng: 140.84777778 },
  cd02: { lat: 38.04027778, lng: 140.77694444 },
  cd03: { lat: 38.22583333, lng: 141.07083333 },
  cd04: { lat: 38.24694444, lng: 141.15555556 },
  cd05: { lat: 37.97416667, lng: 140.74083333 },
} as const satisfies Record<string, Coord>;

/** 公式 destinationPoint（地球半径 6371 km） */
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
 * 公式 GetCirclePaths。5°刻み。
 * 弧点は lat < right.lat かつ lng > left.lng のときだけ積む。
 */
function getCirclePaths(
  arp: Coord,
  radiusM: number,
  interceptCenter: Coord,
  interceptRight: Coord,
  interceptLeft: Coord
): Coord[] {
  const paths: Coord[] = [interceptCenter, interceptRight];
  const distKm = radiusM / 1000;
  for (let i = 0; i < 360; i += 5) {
    const point = destinationPoint(arp, i, distKm);
    if (!point) continue;
    if (point.lat < interceptRight.lat && point.lng > interceptLeft.lng) {
      paths.push(point);
    }
  }
  paths.push(interceptLeft);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  SENDAI_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cd01,
  interceptPoints.cd03,
  interceptPoints.cd02
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  SENDAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cd01,
  interceptPoints.cd04,
  interceptPoints.cd05
);
