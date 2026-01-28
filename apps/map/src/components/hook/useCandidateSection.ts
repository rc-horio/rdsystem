// src/pages/parts/hooks/useCandidateSection.ts

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Geometry } from "@/features/types";
import { EV_DETAILBAR_SELECT_CANDIDATE } from "../../pages/parts/constants/events";
import type { MapGeometry } from "../../pages/parts/MapGeometry";

type UseCandidateSectionParams = {
    // MapGeometry インスタンスへの参照（外側の MapView で生成されたもの）
    geomRef: MutableRefObject<MapGeometry | null>;
    // 「飛行エリアを作図する」CTA の表示状態を切り替える
    // ※候補セクションではボタンを出さないが、念のため false をセットして隠す用途で利用
    setShowCreateGeomCta: (v: boolean) => void;
    // 既存のジオメトリ描画を全てクリアするコールバック
    clearGeometryOverlays: () => void;
    // SideDetailBar のメトリクス（寸法など）を更新する
    setDetailBarMetrics: (metrics: any) => void;
    // 履歴側の文脈（projectUuid / scheduleUuid）を無効化するための ref
    currentProjectUuidRef: MutableRefObject<string | undefined>;
    currentScheduleUuidRef: MutableRefObject<string | undefined>;
    // 現在選択中の候補 index（保存時にどの候補を上書きするかに利用）
    currentCandidateIndexRef: MutableRefObject<number | null>;
    // 現在選択中の候補ラベル（保存時にラベルを維持するために利用）
    currentCandidateTitleRef: MutableRefObject<string | undefined>;
    // 「候補ラベル確定 or 候補選択だが geometry が無い」ケースで
    // デフォルトジオメトリを生成するためのコールバック
    createDefaultGeometryForCandidate: () => void;
};

/**
 * 候補ジオメトリの有無を判定するユーティリティ関数。
 * 各エリア（離発着 / 飛行 / 保安 / 観客）のどれか 1 つでも妥当な形状があれば「有り」とみなす。
 */
const hasCandidateGeometry = (g?: Geometry | null): boolean => {
    if (!g || typeof g !== "object") return false;

    const hasCoords = (coords?: any) =>
        Array.isArray(coords) && coords.length >= 3;

    const hasEllipse = (ea?: any) =>
        ea &&
        ea.type === "ellipse" &&
        Array.isArray(ea.center) &&
        ea.center.length === 2 &&
        Number.isFinite(ea.radiusX_m) &&
        Number.isFinite(ea.radiusY_m);

    const hasRect = (ra?: any) =>
        ra && ra.type === "rectangle" && hasCoords(ra.coordinates);

    const takeoff = hasRect(g.takeoffArea);
    const flight = hasEllipse(g.flightArea) || hasRect(g.flightArea); // 念のため rectangle も許容
    const safety =
        (g.safetyArea &&
            g.safetyArea.type === "ellipse" &&
            Number.isFinite(g.safetyArea.buffer_m)) ||
        hasRect(g.safetyArea);
    const audience = hasRect(g.audienceArea);

    return !!(takeoff || flight || safety || audience);
};

/**
 * detailbar:select-candidate（候補セクションで候補を選択）のイベントを購読し、
 * - 候補 index / title の記録
 * - 履歴（スケジュール）文脈のリセット
 * - MapGeometry へのジオメトリ描画
 * - （geometry が無ければ）デフォルトジオメトリの自動生成
 * をまとめて行うカスタムフック。
 *
 * ※候補セクションでは CTA ボタンは使わず、
 *   「候補がある = ジオメトリも必ずある」前提に近づける。
 */
export function useCandidateSection({
    geomRef,
    setShowCreateGeomCta,
    currentProjectUuidRef,
    currentScheduleUuidRef,
    currentCandidateIndexRef,
    currentCandidateTitleRef,
    createDefaultGeometryForCandidate,
}: UseCandidateSectionParams) {
    useEffect(() => {
        // SideDetailBar 側で候補が選択されたときに飛んでくるイベントハンドラ
        const onCandidateSelect = (e: Event) => {
            const { detail } = e as CustomEvent<{
                geometry: Geometry;
                index?: number;
                title?: string;
            }>;
            if (!detail) return;

            // どの候補を編集しているか（何番目か）を記録
            currentCandidateIndexRef.current =
                typeof detail.index === "number" ? detail.index : null;
            // 候補ラベルも記録（保存時にラベルを維持するため）
            currentCandidateTitleRef.current =
                typeof detail.title === "string" ? detail.title : undefined;

            // 履歴（プロジェクト）文脈はここで確実に無効化
            // → 以降の保存処理では「候補として保存」することになる
            currentProjectUuidRef.current = undefined;
            currentScheduleUuidRef.current = undefined;
            // MapGeometry がスケジュール文脈を内部保持している場合に備え、明示的に解除
            geomRef.current?.setCurrentSchedule?.(undefined as any, undefined as any);

            // 候補セクションでは CTA ボタンは使わず、常に非表示にしておく
            setShowCreateGeomCta(false);

            // 既に geometry があればそのまま描画
            const hasGeom = hasCandidateGeometry(detail.geometry);
            if (hasGeom) {
                geomRef.current?.renderGeometry(detail.geometry);
            } else {
                // まだ候補ジオメトリが無い → デフォルトジオメトリを自動生成
                // （描画やメトリクス更新は MapGeometry 側に委譲）
                createDefaultGeometryForCandidate();

                // createDefaultGeometryForCandidate() の内部で
                // clearGeometryOverlays / setDetailBarMetrics は適切に呼ばれるため、
                // ここでは明示的に何もしない。
            }
        };

        // detailbar:select-candidate イベントを購読
        window.addEventListener(
            EV_DETAILBAR_SELECT_CANDIDATE,
            onCandidateSelect as EventListener
        );

        // アンマウント時にイベントハンドラを解除
        return () => {
            window.removeEventListener(
                EV_DETAILBAR_SELECT_CANDIDATE,
                onCandidateSelect as EventListener
            );
        };
        // 依存配列は空：MapView のマウント・アンマウントに合わせて一度だけ登録
    }, []);
}
