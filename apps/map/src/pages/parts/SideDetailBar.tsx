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
  DetailPrimaryTabKey,
  HistoryItem,
  GeometryMetrics,
  DetailMeta,
  Candidate,
  FlightFigure,
} from "@/features/types";
import { normalizeScheduleFlightArea } from "@/features/flightFigures";
import { fetchProjectIndex } from "./areasApi";
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
  EV_FLIGHT_AREA_CREATE_OPEN,
} from "./constants/events";

/** 検討中タブ用の仮サンプル（UI確認用・後続で実データ接続） */
const CONSIDERING_STATUS_OPTIONS = ["交渉中", "OK", "NG"] as const;
const CONSIDERING_CHANNEL_OPTIONS = ["直販", "代理店"] as const;
const CONSIDERING_FEASIBILITY_OPTIONS = ["○ 実施事例あり"] as const;

type OtherCompanyRecord = {
  id: string;
  companyName: string;
  eventTitle: string;
  heldOn: string;
  venue: string;
  aircraftCount: string;
  rcApproach: string;
  impression: string;
  memo: string;
  flightAreas: { id: string; label: string }[];
};

type OwnFlightFigureView = {
  id: string;
  title: string;
  isConfirmed: boolean;
};

/** 他社タブ用の仮サンプル（UI確認用・編集ONで入力可・後続で実データ接続） */
const OTHER_TAB_SAMPLE_RECORDS: OtherCompanyRecord[] = [
  {
    id: "other-1",
    companyName: "株式会社ドローンショージャパン",
    eventTitle: "東京ドイツ村ドローンショー",
    heldOn: "2024年12月",
    venue: "東京ドイツ村",
    aircraftCount: "500機",
    rcApproach: "済",
    impression: "前向き",
    memo: "中島・菅沼が対応",
    flightAreas: [{ id: "ofa-1", label: "広場エリア（資料推測）" }],
  },
  {
    id: "other-2",
    companyName: "株式会社ドローンショージャパン",
    eventTitle: "イルミネーションドローンショー",
    heldOn: "2023年12月",
    venue: "",
    aircraftCount: "",
    rcApproach: "",
    impression: "",
    memo: "",
    flightAreas: [],
  },
];

/** =========================
 *  SideDetailBar Component
 *  ========================= */
export default function SideDetailBar({ open }: { open?: boolean }) {
  const isEmbed = detectEmbedMode();
  if (isEmbed) {
    return null; // 埋め込み時は詳細バーを描画しない
  }
  const editable = useEditableBodyClass();
  const [activePrimary, setActivePrimary] =
    useState<DetailPrimaryTabKey>("own");
  const [title, setTitle] = useState("");
  // 自社タブ専用フィールド（まずは画面のみ。保存連携は後続フェーズ）
  const [facilityType, setFacilityType] = useState("");
  const [owner, setOwner] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  // 自社タブ：案件カードの開閉（デフォルトは全閉）
  const [ownExpandedKeys, setOwnExpandedKeys] = useState<Set<string>>(
    () => new Set()
  );
  // 検討中タブ（まずは画面のみ）
  const [consideringStatus, setConsideringStatus] = useState<string>("交渉中");
  const [consideringManager, setConsideringManager] =
    useState("安藤望 (UNIT1)");
  const [consideringChannel, setConsideringChannel] = useState<string>("直販");
  const [consideringFeasibility, setConsideringFeasibility] = useState<string>(
    "○ 実施事例あり"
  );
  const [consideringCost, setConsideringCost] = useState("");
  const [consideringMemo, setConsideringMemo] = useState(
    "宗教法人のため許可ルートが特殊。窓口は寺務所。"
  );
  // 他社タブ（まずは画面のみ。編集ONで入力可）
  const [otherRecords, setOtherRecords] = useState<OtherCompanyRecord[]>(
    () => OTHER_TAB_SAMPLE_RECORDS.map((r) => ({ ...r, flightAreas: [...r.flightAreas] }))
  );
  const [otherExpandedIds, setOtherExpandedIds] = useState<Set<string>>(
    () => new Set([OTHER_TAB_SAMPLE_RECORDS[0].id])
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ownFlightFiguresByCardKey, setOwnFlightFiguresByCardKey] = useState<
    Record<string, OwnFlightFigureView[]>
  >({});
  const [selectedOwnFlightFigureId, setSelectedOwnFlightFigureId] = useState<
    string | null
  >(null);
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
  // 「候補追加」直後に作った仮行の index を保持（未入力なら破棄するため）
  const pendingNewCandidateIdxRef = useRef<number | null>(null);

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
    candidateDeletionLocked: false,
    updated_at: undefined,
    updated_by: undefined,
  });

  const candidates = meta.candidate ?? [];
  const candidateDeletionLocked = !!meta.candidateDeletionLocked;

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
   *  Detailbar リサイズ（右端ドラッグで幅変更）
   *  ========================= */
  const DETAILBAR_MIN_W = 280;
  const DETAILBAR_MAX_W = 500;
  const DETAILBAR_STORAGE_KEY = "detailbar-width";

  const getDetailbarWidth = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(
      "--detailbar-w"
    );
    return parseInt(v, 10) || 300;
  };

  const setDetailbarWidth = (px: number) => {
    const clamped = Math.min(
      DETAILBAR_MAX_W,
      Math.max(DETAILBAR_MIN_W, px)
    );
    document.documentElement.style.setProperty(
      "--detailbar-w",
      `${clamped}px`
    );
    return clamped;
  };

  const handleResizeMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getDetailbarWidth();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setDetailbarWidth(startWidth + deltaX);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("detailbar-resizing");
      try {
        localStorage.setItem(
          DETAILBAR_STORAGE_KEY,
          String(getDetailbarWidth())
        );
      } catch {
        /* noop */
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.classList.add("detailbar-resizing");
  };

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

  const getOwnCardKey = (item: HistoryItem, i: number) =>
    `${item.projectUuid ?? item.projectName}-${item.scheduleUuid ?? item.scheduleName}-${item.date}-${i}`;

  // 複製時のタイトルを既存候補と重複しない形で採番する
  const makeUniqueCandidateCopyTitle = (baseTitle: string): string => {
    const source = baseTitle.trim() || "飛行エリア図";
    const first = `${source} (コピー)`;
    if (!hasDuplicateCandidateTitle(first, null)) return first;

    let n = 2;
    while (true) {
      const next = `${source} (コピー${n})`;
      if (!hasDuplicateCandidateTitle(next, null)) return next;
      n += 1;
    }
  };

  // 「案件情報を紐づける」ボタン
  const handleRegisterProjectInfo = () => {
    // 画面中央モーダルを開いてもらうイベントだけ飛ばす
    window.dispatchEvent(new Event(EV_PROJECT_MODAL_OPEN));
  };

  // 「飛行エリア図を追加」→ ツールパネル「飛行エリア作図」と同じ処理
  const handleAddFlightAreaFigure = (item: HistoryItem, idx: number) => {
    // 対象スケジュールを地図コンテキストに載せてから作図フローへ
    onSelectHistory(item, idx);
    window.dispatchEvent(new Event(EV_FLIGHT_AREA_CREATE_OPEN));
  };

  // 「飛行エリア図を追加」ボタン（検討中タブ / meta.candidate）
  const handleAddCandidate = () => {
    if (candidateDeletionLocked) return;
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
    pendingNewCandidateIdxRef.current = nextIdx;
  };

  // 候補地確定・キャンセル
  const commitCandidateTitle = (): boolean => {
    if (editingCandidateIdx == null) return false;
    if (candidateDeletionLocked) return false;

    const idx = editingCandidateIdx;
    const trimmed = editingCandidateTitle.trim();

    // 最終的なタイトル文字列（空ならデフォルト）
    const finalTitle = trimmed || "飛行エリア図";

    // ===== 重複チェック =====
    if (hasDuplicateCandidateTitle(finalTitle, idx)) {
      window.alert(
        "同じタイトルの飛行エリア図が既にあります。別のタイトルを入力してください。"
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
    pendingNewCandidateIdxRef.current = null;

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
    const idx = editingCandidateIdx;
    const isPendingNew = idx != null && pendingNewCandidateIdxRef.current === idx;
    const isEmptyInput = editingCandidateTitle.trim() === "";

    // 追加直後の仮行で、タイトル未入力なら候補自体を破棄する
    if (isPendingNew && isEmptyInput) {
      setMeta((prev) => {
        const list = Array.isArray(prev.candidate) ? [...prev.candidate] : [];
        if (idx == null || idx < 0 || idx >= list.length) return prev;
        list.splice(idx, 1);
        return { ...prev, candidate: list };
      });
      setSelectedCandidateIdx((current) => (current === idx ? null : current));
      pendingNewCandidateIdxRef.current = null;
    }

    setEditingCandidateIdx(null);
    setEditingCandidateTitle("");
  };

  // 候補を複製して末尾に追加
  const duplicateCandidate = (idx: number) => {
    if (candidateDeletionLocked) return;
    const source = candidates[idx];
    if (!source) return;

    // 深いコピーで元候補への参照共有を避ける
    const copied: Candidate = JSON.parse(JSON.stringify(source));
    copied.title = makeUniqueCandidateCopyTitle(source.title ?? "");

    const nextIdx = candidates.length;
    setMeta((prev) => ({
      ...prev,
      candidate: [...(prev.candidate ?? []), copied],
    }));

    // 見た目だけでなく、Map/保存側コンテキストも同期するため選択イベントを送る
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
    pendingNewCandidateIdxRef.current = null;
  };

  // 候補削除（不可逆）に追従して、選択/編集中状態を安全にクリア
  useEffect(() => {
    const candLen = candidates?.length ?? 0;

    if (selectedCandidateIdx != null && selectedCandidateIdx >= candLen) {
      setSelectedCandidateIdx(null);
    }

    if (editingCandidateIdx != null && editingCandidateIdx >= candLen) {
      setEditingCandidateIdx(null);
      setEditingCandidateTitle("");
      pendingNewCandidateIdxRef.current = null;
    }

    if (candidateDeletionLocked) {
      setSelectedCandidateIdx(null);
      setEditingCandidateIdx(null);
      setEditingCandidateTitle("");
      pendingNewCandidateIdxRef.current = null;
    }
  }, [
    candidates?.length,
    selectedCandidateIdx,
    editingCandidateIdx,
    candidateDeletionLocked,
  ]);

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
  const onSelectHistory = (
    item: HistoryItem,
    idx: number,
    flightFigureId?: string
  ) => {
    setSelectedHistoryIdx(idx); // 履歴のインデックスを設定
    const cardKey = getOwnCardKey(item, idx);
    const figures = ownFlightFiguresByCardKey[cardKey] ?? [];
    const resolvedFigureId =
      flightFigureId?.trim() ||
      figures.find((f) => f.isConfirmed)?.id ||
      figures[0]?.id ||
      null;
    setSelectedOwnFlightFigureId(resolvedFigureId);
    setSelectedCandidateIdx(null); // 候補の選択状態を解除
    // 履歴選択イベントを通知（UI 状態は indices で管理）
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "schedule" as const },
      })
    );
    const event = new CustomEvent(EV_DETAILBAR_SELECT_HISTORY, {
      detail: {
        ...item,
        index: idx,
        // 地図側には明示的な figureId（または confirmed）を渡す
        flightFigureId: resolvedFigureId ?? undefined,
      },
    });
    window.dispatchEvent(event);
  };

  // 候補エリア選択時
  const onSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx); // 候補エリアのインデックスを設定
    setSelectedHistoryIdx(null); // 履歴の選択状態を解除
    setSelectedOwnFlightFigureId(null);
    // 候補選択イベントを通知（UI 状態は indices で管理）
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_SELECTED, {
        detail: { isSelected: true, kind: "candidate" as const },
      })
    );
    // title一致ではなく index を正として参照する（同名候補があっても誤選択しない）
    const selectedCandidate = meta.candidate[idx];
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
      const hasCandidateDeletionLocked =
        Object.prototype.hasOwnProperty.call(m, "candidateDeletionLocked");

      setMeta((prev) => ({
        ...prev,
        ...m,
        // backend由来の meta 更新には candidateDeletionLocked が入らないため、
        // エリア切り替えなどでロックが漏れないように明示的に false に戻す。
        ...(hasCandidateDeletionLocked ? {} : { candidateDeletionLocked: false }),
      }));
      // 自社タブの画面専用フィールドはエリア切替でクリア（保存未接続）
      setFacilityType("");
      setOwner("");
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
      setSelectedOwnFlightFigureId(null);
      setSelectedCandidateIdx(null);
      // 自社タブ：エリア切替時は全カード閉じる
      setOwnExpandedKeys(new Set());
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
      setSelectedOwnFlightFigureId(null);
    }
  }, [history, selectedHistoryIdx]);

  // 自社タブの飛行エリア図一覧（表示専用）を履歴から構築
  useEffect(() => {
    let cancelled = false;

    const loadOwnFlightFigures = async () => {
      if (!history.length) {
        if (!cancelled) setOwnFlightFiguresByCardKey({});
        return;
      }

      const entries = await Promise.all(
        history.map(async (item, i) => {
          const cardKey = getOwnCardKey(item, i);
          const projectUuid = item.projectUuid?.trim();
          const scheduleUuid = item.scheduleUuid?.trim();
          const fallbackTitle = item.scheduleName?.trim() || "飛行エリア図";

          if (!projectUuid || !scheduleUuid) {
            return [cardKey, [] as OwnFlightFigureView[]] as const;
          }

          try {
            const project = await fetchProjectIndex(projectUuid);
            const schedules = Array.isArray(project?.schedules)
              ? project.schedules
              : [];
            const schedule = schedules.find((s: any) => s?.id === scheduleUuid);
            const normalized = normalizeScheduleFlightArea(
              schedule?.area,
              fallbackTitle
            );

            const list = normalized.flight_figures.map((figure: FlightFigure) => ({
              id: figure.id,
              title: figure.title?.trim() || fallbackTitle,
              isConfirmed: figure.id === normalized.confirmed_figure_id,
            }));

            return [cardKey, list] as const;
          } catch (error) {
            console.warn(
              "[detailbar] failed to load flight figures for history card",
              { projectUuid, scheduleUuid, error }
            );
            return [cardKey, [] as OwnFlightFigureView[]] as const;
          }
        })
      );

      if (cancelled) return;
      const nextMap = Object.fromEntries(entries);
      setOwnFlightFiguresByCardKey(nextMap);

      // figureId未指定の選択（URL自動選択など）では、confirmed をハイライト対象にする
      setSelectedOwnFlightFigureId((current) => {
        if (current) return current;
        if (selectedHistoryIdx == null) return null;
        const item = history[selectedHistoryIdx];
        if (!item) return null;
        const cardKey = getOwnCardKey(item, selectedHistoryIdx);
        const figures = nextMap[cardKey] ?? [];
        const confirmed = figures.find((f) => f.isConfirmed);
        return confirmed?.id ?? figures[0]?.id ?? null;
      });
    };

    loadOwnFlightFigures();
    return () => {
      cancelled = true;
    };
  }, [history]);

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
      setSelectedOwnFlightFigureId(null);
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
    setActivePrimary("own");

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

      {/* ヘッダー（タイトル） */}
      <div
        className="detailbar-header"
        role="banner"
        aria-label="エリア詳細ヘッダー"
      >
        <div className="detailbar-title" aria-live="polite" title={title}>
          <InputBox value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      {/* 本文 */}
      <div className="detailbar-panel">
        {/* 共通情報・制限備考はメインタブより上（常時表示） */}
        <div className="detailbar-own">
          <div className="detailbar-own-section">
            <div className="detailbar-own-section-title">共通情報</div>
            <div className="detailbar-form detailbar-own-form">
              <InputBox
                label="施設種別"
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
              />
              <InputBox
                label="住所"
                value={meta.address}
                onChange={(e) =>
                  setMeta((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className="detailbar-own-row">
                <SelectBox
                  label="都道府県"
                  value={meta.prefecture}
                  options={PREFECTURES}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, prefecture: e.target.value }))
                  }
                />
                <InputBox
                  label="担当者"
                  value={meta.manager}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, manager: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="detailbar-own-separator" />

          <div className="detailbar-own-section">
            <button
              type="button"
              className="detailbar-own-section-toggle"
              aria-expanded={notesOpen}
              aria-controls="detailbar-notes-panel"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <span className="detailbar-own-section-title">備考</span>
              <span
                className={`detailbar-own-section-chevron ${
                  notesOpen ? "is-open" : ""
                }`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
            {notesOpen && (
              <div
                id="detailbar-notes-panel"
                className="detailbar-form detailbar-form--lg detailbar-own-form"
              >
                <InputBox
                  label="所有者"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
                <Textarea
                  label="制限"
                  value={meta.restrictionsMemo}
                  onChange={(e) =>
                    setMeta((p) => ({
                      ...p,
                      restrictionsMemo: e.target.value,
                    }))
                  }
                />
                <InputBox
                  label="備考"
                  value={meta.remarks}
                  onChange={(e) =>
                    setMeta((p) => ({ ...p, remarks: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="詳細バータブ"
          className="detailbar-tabs detailbar-tabs--primary"
        >
          {(
            [
              { key: "own", label: "自社" },
              { key: "considering", label: "検討中" },
              { key: "other", label: "他社" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activePrimary === key}
              className={`tab-btn ${activePrimary === key ? "is-active" : ""}`}
              onClick={() => setActivePrimary(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 自社タブ：エリアに紐づく案件履歴（1 HistoryItem = 1カード） */}
        {activePrimary === "own" && (
          <section role="tabpanel" aria-label="自社" className="detailbar-own-tab">
            <div className="detailbar-own-history-title">
              案件履歴（{history.length}件）
            </div>

            <div className="detailbar-own-project-list">
              {history.length === 0 ? (
                <div className="detailbar-placeholder" aria-live="polite">
                  履歴はありません
                </div>
              ) : (
                history.map((item, i) => {
                  const cardKey = getOwnCardKey(item, i);
                  const expanded = ownExpandedKeys.has(cardKey);
                  const flightSelected = selectedHistoryIdx === i;
                  const ownFigures = ownFlightFiguresByCardKey[cardKey] ?? [];
                  return (
                    <div
                      key={cardKey}
                      className="detailbar-own-project-card"
                    >
                      <div className="detailbar-own-project-top">
                        <span
                          className="detailbar-own-project-hub"
                          onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                            e.stopPropagation();
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
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                          />
                        </span>
                        <button
                          type="button"
                          className="detailbar-own-project-header"
                          aria-expanded={expanded}
                          onClick={() => {
                            setOwnExpandedKeys((prev) => {
                              const next = new Set(prev);
                              if (next.has(cardKey)) next.delete(cardKey);
                              else next.add(cardKey);
                              return next;
                            });
                          }}
                        >
                          <span className="detailbar-own-project-title">
                            {item.projectName}
                          </span>
                          <span className="detailbar-own-project-schedule">
                            {item.scheduleName}
                          </span>
                          <span className="detailbar-own-project-date">
                            {item.date}
                          </span>
                        </button>
                        {editable && (
                          <span
                            className="detailbar-own-project-delete"
                            onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                              e.stopPropagation();
                            }}
                          >
                            <DeleteIconButton
                              title="この履歴を削除"
                              tabIndex={0}
                              onClick={() => {
                                if (!editable) return;

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

                      {expanded && (
                        <div className="detailbar-own-flight">
                          <div className="detailbar-own-flight-title">
                            飛行エリア図（{ownFigures.length}件）
                          </div>
                          <div className="detailbar-own-flight-list">
                            {ownFigures.length === 0 ? (
                              <div className="ds-record-empty" aria-live="polite">
                                飛行エリア図はありません
                              </div>
                            ) : (
                              ownFigures.map((figure) => {
                                const selectedFigure =
                                  flightSelected &&
                                  selectedOwnFlightFigureId === figure.id;
                                return (
                                  <button
                                    key={figure.id}
                                    type="button"
                                    className={`detailbar-own-flight-item ${
                                      selectedFigure ? "is-selected" : ""
                                    }`}
                                    aria-pressed={selectedFigure}
                                    onClick={() =>
                                      onSelectHistory(item, i, figure.id)
                                    }
                                  >
                                    <span
                                      className={`detailbar-own-flight-dot ${
                                        selectedFigure ? "is-selected" : ""
                                      }`}
                                      aria-hidden="true"
                                    />
                                    <span className="detailbar-own-flight-label">
                                      {figure.title}
                                      {figure.isConfirmed ? "（確定）" : ""}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                          {editable && (
                            <button
                              type="button"
                              className="detailbar-own-outline-button"
                              onClick={() => handleAddFlightAreaFigure(item, i)}
                            >
                              飛行エリア図を追加
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {editable && (
              <button
                type="button"
                className="detailbar-own-outline-button"
                onClick={handleRegisterProjectInfo}
              >
                案件情報を紐づける
              </button>
            )}
          </section>
        )}

        {/* 検討中タブ（まずはサンプルUIのみ） */}
        {activePrimary === "considering" && (
          <section
            role="tabpanel"
            aria-label="検討中"
            className="detailbar-considering-tab"
          >
            <div className="detailbar-form detailbar-own-form">
              <SelectBox
                label="ステータス"
                value={consideringStatus}
                options={[...CONSIDERING_STATUS_OPTIONS]}
                onChange={(e) => setConsideringStatus(e.target.value)}
              />
              <InputBox
                label="担当者"
                value={consideringManager}
                onChange={(e) => setConsideringManager(e.target.value)}
              />
              <SelectBox
                label="チャネル"
                value={consideringChannel}
                options={[...CONSIDERING_CHANNEL_OPTIONS]}
                onChange={(e) => setConsideringChannel(e.target.value)}
              />
              <div className="detailbar-own-row">
                <SelectBox
                  label="フィジビリ"
                  value={consideringFeasibility}
                  options={[...CONSIDERING_FEASIBILITY_OPTIONS]}
                  onChange={(e) => setConsideringFeasibility(e.target.value)}
                />
                <InputBox
                  label="コスト目安"
                  value={consideringCost}
                  placeholder="未入力"
                  onChange={(e) => setConsideringCost(e.target.value)}
                />
              </div>
              <Textarea
                label="メモ"
                value={consideringMemo}
                rows={4}
                onChange={(e) => setConsideringMemo(e.target.value)}
              />
            </div>

            <div className="detailbar-own-separator" />

            <div className="detailbar-own-flight">
              <div className="detailbar-own-flight-title">
                飛行エリア図（{candidates.length}件）
              </div>

              <div className="detailbar-own-flight-list">
                {candidates.length === 0 ? (
                  <div className="ds-record-empty" aria-live="polite">
                    飛行エリア図はありません
                  </div>
                ) : (
                  candidates.map((candidate, idx) => {
                    const selected = selectedCandidateIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`detailbar-own-flight-item ${
                          selected ? "is-selected" : ""
                        }`}
                        role="option"
                        aria-selected={selected}
                        onClick={() => onSelectCandidate(idx)}
                      >
                        <span
                          className={`detailbar-own-flight-dot ${
                            selected ? "is-selected" : ""
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className="detailbar-own-flight-label"
                          onDoubleClick={(
                            e: ReactMouseEvent<HTMLSpanElement>
                          ) => {
                            if (!editable) return;
                            e.stopPropagation();

                            if (
                              editingCandidateIdx != null &&
                              editingCandidateIdx !== idx
                            ) {
                              const ok = commitCandidateTitle();
                              if (!ok) return;
                            }

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
                              placeholder="飛行エリア図"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setEditingCandidateTitle(e.target.value)
                              }
                              onBlur={() => {
                                const editIdx = editingCandidateIdx;
                                const isPendingNew =
                                  editIdx != null &&
                                  pendingNewCandidateIdxRef.current === editIdx;
                                const hasInput =
                                  editingCandidateTitle.trim().length > 0;

                                if (isPendingNew && hasInput) {
                                  commitCandidateTitle();
                                  return;
                                }

                                cancelCandidateEdit();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  commitCandidateTitle();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelCandidateEdit();
                                }
                              }}
                            />
                          ) : (
                            candidate.title || "（無題）"
                          )}
                        </span>

                        {editable && !candidateDeletionLocked && (
                          <span
                            className="detailbar-own-flight-actions"
                            onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                              e.stopPropagation();
                            }}
                          >
                            <button
                              type="button"
                              className="ds-candidate-duplicate-button"
                              title="この飛行エリア図を複製"
                              onClick={() => duplicateCandidate(idx)}
                            >
                              複製
                            </button>
                            <DeleteIconButton
                              title="この飛行エリア図を削除"
                              tabIndex={0}
                              onClick={() => {
                                if (!editable) return;

                                const ok = window.confirm(
                                  `飛行エリア図「${
                                    candidate.title || "（無題）"
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
                                  "飛行エリア図を削除しました。\nSAVEボタンで確定してください。"
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

              {editable && !candidateDeletionLocked && (
                <button
                  type="button"
                  className="detailbar-own-outline-button"
                  onClick={handleAddCandidate}
                >
                  飛行エリア図を追加
                </button>
              )}
            </div>
          </section>
        )}

        {/* 他社タブ（まずはサンプルUI。編集ONで入力可） */}
        {activePrimary === "other" && (
          <section
            role="tabpanel"
            aria-label="他社"
            className="detailbar-other-tab"
          >
            <div className="detailbar-own-history-title">
              実績一覧（{otherRecords.length}件）
            </div>

            <div className="detailbar-own-project-list">
              {otherRecords.map((record, recordIdx) => {
                const expanded = otherExpandedIds.has(record.id);
                const subtitle = `${record.eventTitle} / ${record.heldOn}`;
                const updateRecord = (
                  patch: Partial<Omit<OtherCompanyRecord, "id" | "flightAreas">>
                ) => {
                  setOtherRecords((prev) =>
                    prev.map((r, i) =>
                      i === recordIdx ? { ...r, ...patch } : r
                    )
                  );
                };
                return (
                  <div key={record.id} className="detailbar-own-project-card">
                    <button
                      type="button"
                      className="detailbar-own-project-header"
                      aria-expanded={expanded}
                      onClick={() => {
                        setOtherExpandedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(record.id)) next.delete(record.id);
                          else next.add(record.id);
                          return next;
                        });
                      }}
                    >
                      <span className="detailbar-own-project-title">
                        {record.companyName}
                      </span>
                      <span className="detailbar-own-project-date">
                        {subtitle}
                      </span>
                    </button>

                    {expanded && (
                      <div className="detailbar-other-body">
                        <div className="detailbar-form detailbar-own-form">
                          <InputBox
                            label="会社名"
                            value={record.companyName}
                            onChange={(e) =>
                              updateRecord({ companyName: e.target.value })
                            }
                          />
                          <InputBox
                            label="イベント"
                            value={record.eventTitle}
                            onChange={(e) =>
                              updateRecord({ eventTitle: e.target.value })
                            }
                          />
                          <InputBox
                            label="開催年月"
                            value={record.heldOn}
                            onChange={(e) =>
                              updateRecord({ heldOn: e.target.value })
                            }
                          />
                          <InputBox
                            label="会場"
                            value={record.venue}
                            onChange={(e) =>
                              updateRecord({ venue: e.target.value })
                            }
                          />
                          <InputBox
                            label="機体数"
                            value={record.aircraftCount}
                            onChange={(e) =>
                              updateRecord({ aircraftCount: e.target.value })
                            }
                          />
                          <InputBox
                            label="RCアプローチ"
                            value={record.rcApproach}
                            onChange={(e) =>
                              updateRecord({ rcApproach: e.target.value })
                            }
                          />
                          <InputBox
                            label="感触"
                            value={record.impression}
                            onChange={(e) =>
                              updateRecord({ impression: e.target.value })
                            }
                          />
                          <InputBox
                            label="MEMO"
                            value={record.memo}
                            onChange={(e) =>
                              updateRecord({ memo: e.target.value })
                            }
                          />
                        </div>

                        <div className="detailbar-own-flight">
                          <div className="detailbar-own-flight-title">
                            飛行エリア図（{record.flightAreas.length}件）
                          </div>
                          <div className="detailbar-own-flight-list">
                            {record.flightAreas.map((area) => (
                              <button
                                key={area.id}
                                type="button"
                                className="detailbar-own-flight-item"
                              >
                                <span className="detailbar-own-flight-label">
                                  {area.label}
                                </span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="detailbar-own-outline-button"
                          >
                            飛行エリア図を追加
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button type="button" className="detailbar-own-outline-button">
              実績を追加する
            </button>
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

      {/* 右端リサイズハンドル（右にドラッグで幅を広げる） */}
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
