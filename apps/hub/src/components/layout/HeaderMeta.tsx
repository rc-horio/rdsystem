import React from "react";
import clsx from "clsx";

type Props = {
  updatedAt?: string | null;
  updatedBy?: string | null;
  className?: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HeaderMetaBase({ updatedAt, updatedBy, className = "" }: Props) {
  const dateStr = updatedAt ? formatDateTime(updatedAt) : "—";
  return (
    <div
      className={clsx(
        "flex items-center gap-2 text-[11px] md:text-xs opacity-80",
        className
      )}
    >
      <span>
        最終更新 {dateStr}
        {updatedBy?.trim() ? ` ${updatedBy.trim()}` : ""}
      </span>
    </div>
  );
}

export const HeaderMeta = Object.assign(React.memo(HeaderMetaBase), {});
