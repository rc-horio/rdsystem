// src/features/hub/tabs/AreaInfo/pdf/exportLandscape.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { formatTurn } from "../sections/RightPanel";
import PptxGenJS from "pptxgenjs";

/** テンプレディレクトリのURLを取得 */
function getTemplateBase() {
    // BASE_URL = "/hub/" 想定
    return new URL("pdf-templates/", new URL(import.meta.env.BASE_URL, window.location.origin)).toString();
}

/** public のテンプレHTMLを読む */
async function loadDanceSpecHtml(): Promise<{ doc: Document; templateBase: string }> {
    const templateBase = getTemplateBase();
    const url = new URL("dance-spec.html", templateBase).toString();

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("dance-spec.html の読み込みに失敗しました");

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // ★ 相対パスをテンプレ基準で絶対URLにする
    doc.querySelectorAll("link[rel='stylesheet']").forEach((n) => {
        const href = n.getAttribute("href");
        if (href) n.setAttribute("href", new URL(href, templateBase).toString());
    });
    doc.querySelectorAll("img").forEach((n) => {
        const src = n.getAttribute("src");
        if (src) n.setAttribute("src", new URL(src, templateBase).toString());
    });

    return { doc, templateBase };
}

function fitOneLine(el: HTMLElement, max = 72, min = 20, step = 1) {
    // 計測中ははみ出しOKにして実幅を正確に取る
    const prevOverflow = el.style.overflow;
    el.style.overflow = "visible";

    let size = max;
    el.style.setProperty("--title-size", `${size}px`);
    // レイアウト確定
    void el.offsetHeight;

    while (size > min && el.scrollWidth > el.clientWidth) {
        size -= step;
        el.style.setProperty("--title-size", `${size}px`);
        void el.offsetHeight;
    }
    // 仕上げ
    el.style.overflow = prevOverflow || "hidden";
}

/** ファイル名に使えない文字を安全化 */
const sanitize = (name: string) =>
    (name || "").replace(/[\\/:*?"<>|\n\r]/g, "_").trim();

/** エクスポートオプション */
type ExportOpts = {
    projectName?: string;
    scheduleLabel?: string;
    gradPx?: number;
    companyName?: string;
    page2HeaderText?: string;
    gradFrom?: string;
    gradTo?: string;
    area?: any;
};

function buildFileBaseName(project: string, schedule: string) {
    return [sanitize(project), sanitize(schedule), "ダンスファイル指示書"]
        .filter(Boolean)
        .join("_");
}

function canvasToDataUri(canvas: HTMLCanvasElement, preferPng = false) {
    if (preferPng) return canvas.toDataURL("image/png");
    return canvas.toDataURL("image/jpeg", 0.95);
}


/** 指定ノードをオフスクリーンでレイアウト → html2canvas で撮る */
async function captureElement(
    el: HTMLElement,
    bg: "#000" | "#fff",
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const host = document.createElement("div");
    Object.assign(host.style, { position: "absolute", left: "-99999px", top: "0", background: bg });

    // ★ CSS link の読み込み完了を待つ
    const linkLoads: Promise<void>[] = [];
    styles.forEach((n) => {
        const cloned = n.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;

        if (cloned.tagName === "LINK") {
            const link = cloned as HTMLLinkElement;
            linkLoads.push(new Promise<void>((resolve) => {
                link.onload = () => resolve();
                link.onerror = () => resolve(); // 失敗しても先へ（診断は別）
            }));
        }
        host.appendChild(cloned);
    });

    if (vars) for (const [k, v] of Object.entries(vars)) host.style.setProperty(k, v);
    host.appendChild(el);
    document.body.appendChild(host);

    await Promise.all(linkLoads); // ★ ここが重要

    // 画像・フォントを待つ（CSS適用後が前提）
    await Promise.all(Array.from(el.querySelectorAll("img")).map(img =>
        (img as HTMLImageElement).decode?.().catch(() => { }) ?? Promise.resolve()
    ));
    const anyDoc = document as any;
    if (anyDoc.fonts?.ready) { try { await anyDoc.fonts.ready; } catch { } }

    await new Promise(r => requestAnimationFrame(() => r(null)));

    const title = el.querySelector("#title") as HTMLElement | null;
    if (title) fitOneLine(title, 50, 18, 1);

    await new Promise(r => requestAnimationFrame(() => r(null)));

    const canvas = await html2canvas(el, {
        backgroundColor: bg,
        useCORS: true,
        scale: 2,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight + 8,
        logging: false,
    });

    document.body.removeChild(host);
    return canvas;
}

/** 高度情報をテキストに変換 */
const getAltitudeText = (area: any) => {
    const flight =
        area?.flight_area ??
        area?.area?.flight_area ?? // schedule を渡してしまった時の保険
        {};

    const min = flight?.altitude_min_m;
    const max = flight?.altitude_max_m;

    // geometryに単一高度があるデータの救済
    const gAlt = area?.geometry?.flightAltitude_m;

    const toText = (v: any) =>
        (v === 0 || Number.isFinite(Number(v))) ? String(v) : "—";

    const minTxt = (min == null && gAlt != null) ? toText(gAlt) : toText(min);
    const maxTxt = (max == null && gAlt != null) ? toText(gAlt) : toText(max);

    return `最低高度: ${minTxt} m\n最高高度: ${maxTxt} m`;
};

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
    if (!project) project = "案件名"; // 最低限のデフォルト

    const company = (opts?.companyName ?? "株式会社レッドクリフ").trim();
    const page2Header = (opts?.page2HeaderText ?? "離発着情報").trim();
    const gradFrom = opts?.gradFrom ?? "#E00022";
    const gradTo = opts?.gradTo ?? "#FFD23A";

    // ==== 2) テンプレ読み込み & 値の注入 ====
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
    setTxt("#v-turn", formatTurn(area?.geometry?.turn));

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
        // ★ 追加ページも同じく [横,縦] & orientation 指定
        if (newPage) pdf.addPage([PAGE_W, PAGE_H], "landscape");

        const img = canvas.toDataURL("image/jpeg", 0.95);

        // 16:9 同士なので歪みなく全面配置
        pdf.addImage(img, "JPEG", 0, 0, pageW, pageH);
    };

    addFull(c1);
    addFull(c2, true);


    // ==== 5) ファイル名 ====
    const fileName =
        [sanitize(project), sanitize(schedule), "ダンスファイル指示書"].filter(Boolean).join("_") + ".pdf";
    pdf.save(fileName);
}


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

    // ==== 2) テンプレ読み込み & 値注入（PDFと同じ） ====
    const { doc } = await loadDanceSpecHtml();
    const styleNodes = Array.from(
        doc.head.querySelectorAll("style, link[rel='stylesheet']")
    ) as (HTMLStyleElement | HTMLLinkElement)[];

    const p1 = doc.getElementById("page1") as HTMLElement | null;
    const p2 = doc.getElementById("page2") as HTMLElement | null;
    if (!p1 || !p2) throw new Error("テンプレの #page1 / #page2 が見つかりません");

    const p1clone = p1.cloneNode(true) as HTMLElement;
    const p2clone = p2.cloneNode(true) as HTMLElement;

    const titleEl = p1clone.querySelector("#title") as HTMLElement | null;
    if (titleEl) titleEl.textContent = `${project}　${schedule}　ダンスファイル指示書`;

    const companyEl = p1clone.querySelector("#company") as HTMLElement | null;
    if (companyEl) companyEl.textContent = company;

    const headerEl = p2clone.querySelector("#page2-header") as HTMLElement | null;
    if (headerEl) headerEl.textContent = page2Header;

    // ===== 右サイド値の注入（PDFと同じ） =====
    const area = opts?.area ?? {};
    const flight = area?.flight_area ?? {};
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();
    const actions = area?.actions ?? {};
    const lights = area?.lights ?? {};
    const anim = area?.animation_area ?? {};

    const text = (v: any, fallback = "—") =>
        (v === 0 || (typeof v === "string" && v.trim()) || Number.isFinite(v)) ? String(v) : fallback;

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
    if (aircraftVal !== "—" && model) aircraftVal = `${model}：${aircraftVal}`;
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
    setTxt("#v-turn", text(actions?.turn, "—"));
    
    // ■障害物情報
    setTxt("#v-obstacles", text(area?.obstacle_note, "なし"));

    // ■離発着演出
    const takeoff = text(lights?.takeoff, "—");
    const landing = text(lights?.landing, "—");
    const note = text(area?.return_note, "—");
    setTxt("#v-show", `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`);

    // ■アニメーションサイズ
    const w = text(area?.geometry?.flightArea.radiusX_m * 2, "");
    const d = text(area?.geometry?.flightArea.radiusY_m * 2, "");
    setTxt("#v-anim", (w && d) ? `W${w}m × L${d}m` : (w ? `W${w}m` : (d ? `L${d}m` : "—")));

    // ==== 3) キャプチャ（PDFと同じ） ====
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

    const addSlideFull = (canvas: HTMLCanvasElement) => {
        const slide = pptx.addSlide();
        // JPEGでもPNGでもOK。線や文字が細いならPNG推奨（重くなる）
        const data = canvasToDataUri(canvas, true);
        slide.addImage({ data, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
    };

    addSlideFull(c1);
    addSlideFull(c2);

    const baseName = buildFileBaseName(project, schedule);
    await pptx.writeFile({ fileName: `${baseName}.pptx` });
}
