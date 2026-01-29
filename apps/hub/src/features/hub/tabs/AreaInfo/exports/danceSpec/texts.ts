// src/features/hub/tabs/AreaInfo/exports/danceSpec/texts.ts
/** ファイル名に使えない文字を安全化 */
export const sanitize = (name: string) =>
    (name || "").replace(/[\\/:*?"<>|\n\r]/g, "_").trim();

export function buildFileBaseName(project: string, schedule: string) {
    return [sanitize(project), sanitize(schedule), "ダンスファイル指示書"]
        .filter(Boolean)
        .join("_");
}

export function resolveProjectSchedule(opts?: { projectName?: string; scheduleLabel?: string }) {
    let project = (opts?.projectName ?? "").trim();
    let schedule = (opts?.scheduleLabel ?? "").trim();

    // TopBar h1 から補完（既存仕様踏襲）
    if (!project || !schedule) {
        const h1 = document.querySelector('h1[aria-label]') as HTMLHeadingElement | null;
        const raw = h1?.getAttribute("aria-label") || h1?.getAttribute("title") || "";
        if (raw) {
            const parts = raw.split("　").map((s) => s.trim()).filter(Boolean);
            if (!project && parts[0]) project = parts[0];
            if (!schedule && parts[1]) schedule = parts[1];
        }
    }
    if (!project) project = "案件名";
    return { project, schedule };
}

/** opts.area が schedule を渡されても耐えるように “area本体” を正規化 */
export function normalizeArea(input: any) {
    // schedule を渡した場合: schedule.area が本体
    return input?.area ? input.area : input ?? {};
}

const text = (v: any, fallback = "—") =>
    v === 0 || (typeof v === "string" && v.trim()) || Number.isFinite(v)
        ? String(v)
        : fallback;

const toNumText = (v: any) =>
    v === 0 || Number.isFinite(Number(v)) ? String(v) : "—";

/** 旋回文言（RightPanelを触らない前提で同等の表示を再現） */
export function formatTurnText(turn: any): string {
    if (!turn) return "—";
    return turn.direction === "ccw"
        ? `反時計回りに${turn.angle_deg}度回転`
        : `時計回りに${turn.angle_deg}度回転`;
}

/** 高度の文言（flight_area優先、なければ geometry の単一高度で救済） */
export function getAltitudeText(areaInput: any): string {
    const area = normalizeArea(areaInput);

    const flight =
        area?.flight_area ??
        area?.area?.flight_area ?? // 念のため（多重に来た場合）
        {};

    const min = flight?.altitude_min_m;
    const max = flight?.altitude_max_m;

    // geometry に単一高度があるデータの救済（例: flightAltitude_m）
    const gAlt = area?.geometry?.flightAltitude_m;

    const minTxt = min == null && gAlt != null ? toNumText(gAlt) : toNumText(min);
    const maxTxt = max == null && gAlt != null ? toNumText(gAlt) : toNumText(max);

    return `最低高度: ${minTxt} m\n最高高度: ${maxTxt} m`;
}

/** 機体数表示 */
export function getAircraftText(areaInput: any): string {
    const area = normalizeArea(areaInput);
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();

    const fmtInt = (n: any) => {
        const v = Number(n);
        return Number.isFinite(v) ? v.toLocaleString("ja-JP") : "";
    };

    let aircraftVal =
        fmtInt(drone?.count)
            ? `${fmtInt(drone.count)}機`
            : fmtInt(drone?.x_count) && fmtInt(drone?.y_count)
                ? `${fmtInt(drone.x_count)} × ${fmtInt(drone.y_count)} 機`
                : "—";

    if (aircraftVal !== "—" && model) aircraftVal = `${model}：${aircraftVal}`;
    return aircraftVal;
}

/** アニメーションサイズ（width/depth が無ければ geometry.flightArea から救済してもよい） */
export function getAnimSizeText(areaInput: any): string {
    const area = normalizeArea(areaInput);

    const anim = area?.animation_area ?? {};
    let w = anim?.width_m;
    let d = anim?.depth_m;

    // geometry.flightArea から救済（RightPanel表示と合わせたい場合）
    if ((w == null || d == null) && area?.geometry?.flightArea) {
        const fa = area.geometry.flightArea;
        if (w == null && fa.radiusX_m != null) w = fa.radiusX_m * 2;
        if (d == null && fa.radiusY_m != null) d = fa.radiusY_m * 2;
    }

    const wTxt = text(w, "");
    const dTxt = text(d, "");
    if (wTxt && dTxt) return `W${wTxt}m × L${dTxt}m`;
    if (wTxt) return `W${wTxt}m`;
    if (dTxt) return `L${dTxt}m`;
    return "—";
}

/** 離発着演出 */
export function getShowText(areaInput: any): string {
    const area = normalizeArea(areaInput);
    const lights = area?.lights ?? {};
    const takeoff = text(lights?.takeoff, "—");
    const landing = text(lights?.landing, "—");
    const note = text(area?.return_note, "—");
    return `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`;
}

/** その他そのまま表示系 */
export function getMoveText(areaInput: any): string {
    const area = normalizeArea(areaInput);
    return text(area?.actions?.liftoff, "—");
}
export function getObstaclesText(areaInput: any): string {
    const area = normalizeArea(areaInput);
    return text(area?.obstacle_note, "なし");
}
export function getTurnText(areaInput: any): string {
    const area = normalizeArea(areaInput);
    // RightPanelは geometry.turn を使っているのでそれに合わせる
    return formatTurnText(area?.geometry?.turn);
}
