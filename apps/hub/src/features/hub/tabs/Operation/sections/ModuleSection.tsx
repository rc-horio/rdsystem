// src/features/hub/tabs/Operation/sections/ModuleSection.tsx
import { DisplayOrInput, DisplayOrTextarea, CopyButton } from "@/components";
import { normalizeInput } from "../utils/format";
import {
  OPERATION_MODULE_KIND_OPTIONS,
  operationModuleKindLabel,
} from "../constants";
import type { OperationModuleKind } from "@/features/hub/types/resource";
import clsx from "clsx";

type Props = {
  edit: boolean;
  className?: string;
  moduleLabel?: string;
  title: string;
  onTitleChange: (v: string) => void;
  kind?: OperationModuleKind;
  onKindChange: (v: OperationModuleKind | undefined) => void;
  input: string;
  onInputChange: (v: string) => void;
  compact?: boolean;
  showModuleLabel?: boolean;
  appliedNums?: number[]; // 表示用（ユニーク数）
  /** 数字欄のフォーカスアウト完了時に通知（正規化済みの文字列） */
  onNumbersBlur?: (normalized: string) => void;
  onRemove?: () => void;
  validationMessage?: string;
};

export function ModuleSection({
  edit,
  className = "",
  moduleLabel = "モジュール",
  title,
  onTitleChange,
  kind,
  onKindChange,
  input,
  onInputChange,
  compact = false,
  showModuleLabel = true,
  appliedNums = [],
  onNumbersBlur,
  onRemove,
  validationMessage,
}: Props) {
  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch (e) {
      console.error(e);
    }
  };

  const total = new Set(appliedNums).size;

  // フォーカスアウト時：正規化して見た目だけ整える → 親には送らず、完了を通知
  const handleBlurNormalize = () => {
    const normalized = normalizeInput(input ?? "");
    if (normalized !== input) {
      onInputChange(normalized);
    }
    onNumbersBlur?.(normalized);
  };

  return (
    <section className={className}>
      <div className={compact ? "space-y-1.5 mb-2" : "space-y-2 mb-4"}>
        <div className="flex min-w-0 items-center gap-1.5">
          {showModuleLabel && (
            <p className="shrink-0 text-xs text-slate-300">{moduleLabel}</p>
          )}
          {edit ? (
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              {OPERATION_MODULE_KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={kind === opt.value}
                  onClick={() =>
                    onKindChange(kind === opt.value ? undefined : opt.value)
                  }
                  className={clsx(
                    "rounded border px-2 py-1 text-xs leading-none",
                    kind === opt.value
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-slate-700 text-slate-200 bg-slate-900/40 hover:bg-slate-900/60"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <p
              className={clsx(
                "ml-auto text-xs",
                kind ? "text-slate-200" : "text-slate-500"
              )}
            >
              {operationModuleKindLabel(kind)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DisplayOrInput
            edit={edit}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={
              (compact ? "w-24 text-xs" : "w-36 text-sm") + " text-center"
            }
          />
          <CopyButton onClick={() => copy(input)} />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto px-2 py-1 text-xs rounded border border-slate-700 text-slate-200 bg-slate-900/40 hover:bg-slate-900/60"
            >
              削除
            </button>
          )}
        </div>

        {/* onBlur はバブリングで受ける（DisplayOrTextarea に onBlur が無くてもOK） */}
        <div onBlur={handleBlurNormalize}>
          <DisplayOrTextarea
            edit={edit}
            value={input}
            onChange={(v) => onInputChange(v)} // 入力中は一切変換しない
            placeholder="空白区切りで番号を入力"
            size={compact ? "sm" : "md"}
            className="w-full"
            textClassName="font-mono"
            label=""
          />
        </div>

        {validationMessage && (
          <div className="text-xs text-amber-300">{validationMessage}</div>
        )}

        <div className="text-xs text-slate-300 mt-1 text-right">
          合計{total}機
        </div>
      </div>
    </section>
  );
}
