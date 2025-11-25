// src/pages/parts/constants/events.ts
export const EV_MAP_FOCUS_ONLY = "map:focus-only";

export const EV_SIDEBAR_OPEN = "sidebar:open";
export const EV_SIDEBAR_SET_ACTIVE = "sidebar:set-active";

export const EV_TAKEOFF_REF_CHANGED = "geometry:takeoff-ref-changed";

export const EV_GEOMETRY_RESPOND_DATA = "geometry:respond-data";
export const EV_GEOMETRY_REQUEST_DATA = "geometry:request-data";

export const EV_DETAILBAR_RESPOND_DATA = "detailbar:respond-data";
export const EV_DETAILBAR_SELECT_HISTORY = "detailbar:select-history";
export const EV_DETAILBAR_SELECT_CANDIDATE = "detailbar:select-candidate";
export const EV_DETAILBAR_SELECTED = "side-detailbar:selected";
export const EV_DETAILBAR_SET_METRICS = "detailbar:set-metrics";
export const EV_DETAILBAR_REQUEST_DATA = "detailbar:request-data";
export const EV_DETAILBAR_SET_TITLE = "detailbar:set-title";
export const EV_DETAILBAR_SET_META = "detailbar:set-meta";
export const EV_DETAILBAR_SET_HISTORY = "detailbar:set-history";
export const EV_DETAILBAR_APPLY_METRICS = "detailbar:apply-metrics";

export const EV_PROJECT_MODAL_OPEN = "project:open-modal";
export const EV_PROJECT_MODAL_SUBMIT = "project-modal:submit";

export const ROTATE_HANDLE_GAP_M = 5;

export const SELECT_ZOOM_DESKTOP = 10;
export const SELECT_ZOOM_MOBILE = 13;

export const MIN_ZOOM_DELTA_TO_CHANGE = 0.75;

export const NAME_UNSET = "（名称未設定）";

export const AREA_NAME_NONE = "（エリア名なし）";

export const OPEN_INFO_ON_SELECT = false;

export const MARKERS_HIDE_ZOOM = 16;

export const CLS_DETAILBAR_OPEN = "detailbar-open";

export const S3_BASE =
    "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/";

/** Google Maps 図形/マーカー用の共通レイヤー定義 */
export const Z = {
    OVERLAY: {
        SAFETY: 10,     // 保安エリア
        TAKEOFF: 15,    // 離発着（矩形）
        FLIGHT: 20,     // 飛行（楕円）
        ARROW: 999,     // 参照点→中心の矢印（最前面のオーバーレイ）
    },

    /** マーカー類（編集ハンドル等）のベース。MAX_ZINDEX が無い場合のフォールバック */
    MARKER_BASE_FALLBACK: 999999,

    /** マーカー上で相対的なオフセット（ベースに足すだけ） */
    MARKER_OFFSET: {
        CORNER: 0,          // 角ハンドル
        CORNER_ACTIVE: 2,   // アクティブ角
        REFERENCE: 1,       // 基準点マーカー
        ROTATE: 3,          // 回転ハンドル
        CENTER: 4,          // 楕円中心ハンドル
        RADIUS: 4,          // 楕円半径ハンドル
    },
} as const;

/** Google Maps の MAX_ZINDEX を考慮したマーカーベース値 */
export const markerBase = (gmaps: typeof google.maps) =>
    (gmaps?.Marker?.MAX_ZINDEX ?? Z.MARKER_BASE_FALLBACK);

export const PREFECTURES: string[] = ["未選択", "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
    "その他"
]

// ===== デフォルト一式（適度な大きさ・配置） =====
export const DEFAULTS = {
    flight: { rx: 150, ry: 100, rot: 0, altitude: 120, buffer: 50 },
    takeoff: { w: 100, h: 20, rot: 180, offsetX: 0, offsetY: -180 },
    audience: { w: 100, h: 20, rot: 0, offsetX: 0, offsetY: 200 },
} as const;