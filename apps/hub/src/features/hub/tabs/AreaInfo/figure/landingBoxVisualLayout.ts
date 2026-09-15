export type PixelRect = { x: number; y: number; w: number; h: number };

type TileLike = { col0: number; col1: number; row0: number; row1: number };

const BOX_COLS = 2;
const BOX_ROWS = 4;

function gapAt(seq: number[], index: number, fallback: number): number {
  if (!seq.length) return fallback;
  const v = seq[((index % seq.length) + seq.length) % seq.length];
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** 隙間の合計は図の幅・高さのこの割合までに収める（図は大きくしない） */
const GUTTER_AXIS_FRAC = 0.14;
/** 0=全部同じ幅、1=間隔の割合どおり。ゆるく差が分かればよい */
const GUTTER_SOFT = 0.4;

function splitGutters(
  nGaps: number,
  axisSize: number,
  seq: number[],
  gapIndexAt: (i: number) => number,
  fallback: number
): number[] {
  if (nGaps <= 0 || !(axisSize > 0)) return [];
  const weights: number[] = [];
  for (let i = 0; i < nGaps; i++) {
    const g = gapAt(seq, gapIndexAt(i), fallback);
    weights.push(Number.isFinite(g) && g > 0 ? g : fallback);
  }
  const mean = weights.reduce((a, b) => a + b, 0) / nGaps;
  const mixed = weights.map((w) => {
    const ratio = mean > 0 ? w / mean : 1;
    const clamped = Math.min(2.2, Math.max(0.7, ratio));
    return 1 - GUTTER_SOFT + GUTTER_SOFT * clamped;
  });
  const sum = mixed.reduce((a, b) => a + b, 0);
  const avgCap = Math.max(3.5, axisSize * 0.018);
  const pool = Math.min(axisSize * GUTTER_AXIS_FRAC, nGaps * avgCap);
  if (!(pool > 0) || !(sum > 0)) return Array.from({ length: nGaps }, () => 0);
  return mixed.map((m) => (pool * m) / sum);
}

/**
 * 離発着ボックスの箱を同じ大きさのまま、箱の境だけ少し空ける。
 * 外枠のピクセルサイズは変えず、その中で隙間がぼんやり分かる程度。
 */
export function createLandingBoxVisualLayout(opts: {
  x: number;
  y: number;
  w: number;
  h: number;
  gridCols: number;
  gridRows: number;
  seqX: number[];
  seqY: number[];
  fallback?: number;
  /** このレイアウト左端の間隔パターン上の列インデックス */
  seqFromCol?: number;
  /** このレイアウト最下段の間隔パターン上の行インデックス */
  seqFromRow?: number;
  /** false なら箱は密着（等分割）。未指定は隙間あり */
  gutters?: boolean;
}) {
  const fallback = opts.fallback ?? 1;
  const fromCol = Math.max(0, Math.trunc(opts.seqFromCol ?? 0));
  const fromRow = Math.max(0, Math.trunc(opts.seqFromRow ?? 0));
  const boxesX = Math.max(1, Math.floor(opts.gridCols / BOX_COLS));
  const boxesY = Math.max(1, Math.floor(opts.gridRows / BOX_ROWS));
  const useGutters = opts.gutters !== false;

  const gutterX = useGutters
    ? splitGutters(
        boxesX - 1,
        opts.w,
        opts.seqX,
        (i) => fromCol + i * BOX_COLS + (BOX_COLS - 1),
        fallback
      )
    : Array.from({ length: Math.max(0, boxesX - 1) }, () => 0);
  const gutterY = useGutters
    ? splitGutters(
        boxesY - 1,
        opts.h,
        opts.seqY,
        (i) => fromRow + i * BOX_ROWS + (BOX_ROWS - 1),
        fallback
      )
    : Array.from({ length: Math.max(0, boxesY - 1) }, () => 0);

  const sumGx = gutterX.reduce((a, b) => a + b, 0);
  const sumGy = gutterY.reduce((a, b) => a + b, 0);
  const boxW = (opts.w - sumGx) / boxesX;
  const boxH = (opts.h - sumGy) / boxesY;
  const cellW = boxW / BOX_COLS;
  const cellH = boxH / BOX_ROWS;

  const slotX: number[] = [];
  {
    let acc = opts.x;
    for (let i = 0; i < boxesX; i++) {
      slotX.push(acc);
      acc += boxW + (gutterX[i] ?? 0);
    }
  }
  const slotYTop: number[] = [];
  {
    let fromBottom = 0;
    for (let i = 0; i < boxesY; i++) {
      slotYTop[i] = opts.y + opts.h - fromBottom - boxH;
      fromBottom += boxH + (gutterY[i] ?? 0);
    }
  }

  const clampBoxCol = (n: number) => Math.max(0, Math.min(boxesX - 1, n));
  const clampBoxRow = (n: number) => Math.max(0, Math.min(boxesY - 1, n));

  const cellRect = (col: number, rowFromBottom: number): PixelRect => {
    const boxCol = clampBoxCol(Math.floor(col / BOX_COLS));
    const boxRow = clampBoxRow(Math.floor(rowFromBottom / BOX_ROWS));
    const localCol = col - Math.floor(col / BOX_COLS) * BOX_COLS;
    const localRow = rowFromBottom - Math.floor(rowFromBottom / BOX_ROWS) * BOX_ROWS;
    const sx = slotX[boxCol] ?? opts.x;
    const sy = slotYTop[boxRow] ?? opts.y;
    return {
      x: sx + localCol * cellW,
      y: sy + (BOX_ROWS - 1 - localRow) * cellH,
      w: cellW,
      h: cellH,
    };
  };

  const tileRect = (t: TileLike): PixelRect => {
    const left = cellRect(t.col0, t.row0);
    const right = cellRect(t.col1, t.row0);
    const top = cellRect(t.col0, t.row1);
    const bottom = cellRect(t.col0, t.row0);
    return {
      x: left.x,
      y: top.y,
      w: right.x + right.w - left.x,
      h: bottom.y + bottom.h - top.y,
    };
  };

  return { cellRect, tileRect, gutterX, gutterY, boxW, boxH };
}
