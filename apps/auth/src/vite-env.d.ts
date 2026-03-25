/* =========================
  CSS
   ========================= */
   /// <reference types="vite/client" />
declare module '*.css';

/* =========================
  Vite
   ========================= */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_CATALOG_BASE_URL?: string;
  readonly VITE_CATALOG_WRITE_URL?: string;
  readonly VITE_CATALOG_DELETE_URL?: string;
  readonly VITE_STOCK_BASE_URL?: string;
  /** ストックコンテンツを選択画面から開けるか（インフラ未整備・メンテ時は false） */
  readonly VITE_STOCK_READY?: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_APP_CLIENT_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_SIGNOUT_REDIRECT?: string;
  /** ステージングのみ: ログイン画面で本番への誘導モーダルを表示する遷移先 URL */
  readonly VITE_STAGING_TO_PRODUCTION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
