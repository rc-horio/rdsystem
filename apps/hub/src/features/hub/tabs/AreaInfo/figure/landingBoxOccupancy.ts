const BOX_COLS = 2;
const BOX_ROWS = 4;
const BOX_CAPACITY = BOX_COLS * BOX_ROWS;

export type GridCell = { col: number; row: number };

export type LandingBoxOccupancyTile = {
  col0: number;
  col1: number;
  row0: number;
  row1: number;
  count: number;
  isFull: boolean;
};

export type LandingBoxOccupancy = {
  countX: number;
  totalCount: number;
  boxCount: number;
  boxesPerRow: number;
  boxRowCount: number;
  /** BOX 段 × 4。最上段 BOX が欠けていてもスロット高さは 4 */
  gridRows: number;
  gridCols: number;
  /** 機体が載っている最上段 + 1 */
  occupiedRowCount: number;
  tiles: LandingBoxOccupancyTile[];
  corner: { tl: number; tr: number; bl: number; br: number };
  cornerCell: {
    tl: GridCell;
    tr: GridCell;
    bl: GridCell;
    br: GridCell;
  };
  idAt: (rowFromBottom: number, col: number) => number | null;
  cellForId: (id: number) => GridCell | null;
  cellIdAtVisualRow: (visualRow: number, col: number) => number | null;
};

/** 離発着ボックスは横 2 機なので、X は 2 以上の偶数 */
export function isValidLandingBoxCountX(countX: number): boolean {
  return Number.isInteger(countX) && countX >= 2 && countX % 2 === 0;
}

export function landingBoxOccupancyError(
  countX: number,
  totalCount: number
): string | null {
  const xOk = Number.isFinite(countX) && countX > 0;
  const totalOk = Number.isFinite(totalCount) && totalCount > 0;
  if (!xOk || !totalOk) return null;
  if (!isValidLandingBoxCountX(countX)) {
    return `X方向は2以上の偶数にしてください。離発着ボックスは横2機です。`;
  }
  return null;
}

export function derivedLandingBoxRowCount(
  countX: number,
  totalCount: number
): number | null {
  return buildLandingBoxOccupancy(countX, totalCount)?.gridRows ?? null;
}

/**
 * BOX → 機体 → 番号。
 * BOX は下段左から右、右端で一段上の左へ。欠けるのは最後の 1 BOX のみ。
 * 余りは下から、1 段の中は左→右。番号は下左 0、右へ、一段上の左へ。
 */
export function buildLandingBoxOccupancy(
  countX: number,
  totalCount: number
): LandingBoxOccupancy | null {
  const x = Number(countX);
  const total = Number(totalCount);
  if (!isValidLandingBoxCountX(x)) return null;
  if (!Number.isInteger(total) || total <= 0) return null;

  const boxesPerRow = x / BOX_COLS;
  const boxCount = Math.ceil(total / BOX_CAPACITY);
  const remainder = total % BOX_CAPACITY;
  const lastBoxDrones = remainder === 0 ? BOX_CAPACITY : remainder;
  const boxRowCount = Math.ceil(boxCount / boxesPerRow);
  const gridCols = x;
  const gridRows = boxRowCount * BOX_ROWS;

  const occupied: boolean[][] = Array.from({ length: gridRows }, () =>
    Array<boolean>(gridCols).fill(false)
  );
  const tiles: LandingBoxOccupancyTile[] = [];

  for (let b = 0; b < boxCount; b++) {
    const boxRow = Math.floor(b / boxesPerRow);
    const boxCol = b % boxesPerRow;
    const col0 = boxCol * BOX_COLS;
    const row0 = boxRow * BOX_ROWS;
    const n = b === boxCount - 1 ? lastBoxDrones : BOX_CAPACITY;
    let col1 = col0;
    let row1 = row0;
    for (let i = 0; i < n; i++) {
      const r = row0 + Math.floor(i / BOX_COLS);
      const c = col0 + (i % BOX_COLS);
      occupied[r]![c] = true;
      col1 = Math.max(col1, c);
      row1 = Math.max(row1, r);
    }
    tiles.push({
      col0,
      col1,
      row0,
      row1,
      count: n,
      isFull: n === BOX_CAPACITY,
    });
  }

  const idAtCell: (number | null)[][] = Array.from({ length: gridRows }, () =>
    Array<number | null>(gridCols).fill(null)
  );
  const cellById: GridCell[] = [];
  let nextId = 0;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!occupied[r]![c]) continue;
      idAtCell[r]![c] = nextId;
      cellById[nextId] = { col: c, row: r };
      nextId += 1;
    }
  }
  if (nextId !== total) return null;

  const firstOccupiedCol = (row: number): number => {
    for (let c = 0; c < gridCols; c++) {
      if (occupied[row]![c]) return c;
    }
    return -1;
  };
  const lastOccupiedCol = (row: number): number => {
    for (let c = gridCols - 1; c >= 0; c--) {
      if (occupied[row]![c]) return c;
    }
    return -1;
  };

  let topRow = 0;
  for (let r = gridRows - 1; r >= 0; r--) {
    if (firstOccupiedCol(r) >= 0) {
      topRow = r;
      break;
    }
  }

  const blCol = firstOccupiedCol(0);
  const brCol = lastOccupiedCol(0);
  const tlCol = firstOccupiedCol(topRow);
  const trCell = cellById[total - 1];
  if (blCol < 0 || brCol < 0 || tlCol < 0 || !trCell) return null;

  const tlId = idAtCell[topRow]![tlCol];
  const blId = idAtCell[0]![blCol];
  const brId = idAtCell[0]![brCol];
  if (tlId == null || blId == null || brId == null) return null;

  const idAt = (rowFromBottom: number, col: number): number | null => {
    if (
      rowFromBottom < 0 ||
      rowFromBottom >= gridRows ||
      col < 0 ||
      col >= gridCols
    ) {
      return null;
    }
    return idAtCell[rowFromBottom]![col] ?? null;
  };

  const cellForId = (id: number): GridCell | null => {
    if (!Number.isInteger(id) || id < 0 || id >= total) return null;
    return cellById[id] ?? null;
  };

  const cellIdAtVisualRow = (visualRow: number, col: number): number | null =>
    idAt(gridRows - 1 - visualRow, col);

  return {
    countX: x,
    totalCount: total,
    boxCount,
    boxesPerRow,
    boxRowCount,
    gridRows,
    gridCols,
    occupiedRowCount: topRow + 1,
    tiles,
    corner: {
      tl: tlId,
      tr: total - 1,
      bl: blId,
      br: brId,
    },
    cornerCell: {
      tl: { col: tlCol, row: topRow },
      tr: trCell,
      bl: { col: blCol, row: 0 },
      br: { col: brCol, row: 0 },
    },
    idAt,
    cellForId,
    cellIdAtVisualRow,
  };
}
