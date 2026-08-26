import { useEffect, useState } from "react";
import type { FlightFigure, HistoryItem } from "@/features/types";
import { fmtDate } from "./helpers";
import { OwnFlightFigures } from "./OwnFlightFigures";
import type { CopySourceTree } from "./flightFigureCopy";

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  selectedFigureId: string | null;
  editable: boolean;
  onSelect: (item: HistoryItem, idx: number) => void;
  onDelete: (idx: number, item: HistoryItem) => boolean;
  onRegisterProject: () => void;
  onPatchFigures: (
    idx: number,
    figures: FlightFigure[],
    confirmedFigureId: string | null
  ) => void;
  onActivateFigure: (idx: number, figure: FlightFigure) => void;
  onHighlightFigure: (idx: number, figureId: string) => void;
  onFigureRemoved: (idx: number, figureId: string) => void;
  copySources: CopySourceTree;
  onClearConsideringCandidates?: (sourceIndex: number) => void;
};

export function ProjectHistorySection({
  history,
  selectedHistoryIdx,
  selectedFigureId,
  editable,
  onSelect,
  onDelete,
  onRegisterProject,
  onPatchFigures,
  onActivateFigure,
  onHighlightFigure,
  onFigureRemoved,
  copySources,
  onClearConsideringCandidates,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx != null && openIdx >= history.length) {
      setOpenIdx(null);
    }
  }, [openIdx, history.length]);

  const toggleCard = (item: HistoryItem, idx: number) => {
    onSelect(item, idx);
    setOpenIdx((current) => (current === idx ? null : idx));
  };

  const handleDelete = (idx: number, item: HistoryItem) => {
    if (!onDelete(idx, item)) return;
    setOpenIdx((current) => {
      if (current == null) return null;
      if (current === idx) return null;
      if (current > idx) return current - 1;
      return current;
    });
  };

  return (
    <div className="ds-record-section">
      <div className="ds-record-list">
        {history.length === 0 ? (
          <div className="other-record-empty" aria-live="polite">
            履歴はありません
          </div>
        ) : (
          history.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div
                key={`${item.projectName}-${item.scheduleName}-${item.date}-${idx}`}
                className={`other-record-card own-record-card ${open ? "is-open" : ""}`}
              >
                <div
                  className="other-record-heading"
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  aria-selected={selectedHistoryIdx === idx}
                  onClick={() => toggleCard(item, idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard(item, idx);
                    }
                  }}
                >
                  <div className="other-record-heading-texts">
                    <div className="other-record-heading-event">
                      {item.projectName}
                    </div>
                    <div className="other-record-heading-meta">
                      <span className="other-record-heading-company">
                        {item.scheduleName}
                      </span>
                      <span className="other-record-heading-date">
                        {item.date ? fmtDate(item.date) : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {open && (
                  <div className="other-record-body">
                    <OwnFlightFigures
                      figures={item.flight_figures ?? []}
                      confirmedFigureId={item.confirmed_figure_id ?? null}
                      selectedFigureId={
                        selectedHistoryIdx === idx ? selectedFigureId : null
                      }
                      editable={editable}
                      onChange={(figures, confirmedFigureId) =>
                        onPatchFigures(idx, figures, confirmedFigureId)
                      }
                      onActivate={(figure) => onActivateFigure(idx, figure)}
                      onHighlight={(figureId) =>
                        onHighlightFigure(idx, figureId)
                      }
                      onFigureRemoved={(figureId) =>
                        onFigureRemoved(idx, figureId)
                      }
                      copySources={copySources}
                      onClearConsideringCandidates={
                        onClearConsideringCandidates
                      }
                    />
                    {editable && (
                      <div className="own-record-unlink-row">
                        <button
                          type="button"
                          className="own-record-unlink"
                          onClick={() => handleDelete(idx, item)}
                        >
                          紐づけを解除する
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {editable && (
        <button
          type="button"
          className="add-area-button detailbar-add-button"
          onClick={onRegisterProject}
        >
          <span className="add-icon">＋ </span>案件情報を紐づける
        </button>
      )}
    </div>
  );
}
