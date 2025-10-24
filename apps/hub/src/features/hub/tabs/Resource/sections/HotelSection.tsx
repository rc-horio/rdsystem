// src/features/hub/tabs/Resource/sections/HotelSection.tsx
import { useState, useEffect } from "react";
import type { Hotel } from "@/features/hub/types/resource";
import { nanoid } from "nanoid";
import {
  BlackCard,
  SectionTitle,
  DisplayOrInput,
  AddItemButton,
  DeleteItemButton,
  ScheduleButton,
  FormModal,
  Textarea,
  SwipeableRow,
} from "@/components";
import clsx from "clsx";

/* 内部のみで使う行型（キー安定用に id を付与） */
type HotelRow = Hotel & { id: string };

/* ─────────────────────────
   ホテル詳細（統一版：スマホ=スワイプ／PC=常時ボタン）
   ───────────────────────── */
export function HotelSection({
  edit,
  hotels,
  onChange,
}: {
  edit: boolean;
  hotels: Hotel[];
  onChange: (hotels: Hotel[]) => void;
}) {
  // 初期化：最初だけ id を付与
  const initRows = (arr: Hotel[]): HotelRow[] =>
    arr.length
      ? arr.map((h) => ({ id: nanoid(), ...h }))
      : [{ id: nanoid(), name: "", memo: "" }];

  // 同期：既存 id をできるだけ継承し、新規分だけ発番（index 準拠）
  const syncRows = (prev: HotelRow[], src: Hotel[]): HotelRow[] => {
    const base = src.length ? src : [{ name: "", memo: "" }];
    return base.map((h, i) => ({
      id: prev[i]?.id ?? nanoid(),
      ...h,
    }));
  };

  // 親へ返すときは id を剥がす
  const toPlain = (arr: HotelRow[]): Hotel[] =>
    arr.map(({ id, ...rest }) => rest);

  // -------------------------
  // ローカル状態
  // -------------------------
  const [localHotels, setLocalHotels] = useState<HotelRow[]>(() =>
    initRows(hotels)
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 親からの更新を同期（id は温存）
  useEffect(() => {
    setLocalHotels((prev) => {
      const next = syncRows(prev, hotels);
      // 親更新で要素数が変わった場合、モーダルのインデックスを補正
      setSelectedIndex((p) => (p === null ? null : next[p] ? p : null));
      return next;
    });
  }, [hotels]);

  // 親に通知（emit 統一）
  const emit = (nextHotels: HotelRow[]) => onChange(toPlain(nextHotels));

  // -------------------------
  // 編集ハンドラ
  // -------------------------
  const handleHotelFieldChange = (
    index: number,
    key: keyof Hotel,
    value: string
  ) => {
    const next = [...localHotels];
    next[index] = { ...next[index], [key]: value };
    setLocalHotels(next);
    emit(next);
  };

  const handleAddHotel = () => {
    const next = [...localHotels, { id: nanoid(), name: "", memo: "" }];
    setLocalHotels(next);
    emit(next);
  };

  const handleRemoveHotel = (index: number) => {
    if (localHotels.length === 1) return; // 最低1件は維持
    const next = localHotels.filter((_, i) => i !== index);
    setLocalHotels(next);
    emit(next);
    // モーダルがこの行を見ていたら閉じる／後ろに詰める
    setSelectedIndex((prev) => {
      if (prev === null) return prev;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const openMemoModal = (index: number) => setSelectedIndex(index);
  const closeMemoModal = () => setSelectedIndex(null);

  // 前面の共通行（スマホ/PC 共用）
  const RowFields = (hotel: HotelRow, index: number) => (
    <div className="flex items-center gap-2 w-full">
      <DisplayOrInput
        edit={edit}
        value={hotel.name}
        onChange={(e) => handleHotelFieldChange(index, "name", e.target.value)}
        className="flex-1 px-2 py-1 text-sm text-center"
        placeholder="ホテル名"
      />
      <ScheduleButton
        onClick={() => openMemoModal(index)}
        className="w-8 aspect-square flex items-center justify-center"
      />{" "}
    </div>
  );

  return (
    <>
      <BlackCard>
        <div className="flex items-center justify-between gap-3 mb-2">
          <SectionTitle title="ホテル" />
          {/* 追加は常時表示（編集OFF時は非活性） */}
          {edit && (
            <AddItemButton onClick={handleAddHotel} className="shrink-0" />
          )}{" "}
        </div>

        {/* スマホ版：スワイプ削除 */}
        <div className="space-y-1 md:hidden">
          {localHotels.map((hotel, index) => (
            <SwipeableRow
              key={hotel.id}
              rightActionLabel="削除"
              rightAction={
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="h-full"
                >
                  <DeleteItemButton
                    onClick={() => handleRemoveHotel(index)}
                    disabled={!edit || localHotels.length === 1}
                    className="!ml-0"
                    title="項目削除"
                  />
                </div>
              }
              disabled={!edit}
            >
              {RowFields(hotel, index)}
            </SwipeableRow>
          ))}
        </div>

        {/* PC版：常時削除ボタン */}
        <div className="space-y-1 hidden md:block">
          {localHotels.map((hotel, index) => (
            <div key={hotel.id} className="w-full">
              <div className="flex items-center gap-2 w-full">
                {/* 固定幅スロットを常時表示 */}
                <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                  <DeleteItemButton
                    onClick={() => handleRemoveHotel(index)}
                    disabled={localHotels.length === 1}
                    className={clsx(
                      "flex items-center justify-center",
                      !edit && "invisible"
                    )}
                    title="項目削除"
                  />
                </div>
                {RowFields(hotel, index)}
              </div>
            </div>
          ))}
        </div>
      </BlackCard>

      {/* ホテルモーダル */}
      {selectedIndex !== null && localHotels[selectedIndex] && (
        <FormModal
          show
          onClose={closeMemoModal}
          onSave={closeMemoModal}
          title={localHotels[selectedIndex]?.name || ""}
        >
          <Textarea
            label="memo"
            size="md"
            inputClassName={
              edit ? undefined : "!bg-transparent !border-transparent"
            }
          >
            <textarea
              value={localHotels[selectedIndex].memo}
              onChange={(e) =>
                handleHotelFieldChange(selectedIndex, "memo", e.target.value)
              }
              readOnly={!edit}
              // ※ ここでは bg/枠線系は一切指定しない（Textarea に任せる）
              className="text-sm"
            />
          </Textarea>{" "}
        </FormModal>
      )}
    </>
  );
}
