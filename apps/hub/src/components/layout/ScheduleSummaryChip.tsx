// src/components/atoms/ScheduleSummaryChip.tsx
import clsx from "clsx";

export function ScheduleSummaryChip({
  date,
  label,
  className = "",
}: {
  date?: string;
  label?: string;
  className?: string;
}) {
  if (!date && !label) return null;
  return (
    <span
      className={clsx(
        "ml-2 inline-flex items-center gap-2 rounded-full",
        "bg-black/30 border border-white/10",
        "px-3 py-1 text-[11px] md:text-xs text-slate-200",
        "whitespace-nowrap max-w-[50vw] md:max-w-none",
        className
      )}
      title={[date, label].filter(Boolean).join(" / ")}
    >
      <span className="opacity-80">{date || "--/--"}</span>
      {label ? <span className="truncate opacity-70">| {label}</span> : null}
    </span>
  );
}
