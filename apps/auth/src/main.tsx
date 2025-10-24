// apps/auth/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Amplify } from "aws-amplify";
import Login from "./pages/Login";
import AuthCallback from "./routes/AuthCallback";
import SelectProject from "./pages/SelectProject";
import { RequireAuth } from "./components/RequireAuth";

const ORIGIN = window.location.origin;
const BASEPATH = import.meta.env.BASE_URL; // 例: '/auth/'
const DEV_REDIRECT_SIGN_IN = `${ORIGIN}${BASEPATH}callback`;
const DEV_REDIRECT_SIGN_OUT = `${ORIGIN}${BASEPATH}`;

// 本番用（必要なら .env.production に設定）
const PROD_REDIRECT_SIGN_IN =
  import.meta.env.VITE_REDIRECT_SIGNIN || DEV_REDIRECT_SIGN_IN;
const PROD_REDIRECT_SIGN_OUT =
  import.meta.env.VITE_REDIRECT_SIGNOUT || DEV_REDIRECT_SIGN_OUT;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["openid", "email", "profile"],
          // ★ コールバック先は /auth/callback（Cognito 側の許可URLにも登録済みであること）
          redirectSignIn: [DEV_REDIRECT_SIGN_IN, PROD_REDIRECT_SIGN_IN],
          // サインアウト後は /auth/ に戻すと分かりやすい（Cognito 側にも登録が必要）
          redirectSignOut: [DEV_REDIRECT_SIGN_OUT, PROD_REDIRECT_SIGN_OUT],
          responseType: "code",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<AuthCallback />} />
        <Route
          path="/select"
          element={
            <RequireAuth>
              <SelectProject />
            </RequireAuth>
          }
        />
      </Routes>
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
