import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { Candidate } from "@/features/types";
import { hasDuplicateCandidateTitle } from "./helpers";
import { AddFlightFigureModal } from "./AddFlightFigureModal";
import {
  type CopySourceItem,
  type CopySourceTree,
} from "./flightFigureCopy";

const DEFAULT_FIGURE_TITLE = "飛行エリア図";

type Props = {
  candidates: Candidate[];
  selectedIdx: number | null;
  editable: boolean;
  locked: boolean;
  copySources: CopySourceTree;
  onAdd: () => void;
  onHighlight: (idx: number) => void;
  onActivate: (idx: number) => void;
  onPatch: (idx: number, patch: Partial<Candidate>) => void;
  onCopy: (source: CopySourceItem) => void;
  onDelete: (idx: number) => void;
  onFigureRemoved: (idx: number) => void;
};

export function ConsideringFigures({
  candidates,
  selectedIdx,
  editable,
  locked,
  copySources,
  onAdd,
  onHighlight,
  onActivate,
  onPatch,
  onCopy,
  onDelete,
  onFigureRemoved,
}: Props) {
  const figureInputRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingFigureIdx, setEditingFigureIdx] = useState<number | null>(null);
  const [editingFigureTitle, setEditingFigureTitle] = useState("");
  const [pendingNewFigureIdx, setPendingNewFigureIdx] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (editingFigureIdx == null || !figureInputRef.current) return;
    const input = figureInputRef.current;
    const len = input.value.length;
    input.focus();
    window.setTimeout(() => {
      try {
        input.setSelectionRange(len, len);
      } catch {
        /* noop */
      }
    }, 0);
  }, [editingFigureIdx]);

  useEffect(() => {
    if (editingFigureIdx != null && editingFigureIdx >= candidates.length) {
      setEditingFigureIdx(null);
      setEditingFigureTitle("");
      setPendingNewFigureIdx(null);
    }
  }, [candidates.length, editingFigureIdx]);

  const commitFigureTitle = (): boolean => {
    if (editingFigureIdx == null) return false;
    const idx = editingFigureIdx;
    const finalTitle = editingFigureTitle.trim() || DEFAULT_FIGURE_TITLE;

    if (hasDuplicateCandidateTitle(candidates, finalTitle, idx)) {
      window.alert(
        "同じタイトルの飛行エリア図が既にあります。別のタイトルを入力してください。"
      );
      return false;
    }

    const target = candidates[idx];
    if (!target) return false;
    onPatch(idx, { title: finalTitle });
    setEditingFigureIdx(null);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(null);
    onActivate(idx);
    return true;
  };

  const cancelFigureEdit = () => {
    const idx = editingFigureIdx;
    const isPendingNew = idx != null && pendingNewFigureIdx === idx;
    const isEmptyInput = editingFigureTitle.trim() === "";

    if (isPendingNew && isEmptyInput && idx != null) {
      onDelete(idx);
      onFigureRemoved(idx);
      setPendingNewFigureIdx(null);
    }

    setEditingFigureIdx(null);
    setEditingFigureTitle("");
  };

  const startEditFigure = (idx: number) => {
    if (locked) return;
    if (editingFigureIdx != null && editingFigureIdx !== idx) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    setEditingFigureIdx(idx);
    setEditingFigureTitle(candidates[idx]?.title ?? "");
  };

  const addFigure = () => {
    if (locked) return;
    if (editingFigureIdx != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    const nextIdx = candidates.length;
    onAdd();
    onHighlight(nextIdx);
    setEditingFigureIdx(nextIdx);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(nextIdx);
  };

  const copyFigure = (source: CopySourceItem) => {
    if (locked) return;
    if (editingFigureIdx != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    onCopy(source);
    setEditingFigureIdx(null);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(null);
  };

  const requestAdd = () => {
    if (locked) return;
    if (editingFigureIdx != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    setAddOpen(true);
  };

  const deleteFigure = (idx: number, figure: Candidate) => {
    const ok = window.confirm(
      `飛行エリア図「${figure.title || "（無題）"}」を削除してもよろしいですか？`
    );
    if (!ok) return;
    onDelete(idx);
    onFigureRemoved(idx);
    if (editingFigureIdx != null) {
      setEditingFigureIdx(null);
      setEditingFigureTitle("");
      setPendingNewFigureIdx(null);
    }
    window.alert("飛行エリア図を削除しました。\nSAVEボタンで確定してください。");
  };

  const canEditFigures = editable && !locked;

  return (
    <div className="other-figure-section">
      <div className="other-figure-label">飛行エリア図</div>
      {candidates.length === 0 ? (
        <div className="other-figure-empty" aria-live="polite">
          飛行エリア図はありません
        </div>
      ) : (
        <div className="other-figure-list">
          {candidates.map((figure, idx) => (
            <div
              key={idx}
              className={`other-figure-row ${
                selectedIdx === idx ? "is-selected" : ""
              }`}
              role="option"
              aria-selected={selectedIdx === idx}
              onClick={() => onActivate(idx)}
            >
              <span
                className="other-figure-name"
                onDoubleClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                  if (!canEditFigures) return;
                  e.stopPropagation();
                  startEditFigure(idx);
                }}
              >
                {canEditFigures && editingFigureIdx === idx ? (
                  <input
                    ref={figureInputRef}
                    type="text"
                    className="other-figure-name-input"
                    value={editingFigureTitle}
                    placeholder={DEFAULT_FIGURE_TITLE}
                    onChange={(e) => setEditingFigureTitle(e.target.value)}
                    onBlur={() => {
                      const isPendingNew =
                        pendingNewFigureIdx != null &&
                        pendingNewFigureIdx === idx;
                      const hasInput = editingFigureTitle.trim().length > 0;
                      if (isPendingNew && !hasInput) {
                        cancelFigureEdit();
                        return;
                      }
                      commitFigureTitle();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitFigureTitle();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelFigureEdit();
                      }
                    }}
                  />
                ) : (
                  figure.title
                )}
              </span>
              {canEditFigures && editingFigureIdx !== idx && (
                <span className="other-figure-actions">
                  <button
                    type="button"
                    className="other-figure-action"
                    onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      deleteFigure(idx, figure);
                    }}
                  >
                    削除
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {canEditFigures && (
        <button
          type="button"
          className="add-area-button detailbar-add-button"
          onClick={requestAdd}
        >
          <span className="add-icon">＋ </span>飛行エリア図を追加
        </button>
      )}
      <AddFlightFigureModal
        open={addOpen}
        title="飛行エリア図を追加"
        sources={copySources}
        destinationKind="considering"
        onClose={() => setAddOpen(false)}
        onNew={addFigure}
        onCopy={copyFigure}
      />
    </div>
  );
}
