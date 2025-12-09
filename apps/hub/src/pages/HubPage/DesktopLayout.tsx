// src/pages/HubPage/DesktopLayout.tsx
import { Sidebar } from "./parts/Sidebar";
import ResourceTab from "@/features/hub/tabs/Resource";
import OperationTab from "@/features/hub/tabs/Operation";
import AreaInfoTab from "@/features/hub/tabs/AreaInfo";
import SitePhotosTab from "@/features/hub/tabs/SitePhotos";

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
      {/* サイドバー：画面左に完全固定、内部のみ必要時スクロール */}
      <aside className="hidden md:block fixed top-0 left-0 h-screen shrink-0 bg-black overflow-y-auto w-80 md:w-90 z-20">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          edit={edit}
          setEdit={setEdit}
          projectData={projectData}
          setProjectData={setProjectData}
          schedules={schedules}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setSchedules={setSchedules}
          onDeleteCurrent={requestDeleteCurrent}
          openAddScheduleModal={openAddScheduleModal}
        />
      </aside>

      <main className="flex-1 p-0 overflow-x-hidden md:ml-88">
        {" "}
        <div className="p-6">
          <section hidden={activeTab !== "リソース管理"}>
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

          <section hidden={activeTab !== "オペレーション"}>
            <OperationTab
              edit={edit}
              setEdit={setEdit}
              area={currentSchedule?.area ?? null}
              operation={currentSchedule?.operation ?? null}
              onPatchOperation={patchOperation}
            />
          </section>

          <section hidden={activeTab !== "エリア情報"}>
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

          <section hidden={activeTab !== "現場写真"}>
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
