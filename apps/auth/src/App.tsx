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
      {/* / は /login に統一 */}
      <Route index element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<AuthCallback />} />

      {/* 認証が必要なページ群 */}
      <Route
        path="/select"
        element={
          <RequireAuth>
            <Select />
          </RequireAuth>
        }
      />

      {/* フォールバックは /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
