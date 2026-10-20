// src/features/hub/tabs/SitePhotos/index.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PhotoItem, ScheduleDetail } from "@/features/hub/types/resource";
import { ButtonRed, DividerRed, Modal, SectionTitle } from "@/components";
import { catalogPublicUrlFromKey } from "@/features/hub/utils/catalogPublicUrl";

const PHOTO_MEMO_LINE_PX = 20;
const SUMMARY_LINE_PX = 20;
const SUMMARY_EDIT_ROWS = 8;

type SummaryFieldKey =
  | "photosResults"
  | "photosSite"
  | "photosRetrospective";

const SUMMARY_FIELDS: {
  key: SummaryFieldKey;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "photosResults",
    label: "実績",
    placeholder: "日付 / 機数 / 墜落・離陸せず",
  },
  {
    key: "photosSite",
    label: "現場状況",
    placeholder: "地形・磁場・天候・導線・機材",
  },
  {
    key: "photosRetrospective",
    label: "振り返り",
    placeholder: "要因と改善点",
  },
];

function SummaryField({
  edit,
  label,
  value,
  onChange,
  placeholder,
}: {
  edit: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  if (!edit) {
    return (
      <div>
        <SectionTitle title={label} />
        <div
          className="ui-field-shell whitespace-pre-wrap wrap-break-word text-slate-200"
          style={{
            fontSize: 14,
            lineHeight: `${SUMMARY_LINE_PX}px`,
            minHeight: SUMMARY_EDIT_ROWS * SUMMARY_LINE_PX,
          }}
        >
          {value}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle title={label} />
      <textarea
        rows={SUMMARY_EDIT_ROWS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-field-shell ui-field-shell--edit block w-full resize-y overflow-y-auto outline-none text-slate-100 placeholder:text-slate-500 field-sizing-fixed"
        style={{
          fontSize: 14,
          lineHeight: `${SUMMARY_LINE_PX}px`,
          minHeight: SUMMARY_EDIT_ROWS * SUMMARY_LINE_PX,
        }}
      />
    </div>
  );
}

const SEED_WORDS = ["草刈り", "トラブル", "パレット", "ブルーシート"];
/** レイアウト確認用。実際の件数はまだ数えない */
const DUMMY_WORD_DELETE_COUNT = 2;

function ScheduleWordsField({
  edit,
  selectedId,
  words,
  draft,
  attached,
  onDraftChange,
  onAdd,
  onToggle,
  onAskDelete,
}: {
  edit: boolean;
  selectedId: string | null;
  words: string[];
  draft: string;
  attached: string[];
  onDraftChange: (v: string) => void;
  onAdd: () => void;
  onToggle: (word: string) => void;
  onAskDelete: (word: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edit) return;
    setAdding(false);
    setDeleting(false);
  }, [edit]);

  useEffect(() => {
    if (!adding) return;
    inputRef.current?.focus();
  }, [adding]);

  const closeAdding = () => {
    setAdding(false);
    onDraftChange("");
  };

  const startAdding = () => {
    setDeleting(false);
    setAdding(true);
  };

  const startDeleting = () => {
    closeAdding();
    setDeleting(true);
  };

  const trimmedDraft = draft.trim();
  const duplicate = trimmedDraft !== "" && words.includes(trimmedDraft);

  const submit = () => {
    if (!trimmedDraft || duplicate) return;
    onAdd();
    setAdding(false);
  };

  if (!edit) {
    return (
      <div>
        <SectionTitle title="タグ" />
        {attached.length > 0 ? (
          <p className="flex flex-wrap text-sm text-slate-200">
            {attached.map((word, index) => (
              <span key={word} className="max-w-full shrink-0 wrap-break-word">
                {word}
                {index < attached.length - 1 ? "、" : ""}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-sm text-slate-400">タグは登録されていません</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle title="タグ" />
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {words.map((word) => {
          const checked = attached.includes(word);
          return (
            <li
              key={word}
              className={`flex max-w-full shrink-0 items-center ${
                deleting ? "gap-1" : "gap-2"
              }`}
            >
              {deleting ? (
                <>
                  <button
                    type="button"
                    onClick={() => onAskDelete(word)}
                    aria-label={`${word}を削除`}
                    className="inline-flex h-4 shrink-0 cursor-pointer items-center text-sm leading-none text-slate-300 hover:text-white"
                  >
                    ×
                  </button>
                  <span className="wrap-break-word text-sm text-slate-200">
                    {word}
                  </span>
                </>
              ) : (
                <label className="flex min-w-0 cursor-pointer select-none items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!selectedId}
                    onChange={() => onToggle(word)}
                    className="h-4 w-4 shrink-0 accent-red-600 disabled:opacity-50"
                  />
                  <span className="wrap-break-word">{word}</span>
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {adding ? (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeAdding();
                    return;
                  }
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  submit();
                }}
                className="ui-input w-48 max-w-full focus:border-(--ui-border) focus:ring-0"
              />
              <ButtonRed
                type="button"
                onClick={submit}
                disabled={!trimmedDraft || duplicate}
                className="h-9 shrink-0 px-4"
              >
                追加
              </ButtonRed>
              <button
                type="button"
                onClick={closeAdding}
                className="cursor-pointer text-sm text-slate-300 hover:text-white"
              >
                完了
              </button>
            </div>
            {duplicate && (
              <p className="text-xs text-red-400">このタグは既に存在します</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={startAdding}
            className="cursor-pointer text-sm text-slate-300 hover:text-white"
          >
            ＋ 追加
          </button>
        )}
        {words.length > 0 && (
          <button
            type="button"
            onClick={() => (deleting ? setDeleting(false) : startDeleting())}
            className="cursor-pointer text-sm text-slate-300 hover:text-white"
          >
            {deleting ? "完了" : "－ 削除"}
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoMemoTextarea({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div className="ui-field-shell ui-field-shell--edit">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="memo"
        className="block w-full resize-none overflow-y-auto bg-transparent outline-none border-0 p-0 text-slate-100 placeholder:text-slate-500 [field-sizing:fixed]"
        style={{
          fontSize: 14,
          lineHeight: `${PHOTO_MEMO_LINE_PX}px`,
          height: rows * PHOTO_MEMO_LINE_PX,
        }}
      />
    </div>
  );
}

function PhotoMemoBlock({
  edit,
  value,
  onChange,
  compact,
}: {
  edit: boolean;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const trimmed = value.trim();

  if (compact) {
    if (edit) {
      return (
        <PhotoMemoTextarea value={value} onChange={onChange} rows={2} />
      );
    }
    return (
      <p className="h-10 text-[14px] leading-5 text-slate-200 line-clamp-2 wrap-break-word">
        {trimmed ? value : "\u00a0"}
      </p>
    );
  }

  if (!edit) {
    if (!trimmed) return null;
    return (
      <p className="text-[14px] leading-5 text-slate-200 whitespace-pre-wrap wrap-break-word">
        {value}
      </p>
    );
  }
  return <PhotoMemoTextarea value={value} onChange={onChange} rows={4} />;
}

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
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [words, setWords] = useState<string[]>(SEED_WORDS);
  const [wordDraft, setWordDraft] = useState("");
  const [wordsBySchedule, setWordsBySchedule] = useState<
    Record<string, string[]>
  >({});
  const attachedWords = useMemo(() => {
    if (!selectedId) return [];
    const picked = new Set(wordsBySchedule[selectedId] ?? []);
    return words.filter((word) => picked.has(word));
  }, [selectedId, words, wordsBySchedule]);

  const addWord = () => {
    const next = wordDraft.trim();
    if (!next) return;
    setWords((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setWordDraft("");
  };

  const toggleWord = (word: string) => {
    if (!selectedId) return;
    setWordsBySchedule((prev) => {
      const current = prev[selectedId] ?? [];
      const has = current.includes(word);
      return {
        ...prev,
        [selectedId]: has
          ? current.filter((item) => item !== word)
          : [...current, word],
      };
    });
  };

  const confirmDeleteWord = (target: string) => {
    const ok = window.confirm(
      `「${target}」を削除します。${DUMMY_WORD_DELETE_COUNT}件の案件から外れます。`
    );
    if (!ok) return;
    setWords((prev) => prev.filter((word) => word !== target));
    setWordsBySchedule((prev) => {
      const next: Record<string, string[]> = {};
      for (const [id, list] of Object.entries(prev)) {
        next[id] = list.filter((word) => word !== target);
      }
      return next;
    });
  };

  const photos: PhotoItem[] = useMemo(
    () =>
      Array.isArray(currentSchedule?.photos) ? currentSchedule!.photos! : [],
    [currentSchedule?.photos]
  );

  const summaryValues: Record<SummaryFieldKey, string> = {
    photosResults: currentSchedule?.photosResults ?? "",
    photosSite: currentSchedule?.photosSite ?? "",
    photosRetrospective: currentSchedule?.photosRetrospective ?? "",
  };

  const updateSummaryField = (key: SummaryFieldKey, v: string) => {
    if (!selectedId) return;
    setSchedules((prev) =>
      prev.map((s) => (s.id === selectedId ? { ...s, [key]: v } : s))
    );
  };

  const updatePhotoMemo = (idx: number, v: string) => {
    if (!selectedId) return;
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s;
        const nextPhotos = [...(s.photos ?? [])];
        const target = nextPhotos[idx];
        if (!target) return s;
        nextPhotos[idx] = { ...target, memo: v };
        return { ...s, photos: nextPhotos };
      })
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

  const cancelDelete = () => setDeleteIndex(null);
  const confirmDelete = () => {
    if (deleteIndex === null) return;
    const idx = deleteIndex;
    setDeleteIndex(null);
    if (previewOpen) {
      if (previewIndex === idx) setPreviewOpen(false);
      else if (previewIndex > idx) setPreviewIndex((i) => i - 1);
    }
    void removeAt(idx);
  };

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "TEXTAREA" ||
          t.tagName === "INPUT" ||
          t.isContentEditable);
      if (ev.key === "Escape") closePreview();
      if (typing) return;
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
              `${file.name}の変換ができませんでした。別のファイルを選択するか、担当者にお問い合わせください。`
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
            memo: "",
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
      alert("ファイルの処理ができませんでした。しばらく時間をおいて、もう一度お試しください。");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {SUMMARY_FIELDS.map((field) => (
          <SummaryField
            key={field.key}
            edit={edit}
            label={field.label}
            value={summaryValues[field.key]}
            placeholder={field.placeholder}
            onChange={(v) => updateSummaryField(field.key, v)}
          />
        ))}
      </div>
      <DividerRed />
      <ScheduleWordsField
        edit={edit}
        selectedId={selectedId}
        words={words}
        draft={wordDraft}
        attached={attachedWords}
        onDraftChange={setWordDraft}
        onAdd={addWord}
        onToggle={toggleWord}
        onAskDelete={confirmDeleteWord}
      />
      <DividerRed />

      <div>
        <SectionTitle title="写真" />
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">まだ写真がありません。</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((p, i) => {
            const memoText = p.memo ?? "";
            return (
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
                      src={catalogPublicUrlFromKey(p.key ?? "") || p.url}
                      alt={p.caption ?? `photo-${i}`}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  </button>
                </div>

                <div className="px-3 py-2 flex items-end gap-2">
                  <div className="flex-1 min-w-0">
                    <PhotoMemoBlock
                      edit={edit}
                      value={memoText}
                      onChange={(v) => updatePhotoMemo(i, v)}
                      compact
                    />
                  </div>
                  {edit && (
                    <button
                      type="button"
                      onClick={() => setDeleteIndex(i)}
                      className="shrink-0 opacity-70 hover:opacity-100 text-[11px] border border-slate-600 rounded px-2 py-1"
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
        {edit && (
          <div className="mt-4 ml-auto w-full md:w-56">
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
              className="w-full h-10 disabled:opacity-60"
            >
              {isConverting ? "変換中..." : "写真を追加"}
            </ButtonRed>
            <div className="mt-2 text-[11px] leading-4 text-slate-400">
              ※HEIC形式はiPhoneからのアップロードのみ対応
            </div>
          </div>
        )}
      </div>
      {/* プレビュー（既存） */}
      {previewOpen && photos[previewIndex] && (
        <Modal
          show
          onClose={closePreview}
          panelClassName="relative w-[92vw] max-w-[900px] h-[85vh] flex flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <img
                src={
                  catalogPublicUrlFromKey(photos[previewIndex].key ?? "") ||
                  photos[previewIndex].url
                }
                alt={
                  photos[previewIndex].caption ?? `photo-${previewIndex + 1}`
                }
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            {(edit ||
              (photos[previewIndex].memo ?? "").trim().length > 0) && (
              <div className="w-full shrink-0 px-1">
                <PhotoMemoBlock
                  edit={edit}
                  value={photos[previewIndex].memo ?? ""}
                  onChange={(v) => updatePhotoMemo(previewIndex, v)}
                />
              </div>
            )}

            <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-1">
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
          </div>
        </Modal>
      )}

      {deleteIndex !== null && (
        <Modal
          show
          onClose={cancelDelete}
          showCloseButton={false}
          panelClassName="relative w-[min(92vw,400px)] h-auto max-h-[90vh] p-8"
        >
          <p className="text-center text-lg text-slate-100">
            写真を削除しますか？
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={cancelDelete}
              className="rounded-md border border-slate-500 bg-transparent px-6 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              いいえ
            </button>
            <ButtonRed type="button" onClick={confirmDelete}>
              はい
            </ButtonRed>
          </div>
        </Modal>
      )}
    </div>
  );
}
