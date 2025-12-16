// src/pages/HubPage/useHubPageState.ts
import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import {
  buildIndexJsonFromState,
  buildSchedulesFromProjectData,
} from "./builders";
import { v4 as uuid } from "uuid";

// 写真アップロード用のLambda関数API
const PRESIGN_API =
  "https://k5nnpin5wvwzkcl6is5vbdzlb40mkpqk.lambda-url.ap-northeast-1.on.aws/";

// 写真削除用のLambda関数API
const DELETE_API =
  "https://wxhn4vu2b7nz2gvdkix7xj7k4u0bsydf.lambda-url.ap-northeast-1.on.aws/";

// 
const AREAS_BASE_URL =
  "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/areas";

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

  const [activeTab, setActiveTab] = useState<
    "リソース管理" | "オペレーション" | "エリア情報" | "現場写真"
  >("リソース管理");
  const [edit, setEdit] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScheduleDetail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localFileHandle, setLocalFileHandle] =
    useState<FileSystemFileHandle | null>(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [copySourceId, setCopySourceId] = useState<string>("");

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
    return schedLabel ? `${base}　${schedLabel}` : base;
  }, [eventDisplay, currentSchedule?.label]);

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
        // flight_area: {
        //   altitude_min_m: null,
        //   altitude_max_m: null,
        //   safety_area_m: null,
        // },
        actions: { liftoff: "", turn: "" },
        obstacle_note: "",
        lights: { takeoff: "", landing: "" },
        return_note: "",
        animation_area: { width_m: null, depth_m: null },
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
    };
  };

  // 既存の「JSON保存用 Lambda」を使って任意のJSONを書き込むヘルパー
  const putJsonViaLambda = async (params: { key: string; body: any }) => {
    const res = await fetch(
      "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: params.key,
          body: params.body,
          contentType: "application/json; charset=utf-8",
        }),
      }
    );
    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!res.ok || data?.error) throw new Error(data?.error ?? raw);
  };

  type AreaIndexJson = {
    overview?: any;
    details?: any;
    history?: { uuid: string; projectuuid: string; scheduleuuid: string }[];
    candidate?: any[];
    updated_at?: string;
    updated_by?: string;
  };

  // 1つの areaUuid / scheduleId について history を追記
  const appendAreaHistory = async (params: {
    areaUuid: string;
    projectUuid: string;
    scheduleUuid: string;
  }) => {
    const { areaUuid, projectUuid, scheduleUuid } = params;

    const url = `${AREAS_BASE_URL}/${areaUuid}/index.json`;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.error("area index.json fetch failed", areaUuid, res.status);
      return; // 取れない場合はスキップ（必要なら throw にしても良い）
    }

    const json = (await res.json()) as AreaIndexJson;
    const history = json.history ?? [];

    // 同じ (projectuuid, scheduleuuid) が既に入っていたら二重登録しない
    const exists = history.some(
      (h) => h.projectuuid === projectUuid && h.scheduleuuid === scheduleUuid
    );
    if (!exists) {
      history.push({
        uuid: "", // 仕様に合わせて空文字。必要ならここで uuid() でもOK
        projectuuid: projectUuid,
        scheduleuuid: scheduleUuid,
      });
    }

    json.history = history;
    json.updated_at = new Date().toISOString();
    json.updated_by = "ui"; // 既存の形式に合わせる

    await putJsonViaLambda({
      key: `catalog/v1/areas/${areaUuid}/index.json`,
      body: json,
    });
  };

  // 1つのエリアについて、「このプロジェクトの history を現在の状態に合わせて差し替える」
  const syncAreaHistoryForArea = async (params: {
    areaUuid: string;
    projectUuid: string;
    scheduleUuids: string[];
  }) => {
    const { areaUuid, projectUuid, scheduleUuids } = params;

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
    json.updated_by = "ui";

    await putJsonViaLambda({
      key: `catalog/v1/areas/${areaUuid}/index.json`,
      body: json,
    });
  };


  // schedules 全体から area_uuid ごとにまとめて、各エリアの history を同期
  // schedules 全体から area_uuid ごとにまとめて、各エリアの history を同期
  const syncAllAreaHistories = async (params: {
    projectUuid: string;
    schedules: ScheduleDetail[];
  }) => {
    const { projectUuid, schedules } = params;

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
            : `https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/projects/${id}/index.json`;
        if (source === "s3" && !id) return;

        // init=1 の場合は“空”で開始（ただし duplicateFrom 指定時はコピー読込）
        if (isInit) {
          if (duplicateFrom) {
            // 1) 複製元の index.json を取得
            const srcUrl = `https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/projects/${duplicateFrom}/index.json`;

            let copied: any | null = null;
            try {
              const r = await fetch(srcUrl, { cache: "no-cache" });
              if (r.ok) {
                copied = await r.json();
              }
            } catch { }

            if (copied) {
              // 2) 複製用の整形：名称に（複製）を付与、更新情報リセット
              const dup = {
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
              };
              const built = buildSchedulesFromProjectData(dup);

              // モーダルで日付が入っていたら、その日付のスケジュールを優先選択。
              // 見つからなければ1件追加して選択。
              let nextSchedules = built;
              let selected: string | null = built[0]?.id ?? null;
              if (initDate) {
                const match = built.find((s) => (s.date || "") === initDate);
                if (match) {
                  selected = match.id;
                } else {
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

          // 複製元なし or 取得失敗 → 空で開始
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
          // モーダルに日付があれば、その日付のスケジュールを1件作成して選択
          if (initDate) {
            const first = buildNewSchedule({
              date: initDate,
              label: initLabel || "",
            });
            setProjectData(empty);
            setSchedules([first]);
            setSelectedId(first.id);
          } else {
            setProjectData(empty);
            setSchedules([]);
            setSelectedId(null);
          }
          setEdit(false);
          return;
        }

        let res = await fetch(makeUrl(), { cache: "no-cache" });
        // local の場合のフォールバック（既存仕様）
        if (source === "local" && res.status === 404 && id) {
          const fb = `https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/projects/${id}/index.json`;
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
          setProjectData(empty);
          setSchedules([]);
          setSelectedId(null);
          setEdit(false);
          return;
        }

        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        // 既存データに id が無ければ補完（後方互換）
        if (id) {
          // uuid が無ければ補完（これはOK）
          if (!data?.project) data.project = {};
          if (!data.project.uuid) data.project.uuid = id;

          // 命名IDは「無いなら空」のまま（uuidで埋めない）
          if (!data.project.id) data.project.id = "";
        }
        setProjectData(data);
        const built = buildSchedulesFromProjectData(data);
        setSchedules(built);
        setSelectedId(built[0]?.id ?? null);
      } catch (e) {
        console.error("プロジェクト取得エラー", e);
      }
    })();
  }, [id, source, isInit]);

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
    const body = buildIndexJsonFromState(
      projectData,
      normalizedSchedules,
      currentProjectId
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
          },
        }));

        // ✅ ローカル保存成功時のポップアップ
        alert("保存しました。");

        return;
      } catch (e) {
        console.error("local save error", e);
        alert("保存に失敗しました。時間をおいて再実行してください。");
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
        currentProjectId
      );

      // ③ 既存の JSON 保存 Lambda を叩く
      const res = await fetch(
        "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: `catalog/v1/projects/${currentUuid}/index.json`,
            body,
            contentType: "application/json; charset=utf-8",
          }),
        }
      );
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok || data?.error) throw new Error(data?.error ?? raw);

      // 🟢 projects.json も同期（projectId / projectName 変更時）
      try {
        const listUrl =
          "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/projects.json";
        const listRes = await fetch(listUrl, { cache: "no-cache" });
        let list: any[] = [];
        if (listRes.ok) {
          list = (await listRes.json()) ?? [];
        }

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
        const updateRes = await fetch(
          "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: `catalog/v1/projects.json`,
              body: list,
              contentType: "application/json; charset=utf-8",
            }),
          }
        );
        if (!updateRes.ok) {
          console.warn("projects.json update failed", await updateRes.text());
        }
      } catch (err) {
        console.error("projects.json 同期エラー", err);
      }

      try {
        await syncAllAreaHistories({
          projectUuid: currentUuid,
          schedules: schedulesAfterUpload,
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
      setProjectData((p: any) => ({
        ...(p ?? {}),
        project: {
          ...(p?.project ?? {}),
          updated_at: body.project.updated_at,
          id: body.project.id,
        },
      }));

      // ⑤ 予約削除をここで実行（index.json 保存が成功したので参照は消えている）
      if (pendingDeletes.length) {
        try {
          await deleteManyFromS3(pendingDeletes);
          setPendingDeletes([]); // 成功したのでクリア
        } catch (e) {
          console.error("Batch S3 delete failed", e);
          alert(
            "一部の画像が物理削除できませんでした。時間をおいて再実行してください。"
          );
          // 予約は残す（次回SAVEで再トライ）
        }
      }

      // ✅ S3 保存フローが最後まで成功した場合のポップアップ
      alert("保存しました。");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。時間をおいて再実行してください。");
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
    const r = await fetch(PRESIGN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const r = await fetch(DELETE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
