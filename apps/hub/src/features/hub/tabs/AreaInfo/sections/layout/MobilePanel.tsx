// features/hub/tabs/AreaInfo/sections/layout/MobilePanel.tsx
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import type { AreaInfo } from "../..";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void; // 追加
};

export default function MobilePanel({ edit, area, onPatchArea, onExportPdf }: Props) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      <MapCard />
      <LandingAreaFigure edit={edit} area={area} onPatchArea={onPatchArea} />
      <div className="flex justify-end">
        <ButtonRed onClick={onExportPdf} className="px-3 py-1 text-xs">
          PDF出力
        </ButtonRed>
      </div>
    </div>
  );
}
