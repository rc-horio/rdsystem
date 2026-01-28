// features/hub/tabs/AreaInfo/sections/layout/MobilePanel.tsx
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import type { AreaInfo } from "../..";
import { exportDanceSpecPptxFromHtml } from "../../pdf/exportLandscape";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void;
  projectName: string;
  scheduleLabel: string;
  areaName: string | null;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
};

export default function MobilePanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
  projectName,
  scheduleLabel,
  areaName,
  projectUuid,
  scheduleUuid,
}: Props) {
  const onExportPptx = () =>
    exportDanceSpecPptxFromHtml({
      projectName,
      scheduleLabel,
      gradPx: 3,
      area,
    });

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* 出力 */}
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-200">
            ダンスファイル指示書出力
          </span>

          <div className="inline-flex overflow-hidden rounded-md border border-slate-600">
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1 text-xs hover:bg-slate-700"
            >
              PDF
            </button>
            <div className="w-px bg-slate-600" />
            <button
              type="button"
              onClick={onExportPptx}
              className="px-3 py-1 text-xs hover:bg-slate-700"
            >
              PPTX
            </button>
          </div>
        </div>
      </div>
      <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      <MapCard
        areaName={areaName}
        projectUuid={projectUuid ?? undefined}
        scheduleUuid={scheduleUuid ?? undefined}
      />
      <LandingAreaFigure edit={edit} area={area} onPatchArea={onPatchArea} />


    </div>
  );
}
