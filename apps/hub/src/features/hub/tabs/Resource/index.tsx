// src/features/hub/tabs/Resource/index.tsx
import type { ScheduleDetail } from "@/features/hub/types/resource";
import { MobileAccordion } from "./sections/Layout/MobilePanel";
import { DesktopThreePane } from "./sections/Layout/DesktopPanel";

const emptyResource = {
  place: "",
  drones: [{ model: "", color: "", count: 0 }],
  batteries: [{ model: "", count: 0 }],
  modules: [{ type: "", count: 0 }],
  vehicles: { rows: [{ type: "", driver: "" }], memo: "" },
  items: [],
  hotels: [],
  people: { groups: [], memo: "" },
} as const;

export default function ResourceTab({
  edit,
  setEdit,
  schedules,
  setSchedules,
  selectedId,
  setSelectedId,
  currentSchedule,
  onSave,
  isSaving,
}: {
  edit: boolean;
  setEdit: (v: boolean) => void;
  projectId: string;
  projectData: any;
  schedules: ScheduleDetail[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleDetail[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  currentSchedule: ScheduleDetail | null;
  onSave: () => void;
  isSaving: boolean;
}) {
  // 深めマージで更新
  const updateSchedule = (id: string, updates: Partial<ScheduleDetail>) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const { resource: resPatch, ...rest } = updates;
        const next: ScheduleDetail = {
          ...s,
          ...(Object.keys(rest).length ? rest : {}),
          ...(resPatch
            ? {
                resource: {
                  ...(s.resource ?? (emptyResource as any)),
                  ...resPatch,
                },
              }
            : {}),
        } as ScheduleDetail;
        if (!next.resource) next.resource = { ...(emptyResource as any) };
        return next;
      })
    );
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 📱モバイル */}
      <MobileAccordion
        schedules={schedules}
        edit={edit}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        updateSchedule={updateSchedule}
        setSchedules={setSchedules}
      />
      {/* 🖥️デスクトップ */}
      <DesktopThreePane
        current={currentSchedule}
        edit={edit}
        setEdit={setEdit}
        updateSchedule={updateSchedule}
        onSave={onSave}
        isSaving={isSaving}
      />
    </div>
  );
}
