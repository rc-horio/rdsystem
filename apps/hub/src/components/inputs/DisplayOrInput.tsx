// src/components/inputs/DisplayOrInput.tsx
import clsx from "clsx";
import React from "react";
import { InputBox } from "./InputBox";

/** 全角数字を半角に変換（数値入力で即時変換） */
const toHalfWidthNumbers = (str: string) =>
  str.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );

type DisplayOrInputProps = {
  edit: boolean;
  value: string;
  placeholder?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  tabIndex?: number;
};

export function DisplayOrInput({
  edit,
  value,
  placeholder = "",
  className = "",
  onChange,
  onBlur,
  inputMode,
  type = "text",
  tabIndex,
}: DisplayOrInputProps) {
  const isNumeric = inputMode === "numeric" || type === "number";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumeric) {
      const converted = toHalfWidthNumbers(e.target.value);
      if (converted !== e.target.value) {
        e = {
          ...e,
          target: { ...e.target, value: converted },
        } as React.ChangeEvent<HTMLInputElement>;
      }
    }
    onChange?.(e);
  };

  if (edit) {
    return (
      <InputBox
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        inputMode={inputMode}
        type={type}
        className={clsx("h-9 select-text", className)}
        tabIndex={tabIndex}
      />
    );
  }

  // 編集OFF: カーソル/I-beam/選択/フォーカスを抑止
  return (
    <div
      className={clsx(
        "flex items-center justify-center h-9 rounded border-[0.5px] border-[#707070] px-3",
        "text-sm! text-slate-200 leading-none",
        className,
        "cursor-default! select-none caret-transparent focus:outline-none focus:ring-0"
      )}
      tabIndex={-1}
      aria-readonly="true"
    >
      <span className="block w-full text-center">{value || ""}</span>
    </div>
  );
}
