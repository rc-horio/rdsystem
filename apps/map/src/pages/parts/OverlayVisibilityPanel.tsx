// src/pages/parts/OverlayVisibilityPanel.tsx
import { useEffect, useRef, type ChangeEvent } from "react";
import type { OverlayVisibility } from "./overlayVisibility";
import { detectEmbedMode } from "@/components";

type Props = {
  visibility: OverlayVisibility;
  onVisibilityChange: (v: OverlayVisibility) => void;
  visible: boolean;
};

export default function OverlayVisibilityPanel({
  visibility,
  onVisibilityChange,
  visible,
}: Props) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !visible) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input[type='checkbox']") || target.closest("label")) {
        return;
      }
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.classList.add("dragging");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };

    const onMouseUp = () => {
      isDragging = false;
      panel.classList.remove("dragging");
    };

    panel.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      panel.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [visible]);

  const handleChange = (key: keyof OverlayVisibility) => (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const next = { ...visibility, [key]: checked };
    onVisibilityChange(next);
  };

  const flightChecked = visibility.flight;
  const safetyDisabled = !flightChecked;

  if (typeof window !== "undefined" && detectEmbedMode()) {
    return null;
  }

  if (!visible) return null;

  return (
    <aside
      ref={panelRef}
      className="overlay-visibility-panel"
      aria-label="表示切り替え"
    >
      <div className="overlay-visibility-panel__title">表示</div>
      <div className="overlay-visibility-panel__items">
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.takeoff}
            onChange={handleChange("takeoff")}
            aria-label="離発着エリア"
          />
          <span>離発着</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.flight}
            onChange={handleChange("flight")}
            aria-label="飛行エリア"
          />
          <span>飛行</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.safety}
            onChange={handleChange("safety")}
            disabled={safetyDisabled}
            aria-label="保安エリア（飛行表示時のみ）"
          />
          <span>保安</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.audience}
            onChange={handleChange("audience")}
            aria-label="観客エリア"
          />
          <span>観客</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.arrows}
            onChange={handleChange("arrows")}
            aria-label="矢印（線）"
          />
          <span>矢印</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.labels}
            onChange={handleChange("labels")}
            aria-label="距離ラベル"
          />
          <span>ラベル</span>
        </label>
        <label className="overlay-visibility-panel__item">
          <input
            type="checkbox"
            checked={visibility.diameterLines}
            onChange={handleChange("diameterLines")}
            aria-label="直径延長線"
          />
          <span>直径線</span>
        </label>
      </div>
    </aside>
  );
}
