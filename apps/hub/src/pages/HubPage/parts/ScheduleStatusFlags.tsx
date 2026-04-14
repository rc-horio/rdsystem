import clsx from "clsx";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import { DisplayOrInput } from "@/components";

type Patch = { cancelled?: boolean; cancelledReason?: string };

/** 選択中スケジュールの中止（主に SP：ドロップダウン用の見出し付き） */
export function ScheduleStatusFlags({
  edit,
  selectedId,
  schedules,
  onPatch,
  className,
  withSelectionHeading = false,
}: {
  edit: boolean;
  selectedId: string | null;
  schedules: ScheduleDetail[];
  onPatch: (patch: Patch) => void;
  className?: string;
  /** When true, show selected schedule date and title above the checkbox */
  withSelectionHeading?: boolean;
}) {
  if (!selectedId) return null;
  const cur = schedules.find((s) => s.id === selectedId);
  if (!cur) return null;

  const cancelled = cur.cancelled ?? false;

  const row = (
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          disabled={!edit}
          checked={cancelled}
          onChange={(e) =>
            onPatch({
              cancelled: e.target.checked,
              cancelledReason: e.target.checked ? cur.cancelledReason ?? "" : "",
            })
          }
          className="accent-red-600 h-4 w-4 shrink-0 disabled:opacity-50"
        />
        中止
      </label>
      {cancelled ? (
        <DisplayOrInput
          edit={edit}
          value={cur.cancelledReason ?? ""}
          onChange={(e) => onPatch({ cancelledReason: e.target.value })}
          placeholder="中止理由"
          className="flex-1 min-w-0 h-8 text-xs"
        />
      ) : null}
    </div>
  );

  if (withSelectionHeading) {
    return <div className={clsx("flex justify-end", className)}>{row}</div>;
  }

  return <div className={className}>{row}</div>;
}
