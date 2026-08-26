import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  EMPTY_OTHER_RECORD,
  OtherRecordCard,
  type OtherRecord,
} from "./OtherRecordCard";

type Props = {
  records: OtherRecord[];
  editable: boolean;
  onRecordsChange: Dispatch<SetStateAction<OtherRecord[]>>;
};

export function OtherCompanyPanel({
  records,
  editable,
  onRecordsChange,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx != null && openIdx >= records.length) {
      setOpenIdx(null);
    }
  }, [openIdx, records.length]);

  const addRecord = () => {
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
    window.alert("実績を削除しました。\nSAVEボタンで確定してください。");
  };

  const patchRecord = (idx: number, patch: Partial<OtherRecord>) => {
    onRecordsChange((prev) =>
      prev.map((record, i) => (i === idx ? { ...record, ...patch } : record))
    );
  };

  return (
    <section role="tabpanel" aria-label="他社">
      <div className="ds-record-section">
        <div className="ds-record-list">
          {records.length === 0 && !editable ? (
            <div className="other-record-empty" aria-live="polite">
              実績は登録されていません。
            </div>
          ) : (
            records.map((record, idx) => (
              <OtherRecordCard
                key={idx}
                record={record}
                editable={editable}
                open={openIdx === idx}
                onToggle={() =>
                  setOpenIdx((current) => (current === idx ? null : idx))
                }
                onPatch={(patch) => patchRecord(idx, patch)}
                onDelete={() => deleteRecord(idx, record)}
              />
            ))
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
