// src/pages/HubPage/HubPage.tsx
import { useHubPageState } from "./useHubPageState";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import { TopBar } from "./parts/TopBar";
import { FormModal, ButtonRed, useBreakpointMd } from "@/components";
import { useLocation } from "react-router-dom";

export default function HubPage() {
  const state = useHubPageState();
  const isMobile = useBreakpointMd();

  const { search } = useLocation();
  const qName = new URLSearchParams(search).get("name") || "";

  const projectName =
    typeof state.projectData?.project?.name === "string"
      ? state.projectData.project.name
      : (typeof state.projectData?.event?.name === "object"
          ? JSON.stringify(state.projectData?.event?.name)
          : state.projectData?.event?.name) ?? "";

  const titleFallback = projectName || qName || "案件名";
  const headerTitleForView = isMobile
    ? titleFallback
    : state.headerTitle || titleFallback;

  return (
    <div
      className="min-h-screen bg-[#000A1B] text-white overflow-x-hidden"
      data-edit={state.edit ? "true" : "false"}
    >
      <TopBar
        title={headerTitleForView}
        isPC={!isMobile}
        updatedAt={state.updatedAt}
        updatedBy={state.updatedBy}
        edit={state.edit}
        setEdit={state.setEdit}
        isSaving={state.isSaving}
        onSave={state.handleSave}
      />

      {/* TopBarの高さ 56px + セーフエリア分だけ本文を押し下げ（mdは従来の14保持） */}
      <div
        className="md:pt-14"
        style={{ paddingTop: "calc(56px + var(--safe-top))" }}
      >
        {isMobile ? <MobileLayout {...state} /> : <DesktopLayout {...state} />}
      </div>

      {/* スケジュール追加モーダル */}
      {state.showAddScheduleModal && (
        <FormModal
          show
          onClose={state.closeAddScheduleModal}
          title=""
          footer={
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="w-56  rounded-lg p-3 space-y-2">
                <ButtonRed
                  type="button"
                  onClick={state.confirmAddSchedule}
                  disabled={!state.edit}
                  className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  新規追加
                </ButtonRed>
              </div>

              <div className="w-56  rounded-lg p-3 space-y-3">
                <h4 className="text-[11px] text-slate-400">
                  既存スケジュールを複製
                </h4>
                <div className="w-full">
                  <select
                    className="
                      block w-full h-10
                      rounded-lg border border-slate-700 bg-slate-800
                      text-slate-200 text-sm
                      px-3
                      appearance-none
                      focus:outline-none focus:ring-2 focus:ring-red-700/60 focus:border-red-700
                      shadow-inner
                    "
                    aria-label="複製元スケジュールを選択"
                    value={state.copySourceId}
                    onChange={(e) => state.setCopySourceId(e.target.value)}
                    disabled={!state.edit || state.schedules.length === 0}
                  >
                    <option value="" disabled>
                      複製元を選択
                    </option>
                    {state.schedules.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.label?.trim() ? sch.label : "（無題）"}
                      </option>
                    ))}
                  </select>
                </div>
                <ButtonRed
                  type="button"
                  onClick={() => state.duplicateSchedule(state.copySourceId)}
                  disabled={!state.edit || !state.copySourceId}
                  className="w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  複製
                </ButtonRed>
              </div>
            </div>
          }
        >
          <></>
        </FormModal>
      )}
    </div>
  );
}
