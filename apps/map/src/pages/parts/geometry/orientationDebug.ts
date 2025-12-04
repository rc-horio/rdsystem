// src/pages/parts/geometry/orientationDebug.ts

let lastEllipseBearingDeg: number | null = null;
let lastRectBearingDeg: number | null = null;

/** 楕円側から方位角（北=0°, 時計回り, 5°刻み）を更新 */
export function setEllipseBearingDeg(bearingDeg: number) {
    lastEllipseBearingDeg = normalize0to360(bearingDeg);
    logBoth();
}

/** 矩形側から方位角（北=0°, 時計回り, 5°刻み）を更新 */
export function setRectBearingDeg(bearingDeg: number) {
    lastRectBearingDeg = normalize0to360(bearingDeg);
    logBoth();
}

function normalize0to360(v: number): number {
    // 0–360 に正規化
    let x = v % 360;
    if (x < 0) x += 360;
    return x;
}

/** 矩形 − 楕円 を −180°～180° に正規化 */
function diffRectMinusEllipse(
    rectDeg: number,
    ellipseDeg: number
): number {
    const raw = rectDeg - ellipseDeg;           // 矩形 − 楕円
    // まず 0–360 にしてから −180〜180 に落とす
    let x = raw % 360;
    if (x < -180) x += 360;
    if (x > 180) x -= 360;
    return x;
}

function format(v: number | null): string {
    return v == null || Number.isNaN(v) ? "-" : `${v.toFixed(2)}°`;
}

/** 現在の楕円／矩形の角度と差分を1行で出力 */
function logBoth() {
    const ellipse = lastEllipseBearingDeg;
    const rect = lastRectBearingDeg;

    let diff: number | null = null;
    if (ellipse != null && rect != null) {
        diff = diffRectMinusEllipse(rect, ellipse);
    }

    console.log(
        `[bearing] ellipse=${format(ellipse)}, rect=${format(
            rect
        )}, diff(rect-ellipse)=${format(diff)}  (north=0°, cw, diff:-ccw,+cw)`
    );
}
