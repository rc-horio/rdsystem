// src/features/hub/utils/spacing.ts

// 表示用フォーマッタ：整数ならそのまま、小数は小数1桁
export const fmtMeters = (n: number) =>
    Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1);

// CSV文字列を数値配列に（空/不正/0以下は除外）
export const parseSpacingSeq = (v: unknown): number[] => {
    if (typeof v !== "string") return [];
    return v
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
};

// 可変間隔の累積距離：seq を繰り返しながら i ステップ分の合計を返す
export const cumDist = (i: number, seq: number[], fallback = 1): number => {
    if (!seq || seq.length === 0) return i * fallback;
    const L = seq.length;
    if (L === 1) return i * seq[0];
    let sum = 0;
    for (let k = 0; k < i; k++) sum += seq[k % L];
    return sum;
};

/** fromIndex の次の間隔から steps 個分の距離（列・行の途中からパターンを続ける） */
export const spanOnSeq = (
    fromIndex: number,
    steps: number,
    seq: number[],
    fallback = 1
): number => {
    if (steps <= 0) return 0;
    const start = Math.max(0, Math.trunc(fromIndex));
    return cumDist(start + steps, seq, fallback) - cumDist(start, seq, fallback);
};

export const stepsForGapFrom = (
    gapM: number,
    seq: number[],
    fromIndex: number,
    fallback = 1,
    maxSteps = 1000
): number => {
    if (!Number.isFinite(gapM) || gapM <= 0) return 0;
    if (!seq.length) return 0;
    const eps = 1e-6;
    for (let steps = 1; steps <= maxSteps; steps++) {
        const d = spanOnSeq(fromIndex, steps, seq, fallback);
        if (Math.abs(d - gapM) <= eps) return steps;
        if (d > gapM + eps) break;
    }
    return 0;
};

/** ブロック間隔 gapM を置くときに挟む空きマス数。パターン外・0 以下は 0（隣接） */
export const emptyCellsForGapFrom = (
    gapM: number,
    seq: number[],
    fromIndex: number,
    fallback = 1
): number => {
    const steps = stepsForGapFrom(gapM, seq, fromIndex, fallback);
    return Math.max(0, steps - 1);
};

export const isValidGapFrom = (
    gap: number,
    seq: number[],
    fromIndex: number
): boolean => {
    if (!Number.isFinite(gap) || gap < 0) return false;
    if (gap === 0) return true;
    if (!seq.length || seq.some((s) => !Number.isFinite(s) || s <= 0)) return false;
    return stepsForGapFrom(gap, seq, fromIndex) > 0;
};

export const GAP_OPTION_MAX_STEPS = 16;

/** その位置で機体間隔パターンを続けたときに選べるブロック間隔（m） */
export const gapOptionsFrom = (
    seq: number[],
    fromIndex: number,
    maxSteps = GAP_OPTION_MAX_STEPS,
    fallback = 1
): number[] => {
    if (!seq.length) return [];
    const opts: number[] = [];
    for (let steps = 1; steps <= maxSteps; steps++) {
        const d = spanOnSeq(fromIndex, steps, seq, fallback);
        if (!Number.isFinite(d) || d <= 0) continue;
        const rounded = Math.round(d * 10) / 10;
        if (opts.some((o) => Math.abs(o - rounded) < 1e-6)) continue;
        opts.push(rounded);
    }
    return opts;
};

export const adjacentGapM = (
    seq: number[],
    fromIndex: number,
    fallback = 1
): number => {
    const d = spanOnSeq(fromIndex, 1, seq, fallback);
    if (!Number.isFinite(d) || d <= 0) return seq[0] ?? fallback;
    return Math.round(d * 10) / 10;
};
