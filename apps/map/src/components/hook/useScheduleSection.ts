import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Geometry } from "@/features/types";
import { hasUsableGeometry } from "@/features/flightFigures";
import { EV_DETAILBAR_SELECT_HISTORY } from "../../pages/parts/constants/events";
import type { MapGeometry } from "../../pages/parts/MapGeometry";

type UseScheduleSectionParams = {
    geomRef: MutableRefObject<MapGeometry | null>;
    setShowCreateGeomCta: (v: boolean) => void;
    clearGeometryOverlays: () => void;
    setDetailBarMetrics: (metrics: any) => void;
    currentProjectUuidRef: MutableRefObject<string | undefined>;
    currentScheduleUuidRef: MutableRefObject<string | undefined>;
    createDefaultGeometryForFigure: () => void;
};

export function useScheduleSection({
    geomRef,
    setShowCreateGeomCta,
    clearGeometryOverlays,
    setDetailBarMetrics,
    currentProjectUuidRef,
    currentScheduleUuidRef,
    createDefaultGeometryForFigure,
}: UseScheduleSectionParams) {
    useEffect(() => {
        const onSelect = (e: Event) => {
            try {
                const detail =
                    (
                        e as CustomEvent<{
                            projectUuid?: string;
                            scheduleUuid?: string;
                            figureId?: string;
                            geometry?: Geometry;
                        }>
                    ).detail || {};
                const { projectUuid, scheduleUuid, figureId, geometry } = detail;

                currentProjectUuidRef.current = projectUuid || undefined;
                currentScheduleUuidRef.current = scheduleUuid || undefined;
                setShowCreateGeomCta(false);
                geomRef.current?.setCurrentSchedule(
                    projectUuid,
                    scheduleUuid,
                    figureId
                );

                if (!projectUuid || !scheduleUuid) {
                    if (import.meta.env.DEV)
                        console.warn("[map] missing uuids in select-history");
                    geomRef.current?.clearUndoHistory();
                    clearGeometryOverlays();
                    setDetailBarMetrics({});
                    return;
                }

                if (!figureId) {
                    geomRef.current?.clearUndoHistory();
                    clearGeometryOverlays();
                    setDetailBarMetrics({});
                    return;
                }

                if (hasUsableGeometry(geometry)) {
                    geomRef.current?.renderGeometry(geometry);
                    return;
                }

                createDefaultGeometryForFigure();
            } catch (err) {
                setShowCreateGeomCta(false);
                console.error("[map] render geometry error", err);
                geomRef.current?.clearUndoHistory();
                clearGeometryOverlays();
                setDetailBarMetrics({});
            }
        };

        window.addEventListener(
            EV_DETAILBAR_SELECT_HISTORY,
            onSelect as EventListener
        );
        return () => {
            window.removeEventListener(
                EV_DETAILBAR_SELECT_HISTORY,
                onSelect as EventListener
            );
        };
    }, []);
}
