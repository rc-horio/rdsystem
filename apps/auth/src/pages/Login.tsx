// apps/auth/src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandHeader } from "@/components";
import { signInWithRedirect, fetchAuthSession } from "aws-amplify/auth";

const STAGING_TO_PRODUCTION_URL = String(
  import.meta.env.VITE_STAGING_TO_PRODUCTION_URL || "",
).trim();

export default function Login() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showStagingNotice, setShowStagingNotice] = useState(
    () => STAGING_TO_PRODUCTION_URL.length > 0,
  );

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
      <div className="md:hidden min-h-dvh bg-linear-to-br from-slate-950 to-slate-900 pt-safe pb-safe px-safe">
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
      <div className="hidden md:block min-h-screen bg-linear-to-br from-slate-950 to-slate-900">
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

      {showStagingNotice && STAGING_TO_PRODUCTION_URL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="staging-notice-desc"
            className="relative w-[min(92vw,28rem)] rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-6 pt-10"
          >
            <button
              type="button"
              onClick={() => setShowStagingNotice(false)}
              className="absolute top-2 right-2 grid place-items-center size-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <p
              id="staging-notice-desc"
              className="text-slate-300 text-center text-sm leading-relaxed"
            >
              本番環境へ移行しました。
              <a
                href={STAGING_TO_PRODUCTION_URL}
                className="text-red-400 hover:text-red-300 underline underline-offset-2 font-medium"
              >
                こちら
              </a>
              からお進みください。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
