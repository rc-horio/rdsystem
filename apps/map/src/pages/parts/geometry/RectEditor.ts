// src/pages/parts/geometry/RectEditor.ts
import { toRad, toDeg, normalizeAngleDeg, fromLocalXY, toLocalXY } from "./math";
import type { Geometry, LngLat, RectangleGeom, OrientedRect } from "@/features/types";
import { markerBase, ROTATE_HANDLE_GAP_M, Z } from "../constants/events";
import { setRectBearingDeg } from "./orientationDebug";

export type RectEditorOpts = {
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
    onMetrics: (metrics: Partial<{ rectWidth_m: number; rectDepth_m: number; rectRotation_deg?: number }>) => void;

    // ref 基準点が変更されたとき（クリック）
    onChangeReferenceIndex: (newIdx: number, coords: Array<LngLat>) => void;

    // 矩形が変更されたとき（ドラッグ）
    onReferencePointMoved?: (refPoint: LngLat) => void;

    // Shift+ドラッグ時: 基準点を制約（depth矢印固定→perp方向にのみ移動）
    constrainRefPointForShiftDrag?: (
        oldRef: LngLat,
        newRef: LngLat,
        initialTakeoffCoords?: Array<LngLat>,
        refIdx?: number
    ) => LngLat | null;

    // 距離測定モード中はオーバーレイをクリック不可・十字カーソルにする
    getMeasurementMode?: () => boolean;
};

export class RectEditor {
    private opts: RectEditorOpts;

    // 離発着エリアの編集用
    private takeoffEditRef: {
        poly?: google.maps.Polygon;
        cornerMarkers?: google.maps.Marker[];
        rotateMarker?: google.maps.Marker | null;
        refMarker?: google.maps.Marker | null;
        refIndex?: number;
    } | null = null;

    // ポリゴンの更新を抑制
    private suppressPolyUpdateRef = false;

    // Shift+ドラッグ制約用
    private shiftKeyRef = false;
    private initialRefPointAtDragStart: LngLat | null = null;
    private initialTakeoffCoordsAtDragStart: Array<LngLat> | null = null;
    private isProcessingDragRef = false;
    private keyListenerRefs: {
        keydown: (e: KeyboardEvent) => void;
        keyup: (e: KeyboardEvent) => void;
    } | null = null;

    constructor(opts: RectEditorOpts) {
        this.opts = opts;
    }

    /** 呼び出し元の overlays を消した後に参照だけクリア */
    clear() {
        if (this.keyListenerRefs) {
            window.removeEventListener("keydown", this.keyListenerRefs.keydown);
            window.removeEventListener("keyup", this.keyListenerRefs.keyup);
            this.keyListenerRefs = null;
        }
        this.takeoffEditRef = null;
        this.suppressPolyUpdateRef = false;
    }

    /** Shiftキーの監視を開始（Shift+ドラッグ制約用） */
    private ensureShiftKeyListeners() {
        if (this.keyListenerRefs) return;
        const keydown = (e: KeyboardEvent) => {
            if (e.key === "Shift") this.shiftKeyRef = true;
        };
        const keyup = (e: KeyboardEvent) => {
            if (e.key === "Shift") this.shiftKeyRef = false;
        };
        window.addEventListener("keydown", keydown);
        window.addEventListener("keyup", keyup);
        this.keyListenerRefs = { keydown, keyup };
    }

    /** 編集ON/OFFの反映（ドラッグ可否やカーソル・タイトル） */
    syncEditingInteractivity() {
        const isMeasurement = this.opts.getMeasurementMode?.() ?? false;
        const t = this.takeoffEditRef;
        if (!t) return;

        if (isMeasurement) {
            if (t.poly) t.poly.setOptions({ clickable: false, cursor: "crosshair" });
            return;
        }

        const isEdit = this.opts.isEditingOn();
        if (t.poly) t.poly.setOptions({ clickable: true, cursor: isEdit ? "grab" : "default", draggable: isEdit });
        if (t.cornerMarkers) {
            t.cornerMarkers.forEach((mk) => {
                mk.setDraggable(isEdit);
                mk.setVisible(isEdit);
                mk.setOptions({
                    cursor: isEdit ? "grab" : "default",
                    title: isEdit ? "ドラッグで角を移動（直角を維持）" : "編集ONで角を移動できます",
                });
            });
        }
        if (t.rotateMarker) {
            t.rotateMarker.setDraggable(isEdit);
            t.rotateMarker.setVisible(isEdit);
            t.rotateMarker.setOptions({
                cursor: isEdit ? "grab" : "default",
                title: isEdit ? "ドラッグで回転" : "編集ONで回転できます",
            });
        }
        if (t.refMarker) {
            t.refMarker.setOptions({
                cursor: isEdit ? "pointer" : "default",
                title: isEdit ? "クリックで次の頂点を基準点にする" : "編集ONで基準点を変更できます",
            });
        }
    }

    /** ジオメトリから矩形を描画し、bounds を拡張。初期メトリクスを返す */
    render(geom: Geometry, bounds: google.maps.LatLngBounds): {
        hasRect: boolean;
        metrics?: { rectWidth_m: number; rectDepth_m: number; rectRotation_deg?: number };
    } {
        const takeoff =
            geom.takeoffArea?.type === "rectangle" &&
                Array.isArray(geom.takeoffArea.coordinates) &&
                geom.takeoffArea.coordinates.length >= 4
                ? (geom.takeoffArea as RectangleGeom)
                : undefined;

        if (!takeoff) return { hasRect: false };

        // 本体
        const poly = this.drawRectangle(takeoff.coordinates, {
            strokeColor: "#ed1b24",
            fillColor: "#ed1b24",
        });
        poly.getPath().forEach((p) => bounds.extend(p as google.maps.LatLng));

        // 角ハンドル & 基準点
        this.drawTakeoffCornerHandles(takeoff);
        const ref = this.drawReferenceCorner(takeoff);
        if (ref?.pos) bounds.extend(ref.pos);

        // 回転ハンドル
        this.drawRotateHandle(takeoff);

        // 初期寸法（基準点から見て右=幅w、左=奥行d）
        const cs = takeoff.coordinates;
        let rectWidth_m = 0;
        let rectDepth_m = 0;
        let rectRotation_deg: number | undefined;
        const mRL = this.computeRightLeftLengths(cs, takeoff.referencePointIndex);
        if (mRL) {
            rectWidth_m = Math.round(mRL.right_m);
            rectDepth_m = Math.round(mRL.left_m);
        }
        
        // 角度を取得
        const rectParams = this.rectParamsFromCoords(cs);
        if (rectParams) {
            rectRotation_deg = Math.round(rectParams.rotation_deg);
        }

        return { hasRect: true, metrics: { rectWidth_m, rectDepth_m, rectRotation_deg } };
    }

    /** パネルからの寸法適用（幅/奥行き/角度） */
    applyPanelRectMetrics(rectWidth_m?: number, rectDepth_m?: number, rectRotation_deg?: number) {
        const t = this.opts.getCurrentGeom()?.takeoffArea;
        if (t?.type !== "rectangle" || !Array.isArray(t.coordinates) || t.coordinates.length < 4) return;

        const base = this.rectParamsFromCoords(t.coordinates);
        if (!base) return;

        // 右/左の対応と「右が next 辺かどうか」を取得
        const refIdx = this.clampIndex(t.coordinates.length, t.referencePointIndex);
        const mRL = this.computeRightLeftLengths(t.coordinates, refIdx);
        if (!mRL) return;

        // OrientedRect の軸: w=U軸長, h=V軸長
        // refIdx が偶数(0,2)の場合: next が U軸, prev が V軸
        // refIdx が奇数(1,3)の場合: next が V軸, prev が U軸
        const isEven = (refIdx % 2) === 0;
        const rightAxisIsU = mRL.rightIsNext ? isEven : !isEven; // nextが右なら偶数=U、奇数=V。prevが右なら逆
        const leftAxisIsU = !rightAxisIsU;

        let W = base.w;
        let H = base.h;

        const clampLen = (v?: number) =>
            typeof v === "number" && Number.isFinite(v) ? Math.max(0.1, v) : undefined;

        const wIn = clampLen(rectWidth_m);
        const dIn = clampLen(rectDepth_m);

        // 右=幅w を対応軸にセット
        if (wIn !== undefined) {
            if (rightAxisIsU) W = wIn; else H = wIn;
        }
        // 左=奥行d を対応軸にセット
        if (dIn !== undefined) {
            if (leftAxisIsU) W = dIn; else H = dIn;
        }

        // 角度を処理（指定されていない場合は既存の角度を使用）
        let rotation = base.rotation_deg;
        if (typeof rectRotation_deg === "number" && Number.isFinite(rectRotation_deg)) {
            // 角度を0-360度の範囲に正規化
            rotation = ((rectRotation_deg % 360) + 360) % 360;
        }

        // ※ もう「W>=H」への入れ替えはしない（右/左の意味を維持）
        const next: OrientedRect = {
            center: base.center,
            rotation_deg: rotation,
            w: W,
            h: H,
        };
        const coords = this.rectCornersFromParams(next);

        // パネルからの更新時はメトリクス更新をスキップ（無限ループ防止）
        this.updateTakeoffOverlays(coords, { skipMetrics: true });
        this.opts.setCurrentGeom({
            ...(this.opts.getCurrentGeom() ?? {}),
            takeoffArea: { ...t, coordinates: coords },
        } as Geometry);
    }

    // ========================= 内部実装 =========================

    /** インデックスをクランプ */
    private clampIndex(len: number, idx?: number) {
        return Number.isInteger(idx) ? Math.max(0, Math.min(len - 1, idx as number)) : 0;
    }

    /** 離発着エリアの矩形を描画 */
    private drawRectangle(
        coordsLngLat: Array<LngLat>,
        style: Partial<google.maps.PolygonOptions> = {}
    ) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const path = coordsLngLat.map(([lng, lat]) => this.opts.latLng(lat, lng));
        const poly = new gmaps.Polygon({
            paths: path,
            strokeColor: "#ed1b24",
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: "#ed1b24",
            fillOpacity: 0.4,
            clickable: true,
            draggable: this.opts.isEditingOn(),
            zIndex: Z.OVERLAY.TAKEOFF,
            ...style,
            map,
        });

        this.opts.pushOverlay(poly);
        this.takeoffEditRef = { ...(this.takeoffEditRef ?? {}), poly };
        this.ensureShiftKeyListeners();

        // 本体ドラッグで同期
        poly.addListener("dragstart", () => {
            const coords = this.getCoordsFromPolygon(poly);
            const refIdx = this.clampIndex(
                coords.length,
                this.opts.getCurrentGeom()?.takeoffArea?.referencePointIndex
            );
            this.initialRefPointAtDragStart = coords[refIdx] ?? null;
            this.initialTakeoffCoordsAtDragStart = [...coords];
        });

        poly.addListener("drag", () => {
            if (this.isProcessingDragRef) return;
            this.isProcessingDragRef = true;
            try {
                let coords = this.getCoordsFromPolygon(poly);
                const refIdx = this.clampIndex(
                    coords.length,
                    this.opts.getCurrentGeom()?.takeoffArea?.referencePointIndex
                );
                const constrain = this.opts.constrainRefPointForShiftDrag;
                if (
                    this.shiftKeyRef &&
                    constrain &&
                    this.initialRefPointAtDragStart &&
                    this.initialTakeoffCoordsAtDragStart &&
                    Number.isInteger(refIdx)
                ) {
                    const newRef = coords[refIdx];
                    const constrainedRef = constrain(
                        this.initialRefPointAtDragStart,
                        newRef,
                        this.initialTakeoffCoordsAtDragStart,
                        refIdx
                    );
                    if (constrainedRef) {
                        const dLng = constrainedRef[0] - newRef[0];
                        const dLat = constrainedRef[1] - newRef[1];
                        coords = coords.map(([lng, lat]) => [lng + dLng, lat + dLat] as LngLat);
                        poly.setPaths([coords.map(([lng, lat]) => this.opts.latLng(lat, lng))]);
                    }
                }
                this.suppressPolyUpdateRef = true;
                this.updateTakeoffOverlays(coords);
                this.suppressPolyUpdateRef = false;
            } finally {
                this.isProcessingDragRef = false;
            }
        });

        poly.addListener("dragend", () => {
            this.initialRefPointAtDragStart = null;
            this.initialTakeoffCoordsAtDragStart = null;
            const coords = this.getCoordsFromPolygon(poly);
            const prev = this.opts.getCurrentGeom();
            if (!prev?.takeoffArea) return;
            this.opts.setCurrentGeom({
                ...prev,
                takeoffArea: { ...prev.takeoffArea, coordinates: coords },
            } as Geometry);
        });

        return poly;
    }

    /** 離発着エリアの角ハンドルを描画 */
    private drawTakeoffCornerHandles(takeoffArea: RectangleGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const coords = Array.isArray(takeoffArea.coordinates) ? takeoffArea.coordinates : [];
        if (coords.length < 4) return;

        const isEdit = this.opts.isEditingOn();
        const idxActive = this.clampIndex(coords.length, takeoffArea.referencePointIndex);
        const baseZ = markerBase(gmaps);
        this.ensureShiftKeyListeners();

        const cornerMarkers: google.maps.Marker[] = [];
        coords.forEach(([lng, lat], i) => {
            const pos = this.opts.latLng(lat, lng);
            const isActive = i === idxActive;
            const marker = new gmaps.Marker({
                position: pos,
                clickable: true,
                draggable: isEdit,
                visible: isEdit,
                cursor: isEdit ? "grab" : "default",
                title: isEdit
                    ? "ドラッグで角を移動（直角を維持）。Shift+ドラッグで動いていない方の矢印を固定"
                    : "編集ONで角を移動できます",
                zIndex: baseZ + (isActive ? Z.MARKER_OFFSET.CORNER_ACTIVE : Z.MARKER_OFFSET.CORNER),
                icon: {
                    path: gmaps.SymbolPath.CIRCLE,
                    scale: isActive ? 6 : 5,
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#000000",
                    strokeWeight: isActive ? 2.5 : 1.5,
                } as google.maps.Symbol,
                map,
            });

            marker.addListener("click", () => {
                if (!this.opts.isEditingOn()) return;
                this.opts.onChangeReferenceIndex(i, coords);
            });

            let baseRect: OrientedRect | null = null;
            const oppIdx = (i + 2) % 4;

            marker.addListener("dragstart", () => {
                if (!this.opts.isEditingOn()) return;
                baseRect = this.rectParamsFromCoords(
                    this.opts.getCurrentGeom()?.takeoffArea?.coordinates || coords
                );
            });

            marker.addListener("drag", () => {
                if (!this.opts.isEditingOn() || !baseRect) return;
                const dragged = marker.getPosition();
                if (!dragged) return;

                let newCorner: LngLat = [dragged.lng(), dragged.lat()];
                const constrain = this.opts.constrainRefPointForShiftDrag;
                if (i === idxActive && this.shiftKeyRef && constrain) {
                    const baseCoords = this.rectCornersFromParams(baseRect);
                    const oldRef = baseCoords[idxActive];
                    const constrainedRef = constrain(oldRef, newCorner, baseCoords, idxActive);
                    if (constrainedRef) newCorner = constrainedRef;
                }
                const fixedOpp: LngLat =
                    (this.opts.getCurrentGeom()?.takeoffArea?.coordinates || coords)[oppIdx];

                const newCenter: LngLat = [
                    (newCorner[0] + fixedOpp[0]) / 2,
                    (newCorner[1] + fixedOpp[1]) / 2,
                ];

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
                this.updateTakeoffOverlays(nextCoords);
            });

            marker.addListener("dragend", () => {
                if (!this.opts.isEditingOn() || !baseRect) return;
                const edit = this.takeoffEditRef;
                if (!edit?.cornerMarkers || edit.cornerMarkers.length < 4) return;
                const finalCoords: Array<LngLat> = edit.cornerMarkers.map((mk) => {
                    const p = mk.getPosition()!;
                    return [p.lng(), p.lat()];
                });

                const prev = this.opts.getCurrentGeom();
                if (!prev?.takeoffArea) return;
                this.opts.setCurrentGeom({
                    ...prev,
                    takeoffArea: { ...prev.takeoffArea, coordinates: finalCoords },
                } as Geometry);

                const mRL = this.computeRightLeftLengths(finalCoords, edit.refIndex);
                const rectParams = this.rectParamsFromCoords(finalCoords);
                if (mRL) {
                    this.opts.onMetrics({
                        rectWidth_m: mRL.right_m,
                        rectDepth_m: mRL.left_m,
                        rectRotation_deg: rectParams ? Math.round(rectParams.rotation_deg) : undefined,
                    });
                }
            });

            this.opts.pushOverlay(marker);
            cornerMarkers.push(marker);
        });

        this.takeoffEditRef = { ...(this.takeoffEditRef ?? {}), cornerMarkers };
    }

    /** 離発着エリアの基準点マーカーを描画 */
    private drawReferenceCorner(takeoffArea: RectangleGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const coords = takeoffArea.coordinates || [];
        if (coords.length === 0) return null;

        const idx = this.clampIndex(coords.length, takeoffArea.referencePointIndex);
        const [lng, lat] = coords[idx];
        const pos = this.opts.latLng(lat, lng);

        const editing = this.opts.isEditingOn();
        const baseZ = markerBase(gmaps);
        const marker = new gmaps.Marker({
            position: pos,
            clickable: true,
            cursor: editing ? "pointer" : "default",
            zIndex: baseZ + Z.MARKER_OFFSET.REFERENCE, icon: {
                path: gmaps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#ffffff",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeWeight: 2,
            } as google.maps.Symbol,
            map,
            title: editing
                ? "クリックで次の頂点を基準点にする"
                : "編集ONで基準点を変更できます",
        });

        marker.addListener("click", () => {
            if (!this.opts.isEditingOn()) return;
            const nextIdx = (idx + 1) % coords.length;
            this.opts.onChangeReferenceIndex(nextIdx, coords);
        });

        this.opts.pushOverlay(marker);

        this.takeoffEditRef = {
            ...(this.takeoffEditRef ?? {}),
            refMarker: marker,
            refIndex: idx,
        };
        return { marker, pos };
    }

    /** 離発着エリアの回転ハンドルを描画 */
    private drawRotateHandle(takeoffArea: RectangleGeom) {
        const gmaps = this.opts.getGMaps();
        const map = this.opts.getMap()!;
        const coords = Array.isArray(takeoffArea.coordinates) ? takeoffArea.coordinates : [];
        if (coords.length < 4) return;

        const rect = this.rectParamsFromCoords(coords);
        if (!rect) return;

        const theta = toRad(rect.rotation_deg);
        const vx = -Math.sin(theta),
            vy = Math.cos(theta);
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
                this.opts.getCurrentGeom()?.takeoffArea?.coordinates || coords
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
            this.updateTakeoffOverlays(nextCoords);
        });

        marker.addListener("dragend", () => {
            if (!this.opts.isEditingOn() || !base) return;
            const edit = this.takeoffEditRef;
            if (!edit?.cornerMarkers || edit.cornerMarkers.length < 4) return;
            
            // 回転ハンドルから角度を取得
            const pos = marker.getPosition();
            if (pos) {
                const p: LngLat = [pos.lng(), pos.lat()];
                const v = toLocalXY(base.center, p);
                const angle = Math.atan2(v.y, v.x);
                const newRot = normalizeAngleDeg(toDeg(angle) - 90);
                
                // 角度を反映した座標を計算
                const nextRect: OrientedRect = {
                    center: base.center,
                    w: base.w,
                    h: base.h,
                    rotation_deg: newRot,
                };
                const rotatedCoords = this.rectCornersFromParams(nextRect);
                
                const prev = this.opts.getCurrentGeom();
                if (!prev?.takeoffArea) return;
                this.opts.setCurrentGeom({
                    ...prev,
                    takeoffArea: { ...prev.takeoffArea, coordinates: rotatedCoords },
                } as Geometry);
                
                const mRL = this.computeRightLeftLengths(rotatedCoords, edit.refIndex);
                if (mRL) {
                    this.opts.onMetrics({
                        rectWidth_m: mRL.right_m,
                        rectDepth_m: mRL.left_m,
                        rectRotation_deg: Math.round(newRot),
                    });
                }
            }
        });

        this.opts.pushOverlay(marker);
        this.takeoffEditRef = { ...(this.takeoffEditRef ?? {}), rotateMarker: marker };
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
    private updateTakeoffOverlays(coords: Array<LngLat>, opts?: { skipMetrics?: boolean }) {
        const edit = this.takeoffEditRef;
        if (!edit?.poly || !edit.cornerMarkers || edit.cornerMarkers.length < 4) return;

        const path = coords.map(([lng, lat]) => this.opts.latLng(lat, lng));
        if (!this.suppressPolyUpdateRef) {
            edit.poly.setPaths(path);
        }
        edit.cornerMarkers.forEach((mk, i) => {
            const [lng, lat] = coords[i];
            mk.setPosition(this.opts.latLng(lat, lng));
        });

        // 一時的に currentGeomRef を更新して矢印計算に反映
        const prev = this.opts.getCurrentGeom();
        if (prev?.takeoffArea && edit.refMarker != null && Number.isInteger(edit.refIndex)) {
            const tempGeom = {
                ...prev,
                takeoffArea: { ...prev.takeoffArea, coordinates: coords },
            } as Geometry;
            this.opts.setCurrentGeom(tempGeom);

            const [lng, lat] = coords[edit.refIndex!];
            const pos = this.opts.latLng(lat, lng);
            edit.refMarker!.setPosition(pos);

            // 参照頂点が動いたことを通知（矢印更新用）
            this.opts.onReferencePointMoved?.([lng, lat]);
        }

        if (edit.rotateMarker) {
            const rect = this.rectParamsFromCoords(coords);
            if (rect) {
                const theta = toRad(rect.rotation_deg);
                const vx = -Math.sin(theta), vy = Math.cos(theta);
                const offset = ROTATE_HANDLE_GAP_M;
                const hx = (rect.h / 2 + offset) * vx;
                const hy = (rect.h / 2 + offset) * vy;
                const handleLngLat = fromLocalXY(rect.center, hx, hy);
                edit.rotateMarker.setPosition(this.opts.latLng(handleLngLat[1], handleLngLat[0]));
            }
        }

        // 構文エラーを解消し、右=幅w / 左=奥行d / 角度 を送る - パネルからの更新時はスキップ
        if (!opts?.skipMetrics) {
            const mRL = this.computeRightLeftLengths(coords, edit.refIndex);
            const rectParams = this.rectParamsFromCoords(coords);
            if (mRL) {
                this.opts.onMetrics({
                    rectWidth_m: mRL.right_m,
                    rectDepth_m: mRL.left_m,
                    rectRotation_deg: rectParams ? Math.round(rectParams.rotation_deg) : undefined,
                });
            }
        }
    }

    /** 座標から矩形パラメータを取得 */
    private rectParamsFromCoords(coords: Array<LngLat>): OrientedRect | null {
        if (!Array.isArray(coords) || coords.length < 4) return null;
        const p0 = coords[0],
            p1 = coords[1],
            p2 = coords[2];
        const center: LngLat = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];

        const a0 = toLocalXY(center, p0);
        const a1 = toLocalXY(center, p1);
        const a2 = toLocalXY(center, p2);

        const dx01 = a1.x - a0.x,
            dy01 = a1.y - a0.y;
        const dx12 = a2.x - a1.x,
            dy12 = a2.y - a1.y;
        const w = Math.hypot(dx01, dy01);
        const h = Math.hypot(dx12, dy12);
        const rotation_deg = normalizeAngleDeg(toDeg(Math.atan2(dy01, dx01)));

        return { center, w, h, rotation_deg };
    }

    /** 矩形パラメータから角座標を取得 */
    private rectCornersFromParams(rect: OrientedRect): Array<LngLat> {
        const { center, w, h, rotation_deg } = rect;
        const theta = toRad(rotation_deg);
        const ux = Math.cos(theta),
            uy = Math.sin(theta);
        const vx = -Math.sin(theta),
            vy = Math.cos(theta);
        const hw = w / 2,
            hh = h / 2;

        const o = center;
        const off = (x: number, y: number) => fromLocalXY(o, x, y);

        const p0 = off(-hw * ux - hh * vx, -hw * uy - hh * vy);
        const p1 = off(+hw * ux - hh * vx, +hw * uy - hh * vy);
        const p2 = off(+hw * ux + hh * vx, +hw * uy + hh * vy);
        const p3 = off(-hw * ux + hh * vx, -hw * uy + hh * vy);
        return [p0, p1, p2, p3];
    }

    /** 右/左の辺の長さ（m）を基準点から見て判定 */
    private computeRightLeftLengths(
        coords: Array<LngLat>,
        refIdxRaw?: number
    ): { right_m: number; left_m: number; rightIsNext: boolean } | null {
        if (!Array.isArray(coords) || coords.length < 4) return null;

        const idx = this.clampIndex(coords.length, refIdxRaw);
        const cur = coords[idx];
        const next = coords[(idx + 1) % 4];
        const prev = coords[(idx + 3) % 4];

        // 中心（p0-p2 の中点）
        const p0 = coords[0], p2 = coords[2];
        const center: LngLat = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];

        // ローカルXY化
        const c = toLocalXY(center, cur);
        const n = toLocalXY(center, next);
        const p = toLocalXY(center, prev);
        const f = { x: -c.x, y: -c.y };               // 基準点→中心
        const eNext = { x: n.x - c.x, y: n.y - c.y }; // 基準点→次頂点
        const ePrev = { x: p.x - c.x, y: p.y - c.y }; // 基準点→前頂点

        const cross = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
        const len = (v: { x: number; y: number }) => Math.hypot(v.x, v.y);

        // 右手系: cross(f, e) < 0 が「右」
        const rightIsNext = cross(f, eNext) < 0;
        const right_m = rightIsNext ? len(eNext) : len(ePrev);
        const left_m = rightIsNext ? len(ePrev) : len(eNext);

        // --- 基準点から右に伸びる線分の方位角をログ出力（北=0°, 時計回り） ---
        const rightVec = rightIsNext ? eNext : ePrev; // ローカルXY[m]（x: 東, y: 北）
        const angleRad = Math.atan2(rightVec.y, rightVec.x);
        const angleDegMath = normalizeAngleDeg(toDeg(angleRad));          // 東=0°, 反時計回り
        const bearingDegRaw = normalizeAngleDeg(angleDegMath - 180);          // 北=0°, 反時計回り

        // 1度刻みに丸め
        const bearingDeg = normalizeAngleDeg(Math.round(bearingDegRaw));

        // ここで共通ログユーティリティに矩形の角度を通知
        setRectBearingDeg(bearingDeg);
        
        return { right_m, left_m, rightIsNext };
    }
}
