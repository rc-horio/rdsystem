import { useState, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import { DeleteIconButton } from "@/components";
import type { Candidate } from "@/features/types";
import { AddFlightFigureModal } from "./AddFlightFigureModal";
import type { CopySourceItem, CopySourceTree } from "./flightFigureCopy";

type Props = {
  candidates: Candidate[];
  selectedCandidateIdx: number | null;
  editingCandidateIdx: number | null;
  editingCandidateTitle: string;
  editingCandidateInputRef: RefObject<HTMLInputElement>;
  candidateDeletionLocked: boolean;
  editable: boolean;
  onSelect: (idx: number) => void;
  onStartEdit: (idx: number) => void;
  onEditingTitleChange: (value: string) => void;
  onCommitTitle: () => boolean;
  onCancelEdit: () => void;
  onCopy: (source: CopySourceItem) => void;
  onDelete: (idx: number, candidate: Candidate) => void;
  onAdd: () => void;
  pendingNewCandidateIdx: number | null;
  copySources: CopySourceTree;
};

export function CandidateSection({
  candidates,
  selectedCandidateIdx,
  editingCandidateIdx,
  editingCandidateTitle,
  editingCandidateInputRef,
  candidateDeletionLocked,
  editable,
  onSelect,
  onStartEdit,
  onEditingTitleChange,
  onCommitTitle,
  onCancelEdit,
  onCopy,
  onDelete,
  onAdd,
  pendingNewCandidateIdx,
  copySources,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

  const requestAdd = () => {
    if (editingCandidateIdx != null) {
      const ok = onCommitTitle();
      if (!ok) return;
    }
    setAddOpen(true);
  };

  return (
    <div className="ds-record-section">
      <div className="ds-record-section-title">候補</div>
      {editable && !candidateDeletionLocked && (
        <button
          type="button"
          className="add-area-button detailbar-add-button"
          onClick={requestAdd}
        >
          <span className="add-icon">＋ </span>候補地を追加する
        </button>
      )}

      <div className="ds-record-list">
        {candidates.length === 0 ? (
          <div className="ds-record-empty" aria-live="polite">
            候補地はありません
          </div>
        ) : (
          candidates.map((candidate, idx) => (
            <div
              key={idx}
              className={`ds-record-row ${
                selectedCandidateIdx === idx ? "is-selected" : ""
              }`}
              role="option"
              aria-selected={selectedCandidateIdx === idx}
              onClick={() => onSelect(idx)}
            >
              <span
                className="ds-record-leftgap"
                onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                  e.stopPropagation();
                }}
              >
                <span className="ds-candidate-dot" aria-hidden="true">
                  ・
                </span>
              </span>
              <span
                className="ds-candidate-name"
                onDoubleClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                  if (!editable) return;
                  e.stopPropagation();
                  onStartEdit(idx);
                }}
              >
                {editable && editingCandidateIdx === idx ? (
                  <input
                    ref={editingCandidateInputRef}
                    type="text"
                    className="candidate-title-input"
                    value={editingCandidateTitle}
                    placeholder="候補地ラベル"
                    onChange={(e) => onEditingTitleChange(e.target.value)}
                    onBlur={() => {
                      const isPendingNew =
                        pendingNewCandidateIdx != null &&
                        pendingNewCandidateIdx === idx;
                      const hasInput = editingCandidateTitle.trim().length > 0;
                      if (isPendingNew && hasInput) {
                        onCommitTitle();
                        return;
                      }
                      onCancelEdit();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onCommitTitle();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        onCancelEdit();
                      }
                    }}
                  />
                ) : (
                  candidate.title
                )}
              </span>

              {editable && !candidateDeletionLocked && (
                <span
                  className="ds-record-delete"
                  onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation();
                  }}
                >
                  <DeleteIconButton
                    className={
                      !editable ? "ds-record-delete--hidden" : undefined
                    }
                    title="この候補を削除"
                    tabIndex={editable ? 0 : -1}
                    onClick={() => {
                      if (!editable) return;
                      onDelete(idx, candidate);
                    }}
                  />
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <AddFlightFigureModal
        open={addOpen}
        title="候補地を追加"
        sources={copySources}
        destinationKind="considering"
        onClose={() => setAddOpen(false)}
        onNew={onAdd}
        onCopy={onCopy}
      />
    </div>
  );
}
