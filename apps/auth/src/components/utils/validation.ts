// src/utils/validation.ts
export function validateProjectId(id: string, usedIds: string[] = []): string {
    if (!id.trim()) return "IDを入力してください";

    // 英数字・ハイフン・アンダーバーのみ許可
    if (!/^[a-z0-9_-]{7,60}$/.test(id))
        return "7〜60文字の半角英数字のみ使用できます";

    // 先頭6桁が数字であることをチェック（例: 250101project）
    const match = id.match(/^(\d{6})([a-z0-9_-]+)$/);
    if (!match) {
        return "「6桁の数字＋英字など」入力してください（例: 250101project）";
    }

    // 日付の妥当性チェック（yyMMdd）
    const yy = parseInt(match[1].slice(0, 2), 10);
    const mm = parseInt(match[1].slice(2, 4), 10);
    const dd = parseInt(match[1].slice(4, 6), 10);
    const fullYear = 2000 + yy;
    const date = new Date(fullYear, mm - 1, dd);
    const isValidDate =
        date.getFullYear() === fullYear &&
        date.getMonth() === mm - 1 &&
        date.getDate() === dd;

    if (!isValidDate) {
        return `日付が正しくありません（20${match[1].slice(
            0,
            2
        )}/${match[1].slice(2, 4)}/${match[1].slice(4, 6)} は存在しません）`;
    }

    // 重複チェック（必要に応じて）
    if (usedIds.includes(id.toLowerCase())) {
        return "このIDは既に存在します";
    }

    return "";
}
