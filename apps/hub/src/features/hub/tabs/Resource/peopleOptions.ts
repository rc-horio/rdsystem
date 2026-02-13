// src/features/hub/tabs/Resource/peopleOptions.ts
export type SelectOption = { value: string; label: string };
/**
 * 氏名プルダウン（CJDS/オペレーション/プロデュースのみ）
 * ※案件によって役割は変動するので「氏名」と「役割」はセットにしない
 */
export const NAME_OPTIONS: SelectOption[] = [
    { value: "佐々木 孔明", label: "佐々木 孔明" },
    { value: "蛇谷 光生", label: "蛇谷 光生" },
    { value: "山本 和真", label: "山本 和真" },
    { value: "相場 和大", label: "相場 和大" },
    { value: "後藤 俊輝", label: "後藤 俊輝" },
    { value: "細井 勇吾", label: "細井 勇吾" },
    { value: "永野 勝俊", label: "永野 勝俊" },
    { value: "金井 麻美", label: "金井 麻美" },
    { value: "三浦 真二郎", label: "三浦 真二郎" },
    { value: "増田 実", label: "増田 実" },
    { value: "汪 建英", label: "汪 建英" },
    { value: "丹内 敏祐", label: "丹内 敏祐" },
    { value: "高橋 昂希", label: "高橋 昂希" },
    { value: "席 偉寧", label: "席 偉寧" },
    { value: "阿部 辰徳", label: "阿部 辰徳" },
    { value: "赤木 健司", label: "赤木 健司" },
    { value: "安藤 瑞基", label: "安藤 瑞基" },
    { value: "Yamauti Sakae", label: "Yamauti Sakae" },
    { value: "坂田 凜太郎", label: "坂田 凜太郎" },
    { value: "高畑 一那", label: "高畑 一那" },
    { value: "照屋 珠嵐", label: "照屋 珠嵐" },
    { value: "中島 大輔", label: "中島 大輔" },
    { value: "中村 友星", label: "中村 友星" },
    { value: "玉越 有美子", label: "玉越 有美子" },
    { value: "堀尾 真梨子", label: "堀尾 真梨子" },
    { value: "吉江 考史", label: "吉江 考史" },
    { value: "天野 留菜", label: "天野 留菜" },
    { value: "藤 舞衣子", label: "藤 舞衣子" },
    { value: "北川 徹也", label: "北川 徹也" },
    { value: "石橋 勇人", label: "石橋 勇人" },
    { value: "香崎 丈治", label: "香崎 丈治" },
    { value: "鈴木 しょう子", label: "鈴木 しょう子" },
    { value: "屋敷 竜馬", label: "屋敷 竜馬" },
    { value: "堀部 文雄", label: "堀部 文雄" },
    { value: "馬 明", label: "馬 明" },
    { value: "鈴木 香里", label: "鈴木 香里" },
    { value: "附田 良徳", label: "附田 良徳" },
    { value: "中村 祐晟", label: "中村 祐晟" },
    { value: "岩崎 郁也", label: "岩崎 郁也" },
    { value: "秋山 涼子", label: "秋山 涼子" },
    { value: "蔡 䴥", label: "蔡 䴥" },
    { value: "齋藤 慎也", label: "齋藤 慎也" },
    { value: "三田村 崇之", label: "三田村 崇之" },
    { value: "伊場 大輔", label: "伊場 大輔" },
    { value: "根本 悠介", label: "根本 悠介" },
    { value: "本多 一葉", label: "本多 一葉" },
    { value: "小田 あゆみ", label: "小田 あゆみ" },
    { value: "小泉 雄太郎", label: "小泉 雄太郎" },
    { value: "冨木 優希", label: "冨木 優希" },
    { value: "水野 明子", label: "水野 明子" },
    { value: "八住 萌季", label: "八住 萌季" },
    { value: "岩水 敬子", label: "岩水 敬子" },
    { value: "坂井 綾子", label: "坂井 綾子" },
    { value: "門馬 恵", label: "門馬 恵" },
    { value: "安藤 望", label: "安藤 望" },
    { value: "藤田 紘成", label: "藤田 紘成" },
    { value: "野口 宏実", label: "野口 宏実" },
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