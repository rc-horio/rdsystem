// src/components/inputs/DisplayOrSelect.tsx
import React from "react";
import clsx from "clsx";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  edit: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

export const DisplayOrSelect: React.FC<Props> = ({
  edit,
  value,
  onChange,
  options,
  placeholder = "",
  className = "",
}) => {
  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label || value || "";

  // 編集OFF: DisplayOrInput の表示モードと揃える
  if (!edit) {
    return (
      <div
        className={clsx(
          "flex items-center h-9 rounded border-[0.5px] border-[#707070] px-3",
          "text-sm leading-none",
          displayText ? "text-slate-200" : "text-slate-500",
          className,
          "!cursor-default select-none caret-transparent focus:outline-none focus:ring-0"
        )}
        tabIndex={-1}
        aria-readonly="true"
      >
        <span className="block w-full">{displayText || "未設定"}</span>
      </div>
    );
  }

  // 編集ON: InputBox と同系統の色/高さ/枠線に揃える
  return (
    <select
      value={value}
      onChange={onChange}
      className={clsx(
        "h-9 w-full rounded border-[0.5px] border-[#707070] px-3",
        "bg-slate-900 text-sm text-slate-200 leading-none",
        "focus:outline-none focus:ring-0",
        className
      )}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
