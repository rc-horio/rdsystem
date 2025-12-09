// apps\map\src\components\utils\detectEmbedMode.ts

/**
 * 埋め込みモード（?mode=embed / ?mode=mapOnly / ?sidebar=closed など）を検出する。
 * DesktopLayout / SideListBar / SideDetailBar で共通利用。
 */
export function detectEmbedMode(): boolean {
    try {
        const params = new URLSearchParams(window.location.search);

        const mode = params.get("mode");
        if (mode === "embed" || mode === "mapOnly") return true;

        const sidebar = params.get("sidebar");
        if (sidebar === "closed" || sidebar === "0") return true;
    } catch {
        // パース不能なら通常モード扱い
    }
    return false;
}
