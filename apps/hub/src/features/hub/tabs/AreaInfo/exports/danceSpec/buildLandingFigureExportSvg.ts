import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { buildMultiBlockLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLandingFigureSvg";
import { getEffectiveBlocks, hasBlocks } from "@/features/hub/utils/areaBlocks";

type CornerDisplay = {
  fontSize?: number;
  placement?: "inside" | "outside";
  outsideHorizontal?: boolean;
  outsideVertical?: boolean;
};

type LandingFigureDisplay = {
  show_corner_numbers?: boolean;
  show_block_labels?: boolean;
  show_ruler?: boolean;
  corner_by_block_id?: Record<string, CornerDisplay>;
  ruler?: {
    leftXOffsetPx?: number;
    bottomYOffsetPx?: number;
  };
};

export function buildLandingFigureExportSvg(area: any): string {
  const figureDisplay: LandingFigureDisplay =
    (area?.landing_figure_display as LandingFigureDisplay | undefined) ?? {};
  const cornerByBlockId = figureDisplay.corner_by_block_id ?? {};
  const ruler = figureDisplay.ruler ?? {};
  const showCornerNumbers = figureDisplay.show_corner_numbers ?? true;
  const showBlockLabels = figureDisplay.show_block_labels ?? true;
  const showRuler = figureDisplay.show_ruler ?? true;

  const leftXOffsetPx = Number.isFinite(ruler.leftXOffsetPx)
    ? Number(ruler.leftXOffsetPx)
    : 0;
  const bottomYOffsetPx = Number.isFinite(ruler.bottomYOffsetPx)
    ? Number(ruler.bottomYOffsetPx)
    : 0;

  if (hasBlocks(area)) {
    return buildMultiBlockLandingFigureSvg(area as any, {
      theme: "export",
      showCornerNumbers,
      showBlockLabels,
      showRuler,
      cornerByBlockId,
      ruler: {
        leftXOffsetPx,
        bottomYOffsetPx,
      },
    });
  }

  const firstBlockId = getEffectiveBlocks(area)[0]?.id;
  const singleCorner =
    (firstBlockId && cornerByBlockId[firstBlockId]) || {
      placement: "inside" as const,
    };

  return buildLandingFigureSvg(area, {
    theme: "export",
    showCornerNumbers,
    showRuler,
    cornerDisplay: singleCorner,
    ruler: {
      leftXOffsetPx,
      bottomYOffsetPx,
    },
  });
}

