// src/pages/parts/SideDetailBar.tsx
import { useEffect, useState } from "react";
import {
  HiddenIconButton,
  Textarea,
  InputBox,
  DetailIconButton,
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
  EV_DETAILBAR_SELECT_HISTORY,
  EV_DETAILBAR_SET_METRICS,
  PREFECTURES,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_DETAILBAR_SELECTED,
} from "./constants/events";
import { SelectBox } from "@/components/inputs/SelectBox";

/** =========================
 *  SideDetailBar Component
 *  ========================= */
export default function SideDetailBar({ open }: { open?: boolean }) {
  const [active, setActive] = useState<TabKey>("overview");
  const [title, setTitle] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(
    null
  );
  const [isSelected, setIsSelected] = useState(false);

  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<
    number | null
  >(null);

  // index.json の内容を各フィールドに設定（初期値は空文字で統一）
  const [meta, setMeta] = useState<DetailMeta>({
    overview: "",
    address: "",
    manager: "",
    prefecture: "",
    droneRecord: "",
    aircraftCount: "",
    altitudeLimit: "",
    availability: "",
    statusMemo: "",
    permitMemo: "",
    restrictionsMemo: "",
    remarks: "",
    candidate: [],
  });

  /** =========================
   *  Helpers
   *  ========================= */
  const fmtDate = (isoLike: string) => {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return isoLike;
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const da = `${d.getDate()}`.padStart(2, "0");
    return `${y}/${m}/${da}`;
  };

  // 履歴のサニタイズ（unknown を HistoryItem[] に落とす）
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
        typeof x?.projectUuid === "string" ? x.projectUuid : undefined;
      const scheduleUuid =
        typeof x?.scheduleUuid === "string" ? x.scheduleUuid : undefined;

      return date && projectName && scheduleName
        ? [{ date, projectName, scheduleName, projectUuid, scheduleUuid }]
        : [];
    });
  };

  // SideDetailBar.tsx
  const onSelectHistory = (item: HistoryItem, idx: number) => {
    setSelectedHistoryIdx(idx); // 履歴のインデックスを設定
    setSelectedCandidateIdx(null); // 候補の選択状態を解除
    setIsSelected(true); // 履歴が選ばれた状態

    // イベントで選択状態を通知
    const ev = new CustomEvent(EV_DETAILBAR_SELECTED, {
      detail: { isSelected: true },
    });
    window.dispatchEvent(ev);

    const event = new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
      detail: { ...item, index: idx },
    });
    window.dispatchEvent(event);
  };

  // 同様に候補エリア選択時も
  const onSelectCandidate = (candidate: Candidate, idx: number) => {
    setSelectedCandidateIdx(idx); // 候補エリアのインデックスを設定
    setSelectedHistoryIdx(null); // 履歴の選択状態を解除
    setIsSelected(true); // 候補が選ばれた状態

    // イベントで選択状態を通知
    const ev = new CustomEvent(EV_DETAILBAR_SELECTED, {
      detail: { isSelected: true },
    });
    window.dispatchEvent(ev);

    const selectedCandidate = meta.candidate.find(
      (c) => c.title === candidate.title
    );
    if (selectedCandidate) {
      const geometry = {
        takeoffArea: selectedCandidate.takeoffArea,
        flightArea: selectedCandidate.flightArea,
        safetyArea: selectedCandidate.safetyArea,
        audienceArea: selectedCandidate.audienceArea,
      };
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, { detail: geometry })
      );
    }
  };

  /** =========================
   *  Event wiring
   *  ========================= */

  // 他所から最新の title/meta/history を引くための request/respond
  useEffect(() => {
    const onRequest = () => {
      const ev = new CustomEvent(EV_DETAILBAR_RESPOND_DATA, {
        detail: { title, meta, history },
      });
      window.dispatchEvent(ev);
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

  // open prop による表示制御（未指定なら外部制御に委ねる）
  useEffect(() => {
    if (typeof open === "boolean") {
      document.body.classList.toggle(CLS_DETAILBAR_OPEN, open);
      return () => {
        document.body.classList.remove(CLS_DETAILBAR_OPEN);
      };
    }
  }, [open]);

  // タイトル設定
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

  // メタ更新
  useEffect(() => {
    const onSetMeta = (e: Event) => {
      const ce = e as CustomEvent<{ meta?: Partial<DetailMeta> }>;
      const m = ce.detail?.meta ?? {};
      setMeta((prev) => ({ ...prev, ...m }));
      if (import.meta.env.DEV) console.debug("[detailbar] meta applied", m);
    };
    window.addEventListener(EV_DETAILBAR_SET_META, onSetMeta as EventListener);
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_META,
        onSetMeta as EventListener
      );
  }, []);

  // 履歴更新
  useEffect(() => {
    const onSetHistory = (e: Event) => {
      const ce = e as CustomEvent<{ history?: unknown }>;
      const sanitized = sanitizeHistory(ce.detail?.history);
      setHistory(sanitized);
      if (import.meta.env.DEV)
        console.debug("[detailbar] history=", sanitized.length);
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

  // 履歴の削除等で index が不正になったら選択解除
  useEffect(() => {
    if (selectedHistoryIdx != null && selectedHistoryIdx >= history.length) {
      setSelectedHistoryIdx(null);
    }
  }, [history, selectedHistoryIdx]);

  // 履歴や候補が選ばれていない場合は「選択なし」にする
  useEffect(() => {
    if (selectedHistoryIdx === null && selectedCandidateIdx === null) {
      setIsSelected(false); // 何も選択されていない状態
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false },
        })
      );
    }
  }, [selectedHistoryIdx, selectedCandidateIdx]);

  /** =========================
   *  Render
   *  ========================= */
  return (
    <div
      id="detailbar"
      aria-hidden={typeof open === "boolean" ? !open : undefined}
    >
      {/* 右上の「隠す」 */}
      <div className="detailbar-hide">
        <HiddenIconButton
          title="詳細バーを隠す"
          height={28}
          onClick={() => {
            document.body.classList.remove(CLS_DETAILBAR_OPEN);
            window.dispatchEvent(
              new CustomEvent(EV_DETAILBAR_SELECTED, {
                detail: { isSelected: false },
              })
            );
          }}
        />
      </div>

      {/* ヘッダー（ヒーロー / タイトル / タブ） */}
      <div
        className="detailbar-header"
        role="banner"
        aria-label="エリア詳細ヘッダー"
      >
        <div
          className="detailbar-hero-slot detailbar-hero-fullbleed detailbar-hero-fullbleed-top"
          aria-hidden="true"
        />

        <div className="detailbar-title" aria-live="polite" title={title}>
          <InputBox value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div
          role="tablist"
          aria-label="詳細バータブ"
          className="detailbar-tabs"
        >
          <button
            role="tab"
            aria-selected={active === "overview"}
            className={`tab-btn ${active === "overview" ? "is-active" : ""}`}
            onClick={() => setActive("overview")}
          >
            概要
          </button>
          <button
            role="tab"
            aria-selected={active === "detail"}
            className={`tab-btn ${active === "detail" ? "is-active" : ""}`}
            onClick={() => setActive("detail")}
          >
            詳細
          </button>
          <button
            role="tab"
            aria-selected={active === "history"}
            className={`tab-btn ${active === "history" ? "is-active" : ""}`}
            onClick={() => setActive("history")}
          >
            飛行エリア
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="detailbar-panel">
        {/* 概要タブ */}
        {active === "overview" && (
          <section role="tabpanel" aria-label="概要">
            <div className="detailbar-form">
              <Textarea
                label=""
                value={meta.address}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, address: e.target.value }))
                }
              />
              <InputBox
                label="担当者"
                value={meta.manager}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, manager: e.target.value }))
                }
              />
              <SelectBox
                label="都道府県"
                value={meta.prefecture}
                options={PREFECTURES}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, prefecture: e.target.value }))
                }
              />{" "}
              <InputBox
                label="ドローン実績"
                value={meta.droneRecord}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, droneRecord: e.target.value }))
                }
              />
              <InputBox
                label="機体数目安"
                value={meta.aircraftCount}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, aircraftCount: e.target.value }))
                }
              />
              <InputBox
                label="高さ制限(海抜~)"
                value={meta.altitudeLimit}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, altitudeLimit: e.target.value }))
                }
              />
              <InputBox
                label="実施可否"
                value={meta.availability}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, availability: e.target.value }))
                }
              />
            </div>
          </section>
        )}
        {/* 詳細タブ */}
        {active === "detail" && (
          <section role="tabpanel" aria-label="詳細">
            <div className="detailbar-form detailbar-form--lg">
              <Textarea
                label="ステータス"
                value={meta.statusMemo}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, statusMemo: e.target.value }))
                }
              />
              <Textarea
                label="許可"
                value={meta.permitMemo}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, permitMemo: e.target.value }))
                }
              />
              <Textarea
                label="制限"
                value={meta.restrictionsMemo}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, restrictionsMemo: e.target.value }))
                }
              />
              <Textarea
                label="備考"
                value={meta.remarks}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, remarks: e.target.value }))
                }
              />
            </div>
          </section>
        )}
        {/* 飛行エリア */}
        {active === "history" && (
          <section role="tabpanel" aria-label="飛行エリアと候補エリア">
            <div className="ds-history-list">
              {history.length === 0 ? (
                <div className="ds-history-empty" aria-live="polite">
                  履歴はありません
                </div>
              ) : (
                history.map((item, i) => {
                  const selected = selectedHistoryIdx === i;
                  return (
                    <div
                      key={`${item.projectName}-${item.scheduleName}-${item.date}-${i}`}
                      className={`ds-history-row ${
                        selected ? "is-selected" : ""
                      }`}
                      role="option"
                      aria-selected={selected}
                    >
                      <span className="ds-history-leftgap">
                        <DetailIconButton
                          height={23}
                          title="スケジュール詳細"
                          onClick={() => onSelectHistory(item, i)}
                        />
                      </span>

                      <span className="ds-history-date">
                        {fmtDate(item.date)}
                      </span>
                      <span className="ds-history-name">
                        {item.projectName}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* 横線を追加 */}
            {meta.candidate && meta.candidate.length > 0 && (
              <div className="ds-history-separator"></div>
            )}

            {meta.candidate && meta.candidate.length > 0 && (
              <section>
                <div className="ds-history-list">
                  {meta.candidate.map((candidate, idx) => (
                    <div
                      key={idx}
                      className={`ds-history-row ${
                        selectedCandidateIdx === idx ? "is-selected" : ""
                      }`}
                      role="option"
                      aria-selected={selectedCandidateIdx === idx}
                    >
                      <span className="ds-history-leftgap">
                        <DetailIconButton
                          height={23}
                          title="候補エリア詳細"
                          onClick={() => onSelectCandidate(candidate, idx)}
                        />
                      </span>

                      <span className="ds-candidate-title">候補</span>
                      <span className="ds-candidate-name">
                        {candidate.title}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/** =========================
 *  External bridge APIs
 *  ========================= */
export function openDetailBar() {
  document.body.classList.add(CLS_DETAILBAR_OPEN);
}
export function closeDetailBar() {
  document.body.classList.remove(CLS_DETAILBAR_OPEN);
}

export function setDetailBarTitle(title: string) {
  const ev = new CustomEvent(EV_DETAILBAR_SET_TITLE, { detail: { title } });
  window.dispatchEvent(ev);
}

/**
 * 履歴データの原型（unknown 配列 OK）を投げる。
 * SideDetailBar 側で sanitize してから state に入れる。
 */
export function setDetailBarHistory(history: any[]) {
  const ev = new CustomEvent(EV_DETAILBAR_SET_HISTORY, { detail: { history } });
  window.dispatchEvent(ev);
}

export function setDetailBarMeta(meta: Partial<DetailMeta>) {
  const ev = new CustomEvent(EV_DETAILBAR_SET_META, { detail: { meta } });
  window.dispatchEvent(ev);
}

/**
 * ジオメトリ寸法（m単位）を送る。
 * 値の丸めや整形は送信側（MapGeometry など）か受け手（GeomMetricsPanel）で実施。
 */
export function setDetailBarMetrics(metrics: Partial<GeometryMetrics>) {
  const ev = new CustomEvent(EV_DETAILBAR_SET_METRICS, { detail: { metrics } });
  window.dispatchEvent(ev);
}
