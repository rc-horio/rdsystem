// src/components/modal/Modal.tsx
import { createPortal } from "react-dom";
import clsx from "clsx";
import { HiddenIconButton } from "@/components";

/* =========================
   モーダル（body直下にレンダリング、ヘッダー含め全画面オーバーレイ）
   ========================= */
export function Modal({
  show,
  onClose,
  children,
  panelClassName,
  showCloseButton = true,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  showCloseButton?: boolean;
}) {
  if (!show) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* オーバーレイ：全画面（ヘッダー含む） */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
      />

      {/* パネル：シャドウ・ボーダー・アニメーション */}
      <div
        className={clsx(
          panelClassName ?? "w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]",
          "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl animate-modal-in"
        )}
      >
        {/* 上部のアクセントライン */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* 閉じるボタン：角の内側に十分な余白で配置（見切れ防止） */}
        {showCloseButton && (
          <div className="absolute right-6 top-6 z-10">
            <HiddenIconButton
              onClick={onClose}
              className="rounded-lg w-9 h-9 hover:bg-white/10"
              title="閉じる"
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-14">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
