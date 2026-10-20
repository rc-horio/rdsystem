import { useState } from "react";
import clsx from "clsx";

export type ProjectSortType = "date" | "droneCount";
export type ProjectSortDir = "asc" | "desc";
export type ProjectFilterKey = "flash" | "fireworks" | "takeoffBox";

export const PROJECT_SORT_DEFAULT_DIR: Record<ProjectSortType, ProjectSortDir> = {
  date: "desc",
  droneCount: "desc",
};

const SORTS: { key: ProjectSortType; label: string }[] = [
  { key: "date", label: "開催日" },
  { key: "droneCount", label: "機体数" },
];

const FILTERS: { key: ProjectFilterKey; label: string }[] = [
  { key: "flash", label: "フラッシュ" },
  { key: "fireworks", label: "花火" },
  { key: "takeoffBox", label: "離発着ボックス" },
];

const MODEL_OPTIONS = ["EMO", "FYLO", "Hula", "RiFF", "TAKE"];
const WORD_OPTIONS = ["草刈り", "トラブル", "パレット", "ブルーシート"];

function sortDirLabel(type: ProjectSortType, dir: ProjectSortDir) {
  if (type === "droneCount") return dir === "desc" ? "多い順" : "少ない順";
  return dir === "desc" ? "新しい順" : "古い順";
}

function ChecklistFilter({
  label,
  options,
  selected,
  onToggleValue,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggleValue: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((name) => {
          const checked = selected.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={checked}
              onClick={() => onToggleValue(name)}
              className={chipClass(checked)}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function chipClass(on: boolean) {
  return clsx(
    "rounded-md border px-2.5 py-1.5 text-xs leading-none transition",
    on
      ? "border-red-600 bg-red-600 text-white"
      : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
  );
}

export function ProjectSearchControls({
  sortType,
  sortDir,
  filters,
  onSortTypeChange,
  onSortDirChange,
  onFilterToggle,
}: {
  sortType: ProjectSortType;
  sortDir: ProjectSortDir;
  filters: Record<ProjectFilterKey, boolean>;
  onSortTypeChange: (v: ProjectSortType) => void;
  onSortDirChange: (v: ProjectSortDir) => void;
  onFilterToggle: (key: ProjectFilterKey) => void;
}) {
  const otherDir: ProjectSortDir = sortDir === "desc" ? "asc" : "desc";
  const [models, setModels] = useState<string[]>([]);
  const [words, setWords] = useState<string[]>([]);

  const toggleValue = (
    current: string[],
    value: string,
    options: string[],
    setCurrent: (next: string[]) => void
  ) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setCurrent(options.filter((name) => next.has(name)));
  };

  return (
    <div
      className="space-y-3 bg-slate-900 px-3 py-3"
      role="search"
      aria-label="案件の並べ替えとフィルター"
    >
      <div>
        <p className="mb-1.5 text-[11px] text-slate-400">並べ替え</p>
        <div className="flex items-center gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={sortType === s.key}
              onClick={() => onSortTypeChange(s.key)}
              className={chipClass(sortType === s.key)}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-sm text-slate-100 hover:bg-slate-700"
            aria-label={`現在は${sortDirLabel(sortType, sortDir)}。クリックで${sortDirLabel(sortType, otherDir)}`}
            title={sortDirLabel(sortType, sortDir)}
            onClick={() => onSortDirChange(otherDir)}
          >
            {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[11px] text-slate-400">フィルター</p>
        <ChecklistFilter
          label="機種"
          options={MODEL_OPTIONS}
          selected={models}
          onToggleValue={(value) =>
            toggleValue(models, value, MODEL_OPTIONS, setModels)
          }
        />
        <div>
          <p className="mb-1.5 text-[11px] text-slate-400">タグ</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="タグ">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filters[f.key]}
                onClick={() => onFilterToggle(f.key)}
                className={chipClass(filters[f.key])}
              >
                {f.label}
              </button>
            ))}
            {WORD_OPTIONS.map((name) => {
              const checked = words.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleValue(words, name, WORD_OPTIONS, setWords)}
                  className={chipClass(checked)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
