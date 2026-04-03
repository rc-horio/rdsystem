import type { Area } from "@/features/hub/types/resource";
import { cumDist, parseSpacingSeq } from "@/features/hub/utils/spacing";

type OccupiedInterval = {
  start: number;
  end: number;
  blockId: string;
  /** ブロック内で下から数えた行インデックス */
  localRow: number;
};

type BlockOccMeta = {
  blockId: string;
  layoutRowIndex: number;
  xCount: number;
  yCount: number;
  totalCount: number;
};

/**
 * オペレーションタブのテーブル／離着陸図と整合する「占有セルのみ採番」の仮想グリッド。
 * - グローバル行 0 = 最下段（図と同じ）
 * - 列は行内の x_count の合算で詰める（ブロック間の物理ギャップは列には含めない）
 */
export type MultiBlockOccupancyGrid = {
  gridCols: number;
  gridRows: number;
  totalOccupied: number;
  /** 最下段を 0 とするグローバル行・列 */
  cellIdAtGlobal: (globalRow: number, globalCol: number) => number | null;
  /** 画面上端を r=0 とする行インデックス */
  cellIdAtVisualRow: (visualRow: number, globalCol: number) => number | null;
  globalCellForId: (id: number) => { globalRow: number; globalCol: number } | null;
  /** 占有セルのブロック内座標（計測用） */
  locateOccupied: (
    globalRow: number,
    globalCol: number
  ) => {
    blockId: string;
    localRow: number;
    localCol: number;
    layoutRowIndex: number;
  } | null;
};

export function buildMultiBlockOccupancyGrid(
  area: Area | null | undefined
): MultiBlockOccupancyGrid | null {
  const blocks = area?.blocks;
  const layout = area?.block_layout;
  if (!blocks?.length || !layout?.rows?.length) return null;

  const blockById = new Map(blocks.map((b) => [b.id, b] as const));
  // x=横(horizontal), y=縦(vertical) — multiBlockLayoutModel と一致
  const spacingX = parseSpacingSeq(area?.spacing_between_drones_m?.horizontal ?? "");
  const spacingY = parseSpacingSeq(area?.spacing_between_drones_m?.vertical ?? "");
  if (!spacingX.length || !spacingY.length) return null;
  const fallback = 1;

  const stepsForGapOnSeq = (gapM: number, seq: number[]): number => {
    if (!Number.isFinite(gapM) || gapM <= 0) return 0;
    const eps = 1e-6;
    // モーダル側で「累積和パターンに一致」へ制約している前提
    for (let steps = 1; steps <= 1000; steps++) {
      const d = cumDist(steps, seq, fallback);
      if (Math.abs(d - gapM) <= eps) return steps;
      if (d > gapM + eps) break;
    }
    return 0;
  };

  // 「gap(m)」は隣接する機体中心間の距離なので、
  // 仮想グリッド上の空白セル数は (必要ステップ - 1) になる。
  // 例: gap=1m, spacing=1m -> steps=1 -> empty=0
  const emptyCellsForGapOnSeq = (gapM: number, seq: number[]): number => {
    const steps = stepsForGapOnSeq(gapM, seq);
    return Math.max(0, steps - 1);
  };

  const metas: BlockOccMeta[] = [];
  layout.rows.forEach((row, layoutRowIndex) => {
    for (const bid of row.block_ids) {
      const b = blockById.get(bid);
      if (!b) continue;
      metas.push({
        blockId: bid,
        layoutRowIndex,
        xCount: Math.max(0, Math.trunc(Number(b.x_count) || 0)),
        yCount: Math.max(0, Math.trunc(Number(b.y_count) || 0)),
        totalCount: Math.max(0, Math.trunc(Number(b.count) || 0)),
      });
    }
  });

  const metaById = new Map(metas.map((m) => [m.blockId, m] as const));

  const blocksByRow = new Map<number, BlockOccMeta[]>();
  for (const m of metas) {
    const arr = blocksByRow.get(m.layoutRowIndex) ?? [];
    arr.push(m);
    blocksByRow.set(m.layoutRowIndex, arr);
  }

  const rowIndices = [...blocksByRow.keys()].sort((a, b) => a - b);
  const rowHeightCells = new Map<number, number>();
  const colStartByBlockId = new Map<string, number>();
  const rowBaseByRowIndex = new Map<number, number>();
  let maxCols = 0;

  for (const rowIndex of rowIndices) {
    const rowSpec = layout.rows[rowIndex];
    if (!rowSpec) continue;
    let col = 0;
    let maxRowsInRow = 1;
    for (let bi = 0; bi < rowSpec.block_ids.length; bi++) {
      const bid = rowSpec.block_ids[bi]!;
      const b = metaById.get(bid);
      if (!b) continue;
      const countX = b.xCount;
      const totalCount = b.totalCount;
      colStartByBlockId.set(b.blockId, col);
      col += countX;
      if (bi < rowSpec.block_ids.length - 1) {
        col += emptyCellsForGapOnSeq(Number(rowSpec.gaps_m?.[bi]) || 0, spacingX);
      }
      if (countX > 0 && totalCount > 0) {
        const actualRows = Math.ceil(totalCount / countX);
        if (actualRows > maxRowsInRow) maxRowsInRow = actualRows;
      }
    }
    maxCols = Math.max(maxCols, col);
    rowHeightCells.set(rowIndex, Math.max(1, maxRowsInRow));
  }

  let runningRowBase = 0;
  for (let ri = 0; ri < rowIndices.length; ri++) {
    const rowIndex = rowIndices[ri]!;
    rowBaseByRowIndex.set(rowIndex, runningRowBase);
    runningRowBase += rowHeightCells.get(rowIndex) ?? 1;
    if (ri < rowIndices.length - 1) {
      runningRowBase += emptyCellsForGapOnSeq(
        Number(layout.gaps_between_rows_m?.[rowIndex]) || 0,
        spacingY
      );
    }
  }

  const gridRows = runningRowBase;
  const gridCols = Math.max(1, maxCols);

  const occupiedDetailByGlobalRow = new Map<number, OccupiedInterval[]>();

  for (const m of metas) {
    const countX = m.xCount;
    const totalCount = m.totalCount;
    if (countX <= 0 || totalCount <= 0) continue;

    const rowBase = rowBaseByRowIndex.get(m.layoutRowIndex) ?? 0;
    const colStart = colStartByBlockId.get(m.blockId) ?? 0;
    const actualRows = Math.ceil(totalCount / countX);
    const lastRowCount = totalCount - (actualRows - 1) * countX;
    const fullRectCount = countX * Math.max(1, m.yCount);
    const isHexagon =
      totalCount < fullRectCount &&
      lastRowCount > 0 &&
      lastRowCount < countX;

    for (let r = 0; r < actualRows; r++) {
      const rowWidth = isHexagon && r === actualRows - 1 ? lastRowCount : countX;
      if (rowWidth <= 0) continue;
      const gRow = rowBase + r;
      const intervals = occupiedDetailByGlobalRow.get(gRow) ?? [];
      intervals.push({
        start: colStart,
        end: colStart + rowWidth - 1,
        blockId: m.blockId,
        localRow: r,
      });
      intervals.sort((a, c) => a.start - c.start);
      occupiedDetailByGlobalRow.set(gRow, intervals);
    }
  }

  const globalRows = [...occupiedDetailByGlobalRow.keys()].sort((a, b) => a - b);
  const occupiedPrefixBeforeRow = new Map<number, number>();
  let occupiedRunning = 0;
  for (const gRow of globalRows) {
    occupiedPrefixBeforeRow.set(gRow, occupiedRunning);
    const rowIntervals = occupiedDetailByGlobalRow.get(gRow) ?? [];
    occupiedRunning += rowIntervals.reduce(
      (sum, iv) => sum + (iv.end - iv.start + 1),
      0
    );
  }

  const totalOccupied = occupiedRunning;

  const rankAtOccupiedCell = (globalRow: number, globalCol: number): number => {
    const base = occupiedPrefixBeforeRow.get(globalRow) ?? 0;
    const rowIntervals = occupiedDetailByGlobalRow.get(globalRow) ?? [];
    let inRow = 0;
    for (const iv of rowIntervals) {
      if (globalCol < iv.start) break;
      if (globalCol > iv.end) {
        inRow += iv.end - iv.start + 1;
        continue;
      }
      inRow += globalCol - iv.start + 1;
      return base + inRow - 1;
    }
    return Math.max(0, base + inRow - 1);
  };

  const cellIdAtGlobal = (globalRow: number, globalCol: number): number | null => {
    if (
      globalRow < 0 ||
      globalCol < 0 ||
      globalRow >= gridRows ||
      globalCol >= gridCols
    ) {
      return null;
    }
    const det = occupiedDetailByGlobalRow.get(globalRow);
    if (!det?.length) return null;
    for (const iv of det) {
      if (globalCol >= iv.start && globalCol <= iv.end) {
        return rankAtOccupiedCell(globalRow, globalCol);
      }
    }
    return null;
  };

  const cellIdAtVisualRow = (visualRow: number, globalCol: number): number | null => {
    const gr = gridRows - 1 - visualRow;
    return cellIdAtGlobal(gr, globalCol);
  };

  const idToCell = new Map<number, { globalRow: number; globalCol: number }>();
  for (let gr = 0; gr < gridRows; gr++) {
    for (let gc = 0; gc < gridCols; gc++) {
      const id = cellIdAtGlobal(gr, gc);
      if (id !== null) idToCell.set(id, { globalRow: gr, globalCol: gc });
    }
  }

  const globalCellForId = (id: number): { globalRow: number; globalCol: number } | null =>
    idToCell.get(id) ?? null;

  const locateOccupied = (
    globalRow: number,
    globalCol: number
  ): {
    blockId: string;
    localRow: number;
    localCol: number;
    layoutRowIndex: number;
  } | null => {
    const rowDet = occupiedDetailByGlobalRow.get(globalRow);
    if (!rowDet) return null;
    for (const iv of rowDet) {
      if (globalCol < iv.start || globalCol > iv.end) continue;
      const meta = metaById.get(iv.blockId);
      if (!meta) return null;
      return {
        blockId: iv.blockId,
        localRow: iv.localRow,
        localCol: globalCol - iv.start,
        layoutRowIndex: meta.layoutRowIndex,
      };
    }
    return null;
  };

  return {
    gridCols,
    gridRows,
    totalOccupied,
    cellIdAtGlobal,
    cellIdAtVisualRow,
    globalCellForId,
    locateOccupied,
  };
}
