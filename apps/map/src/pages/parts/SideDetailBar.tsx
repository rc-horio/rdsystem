import { useEffect, useMemo, useRef, useState } from "react";
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
  OtherFlightFigure,
  FlightFigure,
} from "@/features/types";
import { normalizeScheduleFlightArea } from "@/features/flightFigures";
import {
  CLS_DETAILBAR_OPEN,
  EV_DETAILBAR_REQUEST_DATA,
  EV_DETAILBAR_RESPOND_DATA,
  EV_DETAILBAR_SET_TITLE,
  EV_DETAILBAR_SET_META,
  EV_DETAILBAR_SET_HISTORY,
  EV_DETAILBAR_SET_TAB,
  EV_DETAILBAR_PATCH_CONSIDERING,
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
  EMPTY_CONSIDERING_INFO,
  EMPTY_DETAIL_META,
  formatDateTime,
  geometryFromFigure,
} from "./detailBar/helpers";
import { OwnFlightAreaPanel } from "./detailBar/OwnFlightAreaPanel";
import { useDetailBarResize } from "./detailBar/useDetailBarResize";
import {
  buildCopySourceTree,
  geometryToFlatFields,
  makeUniqueCopyTitle,
  type CopySourceItem,
} from "./detailBar/flightFigureCopy";

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
  const [selectedOtherFigure, setSelectedOtherFigure] = useState<{
    recordIdx: number;
    figureIdx: number;
  } | null>(null);
  const [selectedOwnFigureId, setSelectedOwnFigureId] = useState<string | null>(
    null
  );
  const [meta, setMeta] = useState<DetailMeta>({ ...EMPTY_DETAIL_META });

  const candidates = meta.candidate ?? [];
  const considering = meta.considering ?? EMPTY_CONSIDERING_INFO;
  const otherRecords = meta.otherRecords ?? [];
  const candidateDeletionLocked = !!meta.candidateDeletionLocked;
  const tabStamp =
    meta.tabUpdates?.[active]?.updated_at || meta.tabUpdates?.[active]?.updated_by
      ? meta.tabUpdates[active]
      : { updated_at: meta.updated_at, updated_by: meta.updated_by };
  const copySourceTree = useMemo(
    () => buildCopySourceTree(history, candidates, otherRecords),
    [history, candidates, otherRecords]
  );

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
    window.dispatchEvent(new CustomEvent(EV_PROJECT_MODAL_OPEN));
  };

  const patchConsidering = (patch: Partial<typeof considering>) => {
    setMeta((prev) => ({
      ...prev,
      considering: { ...(prev.considering ?? EMPTY_CONSIDERING_INFO), ...patch },
    }));
  };

  const handleAddCandidate = () => {
    if (candidateDeletionLocked) return;
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
  };

  const patchCandidate = (idx: number, patch: Partial<Candidate>) => {
    if (candidateDeletionLocked) return;
    setMeta((prev) => {
      const list = [...(prev.candidate ?? [])];
      const target = list[idx];
      if (!target) return prev;
      list[idx] = { ...target, ...patch };
      return { ...prev, candidate: list };
    });
  };

  const copyFigureFromSource = (source: CopySourceItem) => {
    if (candidateDeletionLocked) return;
    const copied: Candidate = {
      title: makeUniqueCopyTitle(
        candidates.map((candidate) => candidate.title ?? ""),
        source.title,
        "飛行エリア図"
      ),
      ...geometryToFlatFields(source.geometry),
    };
    const nextIdx = candidates.length;
    setMeta((prev) => ({
      ...prev,
      candidate: [...(prev.candidate ?? []), copied],
    }));
    setSelectedHistoryIdx(null);
    setSelectedOwnFigureId(null);
    setSelectedCandidateIdx(nextIdx);
    setSelectedOtherFigure(null);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
        detail: {
          source: "candidate" as const,
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
  };

  const removeCopiedConsideringCandidate = (index: number) => {
    setMeta((prev) => {
      const list = Array.isArray(prev.candidate) ? [...prev.candidate] : [];
      if (index < 0 || index >= list.length) return prev;
      list.splice(index, 1);
      return { ...prev, candidate: list };
    });
    setSelectedCandidateIdx((current) => {
      if (current == null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
    window.alert(
      "コピー元の候補を削除しました。\nSAVEボタンで確定してください。"
    );
  };

  const deleteCandidate = (idx: number) => {
    setMeta((prev) => {
      const list = Array.isArray(prev.candidate) ? [...prev.candidate] : [];
      if (idx < 0 || idx >= list.length) return prev;
      list.splice(idx, 1);
      return { ...prev, candidate: list };
    });
    setSelectedCandidateIdx((current) => {
      if (current == null) return null;
      if (current === idx) return null;
      if (current > idx) return current - 1;
      return current;
    });
  };

  const onCandidateFigureRemoved = (idx: number) => {
    setSelectedCandidateIdx((current) => (current === idx ? null : current));
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
        ? [
            {
              date,
              projectName,
              scheduleName,
              projectUuid,
              scheduleUuid,
              ...normalizeScheduleFlightArea(
                {
                  flight_figures: x?.flight_figures,
                  confirmed_figure_id: x?.confirmed_figure_id,
                  geometry: x?.geometry,
                },
                scheduleName
              ),
            },
          ]
        : [];
    });
  };

  const dispatchOwnFigure = (
    item: HistoryItem,
    idx: number,
    figure: FlightFigure | null
  ) => {
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "schedule" as const },
      })
    );
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
        detail: {
          ...item,
          index: idx,
          figureId: figure?.id,
          geometry: figure?.geometry,
        },
      })
    );
  };

  const confirmedFigureOf = (item: HistoryItem): FlightFigure | null => {
    const figures = item.flight_figures ?? [];
    if (figures.length === 0) return null;
    return (
      figures.find((f) => f.id === item.confirmed_figure_id) ?? figures[0]
    );
  };

  const onSelectHistory = (item: HistoryItem, idx: number) => {
    setSelectedHistoryIdx(idx);
    setSelectedCandidateIdx(null);
    setSelectedOtherFigure(null);
    const confirmed = confirmedFigureOf(item);
    setSelectedOwnFigureId(confirmed?.id ?? null);
    dispatchOwnFigure(item, idx, confirmed);
  };

  const activateOwnFigure = (idx: number, figure: FlightFigure) => {
    const item = history[idx];
    if (!item) return;
    setSelectedHistoryIdx(idx);
    setSelectedOwnFigureId(figure.id);
    setSelectedCandidateIdx(null);
    setSelectedOtherFigure(null);
    dispatchOwnFigure(item, idx, figure);
  };

  const highlightOwnFigure = (idx: number, figureId: string) => {
    setSelectedHistoryIdx(idx);
    setSelectedOwnFigureId(figureId);
    setSelectedCandidateIdx(null);
    setSelectedOtherFigure(null);
  };

  const patchOwnFigures = (
    idx: number,
    figures: FlightFigure[],
    confirmedFigureId: string | null
  ) => {
    setHistory((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              flight_figures: figures,
              confirmed_figure_id: confirmedFigureId,
            }
          : item
      )
    );
  };

  const onOwnFigureRemoved = (idx: number, figureId: string) => {
    setSelectedOwnFigureId((current) => {
      if (current !== figureId) return current;
      const item = history[idx];
      const remaining = (item?.flight_figures ?? []).filter(
        (f) => f.id !== figureId
      );
      return remaining[0]?.id ?? null;
    });
  };

  const onDeleteHistory = (idx: number, item: HistoryItem) => {
    const ok = window.confirm(
      "紐づけを解除しますか？案件情報は削除されません。"
    );
    if (!ok) return false;
    window.alert("案件情報の紐づけを解除しました。");
    setHistory((prev) => prev.filter((_, i) => i !== idx));
    setSelectedHistoryIdx((current) => {
      if (current == null) return null;
      if (current === idx) return null;
      if (current > idx) return current - 1;
      return current;
    });
    setSelectedOwnFigureId(null);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: false, kind: null as null },
      })
    );
    console.log("[detailbar] delete history clicked (TODO backend)", {
      index: idx,
      item,
    });
    return true;
  };

  const highlightCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    setSelectedHistoryIdx(null);
    setSelectedOwnFigureId(null);
    setSelectedOtherFigure(null);
  };

  const onSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    setSelectedHistoryIdx(null);
    setSelectedOwnFigureId(null);
    setSelectedOtherFigure(null);
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
            source: "candidate" as const,
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

  const highlightOtherFigure = (recordIdx: number, figureIdx: number) => {
    setSelectedOtherFigure({ recordIdx, figureIdx });
    setSelectedCandidateIdx(null);
    setSelectedHistoryIdx(null);
    setSelectedOwnFigureId(null);
  };

  const activateOtherFigure = (
    recordIdx: number,
    figureIdx: number,
    figure: OtherFlightFigure
  ) => {
    highlightOtherFigure(recordIdx, figureIdx);
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "other" as const },
      })
    );
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
        detail: {
          source: "other" as const,
          recordIndex: recordIdx,
          index: figureIdx,
          title: figure.title,
          geometry: geometryFromFigure(figure),
        },
      })
    );
  };

  const onOtherFigureRemoved = (recordIdx: number, figureIdx: number) => {
    setSelectedOtherFigure((current) => {
      if (!current || current.recordIdx !== recordIdx) return current;
      if (current.figureIdx === figureIdx) return null;
      if (current.figureIdx > figureIdx) {
        return { recordIdx, figureIdx: current.figureIdx - 1 };
      }
      return current;
    });
  };

  const onOtherRecordRemoved = (recordIdx: number) => {
    setSelectedOtherFigure((current) => {
      if (!current) return current;
      if (current.recordIdx === recordIdx) return null;
      if (current.recordIdx > recordIdx) {
        return { ...current, recordIdx: current.recordIdx - 1 };
      }
      return current;
    });
  };

  useEffect(() => {
    const candLen = candidates?.length ?? 0;
    if (selectedCandidateIdx != null && selectedCandidateIdx >= candLen) {
      setSelectedCandidateIdx(null);
    }
    if (candidateDeletionLocked) {
      setSelectedCandidateIdx(null);
    }
  }, [candidates?.length, selectedCandidateIdx, candidateDeletionLocked]);

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
      setSelectedOtherFigure(null);
      setSelectedOwnFigureId(null);
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
    const onSetTab = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: TabKey }>).detail?.tab;
      if (tab === "basic" || tab === "own" || tab === "other" || tab === "considering") {
        setActive(tab);
      }
    };
    window.addEventListener(EV_DETAILBAR_SET_TAB, onSetTab as EventListener);
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_TAB,
        onSetTab as EventListener
      );
  }, []);

  useEffect(() => {
    const onPatchConsidering = (e: Event) => {
      const patch = (e as CustomEvent<Partial<typeof considering>>).detail;
      if (!patch || typeof patch !== "object") return;
      setMeta((prev) => ({
        ...prev,
        considering: {
          ...(prev.considering ?? EMPTY_CONSIDERING_INFO),
          ...patch,
        },
      }));
    };
    window.addEventListener(
      EV_DETAILBAR_PATCH_CONSIDERING,
      onPatchConsidering as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_PATCH_CONSIDERING,
        onPatchConsidering as EventListener
      );
  }, []);

  useEffect(() => {
    if (selectedHistoryIdx != null && selectedHistoryIdx >= history.length) {
      setSelectedHistoryIdx(null);
    }
  }, [history, selectedHistoryIdx]);

  useEffect(() => {
    if (
      selectedHistoryIdx === null &&
      selectedCandidateIdx === null &&
      selectedOtherFigure === null
    ) {
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false, kind: null as null },
        })
      );
    }
  }, [selectedHistoryIdx, selectedCandidateIdx, selectedOtherFigure]);

  useEffect(() => {
    const reset = () => {
      setSelectedHistoryIdx(null);
      setSelectedCandidateIdx(null);
      setSelectedOtherFigure(null);
      setSelectedOwnFigureId(null);
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
            selectedFigureId={selectedOwnFigureId}
            editable={editable}
            copySources={copySourceTree}
            candidates={candidates}
            selectedCandidateIdx={selectedCandidateIdx}
            candidateDeletionLocked={candidateDeletionLocked}
            onClearConsideringCandidates={removeCopiedConsideringCandidate}
            onSelectHistory={onSelectHistory}
            onDeleteHistory={onDeleteHistory}
            onRegisterProject={handleRegisterProjectInfo}
            onPatchFigures={patchOwnFigures}
            onActivateFigure={activateOwnFigure}
            onHighlightFigure={highlightOwnFigure}
            onFigureRemoved={onOwnFigureRemoved}
            onSelectCandidate={onSelectCandidate}
            onHighlightCandidate={highlightCandidate}
            onPatchCandidate={patchCandidate}
            onCopyFigure={copyFigureFromSource}
            onDeleteCandidate={deleteCandidate}
            onAddCandidate={handleAddCandidate}
            onCandidateFigureRemoved={onCandidateFigureRemoved}
          />
        )}
        {active === "considering" && (
          <ConsideringPanel
            considering={considering}
            onConsideringPatch={patchConsidering}
          />
        )}
        {active === "other" && (
          <OtherCompanyPanel
            records={otherRecords}
            editable={editable}
            selectedFigure={selectedOtherFigure}
            copySources={copySourceTree}
            onClearConsideringCandidates={removeCopiedConsideringCandidate}
            onHighlightFigure={highlightOtherFigure}
            onActivateFigure={activateOtherFigure}
            onFigureRemoved={onOtherFigureRemoved}
            onRecordRemoved={onOtherRecordRemoved}
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
        {(tabStamp?.updated_at ?? tabStamp?.updated_by) && (
          <div className="detailbar-tab-updated">
            最終更新 {tabStamp.updated_at ? formatDateTime(tabStamp.updated_at) : "—"}
            {tabStamp.updated_by?.trim() ? ` ${tabStamp.updated_by.trim()}` : ""}
          </div>
        )}
      </div>

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
