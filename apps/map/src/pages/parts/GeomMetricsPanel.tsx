// src/pages/parts/GeomMetricsPanel.tsx
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { GeometryMetrics } from "@/features/types";
import {
  EV_DETAILBAR_SET_METRICS,
  EV_DETAILBAR_APPLY_METRICS,
} from "./constants/events";

type PanelMetrics = GeometryMetrics & {
  safetyDistance_m?: number; // 表示用（= buffer_m）
  buffer_m?: number; // 互換フィールド
};

export default function GeomMetricsPanel() {
  const [m, setM] = useState<PanelMetrics>({});

  // 追加: 編集ONかどうか
  const getEditing = () =>
    typeof document !== "undefined" &&
    document.body.classList.contains("editing-on");
  const [editable, setEditable] = useState<boolean>(getEditing());

  // body.class の変化を監視して editable を同期
  useEffect(() => {
    const mo = new MutationObserver((muts) => {
      for (const mu of muts) {
        if (mu.type === "attributes" && mu.attributeName === "class") {
          setEditable(getEditing());
        }
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  // 外部イベント：detailbar:set-metrics -> ジオメトリを取得/描画
  useEffect(() => {
    const onSet = (e: Event) => {
      const ce = e as CustomEvent<{ metrics?: Partial<GeometryMetrics> }>;
      const next = ce.detail?.metrics ?? {};
      // 空 {} が来たら明示的リセット。それ以外は部分更新をマージ。
      if (Object.keys(next).length === 0) {
        setM({});
      } else {
        setM((prev) => ({ ...prev, ...next }));
      }
    };
    window.addEventListener(EV_DETAILBAR_SET_METRICS, onSet as EventListener);
    return () =>
      window.removeEventListener(
        EV_DETAILBAR_SET_METRICS,
        onSet as EventListener
      );
  }, []);

  // 数値を表示用に（整数）フォーマット
  const toInput = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? String(Math.round(n)) : "";

  // 入力を整数[m]として取得（空は undefined）
  const parseIntMeters = (ev: ChangeEvent<HTMLInputElement>) => {
    const v = ev.target.value.trim();
    if (v === "") return undefined;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(0, n) : undefined;
  };

  // 数値を外部イベントに送信
  const send = (delta: Partial<GeometryMetrics>) => {
    window.dispatchEvent(
      new CustomEvent(EV_DETAILBAR_APPLY_METRICS, { detail: delta })
    );
  };

  return (
    <aside
      id="geomMetricsPanel"
      className="geom-metrics-panel"
      aria-label="エリア寸法"
    >
      <div className="geom-cols" role="group" aria-label="エリア別寸法">
        {/* 高度と保安距離を分けた新しいセクション */}
        <section className="geom-col is-active" aria-label="高度と保安距離">
          <div className="geom-col-title">高度と保安距離</div>
          <div className="geom-rows">
            {/* 高度表示 */}
            <div className="geom-row">
              <span className="k">h</span>
              <input
                className="v geom-input"
                type="number"
                placeholder="-"
                value={toInput(m.flightAltitude_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, flightAltitude_m: n }));
                  if (n !== undefined) send({ flightAltitude_m: n });
                }}
                aria-label="飛行高度(m)"
              />
              <span className="u">m</span>
            </div>

            {/* 保安距離 */}
            <div className="geom-row">
              <span className="k">s</span>
              <input
                className="v geom-input"
                type="text"
                placeholder="-"
                value={toInput(m.safetyDistance_m ?? m.buffer_m)}
                readOnly
                disabled
                aria-label="保安距離(m)"
              />
              <span className="u">m</span>
            </div>
          </div>
        </section>

        {/* 飛行エリア */}
        <section className="geom-col" aria-label="飛行エリア">
          <div className="geom-col-title">飛行エリア</div>
          <div className="geom-rows">
            <div className="geom-row">
              <span className="k">w</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.flightWidth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, flightWidth_m: n }));
                  if (n !== undefined) send({ flightWidth_m: n });
                }}
                disabled={!editable}
                aria-label="飛行エリア 幅(m)"
              />
              <span className="u">m</span>
            </div>
            <div className="geom-row">
              <span className="k">d</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.flightDepth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, flightDepth_m: n }));
                  if (n !== undefined) send({ flightDepth_m: n });
                }}
                disabled={!editable}
                aria-label="飛行エリア 奥行(m)"
              />
              <span className="u">m</span>
            </div>
          </div>
        </section>

        {/* 離発着エリア */}
        <section className="geom-col" aria-label="離発着エリア">
          <div className="geom-col-title">離発着エリア</div>
          <div className="geom-rows">
            <div className="geom-row">
              <span className="k">w</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.rectWidth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, rectWidth_m: n }));
                  if (n !== undefined) send({ rectWidth_m: n });
                }}
                disabled={!editable}
                aria-label="離発着エリア 幅(m)"
              />
              <span className="u">m</span>
            </div>
            <div className="geom-row">
              <span className="k">d</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.rectDepth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, rectDepth_m: n }));
                  if (n !== undefined) send({ rectDepth_m: n });
                }}
                disabled={!editable}
                aria-label="離発着エリア 奥行(m)"
              />
              <span className="u">m</span>
            </div>
          </div>
        </section>

        {/* 観客エリア */}
        <section className="geom-col" aria-label="観客エリア">
          <div className="geom-col-title">観客エリア</div>
          <div className="geom-rows">
            <div className="geom-row">
              <span className="k">w</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.spectatorWidth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, spectatorWidth_m: n }));
                  if (n !== undefined) send({ spectatorWidth_m: n });
                }}
                disabled={!editable}
                aria-label="観客エリア 幅(m)"
              />
              <span className="u">m</span>
            </div>
            <div className="geom-row">
              <span className="k">d</span>
              <input
                className="v geom-input"
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                placeholder="-"
                value={toInput(m.spectatorDepth_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, spectatorDepth_m: n }));
                  if (n !== undefined) send({ spectatorDepth_m: n });
                }}
                disabled={!editable}
                aria-label="観客エリア 奥行(m)"
              />
              <span className="u">m</span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
