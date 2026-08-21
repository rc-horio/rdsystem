/**
 * 関西国際空港 制限表面データ
 * データソース: 関西国際空港高さ制限回答システム constants.js
 * https://secure.kix-ap.ne.jp/kix/
 */

/** 座標型 */
export type Coord = { lat: number; lng: number };

/** CD01〜CD31 を持つ制限表面用座標オブジェクト */
export type KansaiCoords = Record<
  | "cd01" | "cd02" | "cd03" | "cd04" | "cd05" | "cd06" | "cd07" | "cd08"
  | "cd09" | "cd10" | "cd11" | "cd12" | "cd13" | "cd14" | "cd15" | "cd16"
  | "cd17" | "cd18" | "cd19" | "cd20" | "cd21" | "cd22" | "cd23" | "cd24"
  | "cd25" | "cd26" | "cd27" | "cd28" | "cd29" | "cd30" | "cd31",
  Coord
>;

/** A滑走路 制限表面座標 (SURFACE_POINTS) */
export const surfacePointsA: KansaiCoords = {
  cd01: { lat: 34.3486416666667, lng: 135.085652777778 },
  cd02: { lat: 34.3318472222222, lng: 135.102097222222 },
  cd03: { lat: 34.3150527777778, lng: 135.118536111111 },
  cd04: { lat: 34.4042055555556, lng: 135.199297222222 },
  cd05: { lat: 34.4000055555556, lng: 135.203408333333 },
  cd06: { lat: 34.3958027777778, lng: 135.207519444444 },
  cd07: { lat: 34.4083694444444, lng: 135.207827777778 },
  cd08: { lat: 34.4018333333333, lng: 135.214172222222 },
  cd09: { lat: 34.4067388888889, lng: 135.204463888889 },
  cd10: { lat: 34.4015888888889, lng: 135.2139 },
  cd11: { lat: 34.4202888888889, lng: 135.225575 },
  cd12: { lat: 34.4180805555556, lng: 135.227733333333 },
  cd13: { lat: 34.4170305555556, lng: 135.228761111111 },
  cd14: { lat: 34.4159805555556, lng: 135.229786111111 },
  cd15: { lat: 34.4137694444444, lng: 135.231947222222 },
  cd16: { lat: 34.4341666666667, lng: 135.232777777778 },
  cd17: { lat: 34.4408277777778, lng: 135.256183333333 },
  cd18: { lat: 34.4386194444444, lng: 135.258338888889 },
  cd19: { lat: 34.4375694444444, lng: 135.259366666667 },
  cd20: { lat: 34.4365194444444, lng: 135.260394444444 },
  cd21: { lat: 34.4343083333333, lng: 135.262552777778 },
  cd22: { lat: 34.4509805555556, lng: 135.271322222222 },
  cd23: { lat: 34.4427472222222, lng: 135.275138888889 },
  cd24: { lat: 34.4527388888889, lng: 135.273944444444 },
  cd25: { lat: 34.4462361111111, lng: 135.280344444444 },
  cd26: { lat: 34.4587888888889, lng: 135.280633333333 },
  cd27: { lat: 34.4545833333333, lng: 135.284741666667 },
  cd28: { lat: 34.4503805555556, lng: 135.28885 },
  cd29: { lat: 34.539425, lng: 135.369922222222 },
  cd30: { lat: 34.5225916666667, lng: 135.386347222222 },
  cd31: { lat: 34.5057583333333, lng: 135.402769444444 },
};

/** B滑走路 制限表面座標 (SURFACE_POINTS2) */
export const surfacePointsB: KansaiCoords = {
  cd01: { lat: 34.3598138888889, lng: 135.062588888889 },
  cd02: { lat: 34.3430222222222, lng: 135.079041666667 },
  cd03: { lat: 34.3262305555556, lng: 135.095486111111 },
  cd04: { lat: 34.4154, lng: 135.176233333333 },
  cd05: { lat: 34.4112, lng: 135.180344444444 },
  cd06: { lat: 34.4069972222222, lng: 135.184452777778 },
  cd07: { lat: 34.4195666666667, lng: 135.184763888889 },
  cd08: { lat: 34.4130666666667, lng: 135.191147222222 },
  cd09: { lat: 34.4238583333333, lng: 135.191152777778 },
  cd10: { lat: 34.4158638888889, lng: 135.195311111111 },
  cd11: { lat: 34.4314861111111, lng: 135.202508333333 },
  cd12: { lat: 34.4292805555556, lng: 135.204666666667 },
  cd13: { lat: 34.4282305555556, lng: 135.205694444444 },
  cd14: { lat: 34.4271805555556, lng: 135.206722222222 },
  cd15: { lat: 34.424975, lng: 135.208880555556 },
  cd16: { lat: 34.4341666666667, lng: 135.232777777778 },
  cd17: { lat: 34.4548694444444, lng: 135.237341666667 },
  cd18: { lat: 34.4526611111111, lng: 135.2395 },
  cd19: { lat: 34.4516111111111, lng: 135.240527777778 },
  cd20: { lat: 34.4505611111111, lng: 135.241555555556 },
  cd21: { lat: 34.4483555555556, lng: 135.243711111111 },
  cd22: { lat: 34.4657583333333, lng: 135.253577777778 },
  cd23: { lat: 34.46065, lng: 135.262261111111 },
  cd24: { lat: 34.4667833333333, lng: 135.255105555556 },
  cd25: { lat: 34.4602583333333, lng: 135.261455555556 },
  cd26: { lat: 34.4728333333333, lng: 135.261794444444 },
  cd27: { lat: 34.4686305555556, lng: 135.265902777778 },
  cd28: { lat: 34.464425, lng: 135.270013888889 },
  cd29: { lat: 34.5534833333333, lng: 135.351077777778 },
  cd30: { lat: 34.5366527777778, lng: 135.367511111111 },
  cd31: { lat: 34.5198222222222, lng: 135.383938888889 },
};

/** 空港標点（関西国際空港・CD16） */
export const KANSAI_REFERENCE_POINT: Coord = {
  lat: 34.4341666666667,
  lng: 135.232777777778,
};

/** 標点の海抜高（m） */
export const HEIGHT_OF_AIRPORT_REFERENCE_POINT = 5.3;

/** 水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_HORIZONTAL_SURFACE = 4000;
export const HEIGHT_OF_HORIZONTAL_SURFACE = 45;

/** 円錐表面: 半径(m) */
export const RADIUS_OF_CONICAL_SURFACE = 16500;

/** 外側水平表面: 半径(m), 制限高(m) */
export const RADIUS_OF_OUTER_HORIZONTAL_SURFACE = 24000;
export const HEIGHT_OF_OUTER_HORIZONTAL_SURFACE = 295;

/** 円錐・外側水平の切り欠き用座標（公式 SURFACE_POINTS の CDA〜CDH） */
export const interceptPoints = {
  cda: { lat: 34.5175, lng: 135.473888888889 },
  cdb: { lat: 34.4775, lng: 135.404722222222 },
  cdc: { lat: 34.4213888888889, lng: 135.307222222222 },
  cdd: { lat: 34.3672222222222, lng: 135.221944444444 },
  cde: { lat: 34.2994444444444, lng: 135.156388888889 },
  cdf: { lat: 34.2516666666667, lng: 135.092777777778 },
  cdg: { lat: 34.3905555555556, lng: 135.274722222222 },
  cdh: { lat: 34.2780555555556, lng: 135.135555555556 },
} as const satisfies Record<string, Coord>;

/** 公式 map.bundle.js の destinationPoint（地球半径 6371 km） */
function destinationPoint(from: Coord, headingDeg: number, distKm: number): Coord {
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
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI };
}

function sortByLngLat(
  a: Coord,
  b: Coord,
  lngDir: 1 | -1,
  latDir: 1 | -1
): number {
  const alng = Number(a.lng.toFixed(8));
  const blng = Number(b.lng.toFixed(8));
  if (alng < blng) return lngDir;
  if (alng > blng) return -lngDir as 1 | -1;
  const alat = Number(a.lat.toFixed(8));
  const blat = Number(b.lat.toFixed(8));
  if (alat < blat) return latDir;
  if (alat > blat) return -latDir as 1 | -1;
  return 0;
}

/**
 * 公式 GetCirclePaths 相当。円錐・外側水平は真円ではなく CDA〜CDH で切ったポリゴン。
 */
function getCirclePaths(
  center: Coord,
  radiusM: number,
  right1: Coord,
  left1: Coord,
  right2: Coord | 0,
  left2: Coord | 0,
  right3: Coord | 0,
  left3: Coord | 0,
  right12: Coord | 0,
  mid: Coord
): Coord[] {
  const paths: Coord[] = [mid];
  if (right3 !== 0) paths.push(right3);
  if (right2 !== 0) paths.push(right2);
  if (right12 !== 0) paths.push(right12);
  paths.push(right1);

  const tmpD1: Coord[] = [];
  const tmpD2: Coord[] = [];
  const tmpD3: Coord[] = [];
  const tmpE: Coord[] = [];
  const tmpF: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let i = 0; i < 360; i += 6) {
    const point = destinationPoint(center, i, distKm);
    if (point.lng > center.lng) {
      // 公式 tmpArrayA はパスに使わない。条件だけ残して F へ入らないようにする
      if (point.lng <= right1.lng && point.lat <= right1.lat) {
        continue;
      } else if (point.lng < left1.lng && point.lat > left1.lat) {
        tmpF.push(point);
      }
    } else if (point.lng < center.lng) {
      if (point.lat <= right1.lat) {
        // 公式 tmpArrayC はパスに使わない
      } else if (point.lat < center.lat && point.lat <= left1.lat) {
        tmpD1.push(point);
      } else if (point.lat >= center.lat && point.lat <= left1.lat) {
        tmpD2.push(point);
      } else if (point.lat >= left1.lat) {
        tmpD3.push(point);
      }
    } else if (point.lat <= right1.lat) {
      // 公式 tmpArrayB はパスに使わない
    } else if (point.lat >= left1.lat) {
      tmpE.push(point);
    }
  }

  tmpD1.sort((a, b) => sortByLngLat(a, b, 1, -1));
  tmpD2.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpD3.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpE.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpF.sort((a, b) => sortByLngLat(a, b, -1, -1));

  paths.push(...tmpD1, ...tmpD2, ...tmpD3, ...tmpE, ...tmpF, left1);
  if (left2 !== 0) paths.push(left2);
  if (left3 !== 0) paths.push(left3);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  0,
  0,
  0,
  interceptPoints.cdg
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdf,
  interceptPoints.cda,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  interceptPoints.cdh,
  interceptPoints.cdg
);

/** A滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_A = 3620;
export const WIDTH_OF_LANDING_AREA_A = 300;
export const HEIGHT_OF_LANDING_AREA_A_1 = 1.91;
export const HEIGHT_OF_LANDING_AREA_A_2 = 4.56;

/** B滑走路: 着陸帯 長(m), 幅(m), 高さ(m) 両端 */
export const LENGTH_OF_LANDING_AREA_B = 4120;
export const WIDTH_OF_LANDING_AREA_B = 300;
export const HEIGHT_OF_LANDING_AREA_B_1 = 7.15;
export const HEIGHT_OF_LANDING_AREA_B_2 = 9.83;
