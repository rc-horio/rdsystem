// src/pages/parts/areasApi.ts
import type { HistoryLite, DetailMeta } from "@/features/types";
import { S3_BASE } from "./constants/events";

// ========= Internals =========
const GET_INIT: RequestInit = { mode: "cors", cache: "no-store" };
// S3 に匿名 PUT するため、保存直後に誰でも GET できるよう ACL を付与
const JSON_HEADERS = {
    "Content-Type": "application/json" as const,
    "x-amz-acl": "public-read" as const
};
const areaIndexUrl = (uuid: string) =>
    `${S3_BASE}areas/${encodeURIComponent(uuid)}/index.json`;
const projectIndexUrl = (uuid: string) =>
    `${S3_BASE}projects/${encodeURIComponent(uuid)}/index.json`;

async function getJson<T = any>(url: string): Promise<T | null> {
    try {
        const r = await fetch(url, GET_INIT);
        if (!r.ok) return null;
        return (await r.json()) as T;
    } catch {
        return null;
    }
}

const toStr = (v: unknown) => (v == null ? "" : String(v));

// ========= Public APIs =========


/** =========================
 *  エリア一覧の取得
 *  ========================= */
/** areas.json を読み、エリア一覧を返す。存在しない場合は空 */
export async function fetchAreasList(): Promise<any[]> {
    const data = await getJson<any[]>(S3_BASE + "areas.json");
    return Array.isArray(data) ? data : [];
}

/** areas.json を保存（PUT）。成功なら true */
export async function saveAreasList(list: any[]): Promise<boolean> {
    try {
        const r = await fetch(S3_BASE + "areas.json", {
            method: "PUT",
            mode: "cors",
            headers: JSON_HEADERS,
            body: JSON.stringify(list, null, 2),
        });
        return r.ok;
    } catch (e) {
        console.error("saveAreasList error", e);
        return false;
    }
}

/** index.json の内容から areas.json の該当レコードを upsert。成功なら true */
export async function upsertAreasListEntryFromInfo(params: {
    areaId: string;
    areaName: string;
    prefecture?: string;
    lat?: number;
    lon?: number; // = lng
}): Promise<boolean> {
    const { areaId, areaName, prefecture, lat, lon } = params;
    const list = await fetchAreasList();

    const idx = list.findIndex((x: any) => x?.areaId === areaId);
    const base = idx >= 0 ? list[idx] : {};

    const next = {
        ...base,
        areaId,
        areaName,
        prefecture: prefecture ?? base.prefecture ?? "",
        representative_coordinate: {
            lat:
                typeof lat === "number"
                    ? lat
                    : base?.representative_coordinate?.lat ?? undefined,
            lon:
                typeof lon === "number"
                    ? lon
                    : base?.representative_coordinate?.lon ??
                    base?.representative_coordinate?.lng ??
                    undefined,
        },
        projectCount:
            typeof base?.projectCount === "number" ? base.projectCount : 0,
    };

    if (idx >= 0) list[idx] = next;
    else list.push(next);

    return await saveAreasList(list);
}

/** areas/<areaUuid>/index.json を読み、エリア情報を返す。存在しない場合は空 */
export async function fetchRawAreaInfo(areaUuid?: string): Promise<any> {
    if (!areaUuid) return {};
    const data = await getJson<any>(areaIndexUrl(areaUuid));
    return data ?? {};
}

/** areas/<areaUuid>/index.json を読み、タイトルと履歴を返す。存在しない場合は履歴空 */
export async function fetchAreaInfo(
    areaUuid?: string,
    fallbackAreaName?: string
): Promise<{ title: string; history: HistoryLite[]; meta: DetailMeta }> {
    if (!areaUuid) {
        if (import.meta.env.DEV) {
            console.debug(
                "[areasApi] skip fetch (no areaUuid). title=",
                fallbackAreaName
            );
        }
        return {
            title: fallbackAreaName || "（名称未設定）",
            history: [],
            meta: parseDetailMeta({}, fallbackAreaName),
        };
    }

    const info = await getJson<any>(areaIndexUrl(areaUuid));
    if (!info) {
        return {
            title: fallbackAreaName || "（名称未設定）",
            history: [],
            meta: parseDetailMeta({}, fallbackAreaName),
        };
    }

    const title: string =
        (typeof info?.areaName === "string" && info.areaName) ||
        fallbackAreaName ||
        "（名称未設定）";

    const histRaw: any[] = Array.isArray(info?.history) ? info.history : [];
    const history: HistoryLite[] = histRaw.flatMap((h) => {
        const label =
            (typeof h?.scheduleLabel === "string" && h.scheduleLabel) ||
            (typeof h?.label === "string" && h.label) ||
            null;
        const date = typeof h?.date === "string" ? h.date : null;
        return label && date ? [{ label, date }] : [];
    });

    return { title, history, meta: parseDetailMeta(info, fallbackAreaName) };
}


/** =========================
 *  プロジェクト一覧の取得
 *  ========================= */
/** projects.json を読み、プロジェクト一覧を返す。存在しない場合は空 */
export async function fetchProjectsList(): Promise<
    { uuid: string; projectId: string; projectName: string }[]
> {
    const data = await getJson<
        { uuid: string; projectId: string; projectName: string }[]
    >(S3_BASE + "projects.json");
    return Array.isArray(data) ? data : [];
}

/** projects/<projectUuid>/index.json を読み、プロジェクト情報を返す。存在しない場合は null */
export async function fetchProjectIndex(projectUuid: string): Promise<any> {
    const data = await getJson<any>(projectIndexUrl(projectUuid));
    return data ?? null;
}

/** project配下から area に紐づく履歴を抽出して返す */
export async function buildAreaHistoryFromProjects(areaUuid: string): Promise<
    Array<{
        date: string;
        projectName: string;
        scheduleName: string;
        kind?: string;
        droneCount?: number;
        projectUuid: string;
        scheduleUuid: string;
    }>
> {
    // 1) エリアの index を取得して、(projectuuid, scheduleuuid) のペアを抜き出し
    const area = await fetchRawAreaInfo(areaUuid);
    const pairs: Array<{ projectUuid: string; scheduleUuid: string }> =
        Array.isArray(area?.history)
            ? area.history.flatMap((h: any) => {
                const projectUuid =
                    typeof h?.projectuuid === "string" ? h.projectuuid : null;
                const scheduleUuid =
                    typeof h?.scheduleuuid === "string" ? h.scheduleuuid : null;
                return projectUuid && scheduleUuid
                    ? [{ projectUuid, scheduleUuid }]
                    : [];
            })
            : [];

    if (pairs.length === 0) return [];

    // 2) 必要なプロジェクトだけを並列取得（ユニーク化）
    const projectUuids = [...new Set(pairs.map((p) => p.projectUuid))];
    const projectEntries = await Promise.all(
        projectUuids.map(async (uuid) => {
            const idx = await fetchProjectIndex(uuid);
            return [uuid, idx] as const;
        })
    );
    const projectMap = new Map<string, any>(
        projectEntries.filter(([, idx]) => !!idx) as Array<[string, any]>
    );

    // 3) 各ペアを project/schedule に突き合わせて表示行を組み立て
    const rows = pairs.flatMap(({ projectUuid, scheduleUuid }) => {
        const pj = projectMap.get(projectUuid);
        if (!pj) return [];

        const projectName =
            (typeof pj?.project?.name === "string" && pj.project.name) || "(不明)";
        const sch = Array.isArray(pj?.schedules)
            ? pj.schedules.find((s: any) => s?.id === scheduleUuid)
            : null;
        if (!sch) return [];

        const date = typeof sch?.date === "string" ? sch.date : null;
        const scheduleName = typeof sch?.label === "string" ? sch.label : null;
        if (!date || !scheduleName) return [];

        const droneCount = Array.isArray(sch?.resources?.drones)
            ? sch.resources.drones.reduce(
                (acc: number, d: any) => acc + (Number(d?.count) || 0),
                0
            )
            : undefined;

        const kind = typeof sch?.kind === "string" ? sch.kind : undefined;

        return [
            {
                date,
                projectName,
                scheduleName,
                kind,
                droneCount,
                projectUuid,
                scheduleUuid,
            },
        ];
    });

    // 4) お好みで日付順に（昇順）。元コードどおり `localeCompare`。
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
}

// index.json のキー名に揺れがあっても吸収できるようにゆるくマッピング
function parseDetailMeta(info: any, fallbackAreaName?: string): DetailMeta {
    const ov = (typeof info?.overview === "object" && info.overview) || {};
    const dt = (typeof info?.details === "object" && info.details) || {};
    const fl = (typeof info?.flightArea === "object" && info.flightArea) || {};

    // 高さ制限は overview.heightLimitM / flightArea.altitudeMaxM のいずれか
    const height =
        ov.heightLimitM != null
            ? ov.heightLimitM
            : fl.altitudeMaxM != null
                ? fl.altitudeMaxM
                : "";

    return {
        overview: toStr(ov.overview ?? info?.overview ?? ""),
        address: toStr(ov.address ?? ""),
        manager: toStr(ov.manager ?? ""),
        prefecture: toStr(ov.prefecture ?? fallbackAreaName ?? ""),
        droneRecord: toStr(ov.droneRecord ?? ""),
        aircraftCount: toStr(ov.droneCountEstimate ?? ""),
        altitudeLimit: toStr(height),
        availability: toStr(ov.availability ?? ""),
        statusMemo: toStr(dt.statusMemo ?? ""),
        permitMemo: toStr(dt.permitMemo ?? dt.permitInfo ?? ""),
        restrictionsMemo: toStr(dt.restrictionsMemo ?? dt.restrictions ?? ""),
        remarks: toStr(dt.remarks ?? ""),
    };
}

/** index.json を保存（PUT）。成功なら true */
export async function saveAreaInfo(
    areaUuid: string,
    info: any
): Promise<boolean> {
    if (!areaUuid) return false;
    try {
        const r = await fetch(areaIndexUrl(areaUuid), {
            method: "PUT",
            mode: "cors",
            headers: JSON_HEADERS,
            // S3 側の CORS/ACL/署名の設定が必要です（開発中は匿名 PUT でも可）
            body: JSON.stringify(info, null, 2),
        });
        return r.ok;
    } catch (e) {
        console.error("saveAreaInfo error", e);
        return false;
    }
}

/** projects/<projectUuid>/index.json を保存（PUT）。成功なら true */
export async function saveProjectIndex(
    projectUuid: string,
    info: any
): Promise<boolean> {
    if (!projectUuid) return false;
    try {
        const r = await fetch(`${S3_BASE}projects/${encodeURIComponent(projectUuid)}/index.json`, {
            method: "PUT",
            mode: "cors",
            headers: JSON_HEADERS,
            body: JSON.stringify(info, null, 2),
        });
        return r.ok;
    } catch (e) {
        console.error("saveProjectIndex error", e);
        return false;
    }
}

/**
 * スケジュールの takeoff 基準点 index を更新する。
 * 既存構造を壊さないように、存在するときのみ上書き（追加はしない）。
 * 成功なら true（対象なし含めて false）。
 */
export async function updateScheduleTakeoffReferencePoint(params: {
    projectUuid: string;
    scheduleUuid: string;
    referencePointIndex: number;
}): Promise<boolean> {
    const { projectUuid, scheduleUuid, referencePointIndex } = params;
    if (!projectUuid || !scheduleUuid || !Number.isInteger(referencePointIndex)) {
        if (import.meta.env.DEV) console.warn("[updateRef] invalid params", params);
        return false;
    }

    const proj = await fetchProjectIndex(projectUuid);
    if (!proj || !Array.isArray(proj?.schedules)) return false;

    const idx = proj.schedules.findIndex((s: any) => s?.id === scheduleUuid);
    if (idx < 0) return false;

    const sch = proj.schedules[idx];

    // 既存 geometry/takeoffArea が rectangle である場合のみ上書き（無いなら何もしない）
    const takeoff = sch?.geometry?.takeoffArea;
    if (!takeoff || takeoff?.type !== "rectangle" || !Array.isArray(takeoff?.coordinates)) {
        if (import.meta.env.DEV) console.warn("[updateRef] takeoff rectangle not found");
        return false;
    }

    // 破壊的変更を避けて浅いコピーで更新
    const next = {
        ...proj,
        schedules: proj.schedules.map((s: any, i: number) =>
            i === idx
                ? {
                    ...s,
                    geometry: {
                        ...(s?.geometry ?? {}),
                        takeoffArea: {
                            ...s?.geometry?.takeoffArea,
                            referencePointIndex,
                        },
                        // 既存に updatedAt / updatedBy があれば上書き、無ければ追加しない（デグレ防止）
                        ...(s?.geometry?.updatedAt != null
                            ? { updatedAt: new Date().toISOString() }
                            : {}),
                        ...(s?.geometry?.updatedBy != null
                            ? { updatedBy: "ui" }
                            : {}),
                    },
                }
                : s
        ),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[updateRef] saveProjectIndex failed");
    return ok;
}

/**
 * 指定スケジュールの geometry を置き換えて保存します（存在時のみ更新）。
 * 成功: true / 失敗 or 対象なし: false
 */
export async function upsertScheduleGeometry(params: {
    projectUuid: string;
    scheduleUuid: string;
    geometry: any;
}): Promise<boolean> {
    const { projectUuid, scheduleUuid, geometry } = params;
    if (!projectUuid || !scheduleUuid || !geometry) return false;

    const proj = await fetchProjectIndex(projectUuid);
    if (!proj || !Array.isArray(proj?.schedules)) return false;

    const idx = proj.schedules.findIndex((s: any) => s?.id === scheduleUuid);
    if (idx < 0) return false;

    const next = {
        ...proj,
        schedules: proj.schedules.map((s: any, i: number) =>
            i === idx
                ? {
                    ...s,
                    geometry: {
                        ...geometry,
                        // 既存構造に合わせて任意で更新メタを付与
                        updatedAt: new Date().toISOString(),
                        updatedBy: "ui",
                    },
                }
                : s
        ),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[upsertScheduleGeometry] saveProjectIndex failed");
    return ok;
}