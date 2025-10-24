// src/components/modal/Modal.tsx
import clsx from "clsx";
import { HiddenIconButton } from "@/components";

/* =========================
   モーダル
   ========================= */
export function Modal({
  show,
  onClose,
  children,
  panelClassName,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* 背景：透過なし */}
      <div onClick={onClose} className="absolute bg-black/60 inset-0" />

      {/* パネル：黒色90%透過 + ぼかし */}
      <div
        className={clsx(
          // panelClassName が無ければデフォルトを適用
          panelClassName ?? "w-[90vw] max-w-md",
          "relative bg-black/40 backdrop-blur-lg rounded-xl p-6"
        )}
      >
        <div className="flex justify-end">
          <HiddenIconButton
            onClick={onClose}
            className="rounded-lg w-9 h-9"
            title="閉じる"
          />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
