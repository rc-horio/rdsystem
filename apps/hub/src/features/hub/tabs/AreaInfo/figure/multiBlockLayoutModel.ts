import type { Area, BlockLayout } from "@/features/hub/types/resource";
import { parseSpacingSeq, cumDist } from "@/features/hub/utils/spacing";

export type BlockLayoutResolved = {
  rowIndex: number;
  blockId: string;
  xCount: number;
  yCount: number;
  /** ブロック内の総機体数（通しID採番に使用） */
  totalCount: number;
  /** 左上X座標（メートル） */
  x: number;
  /** 上端Y座標（SVG: 上が0。メートル） */
  y: number;
  widthM: number;
  heightM: number;
  /** blocks 配列上のインデックス（ラベル用） */
  labelIndex: number;
};

export type MultiBlockLayoutModel = {
  blocks: BlockLayoutResolved[];
  totalWidthM: number;
  totalHeightM: number;
  /** レイアウト行インデックスごと、下からのバンド下端までの距離（m） */
  rowBottomMByLayoutRow: number[];
  /** レイアウト行インデックスごとのバンド高さ（m） */
  rowHeightMByLayoutRow: number[];
};

export function buildMultiBlockLayoutModel(area: Area): MultiBlockLayoutModel | null {
  const blocks = area.blocks;
  const layout: BlockLayout | undefined = area.block_layout;
  if (!blocks || !layout || !layout.rows || layout.rows.length === 0) return null;

  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";

  const seqX = parseSpacingSeq(vertical);
  const seqY = parseSpacingSeq(horizontal);

  if (seqX.length === 0 || seqY.length === 0) return null;

  const fallback = 1;

  const blockById = new Map(blocks.map((b) => [b.id, b] as const));

  const blockIndexById = new Map(blocks.map((b, i) => [b.id, i] as const));

  const resolved: BlockLayoutResolved[] = [];

  const rowHeights: number[] = [];
  const rowBottoms: number[] = [];

  let currentYFromBottom = 0;
  let totalWidthM = 0;

  layout.rows.forEach((row, rowIndex) => {
    let currentX = 0;
    let rowHeight = 0;

    row.block_ids.forEach((bid, bi) => {
      const b = blockById.get(bid);
      if (!b) return;

      const countX = Number(b.x_count) || 0;
      const countY = Number(b.y_count) || 0;

      const widthM =
        countX >= 2 ? cumDist(countX - 1, seqX, fallback) : (seqX[0] ?? fallback);
      const heightM =
        countY >= 2 ? cumDist(countY - 1, seqY, fallback) : (seqY[0] ?? fallback);

      rowHeight = Math.max(rowHeight, heightM);

      currentX += widthM;

      if (bi < row.block_ids.length - 1) {
        const gap = Number(row.gaps_m?.[bi]) || 0;
        currentX += Math.max(0, gap);
      }
    });

    totalWidthM = Math.max(totalWidthM, currentX);

    rowHeights[rowIndex] = rowHeight;
    rowBottoms[rowIndex] = currentYFromBottom;

    if (rowIndex < layout.rows.length - 1) {
      const gapBetween = Number(layout.gaps_between_rows_m?.[rowIndex]) || 0;
      currentYFromBottom += rowHeight + Math.max(0, gapBetween);
    } else {
      currentYFromBottom += rowHeight;
    }
  });

  const totalHeightM = currentYFromBottom;

  layout.rows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex] ?? 0;
    const rowBottom = rowBottoms[rowIndex] ?? 0;
    const rowTop = totalHeightM - (rowBottom + rowHeight);

    let currentX = 0;

    row.block_ids.forEach((bid, bi) => {
      const b = blockById.get(bid);
      if (!b) return;

      const countX = Number(b.x_count) || 0;
      const countY = Number(b.y_count) || 0;

      const widthM =
        countX >= 2 ? cumDist(countX - 1, seqX, fallback) : (seqX[0] ?? fallback);
      const heightM =
        countY >= 2 ? cumDist(countY - 1, seqY, fallback) : (seqY[0] ?? fallback);

      const blockTopM = rowTop + (rowHeight - heightM);

      resolved.push({
        rowIndex,
        blockId: bid,
        x: currentX,
        y: blockTopM,
        xCount: countX,
        yCount: countY,
        widthM,
        heightM,
        totalCount: Math.trunc(Number(b.count) || 0),
        labelIndex: blockIndexById.get(bid) ?? 0,
      });

      currentX += widthM;

      if (bi < row.block_ids.length - 1) {
        const gap = Number(row.gaps_m?.[bi]) || 0;
        currentX += Math.max(0, gap);
      }
    });
  });

  if (
    !Number.isFinite(totalWidthM) ||
    !Number.isFinite(totalHeightM) ||
    totalWidthM <= 0 ||
    totalHeightM <= 0
  ) {
    return null;
  }

  return {
    blocks: resolved,
    totalWidthM,
    totalHeightM,
    rowBottomMByLayoutRow: rowBottoms,
    rowHeightMByLayoutRow: rowHeights,
  };
}
