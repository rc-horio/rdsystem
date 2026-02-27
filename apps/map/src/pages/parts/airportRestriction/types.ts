/**
 * 空港高さ制限 型定義
 * 要件定義: airport-height-restriction-requirements.md
 */

/** 制限表面の種類（内部識別） */
export type SurfaceType =
  | "landing_strip" // 着陸帯
  | "approach" // 進入表面
  | "extended_approach" // 延長進入表面
  | "transition" // 転移表面
  | "horizontal" // 水平表面
  | "conical" // 円錐表面
  | "outer_horizontal"; // 外側水平表面

/** 表面タイプの表示ラベル */
export const SURFACE_TYPE_LABELS: Record<SurfaceType, string> = {
  landing_strip: "着陸帯",
  approach: "進入表面",
  extended_approach: "延長進入表面",
  transition: "転移表面",
  horizontal: "水平表面",
  conical: "円錐表面",
  outer_horizontal: "外側水平表面",
};

/** 単一空港の高さ制限結果 */
export interface AirportRestrictionItem {
  /** 空港ID */
  airportId: string;
  /** 表面タイプ */
  surfaceType: SurfaceType;
  /** 制限高（m）。着陸帯の場合は 0 */
  heightM: number;
}

/** 空港高さ制限の照会結果 */
export interface AirportRestrictionResult {
  /** 制限表面内に該当する場合の結果リスト。制限高の低い順。空の場合は制限表面外 */
  items: AirportRestrictionItem[];
  /** 照会エラーが発生した場合 true */
  error?: boolean;
}

/** 空港メタ情報 */
export interface AirportMeta {
  /** 空港ID（内部識別用） */
  id: string;
  /** 空港名（表示用。例: 羽田空港） */
  name: string;
  /** 正式名称（例: 東京国際空港（羽田空港）） */
  displayName: string;
  /** 高さ回答システムのURL */
  officialUrl: string;
}
