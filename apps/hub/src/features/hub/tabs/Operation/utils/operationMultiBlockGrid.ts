import type { Area } from "@/features/hub/types/resource";
import {
  buildMultiBlockOccupancyGrid,
  type MultiBlockOccupancyGrid,
} from "@/features/hub/tabs/AreaInfo/figure/multiBlockOccupancyGrid";
import { hasBlocks } from "@/features/hub/utils/areaBlocks";
import { cumDist, parseSpacingSeq } from "@/features/hub/utils/spacing";

export type OperationMultiBlockViewModel = {
  occ: MultiBlockOccupancyGrid;
  measureMetersFromOrigin: (id: number) => { x: number; y: number } | null;
};

/**
 * 複数ブロック＋block_layout がある場合、オペレーションタブで仮想グリッドと計測座標を提供する。
 * 座標は配列図と同じく、占有グリッドの行・列に間隔列を連続適用した機体中心。
 */
export function buildOperationMultiBlockViewModel(
  area: Area | null | undefined
): OperationMultiBlockViewModel | null {
  if (!hasBlocks(area) || !area?.block_layout?.rows?.length) return null;

  const occ = buildMultiBlockOccupancyGrid(area);
  if (!occ || occ.totalOccupied <= 0) return null;

  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";
  const seqX = parseSpacingSeq(horizontal);
  const seqY = parseSpacingSeq(vertical);
  if (seqX.length === 0 || seqY.length === 0) return null;

  const fallback = 1;

  const measureMetersFromOrigin = (id: number): { x: number; y: number } | null => {
    const cell = occ.globalCellForId(id);
    if (!cell) return null;
    return {
      x: cumDist(cell.globalCol, seqX, fallback),
      y: cumDist(cell.globalRow, seqY, fallback),
    };
  };

  return { occ, measureMetersFromOrigin };
}
