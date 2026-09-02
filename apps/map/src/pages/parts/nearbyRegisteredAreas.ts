import { fetchAreasList, fetchProjectsList, fetchRawAreaInfo } from "./areasApi";
import { AREA_NAME_NONE } from "./constants/events";

export const NEARBY_AREA_RADIUS_M = 2000;

export type NearbyRegisteredArea = {
  areaName: string;
  projectNames: string[];
  distanceM: number;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readAreaListEntry(raw: unknown): {
  uuid: string;
  areaName: string;
  lat: number;
  lng: number;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const coord =
    a.representative_coordinate && typeof a.representative_coordinate === "object"
      ? (a.representative_coordinate as Record<string, unknown>)
      : null;
  const lat = coord?.lat;
  const lng = coord?.lon ?? coord?.lng;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;

  const uuid =
    typeof a.uuid === "string" && a.uuid.trim()
      ? a.uuid.trim()
      : typeof a.areaUuid === "string" && a.areaUuid.trim()
        ? a.areaUuid.trim()
        : "";
  if (!uuid) return null;

  const areaName =
    typeof a.areaName === "string" && a.areaName.trim()
      ? a.areaName.trim()
      : AREA_NAME_NONE;

  return { uuid, areaName, lat: Number(lat), lng: Number(lng) };
}

function projectNamesFromHistory(
  info: unknown,
  nameByUuid: Map<string, string>
): string[] {
  const row =
    info && typeof info === "object" ? (info as Record<string, unknown>) : {};
  const history = Array.isArray(row.history) ? row.history : [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const entry of history) {
    if (!entry || typeof entry !== "object") continue;
    const h = entry as Record<string, unknown>;
    const projectUuid =
      typeof h.projectuuid === "string"
        ? h.projectuuid
        : typeof h.projectUuid === "string"
          ? h.projectUuid
          : "";
    if (!projectUuid || seen.has(projectUuid)) continue;
    seen.add(projectUuid);
    const name = nameByUuid.get(projectUuid)?.trim();
    if (name) names.push(name);
  }
  return names;
}

/** クリック地点から 2km 以内の登録済みエリア。ピン座標で判定する。 */
export async function findNearbyRegisteredAreas(params: {
  lat: number;
  lng: number;
  distanceM: (toLat: number, toLng: number) => number;
}): Promise<NearbyRegisteredArea[]> {
  const { distanceM } = params;
  const list = await fetchAreasList();
  const nearby = list
    .map(readAreaListEntry)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      ...p,
      distanceM: distanceM(p.lat, p.lng),
    }))
    .filter((p) => p.distanceM <= NEARBY_AREA_RADIUS_M)
    .sort((a, b) => a.distanceM - b.distanceM);

  if (nearby.length === 0) return [];

  const [projects, ...infos] = await Promise.all([
    fetchProjectsList(),
    ...nearby.map((p) => fetchRawAreaInfo(p.uuid)),
  ]);

  const nameByUuid = new Map<string, string>();
  for (const project of projects) {
    if (project.uuid && project.projectName?.trim()) {
      nameByUuid.set(project.uuid, project.projectName.trim());
    }
  }

  return nearby.map((p, i) => ({
    areaName: p.areaName,
    projectNames: projectNamesFromHistory(infos[i], nameByUuid),
    distanceM: p.distanceM,
  }));
}

export function buildNearbyAreasConfirmHtml(
  areas: NearbyRegisteredArea[]
): string {
  if (areas.length === 0) return "";

  const items = areas
    .map((area) => {
      const name = escapeHtml(area.areaName);
      const projects =
        area.projectNames.length > 0
          ? `<div style="color:#666;font-size:12px;font-weight:400;margin-top:2px;line-height:1.4;">案件：${escapeHtml(
              area.projectNames.join("、")
            )}</div>`
          : "";
      return `<li style="margin:0 0 8px;padding:0;line-height:1.45;">
        <span style="color:#222;font-size:13px;font-weight:400;">${name}</span>
        ${projects}
      </li>`;
    })
    .join("");

  return `
    <div>
      <div style="padding:10px 12px;background:#fff8ee;border-radius:4px;max-height:240px;overflow-y:auto;">
        <div style="color:#111;font-size:13px;font-weight:600;margin-bottom:8px;">近くに登録済みのエリアがあります</div>
        <ul style="margin:0;padding:0 0 0 1.25em;list-style:disc;">${items}</ul>
      </div>
    </div>
  `;
}
