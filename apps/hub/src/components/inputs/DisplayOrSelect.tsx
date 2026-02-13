// src/components/inputs/DisplayOrSelect.tsx
import React, { useMemo } from "react";
import clsx from "clsx";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

export type SelectOption = {
  value: string;
  label: string;
};

const SELECT_STYLES = {
  control: (base: object, state: { isFocused?: boolean }) => ({
    ...base,
    minHeight: 36,
    height: 36,
    backgroundColor: "#211C1C",
    borderColor: state.isFocused ? "#dc2626" : "#707070",
    boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
    "&:hover": { borderColor: "#dc2626" },
    fontSize: "14px",
    lineHeight: 1,
  }),
  valueContainer: (base: object) => ({ ...base, height: 36, padding: "0 12px" }),
  input: (base: object) => ({
    ...base,
    margin: 0,
    color: "#e5e7eb",
    fontSize: "14px",
    lineHeight: 1,
  }),
  singleValue: (base: object) => ({
    ...base,
    color: "#e5e7eb",
    fontSize: "14px",
    lineHeight: 1,
  }),
  placeholder: (base: object) => ({
    ...base,
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1,
  }),
  menu: (base: object) => ({
    ...base,
    backgroundColor: "#211C1C",
    zIndex: 50,
    fontSize: "14px",
    lineHeight: 1,
  }),
  option: (base: object, state: { isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isFocused ? "#2a2424" : "transparent",
    color: "#e5e7eb",
    fontSize: "14px",
    lineHeight: 1,
  }),
};

type Props = {
  edit: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  /** 自由記入を許可（該当なしの場合は新規入力可能） */
  creatable?: boolean;
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
  creatable = false,
}) => {
  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label || value || "";

  // 編集OFF: 既存の表示モードそのまま
  if (!edit) {
    return (
      <div
        className={clsx(
          "ui-readonly-box justify-center text-center",
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

  // 既存の onChange(HTMLSelectEvent) を壊さないためのブリッジ
  const emitChange = (nextValue: string) => {
    const ev = {
      target: { value: nextValue },
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(ev);
  };

  // creatable時：現在の値がオプションに無ければ追加（自由記入の表示用）
  const rsOptions = useMemo(() => {
    const base = [
      { value: "", label: "未設定" },
      ...options.map((o) => ({ value: o.value, label: o.label })),
    ];
    if (creatable && value && !base.some((o) => o.value === value)) {
      return [...base, { value, label: value }];
    }
    return base;
  }, [options, creatable, value]);

  const rsValue = useMemo(
    () => rsOptions.find((o) => o.value === value) ?? null,
    [rsOptions, value]
  );

  const selectProps = {
    options: rsOptions,
    value: rsValue,
    onChange: (opt: { value: string; label: string } | null) =>
      emitChange(opt?.value ?? ""),
    placeholder,
    isClearable: false,
    isSearchable: true,
    isLoading,
    isDisabled,
    styles: SELECT_STYLES,
  };

  if (creatable) {
    return (
      <div className={clsx("w-full", className)}>
        <CreatableSelect
          {...selectProps}
          onCreateOption={(inputValue) => emitChange(inputValue.trim())}
          formatCreateLabel={(inputValue) => `「${inputValue}」を入力`}
        />
      </div>
    );
  }

  return (
    <div className={clsx("w-full", className)}>
      <Select {...selectProps} />
    </div>
  );
};
