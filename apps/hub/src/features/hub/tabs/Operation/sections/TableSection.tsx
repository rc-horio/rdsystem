// src/features/hub/tabs/Operation/sections/TableSection.tsx

import { ButtonRed, SectionTitle } from "@/components";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  countX: number;
  countY: number;
  module1Nums: number[]; // モジュール1 = 赤
  module2Nums: number[]; // モジュール2 = 青
  onOpenFull?: () => void;
  hideTitle?: boolean;
  hideScrollHint?: boolean;
  showModule1?: boolean;
  showModule2?: boolean;
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

// ====== 寸法（Tailwind: w-12=48px, h-7=28px に合わせる）======
const CELL_W_PX = 48;
const CELL_H_PX = 28;

// 目盛り・ラベルの寸法
const TICK_X = 8; // 左右方向（Y軸の目盛り線の長さ）
const LABEL_X = 7; // Yラベルの幅
const TICK_Y = 8; // 上下方向（X軸の目盛り線の長さ）
const LABEL_Y = 14; // Xラベルの高さ

// 余白（外周ルーラー分）
const PAD_LEFT = TICK_X + LABEL_X + 10;
const PAD_RIGHT = TICK_X + LABEL_X + 10;
const PAD_TOP = TICK_Y + LABEL_Y + 4;
const PAD_BOTTOM = TICK_Y + LABEL_Y + 4;

// X軸ラベルの右オフセット(px)
const X_LABEL_OFFSET_PX = 24;
const Y_LABEL_OFFSET_PX = 14;

/* ---------------- Rulers ---------------- */

// 表示用フォーマッタ：整数ならそのまま、小数は小数1桁（必要に応じて調整）
const fmt = (n: number) =>
  Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(1);

// 可変間隔の累積距離：seq を繰り返しながら i ステップ分の合計を返す
const cumDist = (i: number, seq: number[], fallback = 1): number => {
  if (!seq || seq.length === 0) return i * fallback;
  const L = seq.length;
  if (L === 1) return i * seq[0];
  let sum = 0;
  for (let k = 0; k < i; k++) sum += seq[k % L];
  return sum;
};

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
          {fmt(cumDist(i, seq, fallback))}
        </div>
      ))}
    </div>
  );
}

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
            {fmt(label)}
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
  module1Nums,
  module2Nums,
  onOpenFull,
  hideScrollHint,
  showModule1 = true,
  showModule2 = true,
  spacingSeqX,
  spacingSeqY,
  bothScroll = false,
}: Props) {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const redSet = showModule1 ? new Set(module1Nums) : new Set<number>();
  const blueSet = showModule2 ? new Set(module2Nums) : new Set<number>();

  const tablePixelW = countX * CELL_W_PX;
  const tablePixelH = countY * CELL_H_PX;

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

      {/* 凡例 */}
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm bg-red-500" />{" "}
          モジュール1
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm bg-blue-500" />{" "}
          モジュール2
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded-sm bg-fuchsia-500" /> 重複
        </span>
      </div>

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
              count={countY}
              height={tablePixelH}
              side="left"
              style={{ left: -(TICK_X + LABEL_X), top: 0 }}
              seq={seqY}
              fallback={fallback}
            />

            <table className="table-fixed border-collapse text-[11px] font-mono min-w-max">
              <tbody>
                {Array.from({ length: countY }).map((_, r) => (
                  <tr key={r}>
                    {Array.from({ length: countX }).map((_, c) => {
                      const num = (countY - 1 - r) * countX + c;
                      const isRed = redSet.has(num);
                      const isBlue = blueSet.has(num);
                      const bg =
                        isRed && isBlue
                          ? "bg-fuchsia-500"
                          : isRed
                            ? "bg-red-500"
                            : isBlue
                              ? "bg-blue-500"
                              : "";

                      const text = isSaving ? "text-black" : (isRed || isBlue ? "text-white" : "");

                      return (
                        <td
                          key={c}
                          className={
                            "w-12 h-7 px-1 text-center border border-slate-600 select-none " +
                            bg + " " + text
                          }
                        >
                          {num}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
            count={countY}
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
