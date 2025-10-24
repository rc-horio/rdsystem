// src/components/map/markerIcon.ts
export type MarkerAnchor =
    | "bottom"   // 下中央（ピン先端が座標）
    | "center"   // 中央
    | { x: number; y: number }; // 任意px

export function createMarkerIcon(
    gmaps: typeof google.maps,
    opts?: {
        url?: string;
        /** 幅(px)。sizeと併用可。未指定時は size を使用、なければ 28 */
        width?: number;
        /** 高さ(px)。sizeと併用可。未指定時は size を使用、なければ 28 */
        height?: number;
        /** 幅高さが同じ場合のショートカット */
        size?: number;
        anchor?: MarkerAnchor;
    }
): google.maps.Icon {
    const iconSrc = `${import.meta.env.BASE_URL}icon_marker.png`;
    const url = opts?.url ?? iconSrc;
    const w = (opts?.width ?? opts?.size ?? 28);
    const h = (opts?.height ?? opts?.size ?? 28);

    const scaledSize = new gmaps.Size(w, h);

    let anchorPoint: google.maps.Point;
    const a = opts?.anchor ?? "bottom";
    if (a === "bottom") anchorPoint = new gmaps.Point(w / 2, h);
    else if (a === "center") anchorPoint = new gmaps.Point(w / 2, h / 2);
    else anchorPoint = new gmaps.Point(a.x, a.y);

    return {
        url,
        scaledSize,
        anchor: anchorPoint,
    };
}
