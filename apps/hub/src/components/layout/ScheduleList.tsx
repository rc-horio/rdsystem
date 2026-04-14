// src/components/layout/ScheduleList.tsx
import clsx from "clsx";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import {
  DisplayOrInput,
  DetailIconButton,
  formatAsYmdInput,
} from "@/components";

type Props = {
  schedules: ScheduleDetail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  edit: boolean;
  onUpdateSchedules: (schedules: ScheduleDetail[]) => void;
};

export function ScheduleList({
  schedules,
  selectedId,
  onSelect,
  className = "",
  edit,
  onUpdateSchedules,
}: Props) {
  return (
    <div className={clsx("space-y-2", className)}>
      {schedules.map((sch) => {
        const active = sch.id === selectedId;
        const patchSch = (patch: {
          cancelled?: boolean;
          cancelledReason?: string;
        }) => {
          onUpdateSchedules(
            schedules.map((s) => (s.id === sch.id ? { ...s, ...patch } : s))
          );
        };
        return (
          <div
            key={sch.id}
            className={clsx(
              "w-full rounded-lg py-1 space-y-1",
              active ? "opacity-100" : "hover:opacity-90"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* 日付フィールド */}
                <DisplayOrInput
                  edit={edit}
                  value={sch.date ?? ""}
                  onChange={(e) => {
                    const nextDate = formatAsYmdInput(e.target.value);
                    const newSchedules = schedules.map((s) =>
                      s.id === sch.id ? { ...s, date: nextDate } : s
                    );
                    onUpdateSchedules(newSchedules);
                  }}
                  className={clsx(
                    "flex-2 text-xs text-center min-w-0",
                    !edit && "cursor-default caret-transparent"
                  )}
                  placeholder="2000-01-01"
                />
                {/* タイトルフィールド */}
                <DisplayOrInput
                  edit={edit}
                  value={sch.label ?? ""}
                  onChange={(e) => {
                    const newSchedules = schedules.map((s) =>
                      s.id === sch.id ? { ...s, label: e.target.value } : s
                    );
                    onUpdateSchedules(newSchedules);
                  }}
                  className={clsx(
                    "flex-3 w-1 text-xs text-center min-w-0",
                    !edit && "cursor-default caret-transparent"
                  )}
                  placeholder="タイトル"
                />
              </div>
              {/* 詳細ボタンのハイライト */}
              <DetailIconButton
                onClick={() => onSelect(sch.id)}
                className={clsx(active ? "bg-slate-700" : "hover:bg-slate-700")}
              />
            </div>
            {active ? (
              <div className="flex items-center justify-end gap-2 pl-0.5">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={!edit}
                    checked={sch.cancelled ?? false}
                    onChange={(e) =>
                      patchSch({
                        cancelled: e.target.checked,
                        cancelledReason: e.target.checked
                          ? sch.cancelledReason ?? ""
                          : "",
                      })
                    }
                    className="accent-red-600 h-3.5 w-3.5 shrink-0 disabled:opacity-50"
                  />
                  中止
                </label>
                {sch.cancelled ? (
                  <DisplayOrInput
                    edit={edit}
                    value={sch.cancelledReason ?? ""}
                    onChange={(e) =>
                      patchSch({ cancelledReason: e.target.value })
                    }
                    placeholder="中止理由"
                    className="w-[180px] h-7 text-[11px]"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
