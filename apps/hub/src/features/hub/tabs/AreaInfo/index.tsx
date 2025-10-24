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
};

export default function AreaInfoTab({
  edit,
  setEdit,
  area,
  onPatchArea,
  projectName = "案件名",
  scheduleLabel = "",
}: Props) {
  // PDF 出力ボタン用のコールバックをここに集約
  const onExportPdf = () =>
    exportDanceSpecPdfFromHtml({
      projectName,
      scheduleLabel,
      gradPx: 3,
      area,
    });

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
        />
      </div>
    </div>
  );
}
