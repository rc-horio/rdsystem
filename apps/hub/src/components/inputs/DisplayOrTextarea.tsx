// src/components/inputs/DisplayOrTextarea.tsx
import clsx from "clsx";
import React from "react";

type Props = {
  edit: boolean;
  value: string;
  onChange?: (v: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  label?: React.ReactNode;
  className?: string; // 全体外枠（ラベル含む）
  textClassName?: string; // 内側要素に追加（任意）
  heightClass?: string;
};

const HEIGHT_BY_SIZE = {
  sm: "h-24",
  md: "h-32",
  lg: "h-40",
} as const;

export function DisplayOrTextarea({
  edit,
  value,
  onChange,
  onBlur,
  placeholder,
  size = "md",
  label = "",
  className = "",
  textClassName = "",
  heightClass,
}: Props) {
  return (
    <div className={className}>
      {label ? (
        <div className="text-xs text-slate-300 mb-1">{label}</div>
      ) : null}

      {/* 外殻：枠/背景/高さを常にここで描く（編集オン/オフで固定） */}
      <div
        className={clsx(
          "rounded border-[0.5px] border-[#707070] px-3 py-1",
          // 編集ONのときだけ、元のTextareaと同じ背景色を付与
          edit && "!bg-[#211C1C]",
          heightClass ?? HEIGHT_BY_SIZE[size]
        )}
      >
        {edit ? (
          // 編集オン：色は従来どおり text-slate-100、枠は外殻に一本化
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={clsx(
              "w-full h-full min-h-0 resize-none bg-transparent outline-none",
              // 外殻が枠を描くため、内側は枠/パディングなし
              "border-transparent !px-0 !py-0",
              // 文字サイズも従来どおり
              "text-sm text-slate-100 placeholder:text-slate-200",
              // スクロール有無で幅がブレないように
              "[scrollbar-gutter:stable]",
              textClassName
            )}
          />
        ) : (
          // 編集オフ：従来どおりの色 text-slate-200、読み取り用
          <div
            className={clsx(
              "w-full h-full overflow-y-auto whitespace-pre-wrap",
              "text-sm !text-slate-200", // ← 修正前と同じ色を強制
              "!cursor-default select-none caret-transparent",
              "[scrollbar-gutter:stable]",
              textClassName
            )}
            tabIndex={-1}
            aria-readonly="true"
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
}
