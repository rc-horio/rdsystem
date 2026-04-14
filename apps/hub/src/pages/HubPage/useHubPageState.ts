// src/pages/HubPage/useHubPageState.ts
import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useToast } from "@/components/Toast";
import { getAuditHeaders, getUserDisplayName } from "@/lib/auditHeaders";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import {
  buildIndexJsonFromState,
  buildSchedulesFromProjectData,
  normalizeIndexJsonForProjectLostDeal,
} from "./builders";
import { v4 as uuid } from "uuid";

// 環境変数からCatalogのベースURLを取得
const CATALOG = String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(/\/+$/, "");

// 環境変数からCatalogの書き込みURLを取得
const CATALOG_WRITE_URL = String(import.meta.env.VITE_CATALOG_WRITE_URL || "").replace(/\/+$/, "");

// 環境変数から写真アップロード用のLambda関数APIを取得
const PRESIGN_API = String(import.meta.env.VITE_HUB_PHOTO_PRESIGN_URL || "").replace(/\/+$/, "");

// 環境変数から写真削除用のLambda関数APIを取得
const DELETE_API = String(import.meta.env.VITE_HUB_PHOTO_DELETE_URL || "").replace(/\/+$/, "");

// エリア情報のベースURL
const AREAS_BASE_URL = `${CATALOG}/areas`;

const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function useDataSource(id?: string) {
  const { search } = useLocation();
  const qSource = new URLSearchParams(search).get("source");
  if (qSource === "local" || id === "local") return "local";
  if (qSource === "s3") return "s3";
  const isDev =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isDev ? "local" : "s3";
}

export function useHubPageState() {
  const toast = useToast();
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

  const { id } = useParams();
  const source = useDataSource(id);
  const { search } = useLocation();
  const q = new URLSearchParams(search);
  const initProjectId = q.get("projectId") || "";
  const isInit = q.get("init") === "1";
  const duplicateFrom = q.get("duplicateFrom") || "";
  const initName = q.get("name") || "";
  const initDate = q.get("date") || "";
  const initLabel = q.get("label") || "";
  const initTab = q.get("tab") || "";
  const initScheduleUuid = q.get("scheduleUuid") || "";

  const validTabs = ["リソース", "エリア", "オペレーション", "現場記録"] as const;
  const [activeTab, setActiveTab] = useState<
    "リソース" | "エリア" | "オペレーション" | "現場記録"
  >(
    validTabs.includes(initTab as (typeof validTabs)[number])
      ? (initTab as (typeof validTabs)[number])
      : "リソース"
  );
  const [edit, setEdit] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScheduleDetail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localFileHandle, setLocalFileHandle] =
    useState<FileSystemFileHandle | null>(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [copySourceId, setCopySourceId] = useState<string>("");

  const sortedSchedules = useMemo(() => {
    const normalizeDate = (v?: string) => String(v ?? "").trim();
    const hasValidDate = (v?: string) => /^\d{4}-\d{2}-\d{2}$/.test(normalizeDate(v));

    return [...schedules].sort((a, b) => {
      const aDate = normalizeDate(a.date);
      const bDate = normalizeDate(b.date);
      const aHasDate = hasValidDate(a.date);
      const bHasDate = hasValidDate(b.date);

      if (aHasDate && !bHasDate) return -1;
      if (!aHasDate && bHasDate) return 1;

      if (aHasDate && bHasDate && aDate !== bDate) {
        return aDate.localeCompare(bDate, "ja");
      }

      const aLabel = String(a.label ?? "").trim();
      const bLabel = String(b.label ?? "").trim();
      return aLabel.localeCompare(bLabel, "ja");
    });
  }, [schedules]);

  const currentSchedule = useMemo(
    () => schedules.find((s) => s.id === selectedId) ?? null,
    [schedules, selectedId]
  );

  const eventDisplay =
    typeof projectData?.project?.name === "string"
      ? projectData.project.name
      : (typeof projectData?.event?.name === "object"
        ? JSON.stringify(projectData?.event?.name)
        : projectData?.event?.name) ?? "";

  const headerTitle = useMemo(() => {
    const base = eventDisplay || "案件名";
    const schedLabel = currentSchedule?.label?.trim();
    const baseWithLost = Boolean(projectData?.project?.lostDeal)
      ? `${base}（失注）`
      : base;
    if (!schedLabel) return baseWithLost;
    const schedWithCancelled = currentSchedule?.cancelled
      ? `${schedLabel}（中止）`
      : schedLabel;
    return `${baseWithLost}　${schedWithCancelled}`;
  }, [
    eventDisplay,
    currentSchedule?.label,
    currentSchedule?.cancelled,
    projectData?.project?.lostDeal,
  ]);

  const updatedAt = projectData?.project?.updated_at ?? null;
  const updatedBy = projectData?.project?.updated_by ?? "";
  const buildNewSchedule = (init?: {
    date?: string;
    label?: string;
    place?: string;
  }): ScheduleDetail => {
    const newId = crypto.randomUUID?.() ?? String(Math.random());
    return {
      id: newId,
      label: init?.label ?? "",
      date: init?.date ?? "",
      place: init?.place ?? "",
      resource: {
        drones: [{ model: "", color: "", count: 0 }],
        batteries: [{ model: "", count: 0 }],
        modules: [{ type: "", count: 0 }],
        vehicles: { rows: [{ type: "", driver: "" }], memo: "" },
        items: [],
        hotels: [],
        people: { groups: [], memo: "" },
      },
      area: {
        area_uuid: "",
        area_name: "",
        drone_count: { model: "", count: 0, x_count: null, y_count: null },
        actions: { liftoff: "", turn: "" },
        obstacle_note: "",
        lights: { takeoff: "", landing: "" },
        return_note: "",
        distance_from_viewers_m: null,
        spacing_between_drones_m: { horizontal: "", vertical: "" },
      },
      operation: {
        placement: { x: null, y: null, spacing_m: null },
        modules: [],
        measurement: { target_id: null, result: null },
        memo: "",
      },
      photos: [],
      cancelled: false,
      cancelledReason: "",
    };
  };

  // 既存の「JSON保存用 Lambda」を使って任意のJSONを書き込むヘルパー
  const putJsonViaLambda = async (params: { key: string; body: any }) => {
    const auditHeaders = await getAuditHeaders();
    const res = await fetch(
      CATALOG_WRITE_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auditHeaders },
        body: JSON.stringify({
          key: params.key,
          body: params.body,
          contentType: "application/json; charset=utf-8",
        }),
      }
    );
    const raw = await res.text();
    let data: { error?: string } | null = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (!res.ok) throw new Error(raw || `Request failed: ${res.status}`);
      }
    }
    if (!res.ok || data?.error) throw new Error(data?.error ?? raw ?? `Request failed: ${res.status}`);
  };

  type AreaIndexJson = {
    overview?: any;
    details?: any;
    history?: { uuid: string; projectuuid: string; scheduleuuid: string }[];
    candidate?: any[];
    updated_at?: string;
    updated_by?: string;
  };

  // 1つのエリアについて、「このプロジェクトの history を現在の状態に合わせて差し替える」
  const syncAreaHistoryForArea = async (params: {
    areaUuid: string;
    projectUuid: string;
    scheduleUuids: string[];
    updatedBy: string;
  }) => {
    const { areaUuid, projectUuid, scheduleUuids, updatedBy } = params;

    const url = `${AREAS_BASE_URL}/${areaUuid}/index.json`;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.error("area index.json fetch failed", areaUuid, res.status);
      return;
    }

    const json = (await res.json()) as AreaIndexJson;
    const history = json.history ?? [];

    const uniqScheduleUuids = Array.from(
      new Set(scheduleUuids.filter((s) => !!s))
    );

    // まず「このプロジェクトの紐づき（schedule の集合）」が変わっていないなら
    // PUT も timestamp 更新もしない（RD Map 側の最終更新者が不要に書き換わるのを防ぐ）
    const currentProjectScheduleUuids = history
      .filter((h) => h.projectuuid === projectUuid)
      .map((h) => h.scheduleuuid)
      .filter((s) => !!s);

    const a = Array.from(new Set(uniqScheduleUuids)).sort();
    const b = Array.from(new Set(currentProjectScheduleUuids)).sort();
    const sameScheduleSet =
      a.length === b.length && a.every((v, i) => v === b[i]);
    if (sameScheduleSet) return;

    // 1) このプロジェクトの「今は紐づいていないスケジュール」を削除
    let nextHistory = history.filter((h) => {
      if (h.projectuuid !== projectUuid) return true;
      return uniqScheduleUuids.includes(h.scheduleuuid);
    });

    // 2) 「今は紐づいているのに、まだ history に無いスケジュール」を追加
    for (const schedUuid of uniqScheduleUuids) {
      const exists = nextHistory.some(
        (h) => h.projectuuid === projectUuid && h.scheduleuuid === schedUuid
      );
      if (!exists) {
        nextHistory.push({
          uuid: "",
          projectuuid: projectUuid,
          scheduleuuid: schedUuid,
        });
      }
    }

    json.history = nextHistory;
    json.updated_at = new Date().toISOString();
    json.updated_by = updatedBy;

    await putJsonViaLambda({
      key: `catalog/v1/areas/${areaUuid}/index.json`,
      body: json,
    });
  };

  // schedules 全体から area_uuid ごとにまとめて、各エリアの history を同期
  const syncAllAreaHistories = async (params: {
    projectUuid: string;
    schedules: ScheduleDetail[];
    updatedBy: string;
  }) => {
    const { projectUuid, schedules, updatedBy } = params;

    // ① 現在の状態: areaUuid ごとに「今」紐づいている schedule id を集計
    const currentAreaMap = new Map<string, string[]>();

    for (const s of schedules) {
      const areaUuid =
        s.area &&
          typeof (s.area as any).area_uuid === "string" &&
          (s.area as any).area_uuid.trim() !== ""
          ? ((s.area as any).area_uuid as string)
          : "";

      if (!areaUuid) continue;
      if (!s.id) continue;

      const list = currentAreaMap.get(areaUuid) ?? [];
      list.push(s.id);
      currentAreaMap.set(areaUuid, list);
    }

    // ② 前回保存済みの状態（projectData）から、過去に紐づいていたエリアも拾う
    const previousAreaMap = new Map<string, string[]>();
    try {
      if (projectData) {
        const prev = buildSchedulesFromProjectData(projectData);

        for (const s of prev as ScheduleDetail[]) {
          const areaUuid =
            s.area &&
              typeof (s.area as any).area_uuid === "string" &&
              (s.area as any).area_uuid.trim() !== ""
              ? ((s.area as any).area_uuid as string)
              : "";

          if (!areaUuid) continue;
          if (!s.id) continue;

          const list = previousAreaMap.get(areaUuid) ?? [];
          list.push(s.id);
          previousAreaMap.set(areaUuid, list);
        }
      }
    } catch (e) {
      console.error(
        "failed to build previous schedules for area history",
        e
      );
    }

    // ③ 「以前紐づいていた or 今紐づいている」すべてのエリアを対象にする
    const targetAreaUuids = new Set<string>();
    for (const k of currentAreaMap.keys()) targetAreaUuids.add(k);
    for (const k of previousAreaMap.keys()) targetAreaUuids.add(k);

    if (!targetAreaUuids.size) return;

    // ④ 各エリアについて、「今の scheduleUuids」を正とした history に差し替える
    await Promise.all(
      Array.from(targetAreaUuids).map((areaUuid) =>
        syncAreaHistoryForArea({
          areaUuid,
          projectUuid,
          // 今の状態でそのエリアに紐づいている schedule 一覧
          // 何もなければ [] が渡る → そのエリアからはこのプロジェクトの履歴が全削除される
          scheduleUuids: currentAreaMap.get(areaUuid) ?? [],
          updatedBy,
        })
      )
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const BASE = import.meta.env.BASE_URL;
        const makeUrl = () =>
          source === "local" ? `${BASE}index.json`
            : `${CATALOG}/projects/${id}/index.json`;

        if (source === "s3" && !id) return;

        // init=1 の場合は“空”で開始（ただし duplicateFrom 指定時はコピー読込）
        if (isInit) {
          if (duplicateFrom) {
            // 1) 複製元の index.json を取得
            const srcUrl = `${CATALOG}/projects/${duplicateFrom}/index.json`;

            let copied: any | null = null;
            try {
              const r = await fetch(srcUrl, { cache: "no-cache" });
              if (r.ok) {
                copied = await r.json();
              }
            } catch { }

            if (copied) {
              // 2) 複製用の整形：名称に（複製）を付与、更新情報リセット
              const dup = normalizeIndexJsonForProjectLostDeal({
                ...copied,
                project: {
                  ...(copied.project ?? {}),
                  uuid: id ?? "",
                  id: initProjectId || "",
                  name:
                    initName ||
                    (copied.project?.name || copied.event?.name || "") +
                    "copy",
                  updated_at: null,
                },
              });
              const built = buildSchedulesFromProjectData(dup);

              // モーダルで日付が入っていたら、その日付のスケジュールを優先選択。
              // scheduleUuid（RD Mapからの遷移）が指定されていればそのスケジュールを選択。
              // 見つからなければ1件追加して選択。
              let nextSchedules = built;
              let selected: string | null = built[0]?.id ?? null;
              if (initScheduleUuid) {
                const match = built.find((s) => s.id === initScheduleUuid);
                if (match) selected = match.id;
              }
              if (initDate && selected === built[0]?.id) {
                const match = built.find((s) => (s.date || "") === initDate);
                if (match) {
                  selected = match.id;
                } else if (!initScheduleUuid) {
                  const add = buildNewSchedule({
                    date: initDate,
                    label: initLabel || "",
                  });
                  nextSchedules = [...built, add];
                  selected = add.id;
                }
              }

              setProjectData(dup);
              setSchedules(nextSchedules);
              setSelectedId(selected);
              setEdit(false); // 編集モードON
              return;
            }
          }

          // 複製元なし or 取得失敗 → 空で開始（デフォルトで1件スケジュールを自動作成・選択）
          const empty = {
            project: {
              uuid: id ?? "",
              id: initProjectId || "",
              name: initName || "",
              updated_at: null,
              updated_by: "",
            },
            schedules: [] as any[],
          };
          const first = buildNewSchedule({
            date: initDate || "",
            label: initLabel || "",
          });
          setProjectData(empty);
          setSchedules([first]);
          setSelectedId(first.id);
          setEdit(false);
          return;
        }

        let res = await fetch(makeUrl(), { cache: "no-cache" });
        // local の場合のフォールバック（既存仕様）
        if (source === "local" && res.status === 404 && id) {
          const fb = `${CATALOG}/projects/${id}/index.json`;
          res = await fetch(fb, { cache: "no-cache" });
        }

        if (res.status === 404) {
          // S3 になくても“空の新規案件”として起動
          const empty = {
            project: {
              uuid: id ?? "",
              id: "",
              name: initName || "",
              updated_at: null,
              updated_by: "",
            },
            schedules: [] as any[],
          };
          const first = buildNewSchedule({
            date: initDate || "",
            label: initLabel || "",
          });
          setProjectData(empty);
          setSchedules([first]);
          setSelectedId(first.id);
          setEdit(false);
          return;
        }

        if (!res.ok) throw new Error(String(res.status));
        const raw = await res.json();
        // 既存データに id が無ければ補完（後方互換）
        if (id) {
          // uuid が無ければ補完（これはOK）
          if (!raw?.project) raw.project = {};
          if (!raw.project.uuid) raw.project.uuid = id;

          // 命名IDは「無いなら空」のまま（uuidで埋めない）
          if (!raw.project.id) raw.project.id = "";
        }
        const data = normalizeIndexJsonForProjectLostDeal(raw);
        setProjectData(data);
        const built = buildSchedulesFromProjectData(data);
        setSchedules(built);
        // RD Mapから遷移時（scheduleUuid指定）は該当スケジュールを選択
        const selected =
          initScheduleUuid &&
          built.some((s) => s.id === initScheduleUuid)
            ? initScheduleUuid
            : built[0]?.id ?? null;
        setSelectedId(selected);
      } catch (e) {
        console.error("プロジェクト取得エラー", e);
      }
    })();
  }, [id, source, isInit, initScheduleUuid]);

  const updateSchedule = (id: string, updates: Partial<ScheduleDetail>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const requestDeleteCurrent = () => {
    if (!edit || !selectedId) return;
    const idx = schedules.findIndex((s) => s.id === selectedId);
    if (idx < 0) return;
    if (!confirm("削除します。よろしいですか？")) return;
    const next = schedules.filter((_, i) => i !== idx);
    setSchedules(next);
    setSelectedId(next[0]?.id ?? null);
  };


  const handleSave = async () => {

    // 日付・スケジュール名が入力されていなければ無効
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

    type Err = { id: string; idx: number; reason: "required" | "date" };
    const errors: Err[] = [];

    schedules.forEach((s, idx) => {
      const label = String(s.label ?? "").trim();
      const date = String(s.date ?? "").trim();

      // 必須（どちらか欠けてたらNG）
      if (!label || !date) {
        errors.push({ id: s.id, idx, reason: "required" });
        return;
      }

      // 形式＋実在日（YYYY-MM-DD かつ実在日）
      if (!DATE_RE.test(date)) {
        errors.push({ id: s.id, idx, reason: "date" });
        return;
      }
      const t = new Date(date + "T00:00:00Z");
      if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== date) {
        errors.push({ id: s.id, idx, reason: "date" });
        return;
      }
    });

    if (errors.length > 0) {
      const first = errors[0];
      if (first?.id) setSelectedId(first.id);

      const lines = errors
        .slice(0, 5)
        .map(({ idx, reason }) => {
          const msg =
            reason === "required"
              ? "日付とスケジュール名を入力してください。"
              : "日付は「YYYY-MM-DD」形式で、正しい日付を入力してください。";
          return `${msg}`;
        })
        .join("\n");

      alert(lines + (errors.length > 5 ? `\n...他 ${errors.length - 5}件` : ""));
      return;
    }

    // --- 重複チェック（同一 date + label を禁止）---
    const keyToIndexes = new Map<string, number[]>();

    schedules.forEach((s, idx) => {
      const label = String(s.label ?? "").trim();
      const date = String(s.date ?? "").trim();
      if (!label || !date) return; // 必須NGは前段で検出済み

      // 大文字小文字/全角半角の揺れを吸収したいならここで normalize してください
      const key = `${date}::${label}`;
      const list = keyToIndexes.get(key) ?? [];
      list.push(idx);
      keyToIndexes.set(key, list);
    });

    const duplicates = Array.from(keyToIndexes.entries()).filter(
      ([, idxs]) => idxs.length >= 2
    );

    if (duplicates.length > 0) {
      alert(
        "同じ日付とスケジュール名の組み合わせが重複しています。日付または名称を変更してください。"
      );
      return;
    }

    if (!schedules.length) return;

    // 🟢 新しいスケジュール（idが未設定 or 空）のUUID自動生成
    const normalizedSchedules = schedules.map((s) => ({
      ...s,
      id:
        typeof s.id === "string" && s.id.trim().length > 0
          ? s.id
          : uuid(),
    }));

    const currentUuid = id || projectData?.project?.uuid || "";
    const currentProjectId = projectData?.project?.id || "";
    const displayName = await getUserDisplayName();
    const body = buildIndexJsonFromState(
      projectData,
      normalizedSchedules,
      currentProjectId,
      displayName
    );

    if (source === "local") {
      try {
        let handle = localFileHandle;
        if (!handle) {
          const picker = await (window as any).showOpenFilePicker?.({
            multiple: false,
            types: [
              {
                description: "JSON",
                accept: { "application/json": [".json"] },
              },
            ],
            excludeAcceptAllOption: true,
          });
          if (!picker?.length) return; // キャンセル
          handle = picker[0] as FileSystemFileHandle;
          setLocalFileHandle(handle);
        }

        const writable = await (handle as any).createWritable();
        await writable.write(JSON.stringify(body, null, 2));
        await writable.close();

        // 保存後に updated_at を画面にも反映
        setProjectData((p: any) => ({
          ...(p ?? {}),
          project: {
            ...(p?.project ?? {}),
            updated_at: body.project.updated_at,
            id: body.project.id,
            name: body.project.name ?? p?.project?.name ?? p?.event?.name ?? "",
            updated_by: body.project.updated_by ?? p?.project?.updated_by ?? "",
            lostDeal: Boolean(body.project?.lostDeal),
          },
          schedules: body.schedules,
        }));

        // ✅ ローカル保存成功時のトースト
        toast.showToast("保存しました。");

        return;
      } catch (e) {
        console.error("local save error", e);
        toast.showToast("保存ができませんでした。しばらく時間をおいて、もう一度お試しください。", "error");
        return;
      }
    }

    // ここから S3 保存（必要なら）
    if (!id) return;
    setIsSaving(true);
    try {
      // ① blob 画像をまとめて S3 へ（S3 URL に置換済みの schedules を得る）
      const schedulesAfterUpload = await uploadStagedPhotosIfAny(schedules);

      // ② JSON を構築（置換後の schedules を使う）
      const body = buildIndexJsonFromState(
        projectData,
        schedulesAfterUpload,
        currentProjectId,
        displayName
      );

      // ③ 既存の JSON 保存 Lambda を叩く
      const auditHeaders = await getAuditHeaders();
      const res = await fetch(
        CATALOG_WRITE_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auditHeaders },
          body: JSON.stringify({
            key: `catalog/v1/projects/${currentUuid}/index.json`,
            body,
            contentType: "application/json; charset=utf-8",
          }),
        }
      );
      const raw = await res.text();
      let data: { error?: string } | null = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          // 404 等で HTML/プレーンテキストが返る場合
          if (!res.ok) throw new Error(raw || `Request failed: ${res.status}`);
        }
      }
      if (!res.ok || data?.error) throw new Error(data?.error ?? raw ?? `Request failed: ${res.status}`);

      // 🟢 projects.json も同期（projectId / projectName 変更時）
      // fetch 失敗時は上書きしない（既存データ消失を防ぐ）
      try {
        const listUrl = `${CATALOG}/projects.json`;
        const listRes = await fetch(listUrl, { cache: "no-cache" });
        if (!listRes.ok) {
          console.warn(
            "projects.json fetch failed, skipping sync",
            listRes.status
          );
        } else {
          let list: any[] = (await listRes.json()) ?? [];

          // 現在のUUID行を探して更新 or 追加
          const idx = list.findIndex((x) => x.uuid === currentUuid);
          const updatedRow = {
            uuid: currentUuid,
            projectId: body.project.id,
            projectName: body.project.name,
          };
          if (idx >= 0) {
            list[idx] = updatedRow;
          } else {
            list.push(updatedRow);
          }

          // 並び替え（名称順）
          list.sort((a, b) =>
            (a.projectName || "").localeCompare(b.projectName || "", "ja")
          );

          // Lambda 経由で上書き保存
          const updateAuditHeaders = await getAuditHeaders();
          const updateRes = await fetch(CATALOG_WRITE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...updateAuditHeaders,
            },
            body: JSON.stringify({
              key: `catalog/v1/projects.json`,
              body: list,
              contentType: "application/json; charset=utf-8",
            }),
          });
          if (!updateRes.ok) {
            console.warn("projects.json update failed", await updateRes.text());
          }
        }
      } catch (err) {
        console.warn("projects.json fetch failed, skipping sync", err);
      }

      try {
        await syncAllAreaHistories({
          projectUuid: currentUuid,
          schedules: schedulesAfterUpload,
          updatedBy: displayName,
        });
      } catch (err) {
        console.error("area history 同期エラー", err);
        // ここで throw すると全体SAVEエラー扱いになるので、
        // 「プロジェクト保存は成功・エリア履歴だけ失敗」という扱いにしたいなら握りつぶす。
        // 必要なら alert だけ出すなど。
        // alert("エリア履歴への反映に失敗しました。時間をおいて再実行してください。");
      }

      // ④ 画面 state を S3 URL 版に更新
      setSchedules(schedulesAfterUpload);

      // projectData.schedules を更新して「前回保存状態」を正しく保持する
      setProjectData((p: any) => ({
        ...(p ?? {}),
        project: {
          ...(p?.project ?? {}),
          updated_at: body.project.updated_at,
          id: body.project.id,
          name: body.project.name ?? p?.project?.name ?? p?.event?.name ?? "",
          updated_by: body.project.updated_by ?? p?.project?.updated_by ?? "",
          lostDeal: Boolean(body.project?.lostDeal),
        },
        // buildIndexJsonFromState の返り値（保存したJSON）をそのまま保持する
        schedules: body.schedules,
      }));

      // ⑤ 予約削除をここで実行（index.json 保存が成功したので参照は消えている）
      if (pendingDeletes.length) {
        try {
          await deleteManyFromS3(pendingDeletes);
          setPendingDeletes([]); // 成功したのでクリア
        } catch (e) {
          console.error("Batch S3 delete failed", e);
          toast.showToast(
            "一部の画像の削除ができませんでした。しばらく時間をおいて、もう一度お試しください。",
            "error"
          );
          // 予約は残す（次回SAVEで再トライ）
        }
      }

      // ✅ S3 保存フローが最後まで成功した場合のトースト
      toast.showToast("保存しました。");
    } catch (e) {
      console.error(e);
      toast.showToast("保存ができませんでした。しばらく時間をおいて、もう一度お試しください。", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddScheduleModal = () => setShowAddScheduleModal(true); // 追加
  const closeAddScheduleModal = () => setShowAddScheduleModal(false);
  const confirmAddSchedule = () => {
    const newItem = buildNewSchedule();
    setSchedules((p) => [...p, newItem]);
    setSelectedId(newItem.id);
    setShowAddScheduleModal(false);
  };

  const duplicateSchedule = (sourceId: string) => {
    if (!sourceId) return;
    const src = schedules.find((s) => s.id === sourceId);
    if (!src) return;
    const cloned = deepClone(src);
    cloned.id = crypto.randomUUID?.() ?? String(Math.random());
    cloned.label = src.label ? `${src.label} copy` : "copy";
    setSchedules((prev) => [...prev, cloned]);
    setSelectedId(cloned.id);
    setShowAddScheduleModal(false);
  };

  const presignUpload = async (params: {
    projectId: string;
    scheduleId: string;
    filename: string;
    contentType: string;
  }): Promise<{ key: string; uploadUrl: string; publicUrl: string }> => {
    const auditHeaders = await getAuditHeaders();
    const r = await fetch(PRESIGN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auditHeaders },
      body: JSON.stringify(params),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };

  // 返り値型を変更
  const uploadToS3 = async (
    file: File,
    ctx: { projectId: string; scheduleId: string }
  ): Promise<{ key: string; publicUrl: string }> => {
    const { uploadUrl, publicUrl, key } = await presignUpload({
      projectId: ctx.projectId,
      scheduleId: ctx.scheduleId,
      filename: file.name,
      contentType: file.type || "image/jpeg",
    });
    const put = await fetch(uploadUrl, { method: "PUT", body: file });
    if (!put.ok) throw new Error(await put.text());
    return { key, publicUrl };
  };

  const deleteManyFromS3 = async (keys: string[]) => {
    if (!keys.length) return;
    const auditHeaders = await getAuditHeaders();
    const r = await fetch(DELETE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auditHeaders },
      body: JSON.stringify({ keys }),
    });
    const data = await r.json().catch(() => ({} as any));

    if (!r.ok) {
      throw new Error(data?.error || `HTTP ${r.status}`);
    }
    if (data?.ok !== true) {
      const failed = (data?.errors || [])
        .map((e: any) => e?.key)
        .filter(Boolean);
      throw new Error(
        failed.length
          ? `Partial delete failed: ${failed.length}`
          : data?.error || "delete failed"
      );
    }
  };

  // バケットの公開URL → S3キー に変換（自社ドメイン/CloudFrontにも対応できるように緩めに）
  const keyFromUrl = (url: string): string | null => {
    const m = url.match(/^https?:\/\/[^/]+\/(.+)$/);
    return m ? m[1] : null;  // decodeURIComponent はしない
  };

  const removeAt = async (idx: number) => {
    if (!selectedId) return;

    const target = (schedules.find((s) => s.id === selectedId)?.photos ?? [])[
      idx
    ] as any;

    // 物理削除はSAVE時。ここでは予約だけ入れる
    if (typeof target?.key === "string") {
      setPendingDeletes(
        (prev) => Array.from(new Set([...prev, target.key]))
      );
    } else if (
      typeof target?.url === "string" && !target.url.startsWith("blob:")) {
      const key = keyFromUrl(target.url);
      if (key) setPendingDeletes((prev) => Array.from(new Set([...prev, key])));

      // 未アップロードのblobは単に解放
      try {
        URL.revokeObjectURL(target.url);
      } catch { }
    }
    // --- state から除去 ---
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== selectedId) return s;
        const next = { ...s, photos: [...(s.photos ?? [])] };
        next.photos.splice(idx, 1);
        return next;
      })
    );
  };

  const uploadStagedPhotosIfAny = async (all: ScheduleDetail[]) => {
    if (!id) return all;
    const ctx = { projectId: String(id) };

    // シャローコピーでドラフトを作る（__file は参照を保つ）
    const next: ScheduleDetail[] = all.map((s) => ({
      ...s,
      photos: Array.isArray(s.photos)
        ? s.photos
          .map((p: any) => ({
            url: String(p?.url ?? ""),
            caption: p?.caption ?? "",
            ...(p?.key ? { key: String(p.key) } : {}),
          }))
          .filter((p: any) => p.url.length > 0)
        : [],
    }));

    for (let si = 0; si < next.length; si++) {
      const schDraft = next[si];
      const schOrig = all[si];

      if (!Array.isArray(schDraft.photos) || schDraft.photos.length === 0) continue;

      for (let pi = 0; pi < schDraft.photos.length; pi++) {
        const pDraft: any = schDraft.photos[pi];
        const pOrig: any = schOrig.photos?.[pi];
        const isBlob =
          typeof pOrig?.url === "string" && pOrig.url.startsWith("blob:");
        const hasFile = pOrig?.__file instanceof File;

        if (isBlob && hasFile) {
          const oldBlobUrl = pOrig.url;

          // アップロード先を「photos/」フォルダに変更
          const { key, publicUrl } = await uploadToS3(pOrig.__file as File, {
            ...ctx,
            scheduleId: schDraft.id, // スケジュールUUIDを渡す
          });

          // S3 URL と key を保存（__fileは除去）
          pDraft.url = publicUrl;
          pDraft.key = key;
          pDraft.originalName = pOrig.__file.name;
          delete pDraft.__file;

          try {
            URL.revokeObjectURL?.(oldBlobUrl as string);
          } catch { }
        }
      }
    }

    return next;
  }; return {
    id,
    source,
    headerTitle,
    updatedAt,
    updatedBy,
    activeTab,
    setActiveTab,
    edit,
    setEdit,
    projectData,
    setProjectData,
    schedules,
    sortedSchedules,
    setSchedules,
    selectedId,
    setSelectedId,
    currentSchedule,
    isSaving,
    handleSave,
    updateSchedule,
    requestDeleteCurrent,
    showAddScheduleModal,
    openAddScheduleModal,
    closeAddScheduleModal,
    confirmAddSchedule,
    copySourceId,
    setCopySourceId,
    duplicateSchedule,
    removeAt,
  };
}
