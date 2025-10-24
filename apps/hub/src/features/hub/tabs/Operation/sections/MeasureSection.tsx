// features/hub/tabs/Operation/sections/MeasureSection.tsx
import { SectionTitle, DisplayOrInput, ButtonRed } from "@/components";
import { useState } from "react";

// TODO(measure-refactor / tomorrow):
//  可変間隔計測ロジックを共通化する。

export function MeasureSection({
  grid,
  measureNum,
  setMeasureNum,
  counts,
  onCommitMeasurement,
  spacingXY,
  spacingSeqX,
  spacingSeqY,
}: {
  grid: { countX: number; countY: number; spacing: number };
  measureNum: number | "";
  setMeasureNum: (v: number | "") => void;
  counts?: { total?: number; x?: number; y?: number };
  onCommitMeasurement?: (targetId: number | "", result: string | null) => void;
  // AreaInfo 由来の間隔（x: 下部距離, y: 中央距離）
  spacingXY?: { x?: number | string | ""; y?: number | string | "" };
  spacingSeqX?: number[];
  spacingSeqY?: number[];
}) {
  const [measureXY, setMeasureXY] = useState<{ x: number; y: number } | null>(
    null
  );

  // 可変間隔の累積距離
  const cumDist = (i: number, seq: number[], fallback: number) => {
    if (!seq || seq.length === 0) return i * fallback;
    const L = seq.length;
    if (L === 1) return i * seq[0];
    let sum = 0;
    for (let k = 0; k < i; k++) sum += seq[k % L];
    return sum;
  };
  const seqX = Array.isArray(spacingSeqX) ? spacingSeqX : [];
  const seqY = Array.isArray(spacingSeqY) ? spacingSeqY : [];
  const fallback = grid.spacing;

  const calc = (num: number) => {
    if (num < 0 || num >= grid.countX * grid.countY) return null;
    const col = num % grid.countX;
    const row = Math.floor(num / grid.countX);
    return {
      x: cumDist(col, seqX, fallback),
      y: cumDist(row, seqY, fallback),
    };
  };

  const fmtVal = (v: number | string | "" | undefined) => {
    if (v === undefined || v === "") return "—";
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? `${n}` : `${v}`;
  };

  const hasSpacing =
    spacingXY && (spacingXY.x !== undefined || spacingXY.y !== undefined);

  return (
    <section className="h-full">
      {/* タイトルは表示専用 → キャレット無効 */}
      <SectionTitle title="機体の計測" />

      {counts && (counts.total ?? counts.x ?? counts.y) !== undefined && (
        <div className="flex justify-center mt-2">
          <div className="inline-flex gap-5 text-sm text-slate-300">
            <span>
              機体数：<b className="tabular-nums">{counts.total ?? "—"}</b>
            </span>
            <span>
              x機体数：<b className="tabular-nums">{counts.x ?? "—"}</b>
            </span>
            <span>
              y機体数：<b className="tabular-nums">{counts.y ?? "—"}</b>
            </span>
          </div>
        </div>
      )}

      {/* AreaInfo の間隔（x: 下部, y: 中央）を表示 */}
      {hasSpacing && (
        <div className="flex justify-center">
          <div className="inline-flex gap-5 text-sm text-slate-300 mt-1">
            <span>
              x間隔：
              <b className="tabular-nums">
                {/* 配列ならCSVで見せる */}
                {Array.isArray(spacingSeqX) && spacingSeqX.length > 0
                  ? spacingSeqX.join(",")
                  : fmtVal(spacingXY?.x)}
                {Array.isArray(spacingSeqX) && spacingSeqX.length > 0
                  ? "m"
                  : fmtVal(spacingXY?.x) === "—"
                  ? ""
                  : "m"}
              </b>
            </span>
            <span>
              y間隔：
              <b className="tabular-nums">
                {Array.isArray(spacingSeqY) && spacingSeqY.length > 0
                  ? spacingSeqY.join(",")
                  : fmtVal(spacingXY?.y)}
                {Array.isArray(spacingSeqY) && spacingSeqY.length > 0
                  ? "m"
                  : fmtVal(spacingXY?.y) === "—"
                  ? ""
                  : "m"}
              </b>
            </span>
          </div>
        </div>
      )}

      {/* ↓ タイトル以外は中央寄せ */}
      <div className="flex flex-col items-center mt-2">
        <label className="text-[11px] text-slate-300 flex items-center">
          <span className="no-caret">計測したい機体番号</span>
          <DisplayOrInput
            edit={true}
            value={String(measureNum ?? "")}
            onChange={(e) => {
              const v = e.target.value === "" ? "" : Number(e.target.value);
              setMeasureNum(v as number | "");
              setMeasureXY(null);
            }}
            inputMode="numeric"
            type="number"
            className="ml-10 mt-1 w-20 text-center select-text" // 入力は選択OK
          />
        </label>

        <ButtonRed
          onClick={() => {
            if (measureNum !== "" && !Number.isNaN(measureNum)) {
              const pos = calc(Number(measureNum));
              setMeasureXY(pos);
              onCommitMeasurement?.(
                Number(measureNum),
                pos ? `x:${pos.x.toFixed(1)}m　y:${pos.y.toFixed(1)}m` : null
              );
            } else {
              setMeasureXY(null);
              onCommitMeasurement?.("", null);
            }
          }}
          className="mt-3 h-9 px-4 min-w-[80px] whitespace-nowrap"
        >
          計測
        </ButtonRed>

        {/* 結果表示は表示専用 → キャレット無効 */}
        <div
          className="mt-3 text-sm min-h-[20px] text-center no-caret"
          aria-live="polite"
        >
          {measureXY ? (
            <span className="tabular-nums">
              選択した機体の距離は0番から
              <br />
              x:{measureXY.x.toFixed(1)}m　y:{measureXY.y.toFixed(1)}mです
            </span>
          ) : (
            <span className="text-slate-500">計測結果はありません</span>
          )}
        </div>
      </div>
    </section>
  );
}
