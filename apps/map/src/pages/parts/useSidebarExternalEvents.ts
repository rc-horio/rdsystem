import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { normalizeScheduleFlightArea } from "@/features/flightFigures";
import type { HistoryItem, Point, ScheduleLite } from "@/features/types";
import { fetchProjectIndex, fetchRawAreaInfo } from "./areasApi";
import {
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_DETAILBAR_SELECT_HISTORY,
  EV_PROJECT_MODAL_SUBMIT,
  EV_SIDEBAR_SET_ACTIVE,
} from "./constants/events";
import {
  confirmScheduleAreaRelink,
  readScheduleAreaName,
  readScheduleAreaUuid,
} from "./scheduleAreaLink";
import { openDetailBar, setDetailBarHistory } from "./SideDetailBar";
import { revealAreaInSidebarList } from "./sideListSort";

export function useSidebarExternalEvents(args: {
  points: Point[];
  schedulesLite: ScheduleLite[];
  areaLabelOverrides: Record<string, string>;
  isOn: boolean;
  salesFilterOpen: boolean;
  normArea: (p?: { areaName?: string }) => string;
  loadAndShowInfoForArea: (
    area: string,
    opts?: { titleOverride?: string }
  ) => Promise<void>;
  requestDetailbarData: () => Promise<{
    title: string;
    meta: any;
    history: HistoryItem[];
  }>;
  setActiveKey: Dispatch<SetStateAction<string | null>>;
  setIsAddAreaMode: Dispatch<SetStateAction<boolean>>;
  setSalesFilterOpen: Dispatch<SetStateAction<boolean>>;
  currentAreaUuidRef: MutableRefObject<string | undefined>;
  currentAreaNameRef: MutableRefObject<string | undefined>;
  currentCandidateIndexRef: MutableRefObject<number | null>;
  currentSalesIndexRef: MutableRefObject<number | null>;
  currentCandidateTitleRef: MutableRefObject<string | undefined>;
  currentOtherRecordIndexRef: MutableRefObject<number | null>;
  currentOtherFigureIndexRef: MutableRefObject<number | null>;
  pendingProjectLinkRef: MutableRefObject<{
    projectUuid: string;
    scheduleUuid: string;
  } | null>;
  salesFilterRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const {
    points,
    schedulesLite,
    areaLabelOverrides,
    isOn,
    salesFilterOpen,
    normArea,
    loadAndShowInfoForArea,
    requestDetailbarData,
    setActiveKey,
    setIsAddAreaMode,
    setSalesFilterOpen,
    currentAreaUuidRef,
    currentAreaNameRef,
    currentCandidateIndexRef,
    currentSalesIndexRef,
    currentCandidateTitleRef,
    currentOtherRecordIndexRef,
    currentOtherFigureIndexRef,
    pendingProjectLinkRef,
    salesFilterRef,
  } = args;

  // 外部イベントでアクティブ切替
  useEffect(() => {
    const onSetActive = (e: Event) => {
      const ce = e as CustomEvent<{
        clear?: boolean;
        areaName?: string;
        name?: string;
        lat?: number;
        lng?: number;
      }>;
      const d = ce.detail || {};
      if (d.clear) {
        setActiveKey(null);
        return;
      }
      const idx = points.findIndex((p) => {
        const area = normArea(p);
        return (
          (d.areaName && area === d.areaName) ||
          (d.name && p.name === d.name) ||
          (typeof d.lat === "number" &&
            typeof d.lng === "number" &&
            p.lat === d.lat &&
            p.lng === d.lng)
        );
      });
      if (idx < 0) return;

      const area = normArea(points[idx]);
      currentAreaUuidRef.current = points[idx].areaUuid;
      currentAreaNameRef.current = areaLabelOverrides[area] || area;
      setActiveKey(area);

      const titleOverride = areaLabelOverrides[area];
      loadAndShowInfoForArea(area, { titleOverride });

      // 埋め込みモードでは自動で詳細バーを開かない
      openDetailBar();

      requestAnimationFrame(() => revealAreaInSidebarList(area));
    };

    window.addEventListener(
      EV_SIDEBAR_SET_ACTIVE,
      onSetActive as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_SIDEBAR_SET_ACTIVE,
        onSetActive as EventListener
      );
    // isEmbed を依存配列に追加
  }, [points, schedulesLite, areaLabelOverrides]);

  // 編集モード切替ボタンのクラスを切り替える
  useEffect(() => {
    document.body.classList.toggle("editing-on", isOn);
    return () => {
      document.body.classList.remove("editing-on");
    };
  }, [isOn]);

  // 候補選択（どの candidate を保存対象にするか）／他社飛行エリア図
  useEffect(() => {
    const onCandidate = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            index?: number;
            title?: string;
            source?: "candidate" | "other" | "sales";
            recordIndex?: number;
          }>
        ).detail || {};
      currentCandidateTitleRef.current =
        typeof d.title === "string" ? d.title : undefined;
      if (d.source === "other") {
        currentOtherRecordIndexRef.current = Number.isInteger(d.recordIndex)
          ? (d.recordIndex as number)
          : null;
        currentOtherFigureIndexRef.current = Number.isInteger(d.index)
          ? (d.index as number)
          : null;
        currentCandidateIndexRef.current = null;
        currentSalesIndexRef.current = null;
      } else if (d.source === "sales") {
        currentSalesIndexRef.current = Number.isInteger(d.index)
          ? (d.index as number)
          : null;
        currentCandidateIndexRef.current = null;
        currentOtherRecordIndexRef.current = null;
        currentOtherFigureIndexRef.current = null;
      } else {
        currentCandidateIndexRef.current = Number.isInteger(d.index)
          ? (d.index as number)
          : null;
        currentSalesIndexRef.current = null;
        currentOtherRecordIndexRef.current = null;
        currentOtherFigureIndexRef.current = null;
      }
    };
    window.addEventListener(
      EV_DETAILBAR_SELECT_CANDIDATE,
      onCandidate as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SELECT_CANDIDATE,
        onCandidate as EventListener
      );
  }, []);

  useEffect(() => {
    const onHistory = () => {
      currentOtherRecordIndexRef.current = null;
      currentOtherFigureIndexRef.current = null;
      currentSalesIndexRef.current = null;
    };
    window.addEventListener(EV_DETAILBAR_SELECT_HISTORY, onHistory);
    return () =>
      window.removeEventListener(EV_DETAILBAR_SELECT_HISTORY, onHistory);
  }, []);

  // 案件紐づけモーダルからの選択結果を受け取る
  useEffect(() => {
    const onProjectSubmit = (e: Event) => {
      const d =
        (e as CustomEvent<{
          projectUuid?: string;
          scheduleUuid?: string;
        }>).detail || {};

      const projectUuid = d.projectUuid;
      const scheduleUuid = d.scheduleUuid;
      if (projectUuid && scheduleUuid) {
        if (import.meta.env.DEV) {
          console.debug("[sidebar] pending project link set", {
            projectUuid,
            scheduleUuid,
          });
        }

        // ★ ここから「④〜⑤の間に DetailBar の案件履歴に即時反映」する処理
        const run = async () => {
          // どのエリアに紐づけるか分からない場合はスキップ
          if (!currentAreaUuidRef.current) return;

          // プロジェクト index を取得
          const proj = await fetchProjectIndex(projectUuid);
          if (!proj) return;

          const projectName: string =
            typeof proj?.project?.name === "string"
              ? proj.project.name
              : "(不明な案件)";

          const sch = Array.isArray(proj?.schedules)
            ? proj.schedules.find((s: any) => s?.id === scheduleUuid)
            : null;
          if (!sch) return;

          const scheduleName: string =
            typeof sch?.label === "string" ? sch.label : "(スケジュール)";
          const date: string =
            typeof sch?.date === "string" && sch.date
              ? sch.date
              : new Date().toISOString().slice(0, 10); // 日付がなかった場合のフォールバック

          const currentAreaUuid = currentAreaUuidRef.current;
          const linkedAreaUuid = readScheduleAreaUuid(sch?.area);
          if (linkedAreaUuid && linkedAreaUuid !== currentAreaUuid) {
            let oldAreaName = readScheduleAreaName(sch?.area);
            if (!oldAreaName) {
              try {
                const oldInfo = await fetchRawAreaInfo(linkedAreaUuid);
                oldAreaName =
                  typeof oldInfo?.areaName === "string" ? oldInfo.areaName : "";
              } catch (err) {
                console.warn("[sidebar] old area name fetch failed:", err);
              }
            }
            const newAreaName = currentAreaNameRef.current ?? "";
            const ok = confirmScheduleAreaRelink({
              projectName,
              scheduleName,
              oldAreaName,
              newAreaName,
            });
            if (!ok) return;
          }

          // 今の DetailBar の history を取得
          let currentHistory: HistoryItem[] = [];
          try {
            const snapshot = await requestDetailbarData();
            currentHistory = snapshot.history ?? [];
          } catch (err) {
            console.warn("[sidebar] requestDetailbarData failed:", err);
          }

          // すでに同じ projectUuid / scheduleUuid があれば重複追加しない
          const exists = currentHistory.some(
            (h) =>
              h.projectUuid === projectUuid &&
              h.scheduleUuid === scheduleUuid
          );
          if (exists) return;

          pendingProjectLinkRef.current = {
            projectUuid,
            scheduleUuid,
          };

          const nextHistory: HistoryItem[] = [
            ...currentHistory,
            {
              date,
              projectName,
              scheduleName,
              projectUuid,
              scheduleUuid,
              ...normalizeScheduleFlightArea(sch?.area, scheduleName),
            },
          ];

          // DetailBar に即時反映（あくまでフロントの state だけ）
          setDetailBarHistory(nextHistory);
          window.alert(
            "案件情報を紐づけました。\nSAVEボタンで確定してください。"
          );
        };

        // 非同期処理を起動
        run().catch((err) =>
          console.error("[sidebar] project link UI update failed:", err)
        );
      } else {
        pendingProjectLinkRef.current = null;
      }
    };

    window.addEventListener(
      EV_PROJECT_MODAL_SUBMIT,
      onProjectSubmit as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_PROJECT_MODAL_SUBMIT,
        onProjectSubmit as EventListener
      );
  }, []);

  // モードOFFでリセット
  useEffect(() => {
    const onModeChange = (e: Event) => {
      const d = (e as CustomEvent<{ active?: boolean }>).detail;
      const active = !!d?.active;
      setIsAddAreaMode(active);
    };

    window.addEventListener(
      "map:add-area-mode-changed",
      onModeChange as EventListener
    );
    return () =>
      window.removeEventListener(
        "map:add-area-mode-changed",
        onModeChange as EventListener
      );
  }, []);

  useEffect(() => {
    if (!salesFilterOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!salesFilterRef.current?.contains(e.target as Node)) {
        setSalesFilterOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSalesFilterOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [salesFilterOpen]);
}
