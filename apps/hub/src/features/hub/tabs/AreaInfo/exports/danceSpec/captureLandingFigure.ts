import { captureElement } from "./capture";
import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";

export async function captureLandingFigure(
    area: any,
    styleNodes: (HTMLStyleElement | HTMLLinkElement)[],
    cssVars: Record<string, string>
): Promise<HTMLCanvasElement> {
    const wrap = document.createElement("div");
    // 背景やサイズはあとで調整でOK。とりあえずテンプレと同じ比率で。
    wrap.style.width = "460px";
    wrap.style.height = "220px";
    wrap.style.background = "transparent";

    wrap.innerHTML = buildLandingFigureSvg(area, { theme: "export" });
    const node = wrap.firstElementChild as HTMLElement;

    return captureElement(node, "#fff", styleNodes, cssVars);
}
