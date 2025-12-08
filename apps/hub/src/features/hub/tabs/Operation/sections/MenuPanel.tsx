// 先頭のインポートを拡張
import { useState, useEffect } from "react";

// 既存の MenuPanel を差し替え
export function MenuPanel({
  open,
  module1Title,
  module2Title,
  module1Enabled,
  module2Enabled,
  onToggleModule1,
  onToggleModule2,
  grid,
  measureNum,
  setMeasureNum,
  onCommitMeasurement,
  spacingSeqX = [],
  spacingSeqY = [],
}: {
  open: boolean;
  onClose: () => void;
  module1Title?: string;
  module2Title?: string;
  module1Enabled: boolean;
  module2Enabled: boolean;
  onToggleModule1: () => void;
  onToggleModule2: () => void;
  // 計測用
  grid: { countX: number; countY: number; spacing: number };
  measureNum: number | "";
  setMeasureNum: (v: number | "") => void;
  onCommitMeasurement?: (targetId: number | "", result: string | null) => void;
  spacingSeqX?: number[];
  spacingSeqY?: number[];
}) {
  const offGutter = 16;

  // 計測結果のローカル表示用
  const [measureXY, setMeasureXY] = useState<{ x: number; y: number } | null>(
    null
  );

  // 可変間隔対応（MeasureSection と同じ累積距離ロジック）
  const cumDist = (i: number, seq: number[], fallback: number) => {
    if (!seq || seq.length === 0) return i * fallback;
    const L = seq.length;
    if (L === 1) return i * seq[0];
    let sum = 0;
    for (let k = 0; k < i; k++) sum += seq[k % L];
    return sum;
  };

  const calc = (num: number) => {
    if (num < 0 || num >= grid.countX * grid.countY) return null;
    const col = num % grid.countX;
    const row = Math.floor(num / grid.countX);
    // フォールバックは grid.spacing（等間隔）
    const fb = grid.spacing;
    return {
      x: cumDist(col, spacingSeqX, fb),
      y: cumDist(row, spacingSeqY, fb),
    };
  };

  // 入力が外から書き換わったら結果をクリア（同期ズレ防止）
  useEffect(() => {
    setMeasureXY(null);
  }, [measureNum, grid.countX, grid.countY, grid.spacing]);

  const panelStyle: React.CSSProperties = {
    transform: open
      ? "translate3d(0,0,0)"
      : `translate3d(calc(100% + ${offGutter}px), 0, 0)`,
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    width: "min(88vw, 420px)",
    height: "100%",
    contain: "layout paint",
  };

  return (
    <div
      id="landscape-side-menu"
      className={`fixed z-10000 bg-black/70 backdrop-blur-md shadow-2xl
                  top-0 right-0 bottom-0 border-l border-white/10
                  transition-transform duration-300 will-change-transform overflow-hidden`}
      style={panelStyle}
      role="dialog"
      aria-modal="true"
      aria-label="サイドメニュー"
      aria-hidden={!open}
    >
      {/* ヘッダー */}
      <div className="relative px-5 pt-5 pb-4">
        <h3 className="text-white/90 text-base tracking-wide">メニュー</h3>
      </div>

      <div className="px-6 py-2 text-white/90 text-[15px] space-y-6 overflow-y-auto h-[calc(100%-4.25rem)]">
        {/* セクション：モジュールONOFF */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <i className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="opacity-90">モジュールONOFF</span>
          </div>

          {/* モジュール1 */}
          <div className="flex items-center justify-between gap-3">
            <div className="opacity-90">{module1Title || "モジュール1"}</div>
            <button
              type="button"
              aria-pressed={module1Enabled}
              onClick={onToggleModule1}
              className={`min-w-[84px] h-10 px-5 rounded-md text-white font-semibold shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]
                ${
                  module1Enabled
                    ? "bg-red-600 hover:bg-red-600/90 active:bg-red-700"
                    : "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900"
                }`}
              aria-label=
              {module1Enabled
                ? "ON"
                : "OFF"}
            >
              {module1Enabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* モジュール2 */}
          <div className="flex items-center justify-between gap-3">
            <div className="opacity-90">{module2Title || "モジュール2"}</div>
            <button
              type="button"
              aria-pressed={module2Enabled}
              onClick={onToggleModule2}
              className={`min-w-[84px] h-10 px-5 rounded-md text-white font-semibold shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]
                ${
                  module2Enabled
                    ? "bg-blue-600 hover:bg-blue-600/90 active:bg-blue-700"
                    : "bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900"
                }`}
              aria-label={
                module2Enabled
                  ? "ON"
                  : "OFF"
              }
            >
              {module2Enabled ? "ON" : "OFF"}
            </button>
          </div>
        </section>

        {/* セクション：機体の計測 */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <i className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="opacity-90">機体の計測</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="215"
              className="w-[140px] h-11 px-3 rounded-md bg-black/50 text-white
                         border border-white/20 focus:outline-none focus:ring-2
                         focus:ring-red-600/60 focus:border-red-600/70"
              value={String(measureNum ?? "")}
              onChange={(e) => {
                const v = e.target.value === "" ? "" : Number(e.target.value);
                setMeasureNum(v as number | "");
                setMeasureXY(null);
              }}
              inputMode="numeric"
            />
            <button
              type="button"
              className="h-11 px-7 rounded-md text-white font-semibold
                         bg-transparent border-2 border-red-500
                         hover:bg-red-600/10 active:bg-red-600/20"
              onClick={() => {
                if (measureNum !== "" && !Number.isNaN(measureNum)) {
                  const pos = calc(Number(measureNum));
                  setMeasureXY(pos);
                  onCommitMeasurement?.(
                    Number(measureNum),
                    pos
                      ? `x:${pos.x.toFixed(1)}m　y:${pos.y.toFixed(1)}m`
                      : null
                  );
                } else {
                  setMeasureXY(null);
                  onCommitMeasurement?.("", null);
                }
              }}
            >
              計測
            </button>
          </div>

          {/* 結果表示（メニュー内） */}
          <div className="text-sm min-h-[20px]" aria-live="polite">
            {measureXY ? (
              <span className="tabular-nums">
                0番から　x:{measureXY.x.toFixed(1)}m　y:{measureXY.y.toFixed(1)}
                m
              </span>
            ) : (
              <span className="text-slate-500">計測結果はありません</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
