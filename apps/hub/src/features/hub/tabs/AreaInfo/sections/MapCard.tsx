// features/hub/tabs/AreaInfo/sections/MapCard.tsx
import { SectionTitle } from "@/components";
import { useMemo } from "react";

// マップURLを正規化
const normalizeMapUrl = (base?: string) => {
  const raw = (base || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw, window.location.origin);
    // パスが /map または /map/ 以外なら /map/ を付ける
    if (!/\/map\/?$/.test(u.pathname)) {
      u.pathname = (u.pathname.replace(/\/+$/, "") || "") + "/map/";
    } else {
      // /map or /map/ は /map/ に正規化
      u.pathname = "/map/";
    }
    return u.toString();
  } catch {
    // 相対URL等が来たら素直に返す（必要に応じて /map/ を足す）
    return raw.endsWith("/") ? `${raw}map/` : `${raw}/map/`;
  }
};

// props に areaName を追加
type MapCardProps = {
  areaName?: string | null;
};

export function MapCard({ areaName }: MapCardProps) {
  const fromEnv = import.meta.env.VITE_MAP_BASE_URL as string | undefined;

  // base の計算部分はそのまま
  const base = useMemo(() => {
    let src = normalizeMapUrl(fromEnv);
    if (!src) {
      if (import.meta.env.DEV) {
        src = normalizeMapUrl(
          `${window.location.origin.replace(":5174", ":5175")}/map/`
        );
      } else {
        src = normalizeMapUrl("https://d3jv4hxjgqnm4c.cloudfront.net/map/");
      }
    }
    return src;
  }, [fromEnv]);

  // areaName をクエリに付与した URL を作る
  const src = useMemo(() => {
    if (!areaName) return base;

    try {
      const u = new URL(base);
      u.searchParams.set("areaName", areaName);
      return u.toString();
    } catch {
      return base;
    }
  }, [base, areaName]);

  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア（マップ）" />
      <div className="mt-4 h-[420px] w-full overflow-hidden">
        <iframe
          // エリアが変わるたびに iframe をリロードさせたいなら key を付ける
          key={src}
          src={src}
          width="100%"
          height="100%"
          className="w-full h-full"
          style={{ border: "none" }}
          title="離発着エリア地図"
          loading="lazy"
        />
      </div>
    </div>
  );
}
