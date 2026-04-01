import type { Area } from "@/features/hub/types/resource";
import { fmtMeters, parseSpacingSeq, cumDist } from "@/features/hub/utils/spacing";
import type { BlockLayoutResolved } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLayoutModel";
import { buildMultiBlockLayoutModel } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLayoutModel";

type Theme = "ui" | "export";

type CornerPlacement = "inside" | "outside";

type CornerDisplayOptions = {
  /** undefined なら自動（ブロックサイズから決定） */
  fontSize?: number;
  placement?: CornerPlacement;
  /** 外側に出すとき: 左/右（TL/BL と TR/BR） */
  outsideHorizontal?: boolean;
  /** 外側に出すとき: 上/下（TL/TR と BL/BR） */
  outsideVertical?: boolean;
};

export function buildMultiBlockLandingFigureSvg(
  area: Area,
  opts?: {
    theme?: Theme;
    showCornerNumbers?: boolean;
    showBlockLabels?: boolean;
    showRuler?: boolean;
    /** 全ブロック共通の既定（ブロック別で上書き可） */
    corner?: CornerDisplayOptions;
    /** ブロック ID ごとの機体番号（四隅）表示オプション */
    cornerByBlockId?: Record<string, CornerDisplayOptions>;
    ruler?: {
      /** 左側メモリ（縦寸法線＋ラベル）を横へずらす（px） */
      leftXOffsetPx?: number;
      /** 下側メモリ（横寸法線＋ラベル）を縦へずらす（px） */
      bottomYOffsetPx?: number;
    };
  }
) {
  const theme: Theme = opts?.theme ?? "export";
  const showCornerNumbers = opts?.showCornerNumbers ?? true;
  const showBlockLabels = opts?.showBlockLabels ?? true;
  const showRuler = opts?.showRuler ?? true;

  const rulerOpts = opts?.ruler ?? {};
  const leftXOffsetPx = Number.isFinite(rulerOpts.leftXOffsetPx)
    ? rulerOpts.leftXOffsetPx!
    : 0;
  const bottomYOffsetPx = Number.isFinite(rulerOpts.bottomYOffsetPx)
    ? rulerOpts.bottomYOffsetPx!
    : 0;

  const model = buildMultiBlockLayoutModel(area);

  const viewW = 460;
  const calcUiViewH = (aspect: number) => {
    // 横長ほど viewH を小さくして、横方向の収まりを優先する
    const raw = 330 - aspect * 28;
    return Math.max(220, Math.min(290, raw));
  };
  const uiAspect =
    model && model.totalHeightM > 0 ? model.totalWidthM / model.totalHeightM : 1;
  const viewH = theme === "ui" ? calcUiViewH(uiAspect) : 220;
  const margin = 36;

  const pad =
    theme === "ui"
      ? {
          top: 2,
          right: 40,
          bottom: 28,
          left: 50,
        }
      : {
          top: 20,
          right: 18,
          bottom: 54,
          left: 46,
        };

  const labelColor = theme === "export" ? "#000000" : "#ffffff";
  const dimColor = theme === "export" ? "#000000" : "#ffffff";

  const rectStroke = "#ed1b24";
  const rectFill = "#ed1b24";

  if (!model) {
    const msg = "ブロック配置と機体間隔を設定してください";
    return `
<svg
  viewBox="0 0 ${viewW} ${viewH}"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  height="100%"
>
  <text
    x="${viewW / 2}"
    y="${viewH / 2}"
    dominant-baseline="middle"
    text-anchor="middle"
    font-size="15"
    fill="${labelColor}"
    opacity="0.9"
  >
    ${msg}
  </text>
</svg>
    `.trim();
  }

  const usableW = viewW - pad.left - pad.right;
  const usableH = viewH - pad.top - pad.bottom;

  const safeW = Math.max(model.totalWidthM, 1);
  const safeH = Math.max(model.totalHeightM, 1);

  const scale = Math.min(usableW / safeW, usableH / safeH);

  // 重要: x方向とy方向で別スケールを使うと歪むため、
  // safeW/safeH の比率で同一スケールになる座標変換（landingFigureSvg と同等）に寄せる
  const figureW = safeW * scale;
  const figureH = safeH * scale;
  // landingFigureSvg と同様に、余白が出た分だけ図形エリアを中央寄せする
  const figureLeft = pad.left + (usableW - figureW) / 2;
  const figureTop = pad.top + (usableH - figureH) / 2;

  const labels = "ABCDEFGHIJ".split("");

  // 各ブロックの六角形（端数）形状計算に必要な累積距離パターン
  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";
  // UIラベルに合わせて x=horizontal, y=vertical
  const seqX = parseSpacingSeq(horizontal);
  const seqY = parseSpacingSeq(vertical);
  const fallback = 1;

  const scaleX = figureW / safeW;
  const scaleY = figureH / safeH;

  // 行ごとのブロック配列（x昇順）。隣接時のラベル被り回避に使う
  const blocksByRow = new Map<number, typeof model.blocks>();
  for (const b of model.blocks) {
    const arr = blocksByRow.get(b.rowIndex) ?? [];
    arr.push(b);
    blocksByRow.set(b.rowIndex, arr);
  }
  for (const [k, arr] of blocksByRow.entries()) {
    arr.sort((a, b) => a.x - b.x);
    blocksByRow.set(k, arr);
  }

  // 採番は「全体グリッド」基準（ブロック局所 + オフセットではない）
  // - 列数: 各行の countX 合計の最大値
  // - 行基点: rows[0] が最下段、その上に rows[1]...
  const rowIndices = [...blocksByRow.keys()].sort((a, b) => a - b);
  const rowHeightCells = new Map<number, number>();
  const colStartByBlockId = new Map<string, number>();
  const rowBaseByRowIndex = new Map<number, number>();

  for (const rowIndex of rowIndices) {
    const arr = blocksByRow.get(rowIndex) ?? [];
    let col = 0;
    let maxRowsInRow = 1;
    for (const b of arr) {
      const countX = Math.max(0, Math.trunc(b.xCount));
      const totalCount = Math.max(0, Math.trunc(b.totalCount));
      colStartByBlockId.set(b.blockId, col);
      col += countX;
      if (countX > 0 && totalCount > 0) {
        const actualRows = Math.ceil(totalCount / countX);
        if (actualRows > maxRowsInRow) maxRowsInRow = actualRows;
      }
    }
    rowHeightCells.set(rowIndex, Math.max(1, maxRowsInRow));
  }

  let runningRowBase = 0;
  for (const rowIndex of rowIndices) {
    rowBaseByRowIndex.set(rowIndex, runningRowBase);
    runningRowBase += rowHeightCells.get(rowIndex) ?? 1;
  }

  // 占有セルのみを採番対象にする（空白セルはカウントしない）
  // key: globalRow, value: [startCol, endCol] の配列（行内で昇順）
  const occupiedIntervalsByGlobalRow = new Map<number, Array<[number, number]>>();
  for (const b of model.blocks) {
    const countX = Math.max(0, Math.trunc(b.xCount));
    const totalCount = Math.max(0, Math.trunc(b.totalCount));
    if (countX <= 0 || totalCount <= 0) continue;

    const rowBase = rowBaseByRowIndex.get(b.rowIndex) ?? 0;
    const colStart = colStartByBlockId.get(b.blockId) ?? 0;
    const actualRows = Math.ceil(totalCount / countX);
    const lastRowCount = totalCount - (actualRows - 1) * countX;
    const isHexagon =
      totalCount < countX * Math.max(1, Math.trunc(b.yCount)) &&
      lastRowCount > 0 &&
      lastRowCount < countX;

    for (let r = 0; r < actualRows; r++) {
      const rowWidth = isHexagon && r === actualRows - 1 ? lastRowCount : countX;
      if (rowWidth <= 0) continue;
      const gRow = rowBase + r;
      const intervals = occupiedIntervalsByGlobalRow.get(gRow) ?? [];
      intervals.push([colStart, colStart + rowWidth - 1]);
      intervals.sort((a, c) => a[0] - c[0]);
      occupiedIntervalsByGlobalRow.set(gRow, intervals);
    }
  }

  // 各行の累積占有セル数（行頭まで）を前計算
  const globalRows = [...occupiedIntervalsByGlobalRow.keys()].sort((a, b) => a - b);
  const occupiedPrefixBeforeRow = new Map<number, number>();
  let occupiedRunning = 0;
  for (const gRow of globalRows) {
    occupiedPrefixBeforeRow.set(gRow, occupiedRunning);
    const rowIntervals = occupiedIntervalsByGlobalRow.get(gRow) ?? [];
    occupiedRunning += rowIntervals.reduce((sum, [s, e]) => sum + (e - s + 1), 0);
  }

  const rankAtOccupiedCell = (globalRow: number, globalCol: number): number => {
    const base = occupiedPrefixBeforeRow.get(globalRow) ?? 0;
    const rowIntervals = occupiedIntervalsByGlobalRow.get(globalRow) ?? [];
    let inRow = 0;
    for (const [s, e] of rowIntervals) {
      if (globalCol < s) break;
      if (globalCol > e) {
        inRow += e - s + 1;
        continue;
      }
      inRow += globalCol - s + 1;
      return base + inRow - 1;
    }
    // 本来ここには来ない（cornerは常に占有セル）
    return Math.max(0, base + inRow - 1);
  };

  const rects = model.blocks.map((b) => {
    const cornerOpts: CornerDisplayOptions = {
      ...(opts?.corner ?? {}),
      ...(opts?.cornerByBlockId?.[b.blockId] ?? {}),
    };
    const placement: CornerPlacement = cornerOpts.placement ?? "inside";
    const useOutsideH =
      placement === "outside" ? cornerOpts.outsideHorizontal ?? true : false;
    const useOutsideV =
      placement === "outside" ? cornerOpts.outsideVertical ?? true : false;

    const x = figureLeft + (b.x / safeW) * figureW;
    const y = figureTop + (b.y / safeH) * figureH;
    const w = (b.widthM / safeW) * figureW;
    const h = (b.heightM / safeH) * figureH;

    const cx = x + w / 2;
    const cy = y + h / 2;

    const label =
      labels[b.labelIndex] ?? String(b.labelIndex + 1);

    const countX = Math.trunc(b.xCount);
    const countY = Math.trunc(b.yCount);
    const totalCount = Math.trunc(b.totalCount);

    const fullRectCount = countX * countY;
    const actualRowCount =
      Number.isFinite(totalCount) && countX > 0
        ? Math.ceil(totalCount / countX)
        : 0;
    const lastRowCount =
      totalCount - (actualRowCount - 1) * countX;

    const isHexagon =
      totalCount > 0 &&
      countX > 0 &&
      countY > 0 &&
      totalCount < fullRectCount &&
      lastRowCount > 0 &&
      lastRowCount < countX;

    // 六角形時の切れ目位置（TRラベル位置にも利用）
    let topRowWidthScaled = w;
    let lastRowHeightScaled = h;
    if (isHexagon) {
      const minLastRowHeightRatio = 0.15;
      const minStepWidthRatio = 0.08;

      if (actualRowCount === 1) {
        const topRowWidthM =
          lastRowCount >= 1 ? cumDist(lastRowCount - 1, seqX, fallback) : 0;
        topRowWidthScaled = topRowWidthM * scaleX;
      } else {
        // landingFigureModel と同様の計算方針
        const lastRowHeightM =
          actualRowCount === 2
            ? b.heightM / 2
            : cumDist(actualRowCount - 1, seqY, fallback) -
              cumDist(actualRowCount - 2, seqY, fallback);
        const rawLastRowHeightScaled = lastRowHeightM * scaleY;
        lastRowHeightScaled = Math.max(
          rawLastRowHeightScaled,
          h * minLastRowHeightRatio
        );

        const topRowWidthM =
          lastRowCount >= 2 ? cumDist(lastRowCount - 1, seqX, fallback) : 0;
        topRowWidthScaled = Math.min(
          topRowWidthM * scaleX,
          w * (1 - minStepWidthRatio)
        );
      }
    }

    const topRightX = isHexagon ? x + topRowWidthScaled : x + w;

    // ブロック内の四隅ID（全体仮想グリッド基準、ただし空白セルは採番しない）
    const corner = (() => {
      if (!Number.isFinite(countX) || !Number.isFinite(countY) || !Number.isFinite(totalCount)) return null;
      if (countX <= 0 || countY <= 0 || totalCount <= 0) return null;

      const fullRectCount = countX * countY;
      const actualRowCount = Math.ceil(totalCount / countX);
      const lastRowCount = totalCount - (actualRowCount - 1) * countX;

      const isHexagon =
        totalCount < fullRectCount && lastRowCount > 0 && lastRowCount < countX;

      const colStart = colStartByBlockId.get(b.blockId) ?? 0;
      const rowBase = rowBaseByRowIndex.get(b.rowIndex) ?? 0;

      const bottomCols =
        isHexagon && actualRowCount === 1 ? lastRowCount : countX;
      const topCols =
        isHexagon ? lastRowCount : countX;

      const topRow = rowBase + actualRowCount - 1;
      const bl = rankAtOccupiedCell(rowBase, colStart);
      const br = rankAtOccupiedCell(rowBase, colStart + Math.max(1, bottomCols) - 1);
      const tl = rankAtOccupiedCell(topRow, colStart);
      const tr = rankAtOccupiedCell(topRow, colStart + Math.max(1, topCols) - 1);

      return {
        tl,
        tr,
        bl,
        br,
      };
    })();

    const autoFontSize = Math.max(8, Math.min(10, Math.min(w, h) / 5));
    const rawFontSize = cornerOpts.fontSize;
    const fontSize =
      Number.isFinite(rawFontSize) && (rawFontSize as number) > 0
        ? Math.max(6, Math.min(16, rawFontSize as number))
        : autoFontSize;

    const insetY = Math.max(2, Math.min(8, fontSize * 0.7));
    const outsidePadX = Math.max(2, fontSize * 0.55);
    const outsidePadY = Math.max(2, fontSize * 0.65);

    const rowArr = blocksByRow.get(b.rowIndex) ?? [];
    const pos = rowArr.findIndex((bb) => bb.blockId === b.blockId);
    const prev = pos > 0 ? rowArr[pos - 1] : null;
    const next = pos >= 0 && pos < rowArr.length - 1 ? rowArr[pos + 1] : null;

    const gapFromMtoSvg = (gapM: number) => (gapM / safeW) * figureW;

    // 角ラベル同士の被りを避けるため、隣ブロックとのギャップが小さいほど
    // テキストを内側へ押し込む（ただしブロック内に収まる上限あり）
    const calcInsetX = (gapSvg: number) => {
      const base = 4;
      const threshold = 18;
      const max = 12;
      if (gapSvg >= threshold) return base;
      const extra = (threshold - gapSvg) / 2;
      return Math.max(base, Math.min(max, base + extra));
    };

    const leftGapM = prev ? b.x - (prev.x + prev.widthM) : Infinity;
    const rightGapM = next ? next.x - (b.x + b.widthM) : Infinity;

    const leftInsetRaw =
      leftGapM === Infinity ? 4 : calcInsetX(gapFromMtoSvg(Math.max(0, leftGapM)));
    const rightInsetRaw =
      rightGapM === Infinity ? 4 : calcInsetX(gapFromMtoSvg(Math.max(0, rightGapM)));

    const maxInsetX = Math.max(2, w * 0.35);
    const leftInsetX = Math.min(leftInsetRaw, maxInsetX);
    const rightInsetX = Math.min(rightInsetRaw, maxInsetX);

    const shape = (() => {
      if (!isHexagon) {
        return `
  <rect
    x="${x}"
    y="${y}"
    width="${w}"
    height="${h}"
    stroke="${rectStroke}"
    stroke-width="1.5"
    stroke-opacity="0.9"
    fill="${rectFill}"
    fill-opacity="0.35"
  />
        `.trim();
      }

      if (!Number.isFinite(topRowWidthScaled) || !Number.isFinite(lastRowHeightScaled)) {
        // 念のためのフォールバック（見た目だけ崩れないように）
        return `
  <rect
    x="${x}"
    y="${y}"
    width="${w}"
    height="${h}"
    stroke="${rectStroke}"
    stroke-width="1.5"
    stroke-opacity="0.9"
    fill="${rectFill}"
    fill-opacity="0.35"
  />
        `.trim();
      }

      if (actualRowCount === 1) {
        const pts = [
          [x, y + h],
          [x + topRowWidthScaled, y + h],
          [x + topRowWidthScaled, y],
          [x, y],
        ]
          .map(([px, py]) => `${px},${py}`)
          .join(" ");

        return `
  <polygon
    points="${pts}"
    stroke="${rectStroke}"
    stroke-width="1.5"
    stroke-opacity="0.9"
    fill="${rectFill}"
    fill-opacity="0.35"
  />
        `.trim();
      }

      const pts = [
        [x, y + h], // left bottom
        [x + w, y + h], // right bottom
        [x + w, y + lastRowHeightScaled], // right end
        [x + topRowWidthScaled, y + lastRowHeightScaled], // cut
        [x + topRowWidthScaled, y], // right top
        [x, y], // left top
      ]
        .map(([px, py]) => `${px},${py}`)
        .join(" ");

      return `
  <polygon
    points="${pts}"
    stroke="${rectStroke}"
    stroke-width="1.5"
    stroke-opacity="0.9"
    fill="${rectFill}"
    fill-opacity="0.35"
  />
      `.trim();
    })();

    const cornerTexts = (() => {
      if (!showCornerNumbers) return "";
      if (!corner) return "";

      // y_count=1 は左右のみ、x_count=1 は上下のみ表示
      if (countY === 1) {
        const yMid = y + h / 2;
        return `
  <text
    x="${useOutsideH ? x - outsidePadX : x + leftInsetX}"
    y="${yMid}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "end" : "start"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.bl}
  </text>
  <text
    x="${useOutsideH ? topRightX + outsidePadX : topRightX - rightInsetX}"
    y="${yMid}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "start" : "end"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.br}
  </text>
        `.trim();
      }

      if (countX === 1) {
        const xMid = x + w / 2;
        return `
  <text
    x="${xMid}"
    y="${useOutsideV ? y - outsidePadY : y + insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="middle"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.tl}
  </text>
  <text
    x="${xMid}"
    y="${useOutsideV ? y + h + outsidePadY : y + h - insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="middle"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.bl}
  </text>
        `.trim();
      }

      return `
  <text
    x="${useOutsideH ? x - outsidePadX : x + leftInsetX}"
    y="${useOutsideV ? y - outsidePadY : y + insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "end" : "start"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.tl}
  </text>
  <text
    x="${useOutsideH ? topRightX + outsidePadX : topRightX - rightInsetX}"
    y="${useOutsideV ? y - outsidePadY : y + insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "start" : "end"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.tr}
  </text>
  <text
    x="${useOutsideH ? x - outsidePadX : x + leftInsetX}"
    y="${useOutsideV ? y + h + outsidePadY : y + h - insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "end" : "start"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.bl}
  </text>
  <text
    x="${useOutsideH ? x + w + outsidePadX : x + w - rightInsetX}"
    y="${useOutsideV ? y + h + outsidePadY : y + h - insetY}"
    font-size="${fontSize}"
    fill="${labelColor}"
    text-anchor="${useOutsideH ? "start" : "end"}"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${corner.br}
  </text>
      `.trim();
    })();

    return `
  ${shape}
  ${
    showBlockLabels
      ? `<text
    x="${cx}"
    y="${cy}"
    font-size="12"
    fill="${labelColor}"
    text-anchor="middle"
    dominant-baseline="middle"
    pointer-events="none"
    style="user-select: none;"
  >
    ${label}
  </text>`
      : ""
  }
  ${cornerTexts}
    `.trim();
  }).join("\n");

  const totalWidthLabel = fmtMeters(model.totalWidthM);
  const totalHeightLabel = fmtMeters(model.totalHeightM);

  // figureLeft / figureTop / figureW / figureH は上で確定済み

  return `
<svg
  viewBox="0 0 ${viewW} ${viewH}"
  xmlns="http://www.w3.org/2000/svg"
  width="100%"
  height="100%"
>
  ${rects}

  ${showRuler ? `
  <line
    x1="${figureLeft}"
    y1="${figureTop + figureH + 26 + bottomYOffsetPx}"
    x2="${figureLeft + figureW}"
    y2="${figureTop + figureH + 26 + bottomYOffsetPx}"
    stroke="${dimColor}"
    stroke-width="1"
    opacity="0.9"
  />
  <text
    x="${figureLeft + figureW / 2}"
    y="${figureTop + figureH + 42 + bottomYOffsetPx}"
    font-size="12"
    fill="${dimColor}"
    text-anchor="middle"
  >
    ${totalWidthLabel}m
  </text>

  <line
    x1="${figureLeft - 15 + leftXOffsetPx}"
    y1="${figureTop}"
    x2="${figureLeft - 15 + leftXOffsetPx}"
    y2="${figureTop + figureH}"
    stroke="${dimColor}"
    stroke-width="1"
    opacity="0.9"
  />
  <text
    x="${figureLeft - 20 + leftXOffsetPx}"
    y="${figureTop + figureH / 2}"
    font-size="12"
    fill="${dimColor}"
    text-anchor="end"
    dominant-baseline="middle"
  >
    ${totalHeightLabel}m
  </text>
  ` : ""}
</svg>
  `.trim();
}

