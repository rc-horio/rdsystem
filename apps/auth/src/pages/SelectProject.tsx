// apps/auth/src/pages/SelectProject.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrandHeader, validateProjectId } from "@/components";
import { signOut } from "aws-amplify/auth";
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";

// 環境変数からHubとMapのベースURLを取得
const HUB_BASE = String(import.meta.env.VITE_HUB_BASE_URL || "");
const MAP_BASE = String(import.meta.env.VITE_MAP_BASE_URL || "");

// 安全な結合 util（末尾/先頭スラッシュを吸収）
const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const LIST_URL =
  "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/projects.json";
const LAMBDA_URL =
  "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws";

interface ProjectMeta {
  uuid: string;
  projectId: string;
  projectName: string;
}

type ListRow = {
  uuid: string;
  projectId: string;
  projectName: string;
};

const toSlug = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z_-]+/g, "")
    .slice(0, 24);

async function upsertProjectList(row: ListRow): Promise<ListRow[]> {
  let list: ListRow[] = [];
  try {
    const r = await fetch(LIST_URL, { cache: "no-cache" });
    if (r.ok) {
      const json = await r.json();
      if (Array.isArray(json)) list = json;
    }
  } catch (e) {
    console.warn("[SelectProject] fetch projects.json failed", e);
  }

  const next = list.filter((x) => x.uuid !== row.uuid);
  next.push(row);
  next.sort((a, b) =>
    (a.projectName || "").localeCompare(b.projectName || "", "ja")
  );

  const res = await fetch(LAMBDA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: `catalog/v1/projects.json`,
      body: next,
      contentType: "application/json; charset=utf-8",
    }),
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok || data?.error) throw new Error(data?.error ?? raw);
  return next;
}

/* =========================
  プロジェクト選択ページ（SP/PC）
========================= */
export default function SelectProject() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const usedIds = projects.map((p) => p.projectId.toLowerCase());
  const [selectedProject, setSelectedProject] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"blank" | "duplicate">("blank");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newId, setNewId] = useState("");
  const [idError, setIdError] = useState("");
  const [dupSourceId, setDupSourceId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const modes = ["Hub", "Map"] as const;
  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];
  const nextMode = () => setModeIndex((i) => (i + 1) % modes.length);
  const prevMode = () =>
    setModeIndex((i) => (i - 1 + modes.length) % modes.length);

  const navigate = useNavigate();

  const projectOptions = projects.map((p) => ({
    value: p.projectId,
    label: `${p.projectId.slice(0, 6)}-${p.projectName}`,
  }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(LIST_URL, { cache: "no-cache" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json: ProjectMeta[] = await res.json();
        json.sort((a, b) => a.projectName.localeCompare(b.projectName, "ja"));
        setProjects(json);
      } catch (e) {
        console.error("[SelectProject] projects.json fetch error", e);
        setError("プロジェクト一覧の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const inferYearFromId = (pid: string) => {
    const m = (pid || "").match(/^(\d{2})/);
    return m ? String(2000 + Number(m[1])) : "";
  };

  const handleJoin = () => {
    if (mode === "Map") {
      // 別アプリ（5175 or /map/）へフルURLで遷移
      window.location.assign(MAP_BASE);
      return;
    }
    if (!selectedProject) {
      alert("プロジェクトを選択してください");
      return;
    }
    const qp = new URLSearchParams({ source: "s3" });
    const year = inferYearFromId(selectedProject);
    if (year) qp.set("year", year);

    // UUIDで遷移
    const meta = projects.find((p) => p.projectId === selectedProject);
    if (meta?.uuid) {
      const url = join(HUB_BASE, meta.uuid) + `?${qp.toString()}`;
      window.location.assign(url);
    } else {
      alert("選択したプロジェクトのUUIDが見つかりません。");
    }
  };

  const openCreateModal = () => {
    setCreateMode("blank");
    setNewName("");
    setNewDate("");
    setNewId("");
    setIdError("");
    setDupSourceId("");
    setShowCreateModal(true);
  };

  const confirmCreate = () => {
    if (!newId.trim()) {
      setIdError("IDを入力してください");
      return;
    }
    const err = validateProjectId(newId);
    setIdError(err);
    if (err) return;

    const newUuid = uuidv4();
    const qp = new URLSearchParams({ source: "s3", init: "1" });
    qp.set("uuid", newUuid);

    if (newName.trim()) qp.set("name", newName.trim());
    qp.set("projectId", newId);

    const yyFromId = (() => {
      const m = newId.match(/^(\d{2})/);
      return m ? String(2000 + Number(m[1])) : null;
    })();
    if (yyFromId) qp.set("year", yyFromId);

    (async () => {
      try {
        // --- 1️⃣ projects.json に追加 ---
        const row: ListRow = {
          uuid: newUuid,
          projectId: newId,
          projectName: newName.trim() || newId,
        };
        const updated = await upsertProjectList(row);
        setProjects(updated as ProjectMeta[]);

        // --- 2️⃣ 新規プロジェクト用の正式な index.json 構造を作成 ---
        const emptyProjectData = {
          project: {
            uuid: newUuid,
            id: newId,
            name: newName.trim() || newId,
            updated_at: new Date().toISOString(),
            updated_by: "テストユーザー",
          },
          schedules: [],
        };

        await fetch(LAMBDA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: `catalog/v1/projects/${newUuid}/index.json`,
            body: emptyProjectData,
            contentType: "application/json; charset=utf-8",
          }),
        });
      } catch (e) {
        console.error("[SelectProject] projects.json update error", e);
      } finally {
        const url = join(HUB_BASE, newUuid) + `?${qp.toString()}`;
        window.location.assign(url);
        setShowCreateModal(false);
      }
    })();
  };

  // === ログアウト ===
  const handleLogout = async () => {
    try {
      await signOut({ global: true }); // Hosted UIのlogout_uriへ→戻る
    } catch {
      // 念のためのフォールバック
      window.location.replace("/");
    }
  };

  return (
    <>
      {/* ===== SP（モバイル） ===== */}
      <div className="md:hidden min-h-dvh bg-linear-to-br from-slate-950 to-slate-900 pt-safe pb-safe px-safe relative">
        <BrandHeader />

        {/* 右上にログアウト */}
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>

        <div className="px-4 pb-8 grid place-items-center">
          <div className="w-full max-w-md space-y-6 p-6 sm:p-10">
            {/* モード切替 */}
            <div
              className="flex items-center justify-center text-white font-semibold tracking-wide select-none caret-transparent"
              contentEditable={false}
            >
              <button onClick={prevMode} className="text-1xl px-10">
                ◀
              </button>
              <span className="text-xl flex-1 text-center">{`RD ${mode}`}</span>
              <button onClick={nextMode} className="text-1xl px-10">
                ▶
              </button>
            </div>

            {/* コンテンツ */}
            <div className="min-h-[140px] flex items-center">
              {loading ? (
                <p className="w-full text-center text-slate-300">loading…</p>
              ) : error ? (
                <p className="w-full text-center text-red-400">{error}</p>
              ) : mode === "Hub" ? (
                <div className="w-full">
                  <p className="text-center text-sm text-slate-300">
                    select a project to continue
                  </p>
                  <div className="w-10/12 max-w-80 mx-auto mt-2">
                    <label className="block space-y-1">
                      <Select
                        options={projectOptions}
                        value={
                          projectOptions.find(
                            (o) => o.value === selectedProject
                          ) ?? null
                        }
                        onChange={(opt) => setSelectedProject(opt?.value ?? "")}
                        placeholder="-- Select a project --"
                        isClearable
                        isSearchable
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            backgroundColor: "rgba(15,23,42,0.6)",
                            borderColor: state.isFocused
                              ? "#dc2626"
                              : "#475569",
                            boxShadow: state.isFocused
                              ? "0 0 0 1px #dc2626"
                              : "none",
                            "&:hover": {
                              borderColor: "#dc2626",
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "#020617",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                              ? "#1e293b"
                              : "transparent",
                            color: "#e5e7eb",
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "#e5e7eb",
                          }),
                          input: (base) => ({
                            ...base,
                            color: "#e5e7eb",
                          }),
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center text-slate-400">
                  <p className="text-sm tracking-wide">
                    Click "join" to open the map interface
                  </p>
                </div>
              )}
            </div>

            {/* ボタン群 */}
            <div className="grid gap-2 grid-rows-[42px_auto]">
              {mode === "Hub" ? (
                <button
                  onClick={openCreateModal}
                  className="w-full py-2 font-semibold text-white hover:underline active:scale-95 transition"
                >
                  {/* create / duplicate project */}
                  create project
                </button>
              ) : (
                <div className="invisible h-[42px]" aria-hidden />
              )}

              <button
                type="button"
                onClick={handleJoin}
                className="w-10/12 max-w-80 mx-auto rounded-lg bg-red-600 py-2 font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition"
              >
                join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PC（md以上） ===== */}
      <div className="hidden md:block min-h-screen bg-linear-to-br from-slate-950 to-slate-900 relative">
        <BrandHeader />

        {/* 右上にログアウト */}
        <div className="absolute right-6 top-6 z-10">
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>

        <div className="px-4 pb-12 grid place-items-center">
          <div className="w-full max-w-md space-y-6 p-10">
            {/* モード切替 */}
            <div
              className="flex items-center justify-center text-white font-semibold tracking-wide"
              contentEditable={false}
            >
              <button
                type="button"
                onClick={prevMode}
                className="text-1xl px-10"
              >
                ◀
              </button>
              <span className="text-xl flex-1 text-center">{`RD ${mode}`}</span>
              <button
                type="button"
                onClick={nextMode}
                className="text-1xl px-10"
              >
                ▶
              </button>
            </div>

            {/* コンテンツ */}
            <div className="min-h-[140px] flex items-center">
              {loading ? (
                <p className="w-full text-center text-slate-300">loading…</p>
              ) : error ? (
                <p className="w-full text-center text-red-400">{error}</p>
              ) : mode === "Hub" ? (
                <div className="w-full">
                  <p className="text-center text-sm text-slate-300">
                    select a project to continue
                  </p>
                  <label className="block space-y-1 mt-2">
                    <Select
                      options={projectOptions}
                      value={
                        projectOptions.find(
                          (o) => o.value === selectedProject
                        ) ?? null
                      }
                      onChange={(opt) => setSelectedProject(opt?.value ?? "")}
                      placeholder="-- Select a project --"
                      isClearable
                      isSearchable
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          backgroundColor: "rgba(15,23,42,0.6)",
                          borderColor: state.isFocused ? "#dc2626" : "#475569",
                          boxShadow: state.isFocused
                            ? "0 0 0 1px #dc2626"
                            : "none",
                          "&:hover": {
                            borderColor: "#dc2626",
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: "#020617",
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused
                            ? "#1e293b"
                            : "transparent",
                          color: "#e5e7eb",
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "#e5e7eb",
                        }),
                        input: (base) => ({
                          ...base,
                          color: "#e5e7eb",
                        }),
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="w-full text-center text-slate-400">
                  <p className="text-sm tracking-wide">
                    Click "join" to open the map interface
                  </p>
                </div>
              )}
            </div>

            {/* ボタン群 */}
            <div className="grid gap-2 grid-rows-[42px_auto]">
              {mode === "Hub" ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full py-2 font-semibold text-white hover:underline active:scale-95 transition"
                >
                  {/* create / duplicate project */}
                  create project
                </button>
              ) : (
                <div className="invisible h-[42px]" aria-hidden />
              )}

              <button
                type="button"
                onClick={handleJoin}
                className="w-full rounded-lg bg-red-600 py-2 font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition"
              >
                join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Create / Duplicate Modal（共通） ---- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="
              w-[min(92vw,28rem)] rounded-xl bg-slate-900 border border-slate-700 shadow-xl
              p-4 sm:p-6
              grid grid-rows:[auto_auto_1fr_auto] gap-4
              h-auto max-h-[85dvh] overflow-hidden
            "
          >
            <h3
              className="text-lg font-semibold text-white"
              contentEditable={false}
            >
              プロジェクト作成
            </h3>

            {/* <div className="flex gap-2" contentEditable={false}>
              {(["blank", "duplicate"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCreateMode(m)}
                  className={`flex-1 h-10 rounded-lg border ${
                    createMode === m
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-slate-600 bg-slate-800 text-slate-200"
                  }`}
                >
                  {m === "blank" ? "新規作成" : "既存を複製"}
                </button>
              ))}
            </div> */}

            <div className="space-y-4" style={{ scrollbarGutter: "stable" }}>
              {createMode === "duplicate" && (
                <label className="block space-y-1" contentEditable={false}>
                  <span className="text-sm text-slate-300">
                    複製元プロジェクト
                  </span>

                  <select
                    value={dupSourceId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      setDupSourceId(pid);
                      const meta = projects.find((p) => p.projectId === pid);
                      if (meta && !newName) {
                        setNewName(`${meta.projectName} copy`);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-red-500 focus:ring-2 focus:ring-red-500 outline-none transition"
                  >
                    <option value="">-- Select a project --</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {`${p.projectId.slice(0, 6)}-${p.projectName}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* ▼ 入力欄 ▼ */}
              <label className="block space-y-1">
                <span className="text-sm text-slate-300">案件名</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-slate-100 focus:border-red-500 focus:ring-2 focus:ring-red-500 outline-none transition"
                  placeholder="案件名を入力"
                />
              </label>
              <label className="block space-y-1" contentEditable={false}>
                <span className="text-sm font-medium text-slate-200">
                  プロジェクトID（ yymmdd + 半角英数字 ）
                </span>
                <input
                  value={newId}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    setNewId(val);
                    setIdError(val ? validateProjectId(val) : "");
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-slate-100 bg-slate-900/60 outline-none transition ${
                    idError
                      ? "border-red-500 focus:ring-2 focus:ring-red-500"
                      : "border-slate-600 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                  }`}
                  placeholder="250101project"
                />
                {idError && (
                  <p className="text-sm text-red-400 mt-1">{idError}</p>
                )}
              </label>
              {/* ▲ 入力欄 ▲ */}
            </div>

            <div>
              <div className="flex justify-end gap-2 pt-15">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={confirmCreate}
                  disabled={!!idError || !newId}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
