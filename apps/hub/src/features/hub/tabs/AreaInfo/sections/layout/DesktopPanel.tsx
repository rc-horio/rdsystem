// features/hub/tabs/AreaInfo/sections/layout/DesktopPanel.tsx
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

export default function DesktopPanel({
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
    // 左(=Map+Figure) と 右(=RightPanel) の2カラム
    <div className="grid gap-y-6 gap-x-1 lg:grid-cols-[4fr_1fr] w-full">
      {/* 左: MapCard + LandingAreaFigure を1セクションとして縦並び */}
      <div className="relative pr-6 lg:pr-4">
        <div className="absolute inset-y-0 right-0 w-px bg-red-900/40 pointer-events-none" />

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-200">
            ダンスファイル指示書出力
          </span>

          <div className="inline-flex overflow-hidden rounded-md border border-slate-600">
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1 text-sm hover:bg-slate-700 cursor-pointer"
            >
              PDF
            </button>
            <div className="w-px bg-slate-600" />
            <button
              type="button"
              onClick={onExportPptx}
              className="px-3 py-1 text-sm hover:bg-slate-700 cursor-pointer"
            >
              PPTX
            </button>
          </div>
        </div>


        {/* 縦並びに\ */}
        <div className="space-y-6">
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
      </div>

      {/* 右: RightPanel セクション */}
      <div className="pl-3 lg:pl-4">
        <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      </div>
    </div>
  );
}
