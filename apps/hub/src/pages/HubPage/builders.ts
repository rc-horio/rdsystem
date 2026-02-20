// src/pages/HubPage/builders.ts
import { v4 as uuid } from "uuid";
import type {
  ScheduleDetail,
  PeopleGroup,
  Person,
  PhotoItem,
} from "@/features/hub/types/resource";

/* ===== APIデータ → スケジュール（表示用） ===== */
export function buildSchedulesFromProjectData(pd: any): ScheduleDetail[] {
  if (!pd?.schedules) return [];
  return pd.schedules.map((sch: any) => {
    const scheduleId: string =
      typeof sch?.id === "string" && sch.id.trim().length > 0 ? sch.id : uuid();

    const photosMemo = sch?.photosMemo ?? "";
    const res = sch?.resources ?? {};
    const root = res.members ?? res.roles ?? {};
    const toLocalStaffRow = (x: any) => ({
      role: x?.role ?? x?.source ?? "",
      count: Number(x?.count ?? 0),
      memo: x?.memo ?? "",
    });
    const normalizeLocalStaff = (src: any) => {
      const arr = Array.isArray(src)
        ? src
        : Array.isArray(src?.members)
          ? src.members
          : src && (src.source || src.role || src.count || src.memo)
            ? [src]
            : [];
      const mapped = arr.map(toLocalStaffRow);
      return mapped.length ? mapped : [{ role: "", count: 0, memo: "" }];
    };
    const normalize = (src: any) => {
      const arr = Array.isArray(src)
        ? src
        : Array.isArray(src?.members)
          ? src.members
          : [];
      return arr.map((v: any) =>
        typeof v === "string"
          ? { name: v, role: "", memo: "" }
          : { name: v?.name ?? "", role: v?.role ?? "", memo: v?.memo ?? "" }
      );
    };

    return {
      id: scheduleId,
      label: sch.label ?? "",
      date: sch.date ?? "",
      place: sch.location ?? "",
      resource: {
        drones:
          Array.isArray(res?.drones) && res.drones.length > 0
            ? res.drones.map((d: any) => ({
              model: d.model ?? "",
              color: d.color ?? "",
              count: d.count ?? 0,
            }))
            : [{ model: "", color: "", count: 0 }],
        batteries:
          Array.isArray(res?.batteries) && res.batteries.length > 0
            ? res.batteries.map((b: any) => ({
              model: b.model ?? "",
              count: b.count ?? 0,
            }))
            : [{ model: "", count: 0 }],
        modules:
          Array.isArray(res?.modules) && res.modules.length > 0
            ? res.modules.map((m: any) => ({
              type: m.type ?? "",
              count: m.count ?? 0,
            }))
            : [{ type: "", count: 0 }],
        vehicles: {
          rows: Array.isArray(res?.vehicles?.rows)
            ? res.vehicles.rows.map((t: any) => ({
              type: t?.type ?? "",
              driver: t?.driver ?? "",
            }))
            : [{ type: "", driver: "" }],
          memo: res?.vehicles?.memo ?? "",
        },
        items: res?.equipment ?? [],
        hotels: Array.isArray(res?.hotels)
          ? res.hotels.map((h: any) => ({
            name: h?.name ?? "",
            memo: h?.memo ?? "",
          }))
          : [{ name: res?.hotel ?? "", memo: "" }],
        people: {
          groups: [
            { group: "プロデューサー", people: normalize(root?.producer) },
            { group: "ディレクター", people: normalize(root?.director) },
            { group: "オペレーター", people: normalize(root?.operator) },
            {
              group: "ベテランバイト",
              people: normalize(root?.veteran_part_time),
            },
            {
              group: "現地スタッフ",
              people: normalizeLocalStaff(
                root?.local_staff ?? res?.roles?.local_staff
              ),
            },
          ],
          memo: root?.memo ?? res?.roles?.memo ?? "",
        },
      },
      area:
        sch?.area
          ? {
            ...sch.area,
            drone_count: {
              ...(sch.area?.drone_count ?? {}),
              x_count:
                sch.area?.drone_count?.x_count ??
                null,
              y_count:
                sch.area?.drone_count?.y_count ??
                null,
            },
          }
          : undefined,
      operation: sch?.operation ?? sch?.operations ?? undefined,
      photos: Array.isArray(sch?.photos)
        ? sch.photos
          .map(
            (p: any): PhotoItem => ({
              url: String(p?.url ?? ""),
              caption: p?.caption ?? "",
              ...(p?.key ? { key: String(p.key) } : {}), // ← 追加
            })
          )
          .filter((p: PhotoItem) => p.url.length > 0)
        : [],
      photosMemo: photosMemo ?? "",
    };
  });
}

/* ===== ステート → JSON（保存用） ===== */
export function buildIndexJsonFromState(
  prev: any,
  schedules: ScheduleDetail[],
  projectId?: string,
  updatedBy?: string
) {
  const getGroup = (sch: ScheduleDetail, g: string): Person[] =>
    (sch.resource?.people?.groups ?? []).find((p: PeopleGroup) => p.group === g)
      ?.people ?? [];
  const toMemberTriples = (arr: Person[]) =>
    (arr ?? [])
      .map((p: Person) => ({
        name: (p as any)?.name ? String((p as any).name).trim() : "",
        role: (p as any)?.role ? String((p as any).role).trim() : "",
        memo: (p as any)?.memo ? String((p as any).memo).trim() : "",
      }))
      .filter((x) => x.name);

  const findPrevSchedule = (label: string, date: string) =>
    Array.isArray(prev?.schedules)
      ? prev.schedules.find((ps: any) => ps.label === label && ps.date === date)
      : undefined;

  const nextProject = {
    id: projectId ?? prev?.project?.id ?? "",
    name: prev?.project?.name ?? prev?.event?.name ?? "（名称未設定）",
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? prev?.project?.updated_by ?? "",
  };

  const nextSchedules = (schedules ?? []).map((s) => {
    const prevSch = findPrevSchedule(s.label, s.date);
    const localStaffArr = (getGroup(s, "現地スタッフ") as Person[]) ?? [];
    const localStaffMembers = localStaffArr.map((ls: any) => ({
      source: ls?.role ?? "",
      count: Number(ls?.count ?? 0),
      memo: ls?.memo ? String(ls.memo).trim() : "",
    }));
    return {
      id: s.id,
      label: s.label ?? "",
      date: s.date ?? "",
      location: s.place ?? "",
      photosMemo: (s as any)?.photosMemo ?? "",
      resources: {
        drones: (s.resource?.drones ?? []).map((d: any) => ({
          model: d.model ?? "",
          color: d.color ?? "",
          count: d.count ?? 0,
        })),
        batteries: (s.resource?.batteries ?? []).map((b: any) => ({
          model: b.model ?? "",
          count: b.count ?? 0,
        })),
        modules: (s.resource?.modules ?? []).map((m: any) => ({
          type: m.type ?? "",
          count: m.count ?? 0,
        })),
        vehicles: {
          rows: (s.resource?.vehicles?.rows ?? []).map((r) => ({
            type: r?.type ?? "",
            driver: r?.driver ?? "",
          })),
          memo: s.resource?.vehicles?.memo ?? "",
        },
        equipment: (s.resource?.items ?? []).map((it: any) => ({
          name: it?.name ?? "",
          qty: Number(it?.qty ?? 0),
        })),
        hotels: (s.resource?.hotels ?? []).map((h) => ({
          name: h?.name ?? "",
          memo: h?.memo ?? "",
        })),
        members: {
          producer: toMemberTriples(getGroup(s, "プロデューサー")),
          director: toMemberTriples(getGroup(s, "ディレクター")),
          operator: toMemberTriples(getGroup(s, "オペレーター")),
          veteran_part_time: {
            members: toMemberTriples(getGroup(s, "ベテランバイト")),
          },
          local_staff: {
            members: localStaffMembers,
          },
          memo: s.resource?.people?.memo ?? "",
        },
      },
      operation: s.operation ?? prevSch?.operation ?? undefined,
      area: s.area
        ? {
          ...s.area,
          drone_count: {
            ...(s as any)?.area?.drone_count,
            x_count: (s as any)?.area?.drone_count?.x_count ?? null,
            y_count: (s as any)?.area?.drone_count?.y_count ?? null,
          },
        }
        : prevSch?.area ?? undefined,
      photos: Array.isArray(s.photos)
        ? s.photos
          .map((p: any) => ({
            url: String(p?.url ?? ""),
            caption: p?.caption ?? "",
            ...(p?.key ? { key: String(p.key) } : {}),
          }))
          .filter((p: any) => p.url.length > 0)
        : [],
    };
  });

  return { project: nextProject, schedules: nextSchedules } as const;
}
