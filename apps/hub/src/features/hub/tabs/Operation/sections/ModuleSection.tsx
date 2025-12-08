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
  showModuleLabel?: boolean;
  appliedNums?: number[]; // 表示用（ユニーク数）
  /** 数字欄のフォーカスアウト完了時に通知（正規化済みの文字列） */
  onNumbersBlur?: (normalized: string) => void;
};

export function ModuleSection({
  edit,
  className = "",
  moduleLabel = "モジュール",
  title,
  onTitleChange,
  input,
  onInputChange,
  showModuleLabel = true,
  appliedNums = [],
  onNumbersBlur,
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
      <div className="space-y-2 mb-4">
        {showModuleLabel && (
          <p className="text-xs text-slate-300">{moduleLabel}</p>
        )}

        <div className="flex items-center gap-2">
          <DisplayOrInput
            edit={edit}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-36 text-sm text-center"
          />
          <CopyButton onClick={() => copy(input)} />
        </div>

        {/* onBlur はバブリングで受ける（DisplayOrTextarea に onBlur が無くてもOK） */}
        <div onBlur={handleBlurNormalize}>
          <DisplayOrTextarea
            edit={edit}
            value={input}
            onChange={(v) => onInputChange(v)} // 入力中は一切変換しない
            placeholder="空白区切りで番号を入力"
            size="md"
            className="w-full"
            textClassName="font-mono"
            label=""
          />
        </div>

        <div className="text-xs text-slate-300 mt-1 text-right">
          合計{total}機
        </div>
      </div>
    </section>
  );
}
