import { useCallback } from "react";
import { ONButton } from "../atoms/buttons/ONButton";
import { OFFButton } from "../atoms/buttons/OFFButton";

/* =========================
   編集モード切替ボタン
   ========================= */
type EditModeSwitchProps = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  isMobile: boolean;
  className?: string;
  onLabel?: string; // 例: "ON（編集モード）"
  offLabel?: string; // 例: "OFF（閲覧モード）"
};

/* =========================
   編集モード切替ボタン
   ========================= */
export function EditModeSwitch({
  edit,
  setEdit,
  onLabel = "ON（編集モード）",
  offLabel = "OFF（閲覧モード）",
  isMobile = false,
}: EditModeSwitchProps & { isMobile?: boolean }) {
  const turnOn = useCallback(() => setEdit(true), [setEdit]);
  const turnOff = useCallback(() => setEdit(false), [setEdit]);
  // ★編集ON/OFFモード切替ボタンのサイズ変更
  const btnSize = isMobile ? "h-12" : "h-8";
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="編集モード切替"
    >
      {edit ? (
        <ONButton
          onClick={turnOff}
          title={onLabel}
          isMobile={isMobile}
          className={btnSize}
        />
      ) : (
        <OFFButton
          onClick={turnOn}
          title={offLabel}
          isMobile={isMobile}
          className={btnSize}
        />
      )}
    </div>
  );
}
