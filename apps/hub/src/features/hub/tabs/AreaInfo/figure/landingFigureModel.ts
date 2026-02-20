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
    totalCount: number;
    seqX: number[]; // x軸 spacing（LandingAreaFigure: vertical）
    seqY: number[]; // y軸 spacing（LandingAreaFigure: horizontal）
    fallback: number;

    // 実寸
    widthM: number;
    heightM: number;

    // 四隅ID
    corner: null | { tl: number; tr: number; bl: number; br: number };

    /** 端数ありで六角形になる場合 true */
    isHexagon: boolean;
    /** 六角形時の最後の行の機体数（1〜countX-1） */
    lastRowCount: number;
    /** 六角形の頂点（SVG座標）[x,y]の配列。矩形の場合は null */
    polygonPoints: null | Array<[number, number]>;
    /** 右上ラベルのX座標（六角形時は切れ目の位置） */
    cornerTrX: number;

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
    const totalCount = Number(area?.drone_count?.count);
    const xOk = Number.isFinite(countX) && countX > 0;
    const yOk = Number.isFinite(countY) && countY > 0;

    // 間隔入力の妥当性
    const spacingOk = seqX.length > 0 && seqY.length > 0;
    const canRenderFigure = xOk && yOk && spacingOk;

    // 実寸計算（距離表示はフル矩形のまま）
    const widthM = xOk && countX >= 2 ? cumDist(countX - 1, seqX, fallback) : 0;
    const rawHeightM =
        yOk && countY >= 2 ? cumDist(countY - 1, seqY, fallback) : 0;

    // 全体機体数を優先：totalCount が設定されていればそこから有効な行数・端数を算出
    const fullRectCount = countX * countY;
    const hasTotalCount = Number.isFinite(totalCount) && totalCount > 0;
    const numFullRows = hasTotalCount ? Math.floor(totalCount / countX) : 0;
    const derivedLastRowCount = hasTotalCount
        ? totalCount - numFullRows * countX
        : countX;
    const effectiveCountY =
        hasTotalCount && totalCount < fullRectCount
            ? derivedLastRowCount > 0
                ? numFullRows + 1
                : numFullRows
            : countY;
    const lastRowCount =
        hasTotalCount && totalCount < fullRectCount && derivedLastRowCount > 0
            ? derivedLastRowCount
            : countX;
    const isHexagon =
        hasTotalCount &&
        totalCount < fullRectCount &&
        derivedLastRowCount > 0 &&
        derivedLastRowCount < countX;

    // 高さは有効行数で計算（totalCount 優先時は effectiveCountY を使用）
    const heightM =
        effectiveCountY >= 2
            ? cumDist(effectiveCountY - 1, seqY, fallback)
            : rawHeightM;

    // 四隅ID計算（全体機体数優先で tr = totalCount-1）
    const corner = (() => {
        if (!xOk || !yOk) return null;
        const bl = 0;
        const br = countX - 1;
        const tl = (effectiveCountY - 1) * countX;
        const tr = hasTotalCount ? totalCount - 1 : fullRectCount - 1;
        return { tl, tr, bl, br };
    })();

    // usableW/H を pad で確保
    const usableW = viewW - pad.left - pad.right;
    const usableH = viewH - pad.top - pad.bottom;

    // 安全な幅と高さ（四角形がつぶれないよう最小アスペクト比を確保）
    const safeW = Math.max(widthM, 1);
    const rawSafeH = Math.max(heightM, 1);
    // 縦横比が極端にならないよう、高さを幅の1/4以上に
    const safeH = Math.max(rawSafeH, safeW / 4);

    // スケール計算
    const scale = Math.min(usableW / safeW, usableH / safeH);
    const rectW = safeW * scale;
    const rectH = safeH * scale;

    // rx/ry を pad 内に収める
    const rx = pad.left + (usableW - rectW) / 2 + offsetX;
    const ry = pad.top + (usableH - rectH) / 2;

    // 六角形の頂点計算（左下0→右下9→右上切れ→左上40 の六角形）
    let topRowWidthScaled = 0;
    const polygonPoints = (() => {
        if (!isHexagon || !xOk || !yOk || effectiveCountY < 2) return null;
        // effectiveCountY=2 のとき cumDist(0)=0 のため lastRowHeight が全体高さになってしまう。
        // 2行の場合は上段の高さ = 全体の1/2 とする。
        const lastRowHeightM =
            effectiveCountY === 2
                ? heightM / 2
                : cumDist(effectiveCountY - 1, seqY, fallback) -
                  cumDist(effectiveCountY - 2, seqY, fallback);
        const topRowWidthM =
            lastRowCount >= 2
                ? cumDist(lastRowCount - 1, seqX, fallback)
                : 0;
        // 数が大きいと上段の高さが1ギャップ分で全体の1%未満になり切れ目が見えなくなる。
        // 上段は描画高さの最低15%を確保して差を視認可能にする。
        const rawLastRowHeightScaled = lastRowHeightM * scale;
        const minLastRowHeightRatio = 0.15;
        const lastRowHeightScaled = Math.max(
            rawLastRowHeightScaled,
            rectH * minLastRowHeightRatio
        );
        // 横方向も同様に、lastRowCount が countX に近いと切れ目がほぼ見えない。
        // 切れ目が幅の最低8%になるよう topRowWidth に上限を設ける。
        const minStepWidthRatio = 0.08;
        const rawTopRowWidthScaled = topRowWidthM * scale;
        topRowWidthScaled = Math.min(
            rawTopRowWidthScaled,
            rectW * (1 - minStepWidthRatio)
        );
        // 頂点（時計回り）: 左下→右下→右端(切れ目)→右上→左上→戻る
        return [
            [rx, ry + rectH] as [number, number], // 1: 左下
            [rx + rectW, ry + rectH] as [number, number], // 2: 右下
            [rx + rectW, ry + lastRowHeightScaled] as [number, number], // 3: 右端（切れ目下）
            [rx + topRowWidthScaled, ry + lastRowHeightScaled] as [
                number,
                number,
            ], // 4: 切れ目
            [rx + topRowWidthScaled, ry] as [number, number], // 5: 右上
            [rx, ry] as [number, number], // 6: 左上
        ];
    })();
    const cornerTrX = isHexagon && polygonPoints
        ? rx + topRowWidthScaled
        : rx + rectW;

    // 表示計算（SVG）
    return {
        xOk,
        yOk,
        spacingOk,
        canRenderFigure,
        countX: xOk ? countX : 0,
        countY: yOk ? countY : 0,
        totalCount: hasTotalCount ? totalCount : 0,
        seqX,
        seqY,
        fallback,
        widthM,
        heightM,
        corner,
        isHexagon,
        lastRowCount,
        polygonPoints,
        cornerTrX,
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
