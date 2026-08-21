import { collapseUniformSpacing, fmtMeters } from "@/features/hub/utils/spacing";
import { isUnequalSpacingForExport, normalizeArea } from "./texts";

const LINE_END_GAP_PX = 6;
const LABEL_COL_W_PX = 92;
const DEFAULT_ICON_PX = 72;
const DEFAULT_GAP_PX = 88;

function tokens(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function labelOf(token: string): string {
  const n = Number(token);
  return Number.isFinite(n) && n > 0 ? `${fmtMeters(n)}m` : `${token}m`;
}

function exportDrone1Src(): string {
  return new URL(
    "0012_icon_drone1.png",
    new URL(import.meta.env.BASE_URL, window.location.origin)
  ).toString();
}

/** 2ページ目の並べる間隔を「次ページ」に差し替える。詳細ページが必要なら true */
export function applyPage2SpacingForExport(p2clone: HTMLElement, area: unknown): boolean {
  if (!isUnequalSpacingForExport(area)) return false;
  const wrap = p2clone.querySelector(".midbottom-figRow--spacing") as HTMLElement | null;
  if (!wrap) return true;
  wrap.innerHTML = "";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.minHeight = "140px";
  const span = document.createElement("span");
  span.className = "spacing-next-page";
  span.textContent = "次ページ";
  wrap.appendChild(span);
  return true;
}

function buildLFigure(opts: {
  seqX: string[];
  seqY: string[];
  rotationDeg: number;
  iconSrc: string;
  iconPx: number;
  gapPx: number;
}): HTMLElement {
  const colCount = Math.max(2, opts.seqX.length + 1);
  const rowCount = Math.max(2, opts.seqY.length + 1);
  const { iconPx, gapPx, iconSrc, rotationDeg } = opts;
  const gridW = colCount * iconPx + (colCount - 1) * gapPx;
  const gridH = rowCount * iconPx + (rowCount - 1) * gapPx;
  const inset = iconPx / 2 + LINE_END_GAP_PX;
  const centerAt = (i: number) => i * (iconPx + gapPx) + iconPx / 2;

  const hLines: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    const y = centerAt(r);
    for (let c = 0; c < colCount - 1; c++) {
      hLines.push(
        `<line x1="${centerAt(c) + inset}" y1="${y}" x2="${centerAt(c + 1) - inset}" y2="${y}" stroke="#888" stroke-width="1.5" />`
      );
    }
  }
  const vLines: string[] = [];
  for (let c = 0; c < colCount; c++) {
    const x = centerAt(c);
    for (let r = 0; r < rowCount - 1; r++) {
      vLines.push(
        `<line x1="${x}" y1="${centerAt(r) + inset}" x2="${x}" y2="${centerAt(r + 1) - inset}" stroke="#888" stroke-width="1.5" />`
      );
    }
  }

  const drones: string[] = [];
  for (let i = 0; i < colCount * rowCount; i++) {
    drones.push(
      `<img src="${iconSrc}" alt="" width="${iconPx}" height="${iconPx}" draggable="false" style="width:${iconPx}px;height:${iconPx}px;object-fit:contain;transform:rotate(${rotationDeg}deg);transform-origin:50% 50%;" />`
    );
  }

  const yLabels = [...opts.seqY].reverse().map((t, visualI) => {
    const isLast = visualI === opts.seqY.length - 1;
    return `<div style="height:${gapPx}px;margin-bottom:${isLast ? 0 : iconPx}px;display:flex;align-items:center;justify-content:flex-end;width:100%;font-size:18px;font-weight:600;color:#222;white-space:nowrap;">${labelOf(t)}</div>`;
  });

  const xLabels = opts.seqX.map((t, i) => {
    const isLast = i === opts.seqX.length - 1;
    return `<div style="width:${gapPx}px;height:${gapPx}px;margin-right:${isLast ? 0 : iconPx}px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:#222;white-space:nowrap;">${labelOf(t)}</div>`;
  });

  const root = document.createElement("div");
  root.style.display = "flex";
  root.style.flexDirection = "row";
  root.style.alignItems = "flex-start";
  root.style.color = "#222";
  root.innerHTML = `
    <div style="width:${LABEL_COL_W_PX}px;flex-shrink:0;padding-top:${iconPx}px;box-sizing:border-box;">
      ${yLabels.join("")}
    </div>
    <div>
      <div style="position:relative;width:${gridW}px;height:${gridH}px;">
        <svg width="${gridW}" height="${gridH}" style="position:absolute;inset:0;pointer-events:none;" aria-hidden="true">
          ${hLines.join("")}${vLines.join("")}
        </svg>
        <div style="display:grid;grid-template-columns:repeat(${colCount}, ${iconPx}px);gap:${gapPx}px;">
          ${drones.join("")}
        </div>
      </div>
      <div style="display:flex;padding-left:${iconPx}px;padding-top:10px;">
        ${xLabels.join("")}
      </div>
    </div>
  `;
  return root;
}

/** Hub と同じ L 字間隔図の白背景ページ（#page3） */
export function buildUnequalSpacingExportPage(areaInput: unknown, headerText = "並べる間隔"): HTMLElement {
  const area = normalizeArea(areaInput);
  const collapsed = collapseUniformSpacing(area?.spacing_between_drones_m ?? {});
  const seqX = tokens(collapsed.horizontal);
  const seqY = tokens(collapsed.vertical);
  const rotationDeg =
    typeof area?.drone_orientation_deg === "number" && Number.isFinite(area.drone_orientation_deg)
      ? area.drone_orientation_deg
      : 180;

  const colCount = Math.max(2, seqX.length + 1);
  const rowCount = Math.max(2, seqY.length + 1);
  const availW = 1680;
  const availH = 840;
  const naturalW = LABEL_COL_W_PX + colCount * DEFAULT_ICON_PX + (colCount - 1) * DEFAULT_GAP_PX;
  const naturalH = rowCount * DEFAULT_ICON_PX + (rowCount - 1) * DEFAULT_GAP_PX + DEFAULT_GAP_PX + 10;
  const scale = Math.min(1, availW / Math.max(1, naturalW), availH / Math.max(1, naturalH));
  const iconPx = Math.max(36, Math.round(DEFAULT_ICON_PX * scale));
  const gapPx = Math.max(44, Math.round(DEFAULT_GAP_PX * scale));

  const figure = buildLFigure({
    seqX,
    seqY,
    rotationDeg,
    iconSrc: exportDrone1Src(),
    iconPx,
    gapPx,
  });

  const page = document.createElement("section");
  page.id = "page3";
  page.className = "page";
  const header = document.createElement("div");
  header.id = "page3-header";
  header.textContent = headerText;
  const grad = document.createElement("div");
  grad.className = "grad";
  const body = document.createElement("div");
  body.id = "page3-figure";
  body.appendChild(figure);
  page.appendChild(header);
  page.appendChild(grad);
  page.appendChild(body);
  return page;
}
