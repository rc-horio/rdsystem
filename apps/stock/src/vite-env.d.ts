/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ローカル開発時: auth のベース（例 http://localhost:5173/auth） */
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_STOCK_ASSETS_BASE_URL?: string;
}
