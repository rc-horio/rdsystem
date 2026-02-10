// src/features/hub/tabs/AreaInfo/exports/danceSpec/exportPdf.ts

import type { ExportOpts } from "./types";
import { loadDanceSpecHtml } from "./template";
import { captureElement } from "./capture";
import { jsPDF } from "jspdf";
import { sanitize, formatTurnText, getSpacingBetweenDronesText } from "./texts";
import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { applyDroneOrientationToPage2 } from "./applyDroneOrientation";

/**
 * PDFを出力
 */
export async function exportDanceSpecPdfFromHtml(opts?: ExportOpts) {
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

    // 離発着情報
    const area = opts?.area ?? {};

    // ===== 左ペイン：LandingAreaFigure を注入 =====
    {
        const slot = p2clone.querySelector("#landing-figure-slot") as HTMLElement | null;
        if (slot) {
            slot.innerHTML = buildLandingFigureSvg(area, { theme: "export" });
        }
    }

    // ===== 右サイド値の注入 =====
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
        `最高高度: ${text(area?.geometry?.flightAltitude_Max_m, "—")} m\n` +
        `最低高度: ${text(area?.geometry?.flightAltitude_min_m, "—")} m`
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

    // ■機体の向き（Drone1Icon）の回転と Antenna/Battery ラベル位置を反映
    applyDroneOrientationToPage2(p2clone, area);

    // スクリーンショット（マップ）を差し込む
    {
        const mapImg = p2clone.querySelector("#map-screenshot") as HTMLImageElement | null;
        const mapDataUrl = (opts?.mapScreenshotDataUrl ?? "").trim();
        if (mapImg) {
            if (mapDataUrl) {
                mapImg.src = mapDataUrl;
                mapImg.style.display = "block";
            } else {
                mapImg.style.display = "none";
            }
        }
    }

    // ==== 3) キャプチャ ====
    const cssVars = { "--grad-from": gradFrom, "--grad-to": gradTo };
    const [c1, c2] = await Promise.all([
        captureElement(p1clone, "#000", styleNodes, cssVars),
        captureElement(p2clone, "#fff", styleNodes, cssVars),
    ]);

    // ==== 4) PDF 出力 ====
    // 16:9 のページサイズ（pt）
    const PAGE_W = 1280;  // 横
    const PAGE_H = 720;   // 縦

    // landscape を明示し、[横,縦] で渡す
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [PAGE_W, PAGE_H],
    });

    const { width: pageW, height: pageH } = pdf.internal.pageSize;

    const addFull = (canvas: HTMLCanvasElement, newPage = false) => {
        // 追加ページも同じく [横,縦] & orientation 指定
        if (newPage) pdf.addPage([PAGE_W, PAGE_H], "landscape");

        const img = canvas.toDataURL("image/jpeg", 0.95);

        // 16:9 同士なので歪みなく全面配置
        pdf.addImage(img, "JPEG", 0, 0, pageW, pageH);
    };

    addFull(c1);
    addFull(c2, true);

    // ==== 5) 開発用：出力 ====
    const fileName =
        [sanitize(project), sanitize(schedule), "ダンスファイル指示書"].filter(Boolean).join("_") + ".pdf";

    // 環境変数VITE_DISABLE_AUTHがtrueの場合は開発用
    if (import.meta.env.DEV) {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        // メモリ解放（適当なタイミングでOK）
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
        pdf.save(fileName);
    }

}

