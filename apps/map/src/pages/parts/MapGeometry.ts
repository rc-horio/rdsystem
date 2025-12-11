// src/pages/parts/MapGeometry.ts
import { setDetailBarMetrics } from "./SideDetailBar";
import type { Geometry, GeometryMetrics, LngLat, RectangleGeom } from "@/features/types";
import { EV_DETAILBAR_APPLY_METRICS, EV_TAKEOFF_REF_CHANGED, EV_GEOMETRY_RESPOND_DATA, Z, EV_GEOMETRY_REQUEST_DATA } from "./constants/events";
import { EllipseEditor } from "./geometry/EllipseEditor";
import { RectEditor } from "./geometry/RectEditor";
import { AudienceEditor } from "./geometry/AudienceEditor";
import { toLocalXY, fromLocalXY } from "./geometry/math";

type ArrowKind = "main" | "depth" | "perp";

/** =========================
 *  Geometry Controller
 *  ========================= */
export class MapGeometry {
    // 地図を取得
    private getMap: () => google.maps.Map | null;
    private deletedRef: boolean = false;

    private arrowRef: google.maps.Polyline | null = null;
    private arrow2Ref: google.maps.Polyline | null = null;
    private arrow3Ref: google.maps.Polyline | null = null;

    // --- 矢印ラベル ---
    private arrowLabel: google.maps.Marker | null = null;
    private arrow2Label: google.maps.Marker | null = null;
    private arrow3Label: google.maps.Marker | null = null;

    // 矢印ラベル用：三角形の重心
    private arrowTriangleCentroid: google.maps.LatLng | null = null;

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
    private static readonly DIST_TABLE_NEW: ReadonlyArray<{ h: number; d: number }> = [
        { h: 10, d: 8.5 },
        { h: 20, d: 11.1 },
        { h: 30, d: 13.1 },
        { h: 40, d: 15.0 },
        { h: 50, d: 16.7 },
        { h: 60, d: 18.4 },
        { h: 70, d: 20.0 },
        { h: 80, d: 21.5 },
        { h: 90, d: 23.1 },
        { h: 100, d: 24.6 },
        { h: 110, d: 26.1 },
        { h: 120, d: 27.5 },
        { h: 130, d: 29.0 },
        { h: 140, d: 30.5 },
        { h: 150, d: 31.9 },
        { h: 160, d: 33.3 },
        { h: 170, d: 34.8 },
        { h: 180, d: 36.2 },
        { h: 190, d: 37.7 },
        { h: 200, d: 39.1 },
        { h: 210, d: 40.5 },
        { h: 220, d: 41.9 },
        { h: 230, d: 43.4 },
        { h: 240, d: 44.8 },
        { h: 250, d: 46.3 },
        { h: 260, d: 47.7 },
        { h: 270, d: 49.1 },
        { h: 280, d: 50.5 },
        { h: 290, d: 52.0 },
        { h: 300, d: 53.4 },
        { h: 310, d: 54.8 },
        { h: 320, d: 56.3 },
        { h: 330, d: 57.7 },
        { h: 340, d: 59.1 },
        { h: 350, d: 60.5 },
        { h: 360, d: 62.0 },
    ];

    private static readonly DIST_TABLE_OLD: ReadonlyArray<{ h: number; d: number }> = [
        { h: 30, d: 24 },
        { h: 40, d: 27 },
        { h: 50, d: 29 },
        { h: 60, d: 31 },
        { h: 70, d: 33 },
        { h: 80, d: 35 },
        { h: 90, d: 37 },
        { h: 100, d: 39 },
        { h: 110, d: 41 },
        { h: 120, d: 42 },
        { h: 130, d: 44 },
        { h: 140, d: 46 },
        { h: 150, d: 48 },
        { h: 160, d: 50 },
        { h: 170, d: 51 },
        { h: 180, d: 53 },
        { h: 190, d: 55 },
        { h: 200, d: 57 },
        { h: 210, d: 59 },
        { h: 220, d: 60 },
        { h: 230, d: 62 },
        { h: 240, d: 64 },
        { h: 250, d: 66 },
        { h: 260, d: 68 },
        { h: 270, d: 69 },
        { h: 280, d: 71 },
        { h: 290, d: 73 },
        { h: 300, d: 75 },
        { h: 310, d: 76 },
        { h: 320, d: 78 },
        { h: 330, d: 80 },
        { h: 340, d: 82 },
        { h: 350, d: 84 },
        { h: 360, d: 85 },

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
                this.updateRightAngleArrowPaths(from, center);
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
                // 矢印１の更新
                this.updateArrowPath(refPoint, to);
                // 矢印２と３の更新
                this.updateRightAngleArrowPaths(refPoint, to);
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
            EV_GEOMETRY_REQUEST_DATA,
            () => {
                const detail = {
                    projectUuid: this.currentScheduleRef?.projectUuid,
                    scheduleUuid: this.currentScheduleRef?.scheduleUuid,
                    geometry: this.currentGeomRef ?? null,
                    deleted: this.deletedRef,
                };
                console.log("[MapGeometry] respond geometry:", detail);
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
        this.deletedRef = false;
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
        this.arrow2Ref = null;
        this.arrow3Ref = null;

        // ラベルもクリア
        if (this.arrowLabel) { this.arrowLabel.setMap(null); this.arrowLabel = null; }
        if (this.arrow2Label) { this.arrow2Label.setMap(null); this.arrow2Label = null; }
        if (this.arrow3Label) { this.arrow3Label.setMap(null); this.arrow3Label = null; }

        // 重心もリセット
        this.arrowTriangleCentroid = null;
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

        // 既存ラベルの削除（全矢印）
        if (this.arrowLabel) { this.arrowLabel.setMap(null); this.arrowLabel = null; }
        if (this.arrow2Label) { this.arrow2Label.setMap(null); this.arrow2Label = null; }
        if (this.arrow3Label) { this.arrow3Label.setMap(null); this.arrow3Label = null; }

        const geom = geomLike as Geometry;
        this.clearOverlays();
        this.currentGeomRef = geom;
        this.deletedRef = false;
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

        // 飛行高度（min / max）
        const altMinRaw = (geom as any)?.flightAltitude_min_m;
        const altMaxRaw = (geom as any)?.flightAltitude_Max_m;

        const altMinNum = Number(altMinRaw);
        const altMaxNum = Number(altMaxRaw);

        let altForSafety: number | undefined;

        if (Number.isFinite(altMinNum)) {
            (metrics as any).flightAltitude_min_m = altMinNum;
            altForSafety = altMinNum;
        }

        if (Number.isFinite(altMaxNum)) {
            (metrics as any).flightAltitude_Max_m = altMaxNum;
            // 保安距離計算は Max 優先
            altForSafety = altMaxNum;
        }

        // safetyMode: geometry に保存されていればそれを優先、なければ "new"
        const safetyMode: "new" | "old" =
            (geom as any).safetyMode === "old" ? "old" : "new";
        (metrics as any).safetyMode = safetyMode;

        // 最高高度が取れる場合は、新旧の保安距離も計算してパネルに渡す
        if (altForSafety != null) {
            const { dist_m: distNew } = this.safetyDistanceByTableNew(altForSafety);
            const { dist_m: distOld } = this.safetyDistanceByTableOld(altForSafety);

            (metrics as any).safetyDistanceNew_m = distNew;
            (metrics as any).safetyDistanceOld_m = distOld;

            // 選択モードに応じて「表示用」の距離も埋める
            const selected = safetyMode === "old" ? distOld : distNew;
            (metrics as any).safetyDistance_m = selected;
            (metrics as any).buffer_m = selected;
        }

        // --- Arrow（from: takeoff基準点 → to: flight.center） ---
        const flight =
            geom.flightArea?.type === "ellipse" && Array.isArray(geom.flightArea.center)
                ? geom.flightArea
                : undefined;
        const from = this.pickReferenceCorner(geom.takeoffArea);
        const to = flight?.center as LngLat | undefined;
        if (from && to) {
            const line = this.drawArrow(from, to); // ①
            this.arrowRef = line;
            line.getPath().forEach((p: google.maps.LatLng) => bounds.extend(p));

            const fromLL = new gmaps.LatLng(from[1], from[0]);
            const toLL = new gmaps.LatLng(to[1], to[0]);

            // ★ 三角形の重心を計算
            const corner = this.computeRightAngleCorner(from, to);
            if (corner) {
                const centroidLat = (from[1] + corner[1] + to[1]) / 3;
                const centroidLng = (from[0] + corner[0] + to[0]) / 3;
                this.arrowTriangleCentroid = new gmaps.LatLng(centroidLat, centroidLng);
            } else {
                this.arrowTriangleCentroid = null;
            }

            const distance = gmaps.geometry.spherical.computeDistanceBetween(fromLL, toLL);
            this.updateDistanceLabel(fromLL, toLL, distance, "main");

            const { line2, line3 } = this.drawRightAngleArrows(from, to);

            if (line2) {
                this.arrow2Ref = line2;
                line2.getPath().forEach((p: google.maps.LatLng) => bounds.extend(p));
            }
            if (line3) {
                this.arrow3Ref = line3;
                line3.getPath().forEach((p: google.maps.LatLng) => bounds.extend(p));
            }
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
                flightAltitude_min_m: number;
                flightAltitude_Max_m: number;
                safetyMode: "new" | "old";
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

        // ---- 高度（m）＋ 保安距離モード：Geometry へ保存 + 保安距離更新 ----
        {
            const maxSrc = d.flightAltitude_Max_m;
            const minSrc = d.flightAltitude_min_m;

            const prev = this.currentGeomRef ?? {};
            const prevMin = (prev as any).flightAltitude_min_m;
            const prevMax = (prev as any).flightAltitude_Max_m;
            const prevMode: "new" | "old" = (prev as any).safetyMode === "old" ? "old" : "new";

            const altMin =
                typeof minSrc === "number" ? Math.max(0, Math.round(minSrc)) : prevMin;

            const altMax =
                typeof maxSrc === "number" ? Math.max(0, Math.round(maxSrc)) : prevMax;

            // ★ ここを修正：delta に safetyMode があればそれを優先してそのまま使う
            const nextMode: "new" | "old" =
                typeof (d as any).safetyMode === "string"
                    ? ((d as any).safetyMode === "old" ? "old" : "new")
                    : prevMode;

            const hasAlt = altMin != null || altMax != null;

            // 「高度も変わらない」かつ「モードも変わらない」なら何もしない
            if (!hasAlt && nextMode === prevMode) {
                return;
            }

            let distNew: number | undefined;
            let distOld: number | undefined;
            let buffer: number | undefined;

            if (hasAlt) {
                const altForSafety = altMax ?? altMin!;
                const newRes = this.safetyDistanceByTableNew(altForSafety);
                const oldRes = this.safetyDistanceByTableOld(altForSafety);

                distNew = newRes.dist_m;
                distOld = oldRes.dist_m;
                buffer = nextMode === "old" ? distOld : distNew;
            }

            const nextGeom: any = {
                ...prev,
                flightAltitude_min_m: altMin,
                flightAltitude_Max_m: altMax,
                safetyMode: nextMode,
            };

            if (hasAlt) {
                nextGeom.safetyArea = {
                    ...(prev as any).safetyArea,
                    type: "ellipse",
                    buffer_m: buffer,
                };
            }

            this.currentGeomRef = nextGeom as Geometry;

            // 楕円の保安距離を描き直し
            const fa = this.currentGeomRef?.flightArea;
            if (fa?.type === "ellipse" && Array.isArray(fa.center)) {
                this.ellipseEditor.updateOverlays(
                    fa.center as LngLat,
                    fa.radiusX_m,
                    fa.radiusY_m,
                    fa.rotation_deg || 0
                );
            }

            const metrics: any = {
                flightAltitude_min_m: altMin,
                flightAltitude_Max_m: altMax,
                safetyMode: nextMode,
            };

            if (hasAlt) {
                metrics.safetyDistanceNew_m = distNew;
                metrics.safetyDistanceOld_m = distOld;
                metrics.buffer_m = buffer;
                metrics.safetyDistance_m = buffer;
            }

            setDetailBarMetrics(metrics);
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
     *  矢印: パスを更新
     *  ========================= */
    private updateArrowPath(from?: LngLat, to?: LngLat) {
        if (!this.arrowRef || !from || !to) return;

        const gmaps = this.getGMaps();
        const fromLatLng = this.latLng(from[1], from[0]);
        const toLatLng = this.latLng(to[1], to[0]);

        const distance = gmaps.geometry.spherical.computeDistanceBetween(fromLatLng, toLatLng);

        this.arrowRef.setOptions({ icons: [] }); // main はヘッド無しを維持
        this.arrowRef.setPath([fromLatLng, toLatLng]);

        // ① main のラベル更新
        this.updateDistanceLabel(fromLatLng, toLatLng, distance, "main");
    }


    /** =========================
     *  矢印: ラベルを更新
     *  ========================= */
    private updateDistanceLabel(
        fromLatLng: google.maps.LatLng,
        toLatLng: google.maps.LatLng,
        distance: number,
        kind: ArrowKind = "main",
    ) {
        const gmaps = this.getGMaps();
        const map = this.getMap();
        if (!map) return;

        // 各矢印の中点
        const baseLatLng = gmaps.geometry.spherical.interpolate(fromLatLng, toLatLng, 0.5);
        const text = `${distance.toFixed(0)}m`;

        // デフォルトは中点
        let labelLatLng = baseLatLng;

        // 三角形の重心がわかっていれば、「重心 → 中点」の方向に外側へ押し出す
        if (this.arrowTriangleCentroid) {
            // 三角形の中心から見て、ラベルを置きたい中点の方向
            const headingFromCenter = gmaps.geometry.spherical.computeHeading(
                this.arrowTriangleCentroid,
                baseLatLng
            );

            // kind ごとにオフセット距離を変えてさらにばらす
            const offset =
                kind === "main" ? 22 :   // 一番外側
                    kind === "depth" ? 16 :   // 中くらい
                        14;                      // 一番外側（perp）

            labelLatLng = gmaps.geometry.spherical.computeOffset(
                baseLatLng,
                offset,
                headingFromCenter
            );
        }

        const className =
            kind === "main"
                ? "arrow-label arrow-label--main"
                : kind === "depth"
                    ? "arrow-label arrow-label--depth"
                    : "arrow-label arrow-label--perp";

        const ensureLabel = (
            current: google.maps.Marker | null
        ): google.maps.Marker => {
            if (current) {
                current.setPosition(labelLatLng);
                current.setLabel({ text, className });
                return current;
            }
            return new gmaps.Marker({
                position: labelLatLng,
                map,
                label: { text, className },
                zIndex: Z.OVERLAY.ARROW,
                clickable: false,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                    strokeWeight: 0,
                },
            });
        };

        if (kind === "main") {
            this.arrowLabel = ensureLabel(this.arrowLabel);
        } else if (kind === "depth") {
            this.arrow2Label = ensureLabel(this.arrow2Label);
        } else {
            this.arrow3Label = ensureLabel(this.arrow3Label);
        }
    }

    /** =========================
     *  矢印: 描画（① main）
     *  ========================= */
    private drawArrow(fromLngLat: LngLat, toLngLat: LngLat) {
        const pFrom = this.latLng(fromLngLat[1], fromLngLat[0]);
        const pTo = this.latLng(toLngLat[1], toLngLat[0]);
        const path = [pFrom, pTo];
        // 矢印1のみヘッドなし
        return this.createArrowPolyline(path, { hasHead: false });
    }


    // 矢印2と3: パス更新（中心/基準点の変更時に呼ぶ）
    private updateRightAngleArrowPaths(from?: LngLat, to?: LngLat) {
        const gmaps = this.getGMaps();

        if (!from || !to) {
            // ライン・ラベルともに無効化
            if (this.arrow2Ref) { this.arrow2Ref.setMap(null); this.arrow2Ref = null; }
            if (this.arrow3Ref) { this.arrow3Ref.setMap(null); this.arrow3Ref = null; }
            if (this.arrow2Label) { this.arrow2Label.setMap(null); this.arrow2Label = null; }
            if (this.arrow3Label) { this.arrow3Label.setMap(null); this.arrow3Label = null; }
            this.arrowTriangleCentroid = null;
            return;
        }

        const corner = this.computeRightAngleCorner(from, to);
        if (!corner) {
            if (this.arrow2Ref) { this.arrow2Ref.setMap(null); this.arrow2Ref = null; }
            if (this.arrow3Ref) { this.arrow3Ref.setMap(null); this.arrow3Ref = null; }
            if (this.arrow2Label) { this.arrow2Label.setMap(null); this.arrow2Label = null; }
            if (this.arrow3Label) { this.arrow3Label.setMap(null); this.arrow3Label = null; }
            this.arrowTriangleCentroid = null;
            return;
        }

        const pFrom = this.latLng(from[1], from[0]);
        const pCorner = this.latLng(corner[1], corner[0]);
        const pTo = this.latLng(to[1], to[0]);

        // 三角形の重心を更新
        const centroidLat = (from[1] + corner[1] + to[1]) / 3;
        const centroidLng = (from[0] + corner[0] + to[0]) / 3;
        this.arrowTriangleCentroid = new gmaps.LatLng(centroidLat, centroidLng);

        if (!this.arrow2Ref || !this.arrow3Ref) {
            // 無ければ新規作成（この中でラベル初期化も行う）
            const { line2, line3 } = this.drawRightAngleArrows(from, to);
            this.arrow2Ref = line2;
            this.arrow3Ref = line3;
            return;
        }

        // パス更新
        this.arrow2Ref.setPath([pFrom, pCorner]); // ② depth方向
        this.arrow3Ref.setPath([pCorner, pTo]);   // ③ depthに垂直

        // ラベル更新
        const dist2 = gmaps.geometry.spherical.computeDistanceBetween(pFrom, pCorner);
        const dist3 = gmaps.geometry.spherical.computeDistanceBetween(pCorner, pTo);
        this.updateDistanceLabel(pFrom, pCorner, dist2, "depth");
        this.updateDistanceLabel(pCorner, pTo, dist3, "perp");
    }

    // ②③: 直角に折れる2本の矢印を描画
    private drawRightAngleArrows(fromLngLat: LngLat, toLngLat: LngLat) {
        const corner = this.computeRightAngleCorner(fromLngLat, toLngLat);
        if (!corner) return { line2: null as any, line3: null as any };

        const gmaps = this.getGMaps();
        const pFrom = this.latLng(fromLngLat[1], fromLngLat[0]);
        const pCorner = this.latLng(corner[1], corner[0]);
        const pTo = this.latLng(toLngLat[1], toLngLat[0]);

        // ②: from → corner（depth方向・ヘッド有り）
        const line2 = this.createArrowPolyline([pFrom, pCorner], { hasHead: true });

        // ③: corner → to（depthに垂直・ヘッド有り）
        const line3 = this.createArrowPolyline([pCorner, pTo], { hasHead: true });

        // ラベルもここで初期化
        const dist2 = gmaps.geometry.spherical.computeDistanceBetween(pFrom, pCorner);
        const dist3 = gmaps.geometry.spherical.computeDistanceBetween(pCorner, pTo);
        this.updateDistanceLabel(pFrom, pCorner, dist2, "depth");
        this.updateDistanceLabel(pCorner, pTo, dist3, "perp");

        return { line2, line3 };
    }

    // 離発着エリアの「d（depth）」単位ベクトル（fromを原点にローカルXY[m]）
    private computeDepthUnit(from: LngLat): { dx: number; dy: number } | null {
        const t = this.currentGeomRef?.takeoffArea;
        if (t?.type !== "rectangle" || !Array.isArray(t.coordinates) || t.coordinates.length < 4) return null;

        const coords = t.coordinates;
        const refIdx = this.clampIndex(coords.length, t.referencePointIndex);
        const cur = coords[refIdx];
        const next = coords[(refIdx + 1) % 4];

        // 中心（p0-p2 中点）
        const p0 = coords[0], p2 = coords[2];
        const center: LngLat = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];

        // RectEditor.computeRightLeftLengths と同じ判定（右手系 cross<0 が右）
        const c = toLocalXY(center, cur);
        const n = toLocalXY(center, next);
        const f = { x: -c.x, y: -c.y };
        const eNext = { x: n.x - c.x, y: n.y - c.y };
        const cross = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
        const rightIsNext = cross(f, eNext) < 0;

        // depthは「左」方向の辺
        const leftIdx = rightIsNext ? (refIdx + 3) % 4 : (refIdx + 1) % 4;
        const leftPt = coords[leftIdx];

        // from原点のローカルで depth ベクトル
        const v = toLocalXY(from, leftPt);
        const len = Math.hypot(v.x, v.y);
        if (len < 1e-6) return null;
        return { dx: v.x / len, dy: v.y / len };
    }

    // 直角の折れ点 corner を計算（②: depth平行, ③: depth垂直）
    private computeRightAngleCorner(from: LngLat, to: LngLat): LngLat | null {
        const d = this.computeDepthUnit(from);
        if (!d) return null;

        // from原点のローカルに to を変換
        const rel = toLocalXY(from, to);
        // 分解 rel = u*w + v*d
        const v = rel.x * d.dx + rel.y * d.dy; // depth成分
        // corner は depth 成分だけ進んだ点
        const corner = fromLocalXY(from, d.dx * v, d.dy * v);
        return corner;
    }

    // 矢印: パスを更新
    private createArrowPolyline(
        path: google.maps.LatLng[],
        opts: { hasHead?: boolean } = {}
    ) {
        const gmaps = this.getGMaps();
        const map = this.getMap()!;
        const base: google.maps.PolylineOptions = {
            path,
            strokeColor: "#ffffff",
            strokeOpacity: 1,
            strokeWeight: 2,
            clickable: false,
            zIndex: Z.OVERLAY.ARROW,
            map,
        };

        if (opts.hasHead) {
            base.icons = [{
                icon: {
                    path: gmaps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: "#ffffff",
                    strokeOpacity: 1,
                },
                offset: "100%",
            }];
        }

        const line = new gmaps.Polyline(base);
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

    // 任意のテーブルを使って保安距離を取得
    private safetyDistanceByTableUsing(
        alt_m: number,
        table: ReadonlyArray<{ h: number; d: number }>
    ): { usedAlt: number; dist_m: number } {
        const clamped = this.clampAltRange(alt_m);
        const usedAlt = this.ceil10(clamped);
        const row =
            table.find((r) => r.h === usedAlt) ?? table[table.length - 1];
        return { usedAlt, dist_m: row.d };
    }

    // 新式テーブル
    private safetyDistanceByTableNew(alt_m: number): { usedAlt: number; dist_m: number } {
        return this.safetyDistanceByTableUsing(alt_m, MapGeometry.DIST_TABLE_NEW);
    }

    // 旧式テーブル
    private safetyDistanceByTableOld(alt_m: number): { usedAlt: number; dist_m: number } {
        return this.safetyDistanceByTableUsing(alt_m, MapGeometry.DIST_TABLE_OLD);
    }

    // ジオメトリを削除
    deleteCurrentGeometry() {
        // 表示物を全削除
        this.clearOverlays();
        // 内部状態：未設定
        this.currentGeomRef = null;
        this.deletedRef = true;
        // メトリクスもリセット
        setDetailBarMetrics({});
        // ちょっとログ
        console.info("[geometry] current geometry marked as DELETED (pending save)");
    }
}
