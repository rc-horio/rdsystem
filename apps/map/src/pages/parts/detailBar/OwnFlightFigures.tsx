import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { FlightFigure } from "@/features/types";
import {
  appendFlightFigure,
  createFlightFigure,
  removeFlightFigure,
  withConfirmedFlightFigure,
} from "@/features/flightFigures";
import { AddFlightFigureModal } from "./AddFlightFigureModal";
import {
  FigureTitleAssist,
  FIGURE_TITLE_PLACEHOLDER,
} from "./FigureTitleAssist";
import {
  cloneGeometry,
  makeUniqueCopyTitle,
  type CopySourceItem,
  type CopySourceTree,
} from "./flightFigureCopy";

const DEFAULT_FIGURE_TITLE = "飛行エリア図";

type Props = {
  figures: FlightFigure[];
  confirmedFigureId: string | null;
  selectedFigureId: string | null;
  editable: boolean;
  onChange: (
    figures: FlightFigure[],
    confirmedFigureId: string | null
  ) => void;
  onActivate: (figure: FlightFigure) => void;
  onHighlight: (figureId: string) => void;
  onFigureRemoved: (figureId: string) => void;
  copySources: CopySourceTree;
  onClearConsideringCandidates?: (sourceIndex: number) => void;
  onClearSales?: (sourceIndex: number) => void;
};

function hasDuplicateFigureTitle(
  figures: FlightFigure[],
  title: string,
  selfId: string | null
) {
  const normalized = title.trim();
  if (!normalized) return false;
  return figures.some((figure) => {
    if (selfId && figure.id === selfId) return false;
    return (figure.title ?? "").trim() === normalized;
  });
}

export function OwnFlightFigures({
  figures,
  confirmedFigureId,
  selectedFigureId,
  editable,
  onChange,
  onActivate,
  onHighlight,
  onFigureRemoved,
  copySources,
  onClearConsideringCandidates,
  onClearSales,
}: Props) {
  const figureInputRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingFigureId, setEditingFigureId] = useState<string | null>(null);
  const [editingFigureTitle, setEditingFigureTitle] = useState("");
  const [pendingNewFigureId, setPendingNewFigureId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (editingFigureId == null || !figureInputRef.current) return;
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
  }, [editingFigureId]);

  const commitFigureTitle = (): boolean => {
    if (editingFigureId == null) return false;
    const id = editingFigureId;
    const finalTitle = editingFigureTitle.trim() || DEFAULT_FIGURE_TITLE;
    if (hasDuplicateFigureTitle(figures, finalTitle, id)) {
      window.alert(
        "同じタイトルの飛行エリア図が既にあります。別のタイトルを入力してください。"
      );
      return false;
    }
    const target = figures.find((f) => f.id === id);
    if (!target) return false;
    const nextFigure = { ...target, title: finalTitle };
    const nextFigures = figures.map((f) => (f.id === id ? nextFigure : f));
    onChange(nextFigures, confirmedFigureId);
    setEditingFigureId(null);
    setEditingFigureTitle("");
    setPendingNewFigureId(null);
    onActivate(nextFigure);
    return true;
  };

  const cancelFigureEdit = () => {
    const id = editingFigureId;
    const isPendingNew = id != null && pendingNewFigureId === id;
    const isEmptyInput = editingFigureTitle.trim() === "";
    if (isPendingNew && isEmptyInput && id != null) {
      const next = removeFlightFigure(
        { flight_figures: figures, confirmed_figure_id: confirmedFigureId },
        id
      );
      onChange(next.flight_figures, next.confirmed_figure_id);
      onFigureRemoved(id);
      setPendingNewFigureId(null);
    }
    setEditingFigureId(null);
    setEditingFigureTitle("");
  };

  const startEditFigure = (id: string) => {
    if (editingFigureId != null && editingFigureId !== id) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    const target = figures.find((f) => f.id === id);
    setEditingFigureId(id);
    setEditingFigureTitle(target?.title ?? "");
  };

  const addFigure = () => {
    if (editingFigureId != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    const figure = createFlightFigure({ title: "" });
    figure.title = "";
    const next = appendFlightFigure(
      { flight_figures: figures, confirmed_figure_id: confirmedFigureId },
      figure
    );
    onChange(next.flight_figures, next.confirmed_figure_id);
    onHighlight(figure.id);
    setEditingFigureId(figure.id);
    setEditingFigureTitle("");
    setPendingNewFigureId(figure.id);
  };

  const copyFigure = (source: CopySourceItem) => {
    if (editingFigureId != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    const copied = createFlightFigure({
      title: makeUniqueCopyTitle(
        figures.map((figure) => figure.title ?? ""),
        source.title,
        DEFAULT_FIGURE_TITLE
      ),
      geometry: cloneGeometry(source.geometry),
    });
    const next = appendFlightFigure(
      { flight_figures: figures, confirmed_figure_id: confirmedFigureId },
      copied
    );
    onChange(next.flight_figures, next.confirmed_figure_id);
    onActivate(copied);
    setEditingFigureId(null);
    setEditingFigureTitle("");
    setPendingNewFigureId(null);
  };

  const requestAdd = () => {
    if (editingFigureId != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    setAddOpen(true);
  };

  const deleteFigure = (figure: FlightFigure) => {
    const ok = window.confirm(
      `飛行エリア図「${figure.title || "（無題）"}」を削除してもよろしいですか？`
    );
    if (!ok) return;
    const next = removeFlightFigure(
      { flight_figures: figures, confirmed_figure_id: confirmedFigureId },
      figure.id
    );
    onChange(next.flight_figures, next.confirmed_figure_id);
    const nextConfirmed = next.flight_figures.find(
      (f) => f.id === next.confirmed_figure_id
    );
    if (nextConfirmed) {
      onActivate(nextConfirmed);
    } else {
      onFigureRemoved(figure.id);
    }
    setEditingFigureId(null);
    setEditingFigureTitle("");
    setPendingNewFigureId(null);
    window.alert(
      "飛行エリア図を削除しました。\nSAVEボタンで確定してください。"
    );
  };

  const confirmFigure = (id: string) => {
    const next = withConfirmedFlightFigure(
      { flight_figures: figures, confirmed_figure_id: confirmedFigureId },
      id
    );
    onChange(next.flight_figures, next.confirmed_figure_id);
  };

  return (
    <div className="other-figure-section">
      {figures.length > 0 && (
        <div className="own-figure-hint">白丸：ダンスファイル指示書に使用</div>
      )}
      {figures.length === 0 ? (
        <div className="other-figure-empty" aria-live="polite">
          飛行エリア図はありません
        </div>
      ) : (
        <div
          className="other-figure-list"
          role="radiogroup"
          aria-label="確定する飛行エリア図"
        >
          {figures.map((figure) => {
            const confirmed = figure.id === confirmedFigureId;
            const showTitleAssist =
              pendingNewFigureId === figure.id &&
              editingFigureId === figure.id &&
              editingFigureTitle.trim().length === 0;
            return (
              <div
                key={figure.id}
                className={`other-figure-row own-figure-row ${
                  selectedFigureId === figure.id ? "is-selected" : ""
                } ${confirmed ? "is-confirmed" : ""} ${
                  showTitleAssist ? "is-title-assist" : ""
                }`}
                role="option"
                aria-selected={selectedFigureId === figure.id}
                onClick={() => onActivate(figure)}
              >
                <button
                  type="button"
                  className={`own-figure-radio ${confirmed ? "is-on" : ""}`}
                  role="radio"
                  aria-checked={confirmed}
                  aria-label={`${figure.title || "（無題）"}を確定`}
                  disabled={!editable || confirmed}
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    if (!editable || confirmed) return;
                    confirmFigure(figure.id);
                  }}
                />
                <span
                  className="other-figure-name"
                  onDoubleClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    if (!editable) return;
                    e.stopPropagation();
                    startEditFigure(figure.id);
                  }}
                >
                  {editable && editingFigureId === figure.id ? (
                    <input
                      ref={figureInputRef}
                      type="text"
                      className="other-figure-name-input"
                      value={editingFigureTitle}
                      placeholder={FIGURE_TITLE_PLACEHOLDER}
                      onChange={(e) => setEditingFigureTitle(e.target.value)}
                      onBlur={() => {
                        const isPendingNew =
                          pendingNewFigureId != null &&
                          pendingNewFigureId === figure.id;
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
                {editable && editingFigureId !== figure.id && (
                  <span className="other-figure-actions">
                    <button
                      type="button"
                      className="other-figure-action"
                      onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        deleteFigure(figure);
                      }}
                    >
                      削除
                    </button>
                  </span>
                )}
                <FigureTitleAssist show={showTitleAssist} />
              </div>
            );
          })}
        </div>
      )}
      {editable && (
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
        destinationKind="own"
        onClose={() => setAddOpen(false)}
        onNew={addFigure}
        onCopy={copyFigure}
        onClearConsideringCandidates={onClearConsideringCandidates}
        onClearSales={onClearSales}
      />
    </div>
  );
}
