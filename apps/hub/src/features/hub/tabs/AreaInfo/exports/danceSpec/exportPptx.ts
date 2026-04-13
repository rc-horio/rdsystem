// src/features/hub/tabs/AreaInfo/exports/danceSpec/exportPptx.ts

import type { ExportOpts } from "./types";
import { loadDanceSpecHtml } from "./template";
import { canvasToDataUri, captureElement } from "./capture";
import PptxGenJS from "pptxgenjs";
import { buildFileBaseName, formatTurnText, getSpacingBetweenDronesText } from "./texts";
import { buildLandingFigureExportSvg } from "./buildLandingFigureExportSvg";
import { applyDroneOrientationToPage2 } from "./applyDroneOrientation";
import { getEffectiveBlocks, hasBlocks } from "@/features/hub/utils/areaBlocks";

/**
 * PPTXのスライドサイズ
 */
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const PAGE_PX_W = 1920;
const PAGE_PX_H = 1080;
/** #page2-header（top:20）直下の .grad（top:80, height:6）までを1帯にした高さ */
const PAGE2_HEADER_BAND_H_PX = 86;

// page2-grid のレイアウト（CSSと一致させる）
const GRID_LEFT_PX = 36;
const GRID_TOP_PX = 120; // --top-offset
const GRID_BOTTOM_PX = 36; // --bottom-offset
const LEFT_PANE_W_PX = 740; // --left-w
const RIGHT_PANE_W_PX = 380; // --right-w
const GRID_GUTTER_X = 36; // --gutter-x
const GRID_ROW_GAP = 28;
const MID_TOP_FR = 2;
const MID_BOTTOM_FR = 1;

function pickProjectAndSchedule(opts?: ExportOpts) {
    let project = (opts?.projectName ?? "").trim();
    let schedule = (opts?.scheduleLabel ?? "").trim();

    if (!project || !schedule) {
        const h1 = document.querySelector("h1[aria-label]") as HTMLHeadingElement | null;
        const raw = h1?.getAttribute("aria-label") || h1?.getAttribute("title") || "";
        if (raw) {
            const parts = raw
                .split("　")
                .map((s) => s.trim())
                .filter(Boolean);
            if (!project && parts[0]) project = parts[0];
            if (!schedule && parts[1]) schedule = parts[1];
        }
    }

    if (!project) project = "案件名";
    return { project, schedule };
}

// テキストを設定
function setText(root: ParentNode, selector: string, value: string) {
    const el = root.querySelector(selector) as HTMLElement | null;
    if (el) el.textContent = value;
}

// 整数をフォーマット
function fmtInt(n: any) {
    const v = Number(n);
    return Number.isFinite(v) ? v.toLocaleString("ja-JP") : "";
}

// テキストを取得
function textOr(v: any, fallback = "—") {
    return v === 0 || (typeof v === "string" && v.trim()) || Number.isFinite(v) ? String(v) : fallback;
}

// LandingAreaFigureのスロットを確保
function ensureLandingFigureSlot(p2clone: HTMLElement) {
    let slot = p2clone.querySelector("#landing-figure-slot") as HTMLElement | null;
    if (slot) return slot;

    const paneLeft = p2clone.querySelector(".pane-left") as HTMLElement | null;
    if (!paneLeft) throw new Error(".pane-left がテンプレにありません");

    slot = document.createElement("div");
    slot.id = "landing-figure-slot";
    slot.style.width = "100%";
    slot.style.height = "100%";

    const frameLeft = paneLeft.querySelector(".frame-left") as HTMLElement | null;
    (frameLeft ?? paneLeft).appendChild(slot);

    return slot;
}

// スライドを追加
function addFullSlide(pptx: PptxGenJS, canvas: HTMLCanvasElement) {
    const slide = pptx.addSlide();
    const data = canvasToDataUri(canvas, true);
    slide.addImage({ data, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
}

/** page2-grid 由来の列幅・行高（dance-spec.css と一致） */
function getPage2GridMetrics() {
    const gridWpx = PAGE_PX_W - GRID_LEFT_PX * 2;
    const midWpx = gridWpx - LEFT_PANE_W_PX - RIGHT_PANE_W_PX - GRID_GUTTER_X * 2;
    const gridHpx = PAGE_PX_H - GRID_TOP_PX - GRID_BOTTOM_PX;
    const usableHpx = gridHpx - GRID_ROW_GAP;
    const row1Hpx = (usableHpx * MID_TOP_FR) / (MID_TOP_FR + MID_BOTTOM_FR);
    const row2Hpx = usableHpx - row1Hpx;
    const midLeftXpx = GRID_LEFT_PX + LEFT_PANE_W_PX + GRID_GUTTER_X;
    const rightColLeftPx = GRID_LEFT_PX + LEFT_PANE_W_PX + GRID_GUTTER_X + midWpx + GRID_GUTTER_X;
    return { gridWpx, midWpx, gridHpx, usableHpx, row1Hpx, row2Hpx, midLeftXpx, rightColLeftPx };
}

/** 固定サイズのラッパに子を入れてキャプチャ（元 DOM は触らない） */
async function captureInWhiteBox(
    child: HTMLElement,
    widthPx: number,
    heightPx: number,
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const wrap = document.createElement("div");
    wrap.style.width = `${widthPx}px`;
    wrap.style.height = `${heightPx}px`;
    wrap.style.background = "#ffffff";
    wrap.style.overflow = "hidden";
    wrap.appendChild(child);
    return captureElement(wrap, "#fff", styles, vars);
}

/**
 * 中央下段（機体の向き・並べる間隔）をキャプチャ。
 * ラッパの overflow + .frame の content-box 枠が切れるのを避け、細い枠線を確実に含める。
 */
async function captureMidBottomSection(
    frameMidBottomSource: HTMLElement,
    widthPx: number,
    heightPx: number,
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const wrap = document.createElement("div");
    wrap.style.boxSizing = "border-box";
    wrap.style.width = `${widthPx}px`;
    wrap.style.height = `${heightPx}px`;
    wrap.style.background = "#ffffff";
    wrap.style.overflow = "hidden";
    wrap.style.borderRadius = "6px";

    const clone = frameMidBottomSource.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        // テンプレ .frame は 3px。PPTX 用は細い枠（切れ防止のため border-box 内に収める）
        border: "1px solid #cfcfcf",
        borderRadius: "6px",
    });

    wrap.appendChild(clone);
    return captureElement(wrap, "#fff", styles, vars);
}

/** 右ペイン左縦線（.vline）のみを 2px×grid 高でキャプチャ */
async function captureVlineStrip(
    vlineSource: HTMLElement,
    heightPx: number,
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.width = "2px";
    wrap.style.height = `${heightPx}px`;
    wrap.style.background = "#ffffff";

    const vClone = vlineSource.cloneNode(true) as HTMLElement;
    // #page2 .sidebar .vline はオフスクリーンでは当たらないため、CSS と同じ見た目をインラインで再現
    Object.assign(vClone.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "2px",
        height: "100%",
        backgroundColor: "#b0b6bf",
        display: "block",
    });

    wrap.appendChild(vClone);
    return captureElement(wrap, "#fff", styles, vars);
}

function midBottomBoxPx() {
    const m = getPage2GridMetrics();
    return {
        x: m.midLeftXpx,
        y: GRID_TOP_PX + m.row1Hpx + GRID_ROW_GAP,
        w: m.midWpx,
        h: m.row2Hpx,
    };
}

function sidebarVlineBoxPx() {
    const m = getPage2GridMetrics();
    return {
        x: m.rightColLeftPx,
        y: GRID_TOP_PX,
        w: 2,
        h: m.gridHpx,
    };
}

function pxRectToSlideInches(r: { x: number; y: number; w: number; h: number }) {
    const pxToInX = SLIDE_W / PAGE_PX_W;
    const pxToInY = SLIDE_H / PAGE_PX_H;
    return {
        x: r.x * pxToInX,
        y: r.y * pxToInY,
        w: r.w * pxToInX,
        h: r.h * pxToInY,
    };
}

function normalizeCssHex(color: string) {
    const t = color.trim();
    return t.startsWith("#") ? t : `#${t}`;
}

/**
 * 「離着陸情報」見出しと直下グラデ罫線を1枚の画像としてキャプチャ（#page2 外でも見た目一致）
 * dance-spec.css: #page2-header top:20 left:36 / .grad top:80 height:6
 */
async function capturePage2HeaderBand(
    headerSource: HTMLElement,
    gradSource: HTMLElement,
    gradFromColor: string,
    gradToColor: string,
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.width = `${PAGE_PX_W}px`;
    wrap.style.height = `${PAGE2_HEADER_BAND_H_PX}px`;
    wrap.style.background = "#ffffff";
    wrap.style.overflow = "hidden";

    const from = normalizeCssHex(gradFromColor);
    const to = normalizeCssHex(gradToColor);

    const gClone = gradSource.cloneNode(true) as HTMLElement;
    Object.assign(gClone.style, {
        position: "absolute",
        left: "0",
        top: "80px",
        width: "100%",
        height: "6px",
        background: `linear-gradient(90deg, ${from}, ${to})`,
        margin: "0",
        padding: "0",
        zIndex: "1",
    });

    const hClone = headerSource.cloneNode(true) as HTMLElement;
    Object.assign(hClone.style, {
        position: "absolute",
        left: "36px",
        top: "20px",
        fontWeight: "500",
        fontSize: "36px",
        lineHeight: "1.3",
        color: "#000000",
        margin: "0",
        padding: "0",
        zIndex: "2",
    });

    wrap.appendChild(gClone);
    wrap.appendChild(hClone);

    return captureElement(wrap, "#fff", styles, vars);
}

function headerBandBoxInches() {
    const pxToInX = SLIDE_W / PAGE_PX_W;
    const pxToInY = SLIDE_H / PAGE_PX_H;
    return {
        x: 0,
        y: 0,
        w: PAGE_PX_W * pxToInX,
        h: PAGE2_HEADER_BAND_H_PX * pxToInY,
    };
}

// 左ペインの枠を取得
function leftPaneBoxInInches() {
    const leftXpx = GRID_LEFT_PX;
    const leftYpx = GRID_TOP_PX;
    const leftWpx = LEFT_PANE_W_PX;
    const leftHpx = PAGE_PX_H - GRID_TOP_PX - GRID_BOTTOM_PX;

    const pxToInX = SLIDE_W / PAGE_PX_W;
    const pxToInY = SLIDE_H / PAGE_PX_H;

    return {
        x: leftXpx * pxToInX,
        y: leftYpx * pxToInY,
        w: leftWpx * pxToInX,
        h: leftHpx * pxToInY,
    };
}

// 左+中央の上段ボックス
function mapSpanTopBoxInInches() {
    const gridLeftPx = GRID_LEFT_PX;
    const gridTopPx = GRID_TOP_PX;
    const { midWpx, row1Hpx } = getPage2GridMetrics();
    const spanWpx = LEFT_PANE_W_PX + GRID_GUTTER_X + midWpx;

    const pxToInX = SLIDE_W / PAGE_PX_W;
    const pxToInY = SLIDE_H / PAGE_PX_H;

    return {
        x: gridLeftPx * pxToInX,
        y: gridTopPx * pxToInY,
        w: spanWpx * pxToInX,
        h: row1Hpx * pxToInY,
    };
}

// 画像を左下に配置
function placeImageContainBottomLeft(
    slide: ReturnType<PptxGenJS["addSlide"]>,
    data: string,
    imgPxW: number,
    imgPxH: number,
    box: { x: number; y: number; w: number; h: number }
) {
    const scale = Math.min(box.w / imgPxW, box.h / imgPxH);
    const drawW = imgPxW * scale;
    const drawH = imgPxH * scale;

    const x = box.x;
    const y = box.y + (box.h - drawH); // bottom align

    slide.addImage({ data, x, y, w: drawW, h: drawH });
}

// 画像を中央配置（アスペクト維持）
function placeImageContainCenter(
    slide: ReturnType<PptxGenJS["addSlide"]>,
    data: string,
    imgPxW: number,
    imgPxH: number,
    box: { x: number; y: number; w: number; h: number }
) {
    const scale = Math.min(box.w / imgPxW, box.h / imgPxH);
    const drawW = imgPxW * scale;
    const drawH = imgPxH * scale;

    const x = box.x + (box.w - drawW) / 2;
    const y = box.y + (box.h - drawH) / 2;

    slide.addImage({ data, x, y, w: drawW, h: drawH });
}

// dataUrl から画像サイズを取得
function loadImageSize(dataUrl: string) {
    return new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
        img.onerror = () => reject(new Error("スクリーンショットの読み込みに失敗しました。"));
        img.src = dataUrl;
    });
}

/** 右ペイン（dance-spec.css .side-dl）に合わせたレイアウト定数（px, 1920×1080 前提） */
const RIGHT_PANE_LAYOUT = {
    gridTop: GRID_TOP_PX,
    /** ページ左端から右カラム左端まで */
    rightColLeft: 36 + LEFT_PANE_W_PX + GRID_GUTTER_X + (PAGE_PX_W - GRID_LEFT_PX * 2 - LEFT_PANE_W_PX - RIGHT_PANE_W_PX - GRID_GUTTER_X * 2) + GRID_GUTTER_X,
    sidebarPadLeft: 40,
    ddMarginLeft: 28,
    colW: RIGHT_PANE_W_PX,
    dtFontPx: 20,
    dtLineHeight: 1.35,
    dtMarginBottom: 10,
    ddFontPx: 17,
    ddLineHeight: 1.7,
    ddMarginBottom: 30,
} as const;

type RightPaneRow = { label: string; value: string };

function pxToInX(px: number) {
    return (px / PAGE_PX_W) * SLIDE_W;
}
function pxToInY(px: number) {
    return (px / PAGE_PX_H) * SLIDE_H;
}

/** dd の高さを概算（本文フォント pt とカラム幅から折り返し行数を見積もり） */
function estimateDdHeightPx(value: string, bodyFontPt: number, lineHeight = 1.7): number {
    const bodyPx = (bodyFontPt * 96) / 72;
    const lh = bodyPx * lineHeight;
    const usableW = RIGHT_PANE_LAYOUT.colW - RIGHT_PANE_LAYOUT.sidebarPadLeft - RIGHT_PANE_LAYOUT.ddMarginLeft;
    const approxCharPx = bodyPx * 0.92;
    const wrapChars = Math.max(8, Math.floor(usableW / approxCharPx));

    let lineCount = 0;
    for (const para of value.split("\n")) {
        const len = para.length === 0 ? 1 : para.length;
        lineCount += Math.max(1, Math.ceil(len / wrapChars));
    }
    return Math.max(lh, lineCount * lh) * 1.06;
}

/**
 * スライド2に右ペイン相当のネイティブテキストを重ねる
 * 座標は dance-spec.css .sidebar / .side-dl に合わせる
 */
/** PPTX 右ペインのフォント（PowerPoint 上の見た目。CSS テンプレの px とは別） */
const PPT_RIGHT_PANE_LABEL_PT = 12;
const PPT_RIGHT_PANE_BODY_PT = 9;

function addRightPaneNativeText(
    slide: ReturnType<PptxGenJS["addSlide"]>,
    rows: RightPaneRow[]
) {
    const L = RIGHT_PANE_LAYOUT;
    const xDt = pxToInX(L.rightColLeft + L.sidebarPadLeft);
    const xDd = pxToInX(L.rightColLeft + L.sidebarPadLeft + L.ddMarginLeft);
    const wDt = pxToInX(L.colW - L.sidebarPadLeft);
    const wDd = pxToInX(L.colW - L.sidebarPadLeft - L.ddMarginLeft);

    const dtHpx = ((PPT_RIGHT_PANE_LABEL_PT * 96) / 72) * L.dtLineHeight;

    const fontFace = "Yu Gothic";
    let yPx = L.gridTop;

    for (const row of rows) {
        const dtY = yPx;
        slide.addText(row.label, {
            x: xDt,
            y: pxToInY(dtY),
            w: wDt,
            h: pxToInY(dtHpx + 2),
            fontSize: PPT_RIGHT_PANE_LABEL_PT,
            fontFace,
            bold: true,
            color: "CB1B23",
            valign: "top",
            align: "left",
        });

        yPx = dtY + dtHpx + L.dtMarginBottom;
        const ddY = yPx;
        const ddHpx = estimateDdHeightPx(row.value, PPT_RIGHT_PANE_BODY_PT);
        slide.addText(row.value, {
            x: xDd,
            y: pxToInY(ddY),
            w: wDd,
            h: pxToInY(ddHpx + 4),
            fontSize: PPT_RIGHT_PANE_BODY_PT,
            fontFace,
            color: "222222",
            valign: "top",
            align: "left",
        });

        yPx = ddY + ddHpx + L.ddMarginBottom;
    }
}

/** エリアから右ペインの各行（ラベルはテンプレ HTML と同一文言） */
function buildRightPaneRows(area: any): RightPaneRow[] {
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();
    const actions = area?.actions ?? {};
    const lights = area?.lights ?? {};

    let aircraftVal: string;
    if (hasBlocks(area)) {
        const blocks = getEffectiveBlocks(area);
        const total = blocks.reduce((sum, b) => sum + (Number(b.count) || 0), 0);
        const blockLines = blocks
            .map((b, i) => `${String.fromCharCode(65 + i)}ブロック: ${fmtInt(b.count)}機`)
            .join("\n");
        aircraftVal = `総機体数: ${fmtInt(total)}機${blockLines ? `\n${blockLines}` : ""}`;
    } else {
        aircraftVal =
            fmtInt(drone?.count) !== ""
                ? `${fmtInt(drone.count)}機`
                : fmtInt(drone?.x_count) !== "" && fmtInt(drone?.y_count) !== ""
                    ? `${fmtInt(drone.x_count)} × ${fmtInt(drone.y_count)} 機`
                    : "—";
    }
    if (aircraftVal !== "—" && model) aircraftVal = `${model}：${aircraftVal}`;

    const altitudeVal =
        `最高高度: ${textOr(area?.geometry?.flightAltitude_Max_m, "—")} m\n` +
        `最低高度: ${textOr(area?.geometry?.flightAltitude_min_m, "—")} m`;

    const takeoff = textOr(lights?.takeoff, "—");
    const landing = textOr(lights?.landing, "—");
    const note = textOr(area?.return_note, "—");
    const showVal = `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`;

    const ww = textOr(area?.geometry?.flightArea?.radiusX_m * 2, "");
    const depthM = textOr(area?.geometry?.flightArea?.radiusY_m * 2, "");
    const animVal =
        ww && depthM ? `W${ww}m × L${depthM}m` : ww ? `W${ww}m` : depthM ? `L${depthM}m` : "—";

    return [
        { label: "■機体数", value: aircraftVal },
        { label: "■最低、最高高度", value: altitudeVal },
        { label: "■移動", value: textOr(actions?.liftoff, "—") },
        { label: "■旋回", value: formatTurnText(area?.geometry?.turn) },
        { label: "■障害物情報", value: textOr(area?.obstacle_note, "なし") },
        { label: "■離着陸演出", value: showVal },
        { label: "■アニメーションサイズ", value: animVal },
    ];
}

// PPTXを出力
export async function exportDanceSpecPptxFromHtml(opts?: ExportOpts) {
    // ==== 1) 表示テキスト決定 ====
    const { project, schedule } = pickProjectAndSchedule(opts);

    const company = (opts?.companyName ?? "株式会社レッドクリフ").trim();
    const page2Header = (opts?.page2HeaderText ?? "離着陸情報").trim();
    const gradFrom = opts?.gradFrom ?? "#E00022";
    const gradTo = opts?.gradTo ?? "#FFD23A";

    // ==== 2) テンプレ読み込み & 値注入 ====
    const { doc } = await loadDanceSpecHtml();
    const styleNodes = Array.from(doc.head.querySelectorAll("style, link[rel='stylesheet']")) as (
        | HTMLStyleElement
        | HTMLLinkElement
    )[];

    // テンプレのページ1とページ2をクローン
    const p1 = doc.getElementById("page1") as HTMLElement | null;
    const p2 = doc.getElementById("page2") as HTMLElement | null;
    if (!p1 || !p2) throw new Error("テンプレの #page1 / #page2 が見つかりません");

    // テンプレのページ1とページ2をクローン
    const p1clone = p1.cloneNode(true) as HTMLElement;
    const p2clone = p2.cloneNode(true) as HTMLElement;

    setText(p1clone, "#title", `${project}　${schedule}　ダンスファイル指示書`);
    setText(p1clone, "#company", company);
    setText(p2clone, "#page2-header", page2Header);

    const area = opts?.area ?? {};
    const rightPaneRows = buildRightPaneRows(area);
    const rightPaneDdSels = [
        "#v-aircraft",
        "#v-altitude",
        "#v-move",
        "#v-turn",
        "#v-obstacles",
        "#v-show",
        "#v-anim",
    ] as const;
    rightPaneRows.forEach((row, i) => setText(p2clone, rightPaneDdSels[i]!, row.value));

    const { horizontal, vertical } = getSpacingBetweenDronesText(area);

    // LandingAreaFigure と同じ: 左＝縦間隔(vertical)、下＝横間隔(horizontal)
    setText(p2clone, ".spacing-label--left", vertical);
    setText(p2clone, ".spacing-label--bottom", horizontal);

    // 左ペイン：LandingAreaFigure 注入（slot 無ければ作る）
    const slot = ensureLandingFigureSlot(p2clone);
    slot.innerHTML = buildLandingFigureExportSvg(area);

    // ■機体の向き（Drone1Icon）の回転と Antenna/Battery ラベル位置を反映
    applyDroneOrientationToPage2(p2clone, area);

    const cssVars = { "--grad-from": gradFrom, "--grad-to": gradTo };
    const grid = getPage2GridMetrics();

    const midBottomEl = p2clone.querySelector(".frame-mid-bottom") as HTMLElement | null;
    if (!midBottomEl) throw new Error("テンプレの .frame-mid-bottom が見つかりません");
    const vlineEl = p2clone.querySelector(".sidebar .vline") as HTMLElement | null;
    if (!vlineEl) throw new Error("テンプレの .sidebar .vline が見つかりません");
    const page2HeaderEl = p2clone.querySelector("#page2-header") as HTMLElement | null;
    if (!page2HeaderEl) throw new Error("テンプレの #page2-header が見つかりません");
    const page2GradEl = p2clone.querySelector(":scope > .grad") as HTMLElement | null;
    if (!page2GradEl) throw new Error("テンプレの #page2 直下 .grad が見つかりません");

    // 見出し＋罫線、中央下段、縦線をそれぞれ1枚の画像として抽出
    const [headerBandCanvas, midBottomCanvas, vlineCanvas] = await Promise.all([
        capturePage2HeaderBand(page2HeaderEl, page2GradEl, gradFrom, gradTo, styleNodes, cssVars),
        captureMidBottomSection(midBottomEl, grid.midWpx, grid.row2Hpx, styleNodes, cssVars),
        captureVlineStrip(vlineEl, grid.gridHpx, styleNodes, cssVars),
    ]);

    // ==== 3) キャプチャ ====
    // 2ページ目は全面を html2canvas しない（白一色のベース画像を避ける）。1ページ目＋離着陸図のみ。
    const [c1, figCanvas] = await Promise.all([
        captureElement(p1clone, "#000", styleNodes, cssVars),
        captureElement(slot, "#fff", styleNodes, cssVars), // 図だけ
    ]);

    // ==== 4) PPTX生成 ====
    // PPTXオブジェクトを作成
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    // 1枚目：背景を追加
    addFullSlide(pptx, c1);

    // 2枚目：スライド塗り＋切り出し画像＋マップ＋図＋右ペインテキスト（全面ラスタは使わない）
    {
        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };

        const hb = headerBandBoxInches();
        slide.addImage({
            data: canvasToDataUri(headerBandCanvas, true),
            x: hb.x,
            y: hb.y,
            w: hb.w,
            h: hb.h,
        });

        const midBottomBox = pxRectToSlideInches(midBottomBoxPx());
        slide.addImage({
            data: canvasToDataUri(midBottomCanvas, true),
            x: midBottomBox.x,
            y: midBottomBox.y,
            w: midBottomBox.w,
            h: midBottomBox.h,
        });

        const vlineBox = pxRectToSlideInches(sidebarVlineBoxPx());
        slide.addImage({
            data: canvasToDataUri(vlineCanvas, true),
            x: vlineBox.x,
            y: vlineBox.y,
            w: vlineBox.w,
            h: vlineBox.h,
        });

        // マップ画像（左上〜中央上に横断、アスペクト維持）
        const mapDataUrl = (opts?.mapScreenshotDataUrl ?? "").trim();
        if (mapDataUrl) {
            const { w: imgPxW, h: imgPxH } = await loadImageSize(mapDataUrl);
            const box = mapSpanTopBoxInInches();
            placeImageContainCenter(slide, mapDataUrl, imgPxW, imgPxH, box);
        }

        // 図を左下に配置
        const figData = canvasToDataUri(figCanvas, true);
        const box = leftPaneBoxInInches();

        placeImageContainBottomLeft(slide, figData, figCanvas.width, figCanvas.height, box);

        addRightPaneNativeText(slide, rightPaneRows);
    }

    // ファイル名を作成
    const baseName = buildFileBaseName(project, schedule);
    // PPTXファイルを出力
    await pptx.writeFile({ fileName: `${baseName}.pptx` });
}
