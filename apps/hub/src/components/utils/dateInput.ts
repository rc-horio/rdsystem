// src/components/utils/dateInput.ts
const ZENKAKU_DIGIT_RE = /[０-９]/g;

// 全角→半角（数字＋よくある記号だけ）
export function normalizeToHalfWidth(raw: string): string {
    return raw
        .replace(ZENKAKU_DIGIT_RE, (ch) =>
            String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
        )
        // 全角/IMEで出がちなハイフン類を統一（必要最低限）
        .replace(/[－ー―−]/g, "-")
        .replace(/[／]/g, "/")
        .trim();
}

export function formatAsYmdInput(raw: string): string {
    // 先に正規化（ここでやるのが一番安全）
    const normalized = normalizeToHalfWidth(raw);

    const digits = normalized.replace(/\D/g, "").slice(0, 8); // YYYYMMDD まで
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);

    if (digits.length <= 4) return y;
    if (digits.length <= 6) return `${y}-${m}`;
    return `${y}-${m}-${d}`;
}
