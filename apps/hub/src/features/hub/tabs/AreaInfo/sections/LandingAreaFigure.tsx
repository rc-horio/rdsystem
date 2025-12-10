import {
  SectionTitle,
  Drone1Icon,
  Drone2Icon,
  DisplayOrInput,
} from "@/components";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
};

export function LandingAreaFigure({ edit, area, onPatchArea }: Props) {
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
    Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 0;

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
      <SectionTitle title="離発着エリア" />

      {/* 左右並び：左=離発着エリア図、右=アイコン1&2セット */}
      <div className="my-4 flex flex-col lg:flex-row gap-4">
        {/* 左: 離発着エリア図 */}
        <div className="flex-1 lg:basis-12/12">
          <div className="h-120 w-full border border-slate-600">
            <svg
              viewBox="0 0 400 200"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 横長矩形（離発着エリア） */}
              <rect
                x={40}
                y={70}
                width={320}
                height={60}
                stroke="#ed1b24"
                strokeWidth={2}
                strokeOpacity={0.9}
                fill="#ed1b24"
                fillOpacity={0.4}
              />

              {/* ラベル */}
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="14"
                fill="#ffffff"
              >
                離発着エリア(開発中)
              </text>
            </svg>
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
