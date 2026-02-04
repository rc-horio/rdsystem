// src/features/hub/tabs/AreaInfo/sections/LandingAreaFigure.tsx

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

// Operation/TableSection と同じ思想のフォーマッタ
const fmt = (n: number) =>
  Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1);

// CSV文字列を数値配列に（空/不正は除外）
const parseSeq = (v: unknown): number[] => {
  if (typeof v !== "string") return [];
  return v
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
};

// 可変間隔の累積距離：seq を繰り返しながら i ステップ分の合計を返す
const cumDist = (i: number, seq: number[], fallback = 1): number => {
  if (!seq || seq.length === 0) return i * fallback;
  const L = seq.length;
  if (L === 1) return i * seq[0];
  let sum = 0;
  for (let k = 0; k < i; k++) sum += seq[k % L];
  return sum;
};

export function LandingAreaFigure({ edit, area, onPatchArea }: Props) {
  // 既存：距離入力（テーブルと同じルール）
  // x軸 spacingSeqX = vertical、y軸 spacingSeqY = horizontal
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  const seqX = parseSeq(vertical);
  const seqY = parseSeq(horizontal);
  const fallback = 1;

  const countX = Number(area?.drone_count?.x_count);
  const countY = Number(area?.drone_count?.y_count);
  const xOk = Number.isFinite(countX) && countX > 0;
  const yOk = Number.isFinite(countY) && countY > 0;

  // 間隔の入力有無（要件通り「間隔も」必須にする）
  const spacingOk = seqX.length > 0 && seqY.length > 0;

  // 左図を描画してよい条件
  const canRenderFigure = xOk && yOk && spacingOk;

  // 幅/高さ(m)：テーブルのルーラーと同一計算
  // 「点(機体)の最小〜最大」の長さ = (count-1)ステップ分の累積
  const widthM =
    xOk && countX >= 2 ? cumDist(countX - 1, seqX, fallback) : 0;
  const heightM =
    yOk && countY >= 2 ? cumDist(countY - 1, seqY, fallback) : 0;

  // 四隅の数字：テーブルの num 計算と一致させる
  // num = (countY - 1 - r) * countX + c
  const corner = (() => {
    if (!xOk || !yOk) return null;
    const bl = 0;
    const br = countX - 1;
    const tl = (countY - 1) * countX;
    const tr = countX * countY - 1;
    return { tl, tr, bl, br };
  })();

  // SVGスケール：実寸(m)を一定の見た目に収める（m→px）
  const viewW = 460;
  const viewH = 220;
  const margin = 36;
  const usableW = viewW - margin * 2;
  const usableH = viewH - margin * 2;

  const safeW = Math.max(widthM, 1);
  const safeH = Math.max(heightM, 1);

  // 長辺に合わせて縮尺を決める（見た目が破綻しない範囲で単純化）
  const scale = Math.min(usableW / safeW, usableH / safeH);
  const rectW = safeW * scale;
  const rectH = safeH * scale;

  // 矩形を右に寄せる量（px）
  const offsetX = 15;

  // 矩形の左上角の座標
  const rx = (viewW - rectW) / 2 + offsetX;
  const ry = (viewH - rectH) / 2;

  // 寸法線（矢印）
  const arrow = {
    markerId: "arrow",
    markerSize: 6,
  };

  // 機体向きUI
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

      <div className="my-4 flex flex-col lg:flex-row gap-4">
        {/* 左: 離発着エリア図 */}
        <div className="flex-1 lg:basis-6/12">
          <div className="h-120 w-full border border-slate-600">
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <marker
                  id={arrow.markerId}
                  markerWidth={arrow.markerSize}
                  markerHeight={arrow.markerSize}
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ffffff" />
                </marker>
              </defs>
              {canRenderFigure ? (
                <>
                  {/* 本体矩形 */}
                  <rect
                    x={rx}
                    y={ry}
                    width={rectW}
                    height={rectH}
                    stroke="#ed1b24"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    fill="#ed1b24"
                    fillOpacity={0.35}
                  />


                  {/* 四隅の機体ID */}
                  {corner && (
                    <>
                      {/* TL */}
                      <text
                        x={rx}
                        y={ry - 8}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="start"
                      >
                        {corner.tl}
                      </text>
                      {/* TR */}
                      <text
                        x={rx + rectW}
                        y={ry - 8}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="end"
                      >
                        {corner.tr}
                      </text>
                      {/* BL */}
                      <text
                        x={rx}
                        y={ry + rectH + 16}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="start"
                      >
                        {corner.bl}
                      </text>
                      {/* BR */}
                      <text
                        x={rx + rectW}
                        y={ry + rectH + 16}
                        fontSize="12"
                        fill="#ffffff"
                        textAnchor="end"
                      >
                        {corner.br}
                      </text>
                    </>
                  )}

                  {/* 横幅寸法線 */}
                  <line
                    x1={rx}
                    y1={ry + rectH + 26}
                    x2={rx + rectW}
                    y2={ry + rectH + 26}
                    stroke="#ffffff"
                    strokeWidth={1}
                    markerStart={`url(#${arrow.markerId})`}
                    markerEnd={`url(#${arrow.markerId})`}
                    opacity={0.9}
                  />
                  <text
                    x={rx + rectW / 2}
                    y={ry + rectH + 42}
                    fontSize="12"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    {xOk ? `${fmt(widthM)}m` : "—m"}
                  </text>

                  {/* 縦幅寸法線 */}
                  <line
                    x1={rx - 15}
                    y1={ry}
                    x2={rx - 15}
                    y2={ry + rectH}
                    stroke="#ffffff"
                    strokeWidth={1}
                    markerStart={`url(#${arrow.markerId})`}
                    markerEnd={`url(#${arrow.markerId})`}
                    opacity={0.9}
                  />
                  <text
                    x={rx - 20}
                    y={ry + rectH / 2}
                    fontSize="12"
                    fill="#ffffff"
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {yOk ? `${fmt(heightM)}m` : "—m"}
                  </text>
                </>
              ) : (
                <text
                  x={viewW / 2}
                  y={viewH / 2}
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

        {/* 右: 機体の向き 図（既存） */}
        <div className="flex-1 lg:basis-4/12">
          <div className="h-120 w-full relative flex flex-col items-center justify-center border border-slate-600">
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
