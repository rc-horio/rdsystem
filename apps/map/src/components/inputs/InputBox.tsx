import React, { useEffect, useId, useRef, useState } from "react";

export type InputBoxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "placeholder" | "type"
> & {
  label?: string;
  note?: string;
};

export function InputBox({
  id,
  label,
  note,
  className = "",
  ...rest
}: InputBoxProps) {
  const autoId = useId();
  const inputId = id ?? `inp-${autoId}`;
  const noteId = note ? `${inputId}-note` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`rc-inp-field ${className}`.trim()}>
      {/* 横並び：ラベル列（固定幅）→ 入力列（可変幅） */}
      <div className="rc-inp-row">
        {label ? (
          <label htmlFor={inputId} className="rc-inp-label">
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
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            className="rc-inp-input"
            placeholder=""
            disabled={!editable}
            {...rest}
          />
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
