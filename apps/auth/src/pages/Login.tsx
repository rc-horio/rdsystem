// apps/auth/src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandHeader } from "@/components";
import { signInWithRedirect, fetchAuthSession } from "aws-amplify/auth";

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAuthSession();
        if (s?.tokens?.idToken) navigate("/select", { replace: true });
      } catch {}
    })();
  }, [navigate]);

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 既にログイン済みならボタン押下時も素直に /select へ
      const s = await fetchAuthSession().catch(() => null);
      if (s?.tokens?.idToken) {
        navigate("/select", { replace: true });
        return;
      }
      await signInWithRedirect({ provider: "Google" as const });
    } catch (e: any) {
      if (e?.name === "UserAlreadyAuthenticatedException") {
        // 二重サインインを避けてダッシュボードへ
        navigate("/select", { replace: true });
      } else {
        console.error(e);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ===== SP（モバイル）：ページ全体スクロール ===== */}
      <div className="md:hidden min-h-dvh bg-gradient-to-br from-slate-950 to-slate-900 pt-safe pb-safe px-safe">
        <BrandHeader />

        <div className="px-4 pb-8 grid place-items-center">
          {/* コンテンツカード（入力欄は廃止） */}
          <div className="w-full max-w-md space-y-6 p-6 bg-transparent">
            {/* タイトル */}
            <div
              className="flex items-center justify-center text-white font-semibold tracking-wide select-none caret-transparent"
              contentEditable={false}
            >
              <span className="text-2xl flex-1 text-center">RD System</span>
            </div>

            <p
              className="text-center text-sm text-slate-300 select-none caret-transparent"
              contentEditable={false}
            >
              Sign in to continue
            </p>

            {/* 余白でバランス調整（かつ将来の拡張余地） */}
            <div className="h-2" />

            {/* Google ログインボタンのみ配置 */}
            <div className="flex justify-center">
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-10/12 max-w-80 mx-auto rounded-lg bg-red-600 py-3 font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition select-none caret-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Login with Google
              </button>
            </div>

            {/* 下側の余白で視覚バランスを最適化 */}
            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* ===== PC（md以上）：ロゴは BrandHeader で固定表示 ===== */}
      <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        {/* ロゴ位置を全ページで統一 */}
        <BrandHeader />

        {/* 中央カード（現行レイアウト維持、入力欄なし） */}
        <div className="px-4 pb-12 grid place-items-center">
          <div className="w-full max-w-md space-y-6 p-10">
            {/* タイトル */}
            <div
              className="flex items-center justify-center text-white font-semibold tracking-wide select-none caret-transparent"
              contentEditable={false}
            >
              <span className="text-3xl flex-1 text-center">RD System</span>
            </div>

            <p
              className="text-center text-sm text-slate-300 select-none caret-transparent"
              contentEditable={false}
            >
              Sign in to continue
            </p>

            {/* 余白でバランス調整 */}
            <div className="h-4" />

            {/* Google ログインボタンのみ配置 */}
            <div className="flex justify-center">
              <button
                onClick={handleGoogle}
                className="w-full md:w-2/3 rounded-lg bg-red-600 py-3 font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition select-none caret-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Login with Google
              </button>
            </div>

            <div className="h-6" />
          </div>
        </div>
      </div>
    </>
  );
}
