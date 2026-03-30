// src/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg.ts

import { fmtMeters } from "@/features/hub/utils/spacing";
import { buildLandingFigureModel } from "@/features/hub/tabs/AreaInfo/figure/landingFigureModel";

type Theme = "ui" | "export";

type CornerDisplayForSvg = {
    fontSize?: number;
    placement?: "inside" | "outside";
    outsideHorizontal?: boolean;
    outsideVertical?: boolean;
};

const uid = () => {
    // browser 前提（export処理はフロントで動く想定）
    // cryptoがなければMath.random fallback
    const c: any = globalThis as any;
    if (c.crypto?.randomUUID) return c.crypto.randomUUID();
    return `id_${Math.random().toString(36).slice(2)}`;
};

export function buildLandingFigureSvg(
    area: any,
    opts?: {
        theme?: Theme;
        showCornerNumbers?: boolean;
        showRuler?: boolean;
        /** 単一ブロック時の四隅機体番号の表示（multiBlock の Corner と同趣旨） */
        cornerDisplay?: CornerDisplayForSvg;
        ruler?: {
            leftXOffsetPx?: number;
            bottomYOffsetPx?: number;
        };
    }
) {
    const theme: Theme = opts?.theme ?? "export";
    const showCornerNumbers = opts?.showCornerNumbers ?? true;
    const showRuler = opts?.showRuler ?? true;
    const rulerOpts = opts?.ruler ?? {};
    const leftXOffsetPx = Number.isFinite(rulerOpts.leftXOffsetPx)
        ? Number(rulerOpts.leftXOffsetPx)
        : 0;
    const bottomYOffsetPx = Number.isFinite(rulerOpts.bottomYOffsetPx)
        ? Number(rulerOpts.bottomYOffsetPx)
        : 0;
    const uiPad =
        theme === "ui"
            ? {
                  top: 2,
                  right: 40,
                  bottom: 28,
                  left: 50,
              }
            : undefined;
    const calcUiViewH = (aspect: number) => {
        // 横長ほど viewH を小さくして、横方向の収まりを優先する
        const raw = 330 - aspect * 28;
        return Math.max(220, Math.min(290, raw));
    };
    const xHint = Number(area?.drone_count?.x_count);
    const yHint = Number(area?.drone_count?.y_count);
    const uiAspectHint =
        Number.isFinite(xHint) && Number.isFinite(yHint) && xHint > 0 && yHint > 0
            ? xHint / yHint
            : 1;
    const m = buildLandingFigureModel(area, {
        viewH: theme === "ui" ? calcUiViewH(uiAspectHint) : undefined,
        pad: uiPad,
    });

    // export(白背景)で見えるように。uiは現状の色に寄せる。
    const labelColor = theme === "export" ? "#000000" : "#ffffff";
    const dimColor = theme === "export" ? "#000000" : "#ffffff";

    const cd = opts?.cornerDisplay;
    const placement = cd?.placement ?? "inside";
    const useOutsideH =
        placement === "outside" ? cd?.outsideHorizontal ?? true : false;
    const useOutsideV =
        placement === "outside" ? cd?.outsideVertical ?? true : false;
    let cornerNumberTexts = "";
    if (showCornerNumbers && m.canRenderFigure && m.corner) {
        const autoFontSize = Math.max(
            8,
            Math.min(10, Math.min(m.rectW, m.rectH) / 5),
        );
        const rawFs = cd?.fontSize;
        const fontSize =
            Number.isFinite(rawFs) && (rawFs as number) > 0
                ? Math.max(6, Math.min(16, rawFs as number))
                : autoFontSize;
        const insetY = Math.max(2, Math.min(8, fontSize * 0.7));
        const outsidePadX = Math.max(2, fontSize * 0.55);
        const outsidePadY = Math.max(2, fontSize * 0.65);
        const leftInsetX = 4;
        const rightInsetX = 4;
        const topRightX = m.cornerTrX;
        const tlX = useOutsideH ? m.rx - outsidePadX : m.rx + leftInsetX;
        const tlY = useOutsideV ? m.ry - outsidePadY : m.ry + insetY;
        const trX = useOutsideH
            ? topRightX + outsidePadX
            : topRightX - rightInsetX;
        const trY = tlY;
        const blX = tlX;
        const blY = useOutsideV
            ? m.ry + m.rectH + outsidePadY
            : m.ry + m.rectH - insetY;
        const brX = useOutsideH
            ? m.rx + m.rectW + outsidePadX
            : m.rx + m.rectW - rightInsetX;
        const brY = blY;
        const anchorTL = useOutsideH ? "end" : "start";
        const anchorTR = useOutsideH ? "start" : "end";
        const anchorBL = anchorTL;
        const anchorBR = anchorTR;
        cornerNumberTexts = `
            <text x="${tlX}" y="${tlY}" font-size="${fontSize}" fill="${labelColor}" text-anchor="${anchorTL}" dominant-baseline="middle" pointer-events="none" style="user-select: none;">${m.corner.tl}</text>
            <text x="${trX}" y="${trY}" font-size="${fontSize}" fill="${labelColor}" text-anchor="${anchorTR}" dominant-baseline="middle" pointer-events="none" style="user-select: none;">${m.corner.tr}</text>
            <text x="${blX}" y="${blY}" font-size="${fontSize}" fill="${labelColor}" text-anchor="${anchorBL}" dominant-baseline="middle" pointer-events="none" style="user-select: none;">${m.corner.bl}</text>
            <text x="${brX}" y="${brY}" font-size="${fontSize}" fill="${labelColor}" text-anchor="${anchorBR}" dominant-baseline="middle" pointer-events="none" style="user-select: none;">${m.corner.br}</text>
        `;
    }

    const rectStroke = "#ed1b24";
    const rectFill = "#ed1b24";

    const markerId = `arrow-${uid()}`;
    const msg =
        m.cannotRenderReason === "contradiction" && m.contradictionMessage
            ? m.contradictionMessage
            : "x機体数 / y機体数 / 間隔 を入力してください。";
    const msgLines = msg
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    return `
        <svg
        viewBox="0 0 ${m.viewW} ${m.viewH}"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        >
        <defs>
            <marker
            id="${markerId}"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            >
            <path d="M0,0 L6,3 L0,6 Z" fill="${dimColor}" />
            </marker>
        </defs>

        ${m.canRenderFigure
            ? `
            ${m.polygonPoints
                ? `<polygon
            points="${m.polygonPoints.map(([x, y]) => `${x},${y}`).join(" ")}"
            stroke="${rectStroke}"
            stroke-width="2"
            stroke-opacity="0.9"
            fill="${rectFill}"
            fill-opacity="0.35"
            />`
                : `<rect
            x="${m.rx}"
            y="${m.ry}"
            width="${m.rectW}"
            height="${m.rectH}"
            stroke="${rectStroke}"
            stroke-width="2"
            stroke-opacity="0.9"
            fill="${rectFill}"
            fill-opacity="0.35"
            />`
            }

            ${cornerNumberTexts}

            ${showRuler ? `
            <line
            x1="${m.rx}"
            y1="${m.ry + m.rectH + 26 + bottomYOffsetPx}"
            x2="${m.rx + m.rectW}"
            y2="${m.ry + m.rectH + 26 + bottomYOffsetPx}"
            stroke="${dimColor}"
            stroke-width="1"
            opacity="0.9"
            />
            <text
            x="${m.rx + m.rectW / 2}"
            y="${m.ry + m.rectH + 42 + bottomYOffsetPx}"
            font-size="12"
            fill="${dimColor}"
            text-anchor="middle"
            >${m.xOk ? `${fmtMeters(m.widthM)}m` : "—m"}</text>

            <line
            x1="${m.rx - 15 + leftXOffsetPx}"
            y1="${m.ry}"
            x2="${m.rx - 15 + leftXOffsetPx}"
            y2="${m.ry + m.rectH}"
            stroke="${dimColor}"
            stroke-width="1"
            opacity="0.9"
            />
            <text
            x="${m.rx - 20 + leftXOffsetPx}"
            y="${m.ry + m.rectH / 2}"
            font-size="12"
            fill="${dimColor}"
            text-anchor="end"
            dominant-baseline="middle"
            >${m.yOk ? `${fmtMeters(m.heightM)}m` : "—m"}</text>
            ` : ""}
        `
            : `
            <text
            x="${m.viewW / 2}"
            y="${m.viewH / 2}"
            dominant-baseline="middle"
            text-anchor="middle"
            font-size="15"
            fill="${labelColor}"
            opacity="0.9"
            >${msgLines
                .map(
                    (line, i, arr) =>
                        `<tspan x="${m.viewW / 2}" dy="${i === 0 ? -(arr.length - 1) * 9 : 18}">${line}</tspan>`
                )
                .join("")}</text>
        `
        }
        </svg>
        `.trim();
}
