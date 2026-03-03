// apps/stock/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { RequireAuth } from "./components/RequireAuth";

const BASE = import.meta.env.BASE_URL;
const ORIGIN = window.location.origin;

const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

const REDIRECT_SIGN_IN = `${ORIGIN}/callback`;
const REDIRECT_SIGN_OUT = `${ORIGIN}/login`;

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

const appElement = DISABLE_AUTH ? (
  <App />
) : (
  <RequireAuth>
    <App />
  </RequireAuth>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route path="/callback" element={<Navigate to="/" replace />} />

        <Route path="/*" element={appElement} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
