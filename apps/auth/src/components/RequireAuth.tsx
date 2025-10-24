// apps/auth/src/components/RequireAuth.tsx
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAuthSession();
        setOk(!!s?.tokens?.idToken);
      } catch {
        setOk(false);
      }
    })();
  }, []);
  if (ok === null) return null;
  return ok ? <>{children}</> : <Navigate to="/" replace />;
}
