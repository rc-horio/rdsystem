import { useRef, useState, useCallback, useEffect } from "react";
import type { MotifData } from "@/types/stock";
import type { SortKey } from "./SortMenu";
import { ASSETS_BASE } from "@/lib/assetsBase";

/** 失敗した画像の state 更新をバッチ化（再レンダー削減） */
const BATCH_MS = 150;

function toInt(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sortMotifs(motifs: MotifData[], order: SortKey): MotifData[] {
  return [...motifs].sort((a, b) => {
    const nA = toInt(a.planeNum);
    const nB = toInt(b.planeNum);
    let cmp = 0;
    switch (order) {
      case "planesAsc":
        cmp = nA - nB;
        break;
      case "planesDesc":
        cmp = nB - nA;
        break;
      case "dateAsc":
        cmp = a.dateValue - b.dateValue;
        break;
      case "dateDesc":
        cmp = b.dateValue - a.dateValue;
        break;
      default:
        return 0;
    }
    if (cmp !== 0) return cmp;
    const idCmp = (a.id || "").localeCompare(b.id || "");
    return order === "planesDesc" || order === "dateDesc" ? -idCmp : idCmp;
  });
}

interface MotifGridProps {
  motifs: MotifData[];
  filterState: {
    planes: string;
    season: string;
    category: string;
  };
  sortKey: SortKey | "";
  onMotifClick: (m: MotifData) => void;
}

export function MotifGrid({
  motifs,
  filterState,
  sortKey,
  onMotifClick,
}: MotifGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const colorListRef = useRef<HTMLDivElement>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const pendingFailuresRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushFailedBatch = useCallback(() => {
    if (pendingFailuresRef.current.size === 0) return;
    setFailedImages((prev) => {
      const next = new Set(prev);
      pendingFailuresRef.current.forEach((f) => next.add(f));
      pendingFailuresRef.current.clear();
      return next;
    });
    batchTimerRef.current = null;
  }, []);

  const handleImageError = useCallback((fileName: string) => {
    pendingFailuresRef.current.add(fileName);
    if (!batchTimerRef.current) {
      batchTimerRef.current = setTimeout(flushFailedBatch, BATCH_MS);
    }
  }, [flushFailedBatch]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).classList.add("stock-motif-img-loaded");
  }, []);

  const filtered = motifs.filter((m) => {
    if (m.motifName === "-" && m.planeNum === "-" && m.droneType === "-") {
      return false;
    }
    if (filterState.planes !== "0000") {
      const group100 = Math.floor(toInt(m.planeNum) / 100) * 100;
      if (m.planeNum !== filterState.planes && group100 !== Number(filterState.planes)) {
        return false;
      }
    }
    if (filterState.season !== "0000" && filterState.season !== "none") {
      if (m.season !== filterState.season) return false;
    }
    if (filterState.category !== "0000") {
      if (m.category !== filterState.category) return false;
    }
    return true;
  });

  const sorted = sortKey ? sortMotifs(filtered, sortKey) : filtered;

  return (
    <div className="mainArray stock-main-array">
      <div id="setGrid" ref={gridRef} className="stock-set-grid">
        {sorted.map((m) => {
          if (failedImages.has(m.fileName)) return null;

          const group100 = Math.floor(toInt(m.planeNum) / 100) * 100;
          const sectionClass = [
            `m_${m.planeNum}`,
            `m_${group100}`,
            m.season && m.season !== "-" ? `season_${m.season}` : "",
            m.category && m.category !== "-" ? `category_${m.category}` : "",
          ]
            .filter(Boolean)
            .join(" ");

          const iconPath = `${ASSETS_BASE}/image/motif/icon/sc_${m.fileName}.jpg`;

          return (
            <section key={m.fileName} className={sectionClass}>
              <div className="singleArray stock-single-array">
                <div
                  className="box-img stock-box-img"
                  onClick={() => onMotifClick(m)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onMotifClick(m);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stock-motif-img-wrap">
                    <img
                      src={iconPath}
                      alt={m.fileName}
                      loading="lazy"
                      decoding="async"
                      data-height={m.height}
                      data-width={m.width}
                      data-depth={m.depth}
                      data-length={m.length}
                      onLoad={handleImageLoad}
                      onError={() => handleImageError(m.fileName)}
                    />
                  </div>
                  <p>
                    {m.motifName} / {m.planeNum}機 / {m.droneType}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
        <div id="color_list" ref={colorListRef} className="stock-color-list" />
      </div>
    </div>
  );
}
