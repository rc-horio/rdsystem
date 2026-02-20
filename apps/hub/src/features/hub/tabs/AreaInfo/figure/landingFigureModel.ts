// src/features/hub/tabs/AreaInfo/figure/landingFigureModel.ts

import { cumDist, parseSpacingSeq } from "@/features/hub/utils/spacing";

export type LandingFigureModel = {
    // 入力妥当性
    xOk: boolean;
    yOk: boolean;
    spacingOk: boolean;
    canRenderFigure: boolean;
    /** 描画不可時の理由（矛盾時は具体的なメッセージ） */
    cannotRenderReason: null | "input_required" | "contradiction";
    /** 矛盾時の説明（全機体数・XY機体数・間隔の不整合） */
    contradictionMessage: null | string;

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

    // 全機体数を優先してレイアウトを決定。矛盾があれば描画しない
    const fullRectCount = countX * countY;
    const hasTotalCount = Number.isFinite(totalCount) && totalCount > 0;

    // 矛盾チェック：全機体数 > X×Y は不可、必要な行数 > Y機体数 も不可
    const actualRowCount = hasTotalCount
        ? Math.ceil(totalCount / countX)
        : countY;
    const lastRowCount = hasTotalCount
        ? totalCount - (actualRowCount - 1) * countX
        : countX;
    const countExceedsGrid = hasTotalCount && totalCount > fullRectCount;
    const rowsExceedY = hasTotalCount && actualRowCount > countY;
    // Y機体数が1行以上余分（必要な行数より多い）も矛盾とする
    const rowsUnderY = hasTotalCount && actualRowCount < countY;

    const hasContradiction =
        countExceedsGrid || rowsExceedY || rowsUnderY;
    const canRenderFigure =
        xOk && yOk && spacingOk && !hasContradiction;
    const cannotRenderReason =
        hasContradiction
            ? "contradiction"
            : !xOk || !yOk || !spacingOk
                ? "input_required"
                : null;
    // 具体的な数値で状況を示す忠告
    const contradictionMessage =
        rowsExceedY
            ? `全機体数(${totalCount})がX機体数×Y機体数(${fullRectCount})を超えています。数値を見直してください。`
            : rowsUnderY
                ? `X機体数×Y機体数(${fullRectCount})が全機体数(${totalCount})を超えています。数値を見直してください。`
                : null;

    // 実寸計算（全機体数優先時は actualRowCount で高さを算出）
    const widthM = xOk && countX >= 2 ? cumDist(countX - 1, seqX, fallback) : 0;
    const heightM =
        yOk && actualRowCount >= 2
            ? cumDist(actualRowCount - 1, seqY, fallback)
            : 0;

    // 端数チェック：全機体数がフル矩形より少なく、最後の行が途中で切れる場合
    const isHexagon =
        hasTotalCount &&
        totalCount < fullRectCount &&
        lastRowCount > 0 &&
        lastRowCount < countX;

    // 四隅ID計算（全機体数優先で tr = totalCount-1、tl も actualRowCount ベース）
    const corner = (() => {
        if (!xOk || !yOk) return null;
        const bl = 0;
        // 1行の六角形では最後の行が端数なので br = totalCount-1
        const br =
            isHexagon && actualRowCount === 1
                ? totalCount - 1
                : countX - 1;
        const tl = (actualRowCount - 1) * countX;
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
        if (!isHexagon || !xOk || !yOk) return null;
        // Y=1 のときは1行のみ。端数があれば幅を lastRowCount に合わせた矩形
        if (actualRowCount === 1) {
            const topRowWidthM =
                lastRowCount >= 1
                    ? cumDist(lastRowCount - 1, seqX, fallback)
                    : 0;
            topRowWidthScaled = topRowWidthM * scale;
            return [
                [rx, ry + rectH] as [number, number],
                [rx + topRowWidthScaled, ry + rectH] as [number, number],
                [rx + topRowWidthScaled, ry] as [number, number],
                [rx, ry] as [number, number],
            ];
        }
        if (actualRowCount < 2) return null;
        // actualRowCount=2 のとき cumDist(0)=0 のため lastRowHeight が全体高さになってしまう。
        // 2行の場合は上段の高さ = 全体の1/2 とする。
        const lastRowHeightM =
            actualRowCount === 2
                ? heightM / 2
                : cumDist(actualRowCount - 1, seqY, fallback) -
                  cumDist(actualRowCount - 2, seqY, fallback);
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
        cannotRenderReason,
        contradictionMessage,
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
