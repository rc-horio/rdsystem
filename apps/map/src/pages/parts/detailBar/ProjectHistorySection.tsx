import type { MouseEvent as ReactMouseEvent } from "react";
import { DeleteIconButton, DetailIconButton } from "@/components";
import type { HistoryItem } from "@/features/types";
import { buildHubUrl, fmtDate } from "./helpers";

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  editable: boolean;
  onSelect: (item: HistoryItem, idx: number) => void;
  onDelete: (idx: number, item: HistoryItem) => void;
  onRegisterProject: () => void;
};

export function ProjectHistorySection({
  history,
  selectedHistoryIdx,
  editable,
  onSelect,
  onDelete,
  onRegisterProject,
}: Props) {
  return (
    <div className="ds-record-section">
      <div className="ds-record-section-title">案件</div>

      <div className="ds-record-list">
        {history.length === 0 ? (
          <div className="ds-record-empty" aria-live="polite">
            履歴はありません
          </div>
        ) : (
          history.map((item, i) => {
            const selected = selectedHistoryIdx === i;
            return (
              <div
                key={`${item.projectName}-${item.scheduleName}-${item.date}-${i}`}
                className={`ds-record-row ${selected ? "is-selected" : ""}`}
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(item, i)}
              >
                <span
                  className="ds-record-leftgap"
                  onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation();
                  }}
                >
                  <DetailIconButton
                    title="RD Hubへ"
                    height={18}
                    onClick={() => {
                      const url = buildHubUrl(
                        item.projectUuid,
                        item.date,
                        item.scheduleUuid
                      );
                      if (!url) {
                        console.warn(
                          "[detailbar] projectUuid is missing. cannot navigate to hub.",
                          item
                        );
                        return;
                      }
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  />{" "}
                </span>

                <span className="ds-record-date">{fmtDate(item.date)}</span>
                <span className="ds-record-name">{item.projectName}</span>
                <span className="ds-record-schedule">{item.scheduleName}</span>

                {editable && (
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
                      title="この履歴を削除"
                      tabIndex={editable ? 0 : -1}
                      onClick={() => {
                        if (!editable) return;
                        onDelete(i, item);
                      }}
                    />
                  </span>
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
