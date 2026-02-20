// src/pages/parts/useDraggablePanel.ts
import { useEffect, useRef } from "react";

const DEFAULT_EXCLUDE = ["input", "select", "textarea", "button", "label"];

/** ドラッグで移動できるパネルをビューポート内に制限し、スクロールバーを表示しない */
export function useDraggablePanel(
  panelRef: React.RefObject<HTMLElement | null>,
  options?: {
    /** ドラッグ開始を除外するセレクタ（例: .color-picker-popover） */
    exclude?: string[];
    /** ドラッグを有効にする条件（false のときはリスナーを登録しない） */
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const excludeRef = useRef(options?.exclude ?? DEFAULT_EXCLUDE);
  excludeRef.current = options?.exclude ?? DEFAULT_EXCLUDE;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !enabled) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (excludeRef.current.some((sel) => target.closest(sel))) {
        return;
      }
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.classList.add("dragging");
      // 位置を固定に切り替え（ビューポート基準でスクロールバーを防ぐ）
      panel.style.position = "fixed";
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      document.body.style.overflow = "hidden";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = e.clientX - offsetX;
      let top = e.clientY - offsetY;

      // ビューポート内に制限
      left = Math.max(0, Math.min(vw - rect.width, left));
      top = Math.max(0, Math.min(vh - rect.height, top));

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.classList.remove("dragging");
      document.body.style.overflow = "";
    };

    panel.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      panel.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.overflow = "";
    };
  }, [panelRef, enabled]);
}
