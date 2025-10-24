// src/features/hub/tabs/SitePhotos/index.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PhotoItem, ScheduleDetail } from "@/features/hub/types/resource";
import { FormModal, ButtonRed, DisplayOrTextarea } from "@/components";

interface Props {
  edit: boolean;
  setEdit: (v: boolean) => void;
  currentSchedule: ScheduleDetail | null;
  selectedId: string | null;
  setSchedules: (
    s: ScheduleDetail[] | ((p: ScheduleDetail[]) => ScheduleDetail[])
  ) => void;

  removeAt: (idx: number) => Promise<void> | void;
  projectId?: string | null;
  year?: string | null;
}

export default function SitePhotosTab({
  edit,
  currentSchedule,
  selectedId,
  setSchedules,
  removeAt,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const photos: PhotoItem[] = useMemo(
    () =>
      Array.isArray(currentSchedule?.photos) ? currentSchedule!.photos! : [],
    [currentSchedule?.photos]
  );

  // メモ欄の値（既存）
  const photosMemo = (currentSchedule as any)?.photosMemo ?? "";
  const updatePhotosMemo = (v: string) => {
    if (!selectedId) return;
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === selectedId ? ({ ...s, photosMemo: v } as any) : s
      )
    );
  };

  // プレビュー（既存）
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const openPreview = useCallback(
    (idx: number) => {
      if (!photos.length) return;
      setPreviewIndex(idx);
      setPreviewOpen(true);
    },
    [photos.length]
  );
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const showPrev = useCallback(() => {
    setPreviewIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);
  const showNext = useCallback(() => {
    setPreviewIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closePreview();
      if (ev.key === "ArrowLeft") showPrev();
      if (ev.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, closePreview, showPrev, showNext]);

  // File選択 → 署名GET → PUT → state反映
  const handleSelectFiles: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !selectedId) return;

    const newPhotos = files
      .filter((f) => f.type.startsWith("image/"))
      .map(
        (file) =>
          ({
            url: URL.createObjectURL(file),
            caption: file.name,
            __file: file,
          } as any)
      );

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === selectedId
          ? { ...s, photos: [...(s.photos ?? []), ...newPhotos] }
          : s
      )
    );

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* メモ＋写真追加 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
        <div className="flex-1 flex flex-col">
          <DisplayOrTextarea
            edit={edit}
            value={photosMemo}
            onChange={updatePhotosMemo}
            size="md"
            label="Memo"
            className="flex-1"
          />
        </div>

        <div className="md:w-56 shrink-0 flex self-end">
          {edit && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectFiles}
                className="hidden"
              />
              <ButtonRed
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full h-10 mt-3 md:-mt-11 disabled:opacity-60"
              >
                写真を追加
              </ButtonRed>
            </>
          )}
        </div>
      </div>

      {/* 写真一覧 */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-6 text-slate-300">
          まだ写真がありません。
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p, i) => (
            <li
              key={`${p.url}-${i}`}
              className="group rounded-xl overflow-hidden bg-slate-900 border border-slate-800"
            >
              <div className="w-full block">
                <button
                  type="button"
                  onClick={() => openPreview(i)}
                  className="w-full block cursor-zoom-in"
                  aria-label={`拡大表示: ${p.caption ?? `photo-${i + 1}`}`}
                >
                  <img
                    src={p.url}
                    alt={p.caption ?? `photo-${i}`}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                </button>
              </div>

              <div className="px-3 py-2 text-xs text-slate-300 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
                <span className="truncate" title={p.caption}>
                  {p.caption || `photo-${i + 1}`}
                </span>

                <div className="flex items-center gap-2">
                  {/* ← DL ボタンは削除 */}
                  {edit && (
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="opacity-70 hover:opacity-100 text-[11px] border border-slate-600 rounded px-2 py-1"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* プレビュー（既存） */}
      {previewOpen && photos[previewIndex] && (
        <FormModal
          show
          onClose={closePreview}
          title=""
          panelClassName="relative w-[92vw] max-w-[900px] h-[85vh] flex flex-col"
          footer={null}
        >
          <div className="flex-1 overflow-auto flex items-center justify-center pb-16">
            <div className="flex flex-col items-center justify-center w-full max-w-[min(92vw,880px)]">
              {photos[previewIndex].caption && (
                <div className="mb-3 text-sm text-slate-200 text-center w-full">
                  {photos[previewIndex].caption}
                </div>
              )}
              <img
                src={photos[previewIndex].url}
                alt={
                  photos[previewIndex].caption ?? `photo-${previewIndex + 1}`
                }
                className="w-auto max-w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 mb-3 px-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={showPrev}
              className="px-3 h-10 rounded-lg border border-slate-600 text-slate-200 text-sm"
            >
              ← 前へ
            </button>
            <div className="text-xs text-slate-400">
              {previewIndex + 1} / {photos.length}
            </div>
            <button
              type="button"
              onClick={showNext}
              className="px-3 h-10 rounded-lg border border-slate-600 text-slate-200 text-sm"
            >
              次へ →
            </button>
          </div>
        </FormModal>
      )}
    </div>
  );
}
