// apps/hub/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HubPage from "./pages/HubPage/HubPage";
import AuthCallback from "./routes/AuthCallback";
import { RequireAuth } from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      {/* Hosted UI から戻る先（/hub/auth/callback） */}
      <Route path="auth/callback" element={<AuthCallback />} />

      {/* /hub/ に来たときの既定画面（要ログイン） */}
      <Route
        index
        element={
          <RequireAuth>
            <HubPage />
          </RequireAuth>
        }
      />

      {/* /hub/:id も要ログイン */}
      <Route
        path=":id"
        element={
          <RequireAuth>
            <HubPage />
          </RequireAuth>
        }
      />

      {/* フォールバック：/hub/ に戻す（= 現在地） */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
