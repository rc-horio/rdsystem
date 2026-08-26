// features/hub/tabs/AreaInfo/sections/layout/DesktopPanel.tsx
import { useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { MapCard, LandingAreaFigure, RightPanel } from "..";
import type { MapCardHandle } from "../MapCard";
import type { AreaInfo } from "../..";
import { resolveConfirmedGeometry } from "@/features/hub/utils/flightFigures";

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  areaName: string | null;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
  geometry?: any | null;
  onScreenshotCaptured?: (dataUrl: string) => void;
  mapCardRef?: RefObject<MapCardHandle>;
};

const COL_GAP_PX = 4;

export default function DesktopPanel({
  edit,
  area,
  onPatchArea,
  onExportPdf,
  onExportPptx,
  areaName,
  projectUuid,
  scheduleUuid,
  geometry,
  onScreenshotCaptured,
  mapCardRef,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const spacingBoxRef = useRef<HTMLDivElement>(null);
  const [rowMinWidthPx, setRowMinWidthPx] = useState<number | undefined>(
    undefined
  );

  useLayoutEffect(() => {
    const row = rowRef.current;
    const spacing = spacingBoxRef.current;
    const parent = row?.parentElement;
    if (!row || !spacing || !parent) return;

    const update = () => {
      const right = row.querySelector("[data-area-right-pane]");
      const parentW = parent.clientWidth;
      const rightW =
        right instanceof HTMLElement
          ? right.getBoundingClientRect().width
          : 260;
      const defaultLeft = Math.max(0, parentW - rightW - COL_GAP_PX);
      const spacingW = Math.ceil(spacing.scrollWidth);
      // カード内 2:3 なので、間隔図は左ペインの約 3/5。足りないときだけ行を広げる
      const CARD_PAD_X = 64;
      const CARD_GAP_X = 32;
      const neededCard = Math.ceil((spacingW * 5) / 3 + CARD_PAD_X + CARD_GAP_X);
      if (neededCard > defaultLeft + 1) {
        setRowMinWidthPx(neededCard + rightW + COL_GAP_PX);
      } else {
        setRowMinWidthPx(undefined);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(spacing);
    ro.observe(parent);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [area]);

  return (
    // 既定は画面内の 4:1。間隔図が左の定幅を超えたときだけ minWidth で行を広げ、ボディが横スクロールする
    <div
      ref={rowRef}
      className="grid w-full min-w-0 grid-cols-[minmax(0,3fr)_minmax(16.25rem,1fr)] items-start gap-x-1"
      style={rowMinWidthPx != null ? { minWidth: rowMinWidthPx } : undefined}
    >
      <div className="relative min-w-0 pr-6 lg:pr-4">
        <div className="absolute inset-y-0 right-0 w-px bg-red-900/40 pointer-events-none" />

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-200">
            ダンスファイル指示書出力
          </span>

          <div className="inline-flex overflow-hidden rounded-md border border-slate-600">
            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1 text-sm hover:bg-slate-700 cursor-pointer"
            >
              PDF
            </button>
            <div className="w-px bg-slate-600" />
            <button
              type="button"
              onClick={onExportPptx}
              className="px-3 py-1 text-sm hover:bg-slate-700 cursor-pointer"
            >
              PPTX
            </button>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="w-full min-w-0 overflow-hidden">
            <MapCard
              ref={mapCardRef}
              areaName={areaName}
              projectUuid={projectUuid ?? undefined}
              scheduleUuid={scheduleUuid ?? undefined}
              geometry={resolveConfirmedGeometry(area) ?? (area as any)?.geometry ?? null}
              onScreenshotCaptured={onScreenshotCaptured}
            />
          </div>
          <LandingAreaFigure
            edit={edit}
            area={area}
            onPatchArea={onPatchArea}
            spacingBoxRef={spacingBoxRef}
          />
        </div>
      </div>

      <div data-area-right-pane className="pl-3 lg:pl-4">
        <RightPanel edit={edit} area={area} onPatchArea={onPatchArea} />
      </div>
    </div>
  );
}
