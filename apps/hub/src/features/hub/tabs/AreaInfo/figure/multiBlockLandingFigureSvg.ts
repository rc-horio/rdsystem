import type { Area } from "@/features/hub/types/resource";
import { fmtMeters, parseSpacingSeq, cumDist } from "@/features/hub/utils/spacing";
import { buildMultiBlockLayoutModel } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLayoutModel";
import { buildMultiBlockOccupancyGrid } from "@/features/hub/tabs/AreaInfo/figure/multiBlockOccupancyGrid";
import {
  collectLandingBoxTiles,
  landingBoxRectSvg,
  parseTakeoffLandingBoxYx,
} from "@/features/hub/tabs/AreaInfo/figure/landingBoxTiles";

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
  const occ = buildMultiBlockOccupancyGrid(area);
  const useBoxes = Boolean(area.use_takeoff_landing_box);
  const boxTiles =
    useBoxes && occ
      ? collectLandingBoxTiles(occ, parseTakeoffLandingBoxYx(area.takeoff_landing_box_yx))
      : [];

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
  // 1列/1行で機体中心スパンが 0 のとき、ダミー 1m キャンバスの中央に置く
  const shiftXM = model.totalWidthM <= 0 ? safeW / 2 : 0;
  const shiftYM = model.totalHeightM <= 0 ? safeH / 2 : 0;

  const scale = Math.min(usableW / safeW, usableH / safeH);

  // 重要: x方向とy方向で別スケールを使うと歪むため、
  // safeW/safeH の比率で同一スケールになる座標変換（landingFigureSvg と同等）に寄せる
  const figureW = safeW * scale;
  const figureH = safeH * scale;
  // landingFigureSvg と同様に、余白が出た分だけ図形エリアを中央寄せする
  const figureLeft = pad.left + (usableW - figureW) / 2;
  const figureTop = pad.top + (usableH - figureH) / 2;

  const toSvgX = (m: number) => figureLeft + ((m + shiftXM) / safeW) * figureW;
  const toSvgY = (m: number) => figureTop + ((m + shiftYM) / safeH) * figureH;
  const MIN_DRAW_PX = 12;
  const inflateSpan = (origin: number, size: number) => {
    if (size >= MIN_DRAW_PX) return { origin, size };
    return { origin: origin - (MIN_DRAW_PX - size) / 2, size: MIN_DRAW_PX };
  };

  const labels = "ABCDEFGHIJ".split("");

  // 各ブロックの六角形（端数）形状計算に必要な累積距離パターン
  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";
  // UIラベルに合わせて x=horizontal, y=vertical
  const seqX = parseSpacingSeq(horizontal);
  const seqY = parseSpacingSeq(vertical);
  const fallback = 1;

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

  const idAt = (globalRow: number, globalCol: number): number | null =>
    occ?.cellIdAtGlobal(globalRow, globalCol) ?? null;

  const spanOnSeq = (fromIndex: number, steps: number, seq: number[]) => {
    if (steps <= 0) return 0;
    return cumDist(fromIndex + steps, seq, fallback) - cumDist(fromIndex, seq, fallback);
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

    const geomX = toSvgX(b.x);
    const geomY = toSvgY(b.y);
    const geomW = (b.widthM / safeW) * figureW;
    const geomH = (b.heightM / safeH) * figureH;
    const inflatedX = inflateSpan(geomX, geomW);
    const inflatedY = inflateSpan(geomY, geomH);
    const x = inflatedX.origin;
    const y = inflatedY.origin;
    const w = inflatedX.size;
    const h = inflatedY.size;

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

    // 六角形時の切れ目位置（TRラベル位置にも利用）。幅・高さは格子上の位相で計算する
    let topRowWidthScaled = w;
    let lastRowHeightScaled = h;
    if (isHexagon) {
      const minLastRowHeightRatio = 0.15;
      const minStepWidthRatio = 0.08;
      const drawScaleX = w / Math.max(b.widthM, 1e-9);
      const drawScaleY = h / Math.max(b.heightM, 1e-9);

      if (actualRowCount === 1) {
        const topRowWidthM =
          lastRowCount >= 1
            ? spanOnSeq(b.colStart, lastRowCount - 1, seqX)
            : 0;
        topRowWidthScaled = topRowWidthM * drawScaleX;
      } else {
        const topRow = b.rowBase + actualRowCount - 1;
        const lastRowHeightM =
          actualRowCount === 2
            ? b.heightM / 2
            : cumDist(topRow, seqY, fallback) -
              cumDist(topRow - 1, seqY, fallback);
        const rawLastRowHeightScaled = lastRowHeightM * drawScaleY;
        lastRowHeightScaled = Math.max(
          rawLastRowHeightScaled,
          h * minLastRowHeightRatio
        );

        const topRowWidthM =
          lastRowCount >= 2
            ? spanOnSeq(b.colStart, lastRowCount - 1, seqX)
            : 0;
        topRowWidthScaled = Math.min(
          topRowWidthM * drawScaleX,
          w * (1 - minStepWidthRatio)
        );
      }
    }

    const topRightX = isHexagon ? x + topRowWidthScaled : x + w;

    // ブロック内の四隅ID（占有グリッド。空白セルは採番しない）
    const corner = (() => {
      if (!Number.isFinite(countX) || !Number.isFinite(countY) || !Number.isFinite(totalCount)) return null;
      if (countX <= 0 || countY <= 0 || totalCount <= 0) return null;

      const fullRectCount = countX * countY;
      const actualRowCount = Math.ceil(totalCount / countX);
      const lastRowCount = totalCount - (actualRowCount - 1) * countX;

      const isHexagon =
        totalCount < fullRectCount && lastRowCount > 0 && lastRowCount < countX;

      const bottomCols =
        isHexagon && actualRowCount === 1 ? lastRowCount : countX;
      const topCols =
        isHexagon ? lastRowCount : countX;

      const topRow = b.rowBase + actualRowCount - 1;
      const bl = idAt(b.rowBase, b.colStart);
      const br = idAt(b.rowBase, b.colStart + Math.max(1, bottomCols) - 1);
      const tl = idAt(topRow, b.colStart);
      const tr = idAt(topRow, b.colStart + Math.max(1, topCols) - 1);
      if (bl === null || br === null || tl === null || tr === null) return null;

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
      if (useBoxes && occ && occ.gridCols > 0 && occ.gridRows > 0) {
        const cellW = figureW / occ.gridCols;
        const cellH = figureH / occ.gridRows;
        return boxTiles
          .filter((t) => t.blockId === b.blockId)
          .map((t) => {
            const bw = (t.col1 - t.col0 + 1) * cellW;
            const bh = (t.row1 - t.row0 + 1) * cellH;
            const bx = figureLeft + t.col0 * cellW;
            const by = figureTop + (occ.gridRows - 1 - t.row1) * cellH;
            return landingBoxRectSvg({
              x: bx,
              y: by,
              w: bw,
              h: bh,
              count: t.count,
              isFull: t.isFull,
              stroke: rectStroke,
              fill: rectFill,
            });
          })
          .join("\n");
      }

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

      // 1機だけなら中央に1つ。y=1 は左右のみ、x=1 は上下のみ（同じ番号の重複を避ける）
      if (countX === 1 && countY === 1) {
        const xMid = x + w / 2;
        const yMid = y + h / 2;
        return `
  <text
    x="${xMid}"
    y="${yMid}"
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

