// src/pages/parts/GeomMetricsPanel.tsx
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { GeometryMetrics } from "@/features/types";
import {
  EV_DETAILBAR_SET_METRICS,
  EV_DETAILBAR_APPLY_METRICS,
} from "./constants/events";
import {
  EV_GEOM_TURN_METRICS,
  type TurnMetricsDetail,
} from "./geometry/orientationDebug";
import { detectEmbedMode } from "@/components";

type PanelMetrics = GeometryMetrics & {
  safetyDistance_m?: number; // 表示用（= buffer_m）
  buffer_m?: number; // 互換フィールド

  // 旋回方向と角度
  turnDirection?: "cw" | "ccw"; // cw: 時計回り, ccw: 反時計回り
  turnAngle_deg?: number; // 回転角度（度）

  // 高度（Max / Min を UI 用に保持）
  flightAltitude_Max_m?: number;
  flightAltitude_min_m?: number;

  // 保安距離の計算方式（ラジオボタン）
  safetyMode?: "new" | "old"; // "new": 新式, "old": 旧式

  // 新式 / 旧式それぞれの保安距離（表示用）
  safetyDistanceNew_m?: number;
  safetyDistanceOld_m?: number;
};

export default function GeomMetricsPanel() {
  if (typeof window !== "undefined" && detectEmbedMode()) {
    return null;
  }

  const [m, setM] = useState<PanelMetrics>({});

  // 編集ONかどうか
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

  // 外部イベント：detailbar:set-metrics -> パネル state 更新
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

  // orientationDebug からの旋回イベントを反映
  useEffect(() => {
    const onTurn = (e: Event) => {
      const ce = e as CustomEvent<TurnMetricsDetail>;
      const detail = ce.detail;
      if (!detail) return;

      setM((prev) => ({
        ...prev,
        turnDirection: detail.turnDirection ?? prev.turnDirection,
        turnAngle_deg:
          typeof detail.turnAngle_deg === "number"
            ? detail.turnAngle_deg
            : prev.turnAngle_deg,
      }));
    };

    window.addEventListener(EV_GEOM_TURN_METRICS, onTurn as EventListener);
    return () =>
      window.removeEventListener(EV_GEOM_TURN_METRICS, onTurn as EventListener);
  }, []);

  // 数値を表示用に（整数）フォーマット
  const toInput = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? String(Math.round(n)) : "";

  // 数値を表示用に（小数1桁固定）
  const toInputDec1 = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? (Math.round(n * 10) / 10).toFixed(1) : "";

  // 入力を整数[m]として取得（空は undefined）
  const parseIntMeters = (ev: ChangeEvent<HTMLInputElement>) => {
    const n = Number(ev.target.value);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
  };

  // 入力を小数1桁[m]として取得（空は undefined）
  const parseDec1Meters = (ev: ChangeEvent<HTMLInputElement>) => {
    const n = Number(ev.target.value);
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 10) / 10) : undefined;
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
        {/* 高度 */}
        <section className="geom-col is-active" aria-label="高度">
          <div className="geom-col-title">高度</div>
          <div className="geom-rows">
            {/* Max */}
            <div className="geom-row">
              <span className="k">Max</span>
              <input
                className="v geom-input"
                type="number"
                placeholder="-"
                value={toInput(m.flightAltitude_Max_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, flightAltitude_Max_m: n }));
                  send({ flightAltitude_Max_m: n });
                }}
                disabled={!editable}
                aria-label="最高高度(m)"
              />
              <span className="u">m</span>
            </div>

            {/* min */}
            <div className="geom-row">
              <span className="k">min</span>
              <input
                className="v geom-input"
                type="number"
                placeholder="-"
                value={toInput(m.flightAltitude_min_m)}
                onChange={(e) => {
                  const n = parseIntMeters(e);
                  setM((p) => ({ ...p, flightAltitude_min_m: n }));
                  send({ flightAltitude_min_m: n });
                }}
                disabled={!editable}
                aria-label="最低高度(m)"
              />
              <span className="u">m</span>
            </div>
          </div>
        </section>

        {/* 保安距離 */}
        <section className="geom-col" aria-label="保安距離">
          <div className="geom-col-title">保安距離</div>
          <div className="geom-rows">
            {/* 新式 */}
            <div className="geom-row">
              <span className="k radio-position">
                <label
                  className={`inline-flex items-center gap-1 ${!editable ? "radio-readonly" : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="safetyMode"
                    value="new"
                    checked={(m.safetyMode ?? "new") === "new"}
                    onChange={() => {
                      if (!editable) return;
                      setM((p) => ({ ...p, safetyMode: "new" }));
                      send({ safetyMode: "new" } as any);
                    }}
                  />
                  <span className="leading-none"> 新</span>
                </label>
              </span>
              <input
                className="v geom-input"
                type="text"
                placeholder="-"
                value={toInput(m.safetyDistanceNew_m)}
                readOnly
                disabled
                aria-label="保安距離(新式)"
              />
              <span className="u">m</span>
            </div>

            {/* 旧式 */}
            <div className="geom-row">
              <span className="k radio-position">
                <label
                  className={`inline-flex items-center gap-1 ${!editable ? "radio-readonly" : ""
                    }`}
                >
                  <input
                    type="radio"
                    name="safetyMode"
                    value="old"
                    checked={m.safetyMode === "old"}
                    onChange={() => {
                      if (!editable) return;
                      setM((p) => ({ ...p, safetyMode: "old" }));
                      send({ safetyMode: "old" } as any);
                    }}
                  />
                  <span className="leading-none"> 旧</span>
                </label>
              </span>
              <input
                className="v geom-input"
                type="text"
                placeholder="-"
                value={toInput(m.safetyDistanceOld_m)}
                readOnly
                disabled
                aria-label="保安距離(旧式)"
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
                inputMode="decimal"
                step={0.1}
                min={0}
                placeholder="-"
                value={toInputDec1(m.rectWidth_m)}
                onChange={(e) => {
                  const n = parseDec1Meters(e);
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
                inputMode="decimal"
                step={0.1}
                min={0}
                placeholder="-"
                value={toInputDec1(m.rectDepth_m)}
                onChange={(e) => {
                  const n = parseDec1Meters(e);
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

        {/* 旋回 */}
        <section className="geom-col" aria-label="旋回">
          <div className="geom-col-title">旋回</div>
          <div className="geom-rows">
            {/* 上の行: 時計回り / 反時計回り */}
            <div className="geom-row geom-row-turn-direction">
              <span className="k" />
              <span className="v geom-turn-text">
                {m.turnDirection === "ccw"
                  ? "反時計回りに"
                  : m.turnDirection === "cw"
                    ? "時計回りに"
                    : "—"}
              </span>
              <span className="u" />
            </div>

            {/* 下の行（角度） */}
            <div className="geom-row geom-row-turn-angle">
              <span className="k" />
              <span className="v geom-turn-text">
                {typeof m.turnAngle_deg === "number"
                  ? `${Number(m.turnAngle_deg.toFixed(1))}度回転`
                  : "—"}
              </span>
              <span className="u" />
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
