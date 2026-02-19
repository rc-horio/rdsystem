// src/pages/parts/geometry/AudienceEditor.ts
import { toRad, toDeg, normalizeAngleDeg, fromLocalXY, toLocalXY } from "./math";
import type { Geometry, LngLat, RectangleGeom, OrientedRect } from "@/features/types";
import { markerBase, ROTATE_HANDLE_GAP_M, Z } from "../constants/events";

export type AudienceEditorOpts = {
    // Map / Google Maps accessors
    getMap: () => google.maps.Map | null;
    getGMaps: () => typeof google.maps;
    latLng: (lat: number, lng: number) => google.maps.LatLng;

    // App context
    isEditingOn: () => boolean;
    getCurrentGeom: () => Geometry | null;
    setCurrentGeom: (g: Geometry) => void;

    // Side-effects
    pushOverlay: (ov: google.maps.Polygon | google.maps.Marker | google.maps.Polyline | google.maps.Circle) => void;
    onMetrics: (metrics: Partial<{ spectatorWidth_m: number; spectatorDepth_m: number }>) => void;

    // 距離測定モード中はオーバーレイをクリック不可・十字カーソルにする
    getMeasurementMode?: () => boolean;
};

export class AudienceEditor {
    private opts: AudienceEditorOpts;

    private poly?: google.maps.Polygon;
    private cornerMarkers?: google.maps.Marker[];
    private rotateMarker?: google.maps.Marker | null;

    // setPaths 競合抑制
    private suppressPolyUpdateRef = false;

    constructor(opts: AudienceEditorOpts) {
        this.opts = opts;
    }

    /** 呼び出し元の overlays を消した後に参照だけクリア */
    clear() {
        this.poly = undefined;
        this.cornerMarkers = undefined;
        this.rotateMarker = undefined;
        this.suppressPolyUpdateRef = false;
    }

    /** 編集ON/OFFの反映（ドラッグ可否やカーソル・タイトル） */
    syncEditingInteractivity() {
        const isMeasurement = this.opts.getMeasurementMode?.() ?? false;
        if (isMeasurement) {
            if (this.poly) this.poly.setOptions({ clickable: false, cursor: "crosshair" } as google.maps.PolygonOptions);
            return;
        }

        const isEdit = this.opts.isEditingOn();
        if (this.poly) this.poly.setOptions({ clickable: true, cursor: isEdit ? "grab" : "default", draggable: isEdit } as google.maps.PolygonOptions);
        if (this.cornerMarkers) {
            this.cornerMarkers.forEach((mk) => {
                mk.setDraggable(isEdit);
                mk.setVisible(isEdit);
                mk.setOptions({
                    cursor: isEdit ? "grab" : "default",
                    title: isEdit ? "ドラッグで角を移動（直角を維持）" : "編集ONで角を移動できます",
                });
            });
        }
        if (this.rotateMarker) {
            this.rotateMarker.setDraggable(isEdit);
            this.rotateMarker.setVisible(isEdit);
            this.rotateMarker.setOptions({
                cursor: isEdit ? "grab" : "default",
                title: isEdit ? "ドラッグで回転" : "編集ONで回転できます",
            });
        }
    }

    /** ジオメトリから観客矩形を描画し、bounds を拡張。初期メトリクスを返す */
    render(geom: Geometry, bounds: google.maps.LatLngBounds): {
        hasAudience: boolean;
        metrics?: { spectatorWidth_m: number; spectatorDepth_m: number };
    } {
        const audience =
            geom.audienceArea?.type === "rectangle" &&
                Array.isArray(geom.audienceArea.coordinates) &&
                geom.audienceArea.coordinates.length >= 4
                ? (geom.audienceArea as RectangleGeom)
                : undefined;

        if (!audience) return { hasAudience: false };

        // 本体
        this.poly = this.drawRectangle(audience.coordinates, {
            strokeColor: "#1e88e5",
            fillColor: "#1e88e5",
            fillOpacity: 0.4,
            strokeOpacity: 0.9,
            zIndex: Z.OVERLAY.TAKEOFF, // 飛行より下でもOK。必要なら専用zIndexに。
            draggable: this.opts.isEditingOn(),
            clickable: true,
        });
        this.poly.getPath().forEach((p) => bounds.extend(p as google.maps.LatLng));

        // ハンドル
        this.drawCornerHandles(audience.coordinates);
        this.drawRotateHandle(audience.coordinates);

        // 初期メトリクス
        const base = this.rectParamsFromCoords(audience.coordinates);
        if (base) {
            return {
                hasAudience: true,
                metrics: {
                    spectatorWidth_m: Math.round(base.w),
                    spectatorDepth_m: Math.round(base.h),
                },
            };
        }
        return { hasAudience: true };
    }

    /** パネルからの寸法適用（幅/奥行） */
    applyPanelAudienceMetrics(spectatorWidth_m?: number, spectatorDepth_m?: number) {
        const a = this.opts.getCurrentGeom()?.audienceArea;
        if (a?.type !== "rectangle" || !Array.isArray(a.coordinates) || a.coordinates.length < 4) return;

        const base = this.rectParamsFromCoords(a.coordinates);
        if (!base) return;

        const clampLen = (v?: number) =>
            typeof v === "number" && Number.isFinite(v) ? Math.max(0.1, v) : undefined;

        const wIn = clampLen(spectatorWidth_m);
        const dIn = clampLen(spectatorDepth_m);

        const next: OrientedRect = {
            center: base.center,
            rotation_deg: base.rotation_deg,
            w: wIn ?? base.w,
            h: dIn ?? base.h,
        };
        const coords = this.rectCornersFromParams(next);

        // パネルからの更新時はメトリクス更新をスキップ（applyPanelAudienceMetricsで明示的に呼ぶため）
        this.updateOverlays(coords, { skipMetrics: true });
        this.opts.setCurrentGeom({
            ...(this.opts.getCurrentGeom() ?? {}),
            audienceArea: { ...a, coordinates: coords },
        } as Geometry);

        // パネルからの更新時は明示的にメトリクスを送信（値が確定した後）
        this.opts.onMetrics({
            spectatorWidth_m: Math.round(next.w),
            spectatorDepth_m: Math.round(next.h),
        });
    }

    // =============== 内部実装 ===============
    /** 観客矩形を描画 */
    private drawRectangle(
        coordsLngLat: Array<LngLat>,
        style: Partial<google.maps.PolygonOptions> = {}
    ) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const path = coordsLngLat.map(([lng, lat]) => this.opts.latLng(lat, lng));
        const poly = new gmaps.Polygon({
            paths: path,
            // 外枠線の色
            strokeColor: "#1e88e5",
            // 外枠線の不透明度（0〜1）
            strokeOpacity: 0.9,
            // 外枠線の太さ（px）
            strokeWeight: 2,
            // 塗りつぶし色
            fillColor: "#1e88e5",
            // 塗りつぶしの不透明度（0〜1）
            fillOpacity: 0.12,
            // クリックイベントを受け取るかどうか
            clickable: true,
            // ドラッグで移動できるかどうか
            draggable: this.opts.isEditingOn(),
            ...style,
            map,
        });

        // 本体ドラッグで同期
        poly.addListener("drag", () => {
            const coords = this.getCoordsFromPolygon(poly);
            this.suppressPolyUpdateRef = true;
            this.updateOverlays(coords);
            this.suppressPolyUpdateRef = false;
        });

        poly.addListener("dragend", () => {
            const coords = this.getCoordsFromPolygon(poly);
            const prev = this.opts.getCurrentGeom();
            if (!prev?.audienceArea) return;
            this.opts.setCurrentGeom({
                ...prev,
                audienceArea: { ...prev.audienceArea, coordinates: coords },
            } as Geometry);
        });

        this.opts.pushOverlay(poly);
        return poly;
    }

    /** 角ハンドルを描画 */
    private drawCornerHandles(coords: Array<LngLat>) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        if (!coords || coords.length < 4) return;

        const baseZ = markerBase(gmaps);
        const cornerMarkers: google.maps.Marker[] = [];

        coords.forEach(([lng, lat], i) => {
            const pos = this.opts.latLng(lat, lng);
            const marker = new gmaps.Marker({
                position: pos,
                clickable: true,
                // ドラッグ操作の可否
                draggable: this.opts.isEditingOn(),
                // 編集オンのときだけ表示
                visible: this.opts.isEditingOn(),
                // マウスカーソルの形
                cursor: this.opts.isEditingOn() ? "grab" : "default",
                title: this.opts.isEditingOn() ? "ドラッグで角を移動（直角を維持）" : "編集ONで角を移動できます",
                zIndex: baseZ + Z.MARKER_OFFSET.CORNER,
                icon: {
                    path: gmaps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#000000",
                    strokeWeight: 1.5,
                } as google.maps.Symbol,
                map,
            });

            let baseRect: OrientedRect | null = null;
            const oppIdx = (i + 2) % 4;

            marker.addListener("dragstart", () => {
                if (!this.opts.isEditingOn()) return;
                baseRect = this.rectParamsFromCoords(
                    (this.opts.getCurrentGeom()?.audienceArea?.coordinates || coords)
                );
            });

            marker.addListener("drag", () => {
                if (!this.opts.isEditingOn() || !baseRect) return;
                const dragged = marker.getPosition();
                if (!dragged) return;

                const newCorner: LngLat = [dragged.lng(), dragged.lat()];
                const fixedOpp: LngLat = (this.opts.getCurrentGeom()?.audienceArea?.coordinates || coords)[oppIdx];

                const newCenter: LngLat = [(newCorner[0] + fixedOpp[0]) / 2, (newCorner[1] + fixedOpp[1]) / 2];

                const theta = toRad(baseRect.rotation_deg);
                const u = { x: Math.cos(theta), y: Math.sin(theta) };
                const v = { x: -Math.sin(theta), y: Math.cos(theta) };

                const d = {
                    x: toLocalXY(newCenter, newCorner).x - toLocalXY(newCenter, fixedOpp).x,
                    y: toLocalXY(newCenter, newCorner).y - toLocalXY(newCenter, fixedOpp).y,
                };
                const projU = d.x * u.x + d.y * u.y;
                const projV = d.x * v.x + d.y * v.y;

                const w = Math.abs(projU);
                const h = Math.abs(projV);

                const next: OrientedRect = {
                    center: newCenter,
                    w: Math.max(0.1, w),
                    h: Math.max(0.1, h),
                    rotation_deg: baseRect.rotation_deg,
                };

                const nextCoords = this.rectCornersFromParams(next);
                this.updateOverlays(nextCoords);
            });

            marker.addListener("dragend", () => {
                if (!this.opts.isEditingOn() || !baseRect) return;
                if (!this.cornerMarkers || this.cornerMarkers.length < 4) return;
                const finalCoords: Array<LngLat> = this.cornerMarkers.map((mk) => {
                    const p = mk.getPosition()!;
                    return [p.lng(), p.lat()];
                });

                const prev = this.opts.getCurrentGeom();
                if (!prev?.audienceArea) return;
                this.opts.setCurrentGeom({
                    ...prev,
                    audienceArea: { ...prev.audienceArea, coordinates: finalCoords },
                } as Geometry);

                const r = this.rectParamsFromCoords(finalCoords);
                if (r) {
                    this.opts.onMetrics({
                        spectatorWidth_m: Math.round(r.w),
                        spectatorDepth_m: Math.round(r.h),
                    });
                }
            });

            this.opts.pushOverlay(marker);
            cornerMarkers.push(marker);
        });

        this.cornerMarkers = cornerMarkers;
    }

    /** 回転ハンドルを描画 */
    private drawRotateHandle(coords: Array<LngLat>) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        if (!coords || coords.length < 4) return;

        const rect = this.rectParamsFromCoords(coords);
        if (!rect) return;
        const theta = toRad(rect.rotation_deg);
        const vx = -Math.sin(theta), vy = Math.cos(theta);
        const offset = ROTATE_HANDLE_GAP_M;
        const hx = (rect.h / 2 + offset) * vx;
        const hy = (rect.h / 2 + offset) * vy;
        const handleLngLat = fromLocalXY(rect.center, hx, hy);
        const baseZ = markerBase(gmaps);

        const marker = new gmaps.Marker({
            position: this.opts.latLng(handleLngLat[1], handleLngLat[0]),
            draggable: this.opts.isEditingOn(),
            visible: this.opts.isEditingOn(),
            title: this.opts.isEditingOn() ? "ドラッグで回転" : "編集ONで回転できます",
            cursor: this.opts.isEditingOn() ? "grab" : "default",
            zIndex: baseZ + Z.MARKER_OFFSET.ROTATE,
            icon: {
                path: gmaps.SymbolPath.CIRCLE,
                scale: 5.5,
                fillColor: "#ffd54f",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 1.5,
            } as google.maps.Symbol,
            map,
        });

        let base: OrientedRect | null = null;

        marker.addListener("dragstart", () => {
            if (!this.opts.isEditingOn()) return;
            base = this.rectParamsFromCoords(
                this.opts.getCurrentGeom()?.audienceArea?.coordinates || coords
            );
        });

        marker.addListener("drag", () => {
            if (!this.opts.isEditingOn() || !base) return;
            const pos = marker.getPosition();
            if (!pos) return;

            const p: LngLat = [pos.lng(), pos.lat()];
            const v = toLocalXY(base.center, p);
            const angle = Math.atan2(v.y, v.x);
            const newRot = normalizeAngleDeg(toDeg(angle) - 90);

            const next: OrientedRect = {
                center: base.center,
                w: base.w,
                h: base.h,
                rotation_deg: newRot,
            };
            const nextCoords = this.rectCornersFromParams(next);
            this.updateOverlays(nextCoords);
        });

        marker.addListener("dragend", () => {
            if (!this.opts.isEditingOn() || !base) return;
            if (!this.cornerMarkers || this.cornerMarkers.length < 4) return;
            const finalCoords: Array<LngLat> = this.cornerMarkers.map((mk) => {
                const p = mk.getPosition()!;
                return [p.lng(), p.lat()];
            });

            const prev = this.opts.getCurrentGeom();
            if (!prev?.audienceArea) return;
            this.opts.setCurrentGeom({
                ...prev,
                audienceArea: { ...prev.audienceArea, coordinates: finalCoords },
            } as Geometry);
        });

        this.rotateMarker = marker;
        this.opts.pushOverlay(marker);
    }

    /** ポリゴンから座標を取得 */
    private getCoordsFromPolygon(poly: google.maps.Polygon): Array<LngLat> {
        const path = poly.getPath();
        const coords: Array<LngLat> = [];
        for (let i = 0; i < path.getLength(); i++) {
            const p = path.getAt(i);
            coords.push([p.lng(), p.lat()]);
        }
        return coords;
    }

    /** オーバーレイを更新 */
    private updateOverlays(coords: Array<LngLat>, opts?: { skipMetrics?: boolean }) {
        if (!this.poly || !this.cornerMarkers || this.cornerMarkers.length < 4) return;

        const path = coords.map(([lng, lat]) => this.opts.latLng(lat, lng));
        if (!this.suppressPolyUpdateRef) this.poly.setPaths(path);

        this.cornerMarkers.forEach((mk, i) => {
            const [lng, lat] = coords[i];
            mk.setPosition(this.opts.latLng(lat, lng));
        });

        if (this.rotateMarker) {
            const rect = this.rectParamsFromCoords(coords);
            if (rect) {
                const theta = toRad(rect.rotation_deg);
                const vx = -Math.sin(theta), vy = Math.cos(theta);
                const offset = ROTATE_HANDLE_GAP_M;
                const hx = (rect.h / 2 + offset) * vx;
                const hy = (rect.h / 2 + offset) * vy;
                const handleLngLat = fromLocalXY(rect.center, hx, hy);
                this.rotateMarker.setPosition(this.opts.latLng(handleLngLat[1], handleLngLat[0]));
            }
        }

        // メトリクス送信 - パネルからの更新時はスキップ（applyPanelAudienceMetricsで明示的に呼ぶため）
        if (!opts?.skipMetrics) {
            const r = this.rectParamsFromCoords(coords);
            if (r) {
                // drag中はcurrentGeomRefが更新されていない可能性があるため、
                // 現在の観客エリアの座標を明示的に渡す
                this.opts.onMetrics({
                    spectatorWidth_m: Math.round(r.w),
                    spectatorDepth_m: Math.round(r.h),
                    audienceCoordsOverride: coords, // drag中の現在座標を渡す
                } as any);
            }
        }
    }

    /** 座標から矩形パラメータを取得 */
    private rectParamsFromCoords(coords: Array<LngLat>): OrientedRect | null {
        if (!Array.isArray(coords) || coords.length < 4) return null;
        const p0 = coords[0], p1 = coords[1], p2 = coords[2];
        const center: LngLat = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];

        const a0 = toLocalXY(center, p0);
        const a1 = toLocalXY(center, p1);
        const a2 = toLocalXY(center, p2);

        const dx01 = a1.x - a0.x, dy01 = a1.y - a0.y;
        const dx12 = a2.x - a1.x, dy12 = a2.y - a1.y;
        const w = Math.hypot(dx01, dy01);
        const h = Math.hypot(dx12, dy12);
        const rotation_deg = normalizeAngleDeg(toDeg(Math.atan2(dy01, dx01)));

        return { center, w, h, rotation_deg };
    }

    /** 矩形パラメータから角座標を取得 */
    private rectCornersFromParams(rect: OrientedRect): Array<LngLat> {
        const { center, w, h, rotation_deg } = rect;
        const theta = toRad(rotation_deg);
        const ux = Math.cos(theta), uy = Math.sin(theta);
        const vx = -Math.sin(theta), vy = Math.cos(theta);
        const hw = w / 2, hh = h / 2;

        const off = (x: number, y: number) => fromLocalXY(center, x, y);

        const p0 = off(-hw * ux - hh * vx, -hw * uy - hh * vy);
        const p1 = off(+hw * ux - hh * vx, +hw * uy - hh * vy);
        const p2 = off(+hw * ux + hh * vx, +hw * uy + hh * vy);
        const p3 = off(-hw * ux + hh * vx, -hw * uy + hh * vy);
        return [p0, p1, p2, p3];
    }
}
