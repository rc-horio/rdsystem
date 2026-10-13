import { useEffect, useState } from "react";
import type { Point } from "@/features/types";
import {
  fetchRawAreaInfo,
  getMaxDroneCountFromScheduleArea,
} from "./areasApi";
import { getAreaKindFlags, type AreaKindFlags } from "./detailBar/helpers";

export function useAreaListMetadata(points: Point[]) {
  // 都道府県情報のキャッシュ（areaUuid -> prefecture）
  const [prefectureCache, setPrefectureCache] = useState<Record<string, string>>({});
  // 更新日情報のキャッシュ（areaUuid -> updated_at）
  const [updatedAtCache, setUpdatedAtCache] = useState<Record<string, string>>({});
  // RC/他社タグのキャッシュ（areaUuid -> flags）
  const [kindCache, setKindCache] = useState<Record<string, AreaKindFlags>>({});
  // 機体数のキャッシュ（areaUuid -> schedules.area.drone_count.count の最大値）
  const [droneCountCache, setDroneCountCache] = useState<Record<string, number | undefined>>({});
  
  // エリア一覧が変更されたときに都道府県情報・更新日情報・種別タグ・機体数を取得してキャッシュ
  useEffect(() => {
    const loadAreaMetadata = async () => {
      const prefectureCache: Record<string, string> = {};
      const updatedAtCache: Record<string, string> = {};
      const kindCache: Record<string, AreaKindFlags> = {};
      const droneCountCache: Record<string, number | undefined> = {};
      const uniqueAreaUuids = new Set(
        points.map((p) => p.areaUuid).filter((uuid): uuid is string => !!uuid)
      );
      
      // 並列で都道府県情報・更新日情報・種別タグ・drone_count を取得
      await Promise.all(
        Array.from(uniqueAreaUuids).map(async (areaUuid) => {
          try {
            const raw = await fetchRawAreaInfo(areaUuid);
            const info = raw;
            const prefecture = typeof info?.overview?.prefecture === "string" 
              ? info.overview.prefecture 
              : "";
            if (prefecture) {
              prefectureCache[areaUuid] = prefecture;
            }
            const updatedAt = typeof info?.updated_at === "string" 
              ? info.updated_at 
              : "";
            if (updatedAt) {
              updatedAtCache[areaUuid] = updatedAt;
            }
            kindCache[areaUuid] = getAreaKindFlags(info);

            // schedules.area.drone_count.count の最大値を取得してキャッシュ
            const maxDroneCount = await getMaxDroneCountFromScheduleArea(areaUuid);
            droneCountCache[areaUuid] = maxDroneCount;
            const areaName = info?.areaName ?? areaUuid;
            if (import.meta.env.DEV) {
              console.log(
                `[drone_count] areaUuid=${areaUuid} areaName=${areaName} maxCount=${maxDroneCount ?? "なし"}`
              );
            }
          } catch (e) {
            // エラーは無視（都道府県情報や更新日情報がないエリアもある）
          }
        })
      );
      
      setPrefectureCache(prefectureCache);
      setUpdatedAtCache(updatedAtCache);
      setKindCache(kindCache);
      setDroneCountCache(droneCountCache);
    };
    
    if (points.length > 0) {
      loadAreaMetadata();
    }
  }, [points]);

  return {
    prefectureCache,
    updatedAtCache,
    kindCache,
    droneCountCache,
    setKindCache,
  };
}
