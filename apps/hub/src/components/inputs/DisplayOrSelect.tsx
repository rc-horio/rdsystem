// src/components/inputs/DisplayOrSelect.tsx
import React, { useMemo } from "react";
import clsx from "clsx";
import Select from "react-select";

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  edit: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>; // 既存のまま
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
};

export const DisplayOrSelect: React.FC<Props> = ({
  edit,
  value,
  onChange,
  options,
  placeholder = "",
  className = "",
  isLoading,
  isDisabled,
}) => {
  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label || value || "";

  // 編集OFF: 既存の表示モードそのまま
  if (!edit) {
    return (
      <div
        className={clsx(
          "ui-readonly-box",
          displayText ? "text-slate-200" : "text-slate-500",
          className
        )}
        tabIndex={-1}
        aria-readonly="true"
      >
        <span className="block w-full">{displayText || "未設定"}</span>
      </div>
    );
  }

  // react-select 用 option
  const rsOptions = useMemo(
    () => [
      { value: "", label: "未設定" },
      ...options.map((o) => ({ value: o.value, label: o.label })),
    ],
    [options]
  );

  const rsValue = useMemo(
    () => rsOptions.find((o) => o.value === value) ?? null,
    [rsOptions, value]
  );

  // 既存の onChange(HTMLSelectEvent) を壊さないためのブリッジ
  const emitChange = (nextValue: string) => {
    const ev = {
      target: { value: nextValue },
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(ev);
  };

  return (
    <div className={clsx("w-full", className)}>
      <Select
        options={rsOptions}
        value={rsValue}
        onChange={(opt) => emitChange(opt?.value ?? "")}
        placeholder={placeholder}
        isClearable={false}
        isSearchable
        isLoading={isLoading}
        isDisabled={isDisabled}
        // 見た目（RD Hubの配色・枠線赤）
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 36,
            height: 36,
            backgroundColor: "#211C1C", // InputBox と同じ
            borderColor: state.isFocused ? "#dc2626" : "#707070",
            boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
            "&:hover": { borderColor: "#dc2626" },
            fontSize: "14px",
            lineHeight: 1,
          }),
          valueContainer: (base) => ({
            ...base,
            height: 36,
            padding: "0 12px",
          }),
          input: (base) => ({
            ...base,
            margin: 0,
            color: "#e5e7eb",
            fontSize: "14px",
            lineHeight: 1,
          }),
          singleValue: (base) => ({
            ...base,
            color: "#e5e7eb",
            fontSize: "14px",
            lineHeight: 1,
          }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1,
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#211C1C",
            zIndex: 50,
            fontSize: "14px",
            lineHeight: 1,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#2a2424" : "transparent",
            color: "#e5e7eb",
            fontSize: "14px",
            lineHeight: 1,
          }),
        }}
      />
    </div>
  );
};
