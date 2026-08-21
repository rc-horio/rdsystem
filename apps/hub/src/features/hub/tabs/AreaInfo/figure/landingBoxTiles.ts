import type { MultiBlockOccupancyGrid } from "@/features/hub/tabs/AreaInfo/figure/multiBlockOccupancyGrid";

/** Y×X。未設定・不正値は 4x2（Y４機×X２機） */
export type TakeoffLandingBoxYx = "4x2" | "2x4";

export const TAKEOFF_LANDING_BOX_GAP_PX = 2;

export function parseTakeoffLandingBoxYx(raw: unknown): TakeoffLandingBoxYx {
  return raw === "2x4" ? "2x4" : "4x2";
}

export function takeoffLandingBoxCellSize(yx: TakeoffLandingBoxYx): {
  cols: number;
  rows: number;
} {
  return yx === "2x4" ? { cols: 4, rows: 2 } : { cols: 2, rows: 4 };
}

export type LandingBoxTile = {
  blockId: string;
  /** 占有セルの列 min（グローバル） */
  col0: number;
  col1: number;
  /** 占有セルの行 min（グローバル、0 = 最下段） */
  row0: number;
  row1: number;
  count: number;
  isFull: boolean;
};

type LocalCell = { localCol: number; localRow: number; gc: number; gr: number };

/**
 * 占有グリッドを 2×4 / 4×2 でタイルする。満杯は 8 機、端数は占有セルの外接枠。
 */
export function collectLandingBoxTiles(
  occ: MultiBlockOccupancyGrid,
  yx: TakeoffLandingBoxYx
): LandingBoxTile[] {
  const { cols: boxCols, rows: boxRows } = takeoffLandingBoxCellSize(yx);
  const byBlock = new Map<string, LocalCell[]>();

  for (let gr = 0; gr < occ.gridRows; gr++) {
    for (let gc = 0; gc < occ.gridCols; gc++) {
      const loc = occ.locateOccupied(gr, gc);
      if (!loc) continue;
      const arr = byBlock.get(loc.blockId) ?? [];
      arr.push({
        localCol: loc.localCol,
        localRow: loc.localRow,
        gc,
        gr,
      });
      byBlock.set(loc.blockId, arr);
    }
  }

  const tiles: LandingBoxTile[] = [];

  for (const [blockId, cells] of byBlock.entries()) {
    if (cells.length === 0) continue;
    const occupied = new Map<string, LocalCell>();
    let maxLocalCol = 0;
    let maxLocalRow = 0;
    for (const c of cells) {
      occupied.set(`${c.localCol},${c.localRow}`, c);
      maxLocalCol = Math.max(maxLocalCol, c.localCol);
      maxLocalRow = Math.max(maxLocalRow, c.localRow);
    }

    for (let ty = 0; ty <= maxLocalRow; ty += boxRows) {
      for (let tx = 0; tx <= maxLocalCol; tx += boxCols) {
        const hit: LocalCell[] = [];
        for (let r = ty; r < ty + boxRows; r++) {
          for (let c = tx; c < tx + boxCols; c++) {
            const cell = occupied.get(`${c},${r}`);
            if (cell) hit.push(cell);
          }
        }
        if (hit.length === 0) continue;
        let col0 = hit[0]!.gc;
        let col1 = hit[0]!.gc;
        let row0 = hit[0]!.gr;
        let row1 = hit[0]!.gr;
        for (const h of hit) {
          col0 = Math.min(col0, h.gc);
          col1 = Math.max(col1, h.gc);
          row0 = Math.min(row0, h.gr);
          row1 = Math.max(row1, h.gr);
        }
        tiles.push({
          blockId,
          col0,
          col1,
          row0,
          row1,
          count: hit.length,
          isFull: hit.length === boxCols * boxRows,
        });
      }
    }
  }

  return tiles;
}

export type LocalLandingBoxTile = {
  col0: number;
  col1: number;
  row0: number;
  row1: number;
  count: number;
  isFull: boolean;
};

/** 単一ブロック（drone_count）用。local 列・行は最下段が row 0。 */
export function collectSingleBlockBoxTiles(
  countX: number,
  totalCount: number,
  yx: TakeoffLandingBoxYx
): LocalLandingBoxTile[] {
  const x = Math.max(0, Math.trunc(countX));
  const total = Math.max(0, Math.trunc(totalCount));
  if (x <= 0 || total <= 0) return [];

  const actualRows = Math.ceil(total / x);
  const lastRowCount = total - (actualRows - 1) * x;
  const occupied = new Set<string>();
  for (let r = 0; r < actualRows; r++) {
    const width = r === actualRows - 1 ? lastRowCount : x;
    for (let c = 0; c < width; c++) occupied.add(`${c},${r}`);
  }

  const { cols: boxCols, rows: boxRows } = takeoffLandingBoxCellSize(yx);
  const tiles: LocalLandingBoxTile[] = [];

  for (let ty = 0; ty < actualRows; ty += boxRows) {
    for (let tx = 0; tx < x; tx += boxCols) {
      let count = 0;
      let col0 = Number.POSITIVE_INFINITY;
      let col1 = Number.NEGATIVE_INFINITY;
      let row0 = Number.POSITIVE_INFINITY;
      let row1 = Number.NEGATIVE_INFINITY;
      for (let r = ty; r < ty + boxRows; r++) {
        for (let c = tx; c < tx + boxCols; c++) {
          if (!occupied.has(`${c},${r}`)) continue;
          count += 1;
          col0 = Math.min(col0, c);
          col1 = Math.max(col1, c);
          row0 = Math.min(row0, r);
          row1 = Math.max(row1, r);
        }
      }
      if (count === 0) continue;
      tiles.push({
        col0,
        col1,
        row0,
        row1,
        count,
        isFull: count === boxCols * boxRows,
      });
    }
  }

  return tiles;
}

export function landingBoxRectSvg(opts: {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  isFull: boolean;
  stroke: string;
  fill: string;
}): string {
  const gap = TAKEOFF_LANDING_BOX_GAP_PX;
  const w = Math.max(1, opts.w - gap);
  const h = Math.max(1, opts.h - gap);
  const x = opts.x + gap / 2;
  const y = opts.y + gap / 2;
  const countAttr = opts.isFull ? "" : ` data-box-count="${opts.count}"`;
  return `
  <g${countAttr}>
    <rect
      x="${x}"
      y="${y}"
      width="${w}"
      height="${h}"
      stroke="${opts.stroke}"
      stroke-width="1.5"
      stroke-opacity="0.9"
      fill="${opts.fill}"
      fill-opacity="0.35"
      pointer-events="all"${countAttr}
    />
  </g>
  `.trim();
}
