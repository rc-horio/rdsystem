// apps/map/src/pages/parts/SideListBar.tsx
import { memo, useEffect, useRef, useState, useMemo } from "react";
import {
  FilterButton,
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
} from "./areasApi";
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
  EV_DETAILBAR_RESPOND_DATA,
  EV_MAP_FOCUS_ONLY,
  EV_GEOMETRY_RESPOND_DATA,
  EV_PROJECT_MODAL_SUBMIT,
  EV_DETAILBAR_REQUEST_DATA,
} from "./constants/events";

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
          flightAltitude_m: g.flightAltitude_m,
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
        window.dispatchEvent(new Event("detailbar:request-data"));
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

      // （2-2）画面入力値からareas/<areaUuid>/index.json 形式
      const infoToSave = {
        ...(typeof raw === "object" && raw ? raw : {}),
        overview: {
          ...(raw?.overview ?? {}),
          address: data.meta.address ?? "",
          prefecture: data.meta.prefecture ?? "",
          manager: data.meta.manager ?? "",
          droneRecord: data.meta.droneRecord ?? "",
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
        // ★ ここで UI 上の history（削除済み行を含めた状態）をそのまま保存
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
          "保存に失敗しました（index.json）。S3 の CORS/権限設定をご確認ください。"
        );
        return;
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
          "保存に失敗しました（areas.json）。S3 の CORS/権限設定をご確認ください。"
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
          await applyCandidateGeometryFromPayload({
            payload: geomPayload,
            areaUuidToUse: currentAreaUuidRef.current ?? areaUuid,
            candidateIndex: currentCandidateIndexRef.current,
            candidateTitle: currentCandidateTitleRef.current,
            activeAreaName: activeKey,
          });
        }
      }

      // （4）画面に即時反映（従来どおり）
      setDetailBarTitle(newTitle);
      setDetailBarMeta({
        overview: infoToSave.overview?.overview ?? "",
        address: infoToSave.overview?.address ?? "",
        manager: infoToSave.overview?.manager ?? "",
        prefecture: infoToSave.overview?.prefecture ?? "",
        droneRecord: infoToSave.overview?.droneRecord ?? "",
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
      console.error(e);
      window.alert("保存処理中にエラーが発生しました。");
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

  return (
    <div id="sidebar" ref={rootRef} role="complementary" aria-label="Sidebar">
      <div className="mb-3">
        <LogoButton size={70} />
      </div>
      <div id="searchWrap" role="search" aria-label="Search markers">
        <div className="search-field">
          <label htmlFor="searchBox" className="sr-only">
            Search markers
          </label>
          <input
            id="searchBox"
            type="text"
            placeholder="Search markers…"
            autoComplete="off"
            inputMode="search"
            aria-describedby="searchHint"
          />
        </div>

        <div
          className="toolbar no-caret"
          contentEditable={false}
          onMouseDown={blurActiveInput}
        >
          <div className="toolbar-group">
            <FilterButton onClick={() => {}} height={iconH} />

            <div className="spacer" />
            {isOn ? (
              <ONButton onClick={() => setIsOn(false)} height={iconH} />
            ) : (
              <OFFButton onClick={() => setIsOn(true)} height={iconH} />
            )}
            {isOn && <SaveButton onClick={handleSave} height={iconH} />}
          </div>
        </div>

        <div id="searchHint" aria-live="polite" />
      </div>

      {isOn && (
        <button
          type="button"
          className="add-area-button add-area-button--sidebar"
          onClick={() => {
            setActiveKey(null);
            currentAreaUuidRef.current = undefined;
            currentCandidateIndexRef.current = null;
            currentCandidateTitleRef.current = undefined;
            pendingProjectLinkRef.current = null; // 新規エリア開始時はクリア

            closeDetailBar();
            window.dispatchEvent(new Event("map:start-add-area"));
          }}
        >
          <span className="add-icon">＋ </span>エリアを追加する
        </button>
      )}

      {/* エリア名（重複集約） */}
      <ul id="locationList" className="no-caret">
        {areaGroups
          .filter(({ area }) => !deletedAreas.has(area))
          .map(({ area, indices }) => {
            const isActive = activeKey === area;
            const displayLabel = areaLabelOverrides[area] ?? area;

            return (
              <li
                key={area}
                data-indices={indices.join(",")}
                data-area={area}
                className={isActive ? "active" : undefined}
                onClick={(e) => {
                  // すでにこの行を編集中なら何もしない
                  if (editingAreaKey === area) return;

                  // ダブルクリック判定（detail === 2）
                  if (isOn && e.detail === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    beginEditAreaName(area);
                    return;
                  }

                  // 通常クリック時はエリアをアクティブ化
                  activateArea(area);
                }}
                onKeyDown={(e) => {
                  // 編集中はキーボード操作でアクティブ化させない
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
                {editingAreaKey === area ? (
                  // 編集中は input を表示
                  <input
                    ref={editingInputRef}
                    type="text"
                    value={editingTempName}
                    onChange={(e) => setEditingTempName(e.target.value)}
                    // input クリックが親 li の onClick に行かないようにする
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
                ) : (
                  <>
                    <>
                      <span className="location-label">
                        {displayLabel}
                        {indices.length > 1 ? `（${indices.length}）` : null}
                      </span>

                      {isOn && (
                        <span
                          className="location-delete"
                          onClick={(e) => {
                            e.stopPropagation(); // 行クリックを発火させない
                          }}
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

                              // 画面上の一覧から非表示にする（削除扱いとしてマーク）
                              setDeletedAreas((prev) => {
                                const next = new Set(prev);
                                next.add(area);
                                return next;
                              });

                              // 削除したエリアがアクティブなら選択状態もクリアしておく
                              if (activeKey === area) {
                                setActiveKey(null);
                                closeDetailBar();
                              }

                              // Map 側などで使う場合に備えてイベントは残しておく
                              window.dispatchEvent(
                                new CustomEvent("sidebar:delete-area", {
                                  detail: { areaName: area, areaUuid },
                                })
                              );

                              // 削除完了の通知ポップアップ（S3 にはまだ反映されていない）
                              window.alert(
                                "エリアを削除しました。\nこの変更は「保存」ボタンを押すまで S3 には反映されません。"
                              );
                            }}
                          />
                        </span>
                      )}
                    </>{" "}
                  </>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

const SideListBar = memo(SideListBarBase);
export default SideListBar;
