import { useEffect, useState } from "react";

// Tailwindのmd(768px)に合わせる
export function useBreakpointMd(): boolean {
  const get = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  const [isMobile, setIsMobile] = useState<boolean>(get());
  useEffect(() => {
    const onResize = () => setIsMobile(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}
