import { useEffect, useRef, useState } from "react";
import {
  InputBox,
  detectEmbedMode,
  useEditableBodyClass,
} from "@/components";
import type {
  TabKey,
  HistoryItem,
  GeometryMetrics,
  DetailMeta,
  Candidate,
} from "@/features/types";
import {
  CLS_DETAILBAR_OPEN,
  EV_DETAILBAR_REQUEST_DATA,
  EV_DETAILBAR_RESPOND_DATA,
  EV_DETAILBAR_SET_TITLE,
  EV_DETAILBAR_SET_META,
  EV_DETAILBAR_SET_HISTORY,
  EV_DETAILBAR_SET_METRICS,
  EV_DETAILBAR_SELECT_HISTORY,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_DETAILBAR_SELECTED,
  EV_SIDEBAR_SET_ACTIVE,
  EV_PROJECT_MODAL_OPEN,
} from "./constants/events";
import { BasicInfoSection } from "./detailBar/BasicInfoSection";
import { OtherCompanyPanel } from "./detailBar/OtherCompanyPanel";
import { ConsideringPanel } from "./detailBar/ConsideringPanel";
import { DetailBarTabs } from "./detailBar/DetailBarTabs";
import {
  EMPTY_DETAIL_META,
  formatDateTime,
  hasDuplicateCandidateTitle,
  makeUniqueCandidateCopyTitle,
} from "./detailBar/helpers";
import { OwnFlightAreaPanel } from "./detailBar/OwnFlightAreaPanel";
import { useDetailBarResize } from "./detailBar/useDetailBarResize";

export default function SideDetailBar({ open }: { open?: boolean }) {
  const isEmbed = detectEmbedMode();
  if (isEmbed) {
    return null;
  }
  const editable = useEditableBodyClass();
  const { handleResizeMouseDown } = useDetailBarResize();
  const [active, setActive] = useState<TabKey>("basic");
  const [title, setTitle] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(
    null
  );
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<
    number | null
  >(null);
  const [editingCandidateIdx, setEditingCandidateIdx] = useState<number | null>(
    null
  );
  const [editingCandidateTitle, setEditingCandidateTitle] = useState("");
  const editingCandidateInputRef = useRef<HTMLInputElement>(null);
  const [pendingNewCandidateIdx, setPendingNewCandidateIdx] = useState<
    number | null
  >(null);
  const [meta, setMeta] = useState<DetailMeta>({ ...EMPTY_DETAIL_META });

  const candidates = meta.candidate ?? [];
  const otherRecords = meta.otherRecords ?? [];
  const candidateDeletionLocked = !!meta.candidateDeletionLocked;

  const initialScheduleRef = useRef<{
    projectUuid?: string;
    scheduleUuid?: string;
  }>(
    (() => {
      const params = new URLSearchParams(window.location.search);
      return {
        projectUuid: params.get("projectUuid") || undefined,
        scheduleUuid: params.get("scheduleUuid") || undefined,
      };
    })()
  );
  const didAutoSelectRef = useRef(false);

  const patchMeta = (patch: Partial<DetailMeta>) => {
    setMeta((prev) => ({ ...prev, ...patch }));
  };

  const handleRegisterProjectInfo = () => {
    window.dispatchEvent(new Event(EV_PROJECT_MODAL_OPEN));
  };

  const handleAddCandidate = () => {
    if (candidateDeletionLocked) return;
    const nextIdx = candidates.length;
    const newCandidate: Candidate = {
      title: "",
      flightAltitude_min_m: undefined,
      flightAltitude_Max_m: undefined,
      takeoffArea: undefined,
      flightArea: undefined,
      safetyArea: undefined,
      audienceArea: undefined,
    };
    setMeta((prev) => ({
      ...prev,
      candidate: [...(prev.candidate ?? []), newCandidate],
    }));
    setSelectedHistoryIdx(null);
    setSelectedCandidateIdx(nextIdx);
    setEditingCandidateIdx(nextIdx);
    setEditingCandidateTitle(newCandidate.title);
    setPendingNewCandidateIdx(nextIdx);
  };

  const commitCandidateTitle = (): boolean => {
    if (editingCandidateIdx == null) return false;
    if (candidateDeletionLocked) return false;

    const idx = editingCandidateIdx;
    const finalTitle = editingCandidateTitle.trim() || "候補地ラベル";

    if (hasDuplicateCandidateTitle(candidates, finalTitle, idx)) {
      window.alert(
        "同じタイトルの候補が既にあります。別のタイトルを入力してください。"
      );
      return false;
    }

    setMeta((prev) => {
      const list = [...(prev.candidate ?? [])];
      const target = list[idx];
      if (!target) return prev;
      list[idx] = { ...target, title: finalTitle };
      return { ...prev, candidate: list };
    });

    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");
    setPendingNewCandidateIdx(null);
    setSelectedHistoryIdx(null);
    setSelectedCandidateIdx(idx);

    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
        detail: {
          geometry: {
            flightAltitude_min_m: undefined,
            flightAltitude_Max_m: undefined,
            takeoffArea: undefined,
            flightArea: undefined,
            safetyArea: undefined,
            audienceArea: undefined,
          },
          index: idx,
          title: finalTitle,
        },
      })
    );
    return true;
  };

  const cancelCandidateEdit = () => {
    const idx = editingCandidateIdx;
    const isPendingNew =
      idx != null && pendingNewCandidateIdx === idx;
    const isEmptyInput = editingCandidateTitle.trim() === "";

    if (isPendingNew && isEmptyInput) {
      setMeta((prev) => {
        const list = Array.isArray(prev.candidate) ? [...prev.candidate] : [];
        if (idx == null || idx < 0 || idx >= list.length) return prev;
        list.splice(idx, 1);
        return { ...prev, candidate: list };
      });
      setSelectedCandidateIdx((current) => (current === idx ? null : current));
      setPendingNewCandidateIdx(null);
    }

    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");
  };

  const startEditCandidate = (idx: number) => {
    if (
      editingCandidateIdx != null &&
      editingCandidateIdx !== idx
    ) {
      const ok = commitCandidateTitle();
      if (!ok) return;
    }
    setEditingCandidateIdx(idx);
    setEditingCandidateTitle(candidates[idx]?.title ?? "");
  };

  const duplicateCandidate = (idx: number) => {
    if (candidateDeletionLocked) return;
    const source = candidates[idx];
    if (!source) return;

    const copied: Candidate = JSON.parse(JSON.stringify(source));
    copied.title = makeUniqueCandidateCopyTitle(
      candidates,
      source.title ?? ""
    );
    const nextIdx = candidates.length;
    setMeta((prev) => ({
      ...prev,
      candidate: [...(prev.candidate ?? []), copied],
    }));
    setSelectedHistoryIdx(null);
    setSelectedCandidateIdx(nextIdx);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
        detail: {
          geometry: {
            flightAltitude_min_m: copied.flightAltitude_min_m,
            flightAltitude_Max_m: copied.flightAltitude_Max_m,
            takeoffArea: copied.takeoffArea,
            flightArea: copied.flightArea,
            safetyArea: copied.safetyArea,
            audienceArea: copied.audienceArea,
          },
          index: nextIdx,
          title: copied.title,
        },
      })
    );
    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");
    setPendingNewCandidateIdx(null);
  };

  const deleteCandidate = (idx: number, candidate: Candidate) => {
    const ok = window.confirm(
      `候補「${candidate.title || "（無題の候補）"}」を削除してもよろしいですか？`
    );
    if (!ok) return;

    setMeta((prev) => {
      const list = Array.isArray(prev.candidate) ? [...prev.candidate] : [];
      if (idx < 0 || idx >= list.length) return prev;
      list.splice(idx, 1);
      return { ...prev, candidate: list };
    });
    setSelectedCandidateIdx((current) => (current === idx ? null : current));
    if (editingCandidateIdx != null) {
      cancelCandidateEdit();
    }
    window.alert("候補を削除しました。\nSAVEボタンで確定してください。");
  };

  const sanitizeHistory = (arrLike: unknown): HistoryItem[] => {
    const arr = Array.isArray(arrLike) ? (arrLike as any[]) : [];
    return arr.flatMap((x) => {
      const date = typeof x?.date === "string" ? x.date : null;
      const projectName =
        typeof x?.projectName === "string"
          ? x.projectName
          : typeof x?.project_name === "string"
          ? x.project_name
          : null;
      const scheduleName =
        typeof x?.scheduleName === "string"
          ? x.scheduleName
          : typeof x?.label === "string"
          ? x.label
          : null;
      const projectUuid =
        typeof x?.projectUuid === "string"
          ? x.projectUuid
          : typeof x?.projectuuid === "string"
          ? x.projectuuid
          : typeof x?.project_uuid === "string"
          ? x.project_uuid
          : undefined;
      const scheduleUuid =
        typeof x?.scheduleUuid === "string"
          ? x.scheduleUuid
          : typeof x?.scheduleuuid === "string"
          ? x.scheduleuuid
          : typeof x?.schedule_uuid === "string"
          ? x.schedule_uuid
              : typeof x?.id === "string"
          ? x.id
          : undefined;
      return date && projectName && scheduleName
        ? [{ date, projectName, scheduleName, projectUuid, scheduleUuid }]
        : [];
    });
  };

  const onSelectHistory = (item: HistoryItem, idx: number) => {
    setSelectedHistoryIdx(idx);
    setSelectedCandidateIdx(null);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "schedule" as const },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
      detail: { ...item, index: idx },
      })
    );
  };

  const onDeleteHistory = (idx: number, item: HistoryItem) => {
    const ok = window.confirm(
      "紐づけを解除しますか？案件情報は削除されません。"
    );
    if (!ok) return;
    window.alert("案件情報の紐づけを解除しました。");
    setHistory((prev) => prev.filter((_, i) => i !== idx));
    setSelectedHistoryIdx((current) => (current === idx ? null : current));
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: false, kind: null as null },
      })
    );
    console.log("[detailbar] delete history clicked (TODO backend)", {
      index: idx,
      item,
    });
  };

  const onSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    setSelectedHistoryIdx(null);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    const selectedCandidate = meta.candidate[idx];
    if (selectedCandidate) {
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
          detail: {
            geometry: {
        flightAltitude_min_m: selectedCandidate.flightAltitude_min_m,
        flightAltitude_Max_m: selectedCandidate.flightAltitude_Max_m,
        takeoffArea: selectedCandidate.takeoffArea,
        flightArea: selectedCandidate.flightArea,
        safetyArea: selectedCandidate.safetyArea,
        audienceArea: selectedCandidate.audienceArea,
            },
            index: idx,
            title: selectedCandidate.title,
          },
        })
      );
    }
  };

  useEffect(() => {
    const candLen = candidates?.length ?? 0;
    if (selectedCandidateIdx != null && selectedCandidateIdx >= candLen) {
      setSelectedCandidateIdx(null);
    }
    if (editingCandidateIdx != null && editingCandidateIdx >= candLen) {
      setEditingCandidateIdx(null);
      setEditingCandidateTitle("");
      setPendingNewCandidateIdx(null);
    }
    if (candidateDeletionLocked) {
      setSelectedCandidateIdx(null);
      setEditingCandidateIdx(null);
      setEditingCandidateTitle("");
      setPendingNewCandidateIdx(null);
    }
  }, [
    candidates?.length,
    selectedCandidateIdx,
    editingCandidateIdx,
    candidateDeletionLocked,
  ]);

  useEffect(() => {
    const onRequest = () => {
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_RESPOND_DATA, {
        detail: { title, meta, history },
        })
      );
    };
    window.addEventListener(
      EV_DETAILBAR_REQUEST_DATA,
      onRequest as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_REQUEST_DATA,
        onRequest as EventListener
      );
  }, [title, meta, history]);

  useEffect(() => {
    if (typeof open === "boolean") {
      document.body.classList.toggle(CLS_DETAILBAR_OPEN, open);
      return () => {
        document.body.classList.remove(CLS_DETAILBAR_OPEN);
      };
    }
  }, [open]);

  useEffect(() => {
    const onSetTitle = (e: Event) => {
      const ce = e as CustomEvent<{ title?: string }>;
      if (ce.detail?.title != null) setTitle(ce.detail.title);
    };
    window.addEventListener(
      EV_DETAILBAR_SET_TITLE,
      onSetTitle as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_TITLE,
        onSetTitle as EventListener
      );
  }, []);

  useEffect(() => {
    const onSetMeta = (e: Event) => {
      const ce = e as CustomEvent<{ meta?: Partial<DetailMeta> }>;
      const m = ce.detail?.meta ?? {};
      const hasCandidateDeletionLocked = Object.prototype.hasOwnProperty.call(
        m,
        "candidateDeletionLocked"
      );
      setMeta((prev) => ({
        ...prev,
        ...m,
        ...(hasCandidateDeletionLocked
          ? {}
          : { candidateDeletionLocked: false }),
      }));
    };
    window.addEventListener(EV_DETAILBAR_SET_META, onSetMeta as EventListener);
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_META,
        onSetMeta as EventListener
      );
  }, []);

  useEffect(() => {
    const onSetHistory = (e: Event) => {
      const ce = e as CustomEvent<{ history?: unknown }>;
      const sanitized = sanitizeHistory(ce.detail?.history);
      setHistory(sanitized);
      setSelectedHistoryIdx(null);
      setSelectedCandidateIdx(null);
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false, kind: null as null },
        })
      );
    };
    window.addEventListener(
      EV_DETAILBAR_SET_HISTORY,
      onSetHistory as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_HISTORY,
        onSetHistory as EventListener
      );
  }, []);

  useEffect(() => {
    if (selectedHistoryIdx != null && selectedHistoryIdx >= history.length) {
      setSelectedHistoryIdx(null);
    }
  }, [history, selectedHistoryIdx]);

  useEffect(() => {
    if (selectedHistoryIdx === null && selectedCandidateIdx === null) {
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false, kind: null as null },
        })
      );
    }
  }, [selectedHistoryIdx, selectedCandidateIdx]);

  useEffect(() => {
    const reset = () => {
      setSelectedHistoryIdx(null);
      setSelectedCandidateIdx(null);
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false, kind: null as null },
        })
      );
    };
    window.addEventListener(EV_SIDEBAR_SET_ACTIVE, reset as EventListener);
    return () =>
      window.removeEventListener(EV_SIDEBAR_SET_ACTIVE, reset as EventListener);
  }, []);

  useEffect(() => {
    if (editingCandidateIdx != null && editingCandidateInputRef.current) {
      const input = editingCandidateInputRef.current;
      const len = input.value.length;
      input.focus();
      window.setTimeout(() => {
        try {
          input.setSelectionRange(len, len);
        } catch {
          /* noop */
        }
      }, 0);
    }
  }, [editingCandidateIdx]);

  useEffect(() => {
    if (didAutoSelectRef.current) return;
    const { projectUuid, scheduleUuid } = initialScheduleRef.current;
    if (!projectUuid || !scheduleUuid) return;
    if (!history || history.length === 0) return;

    const idx = history.findIndex(
      (h) => h.projectUuid === projectUuid && h.scheduleUuid === scheduleUuid
    );
    if (idx < 0) return;

    setActive("own");
    didAutoSelectRef.current = true;
    onSelectHistory(history[idx], idx);
  }, [history]);

  const hideDetailBar = () => {
            document.body.classList.remove(CLS_DETAILBAR_OPEN);
            window.dispatchEvent(
              new CustomEvent(EV_DETAILBAR_SELECTED, {
                detail: { isSelected: false, kind: null as null },
              })
            );
  };

  return (
    <div
      id="detailbar"
      aria-hidden={typeof open === "boolean" ? !open : undefined}
    >
      <div className="detailbar-hide">
          <button
          type="button"
          className="detailbar-close"
          title="詳細バーを隠す"
          aria-label="詳細バーを隠す"
          onClick={hideDetailBar}
        >
          ×
          </button>
      </div>

      <div className="detailbar-panel">
        <div className="detailbar-area-title">
              <InputBox
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="エリア名称"
              />
            </div>
        <DetailBarTabs active={active} onChange={setActive} />
        {active === "basic" && (
          <BasicInfoSection meta={meta} onMetaPatch={patchMeta} />
        )}
        {active === "own" && (
          <OwnFlightAreaPanel
            history={history}
            selectedHistoryIdx={selectedHistoryIdx}
            editable={editable}
            onSelectHistory={onSelectHistory}
            onDeleteHistory={onDeleteHistory}
            onRegisterProject={handleRegisterProjectInfo}
          />
        )}
        {active === "considering" && (
          <ConsideringPanel
            candidates={candidates}
            selectedCandidateIdx={selectedCandidateIdx}
            editingCandidateIdx={editingCandidateIdx}
            editingCandidateTitle={editingCandidateTitle}
            editingCandidateInputRef={editingCandidateInputRef}
            candidateDeletionLocked={candidateDeletionLocked}
            editable={editable}
            onSelectCandidate={onSelectCandidate}
            onStartEditCandidate={startEditCandidate}
            onEditingTitleChange={setEditingCandidateTitle}
            onCommitCandidateTitle={commitCandidateTitle}
            onCancelCandidateEdit={cancelCandidateEdit}
            onDuplicateCandidate={duplicateCandidate}
            onDeleteCandidate={deleteCandidate}
            onAddCandidate={handleAddCandidate}
            pendingNewCandidateIdx={pendingNewCandidateIdx}
          />
        )}
        {active === "other" && (
          <OtherCompanyPanel
            records={otherRecords}
            editable={editable}
            onRecordsChange={(update) => {
              setMeta((prev) => {
                const current = prev.otherRecords ?? [];
                const next =
                  typeof update === "function" ? update(current) : update;
                return { ...prev, otherRecords: next };
              });
            }}
          />
        )}
      </div>

      {(meta.updated_at ?? meta.updated_by) && (
        <div className="detailbar-footer">
          最終更新 {meta.updated_at ? formatDateTime(meta.updated_at) : "—"}
          {meta.updated_by?.trim() ? ` ${meta.updated_by.trim()}` : ""}
        </div>
      )}

      <div
        className="detailbar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="詳細バーの幅を変更"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

export function openDetailBar() {
  if (detectEmbedMode()) return;
  document.body.classList.add(CLS_DETAILBAR_OPEN);
}
export function closeDetailBar() {
  if (detectEmbedMode()) return;
  document.body.classList.remove(CLS_DETAILBAR_OPEN);
}

export function setDetailBarTitle(title: string) {
  window.dispatchEvent(
    new CustomEvent(EV_DETAILBAR_SET_TITLE, { detail: { title } })
  );
}

export function setDetailBarHistory(history: any[]) {
  window.dispatchEvent(
    new CustomEvent(EV_DETAILBAR_SET_HISTORY, { detail: { history } })
  );
}

export function setDetailBarMeta(meta: Partial<DetailMeta>) {
  window.dispatchEvent(
    new CustomEvent(EV_DETAILBAR_SET_META, { detail: { meta } })
  );
}

export function setDetailBarMetrics(metrics: Partial<GeometryMetrics>) {
  window.dispatchEvent(
    new CustomEvent(EV_DETAILBAR_SET_METRICS, { detail: { metrics } })
  );
}
