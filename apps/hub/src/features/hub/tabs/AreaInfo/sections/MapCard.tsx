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
  geometry?: any | null;
};

// 離発着エリアの矩形をパラメータに変換
const toTakeoffRectParam = (coords?: [number, number][]) => {
  if (!Array.isArray(coords) || coords.length !== 4) return "";
  // coords は [lng,lat] の順。Map 側もその前提で parse しているのでそのまま
  return coords.map(([lng, lat]) => `${lng},${lat}`).join(";");
};

export function MapCard({ areaName, projectUuid, scheduleUuid, geometry }: Props) {
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
      if (areaName) u.searchParams.set("areaName", areaName);
      if (projectUuid) u.searchParams.set("projectUuid", projectUuid);
      if (scheduleUuid) u.searchParams.set("scheduleUuid", scheduleUuid);

      const takeoffCoords = geometry?.takeoffArea?.coordinates as [number, number][] | undefined;
      const takeoffRef = geometry?.takeoffArea?.referencePointIndex;

      const rectStr = toTakeoffRectParam(takeoffCoords);
      if (rectStr) u.searchParams.set("takeoffRect", rectStr);
      if (Number.isFinite(takeoffRef)) u.searchParams.set("takeoffRef", String(takeoffRef));

      return u.toString();
    } catch {
      return base;
    }
  }, [base, areaName, projectUuid, scheduleUuid, geometry]);

  // areas.json から area_uuid を取得
  useEffect(() => {
    if (!areaName) {
      setAreaUuid(null);
      return;
    }

    const fetchAreaUuid = async () => {
      setLoading(true);
      try {
        // 開発用のCatalogのベースURL
        // const S3_BASE =
        //   "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/";

        // 本番用のCatalogのベースURL
        const S3_BASE =
          String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(
            /\/+$/,
            ""
          ) + "/";
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
    // ローカル開発の場合
    const { protocol, hostname } = window.location;
    // ローカル開発の場合はlocalhostまたは192.168.x.xの場合
    const isLocalLike =
      hostname === "localhost" || hostname.startsWith("192.168.");

    // パラメータを設定
    const params = new URLSearchParams();
    // エリアUUIDをパラメータに設定
    if (areaUuid) params.set("areaUuid", areaUuid);
    // プロジェクトUUIDをパラメータに設定
    if (projectUuid) params.set("projectUuid", projectUuid);
    // スケジュールUUIDをパラメータに設定
    if (scheduleUuid) params.set("scheduleUuid", scheduleUuid);

    // ローカル開発の場合はローカルのベースURLを使用
    if (isLocalLike) {
      const localBase = `${protocol}//${hostname}:5175/map/`;
      // ローカルのベースURLとパラメータを組み合わせてURLを生成
      const u = new URL(localBase);
      // パラメータを設定
      for (const [k, v] of params.entries()) u.searchParams.set(k, v);
      window.open(u.toString(), "_blank", "noopener,noreferrer");
      return;
    }

    // 本番の場合は環境変数からベースURLを取得
    const fromEnv = String(import.meta.env.VITE_MAP_BASE_URL || "").trim();
    if (fromEnv) {
      // 環境変数からベースURLを取得
      const normalized = normalizeMapUrl(fromEnv);
      // ベースURLとパラメータを組み合わせてURLを生成
      const u = new URL(normalized);
      for (const [k, v] of params.entries()) u.searchParams.set(k, v);
      window.open(u.toString(), "_blank", "noopener,noreferrer");
      return;
    }

    // ローカル開発の場合はローカルのベースURLを使用
    const fallbackBase = `${protocol}//${hostname}/map/`;

    // ベースURLとパラメータを組み合わせてURLを生成
    const u = new URL(fallbackBase);
    for (const [k, v] of params.entries()) u.searchParams.set(k, v);
    // ブラウザで新しいタブで開く
    window.open(u.toString(), "_blank", "noopener,noreferrer");
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
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
