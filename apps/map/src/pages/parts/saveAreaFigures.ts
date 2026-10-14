import { setDetailBarMeta } from "./SideDetailBar";
import {
  clearAreaCandidateGeometryAtIndex,
  clearAreaSalesGeometryAtIndex,
  fetchAreaInfo,
  upsertAreaCandidateAtIndex,
  upsertAreaOtherFigureAtIndex,
  upsertAreaSalesAtIndex,
  upsertScheduleFlightFiguresBatch,
} from "./areasApi";
import type {
  Candidate,
  GeometryPayload,
  HistoryItem,
  OtherRecord,
} from "@/features/types";

export const canMergeOwnGeometry = (
  historyItems: HistoryItem[],
  geomPayload: GeometryPayload | null
): boolean => {
  if (!geomPayload || geomPayload.deleted === true || !geomPayload.geometry) {
    return false;
  }
  if (!geomPayload.projectUuid || !geomPayload.scheduleUuid) return false;
  const figureId =
    typeof geomPayload.figureId === "string" ? geomPayload.figureId.trim() : "";
  if (!figureId) return false;
  return historyItems.some(
    (item) =>
      item.projectUuid === geomPayload.projectUuid &&
      item.scheduleUuid === geomPayload.scheduleUuid &&
      (item.flight_figures ?? []).some((figure) => figure.id === figureId)
  );
};

// projects/<projectUuid>/index.json
// 案件に紐づく飛行エリア図を保存
export const applyOwnFlightFiguresFromHistory = async (
  historyItems: HistoryItem[],
  geomPayload: GeometryPayload | null
): Promise<boolean> => {
  const items = historyItems.flatMap((item) => {
    if (!item.projectUuid || !item.scheduleUuid) return [];
    const mergeThis =
      !!geomPayload &&
      geomPayload.deleted !== true &&
      !!geomPayload.geometry &&
      geomPayload.projectUuid === item.projectUuid &&
      geomPayload.scheduleUuid === item.scheduleUuid;
    return [
      {
        projectUuid: item.projectUuid,
        scheduleUuid: item.scheduleUuid,
        flight_figures: item.flight_figures ?? [],
        confirmed_figure_id: item.confirmed_figure_id ?? null,
        mergeFigureId: mergeThis ? geomPayload?.figureId : undefined,
        geometry: mergeThis ? geomPayload?.geometry : undefined,
      },
    ];
  });
  if (items.length === 0) return true;
  const ok = await upsertScheduleFlightFiguresBatch(items);
  if (!ok) console.warn("[save] own flight figures save failed");
  return ok;
};

// areas/<areaUuid>/index.json
// 候補エリアの geometry を保存 or 削除
export const applyCandidateGeometryFromPayload = async (params: {
  payload: GeometryPayload;
  areaUuidToUse?: string;
  candidateIndex: number | null;
  candidateTitle?: string;
  activeAreaName: string | null;
}): Promise<{ writeOk: boolean | null; candidates?: Candidate[] }> => {
  const {
    payload,
    areaUuidToUse,
    candidateIndex,
    candidateTitle,
    activeAreaName,
  } = params;
  const { geometry, deleted } = payload;

  const idx = candidateIndex;
  if (!areaUuidToUse || typeof idx !== "number" || idx < 0) {
    console.warn(
      "[save] candidate context missing (areaUuid/index). Skipped."
    );
    return { writeOk: null };
  }

  let writeOk = true;
  if (deleted === true) {
    writeOk = await clearAreaCandidateGeometryAtIndex({
      areaUuid: areaUuidToUse,
      index: idx,
    });
    if (!writeOk) console.warn("[save] candidate geometry delete failed");
  } else if (geometry) {
    const g = geometry;
    writeOk = await upsertAreaCandidateAtIndex({
      areaUuid: areaUuidToUse,
      index: idx,
      candidate: {
        title: candidateTitle,
        flightAltitude_min_m: g.flightAltitude_min_m,
        flightAltitude_Max_m: g.flightAltitude_Max_m,
        takeoffArea: g.takeoffArea,
        flightArea: g.flightArea,
        safetyArea: g.safetyArea,
        audienceArea: g.audienceArea,
      },
      preserveTitle: true,
    });
    if (!writeOk) console.warn("[save] candidate geometry save failed");
  }

  try {
    const { meta: refreshedMeta } = await fetchAreaInfo(
      areaUuidToUse,
      activeAreaName || ""
    );
    setDetailBarMeta(refreshedMeta);
    return {
      writeOk,
      candidates: Array.isArray(refreshedMeta.candidate)
        ? refreshedMeta.candidate
        : undefined,
    };
  } catch (e) {
    console.warn("[save] refresh candidate meta failed:", e);
    return { writeOk };
  }
};

export const applySalesGeometryFromPayload = async (params: {
  payload: GeometryPayload;
  areaUuidToUse?: string;
  salesIndex: number | null;
  figureTitle?: string;
  activeAreaName: string | null;
}  ): Promise<{ writeOk: boolean | null; sales?: Candidate[] }> => {
  const { payload, areaUuidToUse, salesIndex, figureTitle, activeAreaName } =
    params;
  const { geometry, deleted } = payload;

  const idx = salesIndex;
  if (!areaUuidToUse || typeof idx !== "number" || idx < 0) {
    console.warn("[save] sales context missing (areaUuid/index). Skipped.");
    return { writeOk: null };
  }

  let writeOk = true;
  if (deleted === true) {
    writeOk = await clearAreaSalesGeometryAtIndex({
      areaUuid: areaUuidToUse,
      index: idx,
    });
    if (!writeOk) console.warn("[save] sales geometry delete failed");
  } else if (geometry) {
    const g = geometry;
    const titled = (figureTitle ?? "").trim();
    writeOk = await upsertAreaSalesAtIndex({
      areaUuid: areaUuidToUse,
      index: idx,
      figure: {
        ...(titled ? { title: titled } : {}),
        flightAltitude_min_m: g.flightAltitude_min_m,
        flightAltitude_Max_m: g.flightAltitude_Max_m,
        takeoffArea: g.takeoffArea,
        flightArea: g.flightArea,
        safetyArea: g.safetyArea,
        audienceArea: g.audienceArea,
      },
      preserveTitle: true,
    });
    if (!writeOk) console.warn("[save] sales geometry save failed");
  }

  try {
    const { meta: refreshedMeta } = await fetchAreaInfo(
      areaUuidToUse,
      activeAreaName || ""
    );
    setDetailBarMeta(refreshedMeta);
    return {
      writeOk,
      sales: Array.isArray(refreshedMeta.sales) ? refreshedMeta.sales : undefined,
    };
  } catch (e) {
    console.warn("[save] refresh sales meta failed:", e);
    return { writeOk };
  }
};

export const applyOtherFigureGeometryFromPayload = async (params: {
  payload: GeometryPayload;
  areaUuidToUse?: string;
  recordIndex: number;
  figureIndex: number;
  figureTitle?: string;
  activeAreaName: string | null;
}  ): Promise<{ writeOk: boolean | null; records?: OtherRecord[] | null }> => {
  const {
    payload,
    areaUuidToUse,
    recordIndex,
    figureIndex,
    figureTitle,
    activeAreaName,
  } = params;
  const { geometry, deleted } = payload;

  if (
    !areaUuidToUse ||
    !Number.isInteger(recordIndex) ||
    recordIndex < 0 ||
    !Number.isInteger(figureIndex) ||
    figureIndex < 0
  ) {
    console.warn(
      "[save] other-figure context missing (areaUuid/record/figure). Skipped."
    );
    return { writeOk: null };
  }

  let writeOk = true;
  if (deleted === true) {
    if (import.meta.env.DEV) {
      console.debug(
        "[save] skip other-figure geometry delete: figure rows are removed from the list, not via map delete"
      );
    }
  } else if (geometry) {
    const g = geometry;
    writeOk = await upsertAreaOtherFigureAtIndex({
      areaUuid: areaUuidToUse,
      recordIndex,
      figureIndex,
      figure: {
        title: figureTitle,
        flightAltitude_min_m: g.flightAltitude_min_m,
        flightAltitude_Max_m: g.flightAltitude_Max_m,
        takeoffArea: g.takeoffArea,
        flightArea: g.flightArea,
        safetyArea: g.safetyArea,
        audienceArea: g.audienceArea,
      },
      preserveTitle: true,
    });
    if (!writeOk) console.warn("[save] other-figure geometry save failed");
  }

  try {
    const { meta: refreshedMeta } = await fetchAreaInfo(
      areaUuidToUse,
      activeAreaName || ""
    );
    setDetailBarMeta(refreshedMeta);
    return {
      writeOk,
      records: Array.isArray(refreshedMeta.otherRecords)
        ? refreshedMeta.otherRecords
        : [],
    };
  } catch (e) {
    console.warn("[save] refresh other-figure meta failed:", e);
    return { writeOk, records: null };
  }
};
