// src/features/hub/tabs/Resource/sections/PeopleSection.tsx
import { useState, useEffect } from "react";
import type { PeopleGroup } from "@/features/hub/types/resource";
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
  MemoSection,
} from "@/components";
import clsx from "clsx";

/** ── 横幅比率（氏名:役割） ── */
const NAME_FLEX = 3;
const ROLE_FLEX = 2;

/** ── 現地スタッフの横幅比率（役割:人数） ── */
const STAFF_ROLE_FLEX = 3;
const STAFF_COUNT_FLEX = 1;

/** Tailwindのパージ対策：使用候補をリテラルで列挙して選ぶ */
const FLEX_CLASS = {
  1: "basis-0 flex-[1]",
  2: "basis-0 flex-[2]",
  3: "basis-0 flex-[3]",
  4: "basis-0 flex-[4]",
} as const;

/* ─────────────────────────
   人員（統一版：スマホ=スワイプ／PC=常時ボタン）
   ───────────────────────── */

const DEFAULT_GROUPS: PeopleGroup[] = [
  { group: "プロデューサー", people: [{ name: "", role: "", memo: "" }] },
  { group: "ディレクター", people: [{ name: "", role: "", memo: "" }] },
  { group: "オペレーター", people: [{ name: "", role: "", memo: "" }] },
  { group: "ベテランバイト", people: [{ name: "", role: "", memo: "" }] },
  { group: "現地スタッフ", people: [{ role: "", count: 0, memo: "" }] },
];

/** 内部キー安定用の型 */
type PersonRow =
  | ({ id: string } & { name: string; role: string; memo: string })
  | ({ id: string } & { role: string; count: number; memo: string });
type PeopleGroupRow = { id: string; group: string; people: PersonRow[] };

/* ===== 親→内部：初期のみID付与（lazy init） ===== */
const initRows = (groups: PeopleGroup[]): PeopleGroupRow[] => {
  const base = groups.length ? groups : DEFAULT_GROUPS;
  return base.map((g) => ({
    id: nanoid(),
    group: g.group,
    people: g.people.map((p: any) => ({ id: nanoid(), ...p })),
  }));
};

/* ===== 同期：既存IDを温存し新規分のみ発番 ===== */
const syncRows = (
  prev: PeopleGroupRow[],
  groups: PeopleGroup[]
): PeopleGroupRow[] => {
  const base = groups.length ? groups : DEFAULT_GROUPS;

  // グループは「名前一致」優先、なければインデックスで対応
  return base.map((g, idx) => {
    const prevIdx = prev.findIndex((pg) => pg.group === g.group);
    const prevGroup = prevIdx >= 0 ? prev[prevIdx] : prev[idx];

    const prevPeople = prevGroup?.people ?? [];
    const nextPeopleSrc =
      g.people && g.people.length
        ? g.people
        : g.group === "現地スタッフ"
        ? [{ role: "", count: 0, memo: "" }]
        : [{ name: "", role: "", memo: "" }];

    const nextPeople: PersonRow[] = nextPeopleSrc.map((p: any, i: number) => ({
      id: prevPeople[i]?.id ?? nanoid(),
      ...p,
    }));

    return {
      id: prevGroup?.id ?? nanoid(),
      group: g.group,
      people: nextPeople,
    };
  });
};

/** 内部→親（id剥がす） */
const toPlain = (rows: PeopleGroupRow[]): PeopleGroup[] =>
  rows.map((g) => ({
    group: g.group,
    people: g.people.map(({ id, ...rest }) => rest as any),
  }));

export function PeopleSection({
  edit,
  people, // { groups, memo }
  onChange, // (next: { groups, memo }) => void
}: {
  edit: boolean;
  people: { groups: PeopleGroup[]; memo: string };
  onChange: (people: { groups: PeopleGroup[]; memo: string }) => void;
}) {
  const [localGroups, setLocalGroups] = useState<PeopleGroupRow[]>(() =>
    initRows(people?.groups ?? [])
  );
  const [selected, setSelected] = useState<{
    groupIndex: number;
    personIndex: number;
  } | null>(null);

  // 全体メモは people.memo をそのまま
  const [peopleMemo, setPeopleMemo] = useState<string>(people?.memo ?? "");

  // 親からの変更を同期（ID温存）
  useEffect(() => {
    setLocalGroups((prev) => {
      const next = syncRows(prev, people?.groups ?? []);
      setSelected((sel) =>
        sel && next[sel.groupIndex]?.people[sel.personIndex] ? sel : null
      );
      return next;
    });
  }, [people?.groups]);

  useEffect(() => {
    setPeopleMemo(people?.memo ?? "");
  }, [people?.memo]);

  const emit = (nextGroups: PeopleGroupRow[], memoValue: string) => {
    onChange({ groups: toPlain(nextGroups), memo: memoValue });
  };

  const handlePersonFieldChange = (
    groupIndex: number,
    personIndex: number,
    key: "name" | "role" | "memo" | "count",
    value: string
  ) => {
    const next = localGroups.map((g) => ({
      ...g,
      people: g.people.map((p) => ({ ...p })),
    }));
    const group = next[groupIndex];
    const person: any = group.people[personIndex];

    if (group.group === "現地スタッフ" && key === "count") {
      if (!/^\d*$/.test(value)) return;
      person.count = value === "" ? 0 : Number(value);
    } else {
      person[key] = value;
    }
    setLocalGroups(next);
    emit(next, peopleMemo);
  };
  const handleAddPerson = (groupIndex: number) => {
    const next = localGroups.map((g, gi) =>
      gi !== groupIndex
        ? g
        : {
            ...g,
            people: [
              ...g.people,
              g.group === "現地スタッフ"
                ? ({ id: nanoid(), role: "", count: 0, memo: "" } as PersonRow)
                : ({ id: nanoid(), name: "", role: "", memo: "" } as PersonRow),
            ],
          }
    );
    setLocalGroups(next);
    emit(next, peopleMemo);
  };

  const handleRemovePerson = (groupIndex: number, personIndex: number) => {
    const next = localGroups.map((g, gi) =>
      gi !== groupIndex
        ? g
        : { ...g, people: g.people.filter((_, pi) => pi !== personIndex) }
    );
    setLocalGroups(next);
    emit(next, peopleMemo);
    setSelected((prev) => {
      if (!prev || prev.groupIndex !== groupIndex) return prev;
      if (prev.personIndex === personIndex) return null;
      if (prev.personIndex > personIndex)
        return { groupIndex, personIndex: prev.personIndex - 1 };
      return prev;
    });
  };

  const openMemoModal = (groupIndex: number, personIndex: number) =>
    setSelected({ groupIndex, personIndex });
  const closeMemoModal = () => setSelected(null);

  const getModalTitle = () => {
    if (!selected) return "";
    const { groupIndex, personIndex } = selected;
    const g = localGroups[groupIndex];
    const p: any = g.people[personIndex];
    return g.group === "現地スタッフ"
      ? p.role || "役割未入力"
      : p.name || "氏名未入力";
  };

  const RowFields = (
    g: PeopleGroupRow,
    p: any,
    groupIndex: number,
    personIndex: number
  ) => (
    <div className="flex items-center gap-2 w-full">
      {g.group === "現地スタッフ" ? (
        <>
          <DisplayOrInput
            edit={edit}
            value={p.role ?? ""}
            onChange={(e) =>
              handlePersonFieldChange(
                groupIndex,
                personIndex,
                "role",
                e.target.value
              )
            }
            className={`${FLEX_CLASS[STAFF_ROLE_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
            placeholder="役割"
          />
          <DisplayOrInput
            edit={edit}
            value={String(p.count ?? 0)}
            onChange={(e) =>
              handlePersonFieldChange(
                groupIndex,
                personIndex,
                "count",
                e.target.value
              )
            }
            inputMode="numeric"
            type="number"
            className={`${FLEX_CLASS[STAFF_COUNT_FLEX]} min-w-16 text-center px-2 py-1 text-sm`}
            placeholder="人数"
          />
        </>
      ) : (
        <>
          <DisplayOrInput
            edit={edit}
            value={p.name ?? ""}
            onChange={(e) =>
              handlePersonFieldChange(
                groupIndex,
                personIndex,
                "name",
                e.target.value
              )
            }
            className={`${FLEX_CLASS[NAME_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
            placeholder="氏名"
          />
          <DisplayOrInput
            edit={edit}
            value={p.role ?? ""}
            onChange={(e) =>
              handlePersonFieldChange(
                groupIndex,
                personIndex,
                "role",
                e.target.value
              )
            }
            className={`${FLEX_CLASS[ROLE_FLEX]} min-w-0 px-2 py-1 text-sm text-center`}
            placeholder="役割"
          />
        </>
      )}

      <ScheduleButton
        onClick={() => openMemoModal(groupIndex, personIndex)}
        className="w-8 aspect-square flex items-center justify-center"
      />
    </div>
  );

  return (
    <>
      <BlackCard>
        {localGroups.map((group, groupIndex) => (
          <div key={group.id} className="mb-4">
            {/* タイトル行の右端に「追加」ボタンを配置 */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <SectionTitle title={group.group} />
              {edit && (
                <AddItemButton
                  onClick={() => handleAddPerson(groupIndex)}
                  className="shrink-0"
                />
              )}{" "}
            </div>

            {/* スマホ版：スワイプ削除 */}
            <div className="space-y-1 md:hidden">
              {group.people.map((p: any, personIndex: number) => (
                <SwipeableRow
                revealWidth={56}
                  key={(p as PersonRow).id}
                  rightActionLabel="削除"
                  rightAction={
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="h-full"
                    >
                      <DeleteItemButton
                        onClick={() =>
                          handleRemovePerson(groupIndex, personIndex)
                        }
                        disabled={!edit || group.people.length === 1}
                        className="!ml-0"
                        title="項目削除"
                      />
                    </div>
                  }
                  disabled={!edit}
                >
                  {RowFields(group, p, groupIndex, personIndex)}
                </SwipeableRow>
              ))}
            </div>

            {/* PC版：常時削除ボタン */}
            <div className="space-y-1 hidden md:block">
              {group.people.map((p: any, personIndex: number) => (
                <div key={(p as PersonRow).id} className="w-full">
                  <div className="flex items-center gap-2 w-full">
                    {/* 常に描画して幅を固定。edit=false でも invisible で占有 */}
                    <div className="ml-auto w-8 shrink-0 flex items-center justify-center">
                      <DeleteItemButton
                        onClick={() =>
                          handleRemovePerson(groupIndex, personIndex)
                        }
                        disabled={group.people.length === 1}
                        className={clsx(
                          "flex items-center justify-center",
                          !edit && "invisible" // 枠は残すが中身は見せない
                        )}
                        title="項目削除"
                      />
                    </div>{" "}
                    {RowFields(group, p, groupIndex, personIndex)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 人員全体メモ */}
        <MemoSection
          edit={edit}
          value={peopleMemo}
          onChange={(v) => {
            setPeopleMemo(v);
            emit(localGroups, v);
          }}
          title="memo"
          className="mt-3"
        />
      </BlackCard>

      {/* スタッフメモモーダル */}
      {selected &&
        localGroups[selected.groupIndex]?.people[selected.personIndex] && (
          <FormModal
            show
            onClose={closeMemoModal}
            onSave={closeMemoModal}
            title={getModalTitle()}
          >
            <Textarea
              label="memo"
              size="md"
              inputClassName={
                edit ? undefined : "!bg-transparent !border-transparent"
              }
            >
              <textarea
                value={
                  (
                    localGroups[selected.groupIndex].people[
                      selected.personIndex
                    ] as any
                  ).memo ?? ""
                }
                onChange={(e) =>
                  handlePersonFieldChange(
                    selected.groupIndex,
                    selected.personIndex,
                    "memo",
                    e.target.value
                  )
                }
                readOnly={!edit}
                className="text-sm"
              />
            </Textarea>{" "}
          </FormModal>
        )}
    </>
  );
}
