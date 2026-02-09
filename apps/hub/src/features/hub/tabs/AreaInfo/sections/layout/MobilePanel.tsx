// features/hub/tabs/AreaInfo/sections/layout/MobilePanel.tsx
import type { RefObject } from "react";
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import type { MapCardHandle } from "../MapCard";
import type { AreaInfo } from "../..";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  areaName: string | null;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
  geometry?: any | null;
  onScreenshotCaptured?: (dataUrl: string) => void;
  mapCardRef?: RefObject<MapCardHandle>;
};

export default function MobilePanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
  onExportPptx,
  areaName,
  projectUuid,
  scheduleUuid,
  geometry,
  onScreenshotCaptured,
  mapCardRef,
}: Props) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* 出力 */}
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-200">
            ダンスファイル指示書出力
          </span>

          <div className="inline-flex overflow-hidden rounded-md border border-slate-600">
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1 text-sm hover:bg-slate-700"
            >
              PDF
            </button>
            <div className="w-px bg-slate-600" />
            <button
              type="button"
              onClick={onExportPptx}
              className="px-3 py-1 text-sm hover:bg-slate-700"
            >
              PPTX
            </button>
          </div>
        </div>
      </div>
      <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      <MapCard
        ref={mapCardRef}
        areaName={areaName}
        projectUuid={projectUuid ?? undefined}
        scheduleUuid={scheduleUuid ?? undefined}
        geometry={(area as any)?.geometry ?? null}
        onScreenshotCaptured={onScreenshotCaptured}
      />
      <LandingAreaFigure edit={edit} area={area} onPatchArea={onPatchArea} />


    </div>
  );
}
