// apps/map/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Amplify } from "aws-amplify";
import AuthCallback from "./routes/AuthCallback";
import { RequireAuth } from "./components/RequireAuth";

const BASE = import.meta.env.BASE_URL; // 例: '/map/'
const ORIGIN = window.location.origin;
const DEV_REDIRECT_IN = `${ORIGIN}${BASE}callback`;
const PROD_REDIRECT_IN =
  import.meta.env.VITE_REDIRECT_SIGNIN || DEV_REDIRECT_IN;
const AUTH_BASE =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5173/auth/";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        oauth: {
          // 'https://' なし・末尾 '/' なし
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [DEV_REDIRECT_IN, PROD_REDIRECT_IN],
          redirectSignOut: [AUTH_BASE],
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
