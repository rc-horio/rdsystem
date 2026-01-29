// features/hub/tabs/AreaInfo/index.tsx
import DesktopPanel from "./sections/layout/DesktopPanel";
import MobilePanel from "./sections/layout/MobilePanel";
import { exportDanceSpecPdfFromHtml, exportDanceSpecPptxFromHtml } from "./exports/danceSpec"; // 例：新しいindex.tsに寄せる

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

  // ダンスファイル指示書(PDF)を出力
  const onExportPdf = () =>
    exportDanceSpecPdfFromHtml({ projectName, scheduleLabel, gradPx: 3, area });

  // ダンスファイル指示書(PPTX)を出力
  const onExportPptx = () =>
    exportDanceSpecPptxFromHtml({ projectName, scheduleLabel, gradPx: 3, area });

  // いったん state で selectedAreaName は持たず、area だけを見る
  const areaName = area?.area_name ?? null;

  return (
    <div className="space-y-8 pb-24 relative">
      {/* SP */}
      <div className="md:hidden">
        <MobilePanel
          onExportPdf={onExportPdf}
          onExportPptx={onExportPptx}
          edit={edit}
          setEdit={setEdit}
          area={area}
          onPatchArea={onPatchArea}
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
          onExportPptx={onExportPptx}
          areaName={areaName}
          projectUuid={projectUuid}
          scheduleUuid={scheduleUuid}
        />
      </div>
    </div>
  );
}
