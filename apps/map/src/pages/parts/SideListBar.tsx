// apps/map/src/pages/parts/SideListBar.tsx
import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  ONButton,
  OFFButton,
  SaveButton,
  LogoButton,
  blurActiveInput,
} from "@/components";
import {
  openDetailBar,
  setDetailBarTitle,
  setDetailBarHistory,
  setDetailBarMeta,
  closeDetailBar,
} from "./SideDetailBar";
import {
  fetchAreaInfo,
  fetchRawAreaInfo,
  buildAreaHistoryFromProjects,
} from "./areasApi";
import {
  EMPTY_AREA_AXIS_FILTER,
  isAreaClassified,
  areaOwnFiguresSnapshot,
  type AreaAxisFilter,
} from "./detailBar/helpers";
import type {
  ScheduleLite,
  Point,
  GeometryPayload,
  HistoryItem,
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
} from "./constants/events";

import type { AreaSortDir, AreaSortType } from "./sideListSort";
import {
  AREA_SORT_DEFAULT_DIR,
  groupAreasByDroneCount,
  groupAreasByPrefecture,
  groupAreasByUpdatedAt,
  selectVisibleAreaGroups,
} from "./sideListSort";
import { useAreaListMetadata } from "./useAreaListMetadata";
import { useSidebarExternalEvents } from "./useSidebarExternalEvents";
import { runSideListSave } from "./saveSideList";
import { AreaList } from "./AreaList";
import { SideListSearch } from "./SideListSearch";

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
  const handleSave = () =>
    runSideListSave({
      deletedAreas,
      getAreaUuidByAreaName,
      activeKey,
      currentAreaUuidRef,
      currentCandidateIndexRef,
      currentSalesIndexRef,
      currentCandidateTitleRef,
      currentOtherRecordIndexRef,
      currentOtherFigureIndexRef,
      ownFiguresBaselineRef,
      pendingProjectLinkRef,
      requestGeometryPayload,
      requestCurrentPoint,
      setKindCache,
      points,
      setIsSaving,
    });


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

  const confirmAndMarkAreaDeleted = async (
    area: string,
    displayLabel: string
  ) => {
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
        <SideListSearch
          sortType={sortType}
          sortDir={sortDir}
          setSortType={setSortType}
          setSortDir={setSortDir}
          axisFilter={axisFilter}
          setAxisFilter={setAxisFilter}
          salesFilterOpen={salesFilterOpen}
          setSalesFilterOpen={setSalesFilterOpen}
          salesFilterRef={salesFilterRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* エリア一覧（エリア追加モードでは非表示） */}
      {!isAddAreaMode && (
        <AreaList
          visibleAreaGroups={visibleAreaGroups}
          deletedAreas={deletedAreas}
          groupedByPrefecture={groupedByPrefecture}
          groupedByUpdatedAt={groupedByUpdatedAt}
          groupedByDroneCount={groupedByDroneCount}
          activeKey={activeKey}
          isOn={isOn}
          areaLabelOverrides={areaLabelOverrides}
          editingAreaKey={editingAreaKey}
          editingTempName={editingTempName}
          editingInputRef={editingInputRef}
          points={points}
          kindCache={kindCache}
          onActivate={activateArea}
          onBeginEdit={beginEditAreaName}
          onCommitEdit={commitEditAreaName}
          onCancelEdit={cancelEditAreaName}
          onEditingTempName={setEditingTempName}
          onDelete={confirmAndMarkAreaDeleted}
        />
      )}
    </div>
  );
}

const SideListBar = memo(SideListBarBase);
export default SideListBar;
