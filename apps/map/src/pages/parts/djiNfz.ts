import { kml } from "@tmcw/togeojson";

/** Data.Feature のポリゴン内に point が含まれるか */
function isPointInDataFeature(
  point: google.maps.LatLng,
  feature: google.maps.Data.Feature
): boolean {
  try {
    const geom = feature.getGeometry() as
      | {
          getType: () => string;
          getAt: (i: number) => { getArray: () => google.maps.LatLng[] };
        }
      | null;
    if (!geom || geom.getType() !== "Polygon") return false;
    const ring = geom.getAt(0);
    if (!ring) return false;
    const path = ring.getArray();
    const poly = new google.maps.Polygon({ paths: path });
    return google.maps.geometry.poly.containsLocation(point, poly);
  } catch {
    return false;
  }
}

/** DJI NFZ KML の URL（同一オリジン・相対パス） */
const DJI_NFZ_KML_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/dji-nfz.kml`;

/** DJI API プロキシ URL（未設定時は KML を使用） */
export const DJI_NFZ_PROXY_URL = String(
  import.meta.env.VITE_DJI_NFZ_PROXY_URL || ""
).replace(/\/+$/, "");

export type GeoJsonFeature = {
  type: "Feature";
  geometry?: { type: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
};

/** Point を半径付き円ポリゴンに変換（description から "N meter radius" をパース） */
function pointsToCirclePolygons(geoJson: {
  type: "FeatureCollection";
  features?: GeoJsonFeature[];
}): { type: "FeatureCollection"; features: GeoJsonFeature[] } {
  const RADIUS_REGEX = /(\d+)\s*meter\s*radius/i;
  const SEGMENTS = 16; // 円の近似精度（パフォーマンス重視）
  const DEFAULT_RADIUS = 500; // 半径が取れない場合のフォールバック（m）

  const features: GeoJsonFeature[] = [];

  for (const f of geoJson.features || []) {
    if (f.geometry?.type !== "Point") {
      features.push(f);
      continue;
    }

    const coords = f.geometry.coordinates as [number, number];
    const [lng, lat] = coords;
    const props = f.properties as Record<string, unknown> | undefined;
    const desc =
      (props?.["description"] ?? props?.["Description"] ?? props?.["name"]) as
        | string
        | undefined;
    const match = typeof desc === "string" ? desc.match(RADIUS_REGEX) : null;
    const radiusM = match ? parseInt(match[1], 10) : DEFAULT_RADIUS;

    // 緯度経度で半径 r[m] の円を近似（平面近似）
    const r = radiusM;
    const latRad = (lat * Math.PI) / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(latRad);

    const ring: [number, number][] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (2 * Math.PI * i) / SEGMENTS;
      const dLat = (r * Math.cos(angle)) / mPerDegLat;
      const dLng = (r * Math.sin(angle)) / mPerDegLng;
      ring.push([lng + dLng, lat + dLat]);
    }

    features.push({
      type: "Feature",
      properties: f.properties,
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/** DJI API areas レスポンスの area 型（ol-dji-geozones 準拠） */
type DjiArea = {
  area_id: number;
  name?: string;
  city?: string;
  type?: number;
  shape?: number;
  lat: number;
  lng: number;
  radius?: number;
  level?: number;
  polygon_points?: number[][][] | number[][];
  sub_areas?: Array<{
    lat: number;
    lng: number;
    radius?: number;
    level?: number;
    polygon_points?: number[][][] | number[][];
  }>;
};

/** 中心点 + 半径(m) から円ポリゴンの座標を生成 */
function circleToPolygonCoords(
  lng: number,
  lat: number,
  radiusM: number,
  segments = 24
): [number, number][] {
  const r = radiusM;
  const latRad = (lat * Math.PI) / 180;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(latRad);
  const ring: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const dLat = (r * Math.cos(angle)) / mPerDegLat;
    const dLng = (r * Math.sin(angle)) / mPerDegLng;
    ring.push([lng + dLng, lat + dLat]);
  }
  return ring;
}

/** polygon_points を GeoJSON Polygon coordinates に正規化 */
function normalizePolygonCoords(
  pts: number[][][] | number[][]
): [number, number][] | null {
  if (!pts || !Array.isArray(pts)) return null;
  const first = pts[0];
  if (Array.isArray(first) && typeof first[0] === "number") {
    return pts as [number, number][];
  }
  if (Array.isArray(first) && Array.isArray(first[0])) {
    return (first as number[][]) as [number, number][];
  }
  return null;
}

/** DJI GEO ゾーン種別ごとの色（API level に応じた配色） */
export const DJI_LEVEL_COLORS: Record<number, { fill: string; stroke: string }> = {
  0: { fill: "#FFCC00", stroke: "#E6B800" }, // 警告区域（黄色）
  1: { fill: "#1088F2", stroke: "#0E7AD9" }, // 承認区域（青）
  2: { fill: "#DE4329", stroke: "#C83B24" }, // 制限区域（赤）
  3: { fill: "#E67E22", stroke: "#CC6B1A" }, // 強化警告区域（オレンジ）
  4: { fill: "#2E7D32", stroke: "#1B5E20" }, // 特別高度制限区域（深緑）
  5: { fill: "#00BE00", stroke: "#00A800" }, // 推奨区域(2)
  6: { fill: "#979797", stroke: "#7A7A7A" }, // 高度制限区域（グレー）
  7: { fill: "#37C4DB", stroke: "#31B0C5" }, // 規制制限区域（水色）
  8: { fill: "#00BE00", stroke: "#00A800" }, // 飛行許可区域（緑）
  9: { fill: "#DE4329", stroke: "#C83B24" }, // 人口集中区域
};

export const DJI_DEFAULT_COLOR = { fill: "#e53935", stroke: "#c62828" };

/** level の日本語ラベル（DJI GEO区域 詳細情報に準拠） */
const DJI_LEVEL_LABELS: Record<number, string> = {
  0: "警告区域",
  1: "承認区域",
  2: "制限区域",
  3: "強化警告区域",
  4: "特別高度制限区域",
  5: "推奨区域(2)",
  6: "高度制限区域",
  7: "規制制限区域",
  8: "飛行許可区域",
  9: "人口集中区域",
};

/** ポップアップでの表示順（制限→高度制限→承認→警告→強化警告→規制制限→飛行許可→特別高度制限） */
const DJI_LEVEL_DISPLAY_ORDER = [2, 6, 1, 0, 3, 4, 8, 7, 5, 9];

function escapePopupHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DjiNfzEntryHit = {
  name: string;
  city?: string;
  level: number;
  label: string;
  color: string;
};

type DjiNfzGeoJson = { type: "FeatureCollection"; features: GeoJsonFeature[] };

function djiNfzEntriesFromHits(
  hits: Array<{ name: string; city?: string; level: number }>
): DjiNfzEntryHit[] {
  const byNameLevel = new Map<
    string,
    { name: string; city?: string; level: number; label: string }
  >();
  for (const hit of hits) {
    const key = `${String(hit.name)}|${hit.level}`;
    if (!byNameLevel.has(key)) {
      byNameLevel.set(key, {
        name: hit.name,
        city: hit.city,
        level: hit.level,
        label: DJI_LEVEL_LABELS[hit.level] ?? `レベル${hit.level}`,
      });
    }
  }
  const entries: DjiNfzEntryHit[] = [];
  for (const { name, city, level, label } of byNameLevel.values()) {
    const c =
      level in DJI_LEVEL_COLORS ? DJI_LEVEL_COLORS[level] : DJI_DEFAULT_COLOR;
    entries.push({ name, city, level, label, color: c.fill });
  }
  entries.sort(
    (a, b) =>
      DJI_LEVEL_DISPLAY_ORDER.indexOf(a.level) -
      DJI_LEVEL_DISPLAY_ORDER.indexOf(b.level)
  );
  return entries;
}

export function collectDjiNfzEntriesAtPoint(
  map: google.maps.Map,
  latLng: google.maps.LatLng
): DjiNfzEntryHit[] {
  const hits: Array<{ name: string; city?: string; level: number }> = [];
  map.data.forEach((f) => {
    if (!isPointInDataFeature(latLng, f)) return;
    const name = (f.getProperty("name") as string) || "—";
    const city = f.getProperty("city") as string | undefined;
    const levelVal = f.getProperty("level");
    const level = levelVal != null ? Number(levelVal) : NaN;
    if (Number.isNaN(level)) return;
    hits.push({ name, city, level });
  });
  return djiNfzEntriesFromHits(hits);
}

function isPointInGeoJsonPolygon(
  point: google.maps.LatLng,
  coordinates: unknown
): boolean {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return false;
  try {
    const paths = coordinates
      .map((ring: unknown) => {
        if (!Array.isArray(ring)) return [];
        return ring
          .filter(
            (pt): pt is [number, number] =>
              Array.isArray(pt) &&
              typeof pt[0] === "number" &&
              typeof pt[1] === "number"
          )
          .map(([lng, lat]) => ({ lat, lng }));
      })
      .filter((path) => path.length >= 3);
    if (paths.length === 0) return false;
    const poly = new google.maps.Polygon({ paths });
    return google.maps.geometry.poly.containsLocation(point, poly);
  } catch {
    return false;
  }
}

function isPointInGeoJsonFeature(
  point: google.maps.LatLng,
  feature: GeoJsonFeature
): boolean {
  const geom = feature.geometry;
  if (!geom || geom.coordinates == null) return false;
  if (geom.type === "Polygon") {
    return isPointInGeoJsonPolygon(point, geom.coordinates);
  }
  if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
    return geom.coordinates.some((poly) => isPointInGeoJsonPolygon(point, poly));
  }
  return false;
}

function collectDjiNfzEntriesFromGeoJson(
  geoJson: DjiNfzGeoJson,
  lat: number,
  lng: number
): DjiNfzEntryHit[] {
  const point = new google.maps.LatLng(lat, lng);
  const hits: Array<{ name: string; city?: string; level: number }> = [];
  for (const f of geoJson.features) {
    if (!isPointInGeoJsonFeature(point, f)) continue;
    const props = f.properties ?? {};
    const name = (typeof props.name === "string" && props.name) || "—";
    const city = typeof props.city === "string" ? props.city : undefined;
    const levelVal = props.level;
    const level = levelVal != null ? Number(levelVal) : NaN;
    if (Number.isNaN(level)) continue;
    hits.push({ name, city, level });
  }
  return djiNfzEntriesFromHits(hits);
}

let djiNfzKmlGeoJsonPromise: Promise<DjiNfzGeoJson> | null = null;

export async function loadDjiNfzKmlGeoJson(): Promise<DjiNfzGeoJson> {
  if (!djiNfzKmlGeoJsonPromise) {
    djiNfzKmlGeoJsonPromise = (async () => {
      const res = await fetch(DJI_NFZ_KML_URL);
      if (!res.ok) throw new Error(`KML fetch failed: ${res.status}`);
      const xmlText = await res.text();
      const doc = new DOMParser().parseFromString(xmlText, "text/xml");
      const rawGeoJson = kml(doc);
      if (!rawGeoJson) throw new Error("KML parse failed");
      return pointsToCirclePolygons(
        rawGeoJson as { type: "FeatureCollection"; features?: GeoJsonFeature[] }
      );
    })().catch((err) => {
      djiNfzKmlGeoJsonPromise = null;
      throw err;
    });
  }
  return djiNfzKmlGeoJsonPromise;
}

async function fetchDjiNfzApiGeoJson(
  lat: number,
  lng: number
): Promise<DjiNfzGeoJson> {
  const searchRadius = 50000;
  const url = `${DJI_NFZ_PROXY_URL}?lng=${lng}&lat=${lat}&search_radius=${searchRadius}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DJI API fetch failed: ${res.status}`);
  const body = await res.json();
  if (body.status === "422" || body.error) {
    throw new Error(body.extra?.msg || body.error || "API error");
  }
  return djiApiResponseToGeoJson(body);
}

/** 地図レイヤーの表示状態に依存せず、地点の DJI NFZ 該当を照会する */
export async function lookupDjiNfzEntriesAt(
  lat: number,
  lng: number
): Promise<DjiNfzEntryHit[]> {
  let geoJson: DjiNfzGeoJson;
  if (DJI_NFZ_PROXY_URL) {
    try {
      geoJson = await fetchDjiNfzApiGeoJson(lat, lng);
    } catch (apiErr) {
      console.warn("[map] DJI API failed, fallback to KML:", apiErr);
      geoJson = await loadDjiNfzKmlGeoJson();
    }
  } else {
    geoJson = await loadDjiNfzKmlGeoJson();
  }
  return collectDjiNfzEntriesFromGeoJson(geoJson, lat, lng);
}

export function buildDjiNfzPopupHtml(
  entries: Array<{
    name: string;
    city?: string;
    level: number;
    label: string;
    color: string;
  }>
): string {
  return [
    '<div class="dji-nfz-popup" style="min-width:200px;padding:4px 0;color:#000;">',
    ...entries.map(
      (e) =>
        `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:12px;color:#000;">` +
        `<span style="flex-shrink:0;width:12px;height:12px;border-radius:50%;background:${e.color};border:1px solid rgba(0,0,0,0.2);"></span>` +
        `<div style="color:#000;">` +
        `<div>名称: ${escapePopupHtml(String(e.name))}</div>` +
        `<div>レベル: ${escapePopupHtml(e.label)}</div>` +
        (e.city ? `<div>都市: ${escapePopupHtml(e.city)}</div>` : "") +
        `</div></div>`
    ),
    "</div>",
  ].join("");
}

/** DJI API の areas レスポンスを GeoJSON FeatureCollection に変換 */
export function djiApiResponseToGeoJson(body: {
  areas?: DjiArea[];
}): { type: "FeatureCollection"; features: GeoJsonFeature[] } {
  const features: GeoJsonFeature[] = [];
  const areas = body.areas || [];

  for (const area of areas) {
    const baseProps = {
      area_id: area.area_id,
      name: area.name,
      city: area.city,
    };

    const addPolygon = (
      coords: [number, number][],
      level: number | undefined
    ) => {
      if (coords.length < 3) return;
      const ring = [...coords];
      if (
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      ) {
        ring.push(ring[0]);
      }
      features.push({
        type: "Feature",
        properties: { ...baseProps, level },
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    };

    const addCircle = (
      lng: number,
      lat: number,
      radiusM: number,
      level: number | undefined
    ) => {
      const ring = circleToPolygonCoords(lng, lat, radiusM);
      features.push({
        type: "Feature",
        properties: { ...baseProps, level },
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    };

    const topPoly = normalizePolygonCoords(area.polygon_points as never);
    if (topPoly) addPolygon(topPoly, area.level);

    if (area.sub_areas?.length) {
      for (const sub of area.sub_areas) {
        const level = sub.level ?? area.level;
        const poly = normalizePolygonCoords(sub.polygon_points as never);
        if (poly) addPolygon(poly, level);
        else if (
          typeof sub.lng === "number" &&
          typeof sub.lat === "number" &&
          typeof sub.radius === "number"
        ) {
          addCircle(sub.lng, sub.lat, sub.radius, level);
        }
      }
    } else if (!topPoly && typeof area.radius === "number") {
      addCircle(area.lng, area.lat, area.radius, area.level);
    }
  }

  return { type: "FeatureCollection", features };
}
