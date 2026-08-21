// features/hub/tabs/AreaInfo/sections/MultiBlockEditModal.tsx
// 複数ブロック編集モーダル（Phase 2-1: UI 構築）

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Drone2Icon,
} from "@/components";
import { buildLandingFigureModel } from "@/features/hub/tabs/AreaInfo/figure/landingFigureModel";
import { buildLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/buildLandingFigureSvg";
import { buildMultiBlockLandingFigureSvg } from "@/features/hub/tabs/AreaInfo/figure/multiBlockLandingFigureSvg";
import { getEffectiveBlocks } from "@/features/hub/utils/areaBlocks";
import {
  fmtMeters,
  gapOptionsFrom,
  isValidGapFrom,
} from "@/features/hub/utils/spacing";
import {
  adjacentBetweenRowGapM,
  adjacentRowGapM,
  computeLayoutGapAnchors,
} from "@/features/hub/utils/blockGapPattern";
import { LandingFigureHtml } from "./LandingFigureHtml";
import type { Block, BlockLayout, BlockLayoutRow, Area } from "@/features/hub/types/resource";

const BLOCK_LABELS = "ABCDEFGHIJ".split("");
const BLOCK_COUNT_MAX = 10;
const BLOCK_COUNT_MAX_DIGITS = 5;
const BLOCK_SIDE_MAX_DIGITS = 4;
const MAX_SPACING_GAPS = 8;
const SPACING_INPUT_W_PX = 52;
const MODAL_DRONE_ICON_PX = 24;
const MODAL_DRONE_GAP_PX = 48;

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function digitCount(n: number): number {
  return Math.abs(Math.trunc(n)).toString().length;
}

function isOverDigitLimit(raw: string, limit: number): boolean {
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  return digitsOnly.length > limit;
}

function isOverCharLimit(raw: string, limit: number): boolean {
  return raw.length > limit;
}

function hasMinusSign(raw: string): boolean {
  return raw.includes("-");
}

function reassignBlocksFromCounts(
  blocks: Block[],
  rows: BlockLayoutRow[],
  prevGapsBetweenRowsM: number[],
  seqX: number[],
  seqY: number[]
): { rows: BlockLayoutRow[]; gapsBetweenRowsM: number[] } {
  const blockIdsInOrder = blocks.map((b) => b.id);
  const counts = rows.map((r) => r.block_ids.length);
  const totalBlocks = blockIdsInOrder.length;
  const seqXeff = seqX.length ? seqX : [1];
  const seqYeff = seqY.length ? seqY : [1];

  // 合計個数が blocks の長さと異なる場合は、最後の行で調整
  const sumCounts = counts.reduce((a, b) => a + b, 0);
  const adjustedCounts = [...counts];
  if (totalBlocks !== sumCounts && adjustedCounts.length > 0) {
    const others = adjustedCounts.slice(0, -1).reduce((a, b) => a + b, 0);
    adjustedCounts[adjustedCounts.length - 1] = Math.max(0, totalBlocks - others);
  }

  let idx = 0;
  const newRows: BlockLayoutRow[] = adjustedCounts.map((n, rowIndex) => {
    const ids = blockIdsInOrder.slice(idx, idx + n);
    idx += n;
    const prevGaps = rows[rowIndex]?.gaps_m ?? [];
    const neededGaps = Math.max(0, ids.length - 1);
    const gaps: number[] = [];
    let col = 0;
    for (let i = 0; i < ids.length; i++) {
      const b = blocks.find((x) => x.id === ids[i]);
      col += Math.max(0, Math.trunc(Number(b?.x_count) || 0));
      if (i < neededGaps) {
        const fromIndex = Math.max(0, col - 1);
        const prev = prevGaps[i];
        gaps.push(
          Number.isFinite(prev) ? prev : adjacentRowGapM(seqXeff, fromIndex)
        );
      }
    }
    return { block_ids: ids, gaps_m: gaps };
  });

  const neededBetween = Math.max(0, newRows.length - 1);
  const anchors = computeLayoutGapAnchors(
    newRows,
    blocks,
    seqXeff,
    seqYeff,
    prevGapsBetweenRowsM,
    1
  );
  const gapsBetweenRowsM =
    neededBetween > 0
      ? Array.from({ length: neededBetween }, (_, i) => {
          const prev = prevGapsBetweenRowsM[i];
          if (Number.isFinite(prev)) return prev;
          const fromIndex = anchors.betweenRowFromIndex[i] ?? anchors.appendRowFromIndex;
          return adjacentBetweenRowGapM(seqYeff, fromIndex);
        })
      : [];

  return { rows: newRows, gapsBetweenRowsM };
}

function isValidSpacingValue(v: number): boolean {
  if (!Number.isFinite(v)) return false;
  if (v <= 0 || v > 999) return false;
  // 小数第1位まで
  return Math.round(v * 10) === v * 10;
}

function isGapValueHardError(gap: number): boolean {
  if (!Number.isFinite(gap)) return true;
  if (gap < 0 || gap > 999) return true;
  return false;
}

function GapMetersInput({
  value,
  options,
  onChange,
  warn,
  className,
  unitClassName,
}: {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  warn: boolean;
  className: string;
  unitClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const current = Number.isFinite(value) ? String(value) : "";
  const display = draft ?? current;

  const closeAndCommit = () => {
    setOpen(false);
    if (draft === null) return;
    if (draft === "") {
      onChange(NaN);
    } else {
      const num = Number(draft);
      if (Number.isFinite(num)) onChange(num);
    }
    setDraft(null);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeAndCommit();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, draft]);

  return (
    <span ref={rootRef} className="relative flex items-center gap-0.5">
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          if (hasMinusSign(raw) || isOverCharLimit(raw, 5)) return;
          setDraft(raw);
          if (raw === "") {
            onChange(NaN);
            return;
          }
          // "0." など入力途中は数値化せず、小数点を残す
          if (raw === "." || /\.$/.test(raw)) return;
          const num = Number(raw);
          if (Number.isFinite(num)) onChange(num);
        }}
        onFocus={() => {
          setDraft(current);
          setOpen(true);
        }}
        onBlur={() => {
          // 候補クリックは preventDefault 済み。フォーカスが外れたときだけ確定
          if (draft !== null) {
            if (draft === "") onChange(NaN);
            else {
              const num = Number(draft);
              if (Number.isFinite(num)) onChange(num);
            }
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") closeAndCommit();
        }}
        className={`${className} ${warn ? "border-red-500" : ""}`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        title="候補から選ぶか、直接入力できます"
      />
      {open && options.length > 0 && (
        <ul
          className="absolute left-0 top-full z-30 mt-0.5 max-h-48 min-w-full overflow-y-auto rounded border border-slate-500 bg-slate-800 py-0.5 shadow-lg"
          role="listbox"
        >
          {options.map((m) => {
            const label = fmtMeters(m);
            const selected = display === label || display === String(m);
            return (
              <li key={label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`block w-full px-2 py-0.5 text-left text-xs text-slate-100 hover:bg-slate-600 ${
                    selected ? "bg-slate-700" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(m);
                    setDraft(null);
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <span className={unitClassName}>m</span>
    </span>
  );
}

function generateBlockId(): string {
  return crypto.randomUUID();
}

type CornerDisplayForBlock = {
  fontSize: number;
  placement: "inside" | "outside";
  outsideHorizontal: boolean; // TL/BL と TR/BR の横側を外側へ
  outsideVertical: boolean; // TL/TR と BL/BR の縦側を外側へ
};

function defaultCornerDisplay(): CornerDisplayForBlock {
  return {
    fontSize: 10,
    placement: "inside",
    outsideHorizontal: true,
    outsideVertical: true,
  };
}

type ModalState = {
  blocks: Block[];
  rows: BlockLayoutRow[];
  gapsBetweenRowsM: number[];
  spacingHorizontal: number[];
  spacingVertical: number[];
  spacingUnequal: boolean;
  /** ブロック ID ごとの四隅機体番号表示 */
  cornerDisplayByBlockId: Record<string, CornerDisplayForBlock>;
  rulerDisplay: {
    /** 左側メモリ（縦寸法線）の横方向オフセット（px） */
    leftXOffsetPx: number;
    /** 下側メモリ（横寸法線）の縦方向オフセット（px） */
    bottomYOffsetPx: number;
  };
  showCornerNumbers: boolean;
  showBlockLabels: boolean;
  showRuler: boolean;
};

function initialStateFromArea(area: Area | null | undefined): ModalState {
  const effectiveBlocks = getEffectiveBlocks(area);
  const existingLayout = area?.block_layout;
  const rows: BlockLayoutRow[] = existingLayout?.rows?.length
    ? existingLayout.rows.map((r) => ({
        block_ids: [...(r.block_ids ?? [])],
        gaps_m: [...(r.gaps_m ?? [])],
      }))
    : effectiveBlocks.length > 0
      ? [{ block_ids: effectiveBlocks.map((b) => b.id), gaps_m: [] }]
      : [{ block_ids: [], gaps_m: [] }];
  const gapsBetweenRowsM = existingLayout?.gaps_between_rows_m?.length
    ? [...existingLayout.gaps_between_rows_m]
    : [];
  const parseSpacing = (s: string): number[] => {
    if (!s || typeof s !== "string") return [1];
    return s
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  };
  const h = area?.spacing_between_drones_m?.horizontal ?? "1";
  const v = area?.spacing_between_drones_m?.vertical ?? "1";
  const spacingHorizontal = parseSpacing(h);
  const spacingVertical = parseSpacing(v);
  if (spacingHorizontal.length === 0) spacingHorizontal.push(1);
  if (spacingVertical.length === 0) spacingVertical.push(1);
  const spacingUnequal =
    (area as any)?.spacing_between_drones_m?.unequal === true ||
    spacingHorizontal.length > 1 ||
    spacingVertical.length > 1;

  const savedDisplay = (area as any)?.landing_figure_display ?? {};
  const savedCornerByBlockId =
    (savedDisplay.corner_by_block_id as Record<string, Partial<CornerDisplayForBlock>> | undefined) ??
    {};
  const savedRuler = (savedDisplay.ruler as
    | { leftXOffsetPx?: number; bottomYOffsetPx?: number }
    | undefined) ?? {
    leftXOffsetPx: 0,
    bottomYOffsetPx: 0,
  };
  const savedShowCornerNumbers = savedDisplay.show_corner_numbers;
  const savedShowBlockLabels = savedDisplay.show_block_labels;
  const savedShowRuler = savedDisplay.show_ruler;

  const cornerDisplayByBlockId: Record<string, CornerDisplayForBlock> = {};
  const cd0 = defaultCornerDisplay();
  for (const b of effectiveBlocks) {
    const saved = savedCornerByBlockId[b.id] ?? {};
    cornerDisplayByBlockId[b.id] = {
      ...cd0,
      ...saved,
    };
  }

  return {
    blocks: effectiveBlocks.map((b) => ({ ...b })),
    rows,
    gapsBetweenRowsM,
    spacingHorizontal,
    spacingVertical,
    spacingUnequal,
    cornerDisplayByBlockId,
    rulerDisplay: {
      leftXOffsetPx: Number.isFinite(savedRuler.leftXOffsetPx) ? Number(savedRuler.leftXOffsetPx) : 0,
      bottomYOffsetPx: Number.isFinite(savedRuler.bottomYOffsetPx) ? Number(savedRuler.bottomYOffsetPx) : 0,
    },
    showCornerNumbers:
      typeof savedShowCornerNumbers === "boolean" ? savedShowCornerNumbers : true,
    showBlockLabels:
      typeof savedShowBlockLabels === "boolean" ? savedShowBlockLabels : true,
    showRuler: typeof savedShowRuler === "boolean" ? savedShowRuler : true,
  };
}

type Props = {
  show: boolean;
  onClose: () => void;
  onDecide?: (area: Area) => void;
  area: Area | null;
  focusedBlockId?: string | null;
  /** false のときは閲覧のみ（入力・決定不可） */
  edit?: boolean;
};

export function MultiBlockEditModal({
  show,
  onClose,
  onDecide,
  area,
  focusedBlockId,
  edit = true,
}: Props) {
  const [state, setState] = useState<ModalState>(() => initialStateFromArea(area));
  /** 図用スナップショット。「図を更新」押下時のみ更新。入力中は即時反映せずフリーズ防止 */
  const [committedForFigure, setCommittedForFigure] = useState<ModalState | null>(null);
  const [isDisplayPanelOpen, setIsDisplayPanelOpen] = useState(false);
  const [selectedCornerBlockId, setSelectedCornerBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      const initial = initialStateFromArea(area);
      setState(initial);
      setCommittedForFigure(JSON.parse(JSON.stringify(initial)));
      setIsDisplayPanelOpen(false);
      const prefer =
        focusedBlockId &&
        initial.blocks.some((b) => b.id === focusedBlockId)
          ? focusedBlockId
          : initial.blocks[0]?.id ?? null;
      setSelectedCornerBlockId(prefer);
    }
  }, [show, area, focusedBlockId]);

  useEffect(() => {
    if (show) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [show]);

  /** 左側の図はスナップショットのみ参照。入力中は即時反映せずフリーズ防止 */
  const figureSource: ModalState = committedForFigure ?? state;
  const areaForPreview: Area = {
    ...(area ?? ({} as Area)),
    blocks: figureSource.blocks,
    block_layout: {
      rows: figureSource.rows,
      gaps_between_rows_m: figureSource.gapsBetweenRowsM,
    },
    spacing_between_drones_m: {
      horizontal: figureSource.spacingHorizontal.join(","),
      vertical: figureSource.spacingVertical.join(","),
      unequal: figureSource.spacingUnequal,
    },
    drone_count: figureSource.blocks[0]
      ? {
          model: (area?.drone_count as any)?.model ?? "",
          count: figureSource.blocks[0].count,
          x_count: figureSource.blocks[0].x_count,
          y_count: figureSource.blocks[0].y_count,
        } as any
      : (area?.drone_count ?? { model: "", count: 0 }),
  };

  const m = buildLandingFigureModel(areaForPreview);

  const cornerByBlockIdForPreview = Object.fromEntries(
    state.blocks.map((b) => {
      const d = state.cornerDisplayByBlockId[b.id] ?? defaultCornerDisplay();
      return [
        b.id,
        {
          fontSize: d.fontSize,
          placement: d.placement,
          outsideHorizontal: d.outsideHorizontal,
          outsideVertical: d.outsideVertical,
        },
      ] as const;
    })
  );

  const svgForPreview =
    figureSource.blocks.length > 1
      ? buildMultiBlockLandingFigureSvg(
          {
            ...(areaForPreview as any),
            blocks: figureSource.blocks,
            block_layout: {
              rows: figureSource.rows,
              gaps_between_rows_m: figureSource.gapsBetweenRowsM,
            },
          } as any,
          {
            theme: "ui",
            showCornerNumbers: state.showCornerNumbers,
            showBlockLabels: state.showBlockLabels,
            showRuler: state.showRuler,
            cornerByBlockId: cornerByBlockIdForPreview,
            ruler: {
              leftXOffsetPx: state.rulerDisplay.leftXOffsetPx,
              bottomYOffsetPx: state.rulerDisplay.bottomYOffsetPx,
            },
          }
        )
      : buildLandingFigureSvg(areaForPreview, {
          theme: "ui",
          showCornerNumbers: state.showCornerNumbers,
          showRuler: state.showRuler,
          cornerDisplay:
            figureSource.blocks[0] &&
            state.cornerDisplayByBlockId[figureSource.blocks[0].id]
              ? state.cornerDisplayByBlockId[figureSource.blocks[0].id]
              : defaultCornerDisplay(),
          ruler: {
            leftXOffsetPx: state.rulerDisplay.leftXOffsetPx,
            bottomYOffsetPx: state.rulerDisplay.bottomYOffsetPx,
          },
        });

  const addBlock = useCallback(() => {
    setState((prev) => {
      if (prev.blocks.length >= BLOCK_COUNT_MAX) return prev;
      const id = generateBlockId();
      const newBlock: Block = {
        id,
        x_count: 10,
        y_count: 10,
        count: 100,
      };
      const blocks = [...prev.blocks, newBlock];
      const rows = [...prev.rows];
      if (rows.length === 0) {
        rows.push({ block_ids: [id], gaps_m: [] });
      } else {
        const last = rows[rows.length - 1];
        const anchors = computeLayoutGapAnchors(
          prev.rows,
          prev.blocks,
          prev.spacingHorizontal,
          prev.spacingVertical,
          prev.gapsBetweenRowsM
        );
        const fromIndex = anchors.rowAppendFromIndex[prev.rows.length - 1] ?? 0;
        rows[rows.length - 1] = {
          block_ids: [...last.block_ids, id],
          gaps_m: [...last.gaps_m, adjacentRowGapM(prev.spacingHorizontal, fromIndex)],
        };
      }
      const { rows: normalizedRows, gapsBetweenRowsM } = reassignBlocksFromCounts(
        blocks,
        rows,
        prev.gapsBetweenRowsM,
        prev.spacingHorizontal,
        prev.spacingVertical
      );
      const template =
        prev.blocks.length > 0
          ? prev.cornerDisplayByBlockId[prev.blocks[0].id] ?? defaultCornerDisplay()
          : defaultCornerDisplay();
      return {
        ...prev,
        blocks,
        rows: normalizedRows,
        gapsBetweenRowsM,
        cornerDisplayByBlockId: {
          ...prev.cornerDisplayByBlockId,
          [id]: { ...template },
        },
      };
    });
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setState((prev) => {
      const blocks = prev.blocks.filter((b) => b.id !== blockId);
      const rows = prev.rows.map((r) => ({
        block_ids: r.block_ids.filter((id) => id !== blockId),
        gaps_m: r.gaps_m,
      })).filter((r) => r.block_ids.length > 0);
      if (rows.length === 0 && blocks.length > 0) {
        rows.push({ block_ids: [blocks[0].id], gaps_m: [] });
      }
      const baseGaps =
        rows.length < prev.rows.length
          ? prev.gapsBetweenRowsM.slice(0, Math.max(0, rows.length - 1))
          : prev.gapsBetweenRowsM;
      const { rows: normalizedRows, gapsBetweenRowsM } = reassignBlocksFromCounts(
        blocks,
        rows,
        baseGaps,
        prev.spacingHorizontal,
        prev.spacingVertical
      );
      const cornerDisplayByBlockId = { ...prev.cornerDisplayByBlockId };
      delete cornerDisplayByBlockId[blockId];
      return { ...prev, blocks, rows: normalizedRows, gapsBetweenRowsM, cornerDisplayByBlockId };
    });
  }, []);

  const addRow = useCallback(() => {
    setState((prev) => {
      const totalBlocks = prev.rows.flatMap((r) => r.block_ids).length;
      const newRowCount = prev.rows.length + 1;
      const rowCountMax = Math.min(BLOCK_COUNT_MAX, prev.blocks.length);
      if (newRowCount > rowCountMax) return prev;

      // まだどの行にも割り当てられていないブロックIDを特定
      const assigned = new Set(prev.rows.flatMap((r) => r.block_ids));
      const unassigned = prev.blocks
        .map((b) => b.id)
        .filter((id) => !assigned.has(id));

      let rows = [...prev.rows];
      const anchors = computeLayoutGapAnchors(
        prev.rows,
        prev.blocks,
        prev.spacingHorizontal,
        prev.spacingVertical,
        prev.gapsBetweenRowsM
      );
      let gapsBetweenRowsM = [
        ...prev.gapsBetweenRowsM,
        adjacentBetweenRowGapM(prev.spacingVertical, anchors.appendRowFromIndex),
      ];

      if (unassigned.length > 0) {
        // 未割り当てブロックがあれば、それを新しい行に配置
        const newRow: BlockLayoutRow = { block_ids: [unassigned[0]], gaps_m: [] };
        rows = [...prev.rows, newRow];
      } else {
        // 2個以上のブロックがある行を末尾から探し、そこから1つ移す
        let sourceIndex = -1;
        for (let i = prev.rows.length - 1; i >= 0; i--) {
          if (prev.rows[i].block_ids.length >= 2) {
            sourceIndex = i;
            break;
          }
        }
        if (sourceIndex < 0) return prev;

        const sourceRow = prev.rows[sourceIndex];
        const movedBlockId = sourceRow.block_ids[sourceRow.block_ids.length - 1];
        const modifiedSourceRow: BlockLayoutRow = {
          block_ids: sourceRow.block_ids.slice(0, -1),
          gaps_m: sourceRow.gaps_m.slice(0, -1),
        };
        const newRow: BlockLayoutRow = { block_ids: [movedBlockId], gaps_m: [] };

        rows = prev.rows.map((r, i) =>
          i === sourceIndex ? modifiedSourceRow : r
        );
        rows.push(newRow);
      }

      const { rows: normalizedRows, gapsBetweenRowsM: normalizedGaps } =
        reassignBlocksFromCounts(
          prev.blocks,
          rows,
          gapsBetweenRowsM,
          prev.spacingHorizontal,
          prev.spacingVertical
        );
      return { ...prev, rows: normalizedRows, gapsBetweenRowsM: normalizedGaps };
    });
  }, []);

  const removeRow = useCallback((rowIndex: number) => {
    setState((prev) => {
      if (prev.rows.length <= 1) return prev;
      const removedRow = prev.rows[rowIndex];
      const rows = prev.rows.filter((_, i) => i !== rowIndex);
      const gaps = prev.gapsBetweenRowsM.filter((_, i) => i !== rowIndex);
      if (removedRow.block_ids.length > 0 && rows.length > 0) {
        rows[0] = {
          block_ids: [...rows[0].block_ids, ...removedRow.block_ids],
          gaps_m: rows[0].gaps_m,
        };
      }
      const { rows: normalizedRows, gapsBetweenRowsM } = reassignBlocksFromCounts(
        prev.blocks,
        rows,
        gaps,
        prev.spacingHorizontal,
        prev.spacingVertical
      );
      return { ...prev, rows: normalizedRows, gapsBetweenRowsM };
    });
  }, []);

  const updateBlock = useCallback((blockId: string, patch: Partial<Block>) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, ...patch } : b
      ),
    }));
  }, []);

  const addSpacingHorizontal = useCallback(() => {
    setState((prev) => {
      if (prev.spacingHorizontal.length >= MAX_SPACING_GAPS) return prev;
      const last = prev.spacingHorizontal[prev.spacingHorizontal.length - 1] ?? 1;
      return {
        ...prev,
        spacingUnequal: true,
        spacingHorizontal: [...prev.spacingHorizontal, last],
      };
    });
  }, []);

  const addSpacingVertical = useCallback(() => {
    setState((prev) => {
      if (prev.spacingVertical.length >= MAX_SPACING_GAPS) return prev;
      const last = prev.spacingVertical[prev.spacingVertical.length - 1] ?? 1;
      return {
        ...prev,
        spacingUnequal: true,
        spacingVertical: [...prev.spacingVertical, last],
      };
    });
  }, []);

  const removeSpacingHorizontal = useCallback(() => {
    setState((prev) => {
      if (prev.spacingHorizontal.length <= 1) return prev;
      return {
        ...prev,
        spacingUnequal: true,
        spacingHorizontal: prev.spacingHorizontal.slice(0, -1),
      };
    });
  }, []);

  const removeSpacingVertical = useCallback(() => {
    setState((prev) => {
      if (prev.spacingVertical.length <= 1) return prev;
      return {
        ...prev,
        spacingUnequal: true,
        spacingVertical: prev.spacingVertical.slice(0, -1),
      };
    });
  }, []);

  const updateSpacingHorizontal = useCallback((index: number, value: number) => {
    setState((prev) => {
      const arr = [...prev.spacingHorizontal];
      arr[index] = value;
      return { ...prev, spacingHorizontal: arr };
    });
  }, []);

  const updateSpacingVertical = useCallback((index: number, value: number) => {
    setState((prev) => {
      const arr = [...prev.spacingVertical];
      arr[index] = value;
      return { ...prev, spacingVertical: arr };
    });
  }, []);

  const setSpacingUnequal = useCallback((next: boolean) => {
    if (next) {
      setState((prev) => ({ ...prev, spacingUnequal: true }));
      return;
    }
    const ok = window.confirm(
      "不等間隔をオフにすると、追加した間隔の入力は先頭の1件だけ残して削除されます。よろしいですか？"
    );
    if (!ok) return;
    setState((prev) => ({
      ...prev,
      spacingUnequal: false,
      spacingHorizontal: [prev.spacingHorizontal[0] ?? 1],
      spacingVertical: [prev.spacingVertical[0] ?? 1],
    }));
  }, []);

  const updateRowGap = useCallback((rowIndex: number, gapIndex: number, value: number) => {
    setState((prev) => {
      const rows = prev.rows.map((r, i) => {
        if (i !== rowIndex) return r;
        const gaps = [...r.gaps_m];
        gaps[gapIndex] = value;
        return { ...r, gaps_m: gaps };
      });
      return { ...prev, rows };
    });
  }, []);

  const updateGapBetweenRows = useCallback((index: number, value: number) => {
    setState((prev) => {
      const arr = [...prev.gapsBetweenRowsM];
      arr[index] = value;
      return { ...prev, gapsBetweenRowsM: arr };
    });
  }, []);

  const updateCornerDisplayForBlock = useCallback(
    (blockId: string, patch: Partial<CornerDisplayForBlock>) => {
      setState((prev) => ({
        ...prev,
        cornerDisplayByBlockId: {
          ...prev.cornerDisplayByBlockId,
          [blockId]: {
            ...defaultCornerDisplay(),
            ...prev.cornerDisplayByBlockId[blockId],
            ...patch,
          },
        },
      }));
    },
    []
  );

  const updateRulerDisplay = useCallback(
    (patch: Partial<ModalState["rulerDisplay"]>) => {
      setState((prev) => ({
        ...prev,
        rulerDisplay: { ...prev.rulerDisplay, ...patch },
      }));
    },
    []
  );

  const updateFigureVisibility = useCallback(
    (
      patch: Partial<
        Pick<ModalState, "showCornerNumbers" | "showBlockLabels" | "showRuler">
      >
    ) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleDecide = useCallback(() => {
    // 決定時は常に最新の入力値（state）から Area を組み立てて親に渡す
    const base: Area = {
      ...(area ?? ({} as Area)),
      spacing_between_drones_m: {
        horizontal: state.spacingHorizontal.join(","),
        vertical: state.spacingVertical.join(","),
        unequal: state.spacingUnequal,
      },
    };

    const figureDisplay = {
      show_corner_numbers: state.showCornerNumbers,
      show_block_labels: state.showBlockLabels,
      show_ruler: state.showRuler,
      corner_by_block_id: state.cornerDisplayByBlockId,
      ruler: {
        leftXOffsetPx: state.rulerDisplay.leftXOffsetPx,
        bottomYOffsetPx: state.rulerDisplay.bottomYOffsetPx,
      },
    };

    let nextArea: Area;

    if (state.blocks.length === 1) {
      // blocks が 1 件のときは単一ブロック形式に正規化（drone_count に変換し blocks / block_layout は持たない）
      const b = state.blocks[0];
      nextArea = {
        ...base,
        drone_count: {
          model: (area?.drone_count as any)?.model ?? "",
          count: b.count,
          x_count: b.x_count,
          y_count: b.y_count,
        } as any,
        // blocks / block_layout は parent のマージ時に上書きされないように明示的に undefined にしておく
        blocks: undefined,
        block_layout: undefined,
        landing_figure_display: figureDisplay as any,
      } as Area;
    } else {
      // 複数ブロック時は blocks / block_layout を正とし、従来の drone_count は無効化する
      nextArea = {
        ...base,
        blocks: state.blocks,
        block_layout: {
          rows: state.rows,
          gaps_between_rows_m: state.gapsBetweenRowsM,
        },
        drone_count: undefined as any,
        landing_figure_display: figureDisplay as any,
      } as Area;
    }

    onDecide?.(nextArea);
    onClose();
  }, [area, onDecide, onClose, state]);

  const activeCornerBlockId =
    selectedCornerBlockId != null &&
    state.blocks.some((b) => b.id === selectedCornerBlockId)
      ? selectedCornerBlockId
      : state.blocks[0]?.id ?? null;
  const cornerDisplayEditing =
    activeCornerBlockId != null
      ? state.cornerDisplayByBlockId[activeCornerBlockId] ?? defaultCornerDisplay()
      : defaultCornerDisplay();

  if (!show) return null;

  // ---- バリデーション（Phase 2b） ----
  // 入力中は即時反映させず、「図を更新」押下時にスナップショット（figureSource）を元に判定する
  // ブロックごとの入力チェック（右ペインの入力 UI は常に state 基準）
  const blockErrors = state.blocks.map((b) => {
    const x = Number(b.x_count);
    const y = Number(b.y_count);
    const c = Number(b.count);
    const xOk = isPositiveInt(x) && digitCount(x) <= BLOCK_SIDE_MAX_DIGITS;
    const yOk = isPositiveInt(y) && digitCount(y) <= BLOCK_SIDE_MAX_DIGITS;
    const cOk = isPositiveInt(c) && digitCount(c) <= BLOCK_COUNT_MAX_DIGITS;
    return {
      xOk,
      yOk,
      cOk,
    };
  });

  // 機体間隔のバリデーション
  const invalidSpacingHorizontal = figureSource.spacingHorizontal.map((v) => !isValidSpacingValue(v));
  const invalidSpacingVertical = figureSource.spacingVertical.map((v) => !isValidSpacingValue(v));

  // 累積和パターン用の spacing が未入力 / 不正な場合フラグを立てる
  const spacingPatternIncomplete =
    !figureSource.spacingHorizontal.length ||
    !figureSource.spacingVertical.length ||
    invalidSpacingHorizontal.some(Boolean) ||
    invalidSpacingVertical.some(Boolean);

  // ブロック間隔：入力値の不正は決定不可。パターン外れは警告のみ（自由入力を許容）
  const layoutAnchors = computeLayoutGapAnchors(
    state.rows,
    state.blocks,
    state.spacingHorizontal,
    state.spacingVertical,
    state.gapsBetweenRowsM
  );
  const rowGapHardErrors: Record<string, boolean> = {};
  const rowGapOffPattern: Record<string, boolean> = {};
  state.rows.forEach((row, rowIndex) => {
    row.gaps_m.forEach((gap, gapIndex) => {
      const key = `${rowIndex}-${gapIndex}`;
      rowGapHardErrors[key] = isGapValueHardError(gap);
      const fromIndex = layoutAnchors.rowGapFromIndex[rowIndex]?.[gapIndex] ?? 0;
      rowGapOffPattern[key] =
        !rowGapHardErrors[key] &&
        !spacingPatternIncomplete &&
        !isValidGapFrom(gap, state.spacingHorizontal, fromIndex);
    });
  });

  const betweenRowGapHardErrors = state.gapsBetweenRowsM.map((gap) =>
    isGapValueHardError(gap)
  );
  const betweenRowGapOffPattern = state.gapsBetweenRowsM.map((gap, gapIndex) => {
    if (betweenRowGapHardErrors[gapIndex]) return false;
    if (spacingPatternIncomplete) return false;
    const fromIndex = layoutAnchors.betweenRowFromIndex[gapIndex] ?? 0;
    return !isValidGapFrom(gap, state.spacingVertical, fromIndex);
  });

  const hasHardError =
    blockErrors.some((e) => !e.xOk || !e.yOk || !e.cOk) ||
    invalidSpacingHorizontal.some(Boolean) ||
    invalidSpacingVertical.some(Boolean) ||
    Object.values(rowGapHardErrors).some(Boolean) ||
    betweenRowGapHardErrors.some(Boolean);

  // 各ブロックの x*y と count の整合性チェック（左パネルの警告用）
  const blockContradictionMessages = figureSource.blocks
    .map((b, i) => {
      const x = Number(b.x_count);
      const y = Number(b.y_count);
      const total = Number(b.count);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(total)) return null;
      if (x <= 0 || y <= 0 || total <= 0) return null;
      const fullRect = x * y;
      const label = BLOCK_LABELS[i] ?? `${i + 1}`;

      if (total > fullRect) {
        return `ブロック${label}: 全機体数(${total})がX機体数×Y機体数(${fullRect})を超えています。数値を見直してください。`;
      }
      // 端数あり（六角形）を許容するため、landingFigureModel と同様に
      // 「必要な行数」と Y機体数の関係で矛盾を判定する
      const actualRowCount = Math.ceil(total / x);
      if (actualRowCount > y) {
        return `ブロック${label}: 必要な行数(${actualRowCount})がY機体数(${y})を超えています。数値を見直してください。`;
      }
      if (actualRowCount < y) {
        return `ブロック${label}: X機体数×Y機体数(${fullRect})が全機体数(${total})を超えています。数値を見直してください。`;
      }
      return null;
    })
    .filter((msg): msg is string => !!msg);

  const hasBlockContradiction = blockContradictionMessages.length > 0;

  const canRemoveBlock = state.blocks.length > 1;
  const canRemoveRow = state.rows.length > 1;
  const totalBlocks = state.rows.flatMap((r) => r.block_ids).length;
  const hasRowWithZeroBlocks = state.rows.some((r) => r.block_ids.length === 0);
  const layoutCountsMismatch = totalBlocks !== state.blocks.length;
  const rowCountMax = Math.min(BLOCK_COUNT_MAX, state.blocks.length);
  // 新行はデフォルト1ブロック。
  // まだどの行にも属していないブロックがあればそれを使う。
  // そうでなければ、どこか1行に2個以上あればそこから1つ移す。
  const assignedForCalc = new Set(state.rows.flatMap((r) => r.block_ids));
  const unassignedForCalc = state.blocks
    .map((b) => b.id)
    .filter((id) => !assignedForCalc.has(id));
  const hasRowWithTwoOrMore = state.rows.some((r) => r.block_ids.length >= 2);
  const canAddRow =
    state.rows.length < rowCountMax &&
    (unassignedForCalc.length > 0 || hasRowWithTwoOrMore);

  const inputBase =
    "rounded border border-slate-500 bg-slate-800 text-slate-100 text-center focus:border-slate-500 focus:outline-none";
  const inputSm = "w-14 px-2 py-1 text-sm";
  const inputXs = "w-12 px-1.5 py-0.5 text-xs";

  const seqX = state.spacingHorizontal;
  const seqY = state.spacingVertical;
  const spacingUnequalActive =
    state.spacingUnequal || seqX.length > 1 || seqY.length > 1;
  const spacingCols = spacingUnequalActive ? Math.max(2, seqX.length + 1) : 2;
  const spacingRows = spacingUnequalActive ? Math.max(2, seqY.length + 1) : 2;
  const rawDroneRotation = (area as { drone_orientation_deg?: number } | null | undefined)
    ?.drone_orientation_deg;
  const droneRotation =
    typeof rawDroneRotation === "number" && Number.isFinite(rawDroneRotation)
      ? rawDroneRotation
      : 180;

  return (
    <Modal
      show={show}
      onClose={onClose}
      panelClassName="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col !p-0 overscroll-none"
      showCloseButton={false}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* 左: 図 */}
        <div className="w-full h-[26vh] min-h-[132px] max-h-[220px] shrink-0 p-3 md:h-auto md:max-h-none md:min-h-0 md:w-1/2 md:flex-1 md:p-4 flex flex-col items-center justify-start overflow-hidden">
          <div className="w-full flex-1 flex items-center justify-center bg-slate-900/60 rounded-lg px-4 min-h-0">
            {hasBlockContradiction ? (
              <div className="space-y-1 text-xs text-amber-300">
                {blockContradictionMessages.map((msg, idx) => (
                  <p key={idx}>{msg}</p>
                ))}
              </div>
            ) : m.canRenderFigure ? (
              <LandingFigureHtml
                html={svgForPreview}
                className="w-full h-full"
              />
            ) : (
              <span className="text-slate-200 text-sm text-center">
                {m.cannotRenderReason === "contradiction" && m.contradictionMessage
                  ? m.contradictionMessage
                  : "入力値を設定してください"}
              </span>
            )}
          </div>

        </div>

        {/* 右: 入力 */}
        <div className="w-full md:w-1/2 flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            <fieldset
              disabled={!edit}
              className="m-0 min-w-0 space-y-6 border-0 p-0"
            >
            {/* ① 機体間隔 */}
            <section>
              <h3 className="text-sm font-medium text-slate-200 mb-3">機体間隔</h3>
              <div className="flex flex-col items-start gap-3 min-w-0 overflow-x-auto pb-1 pr-16">
                    <label
                      className={`flex items-center gap-2 text-sm text-slate-200 select-none ${
                        edit ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={spacingUnequalActive}
                        onChange={(e) => setSpacingUnequal(e.target.checked)}
                        className="accent-red-600 h-4 w-4 shrink-0"
                      />
                      不等間隔
                    </label>

                    <div className="flex items-start">
                      <div className="relative shrink-0 mr-4">
                        <div
                          className={`absolute top-0 z-10 flex items-center gap-1 ${
                            spacingUnequalActive && edit ? "" : "invisible"
                          }`}
                          style={{ left: -5 }}
                        >
                          <button
                            type="button"
                            onClick={addSpacingVertical}
                            disabled={!spacingUnequalActive || seqY.length >= MAX_SPACING_GAPS}
                            className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                            title="上に間隔を追加"
                            aria-label="上に間隔を追加"
                          >
                            ＋
                          </button>
                          <button
                            type="button"
                            onClick={removeSpacingVertical}
                            disabled={!spacingUnequalActive || seqY.length <= 1}
                            className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                            title="上の間隔を削除"
                            aria-label="上の間隔を削除"
                          >
                            －
                          </button>
                        </div>
                        <div
                          className="flex flex-col"
                          style={{ paddingTop: MODAL_DRONE_ICON_PX }}
                        >
                          {[...seqY].reverse().map((val, visualI) => {
                            const actualI = seqY.length - 1 - visualI;
                            const isLast = visualI === seqY.length - 1;
                            return (
                              <div
                                key={`y-${actualI}`}
                                className="relative flex items-center justify-center"
                                style={{
                                  height: MODAL_DRONE_GAP_PX,
                                  marginBottom: isLast ? 0 : MODAL_DRONE_ICON_PX,
                                  width: SPACING_INPUT_W_PX,
                                }}
                              >
                                <input
                                  type="number"
                                  value={Number.isFinite(val) ? val : ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (hasMinusSign(raw) || isOverCharLimit(raw, 4)) return;
                                    const num = raw === "" ? NaN : Number(raw);
                                    updateSpacingVertical(actualI, num);
                                  }}
                                  className={`${inputBase} w-[52px] px-1 py-1 text-sm text-center ${
                                    invalidSpacingVertical[actualI] ? "border-red-500" : ""
                                  }`}
                                  inputMode="decimal"
                                  step="0.1"
                                  min="0"
                                />
                                <span className="absolute left-full ml-1 text-slate-100 text-sm">
                                  m
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="relative">
                        <Drone2Icon
                          className="drone2-img"
                          rotationDeg={droneRotation}
                          cols={spacingCols}
                          rows={spacingRows}
                          iconPx={MODAL_DRONE_ICON_PX}
                          gapPx={MODAL_DRONE_GAP_PX}
                        />
                        <div
                          className="flex"
                          style={{
                            paddingLeft: MODAL_DRONE_ICON_PX,
                            paddingTop: 10,
                          }}
                        >
                          {seqX.map((val, i) => {
                            const isLast = i === seqX.length - 1;
                            return (
                              <div
                                key={`x-${i}`}
                                className="relative flex items-center justify-center"
                                style={{
                                  width: MODAL_DRONE_GAP_PX,
                                  height: MODAL_DRONE_GAP_PX,
                                  marginRight: isLast ? 0 : MODAL_DRONE_ICON_PX,
                                }}
                              >
                                <input
                                  type="number"
                                  value={Number.isFinite(val) ? val : ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (hasMinusSign(raw) || isOverCharLimit(raw, 4)) return;
                                    const num = raw === "" ? NaN : Number(raw);
                                    updateSpacingHorizontal(i, num);
                                  }}
                                  className={`${inputBase} w-[52px] px-1 py-1 text-sm text-center ${
                                    invalidSpacingHorizontal[i] ? "border-red-500" : ""
                                  }`}
                                  inputMode="decimal"
                                  step="0.1"
                                  min="0"
                                />
                                <span className="absolute left-full ml-1 text-slate-100 text-sm">
                                  m
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div
                          className={`absolute flex items-center gap-1 ${
                            spacingUnequalActive && edit ? "" : "invisible"
                          }`}
                          style={{ left: "100%", bottom: 12, marginLeft: 12 }}
                        >
                          <button
                            type="button"
                            onClick={addSpacingHorizontal}
                            disabled={!spacingUnequalActive || seqX.length >= MAX_SPACING_GAPS}
                            className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                            title="右に間隔を追加"
                            aria-label="右に間隔を追加"
                          >
                            ＋
                          </button>
                          <button
                            type="button"
                            onClick={removeSpacingHorizontal}
                            disabled={!spacingUnequalActive || seqX.length <= 1}
                            className="px-2 py-0.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                            title="右の間隔を削除"
                            aria-label="右の間隔を削除"
                          >
                            －
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
            </section>

            {/* ② ブロック */}
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-medium text-slate-200">ブロック</h3>
                <span className="text-xs text-slate-300">
                  合計: {state.blocks.reduce((sum, b) => sum + (Number(b.count) || 0), 0)}機
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {state.blocks.map((block, i) => {
                  const err = blockErrors[i];
                  const xError = err ? !err.xOk : false;
                  const yError = err ? !err.yOk : false;
                  const cError = err ? !err.cOk : false;
                  return (
                    <div
                      key={block.id}
                      className="relative rounded-lg p-4 bg-slate-800/60 border border-slate-700 min-h-[120px]"
                    >
                      {edit && canRemoveBlock && (
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded text-slate-200 hover:bg-slate-700 hover:text-slate-200 text-xs"
                        >
                          ー
                        </button>
                      )}
                      <div className="text-center font-medium text-slate-200 mb-3 text-sm">
                        {BLOCK_LABELS[i] ?? i + 1}
                      </div>
                      <div className="flex flex-col items-start gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 ${xError ? "text-red-400" : "text-slate-200"}`}>
                            x
                          </span>
                          <input
                            type="number"
                            value={Number.isFinite(block.x_count) ? block.x_count : ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (isOverDigitLimit(raw, BLOCK_SIDE_MAX_DIGITS)) return;
                              const num = raw === "" ? (NaN as any) : Number(raw);
                              updateBlock(block.id, { x_count: num });
                            }}
                            className={`${inputBase} w-20 px-2 py-0.5 text-xs ${
                              xError ? "border-red-500" : ""
                            }`}
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 ${yError ? "text-red-400" : "text-slate-200"}`}>
                            y
                          </span>
                          <input
                            type="number"
                            value={Number.isFinite(block.y_count) ? block.y_count : ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (isOverDigitLimit(raw, BLOCK_SIDE_MAX_DIGITS)) return;
                              const num = raw === "" ? (NaN as any) : Number(raw);
                              updateBlock(block.id, { y_count: num });
                            }}
                            className={`${inputBase} w-20 px-2 py-0.5 text-xs ${
                              yError ? "border-red-500" : ""
                            }`}
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 ${cError ? "text-red-400" : "text-slate-200"}`}>
                            計
                          </span>
                          <input
                            type="number"
                            value={Number.isFinite(block.count) ? block.count : ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (isOverDigitLimit(raw, BLOCK_COUNT_MAX_DIGITS)) return;
                              const num = raw === "" ? (NaN as any) : Number(raw);
                              updateBlock(block.id, { count: num });
                            }}
                            className={`${inputBase} w-20 px-2 py-0.5 text-xs ${
                              cError ? "border-red-500" : ""
                            }`}
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {edit && (
              <button
                type="button"
                onClick={addBlock}
                disabled={state.blocks.length >= BLOCK_COUNT_MAX}
                className="mt-2 px-3 py-1.5 rounded text-sm text-slate-200 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ＋ブロック
              </button>
              )}
            </section>

            {/* ③ 配置（行は上に追加。行4→行1の順で、行間隔を各間に表示） */}
            <section>
              <h3 className="text-sm font-medium text-slate-200 mb-1.5">配置</h3>
              {spacingPatternIncomplete && (
                <p className="mb-2 text-xs text-amber-300">
                  機体間隔（x / y）が未入力または不正なため、ブロック間隔のチェックができません。
                </p>
              )}
              <div className="space-y-2">
                {[...state.rows]
                  .map((row, i) => ({ row, rowIndex: i }))
                  .reverse()
                  .flatMap(({ row, rowIndex }) => {
                    const el = (
                      <div
                        key={`row-${rowIndex}`}
                        className="relative flex flex-col gap-2 p-3 pr-7 rounded-lg bg-slate-800/40 border border-slate-700"
                      >
                        {edit && canRemoveRow && (
                          <button
                            type="button"
                            onClick={() => removeRow(rowIndex)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded text-slate-200 hover:bg-slate-700 hover:text-slate-200 text-xs"
                          >
                            ー
                          </button>
                        )}
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-200 text-xs w-6">行{rowIndex + 1}</span>
                          <input
                            type="number"
                            value={row.block_ids.length}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const parsed = raw === "" ? NaN : Math.floor(Number(raw));
                              const v = Number.isFinite(parsed)
                                ? Math.max(0, Math.min(BLOCK_COUNT_MAX, parsed))
                                : row.block_ids.length;
                              if (v === row.block_ids.length) return;
                              setState((prev) => {
                                // 左→右、下→上の順（blocks の並び）で再配分
                                const blocksInOrder = prev.blocks.map((b) => b.id);
                                const newCounts = prev.rows.map((r, i) =>
                                  i === rowIndex ? v : r.block_ids.length
                                );
                                const sum = newCounts.reduce((a, b) => a + b, 0);
                                if (sum !== blocksInOrder.length && prev.rows.length > 1) {
                                  const lastIdx = prev.rows.length - 1;
                                  if (lastIdx !== rowIndex) {
                                    newCounts[lastIdx] = Math.max(
                                      0,
                                      newCounts[lastIdx] + blocksInOrder.length - sum
                                    );
                                  }
                                }
                                let idx = 0;
                                const rows = newCounts.map((n, i) => {
                                  const ids = blocksInOrder.slice(idx, idx + n);
                                  idx += n;
                                  return {
                                    block_ids: ids,
                                    gaps_m: prev.rows[i]?.gaps_m?.slice(
                                      0,
                                      Math.max(0, ids.length - 1)
                                    ) ?? [],
                                  };
                                });
                                const { rows: normalizedRows, gapsBetweenRowsM } =
                                  reassignBlocksFromCounts(
                                    prev.blocks,
                                    rows,
                                    prev.gapsBetweenRowsM,
                                    prev.spacingHorizontal,
                                    prev.spacingVertical
                                  );
                                return {
                                  ...prev,
                                  rows: normalizedRows,
                                  gapsBetweenRowsM,
                                };
                              });
                            }}
                            className={`${inputBase} ${inputXs}`}
                            min="0"
                            max={BLOCK_COUNT_MAX}
                          />
                          <span className="text-slate-200 text-xs">個</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          {row.block_ids.map((bid, bi) => {
                            const idx = state.blocks.findIndex((b) => b.id === bid);
                            const L = idx >= 0 ? BLOCK_LABELS[idx] : "?";
                            return (
                              <span key={bid} className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-200 text-xs shrink-0">
                                  {L}
                                </span>
                                {bi < row.block_ids.length - 1 && (
                                  <GapMetersInput
                                    value={row.gaps_m[bi]!}
                                    options={gapOptionsFrom(
                                      state.spacingHorizontal,
                                      layoutAnchors.rowGapFromIndex[rowIndex]?.[bi] ?? 0
                                    )}
                                    onChange={(num) => updateRowGap(rowIndex, bi, num)}
                                    warn={
                                      !!rowGapHardErrors[`${rowIndex}-${bi}`] ||
                                      !!rowGapOffPattern[`${rowIndex}-${bi}`]
                                    }
                                    className={`${inputBase} w-14 px-1 py-0.5 text-xs`}
                                    unitClassName="text-slate-200 text-xs"
                                  />
                                )}
                              </span>
                            );
                          })}
                        </div>
                        </div>
                        {!spacingPatternIncomplete &&
                          row.gaps_m.length > 0 &&
                          row.gaps_m.some((_, bi) => rowGapOffPattern[`${rowIndex}-${bi}`]) && (
                            <div className="text-[10px] text-amber-300 leading-snug">
                              この位置の機体間隔パターンから外れています。
                            </div>
                          )}
                      </div>
                    );
                    if (rowIndex > 0) {
                      const gapIndex = rowIndex - 1;
                      return [
                        el,
                        <div
                          key={`gap-${gapIndex}`}
                          className="flex flex-col gap-1 py-1.5 px-3 border-l-2 border-slate-600 ml-6 text-slate-200"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <GapMetersInput
                              value={state.gapsBetweenRowsM[gapIndex]!}
                              options={gapOptionsFrom(
                                state.spacingVertical,
                                layoutAnchors.betweenRowFromIndex[gapIndex] ?? 0
                              )}
                              onChange={(num) => updateGapBetweenRows(gapIndex, num)}
                              warn={
                                !!betweenRowGapHardErrors[gapIndex] ||
                                !!betweenRowGapOffPattern[gapIndex]
                              }
                              className={`${inputBase} w-20 px-2 py-1 text-sm`}
                              unitClassName="text-slate-200 text-sm"
                            />
                            {!spacingPatternIncomplete && betweenRowGapOffPattern[gapIndex] && (
                              <span className="text-[10px] text-amber-300 leading-snug">
                                この位置の機体間隔パターンから外れています。
                              </span>
                            )}
                          </div>
                        </div>,
                      ];
                    }
                    return [el];
                  })}
              </div>
              {edit && (
              <button
                type="button"
                onClick={addRow}
                disabled={!canAddRow}
                className="mt-2 px-3 py-1.5 rounded text-sm text-slate-200 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ＋行
              </button>
              )}
            </section>

            </fieldset>
          </div>
        </div>
        </div>

        <div className="relative shrink-0">
          <div
            className={`absolute left-0 right-0 bottom-full z-20 overflow-y-auto transition-all duration-300 ${
              edit && isDisplayPanelOpen
                ? "max-h-[min(60dvh,430px)] opacity-100 pointer-events-auto"
                : "max-h-0 opacity-0 pointer-events-none overflow-hidden"
            }`}
          >
            <div
              className={`flex justify-end px-3 py-3 md:px-6 transition-all duration-300 ${
                isDisplayPanelOpen ? "translate-y-0" : "translate-y-5"
              }`}
            >
              <section className="w-full md:w-1/2 rounded-lg border border-slate-700/90 bg-slate-900 p-3">
                <fieldset
                  disabled={!edit}
                  className="m-0 min-w-0 border-0 p-0"
                >
                <div className="flex flex-col md:flex-row md:items-start gap-4 min-w-0">
                  <div className="w-full md:max-w-[340px] min-w-0">
                    <div className="space-y-4">
                      <select
                        className="block w-fit max-w-full rounded border border-slate-500 bg-slate-800 text-slate-100 text-xs py-0.5 pl-2 pr-7 leading-tight"
                        aria-label="ブロック"
                        value={activeCornerBlockId ?? ""}
                        disabled={state.blocks.length === 0}
                        onChange={(e) =>
                          setSelectedCornerBlockId(e.target.value ? e.target.value : null)
                        }
                      >
                        {state.blocks.map((b, i) => (
                          <option key={b.id} value={b.id}>
                            ブロック {BLOCK_LABELS[i] ?? i + 1}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-200 shrink-0">
                          フォントサイズ
                        </span>
                        <input
                          type="range"
                          min={6}
                          max={16}
                          step={1}
                          disabled={!activeCornerBlockId}
                          value={
                            Number.isFinite(cornerDisplayEditing.fontSize)
                              ? cornerDisplayEditing.fontSize
                              : 10
                          }
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next) || !activeCornerBlockId) return;
                            updateCornerDisplayForBlock(activeCornerBlockId, {
                              fontSize: Math.max(6, Math.min(16, next)),
                            });
                          }}
                          className="flex-1 min-w-20 max-w-44 h-2 accent-red-600"
                        />
                        <span className="text-slate-200 text-xs w-12 tabular-nums text-right shrink-0">
                          {cornerDisplayEditing.fontSize}px
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="cornerPlacement"
                              disabled={!activeCornerBlockId}
                              checked={cornerDisplayEditing.placement === "inside"}
                              onChange={() =>
                                activeCornerBlockId &&
                                updateCornerDisplayForBlock(activeCornerBlockId, {
                                  placement: "inside",
                                })
                              }
                              className="accent-red-600"
                            />
                            内側
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="cornerPlacement"
                              disabled={!activeCornerBlockId}
                              checked={cornerDisplayEditing.placement === "outside"}
                              onChange={() =>
                                activeCornerBlockId &&
                                updateCornerDisplayForBlock(activeCornerBlockId, {
                                  placement: "outside",
                                })
                              }
                              className="accent-red-600"
                            />
                            外側
                          </label>
                        </div>

                        {cornerDisplayEditing.placement === "outside" && (
                          <div className="rounded-md border border-slate-600/60 bg-slate-800/35 pl-3 pr-3 py-2.5 space-y-2 border-l-[3px] border-l-red-600/80">
                            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!activeCornerBlockId}
                                checked={cornerDisplayEditing.outsideHorizontal}
                                onChange={(e) =>
                                  activeCornerBlockId &&
                                  updateCornerDisplayForBlock(activeCornerBlockId, {
                                    outsideHorizontal: e.target.checked,
                                  })
                                }
                                className="accent-red-600 shrink-0"
                              />
                              左右（外に逃がす）
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!activeCornerBlockId}
                                checked={cornerDisplayEditing.outsideVertical}
                                onChange={(e) =>
                                  activeCornerBlockId &&
                                  updateCornerDisplayForBlock(activeCornerBlockId, {
                                    outsideVertical: e.target.checked,
                                  })
                                }
                                className="accent-red-600 shrink-0"
                              />
                              上下（外に逃がす）
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:flex-1 min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-200 whitespace-nowrap">機体番号表示</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.showCornerNumbers}
                        onClick={() =>
                          updateFigureVisibility({ showCornerNumbers: !state.showCornerNumbers })
                        }
                        className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors ${
                          state.showCornerNumbers ? "bg-red-500/80" : "bg-slate-600/70"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-100 transition-transform ${
                            state.showCornerNumbers ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-200 whitespace-nowrap">ブロックラベル</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.showBlockLabels}
                        onClick={() =>
                          updateFigureVisibility({ showBlockLabels: !state.showBlockLabels })
                        }
                        className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors ${
                          state.showBlockLabels ? "bg-red-500/80" : "bg-slate-600/70"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-100 transition-transform ${
                            state.showBlockLabels ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-200 whitespace-nowrap">メモリ表示</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.showRuler}
                        onClick={() =>
                          updateFigureVisibility({ showRuler: !state.showRuler })
                        }
                        className={`relative inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors ${
                          state.showRuler ? "bg-red-500/80" : "bg-slate-600/70"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-100 transition-transform ${
                            state.showRuler ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-1 space-y-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-200 w-6 shrink-0">
                          左
                        </span>
                        <input
                          type="range"
                          min={-30}
                          max={30}
                          step={1}
                          value={
                            Number.isFinite(state.rulerDisplay.leftXOffsetPx)
                              ? state.rulerDisplay.leftXOffsetPx
                              : 0
                          }
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) return;
                            updateRulerDisplay({ leftXOffsetPx: next });
                          }}
                          className="flex-1 min-w-20 h-2 accent-red-600"
                        />
                        <span className="text-slate-200 text-xs w-12 tabular-nums text-right shrink-0">
                          {state.rulerDisplay.leftXOffsetPx}px
                        </span>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-200 w-6 shrink-0">
                          下
                        </span>
                        <input
                          type="range"
                          min={-60}
                          max={30}
                          step={1}
                          value={
                            Number.isFinite(state.rulerDisplay.bottomYOffsetPx)
                              ? -state.rulerDisplay.bottomYOffsetPx
                              : 0
                          }
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next)) return;
                            updateRulerDisplay({ bottomYOffsetPx: -next });
                          }}
                          className="flex-1 min-w-20 h-2 accent-red-600"
                        />
                        <span className="text-slate-200 text-xs w-12 tabular-nums text-right shrink-0">
                          {Number.isFinite(state.rulerDisplay.bottomYOffsetPx)
                            ? -state.rulerDisplay.bottomYOffsetPx
                            : 0}
                          px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </fieldset>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-700 bg-slate-900/95 px-3 py-3 md:px-6">
              {edit && (
              <button
                type="button"
                onClick={() => setIsDisplayPanelOpen((prev) => !prev)}
                className={`h-9 md:h-10 px-3 md:px-4 py-2 rounded text-sm whitespace-nowrap border transition-colors ${
                  isDisplayPanelOpen
                    ? "bg-slate-700 text-slate-100 border-slate-500"
                    : "text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-slate-100"
                }`}
              >
                表示切替
              </button>
              )}
            {edit && (
            <button
              type="button"
              onClick={() => {
                setCommittedForFigure(JSON.parse(JSON.stringify(state)));
              }}
              disabled={layoutCountsMismatch || hasRowWithZeroBlocks}
              className="h-9 md:h-10 px-3 md:px-4 py-2 rounded border border-slate-600 text-sm whitespace-nowrap text-slate-200 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              図を更新
            </button>
            )}
              <button
                type="button"
                onClick={onClose}
                className="h-9 md:h-10 px-3 md:px-4 py-2 rounded text-sm whitespace-nowrap text-slate-200 hover:bg-slate-700 border border-slate-600"
              >
                {edit ? "キャンセル" : "閉じる"}
              </button>
              {edit && (
              <button
                type="button"
                onClick={handleDecide}
                disabled={hasHardError || layoutCountsMismatch || hasRowWithZeroBlocks}
                className="h-9 md:h-10 px-3 md:px-4 py-2 rounded text-sm whitespace-nowrap text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                決定
              </button>
              )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
