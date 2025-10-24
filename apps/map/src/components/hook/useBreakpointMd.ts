// src/components/useBreakpointMd.ts
import { useEffect, useState } from "react";

// mdブレークポイント（Tailwindのmd=768pxに合わせる）
const QUERY = "(min-width: 768px)";

/** md未満なら true（=モバイル）、md以上なら false（=PC） */
export function useBreakpointMd(): boolean {
    const get = () => {
        if (typeof window === "undefined" || !("matchMedia" in window)) return true; // SSR等はモバイル扱い
        return !window.matchMedia(QUERY).matches;
    };

    const [isMobile, setIsMobile] = useState<boolean>(get);

    useEffect(() => {
        if (typeof window === "undefined" || !("matchMedia" in window)) return;
        const mql = window.matchMedia(QUERY);
        const onChange = () => setIsMobile(!mql.matches);

        // Safari対策（古いAPIにも対応）
        if ("addEventListener" in mql) mql.addEventListener("change", onChange);
        else (mql as any).addListener(onChange);

        return () => {
            if ("removeEventListener" in mql) mql.removeEventListener("change", onChange);
            else (mql as any).removeListener(onChange);
        };
    }, []);

    return isMobile;
}
