// builders.ts など
import type { ScheduleDetail } from "@/features/hub/types/resource";

/**
 * 画面 state から S3 に保存する index.json を構築
 * - project.id / updated_at を補正
 * - photosMemo を含める
 * - 写真配列からブラウザ専用の __file を除去
 * - 未定義の入れ子は既定形で補完（なるべく現行の初期形に揃える）
 */
export function buildIndexJsonFromState(
  projectData: any,
  schedules: ScheduleDetail[],
  projectId: string
) {
  const now = new Date().toISOString();

  const project = {
    ...(projectData?.project ?? {}),
    id: projectId,
    // name / updated_by など既存を尊重しつつ updated_at だけ上書き
    updated_at: now,
  };

  const ensureResource = (r: any = {}) => ({
    drones: Array.isArray(r.drones)
      ? r.drones
      : [{ model: "", color: "", count: 0 }],
    batteries: Array.isArray(r.batteries) ? r.batteries : [{ count: 0 }],
    modules: Array.isArray(r.modules) ? r.modules : [{ type: "", count: 0 }],
    vehicles:
      r.vehicles && typeof r.vehicles === "object"
        ? {
            rows: Array.isArray(r.vehicles.rows)
              ? r.vehicles.rows
              : [{ type: "", driver: "" }],
            memo: r.vehicles.memo ?? "",
          }
        : { rows: [{ type: "", driver: "" }], memo: "" },
    items: Array.isArray(r.items) ? r.items : [],
    hotels: Array.isArray(r.hotels) ? r.hotels : [],
    people:
      r.people && typeof r.people === "object"
        ? {
            groups: Array.isArray(r.people.groups) ? r.people.groups : [],
            memo: r.people.memo ?? "",
          }
        : { groups: [], memo: "" },
  });

  const ensureArea = (a: any = {}) => ({
    area_name: a.area_name ?? "",
    drone_count: a.drone_count ?? { model: "", count: 0 },
    // flight_area: a.flight_area ?? {
    //   altitude_min_m: null,
    //   altitude_max_m: null,
    //   safety_area_m: null,
    // },
    actions: a.actions ?? { liftoff: "", turn: "" },
    obstacle_note: a.obstacle_note ?? "",
    lights: a.lights ?? { takeoff: "", landing: "" },
    return_note: a.return_note ?? "",
    animation_area: a.animation_area ?? { width_m: null, depth_m: null },
    distance_from_viewers_m: a.distance_from_viewers_m ?? null,
    spacing_between_drones_m: a.spacing_between_drones_m ?? {
      horizontal: "",
      vertical: "",
    },
  });

  const ensureOperation = (o: any = {}) => ({
    placement: o.placement ?? { x: null, y: null, spacing_m: null },
    modules: Array.isArray(o.modules) ? o.modules : [],
    measurement: o.measurement ?? { target_id: null, result: null },
    memo: o.memo ?? "",
  });

  const cleanPhoto = (p: any) => {
    if (!p || typeof p !== "object") return { url: "", caption: "" };
    // __file は保存しない。それ以外の追加メタは極力維持
    const { __file, ...rest } = p;
    return rest;
  };

  const outSchedules = (schedules ?? []).map((s) => ({
    id: s.id,
    label: s.label ?? "",
    date: s.date ?? "",
    place: s.place ?? "",
    photosMemo: (s as any).photosMemo ?? "",
    resource: ensureResource((s as any).resource),
    area: ensureArea((s as any).area),
    operation: ensureOperation((s as any).operation),
    photos: Array.isArray(s.photos) ? s.photos.map(cleanPhoto) : [],
  }));

  return {
    project,
    schedules: outSchedules,
  };
}
