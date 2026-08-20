// src/features/hub/tabs/AreaInfo/sections/LandingAreaFigure.tsx

import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { buildMultiBlockLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLandingFigureSvg";
import { hasBlocks, getEffectiveBlocks } from "@/features/hub/utils/areaBlocks";
import {
  SectionTitle,
  Drone1Icon,
  Drone2Icon,
  DisplayOrInput,
  DRONE_SPACING_ICON_PX,
  DRONE_SPACING_GAP_PX,
} from "@/components";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
};

const MAX_SPACING_GAPS = 8;
const SPACING_INPUT_W_PX = 52;

function splitSpacingFields(v: string): string[] {
  if (typeof v !== "string" || v.trim() === "") return [""];
  const parts = v.split(",").map((s) => s.trim());
  while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
  return parts.length > 0 ? parts : [""];
}

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

  // 機体向きUI
  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
      Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 180;

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
    <div className="p-0 min-w-0">
      <SectionTitle title="離着陸エリア" />

      <div className="my-4 flex flex-col gap-4">
        {/* 配置図 */}
        <div className="w-full">
          <div className="h-120 w-full relative border border-slate-600">
            <span className="absolute top-2 left-3 z-10 text-white text-sm font-semibold">
              配置図
            </span>
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>
        </div>

        {/* 機体の向き図：カラム幅に合わせ、はみ出しは横スクロール */}
        <div className="w-full min-w-0 overflow-x-auto">
          <div
            data-export-orientation-figure
            className="min-h-80 min-w-full w-max relative flex flex-row items-center justify-evenly gap-32 border border-slate-600 py-10 pl-8 pr-20 overflow-visible"
          >
            <span className="absolute top-2 left-3 text-white text-sm font-semibold">
              機体の向き
            </span>

            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Drone1Icon
                  className="w-20 h-20 drone1-img"
                  rotationDeg={rotation}
                />

                {/* 回転操作は一旦非表示。必要になったら復帰する
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
                */}

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

            <div className="relative flex flex-col items-center gap-3 pb-2">
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
  );
}
