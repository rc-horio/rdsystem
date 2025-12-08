// src/components/forms/Textarea.tsx
import clsx from "clsx";
import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

/* =========================
   InputBox と同一の見た目に統一
   ========================= */
const BASE_INPUT_CLASS =
  "w-full rounded !bg-[#211C1C] border-[0.5px] border-[#707070] px-3 py-1 " +
  "text-slate-100 placeholder:text-slate-200 placeholder:font-light !text-sm leading-none" +
  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 " +
  "transition disabled:opacity-50";

const TEXTAREA_BASE = "resize-none";

// 高さは textarea のときだけ効かせる
const SIZE_CLASS = {
  sm: "h-24",
  md: "h-32",
  lg: "h-40",
} as const;

/* =========================
   子要素は最低限 className を受け取れることを要求
   ========================= */
type WithClassName = { className?: string };

/* =========================
   フィールド
   ========================= */
type FieldProps<T extends WithClassName = WithClassName> = {
  label?: ReactNode;
  children: ReactElement<T>; // 単一要素（input/textarea 等）
  className?: string; // 外枠（余白など）
  inputClassName?: string; // 入力要素に追加するクラス
  size?: keyof typeof SIZE_CLASS; // textarea 高さ
};

export function Textarea<T extends WithClassName>({
  label,
  children,
  className,
  inputClassName,
  size = "md",
}: FieldProps<T>) {
  const hasLabel =
    label !== undefined && label !== null && String(label).trim() !== "";

  if (!isValidElement(children)) return null;

  const isTextarea =
    typeof children.type === "string" && children.type === "textarea";

  const extra = clsx(
    BASE_INPUT_CLASS,
    isTextarea && TEXTAREA_BASE,
    isTextarea && SIZE_CLASS[size],
    inputClassName
  );

  const mergedChild = cloneElement(children, {
    className: clsx(children.props.className, extra),
  } as Partial<T>);

  return (
    <label className={clsx("block space-y-1", className)}>
      {hasLabel && <span className="text-xs">{label}</span>}
      {mergedChild}
    </label>
  );
}
