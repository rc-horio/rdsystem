// features/hub/tabs/AreaInfo/index.tsx
import { useRef, useState } from "react";
import DesktopPanel from "./sections/layout/DesktopPanel";
import MobilePanel from "./sections/layout/MobilePanel";
import { exportDanceSpecPdfFromHtml, exportDanceSpecPptxFromHtml } from "./exports/danceSpec"; // 例：新しいindex.tsに寄せる
import type { MapCardHandle } from "./sections/MapCard";

export type AreaInfo = any;

type Props = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: AreaInfo | null;
  onPatchArea: (patch: Partial<AreaInfo>) => void;
  projectName?: string; // 案件名（任意）
  scheduleLabel?: string; // スケジュール名（任意）
  projectUuid?: string | null;
  scheduleUuid?: string | null;
};

export default function AreaInfoTab({
  edit,
  setEdit,
  area,
  onPatchArea,
  projectName = "案件名",
  scheduleLabel = "",
  projectUuid,
  scheduleUuid,
}: Props) {
  const mapCardRef = useRef<MapCardHandle | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const requestMapScreenshot = async () => {
    try {
      return await mapCardRef.current?.requestScreenshot?.();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "スクリーンショットの作成に失敗しました。";
      window.alert(msg);
      return null;
    }
  };

  const runExport = async (fn: () => Promise<void>) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await fn();
    } finally {
      setIsExporting(false);
    }
  };

  // ダンスファイル指示書(PDF)を出力
  const onExportPdf = () =>
    runExport(async () => {
      const mapScreenshotDataUrl = await requestMapScreenshot();
      await exportDanceSpecPdfFromHtml({
        projectName,
        scheduleLabel,
        gradPx: 3,
        area,
        mapScreenshotDataUrl,
      });
    });

  // ダンスファイル指示書(PPTX)を出力
  const onExportPptx = () =>
    runExport(async () => {
      const mapScreenshotDataUrl = await requestMapScreenshot();
      await exportDanceSpecPptxFromHtml({
        projectName,
        scheduleLabel,
        gradPx: 3,
        area,
        mapScreenshotDataUrl,
      });
    });

  // いったん state で selectedAreaName は持たず、area だけを見る
  const areaName = area?.area_name ?? null;


  return (
    <div className="space-y-8 pb-24 relative">
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative flex items-center justify-center px-7 py-6 text-white">
            <div className="relative w-[240px] h-[260px]">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 240 180"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
              <defs>
                <pattern
                  id="rd-led-dots"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.05;0.9;0.2;1;0.1;0.8;0.05" keyTimes="0;0.14;0.33;0.47;0.68;0.86;1" dur="2.3s" begin="-0.23s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="3" cy="1" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.08;1;0.15;0.85;0.2;1;0.07" keyTimes="0;0.21;0.38;0.5;0.71;0.86;1" dur="3.1s" begin="-1.41s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="5" cy="1" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.1;0.7;0.2;1;0.12;0.9;0.06" keyTimes="0;0.12;0.28;0.45;0.66;0.82;1" dur="1.7s" begin="-0.77s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="7" cy="1" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.06;0.95;0.14;0.8;0.2;1;0.05" keyTimes="0;0.18;0.31;0.49;0.7;0.88;1" dur="3.6s" begin="-2.02s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="1" cy="3" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.04;0.85;0.16;1;0.1;0.7;0.05" keyTimes="0;0.17;0.29;0.44;0.63;0.81;1" dur="2.8s" begin="-0.63s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="3" cy="3" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.12;1;0.22;0.9;0.15;1;0.08" keyTimes="0;0.2;0.37;0.52;0.7;0.88;1" dur="1.9s" begin="-1.17s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="5" cy="3" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.09;0.8;0.2;1;0.1;0.85;0.06" keyTimes="0;0.13;0.33;0.5;0.69;0.84;1" dur="3.4s" begin="-2.35s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="7" cy="3" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.07;1;0.18;0.75;0.2;1;0.05" keyTimes="0;0.22;0.4;0.55;0.73;0.9;1" dur="2.1s" begin="-0.95s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="1" cy="5" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.05;0.92;0.14;1;0.1;0.8;0.06" keyTimes="0;0.16;0.31;0.46;0.65;0.82;1" dur="3.9s" begin="-1.81s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="3" cy="5" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.11;1;0.23;0.88;0.18;1;0.09" keyTimes="0;0.19;0.36;0.51;0.72;0.89;1" dur="1.6s" begin="-0.39s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="5" cy="5" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.06;0.9;0.16;1;0.12;0.82;0.05" keyTimes="0;0.15;0.3;0.48;0.67;0.83;1" dur="2.7s" begin="-1.56s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="7" cy="5" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.1;1;0.2;0.78;0.22;1;0.08" keyTimes="0;0.2;0.37;0.54;0.74;0.9;1" dur="2.2s" begin="-2.11s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="1" cy="7" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.08;0.9;0.19;1;0.12;0.8;0.06" keyTimes="0;0.18;0.34;0.5;0.69;0.86;1" dur="2.5s" begin="-0.71s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="3" cy="7" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.04;1;0.15;0.78;0.2;0.95;0.05" keyTimes="0;0.21;0.39;0.56;0.73;0.9;1" dur="3.2s" begin="-1.93s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="5" cy="7" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.12;0.85;0.24;1;0.18;0.9;0.07" keyTimes="0;0.14;0.32;0.49;0.68;0.84;1" dur="1.9s" begin="-0.57s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="7" cy="7" r="0.8" fill="#ff3b3b" filter="url(#rd-led-glow)">
                    <animate attributeName="opacity" values="0.07;1;0.17;0.82;0.2;1;0.06" keyTimes="0;0.2;0.38;0.55;0.72;0.88;1" dur="3.6s" begin="-2.48s" repeatCount="indefinite" />
                  </circle>
                </pattern>
                <filter id="rd-led-glow" filterUnits="userSpaceOnUse" x="-6" y="-6" width="16" height="16">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blurWhite" />
                  <feColorMatrix
                    in="blurWhite"
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 1.4 0"
                    result="glowWhite"
                  />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.4" result="blurRed" />
                  <feColorMatrix
                    in="blurRed"
                    type="matrix"
                    values="1 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 1.0 0"
                    result="glowRed"
                  />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blurRedFar" />
                  <feColorMatrix
                    in="blurRedFar"
                    type="matrix"
                    values="1 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0.6 0"
                    result="glowRedFar"
                  />
                  <feMerge>
                    <feMergeNode in="glowRedFar" />
                    <feMergeNode in="glowRed" />
                    <feMergeNode in="glowWhite" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <mask id="rd-logo-mask">
                  <rect width="240" height="180" fill="black" />
                  <text
                    x="28"
                    y="50"
                    fill="white"
                    fontSize="38"
                    fontWeight="800"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    textLength="158"
                    lengthAdjust="spacingAndGlyphs"
                    transform="scale(1 1.28)"
                    style={{ transformOrigin: "28px 50px" }}
                  >
                    RED
                    <tspan dx="-3"> C</tspan>
                    <tspan dx="0" fontWeight="900">L</tspan>
                    <tspan fontWeight="900">I</tspan>
                    FF
                  </text>
                  <g fill="white" transform="translate(0 -12)">
                    <path d="M34 72 C32 72 31 74 31 78 C31 84 33 88 34 96 C35 88 37 84 37 78 C37 74 36 72 34 72 Z" />
                    <path d="M58 72 C57 72 55 75 55 82 C55 94 58 102 58 104 C58 102 61 94 61 82 C61 75 59 72 58 72 Z" />
                    <path d="M82 72 C81 72 79 75 79 82 C79 94 82 124 82 126 C82 124 85 94 85 82 C85 75 83 72 82 72 Z" />
                    <path d="M106 72 C105 72 103 75 103 82 C103 94 106 134 106 136 C106 134 109 94 109 82 C109 75 107 72 106 72 Z" />
                    <path d="M130 72 C129 72 127 75 127 82 C127 94 130 124 130 126 C130 124 133 94 133 82 C133 75 131 72 130 72 Z" />
                    <path d="M154 72 C153 72 151 75 151 82 C151 94 154 102 154 104 C154 102 157 94 157 82 C157 75 155 72 154 72 Z" />
                    <path d="M178 72 C176 72 175 74 175 78 C175 84 177 88 178 96 C179 88 181 84 181 78 C181 74 180 72 178 72 Z" />
                  </g>
                </mask>
              </defs>
                <rect
                  width="240"
                  height="180"
                  fill="url(#rd-led-dots)"
                  mask="url(#rd-logo-mask)"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
      {/* SP */}
      <div className="md:hidden">
        <MobilePanel
          onExportPdf={onExportPdf}
          onExportPptx={onExportPptx}
          edit={edit}
          setEdit={setEdit}
          area={area}
          onPatchArea={onPatchArea}
          areaName={areaName}
          projectUuid={projectUuid}
          scheduleUuid={scheduleUuid}
          mapCardRef={mapCardRef}
        />
      </div>
      {/* PC */}
      <div className="hidden md:block">
        <DesktopPanel
          edit={edit}
          setEdit={setEdit}
          area={area}
          onPatchArea={onPatchArea}
          onExportPdf={onExportPdf}
          onExportPptx={onExportPptx}
          areaName={areaName}
          projectUuid={projectUuid}
          scheduleUuid={scheduleUuid}
          mapCardRef={mapCardRef}
        />
      </div>
    </div>
  );
}
