// src/pages/MapPage.tsx
import DesktopLayout from "./layout/DesktopLayout";
import MobileLayout from "./layout/MobileLayout";
import SideListBar from "./parts/SideListBar";
import MapView from "./parts/MapView";
import { useBreakpointMd } from "@/components";
import { useEffect, useMemo, useState } from "react";
import SideDetailBar from "./parts/SideDetailBar";
import GeomMetricsPanel from "./parts/GeomMetricsPanel";
import type { Point } from "@/features/types";
import {
  EV_MAP_FOCUS_ONLY,
  EV_DETAILBAR_SELECTED,
  EV_DETAILBAR_SELECT_HISTORY,
} from "./parts/constants/events";
import { buildAreaHistoryFromProjects } from "./parts/areasApi";

const AREA_NAME_NONE = "（エリア名なし）";

export default function MapPage() {
  const isMobile = useBreakpointMd();
  const [points, setPoints] = useState<Point[]>([]);

  // points → schedulesLite（最小セット：label/date/areaName）
  const schedulesLite = useMemo(
    () =>
      points
        .map((p) => ({
          label: p.name,
          date: p.date ?? "",
          areaName: p.areaName?.trim() || AREA_NAME_NONE,
        }))
        .filter((x) => x.label && x.date),
    [points]
  );

  if (import.meta.env.DEV) {
    // 最低限ログ
    console.debug(
      "[page] points=",
      points.length,
      "schedulesLite=",
      schedulesLite.length
    );
  }

  // points がロードされたあとにクエリを解釈してフォーカス＋案件選択
  useEffect(() => {
    if (!points.length) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const areaName = params.get("areaName");
      const projectUuid = params.get("projectUuid");
      const scheduleUuid = params.get("scheduleUuid");

      if (!areaName) return;

      // まずは従来どおり「エリアのフォーカス」だけ飛ばす
      window.dispatchEvent(
        new CustomEvent(EV_MAP_FOCUS_ONLY, {
          detail: { areaName },
        })
      );

      // projectUuid / scheduleUuid が無ければここまで
      if (!projectUuid || !scheduleUuid) return;

      // areaName から areaUuid を引く
      const point = points.find(
        (p) => (p.areaName || "").trim() === areaName.trim()
      );
      const areaUuid = point?.areaUuid;
      if (!areaUuid) {
        console.warn("[MapPage] areaUuid not found for areaName:", areaName);
        return;
      }

      // 該当エリアの history を組み立てて、対象の案件スケジュールを探す
      (async () => {
        try {
          const history = await buildAreaHistoryFromProjects(areaUuid);
          const idx = history.findIndex(
            (h) =>
              h.projectUuid === projectUuid && h.scheduleUuid === scheduleUuid
          );
          if (idx < 0) {
            if (import.meta.env.DEV) {
              console.debug(
                "[MapPage] history not found for project/schedule",
                { areaUuid, projectUuid, scheduleUuid }
              );
            }
            return;
          }

          const item = history[idx];

          // SideDetailBar が無くても、MapView/useScheduleSection がこのイベントを受けて
          // 該当スケジュールの geometry を表示してくれる
          window.dispatchEvent(
            new CustomEvent(EV_DETAILBAR_SELECTED, {
              detail: { isSelected: true, kind: "schedule" as const },
            })
          );

          window.dispatchEvent(
            new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
              detail: { ...item, index: idx },
            })
          );
        } catch (e) {
          console.warn("[MapPage] failed to build history for area:", e);
        }
      })();
    } catch (e) {
      console.warn("[page] failed to apply areaName from query:", e);
    }
  }, [points]);

  return isMobile ? (
    <MobileLayout>
      <MapView onLoaded={setPoints} />
      {/* ▼ 右上パネルを地図の上に重ねる */}
      <GeomMetricsPanel />
    </MobileLayout>
  ) : (
    <DesktopLayout
      sidebar={<SideListBar points={points} schedulesLite={schedulesLite} />}
    >
      <MapView onLoaded={setPoints} />
      {/* ▼ 右上パネルを地図の上に重ねる */}
      <GeomMetricsPanel />
      <SideDetailBar />
    </DesktopLayout>
  );
}
