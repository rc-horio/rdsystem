/** projectId 先頭 yymmdd からローカル日付（00:00）を取得。無効なら null */
export function parseProjectDateFromId(projectId: string): Date | null {
  const match = (projectId || "").match(/^(\d{6})/);
  if (!match) return null;

  const digits = match[1];
  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  const fullYear = 2000 + yy;
  const date = new Date(fullYear, mm - 1, dd);
  const valid =
    date.getFullYear() === fullYear &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd;
  if (!valid) return null;

  return startOfDay(date);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 今日から1か月前の日付（カレンダー上・ローカル） */
export function getActiveCutoffDate(today: Date = new Date()): Date {
  const t = startOfDay(today);
  return startOfDay(new Date(t.getFullYear(), t.getMonth() - 1, t.getDate()));
}

type WithProjectId = { projectId: string };

/** react-select グループ見出し用（区切り線表示） */
export const PROJECT_SELECT_DIVIDER_LABEL = "__project_select_divider__";

export function partitionProjectsForDropdown<T extends WithProjectId>(
  projects: T[],
  today: Date = new Date()
): { active: T[]; old: T[] } {
  const cutoff = getActiveCutoffDate(today);

  const active: { project: T; date: Date }[] = [];
  const oldValid: { project: T; date: Date }[] = [];
  const oldInvalid: T[] = [];

  for (const project of projects) {
    const date = parseProjectDateFromId(project.projectId);
    if (!date) {
      oldInvalid.push(project);
      continue;
    }
    if (date.getTime() >= cutoff.getTime()) {
      active.push({ project, date });
    } else {
      oldValid.push({ project, date });
    }
  }

  const byProjectId = (a: T, b: T) =>
    (a.projectId || "").localeCompare(b.projectId || "");

  active.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return diff !== 0 ? diff : byProjectId(a.project, b.project);
  });

  oldValid.sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime();
    return diff !== 0 ? diff : byProjectId(a.project, b.project);
  });

  oldInvalid.sort(byProjectId);

  return {
    active: active.map((x) => x.project),
    old: [...oldValid.map((x) => x.project), ...oldInvalid],
  };
}

/** 開催日（projectId 先頭 yymmdd）。日付が取れない案件は末尾 */
export function sortProjectsByEventDate<T extends WithProjectId>(
  projects: T[],
  dir: "asc" | "desc"
): T[] {
  const dated: { project: T; time: number }[] = [];
  const undated: T[] = [];

  for (const project of projects) {
    const date = parseProjectDateFromId(project.projectId);
    if (!date) {
      undated.push(project);
      continue;
    }
    dated.push({ project, time: date.getTime() });
  }

  const byProjectId = (a: T, b: T) =>
    (a.projectId || "").localeCompare(b.projectId || "");

  dated.sort((a, b) => {
    const diff = a.time - b.time;
    if (diff !== 0) return dir === "asc" ? diff : -diff;
    return byProjectId(a.project, b.project);
  });
  undated.sort(byProjectId);

  return [...dated.map((x) => x.project), ...undated];
}

type WithDroneCount = WithProjectId & { droneCount?: number };

/** 機体数。未設定は末尾 */
export function sortProjectsByDroneCount<T extends WithDroneCount>(
  projects: T[],
  dir: "asc" | "desc"
): T[] {
  const byProjectId = (a: T, b: T) =>
    (a.projectId || "").localeCompare(b.projectId || "");

  return [...projects].sort((a, b) => {
    const missingA = a.droneCount == null;
    const missingB = b.droneCount == null;
    if (missingA !== missingB) return missingA ? 1 : -1;
    if (missingA && missingB) return byProjectId(a, b);
    const diff = (a.droneCount ?? 0) - (b.droneCount ?? 0);
    if (diff !== 0) return dir === "asc" ? diff : -diff;
    return byProjectId(a, b);
  });
}

/**
 * 機体数の区分。RD Map の getDroneCountGroupLabel と同じ境界。
 * null / undefined は未設定。0 は「0」。
 */
export function droneCountGroupLabel(count: number | null | undefined): string {
  if (count === undefined || count === null) return "未設定";
  if (count === 0) return "0";
  if (count <= 100) return "~100";
  if (count <= 200) return "~200";
  if (count <= 300) return "~300";
  if (count <= 400) return "~400";
  if (count <= 500) return "~500";
  if (count <= 600) return "~600";
  if (count <= 700) return "~700";
  if (count <= 800) return "~800";
  if (count <= 900) return "~900";
  if (count <= 1000) return "~1000";
  if (count <= 1500) return "~1500";
  if (count <= 2000) return "~2000";
  if (count <= 2500) return "~2500";
  if (count <= 3000) return "~3000";
  if (count <= 3500) return "~3500";
  if (count <= 4000) return "~4000";
  if (count <= 4500) return "~4500";
  if (count <= 5000) return "~5000";
  return "5000~";
}

export type DroneCountListRow<T> =
  | { kind: "heading"; label: string }
  | { kind: "item"; item: T };

/**
 * 機体数で並び済みの一覧に、区分が変わったところだけ見出しを挟む。
 * 空の区分は出さない。並び順は変えない（未設定はソート側で末尾）。
 */
export function withDroneCountHeadings<T extends { droneCount?: number | null }>(
  items: readonly T[]
): DroneCountListRow<T>[] {
  const rows: DroneCountListRow<T>[] = [];
  let previous: string | undefined;
  for (const item of items) {
    const label = droneCountGroupLabel(item.droneCount);
    if (label !== previous) {
      rows.push({ kind: "heading", label });
      previous = label;
    }
    rows.push({ kind: "item", item });
  }
  return rows;
}

/**
 * プルダウン表示用: アクティブ（cutoff 以降）を日付昇順、Old を日付降順で結合。
 */
export function sortProjectsForDropdown<T extends WithProjectId>(
  projects: T[],
  today: Date = new Date()
): T[] {
  const { active, old } = partitionProjectsForDropdown(projects, today);
  return [...active, ...old];
}
