// src/features/hub/tabs/Resource/sections/BatterySection.tsx
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  DisplayOrInput,
  BlackCard,
  SectionTitle,
  AddItemButton,
  DeleteItemButton,
  SwipeableRow,
} from "@/components";
import type { Battery } from "@/features/hub/types/resource";
import clsx from "clsx";

/**
 * Battery 型は以下を想定しています（types側で拡張済み）
 * export type Battery = { model: string; count: number };
 */

/** ── 横幅比率（機種:個数） ── */
const BATTERY_MODEL_FLEX = 3;
const BATTERY_COUNT_FLEX = 1;

/** Tailwindのパージ対策：使用候補 */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

/* 内部のみで使う行型（キー安定用に id を付与） */
type BatteryRow = Battery & { id: string };

/* ─────────────────────────
   バッテリー（機種 + 数量）＋ 行の追加/削除
   ───────────────────────── */
export function BatterySection({
  edit,
  battery = [],
  onChange,
}: {
  edit: boolean;
  battery: Battery[];
  onChange: (battery: Battery[]) => void;
}) {
  // 旧データ（countのみ）の補正を含む正規化
  const defaulted = (b: Partial<Battery>): Battery => ({
    model: typeof b?.model === "string" ? b.model : "",
    count: Number(b?.count ?? 0),
  });

  // 初期化：最初だけ id を付与
  const initRows = (arr: Battery[]): BatteryRow[] =>
    (arr && arr.length ? arr : [{ model: "", count: 0 }]).map((b) => ({
      id: nanoid(),
      ...defaulted(b),
    }));

  // 同期：既存 id をできるだけ継承し、新規分だけ発番（index 準拠）
  const syncRows = (prev: BatteryRow[], src: Battery[]): BatteryRow[] => {
    const base = src && src.length ? src : [{ model: "", count: 0 }];
    return base.map((b, i) => ({
      id: prev[i]?.id ?? nanoid(),
      ...defaulted(b),
    }));
  };

  // 親へ返すときは id を剥がす
  const toPlain = (arr: BatteryRow[]): Battery[] =>
    arr.map(({ id, ...rest }) => defaulted(rest));

  // -------------------------
  // ローカル状態
  // -------------------------
  const [localBatteries, setLocalBatteries] = useState<BatteryRow[]>(() =>
    initRows(battery)
  );

  // 親からの更新を同期（id は温存）
  useEffect(() => {
    setLocalBatteries((prev) => syncRows(prev, battery));
  }, [battery]);

  // 親に通知（emit 統一）
  const emit = (next: BatteryRow[]) => onChange(toPlain(next));

  // -------------------------
  // 編集ハンドラ
  // -------------------------
  const handleModelChange = (index: number, value: string) => {
    const next = [...localBatteries];
    next[index] = { ...next[index], model: value };
    setLocalBatteries(next);
    emit(next);
  };

  const handleCountChange = (index: number, value: string) => {
    const next = [...localBatteries];
    next[index] = { ...next[index], count: parseInt(value, 10) || 0 };
    setLocalBatteries(next);
    emit(next);
  };

  const handleAddRow = () => {
    const next = [...localBatteries, { id: nanoid(), model: "", count: 0 }];
    setLocalBatteries(next);
    emit(next);
  };

  const handleRemoveRow = (index: number) => {
    if (localBatteries.length === 1) return; // 最低1行は残す
    const next = localBatteries.filter((_, i) => i !== index);
    setLocalBatteries(next);
    emit(next);
  };

  // 行描画（HotelSection / DroneSection と並びを合わせる）
  const RowFields = (row: BatteryRow, index: number) => (
    <div className="flex items-center gap-2 w-full">
      {/* 機種（model）：左側 */}
      <DisplayOrInput
        edit={edit}
        value={row.model}
        onChange={(e) => handleModelChange(index, e.target.value)}
        className={`${FLEX_CLASS[BATTERY_MODEL_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="機種"
      />
      {/* 個数：右側 */}
      <DisplayOrInput
        edit={edit}
        value={String(row.count ?? 0)}
        onChange={(e) => handleCountChange(index, e.target.value)}
        inputMode="numeric"
        type="number"
        className={`${FLEX_CLASS[BATTERY_COUNT_FLEX]} min-w-16 text-sm px-2 py-1 text-center`}
        placeholder="個数"
      />
    </div>
  );

  return (
    <BlackCard>
      <div className="flex items-center justify-between gap-3 mb-2">
        <SectionTitle title="バッテリー" />
        {edit && <AddItemButton onClick={handleAddRow} className="shrink-0" />}
      </div>

      {/* スマホ：スワイプ削除 */}
      <div className="space-y-1 md:hidden">
        {localBatteries.map((row, index) => (
          <SwipeableRow
            key={row.id}
            rightActionLabel="削除"
            rightAction={
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-full"
              >
                <DeleteItemButton
                  onClick={() => handleRemoveRow(index)}
                  disabled={!edit || localBatteries.length === 1}
                  className="ml-0!"
                  title="項目削除"
                />
              </div>
            }
            disabled={!edit}
          >
            {RowFields(row, index)}
          </SwipeableRow>
        ))}
      </div>

      {/* PC：削除ボタンの配置を Drone/Hotel と同じに */}
      <div className="space-y-1 hidden md:block">
        {localBatteries.map((row, index) => (
          <div key={row.id} className="w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                <DeleteItemButton
                  onClick={() => handleRemoveRow(index)}
                  disabled={localBatteries.length === 1}
                  className={clsx(
                    "flex items-center justify-center",
                    !edit && "invisible"
                  )}
                  title="項目削除"
                />
              </div>
              {RowFields(row, index)}
            </div>
          </div>
        ))}
      </div>
    </BlackCard>
  );
}
