import { useEffect, useMemo, useState } from "react";
import { BaseModal } from "@/components";
import {
  hasAnyCopySource,
  type CopySourceItem,
  type CopySourceTree,
} from "./flightFigureCopy";

type GroupKey = "own" | "considering" | "other";

type Props = {
  open: boolean;
  title: string;
  sources: CopySourceTree;
  destinationKind: "own" | "considering" | "other";
  onClose: () => void;
  onNew: () => void;
  onCopy: (source: CopySourceItem) => void;
  onClearConsideringCandidates?: (sourceIndex: number) => void;
};

function sourceLabel(title: string) {
  return title.trim() || "（無題）";
}

export function AddFlightFigureModal({
  open,
  title,
  sources,
  destinationKind,
  onClose,
  onNew,
  onCopy,
  onClearConsideringCandidates,
}: Props) {
  const [mode, setMode] = useState<"new" | "copy">("new");
  const [group, setGroup] = useState<GroupKey>("own");
  const [projectIdx, setProjectIdx] = useState(0);
  const [scheduleIdx, setScheduleIdx] = useState(0);
  const [recordIdx, setRecordIdx] = useState(0);
  const [figureIdx, setFigureIdx] = useState(0);
  const [deleteSourceAfterCopy, setDeleteSourceAfterCopy] = useState(true);

  const groups = useMemo(() => {
    const next: { key: GroupKey; label: string }[] = [];
    if (sources.own.length > 0) next.push({ key: "own", label: "自社" });
    if (destinationKind !== "other" && sources.considering.length > 0) {
      next.push({ key: "considering", label: "候補地" });
    }
    if (sources.other.length > 0) next.push({ key: "other", label: "他社" });
    return next;
  }, [sources, destinationKind]);

  const defaultGroup =
    groups.find((item) => item.key === destinationKind)?.key ??
    groups[0]?.key ??
    "own";

  const canCopy = hasAnyCopySource(sources, destinationKind);

  useEffect(() => {
    if (!open) return;
    setMode("new");
    setGroup(defaultGroup);
    setProjectIdx(0);
    setScheduleIdx(0);
    setRecordIdx(0);
    setFigureIdx(0);
    setDeleteSourceAfterCopy(true);
  }, [open, defaultGroup]);

  const selectedProject = sources.own[projectIdx] ?? sources.own[0];
  const selectedSchedule =
    selectedProject?.schedules[scheduleIdx] ?? selectedProject?.schedules[0];
  const selectedRecord = sources.other[recordIdx] ?? sources.other[0];

  const selectedSource = ((): CopySourceItem | null => {
    if (group === "own") {
      return selectedSchedule?.figures[figureIdx] ?? null;
    }
    if (group === "considering") {
      return sources.considering[figureIdx] ?? null;
    }
    return selectedRecord?.figures[figureIdx] ?? null;
  })();

  const canSubmitCopy = mode === "copy" && !!selectedSource;

  if (!open) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      backdropClassName="map-modal-backdrop"
      containerClassName="map-modal-container"
    >
      <div className="register-project-modal add-figure-modal">
        <div className="add-figure-modal__modes" role="tablist">
          <button
            type="button"
            className={`add-figure-modal__mode ${mode === "new" ? "is-on" : ""}`}
            onClick={() => {
              onNew();
              onClose();
            }}
          >
            新規作成
          </button>
          <button
            type="button"
            className={`add-figure-modal__mode ${mode === "copy" ? "is-on" : ""}`}
            disabled={!canCopy}
            onClick={() => setMode("copy")}
          >
            複製
          </button>
        </div>

        {mode === "copy" && !canCopy && (
          <p className="add-figure-modal__empty">
            複製できる飛行エリア図がありません。
          </p>
        )}

        {mode === "copy" && canCopy && (
          <>
            <div className="register-project-modal__row">
              <label className="register-project-modal__label">
                複製元
                <select
                  className="register-project-modal__input register-project-modal__select"
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value as GroupKey);
                    setProjectIdx(0);
                    setScheduleIdx(0);
                    setRecordIdx(0);
                    setFigureIdx(0);
                  }}
                >
                  {groups.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {group === "own" && (
              <>
                <div className="register-project-modal__row">
                  <label className="register-project-modal__label">
                    案件
                    <select
                      className="register-project-modal__input register-project-modal__select"
                      value={projectIdx}
                      onChange={(e) => {
                        setProjectIdx(Number(e.target.value));
                        setScheduleIdx(0);
                        setFigureIdx(0);
                      }}
                    >
                      {sources.own.map((project, idx) => (
                        <option key={`${project.name}-${idx}`} value={idx}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="register-project-modal__row">
                  <label className="register-project-modal__label">
                    スケジュール
                    <select
                      className="register-project-modal__input register-project-modal__select"
                      value={scheduleIdx}
                      onChange={(e) => {
                        setScheduleIdx(Number(e.target.value));
                        setFigureIdx(0);
                      }}
                    >
                      {(selectedProject?.schedules ?? []).map((schedule, idx) => (
                        <option key={`${schedule.name}-${idx}`} value={idx}>
                          {schedule.date
                            ? `${schedule.name}（${schedule.date}）`
                            : schedule.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="register-project-modal__row">
                  <label className="register-project-modal__label">
                    飛行エリア図
                    <select
                      className="register-project-modal__input register-project-modal__select"
                      value={figureIdx}
                      onChange={(e) => setFigureIdx(Number(e.target.value))}
                    >
                      {(selectedSchedule?.figures ?? []).map((figure, idx) => (
                        <option key={`${figure.title}-${idx}`} value={idx}>
                          {sourceLabel(figure.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            {group === "considering" && (
              <div className="register-project-modal__row">
                <label className="register-project-modal__label">
                  候補
                  <select
                    className="register-project-modal__input register-project-modal__select"
                    value={figureIdx}
                    onChange={(e) => setFigureIdx(Number(e.target.value))}
                  >
                    {sources.considering.map((figure, idx) => (
                      <option key={`${figure.title}-${idx}`} value={idx}>
                        {sourceLabel(figure.title)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {group === "other" && (
              <>
                <div className="register-project-modal__row">
                  <label className="register-project-modal__label">
                    実績
                    <select
                      className="register-project-modal__input register-project-modal__select"
                      value={recordIdx}
                      onChange={(e) => {
                        setRecordIdx(Number(e.target.value));
                        setFigureIdx(0);
                      }}
                    >
                      {sources.other.map((record, idx) => (
                        <option key={`${record.eventName}-${idx}`} value={idx}>
                          {[
                            record.eventName.trim() || "（無題の実績）",
                            record.companyName.trim(),
                            record.date,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="register-project-modal__row">
                  <label className="register-project-modal__label">
                    飛行エリア図
                    <select
                      className="register-project-modal__input register-project-modal__select"
                      value={figureIdx}
                      onChange={(e) => setFigureIdx(Number(e.target.value))}
                    >
                      {(selectedRecord?.figures ?? []).map((figure, idx) => (
                        <option key={`${figure.title}-${idx}`} value={idx}>
                          {sourceLabel(figure.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {group === "considering" &&
              destinationKind !== "considering" &&
              onClearConsideringCandidates && (
                <label className="add-figure-modal__check">
                  <input
                    type="checkbox"
                    checked={deleteSourceAfterCopy}
                    onChange={(e) => setDeleteSourceAfterCopy(e.target.checked)}
                  />
                  <span>コピー元の飛行エリア図を削除する</span>
                </label>
              )}
          </>
        )}

        {mode === "copy" && (
          <div className="register-project-modal__actions">
            <button
              type="button"
              className="register-project-modal__btn register-project-modal__btn--cancel"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="register-project-modal__btn register-project-modal__btn--ok"
              disabled={!canSubmitCopy}
              onClick={() => {
                if (!selectedSource) return;
                const clearConsidering =
                  group === "considering" &&
                  destinationKind !== "considering" &&
                  deleteSourceAfterCopy;
                onCopy(selectedSource);
                if (clearConsidering) {
                  onClearConsideringCandidates?.(figureIdx);
                }
                onClose();
              }}
            >
              追加
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
