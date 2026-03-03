import { useRef, useEffect, useState } from "react";
import Sortable from "sortablejs";
import { exportToPdf } from "@/lib/pdfExporter";
import { ASSETS_BASE } from "@/lib/assetsBase";
import type { TransitionData } from "@/types/stock";

export type FooterItem =
  | { type: "motif"; id: string; fileName: string }
  | { type: "transition"; id: string; data: TransitionData }
  | { type: "takeoff"; id: string; label: string }
  | { type: "landing"; id: string; label: string }
  | { type: "plus"; id: string }
  | { type: "takeoffPlaceholder"; id: string }
  | { type: "landingPlaceholder"; id: string };

function getItemId(item: FooterItem): string {
  return item.id;
}

interface FooterPanelProps {
  items: FooterItem[];
  onChange: (items: FooterItem[]) => void;
  onPlusClick: (afterIndex: number) => void;
  onTakeoffClick: () => void;
  onLandingClick: () => void;
  onRemoveMotif: (index: number) => void;
  onRemoveTransition: (index: number) => void;
  onRemoveTL: (index: number) => void;
  onPdfExportStart?: (abortController: AbortController) => void;
  onPdfExportEnd?: () => void;
}

export function FooterPanel({
  items,
  onChange,
  onPlusClick,
  onTakeoffClick,
  onLandingClick,
  onRemoveMotif,
  onRemoveTransition,
  onRemoveTL,
  onPdfExportStart,
  onPdfExportEnd,
}: FooterPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [footerClosed, setFooterClosed] = useState(false);
  const itemsMapRef = useRef<Map<string, FooterItem>>(new Map());
  itemsMapRef.current = new Map(items.map((it) => [getItemId(it), it]));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const sortable = Sortable.create(el, {
      draggable: ".footerIcon:not(.landingPlaceholder):not(.takeoffPlaceholder):not(.plusBtn):not(.tlIcon)",
      filter: ".footerItemClose, .landingPlaceholder, .takeoffPlaceholder, .plusBtn, .tlIcon",
      animation: 150,
      onEnd: () => {
        const newOrder: FooterItem[] = [];
        el.querySelectorAll("[data-item-id]").forEach((node) => {
          const id = node.getAttribute("data-item-id");
          const item = id ? itemsMapRef.current.get(id) : null;
          if (item) newOrder.push(item);
        });
        if (newOrder.length > 0) onChange(newOrder);
      },
    });
    return () => sortable.destroy();
  }, [onChange]);

  const handlePdfExport = async () => {
    if (!containerRef.current) return;
    const abortController = new AbortController();
    onPdfExportStart?.(abortController);
    try {
      await exportToPdf(containerRef.current, abortController.signal);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    } finally {
      onPdfExportEnd?.();
    }
  };

  return (
    <div className={`footerPanel ${footerClosed ? "closed" : ""}`}>
      <div
        className="footerToggle"
        onClick={() => setFooterClosed(!footerClosed)}
        role="button"
        tabIndex={0}
      >
        {footerClosed ? "▲ フッターを表示" : "▼ フッターを非表示"}
      </div>
      <div className="footertitle">
        <div
          className="PDFoutput"
          onClick={handlePdfExport}
          role="button"
          tabIndex={0}
        >
          PDF 出力
        </div>
      </div>
      <div id="footerItem" ref={containerRef} className="footerItem">
        {items.map((item, idx) => {
          if (item.type === "motif") {
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="footerIcon motifIcon"
              >
                <img
                  src={`${ASSETS_BASE}/image/motif/icon/sc_${item.fileName}.jpg`}
                  className="container"
                  data-type="motif"
                  data-filename={item.fileName}
                  alt=""
                />
                <div
                  className="footerItemClose motifCancel"
                  onClick={() => onRemoveMotif(idx)}
                >
                  Cancel
                </div>
              </div>
            );
          }
          if (item.type === "transition") {
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="footerIcon transitionIconWrapper"
              >
                <img
                  src={`${ASSETS_BASE}/image/transition/icon/sc_${item.data.filename}.jpg`}
                  className="container"
                  data-type="transition"
                  data-name={item.data.name}
                  data-filename={item.data.filename}
                  alt=""
                />
                <div
                  className="footerItemClose transitionCancel"
                  onClick={() => onRemoveTransition(idx)}
                >
                  Cancel
                </div>
              </div>
            );
          }
          if (item.type === "takeoff" || item.type === "landing") {
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="footerIcon tlIcon"
                data-type={item.type}
                data-filename={item.label}
              >
                <div className="container tlPlainText">{item.label}</div>
                <div
                  className="footerItemClose tlCancel"
                  onClick={() => onRemoveTL(idx)}
                >
                  Cancel
                </div>
              </div>
            );
          }
          if (item.type === "plus") {
            return (
              <div
                key={item.id}
                className="footerIcon transitionPlaceholder plusBtn"
                onClick={() => onPlusClick(idx)}
                role="button"
                tabIndex={0}
              >
                <div className="tlBox">トランジションを<br />選択する</div>
              </div>
            );
          }
          if (item.type === "takeoffPlaceholder") {
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="footerIcon tlPlaceholder takeoffPlaceholder"
                onClick={onTakeoffClick}
                role="button"
                tabIndex={0}
              >
                <div className="tlBox">離陸を<br />選択する</div>
              </div>
            );
          }
          if (item.type === "landingPlaceholder") {
            return (
              <div
                key={item.id}
                data-item-id={item.id}
                className="footerIcon tlPlaceholder landingPlaceholder"
                onClick={onLandingClick}
                role="button"
                tabIndex={0}
              >
                <div className="tlBox">着陸を<br />選択する</div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
