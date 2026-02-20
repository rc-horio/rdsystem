/**
 * カタログ（S3）操作 API
 * プロジェクト削除時に、エリア紐づきチェック・解除・プロジェクト削除に使用
 */
import { getAuditHeaders } from "./auditHeaders";

const CATALOG =
  String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(/\/+$/, "") + "/";

// 開発時は Vite プロキシ経由で CORS 回避
const WRITE_URL = import.meta.env.DEV
  ? "/__catalog-write"
  : String(import.meta.env.VITE_CATALOG_WRITE_URL || "").replace(/\/+$/, "");

const DELETE_URL = import.meta.env.DEV
  ? "/__catalog-delete"
  : String(import.meta.env.VITE_CATALOG_DELETE_URL || "").replace(/\/+$/, "");

const GET_INIT: RequestInit = { mode: "cors", cache: "no-store" };

async function getJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, GET_INIT);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function writeJsonToCatalog(key: string, body: unknown): Promise<boolean> {
  if (!WRITE_URL) {
    console.error("[catalogApi] VITE_CATALOG_WRITE_URL is not set");
    return false;
  }
  try {
    const auditHeaders = await getAuditHeaders();
    const res = await fetch(WRITE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auditHeaders },
      body: JSON.stringify({
        key,
        body,
        contentType: "application/json; charset=utf-8",
      }),
    });
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!res.ok || data?.error) {
      console.error("[catalogApi] writeJsonToCatalog failed:", data?.error ?? raw);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[catalogApi] writeJsonToCatalog error:", e);
    return false;
  }
}

/** areas.json を読み、エリア一覧を返す */
export async function fetchAreasList(): Promise<{ uuid?: string; areaName?: string }[]> {
  const data = await getJson<{ uuid?: string; areaName?: string }[]>(CATALOG + "areas.json");
  return Array.isArray(data) ? data : [];
}

/** areas/<areaUuid>/index.json を読み、生データを返す */
export async function fetchRawAreaInfo(areaUuid: string): Promise<Record<string, unknown>> {
  if (!areaUuid) return {};
  const url = `${CATALOG}areas/${encodeURIComponent(areaUuid)}/index.json`;
  const data = await getJson<Record<string, unknown>>(url);
  return data ?? {};
}

/** areas/<areaUuid>/index.json を保存 */
export async function saveAreaInfo(
  areaUuid: string,
  info: Record<string, unknown>
): Promise<boolean> {
  if (!areaUuid) return false;
  return writeJsonToCatalog(`catalog/v1/areas/${areaUuid}/index.json`, info);
}

/** projects/<projectUuid>/index.json を読み、プロジェクト情報を返す */
export async function fetchProjectIndex(
  projectUuid: string
): Promise<Record<string, unknown> | null> {
  if (!projectUuid) return null;
  const url = `${CATALOG}projects/${encodeURIComponent(projectUuid)}/index.json`;
  const data = await getJson<Record<string, unknown>>(url);
  return data ?? null;
}

/**
 * プロジェクト index.json から、削除対象の S3 キー一覧を抽出
 * - index.json 自体
 * - schedules[].photos[].key（catalog/v1/projects/{uuid}/ 配下のみ）
 */
export function extractProjectDeleteKeys(
  projectUuid: string,
  projectIndex: Record<string, unknown>
): string[] {
  const prefix = `catalog/v1/projects/${projectUuid}/`;
  const keys: string[] = [`catalog/v1/projects/${projectUuid}/index.json`];

  const schedules = projectIndex?.schedules;
  if (!Array.isArray(schedules)) return keys;

  for (const sch of schedules) {
    const photos = sch?.photos;
    if (!Array.isArray(photos)) continue;
    for (const p of photos) {
      const k = typeof p?.key === "string" ? p.key : "";
      if (k && k.startsWith(prefix)) keys.push(k);
    }
  }
  return [...new Set(keys)];
}

/**
 * カタログの S3 オブジェクトを削除（複数キー対応）
 * 成功なら true
 */
export async function deleteFromCatalog(keys: string[]): Promise<boolean> {
  if (!DELETE_URL) {
    console.error("[catalogApi] VITE_CATALOG_DELETE_URL is not set");
    return false;
  }
  const validKeys = keys.filter((k) => k && k.startsWith("catalog/v1/"));
  if (validKeys.length === 0) return false;

  try {
    const auditHeaders = await getAuditHeaders();
    const res = await fetch(DELETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auditHeaders },
      body: JSON.stringify({ keys: validKeys }),
    });

    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!res.ok || !data?.ok) {
      console.error("[catalogApi] deleteFromCatalog failed:", data?.error ?? raw);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[catalogApi] deleteFromCatalog error:", e);
    return false;
  }
}
