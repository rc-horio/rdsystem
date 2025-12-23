// features/hub/tabs/Operation/utils/format.ts

/**
 * リファクタ前の normalizeInput と同等の挙動 + カンマ区切り対応:
 * - 全角英数字を半角へ
 * - カンマ(半角/全角)をスペースへ
 * - 数字とスペース以外を除去
 * - 連続スペースを 1 個に
 * - 先頭末尾の空白は削らない（←重要）
 */
export const normalizeInput = (value: string): string => {
  return value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    // カンマ区切りを許容（半角 , と 全角 ，）
    .replace(/[,\uFF0C]/g, " ")
    .replace(/[^0-9\s]/g, "")
    .replace(/\s+/g, " ");
};

/**
 * リファクタ前の parseNums と同等の挙動 + カンマ区切り対応:
 * - 空白/カンマ区切りで数値配列へ
 * - 空トークン除外
 * - NaN 除外
 */
export const parseNums = (str: string): number[] =>
  str
    .trim()
    .split(/[,\s]+/) // カンマ or 空白で分割
    .filter((token) => token !== "")
    .map(Number)
    .filter((n) => !Number.isNaN(n));
