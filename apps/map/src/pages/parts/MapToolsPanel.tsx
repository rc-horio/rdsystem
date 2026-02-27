// src/pages/parts/MapToolsPanel.tsx
import { useRef, useState, type ChangeEvent } from "react";
import { useDraggablePanel } from "./useDraggablePanel";
import type { Geometry } from "@/features/types";
import type { OverlayVisibility } from "./overlayVisibility";
import { detectEmbedMode } from "@/components";
import { getAreaColor, getAreaFillOpacity, type AreaColorKey } from "./geometryColors";
import ColorPickerPopover from "./ColorPickerPopover";

type Props = {
  // 表示切り替え
  overlayVisibility: OverlayVisibility;
  onOverlayVisibilityChange: (v: OverlayVisibility) => void;
  showOverlaySection: boolean;

  // DJI NFZ 状態（任意）
  djiNfzLoading?: boolean;
  djiNfzError?: string | null;

  // 色・透明度編集（ジオメトリがあるときのみ）
  currentGeometry: Geometry | null;
  onGeometryColorChange: (areaKey: AreaColorKey, color: string) => void;
  onGeometryOpacityChange: (areaKey: AreaColorKey, fillOpacity: number) => void;

  // ボタン類
  onCreateGeometry: () => void;
  onDeleteGeometry: () => void;
  onStartMeasurement: () => void;
  onAirportHeightRestrictionChange?: (checked: boolean) => void;
  showCreateButton: boolean;
  showDeleteButton: boolean;
  showMeasureButton: boolean;
  showAirportHeightRestrictionCheckbox?: boolean;
  airportHeightRestrictionMode?: boolean;
  /** 測定モード中はチェックを無効化（表示は維持） */
  airportHeightRestrictionDisabled?: boolean;
};

const AREA_LABELS: Record<AreaColorKey, string> = {
  takeoffArea: "離発着",
  flightArea: "飛行",
  safetyArea: "保安",
  audienceArea: "観客",
};

export default function MapToolsPanel({
  overlayVisibility,
  onOverlayVisibilityChange,
  showOverlaySection,
  djiNfzLoading = false,
  djiNfzError = null,
  currentGeometry,
  onGeometryColorChange,
  onGeometryOpacityChange,
  onCreateGeometry,
  onDeleteGeometry,
  onStartMeasurement,
  onAirportHeightRestrictionChange,
  showCreateButton,
  showDeleteButton,
  showMeasureButton,
  showAirportHeightRestrictionCheckbox = false,
  airportHeightRestrictionMode = false,
  airportHeightRestrictionDisabled = false,
}: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [openColorKey, setOpenColorKey] = useState<AreaColorKey | null>(null);
  const colorSwatchRefs = useRef<Record<AreaColorKey, HTMLButtonElement | null>>({
    takeoffArea: null,
    flightArea: null,
    safetyArea: null,
    audienceArea: null,
  });

  useDraggablePanel(panelRef, {
    exclude: ["input", "select", "textarea", "button", "label", ".color-picker-popover"],
  });

  const handleOverlayChange = (key: keyof OverlayVisibility) => (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const next = { ...overlayVisibility, [key]: checked };
    onOverlayVisibilityChange(next);
  };

  const flightChecked = overlayVisibility.flight;
  const safetyDisabled = !flightChecked;

  const hasGeometry = !!currentGeometry;
  const showDjiNfzSection = typeof window !== "undefined" && !detectEmbedMode();
  const hasContent =
    showOverlaySection ||
    showCreateButton ||
    showDeleteButton ||
    showMeasureButton ||
    showDjiNfzSection ||
    showAirportHeightRestrictionCheckbox;

  if (typeof window !== "undefined" && detectEmbedMode()) {
    return null;
  }

  if (!hasContent) return null;

  return (
    <aside
      ref={panelRef}
      className="map-tools-panel"
      aria-label="地図ツール"
    >

      {showOverlaySection && (
        <section className="map-tools-panel__section" aria-label="表示切り替え">
          <div className="map-tools-panel__title">表示</div>
          <div className="map-tools-panel__checkboxes">
            {(["takeoffArea", "flightArea", "safetyArea", "audienceArea"] as const).map((areaKey) => {
              const overlayKey = areaKey === "takeoffArea" ? "takeoff" : areaKey === "flightArea" ? "flight" : areaKey === "safetyArea" ? "safety" : "audience";
              const disabled = areaKey === "safetyArea" && safetyDisabled;
              return (
                <div key={areaKey} className="map-tools-panel__checkbox-row">
                  <label className="map-tools-panel__checkbox">
                    <input
                      type="checkbox"
                      checked={overlayVisibility[overlayKey]}
                      onChange={handleOverlayChange(overlayKey)}
                      disabled={disabled}
                      aria-label={`${AREA_LABELS[areaKey]}エリア`}
                    />
                    {hasGeometry && (
                      <button
                        type="button"
                        ref={(el) => { colorSwatchRefs.current[areaKey] = el; }}
                        className="map-tools-panel__color-swatch"
                        style={{ backgroundColor: getAreaColor(currentGeometry, areaKey) }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenColorKey((prev) => (prev === areaKey ? null : areaKey)); }}
                        aria-label={`${AREA_LABELS[areaKey]}の色を選択`}
                        aria-expanded={openColorKey === areaKey}
                      />
                    )}
                    <span>{AREA_LABELS[areaKey]}</span>
                  </label>
                  {hasGeometry && openColorKey === areaKey && (
                    <ColorPickerPopover
                      color={getAreaColor(currentGeometry, areaKey)}
                      fillOpacity={getAreaFillOpacity(currentGeometry, areaKey)}
                      onChange={(c) => onGeometryColorChange(areaKey, c)}
                      onOpacityChange={(o) => onGeometryOpacityChange(areaKey, o)}
                      onClose={() => setOpenColorKey(null)}
                      anchorEl={colorSwatchRefs.current[areaKey]}
                    />
                  )}
                </div>
              );
            })}
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.arrows} onChange={handleOverlayChange("arrows")} aria-label="矢印" />
              <span>矢印</span>
            </label>
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.labels} onChange={handleOverlayChange("labels")} aria-label="ラベル" />
              <span>ラベル</span>
            </label>
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.diameterLines} onChange={handleOverlayChange("diameterLines")} aria-label="直径線" />
              <span>直径線</span>
            </label>
          </div>
        </section>
      )}
      {(showDjiNfzSection || showAirportHeightRestrictionCheckbox) && (
        <section className="map-tools-panel__section" aria-label="制限情報">
          {showOverlaySection && <div className="map-tools-panel__divider" />}
          {showDjiNfzSection && (
            <label className="map-tools-panel__checkbox">
              <input
                type="checkbox"
                checked={overlayVisibility.djiNfz}
                onChange={handleOverlayChange("djiNfz")}
                disabled={djiNfzLoading}
                aria-label="DJI 飛行制限区域"
              />
              <span>
                飛行制限区域
                <a
                  href="https://fly-safe.dji.com/nfz/nfz-query"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-tools-panel__ext-link"
                  aria-label="DJI FlySafe Geo Zone Map（外部サイト）"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="map-tools-panel__ext-link-icon" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </span>
                </a>
                <span className="map-tools-panel__loading-suffix">{djiNfzLoading ? " (読込中…)" : ""}</span>
              </span>
            </label>
          )}
          {djiNfzError && (
            <p className="map-tools-panel__error" role="alert">
              {djiNfzError}
            </p>
          )}
          {showAirportHeightRestrictionCheckbox && (
            <label className="map-tools-panel__checkbox">
              <input
                type="checkbox"
                checked={airportHeightRestrictionMode}
                onChange={(e) => onAirportHeightRestrictionChange?.(e.target.checked)}
                disabled={airportHeightRestrictionDisabled}
                aria-label="高さ制限照会"
              />
              <span>高さ制限</span>
            </label>
          )}
          <p className="map-tools-panel__disclaimer">
            表示情報は参考です。<br />
            公式情報を確認してください。
          </p>
        </section>
      )}



      {(showCreateButton || showDeleteButton || showMeasureButton) && (
        <section className="map-tools-panel__section map-tools-panel__buttons" aria-label="操作">
          {(showDjiNfzSection || showOverlaySection || showAirportHeightRestrictionCheckbox) && (
            <div className="map-tools-panel__divider" />
          )}
          <div className="map-tools-panel__button-group">
            {showCreateButton && (
              <button type="button" className="map-tools-panel__btn map-tools-panel__btn--create" onClick={onCreateGeometry} aria-label="飛行エリアを作図する">
                飛行エリア作図
              </button>
            )}
            {showDeleteButton && (
              <button type="button" className="map-tools-panel__btn map-tools-panel__btn--delete" onClick={onDeleteGeometry} aria-label="エリア情報を削除する">
                飛行エリア削除
              </button>
            )}
            {showMeasureButton && (
              <button type="button" className="map-tools-panel__btn map-tools-panel__btn--measure" onClick={onStartMeasurement} aria-label="距離を測る">
                測定
              </button>
            )}
          </div>
        </section>
      )}
    </aside>
  );
}
