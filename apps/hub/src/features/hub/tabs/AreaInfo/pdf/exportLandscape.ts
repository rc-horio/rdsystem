// src/features/hub/tabs/AreaInfo/pdf/exportLandscape.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/** public のテンプレHTMLを読む */
async function loadDanceSpecHtml(): Promise<Document> {
    const url = "/pdf-templates/dance-spec.html";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("dance-spec.html の読み込みに失敗しました");
    const html = await res.text();
    return new DOMParser().parseFromString(html, "text/html");
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

/** 指定ノードをオフスクリーンでレイアウト → html2canvas で撮る */
async function captureElement(
    el: HTMLElement,
    bg: "#000" | "#fff",
    styles: (HTMLStyleElement | HTMLLinkElement)[],
    vars?: Record<string, string>
) {
    const host = document.createElement("div");
    Object.assign(host.style, { position: "absolute", left: "-99999px", top: "0", background: bg });
    styles.forEach(n => host.appendChild(n.cloneNode(true)));
    if (vars) for (const [k, v] of Object.entries(vars)) host.style.setProperty(k, v);
    host.appendChild(el);
    document.body.appendChild(host);

    // 画像・フォントを待つ
    await Promise.all(Array.from(el.querySelectorAll("img")).map(img => (img as HTMLImageElement).decode?.().catch(() => { }) ?? Promise.resolve()));
    const anyDoc = document as any;
    if (anyDoc.fonts?.ready) { try { await anyDoc.fonts.ready; } catch { } }
    await new Promise(r => requestAnimationFrame(() => r(null)));

    // ← このタイミングで縮小（レイアウト確定後）
    const title = el.querySelector("#title") as HTMLElement | null;
    if (title) fitOneLine(title, 50, 18, 1);

    // もう1フレーム待ってから撮影（サイズ反映保証）
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

type ExportOpts = {
    projectName?: string;
    scheduleLabel?: string;
    gradPx?: number;              // 横線の太さ（px）
    companyName?: string;         // 会社名
    page2HeaderText?: string;     // 2ページ目ヘッダ
    gradFrom?: string;            // グラデ開始色
    gradTo?: string;              // グラデ終了色
    area?: any;
};

/**
 * HTMLテンプレから 2 ページPDFを出力
 * 1P: 黒背景（ロゴ・タイトル・グラデ線・会社名）
 * 2P: 白背景（左上ヘッダ）
 * ファイル名: 「案件名_スケジュール名_ダンスファイル仕様書.pdf」
 */
export async function exportDanceSpecPdfFromHtml(opts?: ExportOpts) {
    // ==== 1) 表示テキスト決定（TopBarからのフォールバックあり） ====
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
    const doc = await loadDanceSpecHtml();
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
    if (titleEl) titleEl.textContent = `${project}　${schedule}　ダンスファイル仕様書`;


    const companyEl = p1clone.querySelector("#company") as HTMLElement | null;
    if (companyEl) companyEl.textContent = company;

    // 2ページ目
    const headerEl = p2clone.querySelector("#page2-header") as HTMLElement | null;
    if (headerEl) headerEl.textContent = page2Header;

    // ===== 右サイド値の注入 =====
    const area = opts?.area ?? {};
    const flight = area?.flight_area ?? {};
    const drone = area?.drone_count ?? {};
    const model = (drone?.model ?? "").trim();
    const actions = area?.actions ?? {};
    const lights = area?.lights ?? {};
    const anim = area?.animation_area ?? {};

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

    // ■最低、最高高度（2行想定でも1つの <dd> 内に改行で入れる）
    setTxt(
        "#v-altitude",
        `最低高度: ${text(flight?.altitude_min_m, "—")} m\n` +
        `最高高度: ${text(flight?.altitude_max_m, "—")} m`
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
    setTxt(
        "#v-show",
        `離陸: ${takeoff}\n着陸: ${landing}\n ${note}`
    );

    // ■アニメーションエリア
    const w = text(anim?.width_m, "");
    const d = text(anim?.depth_m, "");
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

    // ★ landscape を明示し、[横,縦] で渡す
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
        [sanitize(project), sanitize(schedule), "ダンスファイル仕様書"].filter(Boolean).join("_") + ".pdf";
    pdf.save(fileName);
}
