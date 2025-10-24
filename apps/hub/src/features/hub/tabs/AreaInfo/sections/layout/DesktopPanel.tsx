// features/hub/tabs/AreaInfo/sections/layout/DesktopPanel.tsx
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import type { AreaInfo } from "../..";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void; // ★ 追加
};

export default function DesktopPanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
}: Props) {
  return (
    // 12カラム固定 → 2カラムの可変グリッドに
    <div
      className="grid gap-y-6 gap-x-1
                    lg:[grid-template-columns:minmax(0,1fr)_minmax(270px,270px)]
                    w-full"
    >
      {/* 左+中央（可変） */}
      <div className="relative pr-6 lg:pr-8">
        <div className="absolute inset-y-0 right-0 w-px bg-red-900/40 pointer-events-none" />
        <div className="mb-4">
          <ButtonRed onClick={onExportPdf} className="px-3 py-1 text-xs">
            PDF出力
          </ButtonRed>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <MapCard />
          </div>
          <div className="space-y-6">
            <LandingAreaFigure
              edit={edit}
              area={area}
              onPatchArea={onPatchArea}
            />
          </div>
        </div>
      </div>

      {/* 右（minmaxで自動拡張・右端の余白を解消） */}
      <div className="pl-3 lg:pl-4">
        <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      </div>
    </div>
  );
}
