// apps/auth/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";

const ORIGIN = window.location.origin;
const BASEPATH = import.meta.env.BASE_URL; // 例: '/auth/'

// サインインコールバック: 常に BASEPATH ベース
const REDIRECT_SIGN_IN = `${ORIGIN}${BASEPATH}callback`;

// サインアウト後: 本番・ステージングは VITE_SIGNOUT_REDIRECT=/login で統一、ローカルは BASEPATH+login
const signOutPath =
  import.meta.env.VITE_SIGNOUT_REDIRECT || `${BASEPATH}login`;
const REDIRECT_SIGN_OUT = `${ORIGIN}${signOutPath.startsWith("/") ? signOutPath : "/" + signOutPath}`;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [REDIRECT_SIGN_IN],
          redirectSignOut: [REDIRECT_SIGN_OUT],
          responseType: "code",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// （PWAデバッグ用はそのまま）
const params = new URLSearchParams(location.search);
const debugStandalone =
  params.get("pwa") === "1" || localStorage.getItem("debugStandalone") === "1";
const realStandalone =
  window.matchMedia?.("(display-mode: standalone)")?.matches ||
  (window as any).navigator?.standalone === true;
if (debugStandalone && !realStandalone) {
  document.documentElement.classList.add("debug-standalone");
}
