// src/features/hub/tabs/AreaInfo/exports/danceSpec/exportPptx.ts

import type { ExportOpts } from "./types";
import { loadDanceSpecHtml } from "./template";
import { canvasToDataUri, captureElement } from "./capture";
import PptxGenJS from "pptxgenjs";
import { buildFileBaseName, formatTurnText, getSpacingBetweenDronesText } from "./texts";

/**
 * PPTXを出力
 */
export async function exportDanceSpecPptxFromHtml(opts?: ExportOpts) {
    // ==== 1) 表示テキスト決定 ====
    let project = (opts?.projectName ?? "").trim();
    let schedule = (opts?.scheduleLabel ?? "").trim();

    if (!project || !schedule) {
        const h1 = document.querySelector('h1[aria-label]') as HTMLHeadingElement | null;
        const raw = h1?.getAttribute("aria-label") || h1?.getAttribute("title") || "";
        if (raw) {
            const parts = raw.split("　").map((s) => s.trim()).filter(Boolean);
            if (!project && parts[0]) project = parts[0];
            if (!schedule && parts[1]) schedule = parts[1];
        }
    }
    if (!project) project = "案件名";

    const company = (opts?.companyName ?? "株式会社レッドクリフ").trim();
    const page2Header = (opts?.page2HeaderText ?? "離発着情報").trim();
    const gradFrom = opts?.gradFrom ?? "#E00022";
    const gradTo = opts?.gradTo ?? "#FFD23A";

    // ==== 2) テンプレ読み込み & 値注入 ====
    const { doc } = await loadDanceSpecHtml();
    const styleNodes = Array.from(
        doc.head.querySelectorAll("style, link[rel='stylesheet']")
    ) as (HTMLStyleElement | HTMLLinkElement)[];

    const p1 = doc.getElementById("page1") as HTMLElement | null;
    const p2 = doc.getElementById("page2") as HTMLElement | null;
    if (!p1 || !p2) throw new Error("テンプレの #page1 / #page2 が見つかりません");

    const p1clone = p1.cloneNode(true) as HTMLElement;
    const p2clone = p2.cloneNode(true) as HTMLElement;

    // 1ページ目
    const titleEl = p1clone.querySelector("#title") as HTMLElement | null;
    if (titleEl) titleEl.textContent = `${project}　${schedule}　ダンスファイル指示書`;

    const companyEl = p1clone.querySelector("#company") as HTMLElement | null;
    if (companyEl) companyEl.textContent = company;

    // 2ページ目
    const headerEl = p2clone.querySelector("#page2-header") as HTMLElement | null;
    if (headerEl) headerEl.textContent = page2Header;

    // ===== 右サイド値の注入 =====
    const area = opts?.area ?? {};
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();
    const actions = area?.actions ?? {};
    const lights = area?.lights ?? {};
    const { horizontal, vertical } = getSpacingBetweenDronesText(area);

    const text = (v: any, fallback = "—") =>
        (v === 0 || (typeof v === "string" && v.trim()) || Number.isFinite(v))
            ? String(v)
            : fallback;

    const fmtInt = (n: any) => {
        const v = Number(n);
        return Number.isFinite(v) ? v.toLocaleString("ja-JP") : "";
    };

    const setTxt = (sel: string, val: string) => {
        const el = p2clone.querySelector(sel) as HTMLElement | null;
        if (el) el.textContent = val;
    };

    // ■機体数
    let aircraftVal =
        fmtInt(drone?.count)
            ? `${fmtInt(drone.count)}機`
            : (fmtInt(drone?.x_count) && fmtInt(drone?.y_count))
                ? `${fmtInt(drone.x_count)} × ${fmtInt(drone.y_count)} 機`
                : "—";

    if (aircraftVal !== "—" && model) {
        aircraftVal = `${model}：${aircraftVal}`;
    }
    setTxt("#v-aircraft", aircraftVal);

    // ■最低、最高高度
    setTxt(
        "#v-altitude",
        `最低高度: ${text(area?.geometry?.flightAltitude_Max_m, "—")} m\n` +
        `最高高度: ${text(area?.geometry?.flightAltitude_min_m, "—")} m`
    );

    // ■移動
    setTxt("#v-move", text(actions?.liftoff, "—"));

    // ■旋回
    setTxt("#v-turn", formatTurnText(area?.geometry?.turn));

    // ■障害物情報
    setTxt("#v-obstacles", text(area?.obstacle_note, "なし"));

    // ■離発着演出
    const takeoff = text(lights?.takeoff, "—");
    const landing = text(lights?.landing, "—");
    const note = text(area?.return_note, "—");
    setTxt(
        "#v-show",
        `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`
    );

    // ■アニメーションサイズ
    const w = text(area?.geometry?.flightArea.radiusX_m * 2, "");
    const d = text(area?.geometry?.flightArea.radiusY_m * 2, "");
    setTxt("#v-anim", (w && d) ? `W${w}m × L${d}m` : (w ? `W${w}m` : (d ? `L${d}m` : "—")));

    // ■並べる間隔（左）
    setTxt(".spacing-label--left", horizontal);

    // ■並べる間隔（下）
    setTxt(".spacing-label--bottom", vertical);

    // ==== 3) キャプチャ ====
    const cssVars = { "--grad-from": gradFrom, "--grad-to": gradTo };
    const [c1, c2] = await Promise.all([
        captureElement(p1clone, "#000", styleNodes, cssVars),
        captureElement(p2clone, "#fff", styleNodes, cssVars),
    ]);

    // ==== 4) PPTX生成（ここが追加） ====
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333in x 7.5in（16:9）

    // 全面貼り付け（単位は inch）
    const SLIDE_W = 13.333;
    const SLIDE_H = 7.5;

    const addFull = (canvas: HTMLCanvasElement) => {
        const slide = pptx.addSlide();
        // JPEGでもPNGでもOK。線や文字が細いならPNG推奨（重くなる）
        const data = canvasToDataUri(canvas, true);
        slide.addImage({ data, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
    };

    addFull(c1);
    addFull(c2);

    const baseName = buildFileBaseName(project, schedule);
    await pptx.writeFile({ fileName: `${baseName}.pptx` });
}

