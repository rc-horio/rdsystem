import type { Area, BlockLayout } from "@/features/hub/types/resource";
import { parseSpacingSeq, cumDist } from "@/features/hub/utils/spacing";
import { buildMultiBlockOccupancyGrid } from "@/features/hub/tabs/AreaInfo/figure/multiBlockOccupancyGrid";

export type BlockLayoutResolved = {
  rowIndex: number;
  blockId: string;
  xCount: number;
  yCount: number;
  /** ブロック内の総機体数（通しID採番に使用） */
  totalCount: number;
  /** 左端の機体中心 X（メートル） */
  x: number;
  /** 上端の機体中心 Y（SVG: 上が0。メートル） */
  y: number;
  widthM: number;
  heightM: number;
  /** 占有グリッド上の左端列 */
  colStart: number;
  /** 占有グリッド上の最下段行（グローバル行 0 = 最下段） */
  rowBase: number;
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

/**
 * 複数ブロックの幾何。オペレーション配列図と同じく
 * 占有グリッドの行・列に間隔列を連続適用した機体中心座標。
 */
export function buildMultiBlockLayoutModel(area: Area): MultiBlockLayoutModel | null {
  const blocks = area.blocks;
  const layout: BlockLayout | undefined = area.block_layout;
  if (!blocks || !layout || !layout.rows || layout.rows.length === 0) return null;

  const occ = buildMultiBlockOccupancyGrid(area);
  if (!occ || occ.totalOccupied <= 0) return null;

  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";
  const seqX = parseSpacingSeq(horizontal);
  const seqY = parseSpacingSeq(vertical);
  if (seqX.length === 0 || seqY.length === 0) return null;

  const fallback = 1;
  const blockById = new Map(blocks.map((b) => [b.id, b] as const));
  const blockIndexById = new Map(blocks.map((b, i) => [b.id, i] as const));

  type Bounds = { minCol: number; maxCol: number; minRow: number; maxRow: number };
  const boundsById = new Map<string, Bounds>();
  for (let gr = 0; gr < occ.gridRows; gr++) {
    for (let gc = 0; gc < occ.gridCols; gc++) {
      const loc = occ.locateOccupied(gr, gc);
      if (!loc) continue;
      const prev = boundsById.get(loc.blockId);
      if (!prev) {
        boundsById.set(loc.blockId, {
          minCol: gc,
          maxCol: gc,
          minRow: gr,
          maxRow: gr,
        });
        continue;
      }
      prev.minCol = Math.min(prev.minCol, gc);
      prev.maxCol = Math.max(prev.maxCol, gc);
      prev.minRow = Math.min(prev.minRow, gr);
      prev.maxRow = Math.max(prev.maxRow, gr);
    }
  }

  const totalWidthM =
    occ.gridCols > 0 ? cumDist(occ.gridCols - 1, seqX, fallback) : 0;
  const totalHeightM =
    occ.gridRows > 0 ? cumDist(occ.gridRows - 1, seqY, fallback) : 0;

  if (!Number.isFinite(totalWidthM) || !Number.isFinite(totalHeightM)) {
    return null;
  }
  if (totalWidthM < 0 || totalHeightM < 0) return null;

  const resolved: BlockLayoutResolved[] = [];
  const rowMinMax = new Map<number, { minRow: number; maxRow: number }>();

  layout.rows.forEach((row, rowIndex) => {
    for (const bid of row.block_ids) {
      const b = blockById.get(bid);
      const bounds = boundsById.get(bid);
      if (!b || !bounds) continue;

      const countX = Number(b.x_count) || 0;
      const countY = Number(b.y_count) || 0;
      const x = cumDist(bounds.minCol, seqX, fallback);
      const widthM =
        bounds.maxCol > bounds.minCol
          ? cumDist(bounds.maxCol, seqX, fallback) - x
          : 0;
      const bottomM = cumDist(bounds.minRow, seqY, fallback);
      const topFromBottom = cumDist(bounds.maxRow, seqY, fallback);
      const heightM = bounds.maxRow > bounds.minRow ? topFromBottom - bottomM : 0;
      const y = totalHeightM - topFromBottom;

      resolved.push({
        rowIndex,
        blockId: bid,
        x,
        y,
        xCount: countX,
        yCount: countY,
        widthM,
        heightM,
        colStart: bounds.minCol,
        rowBase: bounds.minRow,
        totalCount: Math.trunc(Number(b.count) || 0),
        labelIndex: blockIndexById.get(bid) ?? 0,
      });

      const rowMm = rowMinMax.get(rowIndex);
      if (!rowMm) {
        rowMinMax.set(rowIndex, {
          minRow: bounds.minRow,
          maxRow: bounds.maxRow,
        });
      } else {
        rowMm.minRow = Math.min(rowMm.minRow, bounds.minRow);
        rowMm.maxRow = Math.max(rowMm.maxRow, bounds.maxRow);
      }
    }
  });

  if (resolved.length === 0) return null;

  const rowBottoms: number[] = [];
  const rowHeights: number[] = [];
  for (let i = 0; i < layout.rows.length; i++) {
    const mm = rowMinMax.get(i);
    if (!mm) {
      rowBottoms[i] = 0;
      rowHeights[i] = 0;
      continue;
    }
    rowBottoms[i] = cumDist(mm.minRow, seqY, fallback);
    rowHeights[i] =
      mm.maxRow > mm.minRow
        ? cumDist(mm.maxRow, seqY, fallback) - rowBottoms[i]
        : 0;
  }

  return {
    blocks: resolved,
    totalWidthM,
    totalHeightM,
    rowBottomMByLayoutRow: rowBottoms,
    rowHeightMByLayoutRow: rowHeights,
  };
}
