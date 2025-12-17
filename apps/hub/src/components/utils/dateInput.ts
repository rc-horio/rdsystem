// src/components/utils/dateInput.ts
export function formatAsYmdInput(raw: string): string {
    // 数字以外は捨てる（ユーザーがハイフンを打ってもOKだが、最終的には数字ベースで整形）
    const digits = raw.replace(/\D/g, "").slice(0, 8); // YYYYMMDD まで

    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);

    // 途中入力を邪魔しない：存在する分だけ連結
    if (digits.length <= 4) return y;
    if (digits.length <= 6) return `${y}-${m}`;
    return `${y}-${m}-${d}`;
}

// 余裕があれば、確定時（blur等）にだけ妥当性チェックしたい場合
export function isValidYmd(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [Y, M, D] = value.split("-").map((v) => parseInt(v, 10));
    const dt = new Date(Y, M - 1, D);
    return dt.getFullYear() === Y && dt.getMonth() === M - 1 && dt.getDate() === D;
}
