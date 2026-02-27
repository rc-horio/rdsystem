/** 地図オーバーレイの表示切り替え用 */
export type OverlayVisibility = {
  /** 離発着エリア */
  takeoff: boolean;
  /** 飛行エリア */
  flight: boolean;
  /** 保安エリア（飛行エリア表示時のみ有効） */
  safety: boolean;
  /** 観客エリア */
  audience: boolean;
  /** 矢印（線） */
  arrows: boolean;
  /** 矢印の距離ラベル */
  labels: boolean;
  /** 飛行エリアの直径延長線 */
  diameterLines: boolean;
  /** DJI 飛行禁止ゾーン（NFZ） */
  djiNfz: boolean;
};

export const DEFAULT_OVERLAY_VISIBILITY: OverlayVisibility = {
  takeoff: true,
  flight: true,
  safety: true,
  audience: true,
  arrows: true,
  labels: true,
  diameterLines: true,
  djiNfz: true,
};
