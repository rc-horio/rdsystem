// features/hub/tabs/AreaInfo/sections/layout/MobilePanel.tsx
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import type { AreaInfo } from "../..";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void;
  areaName: string | null;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
};

export default function MobilePanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
  areaName,
  projectUuid,
  scheduleUuid,
}: Props) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      <MapCard
        areaName={areaName}
        projectUuid={projectUuid ?? undefined}
        scheduleUuid={scheduleUuid ?? undefined}
      />
      <LandingAreaFigure
        edit={edit}
        area={area}
        onPatchArea={onPatchArea}
        projectUuid={projectUuid ?? undefined}
        scheduleUuid={scheduleUuid ?? undefined}
      />
      <div className="flex justify-end">
        <ButtonRed onClick={onExportPdf} className="px-3 py-1 text-xs">
          PDF出力
        </ButtonRed>
      </div>
    </div>
  );
}
