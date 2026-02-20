// src/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg.ts

import { fmtMeters } from "@/features/hub/utils/spacing";
import { buildLandingFigureModel } from "@/features/hub/tabs/AreaInfo/figure/landingFigureModel";

type Theme = "ui" | "export";

const uid = () => {
    // browser 前提（export処理はフロントで動く想定）
    // cryptoがなければMath.random fallback
    const c: any = globalThis as any;
    if (c.crypto?.randomUUID) return c.crypto.randomUUID();
    return `id_${Math.random().toString(36).slice(2)}`;
};

export function buildLandingFigureSvg(area: any, opts?: { theme?: Theme }) {
    const theme: Theme = opts?.theme ?? "export";
    const m = buildLandingFigureModel(area);

    // export(白背景)で見えるように。uiは現状の色に寄せる。
    const labelColor = theme === "export" ? "#000000" : "#ffffff";
    const dimColor = theme === "export" ? "#000000" : "#ffffff";
    const rectStroke = "#ed1b24";
    const rectFill = "#ed1b24";

    const markerId = `arrow-${uid()}`;
    const msg = "x機体数 / y機体数 / 間隔 を入力してください";

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

            ${m.corner
                ? `
            <text x="${m.rx}" y="${m.ry - 8}" font-size="12" fill="${labelColor}" text-anchor="start">${m.corner.tl}</text>
            <text x="${m.cornerTrX}" y="${m.ry - 8}" font-size="12" fill="${labelColor}" text-anchor="end">${m.corner.tr}</text>
            <text x="${m.rx}" y="${m.ry + m.rectH + 16}" font-size="12" fill="${labelColor}" text-anchor="start">${m.corner.bl}</text>
            <text x="${m.rx + m.rectW}" y="${m.ry + m.rectH + 16}" font-size="12" fill="${labelColor}" text-anchor="end">${m.corner.br}</text>
            `
                : ``
            }

            <line
            x1="${m.rx}"
            y1="${m.ry + m.rectH + 26}"
            x2="${m.rx + m.rectW}"
            y2="${m.ry + m.rectH + 26}"
            stroke="${dimColor}"
            stroke-width="1"
            opacity="0.9"
            />
            <text
            x="${m.rx + m.rectW / 2}"
            y="${m.ry + m.rectH + 42}"
            font-size="12"
            fill="${dimColor}"
            text-anchor="middle"
            >${m.xOk ? `${fmtMeters(m.widthM)}m` : "—m"}</text>

            <line
            x1="${m.rx - 15}"
            y1="${m.ry}"
            x2="${m.rx - 15}"
            y2="${m.ry + m.rectH}"
            stroke="${dimColor}"
            stroke-width="1"
            opacity="0.9"
            />
            <text
            x="${m.rx - 20}"
            y="${m.ry + m.rectH / 2}"
            font-size="12"
            fill="${dimColor}"
            text-anchor="end"
            dominant-baseline="middle"
            >${m.yOk ? `${fmtMeters(m.heightM)}m` : "—m"}</text>
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
            >${msg}</text>
        `
        }
        </svg>
        `.trim();
}
