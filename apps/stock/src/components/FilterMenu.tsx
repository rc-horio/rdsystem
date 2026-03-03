import { useState, useRef, useEffect } from "react";

type FilterType = "planes" | "season" | "category";
type FilterValue = string;

const PLANE_OPTIONS = [
  { value: "0000", label: "すべて表示" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String((i + 1) * 100).padStart(4, "0"),
    label: `${(i + 1) * 100}機`,
  })),
];

const SEASON_OPTIONS = [
  { value: "0000", label: "すべて表示" },
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
  { value: "autumn", label: "秋" },
  { value: "winter", label: "冬" },
];

const CATEGORY_OPTIONS = [
  { value: "0000", label: "すべて表示" },
  { value: "food", label: "食べ物" },
  { value: "animal", label: "動物" },
  { value: "insect", label: "虫" },
  { value: "plant", label: "植物" },
  { value: "building", label: "建物" },
  { value: "nature", label: "自然" },
  { value: "text", label: "文字" },
  { value: "symbol", label: "記号" },
  { value: "vehicle", label: "乗り物" },
  { value: "character", label: "キャラクター" },
  { value: "object", label: "アイテム" },
];

interface FilterMenuProps {
  onFilter: (type: FilterType, value: FilterValue) => void;
}

export function FilterMenu({ onFilter }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [planesOpen, setPlanesOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPlanesOpen(false);
        setSeasonOpen(false);
        setCategoryOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSelect = (type: FilterType, value: FilterValue) => {
    onFilter(type, value);
    setOpen(false);
    setPlanesOpen(false);
    setSeasonOpen(false);
    setCategoryOpen(false);
  };

  return (
    <nav ref={menuRef} className="cascading-menu stock-filter-menu">
      <ul>
        <li
          className={`root has-sub stock-filter-btn ${open ? "open" : ""}`}
          onClick={() => setOpen(!open)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          フィルター
          <ul>
            <li
              className={`has-sub ${planesOpen ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setPlanesOpen((prev) => !prev);
                setSeasonOpen(false);
                setCategoryOpen(false);
              }}
            >
              機体数
              <ul>
                {PLANE_OPTIONS.map((o) => (
                  <li
                    key={o.value}
                    data-type="planes"
                    data-value={o.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect("planes", o.value);
                    }}
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </li>
            <li
              className={`has-sub ${seasonOpen ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setPlanesOpen(false);
                setSeasonOpen((prev) => !prev);
                setCategoryOpen(false);
              }}
            >
              季節
              <ul>
                {SEASON_OPTIONS.map((o) => (
                  <li
                    key={o.value}
                    data-type="season"
                    data-value={o.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect("season", o.value);
                    }}
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </li>
            <li
              className={`has-sub ${categoryOpen ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setPlanesOpen(false);
                setSeasonOpen(false);
                setCategoryOpen((prev) => !prev);
              }}
            >
              カテゴリー
              <ul>
                {CATEGORY_OPTIONS.map((o) => (
                  <li
                    key={o.value}
                    data-type="category"
                    data-value={o.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect("category", o.value);
                    }}
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
