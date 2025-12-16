// src/features/hub/tabs/Resource/peopleOptions.ts
export type SelectOption = { value: string; label: string };
/**
 * 氏名プルダウン（CJDS/オペレーション/プロデュースのみ）
 * ※案件によって役割は変動するので「氏名」と「役割」はセットにしない
 */
export const NAME_OPTIONS: SelectOption[] = [
    // CJDSチーム
    { value: "細井 勇吾", label: "細井 勇吾" },
    { value: "中島 大輔", label: "中島 大輔" },

    // オペレーションチーム
    { value: "山口 遼", label: "山口 遼" },
    { value: "永野 勝俊", label: "永野 勝俊" },
    { value: "照屋 珠嵐", label: "照屋 珠嵐" },
    { value: "中村 友星", label: "中村 友星" },
    { value: "中村 祐晟", label: "中村 祐晟" },
    { value: "本多 一葉", label: "本多 一葉" },
    { value: "冨木 優希", label: "冨木 優希" },
    { value: "八住 萌季", label: "八住 萌季" },

    // プロデュースチーム
    { value: "相場 和大", label: "相場 和大" },
    { value: "後藤 俊輝", label: "後藤 俊輝" },
    { value: "三浦 真二郎", label: "三浦 真二郎" },
    { value: "増田 実", label: "増田 実" },
    { value: "高橋 昂希", label: "高橋 昂希" },
    { value: "赤木 健司", label: "赤木 健司" },
    { value: "安藤 瑞基", label: "安藤 瑞基" },
    { value: "坂田 凜太郎", label: "坂田 凜太郎" },
    { value: "香崎 丈治", label: "香崎 丈治" },
    { value: "屋敷 竜馬", label: "屋敷 竜馬" },
    { value: "鈴木 香里", label: "鈴木 香里" },
    { value: "附田 良徳", label: "附田 良徳" },
    { value: "岩崎 郁也", label: "岩崎 郁也" },
    { value: "秋山 涼子", label: "秋山 涼子" },
    { value: "三田村 崇之", label: "三田村 崇之" },
    { value: "伊場 大輔", label: "伊場 大輔" },
    { value: "水野 明子", label: "水野 明子" },
];

/**
 * セクション別 役割プルダウン
 * ※「ベテランバイト」はプルダウンにしない（入力）
 */
export type PeopleGroupName = "プロデューサー" | "ディレクター" | "オペレーター";
export const ROLE_OPTIONS_BY_GROUP: Record<PeopleGroupName, SelectOption[]> = {
    プロデューサー: [
        { value: "メイン", label: "メイン" },
        { value: "サブ", label: "サブ" },
    ],
    ディレクター: [
        { value: "メイン", label: "メイン" },
        { value: "サブ", label: "サブ" },
        { value: "制作", label: "制作" },
        { value: "現場", label: "現場" },
    ],
    オペレーター: [
        { value: "メイン", label: "メイン" },
        { value: "サブ", label: "サブ" },
        { value: "現場監督", label: "現場監督" },
        { value: "モジュール", label: "モジュール" },
    ],
};

export const getRoleOptions = (groupName: string) =>
    ROLE_OPTIONS_BY_GROUP[groupName as PeopleGroupName] ?? [];