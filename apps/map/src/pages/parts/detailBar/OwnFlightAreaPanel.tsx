import type { FlightFigure, HistoryItem } from "@/features/types";
import { ProjectHistorySection } from "./ProjectHistorySection";
import type { CopySourceTree } from "./flightFigureCopy";

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  selectedFigureId: string | null;
  editable: boolean;
  copySources: CopySourceTree;
  onSelectHistory: (item: HistoryItem, idx: number) => void;
  onDeleteHistory: (idx: number, item: HistoryItem) => boolean;
  onRegisterProject: () => void;
  onPatchFigures: (
    idx: number,
    figures: FlightFigure[],
    confirmedFigureId: string | null
  ) => void;
  onActivateFigure: (idx: number, figure: FlightFigure) => void;
  onHighlightFigure: (idx: number, figureId: string) => void;
  onFigureRemoved: (idx: number, figureId: string) => void;
};

export function OwnFlightAreaPanel({
  history,
  selectedHistoryIdx,
  selectedFigureId,
  editable,
  copySources,
  onSelectHistory,
  onDeleteHistory,
  onRegisterProject,
  onPatchFigures,
  onActivateFigure,
  onHighlightFigure,
  onFigureRemoved,
}: Props) {
  return (
    <section role="tabpanel" aria-label="自社">
      <ProjectHistorySection
        history={history}
        selectedHistoryIdx={selectedHistoryIdx}
        selectedFigureId={selectedFigureId}
        editable={editable}
        onSelect={onSelectHistory}
        onDelete={onDeleteHistory}
        onRegisterProject={onRegisterProject}
        onPatchFigures={onPatchFigures}
        onActivateFigure={onActivateFigure}
        onHighlightFigure={onHighlightFigure}
        onFigureRemoved={onFigureRemoved}
        copySources={copySources}
      />
    </section>
  );
}
