// src/features/hub/utils/areaBlocks.ts
// 複数ブロック対応のユーティリティ（Phase 1）

import type { Area, Block } from "@/features/hub/types/resource";

/** 単一ブロック（drone_count 由来）の仮 ID。blocks が無い場合のフォールバック用 */
const SINGLE_BLOCK_ID = "block-single";

/**
 * area.blocks が存在し、空でないか
 */
export function hasBlocks(area: Area | null | undefined): boolean {
  const blocks = area?.blocks;
  return Array.isArray(blocks) && blocks.length > 0;
}

/**
 * drone_count から 1 ブロックを生成する。
 * blocks が無い or 空のときに使用。
 */
function createSingleBlockFromDroneCount(
  area: Area | null | undefined
): Block {
  const dc = area?.drone_count as
    | { x_count?: number | null; y_count?: number | null; count?: number }
    | undefined;
  const x = Number(dc?.x_count) || 0;
  const y = Number(dc?.y_count) || 0;
  const count = Number(dc?.count) || 0;
  return {
    id: SINGLE_BLOCK_ID,
    x_count: x,
    y_count: y,
    count,
  };
}

/**
 * blocks が無い場合に drone_count を参照して 1 ブロックとして扱う。
 * 常に Block[] を返す（空にはならない）。
 */
export function getEffectiveBlocks(area: Area | null | undefined): Block[] {
  if (hasBlocks(area)) {
    return area!.blocks!;
  }
  return [createSingleBlockFromDroneCount(area)];
}

/**
 * 単一ブロックを blocks 形式に正規化する（内部用）。
 * blocks が無い or 空の場合は drone_count から 1 ブロックを生成して返す。
 */
export function normalizeAreaToBlocksFormat(
  area: Area | null | undefined
): Area & { blocks: Block[] } {
  const blocks = getEffectiveBlocks(area);
  return {
    ...(area ?? ({} as Area)),
    blocks,
  };
}
