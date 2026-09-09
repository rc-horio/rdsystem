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
 * プルダウン表示用: アクティブ（cutoff 以降）を日付昇順、Old を日付降順で結合。
 */
export function sortProjectsForDropdown<T extends WithProjectId>(
  projects: T[],
  today: Date = new Date()
): T[] {
  const { active, old } = partitionProjectsForDropdown(projects, today);
  return [...active, ...old];
}
