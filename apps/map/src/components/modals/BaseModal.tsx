// src/components/modals/BaseModal.tsx
import { useEffect } from "react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 画面ごとに足したいクラス（任意） */
  backdropClassName?: string;
  containerClassName?: string;
};

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
  backdropClassName,
  containerClassName,
}) => {
  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const baseBackdrop = "modal-backdrop";
  const baseContainer = "modal-container";

  const backdropCls = [baseBackdrop, backdropClassName]
    .filter(Boolean)
    .join(" ");
  const containerCls = [baseContainer, containerClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={backdropCls} role="presentation" onClick={onClose}>
      <div
        className={containerCls}
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
