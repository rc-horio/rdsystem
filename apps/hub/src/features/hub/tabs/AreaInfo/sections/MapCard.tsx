// features/hub/tabs/AreaInfo/sections/MapCard.tsx
import { SectionTitle } from "@/components";
import { useEffect, useState, useMemo } from "react";
import { ButtonRed } from "@/components/atoms/buttons/RedButton";
import clsx from "clsx";

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

type Props = {
  areaName?: string | null;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
};

export function MapCard({ areaName, projectUuid, scheduleUuid }: Props) {
  const fromEnv = import.meta.env.VITE_MAP_BASE_URL as string | undefined;
  const [areaUuid, setAreaUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const src = useMemo(() => {
    try {
      const u = new URL(base);

      // 埋め込みモードは常に指定
      u.searchParams.set("mode", "embed");

      if (areaName) {
        u.searchParams.set("areaName", areaName);
      }

      // ★ 案件・スケジュールもクエリに載せる
      if (projectUuid) {
        u.searchParams.set("projectUuid", projectUuid);
      }
      if (scheduleUuid) {
        u.searchParams.set("scheduleUuid", scheduleUuid);
      }

      return u.toString();
    } catch {
      return base;
    }
  }, [base, areaName, projectUuid, scheduleUuid]);

  // areas.json から area_uuid を取得
  useEffect(() => {
    if (!areaName) {
      setAreaUuid(null);
      return;
    }

    const fetchAreaUuid = async () => {
      setLoading(true);
      try {
        const S3_BASE =
          "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/";
        const res = await fetch(S3_BASE + "areas.json");
        if (!res.ok) throw new Error("areas.json fetch failed");

        const areas = await res.json();
        const found = areas.find((a: any) => a.areaName === areaName);
        setAreaUuid(found?.uuid || null);
      } catch (e) {
        console.error("Failed to fetch areaUuid:", e);
        setAreaUuid(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAreaUuid();
  }, [areaName]);

  const handleOpenMap = () => {
    const { protocol, hostname } = window.location;
    const isLocalLike =
      hostname === "localhost" || hostname.startsWith("192.168.");

    const baseUrl = isLocalLike
      ? `${protocol}//${hostname}:5175`
      : `${protocol}//${hostname}/map`;

    const params = new URLSearchParams();

    if (areaUuid) params.set("areaUuid", areaUuid);
    if (projectUuid) params.set("projectUuid", projectUuid);
    if (scheduleUuid) params.set("scheduleUuid", scheduleUuid);

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-0">
      {/* タイトル行（左：飛行エリア / 右：RD Mapで確認） */}
      <div className="flex items-center justify-between">
        <SectionTitle title="飛行エリア" />

        <ButtonRed type="button" onClick={handleOpenMap} disabled={loading}>
          {loading ? "読込中..." : "RD Mapで確認"}
        </ButtonRed>
      </div>
      <div className="mt-4 h-[520px] w-full overflow-hidden">
        <iframe
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
