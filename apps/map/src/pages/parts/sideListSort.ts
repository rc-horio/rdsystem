import type { Point } from "@/features/types";
import { PREFECTURES } from "./constants/events";
import {
  areaMatchesKindFilter,
  isAreaAxisFilterActive,
  type AreaAxisFilter,
  type AreaKindFlags,
} from "./detailBar/helpers";

export type AreaSortType = "name" | "prefecture" | "updated" | "droneCount";
export type AreaSortDir = "asc" | "desc";

export const AREA_SORT_DEFAULT_DIR: Record<AreaSortType, AreaSortDir> = {
  prefecture: "asc",
  updated: "desc",
  droneCount: "desc",
  name: "asc",
};

/** 地図マーカー選択時などに、サイドバー一覧でそのエリア行へフォーカスして見える位置までスクロールする */
export function revealAreaInSidebarList(area: string) {
  const list = document.getElementById("locationList");
  if (!list) return;

  const item = Array.from(
    list.querySelectorAll<HTMLElement>("li[data-area]")
  ).find((el) => el.getAttribute("data-area") === area);
  if (!item) return;

  item.focus({ preventScroll: true });
  item.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "smooth",
  });
}

export function areaSortDirLabel(type: AreaSortType, dir: AreaSortDir): string {
  if (type === "prefecture") return dir === "asc" ? "北海道から" : "沖縄から";
  if (type === "updated") return dir === "desc" ? "新しい順" : "古い順";
  if (type === "droneCount") return dir === "desc" ? "多い順" : "少ない順";
  return dir === "asc" ? "あいうえお順" : "逆順";
}

// 更新日をグループ化するためのヘルパー関数
export const getUpdatedAtGroup = (updatedAt: string): string => {
  if (!updatedAt) return "Unknown";
  
  try {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Future"; // 未来の日付（エラーケース）
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
    // 1ヶ月以上は全て「Months ago」にまとめる
    return "Months ago";
  } catch (e) {
    return "Unknown";
  }
};

// 機体数グループのラベルを取得する関数
export const getDroneCountGroupLabel = (count: number | undefined): string => {
  if (count === undefined || count === null) return "未設定";
  if (count === 0) return "0";
  if (count <= 100) return "~100";
  if (count <= 200) return "~200";
  if (count <= 300) return "~300";
  if (count <= 400) return "~400";
  if (count <= 500) return "~500";
  if (count <= 600) return "~600";
  if (count <= 700) return "~700";
  if (count <= 800) return "~800";
  if (count <= 900) return "~900";
  if (count <= 1000) return "~1000";
  if (count <= 1500) return "~1500";
  if (count <= 2000) return "~2000";
  if (count <= 2500) return "~2500";
  if (count <= 3000) return "~3000";
  if (count <= 3500) return "~3500";
  if (count <= 4000) return "~4000";
  if (count <= 4500) return "~4500";
  if (count <= 5000) return "~5000";
  return "5000~";
};

// 機体数グループの表示順序（多い順: 5000~ が上、未設定が下）
const DRONE_COUNT_GROUP_ORDER = [
  "5000~", "~5000", "~4500", "~4000", "~3500", "~3000", "~2500", "~2000",
  "~1500", "~1000", "~900", "~800", "~700", "~600", "~500", "~400", "~300", "~200", "~100", "0", "未設定",
];

export const getDroneCountGroupOrder = (label: string): number => {
  const idx = DRONE_COUNT_GROUP_ORDER.indexOf(label);
  return idx >= 0 ? idx : 999;
};

// 更新日グループの順序を取得する関数
export const getUpdatedAtGroupOrder = (group: string): number => {
  if (group === "Today") return 0;
  if (group === "1 day ago") return 1;
  // days ago（2 days ago〜7 days ago）
  if (/^\d+ days ago$/.test(group)) {
    const days = parseInt(group.replace(" days ago", ""));
    return days; // 2 days ago=2, 3 days ago=3, ...
  }
  // weeks ago
  if (/^\d+ weeks? ago$/.test(group)) {
    const weeks = parseInt(group.replace(/ weeks? ago/, ""));
    return 10 + weeks; // 1 week ago=11, 2 weeks ago=12, ...
  }
  // Months ago（1ヶ月以上は全てまとめる）
  if (group === "Months ago") return 20;
  if (group === "Unknown") return 999;
  if (group === "Future") return -1;
  return 998;
};

export type SidebarAreaGroup = { area: string; indices: number[] };

export function selectVisibleAreaGroups(args: {
    areaGroups: SidebarAreaGroup[],
    searchQuery: string,
    axisFilter: AreaAxisFilter,
    points: Point[],
    kindCache: Record<string, AreaKindFlags>,
    areaLabelOverrides: Record<string, string>,
    prefectureCache: Record<string, string>,
    updatedAtCache: Record<string, string>,
    droneCountCache: Record<string, number | undefined>,
    sortType: AreaSortType,
    sortDir: AreaSortDir,
}): SidebarAreaGroup[] {
  const {
    areaGroups,
    searchQuery,
    axisFilter,
    points,
    kindCache,
    areaLabelOverrides,
    prefectureCache,
    updatedAtCache,
    droneCountCache,
    sortType,
    sortDir,
  } = args;
  const q = searchQuery.trim().toLowerCase();
  let filtered = areaGroups;
  
  // フィルター条件（指定なし＝問わない。あり/なしはその軸の有無）
  if (isAreaAxisFilterActive(axisFilter)) {
    filtered = filtered.filter(({ indices }) => {
      const firstIdx = indices[0];
      const firstPoint = points[firstIdx];
      if (!firstPoint?.areaUuid) return false;
      return areaMatchesKindFilter(kindCache[firstPoint.areaUuid], axisFilter);
    });
  }
  
  // 検索フィルタリング
  if (q) {
    filtered = filtered.filter(({ area, indices }) => {
      // 表示名（上書きがあればそれを検索対象に含める）
      const label = (areaLabelOverrides[area] ?? area).toLowerCase();
      if (label.includes(q)) return true;
      
      // 都道府県名でも検索
      // このエリアグループに属する最初のポイントの areaUuid を取得
      const firstIdx = indices[0];
      const firstPoint = points[firstIdx];
      if (firstPoint?.areaUuid) {
        const prefecture = prefectureCache[firstPoint.areaUuid];
        if (prefecture && prefecture.toLowerCase().includes(q)) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  // ソート
  const dirSign = sortDir === "desc" ? -1 : 1;
  if (sortType === "name") {
    filtered = [...filtered].sort((a, b) => {
      const nameA = (areaLabelOverrides[a.area] ?? a.area).localeCompare(
        areaLabelOverrides[b.area] ?? b.area,
        "ja"
      );
      return nameA * dirSign;
    });
  } else if (sortType === "updated") {
    filtered = [...filtered].sort((a, b) => {
      const firstIdxA = a.indices[0];
      const firstIdxB = b.indices[0];
      const pointA = points[firstIdxA];
      const pointB = points[firstIdxB];
      
      const updatedAtA = pointA?.areaUuid ? updatedAtCache[pointA.areaUuid] || "" : "";
      const updatedAtB = pointB?.areaUuid ? updatedAtCache[pointB.areaUuid] || "" : "";
      
      if (!updatedAtA && !updatedAtB) return 0;
      if (!updatedAtA) return 1;
      if (!updatedAtB) return -1;
      
      return updatedAtA.localeCompare(updatedAtB) * dirSign;
    });
  } else if (sortType === "prefecture") {
    const getPrefectureOrder = (prefecture: string): number => {
      if (!prefecture || prefecture.trim() === "" || prefecture === "未選択") {
        return 9999;
      }
      const index = PREFECTURES.indexOf(prefecture);
      if (index === -1) {
        return 9998;
      }
      return index;
    };
    
    filtered = [...filtered].sort((a, b) => {
      const firstIdxA = a.indices[0];
      const firstIdxB = b.indices[0];
      const pointA = points[firstIdxA];
      const pointB = points[firstIdxB];
      
      const prefectureA = pointA?.areaUuid ? prefectureCache[pointA.areaUuid] || "" : "";
      const prefectureB = pointB?.areaUuid ? prefectureCache[pointB.areaUuid] || "" : "";
      
      const orderA = getPrefectureOrder(prefectureA);
      const orderB = getPrefectureOrder(prefectureB);
      const missingA = orderA >= 9998;
      const missingB = orderB >= 9998;
      if (missingA !== missingB) return missingA ? 1 : -1;

      if (orderA !== orderB) {
        return (orderA - orderB) * dirSign;
      }
      
      const nameA = (areaLabelOverrides[a.area] ?? a.area).localeCompare(
        areaLabelOverrides[b.area] ?? b.area,
        "ja"
      );
      return nameA;
    });
  } else if (sortType === "droneCount") {
    filtered = [...filtered].sort((a, b) => {
      const firstIdxA = a.indices[0];
      const firstIdxB = b.indices[0];
      const pointA = points[firstIdxA];
      const pointB = points[firstIdxB];

      const countA = pointA?.areaUuid ? droneCountCache[pointA.areaUuid] : undefined;
      const countB = pointB?.areaUuid ? droneCountCache[pointB.areaUuid] : undefined;
      const missingA = countA == null;
      const missingB = countB == null;
      if (missingA !== missingB) return missingA ? 1 : -1;
      if (missingA && missingB) {
        return (areaLabelOverrides[a.area] ?? a.area).localeCompare(
          areaLabelOverrides[b.area] ?? b.area,
          "ja"
        );
      }

      if (countA !== countB) return ((countA ?? 0) - (countB ?? 0)) * dirSign;
      return 0;
    });
  }
  
  return filtered;
}

export function groupAreasByPrefecture(args: {
    visibleAreaGroups: SidebarAreaGroup[],
    sortType: AreaSortType,
    sortDir: AreaSortDir,
    points: Point[],
    prefectureCache: Record<string, string>,
}): Array<{ prefecture: string; areas: SidebarAreaGroup[] }> | null {
  const {
    visibleAreaGroups,
    sortType,
    sortDir,
    points,
    prefectureCache,
  } = args;
  if (sortType !== "prefecture") {
    return null; // 都道府県順以外はグループ化しない
  }

  const groups: Array<{ prefecture: string; areas: SidebarAreaGroup[] }> = [];
  const unselectedAreas: SidebarAreaGroup[] = [];

  visibleAreaGroups.forEach((areaGroup) => {
    const firstIdx = areaGroup.indices[0];
    const firstPoint = points[firstIdx];
    const prefecture = firstPoint?.areaUuid
      ? prefectureCache[firstPoint.areaUuid] || ""
      : "";

    // PREFECTURESリストに完全一致する場合のみ都道府県グループに入れる
    // 単位なし（「鹿児島」など）や空文字、「未選択」は未選択グループに入れる
    if (
      !prefecture ||
      prefecture.trim() === "" ||
      prefecture === "未選択" ||
      !PREFECTURES.includes(prefecture)
    ) {
      unselectedAreas.push(areaGroup);
    } else {
      let group = groups.find((g) => g.prefecture === prefecture);
      if (!group) {
        group = { prefecture, areas: [] };
        groups.push(group);
      }
      group.areas.push(areaGroup);
    }
  });

  // 都道府県の順序でソート
  groups.sort((a, b) => {
    const indexA = PREFECTURES.indexOf(a.prefecture);
    const indexB = PREFECTURES.indexOf(b.prefecture);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    const diff = indexA - indexB;
    return sortDir === "desc" ? -diff : diff;
  });

  // 未選択グループを最後に追加
  if (unselectedAreas.length > 0) {
    groups.push({ prefecture: "未選択", areas: unselectedAreas });
  }

  return groups;
}

export function groupAreasByUpdatedAt(args: {
    visibleAreaGroups: SidebarAreaGroup[],
    sortType: AreaSortType,
    sortDir: AreaSortDir,
    points: Point[],
    updatedAtCache: Record<string, string>,
}): Array<{ groupLabel: string; areas: SidebarAreaGroup[] }> | null {
  const {
    visibleAreaGroups,
    sortType,
    sortDir,
    points,
    updatedAtCache,
  } = args;
  if (sortType !== "updated") {
    return null; // 更新日順以外はグループ化しない
  }

  const groups: Array<{ groupLabel: string; areas: SidebarAreaGroup[] }> = [];

  visibleAreaGroups.forEach((areaGroup) => {
    const firstIdx = areaGroup.indices[0];
    const firstPoint = points[firstIdx];
    const updatedAt = firstPoint?.areaUuid
      ? updatedAtCache[firstPoint.areaUuid] || ""
      : "";

    const groupLabel = getUpdatedAtGroup(updatedAt);
    let group = groups.find((g) => g.groupLabel === groupLabel);
    if (!group) {
      group = { groupLabel, areas: [] };
      groups.push(group);
    }
    group.areas.push(areaGroup);
  });

  // 更新日グループの順序でソート（新しいものが上）
  groups.sort((a, b) => {
    const unknownA = a.groupLabel === "Unknown";
    const unknownB = b.groupLabel === "Unknown";
    if (unknownA !== unknownB) return unknownA ? 1 : -1;
    const orderA = getUpdatedAtGroupOrder(a.groupLabel);
    const orderB = getUpdatedAtGroupOrder(b.groupLabel);
    const diff = orderA - orderB;
    return sortDir === "desc" ? diff : -diff;
  });

  return groups;
}

export function groupAreasByDroneCount(args: {
    visibleAreaGroups: SidebarAreaGroup[],
    sortType: AreaSortType,
    sortDir: AreaSortDir,
    points: Point[],
    droneCountCache: Record<string, number | undefined>,
}): Array<{ groupLabel: string; areas: SidebarAreaGroup[] }> | null {
  const {
    visibleAreaGroups,
    sortType,
    sortDir,
    points,
    droneCountCache,
  } = args;
  if (sortType !== "droneCount") {
    return null;
  }

  const groups: Array<{ groupLabel: string; areas: SidebarAreaGroup[] }> = [];

  visibleAreaGroups.forEach((areaGroup) => {
    const firstIdx = areaGroup.indices[0];
    const firstPoint = points[firstIdx];
    const count = firstPoint?.areaUuid ? droneCountCache[firstPoint.areaUuid] : undefined;
    const groupLabel = getDroneCountGroupLabel(count);

    let group = groups.find((g) => g.groupLabel === groupLabel);
    if (!group) {
      group = { groupLabel, areas: [] };
      groups.push(group);
    }
    group.areas.push(areaGroup);
  });

  groups.sort((a, b) => {
    const unsetA = a.groupLabel === "未設定";
    const unsetB = b.groupLabel === "未設定";
    if (unsetA !== unsetB) return unsetA ? 1 : -1;
    const orderA = getDroneCountGroupOrder(a.groupLabel);
    const orderB = getDroneCountGroupOrder(b.groupLabel);
    const diff = orderA - orderB;
    return sortDir === "desc" ? diff : -diff;
  });

  return groups;
}
