// features/hub/tabs/AreaInfo/index.tsx
import DesktopPanel from "./sections/layout/DesktopPanel";
import MobilePanel from "./sections/layout/MobilePanel";
import { exportDanceSpecPdfFromHtml } from "./pdf/exportLandscape";

export type AreaInfo = any;

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  projectName?: string; // 案件名（任意）
  scheduleLabel?: string; // スケジュール名（任意）
  projectUuid?: string | null;
  scheduleUuid?: string | null;
};

export default function AreaInfoTab({
  edit,
  setEdit,
  area,
  onPatchArea,
  projectName = "案件名",
  scheduleLabel = "",
  projectUuid,
  scheduleUuid,
}: Props) {
  const onExportPdf = () =>
    exportDanceSpecPdfFromHtml({
      projectName,
      scheduleLabel,
      gradPx: 3,
      area,
    });

  // いったん state で selectedAreaName は持たず、area だけを見る
  const areaName = area?.area_name ?? null;

  return (
    <div className="space-y-8 pb-24 relative">
      {/* SP */}
      <div className="md:hidden">
        <MobilePanel
          edit={edit}
          setEdit={setEdit}
          area={area}
          onPatchArea={onPatchArea}
          onExportPdf={onExportPdf}
          areaName={areaName}
          projectUuid={projectUuid}
          scheduleUuid={scheduleUuid}
        />
      </div>
      {/* PC */}
      <div className="hidden md:block">
        <DesktopPanel
          edit={edit}
          setEdit={setEdit}
          area={area}
          onPatchArea={onPatchArea}
          onExportPdf={onExportPdf}
          areaName={areaName}
          projectUuid={projectUuid}
          scheduleUuid={scheduleUuid}
        />
      </div>
    </div>
  );
}
