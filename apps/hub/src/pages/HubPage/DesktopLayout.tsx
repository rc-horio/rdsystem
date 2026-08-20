// src/pages/HubPage/DesktopLayout.tsx
import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "./parts/Sidebar";
import ResourceTab from "@/features/hub/tabs/Resource";
import OperationTab from "@/features/hub/tabs/Operation";
import AreaInfoTab from "@/features/hub/tabs/AreaInfo";
import SitePhotosTab from "@/features/hub/tabs/SitePhotos";

const SIDEBAR_W = "22.5rem";

export default function DesktopLayout(props: any) {
  const {
    id,
    YEAR,
    activeTab,
    setActiveTab,
    edit,
    setEdit,
    projectData,
    setProjectData,
    schedules,
    sortedSchedules,
    setSchedules,
    updateSchedule,
    selectedId,
    setSelectedId,
    currentSchedule,
    isSaving,
    handleSave,
    requestDeleteCurrent,
    openAddScheduleModal,
    removeAt,
  } = props;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Operation の更新を反映する
  const patchOperation = (patch: any) => {
    if (!currentSchedule) return;
    const prev = currentSchedule.operation ?? {};
    updateSchedule(currentSchedule.id, {
      operation: { ...prev, ...patch },
    });
  };

  // Area の更新を反映する
  const patchArea = (nextArea: any) => {
    if (!currentSchedule) return;
    updateSchedule(currentSchedule.id, { area: nextArea });
  };

  return (
    <div className="md:flex">
      {/* サイドバー＋トグルを同じ transform でスライドさせる */}
      <div
        className={clsx(
          "hidden md:block fixed top-0 left-0 z-30 h-screen",
          "transition-transform duration-300 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: SIDEBAR_W }}
      >
        <aside
          id="hub-sidebar"
          className="h-full w-full bg-black overflow-y-auto"
          aria-hidden={!sidebarOpen}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            edit={edit}
            setEdit={setEdit}
            projectData={projectData}
            setProjectData={setProjectData}
            schedules={sortedSchedules}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setSchedules={setSchedules}
            onDeleteCurrent={requestDeleteCurrent}
            openAddScheduleModal={openAddScheduleModal}
            isSaving={isSaving}
          />
        </aside>

        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-controls="hub-sidebar"
          aria-label={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          className={clsx(
            "absolute left-full items-center justify-center flex w-7 h-14 rounded-r-md",
            "border border-l-0 border-red-600 bg-[#000A1B] text-white text-lg font-semibold leading-none",
            "shadow-[0_0_10px_rgba(220,38,38,0.35)]",
            "hover:bg-red-900/30 hover:border-red-500"
          )}
          style={{ top: "calc(var(--safe-top) + 5.5rem)" }}
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
      </div>

      <main
        className={clsx(
          "min-w-0 overflow-x-auto transition-[margin,width] duration-300 ease-out",
          sidebarOpen
            ? "md:ml-[calc(22.5rem+2rem)] md:w-[calc(100%-22.5rem-2rem)]"
            : "md:ml-8 md:w-[calc(100%-2rem)]"
        )}
      >
        <div className="p-6 w-full min-w-0">
          <section hidden={activeTab !== "リソース"}>
            {projectData && (
              <ResourceTab
                edit={edit}
                setEdit={setEdit}
                projectId={(id ?? "") as string}
                projectData={projectData}
                schedules={schedules}
                setSchedules={setSchedules}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                currentSchedule={currentSchedule}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}
          </section>

          <section hidden={activeTab !== "エリア"}>
            <AreaInfoTab
              edit={edit}
              setEdit={setEdit}
              area={currentSchedule?.area ?? null}
              onPatchArea={patchArea}
              projectName={
                typeof projectData?.project?.name === "string"
                  ? projectData.project.name
                  : (typeof projectData?.event?.name === "object"
                      ? JSON.stringify(projectData?.event?.name)
                      : projectData?.event?.name) ?? ""
              }
              scheduleLabel={currentSchedule?.label ?? ""}
              projectUuid={id ?? null}
              scheduleUuid={currentSchedule?.id ?? null}
            />
          </section>

          <section hidden={activeTab !== "オペレーション"}>
            <OperationTab
              edit={edit}
              setEdit={setEdit}
              area={currentSchedule?.area ?? null}
              operation={currentSchedule?.operation ?? null}
              onPatchOperation={patchOperation}
            />
          </section>

          <section hidden={activeTab !== "現場記録"}>
            <SitePhotosTab
              edit={edit}
              setEdit={setEdit}
              currentSchedule={currentSchedule}
              selectedId={selectedId}
              setSchedules={setSchedules}
              projectId={id}
              year={YEAR}
              removeAt={removeAt}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
