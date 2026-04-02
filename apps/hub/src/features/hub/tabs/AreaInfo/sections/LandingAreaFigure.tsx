// src/features/hub/tabs/AreaInfo/sections/LandingAreaFigure.tsx

import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { buildMultiBlockLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLandingFigureSvg";
import { hasBlocks, getEffectiveBlocks } from "@/features/hub/utils/areaBlocks";
import {
  SectionTitle,
  Drone1Icon,
  Drone2Icon,
  DisplayOrInput,
} from "@/components";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
};

export function LandingAreaFigure({ edit, area, onPatchArea }: Props) {
  const figureDisplay = (area as any)?.landing_figure_display ?? {};
  const cornerByBlockId =
    (figureDisplay.corner_by_block_id as Record<
      string,
      {
        fontSize?: number;
        placement?: "inside" | "outside";
        outsideHorizontal?: boolean;
        outsideVertical?: boolean;
      }
    > | undefined) ?? {};
  const ruler = (figureDisplay.ruler as
    | { leftXOffsetPx?: number; bottomYOffsetPx?: number }
    | undefined) ?? {
    leftXOffsetPx: 0,
    bottomYOffsetPx: 0,
  };
  const showCornerNumbers = figureDisplay.show_corner_numbers ?? true;
  const showBlockLabels = figureDisplay.show_block_labels ?? true;
  const showRuler = figureDisplay.show_ruler ?? true;

  const firstBlockId = getEffectiveBlocks(area)[0]?.id;

  const svgMarkup = hasBlocks(area)
    ? buildMultiBlockLandingFigureSvg(area as any, {
        theme: "ui",
        showCornerNumbers,
        showBlockLabels,
        showRuler,
        cornerByBlockId,
        ruler: {
          leftXOffsetPx: Number.isFinite(ruler.leftXOffsetPx) ? Number(ruler.leftXOffsetPx) : 0,
          bottomYOffsetPx: Number.isFinite(ruler.bottomYOffsetPx) ? Number(ruler.bottomYOffsetPx) : 0,
        },
      })
    : buildLandingFigureSvg(area, {
        theme: "ui",
        showCornerNumbers,
        showRuler,
        cornerDisplay:
          (firstBlockId && cornerByBlockId[firstBlockId]) || {
            placement: "inside",
          },
        ruler: {
          leftXOffsetPx: Number.isFinite(ruler.leftXOffsetPx) ? Number(ruler.leftXOffsetPx) : 0,
          bottomYOffsetPx: Number.isFinite(ruler.bottomYOffsetPx) ? Number(ruler.bottomYOffsetPx) : 0,
        },
      });

  // 間隔入力（オペレーションタブのテーブルと同じ仕様）
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  // 機体向きUI
  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
      Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 180;

  // 間隔入力
  const setHorizontal = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        horizontal: v,
      },
    };
    onPatchArea(next);
  };

  // 間隔入力
  const setVertical = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        vertical: v,
      },
    };
    onPatchArea(next);
  };

  // 機体向き
  const rotateBy = (delta: number) => {
    const current =
      typeof rotation === "number" && Number.isFinite(rotation) ? rotation : 0;
    const next = current + delta;
    const patched = { ...(area ?? {}), drone_orientation_deg: next };
    onPatchArea(patched);
  };

  // アンテナ位置
  const antennaPosition = () => {
    const radius = 65;
    const angleInRadians = ((rotation + 90) % 360) * (Math.PI / 180);
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    const yOffset = 30;
    return { x, y: y + yOffset };
  };
  const { x, y } = antennaPosition();

  // バッテリー位置
  const batteryPosition = () => {
    const radius = 62;
    const angleInRadians = ((rotation + 270) % 360) * (Math.PI / 180);
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    const yOffset = 25;
    return { x, y: y + yOffset };
  };
  const { x: batteryX, y: batteryY } = batteryPosition();

  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア" />

      <div className="my-4 flex flex-col lg:flex-row gap-4">
        {/* 左: 離発着エリア図 */}
        <div className="flex-1 lg:basis-8/12">
          <div className="h-120 w-full border border-slate-600">
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>
        </div>

        {/* 右: 機体の向き図 */}
        <div className="flex-1 lg:basis-3/12">
          <div data-export-orientation-figure
            className="h-120 w-full relative flex flex-col items-center justify-center border border-slate-600">
            <span className="absolute top-2 left-3 text-white text-sm font-semibold">
              機体の向き
            </span>

            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Drone1Icon
                  className="w-20 h-20 drone1-img"
                  rotationDeg={rotation}
                />

                <div className="mt-10 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => rotateBy(-90)}
                    disabled={!edit}
                    className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                    aria-label="左へ90度回転"
                    title="左へ90°"
                  >
                    ↶
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateBy(90)}
                    disabled={!edit}
                    className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                    aria-label="右へ90度回転"
                    title="右へ90°"
                  >
                    ↷
                  </button>
                </div>

                <div
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <span className="text-sm text-red-500">Antenna</span>
                </div>

                <div
                  className="absolute"
                  style={{
                    transform: `translate(${batteryX}px, ${batteryY}px)`,
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <span className="text-sm text-white">Battery</span>
                </div>
              </div>
            </div>

            <div className="h-10" />

            <div className="relative flex flex-col items-center justify-center">
              <div className="absolute left-[-20px] flex items-center gap-2">
                <DisplayOrInput
                  edit={edit}
                  // 左側（縦方向）は y 軸間隔
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className="w-[70px]! text-center"
                />
                <span className="text-slate-100 text-sm">m</span>
              </div>

              <div>
                <Drone2Icon className="w-20 h-20 drone2-img ml-20" />
              </div>

              <div className="absolute top-[100px] left-[85px] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <DisplayOrInput
                    edit={edit}
                    // 下側（横方向）は x 軸間隔
                    value={horizontal}
                    onChange={(e) => setHorizontal(e.target.value)}
                    className="w-[70px]! text-center"
                  />
                  <span className="text-slate-100 text-sm">m</span>
                </div>
              </div>

              <span className="absolute top-[150px] left-1/2 -translate-x-1/2 text-[12px] leading-tight text-slate-300 whitespace-nowrap">
                ※複数値をカンマ区切りで指定
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
