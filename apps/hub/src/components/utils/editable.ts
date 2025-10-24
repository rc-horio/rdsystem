// src/components/utils/editable.ts
export function editable(edit: boolean) {
  return {
    disabled: !edit,
    readOnly: !edit,
    tabIndex: edit ? 0 : -1,
    "aria-readonly": !edit,
  } as const;
}

export function editableClass(edit: boolean) {
  // UIに合わせて調整可
  return edit
    ? "bg-slate-800/60"
    : "bg-slate-900/40 opacity-70 pointer-events-none select-none";
}
