// features/hub/tabs/AreaInfo/sections/layout/DesktopPanel.tsx
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import type { AreaInfo } from "../..";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void;
};

export default function DesktopPanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
}: Props) {
  return (
    // 左(=Map+Figure) と 右(=RightPanel) の2カラム
    <div className="grid gap-y-6 gap-x-1 lg:grid-cols-[4fr_1fr] w-full">
      {/* 左: MapCard + LandingAreaFigure を1セクションとして縦並び */}
      <div className="relative pr-6 lg:pr-4">
        <div className="absolute inset-y-0 right-0 w-px bg-red-900/40 pointer-events-none" />

        <div className="mb-4">
          <ButtonRed onClick={onExportPdf} className="px-3 py-1 text-xs">
            PDF出力
          </ButtonRed>
        </div>

        {/* 縦並びに */}
        <div className="space-y-6">
          <MapCard areaName={area?.area_name ?? null} />
          <LandingAreaFigure
            edit={edit}
            area={area}
            onPatchArea={onPatchArea}
          />
        </div>
      </div>

      {/* 右: RightPanel セクション */}
      <div className="pl-3 lg:pl-4">
        <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      </div>
    </div>
  );
}
