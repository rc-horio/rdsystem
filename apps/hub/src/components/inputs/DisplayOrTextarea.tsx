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
          "ui-field-shell",
          edit && "ui-field-shell--edit",
          heightClass ?? HEIGHT_BY_SIZE[size]
        )}
      >
        {edit ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={clsx(
              "ui-textarea",
              "[scrollbar-gutter:stable]",
              textClassName
            )}
          />
        ) : (
          <div
            className={clsx(
              "ui-textarea-readonly",
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
