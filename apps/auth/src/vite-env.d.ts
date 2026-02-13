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
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_APP_CLIENT_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_SIGNOUT_REDIRECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
