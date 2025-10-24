// features/hub/tabs/AreaInfo/sections/RightPanel.tsx
import { SectionTitle, DisplayOrInput, DisplayOrTextarea } from "@/components";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
};

export function RightPanel({ edit, area, onPatchArea }: Props) {
  const A = area ?? {};
  const flight = A.flight_area ?? {};
  const droneCnt = A.drone_count ?? {};
  const anim = A.animation_area ?? {};
  const actions = A.actions ?? {};
  // 行レイアウトを統一（最低/最高高度の行間に合わせる）
  const rowCls = "mt-2 pl-4 md:pl-6 flex items-center gap-2";
  // 横幅を一括管理
  const inputW = "w-[70px]";
  // 数値欄は中央寄せ
  const numericInputW = `${inputW} text-center`;

  const patch = (path: string[], value: any) => {
    const next = { ...(A ?? {}) };
    let cur: any = next;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      cur[k] = { ...(cur[k] ?? {}) };
      cur = cur[k];
    }
    cur[path[path.length - 1]] = value;
    onPatchArea(next);
  };

  const num = (s: string) => {
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  };

  return (
    <div className="space-y-1">
      {/* 開催エリア */}
      <div className="flex items-center gap-4">
        <SectionTitle title="開催エリア" compact />
        <DisplayOrInput
          edit={edit}
          value={A.area_name ?? ""}
          onChange={(e) => patch(["area_name"], e.target.value)}
          className="ml-2 w-[200px] md:w-[150px]"
        />
      </div>

      {/* 機体配置 */}
      <div>
        <SectionTitle title="機体数" />
        <div className={rowCls}>
          <div className="w-24">
            <DisplayOrInput
              edit={edit}
              value={droneCnt.model ?? ""}
              onChange={(e) => patch(["drone_count", "model"], e.target.value)}
              placeholder="EMO"
              className="w-full" // ← ラベル列の幅にフィット
            />
          </div>

          {/* コロン列（全行で同じ幅） */}
          <span className="w-4 text-2xl leading-none text-center">:</span>

          {/* 値列（数値入力） */}
          <DisplayOrInput
            edit={edit}
            value={(droneCnt.count ?? "").toString()}
            onChange={(e) =>
              patch(["drone_count", "count"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW} // 例: w-[70px] text-center
          />
          <span className="w-6 ml-1">機</span>
        </div>
      </div>

      {/* 最低・最高高度・保安エリア */}
      <div>
        <SectionTitle title="最低・最高高度" />
        <div className={rowCls}>
          <span className="w-24 text-sm">最低高度</span>
          <span className="w-4 text-2xl leading-none text-center">:</span>
          <DisplayOrInput
            edit={edit}
            value={(flight.altitude_min_m ?? "").toString()}
            onChange={(e) =>
              patch(["flight_area", "altitude_min_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
        <div className={rowCls}>
          <span className="w-24 text-sm">最高高度</span>
          <span className="w-4 text-2xl leading-none text-center">:</span>
          <DisplayOrInput
            edit={edit}
            value={(flight.altitude_max_m ?? "").toString()}
            onChange={(e) =>
              patch(["flight_area", "altitude_max_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
        <div className={rowCls}>
          <span className="w-24 text-sm">保安エリア</span>
          <span className="w-4 text-2xl leading-none text-center">:</span>
          <DisplayOrInput
            edit={edit}
            value={(flight.safety_area_m ?? "").toString()}
            onChange={(e) =>
              patch(["flight_area", "safety_area_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />{" "}
          <span className="w-6 ml-1">m</span>
        </div>
      </div>

      {/* 離陸アクション移動 */}
      <div>
        <SectionTitle title="離陸アクション移動" />
        <div className="pl-4 md:pl-6">
          <DisplayOrTextarea
            edit={edit}
            value={actions.liftoff ?? ""}
            onChange={(v) => patch(["actions", "liftoff"], v)}
            heightClass="h-25"
            size="sm"
            className="max-w-[260px]"
          />
        </div>{" "}
      </div>

      {/* 旋回 */}
      <div>
        <SectionTitle title="旋回" />
        <div className="pl-4 md:pl-6">
          <DisplayOrTextarea
            edit={edit}
            value={actions.turn ?? ""}
            onChange={(v) => patch(["actions", "turn"], v)}
            heightClass="h-15"
            size="sm"
            className="max-w-[260px]"
          />
        </div>{" "}
      </div>

      {/* 障害物 */}
      <div>
        <SectionTitle title="障害物" />
        <div className="pl-4 md:pl-6">
          <DisplayOrTextarea
            edit={edit}
            value={A.obstacle_note ?? ""}
            onChange={(v) => patch(["obstacle_note"], v)}
            heightClass="h-15"
            size="sm"
            className="max-w-[260px]"
          />
        </div>{" "}
      </div>

      {/* 離発着演出 */}
      <div>
        <SectionTitle title="離発着演出" />
        <div className={rowCls}>
          <span className="w-7 text-sm shrink-0">離陸</span>
          <div className="flex-1 flex">
            <DisplayOrInput
              edit={edit}
              value={A?.lights?.takeoff ?? ""}
              onChange={(e) => patch(["lights", "takeoff"], e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className={`${rowCls} mb-2`}>
          <span className="w-7 text-sm shrink-0">着陸</span>
          <div className="flex-1 flex">
            <DisplayOrInput
              edit={edit}
              value={A?.lights?.landing ?? ""}
              onChange={(e) => patch(["lights", "landing"], e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="pl-4 md:pl-6">
          <DisplayOrTextarea
            edit={edit}
            value={A.return_note ?? ""}
            onChange={(v) => patch(["return_note"], v)}
            heightClass="h-15"
            size="sm"
            className="max-w-[260px]"
          />
        </div>{" "}
      </div>

      {/* アニメーションエリア */}
      <div>
        <SectionTitle title="アニメーションエリア" />
        <div className={rowCls}>
          <span className="w-24 text-sm">横幅</span>
          <span className="w-4 text-2xl leading-none text-center">:</span>
          <DisplayOrInput
            edit={edit}
            value={(anim.width_m ?? "").toString()}
            onChange={(e) =>
              patch(["animation_area", "width_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />{" "}
          <span className="w-6 ml-1">m</span>
        </div>
        <div className={rowCls}>
          <span className="w-24 text-sm">奥行</span>
          <span className="w-4 text-2xl leading-none text-center">:</span>
          <DisplayOrInput
            edit={edit}
            value={(anim.depth_m ?? "").toString()}
            onChange={(e) =>
              patch(["animation_area", "depth_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
      </div>

      {/* 観客からの距離 */}
      <div>
        <SectionTitle title="観客からの距離" />
        <div className={rowCls}>
          <DisplayOrInput
            edit={edit}
            value={(A.distance_from_viewers_m ?? "").toString()}
            onChange={(e) =>
              patch(["distance_from_viewers_m"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />{" "}
          <span className="w-6">m</span>
        </div>
      </div>
    </div>
  );
}
