// src/pages/parts/hook/useDraggableMetricsPanel.ts
import { useEffect } from "react";

// メトリクスパネルのドラッグ&ドロップ
export function useDraggableMetricsPanel() {
    useEffect(() => {
        const panel = document.querySelector(
            ".geom-metrics-panel"
        ) as HTMLDivElement | null;
        if (!panel) return;

        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.classList.add("dragging");
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
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
    }, []);
}
