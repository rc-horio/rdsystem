/**
 * マップアプリ用エラーメッセージ
 * 改善方針: docs/error-messages-improvement-plan.md
 */

/** 一時的な障害 */
export const SAVE_TIMEOUT =
  "保存ができませんでした。しばらく時間をおいて、もう一度お試しください。";

/** システムエラー（担当者案内付き・エラーコード付き） */
export function systemError(code: string, detail: string): string {
  return `保存ができませんでした。\n担当者にお問い合わせください。\n（${code}: ${detail}）`;
}

/** プロジェクト一覧（index.json）保存失敗 */
export const E001_PROJECT_INDEX = "E001";

/** エリア一覧（areas.json）保存失敗 */
export const E002_AREAS_LIST = "E002";

/** 保存処理中にエラー */
export const E003_SAVE_PROCESS = "E003";

/** 新規エリア保存失敗（S3/CORS） */
export const E004_NEW_AREA_S3 = "E004";

/** エリアIDが取得できません（データ不整合） */
export const E005_AREA_UUID = "E005";
