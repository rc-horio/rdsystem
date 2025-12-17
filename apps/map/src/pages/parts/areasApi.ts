// src/pages/parts/areasApi.ts
import type { HistoryLite, DetailMeta, Candidate } from "@/features/types";
import { S3_BASE } from "./constants/events";

// ========= Internals =========
const GET_INIT: RequestInit = { mode: "cors", cache: "no-store" };
// S3 に匿名 PUT するため、保存直後に誰でも GET できるよう ACL を付与
const JSON_HEADERS = {
    "Content-Type": "application/json" as const,
    "x-amz-acl": "public-read" as const
};

function generateUuid(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as any).randomUUID();
    }
    return (
        "area-" +
        Math.random().toString(36).slice(2) +
        Date.now().toString(36)
    );
}

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
    uuid: string;
    areaName: string;
    lat?: number;
    lon?: number;
    projectCount?: number;
}): Promise<boolean> {
    const { uuid, areaName, lat, lon } = params;
    const list = await fetchAreasList();

    const dup = list.some(
        (x: any) => x?.areaName === areaName && x?.uuid !== uuid
    );
    if (dup) {
        if (import.meta.env.DEV) {
            console.warn("[upsertAreasListEntryFromInfo] duplicate areaName:", areaName);
        }
        return false;
    }
    const idx = list.findIndex((x: any) => x?.uuid === uuid);
    const base = idx >= 0 ? list[idx] : {};

    const next = {
        ...base,
        uuid,
        areaName,
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

    // 既存の場合は更新、なければ追加
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

    // もし overview が空であれば、デフォルトの内容を設定
    const defaultOverview = "概要情報がありません";  // 必要に応じて変更

    const candidate = Array.isArray(info?.candidate)
        ? info.candidate
        : [];

    return {
        overview: toStr(ov?.overview ?? defaultOverview),  // 修正: 空の場合にデフォルト値を設定
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
        candidate,
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
 * エリア index.json の candidate に 1 件追加して保存します（存在しなければ配列を作成）
 * 成功: true / 失敗: false
 */
export async function appendAreaCandidate(params: {
    areaUuid: string;
    candidate: Candidate;
}): Promise<boolean> {
    const { areaUuid, candidate } = params;
    if (!areaUuid || !candidate) return false;

    // 現状の index を取得
    const info = await fetchRawAreaInfo(areaUuid);
    const list: Candidate[] = Array.isArray(info?.candidate) ? info.candidate : [];

    // 監査情報を付けて末尾に追加
    const nextCandidate: Candidate = {
        ...candidate,
    };

    const nextInfo = {
        ...info,
        candidate: [...list, nextCandidate],
    };

    const ok = await saveAreaInfo(areaUuid, nextInfo);
    if (!ok) console.error("[appendAreaCandidate] saveAreaInfo failed");
    return ok;
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
    const takeoff = sch?.area?.geometry?.takeoffArea;
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
                    area: {
                        ...(s?.area ?? {}),
                        geometry: {
                            ...(s?.area?.geometry ?? {}),
                            takeoffArea: {
                                ...s?.area?.geometry?.takeoffArea,
                                referencePointIndex,
                            },
                        },
                    },
                }
                : s),
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
        schedules: proj.schedules.map((s: any, i: number) => {
            if (i !== idx) return s;

            const prevArea = (typeof s?.area === "object" && s.area) ? s.area : {};

            return {
                ...s,
                area: {
                    ...prevArea,
                    geometry: { ...geometry },
                },
            };
        }),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[upsertScheduleGeometry] saveProjectIndex failed");
    return ok;
}

/**
 * エリア index.json の candidate[ index ] を上書き保存（merge）します。
 * - index が既存配列の範囲内ならその要素を更新。
 * - index === 既存配列長なら新規要素として末尾に追加（append）。
 * - index > 既存配列長の場合は false を返します。
 * - title は既存を優先（preserveTitle=true の場合）。
 */
export async function upsertAreaCandidateAtIndex(params: {
    areaUuid: string;
    index: number;
    candidate: Partial<Candidate>;
    preserveTitle?: boolean; // 既存タイトルを守るか（既定 true）
}): Promise<boolean> {
    const { areaUuid, index, candidate, preserveTitle = true } = params;
    if (!areaUuid || !Number.isInteger(index) || index < 0) return false;

    const info = await fetchRawAreaInfo(areaUuid);
    const list: Candidate[] = Array.isArray(info?.candidate) ? info.candidate : [];

    // 既存長さより大きい index は不正
    if (index > list.length) return false;

    let nextList: Candidate[];

    if (index < list.length) {
        // ---- 既存 candidate の更新パス ----
        const prev = list[index] ?? {};
        const next: Candidate = {
            ...(preserveTitle
                ? { title: prev.title ?? candidate.title ?? `候補${index + 1}` }
                : {}),
            ...prev,      // 既存をベース
            ...candidate, // 変更を上書き
        };

        nextList = list.map((c, i) => (i === index ? next : c));
    } else {
        // ---- index === list.length → 新規候補を末尾に追加 ----
        const next: Candidate = {
            title: candidate.title ?? `候補${index + 1}`,
            ...candidate,
        } as Candidate;

        nextList = [...list, next];
    }

    const nextInfo = {
        ...info,
        candidate: nextList,
    };

    const ok = await saveAreaInfo(areaUuid, nextInfo);
    if (!ok) console.error("[upsertAreaCandidateAtIndex] saveAreaInfo failed");
    return ok;
}

/** 候補 index の要素自体を candidate 配列から削除して保存します。 */
export async function clearAreaCandidateGeometryAtIndex(params: {
    areaUuid: string;
    index: number;
}): Promise<boolean> {
    const { areaUuid, index } = params;
    if (!areaUuid || !Number.isInteger(index) || index < 0) return false;

    const info = await fetchRawAreaInfo(areaUuid);
    const list: Candidate[] = Array.isArray(info?.candidate) ? info.candidate : [];
    if (index >= list.length) return false;

    // 該当 index の candidate を配列から除去
    const nextList = list.filter((_, i) => i !== index);

    const nextInfo = {
        ...info,
        candidate: nextList,
    };

    const ok = await saveAreaInfo(areaUuid, nextInfo);
    if (!ok) console.error("[clearAreaCandidateGeometryAtIndex] saveAreaInfo failed");
    return ok;
}

/** 指定スケジュールの geometry を削除（キーごと除去）して保存します。成功: true */
export async function clearScheduleGeometry(params: {
    projectUuid: string;
    scheduleUuid: string;
}): Promise<boolean> {
    const { projectUuid, scheduleUuid } = params;
    if (!projectUuid || !scheduleUuid) return false;

    const proj = await fetchProjectIndex(projectUuid);
    if (!proj || !Array.isArray(proj?.schedules)) return false;

    const idx = proj.schedules.findIndex((s: any) => s?.id === scheduleUuid);
    if (idx < 0) return false;

    const next = {
        ...proj,
        schedules: proj.schedules.map((s: any, i: number) => {
            if (i !== idx) return s;

            const prevArea = (typeof s?.area === "object" && s.area) ? s.area : {};
            const { geometry, ...restArea } = prevArea;

            return {
                ...s,
                area: {
                    ...restArea, // geometry だけ落とす（他の area_* は維持）
                },
            };
        }),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[clearScheduleGeometry] saveProjectIndex failed");
    return ok;
}

/**
 * 新規エリアを作成する（areaName は重複禁止）
 * - 既に同名の areaName が存在する場合: { ok:false, reason:"duplicate" }
 * - 保存失敗など: { ok:false, reason:"save-failed" }
 * - 成功: { ok:true, uuid }
 */
export async function createNewArea(params: {
    areaName: string;
    lat: number;
    lon: number;
    prefecture?: string | null;
    address?: string | null;
}): Promise<{ ok: boolean; uuid?: string; reason?: "duplicate" | "save-failed" }> {
    const trimmed = params.areaName.trim();
    if (!trimmed) {
        return { ok: false, reason: "save-failed" };
    }

    const dup = await isAreaNameDuplicated({ areaName: trimmed });
    if (dup) {
        return { ok: false, reason: "duplicate" };

    }
    // ② uuid 発行
    const uuid = generateUuid();
    const now = new Date().toISOString();

    // ③ areas/<uuid>/index.json の初期値
    const info = {
        areaName: trimmed,
        overview: {
            address: params.address ?? "",
            prefecture: params.prefecture ?? "",
            manager: "",
            droneRecord: "",
            droneCountEstimate: "",
            heightLimitM: "",
            availability: "",
        },
        details: {
            statusMemo: "",
            permitMemo: "",
            restrictionsMemo: "",
            remarks: "",
        },
        history: [],
        candidate: [],
        updated_at: now,
        updated_by: "ui",
    };

    const okInfo = await saveAreaInfo(uuid, info);
    if (!okInfo) {
        return { ok: false, reason: "save-failed" };
    }

    // ④ areas.json に 1 件追加（ここでも重複チェックが走る）
    const okAreas = await upsertAreasListEntryFromInfo({
        uuid,
        areaName: trimmed,
        lat: params.lat,
        lon: params.lon,
        projectCount: 0,
    });

    if (!okAreas) {
        console.error("[createNewArea] upsertAreasListEntryFromInfo failed");
        return { ok: false, reason: "save-failed" };
    }

    return { ok: true, uuid };
}

/**
 * areaName の重複チェック
 * - excludeUuid を渡すと「自分自身」は除外して検索
 */
export async function isAreaNameDuplicated(params: {
    areaName: string;
    excludeUuid?: string;
}): Promise<boolean> {
    const name = params.areaName.trim();
    if (!name) return false;

    const list = await fetchAreasList();
    return list.some(
        (a) => a?.areaName === name && a?.uuid !== params.excludeUuid
    );
}

// projects/<projectUuid>/index.json の schedules[].area に area_uuid / area_name を保存する
export async function upsertScheduleAreaRef(params: {
    projectUuid: string;
    scheduleUuid: string;
    areaUuid: string;
    areaName: string;
}): Promise<boolean> {
    const { projectUuid, scheduleUuid, areaUuid, areaName } = params;
    if (!projectUuid || !scheduleUuid || !areaUuid) return false;

    const proj = await fetchProjectIndex(projectUuid);
    if (!proj || !Array.isArray(proj?.schedules)) return false;

    const idx = proj.schedules.findIndex((s: any) => s?.id === scheduleUuid);
    if (idx < 0) return false;

    const next = {
        ...proj,
        schedules: proj.schedules.map((s: any, i: number) => {
            if (i !== idx) return s;

            // 既存 area を壊さずに merge する
            const prevArea = (typeof s?.area === "object" && s.area) ? s.area : {};

            return {
                ...s,
                area: {
                    ...prevArea,
                    area_uuid: areaUuid,
                    area_name: areaName,
                },
            };
        }),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[upsertScheduleAreaRef] saveProjectIndex failed");
    return ok;
}

// projects/<projectUuid>/index.json の schedules[].area から area_uuid / area_name を解除する
export async function clearScheduleAreaRef(params: {
    projectUuid: string;
    scheduleUuid: string;
}): Promise<boolean> {
    const { projectUuid, scheduleUuid } = params;
    if (!projectUuid || !scheduleUuid) return false;

    const proj = await fetchProjectIndex(projectUuid);
    if (!proj || !Array.isArray(proj?.schedules)) return false;

    const idx = proj.schedules.findIndex((s: any) => s?.id === scheduleUuid);
    if (idx < 0) return false;

    const next = {
        ...proj,
        schedules: proj.schedules.map((s: any, i: number) => {
            if (i !== idx) return s;

            const prevArea = (typeof s?.area === "object" && s.area) ? s.area : {};
            // area_uuid / area_name だけ除去（他は維持）
            // JSON.stringify で undefined は落ちる
            const { area_uuid, area_name, ...restArea } = prevArea;

            return {
                ...s,
                area: {
                    ...restArea,
                },
            };
        }),
    };

    const ok = await saveProjectIndex(projectUuid, next);
    if (!ok) console.error("[clearScheduleAreaRef] saveProjectIndex failed");
    return ok;
}
