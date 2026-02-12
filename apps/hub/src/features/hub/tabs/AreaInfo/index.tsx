// features/hub/tabs/AreaInfo/index.tsx
import { useRef, useState } from "react";
import { RdCompanyLogo } from "@/components";
import DesktopPanel from "./sections/layout/DesktopPanel";
import MobilePanel from "./sections/layout/MobilePanel";
import { exportDanceSpecPdfFromHtml, exportDanceSpecPptxFromHtml } from "./exports/danceSpec"; // 例：新しいindex.tsに寄せる
import type { MapCardHandle } from "./sections/MapCard";

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
  const mapCardRef = useRef<MapCardHandle | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const requestMapScreenshot = async () => {
    try {
      return await mapCardRef.current?.requestScreenshot?.();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "スクリーンショットの作成に失敗しました。";
      window.alert(msg);
      return null;
    }
  };

  const runExport = async (fn: () => Promise<void>) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await fn();
    } finally {
      setIsExporting(false);
    }
  };

  // ダンスファイル指示書(PDF)を出力
  const onExportPdf = () =>
    runExport(async () => {
      const mapScreenshotDataUrl = await requestMapScreenshot();
      await exportDanceSpecPdfFromHtml({
        projectName,
        scheduleLabel,
        gradPx: 3,
        area,
        mapScreenshotDataUrl,
      });
    });

  // ダンスファイル指示書(PPTX)を出力
  const onExportPptx = () =>
    runExport(async () => {
      const mapScreenshotDataUrl = await requestMapScreenshot();
      await exportDanceSpecPptxFromHtml({
        projectName,
        scheduleLabel,
        gradPx: 3,
        area,
        mapScreenshotDataUrl,
      });
    });

  // いったん state で selectedAreaName は持たず、area だけを見る
  const areaName = area?.area_name ?? null;


  return (
    <div className="space-y-8 pb-24 relative">
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative flex items-center justify-center px-7 py-6 text-white">
            <RdCompanyLogo />
          </div>
        </div>
      )}
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
          mapCardRef={mapCardRef}
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
          mapCardRef={mapCardRef}
        />
      </div>
    </div>
  );
}
