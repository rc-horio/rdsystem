// src/features/hub/tabs/Resource/sections/DroneSection.tsx
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
import type { Drone } from "@/features/hub/types/resource";
import clsx from "clsx";

/** ── 横幅比率（機種:区分:機体数） ── */
const DRONE_MODEL_FLEX = 3;
const DRONE_COLOR_FLEX = 2;
const DRONE_COUNT_FLEX = 2;

/** Tailwindのパージ対策：使用候補をリテラルで列挙 */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

type DroneRow = Drone & { id: string };

export function DroneSection({
  edit,
  drones,
  onChange,
}: {
  edit: boolean;
  drones: Drone[];
  onChange: (drones: Drone[]) => void;
}) {
  const initRows = (arr: Drone[]): DroneRow[] =>
    arr.length
      ? arr.map((d) => ({ id: nanoid(), ...d }))
      : [{ id: nanoid(), model: "", color: "", count: 0 }];

  const syncRows = (prev: DroneRow[], next: Drone[]): DroneRow[] => {
    const base = next.length ? next : [{ model: "", color: "", count: 0 }];
    return base.map((d, i) => ({ id: prev[i]?.id ?? nanoid(), ...d }));
  };

  const toPlain = (arr: DroneRow[]): Drone[] =>
    arr.map(({ id, ...rest }) => rest);

  const [localDrones, setLocalDrones] = useState<DroneRow[]>(() =>
    initRows(drones)
  );

  useEffect(() => {
    setLocalDrones((prev) => syncRows(prev, drones));
  }, [drones]);

  const emit = (next: DroneRow[]) => onChange(toPlain(next));

  const handleDroneFieldChange = (
    index: number,
    key: keyof Drone,
    value: string
  ) => {
    const next = [...localDrones];
    if (key === "count") {
      next[index] = { ...next[index], count: parseInt(value, 10) || 0 };
    } else {
      next[index] = { ...next[index], [key]: value } as DroneRow;
    }
    setLocalDrones(next);
    emit(next);
  };

  const handleAddDrone = () => {
    const next = [
      ...localDrones,
      { id: nanoid(), model: "", color: "", count: 0 },
    ];
    setLocalDrones(next);
    emit(next);
  };

  const handleRemoveDrone = (index: number) => {
    if (localDrones.length === 1) return;
    const next = localDrones.filter((_, i) => i !== index);
    setLocalDrones(next);
    emit(next);
  };

  const totalCount = localDrones.reduce((sum, d) => sum + (d.count ?? 0), 0);

  const RowFields = (d: DroneRow, index: number) => (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      {" "}
      <DisplayOrInput
        edit={edit}
        value={d.model}
        onChange={(e) => handleDroneFieldChange(index, "model", e.target.value)}
        className={`${FLEX_CLASS[DRONE_MODEL_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="機種"
      />
      <DisplayOrInput
        edit={edit}
        value={d.color}
        onChange={(e) => handleDroneFieldChange(index, "color", e.target.value)}
        className={`${FLEX_CLASS[DRONE_COLOR_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="区分"
      />
      <DisplayOrInput
        edit={edit}
        value={String(d.count ?? 0)}
        onChange={(e) => handleDroneFieldChange(index, "count", e.target.value)}
        inputMode="numeric"
        type="number"
        className={`${FLEX_CLASS[DRONE_COUNT_FLEX]} min-w-16 px-2 py-1 text-sm text-center`}
        placeholder="機体数"
      />
    </div>
  );

  return (
    <BlackCard>
      <div className="flex items-center justify-between gap-3 mb-2">
        <SectionTitle title="ドローン" />
        {edit && (
          <AddItemButton onClick={handleAddDrone} className="shrink-0" />
        )}{" "}
      </div>

      {/* スマホ：スワイプ削除 */}
      <div className="space-y-1 md:hidden">
        {localDrones.map((d, index) => (
          <SwipeableRow
            key={d.id}
            rightActionLabel="削除"
            rightAction={
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="h-full"
              >
                <DeleteItemButton
                  onClick={() => handleRemoveDrone(index)}
                  disabled={!edit || localDrones.length === 1}
                  className="!ml-0"
                  title="項目削除"
                />
              </div>
            }
            disabled={!edit}
          >
            {RowFields(d, index)}
          </SwipeableRow>
        ))}
      </div>

      <div className="space-y-1 hidden md:block">
        {localDrones.map((d, index) => (
          <div key={d.id} className="w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                <DeleteItemButton
                  onClick={() => handleRemoveDrone(index)}
                  disabled={localDrones.length === 1}
                  className={clsx(
                    "flex items-center justify-center",
                    !edit && "invisible"
                  )}
                  title="項目削除"
                />
              </div>
              {RowFields(d, index)}
            </div>
          </div>
        ))}
      </div>

      <div className="text-right mt-2 text-sm">
        合計 <span className="font-semibold">{totalCount}</span> 機
      </div>
    </BlackCard>
  );
}
