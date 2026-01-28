// apps/hub/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HubPage from "./pages/HubPage/HubPage";
import { RequireAuth } from "./components/RequireAuth";

/**
 * VITE_DISABLE_AUTH=true のときだけ認証を無効化する（ローカル暫定用）
 * - true  : ローカルサーバー用（認証を外して MapPage をそのまま表示
 * - false : 本番用
 */
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

export default function App() {
  const element = DISABLE_AUTH
    ? (
      <HubPage />
    )
    : (
      <RequireAuth>
        <HubPage />
      </RequireAuth>
    );

  return (
    <Routes>
      {/* /hub/ に来たときの既定画面（要ログイン） */}
      <Route
        index
        element={
          element
        }
      />

      {/* /hub/:id も要ログイン */}
      <Route
        path=":id"
        element={element}
      />

      {/* フォールバック：/hub/ に戻す（= 現在地） */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
