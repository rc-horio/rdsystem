// features/hub/tabs/AreaInfo/sections/DroneCountSection.tsx
import { useEffect, useState } from "react";
import { DisplayOrInput, DisplayOrSelect, SectionTitle, type SelectOption } from "@/components";
import { getEffectiveBlocks, hasBlocks } from "@/features/hub/utils/areaBlocks";

const DRONE_MODEL_OPTIONS: SelectOption[] = [
  { value: "EMO", label: "EMO" },
  { value: "RiFF", label: "RiFF" },
  { value: "FYLO", label: "FYLO" },
  { value: "Hula", label: "Hula" },
  { value: "TAKE", label: "TAKE" },
];
const MODEL_LABEL_W = "w-[4.75rem] shrink-0";
const MODEL_SELECT_W = "!w-[140px] w-[140px] shrink-0";
const COLON_CLS = "w-3 shrink-0 text-center text-slate-200";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
  /** 向き図の左枠に置くとき、外側の余白を抑える */
  embedded?: boolean;
};

export function DroneCountSection({
  edit,
  area,
  onPatchArea,
  embedded = false,
}: Props) {
  const A = area ?? {};
  const droneCnt = A.drone_count ?? {};
  const rowCls = embedded
    ? "mt-2 flex items-center gap-2"
    : "mt-2 pl-4 md:pl-6 flex items-center gap-2";
  const inputW = "!w-[55px]";
  const numericInputW = `${inputW} text-center`;
  const blockListCls = embedded
    ? "mt-3 space-y-2"
    : "mt-3 pl-4 md:pl-6 space-y-2";
  const actionRowCls = embedded
    ? "mt-3"
    : "mt-3 pl-4 md:pl-6";

  const [localCount, setLocalCount] = useState("");
  const [localXCount, setLocalXCount] = useState("");
  const [localYCount, setLocalYCount] = useState("");

  useEffect(() => {
    const dc = area?.drone_count ?? {};
    setLocalCount((dc.count ?? "").toString());
    setLocalXCount((dc.x_count ?? "").toString());
    setLocalYCount((dc.y_count ?? "").toString());
  }, [area?.drone_count?.count, area?.drone_count?.x_count, area?.drone_count?.y_count]);

  const patch = (path: string[], value: any) => {
    const next = { ...(A ?? {}) };
    let cur: any = next;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      cur[k] = { ...(cur[k] ?? {}) };
      cur = cur[k];
    }
    cur[path[path.length - 1]] = value;
    onPatchArea(next);
  };

  const num = (s: string) => {
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  };

  const applyDroneCount = () => {
    const next = {
      ...(area ?? {}),
      drone_count: {
        ...(area?.drone_count ?? {}),
        count: num(localCount),
        x_count: num(localXCount),
        y_count: num(localYCount),
      },
    };
    onPatchArea(next);
  };

  const hasDroneCountChange =
    (droneCnt.count ?? "").toString() !== localCount ||
    (droneCnt.x_count ?? "").toString() !== localXCount ||
    (droneCnt.y_count ?? "").toString() !== localYCount;

  const isEmoModel = droneCnt.model === "EMO";

  const setModel = (model: string) => {
    const next = {
      ...(A ?? {}),
      drone_count: {
        ...(droneCnt ?? {}),
        model,
      },
    };
    if (model !== "EMO") {
      next.use_takeoff_landing_box = false;
    }
    onPatchArea(next);
  };

  return (
    <div className={embedded ? "w-fit shrink-0" : "mt-5 w-fit"}>
        {!embedded && <SectionTitle title="機体数" />}

        <div className={rowCls}>
          <span className={`${MODEL_LABEL_W} text-sm`}>機種</span>
          <span className={COLON_CLS}>:</span>
          <DisplayOrSelect
            edit={edit}
            value={droneCnt.model ?? ""}
            onChange={(e) => setModel(e.target.value)}
            options={DRONE_MODEL_OPTIONS}
            creatable
            placeholder="未設定"
            className={MODEL_SELECT_W}
            menuMaxHeight={240}
          />
        </div>

        {isEmoModel && (
          <div className={`${rowCls} w-full justify-end`}>
            <label
              className={`flex items-center gap-2 text-sm text-slate-200 select-none ${
                edit ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <input
                type="checkbox"
                disabled={!edit}
                checked={Boolean(A.use_takeoff_landing_box)}
                onChange={(e) => {
                  const next = {
                    ...(A ?? {}),
                    use_takeoff_landing_box: e.target.checked,
                  };
                  if (
                    e.target.checked &&
                    next.takeoff_landing_box_yx !== "4x2" &&
                    next.takeoff_landing_box_yx !== "2x4"
                  ) {
                    next.takeoff_landing_box_yx = "4x2";
                  }
                  onPatchArea(next);
                }}
                className="accent-red-600 h-4 w-4 shrink-0 disabled:opacity-50"
              />
              離発着ボックス
            </label>
          </div>
        )}

        {isEmoModel && Boolean(A.use_takeoff_landing_box) && (
          <div
            className={`${
              embedded ? "mt-2" : "mt-2 pl-4 md:pl-6"
            } flex w-full flex-col items-end gap-1`}
          >
            <label
              className={`flex items-center gap-2 text-sm text-slate-200 select-none ${
                edit ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <input
                type="radio"
                name="takeoff-landing-box-yx"
                disabled={!edit}
                checked={
                  (A.takeoff_landing_box_yx ?? "4x2") === "4x2"
                }
                onChange={() => patch(["takeoff_landing_box_yx"], "4x2")}
                className="accent-red-600 h-4 w-4 shrink-0 disabled:opacity-50"
              />
              Y４機×X２機
            </label>
            <label
              className={`flex items-center gap-2 text-sm text-slate-200 select-none ${
                edit ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <input
                type="radio"
                name="takeoff-landing-box-yx"
                disabled={!edit}
                checked={A.takeoff_landing_box_yx === "2x4"}
                onChange={() => patch(["takeoff_landing_box_yx"], "2x4")}
                className="accent-red-600 h-4 w-4 shrink-0 disabled:opacity-50"
              />
              Y２機×X４機
            </label>
          </div>
        )}

        {hasBlocks(area) ? (
          <>
            <div className={rowCls}>
              <span className={`${MODEL_LABEL_W} text-sm font-medium`}>総機体数</span>
              <span className={COLON_CLS}>:</span>
              <span className="w-[4.75rem] text-right text-sm font-medium tabular-nums text-slate-100">
                {getEffectiveBlocks(area).reduce((s, b) => s + b.count, 0)}機
              </span>
            </div>

            <div className={`${blockListCls} space-y-0.5`}>
              {getEffectiveBlocks(area).map((block, i) => (
                <div key={block.id} className="flex items-center gap-2">
                  <span
                    className={`${MODEL_LABEL_W} text-right text-sm font-semibold text-slate-100`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={COLON_CLS}>:</span>
                  <span className="w-[4.75rem] text-right text-sm tabular-nums text-slate-400">
                    {block.count}機
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={rowCls}>
              <span className={`${MODEL_LABEL_W} text-sm`}>総機体数</span>
              <span className={COLON_CLS}>:</span>
              <DisplayOrInput
                edit={edit}
                value={edit ? localCount : (droneCnt.count ?? "").toString()}
                onChange={(e) => setLocalCount(e.target.value)}
                inputMode="numeric"
                type="number"
                className={numericInputW}
              />
              <span className="w-6 ml-1">機</span>
            </div>

            <div className={rowCls}>
              <span className={`${MODEL_LABEL_W} text-sm`}>X方向</span>
              <span className={COLON_CLS}>:</span>
              <DisplayOrInput
                edit={edit}
                value={edit ? localXCount : (droneCnt.x_count ?? "").toString()}
                onChange={(e) => setLocalXCount(e.target.value)}
                inputMode="numeric"
                type="number"
                className={numericInputW}
              />
              <span className="w-6 ml-1">機</span>
            </div>

            <div className={rowCls}>
              <span className={`${MODEL_LABEL_W} text-sm`}>Y方向</span>
              <span className={COLON_CLS}>:</span>
              <DisplayOrInput
                edit={edit}
                value={edit ? localYCount : (droneCnt.y_count ?? "").toString()}
                onChange={(e) => setLocalYCount(e.target.value)}
                inputMode="numeric"
                type="number"
                className={numericInputW}
              />
              <span className="w-6 ml-1">機</span>
            </div>

            {edit && (
              <div className={`${actionRowCls} flex justify-end`}>
                <button
                  type="button"
                  onClick={applyDroneCount}
                  disabled={!hasDroneCountChange}
                  className="px-3 py-1.5 rounded-md border border-slate-600 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  図を更新
                </button>
              </div>
            )}
          </>
        )}
      </div>
  );
}
