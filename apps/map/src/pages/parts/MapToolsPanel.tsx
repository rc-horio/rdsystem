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

  // 色・透明度編集（ジオメトリがあるときのみ）
  currentGeometry: Geometry | null;
  onGeometryColorChange: (areaKey: AreaColorKey, color: string) => void;
  onGeometryOpacityChange: (areaKey: AreaColorKey, fillOpacity: number) => void;

  // ボタン類
  onCreateGeometry: () => void;
  onDeleteGeometry: () => void;
  onStartMeasurement: () => void;
  showCreateButton: boolean;
  showDeleteButton: boolean;
  showMeasureButton: boolean;
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
  currentGeometry,
  onGeometryColorChange,
  onGeometryOpacityChange,
  onCreateGeometry,
  onDeleteGeometry,
  onStartMeasurement,
  showCreateButton,
  showDeleteButton,
  showMeasureButton,
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
  const showColorSection = showOverlaySection && hasGeometry;
  const hasContent = showOverlaySection || showCreateButton || showDeleteButton || showMeasureButton;

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
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.takeoff} onChange={handleOverlayChange("takeoff")} aria-label="離発着エリア" />
              <span>離発着</span>
            </label>
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.flight} onChange={handleOverlayChange("flight")} aria-label="飛行エリア" />
              <span>飛行</span>
            </label>
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.safety} onChange={handleOverlayChange("safety")} disabled={safetyDisabled} aria-label="保安エリア" />
              <span>保安</span>
            </label>
            <label className="map-tools-panel__checkbox">
              <input type="checkbox" checked={overlayVisibility.audience} onChange={handleOverlayChange("audience")} aria-label="観客エリア" />
              <span>観客</span>
            </label>
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

      {showColorSection && (
        <section className="map-tools-panel__section" aria-label="図形の色">
          <div className="map-tools-panel__title">色</div>
          <div className="map-tools-panel__colors">
            {(["takeoffArea", "flightArea", "safetyArea", "audienceArea"] as const).map((key) => (
              <div key={key} className="map-tools-panel__color-row">
                <div className="map-tools-panel__color-cell">
                  <button
                    type="button"
                    ref={(el) => { colorSwatchRefs.current[key] = el; }}
                    className="map-tools-panel__color-swatch"
                    style={{ backgroundColor: getAreaColor(currentGeometry, key) }}
                    onClick={() => setOpenColorKey((prev) => (prev === key ? null : key))}
                    aria-label={`${AREA_LABELS[key]}の色を選択`}
                    aria-expanded={openColorKey === key}
                  />
                  <span className="map-tools-panel__color-label">{AREA_LABELS[key]}</span>
                  {openColorKey === key && (
                    <ColorPickerPopover
                      color={getAreaColor(currentGeometry, key)}
                      fillOpacity={getAreaFillOpacity(currentGeometry, key)}
                      onChange={(c) => onGeometryColorChange(key, c)}
                      onOpacityChange={(o) => onGeometryOpacityChange(key, o)}
                      onClose={() => setOpenColorKey(null)}
                      anchorEl={colorSwatchRefs.current[key]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(showCreateButton || showDeleteButton || showMeasureButton) && (
        <section className="map-tools-panel__section map-tools-panel__buttons" aria-label="操作">
          {(showOverlaySection || showColorSection) && <div className="map-tools-panel__divider" />}
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
