// apps/map/src/pages/parts/SideListBar.tsx
import { memo, useEffect, useRef, useState, useMemo } from "react";
import {
  FilterButton,
  AddItemButton,
  ONButton,
  OFFButton,
  SaveButton,
  DeleteItemButton,
  LogoButton,
  blurActiveInput,
} from "@/components";
import {
  openDetailBar,
  setDetailBarTitle,
  setDetailBarHistory,
  setDetailBarMeta,
} from "./SideDetailBar";
import {
  fetchAreaInfo,
  fetchRawAreaInfo,
  saveAreaInfo,
  upsertAreasListEntryFromInfo,
  buildAreaHistoryFromProjects,
  updateScheduleTakeoffReferencePoint,
  clearAreaCandidateGeometryAtIndex,
  upsertAreaCandidateAtIndex,
  upsertScheduleGeometry,
  clearScheduleGeometry,
} from "./areasApi";
import type { ScheduleLite, Point, GeometryPayload } from "@/features/types";
import {
  AREA_NAME_NONE,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_GEOMETRY_REQUEST_DATA,
  EV_SIDEBAR_SET_ACTIVE,
  EV_DETAILBAR_RESPOND_DATA,
  EV_MAP_FOCUS_ONLY,
  EV_GEOMETRY_RESPOND_DATA,
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
  // 現在の保存コンテキスト（エリア／候補）
  const currentAreaUuidRef = useRef<string | undefined>(undefined);
  const currentCandidateIndexRef = useRef<number | null>(null);
  const currentCandidateTitleRef = useRef<string | undefined>(undefined);

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
  const loadAndShowInfoForArea = async (area: string) => {
    const idx = points.findIndex((p) => normArea(p) === area);
    const areaUuid = idx >= 0 ? points[idx].areaUuid : undefined;

    if (!areaUuid) {
      console.error("areaUuid not found for area:", area);
      return;
    }

    // タイトル／メタはエリア index から
    const { title, meta } = await fetchAreaInfo(areaUuid, area);
    setDetailBarTitle(title);
    setDetailBarMeta(meta);

    // 履歴は「エリアの history に載っている UUID だけ」プロジェクトへ直取り
    const fullHistory = await buildAreaHistoryFromProjects(areaUuid);
    setDetailBarHistory(fullHistory);
  };

  // 共通のエリアアクティベーション（クリック/Enter/Space）
  const activateArea = async (area: string) => {
    setActiveKey(area);
    await loadAndShowInfoForArea(area);
    openDetailBar();

    const areaUuid = getAreaUuidByAreaName(area);
    currentAreaUuidRef.current = areaUuid;

    window.dispatchEvent(
      new CustomEvent(EV_MAP_FOCUS_ONLY, {
        detail: { areaUuid, areaName: area },
      })
    );

    // points を引数で渡す
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
    } else {
      if (import.meta.env.DEV)
        console.debug("[save] candidate geometry not available — skipped");
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
      // （0）保存対象のエリアを選択しているか確認
      if (!activeKey) {
        window.alert("保存対象のエリアを選択してください。");
        return;
      }
      // 保存対象のエリアの areaUuid を取得
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

      // （2-1）現状 areas/<areaUuid>/index.json を merge 用に取得
      // あとで「古い値＋新しい値」をマージしたオブジェクトを作るために使用
      const raw = await fetchRawAreaInfo(areaUuid);

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
        // TODO
        history: Array.isArray(raw?.history) ? raw.history : [],
        // TODO
        candidate: Array.isArray(raw?.candidate) ? raw.candidate : [],
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
      const pos = points.find((p) => p.areaUuid === areaUuid);
      const okAreas = await upsertAreasListEntryFromInfo({
        uuid: areaUuid,
        areaName: data.title,
        lat: pos?.lat,
        lon: pos?.lng,
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
      setDetailBarTitle(infoToSave.areaName);
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
      loadAndShowInfoForArea(area);
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
  }, [points, schedulesLite]);

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
          className="add-area-button"
          onClick={() => {
            console.log("エリアを追加します");
          }}
        >
          <span className="add-icon">＋ </span>エリアを追加する
        </button>
      )}

      {/* エリア名（重複集約） */}
      <ul id="locationList" className="no-caret">
        {areaGroups.map(({ area, indices }) => {
          const isActive = activeKey === area;
          return (
            <li
              key={area}
              data-indices={indices.join(",")}
              data-area={area}
              className={isActive ? "active" : undefined}
              onClick={() => activateArea(area)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activateArea(area);
                }
              }}
            >
              {area}
              {indices.length > 1 ? `（${indices.length}）` : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SideListBar = memo(SideListBarBase);
export default SideListBar;
