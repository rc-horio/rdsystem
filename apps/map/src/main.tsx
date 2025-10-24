// apps/map/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import AuthCallback from "./routes/AuthCallback";
import { RequireAuth } from "./components/RequireAuth";

const BASE = import.meta.env.BASE_URL;
const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5173/auth/";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN, // 'https://'なし・末尾'/'なし
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [
            `${window.location.origin}${import.meta.env.BASE_URL}callback`,
          ], // /hub/callback は維持
          redirectSignOut: [AUTH_BASE], // ★ ここを /auth/ 固定に
          responseType: "code",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route path="/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
