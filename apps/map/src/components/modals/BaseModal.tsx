// src\components\modals\BaseModal.tsx
import { useEffect } from "react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose} // 背景クリックで閉じる
    >
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        onClick={(e) => e.stopPropagation()} // 中身クリックで閉じない
      >
        {title && (
          <header className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              type="button"
              className="modal-close-button"
              onClick={onClose}
              aria-label="閉じる"
            >
              ×
            </button>
          </header>
        )}

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
