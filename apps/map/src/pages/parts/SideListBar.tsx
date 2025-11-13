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
} from "./areasApi";
import { upsertScheduleGeometry, clearScheduleGeometry } from "./areasApi";
import {
  AREA_NAME_NONE,
  EV_DETAILBAR_SELECT_CANDIDATE,
  EV_GEOMETRY_REQUEST_DATA,
} from "./constants/events";
import type { ScheduleLite, Point } from "@/features/types";
import {
  EV_SIDEBAR_SET_ACTIVE,
  EV_DETAILBAR_RESPOND_DATA,
  EV_MAP_FOCUS_ONLY,
  EV_TAKEOFF_REF_CHANGED,
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

  // 直近の基準点変更を保持（SAVE時に反映）
  const pendingRefChangeRef = useRef<{
    projectUuid: string;
    scheduleUuid: string;
    referencePointIndex: number;
  } | null>(null);

  /** エリア集約（出現順維持） */
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

  // 保存
  const handleSave = async () => {
    try {
      if (!activeKey) {
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

      // （2）現状 index.json を merge 用に取得
      const raw = await fetchRawAreaInfo(areaUuid);

      // （3）画面入力値→ index.json 形式
      const infoToSave = {
        ...(typeof raw === "object" && raw ? raw : {}),
        updated_at: new Date().toISOString(),
        updated_by: "ui",
        overview: {
          ...(raw?.overview ?? {}),
          address: data.meta.address ?? "",
          manager: data.meta.manager ?? "",
          prefecture: data.meta.prefecture ?? "",
          droneRecord: data.meta.droneRecord ?? "",
          droneCountEstimate: data.meta.aircraftCount ?? "",
          heightLimitM: data.meta.altitudeLimit ?? "",
          availability: data.meta.availability ?? "",
          overview: data.meta.overview ?? raw?.overview?.overview ?? "",
        },
        details: {
          ...(raw?.details ?? {}),
          statusMemo: data.meta.statusMemo ?? "",
          permitMemo: data.meta.permitMemo ?? "",
          restrictionsMemo: data.meta.restrictionsMemo ?? "",
          remarks: data.meta.remarks ?? "",
        },
        flightArea: raw?.flightArea ?? undefined,
        history: Array.isArray(raw?.history) ? raw.history : [],
      };

      // （4）areas/<areaUuid>/index.json を保存
      const okInfo = await saveAreaInfo(areaUuid!, infoToSave);
      if (!okInfo) {
        window.alert(
          "保存に失敗しました（index.json）。S3 の CORS/権限設定をご確認ください。"
        );
        return;
      }

      // （5）areas.json を upsert
      const pos = points.find((p) => p.areaUuid === areaUuid);
      const okAreas = await upsertAreasListEntryFromInfo({
        areaUuid: areaUuid,
        areaName: infoToSave.areaName,
        prefecture: infoToSave.overview?.prefecture,
        lat: pos?.lat,
        lon: pos?.lng,
      });
      if (!okAreas) {
        window.alert(
          "保存に失敗しました（areas.json）。S3 の CORS/権限設定をご確認ください。"
        );
        // index.json は保存済みなので続行可能
      } else {
        window.dispatchEvent(new Event("areas:reload"));
      }

      // ★（6）プロジェクト側のスケジュール geometry の基準点 index を反映
      // 直近で変更があった場合のみパッチ。存在しなければ何もしない（スキップ）。
      const refchg = pendingRefChangeRef.current;
      if (refchg) {
        const okGeom = await updateScheduleTakeoffReferencePoint(refchg);
        if (!okGeom) {
          // ここでは UI メッセージは変えず、ログだけ残す（デグレ防止）
          console.warn(
            "[save] project geometry takeoff reference update failed or skipped",
            refchg
          );
        } else {
          // 成功したら消化
          pendingRefChangeRef.current = null;
        }
      }

      // （6.5）編集中の geometry を MapGeometry から受け取り、projects/<uuid>/index.json へ保存
      try {
        const geomPayload = await new Promise<{
          projectUuid?: string;
          scheduleUuid?: string;
          geometry?: any;
          deleted?: boolean;
        }>((resolve, reject) => {
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
          // 現在のGeometryをリクエスト
          window.dispatchEvent(new Event(EV_GEOMETRY_REQUEST_DATA));

          // 返ってこない場合はスキップ
          timer = window.setTimeout(() => {
            window.removeEventListener(
              EV_GEOMETRY_RESPOND_DATA,
              onGeom as EventListener
            );
            reject(new Error("geometry からの応答がありません"));
          }, 1500);
        }).catch(() => ({} as any));

        if (geomPayload?.projectUuid && geomPayload?.scheduleUuid) {
          // プロジェクト/スケジュール文脈
          if (geomPayload.deleted === true) {
            const okGeomDel = await clearScheduleGeometry({
              projectUuid: geomPayload.projectUuid,
              scheduleUuid: geomPayload.scheduleUuid,
            });
            if (!okGeomDel) console.warn("[save] geometry delete failed");
          } else if (geomPayload.geometry) {
            const okGeomSave = await upsertScheduleGeometry({
              projectUuid: geomPayload.projectUuid,
              scheduleUuid: geomPayload.scheduleUuid,
              geometry: geomPayload.geometry,
            });
            if (!okGeomSave) console.warn("[save] geometry save failed");
          } else {
            if (import.meta.env.DEV)
              console.debug("[save] geometry payload not available — skipped");
          }
        } else if (geomPayload?.geometry || geomPayload?.deleted) {
          // 候補文脈
          const areaUuidToUse = currentAreaUuidRef.current ?? areaUuid;
          const idx = currentCandidateIndexRef.current;
          if (areaUuidToUse && typeof idx === "number" && idx >= 0) {
            if (geomPayload.deleted === true) {
              const okDel = await clearAreaCandidateGeometryAtIndex({
                areaUuid: areaUuidToUse,
                index: idx,
              });
              if (!okDel)
                console.warn("[save] candidate geometry delete failed");
            } else if (geomPayload.geometry) {
              const g = geomPayload.geometry;
              const okCand = await upsertAreaCandidateAtIndex({
                areaUuid: areaUuidToUse,
                index: idx,
                candidate: {
                  title: currentCandidateTitleRef.current,
                  flightAltitude_m: g.flightAltitude_m,
                  takeoffArea: g.takeoffArea,
                  flightArea: g.flightArea,
                  safetyArea: g.safetyArea,
                  audienceArea: g.audienceArea,
                },
                preserveTitle: true,
              });
              if (!okCand)
                console.warn("[save] candidate geometry save failed");
            }
            // 保存後、candidateの更新をUIへ反映
            try {
              const { meta: refreshedMeta } = await fetchAreaInfo(
                areaUuidToUse,
                activeKey || ""
              );
              setDetailBarMeta(refreshedMeta);
            } catch {}
          } else {
            console.warn(
              "[save] candidate context missing (areaUuid/index). Skipped."
            );
          }
        }
      } catch (e) {
        console.warn("[save] geometry save skipped:", e);
      }

      // （7）画面に即時反映（従来どおり）
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

      // （8）従来メッセージを維持（UIのデグレ回避）
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

  // 基準点変更イベントを捕捉して保持
  useEffect(() => {
    const onRefChanged = (e: Event) => {
      const ce = e as CustomEvent<{
        projectUuid?: string;
        scheduleUuid?: string;
        referencePointIndex?: number;
        referencePoint?: [number, number]; // 使わない（schema変更回避）
      }>;
      const d = ce.detail || {};
      if (
        typeof d?.projectUuid === "string" &&
        typeof d?.scheduleUuid === "string" &&
        Number.isInteger(d?.referencePointIndex)
      ) {
        pendingRefChangeRef.current = {
          projectUuid: d.projectUuid,
          scheduleUuid: d.scheduleUuid,
          referencePointIndex: d.referencePointIndex as number,
        };
        if (import.meta.env.DEV)
          console.debug(
            "[sidebar] takeoff ref changed",
            pendingRefChangeRef.current
          );
      }
    };

    window.addEventListener(
      EV_TAKEOFF_REF_CHANGED,
      onRefChanged as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_TAKEOFF_REF_CHANGED,
        onRefChanged as EventListener
      );
  }, []);

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
            <AddItemButton onClick={() => {}} height={iconH} />
            {isOn ? (
              <ONButton onClick={() => setIsOn(false)} height={iconH} />
            ) : (
              <OFFButton onClick={() => setIsOn(true)} height={iconH} />
            )}
            {isOn && <SaveButton onClick={handleSave} height={iconH} />}
          </div>
          <div className="spacer" />
          {isOn && <DeleteItemButton onClick={() => {}} height={iconH} />}
        </div>

        <div id="searchHint" aria-live="polite" />
      </div>

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
