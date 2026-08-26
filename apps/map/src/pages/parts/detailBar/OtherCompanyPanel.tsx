import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  EMPTY_OTHER_RECORD,
  OtherRecordCard,
  type OtherFlightFigure,
  type OtherRecord,
} from "./OtherRecordCard";
import { isEmptyOtherRecord } from "./helpers";
import type { CopySourceTree } from "./flightFigureCopy";

export type OtherFigureSelection = {
  recordIdx: number;
  figureIdx: number;
};

type Props = {
  records: OtherRecord[];
  editable: boolean;
  selectedFigure: OtherFigureSelection | null;
  onRecordsChange: Dispatch<SetStateAction<OtherRecord[]>>;
  onHighlightFigure: (recordIdx: number, figureIdx: number) => void;
  onActivateFigure: (
    recordIdx: number,
    figureIdx: number,
    figure: OtherFlightFigure
  ) => void;
  onFigureRemoved: (recordIdx: number, figureIdx: number) => void;
  onRecordRemoved: (recordIdx: number) => void;
  copySources: CopySourceTree;
  onClearConsideringCandidates?: (sourceIndex: number) => void;
};

export function OtherCompanyPanel({
  records,
  editable,
  selectedFigure,
  onRecordsChange,
  onHighlightFigure,
  onActivateFigure,
  onFigureRemoved,
  onRecordRemoved,
  copySources,
  onClearConsideringCandidates,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx != null && openIdx >= records.length) {
      setOpenIdx(null);
    }
  }, [openIdx, records.length]);

  const addRecord = () => {
    const emptyIdx = records.findIndex(isEmptyOtherRecord);
    if (emptyIdx >= 0) {
      setOpenIdx(emptyIdx);
      return;
    }
    const nextIdx = records.length;
    onRecordsChange((prev) => [...prev, { ...EMPTY_OTHER_RECORD, figures: [] }]);
    setOpenIdx(nextIdx);
  };

  const deleteRecord = (idx: number, record: OtherRecord) => {
    const label =
      record.eventName.trim() ||
      record.companyName.trim() ||
      "（無題の実績）";
    const ok = window.confirm(
      `実績「${label}」を削除してもよろしいですか？`
    );
    if (!ok) return;
    onRecordsChange((prev) => prev.filter((_, i) => i !== idx));
    setOpenIdx((current) => {
      if (current == null) return null;
      if (current === idx) return null;
      if (current > idx) return current - 1;
      return current;
    });
    onRecordRemoved(idx);
    window.alert("実績を削除しました。\nSAVEボタンで確定してください。");
  };

  const patchRecord = (idx: number, patch: Partial<OtherRecord>) => {
    onRecordsChange((prev) =>
      prev.map((record, i) => (i === idx ? { ...record, ...patch } : record))
    );
  };

  const hasVisibleRecords = editable
    ? records.length > 0
    : records.some((record) => !isEmptyOtherRecord(record));

  return (
    <section role="tabpanel" aria-label="他社">
      <div className="ds-record-section">
        <div className="ds-record-list">
          {!hasVisibleRecords && !editable ? (
            <div className="other-record-empty" aria-live="polite">
              実績は登録されていません。
            </div>
          ) : (
            records.map((record, idx) => {
              if (!editable && isEmptyOtherRecord(record)) return null;
              return (
                <OtherRecordCard
                  key={idx}
                  record={record}
                  editable={editable}
                  open={openIdx === idx}
                  selectedFigureIdx={
                    selectedFigure?.recordIdx === idx
                      ? selectedFigure.figureIdx
                      : null
                  }
                  onToggle={() =>
                    setOpenIdx((current) => (current === idx ? null : idx))
                  }
                  onPatch={(patch) => patchRecord(idx, patch)}
                  onDelete={() => deleteRecord(idx, record)}
                  onHighlightFigure={(figureIdx) =>
                    onHighlightFigure(idx, figureIdx)
                  }
                  onActivateFigure={(figureIdx, figure) =>
                    onActivateFigure(idx, figureIdx, figure)
                  }
                  onFigureRemoved={(figureIdx) =>
                    onFigureRemoved(idx, figureIdx)
                  }
                  copySources={copySources}
                  onClearConsideringCandidates={onClearConsideringCandidates}
                />
              );
            })
          )}
        </div>
        {editable && (
          <button
            type="button"
            className="add-area-button detailbar-add-button"
            onClick={addRecord}
          >
            <span className="add-icon">＋ </span>実績を追加する
          </button>
        )}
      </div>
    </section>
  );
}
