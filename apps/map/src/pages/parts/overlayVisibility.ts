/** 地図オーバーレイの表示切り替え用 */
export type OverlayVisibility = {
  /** 離着陸エリア */
  takeoff: boolean;
  /** 離着陸矩形の基準点（白丸） */
  referencePoint: boolean;
  /** 飛行エリア */
  flight: boolean;
  /** 保安エリア（飛行エリア表示時のみ有効） */
  safety: boolean;
  /** 観客エリア */
  audience: boolean;
  /** 矢印（線） */
  arrows: boolean;
  /** 離着陸基準点から飛行中心への直線 */
  directLine: boolean;
  /** 距離ラベル（直角矢印と直線） */
  labels: boolean;
  /** 飛行エリアの直径延長線 */
  diameterLines: boolean;
  /** DJI 飛行禁止ゾーン（NFZ） */
  djiNfz: boolean;
  /** カタログエリアの代表地点マーカー（areas.json） */
  companyMarkers: boolean;
};

export const DEFAULT_OVERLAY_VISIBILITY: OverlayVisibility = {
  takeoff: true,
  referencePoint: true,
  flight: true,
  safety: true,
  audience: true,
  arrows: true,
  directLine: true,
  labels: true,
  diameterLines: true,
  djiNfz: false,
  companyMarkers: true,
};

/** 他社図の初期表示。飛行・離着陸・観客は出し、数値を断言する補助は消す */
export const OTHER_FIGURE_OVERLAY_PATCH: Pick<
  OverlayVisibility,
  "safety" | "referencePoint" | "arrows" | "directLine" | "labels" | "diameterLines"
> = {
  safety: false,
  referencePoint: false,
  arrows: false,
  directLine: false,
  labels: false,
  diameterLines: true,
};
