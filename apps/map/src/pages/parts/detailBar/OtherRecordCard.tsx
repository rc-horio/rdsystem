import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { InputBox, Textarea } from "@/components";
import type { OtherFlightFigure, OtherRecord } from "@/features/types";

export type { OtherFlightFigure, OtherRecord };

export const EMPTY_OTHER_RECORD: OtherRecord = {
  companyName: "",
  eventName: "",
  date: "",
  aircraftCount: "",
  referenceUrl: "",
  memo: "",
  figures: [],
};

const DEFAULT_FIGURE_TITLE = "飛行エリア図";

function canOpenReferenceUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function openReferenceUrl(raw: string) {
  if (!canOpenReferenceUrl(raw)) return;
  window.open(raw.trim(), "_blank", "noopener,noreferrer");
}

type Props = {
  record: OtherRecord;
  editable: boolean;
  open: boolean;
  selectedFigureIdx: number | null;
  onToggle: () => void;
  onPatch: (patch: Partial<OtherRecord>) => void;
  onDelete: () => void;
  onHighlightFigure: (figureIdx: number) => void;
  onActivateFigure: (figureIdx: number, figure: OtherFlightFigure) => void;
  onFigureRemoved: (figureIdx: number) => void;
};

function formatHeadingDate(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const [year, month, day] = ymd.split("-");
  return `${year.slice(-2)}/${month}/${day}`;
}

function hasDuplicateFigureTitle(
  figures: OtherFlightFigure[],
  title: string,
  selfIndex: number | null
) {
  const normalized = title.trim();
  if (!normalized) return false;
  return figures.some((figure, idx) => {
    if (idx === selfIndex) return false;
    return (figure.title ?? "").trim() === normalized;
  });
}

function makeUniqueFigureCopyTitle(
  figures: OtherFlightFigure[],
  baseTitle: string
) {
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

export function OtherRecordCard({
  record,
  editable,
  open,
  selectedFigureIdx,
  onToggle,
  onPatch,
  onDelete,
  onHighlightFigure,
  onActivateFigure,
  onFigureRemoved,
}: Props) {
  const dateId = useId();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const figureInputRef = useRef<HTMLInputElement>(null);
  const [editingFigureIdx, setEditingFigureIdx] = useState<number | null>(null);
  const [editingFigureTitle, setEditingFigureTitle] = useState("");
  const [pendingNewFigureIdx, setPendingNewFigureIdx] = useState<number | null>(
    null
  );

  const openDatePicker = () => {
    if (!editable) return;
    const input = dateInputRef.current;
    if (!input) return;
    input.focus();
    try {
      input.showPicker();
    } catch {
      /* 非対応ブラウザ、または既に開いているとき */
    }
  };

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

  const commitFigureTitle = (): boolean => {
    if (editingFigureIdx == null) return false;
    const idx = editingFigureIdx;
    const finalTitle = editingFigureTitle.trim() || DEFAULT_FIGURE_TITLE;

    if (hasDuplicateFigureTitle(record.figures, finalTitle, idx)) {
      window.alert(
        "同じタイトルの飛行エリア図が既にあります。別のタイトルを入力してください。"
      );
      return false;
    }

    const list = [...record.figures];
    const target = list[idx];
    if (!target) return false;
    const nextFigure = { ...target, title: finalTitle };
    list[idx] = nextFigure;
    onPatch({ figures: list });
    setEditingFigureIdx(null);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(null);
    onActivateFigure(idx, nextFigure);
    return true;
  };

  const cancelFigureEdit = () => {
    const idx = editingFigureIdx;
    const isPendingNew = idx != null && pendingNewFigureIdx === idx;
    const isEmptyInput = editingFigureTitle.trim() === "";

    if (isPendingNew && isEmptyInput && idx != null) {
      const list = [...record.figures];
      if (idx >= 0 && idx < list.length) {
        list.splice(idx, 1);
        onPatch({ figures: list });
      }
      onFigureRemoved(idx);
      setPendingNewFigureIdx(null);
    }

    setEditingFigureIdx(null);
    setEditingFigureTitle("");
  };

  const startEditFigure = (idx: number) => {
    if (editingFigureIdx != null && editingFigureIdx !== idx) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    setEditingFigureIdx(idx);
    setEditingFigureTitle(record.figures[idx]?.title ?? "");
  };

  const addFigure = () => {
    if (editingFigureIdx != null) {
      const ok = commitFigureTitle();
      if (!ok) return;
    }
    const nextIdx = record.figures.length;
    onPatch({ figures: [...record.figures, { title: "" }] });
    onHighlightFigure(nextIdx);
    setEditingFigureIdx(nextIdx);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(nextIdx);
  };

  const duplicateFigure = (idx: number) => {
    const source = record.figures[idx];
    if (!source) return;
    const copied: OtherFlightFigure = JSON.parse(JSON.stringify(source));
    copied.title = makeUniqueFigureCopyTitle(
      record.figures,
      source.title ?? ""
    );
    const nextIdx = record.figures.length;
    onPatch({ figures: [...record.figures, copied] });
    onActivateFigure(nextIdx, copied);
    setEditingFigureIdx(null);
    setEditingFigureTitle("");
    setPendingNewFigureIdx(null);
  };

  const deleteFigure = (idx: number, figure: OtherFlightFigure) => {
    const ok = window.confirm(
      `飛行エリア図「${figure.title || "（無題）"}」を削除してもよろしいですか？`
    );
    if (!ok) return;
    const list = [...record.figures];
    if (idx < 0 || idx >= list.length) return;
    list.splice(idx, 1);
    onPatch({ figures: list });
    onFigureRemoved(idx);
    if (editingFigureIdx != null) {
      setEditingFigureIdx(null);
      setEditingFigureTitle("");
      setPendingNewFigureIdx(null);
    }
    window.alert("飛行エリア図を削除しました。\nSAVEボタンで確定してください。");
  };

  return (
    <div className={`other-record-card ${open ? "is-open" : ""}`}>
      <div
        className="other-record-heading"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="other-record-heading-texts">
          <div className="other-record-heading-event">{record.eventName}</div>
          <div className="other-record-heading-meta">
            <span className="other-record-heading-company">
              {record.companyName}
            </span>
            <span className="other-record-heading-date">
              {record.date ? formatHeadingDate(record.date) : ""}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="other-record-body">
          <div className="detailbar-form">
            <div className="detailbar-form-group">
              <InputBox
                label="イベント名"
                value={record.eventName}
                onChange={(e) => onPatch({ eventName: e.target.value })}
              />
              <InputBox
                label="実施会社名"
                value={record.companyName}
                onChange={(e) => onPatch({ companyName: e.target.value })}
              />
              <div className="rc-inp-field">
                <div className="rc-inp-row">
                  <label className="rc-inp-label" htmlFor={dateId}>
                    実施日
                  </label>
                  <div
                    className="rc-inp-shell other-record-date-shell"
                    aria-disabled={!editable}
                    onClick={openDatePicker}
                  >
                    <input
                      id={dateId}
                      ref={dateInputRef}
                      type="date"
                      className="rc-inp-input other-record-date-input"
                      value={record.date}
                      disabled={!editable}
                      onChange={(e) => onPatch({ date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <InputBox
                label="機体数"
                value={record.aircraftCount}
                onChange={(e) => onPatch({ aircraftCount: e.target.value })}
              />
              <div className="other-record-url-field">
                <InputBox
                  label="参考URL"
                  value={record.referenceUrl}
                  onChange={(e) => onPatch({ referenceUrl: e.target.value })}
                />
                <button
                  type="button"
                  className="detailbar-gmaps-button other-record-url-open"
                  disabled={!canOpenReferenceUrl(record.referenceUrl)}
                  onClick={() => openReferenceUrl(record.referenceUrl)}
                >
                  URLを開く
                </button>
              </div>
              <Textarea
                label="メモ"
                rows={2}
                value={record.memo}
                onChange={(e) => onPatch({ memo: e.target.value })}
              />
            </div>
          </div>

          <div className="other-figure-section">
            <div className="other-figure-label">飛行エリア図</div>
            {record.figures.length === 0 ? (
              <div className="other-figure-empty" aria-live="polite">
                飛行エリア図はありません
              </div>
            ) : (
              <div className="other-figure-list">
                {record.figures.map((figure, idx) => (
                  <div
                    key={idx}
                    className={`other-figure-row ${
                      selectedFigureIdx === idx ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={selectedFigureIdx === idx}
                    onClick={() => onActivateFigure(idx, figure)}
                  >
                    <span
                      className="other-figure-name"
                      onDoubleClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                        if (!editable) return;
                        e.stopPropagation();
                        startEditFigure(idx);
                      }}
                    >
                      {editable && editingFigureIdx === idx ? (
                        <input
                          ref={figureInputRef}
                          type="text"
                          className="other-figure-name-input"
                          value={editingFigureTitle}
                          placeholder={DEFAULT_FIGURE_TITLE}
                          onChange={(e) =>
                            setEditingFigureTitle(e.target.value)
                          }
                          onBlur={() => {
                            const isPendingNew =
                              pendingNewFigureIdx != null &&
                              pendingNewFigureIdx === idx;
                            const hasInput =
                              editingFigureTitle.trim().length > 0;
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
                    {editable && (
                      <span
                        className="other-figure-actions"
                        onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                          e.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          className="other-figure-action"
                          onClick={() => duplicateFigure(idx)}
                        >
                          複製
                        </button>
                        <button
                          type="button"
                          className="other-figure-action"
                          onClick={() => deleteFigure(idx, figure)}
                        >
                          削除
                        </button>
                      </span>
                    )}
                  </div>
                ))}
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

          {editable && (
            <button
              type="button"
              className="add-area-button detailbar-add-button"
              onClick={onDelete}
            >
              実績を削除する
            </button>
          )}
        </div>
      )}
    </div>
  );
}
