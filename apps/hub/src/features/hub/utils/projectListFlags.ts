import type { ScheduleDetail } from "@/features/hub/types/resource";

/** どれかのスケジュールで離発着ボックスを使っていれば true */
export function projectUsesTakeoffLandingBox(
  schedules: Pick<ScheduleDetail, "area">[] | null | undefined
): boolean {
  return (schedules ?? []).some((s) => Boolean(s?.area?.use_takeoff_landing_box));
}
