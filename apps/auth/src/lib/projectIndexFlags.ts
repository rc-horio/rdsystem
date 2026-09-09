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
