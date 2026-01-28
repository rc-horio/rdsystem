// apps/map/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import MapPage from "./pages/MapPage";
import { RequireAuth } from "./components/RequireAuth";

/**
 * VITE_DISABLE_AUTH=true のときだけ認証を無効化する（ローカル暫定用）
 * - true  : ローカルサーバー用（認証を外して MapPage をそのまま表示
 * - false : 本番用
 */
const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

export default function App() {
  // TODO: ローカルサーバー起動用と本番デプロイ用のコードを分ける
  // ★--------ローカルサーバー起動用-------------
  const element = DISABLE_AUTH
    ? (
      // 開発用：認証なし（暫定）Mapをすぐ表示したいとき
      <MapPage />
    )
    : (
      // 本場用：認証あり（通常）
      <RequireAuth>
        <MapPage />
      </RequireAuth>
    );

  // ★--------本番デプロイ用-------------
  return (
    <Routes>
      <Route index element={element} />

      {/* どのURLで来ても /map/ に寄せる */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
