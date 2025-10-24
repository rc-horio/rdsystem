import React, { useEffect, useId, useRef, useState } from "react";

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "placeholder"
> & {
  label?: string;
  note?: string;
};

export function Textarea({
  id,
  label,
  note,
  className = "",
  rows = 7,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? `txa-${autoId}`;
  const noteId = note ? `${inputId}-note` : undefined;
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Bodyクラスで編集可否を自動判定
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
      taRef.current?.focus();
    }
  };

  return (
    <div className={`rc-txa-field ${className}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className="rc-txa-label">
          {label}
        </label>
      ) : null}

      <div
        className="rc-txa-shell"
        onMouseDown={handleShellMouseDown}
        tabIndex={-1}
        aria-disabled={!editable}
      >
        <textarea
          id={inputId}
          ref={taRef}
          rows={rows}
          aria-describedby={noteId}
          className="rc-txa-input"
          placeholder=""
          disabled={!editable}
          {...rest}
        />
      </div>

      {note ? (
        <p id={noteId} className="rc-txa-note">
          {note}
        </p>
      ) : null}
    </div>
  );
}
