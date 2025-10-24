// features/hub/tabs/AreaInfo/sections/MapCard.tsx
import { SectionTitle } from "@/components";

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

export function MapCard() {
  const fromEnv = import.meta.env.VITE_MAP_BASE_URL as string | undefined;
  let src = normalizeMapUrl(fromEnv);
  // 環境変数が未設定のときのフォールバック
  if (!src) {
    if (import.meta.env.DEV) {
      // 開発中: 5174→5175 に置換して /map/ へ
      src = normalizeMapUrl(
        `${window.location.origin.replace(":5174", ":5175")}/map/`
      );
    } else {
      // 本番: CloudFront の /map/
      src = normalizeMapUrl("https://d3jv4hxjgqnm4c.cloudfront.net/map/");
    }
  }

  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア（マップ）" />
      <div className="mt-4 h-[420px] w-full overflow-hidden">
        <iframe
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
