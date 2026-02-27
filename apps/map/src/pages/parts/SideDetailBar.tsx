// src/pages/parts/SideDetailBar.tsx
import { useEffect, useState, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  HiddenIconButton,
  Textarea,
  InputBox,
  DetailIconButton,
  SelectBox,
  useEditableBodyClass,
  DeleteIconButton,
  detectEmbedMode,
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
  EV_SIDEBAR_SET_ACTIVE,
  EV_PROJECT_MODAL_OPEN,
} from "./constants/events";

/** =========================
 *  SideDetailBar Component
 *  ========================= */
export default function SideDetailBar({ open }: { open?: boolean }) {
  const isEmbed = detectEmbedMode();
  if (isEmbed) {
    return null; // 埋め込み時は詳細バーを描画しない
  }
  const editable = useEditableBodyClass();
  const [active, setActive] = useState<TabKey>("overview");
  const [title, setTitle] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(
    null
  );

  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<
    number | null
  >(null);

  // 候補ラベルのインライン編集用 state
  const [editingCandidateIdx, setEditingCandidateIdx] = useState<number | null>(
    null
  );
  const [editingCandidateTitle, setEditingCandidateTitle] = useState("");
  const editingCandidateInputRef = useRef<HTMLInputElement | null>(null);

  // index.json の内容を各フィールドに設定（初期値は空文字で統一）
  const [meta, setMeta] = useState<DetailMeta>({
    overview: "",
    address: "",
    manager: "",
    prefecture: "",
    droneRecord: 0,
    aircraftCount: "",
    altitudeLimit: "",
    availability: "",
    statusMemo: "",
    permitMemo: "",
    restrictionsMemo: "",
    remarks: "",
    candidate: [],
    updated_at: undefined,
    updated_by: undefined,
  });

  const candidates = meta.candidate ?? [];

  // URL 由来の初期選択（案件スケジュール）
  const initialScheduleRef = useRef<{
    projectUuid?: string;
    scheduleUuid?: string;
  }>(
    (() => {
      const params = new URLSearchParams(window.location.search);
      const projectUuid = params.get("projectUuid") || undefined;
      const scheduleUuid = params.get("scheduleUuid") || undefined;
      return { projectUuid, scheduleUuid };
    })()
  );

  const didAutoSelectRef = useRef(false);

  /** =========================
   *  Helpers
   *  ========================= */
  const buildHubUrl = (
    projectUuid?: string,
    date?: string,
    scheduleUuid?: string
  ): string | null => {
    if (!projectUuid) return null;

    // ローカル開発の場合
    const { protocol, hostname } = window.location;
    const isLocalLike =
      hostname === "localhost" || hostname.startsWith("192.168.");

    // スケジュール日付から year を推定（なければ現在年）
    const yearFromDate =
      typeof date === "string" && /^\d{4}/.test(date)
        ? date.slice(0, 4)
        : String(new Date().getFullYear());

    // RD Mapから遷移時は「エリア」タブを開き、対応スケジュールを選択（tab=エリア, scheduleUuid=xxx）
    const tabParam = "tab=エリア";
    const scheduleParam =
      scheduleUuid && scheduleUuid.trim()
        ? `&scheduleUuid=${encodeURIComponent(scheduleUuid)}`
        : "";

    // ローカル開発の場合,ローカルのベースURLを返す
    if (isLocalLike) {
      return `${protocol}//${hostname}:5174/hub/${projectUuid}?source=s3&year=${yearFromDate}&${tabParam}${scheduleParam}`;
    }

    // 本番の場合,環境変数からベースURLを取得
    const base = String(import.meta.env.VITE_HUB_BASE_URL || "").replace(
      /\/+$/,
      ""
    );
    // ベースURLがない場合はnullを返す
    if (!base) return null;

    // ベースURLとプロジェクトUUIDを組み合わせてURLを生成
    return `${base}/${projectUuid}?source=s3&year=${yearFromDate}&${tabParam}${scheduleParam}`;
  };

  const fmtDate = (isoLike: string) => {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return isoLike;
    const yy = String(d.getFullYear()).slice(-2);
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const da = `${d.getDate()}`.padStart(2, "0");
    return `${yy}/${m}/${da}`;
  };

  const formatDateTime = (iso: string): string => {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // タイトル重複チェック用ヘルパ（空文字は対象外）
  const hasDuplicateCandidateTitle = (
    title: string,
    selfIndex: number | null
  ) => {
    const normalized = title.trim();
    if (!normalized) return false;
    return candidates.some((c, idx) => {
      if (idx === selfIndex) return false;
      const t = (c.title ?? "").trim();
      return t === normalized;
    });
  };

  // 「案件情報を紐づける」ボタン
  const handleRegisterProjectInfo = () => {
    // 画面中央モーダルを開いてもらうイベントだけ飛ばす
    window.dispatchEvent(new Event(EV_PROJECT_MODAL_OPEN));
  };

  // 「候補地を追加する」ボタン
  const handleAddCandidate = () => {
    // 追加前の長さを基準に、新しい候補の index を決める
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

    const nextCandidates = [...candidates, newCandidate];

    setMeta((prev) => ({
      ...prev,
      candidate: nextCandidates,
    }));

    // 追加された候補を選択状態＆編集状態にする
    setSelectedHistoryIdx(null);
    setSelectedCandidateIdx(nextIdx);
    setEditingCandidateIdx(nextIdx);
    setEditingCandidateTitle(newCandidate.title);
  };

  // 候補地確定・キャンセル
  const commitCandidateTitle = (): boolean => {
    if (editingCandidateIdx == null) return false;

    const idx = editingCandidateIdx;
    const trimmed = editingCandidateTitle.trim();

    // 最終的なタイトル文字列（空ならデフォルト）
    const finalTitle = trimmed || "候補地ラベル";

    // ===== 重複チェック =====
    if (hasDuplicateCandidateTitle(finalTitle, idx)) {
      window.alert(
        "同じタイトルの候補が既にあります。別のタイトルを入力してください。"
      );
      // state は触らず、そのまま編集を続行できるようにする
      return false;
    }

    // meta.candidate を更新
    setMeta((prev) => {
      const list = [...(prev.candidate ?? [])];
      const target = list[idx];
      if (!target) return prev;

      list[idx] = {
        ...target,
        title: finalTitle,
      };

      return { ...prev, candidate: list };
    });

    // 編集モード解除
    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");

    // 「この候補が選択中」であることを明示しておく
    setSelectedHistoryIdx(null);
    setSelectedCandidateIdx(idx);

    // ① 何かが選択されたことを通知（MapView 側の isSelected = true）
    // kind: "candidate" で候補セクション由来であることを知らせる
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );

    // ② 候補選択イベントを投げて、MapView に
    //    「index idx / title finalTitle / geometry(まだなし)」を教える
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
        detail: {
          geometry: {
            // まだジオメトリは無いので全部 undefined で OK
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
    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");
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

      // camel/snake/lower を全部拾う
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
          : typeof x?.id === "string" // schedules 側の id を混ぜている場合の保険
          ? x.id
          : undefined;

      return date && projectName && scheduleName
        ? [{ date, projectName, scheduleName, projectUuid, scheduleUuid }]
        : [];
    });
  };

  // 履歴選択
  const onSelectHistory = (item: HistoryItem, idx: number) => {
    setSelectedHistoryIdx(idx); // 履歴のインデックスを設定
    setSelectedCandidateIdx(null); // 候補の選択状態を解除
    // 履歴選択イベントを通知（UI 状態は indices で管理）
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "schedule" as const },
      })
    );
    const event = new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
      detail: { ...item, index: idx },
    });
    window.dispatchEvent(event);
  };

  // 候補エリア選択時
  const onSelectCandidate = (candidate: Candidate, idx: number) => {
    setSelectedCandidateIdx(idx); // 候補エリアのインデックスを設定
    setSelectedHistoryIdx(null); // 履歴の選択状態を解除
    // 候補選択イベントを通知（UI 状態は indices で管理）
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    const selectedCandidate = meta.candidate.find(
      (c) => c.title === candidate.title
    );
    if (selectedCandidate) {
      const geometry = {
        flightAltitude_min_m: selectedCandidate.flightAltitude_min_m,
        flightAltitude_Max_m: selectedCandidate.flightAltitude_Max_m,
        takeoffArea: selectedCandidate.takeoffArea,
        flightArea: selectedCandidate.flightArea,
        safetyArea: selectedCandidate.safetyArea,
        audienceArea: selectedCandidate.audienceArea,
      };
      // どの候補かを Map 側に伝える（index と title を付与）
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECT_CANDIDATE, {
          detail: { geometry, index: idx, title: selectedCandidate.title },
        })
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
      //  エリアが切り替わった（=新しい履歴が来た）ので選択状態を初期化
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

  // 履歴の削除等で index が不正になったら選択解除
  useEffect(() => {
    if (selectedHistoryIdx != null && selectedHistoryIdx >= history.length) {
      setSelectedHistoryIdx(null);
    }
  }, [history, selectedHistoryIdx]);

  // 履歴や候補が選ばれていない場合は「選択なし」にする
  useEffect(() => {
    if (selectedHistoryIdx === null && selectedCandidateIdx === null) {
      window.dispatchEvent(
        new CustomEvent(EV_DETAILBAR_SELECTED, {
          detail: { isSelected: false, kind: null as null },
        })
      );
    }
  }, [selectedHistoryIdx, selectedCandidateIdx]);

  // エリアがアクティブ化されたら（サイドバー/マップどちら発火でも）即リセット
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

  // 追加直後に input にフォーカス
  useEffect(() => {
    if (editingCandidateIdx != null && editingCandidateInputRef.current) {
      const input = editingCandidateInputRef.current;
      const len = input.value.length;
      input.focus();
      // 全選択を避けてキャレットだけ末尾に
      window.setTimeout(() => {
        try {
          input.setSelectionRange(len, len);
        } catch {
          /* noop */
        }
      }, 0);
    }
  }, [editingCandidateIdx]);

  // URL 由来の初期選択（案件スケジュール）の自動選択
  useEffect(() => {
    if (didAutoSelectRef.current) return;

    const { projectUuid, scheduleUuid } = initialScheduleRef.current;
    if (!projectUuid || !scheduleUuid) return;
    if (!history || history.length === 0) return;

    const idx = history.findIndex(
      (h) => h.projectUuid === projectUuid && h.scheduleUuid === scheduleUuid
    );
    if (idx < 0) return;

    // タブも飛行エリアに合わせる（任意だがUX的に良い）
    setActive("history");

    // 実際の選択処理（イベント dispatch → MapView 側がジオメトリ描画）
    didAutoSelectRef.current = true;
    onSelectHistory(history[idx], idx);
  }, [history]);

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
                detail: { isSelected: false, kind: null as null },
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
              <SelectBox
                label="ドローン実績"
                value={String(meta.droneRecord ?? 0)}
                options={[
                  { value: "0", label: "なし" },
                  { value: "1", label: "あり" },
                ]}
                onChange={(e) =>
                  setMeta((p) => ({
                    ...p,
                    droneRecord: Number(e.target.value),
                  }))
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
                label="制限高(海抜高)"
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
          <section role="tabpanel" aria-label="案件実績と候補エリア">
            {/* 案件実績セクション */}
            <div className="ds-record-section">
              <div className="ds-record-section-title">案件</div>

              <div className="ds-record-list">
                {history.length === 0 ? (
                  <div className="ds-record-empty" aria-live="polite">
                    履歴はありません
                  </div>
                ) : (
                  history.map((item, i) => {
                    const selected = selectedHistoryIdx === i;
                    return (
                      <div
                        key={`${item.projectName}-${item.scheduleName}-${item.date}-${i}`}
                        className={`ds-record-row ${
                          selected ? "is-selected" : ""
                        }`}
                        role="option"
                        aria-selected={selected}
                        onClick={() => onSelectHistory(item, i)}
                      >
                        <span
                          className="ds-record-leftgap"
                          onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                            e.stopPropagation(); // 行へのバブリングを止める
                          }}
                        >
                          <DetailIconButton
                            title="RD Hubへ"
                            height={18}
                            onClick={() => {
                              const url = buildHubUrl(
                                item.projectUuid,
                                item.date,
                                item.scheduleUuid
                              );
                              if (!url) {
                                console.warn(
                                  "[detailbar] projectUuid is missing. cannot navigate to hub.",
                                  item
                                );
                                return;
                              }

                              console.log("[detailbar] navigate to hub:", url);
                              // RD Hubを新規タブで開く
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                          />{" "}
                        </span>

                        <span className="ds-record-date">
                          {fmtDate(item.date)}
                        </span>
                        <span className="ds-record-name">
                          {item.projectName}
                        </span>
                        <span className="ds-record-schedule">
                          {item.scheduleName}
                        </span>

                        {editable && (
                          <span
                            className="ds-record-delete"
                            onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                              e.stopPropagation(); // 削除ボタンでも行クリックは発火させない
                            }}
                          >
                            <DeleteIconButton
                              className={
                                !editable
                                  ? "ds-record-delete--hidden"
                                  : undefined
                              }
                              title="この履歴を削除"
                              tabIndex={editable ? 0 : -1}
                              onClick={() => {
                                if (!editable) return; // 念のためガード

                                const ok = window.confirm(
                                  "紐づけを解除しますか？案件情報は削除されません。"
                                );
                                if (!ok) return;

                                window.alert(
                                  "案件情報の紐づけを解除しました。"
                                );

                                setHistory((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                );

                                setSelectedHistoryIdx((current) =>
                                  current === i ? null : current
                                );
                                window.dispatchEvent(
                                  new CustomEvent(EV_DETAILBAR_SELECTED, {
                                    detail: {
                                      isSelected: false,
                                      kind: null as null,
                                    },
                                  })
                                );

                                console.log(
                                  "[detailbar] delete history clicked (TODO backend)",
                                  { index: i, item }
                                );
                              }}
                            />
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 案件実績を登録するボタン */}
              {editable && (
                <button
                  type="button"
                  className="add-area-button detailbar-add-button"
                  onClick={handleRegisterProjectInfo}
                >
                  <span className="add-icon">＋ </span>案件情報を紐づける
                </button>
              )}
            </div>

            {/* セパレート横線 */}
            <div className="ds-record-separator" />

            {/* 候補地セクション */}
            <div className="ds-record-section">
              <div className="ds-record-section-title">候補</div>

              <div className="ds-record-list">
                {candidates.length === 0 ? (
                  <div className="ds-record-empty" aria-live="polite">
                    候補地はありません
                  </div>
                ) : (
                  candidates.map((candidate, idx) => (
                    <div
                      key={idx}
                      className={`ds-record-row ${
                        selectedCandidateIdx === idx ? "is-selected" : ""
                      }`}
                      role="option"
                      aria-selected={selectedCandidateIdx === idx}
                      onClick={() => onSelectCandidate(candidate, idx)}
                    >
                      <span
                        className="ds-record-leftgap"
                        onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                          e.stopPropagation();
                        }}
                      >
                        <span className="ds-candidate-dot" aria-hidden="true">
                          ・
                        </span>
                      </span>
                      {/* ダブルクリックで編集開始 */}
                      <span
                        className="ds-candidate-name"
                        onDoubleClick={(
                          e: ReactMouseEvent<HTMLSpanElement>
                        ) => {
                          if (!editable) return; // 編集モードでなければ何もしない
                          e.stopPropagation(); // 行クリックへのバブリング防止

                          // すでに別の候補を編集中なら一旦確定
                          if (
                            editingCandidateIdx != null &&
                            editingCandidateIdx !== idx
                          ) {
                            const ok = commitCandidateTitle();
                            if (!ok) {
                              // 重複エラーなどで確定できなかった場合は
                              // 新しい行の編集には切り替えない
                              return;
                            }
                          }

                          // この行を編集対象にする
                          setEditingCandidateIdx(idx);
                          setEditingCandidateTitle(candidate.title ?? "");
                        }}
                      >
                        {editable && editingCandidateIdx === idx ? (
                          <input
                            ref={editingCandidateInputRef}
                            type="text"
                            className="candidate-title-input"
                            value={editingCandidateTitle}
                            placeholder="候補地ラベル"
                            onChange={(e) =>
                              setEditingCandidateTitle(e.target.value)
                            }
                            onBlur={() => {
                              // フォーカスが外れたときは確定せず編集キャンセル
                              // → alert が blur と連鎖してループするのを防ぐ
                              cancelCandidateEdit();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                // Enter のときだけ重複チェック付きで確定
                                commitCandidateTitle();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelCandidateEdit();
                              }
                            }}
                          />
                        ) : (
                          candidate.title
                        )}
                      </span>

                      {editable && (
                        <span
                          className="ds-record-delete"
                          onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                            e.stopPropagation();
                          }}
                        >
                          <DeleteIconButton
                            className={
                              !editable ? "ds-record-delete--hidden" : undefined
                            }
                            title="この候補を削除"
                            tabIndex={editable ? 0 : -1}
                            onClick={() => {
                              if (!editable) return;

                              const ok = window.confirm(
                                `候補「${
                                  candidate.title || "（無題の候補）」"
                                }」を削除してもよろしいですか？`
                              );
                              if (!ok) return;

                              setMeta((prev) => {
                                const list = Array.isArray(prev.candidate)
                                  ? [...prev.candidate]
                                  : [];
                                if (idx < 0 || idx >= list.length) return prev;
                                list.splice(idx, 1);
                                return {
                                  ...prev,
                                  candidate: list,
                                };
                              });

                              setSelectedCandidateIdx((current) =>
                                current === idx ? null : current
                              );
                              if (editingCandidateIdx != null) {
                                cancelCandidateEdit();
                              }

                              window.alert(
                                "候補を削除しました。\nSAVEボタンで確定してください。"
                              );
                            }}
                          />
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 候補地を追加するボタン */}
              {editable && (
                <button
                  type="button"
                  className="add-area-button detailbar-add-button"
                  onClick={handleAddCandidate}
                >
                  <span className="add-icon">＋ </span>候補地を追加する
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {(meta.updated_at ?? meta.updated_by) && (
        <div className="detailbar-footer">
          最終更新{" "}
          {meta.updated_at ? formatDateTime(meta.updated_at) : "—"}
          {meta.updated_by?.trim() ? ` ${meta.updated_by.trim()}` : ""}
        </div>
      )}
    </div>
  );
}

/** =========================
 *  External bridge APIs
 *  ========================= */
export function openDetailBar() {
  if (detectEmbedMode()) return;
  document.body.classList.add(CLS_DETAILBAR_OPEN);
}
export function closeDetailBar() {
  if (detectEmbedMode()) return;
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
