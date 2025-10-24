// apps/auth/src/routes/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithRedirect } from "aws-amplify/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        await signInWithRedirect(); // ★これが必須
        navigate("/select", { replace: true });
      } catch (e) {
        console.error("handleSignIn error", e);
        navigate("/login", { replace: true }); // 失敗時はログインへ
      }
    })();
  }, [navigate]);
  return null;
}
