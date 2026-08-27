// src/components/modals/BaseModal.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 画面ごとに足したいクラス（任意） */
  backdropClassName?: string;
  containerClassName?: string;
  /** false のとき ×・Esc・外側クリックでは閉じない */
  dismissible?: boolean;
};

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
  backdropClassName,
  containerClassName,
  dismissible = true,
}) => {
  useEffect(() => {
    if (!open || !dismissible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, dismissible]);

  if (!open) return null;

  const backdropCls = ["modal-backdrop", backdropClassName]
    .filter(Boolean)
    .join(" ");
  const containerCls = ["modal-container", containerClassName]
    .filter(Boolean)
    .join(" ");

  const portalTarget =
    document.querySelector(".map-page") ?? document.body;

  return createPortal(
    <div
      className={backdropCls}
      role="presentation"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        className={containerCls}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="modal-header">
            <h2 id="modal-title">{title}</h2>
            {dismissible ? (
              <button
                type="button"
                className="modal-close-button"
                onClick={onClose}
                aria-label="閉じる"
              >
                ×
              </button>
            ) : null}
          </header>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    portalTarget
  );
};
