// src/features/hub/tabs/AreaInfo/sections/LandingAreaFigure.tsx

import { fmtMeters } from "@/features/hub/utils/spacing";
import { buildLandingFigureModel } from "@/features/hub/tabs/AreaInfo/figure/landingFigureModel";
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

  // 表示計算（SVG）
  const m = buildLandingFigureModel(area);

  // 間隔入力（オペレーションタブのテーブルと同じ仕様）
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  // 機体向きUI
  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
      Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 0;

  // 間隔入力
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

  // 間隔入力
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

  // 機体向き
  const rotateBy = (delta: number) => {
    const current =
      typeof rotation === "number" && Number.isFinite(rotation) ? rotation : 0;
    const next = current + delta;
    const patched = { ...(area ?? {}), drone_orientation_deg: next };
    onPatchArea(patched);
  };

  // アンテナ位置
  const antennaPosition = () => {
    const radius = 75;
    const angleInRadians = ((rotation + 90) % 360) * (Math.PI / 180);
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);
    const yOffset = 35;
    return { x, y: y + yOffset };
  };
  const { x, y } = antennaPosition();

  // バッテリー位置
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

      <div className="my-4 flex flex-col lg:flex-row gap-4">
        {/* 左: 離発着エリア図 */}
        <div className="flex-1 lg:basis-6/12">
          <div className="h-120 w-full border border-slate-600">
            <svg
              viewBox={`0 0 ${m.viewW} ${m.viewH}`}
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >

              {m.canRenderFigure ? (
                <>
                  {/* 本体矩形 */}
                  <rect
                    x={m.rx}
                    y={m.ry}
                    width={m.rectW}
                    height={m.rectH}
                    stroke="#ed1b24"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    fill="#ed1b24"
                    fillOpacity={0.35}
                  />


                  {/* 四隅の機体ID */}
                  {m.corner && (
                    <>
                      {/* TL */}
                      <text
                        x={m.rx}
                        y={m.ry - 8}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="start"
                      >
                        {m.corner.tl}
                      </text>
                      {/* TR */}
                      <text
                        x={m.rx + m.rectW}
                        y={m.ry - 8}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="end"
                      >
                        {m.corner.tr}
                      </text>
                      {/* BL */}
                      <text
                        x={m.rx}
                        y={m.ry + m.rectH + 16}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="start"
                      >
                        {m.corner.bl}
                      </text>
                      {/* BR */}
                      <text
                        x={m.rx + m.rectW}
                        y={m.ry + m.rectH + 16}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="end"
                      >
                        {m.corner.br}
                      </text>
                    </>
                  )}

                  {/* 横幅寸法線 */}
                  <line
                    x1={m.rx}
                    y1={m.ry + m.rectH + 26}
                    x2={m.rx + m.rectW}
                    y2={m.ry + m.rectH + 26}
                    stroke="#ffffff"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <text
                    x={m.rx + m.rectW / 2}
                    y={m.ry + m.rectH + 42}
                    fontSize="12"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    {m.xOk ? `${fmtMeters(m.widthM)}m` : "—m"}
                  </text>

                  {/* 縦幅寸法線 */}
                  <line
                    x1={m.rx - 15}
                    y1={m.ry}
                    x2={m.rx - 15}
                    y2={m.ry + m.rectH}
                    stroke="#ffffff"
                    strokeWidth={1}
                    opacity={0.9}
                  />
                  <text
                    x={m.rx - 20}
                    y={m.ry + m.rectH / 2}
                    fontSize="12"
                    fill="#ffffff"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {m.yOk ? `${fmtMeters(m.heightM)}m` : "—m"}
                  </text>
                </>
              ) : (
                <text
                  x={m.viewW / 2}
                  y={m.viewH / 2}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fontSize="15"
                  fill="#ffffff"
                  opacity={0.9}
                >
                  x機体数 / y機体数 / 間隔 を入力してください
                </text>
              )}            </svg>
          </div>
        </div>

        {/* 右: 機体の向き図 */}
        <div className="flex-1 lg:basis-4/12">
          <div data-export-orientation-figure
            className="h-120 w-full relative flex flex-col items-center justify-center border border-slate-600">
            <span className="absolute top-2 left-3 text-white text-sm font-semibold">
              機体の向き
            </span>

            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <Drone1Icon
                  className="w-24 h-24 drone1-img"
                  rotationDeg={rotation}
                />

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

                <div
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transition: "transform 0.2s ease-out",
                  }}
                >
                  <span className="text-sm text-red-500">Antenna</span>
                </div>

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

            <div className="h-10" />

            <div className="relative flex flex-col items-center justify-center">
              <div className="absolute left-[-100px] flex items-center gap-2">
                <DisplayOrInput
                  edit={edit}
                  value={horizontal}
                  onChange={(e) => setHorizontal(e.target.value)}
                  className="w-[80px]! text-center"
                />
                <span className="text-slate-100 text-sm">m</span>
              </div>

              <div>
                <Drone2Icon className="w-20 h-20 drone2-img" />
              </div>

              <div className="absolute top-[100px] left-[-5px] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <DisplayOrInput
                    edit={edit}
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value)}
                    className="w-[80px]! text-center"
                  />
                  <span className="text-slate-100 text-sm">m</span>
                </div>
              </div>

              <span className="absolute top-[150px] left-1/2 -translate-x-1/2 text-[12px] leading-tight text-slate-300 whitespace-nowrap">
                ※複数値をカンマ区切りで指定
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
