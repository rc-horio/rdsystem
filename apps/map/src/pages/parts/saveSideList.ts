import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { getUserDisplayName } from "@/lib/auditHeaders";
import {
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
  areaConsideringSnapshot,
  areaBasicSnapshot,
  areaOwnFiguresSnapshot,
  applyTabUpdateStamps,
  canonicalConsideringStatus,
  collectDirtyAreaTabs,
  getAreaKindFlags,
  hasConsideringContent,
  historyPairsKey,
  isEmptyOtherRecord,
  parseTabUpdates,
  seedMissingTabUpdates,
  type AreaKindFlags,
} from "./detailBar/helpers";
import type {
  Candidate,
  GeometryPayload,
  HistoryItem,
  OtherRecord,
  Point,
  TabKey,
} from "@/features/types";
import {
  EV_DETAILBAR_REQUEST_DATA,
  EV_DETAILBAR_RESPOND_DATA,
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
import {
  setDetailBarHistory,
  setDetailBarMeta,
  setDetailBarTitle,
} from "./SideDetailBar";
import {
  applyCandidateGeometryFromPayload,
  applyOtherFigureGeometryFromPayload,
  applyOwnFlightFiguresFromHistory,
  applySalesGeometryFromPayload,
  canMergeOwnGeometry,
} from "./saveAreaFigures";

export type SideListSaveDeps = {
  deletedAreas: Set<string>;
  getAreaUuidByAreaName: (area: string) => string | undefined;
  activeKey: string | null;
  currentAreaUuidRef: MutableRefObject<string | undefined>;
  currentCandidateIndexRef: MutableRefObject<number | null>;
  currentSalesIndexRef: MutableRefObject<number | null>;
  currentCandidateTitleRef: MutableRefObject<string | undefined>;
  currentOtherRecordIndexRef: MutableRefObject<number | null>;
  currentOtherFigureIndexRef: MutableRefObject<number | null>;
  ownFiguresBaselineRef: MutableRefObject<string>;
  pendingProjectLinkRef: MutableRefObject<{
    projectUuid: string;
    scheduleUuid: string;
  } | null>;
  requestGeometryPayload: () => Promise<GeometryPayload | null>;
  requestCurrentPoint: () => Promise<Point | null>;
  setKindCache: Dispatch<SetStateAction<Record<string, AreaKindFlags>>>;
  points: Point[];
  setIsSaving: Dispatch<SetStateAction<boolean>>;
};

export async function runSideListSave(deps: SideListSaveDeps) {
  const {
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
  } = deps;

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
}
