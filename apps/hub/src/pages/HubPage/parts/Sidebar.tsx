import clsx from "clsx";
import { useState } from "react";
import {
  DividerRed,
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  ScheduleList,
  validateProjectId,
} from "@/components";
import type { ScheduleDetail } from "@/features/hub/types/resource";

export function Sidebar({
  activeTab,
  setActiveTab,
  edit,
  projectData,
  setProjectData,
  schedules,
  selectedId,
  setSelectedId,
  setSchedules,
  onDeleteCurrent,
  openAddScheduleModal,
}: {
  activeTab: "リソース管理" | "オペレーション" | "エリア情報" | "現場写真";
  setActiveTab: (t: any) => void;
  edit: boolean;
  setEdit: (v: boolean) => void;
  projectData: any;
  setProjectData: (v: any) => void;
  schedules: ScheduleDetail[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setSchedules: (
    s: ScheduleDetail[] | ((p: ScheduleDetail[]) => ScheduleDetail[])
  ) => void;
  onDeleteCurrent: () => void;
  openAddScheduleModal: () => void;
  projectId?: string | null;
  year?: string | null;
}) {
  const tabs = [
    "リソース管理",
    "オペレーション",
    "エリア情報",
    "現場写真",
  ] as const;

  const projectName =
    typeof projectData?.project?.name === "string"
      ? projectData.project.name
      : (typeof projectData?.event?.name === "object"
          ? JSON.stringify(projectData?.event?.name)
          : projectData?.event?.name) ?? "";

  const projectId =
    typeof projectData?.project?.id === "string"
      ? projectData.project.id
      : (typeof projectData?.event?.id === "object"
          ? JSON.stringify(projectData?.event?.id)
          : projectData?.event?.id) ?? "";

  // バリデーション用state
  const [idError, setIdError] = useState("");

  return (
    <div className="hidden md:block h-screen w-full shrink-0 bg-black overflow-y-auto [scrollbar-gutter:stable]">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-lg md:text-xl font-semibold tracking-wide text-slate-200 cursor-default select-none">
          RD HUB
        </div>
      </div>

      {/* タブ */}
      <nav className="px-4 pt-10 pb-3 space-y-1.5">
        {tabs.map((t) => {
          const active = activeTab === t;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "w-full text-left rounded-xl px-5 py-3.5 text-[15px] transition cursor-pointer",
                active
                  ? "bg-slate-800/60 text-white shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              )}
            >
              <span className="cursor-default select-none">{t}</span>
            </button>
          );
        })}
      </nav>
      <DividerRed />

      {/* 案件名・ID入力 */}
      <div className="px-5 py-5 space-y-4">
        {/* 案件名 */}
        <div className="space-y-2">
          <p className="text-slate-200 cursor-default select-none">案件名</p>
          <DisplayOrInput
            edit={edit}
            value={projectName}
            onChange={(e) =>
              setProjectData((prev: any) => ({
                ...prev,
                project: { ...(prev?.project ?? {}), name: e.target.value },
              }))
            }
            className={clsx(
              "w-full text-base text-center py-2",
              !edit && "cursor-default caret-transparent select-none"
            )}
            placeholder="案件名を入力"
          />
        </div>

        {/* 案件ID */}
        <div className="space-y-2">
          <p className="text-slate-200 cursor-default select-none">案件ID</p>
          <DisplayOrInput
            edit={edit}
            value={projectId}
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              setIdError(validateProjectId(val));
              setProjectData((prev: any) => ({
                ...prev,
                project: { ...(prev?.project ?? {}), id: val },
              }));
            }}
            className={clsx(
              "w-full text-base text-center py-2",
              idError && "border border-red-500 rounded-md",
              !edit && "cursor-default caret-transparent select-none"
            )}
            placeholder="案件IDを入力"
          />
          {idError && (
            <p className="text-xs text-red-400 text-center mt-1">{idError}</p>
          )}
        </div>
      </div>

      {/* スケジュール */}
      <div className="px-5">
        <div className="flex items-center justify-between">
          <p className="flex-1 min-w-0 text-slate-200 cursor-default select-none">
            スケジュール
          </p>
          <div className="flex items-center gap-1.5 w-[78px] flex-none">
            <DeleteItemButton
              title="スケジュール削除"
              onClick={onDeleteCurrent}
              className={clsx(!edit && "invisible")}
              tabIndex={edit ? 0 : -1}
              aria-hidden={!edit}
            />
            <AddItemButton
              onClick={openAddScheduleModal}
              className={clsx("shrink-0", !edit && "invisible")}
              title="スケジュール追加"
              aria-hidden={!edit}
            />
          </div>
        </div>
        <ScheduleList
          schedules={schedules}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateSchedules={setSchedules as any}
          edit={edit}
        />
      </div>
    </div>
  );
}
