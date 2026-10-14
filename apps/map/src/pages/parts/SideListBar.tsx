// apps/map/src/pages/parts/SideListBar.tsx
import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ONButton,
  OFFButton,
  SaveButton,
  LogoButton,
  blurActiveInput,
  DeleteIconButton,
} from "@/components";
import {
  openDetailBar,
  setDetailBarTitle,
  setDetailBarHistory,
  setDetailBarMeta,
  closeDetailBar,
} from "./SideDetailBar";
import { getUserDisplayName } from "@/lib/auditHeaders";
import {
  fetchAreaInfo,
  fetchRawAreaInfo,
  saveAreaInfo,
  buildAreaHistoryFromProjects,
  isAreaNameDuplicated,
  upsertAreasListEntryFromInfo,
  removeAreasListEntryByUuid,
  deleteAreaFromCatalog,
  clearScheduleAreaRef,
  moveScheduleAreaRefsToArea,
  FETCH_AREAS_LIST_ERROR_MSG,
} from "./areasApi";
import {
  EMPTY_CONSIDERING_INFO,
  AREA_AXIS_CHOICE_LABEL,
  AREA_AXIS_LABEL,
  AREA_AXIS_ORDER,
  AREA_AXIS_TOGGLE_ORDER,
  AREA_KIND_LABEL,
  SALES_FILTER_LABEL,
  SALES_STATUS_FILTER_ORDER,
  EMPTY_AREA_AXIS_FILTER,
  areaKindFlagList,
  canonicalConsideringStatus,
  getAreaKindFlags,
  hasConsideringContent,
  isAreaClassified,
  isEmptyOtherRecord,
  salesFilterSummary,
  parseTabUpdates,
  applyTabUpdateStamps,
  seedMissingTabUpdates,
  areaBasicSnapshot,
  areaConsideringSnapshot,
  historyPairsKey,
  areaOwnFiguresSnapshot,
  collectDirtyAreaTabs,
  type AreaAxisFilter,
} from "./detailBar/helpers";
import type {
  Candidate,
  ScheduleLite,
  Point,
  GeometryPayload,
  HistoryItem,
  OtherRecord,
  TabKey,
} from "@/features/types";
import {
  AREA_NAME_NONE,
  EV_GEOMETRY_REQUEST_DATA,
  EV_SIDEBAR_VISIBLE_AREAS,
  EV_SIDEBAR_AREA_KINDS,
  EV_DETAILBAR_RESPOND_DATA,
  EV_MAP_FOCUS_ONLY,
  EV_GEOMETRY_RESPOND_DATA,
  EV_DETAILBAR_REQUEST_DATA,
  EV_PLACE_SEARCH_ADD,
  EV_SIDEBAR_OPEN,
  EV_GEOMETRY_SAVE_COMPLETE,
} from "./constants/events";
import {
  systemError,
  SAVE_TIMEOUT,
  E001_PROJECT_INDEX,
  E002_AREAS_LIST,
  E003_SAVE_PROCESS,
  E005_AREA_UUID,
} from "@/lib/errorMessages";

import type { AreaSortDir, AreaSortType } from "./sideListSort";
import {
  AREA_SORT_DEFAULT_DIR,
  areaSortDirLabel,
  groupAreasByDroneCount,
  groupAreasByPrefecture,
  groupAreasByUpdatedAt,
  selectVisibleAreaGroups,
} from "./sideListSort";
import { useAreaListMetadata } from "./useAreaListMetadata";
import { useSidebarExternalEvents } from "./useSidebarExternalEvents";
import {
  applyCandidateGeometryFromPayload,
  applyOtherFigureGeometryFromPayload,
  applyOwnFlightFiguresFromHistory,
  applySalesGeometryFromPayload,
  canMergeOwnGeometry,
} from "./saveAreaFigures";

// サイドバーの基本コンポーネント
function SideListBarBase({
  points = [],
  schedulesLite = [],
}: {
  points?: Point[];
  schedulesLite?: ScheduleLite[];
}) {
  const [isOn, setIsOn] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const iconH = 25;

  // エリア名の一時上書き & 編集状態
  const [areaLabelOverrides, setAreaLabelOverrides] = useState<
    Record<string, string>
  >({});
  const [editingAreaKey, setEditingAreaKey] = useState<string | null>(null);
  const [editingTempName, setEditingTempName] = useState("");
  const editingInputRef = useRef<HTMLInputElement | null>(null);

  // 画面上のみ削除扱いとするエリア名
  const [deletedAreas, setDeletedAreas] = useState<Set<string>>(
    () => new Set()
  );

  // 保存処理中
  const [isSaving, setIsSaving] = useState(false);

  // 現在の保存コンテキスト（エリア／候補）
  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentAreaNameRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentSalesIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);
  const currentOtherRecordIndexRef = useRef<number | null>(null);
  const currentOtherFigureIndexRef = useRef<number | null>(null);
  /** 最後にサーバーから読み込んだ／保存した RC 案件データの飛行エリア図 */
  const ownFiguresBaselineRef = useRef<string>(areaOwnFiguresSnapshot([]));

  // エリア追加モードの状態
  const [isAddAreaMode, setIsAddAreaMode] = useState(false);
  // 検索クエリ state
  const [searchQuery, setSearchQuery] = useState("");
  // ソート種類 state
  const [sortType, setSortType] = useState<AreaSortType>("updated");
  const [sortDir, setSortDir] = useState<AreaSortDir>(
    AREA_SORT_DEFAULT_DIR.updated
  );
  // フィルター条件（RC / 他社は独立。指定なし＝問わない）
  const [axisFilter, setAxisFilter] = useState<AreaAxisFilter>(
    EMPTY_AREA_AXIS_FILTER
  );
  const [salesFilterOpen, setSalesFilterOpen] = useState(false);
  const salesFilterRef = useRef<HTMLDivElement | null>(null);
  const {
    prefectureCache,
    updatedAtCache,
    kindCache,
    droneCountCache,
    setKindCache,
  } = useAreaListMetadata(points);

  // points 更新時、deletedAreas から既に一覧に存在しないエリアを除去
  // （削除保存後 areas:reload で points が更新されたときのクリーンアップ）
  useEffect(() => {
    const currentAreaNames = new Set(
      points.map((p) => (p?.areaName?.trim() || AREA_NAME_NONE))
    );
    setDeletedAreas((prev) => {
      const next = new Set(prev);
      let changed = false;
      prev.forEach((area) => {
        if (!currentAreaNames.has(area)) {
          next.delete(area);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [points]);

  const beginAddAreaMode = useCallback(() => {
    setActiveKey(null);
    currentAreaUuidRef.current = undefined;
    currentAreaNameRef.current = undefined;
    currentCandidateIndexRef.current = null;
    currentSalesIndexRef.current = null;
    currentCandidateTitleRef.current = undefined;
    currentOtherRecordIndexRef.current = null;
    currentOtherFigureIndexRef.current = null;
    pendingProjectLinkRef.current = null;
    ownFiguresBaselineRef.current = areaOwnFiguresSnapshot([]);

    closeDetailBar();
    window.dispatchEvent(new Event("map:start-add-area"));
  }, []);

  useEffect(() => {
    const onPlaceSearchAdd = (e: Event) => {
      const d =
        (
          e as CustomEvent<{ lat?: number; lng?: number; label?: string }>
        ).detail || {};
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return;

      setIsOn(true);
      window.dispatchEvent(new Event(EV_SIDEBAR_OPEN));
      beginAddAreaMode();
      window.dispatchEvent(
        new CustomEvent("map:add-area-picked", {
          detail: { lat: d.lat, lng: d.lng, label: d.label },
        })
      );
    };

    window.addEventListener(
      EV_PLACE_SEARCH_ADD,
      onPlaceSearchAdd as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_PLACE_SEARCH_ADD,
        onPlaceSearchAdd as EventListener
      );
  }, [beginAddAreaMode]);

  // 案件紐づけモーダルで選ばれた「案件・スケジュール」を保持
  const pendingProjectLinkRef = useRef<{
    projectUuid: string;
    scheduleUuid: string;
  } | null>(null);

  // エリア名を正規化
  const normArea = (p?: { areaName?: string }) =>
    (p?.areaName?.trim() as string) || AREA_NAME_NONE;

  // area文字列 → areaUuid を引くユーティリティ
  const getAreaUuidByAreaName = (area: string) => {
    const idx = points.findIndex((p) => normArea(p) === area);
    return idx >= 0 ? points[idx].areaUuid : undefined;
  };

  // エリア集約（出現順維持）
  const areaGroups = useMemo(() => {
    const map = new Map<string, number[]>();
    points.forEach((p, idx) => {
      const area = normArea(p);
      if (!map.has(area)) map.set(area, [idx]);
      else map.get(area)!.push(idx);
    });
    const seen = new Set<string>();
    const ordered: { area: string; indices: number[] }[] = [];
    points.forEach((p) => {
      const area = normArea(p);
      if (!seen.has(area)) {
        seen.add(area);
        ordered.push({ area, indices: map.get(area)! });
      }
    });
    if (import.meta.env.DEV) console.debug("[sidebar] areas=", ordered.length);
    return ordered;
  }, [points]);

  // areaUuid から project/schedule 履歴をログ出力（デバッグ用）
  const logAreaHistory = async (area: string, pts: Point[]) => {
    try {
      const idx = pts.findIndex((p: Point) => normArea(p) === area);
      const areaUuid = idx >= 0 ? pts[idx].areaUuid : undefined;
      if (!areaUuid) {
        console.warn("[area-click] areaUuid not found for area:", area);
        return;
      }

      const raw = await fetchRawAreaInfo(areaUuid);
      const history = Array.isArray(raw?.history) ? raw.history : [];

      if (history.length === 0) {
        console.log(`[area-click] history empty for area="${area}"`);
        return;
      }

      history.forEach((h: any, i: number) => {
        const date = typeof h?.date === "string" ? h.date : "";
        const projectName =
          typeof h?.projectName === "string" ? h.projectName : "";
        const scheduleName =
          typeof h?.scheduleName === "string" ? h.scheduleName : "";
        console.log(
          `[area-click #${
            i + 1
          }] date=${date} project=${projectName} schedule=${scheduleName}`
        );
      });
    } catch (e) {
      console.error("[area-click] failed to log history:", e);
    }
  };

  // 詳細バーに反映
  const loadAndShowInfoForArea = async (
    area: string,
    opts?: { titleOverride?: string }
  ) => {
    const idx = points.findIndex((p) => normArea(p) === area);
    const areaUuid = idx >= 0 ? points[idx].areaUuid : undefined;

    if (!areaUuid) {
      console.error("areaUuid not found for area:", area);
      return;
    }

    const { title, meta } = await fetchAreaInfo(areaUuid, area);

    // インライン編集で上書きされた表示名を優先
    const displayTitle =
      opts?.titleOverride ?? areaLabelOverrides[area] ?? title ?? area;

    setDetailBarTitle(displayTitle);
    setDetailBarMeta(meta);

    const fullHistory = await buildAreaHistoryFromProjects(areaUuid);
    setDetailBarHistory(fullHistory);
    ownFiguresBaselineRef.current = areaOwnFiguresSnapshot(fullHistory);
  };

  // 共通のエリアアクティベーション（クリック/Enter/Space）
  const activateArea = async (area: string) => {
    setActiveKey(area);
    await loadAndShowInfoForArea(area, {
      titleOverride: areaLabelOverrides[area],
    });
    openDetailBar();

    const areaUuid = getAreaUuidByAreaName(area);
    currentAreaUuidRef.current = areaUuid;
    currentAreaNameRef.current = areaLabelOverrides[area] || area;

    window.dispatchEvent(
      new CustomEvent(EV_MAP_FOCUS_ONLY, {
        detail: { areaUuid, areaName: area },
      })
    );

    logAreaHistory(area, points);
  };

  // MapGeometry から現在編集中の geometry 情報（payload）を取得
  const requestGeometryPayload = async (): Promise<GeometryPayload | null> => {
    const payload = await new Promise<GeometryPayload>((resolve, reject) => {
      let timer: number | null = null;

      const onGeom = (e: Event) => {
        window.removeEventListener(
          EV_GEOMETRY_RESPOND_DATA,
          onGeom as EventListener
        );
        if (timer != null) window.clearTimeout(timer);
        resolve((e as CustomEvent).detail);
      };

      window.addEventListener(
        EV_GEOMETRY_RESPOND_DATA,
        onGeom as EventListener,
        { once: true }
      );

      // 現在の Geometry をリクエスト
      window.dispatchEvent(new Event(EV_GEOMETRY_REQUEST_DATA));

      // 返ってこない場合はタイムアウト扱い
      timer = window.setTimeout(() => {
        window.removeEventListener(
          EV_GEOMETRY_RESPOND_DATA,
          onGeom as EventListener
        );
        reject(new Error("geometry からの応答がありません"));
      }, 1500);
    });

    return payload;
  };

  // Map（MapView）から現在の代表座標 Point を取得
  const requestCurrentPoint = async (): Promise<Point | null> => {
    const point = await new Promise<Point | null>((resolve, reject) => {
      let timer: number | null = null;

      const onResp = (e: Event) => {
        window.removeEventListener(
          "map:respond-current-point",
          onResp as EventListener
        );
        if (timer != null) window.clearTimeout(timer);
        resolve((e as CustomEvent<Point | null>).detail ?? null);
      };

      window.addEventListener(
        "map:respond-current-point",
        onResp as EventListener,
        { once: true }
      );

      // MapView に現在のポイントを問い合わせ
      window.dispatchEvent(new Event("map:request-current-point"));

      timer = window.setTimeout(() => {
        window.removeEventListener(
          "map:respond-current-point",
          onResp as EventListener
        );
        reject(new Error("map からの currentPoint 応答がありません"));
      }, 1500);
    });

    return point;
  };

  // エリア名の編集開始
  const beginEditAreaName = (area: string) => {
    if (!isOn) return; // 編集モードOFFなら無効
    setEditingAreaKey(area);
    setEditingTempName(areaLabelOverrides[area] ?? area);
  };

  // 編集確定
  const commitEditAreaName = () => {
    if (!editingAreaKey) return;
    const trimmed = editingTempName.trim();
    const finalName = trimmed || editingAreaKey; // 空なら元の名前を使う

    // サイドリストの表示名を更新
    setAreaLabelOverrides((prev) => ({
      ...prev,
      [editingAreaKey]: finalName,
    }));
    setEditingAreaKey(null);

    // 詳細バーに反映：今アクティブなエリアならタイトルも更新
    if (activeKey === editingAreaKey) {
      setDetailBarTitle(finalName);
    }
  };

  // 編集キャンセル
  const cancelEditAreaName = () => {
    setEditingAreaKey(null);
    setEditingTempName("");
  };

  // 編集開始時に input にフォーカス
  useEffect(() => {
    if (editingAreaKey && editingInputRef.current) {
      const input = editingInputRef.current;
      const len = input.value.length;

      // まずフォーカス
      input.focus();

      // ダブルクリックで付いた全選択を上書きして「選択なし」にする
      // （開始=終了 なので青い選択は消える）
      window.setTimeout(() => {
        try {
          input.setSelectionRange(len, len); // 末尾にキャレットのみ
        } catch {
          // 一部環境で setSelectionRange が投げても無視
        }
      }, 0);
    }
  }, [editingAreaKey]);

  // DetailBar の現在データを取得するヘルパー
  const requestDetailbarData = async (): Promise<{
    title: string;
    meta: any;
    history: HistoryItem[];
  }> => {
    return await new Promise((resolve, reject) => {
      let timer: number | null = null;

      const onRespond = (e: Event) => {
        window.removeEventListener(
          EV_DETAILBAR_RESPOND_DATA,
          onRespond as EventListener
        );
        if (timer != null) window.clearTimeout(timer);
        const detail = (e as CustomEvent).detail as {
          title?: string;
          meta?: any;
          history?: any[];
        };
        resolve({
          title: detail.title ?? "",
          meta: detail.meta ?? {},
          history: Array.isArray(detail.history)
            ? (detail.history as HistoryItem[])
            : [],
        });
      };

      window.addEventListener(
        EV_DETAILBAR_RESPOND_DATA,
        onRespond as EventListener,
        { once: true }
      );

      // DetailBar に現在のデータを要求
      window.dispatchEvent(new Event(EV_DETAILBAR_REQUEST_DATA));

      timer = window.setTimeout(() => {
        window.removeEventListener(
          EV_DETAILBAR_RESPOND_DATA,
          onRespond as EventListener
        );
        reject(new Error("detailbar からの応答がありません"));
      }, 1500);
    });
  };

  // 保存
  const handleSave = async () => {
    const saveWithoutTarget = () => {
      window.alert("保存対象のエリアを選択してください。");
    };

    const saveDeletedAreasOnly = async () => {
      // --- ② 「削除だけ保存する」パス（どのエリアも選択していない）---
      const deletedAreaNames = Array.from(deletedAreas);
      let allOk = true;
      for (const areaName of deletedAreaNames) {
        const areaUuid = getAreaUuidByAreaName(areaName);
        if (!areaUuid) continue;

        const raw = await fetchRawAreaInfo(areaUuid);
        const historyPairs: Array<{ projectUuid: string; scheduleUuid: string }> =
          Array.isArray(raw?.history)
            ? raw.history.flatMap((h: any) => {
                const projectUuid =
                  typeof h?.projectuuid === "string" ? h.projectuuid : null;
                const scheduleUuid =
                  typeof h?.scheduleuuid === "string" ? h.scheduleuuid : null;
                return projectUuid && scheduleUuid
                  ? [{ projectUuid, scheduleUuid }]
                  : [];
              })
            : [];

        for (const { projectUuid, scheduleUuid } of historyPairs) {
          try {
            await clearScheduleAreaRef({ projectUuid, scheduleUuid });
          } catch (e) {
            console.warn("[save] clear schedule for deleted area failed", e);
            allOk = false;
          }
        }

        const okDel = await deleteAreaFromCatalog(areaUuid);
        if (!okDel) {
          console.error("[save] deleteAreaFromCatalog failed", areaUuid);
          allOk = false;
          continue;
        }

        try {
          const okRemove = await removeAreasListEntryByUuid(areaUuid);
          if (!okRemove) {
            console.warn("[save] removeAreasListEntryByUuid failed", areaUuid);
          }
        } catch (e) {
          console.error("[save] removeAreasListEntryByUuid failed", areaUuid, e);
          window.alert(FETCH_AREAS_LIST_ERROR_MSG);
          allOk = false;
          break;
        }
      }

      // deletedAreas はクリアしない。areas:reload で points が更新されるまで
      // 削除済みエリアを非表示に保つため。points 更新後に useEffect でクリーンアップ
      window.dispatchEvent(new Event("areas:reload"));
      window.dispatchEvent(new Event(EV_GEOMETRY_SAVE_COMPLETE));
      window.alert(allOk ? "削除を保存しました" : "一部の削除ができませんでした。しばらく時間をおいて、もう一度お試しください。");
      return;
    };

    const saveEditedArea = async () => {
      // --- ③ ここから下は「編集保存」用の既存ロジック（activeKey 必須） ---
      // （0）保存対象のエリアを選択しているか確認
      if (!activeKey) {
        // ここには基本的に来ないが念のため
        window.alert("保存対象のエリアを選択してください。");
        return;
      }

      const areaName = activeKey;
      const areaUuid =
        currentAreaUuidRef.current ?? getAreaUuidByAreaName(areaName);
      if (!areaUuid) {
        window.alert(
          systemError(
            E005_AREA_UUID,
            `エリアIDが取得できません${areaName ? `（area_name: ${areaName}）` : ""}`
          )
        );
        return;
      }

      // （1）詳細バーの現在値を取得
      const data = await new Promise<{
        title: string;
        meta: any;
        history: any[];
      }>((resolve, reject) => {
        let timer: number | null = null;
        const onRespond = (e: Event) => {
          window.removeEventListener(
            EV_DETAILBAR_RESPOND_DATA,
            onRespond as EventListener
          );
          if (timer != null) window.clearTimeout(timer);
          resolve((e as CustomEvent).detail);
        };
        window.addEventListener(
          EV_DETAILBAR_RESPOND_DATA,
          onRespond as EventListener,
          { once: true }
        );
        window.dispatchEvent(new Event(EV_DETAILBAR_REQUEST_DATA));
        timer = window.setTimeout(() => {
          window.removeEventListener(
            EV_DETAILBAR_RESPOND_DATA,
            onRespond as EventListener
          );
          reject(new Error("detailbar からの応答がありません"));
        }, 3000);
      });

      // 1. 新しいタイトルを取り出す
      const newTitle = (data.title ?? "").trim();
      if (!newTitle) {
        window.alert("エリア名を入力してください。");
        return;
      }

      // 2. areaName 重複チェック（自分自身の uuid は除外）
      const isDup = await isAreaNameDuplicated({
        areaName: newTitle,
        excludeUuid: areaUuid,
      });
      if (isDup) {
        window.alert(
          `エリア名「${newTitle}」は既に存在します。\n別の名称を指定してください。`
        );
        return;
      }

      // （2-1）現状 areas/<areaUuid>/index.json を merge 用に取得
      // あとで「古い値＋新しい値」をマージしたオブジェクトを作るために使用
      const raw = await fetchRawAreaInfo(areaUuid);

      // （2-1.5）DetailBar の history state から index.json 用 history を構築
      const uiHistory: HistoryItem[] = Array.isArray(data.history)
        ? (data.history as HistoryItem[])
        : [];

      // SideDetailBar の HistoryItem { date, projectName, scheduleName, projectUuid, scheduleUuid }
      // → index.json の history 要素 { uuid, projectuuid, scheduleuuid } に変換
      const historyToSave: any[] = uiHistory.flatMap((h) => {
        if (!h.projectUuid || !h.scheduleUuid) return [];
        return [
          {
            uuid: "", // いまは空のまま（必要になったら採番ロジックを追加）
            projectuuid: h.projectUuid,
            scheduleuuid: h.scheduleUuid,
          },
        ];
      });

      /** 紐づけ解除された (projectUuid, scheduleUuid) を検出 */
      const beforePairs: Array<{ projectUuid: string; scheduleUuid: string }> =
        Array.isArray(raw?.history)
          ? raw.history.flatMap((h: any) => {
              const projectUuid =
                typeof h?.projectuuid === "string" ? h.projectuuid : null;
              const scheduleUuid =
                typeof h?.scheduleuuid === "string" ? h.scheduleuuid : null;
              return projectUuid && scheduleUuid
                ? [{ projectUuid, scheduleUuid }]
                : [];
            })
          : [];

      const afterPairs: Array<{ projectUuid: string; scheduleUuid: string }> =
        historyToSave.map((h) => ({
          projectUuid: h.projectuuid,
          scheduleUuid: h.scheduleuuid,
        }));

      // 後ろ（保存後）に残っているペアをキー集合に
      const afterKeySet = new Set(
        afterPairs.map((p) => `${p.projectUuid}::${p.scheduleUuid}`)
      );

      // 保存前にはあったが、保存後には無くなっているペア = 紐づけ解除された案件
      const removedPairs = beforePairs.filter(
        (p) => !afterKeySet.has(`${p.projectUuid}::${p.scheduleUuid}`)
      );

      const sourceOtherRecords: OtherRecord[] = Array.isArray(data.meta.otherRecords)
        ? data.meta.otherRecords
        : Array.isArray(raw?.otherRecords)
        ? (raw.otherRecords as OtherRecord[])
        : [];
      const otherRecordsToSave = sourceOtherRecords.filter(
        (record) => !isEmptyOtherRecord(record)
      );

      const candidatesToSave: typeof data.meta.candidate = Array.isArray(
        data.meta.candidate
      )
        ? data.meta.candidate
        : Array.isArray(raw?.candidate)
        ? raw.candidate
        : [];
      const salesToSave: Candidate[] = Array.isArray(data.meta.sales)
        ? data.meta.sales
        : Array.isArray(raw?.sales)
        ? raw.sales
        : [];
      if (
        salesToSave.some((figure) => !(figure?.title ?? "").trim())
      ) {
        window.alert("営業タブの飛行エリア図にタイトルを入力してください。");
        return;
      }
      const consideringSource = data.meta.considering ?? EMPTY_CONSIDERING_INFO;
      const consideringToSave = {
        status: canonicalConsideringStatus(consideringSource.status),
        statusDetail: consideringSource.statusDetail ?? "",
        manager: consideringSource.manager ?? "",
        channel: consideringSource.channel ?? "",
        feasibility: consideringSource.feasibility ?? "",
        costEstimate: consideringSource.costEstimate ?? "",
        memo: consideringSource.memo ?? "",
      };

      // （2-2）画面入力値からareas/<areaUuid>/index.json 形式
      const displayName = await getUserDisplayName();
      if (
        !consideringToSave.manager.trim() &&
        hasConsideringContent(consideringToSave, [])
      ) {
        consideringToSave.manager = displayName;
      }

      let geomPayload: GeometryPayload | null = null;
      let geomFetchFailed = false;
      try {
        geomPayload = await requestGeometryPayload();
        console.log("[SideListBar] geomPayload on save:", geomPayload);
      } catch (e) {
        geomFetchFailed = true;
        console.warn("[save] geometry payload fetch skipped:", e);
      }

      const figureEdited =
        !!geomPayload && (!!geomPayload.figureEdited || !!geomPayload.deleted);
      let figureTab: TabKey | null = null;
      if (figureEdited && geomPayload) {
        if (geomPayload.projectUuid && geomPayload.scheduleUuid) {
          figureTab = "own";
        } else if (
          typeof currentOtherRecordIndexRef.current === "number" &&
          typeof currentOtherFigureIndexRef.current === "number"
        ) {
          figureTab = "other";
        } else if (typeof currentSalesIndexRef.current === "number") {
          figureTab = "considering";
        } else if (typeof currentCandidateIndexRef.current === "number") {
          figureTab = "own";
        }
      }

      const prevBasic = areaBasicSnapshot({
        areaName: raw?.areaName,
        overview: raw?.overview,
        details: raw?.details,
      });
      const nextBasic = areaBasicSnapshot({
        areaName: newTitle,
        overview: {
          address: data.meta.address ?? "",
          companyName: data.meta.companyName ?? "",
          administrator: data.meta.administrator ?? "",
          contact: data.meta.contact ?? "",
          prefecture: data.meta.prefecture ?? "",
          manager: data.meta.manager ?? "",
          droneRecord: data.meta.droneRecord ?? 0,
          droneCountEstimate: data.meta.aircraftCount ?? "",
          heightLimitM: data.meta.altitudeLimit ?? "",
          availability: data.meta.availability ?? "",
        },
        details: {
          statusMemo: data.meta.statusMemo ?? "",
          permitMemo: data.meta.permitMemo ?? "",
          restrictionsMemo: data.meta.restrictionsMemo ?? "",
          remarks: data.meta.remarks ?? "",
        },
      });
      const prevCandidate = Array.isArray(raw?.candidate) ? raw.candidate : [];
      const prevSales = Array.isArray(raw?.sales) ? raw.sales : [];
      const prevOtherRecords = Array.isArray(raw?.otherRecords)
        ? raw.otherRecords
        : [];
      const dirtyTabs = collectDirtyAreaTabs({
        basicChanged: JSON.stringify(prevBasic) !== JSON.stringify(nextBasic),
        ownHistoryChanged:
          historyPairsKey(beforePairs) !== historyPairsKey(afterPairs) ||
          areaOwnFiguresSnapshot(uiHistory) !== ownFiguresBaselineRef.current,
        consideringChanged:
          JSON.stringify(areaConsideringSnapshot(raw?.considering)) !==
          JSON.stringify(areaConsideringSnapshot(consideringToSave)),
        candidateFiguresChanged:
          JSON.stringify(prevCandidate) !== JSON.stringify(candidatesToSave),
        salesFiguresChanged:
          JSON.stringify(prevSales) !== JSON.stringify(salesToSave),
        otherChanged:
          JSON.stringify(prevOtherRecords) !==
          JSON.stringify(otherRecordsToSave),
        figureTab,
      });

      const now = new Date().toISOString();
      const infoToSave = {
        ...(typeof raw === "object" && raw ? raw : {}),
        areaName: newTitle, // エリア名を index.json にも反映（areas.json と同期）
        overview: {
          ...(raw?.overview ?? {}),
          address: data.meta.address ?? "",
          companyName: data.meta.companyName ?? "",
          administrator: data.meta.administrator ?? "",
          contact: data.meta.contact ?? "",
          prefecture: data.meta.prefecture ?? "",
          manager: data.meta.manager ?? "",
          droneRecord: data.meta.droneRecord ?? 0,
          droneCountEstimate: data.meta.aircraftCount ?? "",
          heightLimitM: data.meta.altitudeLimit ?? "",
          availability: data.meta.availability ?? "",
        },
        details: {
          ...(raw?.details ?? {}),
          statusMemo: data.meta.statusMemo ?? "",
          permitMemo: data.meta.permitMemo ?? "",
          restrictionsMemo: data.meta.restrictionsMemo ?? "",
          remarks: data.meta.remarks ?? "",
        },
        // ここで UI 上の history（削除済み行を含めた状態）をそのまま保存
        history: historyToSave,
        candidate: candidatesToSave,
        sales: salesToSave,
        considering: consideringToSave,
        otherRecords: otherRecordsToSave,
        updated_at: now,
        updated_by: displayName,
        tabUpdates: applyTabUpdateStamps(
          seedMissingTabUpdates(
            parseTabUpdates(raw?.tabUpdates),
            typeof raw?.updated_at === "string" ? raw.updated_at : undefined,
            typeof raw?.updated_by === "string" ? raw.updated_by : undefined
          ),
          dirtyTabs,
          now,
          displayName
        ),
      };

      const relinkTargets = historyToSave.flatMap((h: any) => {
        const projectUuid =
          typeof h?.projectuuid === "string" ? h.projectuuid : null;
        const scheduleUuid =
          typeof h?.scheduleuuid === "string" ? h.scheduleuuid : null;
        return projectUuid && scheduleUuid
          ? [{ projectUuid, scheduleUuid }]
          : [];
      });
      const relinkOk = await moveScheduleAreaRefsToArea({
        areaUuid,
        areaName: newTitle,
        targets: relinkTargets,
      });
      if (!relinkOk) {
        window.alert(
          "案件のエリア付け替えに失敗したため、保存を中止しました。しばらく時間をおいて、もう一度お試しください。"
        );
        return;
      }

      // （2-3）areas/<areaUuid>/index.json を保存
      const okInfo = await saveAreaInfo(areaUuid!, infoToSave);
      if (!okInfo) {
        window.alert(
          systemError(
            E001_PROJECT_INDEX,
            `プロジェクト一覧の保存に失敗${areaName ? `（area_name: ${areaName}）` : ""}`
          )
        );
        return;
      }

      setKindCache((prev) => ({
        ...prev,
        [areaUuid!]: getAreaKindFlags(infoToSave),
      }));

      /** 紐づけ解除：エリア参照だけ外す。飛行エリア図は案件側に残す。 */
      for (const { projectUuid, scheduleUuid } of removedPairs) {
        try {
          const okArea = await clearScheduleAreaRef({
            projectUuid,
            scheduleUuid,
          });
          if (!okArea) {
            console.warn(
              "[save] clearScheduleAreaRef failed for removed link",
              projectUuid,
              scheduleUuid
            );
          }
        } catch (e) {
          console.error(
            "[save] clear schedule artifacts threw error for removed link",
            {
              projectUuid,
              scheduleUuid,
              e,
            }
          );
        }
      }

      // （2-4）areas.json エリア一覧を更新
      // まず MapView 側から「現在の代表座標」をもらう（失敗したら従来どおり points から）
      let repPoint: Point | null = null;
      try {
        repPoint = await requestCurrentPoint();
        console.debug("[save] currentPoint from map:", repPoint);
      } catch (e) {
        console.warn(
          "[save] requestCurrentPoint failed, fallback to points[]",
          e
        );
      }

      const posFromPoints = points.find((p) => p.areaUuid === areaUuid);

      const latToSave = repPoint?.lat ?? posFromPoints?.lat;
      const lonToSave = repPoint?.lng ?? posFromPoints?.lng;

      let okAreas = false;
      try {
        okAreas = await upsertAreasListEntryFromInfo({
          uuid: areaUuid,
          areaName: data.title,
          lat: latToSave,
          lon: lonToSave,
          projectCount: infoToSave.history.length,
        });

        if (!okAreas) {
          window.alert(
            systemError(
              E002_AREAS_LIST,
              `エリア一覧の保存に失敗${areaName ? `（area_name: ${areaName}）` : ""}`
            )
          );
          // areas/<areaUuid>/index.json は保存済みなので続行可能
        } else {
          window.dispatchEvent(new Event("areas:reload"));
        }
      } catch (e) {
        console.error("[save] upsertAreasListEntryFromInfo failed", e);
        window.alert(FETCH_AREAS_LIST_ERROR_MSG);
      }

      let otherRecordsForMeta = Array.isArray(infoToSave.otherRecords)
        ? infoToSave.otherRecords
        : [];

      type FigureSaveResult = "n/a" | "ok" | "skipped" | "failed";
      let figureSave: FigureSaveResult = "n/a";

      const ownPayload =
        geomPayload?.projectUuid && geomPayload.scheduleUuid
          ? geomPayload
          : null;
      const ownOk = await applyOwnFlightFiguresFromHistory(
        uiHistory,
        ownPayload
      );

      if (geomFetchFailed) {
        figureSave = "skipped";
      } else if (ownPayload) {
        figureSave = canMergeOwnGeometry(uiHistory, ownPayload)
          ? ownOk
            ? "ok"
            : "failed"
          : "skipped";
      } else if (geomPayload && (geomPayload.geometry || geomPayload.deleted)) {
          const origOtherRecordIdx = currentOtherRecordIndexRef.current;
          const otherFigureIdx = currentOtherFigureIndexRef.current;
          const savedOtherRecords = Array.isArray(infoToSave.otherRecords)
            ? infoToSave.otherRecords
            : [];
          const otherRecordIdx =
            typeof origOtherRecordIdx === "number" &&
            origOtherRecordIdx >= 0 &&
            origOtherRecordIdx < sourceOtherRecords.length &&
            !isEmptyOtherRecord(sourceOtherRecords[origOtherRecordIdx])
              ? sourceOtherRecords
                  .slice(0, origOtherRecordIdx)
                  .filter((record) => !isEmptyOtherRecord(record))
                  .length
              : null;
          const otherFigureCount =
            typeof otherRecordIdx === "number" &&
            otherRecordIdx >= 0 &&
            otherRecordIdx < savedOtherRecords.length
              ? savedOtherRecords[otherRecordIdx].figures?.length ?? 0
              : 0;

          if (
            typeof otherRecordIdx === "number" &&
            typeof otherFigureIdx === "number" &&
            otherRecordIdx >= 0 &&
            otherRecordIdx < savedOtherRecords.length &&
            otherFigureIdx >= 0 &&
            otherFigureIdx < otherFigureCount
          ) {
            const otherResult = await applyOtherFigureGeometryFromPayload({
              payload: geomPayload,
              areaUuidToUse: currentAreaUuidRef.current ?? areaUuid,
              recordIndex: otherRecordIdx,
              figureIndex: otherFigureIdx,
              figureTitle: currentCandidateTitleRef.current,
              activeAreaName: activeKey,
            });
            if (otherResult.records) {
              otherRecordsForMeta = otherResult.records;
            }
            figureSave =
              otherResult.writeOk == null
                ? "skipped"
                : otherResult.writeOk
                  ? "ok"
                  : "failed";
          } else {
            const savedSalesCount = Array.isArray(infoToSave.sales)
              ? infoToSave.sales.length
              : 0;
            const salesIdx = currentSalesIndexRef.current;
            if (
              typeof salesIdx === "number" &&
              salesIdx >= 0 &&
              salesIdx < savedSalesCount
            ) {
              const salesResult = await applySalesGeometryFromPayload({
                payload: geomPayload,
                areaUuidToUse: currentAreaUuidRef.current ?? areaUuid,
                salesIndex: salesIdx,
                figureTitle:
                  (typeof salesToSave[salesIdx]?.title === "string"
                    ? salesToSave[salesIdx].title.trim()
                    : "") || currentCandidateTitleRef.current,
                activeAreaName: activeKey,
              });
              figureSave =
                salesResult.writeOk == null
                  ? "skipped"
                  : salesResult.writeOk
                    ? "ok"
                    : "failed";
            } else {
            // （3-3）候補エリアの geometry を保存 or 削除
            // 候補リストから削除済みの index に対してはスキップ（上書きで削除が復活するのを防ぐ）
            const savedCandidateCount = Array.isArray(infoToSave.candidate)
              ? infoToSave.candidate.length
              : 0;
            const candIdx = currentCandidateIndexRef.current;
            if (
              typeof candIdx === "number" &&
              candIdx >= 0 &&
              candIdx < savedCandidateCount
            ) {
              const candResult = await applyCandidateGeometryFromPayload({
                payload: geomPayload,
                areaUuidToUse: currentAreaUuidRef.current ?? areaUuid,
                candidateIndex: candIdx,
                candidateTitle: currentCandidateTitleRef.current,
                activeAreaName: activeKey,
              });
              figureSave =
                candResult.writeOk == null
                  ? "skipped"
                  : candResult.writeOk
                    ? "ok"
                    : "failed";
            } else {
              figureSave = "skipped";
              if (import.meta.env.DEV && (geomPayload.geometry || geomPayload.deleted)) {
              console.debug(
                "[save] skip applyCandidateGeometryFromPayload: candidateIndex",
                candIdx,
                "out of range for saved list length",
                savedCandidateCount
              );
              }
            }
            }
          }
      }

      // （4）画面に即時反映（従来どおり）
      setDetailBarTitle(newTitle);
      setDetailBarMeta({
        overview: infoToSave.overview?.overview ?? "",
        address: infoToSave.overview?.address ?? "",
        companyName: infoToSave.overview?.companyName ?? "",
        administrator: infoToSave.overview?.administrator ?? "",
        contact: infoToSave.overview?.contact ?? "",
        manager: infoToSave.overview?.manager ?? "",
        prefecture: infoToSave.overview?.prefecture ?? "",
        droneRecord: Number(infoToSave.overview?.droneRecord ?? 0),
        aircraftCount: String(infoToSave.overview?.droneCountEstimate ?? ""),
        altitudeLimit: String(infoToSave.overview?.heightLimitM ?? ""),
        availability: infoToSave.overview?.availability ?? "",
        statusMemo: infoToSave.details?.statusMemo ?? "",
        permitMemo: infoToSave.details?.permitMemo ?? "",
        restrictionsMemo: infoToSave.details?.restrictionsMemo ?? "",
        remarks: infoToSave.details?.remarks ?? "",
        considering: consideringToSave,
        sales: salesToSave,
        otherRecords: otherRecordsForMeta,
        updated_at: infoToSave.updated_at,
        updated_by: infoToSave.updated_by,
        tabUpdates: infoToSave.tabUpdates,
      });

      // 案件履歴も再取得して詳細バーに反映
      try {
        const refreshedHistory = await buildAreaHistoryFromProjects(areaUuid);
        setDetailBarHistory(refreshedHistory, { preserveSelection: true });
        ownFiguresBaselineRef.current = areaOwnFiguresSnapshot(refreshedHistory);
      } catch (e) {
        ownFiguresBaselineRef.current = areaOwnFiguresSnapshot(uiHistory);
        console.warn("[save] refresh history failed:", e);
      }

      // この保存で消化したので保留リンクはクリア
      pendingProjectLinkRef.current = null;

      const figureFailed =
        figureSave === "skipped" || figureSave === "failed";

      // Undo/Redo 履歴は図の書き込みに成功したときだけクリアする
      if (okAreas && !figureFailed) {
        window.dispatchEvent(new Event(EV_GEOMETRY_SAVE_COMPLETE));
      }

      window.alert(okAreas && !figureFailed ? "保存しました" : SAVE_TIMEOUT);
    };

    const hasDeletedAreas = deletedAreas.size > 0;

    // --- ① 編集対象も削除対象もない場合はエラー ---
    if (!activeKey && !hasDeletedAreas) {
      saveWithoutTarget();
      return;
    }

    setIsSaving(true);
    try {
      if (!activeKey && hasDeletedAreas) {
        await saveDeletedAreasOnly();
        return;
      }
      await saveEditedArea();
    } catch (e) {
      console.error("[save] 保存処理中にエラー:", e);
      window.alert(
        systemError(E003_SAVE_PROCESS, "保存処理中にエラー")
      );
    } finally {
      setIsSaving(false);
    }
  };

  useSidebarExternalEvents({
    points,
    schedulesLite,
    areaLabelOverrides,
    isOn,
    salesFilterOpen,
    normArea,
    loadAndShowInfoForArea,
    requestDetailbarData,
    setActiveKey,
    setIsAddAreaMode,
    setSalesFilterOpen,
    currentAreaUuidRef,
    currentAreaNameRef,
    currentCandidateIndexRef,
    currentSalesIndexRef,
    currentCandidateTitleRef,
    currentOtherRecordIndexRef,
    currentOtherFigureIndexRef,
    pendingProjectLinkRef,
    salesFilterRef,
  });

  // 表示する areaGroups をフィルタ・ソートする
  const visibleAreaGroups = useMemo(
    () =>
      selectVisibleAreaGroups({
        areaGroups,
        searchQuery,
        axisFilter,
        points,
        kindCache,
        areaLabelOverrides,
        prefectureCache,
        updatedAtCache,
        droneCountCache,
        sortType,
        sortDir,
      }),
    [areaGroups, searchQuery, areaLabelOverrides, points, prefectureCache, updatedAtCache, kindCache, droneCountCache, sortType, sortDir, axisFilter]
  );

  // フィルタ結果を地図に通知（未分類は地図に出さない）
  useEffect(() => {
    const visibleAreaNames = visibleAreaGroups.flatMap(({ area, indices }) => {
      const firstPoint = points[indices[0]];
      const flags = firstPoint?.areaUuid
        ? kindCache[firstPoint.areaUuid]
        : undefined;
      return isAreaClassified(flags) ? [area] : [];
    });
    window.dispatchEvent(
      new CustomEvent(EV_SIDEBAR_VISIBLE_AREAS, {
        detail: { visibleAreaNames },
      })
    );
  }, [visibleAreaGroups, points, kindCache]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(EV_SIDEBAR_AREA_KINDS, {
        detail: { kinds: kindCache },
      })
    );
  }, [kindCache]);

  // 都道府県順ソート時にグループ化する
  const groupedByPrefecture = useMemo(
    () =>
      groupAreasByPrefecture({
        visibleAreaGroups,
        sortType,
        sortDir,
        points,
        prefectureCache,
      }),
    [visibleAreaGroups, sortType, sortDir, points, prefectureCache]
  );

  // 更新日順ソート時にグループ化する
  const groupedByUpdatedAt = useMemo(
    () =>
      groupAreasByUpdatedAt({
        visibleAreaGroups,
        sortType,
        sortDir,
        points,
        updatedAtCache,
      }),
    [visibleAreaGroups, sortType, sortDir, points, updatedAtCache]
  );

  // 機体数順ソート時にグループ化する
  const groupedByDroneCount = useMemo(
    () =>
      groupAreasByDroneCount({
        visibleAreaGroups,
        sortType,
        sortDir,
        points,
        droneCountCache,
      }),
    [visibleAreaGroups, sortType, sortDir, points, droneCountCache]
  );

  // エリアアイテムのコンテンツをレンダリングする関数（グループ化時と通常時で共通）
  const renderAreaItemContent = (area: string, indices: number[]) => {
    const displayLabel = areaLabelOverrides[area] ?? area;

    if (editingAreaKey === area) {
      return (
        <input
          ref={editingInputRef}
          type="text"
          value={editingTempName}
          onChange={(e) => setEditingTempName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onBlur={commitEditAreaName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEditAreaName();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEditAreaName();
            }
          }}
        />
      );
    }

    return (
      <>
        {(() => {
          const firstPoint = points[indices[0]];
          const flags = firstPoint?.areaUuid
            ? kindCache[firstPoint.areaUuid]
            : undefined;
          const kinds = areaKindFlagList(flags);
          if (kinds.length === 0) return null;
          return (
            <span
              className="area-kind-dots"
              aria-label={kinds.map((kind) => AREA_KIND_LABEL[kind]).join("、")}
            >
              {kinds.map((kind) => (
                <span
                  key={kind}
                  className={`area-kind-dot area-kind-dot--${kind}`}
                  aria-hidden="true"
                />
              ))}
            </span>
          );
        })()}
        <span className="location-label">
          {displayLabel}
          {indices.length > 1 ? `（${indices.length}）` : null}
        </span>

        {isOn && (
          <span
            className="location-delete"
            onClick={(e) => e.stopPropagation()}
          >
            <DeleteIconButton
              title="このエリアを削除"
              tabIndex={0}
              onClick={async () => {
                const areaUuid = getAreaUuidByAreaName(area);
                let confirmMsg = `「${displayLabel}」を削除してもよろしいですか？`;

                if (areaUuid) {
                  try {
                    const raw = await fetchRawAreaInfo(areaUuid);
                    const hasHistory =
                      Array.isArray(raw?.history) && raw.history.length > 0;
                    const hasCandidates =
                      Array.isArray(raw?.candidate) && raw.candidate.length > 0;
                    const hasSales =
                      Array.isArray(raw?.sales) && raw.sales.length > 0;
                    const linked: string[] = [];
                    if (hasHistory) linked.push("案件");
                    if (hasCandidates) linked.push("候補図");
                    if (hasSales) linked.push("営業図");
                    if (linked.length > 0) {
                      confirmMsg =
                        `このエリアには${linked.join("と")}が紐づいています。\n` +
                        `削除すると紐づけが解除されます。続行しますか？`;
                    } else {
                      confirmMsg = `「${displayLabel}」を削除してもよろしいですか？`;
                    }
                  } catch {
                    // 取得失敗時も確認は表示する（上記のデフォルトメッセージを使用）
                  }
                }

                const ok = window.confirm(confirmMsg);
                if (!ok) return;

                setDeletedAreas((prev) => {
                  const next = new Set(prev);
                  next.add(area);
                  return next;
                });

                if (activeKey === area) {
                  setActiveKey(null);
                  closeDetailBar();
                }

                window.dispatchEvent(
                  new CustomEvent("sidebar:delete-area", {
                    detail: { areaName: area, areaUuid },
                  })
                );

                window.alert(
                  "エリアを削除しました。\nこの後「SAVE」ボタンを押すまで反映されません。"
                );
              }}
            />
          </span>
        )}
      </>
    );
  };

  // エリアアイテムをレンダリングする関数
  const renderAreaItem = (area: string, indices: number[]) => {
    const isActive = activeKey === area;

    return (
      <li
        key={area}
        data-indices={indices.join(",")}
        data-area={area}
        tabIndex={0}
        className={isActive ? "active" : undefined}
        onClick={(e) => {
          if (editingAreaKey === area) return;
          if (isOn && e.detail === 2) {
            e.preventDefault();
            e.stopPropagation();
            beginEditAreaName(area);
            return;
          }
          activateArea(area);
        }}
        onKeyDown={(e) => {
          if (editingAreaKey === area) {
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEditAreaName();
            }
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateArea(area);
          }
        }}
      >
        {renderAreaItemContent(area, indices)}
      </li>
    );
  };

  return (
    <div id="sidebar" ref={rootRef} role="complementary" aria-label="Sidebar">
      <div className="sidebar-header">
        <LogoButton size={70} />
        <div
          className="toolbar no-caret"
          contentEditable={false}
          onMouseDown={blurActiveInput}
        >
          <div className="toolbar-group">
            {isOn ? (
              <ONButton onClick={() => setIsOn(false)} height={iconH} />
            ) : (
              <OFFButton onClick={() => setIsOn(true)} height={iconH} />
            )}
            {isOn && (
              <SaveButton
                onClick={handleSave}
                height={iconH}
                loading={isSaving}
                title={isSaving ? "保存中…" : "保存"}
                className="active:scale-95 transition-transform"
              />
            )}
          </div>
        </div>
      </div>

      {/* エリア追加ボタン */}
      {isOn && (
        <button
          type="button"
          className="add-area-button add-area-button--sidebar"
          onClick={beginAddAreaMode}
        >
          <span className="add-icon">＋ </span>
          エリアを追加する
        </button>
      )}

      {isOn && isAddAreaMode && (
        <div className="sidebar-add-area-panel">
          {/* ヒント */}
          <div className="sidebar-add-area-hint" aria-live="polite">
            <div className="hint-text">
              追加したいエリアを地図上でクリックしてください。
            </div>
            <button
              type="button"
              className="hint-cancel"
              onClick={() => {
                window.dispatchEvent(new Event("map:cancel-add-area"));
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 通常検索（エリア追加モードでは非表示） */}
      {!isAddAreaMode && (
        <div id="searchWrap" role="search" aria-label="Search markers">
          <div id="searchHint" aria-live="polite" />
          <div className="search-controls">
            <div className="search-control-row">
              <label htmlFor="sortSelect" className="search-sort-filter-label">
                <span className="search-sort-icon" aria-hidden="true">⇅</span>
                並べ替え
              </label>
              <div className="search-sort-fields">
                <div className="search-sort-select-wrap">
                  <select
                    id="sortSelect"
                    value={sortType}
                    onChange={(e) => {
                      const next = e.target.value as AreaSortType;
                      setSortType(next);
                      setSortDir(AREA_SORT_DEFAULT_DIR[next]);
                    }}
                    className="search-sort-select"
                    aria-label="並べ替えの項目を選択"
                  >
                    <option value="updated">更新日</option>
                    <option value="prefecture">都道府県</option>
                    <option value="droneCount">機体数</option>
                    <option value="name">エリア名</option>
                  </select>
                  <span className="search-sort-select-caret" aria-hidden="true">
                    ▼
                  </span>
                </div>
                <button
                  type="button"
                  className="search-sort-dir"
                  aria-label={`現在は${areaSortDirLabel(sortType, sortDir)}。クリックで${areaSortDirLabel(
                    sortType,
                    sortDir === "desc" ? "asc" : "desc"
                  )}`}
                  title={areaSortDirLabel(sortType, sortDir)}
                  onClick={() =>
                    setSortDir((current) => (current === "desc" ? "asc" : "desc"))
                  }
                >
                  {sortDir === "desc" ? "↓" : "↑"}
                </button>
              </div>
            </div>
            <div className="search-control-row search-control-row--filters">
              <span className="search-sort-filter-label">
                <span className="search-sort-icon" aria-hidden="true">
                  <svg
                    className="search-filter-icon"
                    viewBox="0 0 12 12"
                    width="12"
                    height="12"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M1.2 1.5h9.6L7.2 6.3v3.4L4.8 11V6.3L1.2 1.5z"
                    />
                  </svg>
                </span>
                フィルター
              </span>
              <div className="search-kind-options" role="group" aria-label="フィルター">
                {AREA_AXIS_ORDER.map((axis) => (
                  <div
                    key={axis}
                    className={`search-axis-row search-axis-row--${axis}`}
                    role="group"
                    aria-label={AREA_AXIS_LABEL[axis]}
                  >
                    <span className="search-axis-label">
                      <span
                        className={`area-kind-dot area-kind-dot--${axis}`}
                        aria-hidden="true"
                      />
                      {AREA_AXIS_LABEL[axis]}
                    </span>
                    <div className="search-axis-segment">
                      {AREA_AXIS_TOGGLE_ORDER.map((choice) => {
                        const pressed = axisFilter[axis] === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            className="search-axis-chip"
                            aria-pressed={pressed}
                            aria-label={`${AREA_AXIS_LABEL[axis]} ${AREA_AXIS_CHOICE_LABEL[choice]}`}
                            onClick={() => {
                              setAxisFilter((prev) => ({
                                ...prev,
                                [axis]: prev[axis] === choice ? "any" : choice,
                              }));
                            }}
                          >
                            {AREA_AXIS_CHOICE_LABEL[choice]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div
                  className="search-axis-row search-axis-row--considering"
                  role="group"
                  aria-label={SALES_FILTER_LABEL}
                >
                  <span className="search-axis-label">
                    <span
                      className="area-kind-dot area-kind-dot--considering"
                      aria-hidden="true"
                    />
                    {SALES_FILTER_LABEL}
                  </span>
                  <div
                    className="search-axis-multiselect"
                    ref={salesFilterRef}
                  >
                    <button
                      type="button"
                      id="salesStatusFilter"
                      className="search-axis-multiselect-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={salesFilterOpen}
                      aria-label={`${SALES_FILTER_LABEL}のステータス`}
                      onClick={() => setSalesFilterOpen((open) => !open)}
                    >
                      <span className="search-axis-multiselect-value">
                        {salesFilterSummary(axisFilter.sales)}
                      </span>
                      <span className="search-sort-select-caret" aria-hidden="true">
                        ▼
                      </span>
                    </button>
                    {salesFilterOpen && (
                      <div
                        className="search-axis-multiselect-menu"
                        role="listbox"
                        aria-multiselectable="true"
                        aria-label={`${SALES_FILTER_LABEL}のステータス`}
                      >
                        {SALES_STATUS_FILTER_ORDER.map((status) => {
                          const checked = axisFilter.sales.includes(status);
                          return (
                            <label
                              key={status}
                              className="search-axis-multiselect-option"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setAxisFilter((prev) => {
                                    const next = prev.sales.includes(status)
                                      ? prev.sales.filter((s) => s !== status)
                                      : SALES_STATUS_FILTER_ORDER.filter(
                                          (s) =>
                                            s === status ||
                                            prev.sales.includes(s)
                                        );
                                    return { ...prev, sales: next };
                                  });
                                }}
                              />
                              {status}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="search-control-row search-control-row--clear">
              <button
                type="button"
                className="search-clear-button"
                onClick={() => {
                  setSearchQuery("");
                  setSortType("updated");
                  setSortDir(AREA_SORT_DEFAULT_DIR.updated);
                  setAxisFilter(EMPTY_AREA_AXIS_FILTER);
                }}
                aria-label="検索・並べ替え・フィルターをクリア"
              >
                検索条件クリア
              </button>
            </div>
          </div>
          <div className="search-field">
            <label htmlFor="searchBox" className="sr-only">
              エリア名・都道府県名などで既存エリア検索
            </label>
            <input
              id="searchBox"
              type="text"
              placeholder="エリア名・都道府県名などで既存エリア検索"
              autoComplete="off"
              inputMode="search"
              aria-describedby="searchHint"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="search-field__clear"
                aria-label="検索ワードをクリア"
                onClick={() => {
                  setSearchQuery("");
                  document.getElementById("searchBox")?.focus();
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* エリア一覧（エリア追加モードでは非表示） */}
      {!isAddAreaMode && (
        <ul id="locationList" className="no-caret">
          {(() => {
            const filteredGroups = visibleAreaGroups.filter(
              ({ area }) => !deletedAreas.has(area)
            );

            if (filteredGroups.length === 0) {
              return (
                <li className="location-empty" aria-live="polite">
                  該当するエリアはありません
                </li>
              );
            }

            // 都道府県順ソート時はグループ化して表示
            if (groupedByPrefecture) {
              return groupedByPrefecture.map((group) => {
                const filteredAreas = group.areas.filter(
                  ({ area }) => !deletedAreas.has(area)
                );
                if (filteredAreas.length === 0) return null;

                return (
                  <React.Fragment key={group.prefecture}>
                    <li className="location-prefecture-header" aria-label={group.prefecture}>
                      ー{group.prefecture.replace(/[県府都]$/, "")}({filteredAreas.length})
                    </li>
                    {filteredAreas.map(({ area, indices }) => {
                      const isActive = activeKey === area;
                      return (
                        <li
                          key={area}
                          data-indices={indices.join(",")}
                          data-area={area}
                          tabIndex={0}
                          className={isActive ? "active location-item-grouped" : "location-item-grouped"}
                          onClick={(e) => {
                            if (editingAreaKey === area) return;
                            if (isOn && e.detail === 2) {
                              e.preventDefault();
                              e.stopPropagation();
                              beginEditAreaName(area);
                              return;
                            }
                            activateArea(area);
                          }}
                          onKeyDown={(e) => {
                            if (editingAreaKey === area) {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditAreaName();
                              }
                              return;
                            }
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              activateArea(area);
                            }
                          }}
                        >
                          {renderAreaItemContent(area, indices)}
                        </li>
                      );
                    })}
                  </React.Fragment>
                );
              });
            }

            // 更新日順ソート時はグループ化して表示
            if (groupedByUpdatedAt) {
              return groupedByUpdatedAt.map((group) => {
                const filteredAreas = group.areas.filter(
                  ({ area }) => !deletedAreas.has(area)
                );
                if (filteredAreas.length === 0) return null;

                return (
                  <React.Fragment key={group.groupLabel}>
                    <li className="location-prefecture-header" aria-label={group.groupLabel}>
                      -  {group.groupLabel}
                    </li>
                    {filteredAreas.map(({ area, indices }) => {
                      const isActive = activeKey === area;
                      return (
                        <li
                          key={area}
                          data-indices={indices.join(",")}
                          data-area={area}
                          tabIndex={0}
                          className={isActive ? "active location-item-grouped" : "location-item-grouped"}
                          onClick={(e) => {
                            if (editingAreaKey === area) return;
                            if (isOn && e.detail === 2) {
                              e.preventDefault();
                              e.stopPropagation();
                              beginEditAreaName(area);
                              return;
                            }
                            activateArea(area);
                          }}
                          onKeyDown={(e) => {
                            if (editingAreaKey === area) {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditAreaName();
                              }
                              return;
                            }
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              activateArea(area);
                            }
                          }}
                        >
                          {renderAreaItemContent(area, indices)}
                        </li>
                      );
                    })}
                  </React.Fragment>
                );
              });
            }

            // 機体数順ソート時はグループ化して表示
            if (groupedByDroneCount) {
              return groupedByDroneCount.map((group) => {
                const filteredAreas = group.areas.filter(
                  ({ area }) => !deletedAreas.has(area)
                );
                if (filteredAreas.length === 0) return null;

                return (
                  <React.Fragment key={group.groupLabel}>
                    <li className="location-prefecture-header" aria-label={group.groupLabel}>
                      -  {group.groupLabel}
                    </li>
                    {filteredAreas.map(({ area, indices }) => {
                      const isActive = activeKey === area;
                      return (
                        <li
                          key={area}
                          data-indices={indices.join(",")}
                          data-area={area}
                          tabIndex={0}
                          className={isActive ? "active location-item-grouped" : "location-item-grouped"}
                          onClick={(e) => {
                            if (editingAreaKey === area) return;
                            if (isOn && e.detail === 2) {
                              e.preventDefault();
                              e.stopPropagation();
                              beginEditAreaName(area);
                              return;
                            }
                            activateArea(area);
                          }}
                          onKeyDown={(e) => {
                            if (editingAreaKey === area) {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditAreaName();
                              }
                              return;
                            }
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              activateArea(area);
                            }
                          }}
                        >
                          {renderAreaItemContent(area, indices)}
                        </li>
                      );
                    })}
                  </React.Fragment>
                );
              });
            }

            // それ以外は通常通り表示
            return filteredGroups.map(({ area, indices }) => {
              return renderAreaItem(area, indices);
            });
          })()}
        </ul>
      )}
    </div>
  );
}

const SideListBar = memo(SideListBarBase);
export default SideListBar;
