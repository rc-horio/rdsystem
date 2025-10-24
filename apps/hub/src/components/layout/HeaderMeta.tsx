import React from "react";
import clsx from "clsx";

type Props = {
  updatedAt?: string | null;
  updatedBy?: string | null;
  className?: string;
};

function HeaderMetaBase({ updatedAt, updatedBy, className = "" }: Props) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 text-[11px] md:text-xs opacity-80",
        className
      )}
    >
      <span>
        更新日時 {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
      </span>
      {updatedBy ? <span>{updatedBy}</span> : null}
    </div>
  );
}

export const HeaderMeta = Object.assign(React.memo(HeaderMetaBase), {});
