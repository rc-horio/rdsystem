// src/features/hub/tabs/Operation/sections/Layout/MobilePanel.tsx
import {
  MeasureSection,
  ModuleSection,
  TableSection,
  FullscreenLayer,
  MemoSection,
} from "..";
import { SectionTitle, DividerRed } from "@/components";
import { useEffect, useRef, useState } from "react";

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
    full,
    setFull,
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

  const [showM1, setShowM1] = useState(true);
  const [showM2, setShowM2] = useState(true);

  const fullScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (full && fullScrollRef.current) {
      fullScrollRef.current.scrollTop = 0;
      fullScrollRef.current.scrollLeft = 0;
    }
  }, [full]);

  return (
    <div className="md:hidden space-y-8">
      <section className="space-y-3">
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          totalCount={counts?.total}
          module1Nums={appliedM1}
          module2Nums={appliedM2}
          onOpenFull={() => setFull(true)}
          showModule1={showM1}
          showModule2={showM2}
          onToggleModule1={() => setShowM1((v) => !v)}
          onToggleModule2={() => setShowM2((v) => !v)}
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
        />
      </section>

      <FullscreenLayer
        open={full}
        onClose={() => setFull(false)}
        module1Title={module1.title}
        module2Title={module2.title}
        module1Enabled={showM1}
        module2Enabled={showM2}
        onToggleModule1={() => setShowM1((v) => !v)}
        onToggleModule2={() => setShowM2((v) => !v)}
      >
        <TableSection
          countX={grid.countX}
          countY={grid.countY}
          totalCount={counts?.total}
          module1Nums={appliedM1}
          module2Nums={appliedM2}
          hideTitle
          hideScrollHint
          hideLegend
          showModule1={showM1}
          showModule2={showM2}
          onToggleModule1={() => setShowM1((v) => !v)}
          onToggleModule2={() => setShowM2((v) => !v)}
          spacingSeqX={spacingSeqX}
          spacingSeqY={spacingSeqY}
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
      />
      <DividerRed />

      <section>
        <SectionTitle title="モジュール" />
        <ModuleSection
          edit={edit}
          moduleLabel="モジュール1"
          title={module1.title}
          onTitleChange={module1.setTitle}
          input={module1.input}
          onInputChange={module1.setInput}
          appliedNums={appliedM1}
          onNumbersBlur={module1.onNumbersBlur}
          showModuleLabel={false}
          className="mb-4"
        />
        <ModuleSection
          edit={edit}
          moduleLabel="モジュール2"
          title={module2.title}
          onTitleChange={module2.setTitle}
          input={module2.input}
          onInputChange={module2.setInput}
          appliedNums={appliedM2}
          onNumbersBlur={module2.onNumbersBlur}
          showModuleLabel={false}
          className="mb-4"
        />
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
