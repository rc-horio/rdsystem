// src/pages/HubPage/MobileLayout.tsx
import { ContentHeader } from "./parts/ContentHeader";
import ResourceTab from "@/features/hub/tabs/Resource";
import OperationTab from "@/features/hub/tabs/Operation";
import AreaInfoTab from "@/features/hub/tabs/AreaInfo";
import SitePhotosTab from "@/features/hub/tabs/SitePhotos";

export default function MobileLayout(props: any) {
  const {
    id,
    YEAR,
    updatedAt,
    updatedBy,
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
    <div className="min-h-screen bg-[#000A1B] text-white">
      <ContentHeader
        setProjectData={setProjectData}
        eventDisplay={
          typeof projectData?.project?.name === "string"
            ? projectData.project.name
            : (typeof projectData?.event?.name === "object"
                ? JSON.stringify(projectData?.event?.name)
                : projectData?.event?.name) ?? ""
        }
        eventId={
          typeof projectData?.project?.id === "string"
            ? projectData.project.id
            : (typeof projectData?.event?.id === "object"
                ? JSON.stringify(projectData?.event?.id)
                : projectData?.event?.id) ?? ""
        }
        isMobile
        showMetaInContent
        updatedAt={updatedAt}
        updatedBy={updatedBy}
        onAddSchedule={() => openAddScheduleModal()}
        onDeleteSchedule={requestDeleteCurrent}
        edit={edit}
        schedules={schedules}
        selectedId={selectedId}
        onSelectSchedule={setSelectedId}
        onUpdateSchedules={setSchedules}
      />
      {/* タブバー（SP・横スクロール） */}
      <nav className="md:hidden mt-2 mb-2" role="tablist" aria-label="機能タブ">
        <div className="w-full border-y border-[#ED1B24]">
          <div
            className={[
              "flex items-stretch px-4",
              // 横スクロール
              "overflow-x-auto whitespace-nowrap",
              // スクロールスナップ（任意）
              "snap-x snap-mandatory scroll-px-4",
              // スクロールバー非表示（各ブラウザ対応）
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ].join(" ")}
          >
            {" "}
            {(
              [
                "リソース",
                "エリア",
                "オペレーション",
                "現場写真",
              ] as const
            ).map((t) => {
              const active = activeTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  aria-current={active ? "page" : undefined}
                  role="tab"
                  aria-selected={active}
                  className={[
                    // 可変幅・折り返し禁止・収まらないときはスクロール
                    "inline-flex items-center justify-center",
                    "h-12 px-4 mr-2 last:mr-0",
                    "text-sm",
                    "shrink-0 snap-start",
                    "transition-colors",
                    active
                      ? "bg-[#ED1B24] text-white"
                      : "text-slate-300/70 hover:text-white",
                  ].join(" ")}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* タブ内容 */}
      <div className="p-4 md:p-6 lg:p-8">
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
    </div>
  );
}
