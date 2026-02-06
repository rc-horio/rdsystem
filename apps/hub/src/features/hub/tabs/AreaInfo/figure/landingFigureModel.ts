// src/features/hub/tabs/AreaInfo/figure/landingFigureModel.ts

import { cumDist, parseSpacingSeq } from "@/features/hub/utils/spacing";

export type LandingFigureModel = {
    // 入力妥当性
    xOk: boolean;
    yOk: boolean;
    spacingOk: boolean;
    canRenderFigure: boolean;

    // 入力（数値化済み）
    countX: number;
    countY: number;
    seqX: number[]; // x軸 spacing（LandingAreaFigure: vertical）
    seqY: number[]; // y軸 spacing（LandingAreaFigure: horizontal）
    fallback: number;

    // 実寸
    widthM: number;
    heightM: number;

    // 四隅ID
    corner: null | { tl: number; tr: number; bl: number; br: number };

    // 表示計算（SVG）
    viewW: number;
    viewH: number;
    pad: { top: number; right: number; bottom: number; left: number };
    margin: number;
    scale: number;
    rectW: number;
    rectH: number;
    rx: number;
    ry: number;
    offsetX: number;
};

// 表示計算（SVG）
export function buildLandingFigureModel(
    area: any | null | undefined,
    opts?: {
        viewW?: number;
        viewH?: number;
        margin?: number;
        offsetX?: number;
        fallback?: number;
        pad?: Partial<{ top: number; right: number; bottom: number; left: number }>;
    }
): LandingFigureModel {
    const viewW = opts?.viewW ?? 460;
    const viewH = opts?.viewH ?? 220;
    const margin = opts?.margin ?? 36;
    const offsetX = opts?.offsetX ?? 0;
    const fallback = opts?.fallback ?? 1;

    // 余白（外周ルーラー分）
    const pad = {
        top: opts?.pad?.top ?? 20,       // 上の角ID用
        right: opts?.pad?.right ?? 18,   // 右上ID用
        bottom: opts?.pad?.bottom ?? 54, // 横寸法線+ラベル用
        left: opts?.pad?.left ?? 46,     // 縦寸法線+ラベル用
    };

    // x軸 spacingSeqX = vertical、y軸 spacingSeqY = horizontal（既存仕様）
    const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
    const vertical = area?.spacing_between_drones_m?.vertical ?? "";

    // 間隔入力（オペレーションタブのテーブルと同じ仕様）
    const seqX = parseSpacingSeq(vertical);
    const seqY = parseSpacingSeq(horizontal);

    // 機体数入力
    const countX = Number(area?.drone_count?.x_count);
    const countY = Number(area?.drone_count?.y_count);
    const xOk = Number.isFinite(countX) && countX > 0;
    const yOk = Number.isFinite(countY) && countY > 0;

    // 間隔入力の妥当性
    const spacingOk = seqX.length > 0 && seqY.length > 0;
    const canRenderFigure = xOk && yOk && spacingOk;

    // 実寸計算
    const widthM = xOk && countX >= 2 ? cumDist(countX - 1, seqX, fallback) : 0;
    const heightM = yOk && countY >= 2 ? cumDist(countY - 1, seqY, fallback) : 0;

    // 四隅ID計算
    const corner = (() => {
        if (!xOk || !yOk) return null;
        const bl = 0;
        const br = countX - 1;
        const tl = (countY - 1) * countX;
        const tr = countX * countY - 1;
        return { tl, tr, bl, br };
    })();

    // usableW/H を pad で確保
    const usableW = viewW - pad.left - pad.right;
    const usableH = viewH - pad.top - pad.bottom;

    // 安全な幅と高さ
    const safeW = Math.max(widthM, 1);
    const safeH = Math.max(heightM, 1);

    // スケール計算
    const scale = Math.min(usableW / safeW, usableH / safeH);
    const rectW = safeW * scale;
    const rectH = safeH * scale;

    // rx/ry を pad 内に収める
    const rx = pad.left + (usableW - rectW) / 2 + offsetX;
    const ry = pad.top + (usableH - rectH) / 2;

    // 表示計算（SVG）
    return {
        xOk,
        yOk,
        spacingOk,
        canRenderFigure,
        countX: xOk ? countX : 0,
        countY: yOk ? countY : 0,
        seqX,
        seqY,
        fallback,
        widthM,
        heightM,
        corner,
        viewW,
        viewH,
        pad,
        margin,
        scale,
        rectW,
        rectH,
        rx,
        ry,
        offsetX,
    };
}
