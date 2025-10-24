// src/components/SelectBox.tsx
import React, { useEffect, useId, useRef, useState } from "react";

export type SelectBoxOption =
  | string
  | { value: string; label?: string; disabled?: boolean };

export type SelectBoxProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "multiple"
> & {
  label?: string;
  note?: string;
  options: SelectBoxOption[];
};

export function SelectBox({
  id,
  label,
  note,
  className = "",
  options,
  ...rest
}: SelectBoxProps) {
  const autoId = useId();
  const selectId = id ?? `sel-${autoId}`;
  const noteId = note ? `${selectId}-note` : undefined;
  const selectRef = useRef<HTMLSelectElement>(null);

  // Bodyクラスで編集状態を共有（editing-on で活性）
  const getEditable = () => document.body.classList.contains("editing-on");
  const [editable, setEditable] = useState<boolean>(getEditable);

  useEffect(() => {
    const update = () => setEditable(getEditable());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const handleShellMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!editable) return;
    if (e.target === e.currentTarget) {
      e.preventDefault();
      selectRef.current?.focus();
    }
  };

  const renderOption = (opt: SelectBoxOption) => {
    if (typeof opt === "string") {
      return (
        <option key={opt} value={opt}>
          {opt}
        </option>
      );
    }
    return (
      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
        {opt.label ?? opt.value}
      </option>
    );
  };

  return (
    <div className={`rc-inp-field ${className}`.trim()}>
      <div className="rc-inp-row">
        {label ? (
          <label htmlFor={selectId} className="rc-inp-label">
            {label}
          </label>
        ) : (
          <span aria-hidden="true" />
        )}

        <div
          className="rc-inp-shell"
          onMouseDown={handleShellMouseDown}
          tabIndex={-1}
          aria-disabled={!editable}
        >
          <select
            id={selectId}
            ref={selectRef}
            className="rc-inp-input"
            disabled={!editable}
            {...rest}
          >
            {options.map(renderOption)}
          </select>
        </div>

        {note ? (
          <p id={noteId} className="rc-inp-note">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default SelectBox;
