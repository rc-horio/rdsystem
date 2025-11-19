// src/pages/parts/RegisterProjectModal.tsx
import { BaseModal } from "@/components";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RegisterProjectModal({ open, onClose }: Props) {
  return (
    <BaseModal open={open} onClose={onClose} title="案件情報を登録">
      <div className="new-area-modal no-caret">
        {/* TODO: 後で案件情報フォームを実装 */}
        <p className="new-area-modal__label" style={{ marginBottom: 12 }}>
          ここに案件情報の入力フォームを配置します。
        </p>

        <div className="new-area-modal__actions">
          <button
            type="button"
            className="new-area-modal__btn new-area-modal__btn--cancel"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
