// src/pages/MapPage.tsx
import DesktopLayout from "./layout/DesktopLayout";
import MobileLayout from "./layout/MobileLayout";
import SideListBar from "./parts/SideListBar";
import MapView from "./parts/MapView";
import { useBreakpointMd } from "@/components";
import { useMemo, useState } from "react";
import SideDetailBar from "./parts/SideDetailBar";
import GeomMetricsPanel from "./parts/GeomMetricsPanel";
import type { Point } from "@/features/types";

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
