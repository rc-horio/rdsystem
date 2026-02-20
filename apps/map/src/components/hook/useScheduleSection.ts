// src/pages/parts/hooks/useScheduleSection.ts

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Geometry } from "@/features/types";
import { fetchProjectIndex } from "../../pages/parts/areasApi";
import { EV_DETAILBAR_SELECT_HISTORY } from "../../pages/parts/constants/events";
import type { MapGeometry } from "../../pages/parts/MapGeometry";

type UseScheduleSectionParams = {
    // MapGeometry インスタンスへの参照（外側の MapView で生成されたもの）
    geomRef: MutableRefObject<MapGeometry | null>;
    // 「飛行エリアを作図する」CTA の表示状態を切り替える
    setShowCreateGeomCta: (v: boolean) => void;
    // 既存のジオメトリ描画を全てクリアするコールバック
    clearGeometryOverlays: () => void;
    // SideDetailBar のメトリクス（寸法など）を更新する
    setDetailBarMetrics: (metrics: any) => void;
    // 現在選択中の projectUuid を保持する ref（保存処理などで利用）
    currentProjectUuidRef: MutableRefObject<string | undefined>;
    // 現在選択中の scheduleUuid を保持する ref（保存処理などで利用）
    currentScheduleUuidRef: MutableRefObject<string | undefined>;
};

/**
 * detailbar:select-history（案件情報セクションで履歴を選択）のイベントを購読し、
 * - projectUuid / scheduleUuid の記録
 * - 該当スケジュールの geometry 取得
 * - MapGeometry への描画
 * - CTA（飛行エリアを作図する）の表示制御
 * をまとめて行うカスタムフック。
 *
 * MapView 側からはこのフックを呼ぶだけで、
 * 「案件履歴を選んだときの map 側の挙動」が一括で有効になる。
 */
export function useScheduleSection({
    geomRef,
    setShowCreateGeomCta,
    clearGeometryOverlays,
    setDetailBarMetrics,
    currentProjectUuidRef,
    currentScheduleUuidRef,
}: UseScheduleSectionParams) {
    useEffect(() => {
        // SideDetailBar 側で履歴が選択されたときに飛んでくるイベントハンドラ
        const onSelect = async (e: Event) => {
            try {
                const { projectUuid, scheduleUuid } =
                    (
                        e as CustomEvent<{
                            projectUuid?: string;
                            scheduleUuid?: string;
                        }>
                    ).detail || {};

                // 現在のスケジュールを覚えておく（保存先の判定や後続処理に利用）
                currentProjectUuidRef.current = projectUuid || undefined;
                currentScheduleUuidRef.current = scheduleUuid || undefined;

                // 一旦 CTA は非表示にしておく（geometry の有無により後で切り替える）
                setShowCreateGeomCta(false);

                // MapGeometry 側にも「今のスケジュール」を通知（参照点の表示などで利用）
                geomRef.current?.setCurrentSchedule(projectUuid, scheduleUuid);

                // projectUuid / scheduleUuid のどちらかが無ければジオメトリを表示できない
                if (!projectUuid || !scheduleUuid) {
                    if (import.meta.env.DEV)
                        console.warn("[map] missing uuids in select-history");
                    geomRef.current?.clearUndoHistory();
                    clearGeometryOverlays();
                    setDetailBarMetrics({});
                    return;
                }

                // プロジェクトの index.json を取得し、該当スケジュールを探す
                const proj = await fetchProjectIndex(projectUuid);
                const schedules = Array.isArray(proj?.schedules) ? proj.schedules : [];
                const sch: any = schedules.find((s: any) => s?.id === scheduleUuid);

                // 対象スケジュールが見つからない場合はクリアして終了
                if (!sch) {
                    if (import.meta.env.DEV)
                        console.warn("[map] schedule not found", scheduleUuid);
                    console.info(
                        `[map] geometry: UNKNOWN (schedule not found) project=${projectUuid}, schedule=${scheduleUuid}`
                    );
                    geomRef.current?.clearUndoHistory();
                    clearGeometryOverlays();
                    setDetailBarMetrics({});
                    return;
                }

                // geometry の有無判定
                const geom = sch?.area?.geometry as Geometry | undefined;
                const hasGeom =
                    !!geom && typeof geom === "object" && Object.keys(geom).length > 0;
                    
                const label =
                    typeof sch?.label === "string" ? sch.label : String(scheduleUuid);

                if (hasGeom && geom) {
                    // 飛行エリア中心（ellipse）の座標ログ用
                    const center =
                        geom?.flightArea?.type === "ellipse" &&
                            Array.isArray(geom?.flightArea?.center)
                            ? geom.flightArea.center
                            : undefined;

                    console.info(
                        `[map] geometry: PRESENT for "${label}" (id=${sch?.id}) on ${sch?.date ?? "N/A"
                        }`,
                        {
                            geometryKeys: Object.keys(geom),
                            center, // 例: [lng, lat]
                        }
                    );

                    // ジオメトリを描画（内部で fitBounds などが走る）
                    geomRef.current?.renderGeometry(geom);
                } else {
                    // 既存スケジュールだが geometry が無い → 「飛行エリアを作図する」CTA を出す
                    setShowCreateGeomCta(true);
                    console.info(
                        `[map] geometry: ABSENT for "${label}" (id=${sch?.id}) on ${sch?.date ?? "N/A"
                        }`
                    );
                    geomRef.current?.clearUndoHistory();
                    clearGeometryOverlays();
                    setDetailBarMetrics({});
                }
            } catch (err) {
                // エラー時は CTA を隠し、図形とメトリクスをクリア
                setShowCreateGeomCta(false);
                console.error("[map] render geometry error", err);
                geomRef.current?.clearUndoHistory();
                clearGeometryOverlays();
                setDetailBarMetrics({});
            }
        };

        // detailbar:select-history イベントを購読
        window.addEventListener(
            EV_DETAILBAR_SELECT_HISTORY,
            onSelect as EventListener
        );

        // アンマウント時にイベントハンドラを解除
        return () => {
            window.removeEventListener(
                EV_DETAILBAR_SELECT_HISTORY,
                onSelect as EventListener
            );
        };
        // 依存配列は空：MapView のマウント・アンマウントに合わせて一度だけ登録
    }, []);
}
