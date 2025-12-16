// src/components/layout/ScheduleList.tsx
import clsx from "clsx";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import { DisplayOrInput, DetailIconButton } from "@/components";

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
        return (
          <div
            key={sch.id}
            className={clsx(
              "w-full flex items-center gap-2 rounded-lg py-1",
              active ? "opacity-100" : "hover:opacity-90"
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              {/* 日付フィールド */}
              <DisplayOrInput
                edit={edit}
                value={sch.date ?? ""}
                onChange={(e) => {
                  const newSchedules = schedules.map((s) =>
                    s.id === sch.id ? { ...s, date: e.target.value } : s
                  );
                  onUpdateSchedules(newSchedules);
                }}
                className={clsx(
                  "flex-2 text-xs text-center",
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
                  "flex-3 w-1 text-xs text-center",
                  !edit && "cursor-default caret-transparent"
                )}
                placeholder="タイトル"
              />
            </div>
            {/* 詳細ボタンのハイライト */}
            <DetailIconButton
              onClick={() => onSelect(sch.id)}
              className={clsx(
                active ? "bg-slate-700" : "hover:bg-slate-700"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
