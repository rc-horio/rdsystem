/**
 * ストックアプリ用エラーメッセージ
 * 改善方針: docs/error-messages-improvement-plan.md
 */

/** 一時的な障害 */
export const PDF_EXPORT_TIMEOUT =
  "PDFの生成ができませんでした。しばらく時間をおいて、もう一度お試しください。";

/** システムエラー（担当者案内付き・エラーコード付き） */
export function systemError(code: string, detail: string): string {
  return `PDFの生成ができませんでした。\n担当者にお問い合わせください。\n（${code}: ${detail}）`;
}

/** PDF生成失敗 */
export const E301_PDF_EXPORT = "E301";
