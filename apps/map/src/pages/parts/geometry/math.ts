// src/pages/parts/geometry/math.ts

// 度をラジアンに変換
export const toRad = (d: number) => (d * Math.PI) / 180;
// ラジアンを度に変換
export const toDeg = (r: number) => (r * 180) / Math.PI;

// 角度を正規化
export const normalizeAngleDeg = (deg: number) => {
    let a = deg % 360;
    return a < 0 ? a + 360 : a;
};

// 緯度1度あたりのメートル数
export const metersPerDegreeLat = 111320;

// 経度1度あたりのメートル数
export const metersPerDegreeLonAt = (lat: number) => 111320 * Math.cos(toRad(lat));

// 緯度経度をローカルXYに変換
export const toLocalXY = (origin: [number, number], p: [number, number]) => {
    const lat0 = origin[1];
    return {
        x: (p[0] - origin[0]) * metersPerDegreeLonAt(lat0),
        y: (p[1] - origin[1]) * metersPerDegreeLat,
    };
};

// 座標を緯度経度に変換
export const fromLocalXY = (origin: [number, number], x: number, y: number): [number, number] => {
    const lat0 = origin[1];
    return [
        origin[0] + x / metersPerDegreeLonAt(lat0),
        origin[1] + y / metersPerDegreeLat,
    ];
};
