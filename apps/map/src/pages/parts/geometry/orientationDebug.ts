// src/pages/parts/geometry/orientationDebug.ts

let lastEllipseBearingDeg: number | null = null;
let lastRectBearingDeg: number | null = null;

// パネル通知用イベント名と payload 型
export const EV_GEOM_TURN_METRICS = "geom:turn-metrics";

export type TurnMetricsDetail = {
    turnDirection?: "cw" | "ccw"; // cw: 時計回り, ccw: 反時計回り
    turnAngle_deg?: number;       // 絶対値の角度
    rawDiff_deg?: number;         // デバッグ用に生の差分も入れておく（任意）
};

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

/** 現在の楕円／矩形の角度と差分を1行で出力 */
function logBoth() {
    const ellipse = lastEllipseBearingDeg;
    const rect = lastRectBearingDeg;

    let diff: number | null = null;
    if (ellipse != null && rect != null) {
        diff = diffRectMinusEllipse(rect, ellipse);
    }

    // console.log(
    //     `[bearing] ellipse=${format(ellipse)}, rect=${format(
    //         rect
    //     )}, diff(rect-ellipse)=${format(diff)}  (north=0°, cw, diff:-ccw,+cw)`
    // );

    // パネル向けにイベント発火
    if (typeof window !== "undefined" && diff != null) {
        const absAngle = Math.abs(diff); // 角度は絶対値
        let turnDirection: "cw" | "ccw" | undefined;

        if (diff > 0) {
            turnDirection = "cw"; // プラス → 時計回り
        } else if (diff < 0) {
            turnDirection = "ccw"; // マイナス → 反時計回り
        } else {
            turnDirection = undefined; // 0 のときは方向なし扱い
        }

        const detail: TurnMetricsDetail = {
            turnDirection,
            turnAngle_deg: absAngle,
            rawDiff_deg: diff,
        };

        window.dispatchEvent(
            new CustomEvent<TurnMetricsDetail>(EV_GEOM_TURN_METRICS, { detail })
        );
    }
}
