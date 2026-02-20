// src/pages/parts/ColorPickerPopover.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";

const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 200;
const GAP = 12;

type Props = {
  color: string;
  fillOpacity: number;
  onChange: (color: string) => void;
  onOpacityChange: (fillOpacity: number) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
};

/** 視覚選択のみのカラーピッカー（RGB/HSL/HEX入力なし）+ 透明度スライダー */
export default function ColorPickerPopover({
  color,
  fillOpacity,
  onChange,
  onOpacityChange,
  onClose,
  anchorEl,
}: Props) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!anchorEl || typeof document === "undefined") return;
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;

    // 上に表示するスペースがあるか
    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const preferAbove = spaceAbove >= spaceBelow;

    if (preferAbove && spaceAbove >= POPOVER_HEIGHT + GAP) {
      top = rect.top - POPOVER_HEIGHT - GAP;
    } else if (spaceBelow >= POPOVER_HEIGHT + GAP) {
      top = rect.bottom + GAP;
    } else {
      // スペースが足りない場合は画面内に収める
      top = Math.max(GAP, Math.min(vh - POPOVER_HEIGHT - GAP, rect.top - POPOVER_HEIGHT - GAP));
    }

    // 横方向: アンカーの左端に合わせるが、はみ出さないように
    left = rect.left;
    if (left + POPOVER_WIDTH > vw - GAP) {
      left = vw - POPOVER_WIDTH - GAP;
    }
    if (left < GAP) {
      left = GAP;
    }

    setPosition({ top, left });
  }, [anchorEl]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  // ズーム倍率変更・リサイズ時に位置を再計算
  useEffect(() => {
    const vv = window.visualViewport;
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    vv?.addEventListener("resize", onResize);
    vv?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
      vv?.removeEventListener("scroll", onResize);
    };
  }, [updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        anchorEl?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorEl]);

  const content = (
    <div
      ref={popoverRef}
      className="color-picker-popover"
      role="dialog"
      aria-label="色と透明度を選択"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <HexColorPicker color={color} onChange={onChange} />
      <div className="color-picker-popover__opacity">
        <label className="color-picker-popover__opacity-label">
          <span>透明度</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(fillOpacity * 100)}
            onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
            className="color-picker-popover__opacity-slider"
            aria-label="透明度"
          />
        </label>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
