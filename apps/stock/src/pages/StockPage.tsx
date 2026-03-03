import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { StockHeader } from "@/components/StockHeader";
import { FilterMenu } from "@/components/FilterMenu";
import { SortMenu } from "@/components/SortMenu";
import { MotifGrid } from "@/components/MotifGrid";
import { MotifModal } from "@/components/MotifModal";
import { TransitionModal } from "@/components/TransitionModal";
import { TakeoffLandingModal } from "@/components/TakeoffLandingModal";
import { FooterPanel, type FooterItem } from "@/components/FooterPanel";
import { RdCompanyLogo } from "@/components/RdCompanyLogo";
import { useMotifData } from "@/hooks/useMotifData";
import { useTransitionData } from "@/hooks/useTransitionData";
import type { MotifData } from "@/types/stock";
import type { TransitionData } from "@/types/stock";
import type { SortKey } from "@/components/SortMenu";
import type { TLType } from "@/components/TakeoffLandingModal";

let idCounter = 0;
function genId() {
  return `f-${++idCounter}-${Date.now()}`;
}

export default function StockPage() {
  const { data: motifs, loading, error } = useMotifData();
  const transitions = useTransitionData();

  const [filterState, setFilterState] = useState({
    planes: "0000",
    season: "0000",
    category: "0000",
  });
  const [sortKey, setSortKey] = useState<SortKey | "">("");
  const [footerItems, setFooterItems] = useState<FooterItem[]>([
    { type: "takeoffPlaceholder", id: "takeoff-ph" },
    { type: "landingPlaceholder", id: "landing-ph" },
  ]);

  const [motifModal, setMotifModal] = useState<{ open: boolean; motif: MotifData | null }>({
    open: false,
    motif: null,
  });
  const [transitionModal, setTransitionModal] = useState<{
    open: boolean;
    plusIndex: number;
  }>({ open: false, plusIndex: -1 });
  const [tlModal, setTlModal] = useState<{
    open: boolean;
    type: TLType | null;
  }>({ open: false, type: null });
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const pdfAbortControllerRef = useRef<AbortController | null>(null);

  const handleFilter = useCallback((type: "planes" | "season" | "category", value: string) => {
    setFilterState((s) => ({ ...s, [type]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setFilterState({ planes: "0000", season: "0000", category: "0000" });
    setSortKey("");
  }, []);

  const handleMotifClick = useCallback((m: MotifData) => {
    setMotifModal({ open: true, motif: m });
  }, []);

  const handleAddMotifToFooter = useCallback(() => {
    if (!motifModal.motif) return;
    const newMotif: FooterItem = {
      type: "motif",
      id: genId(),
      fileName: motifModal.motif.fileName,
    };
    setFooterItems((prev) => {
      const landingIdx = prev.findIndex(
        (it) => it.type === "landingPlaceholder" || it.type === "landing"
      );
      const insertBefore = landingIdx >= 0 ? landingIdx : prev.length;
      const before = prev.slice(0, insertBefore);
      const after = prev.slice(insertBefore);
      const motifCount = prev.filter((it) => it.type === "motif").length;
      const itemsToAdd: FooterItem[] =
        motifCount >= 1
          ? [{ type: "plus" as const, id: genId() }, newMotif]
          : [newMotif];
      return [...before, ...itemsToAdd, ...after];
    });
    setMotifModal({ open: false, motif: null });
  }, [motifModal.motif]);

  const handlePlusClick = useCallback((afterIndex: number) => {
    setTransitionModal({ open: true, plusIndex: afterIndex });
  }, []);

  const handleTransitionSelect = useCallback((t: TransitionData) => {
    setFooterItems((prev) => {
      const plusIdx = transitionModal.plusIndex >= 0
        ? transitionModal.plusIndex
        : prev.findIndex((it) => it.type === "plus");
      if (plusIdx < 0) return prev;
      const newTransition: FooterItem = {
        type: "transition",
        id: genId(),
        data: t,
      };
      const next = [...prev];
      next[plusIdx] = newTransition;
      return next;
    });
    setTransitionModal({ open: false, plusIndex: -1 });
  }, [transitionModal.plusIndex]);

  const handleTakeoffClick = useCallback(() => {
    setTlModal({ open: true, type: "takeoff" });
  }, []);

  const handleLandingClick = useCallback(() => {
    setTlModal({ open: true, type: "landing" });
  }, []);

  const handleTLSelect = useCallback((choice: { name: string; file: string }) => {
    const type = tlModal.type;
    if (!type) return;
    const newTL: FooterItem = {
      type,
      id: genId(),
      label: choice.name,
    };
    setFooterItems((prev) => {
      const phType = type === "takeoff" ? "takeoffPlaceholder" : "landingPlaceholder";
      const idx = prev.findIndex((it) => it.type === phType);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = newTL;
      return next;
    });
    setTlModal({ open: false, type: null });
  }, [tlModal.type]);

  const handleRemoveMotif = useCallback((index: number) => {
    setFooterItems((prev) => {
      const item = prev[index];
      if (item.type !== "motif") return prev;
      const motifCount = prev.filter((it) => it.type === "motif").length;
      if (motifCount <= 1) {
        return prev.filter((_, i) => i !== index);
      }
      const toRemove = new Set<number>([index]);
      const prevItem = prev[index - 1];
      const nextItem = prev[index + 1];
      const isTransition = (it: FooterItem) =>
        it.type === "transition" || it.type === "plus";
      if (isTransition(prevItem)) toRemove.add(index - 1);
      if (isTransition(nextItem)) toRemove.add(index + 1);
      let next = prev.filter((_, i) => !toRemove.has(i));
      const newMotifCount = next.filter((it) => it.type === "motif").length;
      if (newMotifCount >= 2) {
        const lastMotifIdx = next.reduce(
          (last, it, i) => (it.type === "motif" ? i : last),
          -1
        );
        if (lastMotifIdx >= 1 && next[lastMotifIdx - 1]?.type !== "plus" && next[lastMotifIdx - 1]?.type !== "transition") {
          const plus: FooterItem = { type: "plus", id: genId() };
          next = [
            ...next.slice(0, lastMotifIdx),
            plus,
            ...next.slice(lastMotifIdx),
          ];
        }
      }
      return next;
    });
  }, []);

  const handleRemoveTransition = useCallback((index: number) => {
    setFooterItems((prev) => {
      const next = [...prev];
      next[index] = { type: "plus", id: genId() };
      return next;
    });
  }, []);

  const handleRemoveTL = useCallback((index: number) => {
    setFooterItems((prev) => {
      const item = prev[index];
      if (item.type === "takeoff" || item.type === "landing") {
        const phType =
          item.type === "takeoff" ? "takeoffPlaceholder" : "landingPlaceholder";
        const next = [...prev];
        next[index] = { type: phType, id: genId() };
        return next;
      }
      return prev;
    });
  }, []);

  const handleFooterChange = useCallback((newItems: FooterItem[]) => {
    const takeoff = newItems.find(
      (it) => it.type === "takeoffPlaceholder" || it.type === "takeoff"
    );
    const landing = newItems.find(
      (it) => it.type === "landingPlaceholder" || it.type === "landing"
    );
    const middle = newItems.filter(
      (it) =>
        it.type !== "takeoffPlaceholder" &&
        it.type !== "takeoff" &&
        it.type !== "landingPlaceholder" &&
        it.type !== "landing"
    );
    const motifs = middle.filter((it) => it.type === "motif");
    const transitions = middle.filter(
      (it) => it.type === "transition" || it.type === "plus"
    );
    const normalizedMiddle: FooterItem[] = [];
    for (let i = 0; i < motifs.length; i++) {
      normalizedMiddle.push(motifs[i]);
      if (i < motifs.length - 1) {
        normalizedMiddle.push(
          transitions[i] ?? { type: "plus" as const, id: genId() }
        );
      }
    }
    const ordered: FooterItem[] = [];
    if (takeoff) ordered.push(takeoff);
    ordered.push(...normalizedMiddle);
    if (landing) ordered.push(landing);
    setFooterItems(ordered);
  }, []);

  if (loading) {
    return (
      <div className="stock-page min-h-dvh bg-black text-white">
        <StockHeader />
        <div id="headBotom" className="stock-head-bottom">
          <div className="stock-filter-sort-wrap">
            <FilterMenu onFilter={handleFilter} />
            <SortMenu onSort={setSortKey} />
            <button
              type="button"
              className="menu-reset-btn"
              onClick={handleReset}
            >
              リセット
            </button>
          </div>
        </div>
        <div className="stock-main-array">
          <div className="stock-loading-grid">
            <div className="stock-loading-spinner" aria-hidden="true" />
            <p className="stock-loading-text">読み込み中…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="stock-page min-h-dvh bg-black text-white">
      {isPdfExporting &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <button
              type="button"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                padding: "6px 12px",
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={() => {
                pdfAbortControllerRef.current?.abort();
                setIsPdfExporting(false);
              }}
            >
              Cancel
            </button>
            <div style={{ padding: "24px 28px", marginTop: "124px" }}>
              <RdCompanyLogo />
            </div>
          </div>,
          document.body
        )}
      <StockHeader />

      <div id="headBotom" className="stock-head-bottom">
        <div className="stock-filter-sort-wrap">
          <FilterMenu onFilter={handleFilter} />
          <SortMenu onSort={setSortKey} />
          <button
            type="button"
            className="menu-reset-btn"
            onClick={handleReset}
          >
            リセット
          </button>
        </div>
      </div>

      <MotifGrid
        motifs={motifs}
        filterState={filterState}
        sortKey={sortKey}
        onMotifClick={handleMotifClick}
      />

      <MotifModal
        motif={motifModal.motif}
        open={motifModal.open}
        onClose={() => setMotifModal({ open: false, motif: null })}
        onAddToFooter={handleAddMotifToFooter}
      />

      <TransitionModal
        transitions={transitions}
        open={transitionModal.open}
        onClose={() => setTransitionModal({ open: false, plusIndex: -1 })}
        onSelect={handleTransitionSelect}
      />

      {tlModal.type && (
        <TakeoffLandingModal
          type={tlModal.type}
          open={tlModal.open}
          onClose={() => setTlModal({ open: false, type: null })}
          onSelect={handleTLSelect}
        />
      )}

      <FooterPanel
        items={footerItems}
        onChange={handleFooterChange}
        onPlusClick={handlePlusClick}
        onTakeoffClick={handleTakeoffClick}
        onLandingClick={handleLandingClick}
        onRemoveMotif={handleRemoveMotif}
        onRemoveTransition={handleRemoveTransition}
        onRemoveTL={handleRemoveTL}
        onPdfExportStart={(ac) => {
          pdfAbortControllerRef.current = ac;
          setIsPdfExporting(true);
        }}
        onPdfExportEnd={() => {
          pdfAbortControllerRef.current = null;
          setIsPdfExporting(false);
        }}
      />
    </div>
  );
}
