import { useState } from "react";
import type { Candidate, FlightFigure, HistoryItem } from "@/features/types";
import { ConsideringFigures } from "./ConsideringFigures";
import { ProjectHistorySection } from "./ProjectHistorySection";
import type { CopySourceItem, CopySourceTree } from "./flightFigureCopy";

const OWN_VIEWS = [
  { key: "project", label: "案件データ" },
  { key: "preProject", label: "候補図（案件化前）" },
] as const;

type OwnView = (typeof OWN_VIEWS)[number]["key"];

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  selectedFigureId: string | null;
  editable: boolean;
  copySources: CopySourceTree;
  candidates: Candidate[];
  selectedCandidateIdx: number | null;
  candidateDeletionLocked: boolean;
  onClearConsideringCandidates?: (sourceIndex: number) => void;
  onClearSales?: (sourceIndex: number) => void;
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
  onSelectCandidate: (idx: number, title?: string) => void;
  onHighlightCandidate: (idx: number) => void;
  onPatchCandidate: (idx: number, patch: Partial<Candidate>) => void;
  onCopyFigure: (source: CopySourceItem) => void;
  onDeleteCandidate: (idx: number) => void;
  onAddCandidate: () => void;
  onCandidateFigureRemoved: (idx: number) => void;
};

export function OwnFlightAreaPanel({
  history,
  selectedHistoryIdx,
  selectedFigureId,
  editable,
  copySources,
  candidates,
  selectedCandidateIdx,
  candidateDeletionLocked,
  onClearConsideringCandidates,
  onClearSales,
  onSelectHistory,
  onDeleteHistory,
  onRegisterProject,
  onPatchFigures,
  onActivateFigure,
  onHighlightFigure,
  onFigureRemoved,
  onSelectCandidate,
  onHighlightCandidate,
  onPatchCandidate,
  onCopyFigure,
  onDeleteCandidate,
  onAddCandidate,
  onCandidateFigureRemoved,
}: Props) {
  const [view, setView] = useState<OwnView>("project");

  return (
    <section role="tabpanel" aria-label="RC">
      <div
        className="own-panel-segment"
        role="tablist"
        aria-label="RCの表示切替"
      >
        {OWN_VIEWS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={view === item.key}
            className={`own-panel-segment-btn ${
              view === item.key ? "is-active" : ""
            }`}
            onClick={() => setView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div hidden={view !== "project"}>
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
          onClearConsideringCandidates={onClearConsideringCandidates}
          onClearSales={onClearSales}
        />
      </div>
      <div hidden={view !== "preProject"}>
        <ConsideringFigures
          candidates={candidates}
          selectedIdx={selectedCandidateIdx}
          editable={editable}
          locked={candidateDeletionLocked}
          copySources={copySources}
          onAdd={onAddCandidate}
          onHighlight={onHighlightCandidate}
          onActivate={onSelectCandidate}
          onPatch={onPatchCandidate}
          onCopy={onCopyFigure}
          onClearSales={onClearSales}
          onDelete={onDeleteCandidate}
          onFigureRemoved={onCandidateFigureRemoved}
        />
      </div>
    </section>
  );
}
