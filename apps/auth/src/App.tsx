// apps/auth/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Select from "./pages/SelectProject";
import AuthCallback from "./routes/AuthCallback";
import { RequireAuth } from "./components/RequireAuth";
import React from "react";

export default function App() {
  return (
    <Routes>
      <Route index element={<Login />} />
      <Route path="login" element={<Login />} />
      <Route path="callback" element={<AuthCallback />} />

      {/* 認証が必要なページ群 */}
      <Route
        path="select"
        element={
          <RequireAuth>
            <Select />
          </RequireAuth>
        }
      />

      {/* フォールバック */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
