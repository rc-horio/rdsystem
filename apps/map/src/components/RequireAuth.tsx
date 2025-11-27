// apps/map/src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { signInWithRedirect, fetchAuthSession } from "aws-amplify/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  //  ↓↓★Macへインターネット共有時はこちらのコードをコメントアウト
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAuthSession();
        if (s?.tokens?.idToken) {
          setOk(true);
          return;
        }
      } catch {}
      try {
        sessionStorage.setItem("postLoginUrl", location.href);
        await signInWithRedirect({ provider: "Google" as const }); // 組み込みGoogle
      } catch {
        setOk(false);
      }
    })();
  }, []);
  if (ok !== true) return null;
  //  ↑↑★Macへインターネット共有時はこちらのコードをコメントアウト

  return <>{children}</>;
}
