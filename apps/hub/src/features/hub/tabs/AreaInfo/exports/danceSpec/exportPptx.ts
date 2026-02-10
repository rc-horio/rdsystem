// src/features/hub/tabs/AreaInfo/exports/danceSpec/exportPptx.ts

import type { ExportOpts } from "./types";
import { loadDanceSpecHtml } from "./template";
import { canvasToDataUri, captureElement } from "./capture";
import PptxGenJS from "pptxgenjs";
import { buildFileBaseName, formatTurnText, getSpacingBetweenDronesText } from "./texts";
import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { applyDroneOrientationToPage2 } from "./applyDroneOrientation";

/**
 * PPTXのスライドサイズ
 */
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const PAGE_PX_W = 1920;
const PAGE_PX_H = 1080;

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
    const gridWpx = PAGE_PX_W - GRID_LEFT_PX * 2;
    const midWpx = gridWpx - LEFT_PANE_W_PX - RIGHT_PANE_W_PX - GRID_GUTTER_X * 2;
    const spanWpx = LEFT_PANE_W_PX + GRID_GUTTER_X + midWpx;

    const gridHpx = PAGE_PX_H - GRID_TOP_PX - GRID_BOTTOM_PX;
    const usableHpx = gridHpx - GRID_ROW_GAP;
    const row1Hpx = (usableHpx * MID_TOP_FR) / (MID_TOP_FR + MID_BOTTOM_FR);

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

// PPTXを出力
export async function exportDanceSpecPptxFromHtml(opts?: ExportOpts) {
    // ==== 1) 表示テキスト決定 ====
    const { project, schedule } = pickProjectAndSchedule(opts);

    const company = (opts?.companyName ?? "株式会社レッドクリフ").trim();
    const page2Header = (opts?.page2HeaderText ?? "離発着情報").trim();
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

    // エリア情報を取得
    const area = opts?.area ?? {};
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();
    const actions = area?.actions ?? {};
    const lights = area?.lights ?? {};
    const { horizontal, vertical } = getSpacingBetweenDronesText(area);

    // ■機体数
    let aircraftVal =
        fmtInt(drone?.count) !== ""
            ? `${fmtInt(drone.count)}機`
            : fmtInt(drone?.x_count) !== "" && fmtInt(drone?.y_count) !== ""
                ? `${fmtInt(drone.x_count)} × ${fmtInt(drone.y_count)} 機`
                : "—";
    if (aircraftVal !== "—" && model) aircraftVal = `${model}：${aircraftVal}`;
    setText(p2clone, "#v-aircraft", aircraftVal);

    // ■最低、最高高度
    setText(
        p2clone,
        "#v-altitude",
        `最高高度: ${textOr(area?.geometry?.flightAltitude_Max_m, "—")} m\n` +
        `最低高度: ${textOr(area?.geometry?.flightAltitude_min_m, "—")} m`
    );

    // ■移動
    setText(p2clone, "#v-move", textOr(actions?.liftoff, "—"));

    // ■旋回
    setText(p2clone, "#v-turn", formatTurnText(area?.geometry?.turn));

    // ■障害物情報
    setText(p2clone, "#v-obstacles", textOr(area?.obstacle_note, "なし"));

    // ■離発着演出
    const takeoff = textOr(lights?.takeoff, "—");
    const landing = textOr(lights?.landing, "—");
    const note = textOr(area?.return_note, "—");
    setText(p2clone, "#v-show", `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`);

    // ■アニメーションサイズ
    const ww = textOr(area?.geometry?.flightArea?.radiusX_m * 2, "");
    const dd = textOr(area?.geometry?.flightArea?.radiusY_m * 2, "");
    setText(
        p2clone,
        "#v-anim",
        ww && dd ? `W${ww}m × L${dd}m` : ww ? `W${ww}m` : dd ? `L${dd}m` : "—"
    );

    // ■並べる間隔
    setText(p2clone, ".spacing-label--left", horizontal);
    setText(p2clone, ".spacing-label--bottom", vertical);

    // 左ペイン：LandingAreaFigure 注入（slot 無ければ作る）
    const slot = ensureLandingFigureSlot(p2clone);
    slot.innerHTML = buildLandingFigureSvg(area, { theme: "export" });

    // ■機体の向き（Drone1Icon）の回転と Antenna/Battery ラベル位置を反映
    applyDroneOrientationToPage2(p2clone, area);

    // ==== 3) キャプチャ ====
    // キャプチャする要素とCSS変数を設定
    const cssVars = { "--grad-from": gradFrom, "--grad-to": gradTo };
    const [c1, c2, figCanvas] = await Promise.all([
        captureElement(p1clone, "#000", styleNodes, cssVars),
        captureElement(p2clone, "#fff", styleNodes, cssVars),
        captureElement(slot, "#fff", styleNodes, cssVars), // 図だけ
    ]);

    // ==== 4) PPTX生成 ====
    // PPTXオブジェクトを作成
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    // 1枚目：背景を追加
    addFullSlide(pptx, c1);

    // 2枚目：背景 + 図 + マップ（個別画像）
    {
        // 2枚目：背景を追加
        const slide = pptx.addSlide();
        const bg = canvasToDataUri(c2, true);
        slide.addImage({ data: bg, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });

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
    }

    // ファイル名を作成
    const baseName = buildFileBaseName(project, schedule);
    // PPTXファイルを出力
    await pptx.writeFile({ fileName: `${baseName}.pptx` });
}
