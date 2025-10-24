// src/features/hub/tabs/Resource/sections/OthersSection.tsx
import { useState, useEffect } from "react";
import type { Item } from "@/features/hub/types/resource";
import { nanoid } from "nanoid";
import {
  BlackCard,
  SectionTitle,
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  SwipeableRow,
} from "@/components";
import clsx from "clsx";

/** ── 横幅比率（機材名:数量） ── */
const ITEM_NAME_FLEX = 3;
const ITEM_QTY_FLEX = 1;

/** Tailwindのパージ対策：使用候補を列挙 */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

// ローカル専用：安定キー用の id を付与
type LocalItem = { id: string; name: string; qty: number };

export function OthersSection({
  edit,
  items,
  onChange,
}: {
  edit: boolean;
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  // 初期化：最初だけ id を付与
  const initLocal = (src: Item[]): LocalItem[] =>
    src.length
      ? src.map((it) => ({
          id: nanoid(),
          name: it.name ?? "",
          qty: Number(it.qty ?? 0),
        }))
      : [{ id: nanoid(), name: "", qty: 0 }];

  // 同期：既存の id を極力引き継ぎ、新規分だけ発番（並びは index 準拠）
  const syncLocal = (prev: LocalItem[], src: Item[]): LocalItem[] => {
    const base = src.length ? src : [{ name: "", qty: 0 }];
    return base.map((it, i) => ({
      id: prev[i]?.id ?? nanoid(),
      name: it.name ?? "",
      qty: Number(it.qty ?? 0),
    }));
  };

  // 親へ返すときは id を剥がす
  const toPlain = (arr: LocalItem[]): Item[] =>
    arr.map(({ id, name, qty }) => ({ id, name, qty }));

  const [localItems, setLocalItems] = useState<LocalItem[]>(() =>
    initLocal(items)
  );

  // 親からの props 変更時に同期（id は温存）
  useEffect(() => {
    setLocalItems((prev) => syncLocal(prev, items));
  }, [items]);

  const emit = (next: LocalItem[]) => onChange(toPlain(next));

  const sanitizeInt = (value: string, fallback = 0) => {
    if (!/^\d*$/.test(value)) return null;
    return value === "" ? fallback : Number(value);
  };

  const handleItemFieldChange = (
    index: number,
    key: "name" | "qty",
    value: string
  ) => {
    const next = [...localItems];
    if (key === "qty") {
      const n = sanitizeInt(value, 0);
      if (n === null) return;
      next[index].qty = n;
    } else {
      next[index].name = value;
    }
    setLocalItems(next);
    emit(next);
  };

  const handleAddItem = () => {
    const next = [...localItems, { id: nanoid(), name: "", qty: 0 }];
    setLocalItems(next);
    emit(next);
  };

  const handleRemoveItem = (index: number) => {
    if (localItems.length === 1) return; // 最低1件は維持
    const next = localItems.filter((_, i) => i !== index);
    setLocalItems(next);
    emit(next);
  };

  // 共通行（PC/スマホ共用）
  const RowFields = (item: LocalItem, index: number) => (
    <div className="flex items-center gap-2 w-full">
      <DisplayOrInput
        edit={edit}
        value={item.name}
        onChange={(e) => handleItemFieldChange(index, "name", e.target.value)}
        className={`${FLEX_CLASS[ITEM_NAME_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="機材名"
      />
      <DisplayOrInput
        edit={edit}
        value={String(item.qty)}
        onChange={(e) => handleItemFieldChange(index, "qty", e.target.value)}
        className={`${FLEX_CLASS[ITEM_QTY_FLEX]} min-w-16 px-2 py-1 text-sm text-center`}
        placeholder="数量"
        inputMode="numeric"
        type="number"
      />
    </div>
  );

  return (
    <BlackCard>
      <div className="flex items-center justify-between gap-3 mb-2">
        <SectionTitle title="機材" />
        {edit && (
          <AddItemButton onClick={handleAddItem} className="shrink-0" />
        )}{" "}
      </div>

      {/* スマホ：スワイプ削除 */}
      <div className="space-y-1 md:hidden">
        {localItems.map((item, index) => (
          <SwipeableRow
            key={item.id}
            rightActionLabel="削除"
            rightAction={
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-full"
              >
                <DeleteItemButton
                  onClick={() => handleRemoveItem(index)}
                  title="項目削除"
                  className="!ml-0"
                  disabled={!edit || localItems.length === 1}
                />
              </div>
            }
            disabled={!edit}
          >
            {RowFields(item, index)}
          </SwipeableRow>
        ))}
      </div>

      {/* PC：常時削除ボタン */}
      <div className="space-y-1 hidden md:block">
        {localItems.map((item, index) => (
          <div key={item.id} className="w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                <DeleteItemButton
                  onClick={() => handleRemoveItem(index)}
                  disabled={localItems.length === 1}
                  className={clsx(
                    "flex items-center justify-center",
                    !edit && "invisible"
                  )}
                  title="項目削除"
                />
              </div>{" "}
              {RowFields(item, index)}
            </div>
          </div>
        ))}
      </div>
    </BlackCard>
  );
}
