// src/pages/parts/MapGeometry.ts
import { setDetailBarMetrics } from "./SideDetailBar";
import type { Geometry, GeometryMetrics, LngLat, RectangleGeom } from "@/features/types";
import { EV_DETAILBAR_APPLY_METRICS, EV_TAKEOFF_REF_CHANGED, EV_GEOMETRY_RESPOND_DATA, Z } from "./constants/events";
import { EllipseEditor } from "./geometry/EllipseEditor";
import { RectEditor } from "./geometry/RectEditor";
import { AudienceEditor } from "./geometry/AudienceEditor";

/** =========================
 *  Geometry Controller
 *  ========================= */
export class MapGeometry {
    // 地図を取得
    private getMap: () => google.maps.Map | null;

    // オーバーレイのリスト
    private overlaysRef: Array<
        google.maps.Polygon | google.maps.Polyline | google.maps.Marker | google.maps.Circle
    > = [];

    // --- 楕円 & 矩形エディタ ---
    private ellipseEditor: EllipseEditor;
    private rectEditor: RectEditor;

    /** =========================
     *  現在のスケジュール
     *  ========================= */
    private currentScheduleRef: { projectUuid?: string; scheduleUuid?: string } | null = null;

    /** =========================
     *  現在のジオメトリ
     *  ========================= */
    private currentGeomRef: Geometry | null = null;

    /** =========================
     *  編集状態の監視
     *  ========================= */
    private editObserver: MutationObserver | null = null;

    // 観客エリア用のポリゴン参照
    private audienceEditor: AudienceEditor;

    /** =========================
     *  保証表（10m刻み）: 高度 h[m] → 最大移動距離 d[m]
     *  ========================= */
    private static readonly DIST_TABLE: ReadonlyArray<{ h: number; d: number }> = [
        { h: 10, d: 8.5 }, { h: 20, d: 11.1 }, { h: 30, d: 13.1 }, { h: 40, d: 15.0 },
        { h: 50, d: 16.7 }, { h: 60, d: 18.4 }, { h: 70, d: 20.0 }, { h: 80, d: 21.5 },
        { h: 90, d: 23.1 }, { h: 100, d: 24.6 }, { h: 110, d: 26.1 }, { h: 120, d: 27.5 },
        { h: 130, d: 29.0 }, { h: 140, d: 30.5 }, { h: 150, d: 31.9 }, { h: 160, d: 33.3 },
        { h: 170, d: 34.8 }, { h: 180, d: 36.2 }, { h: 190, d: 37.7 }, { h: 200, d: 39.1 },
        { h: 210, d: 40.5 }, { h: 220, d: 41.9 }, { h: 230, d: 43.4 }, { h: 240, d: 44.8 },
        { h: 250, d: 46.3 }, { h: 260, d: 47.7 }, { h: 270, d: 49.1 }, { h: 280, d: 50.5 },
        { h: 290, d: 52.0 }, { h: 300, d: 53.4 }, { h: 310, d: 54.8 }, { h: 320, d: 56.3 },
        { h: 330, d: 57.7 }, { h: 340, d: 59.1 }, { h: 350, d: 60.5 }, { h: 360, d: 62.0 },
    ];

    /** =========================
     *  コンストラクタ
     *  ========================= */
    constructor(getMap: () => google.maps.Map | null) {
        this.getMap = getMap;

        // EllipseEditor
        this.ellipseEditor = new EllipseEditor({
            getMap: this.getMap.bind(this),
            getGMaps: this.getGMaps.bind(this),
            latLng: this.latLng.bind(this),
            isEditingOn: this.isEditingOn.bind(this),
            getCurrentGeom: () => this.currentGeomRef,
            setCurrentGeom: (g) => {
                this.currentGeomRef = g;
            },
            getSafetyBuffer: () => Number(this.currentGeomRef?.safetyArea?.buffer_m) || 0,
            pushOverlay: (ov) => this.overlaysRef.push(ov),
            onMetrics: (m) => setDetailBarMetrics(m),
            onCenterChanged: (center) => {
                const from = this.pickReferenceCorner(this.currentGeomRef?.takeoffArea);
                this.updateArrowPath(from, center);
            },
        });

        // RectEditor
        this.rectEditor = new RectEditor({
            getMap: this.getMap.bind(this),
            getGMaps: this.getGMaps.bind(this),
            latLng: this.latLng.bind(this),
            isEditingOn: this.isEditingOn.bind(this),
            getCurrentGeom: () => this.currentGeomRef,
            setCurrentGeom: (g) => {
                this.currentGeomRef = g;
            },
            pushOverlay: (ov) => this.overlaysRef.push(ov),
            onMetrics: (m) => setDetailBarMetrics(m),
            onChangeReferenceIndex: (newIdx, coords) => {
                this.setReferenceCornerIndex(newIdx, coords);
            },

            // 長方形の参照頂点が移動したら矢印を追従
            onReferencePointMoved: (refPoint) => {
                const to =
                    this.currentGeomRef?.flightArea?.type === "ellipse" &&
                        Array.isArray(this.currentGeomRef?.flightArea?.center)
                        ? (this.currentGeomRef!.flightArea!.center as LngLat)
                        : undefined;
                this.updateArrowPath(refPoint, to);
            },
        });

        // AudienceEditor（観客）
        this.audienceEditor = new AudienceEditor({
            getMap: this.getMap.bind(this),
            getGMaps: this.getGMaps.bind(this),
            latLng: this.latLng.bind(this),
            isEditingOn: this.isEditingOn.bind(this),
            getCurrentGeom: () => this.currentGeomRef,
            setCurrentGeom: (g) => { this.currentGeomRef = g; },
            pushOverlay: (ov) => this.overlaysRef.push(ov),
            onMetrics: (m) => setDetailBarMetrics(m),
        });

        // 編集状態の監視
        this.editObserver = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.type === "attributes" && m.attributeName === "class") {
                    this.syncEditingInteractivity();
                }
            }
        });
        this.editObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        window.addEventListener(EV_DETAILBAR_APPLY_METRICS, this.handleApplyMetrics as EventListener);

        // === 現在のスケジュールUUIDとGeometryを問い合わせるブリッジ ===
        window.addEventListener(
            "geometry:request-data",
            () => {
                const detail = {
                    projectUuid: this.currentScheduleRef?.projectUuid,
                    scheduleUuid: this.currentScheduleRef?.scheduleUuid,
                    geometry: this.currentGeomRef ?? null,
                };
                window.dispatchEvent(
                    new CustomEvent(EV_GEOMETRY_RESPOND_DATA, { detail })
                );
            },
            false
        );
    }

    /** =========================
     * Utils
     *  ========================= */
    private getGMaps() {
        return (window as any).google.maps as unknown as typeof google.maps;
    }

    /** =========================
     *  現在のスケジュールを設定
     *  ========================= */
    setCurrentSchedule(projectUuid?: string, scheduleUuid?: string) {
        this.currentScheduleRef = { projectUuid, scheduleUuid };
    }

    /** =========================
     *  現在のジオメトリを取得
     *  ========================= */
    getCurrentGeometry(): Geometry | null {
        return this.currentGeomRef;
    }

    /** =========================
     *  インデックスをクランプ
     *  ========================= */
    private clampIndex(len: number, idx?: number) {
        return Number.isInteger(idx) ? Math.max(0, Math.min(len - 1, idx as number)) : 0;
    }

    /** =========================
     *  編集ONかどうか
     *  ========================= */
    private isEditingOn() {
        return document.body.classList.contains("editing-on");
    }

    /** =========================
     *  編集状態の反映
     *  ========================= */
    private syncEditingInteractivity() {
        this.rectEditor.syncEditingInteractivity();
        this.ellipseEditor.syncEditingInteractivity();
        this.audienceEditor.syncEditingInteractivity();
    }

    /** =========================
     *  オーバーレイをクリア
     *  ========================= */
    clearOverlays() {
        this.overlaysRef.forEach((ov) => ov.setMap(null));
        this.overlaysRef = [];
        this.ellipseEditor.clear();
        this.rectEditor.clear();
        this.audienceEditor.clear();
        this.arrowRef = null;
    }

    /** =========================
     *  ジオメトリを描画
     *  ========================= */
    renderGeometry(geomLike: unknown, opts?: { fit?: boolean }) {
        const gmaps = this.getGMaps();
        const map = this.getMap();
        if (!map) return;

        if (!geomLike || typeof geomLike !== "object") {
            setDetailBarMetrics({});
            return;
        }

        const geom = geomLike as Geometry;
        this.clearOverlays();
        this.currentGeomRef = geom;

        const bounds = new gmaps.LatLngBounds();
        const metrics: Partial<GeometryMetrics> = {};

        // --- 矩形（離発着） ---
        const { hasRect, metrics: rectMetrics } = this.rectEditor.render(geom, bounds);
        if (hasRect && rectMetrics) {
            metrics.rectWidth_m = rectMetrics.rectWidth_m;
            metrics.rectDepth_m = rectMetrics.rectDepth_m;
        }

        // --- 楕円（飛行）＋ 保安 ---
        const { hasFlight, metrics: flightMetrics } = this.ellipseEditor.render(geom, bounds);
        if (hasFlight && flightMetrics) {
            metrics.flightWidth_m = flightMetrics.flightWidth_m;
            metrics.flightDepth_m = flightMetrics.flightDepth_m;
        }

        // --- 観客エリア（矩形） ---
        const { hasAudience, metrics: audM } = this.audienceEditor.render(geom, bounds);
        if (hasAudience && audM) {
            metrics.spectatorWidth_m = audM.spectatorWidth_m;
            metrics.spectatorDepth_m = audM.spectatorDepth_m;
        }

        // 飛行高度
        const altRaw = (geom as any)?.flightAltitude_m;
        const altNum = Number(altRaw);
        if (Number.isFinite(altNum)) {
            metrics.flightAltitude_m = altNum;
        }

        // 最大移動距離（= buffer_m）
        const buf = Number((geom as any)?.safetyArea?.buffer_m);
        if (Number.isFinite(buf)) {
            (metrics as any).safetyDistance_m = buf;
            (metrics as any).buffer_m = buf; // 互換用
        }

        // --- Arrow（from: takeoff基準点 → to: flight.center） ---
        const flight =
            geom.flightArea?.type === "ellipse" && Array.isArray(geom.flightArea.center)
                ? geom.flightArea
                : undefined;
        const from = this.pickReferenceCorner(geom.takeoffArea);
        const to = flight?.center as LngLat | undefined;
        if (from && to) {
            const line = this.drawArrow(from, to);
            this.arrowRef = line;
            line.getPath().forEach((p) => bounds.extend(p as google.maps.LatLng));
        }

        const shouldFit = opts?.fit ?? true;
        if (shouldFit && !bounds.isEmpty()) this.getMap()?.fitBounds(bounds, 40);

        setDetailBarMetrics(metrics);
        this.syncEditingInteractivity();
        this.currentGeomRef = geom;
    }

    /** =========================
     *  パネル入力 → 図形へ反映（編集ON時のみ）
     *  ========================= */
    private handleApplyMetrics = (e: Event) => {
        if (!this.isEditingOn()) return;
        const d = (e as CustomEvent<
            Partial<{
                flightWidth_m: number;
                flightDepth_m: number;
                rectWidth_m: number;
                rectDepth_m: number;
                spectatorWidth_m: number;
                spectatorDepth_m: number;
                flightAltitude_m: number;
            }>
        >).detail || {};

        // ---- 飛行エリア（楕円）: w/d => 半径X/Y ----
        const f = this.currentGeomRef?.flightArea;
        if (f?.type === "ellipse" && Array.isArray(f.center)) {
            let rx = f.radiusX_m;
            let ry = f.radiusY_m;
            if (typeof d.flightWidth_m === "number" && Number.isFinite(d.flightWidth_m)) {
                rx = Math.max(0, d.flightWidth_m / 2);
            }
            if (typeof d.flightDepth_m === "number" && Number.isFinite(d.flightDepth_m)) {
                ry = Math.max(0, d.flightDepth_m / 2);
            }
            if (rx !== f.radiusX_m || ry !== f.radiusY_m) {
                this.ellipseEditor.updateOverlays(f.center, rx, ry, f.rotation_deg || 0);
                this.currentGeomRef = {
                    ...(this.currentGeomRef ?? {}),
                    flightArea: { ...f, radiusX_m: rx, radiusY_m: ry },
                };
            }
        }

        // ---- 離発着エリア（矩形）: w/d
        this.rectEditor.applyPanelRectMetrics(d.rectWidth_m, d.rectDepth_m);

        // ---- 観客エリア（矩形）: w/d
        this.audienceEditor.applyPanelAudienceMetrics(d.spectatorWidth_m, d.spectatorDepth_m);

        // ---- 高度（m）：Geometryへ保存 + 保安距離 → buffer_m へ反映 & 図面更新
        // ---- 高度（m）：Geometryへ保存 + 保安距離 → buffer_m へ反映 & 図面更新
        if (typeof d.flightAltitude_m === "number" && Number.isFinite(d.flightAltitude_m)) {
            const alt = Math.max(0, Math.round(d.flightAltitude_m));

            // 保証表から距離
            const { dist_m } = this.safetyDistanceByTable(alt);

            // Geometry 更新
            const prev = this.currentGeomRef ?? {};
            const prevSafety = (prev as any).safetyArea ?? {};
            this.currentGeomRef = {
                ...prev,
                flightAltitude_m: alt,
                safetyArea: { type: "ellipse", ...prevSafety, buffer_m: dist_m },
            } as Geometry;

            // ★ パネルへも通知（高度＋最大移動距離）
            setDetailBarMetrics({ flightAltitude_m: alt, safetyDistance_m: dist_m, buffer_m: dist_m });

            // 図面更新（既存処理）
            const fl = this.currentGeomRef?.flightArea;
            if (fl?.type === "ellipse" && Array.isArray(fl.center)) {
                this.ellipseEditor.updateOverlays(
                    fl.center as LngLat,
                    Number(fl.radiusX_m) || 0,
                    Number(fl.radiusY_m) || 0,
                    Number(fl.rotation_deg) || 0
                );
            }

            this.logSafetyDistance(alt);
        }
    };

    /** =========================
     *  緯度経度とメートル数の変換
     *  ========================= */
    private latLng(lat: number, lng: number) {
        return new (this.getGMaps().LatLng)(lat, lng);
    }

    /** =========================
     *  離発着エリア（矩形）: 基準点参照 & 変更
     *  ========================= */
    private pickReferenceCorner(takeoffArea?: RectangleGeom): LngLat | undefined {
        const coords = Array.isArray(takeoffArea?.coordinates) ? takeoffArea!.coordinates : [];
        if (coords.length === 0) return undefined;
        const idx = this.clampIndex(coords.length, takeoffArea?.referencePointIndex);
        return coords[idx] as LngLat;
    }

    /** =========================
     *  離発着エリア（矩形）: 基準点参照 & 変更
     *  ========================= */
    private setReferenceCornerIndex(newIdx: number, coords: Array<LngLat>) {
        if (!this.isEditingOn()) return;
        const prev = this.currentGeomRef;
        if (!prev?.takeoffArea) return;

        const next: Geometry = {
            ...prev,
            takeoffArea: {
                ...prev.takeoffArea,
                referencePointIndex: this.clampIndex(coords.length, newIdx),
            },
        };

        this.currentGeomRef = next;
        this.renderGeometry(next, { fit: false });

        const safeIdx = this.clampIndex(coords.length, newIdx);
        const refPoint = coords[safeIdx];
        window.dispatchEvent(
            new CustomEvent(EV_TAKEOFF_REF_CHANGED, {
                detail: {
                    projectUuid: this.currentScheduleRef?.projectUuid,
                    scheduleUuid: this.currentScheduleRef?.scheduleUuid,
                    referencePointIndex: safeIdx,
                    referencePoint: refPoint, // [lng, lat]
                },
            })
        );
    }

    /** =========================
     *  矢印
     *  ========================= */
    private arrowRef: google.maps.Polyline | null = null;

    /** =========================
     *  矢印: パスを更新
     *  ========================= */
    private updateArrowPath(from?: LngLat, to?: LngLat) {
        if (!this.arrowRef || !from || !to) return;
        this.arrowRef.setPath([this.latLng(from[1], from[0]), this.latLng(to[1], to[0])]);
    }

    /** =========================
     *  矢印: 描画
     *  ========================= */
    private drawArrow(fromLngLat: LngLat, toLngLat: LngLat) {
        const gmaps = this.getGMaps();
        const map = this.getMap()!;
        const path = [this.latLng(fromLngLat[1], fromLngLat[0]), this.latLng(toLngLat[1], toLngLat[0])];
        const line = new gmaps.Polyline({
            path,
            strokeColor: "#ffffff",
            strokeOpacity: 1,
            strokeWeight: 2,
            clickable: false,
            icons: [
                {
                    icon: {
                        path: gmaps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3,
                        strokeColor: "#ffffff",
                        strokeOpacity: 1,
                    },
                    offset: "100%",
                },
            ],
            zIndex: Z.OVERLAY.ARROW,
            map,
        });
        this.overlaysRef.push(line);
        return line;
    }

    /** =========================
     *  （保証表を使った）最大移動距離のユーティリティ
     *  ========================= */

    // 10–360m にクランプ
    private clampAltRange(h: number) {
        return Math.max(10, Math.min(360, h));
    }

    // 10m単位に切り上げ
    private ceil10(h: number) {
        return Math.ceil(h / 10) * 10;
    }

    // 表で保安距離を取得（切り上げ・クランプ済みの行を使用）
    private safetyDistanceByTable(alt_m: number): { usedAlt: number; dist_m: number } {
        const clamped = this.clampAltRange(alt_m);
        const usedAlt = this.ceil10(clamped);
        const row =
            MapGeometry.DIST_TABLE.find((r) => r.h === usedAlt) ??
            MapGeometry.DIST_TABLE[MapGeometry.DIST_TABLE.length - 1];
        return { usedAlt, dist_m: row.d };
    }

    // ログ出力
    private logSafetyDistance(alt_m: number) {
        const { usedAlt, dist_m } = this.safetyDistanceByTable(alt_m);
        const note = alt_m !== usedAlt ? `（表は ${usedAlt}m 列を採用）` : "";
        console.log(`[safety] 入力高度 ${alt_m} m → 最大移動距離(保安距離) ≈ ${dist_m} m ${note}`);
    }
}
