// src/features/hub/tabs/Operation/sections/ModuleSection.tsx
import { DisplayOrInput, DisplayOrTextarea, CopyButton } from "@/components";
import { normalizeInput } from "../utils/format";

type Props = {
  edit: boolean;
  className?: string;
  moduleLabel?: string;
  title: string;
  onTitleChange: (v: string) => void;
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
        {showModuleLabel && (
          <p className="text-xs text-slate-300">{moduleLabel}</p>
        )}

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
