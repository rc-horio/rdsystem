// src/pages/parts/geometry/EllipseEditor.ts
import { toRad, toDeg, normalizeAngleDeg, fromLocalXY, toLocalXY } from "./math";
import type { Geometry, EllipseGeom, LngLat } from "@/features/types";
import { markerBase, ROTATE_HANDLE_GAP_M, FRONT_LABEL_OFFSET_M, Z } from "../constants/events";
import { setEllipseBearingDeg } from "./orientationDebug";

// 楕円編集用オプション
export type EllipseEditorOpts = {
    // Map / Google Maps accessors
    getMap: () => google.maps.Map | null;
    getGMaps: () => typeof google.maps;
    latLng: (lat: number, lng: number) => google.maps.LatLng;

    // App context
    isEditingOn: () => boolean;
    getCurrentGeom: () => Geometry | null;
    setCurrentGeom: (g: Geometry) => void;
    getSafetyBuffer: () => number;
    getSafetyMode?: () => "new" | "old" | "custom";

    // Side-effects
    pushOverlay: (ov: google.maps.Polygon | google.maps.Marker | google.maps.Polyline | google.maps.Circle) => void;
    onMetrics: (metrics: Partial<{ flightWidth_m: number; flightDepth_m: number; flightRotation_deg?: number }>) => void;
    onCenterChanged?: (center: LngLat) => void; // 例: 矢印更新などに使用
    onSafetyBufferChanged?: (buffer_m: number) => void; // 保安距離を図形編集で変更したとき

    // Shift+ドラッグ時: 飛行中心の移動を制約（動いていない方の矢印を固定）
    constrainFlightCenterForShiftDrag?: (oldTo: LngLat, newTo: LngLat, from: LngLat) => LngLat | null;
    getShiftKey?: () => boolean;

    // 距離測定モード中はオーバーレイをクリック不可・十字カーソルにする
    getMeasurementMode?: () => boolean;
};

// 楕円編集クラス
export class EllipseEditor {
    private opts: EllipseEditorOpts;

    // 楕円（飛行/保安）とハンドル参照
    private poly?: google.maps.Polygon;
    private safetyPoly?: google.maps.Polygon;
    private centerMarker?: google.maps.Marker | null;
    private rxMarker?: google.maps.Marker | null;
    private ryMarker?: google.maps.Marker | null;
    private rotateMarker?: google.maps.Marker | null;
    private frontLabelMarker?: google.maps.Marker | null;
    private safetyRxMarker?: google.maps.Marker | null;
    private safetyRyMarker?: google.maps.Marker | null;

    // width 方向の直径ライン
    private widthDiameterLine?: google.maps.Polyline;
    // depth 方向の直径ライン
    private depthDiameterLine?: google.maps.Polyline;

    // setPaths の競合抑制
    private suppressEllipseUpdateRef = false;

    // Shift+ドラッグ制約用（再入防止）
    private isProcessingFlightDragRef = false;

    // 画面端まで延長するため、bounds 変更時に直径線を再描画
    private boundsListener: google.maps.MapsEventListener | null = null;

    constructor(opts: EllipseEditorOpts) {
        this.opts = opts;
    }

    /** 呼び出し元（MapGeometry）で overlays を消した後に参照だけクリア */
    clear() {
        this.poly = undefined;
        this.safetyPoly = undefined;
        this.centerMarker = undefined;
        this.rxMarker = undefined;
        this.ryMarker = undefined;
        this.rotateMarker = undefined;
        this.frontLabelMarker = undefined;
        this.safetyRxMarker = undefined;
        this.safetyRyMarker = undefined;
        if (this.widthDiameterLine) {
            this.widthDiameterLine.setMap(null);
            this.widthDiameterLine = undefined;
        }
        if (this.depthDiameterLine) {
            this.depthDiameterLine.setMap(null);
            this.depthDiameterLine = undefined;
        }
        if (this.boundsListener) {
            google.maps.event.removeListener(this.boundsListener);
            this.boundsListener = null;
        }
        this.suppressEllipseUpdateRef = false;
    }

    /** 編集ON/OFFの反映（ドラッグ可否やカーソル・タイトル） */
    syncEditingInteractivity() {
        const isMeasurement = this.opts.getMeasurementMode?.() ?? false;
        if (isMeasurement) {
            // 測定モード中: ポリゴンをクリック不可・十字カーソルにして地図クリックを通す
            if (this.poly) this.poly.setOptions({ clickable: false, cursor: "crosshair" } as google.maps.PolygonOptions);
            if (this.safetyPoly) this.safetyPoly.setOptions({ clickable: false, cursor: "crosshair" } as google.maps.PolygonOptions);
            return;
        }

        const isEdit = this.opts.isEditingOn();

        if (this.centerMarker) {
            this.centerMarker.setDraggable(isEdit);
            this.centerMarker.setVisible(isEdit);
            this.centerMarker.setOptions({
                cursor: isEdit ? "grab" : "default",
                title: isEdit ? "ドラッグで中心を移動" : "編集ONで中心を移動できます",
            });
        }
        if (this.rxMarker) {
            this.rxMarker.setDraggable(isEdit);
            this.rxMarker.setVisible(isEdit);
            this.rxMarker.setOptions({
                cursor: isEdit ? "ew-resize" : "default",
                title: isEdit ? "ドラッグで長径半径を変更" : "編集ONで変更できます",
            });
        }
        if (this.ryMarker) {
            this.ryMarker.setDraggable(isEdit);
            this.ryMarker.setVisible(isEdit);
            this.ryMarker.setOptions({
                cursor: isEdit ? "ns-resize" : "default",
                title: isEdit ? "ドラッグで短径半径を変更" : "編集ONで変更できます",
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
        if (this.frontLabelMarker) {
            this.frontLabelMarker.setVisible(isEdit);
        }
        if (this.poly) this.poly.setOptions({ clickable: true, cursor: isEdit ? "grab" : "default", draggable: isEdit } as google.maps.PolygonOptions);
        // safetyPoly は常に非ドラッグ

        // 保安エリアハンドル: 編集ONかつ「新」「旧」「任」のいずれかのとき表示・ドラッグ可能
        const safetyMode = this.opts.getSafetyMode?.();
        const showSafetyHandles = isEdit && (safetyMode === "custom" || safetyMode === "new" || safetyMode === "old");
        if (this.safetyRxMarker) {
            this.safetyRxMarker.setDraggable(showSafetyHandles);
            this.safetyRxMarker.setVisible(showSafetyHandles);
            const safetyTitle =
                safetyMode === "custom" ? "ドラッグで保安距離を変更" :
                safetyMode === "new" || safetyMode === "old" ? "ドラッグで飛行エリアを変更" :
                "編集ONで変更できます";
            this.safetyRxMarker.setOptions({
                cursor: showSafetyHandles ? "ew-resize" : "default",
                title: showSafetyHandles ? safetyTitle : "編集ONで変更できます",
            });
        }
        if (this.safetyRyMarker) {
            this.safetyRyMarker.setDraggable(showSafetyHandles);
            this.safetyRyMarker.setVisible(showSafetyHandles);
            const safetyTitle =
                safetyMode === "custom" ? "ドラッグで保安距離を変更" :
                safetyMode === "new" || safetyMode === "old" ? "ドラッグで飛行エリアを変更" :
                "編集ONで変更できます";
            this.safetyRyMarker.setOptions({
                cursor: showSafetyHandles ? "ns-resize" : "default",
                title: showSafetyHandles ? safetyTitle : "編集ONで変更できます",
            });
        }
    }

    /** ジオメトリから楕円を描画し、bounds を拡張。初期メトリクスを返す */
    render(geom: Geometry, bounds: google.maps.LatLngBounds): {
        hasFlight: boolean;
        metrics?: { flightWidth_m: number; flightDepth_m: number };
    } {
        const flight =
            geom.flightArea?.type === "ellipse" && Array.isArray(geom.flightArea.center)
                ? (geom.flightArea as EllipseGeom)
                : undefined;

        if (!flight) return { hasFlight: false };

        // 飛行エリア本体
        const { poly } = this.drawEllipse(
            [flight.center[0], flight.center[1]],
            Number(flight.radiusX_m) || 0,
            Number(flight.radiusY_m) || 0,
            Number(flight.rotation_deg) || 0,
            {
                strokeColor: "#00c853",
                fillColor: "#00c853",
                zIndex: 20,
                draggable: this.opts.isEditingOn(),
                clickable: true,
            }
        );
        this.poly = poly;
        this.opts.pushOverlay(poly);
        poly.getPath().forEach((p) => bounds.extend(p));

        // ハンドル群
        this.drawFlightCenterHandle(flight);
        this.drawFlightRadiusHandles(flight);
        this.drawFlightRotateHandle(flight);

        // 本体ドラッグ
        this.wireFlightPolygonDrag();

        // 保安エリア（追従）
        if (geom.safetyArea?.type === "ellipse") {
            const buffer = Number(this.opts.getSafetyBuffer()) || 0;
            const { poly: safety } = this.drawEllipse(
                [flight.center[0], flight.center[1]],
                (Number(flight.radiusX_m) || 0) + buffer,
                (Number(flight.radiusY_m) || 0) + buffer,
                Number(flight.rotation_deg) || 0,
                {
                    strokeColor: "#ffd54f",
                    fillColor: "#ffd54f",
                    zIndex: Z.OVERLAY.SAFETY,
                    clickable: false,
                    draggable: false,
                }
            );
            this.safetyPoly = safety;
            this.opts.pushOverlay(safety);
            safety.getPath().forEach((p) => bounds.extend(p));

            // 保安エリアハンドル（「任」モード時のみ編集ONで表示）
            this.drawSafetyBufferHandles(flight, buffer);
        }

        // width 方向の直径を描画
        this.drawWidthDiameter(
            [flight.center[0], flight.center[1]],
            Number(flight.radiusX_m) || 0,
            Number(flight.rotation_deg) || 0,
        );
        // depth 方向の直径を描画
        this.drawDepthDiameter(
            [flight.center[0], flight.center[1]],
            Number(flight.radiusY_m) || 0,
            Number(flight.rotation_deg) || 0,
        );

        // パン・ズーム時に直径線を画面端まで再延長
        if (this.boundsListener) {
            google.maps.event.removeListener(this.boundsListener);
        }
        const map = this.opts.getMap();
        if (map) {
            this.boundsListener = google.maps.event.addListener(map, "bounds_changed", () => {
                const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
                if (!cur || !this.poly) return;
                this.drawWidthDiameter(cur.center, Number(cur.radiusX_m) || 0, Number(cur.rotation_deg) || 0);
                this.drawDepthDiameter(cur.center, Number(cur.radiusY_m) || 0, Number(cur.rotation_deg) || 0);
            });
        }

        // 初期メトリクスは呼び出し元へ返す（以降のインタラクションは onMetrics で都度更新）
        const metrics = {
            flightWidth_m: Math.max(0, Number(flight.radiusX_m) || 0) * 2,
            flightDepth_m: Math.max(0, Number(flight.radiusY_m) || 0) * 2,
        };

        return { hasFlight: true, metrics };
    }

    /** 外部（パネル入力など）から楕円表示を更新したいときに呼ぶ */
    updateOverlays(center: LngLat, radiusX_m: number, radiusY_m: number, rotation_deg: number, opts?: { skipMetrics?: boolean; bufferOverride?: number }) {
        if (!this.poly) return;

        const centerLL = this.opts.latLng(center[1], center[0]);
        const path = this.genEllipsePath(centerLL, radiusX_m, radiusY_m, rotation_deg);
        if (!this.suppressEllipseUpdateRef) this.poly.setPaths(path);

        // === 保安エリア追従（buffer_m） ===
        const buffer = opts?.bufferOverride ?? (Number(this.opts.getSafetyBuffer()) || 0);

        // safetyPoly が未生成でも、Geometry が safetyArea=ellipse なら作る
        if (!this.safetyPoly && this.opts.getCurrentGeom()?.safetyArea?.type === "ellipse") {
            const { poly: safety } = this.drawEllipse(
                [center[0], center[1]],
                Math.max(0, radiusX_m + buffer),
                Math.max(0, radiusY_m + buffer),
                rotation_deg,
                {
                    strokeColor: "#ffd54f",
                    fillColor: "#ffd54f",
                    zIndex: Z.OVERLAY.SAFETY,
                    clickable: false,
                    draggable: false,
                }
            );
            this.safetyPoly = safety;
            this.opts.pushOverlay(safety);
        } else if (this.safetyPoly) {
            // 既存があればパス更新
            const spath = this.genEllipsePath(
                centerLL,
                Math.max(0, radiusX_m + buffer),
                Math.max(0, radiusY_m + buffer),
                rotation_deg
            );
            this.safetyPoly.setPaths(spath);
        }

        // ハンドル位置の同期
        if (this.centerMarker) this.centerMarker.setPosition(centerLL);
        if (this.rxMarker || this.ryMarker || this.rotateMarker || this.frontLabelMarker) {
            const phi = toRad(rotation_deg || 0);
            const ux = Math.cos(phi), uy = Math.sin(phi);
            const vx = -Math.sin(phi), vy = Math.cos(phi);

            const rxP = fromLocalXY(center, ux * radiusX_m, uy * radiusX_m);
            const ryP = fromLocalXY(center, vx * radiusY_m, vy * radiusY_m);
            const rotP = fromLocalXY(center, vx * (radiusY_m + ROTATE_HANDLE_GAP_M), vy * (radiusY_m + ROTATE_HANDLE_GAP_M));
            const frontLabelP = fromLocalXY(center, vx * (radiusY_m + FRONT_LABEL_OFFSET_M), vy * (radiusY_m + FRONT_LABEL_OFFSET_M));

            if (this.rxMarker) this.rxMarker.setPosition(this.opts.latLng(rxP[1], rxP[0]));
            if (this.ryMarker) this.ryMarker.setPosition(this.opts.latLng(ryP[1], ryP[0]));
            if (this.rotateMarker) this.rotateMarker.setPosition(this.opts.latLng(rotP[1], rotP[0]));
            if (this.frontLabelMarker) this.frontLabelMarker.setPosition(this.opts.latLng(frontLabelP[1], frontLabelP[0]));

            // 保安エリアハンドル位置の同期（X/Y方向）
            const safetyRxP = fromLocalXY(center, ux * (radiusX_m + buffer), uy * (radiusX_m + buffer));
            const safetyRyP = fromLocalXY(center, vx * (radiusY_m + buffer), vy * (radiusY_m + buffer));
            if (this.safetyRxMarker) this.safetyRxMarker.setPosition(this.opts.latLng(safetyRxP[1], safetyRxP[0]));
            if (this.safetyRyMarker) this.safetyRyMarker.setPosition(this.opts.latLng(safetyRyP[1], safetyRyP[0]));
        }

        // メトリクス更新（幅/奥行き/角度）- パネルからの更新時はスキップ
        if (!opts?.skipMetrics) {
            // drag中はcurrentGeomRefが更新されていない可能性があるため、
            // 現在の中心位置を明示的に渡す
            this.opts.onMetrics({
                flightWidth_m: Math.round(Math.max(0, radiusX_m) * 100) / 100 * 2,
                flightDepth_m: Math.round(Math.max(0, radiusY_m) * 100) / 100 * 2,
                flightRotation_deg: Math.round(rotation_deg),
                flightCenterOverride: center, // drag中の現在位置を渡す
            } as any);
        }

        // width 方向の直径も追従
        this.drawWidthDiameter(center, radiusX_m, rotation_deg);
        // depth 方向の直径も追従
        this.drawDepthDiameter(center, radiusY_m, rotation_deg);

        // 中心変更の通知（例：矢印の追従に使用）
        this.opts.onCenterChanged?.(center);
    }

    // -------- 内部実装（描画・ドラッグ配線）--------
    private genEllipsePath(
        center: google.maps.LatLng,
        radiusX_m: number,
        radiusY_m: number,
        rotation_deg: number,
        steps = 256
    ): google.maps.LatLng[] {
        const R = 6378137; // WGS84
        const phi = toRad(rotation_deg ?? 0);
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const lat0 = center.lat();
        const lng0 = center.lng();
        const cosLat0 = Math.cos(toRad(lat0));

        const path: google.maps.LatLng[] = [];
        for (let i = 0; i <= steps; i++) {
            const t = (2 * Math.PI * i) / steps;
            const x = radiusX_m * Math.cos(t);
            const y = radiusY_m * Math.sin(t);
            const xr = x * cosPhi - y * sinPhi;
            const yr = x * sinPhi + y * cosPhi;

            const dLat = ((yr / R) * 180) / Math.PI;
            const dLng = ((xr / (R * cosLat0)) * 180) / Math.PI;

            path.push(this.opts.latLng(lat0 + dLat, lng0 + dLng));
        }
        return path;
    }

    /** 楕円を描画 */
    private drawEllipse(
        centerLngLat: LngLat,
        radiusX_m: number,
        radiusY_m: number,
        rotation_deg: number,
        style: Partial<google.maps.PolygonOptions> = {}
    ) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const center = this.opts.latLng(centerLngLat[1], centerLngLat[0]);
        const path = this.genEllipsePath(center, radiusX_m, radiusY_m, rotation_deg);
        const poly = new gmaps.Polygon({
            paths: path,
            strokeColor: "#2196f3",
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: "#2196f3",
            fillOpacity: 0.4,
            clickable: true,
            draggable: false,
            zIndex: Z.OVERLAY.FLIGHT,
            ...style,
            map,
        });
        return { poly, path };
    }

    /** 飛行エリアの中心ハンドルを描画 */
    private drawFlightCenterHandle(f: EllipseGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const [lng0, lat0] = f.center;
        const baseZ = markerBase(gmaps);
        const marker = new gmaps.Marker({
            position: this.opts.latLng(lat0, lng0),
            draggable: this.opts.isEditingOn(),
            visible: this.opts.isEditingOn(),
            title: this.opts.isEditingOn()
                ? "ドラッグで中心を移動。Shift+ドラッグで動いていない方の矢印を固定"
                : "編集ONで中心を移動できます",
            cursor: this.opts.isEditingOn() ? "grab" : "default",
            zIndex: baseZ + Z.MARKER_OFFSET.CENTER,
            icon: {
                path: gmaps.SymbolPath.CIRCLE,
                scale: 5.5,
                fillColor: "#ffffff",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 2,
            } as google.maps.Symbol,
            map,
        });

        let centerDragStart: LngLat | null = null;

        marker.addListener("dragstart", () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            centerDragStart = cur.center;
        });

        marker.addListener("drag", () => {
            if (!this.opts.isEditingOn()) return;
            const pos = marker.getPosition();
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!pos || !cur) return;
            let nextCenter: LngLat = [pos.lng(), pos.lat()];
            const constrain = this.opts.constrainFlightCenterForShiftDrag;
            const getShiftKey = this.opts.getShiftKey;
            const from = this.pickTakeoffRef();
            if (getShiftKey?.() && constrain && from && centerDragStart) {
                const constrained = constrain(centerDragStart, nextCenter, from);
                if (constrained) {
                    nextCenter = constrained;
                    marker.setPosition(this.opts.latLng(nextCenter[1], nextCenter[0]));
                }
            }
            this.updateOverlays(nextCenter, cur.radiusX_m, cur.radiusY_m, cur.rotation_deg || 0);
        });

        marker.addListener("dragend", () => {
            centerDragStart = null;
            if (!this.opts.isEditingOn()) return;
            const pos = marker.getPosition();
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!pos || !cur) return;
            const next = {
                ...(this.opts.getCurrentGeom() ?? {}),
                flightArea: { ...cur, center: [pos.lng(), pos.lat()] as LngLat },
            } as Geometry;
            this.opts.setCurrentGeom(next);
        });

        this.centerMarker = marker;
        this.opts.pushOverlay(marker);
    }

    /** 飛行エリアの半径ハンドルを描画 */
    private drawFlightRadiusHandles(f: EllipseGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const phi = toRad(f.rotation_deg || 0);
        const ux = Math.cos(phi), uy = Math.sin(phi);  // X軸
        const vx = -Math.sin(phi), vy = Math.cos(phi); // Y軸

        const place = (dx: number, dy: number) => {
            const p = fromLocalXY(f.center, dx, dy);
            return this.opts.latLng(p[1], p[0]);
        };

        const rxPos = place(ux * f.radiusX_m, uy * f.radiusX_m);
        const ryPos = place(vx * f.radiusY_m, vy * f.radiusY_m);

        const baseZ = markerBase(gmaps);
        const rxMarker = new gmaps.Marker({
            position: rxPos,
            draggable: this.opts.isEditingOn(),
            visible: this.opts.isEditingOn(),
            title: this.opts.isEditingOn() ? "ドラッグで長径半径を変更" : "編集ONで変更できます",
            cursor: this.opts.isEditingOn() ? "ew-resize" : "default",
            icon: {
                path: gmaps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#00c853",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 1.5,
            } as google.maps.Symbol,
            zIndex: baseZ + Z.MARKER_OFFSET.RADIUS,
            map,
        });

        const ryMarker = new gmaps.Marker({
            position: ryPos,
            draggable: this.opts.isEditingOn(),
            visible: this.opts.isEditingOn(),
            title: this.opts.isEditingOn() ? "ドラッグで短径半径を変更" : "編集ONで変更できます",
            cursor: this.opts.isEditingOn() ? "ns-resize" : "default",
            icon: {
                path: gmaps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#00c853",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 1.5,
            } as google.maps.Symbol,
            zIndex: baseZ + Z.MARKER_OFFSET.RADIUS,
            map,
        });

        let base: EllipseGeom | null = null;

        const onDragStart = () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            base = { ...cur };
        };

        const dragRx = () => {
            if (!this.opts.isEditingOn() || !base) return;
            const pos = rxMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(base.center, [pos.lng(), pos.lat()]);
            const phi = toRad(base.rotation_deg || 0);
            const u = { x: Math.cos(phi), y: Math.sin(phi) };
            const proj = v.x * u.x + v.y * u.y;
            const nextRx = Math.max(0.1, Math.abs(proj));
            this.updateOverlays(base.center, nextRx, base.radiusY_m, base.rotation_deg || 0);
        };

        const dragRy = () => {
            if (!this.opts.isEditingOn() || !base) return;
            const pos = ryMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(base.center, [pos.lng(), pos.lat()]);
            const phi = toRad(base.rotation_deg || 0);
            const w = { x: -Math.sin(phi), y: Math.cos(phi) };
            const proj = v.x * w.x + v.y * w.y;
            const nextRy = Math.max(0.1, Math.abs(proj));
            this.updateOverlays(base.center, base.radiusX_m, nextRy, base.rotation_deg || 0);
        };

        const endRx = () => {
            if (!this.opts.isEditingOn() || !base) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            const pos = rxMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const phi = toRad(cur.rotation_deg || 0);
            const u = { x: Math.cos(phi), y: Math.sin(phi) };
            const proj = v.x * u.x + v.y * u.y;
            const nextRx = Math.max(0.1, Math.abs(proj));
            const next = { ...(this.opts.getCurrentGeom() ?? {}), flightArea: { ...cur, radiusX_m: nextRx } } as Geometry;
            this.opts.setCurrentGeom(next);
        };

        const endRy = () => {
            if (!this.opts.isEditingOn() || !base) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            const pos = ryMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const phi = toRad(cur.rotation_deg || 0);
            const w = { x: -Math.sin(phi), y: Math.cos(phi) };
            const proj = v.x * w.x + v.y * w.y;
            const nextRy = Math.max(0.1, Math.abs(proj));
            const next = { ...(this.opts.getCurrentGeom() ?? {}), flightArea: { ...cur, radiusY_m: nextRy } } as Geometry;
            this.opts.setCurrentGeom(next);
        };

        rxMarker.addListener("dragstart", onDragStart);
        rxMarker.addListener("drag", dragRx);
        rxMarker.addListener("dragend", endRx);

        ryMarker.addListener("dragstart", onDragStart);
        ryMarker.addListener("drag", dragRy);
        ryMarker.addListener("dragend", endRy);

        this.rxMarker = rxMarker;
        this.ryMarker = ryMarker;
        this.opts.pushOverlay(rxMarker);
        this.opts.pushOverlay(ryMarker);
    }

    /** 飛行エリアの回転ハンドルを描画 */
    private drawFlightRotateHandle(f: EllipseGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const phi = toRad(f.rotation_deg || 0);
        const vx = -Math.sin(phi), vy = Math.cos(phi);
        const offset = ROTATE_HANDLE_GAP_M;
        const dx = vx * (f.radiusY_m + offset);
        const dy = vy * (f.radiusY_m + offset);
        const pos = fromLocalXY(f.center, dx, dy);
        const baseZ = markerBase(gmaps);
        const marker = new gmaps.Marker({
            position: this.opts.latLng(pos[1], pos[0]),
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

        let base: EllipseGeom | null = null;

        marker.addListener("dragstart", () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            base = { ...cur };
        });

        marker.addListener("drag", () => {
            if (!this.opts.isEditingOn() || !base) return;
            const p = marker.getPosition();
            if (!p) return;
            const v = toLocalXY(base.center, [p.lng(), p.lat()]);
            const angle = Math.atan2(v.y, v.x);
            const newRot = normalizeAngleDeg(toDeg(angle) - 90);
            this.updateOverlays(base.center, base.radiusX_m, base.radiusY_m, newRot);
        });

        marker.addListener("dragend", () => {
            if (!this.opts.isEditingOn() || !base) return;
            const p = marker.getPosition();
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!p || !cur) return;
            const v = toLocalXY(base.center, [p.lng(), p.lat()]);
            const angle = Math.atan2(v.y, v.x);
            const newRot = normalizeAngleDeg(toDeg(angle) - 90);
            const next = { ...(this.opts.getCurrentGeom() ?? {}), flightArea: { ...cur, rotation_deg: newRot } } as Geometry;
            this.opts.setCurrentGeom(next);
            // メトリクスを更新（角度を含む）
            this.opts.onMetrics({
                flightWidth_m: Math.round(Math.max(0, base.radiusX_m) * 100) / 100 * 2,
                flightDepth_m: Math.round(Math.max(0, base.radiusY_m) * 100) / 100 * 2,
                flightRotation_deg: Math.round(newRot),
            });
        });

        this.rotateMarker = marker;
        this.opts.pushOverlay(marker);

        // 「Front」ラベル（黄色丸の外側、前面であることを示す）
        const frontLabelW = 75;
        const frontLabelH = 28;
        const frontLabelSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            frontLabelW +
            '" height="' +
            frontLabelH +
            '" viewBox="0 0 ' +
            frontLabelW +
            " " +
            frontLabelH +
            '">' +
            '<text x="' +
            frontLabelW / 2 +
            '" y="20" text-anchor="middle" font-size="18" fill="white">Front</text>' +
            "</svg>";
        const frontLabelUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(frontLabelSvg);
        const frontLabelPos = fromLocalXY(
            f.center,
            vx * (f.radiusY_m + FRONT_LABEL_OFFSET_M),
            vy * (f.radiusY_m + FRONT_LABEL_OFFSET_M)
        );
        const frontLabelMarker = new gmaps.Marker({
            position: this.opts.latLng(frontLabelPos[1], frontLabelPos[0]),
            draggable: false,
            clickable: false,
            visible: this.opts.isEditingOn(),
            zIndex: baseZ + Z.MARKER_OFFSET.ROTATE + 1,
            icon: {
                url: frontLabelUrl,
                scaledSize: new gmaps.Size(frontLabelW, frontLabelH),
                anchor: new gmaps.Point(frontLabelW / 2, frontLabelH / 2),
            },
            map,
        });
        this.frontLabelMarker = frontLabelMarker;
        this.opts.pushOverlay(frontLabelMarker);
    }

    /** 保安エリアの編集ハンドルを描画（「新」「旧」「任」で表示。「任」はbuffer変更、「新」「旧」は飛行エリア変更。X/Y方向） */
    private drawSafetyBufferHandles(f: EllipseGeom, buffer: number) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const phi = toRad(f.rotation_deg || 0);
        const ux = Math.cos(phi), uy = Math.sin(phi);
        const vx = -Math.sin(phi), vy = Math.cos(phi);

        const place = (dx: number, dy: number) => {
            const p = fromLocalXY(f.center, dx, dy);
            return this.opts.latLng(p[1], p[0]);
        };

        const rx = Number(f.radiusX_m) || 0;
        const ry = Number(f.radiusY_m) || 0;
        const safetyRxPos = place(ux * (rx + buffer), uy * (rx + buffer));
        const safetyRyPos = place(vx * (ry + buffer), vy * (ry + buffer));

        const safetyMode = this.opts.getSafetyMode?.();
        const showSafetyHandles = this.opts.isEditingOn() && (safetyMode === "custom" || safetyMode === "new" || safetyMode === "old");
        const baseZ = markerBase(gmaps);

        const safetyTitle =
            safetyMode === "custom" ? "ドラッグで保安距離を変更" :
            safetyMode === "new" || safetyMode === "old" ? "ドラッグで飛行エリアを変更" :
            "編集ONで変更できます";
        const safetyIcon = {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#00c853",
            fillOpacity: 1,
            strokeColor: "#000000",
            strokeWeight: 1.5,
        } as google.maps.Symbol;

        const safetyRxMarker = new gmaps.Marker({
            position: safetyRxPos,
            draggable: showSafetyHandles,
            visible: showSafetyHandles,
            title: showSafetyHandles ? safetyTitle : "編集ONで変更できます",
            cursor: showSafetyHandles ? "ew-resize" : "default",
            icon: safetyIcon,
            zIndex: baseZ + Z.MARKER_OFFSET.RADIUS - 1,
            map,
        });

        const safetyRyMarker = new gmaps.Marker({
            position: safetyRyPos,
            draggable: showSafetyHandles,
            visible: showSafetyHandles,
            title: showSafetyHandles ? safetyTitle : "編集ONで変更できます",
            cursor: showSafetyHandles ? "ns-resize" : "default",
            icon: safetyIcon,
            zIndex: baseZ + Z.MARKER_OFFSET.RADIUS - 1,
            map,
        });

        const dragSafetyRx = () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            const pos = safetyRxMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const u = { x: Math.cos(toRad(cur.rotation_deg || 0)), y: Math.sin(toRad(cur.rotation_deg || 0)) };
            const proj = v.x * u.x + v.y * u.y;
            const safetyRadiusX = Math.abs(proj);
            const mode = this.opts.getSafetyMode?.();

            if (mode === "custom") {
                // 「任」: buffer_m を変更、飛行エリアは固定
                const newBuffer = Math.max(0, safetyRadiusX - (Number(cur.radiusX_m) || 0));
                this.updateOverlays(cur.center, cur.radiusX_m, cur.radiusY_m, cur.rotation_deg || 0, { skipMetrics: true, bufferOverride: newBuffer });
                this.opts.onSafetyBufferChanged?.(newBuffer);
            } else if (mode === "new" || mode === "old") {
                // 「新」「旧」: buffer は定数、飛行エリアの radiusX を変更
                const buffer = Number(this.opts.getSafetyBuffer()) || 0;
                const newRadiusX = Math.max(0.1, safetyRadiusX - buffer);
                this.updateOverlays(cur.center, newRadiusX, cur.radiusY_m, cur.rotation_deg || 0, { skipMetrics: true });
                this.opts.onMetrics({
                    flightWidth_m: newRadiusX * 2,
                    flightDepth_m: (Number(cur.radiusY_m) || 0) * 2,
                    flightRotation_deg: Math.round(cur.rotation_deg || 0),
                });
            }
        };

        const endSafetyRx = () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            const geom = this.opts.getCurrentGeom();
            if (!cur || !geom?.safetyArea) return;
            const pos = safetyRxMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const u = { x: Math.cos(toRad(cur.rotation_deg || 0)), y: Math.sin(toRad(cur.rotation_deg || 0)) };
            const proj = v.x * u.x + v.y * u.y;
            const safetyRadiusX = Math.abs(proj);
            const mode = this.opts.getSafetyMode?.();

            if (mode === "custom") {
                const newBuffer = Math.max(0, safetyRadiusX - (Number(cur.radiusX_m) || 0));
                const next = {
                    ...geom,
                    safetyArea: { ...geom.safetyArea, type: "ellipse" as const, mode: "custom" as const, buffer_m: newBuffer },
                } as Geometry;
                this.opts.setCurrentGeom(next);
                this.opts.onSafetyBufferChanged?.(newBuffer);
            } else if (mode === "new" || mode === "old") {
                const buffer = Number(this.opts.getSafetyBuffer()) || 0;
                const newRadiusX = Math.max(0.1, safetyRadiusX - buffer);
                const next = {
                    ...geom,
                    flightArea: { ...cur, radiusX_m: newRadiusX },
                } as Geometry;
                this.opts.setCurrentGeom(next);
                this.opts.onMetrics({
                    flightWidth_m: newRadiusX * 2,
                    flightDepth_m: (Number(cur.radiusY_m) || 0) * 2,
                    flightRotation_deg: Math.round(cur.rotation_deg || 0),
                });
            }
        };

        const dragSafetyRy = () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            const pos = safetyRyMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const w = { x: -Math.sin(toRad(cur.rotation_deg || 0)), y: Math.cos(toRad(cur.rotation_deg || 0)) };
            const proj = v.x * w.x + v.y * w.y;
            const safetyRadiusY = Math.abs(proj);
            const mode = this.opts.getSafetyMode?.();

            if (mode === "custom") {
                const newBuffer = Math.max(0, safetyRadiusY - (Number(cur.radiusY_m) || 0));
                this.updateOverlays(cur.center, cur.radiusX_m, cur.radiusY_m, cur.rotation_deg || 0, { skipMetrics: true, bufferOverride: newBuffer });
                this.opts.onSafetyBufferChanged?.(newBuffer);
            } else if (mode === "new" || mode === "old") {
                const buf = Number(this.opts.getSafetyBuffer()) || 0;
                const newRadiusY = Math.max(0.1, safetyRadiusY - buf);
                this.updateOverlays(cur.center, cur.radiusX_m, newRadiusY, cur.rotation_deg || 0, { skipMetrics: true });
                this.opts.onMetrics({
                    flightWidth_m: (Number(cur.radiusX_m) || 0) * 2,
                    flightDepth_m: newRadiusY * 2,
                    flightRotation_deg: Math.round(cur.rotation_deg || 0),
                });
            }
        };

        const endSafetyRy = () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            const geom = this.opts.getCurrentGeom();
            if (!cur || !geom?.safetyArea) return;
            const pos = safetyRyMarker.getPosition();
            if (!pos) return;
            const v = toLocalXY(cur.center, [pos.lng(), pos.lat()]);
            const w = { x: -Math.sin(toRad(cur.rotation_deg || 0)), y: Math.cos(toRad(cur.rotation_deg || 0)) };
            const proj = v.x * w.x + v.y * w.y;
            const safetyRadiusY = Math.abs(proj);
            const mode = this.opts.getSafetyMode?.();

            if (mode === "custom") {
                const newBuffer = Math.max(0, safetyRadiusY - (Number(cur.radiusY_m) || 0));
                const next = {
                    ...geom,
                    safetyArea: { ...geom.safetyArea, type: "ellipse" as const, mode: "custom" as const, buffer_m: newBuffer },
                } as Geometry;
                this.opts.setCurrentGeom(next);
                this.opts.onSafetyBufferChanged?.(newBuffer);
            } else if (mode === "new" || mode === "old") {
                const buf = Number(this.opts.getSafetyBuffer()) || 0;
                const newRadiusY = Math.max(0.1, safetyRadiusY - buf);
                const next = {
                    ...geom,
                    flightArea: { ...cur, radiusY_m: newRadiusY },
                } as Geometry;
                this.opts.setCurrentGeom(next);
                this.opts.onMetrics({
                    flightWidth_m: (Number(cur.radiusX_m) || 0) * 2,
                    flightDepth_m: newRadiusY * 2,
                    flightRotation_deg: Math.round(cur.rotation_deg || 0),
                });
            }
        };

        safetyRxMarker.addListener("drag", dragSafetyRx);
        safetyRxMarker.addListener("dragend", endSafetyRx);

        safetyRyMarker.addListener("drag", dragSafetyRy);
        safetyRyMarker.addListener("dragend", endSafetyRy);

        this.safetyRxMarker = safetyRxMarker;
        this.safetyRyMarker = safetyRyMarker;
        this.opts.pushOverlay(safetyRxMarker);
        this.opts.pushOverlay(safetyRyMarker);
    }

    private clampIndex(len: number, idx?: number) {
        return Number.isInteger(idx) ? Math.max(0, Math.min(len - 1, idx as number)) : 0;
    }

    private pickTakeoffRef(): LngLat | undefined {
        const t = this.opts.getCurrentGeom()?.takeoffArea;
        if (t?.type !== "rectangle" || !Array.isArray(t.coordinates) || t.coordinates.length === 0) return undefined;
        const idx = this.clampIndex(t.coordinates.length, t.referencePointIndex);
        return t.coordinates[idx] as LngLat;
    }

    /** 飛行エリアのドラッグを配線 */
    private wireFlightPolygonDrag() {
        const poly = this.poly;
        if (!poly) return;

        poly.setDraggable(this.opts.isEditingOn());

        let base: EllipseGeom | null = null;
        let baseP0: LngLat | null = null;
        let dragCenter: LngLat | null = null;

        poly.addListener("dragstart", () => {
            if (!this.opts.isEditingOn()) return;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            base = { ...cur };
            const p0 = poly.getPath().getAt(0);
            baseP0 = [p0.lng(), p0.lat()];
        });

        poly.addListener("drag", () => {
            if (this.isProcessingFlightDragRef) return;
            if (!this.opts.isEditingOn() || !base || !baseP0) return;

            this.isProcessingFlightDragRef = true;
            try {
            // すでに平行移動後のポリゴンから移動量を推定
            const p0 = poly.getPath().getAt(0);
            const now: LngLat = [p0.lng(), p0.lat()];
            const vBase = toLocalXY(base.center, baseP0);
            const vNow = toLocalXY(base.center, now);
            const dx = vNow.x - vBase.x;
            const dy = vNow.y - vBase.y;

            let center = fromLocalXY(base.center, dx, dy);

            // Shift+ドラッグ: 矢印を固定
            const constrain = this.opts.constrainFlightCenterForShiftDrag;
            const getShiftKey = this.opts.getShiftKey;
            const from = this.pickTakeoffRef();
            if (getShiftKey?.() && constrain && from) {
                const constrained = constrain(base.center, center, from);
                if (constrained) {
                    center = constrained;
                    const path = this.genEllipsePath(
                        this.opts.latLng(center[1], center[0]),
                        base.radiusX_m,
                        base.radiusY_m,
                        base.rotation_deg || 0
                    );
                    poly.setPaths(path);
                }
            }

            dragCenter = center;

            // 本体 setPaths は抑制。ハンドル/保安のみ同期。
            this.suppressEllipseUpdateRef = true;
            this.updateOverlays(dragCenter, base.radiusX_m, base.radiusY_m, base.rotation_deg || 0);
            this.suppressEllipseUpdateRef = false;
            } finally {
                this.isProcessingFlightDragRef = false;
            }
        });

        poly.addListener("dragend", () => {
            if (!this.opts.isEditingOn() || !base) return;
            const finalCenter = dragCenter ?? base.center;
            const cur = this.opts.getCurrentGeom()?.flightArea as EllipseGeom | undefined;
            if (!cur) return;
            const next = { ...(this.opts.getCurrentGeom() ?? {}), flightArea: { ...cur, center: finalCenter } } as Geometry;
            this.opts.setCurrentGeom(next);
        });
    }

    /** 楕円端から画面端（bounds）まで延長する距離[m]を算出。radius はその方向の半径 */
    private getExtensionToBounds(center: LngLat, radiusFromCenter: number): number {
        const map = this.opts.getMap();
        const bounds = map?.getBounds();
        if (!bounds) return 50000; // bounds が取れない場合は 50km 延長

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const corners: LngLat[] = [
            [ne.lng(), ne.lat()],
            [ne.lng(), sw.lat()],
            [sw.lng(), ne.lat()],
            [sw.lng(), sw.lat()],
        ];
        let maxDist = 0;
        for (const c of corners) {
            const v = toLocalXY(center, c);
            const len = Math.hypot(v.x, v.y);
            if (len > maxDist) maxDist = len;
        }
        // 中心から bounds 角までの距離 - 半径 = 楕円端からの延長。マージン 10% 追加
        return Math.max((maxDist - radiusFromCenter) * 1.1, 50);
    }

    /** 楕円の width 方向（radiusX）の直径を描画 or 更新 */
    private drawWidthDiameter(center: LngLat, radiusX_m: number, rotation_deg: number) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap();
        if (!map) return;
        if (!Number.isFinite(radiusX_m) || radiusX_m <= 0) {
            if (this.widthDiameterLine) {
                this.widthDiameterLine.setMap(null);
                this.widthDiameterLine = undefined;
            }
            return;
        }

        const phi = toRad(rotation_deg || 0);
        const ux = Math.cos(phi);
        const uy = Math.sin(phi);
        const ext = this.getExtensionToBounds(center, radiusX_m);

        // center ± (ux * (rX + ext), uy * (rX + ext)) で画面端まで延長
        const p1 = fromLocalXY(center, +ux * (radiusX_m + ext), +uy * (radiusX_m + ext));
        const p2 = fromLocalXY(center, -ux * (radiusX_m + ext), -uy * (radiusX_m + ext));

        const path = [
            this.opts.latLng(p1[1], p1[0]),
            this.opts.latLng(p2[1], p2[0]),
        ];

        // --- 北=0°, 時計回りでの方位角を計算してログ出力 ---
        // ローカルXY[m]座標系で center→p1 のベクトル（x: 東, y: 北）
        const v = toLocalXY(center, p1);

        // 数学角（東=0°, 反時計回り）
        const angleRad = Math.atan2(v.y, v.x);
        const angleDegMath = normalizeAngleDeg(toDeg(angleRad));

        // 北=0°, 時計回りの方位角へ変換（1度刻みに丸め）
        const bearingDegRaw = normalizeAngleDeg(angleDegMath);
        const bearingDeg = normalizeAngleDeg(Math.round(bearingDegRaw));

        // ここで共通ログユーティリティに楕円の角度を通知
        setEllipseBearingDeg(bearingDeg);

        if (this.widthDiameterLine) {
            this.widthDiameterLine.setPath(path);
            this.widthDiameterLine.setMap(map);
            return;
        }

        this.widthDiameterLine = new gmaps.Polyline({
            path,
            strokeColor: "#00c853",
            strokeOpacity: 1,
            strokeWeight: 2,
            clickable: false,
            zIndex: Z.OVERLAY.FLIGHT + 1,
            map,
        });
        this.opts.pushOverlay(this.widthDiameterLine);
    }

    /** 楕円の depth 方向（radiusY）の直径を描画 or 更新 */
    private drawDepthDiameter(center: LngLat, radiusY_m: number, rotation_deg: number) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap();
        if (!map) return;
        if (!Number.isFinite(radiusY_m) || radiusY_m <= 0) {
            if (this.depthDiameterLine) {
                this.depthDiameterLine.setMap(null);
                this.depthDiameterLine = undefined;
            }
            return;
        }

        const phi = toRad(rotation_deg || 0);
        const vx = -Math.sin(phi);
        const vy = Math.cos(phi);
        const ext = this.getExtensionToBounds(center, radiusY_m);

        // center ± (vx * (rY + ext), vy * (rY + ext)) で画面端まで延長
        const p1 = fromLocalXY(center, +vx * (radiusY_m + ext), +vy * (radiusY_m + ext));
        const p2 = fromLocalXY(center, -vx * (radiusY_m + ext), -vy * (radiusY_m + ext));

        const path = [
            this.opts.latLng(p1[1], p1[0]),
            this.opts.latLng(p2[1], p2[0]),
        ];

        if (this.depthDiameterLine) {
            this.depthDiameterLine.setPath(path);
            this.depthDiameterLine.setMap(map);
            return;
        }

        this.depthDiameterLine = new gmaps.Polyline({
            path,
            strokeColor: "#00c853",
            strokeOpacity: 1,
            strokeWeight: 2,
            clickable: false,
            zIndex: Z.OVERLAY.FLIGHT + 1,
            map,
        });
        this.opts.pushOverlay(this.depthDiameterLine);
    }
}
