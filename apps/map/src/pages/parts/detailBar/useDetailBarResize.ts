import { useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

const DETAILBAR_MIN_W = 280;
const DETAILBAR_MAX_W = 500;
const DETAILBAR_STORAGE_KEY = "detailbar-width";

function getDetailbarWidth() {
  const v = getComputedStyle(document.documentElement).getPropertyValue(
    "--detailbar-w"
  );
  return parseInt(v, 10) || 300;
}

function setDetailbarWidth(px: number) {
  const clamped = Math.min(DETAILBAR_MAX_W, Math.max(DETAILBAR_MIN_W, px));
  document.documentElement.style.setProperty("--detailbar-w", `${clamped}px`);
  return clamped;
}

export function useDetailBarResize() {
  const handleResizeMouseDown = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getDetailbarWidth();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setDetailbarWidth(startWidth + deltaX);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("detailbar-resizing");
      try {
        localStorage.setItem(
          DETAILBAR_STORAGE_KEY,
          String(getDetailbarWidth())
        );
      } catch {
        /* noop */
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.classList.add("detailbar-resizing");
  }, []);

  return { handleResizeMouseDown };
}
