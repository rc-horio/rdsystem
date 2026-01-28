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

// HEICをJPEGに変換する関数
const convertHeicToJpeg = async (file: File): Promise<File> => {
  // heic2anyライブラリを動的にインポート
  const heic2any = await import("heic2any");

  try {
    const convertedBlob = await heic2any.default({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // Blobが配列で返される場合があるので最初の要素を取得
    const blob = Array.isArray(convertedBlob)
      ? convertedBlob[0]
      : convertedBlob;

    // 元のファイル名の拡張子を.jpgに変更
    const newFileName = file.name.replace(/\.heic$/i, ".jpg");

    return new File([blob], newFileName, { type: "image/jpeg" });
  } catch (error) {
    console.error("HEIC conversion failed:", error);
    throw new Error("HEIC画像の変換に失敗しました");
  }
};

export default function SitePhotosTab({
  edit,
  currentSchedule,
  selectedId,
  setSchedules,
  removeAt,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isConverting, setIsConverting] = useState(false);

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

  // File選択 → HEIC変換 → 署名GET → PUT → state反映
  const handleSelectFiles: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !selectedId) return;

    setIsConverting(true);

    try {
      const processedFiles: File[] = [];

      // 各ファイルを処理（HEIC変換が必要なら変換）
      for (const file of files) {
        const isHeic = /\.heic$/i.test(file.name) || file.type === "image/heic";
        const isImage = file.type.startsWith("image/") || isHeic;

        if (!isImage) continue;

        if (isHeic) {
          try {
            const converted = await convertHeicToJpeg(file);
            processedFiles.push(converted);
          } catch (error) {
            console.error(`Failed to convert ${file.name}:`, error);
            alert(
              `${file.name}の変換に失敗しました。別のファイルを選択してください。`
            );
          }
        } else {
          processedFiles.push(file);
        }
      }

      const newPhotos = processedFiles.map(
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
    } catch (error) {
      console.error("File processing error:", error);
      alert("ファイルの処理中にエラーが発生しました。");
    } finally {
      setIsConverting(false);
    }
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
          <div className="md:w-56 shrink-0 flex self-end">
            {edit && (
              <div className="w-full">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,.heic"
                  multiple
                  onChange={handleSelectFiles}
                  className="hidden"
                />
                <ButtonRed
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isConverting}
                  className="w-full h-10 mt-3 md:-mt-11 disabled:opacity-60"
                >
                  {isConverting ? "変換中..." : "写真を追加"}
                </ButtonRed>

                {/* 追加：注意文 */}
                <div className="mt-2 text-[11px] leading-4 text-slate-400">
                  ※HEIC形式はiPhoneからのアップロードのみ対応
                </div>
              </div>
            )}
          </div>
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
              ◀
            </button>
            <div className="text-xs text-slate-400">
              {previewIndex + 1} / {photos.length}
            </div>
            <button
              type="button"
              onClick={showNext}
              className="px-3 h-10 rounded-lg border border-slate-600 text-slate-200 text-sm"
            >
              ▶
            </button>
          </div>
        </FormModal>
      )}
    </div>
  );
}
