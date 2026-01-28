// apps/hub/src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAuthSession();
        setOk(!!s?.tokens?.idToken);
        if (s?.tokens?.idToken) return;
      } catch {
        // no-op
      }
      window.location.replace("/login");
    })();
  }, []);

  if (ok !== true) return null;
  return <>{children}</>;
}
