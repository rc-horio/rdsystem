// src/pages/HubPage/parts/TopBar.tsx
import type { ReactNode } from "react";
import clsx from "clsx";
import { EditModeSwitch, SaveButton } from "@/components";
import { LogoButton } from "@/components";

export function HeaderMeta({
  updatedAt,
  updatedBy,
  className = "",
}: {
  updatedAt?: string | null;
  updatedBy?: string | null;
  className?: string;
}) {
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

export function TopBar({
  title,
  isPC,
  updatedAt,
  updatedBy,
  edit,
  setEdit,
  isSaving,
  onSave,
  right,
}: {
  title: string;
  isPC?: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  edit: boolean;
  setEdit: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  right?: ReactNode;
}) {
  return (
    <>
      {/* セーフエリアの上部を TopBar と同色で塗る固定カバー */}
      <div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-[50] pointer-events-none"
        style={{
          height: "var(--safe-top)",
          background: "#000", // TopBar と同色
        }}
      />

      {/* TopBar 本体（位置は safe-top の直下） */}
      <div
        className="fixed left-0 right-0 w-full overflow-x-hidden z-[51] bg-[#300d1d] text-slate-200 px-2 md:px-6 py-1 md:py-2"
        style={{ top: "var(--safe-top)" }}
      >
        {/* Grid: 左=auto / 中央=1fr / 右=auto */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-3 min-w-0">
          {/* 左：ロゴ（固定幅） */}
          <div className="shrink-0">
            <LogoButton
              size={50}
              className="mr-1 md:mr-3"
            />
          </div>

          {/* 中央：タイトル（可変） */}
          <h1
            className="min-w-0 text-xs md:text-sm truncate md:line-clamp-2 md:leading-snug break-keep"
            title={title}
            aria-label={title}
          >
            {title}
          </h1>

          {/* 右：メタ & 操作（固定・折り返し禁止） */}
          <div className="flex items-center gap-2 md:gap-3 -my-1 shrink-0 whitespace-nowrap">
            {isPC ? (
              <HeaderMeta
                updatedAt={updatedAt ?? null}
                updatedBy={updatedBy ?? null}
                className="hidden md:flex"
              />
            ) : null}
            <div className="flex items-center gap-1 -my-1">
              <EditModeSwitch edit={edit} setEdit={setEdit} isMobile={!isPC} />
              <SaveButton
                onClick={onSave}
                disabled={!edit || isSaving}
                isMobile={!isPC}
              />
            </div>
            {right}
          </div>
        </div>
      </div>
    </>
  );
}
