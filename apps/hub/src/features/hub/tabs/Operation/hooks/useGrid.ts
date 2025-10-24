// features/hub/tabs/Operation/hooks/useGrid.ts
import { useState } from "react";

type Init = { x: number; y: number; spacing: number };

export function useGrid(init: Init) {
  // 入力フィールド（適用前）
  const [inputX, setInputX] = useState<number>(init.x);
  const [inputY, setInputY] = useState<number>(init.y);
  const [inputSpacing, setInputSpacing] = useState<number>(init.spacing);

  // 実際のカウント／間隔（適用後＝描画/計算で使用）
  const [countX, setCountX] = useState<number>(init.x);
  const [countY, setCountY] = useState<number>(init.y);
  const [spacing, setSpacing] = useState<number>(init.spacing);

  /**
   * next を渡すと、入力値も同時に置き換えてから適用します。
   * next を省略した場合は現在の入力値を適用します。
   */
  const applyGridSize = (next?: { x?: number; y?: number; spacing?: number }) => {
    const nx0 = next?.x ?? inputX;
    const ny0 = next?.y ?? inputY;
    const ns0 = next?.spacing ?? inputSpacing;
    const nx = Number.isFinite(Number(nx0)) ? Number(nx0) : init.x;
    const ny = Number.isFinite(Number(ny0)) ? Number(ny0) : init.y;
    const ns = Number.isFinite(Number(ns0)) ? Number(ns0) : init.spacing;

    // 入力値も同期
    setInputX(nx);
    setInputY(ny);
    setInputSpacing(ns);

    // 描画用も即更新
    setCountX(Math.max(1, nx));
    setCountY(Math.max(1, ny));
    setSpacing(ns);
  };

  return {
    inputX,
    inputY,
    inputSpacing,
    setInputX,
    setInputY,
    setInputSpacing,
    countX,
    countY,
    spacing,
    applyGridSize,
  };
}
