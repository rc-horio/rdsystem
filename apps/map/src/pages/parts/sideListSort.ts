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
