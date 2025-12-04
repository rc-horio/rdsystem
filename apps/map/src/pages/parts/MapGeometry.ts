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
            const line = this.drawArrow(from, to); // ①
            this.arrowRef = line;
            line.getPath().forEach((p: google.maps.LatLng) => bounds.extend(p));

            const fromLL = new gmaps.LatLng(from[1], from[0]);
            const toLL = new gmaps.LatLng(to[1], to[0]);
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

            // パネルへも通知（高度＋最大移動距離）
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


    private updateDistanceLabel(
        fromLatLng: google.maps.LatLng,
        toLatLng: google.maps.LatLng,
        distance: number,
        kind: ArrowKind = "main",
    ) {
        const gmaps = this.getGMaps();
        const map = this.getMap();

        const middleLatLng = google.maps.geometry.spherical.interpolate(fromLatLng, toLatLng, 0.5);
        const text = `${distance.toFixed(0)}m`;

        const ensureLabel = (
            current: google.maps.Marker | null
        ): google.maps.Marker => {
            if (current) {
                current.setPosition(middleLatLng);
                current.setLabel(text);
                return current;
            }
            return new gmaps.Marker({
                position: middleLatLng,
                map: map,
                label: text,
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
        } else { // "perp"
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
            return;
        }

        const corner = this.computeRightAngleCorner(from, to);
        if (!corner) {
            if (this.arrow2Ref) { this.arrow2Ref.setMap(null); this.arrow2Ref = null; }
            if (this.arrow3Ref) { this.arrow3Ref.setMap(null); this.arrow3Ref = null; }
            if (this.arrow2Label) { this.arrow2Label.setMap(null); this.arrow2Label = null; }
            if (this.arrow3Label) { this.arrow3Label.setMap(null); this.arrow3Label = null; }
            return;
        }

        const pFrom = this.latLng(from[1], from[0]);
        const pCorner = this.latLng(corner[1], corner[0]);
        const pTo = this.latLng(to[1], to[0]);

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

    // 表で保安距離を取得（切り上げ・クランプ済みの行を使用）
    private safetyDistanceByTable(alt_m: number): { usedAlt: number; dist_m: number } {
        const clamped = this.clampAltRange(alt_m);
        const usedAlt = this.ceil10(clamped);
        const row =
            MapGeometry.DIST_TABLE.find((r) => r.h === usedAlt) ??
            MapGeometry.DIST_TABLE[MapGeometry.DIST_TABLE.length - 1];
        return { usedAlt, dist_m: row.d };
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

    // ログ出力
    private logSafetyDistance(alt_m: number) {
        const { usedAlt, dist_m } = this.safetyDistanceByTable(alt_m);
        const note = alt_m !== usedAlt ? `（表は ${usedAlt}m 列を採用）` : "";
        console.log(`[safety] 入力高度 ${alt_m} m → 最大移動距離(保安距離) ≈ ${dist_m} m ${note}`);
    }

}
