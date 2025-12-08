import { useState, useEffect } from "react";
import {
  BlackCard,
  SectionTitle,
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  SwipeableRow,
} from "@/components";
import type { Vehicle, VehicleRow } from "@/features/hub/types/resource";
import { nanoid } from "nanoid";
import { MemoSection } from "@/components/inputs/MemoSection";
import clsx from "clsx";

/** ── 横幅比率（車両種別:運転手） ── */
const VEHICLE_TYPE_FLEX = 3;
const VEHICLE_DRIVER_FLEX = 2;

/** Tailwindのパージ対策：使用候補をリテラルで列挙して選ぶ */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

type LocalVehicleRow = VehicleRow & { id: string };

/* ─────────────────────────
   車両情報（行＝[車両種別, 運転手]）
   ───────────────────────── */
export function VehicleSection({
  edit,
  vehicles,
  onChange,
}: {
  edit: boolean;
  vehicles: Vehicle; // 期待形: { rows: { type: string; driver: string }[], memo: string }
  onChange: (t: Vehicle) => void;
}) {
  // 親→内部（id付与）
  const toLocalRows = (rows?: VehicleRow[]): LocalVehicleRow[] =>
    rows && rows.length
      ? rows.map((r) => ({ id: nanoid(), ...r }))
      : [{ id: nanoid(), type: "", driver: "" }];

  // 内部→親（id剥がす）
  const toPlainRows = (rows: LocalVehicleRow[]): VehicleRow[] =>
    rows.map(({ id, ...r }) => r);

  // -------------------------
  // ローカル状態
  // -------------------------
  const [localRows, setLocalRows] = useState<LocalVehicleRow[]>(
    toLocalRows(vehicles.rows)
  );
  const [vehicleMemo, setVehicleMemo] = useState(vehicles.memo ?? "");

  // 親→内部 同期
  const syncLocalRows = (
    prev: LocalVehicleRow[],
    rows?: VehicleRow[]
  ): LocalVehicleRow[] => {
    const base = rows && rows.length ? rows : [{ type: "", driver: "" }];
    return base.map((r, i) => ({
      id: prev[i]?.id ?? nanoid(),
      ...r,
    }));
  };

  useEffect(() => {
    setLocalRows((prev) => syncLocalRows(prev, vehicles.rows));
    setVehicleMemo(vehicles.memo ?? "");
  }, [vehicles]);

  // 親へ通知（統一）
  const emit = (next: Partial<Vehicle>) => {
    onChange({
      rows: next.rows ?? toPlainRows(localRows),
      memo: next.memo ?? vehicleMemo,
    });
  };

  // -------------------------
  // 編集ハンドラ
  // -------------------------
  const handleTypeChange = (index: number, value: string) => {
    const next = [...localRows];
    next[index].type = value;
    setLocalRows(next);
    emit({ rows: toPlainRows(next) });
  };

  const handleDriverChange = (index: number, value: string) => {
    const next = [...localRows];
    next[index].driver = value;
    setLocalRows(next);
    emit({ rows: toPlainRows(next) });
  };

  const handleAddRow = () => {
    const nextRows = [...localRows, { id: nanoid(), type: "", driver: "" }];
    setLocalRows(nextRows);
    emit({ rows: toPlainRows(nextRows) });
  };

  const handleRemoveRow = (index: number) => {
    if (localRows.length === 1) return; // 最低1行は維持
    const nextRows = localRows.filter((_, i) => i !== index);
    setLocalRows(nextRows);
    emit({ rows: toPlainRows(nextRows) });
  };

  // 共通行UI（スマホ/PC共用）
  const RowFields = (row: LocalVehicleRow, index: number) => (
    <div className="flex items-center gap-2 w-full">
      <DisplayOrInput
        edit={edit}
        value={row.type}
        onChange={(e) => handleTypeChange(index, e.target.value)}
        className={`${FLEX_CLASS[VEHICLE_TYPE_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="車両種別"
      />
      <DisplayOrInput
        edit={edit}
        value={row.driver}
        onChange={(e) => handleDriverChange(index, e.target.value)}
        className={`${FLEX_CLASS[VEHICLE_DRIVER_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
        placeholder="運転手名"
      />
    </div>
  );

  return (
    <>
      <BlackCard>
        <div className="flex items-center justify-between gap-3 mb-2">
          <SectionTitle title="車両情報" />
          {edit && (
            <AddItemButton onClick={handleAddRow} className="shrink-0" />
          )}{" "}
        </div>

        {/* =========================
             行：スマホ（md未満）→スワイプ削除
           ========================= */}
        <div className="space-y-1 md:hidden">
          {localRows.map((row, index) => (
            <SwipeableRow
              key={row.id ?? `${row.type}-${index}`}
              rightActionLabel="削除"
              rightAction={
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="h-full"
                >
                  <DeleteItemButton
                    onClick={() => handleRemoveRow(index)}
                    disabled={!edit || localRows.length === 1}
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

        {/* =========================
             行：PC（md以上）→常時削除ボタン
           ========================= */}
        <div className="space-y-1 hidden md:block">
          {localRows.map((row, index) => (
            <div key={row.id ?? `${row.type}-${index}`} className="w-full">
              <div className="flex items-center gap-2 w-full">
                {/* 固定幅スロットを常時表示 */}
                <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                  <DeleteItemButton
                    onClick={() => handleRemoveRow(index)}
                    disabled={localRows.length === 1}
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

        <MemoSection
          edit={edit}
          value={vehicleMemo}
          onChange={(v) => {
            setVehicleMemo(v);
            emit({ memo: v });
          }}
          title="memo"
          className="mt-3"
        />
      </BlackCard>
    </>
  );
}
