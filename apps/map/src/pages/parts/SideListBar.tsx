// apps/map/src/pages/parts/SideListBar.tsx
import React, { memo, useEffect, useRef, useState, useMemo } from "react";
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
import {
  fetchAreaInfo,
  fetchRawAreaInfo,
  saveAreaInfo,
  buildAreaHistoryFromProjects,
  clearAreaCandidateGeometryAtIndex,
  upsertAreaCandidateAtIndex,
  upsertScheduleGeometry,
  clearScheduleGeometry,
  isAreaNameDuplicated,
  upsertAreasListEntryFromInfo,
  fetchProjectIndex,
  upsertScheduleAreaRef,
  clearScheduleAreaRef,
} from "./areasApi";
import { PREFECTURES } from "./constants/events";
import type {
  ScheduleLite,
  Point,
  GeometryPayload,
  HistoryItem,
} from "@/features/types";
import {
  AREA_NAME_NONE,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_GEOMETRY_REQUEST_DATA,
  EV_SIDEBAR_SET_ACTIVE,
  EV_SIDEBAR_VISIBLE_AREAS,
  EV_DETAILBAR_RESPOND_DATA,
  EV_MAP_FOCUS_ONLY,
  EV_GEOMETRY_RESPOND_DATA,
  EV_PROJECT_MODAL_SUBMIT,
  EV_DETAILBAR_REQUEST_DATA,
  ADD_AREA_EMPTY_MESSAGE,
  ADD_AREA_ERROR_MESSAGE,
  EV_ADD_AREA_SELECT_RESULT,
  EV_ADD_AREA_RESULT_COORDS,
} from "./constants/events";

type AddAreaSearchStatus = "idle" | "ok" | "empty" | "error";
type AddAreaSearchResult = {
  placeId: string;
  label: string;
};

type AddAreaSearchEventDetail = {
  status?: "ok" | "empty" | "error";
  results?: AddAreaSearchResult[];
  message?: string | null;
};

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

  // 現在の保存コンテキスト（エリア／候補）
  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);

  // エリア追加モードの状態
  const [isAddAreaMode, setIsAddAreaMode] = useState(false);
  // エリア追加モード時の検索クエリ
  const [addAreaSearchQuery, setAddAreaSearchQuery] = useState("");
  // エリア追加モード時の検索結果
  const [addAreaSearchResults, setAddAreaSearchResults] = useState<
    AddAreaSearchResult[]
  >([]);
  const [addAreaSearchStatus, setAddAreaSearchStatus] =
    useState<AddAreaSearchStatus>("idle");
  const [addAreaSearchMessage, setAddAreaSearchMessage] = useState<
    string | null
  >(null);
  // 検索クエリ state
  const [searchQuery, setSearchQuery] = useState("");
  // ソート種類 state
  const [sortType, setSortType] = useState<"name" | "prefecture" | "updated">("prefecture");
  // フィルター条件 state
  const [filterType, setFilterType] = useState<
    "all" | "droneRecord" | "candidate"
  >("all");
  // 都道府県情報のキャッシュ（areaUuid -> prefecture）
  const [prefectureCache, setPrefectureCache] = useState<Record<string, string>>({});
  // 更新日情報のキャッシュ（areaUuid -> updated_at）
  const [updatedAtCache, setUpdatedAtCache] = useState<Record<string, string>>({});
  // ドローン実績のキャッシュ（areaUuid -> 0|1）
  const [droneRecordCache, setDroneRecordCache] = useState<Record<string, number>>({});
  
  // エリア一覧が変更されたときに都道府県情報・更新日情報・ドローン実績を取得してキャッシュ
  useEffect(() => {
    const loadAreaMetadata = async () => {
      const prefectureCache: Record<string, string> = {};
      const updatedAtCache: Record<string, string> = {};
      const droneRecordCache: Record<string, number> = {};
      const uniqueAreaUuids = new Set(
        points.map((p) => p.areaUuid).filter((uuid): uuid is string => !!uuid)
      );
      
      // 並列で都道府県情報・更新日情報・ドローン実績を取得
      await Promise.all(
        Array.from(uniqueAreaUuids).map(async (areaUuid) => {
          try {
            const raw = await fetchRawAreaInfo(areaUuid);
            const prefecture = typeof raw?.overview?.prefecture === "string" 
              ? raw.overview.prefecture 
              : "";
            if (prefecture) {
              prefectureCache[areaUuid] = prefecture;
            }
            const updatedAt = typeof raw?.updated_at === "string" 
              ? raw.updated_at 
              : "";
            if (updatedAt) {
              updatedAtCache[areaUuid] = updatedAt;
            }
            const v = raw?.overview?.droneRecord;
            const droneRecord = v === 1 || v === "1" || v === "あり" ? 1 : 0;
            droneRecordCache[areaUuid] = droneRecord;
          } catch (e) {
            // エラーは無視（都道府県情報や更新日情報がないエリアもある）
          }
        })
      );
      
      setPrefectureCache(prefectureCache);
      setUpdatedAtCache(updatedAtCache);
      setDroneRecordCache(droneRecordCache);
    };
    
    if (points.length > 0) {
      loadAreaMetadata();
    }
  }, [points]);
  
  // エリア追加モード時の検索を送信
  const submitAddAreaSearch = () => {
    const q = addAreaSearchQuery.trim();
    if (!q) return;

    window.dispatchEvent(
      new CustomEvent("map:search-add-area", {
        detail: { query: q },
      })
    );
  };

  // placeId から座標を取得（MapView に問い合わせ）
  const requestPlaceCoords = async (
    placeId: string
  ): Promise<{ lat: number; lng: number } | null> => {
    const coords = await new Promise<{ lat: number; lng: number } | null>(
      (resolve, reject) => {
        let timer: number | null = null;

        const onResp = (e: Event) => {
          const d =
            (
              e as CustomEvent<{
                placeId?: string;
                lat?: number;
                lng?: number;
              }>
            ).detail || {};

          // 別リクエストの応答を拾わない
          if (d.placeId !== placeId) return;

          window.removeEventListener(
            EV_ADD_AREA_RESULT_COORDS,
            onResp as EventListener
          );
          if (timer != null) window.clearTimeout(timer);

          if (typeof d.lat === "number" && typeof d.lng === "number") {
            resolve({ lat: d.lat, lng: d.lng });
          } else {
            resolve(null);
          }
        };

        window.addEventListener(
          EV_ADD_AREA_RESULT_COORDS,
          onResp as EventListener
        );

        window.dispatchEvent(
          new CustomEvent(EV_ADD_AREA_SELECT_RESULT, { detail: { placeId } })
        );

        timer = window.setTimeout(() => {
          window.removeEventListener(
            EV_ADD_AREA_RESULT_COORDS,
            onResp as EventListener
          );
          reject(new Error("map からの座標応答がありません"));
        }, 1500);
      }
    );

    return coords;
  };

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

  // projects/<projectUuid>/index.json
  // 案件に紐づく geometry を保存 or 削除
  const applyProjectGeometryFromPayload = async (
    payload: GeometryPayload
  ): Promise<void> => {
    const { projectUuid, scheduleUuid, geometry, deleted } = payload;
    if (!projectUuid || !scheduleUuid) return;

    if (deleted === true) {
      const okGeomDel = await clearScheduleGeometry({
        projectUuid,
        scheduleUuid,
      });
      if (!okGeomDel) console.warn("[save] geometry delete failed");
    } else if (geometry) {
      const okGeomSave = await upsertScheduleGeometry({
        projectUuid,
        scheduleUuid,
        geometry,
      });
      if (!okGeomSave) console.warn("[save] geometry save failed");
    } else {
      if (import.meta.env.DEV)
        console.debug("[save] geometry payload not available — skipped");
    }
  };

  // areas/<areaUuid>/index.json
  // 候補エリアの geometry を保存 or 削除
  const applyCandidateGeometryFromPayload = async (params: {
    payload: GeometryPayload;
    areaUuidToUse?: string;
    candidateIndex: number | null;
    candidateTitle?: string;
    activeAreaName: string | null;
  }): Promise<void> => {
    const {
      payload,
      areaUuidToUse,
      candidateIndex,
      candidateTitle,
      activeAreaName,
    } = params;
    const { geometry, deleted } = payload;

    const idx = candidateIndex;
    if (!areaUuidToUse || typeof idx !== "number" || idx < 0) {
      console.warn(
        "[save] candidate context missing (areaUuid/index). Skipped."
      );
      return;
    }

    if (deleted === true) {
      const okDel = await clearAreaCandidateGeometryAtIndex({
        areaUuid: areaUuidToUse,
        index: idx,
      });
      if (!okDel) console.warn("[save] candidate geometry delete failed");
    } else if (geometry) {
      const g = geometry;
      const okCand = await upsertAreaCandidateAtIndex({
        areaUuid: areaUuidToUse,
        index: idx,
        candidate: {
          title: candidateTitle,
          flightAltitude_min_m: g.flightAltitude_min_m,
          flightAltitude_Max_m: g.flightAltitude_Max_m,
          takeoffArea: g.takeoffArea,
          flightArea: g.flightArea,
          safetyArea: g.safetyArea,
          audienceArea: g.audienceArea,
        },
        preserveTitle: true,
      });
      if (!okCand) console.warn("[save] candidate geometry save failed");
    }

    // 保存後、candidate の更新を UI へ反映
    try {
      if (!areaUuidToUse) return;
      const { meta: refreshedMeta } = await fetchAreaInfo(
        areaUuidToUse,
        activeAreaName || ""
      );
      setDetailBarMeta(refreshedMeta);
    } catch (e) {
      console.warn("[save] refresh candidate meta failed:", e);
    }
  };

  // 保存
  const handleSave = async () => {
    try {
      const hasDeletedAreas = deletedAreas.size > 0;

      // --- ① 編集対象も削除対象もない場合はエラー ---
      if (!activeKey && !hasDeletedAreas) {
        window.alert("保存対象のエリアを選択してください。");
        return;
      }

      // --- ② 「削除だけ保存する」パス（どのエリアも選択していない）---
      if (!activeKey && hasDeletedAreas) {
        window.alert(
          "削除は画面上のみ反映されています。\nS3 への削除反映は今後の対応になります。"
        );
        return;
      }

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
        window.alert("このエリアには areaUuid がありません。保存できません。");
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

      // （2-2）画面入力値からareas/<areaUuid>/index.json 形式
      const infoToSave = {
        ...(typeof raw === "object" && raw ? raw : {}),
        overview: {
          ...(raw?.overview ?? {}),
          address: data.meta.address ?? "",
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
        candidate: Array.isArray(data.meta.candidate)
          ? data.meta.candidate
          : Array.isArray(raw?.candidate)
          ? raw.candidate
          : [],
        updated_at: new Date().toISOString(),
        updated_by: "ui",
      };

      // （2-3）areas/<areaUuid>/index.json を保存
      const okInfo = await saveAreaInfo(areaUuid!, infoToSave);
      if (!okInfo) {
        window.alert(
          "保存に失敗しました（index.json）。ブラウザの開発者ツール（F12）のコンソールでエラー内容を確認してください。"
        );
        return;
      }

      /** 紐づけ解除されたスケジュールの geometry を削除 + area参照も解除 */
      for (const { projectUuid, scheduleUuid } of removedPairs) {
        try {
          const okGeom = await clearScheduleGeometry({
            projectUuid,
            scheduleUuid,
          });
          if (!okGeom) {
            console.warn(
              "[save] clearScheduleGeometry failed for removed link",
              projectUuid,
              scheduleUuid
            );
          }

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

      // （2-3.5）projects/<projectUuid>/index.json に area_uuid / area_name を反映
      // UI 上の紐づけ履歴（historyToSave）を正として、各 schedule の area を更新する
      try {
        const areaNameToWrite = newTitle; // 保存後のエリア名で統一

        // historyToSave は { projectuuid, scheduleuuid } 形式なのでそれを使う
        const targets = historyToSave.flatMap((h: any) => {
          const projectUuid =
            typeof h?.projectuuid === "string" ? h.projectuuid : null;
          const scheduleUuid =
            typeof h?.scheduleuuid === "string" ? h.scheduleuuid : null;
          return projectUuid && scheduleUuid
            ? [{ projectUuid, scheduleUuid }]
            : [];
        });

        await Promise.all(
          targets.map(({ projectUuid, scheduleUuid }) =>
            upsertScheduleAreaRef({
              projectUuid,
              scheduleUuid,
              areaUuid,
              areaName: areaNameToWrite,
            })
          )
        );
      } catch (e) {
        console.warn("[save] project schedule area ref update failed:", e);
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

      const okAreas = await upsertAreasListEntryFromInfo({
        uuid: areaUuid,
        areaName: data.title,
        lat: latToSave,
        lon: lonToSave,
        projectCount: infoToSave.history.length,
      });

      if (!okAreas) {
        window.alert(
          "保存に失敗しました（areas.json）。ブラウザの開発者ツール（F12）のコンソールでエラー内容を確認してください。"
        );
        // areas/<areaUuid>/index.json は保存済みなので続行可能
      } else {
        window.dispatchEvent(new Event("areas:reload"));
      }

      // （3-1）MapGeometry から現在編集中の geometry 情報（payload）を取得
      let geomPayload: GeometryPayload | null = null;
      try {
        geomPayload = await requestGeometryPayload();
        console.log("[SideListBar] geomPayload on save:", geomPayload);
      } catch (e) {
        console.warn("[save] geometry payload fetch skipped:", e);
      }

      if (geomPayload) {
        if (geomPayload.projectUuid && geomPayload.scheduleUuid) {
          // （3-2）案件に紐づく geometry を保存 or 削除
          await applyProjectGeometryFromPayload(geomPayload);
        } else if (geomPayload.geometry || geomPayload.deleted) {
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
            await applyCandidateGeometryFromPayload({
              payload: geomPayload,
              areaUuidToUse: currentAreaUuidRef.current ?? areaUuid,
              candidateIndex: candIdx,
              candidateTitle: currentCandidateTitleRef.current,
              activeAreaName: activeKey,
            });
          } else if (import.meta.env.DEV && (geomPayload.geometry || geomPayload.deleted)) {
            console.debug(
              "[save] skip applyCandidateGeometryFromPayload: candidateIndex",
              candIdx,
              "out of range for saved list length",
              savedCandidateCount
            );
          }
        }
      }

      // （4）画面に即時反映（従来どおり）
      setDetailBarTitle(newTitle);
      setDetailBarMeta({
        overview: infoToSave.overview?.overview ?? "",
        address: infoToSave.overview?.address ?? "",
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
      });

      // 案件履歴も再取得して詳細バーに反映
      try {
        const refreshedHistory = await buildAreaHistoryFromProjects(areaUuid);
        setDetailBarHistory(refreshedHistory);
      } catch (e) {
        console.warn("[save] refresh history failed:", e);
      }

      // この保存で消化したので保留リンクはクリア
      pendingProjectLinkRef.current = null;

      // （5）従来メッセージを維持（UIのデグレ回避）
      window.alert(okAreas ? "保存しました" : "保存に失敗しました。");
    } catch (e) {
      console.error("[save] 保存処理中にエラー:", e);
      window.alert(
        "保存処理中にエラーが発生しました。ブラウザの開発者ツール（F12）のコンソールで詳細を確認してください。"
      );
    }
  };

  // 外部イベントでアクティブ切替
  useEffect(() => {
    const onSetActive = (e: Event) => {
      const ce = e as CustomEvent<{
        areaName?: string;
        name?: string;
        lat?: number;
        lng?: number;
      }>;
      const d = ce.detail || {};
      const idx = points.findIndex((p) => {
        const area = normArea(p);
        return (
          (d.areaName && area === d.areaName) ||
          (d.name && p.name === d.name) ||
          (typeof d.lat === "number" &&
            typeof d.lng === "number" &&
            p.lat === d.lat &&
            p.lng === d.lng)
        );
      });
      if (idx < 0) return;

      const area = normArea(points[idx]);
      currentAreaUuidRef.current = points[idx].areaUuid;
      setActiveKey(area);

      const titleOverride = areaLabelOverrides[area];
      loadAndShowInfoForArea(area, { titleOverride });

      // 埋め込みモードでは自動で詳細バーを開かない
      openDetailBar();
    };

    window.addEventListener(
      EV_SIDEBAR_SET_ACTIVE,
      onSetActive as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_SIDEBAR_SET_ACTIVE,
        onSetActive as EventListener
      );
    // isEmbed を依存配列に追加
  }, [points, schedulesLite, areaLabelOverrides]);

  // 編集モード切替ボタンのクラスを切り替える
  useEffect(() => {
    document.body.classList.toggle("editing-on", isOn);
    return () => {
      document.body.classList.remove("editing-on");
    };
  }, [isOn]);

  // 候補選択（どの candidate を保存対象にするか）
  useEffect(() => {
    const onCandidate = (e: Event) => {
      const d =
        (e as CustomEvent<{ index?: number; title?: string }>).detail || {};
      currentCandidateIndexRef.current = Number.isInteger(d.index)
        ? (d.index as number)
        : null;
      currentCandidateTitleRef.current =
        typeof d.title === "string" ? d.title : undefined;
    };
    window.addEventListener(
      EV_DETAILBAR_SELECT_CANDIDATE,
      onCandidate as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SELECT_CANDIDATE,
        onCandidate as EventListener
      );
  }, []);

  // 案件紐づけモーダルからの選択結果を受け取る
  useEffect(() => {
    const onProjectSubmit = (e: Event) => {
      const d =
        (e as CustomEvent<{ projectUuid?: string; scheduleUuid?: string }>)
          .detail || {};

      if (d.projectUuid && d.scheduleUuid) {
        // まず SAVE 用に保持（従来どおり）
        pendingProjectLinkRef.current = {
          projectUuid: d.projectUuid,
          scheduleUuid: d.scheduleUuid,
        };
        if (import.meta.env.DEV) {
          console.debug("[sidebar] pending project link set", d);
        }

        // ★ ここから「④〜⑤の間に DetailBar の案件履歴に即時反映」する処理
        const run = async () => {
          // どのエリアに紐づけるか分からない場合はスキップ
          if (!currentAreaUuidRef.current) return;

          // プロジェクト index を取得
          const proj = await fetchProjectIndex(d.projectUuid!);
          if (!proj) return;

          const projectName: string =
            typeof proj?.project?.name === "string"
              ? proj.project.name
              : "(不明な案件)";

          const sch = Array.isArray(proj?.schedules)
            ? proj.schedules.find((s: any) => s?.id === d.scheduleUuid)
            : null;
          if (!sch) return;

          const scheduleName: string =
            typeof sch?.label === "string" ? sch.label : "(スケジュール)";
          const date: string =
            typeof sch?.date === "string" && sch.date
              ? sch.date
              : new Date().toISOString().slice(0, 10); // 日付がなかった場合のフォールバック

          // 今の DetailBar の history を取得
          let currentHistory: HistoryItem[] = [];
          try {
            const snapshot = await requestDetailbarData();
            currentHistory = snapshot.history ?? [];
          } catch (err) {
            console.warn("[sidebar] requestDetailbarData failed:", err);
          }

          // すでに同じ projectUuid / scheduleUuid があれば重複追加しない
          const exists = currentHistory.some(
            (h) =>
              h.projectUuid === d.projectUuid &&
              h.scheduleUuid === d.scheduleUuid
          );
          if (exists) return;

          const nextHistory: HistoryItem[] = [
            ...currentHistory,
            {
              date,
              projectName,
              scheduleName,
              projectUuid: d.projectUuid!,
              scheduleUuid: d.scheduleUuid!,
            },
          ];

          // DetailBar に即時反映（あくまでフロントの state だけ）
          setDetailBarHistory(nextHistory);
        };

        // 非同期処理を起動
        run().catch((err) =>
          console.error("[sidebar] project link UI update failed:", err)
        );
      } else {
        pendingProjectLinkRef.current = null;
      }
    };

    window.addEventListener(
      EV_PROJECT_MODAL_SUBMIT,
      onProjectSubmit as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_PROJECT_MODAL_SUBMIT,
        onProjectSubmit as EventListener
      );
  }, []);

  // モードOFFでリセット
  useEffect(() => {
    const onModeChange = (e: Event) => {
      const d = (e as CustomEvent<{ active?: boolean }>).detail;
      const active = !!d?.active;
      setIsAddAreaMode(active);

      if (!active) {
        setAddAreaSearchQuery("");
        setAddAreaSearchResults([]);
        setAddAreaSearchStatus("idle");
        setAddAreaSearchMessage(null);
      }
    };

    window.addEventListener(
      "map:add-area-mode-changed",
      onModeChange as EventListener
    );
    return () =>
      window.removeEventListener(
        "map:add-area-mode-changed",
        onModeChange as EventListener
      );
  }, []);

  // エリア追加モード時の検索結果を受け取る
  useEffect(() => {
    const onResult = (e: Event) => {
      const d = (e as CustomEvent<AddAreaSearchEventDetail>).detail || {};
      const results = Array.isArray(d.results) ? d.results : [];
      const status = d.status ?? (results.length > 0 ? "ok" : "empty");

      setAddAreaSearchResults(results);

      if (status === "error") {
        setAddAreaSearchStatus("error");
        setAddAreaSearchMessage(d.message ?? ADD_AREA_ERROR_MESSAGE);
        return;
      }
      if (status === "empty") {
        setAddAreaSearchStatus("empty");
        setAddAreaSearchMessage(d.message ?? ADD_AREA_EMPTY_MESSAGE);
        return;
      }

      setAddAreaSearchStatus("ok");
      setAddAreaSearchMessage(null);
    };

    window.addEventListener(
      "map:add-area-search-result",
      onResult as EventListener
    );
    return () =>
      window.removeEventListener(
        "map:add-area-search-result",
        onResult as EventListener
      );
  }, []);

  // 表示する areaGroups をフィルタ・ソートする
  const visibleAreaGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = areaGroups;
    
    // フィルター条件
    if (filterType === "droneRecord") {
      // ドローン実績あり
      filtered = filtered.filter(({ indices }) => {
        const firstIdx = indices[0];
        const firstPoint = points[firstIdx];
        if (!firstPoint?.areaUuid) return false;
        return droneRecordCache[firstPoint.areaUuid] === 1;
      });
    } else if (filterType === "candidate") {
      // 候補地（ドローン実績なし）
      filtered = filtered.filter(({ indices }) => {
        const firstIdx = indices[0];
        const firstPoint = points[firstIdx];
        if (!firstPoint?.areaUuid) return false;
        return droneRecordCache[firstPoint.areaUuid] === 0;
      });
    }
    
    // 検索フィルタリング
    if (q) {
      filtered = filtered.filter(({ area, indices }) => {
        // 表示名（上書きがあればそれを検索対象に含める）
        const label = (areaLabelOverrides[area] ?? area).toLowerCase();
        if (label.includes(q)) return true;
        
        // 都道府県名でも検索
        // このエリアグループに属する最初のポイントの areaUuid を取得
        const firstIdx = indices[0];
        const firstPoint = points[firstIdx];
        if (firstPoint?.areaUuid) {
          const prefecture = prefectureCache[firstPoint.areaUuid];
          if (prefecture && prefecture.toLowerCase().includes(q)) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // ソート
    if (sortType === "name") {
      // エリア名順（あいうえお順）
      filtered = [...filtered].sort((a, b) => {
        const nameA = (areaLabelOverrides[a.area] ?? a.area).localeCompare(
          areaLabelOverrides[b.area] ?? b.area,
          "ja"
        );
        return nameA;
      });
    } else if (sortType === "updated") {
      // 更新日順（最新が上）
      filtered = [...filtered].sort((a, b) => {
        const firstIdxA = a.indices[0];
        const firstIdxB = b.indices[0];
        const pointA = points[firstIdxA];
        const pointB = points[firstIdxB];
        
        const updatedAtA = pointA?.areaUuid ? updatedAtCache[pointA.areaUuid] || "" : "";
        const updatedAtB = pointB?.areaUuid ? updatedAtCache[pointB.areaUuid] || "" : "";
        
        // 更新日が新しい順（降順）
        if (!updatedAtA && !updatedAtB) return 0;
        if (!updatedAtA) return 1; // 更新日がないものは下
        if (!updatedAtB) return -1; // 更新日がないものは下
        
        // ISO 8601形式の日付文字列を比較（新しいものが上）
        return updatedAtB.localeCompare(updatedAtA);
      });
    } else if (sortType === "prefecture") {
      // 都道府県順（北海道が上、沖縄が下、未選択は一番下）
      // 都道府県の順序を取得するヘルパー関数
      const getPrefectureOrder = (prefecture: string): number => {
        if (!prefecture || prefecture.trim() === "" || prefecture === "未選択") {
          // 未選択や空文字は最後（大きな値）
          return 9999;
        }
        const index = PREFECTURES.indexOf(prefecture);
        if (index === -1) {
          // リストにない都道府県は最後（未選択よりは上）
          return 9998;
        }
        // PREFECTURESのインデックスを返す（「未選択」はインデックス0だが、上で除外済み）
        // インデックス1が「北海道」、最後が「沖縄県」
        return index;
      };
      
      filtered = [...filtered].sort((a, b) => {
        const firstIdxA = a.indices[0];
        const firstIdxB = b.indices[0];
        const pointA = points[firstIdxA];
        const pointB = points[firstIdxB];
        
        const prefectureA = pointA?.areaUuid ? prefectureCache[pointA.areaUuid] || "" : "";
        const prefectureB = pointB?.areaUuid ? prefectureCache[pointB.areaUuid] || "" : "";
        
        // 都道府県の順序で比較
        const orderA = getPrefectureOrder(prefectureA);
        const orderB = getPrefectureOrder(prefectureB);
        
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // 都道府県が同じ場合はエリア名で比較
        const nameA = (areaLabelOverrides[a.area] ?? a.area).localeCompare(
          areaLabelOverrides[b.area] ?? b.area,
          "ja"
        );
        return nameA;
      });
    }
    
    return filtered;
  }, [areaGroups, searchQuery, areaLabelOverrides, points, prefectureCache, updatedAtCache, droneRecordCache, sortType, filterType]);

  // フィルタ結果を地図に通知（マーカーの表示/非表示を同期）
  useEffect(() => {
    const visibleAreaNames = visibleAreaGroups.map((g) => g.area);
    window.dispatchEvent(
      new CustomEvent(EV_SIDEBAR_VISIBLE_AREAS, {
        detail: { visibleAreaNames },
      })
    );
  }, [visibleAreaGroups]);

  // 更新日をグループ化するためのヘルパー関数
  const getUpdatedAtGroup = (updatedAt: string): string => {
    if (!updatedAt) return "Unknown";
    
    try {
      const updatedDate = new Date(updatedAt);
      const now = new Date();
      const diffMs = now.getTime() - updatedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "Future"; // 未来の日付（エラーケース）
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      if (diffDays <= 7) return `${diffDays} days ago`;
      if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
      }
      // 1ヶ月以上は全て「Months ago」にまとめる
      return "Months ago";
    } catch (e) {
      return "Unknown";
    }
  };

  // 更新日グループの順序を取得する関数
  const getUpdatedAtGroupOrder = (group: string): number => {
    if (group === "Today") return 0;
    if (group === "1 day ago") return 1;
    // days ago（2 days ago〜7 days ago）
    if (/^\d+ days ago$/.test(group)) {
      const days = parseInt(group.replace(" days ago", ""));
      return days; // 2 days ago=2, 3 days ago=3, ...
    }
    // weeks ago
    if (/^\d+ weeks? ago$/.test(group)) {
      const weeks = parseInt(group.replace(/ weeks? ago/, ""));
      return 10 + weeks; // 1 week ago=11, 2 weeks ago=12, ...
    }
    // Months ago（1ヶ月以上は全てまとめる）
    if (group === "Months ago") return 20;
    if (group === "Unknown") return 999;
    if (group === "Future") return -1;
    return 998;
  };

  // 都道府県順ソート時にグループ化する
  const groupedByPrefecture = useMemo(() => {
    if (sortType !== "prefecture") {
      return null; // 都道府県順以外はグループ化しない
    }

    const groups: Array<{ prefecture: string; areas: typeof visibleAreaGroups }> = [];
    const unselectedAreas: typeof visibleAreaGroups = [];

    visibleAreaGroups.forEach((areaGroup) => {
      const firstIdx = areaGroup.indices[0];
      const firstPoint = points[firstIdx];
      const prefecture = firstPoint?.areaUuid
        ? prefectureCache[firstPoint.areaUuid] || ""
        : "";

      // PREFECTURESリストに完全一致する場合のみ都道府県グループに入れる
      // 単位なし（「鹿児島」など）や空文字、「未選択」は未選択グループに入れる
      if (
        !prefecture ||
        prefecture.trim() === "" ||
        prefecture === "未選択" ||
        !PREFECTURES.includes(prefecture)
      ) {
        unselectedAreas.push(areaGroup);
      } else {
        let group = groups.find((g) => g.prefecture === prefecture);
        if (!group) {
          group = { prefecture, areas: [] };
          groups.push(group);
        }
        group.areas.push(areaGroup);
      }
    });

    // 都道府県の順序でソート
    groups.sort((a, b) => {
      const indexA = PREFECTURES.indexOf(a.prefecture);
      const indexB = PREFECTURES.indexOf(b.prefecture);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // 未選択グループを最後に追加
    if (unselectedAreas.length > 0) {
      groups.push({ prefecture: "未選択", areas: unselectedAreas });
    }

    return groups;
  }, [visibleAreaGroups, sortType, points, prefectureCache]);

  // 更新日順ソート時にグループ化する
  const groupedByUpdatedAt = useMemo(() => {
    if (sortType !== "updated") {
      return null; // 更新日順以外はグループ化しない
    }

    const groups: Array<{ groupLabel: string; areas: typeof visibleAreaGroups }> = [];

    visibleAreaGroups.forEach((areaGroup) => {
      const firstIdx = areaGroup.indices[0];
      const firstPoint = points[firstIdx];
      const updatedAt = firstPoint?.areaUuid
        ? updatedAtCache[firstPoint.areaUuid] || ""
        : "";

      const groupLabel = getUpdatedAtGroup(updatedAt);
      let group = groups.find((g) => g.groupLabel === groupLabel);
      if (!group) {
        group = { groupLabel, areas: [] };
        groups.push(group);
      }
      group.areas.push(areaGroup);
    });

    // 更新日グループの順序でソート（新しいものが上）
    groups.sort((a, b) => {
      const orderA = getUpdatedAtGroupOrder(a.groupLabel);
      const orderB = getUpdatedAtGroupOrder(b.groupLabel);
      return orderA - orderB;
    });

    return groups;
  }, [visibleAreaGroups, sortType, points, updatedAtCache]);

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
              onClick={() => {
                const ok = window.confirm(
                  `エリア「${displayLabel}」を削除してもよろしいですか？`
                );
                if (!ok) return;

                const areaUuid = getAreaUuidByAreaName(area);

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
                  "エリアを削除しました。\nこの変更は「保存」ボタンを押すまで S3 には反映されません。"
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
      <div className="mb-3">
        <LogoButton size={70} />
      </div>

      {/* toolbar */}
      <div
        className="toolbar no-caret"
        contentEditable={false}
        onMouseDown={blurActiveInput}
      >
        <div className="toolbar-group">
          <div className="spacer" />
          {isOn ? (
            <ONButton onClick={() => setIsOn(false)} height={iconH} />
          ) : (
            <OFFButton onClick={() => setIsOn(true)} height={iconH} />
          )}
          {isOn && <SaveButton onClick={handleSave} height={iconH} />}
        </div>
      </div>

      {/* エリア追加ボタン */}
      {isOn && (
        <button
          type="button"
          className="add-area-button add-area-button--sidebar"
          onClick={() => {
            setActiveKey(null);
            currentAreaUuidRef.current = undefined;
            currentCandidateIndexRef.current = null;
            currentCandidateTitleRef.current = undefined;
            pendingProjectLinkRef.current = null;

            closeDetailBar();
            window.dispatchEvent(new Event("map:start-add-area"));
          }}
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
              追加したいエリアを地図上でクリックするか、名称・住所で検索してください。
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

          {/* 検索 */}
          <div className="sidebar-add-area-search" role="search">
            <input
              type="text"
              placeholder="地名・施設名・住所で検索"
              value={addAreaSearchQuery}
              onChange={(e) => setAddAreaSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAddAreaSearch();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  window.dispatchEvent(new Event("map:cancel-add-area"));
                }
              }}
            />
            <button
              type="button"
              disabled={!addAreaSearchQuery.trim()}
              onClick={submitAddAreaSearch}
            >
              検索
            </button>
          </div>
          <div className="sidebar-add-area-search-results">
            {addAreaSearchStatus === "idle" && (
              <div className="location-empty" aria-live="polite">
                検索すると候補が表示されます。
              </div>
            )}

            {addAreaSearchStatus === "error" && (
              <div className="location-empty" aria-live="polite">
                {addAreaSearchMessage}
              </div>
            )}

            {addAreaSearchStatus === "empty" && (
              <div className="location-empty" aria-live="polite">
                {addAreaSearchMessage}
              </div>
            )}

            {addAreaSearchStatus === "ok" &&
              addAreaSearchResults.length > 0 && (
                <ul className="no-caret">
                  {addAreaSearchResults.map((r) => (
                    <li
                      key={r.placeId}
                      className="location-item"
                      tabIndex={0}
                      role="button"
                      onClick={async () => {
                        try {
                          const coords = await requestPlaceCoords(r.placeId);
                          if (!coords) return;

                          // 既存③へ統合（useAddAreaMode に渡す）
                          window.dispatchEvent(
                            new CustomEvent("map:add-area-picked", {
                              detail: {
                                lat: coords.lat,
                                lng: coords.lng,
                                label: r.label, // 「表示名/住所」をそのまま候補として渡す
                              },
                            })
                          );
                        } catch (e) {
                          console.warn(
                            "[add-area] failed to resolve coords:",
                            r,
                            e
                          );
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          try {
                            const coords = await requestPlaceCoords(r.placeId);
                            if (!coords) return;

                            // 既存③へ統合（useAddAreaMode に渡す）
                            window.dispatchEvent(
                              new CustomEvent("map:add-area-picked", {
                                detail: {
                                  lat: coords.lat,
                                  lng: coords.lng,
                                  label: r.label, // 「表示名/住所」をそのまま候補として渡す
                                },
                              })
                            );
                          } catch (err) {
                            console.warn(
                              "[add-area] failed to resolve coords:",
                              r,
                              err
                            );
                          }
                        }
                      }}
                    >
                      <span className="location-item__label">{r.label}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}

      {/* 通常検索（エリア追加モードでは非表示） */}
      {!isAddAreaMode && (
        <div id="searchWrap" role="search" aria-label="Search markers">
          <div className="search-field">
            <label htmlFor="searchBox" className="sr-only">
              Search markers
            </label>
            <input
              id="searchBox"
              type="text"
              placeholder="エリア名・都道府県名で検索"
              autoComplete="off"
              inputMode="search"
              aria-describedby="searchHint"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div id="searchHint" aria-live="polite" />
          {/* ソート・フィルター（上下左右・幅を揃えて配置） */}
          <div className="search-sort-filter-row" style={{ marginTop: "8px" }}>
            <label htmlFor="sortSelect" className="search-sort-filter-label">
              <span className="search-sort-icon" aria-hidden="true">⇅</span>
              ソート
            </label>
            <select
              id="sortSelect"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as "name" | "prefecture" | "updated")}
              className="search-sort-select"
              aria-label="ソート順を選択"
            >
              <option value="prefecture">都道府県</option>
              <option value="updated">更新日</option>
              <option value="name">エリア名</option>
            </select>
            <label htmlFor="filterSelect" className="search-sort-filter-label">
              <span className="search-sort-icon" aria-hidden="true">▾</span>
              フィルター
            </label>
            <select
              id="filterSelect"
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "all" | "droneRecord" | "candidate")
              }
              className="search-sort-select"
              aria-label="フィルター条件を選択"
            >
              <option value="all">すべて</option>
              <option value="droneRecord">実施済み</option>
              <option value="candidate">候補地</option>
            </select>
          </div>
          <div className="search-clear-wrapper">
            <button
              type="button"
              className="search-clear-button"
              onClick={() => {
                setSearchQuery("");
                setSortType("prefecture");
                setFilterType("all");
              }}
              aria-label="検索・ソート・フィルターをクリア"
            >
              検索条件クリア
            </button>
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
