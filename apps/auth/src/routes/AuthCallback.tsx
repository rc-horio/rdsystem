// apps/auth/src/routes/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        await fetchAuthSession();
        // ログイン後は基本 /selectへリダイレクト
        sessionStorage.removeItem("postLoginUrl");
        nav("/select", { replace: true });
      } catch (e) {
        console.error("AuthCallback error", e);
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);
  return null;
}
