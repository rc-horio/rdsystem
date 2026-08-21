import type { Block, BlockLayoutRow } from "@/features/hub/types/resource";
import { adjacentGapM, emptyCellsForGapFrom } from "@/features/hub/utils/spacing";

export type LayoutGapAnchors = {
  /** [rowIndex][gapIndex] = 左ブロック右端の次の間隔の開始インデックス */
  rowGapFromIndex: number[][];
  /** その行の末尾にブロックを足すときの fromIndex */
  rowAppendFromIndex: number[];
  /** 行と行の間（下の行の上端の次） */
  betweenRowFromIndex: number[];
  /** 新しい行を末尾に足すときの fromIndex */
  appendRowFromIndex: number;
};

function actualRowsOf(xCount: number, count: number): number {
  const x = Math.max(0, Math.trunc(Number(xCount) || 0));
  const total = Math.max(0, Math.trunc(Number(count) || 0));
  if (x <= 0 || total <= 0) return 1;
  return Math.ceil(total / x);
}

/**
 * 占有グリッドと同じ順で、各ブロック間隔の「パターン開始位置」を求める。
 * 空きマス数は直前までの間隔から決まるので、左→右・下→上に累積する。
 */
export function computeLayoutGapAnchors(
  rows: BlockLayoutRow[],
  blocks: Pick<Block, "id" | "x_count" | "count">[],
  seqX: number[],
  seqY: number[],
  gapsBetweenRowsM: number[],
  fallback = 1
): LayoutGapAnchors {
  const blockById = new Map(blocks.map((b) => [b.id, b] as const));
  const rowGapFromIndex: number[][] = [];
  const rowAppendFromIndex: number[] = [];

  for (const row of rows) {
    let col = 0;
    const indexes: number[] = [];
    for (let bi = 0; bi < row.block_ids.length; bi++) {
      const b = blockById.get(row.block_ids[bi]!);
      const countX = Math.max(0, Math.trunc(Number(b?.x_count) || 0));
      col += countX;
      if (bi < row.block_ids.length - 1) {
        const fromIndex = Math.max(0, col - 1);
        indexes.push(fromIndex);
        col += emptyCellsForGapFrom(
          Number(row.gaps_m?.[bi]) || 0,
          seqX,
          fromIndex,
          fallback
        );
      }
    }
    rowGapFromIndex.push(indexes);
    rowAppendFromIndex.push(Math.max(0, col - 1));
  }

  const betweenRowFromIndex: number[] = [];
  let running = 0;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri]!;
    let maxRowsInRow = 1;
    for (const bid of row.block_ids) {
      const b = blockById.get(bid);
      if (!b) continue;
      maxRowsInRow = Math.max(
        maxRowsInRow,
        actualRowsOf(Number(b.x_count) || 0, Number(b.count) || 0)
      );
    }
    running += Math.max(1, maxRowsInRow);
    if (ri < rows.length - 1) {
      const fromIndex = Math.max(0, running - 1);
      betweenRowFromIndex.push(fromIndex);
      running += emptyCellsForGapFrom(
        Number(gapsBetweenRowsM[ri]) || 0,
        seqY,
        fromIndex,
        fallback
      );
    }
  }

  return {
    rowGapFromIndex,
    rowAppendFromIndex,
    betweenRowFromIndex,
    appendRowFromIndex: Math.max(0, running - 1),
  };
}

export function adjacentRowGapM(
  seqX: number[],
  fromIndex: number,
  fallback = 1
): number {
  return adjacentGapM(seqX.length ? seqX : [fallback], fromIndex, fallback);
}

export function adjacentBetweenRowGapM(
  seqY: number[],
  fromIndex: number,
  fallback = 1
): number {
  return adjacentGapM(seqY.length ? seqY : [fallback], fromIndex, fallback);
}
