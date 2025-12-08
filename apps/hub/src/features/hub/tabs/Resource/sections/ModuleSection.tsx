// src/features/hub/tabs/Resource/sections/ModuleSection.tsx
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import {
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  BlackCard,
  SectionTitle,
  SwipeableRow,
} from "@/components";
import type { Module } from "@/features/hub/types/resource";
import clsx from "clsx";

/** ── 横幅比率（種類:個数） ── */
const MODULE_TYPE_FLEX = 3;
const MODULE_COUNT_FLEX = 1;

/** Tailwindのパージ対策：使用候補 */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

type ModuleRow = Module & { id: string };

export function ModuleSection({
  edit,
  modules = [],
  onChange,
}: {
  edit: boolean;
  modules: Module[];
  onChange: (modules: Module[]) => void;
}) {
  const initRows = (arr: Module[]): ModuleRow[] =>
    arr.length
      ? arr.map((m) => ({ id: nanoid(), ...m }))
      : [{ id: nanoid(), type: "", count: 0 }];

  const syncRows = (prev: ModuleRow[], src: Module[]): ModuleRow[] => {
    const base = src.length ? src : [{ type: "", count: 0 }];
    return base.map((m, i) => ({ id: prev[i]?.id ?? nanoid(), ...m }));
  };

  const toPlain = (arr: ModuleRow[]): Module[] =>
    arr.map(({ id, ...rest }) => rest);

  const [localModules, setLocalModules] = useState<ModuleRow[]>(() =>
    initRows(modules)
  );

  useEffect(() => {
    setLocalModules((prev) => syncRows(prev, modules));
  }, [modules]);

  const emit = (next: ModuleRow[]) => onChange(toPlain(next));

  const handleFieldChange = (
    index: number,
    key: keyof Module,
    value: string
  ) => {
    const next = [...localModules];
    if (key === "count") {
      next[index] = { ...next[index], count: parseInt(value, 10) || 0 };
    } else {
      next[index] = { ...next[index], type: value };
    }
    setLocalModules(next);
    emit(next);
  };

  const handleAddModule = () => {
    const next = [...localModules, { id: nanoid(), type: "", count: 0 }];
    setLocalModules(next);
    emit(next);
  };

  const handleRemoveModule = (index: number) => {
    if (localModules.length === 1) return;
    const next = localModules.filter((_, i) => i !== index);
    setLocalModules(next);
    emit(next);
  };

  const RowFields = (row: ModuleRow, index: number) => (
    <div className="flex items-center gap-2 w-full">
      <DisplayOrInput
        edit={edit}
        value={row.type}
        onChange={(e) => handleFieldChange(index, "type", e.target.value)}
        className={`${FLEX_CLASS[MODULE_TYPE_FLEX]} min-w-0 text-sm px-2 py-1 text-center`}
        placeholder="種類"
      />
      <DisplayOrInput
        edit={edit}
        value={String(row.count ?? 0)}
        onChange={(e) => handleFieldChange(index, "count", e.target.value)}
        inputMode="numeric"
        type="number"
        className={`${FLEX_CLASS[MODULE_COUNT_FLEX]} min-w-16 text-sm px-2 py-1 text-center`}
        placeholder="個数"
      />
    </div>
  );

  return (
    <BlackCard>
      <div className="flex items-center justify-between gap-3 mb-2">
        <SectionTitle title="モジュール" />
        {edit && (
          <AddItemButton onClick={handleAddModule} className="shrink-0" />
        )}{" "}
      </div>

      {/* スマホ：スワイプ削除 */}
      <div className="space-y-1 md:hidden">
        {localModules.map((row, index) => (
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
                  onClick={() => handleRemoveModule(index)}
                  disabled={!edit || localModules.length === 1}
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

      {/* PC：削除ボタンの配置 */}
      <div className="space-y-1 hidden md:block">
        {localModules.map((row, index) => (
          <div key={row.id} className="w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                <DeleteItemButton
                  onClick={() => handleRemoveModule(index)}
                  disabled={localModules.length === 1}
                  className={clsx(
                    "flex items-center justify-center",
                    !edit && "invisible"
                  )}
                  title="項目削除"
                />
              </div>{" "}
              {RowFields(row, index)}
            </div>
          </div>
        ))}
      </div>
    </BlackCard>
  );
}
