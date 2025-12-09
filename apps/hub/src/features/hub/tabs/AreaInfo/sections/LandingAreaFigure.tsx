import {
  SectionTitle,
  Drone1Icon,
  Drone2Icon,
  DisplayOrInput,
} from "@/components";
import { useMemo } from "react";

// MapCard と同じ normalize を共通化するか、ここにコピペでもOK
const normalizeMapUrl = (base?: string) => {
  const raw = (base || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw, window.location.origin);
    if (!/\/map\/?$/.test(u.pathname)) {
      u.pathname = (u.pathname.replace(/\/+$/, "") || "") + "/map/";
    } else {
      u.pathname = "/map/";
    }
    return u.toString();
  } catch {
    return raw.endsWith("/") ? `${raw}map/` : `${raw}/map/`;
  }
};

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
  projectUuid?: string | null;
  scheduleUuid?: string | null;
  areaName?: string | null;
};

export function LandingAreaFigure({
  edit,
  area,
  onPatchArea,
  projectUuid,
  scheduleUuid,
  areaName,
}: Props) {
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
    Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 0;

  // 離発着エリア専用 iframe 用の URL を組み立てる
  const fromEnv = import.meta.env.VITE_MAP_BASE_URL as string | undefined;

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

  const takeoffFigureSrc = useMemo(() => {
    try {
      const u = new URL(base);
      // 埋め込みモード
      u.searchParams.set("mode", "embed");
      // 「離発着エリアだけ」モードを表すフラグ
      u.searchParams.set("view", "takeoff-only");

      if (areaName) {
        u.searchParams.set("areaName", areaName);
      }
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

  const setHorizontal = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        horizontal: v,
      },
    };
    onPatchArea(next);
  };

  const setVertical = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        vertical: v,
      },
    };
    onPatchArea(next);
  };

  const rotateBy = (delta: number) => {
    const current =
      typeof rotation === "number" && Number.isFinite(rotation) ? rotation : 0;
    const next = current + delta;
    const patched = { ...(area ?? {}), drone_orientation_deg: next };
    onPatchArea(patched);
  };

  const antennaPosition = () => {
    const radius = 75;
    const angleInRadians = ((rotation + 90) % 360) * (Math.PI / 180);
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    const yOffset = 35;
    return { x, y: y + yOffset };
  };
  const { x, y } = antennaPosition();

  const batteryPosition = () => {
    const radius = 75;
    const angleInRadians = ((rotation + 270) % 360) * (Math.PI / 180);
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    const yOffset = 35;
    return { x, y: y + yOffset };
  };
  const { x: batteryX, y: batteryY } = batteryPosition();

  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア 図" />

      {/* 左右並び：左=離発着エリア図、右=アイコン1&2セット */}
      <div className="my-4 flex flex-col lg:flex-row gap-4">
        {/* 左: 離発着エリア図 */}
        <div className="flex-1 lg:basis-12/12">
          <div className="h-120 w-full border border-slate-600 overflow-hidden">
            <iframe
              key={takeoffFigureSrc}
              src={takeoffFigureSrc}
              width="100%"
              height="100%"
              className="w-full h-full"
              style={{ border: "none" }}
              title="離発着エリア図（離発着エリアのみフォーカス）"
              loading="lazy"
            />
          </div>
        </div>

        {/* 右: 機体の向き 図（アイコン1セット & アイコン2セット） */}
        <div className="flex-1 lg:basis-5/12">
          <div className="h-120 w-full relative flex flex-col items-center justify-center border border-slate-600">
            {/* ラベル */}
            <span className="absolute top-2 left-3 text-white text-sm font-semibold">
              機体の向き
            </span>

            {/* ===== アイコン1セット ===== */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Drone1Icon
                  className="w-24 h-24 drone1-img"
                  rotationDeg={rotation}
                />

                {/* 回転ボタン */}
                <div className="mt-12 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => rotateBy(-90)}
                    disabled={!edit}
                    className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                    aria-label="左へ90度回転"
                    title="左へ90°"
                  >
                    ↶
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateBy(90)}
                    disabled={!edit}
                    className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                    aria-label="右へ90度回転"
                    title="右へ90°"
                  >
                    ↷
                  </button>
                </div>

                {/* Antenna */}
                <div
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <span className="text-sm text-red-500">Antenna</span>
                </div>

                {/* Battery */}
                <div
                  className="absolute"
                  style={{
                    transform: `translate(${batteryX}px, ${batteryY}px)`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <span className="text-sm text-white">Battery</span>
                </div>
              </div>
            </div>

            {/* セット間の余白 */}
            <div className="h-10" />

            {/* ===== アイコン2セット ===== */}
            <div className="relative flex flex-col items-center justify-center">
              {/* 中央距離（horizontal） */}
              <div className="absolute left-[-65px] flex items-center gap-2">
                <DisplayOrInput
                  edit={edit}
                  value={horizontal}
                  onChange={(e) => setHorizontal(e.target.value)}
                  className="w-[50px]! text-center"
                />
                <span className="text-slate-100 text-sm">m</span>
              </div>

              {/* アイコン2 */}
              <div>
                <Drone2Icon className="w-20 h-20 drone2-img" />
              </div>

              {/* 下部距離（vertical） */}
              <div
                className="absolute flex items-center gap-2"
                style={{
                  top: "100px",
                  left: "20px",
                }}
              >
                <DisplayOrInput
                  edit={edit}
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className="w-[50px]! text-center"
                />
                <span className="text-slate-100 text-sm">m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
