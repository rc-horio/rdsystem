// src/features/hub/tabs/AreaInfo/sections/LandingAreaFigure.tsx

import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { buildMultiBlockLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLandingFigureSvg";
import { hasBlocks, getEffectiveBlocks } from "@/features/hub/utils/areaBlocks";
import {
  SectionTitle,
  Drone2Icon,
  DisplayOrInput,
  DRONE_SPACING_ICON_PX,
  DRONE_SPACING_GAP_PX,
} from "@/components";
import { DroneCountSection } from "./DroneCountSection";
import { MultiBlockEditModal } from "./MultiBlockEditModal";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import { useState, type Ref } from "react";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
  /** 間隔図の実幅計測用。広いときだけ左ペインを広げる */
  spacingBoxRef?: Ref<HTMLDivElement>;
};

const MAX_SPACING_GAPS = 8;
const SPACING_INPUT_W_PX = 52;

function splitSpacingFields(v: string): string[] {
  if (typeof v !== "string" || v.trim() === "") return [""];
  const parts = v.split(",").map((s) => s.trim());
  while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
  return parts.length > 0 ? parts : [""];
}

export function LandingAreaFigure({ edit, area, onPatchArea, spacingBoxRef }: Props) {
  const [showMultiBlockModal, setShowMultiBlockModal] = useState(false);
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

  // 間隔入力（オペレーションタブのテーブルと同じ CSV を内部保持）
  const spacing = area?.spacing_between_drones_m ?? {};
  const horizontal = spacing.horizontal ?? "";
  const vertical = spacing.vertical ?? "";

  const seqXFields = splitSpacingFields(horizontal);
  const seqYFields = splitSpacingFields(vertical);
  const unequal =
    spacing.unequal === true ||
    seqXFields.length > 1 ||
    seqYFields.length > 1;

  const cols = unequal ? Math.max(2, seqXFields.length + 1) : 2;
  const rows = unequal ? Math.max(2, seqYFields.length + 1) : 2;

  const patchSpacing = (partial: Record<string, unknown>) => {
    onPatchArea({
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...spacing,
        ...partial,
      },
    });
  };

  const setSeqXAt = (index: number, v: string) => {
    const next = [...seqXFields];
    next[index] = v;
    patchSpacing({
      horizontal: next.join(","),
      ...(unequal ? { unequal: true } : {}),
    });
  };
  const setSeqYAt = (index: number, v: string) => {
    const next = [...seqYFields];
    next[index] = v;
    patchSpacing({
      vertical: next.join(","),
      ...(unequal ? { unequal: true } : {}),
    });
  };

  const addSeqX = () => {
    if (seqXFields.length >= MAX_SPACING_GAPS) return;
    const last = seqXFields[seqXFields.length - 1] ?? "";
    patchSpacing({
      horizontal: [...seqXFields, last].join(","),
      unequal: true,
    });
  };
  const addSeqY = () => {
    if (seqYFields.length >= MAX_SPACING_GAPS) return;
    const last = seqYFields[seqYFields.length - 1] ?? "";
    patchSpacing({
      vertical: [...seqYFields, last].join(","),
      unequal: true,
    });
  };
  const removeSeqX = () => {
    if (seqXFields.length <= 1) return;
    patchSpacing({
      horizontal: seqXFields.slice(0, -1).join(","),
      unequal: true,
    });
  };
  const removeSeqY = () => {
    if (seqYFields.length <= 1) return;
    patchSpacing({
      vertical: seqYFields.slice(0, -1).join(","),
      unequal: true,
    });
  };

  const setUnequal = (next: boolean) => {
    if (next) {
      patchSpacing({ unequal: true });
      return;
    }
    const ok = window.confirm(
      "不等間隔をオフにすると、追加した間隔の入力は先頭の1件だけ残して削除されます。よろしいですか？"
    );
    if (!ok) return;
    patchSpacing({
      unequal: false,
      horizontal: seqXFields[0] ?? "",
      vertical: seqYFields[0] ?? "",
    });
  };

  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
      Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 180;

  return (
    <div className="p-0 w-full min-w-0 pt-8">
      <div className="flex items-center justify-between">
        <SectionTitle title="離着陸エリア" />
        <ButtonRed
          type="button"
          onClick={() => setShowMultiBlockModal(true)}
        >
          配置の詳細設定
        </ButtonRed>
      </div>

      <div className="my-4 flex flex-col gap-4 w-full min-w-0">
        {/* 配置図：左カラム幅に収め、中身で親を広げない */}
        <div className="w-full min-w-0 overflow-hidden [contain:inline-size]">
          <div className="h-120 w-full min-w-0 relative border border-slate-600 overflow-hidden">
            <span className="absolute top-2 left-3 z-10 text-white text-base font-bold tracking-wide">
              配置図
            </span>
            <div
              className="box-border w-full h-full min-w-0 overflow-hidden px-8 py-6 pt-10 [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>
        </div>

        {/* 機体数 + 間隔図。実幅は spacingBoxRef で計測し、定幅超過時だけ行を広げる */}
        <div className="w-full min-w-0">
          <div
            data-export-orientation-figure
            className="w-full min-w-0 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start justify-items-start gap-x-8 border border-slate-600 py-4 px-8 overflow-visible"
          >
            <div className="relative min-w-0 w-full pt-8">
              <span className="absolute top-0 left-0 text-white text-base font-bold tracking-wide">
                機体数
              </span>
              <DroneCountSection
                edit={edit}
                area={area}
                onPatchArea={onPatchArea}
                embedded
              />
            </div>

            <div className="relative min-w-0 w-full pt-8 pb-2">
              <span className="absolute top-0 left-0 text-white text-base font-bold tracking-wide">
                間隔
              </span>
              <div
                ref={spacingBoxRef}
                className="w-max flex flex-col items-start gap-3"
              >
              <label
                className={`flex items-center gap-2 text-sm text-slate-200 select-none self-start ${
                  edit ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!edit}
                  checked={unequal}
                  onChange={(e) => setUnequal(e.target.checked)}
                  className="accent-red-600 h-4 w-4 shrink-0 disabled:opacity-50"
                />
                不等間隔
              </label>

              <div className="flex items-start">
                <div className="relative shrink-0 mr-4">
                  <div
                    className={`absolute top-0 z-10 flex items-center gap-1 ${
                      unequal && edit ? "" : "invisible"
                    }`}
                    style={{ left: -5 }}
                  >
                    <button
                      type="button"
                      onClick={addSeqY}
                      disabled={!unequal || !edit || seqYFields.length >= MAX_SPACING_GAPS}
                      className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                      title="上に間隔を追加"
                      aria-label="上に間隔を追加"
                    >
                      ＋
                    </button>
                    <button
                      type="button"
                      onClick={removeSeqY}
                      disabled={!unequal || !edit || seqYFields.length <= 1}
                      className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                      title="上の間隔を削除"
                      aria-label="上の間隔を削除"
                    >
                      －
                    </button>
                  </div>
                  <div
                    className="flex flex-col"
                    style={{ paddingTop: DRONE_SPACING_ICON_PX }}
                  >
                    {[...seqYFields].reverse().map((val, visualI) => {
                      const actualI = seqYFields.length - 1 - visualI;
                      const isLast = visualI === seqYFields.length - 1;
                      return (
                        <div
                          key={`y-${actualI}`}
                          className="relative flex items-center justify-center"
                          style={{
                            height: DRONE_SPACING_GAP_PX,
                            marginBottom: isLast ? 0 : DRONE_SPACING_ICON_PX,
                            width: SPACING_INPUT_W_PX,
                          }}
                        >
                          <DisplayOrInput
                            edit={edit}
                            value={val}
                            onChange={(e) => setSeqYAt(actualI, e.target.value)}
                            className="w-[52px]! text-center"
                          />
                          <span className="absolute left-full ml-1 text-slate-100 text-sm">
                            m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative">
                  <Drone2Icon
                    className="drone2-img"
                    rotationDeg={rotation}
                    cols={cols}
                    rows={rows}
                  />
                  <div
                    className="flex"
                    style={{
                      paddingLeft: DRONE_SPACING_ICON_PX,
                      paddingTop: 10,
                    }}
                  >
                    {seqXFields.map((val, i) => {
                      const isLast = i === seqXFields.length - 1;
                      return (
                        <div
                          key={`x-${i}`}
                          className="relative flex items-center justify-center"
                          style={{
                            width: DRONE_SPACING_GAP_PX,
                            height: DRONE_SPACING_GAP_PX,
                            marginRight: isLast ? 0 : DRONE_SPACING_ICON_PX,
                          }}
                        >
                          <DisplayOrInput
                            edit={edit}
                            value={val}
                            onChange={(e) => setSeqXAt(i, e.target.value)}
                            className="w-[52px]! text-center"
                          />
                          <span className="absolute left-full ml-1 text-slate-100 text-sm">
                            m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className={`absolute flex items-center gap-1 ${
                      unequal && edit ? "" : "invisible"
                    }`}
                    style={{ left: "100%", bottom: 12, marginLeft: 12 }}
                  >
                    <button
                      type="button"
                      onClick={addSeqX}
                      disabled={!unequal || !edit || seqXFields.length >= MAX_SPACING_GAPS}
                      className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                      title="右に間隔を追加"
                      aria-label="右に間隔を追加"
                    >
                      ＋
                    </button>
                    <button
                      type="button"
                      onClick={removeSeqX}
                      disabled={!unequal || !edit || seqXFields.length <= 1}
                      className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                      title="右の間隔を削除"
                      aria-label="右の間隔を削除"
                    >
                      －
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MultiBlockEditModal
        show={showMultiBlockModal}
        onClose={() => setShowMultiBlockModal(false)}
        onDecide={(nextArea) => {
          const merged = {
            ...(area ?? {}),
            ...nextArea,
          };
          onPatchArea(merged);
          setShowMultiBlockModal(false);
        }}
        area={area}
        edit={edit}
      />
    </div>
  );
}
