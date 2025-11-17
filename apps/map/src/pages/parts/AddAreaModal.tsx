// src/pages/parts/AddAreaModal.tsx
import { BaseModal } from "@/components";

type NewAreaDraft = {
  lat: number;
  lng: number;
  prefecture: string | null;
  address: string | null;
};

type Props = {
  open: boolean;
  draft: NewAreaDraft | null;
  areaName: string;
  onChangeAreaName: (v: string) => void;
  onCancel: () => void;
  onOk: () => void;
};

export function AddAreaModal({
  open,
  draft,
  areaName,
  onChangeAreaName,
  onCancel,
  onOk,
}: Props) {
  if (!draft) return null;

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      title="エリア名を記入してください。"
    >
      <div className="new-area-modal no-caret">
        <div className="new-area-modal__row">
          <label className="new-area-modal__label">
            エリア名:
            <input
              type="text"
              value={areaName}
              onChange={(e) => onChangeAreaName(e.target.value)}
              className="new-area-modal__input"
              placeholder=""
            />
          </label>
        </div>

        <div className="new-area-modal__row">
          <span className="new-area-modal__label">住所:</span>
          <span>{draft.address ?? "不明"}</span>
        </div>
        <div className="new-area-modal__row">
          <span className="new-area-modal__label">座標:</span>
          <span>
            {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
          </span>
        </div>

        <div className="new-area-modal__actions">
          <button
            type="button"
            className="new-area-modal__btn new-area-modal__btn--cancel"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="new-area-modal__btn new-area-modal__btn--ok"
            disabled={!areaName.trim()}
            onClick={() => {
              if (!areaName.trim()) return;
              onOk();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
