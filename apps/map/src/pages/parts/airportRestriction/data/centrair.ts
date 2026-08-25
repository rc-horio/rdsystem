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

/** 延長進入表面の勾配（公式 PITCH_OF_EXTENDED_APPROACH_SURFACE） */
export const PITCH_OF_EXTENDED_APPROACH_SURFACE = 1 / 50;

/** 転移表面の勾配（公式 PITCH_OF_TRANSITIONAL_SURFACE） */
export const PITCH_OF_TRANSITIONAL_SURFACE = 1 / 7;

/** 円錐表面の勾配（公式 PITCH_OF_CONICAL_SURFACE） */
export const PITCH_OF_CONICAL_SURFACE = 1 / 50;

/**
 * 円錐・外側水平の切り欠き（公式 SURFACE_POINTS CDA〜CDG）
 * 円錐: center=CDG, right1=CDE, left1=CDB, right2=CDD, left2=CDC
 * 外側水平: center=CDG, right1=CDF, left1=CDA, right2=CDE, left2=CDB, right3=CDD, left3=CDC
 */
export const interceptPoints = {
  cda: { lat: 35.0705444444445, lng: 136.858456111111 },
  cdb: { lat: 35.0017683333333, lng: 136.853411111111 },
  cdc: { lat: 34.8744130555556, lng: 136.844641388889 },
  cdd: { lat: 34.8564297222222, lng: 136.848833888889 },
  cde: { lat: 34.7408305555556, lng: 136.915140555556 },
  cdf: { lat: 34.6781238888889, lng: 136.950845277778 },
  cdg: { lat: 34.8650048756673, lng: 136.843951263216 },
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
 * 公式 GetCirclePaths。6°刻み。tmpArray A〜F をすべてパスに積む。
 * _center は標点ではなく intercept_center（CDG）。
 */
function getCirclePaths(
  arp: Coord,
  radiusM: number,
  interceptCenter: Coord,
  right1: Coord,
  left1: Coord,
  right2: Coord | 0,
  left2: Coord | 0,
  right3: Coord | 0,
  left3: Coord | 0
): Coord[] {
  const paths: Coord[] = [interceptCenter];
  if (right3 !== 0) paths.push(right3);
  if (right2 !== 0) paths.push(right2);
  paths.push(right1);

  const tmpA: Coord[] = [];
  const tmpB: Coord[] = [];
  const tmpC: Coord[] = [];
  const tmpD1: Coord[] = [];
  const tmpD2: Coord[] = [];
  const tmpD3: Coord[] = [];
  const tmpE: Coord[] = [];
  const tmpF: Coord[] = [];
  const distKm = radiusM / 1000;

  for (let i = 0; i < 360; i += 6) {
    const point = destinationPoint(arp, i, distKm);
    if (!point) continue;
    if (point.lng > interceptCenter.lng) {
      if (point.lng <= right1.lng && point.lat <= right1.lat) {
        tmpA.push(point);
      } else if (point.lng < left1.lng && point.lat > left1.lat) {
        tmpF.push(point);
      }
    } else if (point.lng < interceptCenter.lng) {
      if (point.lat <= right1.lat) {
        tmpC.push(point);
      } else if (point.lat < interceptCenter.lat && point.lat <= left1.lat) {
        tmpD1.push(point);
      } else if (point.lat >= interceptCenter.lat && point.lat <= left1.lat) {
        tmpD2.push(point);
      } else if (point.lat >= left1.lat) {
        tmpD3.push(point);
      }
    } else if (point.lat <= right1.lat) {
      tmpB.push(point);
    } else if (point.lat >= left1.lat) {
      tmpE.push(point);
    }
  }

  tmpA.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpB.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpC.sort((a, b) => sortByLngLat(a, b, 1, 1));
  tmpD1.sort((a, b) => sortByLngLat(a, b, 1, -1));
  tmpD2.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpD3.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpE.sort((a, b) => sortByLngLat(a, b, -1, -1));
  tmpF.sort((a, b) => sortByLngLat(a, b, -1, -1));

  paths.push(...tmpA, ...tmpB, ...tmpC, ...tmpD1, ...tmpD2, ...tmpD3, ...tmpE, ...tmpF, left1);
  if (left2 !== 0) paths.push(left2);
  if (left3 !== 0) paths.push(left3);
  return paths;
}

/** 円錐表面の切り欠きポリゴン（半径 16500 m） */
export const conicalCutPath: Coord[] = getCirclePaths(
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_CONICAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc,
  0,
  0
);

/** 外側水平表面の切り欠きポリゴン（半径 24000 m） */
export const outerCutPath: Coord[] = getCirclePaths(
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE,
  interceptPoints.cdg,
  interceptPoints.cdf,
  interceptPoints.cda,
  interceptPoints.cde,
  interceptPoints.cdb,
  interceptPoints.cdd,
  interceptPoints.cdc
);
