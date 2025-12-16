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
          "flex items-center h-9 rounded border-[0.5px] border-[#707070] px-3",
          "text-sm leading-none",
          displayText ? "text-slate-200" : "text-slate-500",
          className,
          "cursor-default select-none caret-transparent focus:outline-none focus:ring-0"
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
    () => options.map((o) => ({ value: o.value, label: o.label })),
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
        isClearable
        isSearchable
        isLoading={isLoading}
        isDisabled={isDisabled}
        // 見た目（RD Hubの配色・枠線赤）
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 36, // h-9 相当
            height: 36,
            backgroundColor: "rgba(15,23,42,0.6)",
            borderColor: state.isFocused ? "#dc2626" : "#707070",
            boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
            "&:hover": { borderColor: "#dc2626" },
          }),
          valueContainer: (base) => ({
            ...base,
            height: 36,
            padding: "0 12px",
          }),
          input: (base) => ({ ...base, margin: 0, color: "#e5e7eb" }),
          singleValue: (base) => ({ ...base, color: "#e5e7eb" }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8", // slate-400 相当（「選択済み」に見えないように）
          }),
          menu: (base) => ({ ...base, backgroundColor: "#020617", zIndex: 50 }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#1e293b" : "transparent",
            color: "#e5e7eb",
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "#334155",
          }),
          dropdownIndicator: (base) => ({ ...base, color: "#94a3b8" }),
          clearIndicator: (base) => ({ ...base, color: "#94a3b8" }),
        }}
      />
    </div>
  );
};
