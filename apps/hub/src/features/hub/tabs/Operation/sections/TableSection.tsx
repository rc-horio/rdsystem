// src/features/hub/tabs/Operation/sections/TableSection.tsx

import { ButtonRed, SectionTitle } from "@/components";
import { Eye, EyeOff } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { cumDist, fmtMeters } from "@/features/hub/utils/spacing";

type Props = {
  countX: number;
  countY: number;
  /** 全機体数。端数時は右上を切った図形で描画 */
  totalCount?: number;
  /** 推奨：最大5件のモジュール配列（Tableのハイライト対象） */
  modules?: { name: string; ids: number[] }[];
  /** 互換用（旧API）。modules が渡された場合は無視される */
  module1Nums?: number[]; // モジュール1 = 赤
  /** 互換用（旧API）。modules が渡された場合は無視される */
  module2Nums?: number[]; // モジュール2 = 青
  onOpenFull?: () => void;
  hideTitle?: boolean;
  hideScrollHint?: boolean;
  /** フルスクリーン時など、凡例（モジュール名＋トグル）を非表示にする */
  hideLegend?: boolean;
  /** 互換用（旧API） */
  showModule1?: boolean;
  /** 互換用（旧API） */
  showModule2?: boolean;
  /** 互換用（旧API） */
  onToggleModule1?: () => void;
  /** 互換用（旧API） */
  onToggleModule2?: () => void;
  /** modules モード時の外部制御（任意） */
  showModules?: boolean[];
  /** modules モード時の外部制御（任意） */
  onToggleModules?: (index: number) => void;
  spacingSeqX?: number[];
  spacingSeqY?: number[];
  /** フルスクリーン時など両軸スクロールを許可する */
  bothScroll?: boolean;
};

// マウスドラッグスクロール用のカスタムフック
function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartPos({ x: e.pageX, y: e.pageY });
      setScrollPos({ left: el.scrollLeft, top: el.scrollTop });
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.pageX - startPos.x;
      const dy = e.pageY - startPos.y;
      el.scrollLeft = scrollPos.left - dx;
      el.scrollTop = scrollPos.top - dy;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      el.style.cursor = "grab";
      el.style.userSelect = "";
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        el.style.cursor = "grab";
        el.style.userSelect = "";
      }
    };

    el.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mouseleave", handleMouseLeave);

    el.style.cursor = "grab";

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDragging, startPos, scrollPos]);

  return ref;
}

// ====== 寸法（Tailwind: w-8=32px, h-5=20px に合わせる）======
const CELL_W_PX = 32;
const CELL_H_PX = 20;

// 目盛り・ラベルの寸法
const TICK_X = 16; // 左右方向（Y軸の目盛り線の長さ）
const LABEL_X = 7; // Yラベルの幅
const TICK_Y = 8; // 上下方向（X軸の目盛り線の長さ）
const LABEL_Y = 14; // Xラベルの高さ

// 余白（外周ルーラー分）
const PAD_LEFT = TICK_X + LABEL_X + 10;
const PAD_RIGHT = TICK_X + LABEL_X + 10;
const PAD_TOP = TICK_Y + LABEL_Y + 4;
const PAD_BOTTOM = TICK_Y + LABEL_Y + 4;

// X軸ラベルの右オフセット(px)
const X_LABEL_OFFSET_PX = 16;
const Y_LABEL_OFFSET_PX = 11;

/* ---------------- Rulers ---------------- */
// X軸ラベル
function RulerX({
  count,
  width,
  side, // 'top' | 'bottom'
  style,
  seq,
  fallback = 1,
}: {
  count: number;
  width: number;
  side: "top" | "bottom";
  style?: React.CSSProperties;
  seq: number[];
  fallback?: number;
}) {
  const isTop = side === "top";
  const tickH = TICK_Y;

  return (
    <div
      aria-hidden
      className="absolute left-0 select-none text-[10px] text-slate-400 pointer-events-none"
      style={{ width, height: tickH + LABEL_Y, ...style }}
    >
      {/* 縦線の延長 */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`x-line-${i}`}
          className="absolute bg-slate-500/70"
          style={{
            left: i * CELL_W_PX + X_LABEL_OFFSET_PX,
            top: isTop ? 0 : 0,
            width: 1,
            height: tickH,
            transform: isTop
              ? "translateX(-0.5px) translateY(-100%)"
              : "translateX(-0.5px)",
          }}
        />
      ))}

      {/* 数値（線の先端） */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`x-num-${i}`}
          className="absolute"
          style={{
            left: i * CELL_W_PX + X_LABEL_OFFSET_PX,
            top: isTop ? -tickH - (LABEL_Y - 2) : tickH,
            transform: "translateX(-50%)",
            lineHeight: "12px",
          }}
        >
          {fmtMeters(cumDist(i, seq, fallback))}
        </div>
      ))}
    </div>
  );
}

// Y軸ラベル
function RulerY({
  count,
  height,
  side, // 'left' | 'right'
  style,
  seq,
  fallback = 1,
}: {
  count: number;
  height: number;
  side: "left" | "right";
  style?: React.CSSProperties;
  seq: number[];
  fallback?: number;
}) {
  const isLeft = side === "left";
  const tickW = TICK_X;
  const labelW = LABEL_X;

  return (
    <div
      aria-hidden
      className="absolute select-none text-[10px] text-slate-400 pointer-events-none"
      style={{ width: tickW + labelW, height, ...style }}
    >
      {/* 横線の延長：上端からの距離で揃える（格子線と一致） */}
      {Array.from({ length: count }).map((_, i) => {
        const y = i * CELL_H_PX;
        return (
          <div
            key={`y-line-${i}`}
            className="absolute bg-slate-500/70"
            style={{
              top: y + Y_LABEL_OFFSET_PX,
              left: isLeft ? 7 : 1,
              width: tickW,
              height: 1,
              transform: "translateY(-0.5px)",
            }}
          />
        );
      })}

      {/* 数値（線の先端） */}
      {Array.from({ length: count }).map((_, i) => {
        const y = i * CELL_H_PX;
        // 下が0m。上へ行くほど値が増えるので、上端＝ count * spacing
        const label = cumDist(count - 1 - i, seq, fallback);
        return (
          <div
            key={`y-num-${i}`}
            className="absolute"
            style={{
              top: y + Y_LABEL_OFFSET_PX,
              left: isLeft ? -1 : tickW,
              transform: "translateY(-50%)",
              minWidth: isLeft ? labelW : 0,
              lineHeight: "12px",
              textAlign: "left",
              zIndex: 1,
            }}
          >
            {fmtMeters(label)}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Main ---------------- */

export function TableSection({
  countX,
  countY,
  totalCount,
  modules,
  module1Nums = [],
  module2Nums = [],
  onOpenFull,
  hideScrollHint,
  hideLegend = false,
  showModule1: showModule1Prop = true,
  showModule2: showModule2Prop = true,
  onToggleModule1,
  onToggleModule2,
  showModules,
  onToggleModules,
  spacingSeqX,
  spacingSeqY,
  bothScroll = false,
}: Props) {
  const moduleList: { name: string; ids: number[] }[] =
    Array.isArray(modules) && modules.length > 0
      ? modules.slice(0, 5)
      : [
          { name: "モジュール1", ids: module1Nums },
          { name: "モジュール2", ids: module2Nums },
        ];

  const isLegacy = !(Array.isArray(modules) && modules.length > 0);

  // legacy: 従来通り 1/2 の外部制御を維持
  const [showM1Local, setShowM1Local] = useState(true);
  const [showM2Local, setShowM2Local] = useState(true);
  const isControlledM1 = isLegacy && onToggleModule1 !== undefined;
  const isControlledM2 = isLegacy && onToggleModule2 !== undefined;
  const showModule1 = isControlledM1 ? showModule1Prop : showM1Local;
  const showModule2 = isControlledM2 ? showModule2Prop : showM2Local;
  const handleToggleM1 = () => {
    if (onToggleModule1) onToggleModule1();
    else setShowM1Local((v) => !v);
  };
  const handleToggleM2 = () => {
    if (onToggleModule2) onToggleModule2();
    else setShowM2Local((v) => !v);
  };

  // modules: 最大5件分をローカルでトグル（legacy制御とは独立）
  const [showModulesLocal, setShowModulesLocal] = useState<boolean[]>(
    () => moduleList.map(() => true)
  );
  useEffect(() => {
    setShowModulesLocal((prev) => {
      const next = moduleList.map((_, i) => prev[i] ?? true);
      return next;
    });
  }, [moduleList.length]);

  const isControlledModules =
    !isLegacy &&
    Array.isArray(showModules) &&
    typeof onToggleModules === "function";

  const getShowModules = () =>
    isControlledModules ? showModules! : showModulesLocal;

  const scrollRef = useDragScroll<HTMLDivElement>();

  const palette = [
    { bg: "bg-red-500", swatch: "bg-red-500" },
    { bg: "bg-blue-500", swatch: "bg-blue-500" },
    { bg: "bg-emerald-500", swatch: "bg-emerald-500" },
    { bg: "bg-amber-500", swatch: "bg-amber-500" },
    { bg: "bg-purple-500", swatch: "bg-purple-500" },
  ] as const;

  const activeSets: { name: string; set: Set<number>; bg: string; swatch: string }[] =
    isLegacy
      ? [
          {
            name: "モジュール1",
            set: showModule1 ? new Set(module1Nums) : new Set<number>(),
            bg: palette[0].bg,
            swatch: palette[0].swatch,
          },
          {
            name: "モジュール2",
            set: showModule2 ? new Set(module2Nums) : new Set<number>(),
            bg: palette[1].bg,
            swatch: palette[1].swatch,
          },
        ]
      : moduleList.map((m, i) => ({
          name: m.name || `モジュール${i + 1}`,
          set: getShowModules()[i] ? new Set(m.ids ?? []) : new Set<number>(),
          bg: palette[i]?.bg ?? "bg-slate-500",
          swatch: palette[i]?.swatch ?? "bg-slate-500",
        }));

  // 端数時: 全機体数優先で actualRowCount、lastRowCount を算出
  const fullRectCount = countX * countY;
  const hasTotalCount =
    typeof totalCount === "number" &&
    Number.isFinite(totalCount) &&
    totalCount > 0;
  const actualRowCount = hasTotalCount
    ? Math.ceil(totalCount / countX)
    : countY;
  const lastRowCount = hasTotalCount
    ? totalCount - (actualRowCount - 1) * countX
    : countX;
  const usePartialLayout =
    hasTotalCount &&
    totalCount < fullRectCount &&
    lastRowCount > 0 &&
    lastRowCount < countX;

  const tablePixelW = countX * CELL_W_PX;
  const tablePixelH = actualRowCount * CELL_H_PX;

  // フォールバック間隔（1m 等間隔）
  const fallback = 1;
  const seqX = Array.isArray(spacingSeqX) ? spacingSeqX : [];
  const seqY = Array.isArray(spacingSeqY) ? spacingSeqY : [];

  // ラッパーの“実寸”を明示：縦スクロールなし
  const wrapperW = PAD_LEFT + tablePixelW + PAD_RIGHT;
  const wrapperH = PAD_TOP + tablePixelH + PAD_BOTTOM;

  // 画像化対象（ルーラー＋テーブルを含む“実寸の板”）
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const node = captureRef.current;
    if (!node) return;

    try {
      setIsSaving(true);

      // SSR回避したい場合は dynamic import 推奨
      const htmlToImage = await import("html-to-image");

      const dataUrl = await htmlToImage.toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
        style: {
          color: "#000000",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        },
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `table_${countX}x${countY}.png`;
      a.click();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <SectionTitle title="機体の配列" />

      {/* 保存ボタン */}
      <div className="mb-2 flex justify-end">
        <ButtonRed onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "配置図を保存"}
        </ButtonRed>
      </div>

      {!hideScrollHint && (
        <div
          className="md:hidden text-center text-[15px] leading-none text-slate-400 mb-5 select-none"
          aria-hidden="true"
        >
          ←ーー Scroll ーー→
        </div>
      )}

      {!hideLegend && (
        <div className="flex items-center gap-4 mb-2 text-sm flex-wrap">
          {isLegacy ? (
            <>
              <button
                type="button"
                onClick={handleToggleM1}
                className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-opacity ${
                  showModule1 ? "opacity-100" : "opacity-50"
                } hover:opacity-100`}
                aria-pressed={showModule1}
                aria-label="モジュール1のハイライト切替"
              >
                <i className="inline-block w-4 h-4 rounded-sm bg-red-500 shrink-0" />
                <span>モジュール1</span>
                {showModule1 ? (
                  <Eye className="w-6 h-6 shrink-0" aria-hidden />
                ) : (
                  <EyeOff className="w-6 h-6 shrink-0" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={handleToggleM2}
                className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-opacity ${
                  showModule2 ? "opacity-100" : "opacity-50"
                } hover:opacity-100`}
                aria-pressed={showModule2}
                aria-label="モジュール2のハイライト切替"
              >
                <i className="inline-block w-4 h-4 rounded-sm bg-blue-500 shrink-0" />
                <span>モジュール2</span>
                {showModule2 ? (
                  <Eye className="w-6 h-6 shrink-0" aria-hidden />
                ) : (
                  <EyeOff className="w-6 h-6 shrink-0" aria-hidden />
                )}
              </button>
            </>
          ) : (
            <>
              {moduleList.map((m, i) => {
                const show = getShowModules()[i] ?? true;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      isControlledModules
                        ? onToggleModules(i)
                        : setShowModulesLocal((prev) => {
                            const next = [...prev];
                            next[i] = !show;
                            return next;
                          })
                    }
                    className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-opacity ${
                      show ? "opacity-100" : "opacity-50"
                    } hover:opacity-100`}
                    aria-pressed={show}
                    aria-label={`${m.name || `モジュール${i + 1}`}` + "のハイライト切替"}
                  >
                    <i
                      className={
                        "inline-block w-4 h-4 rounded-sm shrink-0 " +
                        (palette[i]?.swatch ?? "bg-slate-500")
                      }
                    />
                    <span className="max-w-56 truncate">
                      {m.name || `モジュール${i + 1}`}
                    </span>
                    {show ? (
                      <Eye className="w-6 h-6 shrink-0" aria-hidden />
                    ) : (
                      <EyeOff className="w-6 h-6 shrink-0" aria-hidden />
                    )}
                  </button>
                );
              })}
            </>
          )}
          <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
            <i className="inline-block w-4 h-4 rounded-sm bg-fuchsia-500" /> 重複
          </span>
        </div>
      )}

      {/* スクロールコンテナ */}
      <div
        ref={scrollRef}
        className={
          (bothScroll
            ? "overflow-auto "
            : "overflow-x-auto overflow-y-hidden ") + "rounded-md"
        }
        style={{ WebkitOverflowScrolling: "touch" as any }}
      >
        {/* 実寸の板（relative） */}
        <div
          ref={captureRef}
          className="relative"
          style={{ width: wrapperW, height: wrapperH }}
        >
          {/* テーブル層：左ルーラーをこの層の中に入れるのがポイント */}
          <div
            className="absolute"
            style={{
              left: PAD_LEFT,
              top: PAD_TOP,
              width: tablePixelW,
              height: tablePixelH,
            }}
          >
            {/* ← ここに左ルーラーを“内側”に配置。テーブル左端から負方向に出す */}
            <RulerY
              count={actualRowCount}
              height={tablePixelH}
              side="left"
              style={{ left: -(TICK_X + LABEL_X), top: 0 }}
              seq={seqY}
              fallback={fallback}
            />

            <table className="table-fixed border-collapse text-[10px] font-mono min-w-max">
              <tbody>
                {Array.from({ length: actualRowCount }).map((_, r) => {
                  const colsInRow =
                    usePartialLayout && r === 0 ? lastRowCount : countX;
                  return (
                    <tr key={r}>
                      {Array.from({ length: colsInRow }).map((_, c) => {
                        const num =
                          (actualRowCount - 1 - r) * countX + c;
                        const hit = activeSets.filter((m) => m.set.has(num));
                        const bg =
                          hit.length >= 2
                            ? "bg-fuchsia-500"
                            : hit.length === 1
                              ? hit[0]!.bg
                              : "";

                        const text = isSaving
                          ? "text-black"
                          : hit.length > 0
                            ? "text-white"
                            : "";

                        return (
                          <td
                            key={c}
                            className={
                              "w-8 h-5 p-0 text-center border border-slate-600 select-none " +
                              bg + " " + text
                            }
                          >
                            {num}
                          </td>
                        );
                      })}
                      {usePartialLayout && r === 0 && colsInRow < countX && (
                        <td
                          colSpan={countX - colsInRow}
                          className="w-8 h-5 p-0 border-0"
                          aria-hidden
                        />
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 外周ルーラー（上・下・右） */}
          <RulerX
            count={countX}
            width={tablePixelW}
            side="top"
            style={{ left: PAD_LEFT, top: PAD_TOP }}
            seq={seqX}
            fallback={fallback}
          />
          <RulerX
            count={countX}
            width={tablePixelW}
            side="bottom"
            style={{ left: PAD_LEFT, top: PAD_TOP + tablePixelH }}
            seq={seqX}
            fallback={fallback}
          />
          <RulerY
            count={actualRowCount}
            height={tablePixelH}
            side="right"
            style={{ left: PAD_LEFT + tablePixelW, top: PAD_TOP }}
            seq={seqY}
            fallback={fallback}
          />
        </div>
      </div>

      {onOpenFull && !hideScrollHint && (
        <div className="mt-3 flex justify-center">
          <ButtonRed onClick={onOpenFull}>全画面</ButtonRed>
        </div>
      )}
    </section>
  );
}
