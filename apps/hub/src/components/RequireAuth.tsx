// apps/hub/src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { signInWithRedirect, fetchAuthSession } from "aws-amplify/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
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
        await signInWithRedirect({ provider: "Google" as const });
      } catch {
        setOk(false);
      }
    })();
  }, []);
  if (ok !== true) return null;
  return <>{children}</>;
}
