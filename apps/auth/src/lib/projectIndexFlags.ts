/** どれかのスケジュールで離発着ボックスを使っていれば true */
export function indexUsesTakeoffLandingBox(
  data: Record<string, unknown> | null
): boolean {
  const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
  return schedules.some(
    (s: { area?: { use_takeoff_landing_box?: boolean } }) =>
      Boolean(s?.area?.use_takeoff_landing_box)
  );
}

function scheduleOperationModules(schedule: unknown): { kind?: unknown }[] {
  if (!schedule || typeof schedule !== "object") return [];
  const s = schedule as {
    operation?: { modules?: unknown };
    operations?: { modules?: unknown };
  };
  const op = s.operation ?? s.operations;
  const mods = op?.modules;
  return Array.isArray(mods) ? (mods as { kind?: unknown }[]) : [];
}

function indexHasModuleKind(
  data: Record<string, unknown> | null,
  kind: "flash" | "fireworks"
): boolean {
  const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
  return schedules.some((s) =>
    scheduleOperationModules(s).some((m) => m?.kind === kind)
  );
}

export function indexHasFlash(data: Record<string, unknown> | null): boolean {
  return indexHasModuleKind(data, "flash");
}

export function indexHasFireworks(data: Record<string, unknown> | null): boolean {
  return indexHasModuleKind(data, "fireworks");
}

function scheduleDroneCount(area: unknown): number | undefined {
  if (!area || typeof area !== "object") return undefined;
  const a = area as {
    blocks?: { count?: unknown }[];
    drone_count?: { count?: unknown };
  };
  if (Array.isArray(a.blocks) && a.blocks.length > 0) {
    let sum = 0;
    let any = false;
    for (const block of a.blocks) {
      const n = Number(block?.count);
      if (!Number.isFinite(n) || n < 0) continue;
      sum += n;
      any = true;
    }
    return any ? sum : undefined;
  }
  const n = Number(a.drone_count?.count);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/** 案件の最大機体数。取れなければ 0（未解決と区別するため） */
export function indexMaxDroneCount(data: Record<string, unknown> | null): number {
  const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
  let max: number | undefined;
  for (const s of schedules as { area?: unknown }[]) {
    const n = scheduleDroneCount(s?.area);
    if (n == null) continue;
    max = max == null ? n : Math.max(max, n);
  }
  return max ?? 0;
}

export function indexProjectCatalogFlags(data: Record<string, unknown> | null) {
  return {
    usesTakeoffLandingBox: indexUsesTakeoffLandingBox(data),
    droneCount: indexMaxDroneCount(data),
    hasFlash: indexHasFlash(data),
    hasFireworks: indexHasFireworks(data),
  };
}

const PROJECT_MODEL_SEED = ["EMO", "FYLO", "Hula", "RiFF", "TAKE"];

/** 固定の5機種のあと、保存済み models にだけある名前を初めて出た順で足す */
export function projectModelOptions(
  projects: { models?: unknown }[] | null | undefined
): string[] {
  const options = [...PROJECT_MODEL_SEED];
  for (const project of projects ?? []) {
    if (!Array.isArray(project?.models)) continue;
    for (const item of project.models) {
      const name = String(item ?? "").trim();
      if (!name || options.includes(name)) continue;
      options.push(name);
    }
  }
  return options;
}

/** 機種未選択なら全件。選択中は models にそのいずれかがある案件だけ */
export function projectMatchesModels(
  project: { models?: unknown },
  selected: string[]
): boolean {
  if (selected.length === 0) return true;
  if (!Array.isArray(project.models)) return false;
  const have = new Set<string>();
  for (const item of project.models) {
    const name = String(item ?? "").trim();
    if (name) have.add(name);
  }
  return selected.some((name) => have.has(name));
}

export function projectMatchesFilters(
  project: {
    hasFlash?: boolean;
    hasFireworks?: boolean;
    usesTakeoffLandingBox?: boolean;
  },
  filters: { flash: boolean; fireworks: boolean; takeoffBox: boolean }
): boolean {
  const anyOn = filters.flash || filters.fireworks || filters.takeoffBox;
  if (!anyOn) return true;
  if (filters.flash && Boolean(project.hasFlash)) return true;
  if (filters.fireworks && Boolean(project.hasFireworks)) return true;
  if (filters.takeoffBox && Boolean(project.usesTakeoffLandingBox)) return true;
  return false;
}
