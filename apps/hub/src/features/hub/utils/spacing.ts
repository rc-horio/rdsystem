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
