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

/** 行高 20px の整数倍。h-full だと Chrome でキャレットが欄の高さまで伸びる */
const HEIGHT_BY_SIZE = {
  sm: "h-20",
  md: "h-[120px]",
  lg: "h-40",
} as const;

const TEXT_STYLE: React.CSSProperties = {
  fontSize: 14,
  lineHeight: "20px",
};

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
  const bodyHeightClass = heightClass ?? HEIGHT_BY_SIZE[size];

  return (
    <div className={className}>
      {label ? (
        <div className="text-xs text-slate-300 mb-1">{label}</div>
      ) : null}

      <div
        className={clsx("ui-field-shell", edit && "ui-field-shell--edit")}
      >
        {edit ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={clsx(
              "block w-full resize-none overflow-y-auto bg-transparent outline-none border-0 p-0",
              "text-slate-100 placeholder:text-slate-200 [scrollbar-gutter:stable] [field-sizing:fixed]",
              bodyHeightClass,
              textClassName
            )}
            style={TEXT_STYLE}
          />
        ) : (
          <div
            className={clsx(
              "overflow-y-auto whitespace-pre-wrap cursor-default select-none caret-transparent",
              "text-slate-200 [scrollbar-gutter:stable]",
              bodyHeightClass,
              textClassName
            )}
            style={TEXT_STYLE}
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
