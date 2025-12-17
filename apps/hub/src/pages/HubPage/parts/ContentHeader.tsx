import { useState } from "react";
import { HeaderMeta } from "./TopBar";
import {
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  validateProjectId,
  formatAsYmdInput,
} from "@/components";
import type { ScheduleDetail } from "@/features/hub/types/resource";

export function ContentHeader({
  eventDisplay,
  eventId,
  isMobile,
  showMetaInContent,
  updatedAt,
  updatedBy,
  onAddSchedule,
  onDeleteSchedule,
  edit,
  schedules,
  selectedId,
  onSelectSchedule,
  setProjectData,
  onUpdateSchedules,
}: {
  eventDisplay: string;
  eventId: string;
  isMobile: boolean;
  showMetaInContent: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  onAddSchedule: () => void;
  onDeleteSchedule: () => void;
  edit: boolean;
  schedules: ScheduleDetail[];
  selectedId: string | null;
  onSelectSchedule: (id: string) => void;
  setProjectData: (data: any) => void;
  onUpdateSchedules: (schedules: ScheduleDetail[]) => void;
}) {
  if (!isMobile) return null;

  const [idError, setIdError] = useState("");

  const updateCurrent = (patch: Partial<ScheduleDetail>) => {
    if (!selectedId) return;
    const next = schedules.map((s) =>
      s.id === selectedId ? { ...s, ...patch } : s
    );
    onUpdateSchedules(next);
  };

  return (
    <div className="md:hidden px-4 py-3 md:py-4 space-y-3 border-b border-slate-800/60">
      {showMetaInContent ? (
        <div className="flex justify-end">
          <HeaderMeta
            updatedAt={updatedAt ?? null}
            updatedBy={updatedBy ?? null}
            className="text-xs md:text-sm text-slate-400"
          />
        </div>
      ) : null}

      {/* 案件名 */}
      <div className="flex items-center gap-2">
        <p className="text-slate-200 text-xs m-0 whitespace-nowrap">案件名</p>
        <DisplayOrInput
          edit={edit}
          value={eventDisplay}
          onChange={(e) =>
            setProjectData((prev: any) => ({
              ...prev,
              project: { ...prev?.project, name: e.target.value },
            }))
          }
          className="ml-auto w-[200px] md:w-[280px] text-lg md:text-xl leading-7 md:leading-8 truncate"
          placeholder="案件名を入力"
        />
      </div>

      {/* 案件ID */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="text-slate-200 text-xs m-0 whitespace-nowrap">案件ID</p>
          <DisplayOrInput
            edit={edit}
            value={eventId}
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              setIdError(validateProjectId(val));
              setProjectData((prev: any) => ({
                ...prev,
                project: { ...prev?.project, id: val },
              }));
            }}
            className={`ml-auto w-[200px] md:w-[280px] text-lg md:text-xl leading-7 md:leading-8 truncate ${
              idError ? "border border-red-500 rounded-md" : ""
            }`}
            placeholder="案件IDを入力"
          />
        </div>
        {idError && (
          <p className="text-[11px] text-red-400 text-right mt-0.5">
            {idError}
          </p>
        )}
      </div>

      {/* スケジュール */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-200 text-sm">スケジュール</p>
        {edit && (
          <div className="flex items-center gap-1">
            <DeleteItemButton
              title="スケジュール削除"
              onClick={onDeleteSchedule}
            />
            <AddItemButton
              onClick={onAddSchedule}
              className="shrink-0"
              aria-label="add schedule"
              title="追加"
            />
          </div>
        )}
      </div>

      {/* スケジュール選択 */}
      <div className="relative z-10">
        <select
          className="block w-full h-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm px-3 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-red-700/60 focus:border-red-700 shadow-inner"
          value={selectedId ?? ""}
          onChange={(e) => onSelectSchedule(e.target.value)}
        >
          <option value="" disabled>
            スケジュールを選択
          </option>
          {schedules.map((sch) => (
            <option key={sch.id} value={sch.id}>
              {(sch.date || "--/--") + "　" + (sch.label || "タイトル")}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z" />
        </svg>
      </div>

      {/* 選択中スケジュールの編集 */}
      {edit && selectedId
        ? (() => {
            const cur = schedules.find((s) => s.id === selectedId);
            if (!cur) return null;
            return (
              <div className="grid grid-cols-2 gap-2">
                <DisplayOrInput
                  edit
                  value={cur.date ?? ""}
                  placeholder="2000-01-01"
                  className="w-full"
                  onChange={(e) =>
                    updateCurrent({ date: formatAsYmdInput(e.target.value) })
                  }
                />
                <DisplayOrInput
                  edit
                  value={cur.label ?? ""}
                  placeholder="タイトル"
                  className="w-full"
                  onChange={(e) => updateCurrent({ label: e.target.value })}
                />
              </div>
            );
          })()
        : null}
    </div>
  );
}
