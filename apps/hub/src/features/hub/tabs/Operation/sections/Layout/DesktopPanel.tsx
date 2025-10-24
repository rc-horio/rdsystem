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
  appliedM1: number[];
  appliedM2: number[];
  setAppliedM1: (v: number[]) => void;
  setAppliedM2: (v: number[]) => void;
  module1: {
    title: string;
    setTitle: (v: string) => void;
    input: string;
    setInput: (v: string) => void;
    onNumbersBlur?: (normalized: string) => void;
  };
  module2: {
    title: string;
    setTitle: (v: string) => void;
    input: string;
    setInput: (v: string) => void;
    onNumbersBlur?: (normalized: string) => void;
  };
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
    appliedM1,
    appliedM2,
    module1,
    module2,
    onCommitMeasurement,
    spacingXY,
    spacingSeqX,
    spacingSeqY,
  } = props;

  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-4 gap-4 items-stretch mt-2">
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

        <ModuleSection
          edit={edit}
          moduleLabel="モジュール1"
          title={module1.title}
          onTitleChange={module1.setTitle}
          input={module1.input}
          onInputChange={module1.setInput}
          appliedNums={appliedM1}
          onNumbersBlur={module1.onNumbersBlur}
        />

        <div>
          <ModuleSection
            edit={edit}
            moduleLabel="モジュール2"
            title={module2.title}
            onTitleChange={module2.setTitle}
            input={module2.input}
            onInputChange={module2.setInput}
            appliedNums={appliedM2}
            onNumbersBlur={module2.onNumbersBlur}
          />
        </div>

        <MemoSection
          edit={edit}
          value={memoValue}
          onChange={setMemoValue}
          withCard={false}
        />
      </div>
      <DividerRed />

      <section className="mt-4 m-15">
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          module1Nums={appliedM1}
          module2Nums={appliedM2}
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
        />
      </section>
    </div>
  );
}
