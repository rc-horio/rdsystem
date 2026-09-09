import type { ScheduleDetail } from "@/features/hub/types/resource";
import { getEffectiveBlocks, hasBlocks } from "@/features/hub/utils/areaBlocks";

/** どれかのスケジュールで離発着ボックスを使っていれば true */
export function projectUsesTakeoffLandingBox(
  schedules: Pick<ScheduleDetail, "area">[] | null | undefined
): boolean {
  return (schedules ?? []).some((s) => Boolean(s?.area?.use_takeoff_landing_box));
}

/** その日の総機体数。複数ブロックは合計、それ以外は drone_count.count */
export function scheduleDroneCount(
  area: ScheduleDetail["area"] | null | undefined
): number | undefined {
  if (!area) return undefined;
  if (hasBlocks(area)) {
    let sum = 0;
    let any = false;
    for (const block of getEffectiveBlocks(area)) {
      const n = Number(block?.count);
      if (!Number.isFinite(n) || n < 0) continue;
      sum += n;
      any = true;
    }
    return any ? sum : undefined;
  }
  const n = Number(area?.drone_count?.count);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/** 案件の最大機体数（スケジュール横断） */
export function projectMaxDroneCount(
  schedules: Pick<ScheduleDetail, "area">[] | null | undefined
): number | undefined {
  let max: number | undefined;
  for (const s of schedules ?? []) {
    const n = scheduleDroneCount(s?.area);
    if (n == null) continue;
    max = max == null ? n : Math.max(max, n);
  }
  return max;
}

function scheduleOperationModules(
  schedule: { operation?: { modules?: { kind?: unknown }[] } } | null | undefined
): { kind?: unknown }[] {
  const mods = schedule?.operation?.modules;
  return Array.isArray(mods) ? mods : [];
}

/** どれかの日のオペレーションにフラッシュがあれば true */
export function projectHasFlash(
  schedules: Pick<ScheduleDetail, "operation">[] | null | undefined
): boolean {
  return (schedules ?? []).some((s) =>
    scheduleOperationModules(s).some((m) => m?.kind === "flash")
  );
}

/** どれかの日のオペレーションに花火があれば true */
export function projectHasFireworks(
  schedules: Pick<ScheduleDetail, "operation">[] | null | undefined
): boolean {
  return (schedules ?? []).some((s) =>
    scheduleOperationModules(s).some((m) => m?.kind === "fireworks")
  );
}
