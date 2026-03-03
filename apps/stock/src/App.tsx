// apps/stock/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import StockPage from "./pages/StockPage";
import { RequireAuth } from "./components/RequireAuth";

const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH === "true";

export default function App() {
  const element = DISABLE_AUTH ? (
    <StockPage />
  ) : (
    <RequireAuth>
      <StockPage />
    </RequireAuth>
  );

  return (
    <Routes>
      <Route index element={element} />

      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
