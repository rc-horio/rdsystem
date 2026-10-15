import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  AREA_AXIS_CHOICE_LABEL,
  AREA_AXIS_LABEL,
  AREA_AXIS_ORDER,
  AREA_AXIS_TOGGLE_ORDER,
  EMPTY_AREA_AXIS_FILTER,
  SALES_FILTER_LABEL,
  SALES_STATUS_FILTER_ORDER,
  salesFilterSummary,
  type AreaAxisFilter,
} from "./detailBar/helpers";
import {
  AREA_SORT_DEFAULT_DIR,
  areaSortDirLabel,
  type AreaSortDir,
  type AreaSortType,
} from "./sideListSort";

type Props = {
  sortType: AreaSortType;
  sortDir: AreaSortDir;
  setSortType: Dispatch<SetStateAction<AreaSortType>>;
  setSortDir: Dispatch<SetStateAction<AreaSortDir>>;
  axisFilter: AreaAxisFilter;
  setAxisFilter: Dispatch<SetStateAction<AreaAxisFilter>>;
  salesFilterOpen: boolean;
  setSalesFilterOpen: Dispatch<SetStateAction<boolean>>;
  salesFilterRef: RefObject<HTMLDivElement>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
};

export function SideListSearch({
  sortType,
  sortDir,
  setSortType,
  setSortDir,
  axisFilter,
  setAxisFilter,
  salesFilterOpen,
  setSalesFilterOpen,
  salesFilterRef,
  searchQuery,
  setSearchQuery,
}: Props) {
  return (
    <div id="searchWrap" role="search" aria-label="Search markers">
      <div id="searchHint" aria-live="polite" />
      <div className="search-controls">
        <div className="search-control-row">
          <label htmlFor="sortSelect" className="search-sort-filter-label">
            <span className="search-sort-icon" aria-hidden="true">⇅</span>
            並べ替え
          </label>
          <div className="search-sort-fields">
            <div className="search-sort-select-wrap">
              <select
                id="sortSelect"
                value={sortType}
                onChange={(e) => {
                  const next = e.target.value as AreaSortType;
                  setSortType(next);
                  setSortDir(AREA_SORT_DEFAULT_DIR[next]);
                }}
                className="search-sort-select"
                aria-label="並べ替えの項目を選択"
              >
                <option value="updated">更新日</option>
                <option value="prefecture">都道府県</option>
                <option value="droneCount">機体数</option>
                <option value="name">エリア名</option>
              </select>
              <span className="search-sort-select-caret" aria-hidden="true">
                ▼
              </span>
            </div>
            <button
              type="button"
              className="search-sort-dir"
              aria-label={`現在は${areaSortDirLabel(sortType, sortDir)}。クリックで${areaSortDirLabel(
                sortType,
                sortDir === "desc" ? "asc" : "desc"
              )}`}
              title={areaSortDirLabel(sortType, sortDir)}
              onClick={() =>
                setSortDir((current) => (current === "desc" ? "asc" : "desc"))
              }
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>
        <div className="search-control-row search-control-row--filters">
          <span className="search-sort-filter-label">
            <span className="search-sort-icon" aria-hidden="true">
              <svg
                className="search-filter-icon"
                viewBox="0 0 12 12"
                width="12"
                height="12"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M1.2 1.5h9.6L7.2 6.3v3.4L4.8 11V6.3L1.2 1.5z"
                />
              </svg>
            </span>
            フィルター
          </span>
          <div className="search-kind-options" role="group" aria-label="フィルター">
            {AREA_AXIS_ORDER.map((axis) => (
              <div
                key={axis}
                className={`search-axis-row search-axis-row--${axis}`}
                role="group"
                aria-label={AREA_AXIS_LABEL[axis]}
              >
                <span className="search-axis-label">
                  <span
                    className={`area-kind-dot area-kind-dot--${axis}`}
                    aria-hidden="true"
                  />
                  {AREA_AXIS_LABEL[axis]}
                </span>
                <div className="search-axis-segment">
                  {AREA_AXIS_TOGGLE_ORDER.map((choice) => {
                    const pressed = axisFilter[axis] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        className="search-axis-chip"
                        aria-pressed={pressed}
                        aria-label={`${AREA_AXIS_LABEL[axis]} ${AREA_AXIS_CHOICE_LABEL[choice]}`}
                        onClick={() => {
                          setAxisFilter((prev) => ({
                            ...prev,
                            [axis]: prev[axis] === choice ? "any" : choice,
                          }));
                        }}
                      >
                        {AREA_AXIS_CHOICE_LABEL[choice]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div
              className="search-axis-row search-axis-row--considering"
              role="group"
              aria-label={SALES_FILTER_LABEL}
            >
              <span className="search-axis-label">
                <span
                  className="area-kind-dot area-kind-dot--considering"
                  aria-hidden="true"
                />
                {SALES_FILTER_LABEL}
              </span>
              <div className="search-axis-multiselect" ref={salesFilterRef}>
                <button
                  type="button"
                  id="salesStatusFilter"
                  className="search-axis-multiselect-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={salesFilterOpen}
                  aria-label={`${SALES_FILTER_LABEL}のステータス`}
                  onClick={() => setSalesFilterOpen((open) => !open)}
                >
                  <span className="search-axis-multiselect-value">
                    {salesFilterSummary(axisFilter.sales)}
                  </span>
                  <span className="search-sort-select-caret" aria-hidden="true">
                    ▼
                  </span>
                </button>
                {salesFilterOpen && (
                  <div
                    className="search-axis-multiselect-menu"
                    role="listbox"
                    aria-multiselectable="true"
                    aria-label={`${SALES_FILTER_LABEL}のステータス`}
                  >
                    {SALES_STATUS_FILTER_ORDER.map((status) => {
                      const checked = axisFilter.sales.includes(status);
                      return (
                        <label
                          key={status}
                          className="search-axis-multiselect-option"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setAxisFilter((prev) => {
                                const next = prev.sales.includes(status)
                                  ? prev.sales.filter((s) => s !== status)
                                  : SALES_STATUS_FILTER_ORDER.filter(
                                      (s) =>
                                        s === status || prev.sales.includes(s)
                                    );
                                return { ...prev, sales: next };
                              });
                            }}
                          />
                          {status}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="search-control-row search-control-row--clear">
          <button
            type="button"
            className="search-clear-button"
            onClick={() => {
              setSearchQuery("");
              setSortType("updated");
              setSortDir(AREA_SORT_DEFAULT_DIR.updated);
              setAxisFilter(EMPTY_AREA_AXIS_FILTER);
            }}
            aria-label="検索・並べ替え・フィルターをクリア"
          >
            検索条件クリア
          </button>
        </div>
      </div>
      <div className="search-field">
        <label htmlFor="searchBox" className="sr-only">
          エリア名・都道府県名などで既存エリア検索
        </label>
        <input
          id="searchBox"
          type="text"
          placeholder="エリア名・都道府県名などで既存エリア検索"
          autoComplete="off"
          inputMode="search"
          aria-describedby="searchHint"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            className="search-field__clear"
            aria-label="検索ワードをクリア"
            onClick={() => {
              setSearchQuery("");
              document.getElementById("searchBox")?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
