// src/components/modal/FormModal.tsx
import { SaveButton } from "@/components";
import { Modal } from "./Modal";

/* =========================
   フォームモーダル
   ========================= */
type FormModalProps = {
  show: boolean;
  onClose: () => void;
  /** モーダル上部のタイトル。未指定なら非表示 */
  title?: React.ReactNode;
  /** 保存ボタンが押されたとき。未指定なら onClose を既定動作に */
  onSave?: () => void;
  /** 保存ボタンを無効化したい場合 */
  saveDisabled?: boolean;
  /** フッター全体を差し替えたい場合（指定時は SaveButton は出しません） */
  footer?: React.ReactNode;
  /** 本文 */
  children: React.ReactNode;
  panelClassName?: string;
};

export function FormModal({
  show,
  onClose,
  title,
  onSave,
  saveDisabled,
  footer,
  children,
  panelClassName,
}: FormModalProps) {
  return (
    <Modal show={show} onClose={onClose} panelClassName={panelClassName}>
      <div className="space-y-4">
        {title ? (
          <h3 className="text-center text-2xl font-semibold mb-2">{title}</h3>
        ) : null}

        <div className="mt-2">{children}</div>

        <div className="text-center mt-6">
          {footer === null ? null : footer ? (
            footer
          ) : (
            <SaveButton onClick={onSave ?? onClose} disabled={saveDisabled} />
          )}
        </div>
      </div>
    </Modal>
  );
}
