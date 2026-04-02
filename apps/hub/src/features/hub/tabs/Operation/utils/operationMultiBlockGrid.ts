import type { Area } from "@/features/hub/types/resource";
import { buildMultiBlockLayoutModel } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLayoutModel";
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
 */
export function buildOperationMultiBlockViewModel(
  area: Area | null | undefined
): OperationMultiBlockViewModel | null {
  if (!hasBlocks(area) || !area?.block_layout?.rows?.length) return null;

  const occ = buildMultiBlockOccupancyGrid(area);
  const layout = buildMultiBlockLayoutModel(area);
  if (!occ || !layout || occ.totalOccupied <= 0) return null;

  const horizontal = area.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area.spacing_between_drones_m?.vertical ?? "";
  // x=横(horizontal), y=縦(vertical) — エリア図・layout と一致
  const seqX = parseSpacingSeq(horizontal);
  const seqY = parseSpacingSeq(vertical);
  if (seqX.length === 0 || seqY.length === 0) return null;

  const fallback = 1;
  const blockLayoutById = new Map(layout.blocks.map((b) => [b.blockId, b] as const));
  const rowBottomM = layout.rowBottomMByLayoutRow;

  const measureMetersFromOrigin = (id: number): { x: number; y: number } | null => {
    const cell = occ.globalCellForId(id);
    if (!cell) return null;
    const { globalRow, globalCol } = cell;
    const loc = occ.locateOccupied(globalRow, globalCol);
    if (!loc) return null;
    const bResolved = blockLayoutById.get(loc.blockId);
    if (!bResolved) return null;
    const rowBottom = rowBottomM[loc.layoutRowIndex] ?? 0;
    const x = bResolved.x + cumDist(loc.localCol, seqX, fallback);
    const y = rowBottom + cumDist(loc.localRow, seqY, fallback);
    return { x, y };
  };

  return { occ, measureMetersFromOrigin };
}
