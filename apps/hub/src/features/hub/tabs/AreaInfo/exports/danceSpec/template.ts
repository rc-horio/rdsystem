// src/features/hub/tabs/AreaInfo/exports/danceSpec/template.ts

/** テンプレディレクトリのURLを取得（public 配下） */
export function getTemplateBase(): string {
    // BASE_URL = "/hub/" 想定
    return new URL(
        "dance-spec--templates/",
        new URL(import.meta.env.BASE_URL, window.location.origin)
    ).toString();
}

/** public のテンプレHTMLを読む（CSS/画像の相対パスを絶対URL化） */
export async function loadDanceSpecHtml(): Promise<{
    doc: Document;
    templateBase: string;
    styleNodes: (HTMLStyleElement | HTMLLinkElement)[];
}> {
    const templateBase = getTemplateBase();
    const url = new URL("dance-spec.html", templateBase).toString();

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("dance-spec.html の読み込みに失敗しました");

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // link href を絶対化
    doc.querySelectorAll("link[rel='stylesheet']").forEach((n) => {
        const href = n.getAttribute("href");
        if (href) n.setAttribute("href", new URL(href, templateBase).toString());
    });

    // img src を絶対化
    doc.querySelectorAll("img").forEach((n) => {
        const src = n.getAttribute("src");
        if (src) n.setAttribute("src", new URL(src, templateBase).toString());
    });

    const styleNodes = Array.from(
        doc.head.querySelectorAll("style, link[rel='stylesheet']")
    ) as (HTMLStyleElement | HTMLLinkElement)[];

    return { doc, templateBase, styleNodes };
}
