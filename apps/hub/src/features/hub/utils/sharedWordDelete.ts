import {
  removeCatalogWord,
  writeCatalogJson,
} from "@/features/hub/utils/wordsCatalog";

const CATALOG = String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(
  /\/+$/,
  ""
);

type ScheduleLike = { words?: unknown };

export type OpenProjectWords = {
  uuid?: string | null;
  schedules: ScheduleLike[];
};

function normalizeWords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const words: string[] = [];
  for (const item of raw) {
    const word = String(item ?? "").trim();
    if (!word || words.includes(word)) continue;
    words.push(word);
  }
  return words;
}

function hasWord(raw: unknown, word: string): boolean {
  return normalizeWords(raw).includes(word);
}

async function fetchProjectUuids(): Promise<string[] | null> {
  if (!CATALOG) return null;
  try {
    const res = await fetch(`${CATALOG}/projects.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    const uuids: string[] = [];
    for (const row of data) {
      const uuid = String(row?.uuid ?? "").trim();
      if (!uuid || uuids.includes(uuid)) continue;
      uuids.push(uuid);
    }
    return uuids;
  } catch {
    return null;
  }
}

async function fetchProjectIndex(
  uuid: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${CATALOG}/projects/${uuid}/index.json`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

function indexHasWord(index: Record<string, unknown>, word: string): boolean {
  const schedules = Array.isArray(index.schedules) ? index.schedules : [];
  return schedules.some(
    (schedule) =>
      !!schedule &&
      typeof schedule === "object" &&
      hasWord((schedule as ScheduleLike).words, word)
  );
}

function stripWordFromIndex(
  index: Record<string, unknown>,
  word: string
): { next: Record<string, unknown>; changed: boolean } {
  const schedules = Array.isArray(index.schedules) ? index.schedules : [];
  let changed = false;
  const nextSchedules = schedules.map((schedule) => {
    if (!schedule || typeof schedule !== "object") return schedule;
    const words = normalizeWords((schedule as ScheduleLike).words);
    if (!words.includes(word)) return schedule;
    changed = true;
    return { ...schedule, words: words.filter((item) => item !== word) };
  });
  if (!changed) return { next: index, changed: false };
  return { next: { ...index, schedules: nextSchedules }, changed: true };
}

/** この語が付いている案件の数。一覧を読めないときは null */
export async function countProjectsWithWord(
  word: string,
  openProject: OpenProjectWords
): Promise<number | null> {
  const target = word.trim();
  if (!target) return 0;
  const uuids = await fetchProjectUuids();
  if (uuids === null) return null;
  const openUuid = String(openProject.uuid ?? "").trim();
  const memoryHas = openProject.schedules.some((schedule) =>
    hasWord(schedule.words, target)
  );
  const indexes = await Promise.all(
    uuids.map(async (uuid) => ({
      uuid,
      index: await fetchProjectIndex(uuid),
    }))
  );
  let count = 0;
  let sawOpen = false;
  for (const item of indexes) {
    const isOpen = item.uuid === openUuid;
    if (isOpen) sawOpen = true;
    const serverHas = item.index ? indexHasWord(item.index, target) : false;
    if (serverHas || (isOpen && memoryHas)) count += 1;
  }
  if (openUuid && !sawOpen && memoryHas) count += 1;
  return count;
}

export async function removeWordFromAllProjects(
  word: string,
  openUuid?: string | null
): Promise<{ ok: boolean; openProjectCleared: boolean }> {
  const target = word.trim();
  if (!target) return { ok: false, openProjectCleared: false };
  const uuids = await fetchProjectUuids();
  if (uuids === null) return { ok: false, openProjectCleared: false };
  const current = String(openUuid ?? "").trim();
  let failed = false;
  let openProjectCleared = false;

  for (const uuid of uuids) {
    const index = await fetchProjectIndex(uuid);
    if (!index) continue;
    const stripped = stripWordFromIndex(index, target);
    if (!stripped.changed) continue;
    const wrote = await writeCatalogJson(
      `catalog/v1/projects/${uuid}/index.json`,
      stripped.next
    );
    if (!wrote) {
      failed = true;
      continue;
    }
    if (uuid === current) openProjectCleared = true;
  }

  if (failed) return { ok: false, openProjectCleared };
  const removed = await removeCatalogWord(target);
  return { ok: removed, openProjectCleared };
}
