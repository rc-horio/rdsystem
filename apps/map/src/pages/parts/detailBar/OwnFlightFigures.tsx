import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { FlightFigure } from "@/features/types";
import {
  appendFlightFigure,
  createFlightFigure,
  removeFlightFigure,
  withConfirmedFlightFigure,
} from "@/features/flightFigures";

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

function makeUniqueFigureCopyTitle(figures: FlightFigure[], baseTitle: string) {
  const source = baseTitle.trim() || DEFAULT_FIGURE_TITLE;
  const first = `${source} (コピー)`;
  if (!hasDuplicateFigureTitle(figures, first, null)) return first;
  let n = 2;
  while (true) {
    const next = `${source} (コピー${n})`;
    if (!hasDuplicateFigureTitle(figures, next, null)) return next;
    n += 1;
  }
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
}: Props) {
  const figureInputRef = useRef<HTMLInputElement>(null);
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

  const duplicateFigure = (id: string) => {
    const source = figures.find((f) => f.id === id);
    if (!source) return;
    const copied = createFlightFigure({
      title: makeUniqueFigureCopyTitle(figures, source.title ?? ""),
      geometry: JSON.parse(JSON.stringify(source.geometry ?? {})),
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
      <div className="other-figure-label">飛行エリア図</div>
      {figures.length > 0 && (
        <div className="own-figure-hint">白い丸が確定（ダンス仕様書に使う図）</div>
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
            return (
              <div
                key={figure.id}
                className={`other-figure-row own-figure-row ${
                  selectedFigureId === figure.id ? "is-selected" : ""
                } ${confirmed ? "is-confirmed" : ""}`}
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
                      placeholder={DEFAULT_FIGURE_TITLE}
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
              </div>
            );
          })}
        </div>
      )}
      {editable && selectedFigureId && figures.some((f) => f.id === selectedFigureId) && (
        <div className="own-figure-toolbar">
          <button
            type="button"
            className="other-figure-action"
            onClick={() => duplicateFigure(selectedFigureId)}
          >
            複製
          </button>
          <button
            type="button"
            className="other-figure-action"
            onClick={() => {
              const figure = figures.find((f) => f.id === selectedFigureId);
              if (figure) deleteFigure(figure);
            }}
          >
            削除
          </button>
        </div>
      )}
      {editable && (
        <button
          type="button"
          className="add-area-button detailbar-add-button"
          onClick={addFigure}
        >
          <span className="add-icon">＋ </span>飛行エリア図を追加
        </button>
      )}
    </div>
  );
}
