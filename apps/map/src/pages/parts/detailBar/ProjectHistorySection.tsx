import { useEffect, useState } from "react";
import type { HistoryItem } from "@/features/types";
import { buildHubUrl, fmtDate } from "./helpers";

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  editable: boolean;
  onSelect: (item: HistoryItem, idx: number) => void;
  onDelete: (idx: number, item: HistoryItem) => boolean;
  onRegisterProject: () => void;
};

function openHub(item: HistoryItem) {
  const url = buildHubUrl(item.projectUuid, item.date, item.scheduleUuid);
  if (!url) {
    console.warn(
      "[detailbar] projectUuid is missing. cannot navigate to hub.",
      item
    );
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ProjectHistorySection({
  history,
  selectedHistoryIdx,
  editable,
  onSelect,
  onDelete,
  onRegisterProject,
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
            const hubUrl = buildHubUrl(
              item.projectUuid,
              item.date,
              item.scheduleUuid
            );
            return (
              <div
                key={`${item.projectName}-${item.scheduleName}-${item.date}-${idx}`}
                className={`other-record-card ${open ? "is-open" : ""}`}
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
                    <div className="detailbar-form">
                      <div className="detailbar-form-group">
                        <div className="rc-inp-field">
                          <div className="rc-inp-row">
                            <span className="rc-inp-label">案件名</span>
                            <div
                              className="rc-inp-shell"
                              aria-disabled="true"
                            >
                              <div className="rc-inp-input own-history-value">
                                {item.projectName}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="rc-inp-field">
                          <div className="rc-inp-row">
                            <span className="rc-inp-label">
                              スケジュール名
                            </span>
                            <div
                              className="rc-inp-shell"
                              aria-disabled="true"
                            >
                              <div className="rc-inp-input own-history-value">
                                {item.scheduleName}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="rc-inp-field">
                          <div className="rc-inp-row">
                            <span className="rc-inp-label">日付</span>
                            <div
                              className="rc-inp-shell"
                              aria-disabled="true"
                            >
                              <div className="rc-inp-input own-history-value">
                                {item.date ? fmtDate(item.date) : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="detailbar-gmaps-row">
                          <button
                            type="button"
                            className="detailbar-gmaps-button"
                            disabled={!hubUrl}
                            onClick={() => openHub(item)}
                          >
                            RD Hubへ
                          </button>
                        </div>
                      </div>
                    </div>

                    {editable && (
                      <button
                        type="button"
                        className="add-area-button detailbar-add-button"
                        onClick={() => handleDelete(idx, item)}
                      >
                        紐づけを解除する
                      </button>
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
