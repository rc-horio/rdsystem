// src/pages/parts/RegisterProjectModal.tsx
import { BaseModal } from "@/components";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RegisterProjectModal({ open, onClose }: Props) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="案件情報を紐づける"
      backdropClassName="map-modal-backdrop"
      containerClassName="map-modal-container"
    >
      <div className="register-project-modal no-caret">
        {/* 案件名（必須） */}
        <div className="register-project-modal__row">
          <label
            htmlFor="projectName"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">案件名(必須)</span>
          </label>
          <select
            id="projectName"
            name="projectName"
            required
            className="register-project-modal__input register-project-modal__select"
            defaultValue=""
          >
            <option value="" disabled>
              案件を選択してください
            </option>
            {/* TODO: 後で案件名の選択肢を連携 */}
          </select>
        </div>

        {/* スケジュール（必須） */}
        <div className="register-project-modal__row">
          <label
            htmlFor="schedule"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">
              スケジュール(必須)
            </span>
          </label>
          <select
            id="schedule"
            name="schedule"
            required
            className="register-project-modal__input register-project-modal__select"
            defaultValue=""
          >
            <option value="" disabled>
              スケジュールを選択してください
            </option>
            {/* TODO: 後でスケジュールの選択肢を連携 */}
          </select>
        </div>

        {/* 候補地（任意） */}
        <div className="register-project-modal__row">
          <label
            htmlFor="candidate"
            className="register-project-modal__label-row"
          >
            <span className="register-project-modal__label">候補地(任意)</span>
          </label>
          <select
            id="candidate"
            name="candidate"
            className="register-project-modal__input register-project-modal__select"
            defaultValue=""
          >
            <option value="">指定しない（未選択）</option>
            {/* TODO: 後で候補地の選択肢を連携 */}
          </select>
        </div>

        {/* ボタン行 */}
        <div className="register-project-modal__actions">
          <button
            type="button"
            className="register-project-modal__btn register-project-modal__btn--cancel"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="register-project-modal__btn register-project-modal__btn--ok"
            onClick={onClose} // TODO: 後で登録処理に差し替え
          >
            OK
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
