// apps/hub/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { RequireAuth } from "./components/RequireAuth";

const BASE = import.meta.env.BASE_URL; // '/hub/'
const ORIGIN = window.location.origin;

// TODO: ローカルサーバー起動用と本番デプロイ用のコードを分ける
// ★--------ローカルサーバー起動用-------------  
// .env.localのVITE_DISABLE_AUTH=trueなら認証を外す
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

// ★--------本番デプロイ用-------------
// 認証の戻り先は共通で /callback、ログアウト後は /login
const REDIRECT_SIGN_IN = `${ORIGIN}/callback`;
const REDIRECT_SIGN_OUT = `${ORIGIN}/login`;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN, // 'https://'なしOK
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [REDIRECT_SIGN_IN],
          redirectSignOut: [REDIRECT_SIGN_OUT],
          responseType: "code",
        },
      },
    },
  },
});

// ★--------ローカルサーバー起動用-------------  
const appElement = DISABLE_AUTH ? (
  // 認証なし（ローカル暫定）
  <App />
) : (
  // 認証あり（通常）
  <RequireAuth>
    <App />
  </RequireAuth>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE}>
      <Routes>
        {/* hub内の /callback は使わない。来たら hubのルートへ戻す */}
        <Route path="/callback" element={<Navigate to="/" replace />} />

        <Route
          path="/*"
          element={appElement}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
