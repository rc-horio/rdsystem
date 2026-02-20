// src/pages/HubPage/parts/TopBar.tsx
import type { ReactNode } from "react";
import clsx from "clsx";
import { EditModeSwitch, SaveButton, HeaderMeta } from "@/components";
import { LogoButton } from "@/components";

export { HeaderMeta } from "@/components";

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
        className="fixed left-0 right-0 top-0 z-50 pointer-events-none"
        style={{
          height: "var(--safe-top)",
          background: "#000", // TopBar と同色
        }}
      />

      {/* TopBar 本体（位置は safe-top の直下） */}
      <div
        className="fixed left-0 right-0 w-full overflow-x-hidden z-51 bg-[#300d1d] text-slate-200 px-2 md:px-6 py-1 md:py-2"
        style={{ top: "var(--safe-top)" }}
      >
        {/* Grid: 左=auto / 中央=1fr / 右=auto */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-3 min-w-0">
          {/* 左：ロゴ → 編集 → SAVE（デスクトップ） or ロゴのみ（モバイル） */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0 md:mr-4">
            <LogoButton
              size={50}
              className="mr-1 md:mr-4"
            />
            {isPC ? (
              <div className="flex items-center gap-1 -my-1">
                <EditModeSwitch edit={edit} setEdit={setEdit} isMobile={false} />
                <SaveButton
                  onClick={onSave}
                  disabled={!edit || isSaving}
                  isMobile={false}
                />
              </div>
            ) : null}
          </div>

          {/* 中央：タイトル（案件名 → スケジュール名） */}
          <h1
            className="min-w-0 text-xs md:text-sm truncate md:line-clamp-2 md:leading-snug break-keep"
            title={title}
            aria-label={title}
          >
            {title}
          </h1>

          {/* 右：メタ & その他（デスクトップはメタのみ、モバイルは編集・SAVE・right） */}
          <div className="flex items-center gap-2 md:gap-3 -my-1 shrink-0 whitespace-nowrap">
            {isPC ? (
              <>
                <HeaderMeta
                  updatedAt={updatedAt ?? null}
                  updatedBy={updatedBy ?? null}
                  className="hidden md:flex"
                />
                {right}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 -my-1">
                  <EditModeSwitch edit={edit} setEdit={setEdit} isMobile={true} />
                  <SaveButton
                    onClick={onSave}
                    disabled={!edit || isSaving}
                    isMobile={true}
                  />
                </div>
                {right}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
