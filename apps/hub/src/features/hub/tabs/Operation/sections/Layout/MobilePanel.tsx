// src/features/hub/tabs/Operation/sections/Layout/MobilePanel.tsx
import {
  MeasureSection,
  ModuleSection,
  TableSection,
  FullscreenLayer,
  MemoSection,
} from "..";
import { SectionTitle, DividerRed } from "@/components";
import type { OperationMultiBlockViewModel } from "@/features/hub/tabs/Operation/utils/operationMultiBlockGrid";
import { OPERATION_MAX_MODULES } from "@/features/hub/tabs/Operation/constants";
import { useEffect, useState } from "react";

export function MobilePanel(props: {
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
  operationMultiBlock?: OperationMultiBlockViewModel | null;
}) {
  const {
    edit,
    full,
    setFull,
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
    operationMultiBlock,
  } = props;

  const virtualGridProps = operationMultiBlock
    ? {
        cols: operationMultiBlock.occ.gridCols,
        rows: operationMultiBlock.occ.gridRows,
        cellIdAtVisualRow: operationMultiBlock.occ.cellIdAtVisualRow,
      }
    : undefined;

  const multiBlockMeasureProps = operationMultiBlock
    ? {
        maxIdExclusive: operationMultiBlock.occ.totalOccupied,
        measureMetersFromOrigin: operationMultiBlock.measureMetersFromOrigin,
      }
    : undefined;

  const [showModules, setShowModules] = useState<boolean[]>(
    () => modules.map(() => true)
  );

  useEffect(() => {
    setShowModules((prev) => modules.map((_, i) => prev[i] ?? true));
  }, [modules.length]);

  return (
    <div className="md:hidden space-y-8">
      <section className="space-y-3">
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          totalCount={counts?.total}
          modules={modules.map((m) => ({ name: m.name, ids: m.appliedIds }))}
          showModules={showModules}
          onToggleModules={(i) =>
            setShowModules((prev) => {
              const next = [...prev];
              next[i] = !next[i];
              return next;
            })
          }
          onOpenFull={() => setFull(true)}
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
          virtualGrid={virtualGridProps}
        />
      </section>

      <FullscreenLayer
        open={full}
        onClose={() => setFull(false)}
        modules={modules.map((m, i) => ({
          title: m.name || `モジュール${i + 1}`,
          enabled: showModules[i] ?? true,
          onToggle: () =>
            setShowModules((prev) => {
              const next = [...prev];
              next[i] = !next[i];
              return next;
            }),
        }))}
      >
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          totalCount={counts?.total}
          modules={modules.map((m) => ({ name: m.name, ids: m.appliedIds }))}
          hideTitle
          hideScrollHint
          hideLegend
          showModules={showModules}
          onToggleModules={(i) =>
            setShowModules((prev) => {
              const next = [...prev];
              next[i] = !next[i];
              return next;
            })
          }
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
          virtualGrid={virtualGridProps}
        />
      </FullscreenLayer>

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
        multiBlock={multiBlockMeasureProps}
      />
      <DividerRed />

      <section>
        <SectionTitle title="モジュール" />
        {edit && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onAddModule}
              disabled={modules.length >= OPERATION_MAX_MODULES}
              className={`px-2 py-1 text-xs rounded border ${
                modules.length < OPERATION_MAX_MODULES
                  ? "border-sky-500 text-sky-100 bg-sky-900/40 hover:bg-sky-900/60"
                  : "border-slate-700 text-slate-500 bg-slate-900/40"
              }`}
            >
              + モジュール追加
            </button>
          </div>
        )}

        {modules.length === 0 && (
          <div className="text-xs text-slate-400 border border-dashed border-slate-700/80 rounded flex items-center justify-center p-6 mb-4">
            モジュールは未設定です
          </div>
        )}

        {modules.map((m, idx) => (
          <ModuleSection
            key={idx}
            edit={edit}
            moduleLabel={`モジュール${idx + 1}`}
            title={m.name}
            onTitleChange={(v) => onChangeModuleName(idx, v)}
            input={m.input}
            onInputChange={(v) => onChangeModuleInput(idx, v)}
            appliedNums={m.appliedIds}
            validationMessage={m.validationMessage}
            onNumbersBlur={(normalized) => onNumbersBlurModule(idx, normalized)}
            onRemove={() => onRemoveModule(idx)}
            showModuleLabel={false}
            className="mb-4"
          />
        ))}
        <MemoSection
          edit={edit}
          value={memoValue}
          onChange={setMemoValue}
          withCard={false}
          showTitle={false}
          label="memo"
          className="mb-3"
        />
      </section>
    </div>
  );
}
