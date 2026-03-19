// src/features/hub/tabs/Operation/sections/Layout/DesktopPanel.tsx
import { MeasureSection, ModuleSection, TableSection, MemoSection } from "..";
import { DividerRed } from "@/components";

export function DesktopPanel(props: {
  edit: boolean;
  setEdit: (v: boolean) => void;
  full: boolean;
  setFull: (v: boolean) => void;
  grid: any;
  measure: any;
  counts?: { total?: number; x?: number; y?: number };
  memoValue: string;
  setMemoValue: (v: string) => void;
  modules: {
    name: string;
    input: string;
    appliedIds: number[];
    validationMessage?: string;
  }[];
  onAddModule: () => void;
  onRemoveModule: (index: number) => void;
  onChangeModuleName: (index: number, v: string) => void;
  onChangeModuleInput: (index: number, v: string) => void;
  onNumbersBlurModule: (index: number, normalized: string) => void;
  appliedM1: number[];
  appliedM2: number[];
  onCommitMeasurement?: (targetId: number | "", result: string | null) => void;
  spacingXY?: { x?: number | string | ""; y?: number | string | "" };
  spacingSeqX?: number[];
  spacingSeqY?: number[];
}) {
  const {
    edit,
    grid,
    measure,
    memoValue,
    counts,
    setMemoValue,
    modules,
    onAddModule,
    onRemoveModule,
    onChangeModuleName,
    onChangeModuleInput,
    onNumbersBlurModule,
    appliedM1,
    appliedM2,
    onCommitMeasurement,
    spacingXY,
    spacingSeqX,
    spacingSeqY,
  } = props;

  const moduleSlotCount = modules.length;
  const canAddMoreModules = moduleSlotCount < 5;

  return (
    <div className="hidden md:block">
      <div className="flex flex-col gap-4 mt-2">
        {/* 上ペイン：機体の計測＋memo（横並び） */}
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-stretch">
          <div className="flex flex-col">
            <MeasureSection
              {...measure}
              grid={{
                countX: grid.countX,
                countY: grid.countY,
                spacing: grid.spacing,
              }}
              counts={counts}
              onCommitMeasurement={onCommitMeasurement}
              spacingXY={spacingXY}
              spacingSeqX={spacingSeqX}
              spacingSeqY={spacingSeqY}
            />
          </div>

          <div className="flex flex-col">
            <MemoSection
              edit={edit}
              value={memoValue}
              onChange={setMemoValue}
              withCard={false}
            />
          </div>
        </div>

        {/* 下ペイン：モジュール群 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300">モジュール</p>
            <button
              type="button"
              onClick={onAddModule}
              className={`px-2 py-1 text-xs rounded border ${
                canAddMoreModules
                  ? "border-sky-500 text-sky-100 bg-sky-900/40 hover:bg-sky-900/60 cursor-pointer"
                  : "border-slate-700 text-slate-500 bg-slate-900/40 cursor-not-allowed"
              }`}
            >
              + モジュール追加
            </button>
          </div>

          <div className="grid w-full gap-3 items-stretch grid-cols-5">
            {modules.map((m, idx) => {
              const index = idx + 1; // 表示用ラベル
              return (
                <ModuleSection
                  key={`${index}-${idx}`}
                  edit={edit}
                  compact
                  moduleLabel={`モジュール${index}`}
                  title={m.name}
                  onTitleChange={(v) => onChangeModuleName(idx, v)}
                  input={m.input}
                  onInputChange={(v) => onChangeModuleInput(idx, v)}
                  appliedNums={m.appliedIds}
                  validationMessage={m.validationMessage}
                  onNumbersBlur={(normalized) =>
                    onNumbersBlurModule(idx, normalized)
                  }
                  onRemove={() =>
                    onRemoveModule(idx)
                  }
                  className="min-w-0"
                />
              );
            })}

            {modules.length === 0 && (
              <div className="col-span-5 text-xs text-slate-400 border border-dashed border-slate-700/80 rounded flex items-center justify-center p-6">
                モジュールは未設定です
              </div>
            )}
          </div>
        </div>
      </div>
      <DividerRed />

      <section className="mt-4 m-15">
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          totalCount={counts?.total}
          modules={modules.map((m) => ({ name: m.name, ids: m.appliedIds }))}
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
        />
      </section>
    </div>
  );
}
