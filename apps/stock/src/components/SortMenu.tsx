import { useState, useRef, useEffect } from "react";

export type SortKey =
  | "planesAsc"
  | "planesDesc"
  | "dateAsc"
  | "dateDesc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "planesAsc", label: "機体数（少 → 多）" },
  { value: "planesDesc", label: "機体数（多 → 少）" },
  { value: "dateAsc", label: "古い順" },
  { value: "dateDesc", label: "新しい順" },
];

interface SortMenuProps {
  onSort: (key: SortKey) => void;
}

export function SortMenu({ onSort }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <nav ref={menuRef} className="cascading-menu stock-sort-menu">
      <ul>
        <li
          className={`root has-sub stock-sort-btn ${open ? "open" : ""}`}
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
          ソート
          <ul>
            {SORT_OPTIONS.map((o) => (
              <li
                key={o.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onSort(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
}
