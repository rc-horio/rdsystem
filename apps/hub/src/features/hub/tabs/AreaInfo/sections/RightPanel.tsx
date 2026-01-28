// features/hub/tabs/AreaInfo/sections/RightPanel.tsx
import {
  SectionTitle,
  DisplayOrInput,
  DisplayOrTextarea,
  DisplayOrSelect,
  type SelectOption,
} from "@/components";
import { useEffect, useState } from "react";

// 開発用のCatalogのベースURL
// const S3_BASE =
//   "https://rc-rdsystem-dev-catalog.s3.ap-northeast-1.amazonaws.com/catalog/v1/";

// 本番用のCatalogのベースURL
const S3_BASE =
  String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(/\/+$/, "") + "/";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
  // エリア名変更時のコールバック
  onChangeAreaName?: (name: string) => void;
};

// RDMap 側のエリア JSON 形式
type RDMapArea = {
  uuid: string;
  areaName: string;
  projectCount: number;
};

// S3 上の JSON への URL
// ・本番では環境変数の値を推奨
// ・一旦は S3 の公開 URL をデフォルトにしておく
const AREAS_JSON_URL = S3_BASE + "areas.json";

export function RightPanel({
  edit,
  area,
  onPatchArea,
  onChangeAreaName,
}: Props) {
  // --- 開催地プルダウン用の状態 ---
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [rdMapAreas, setRdMapAreas] = useState<RDMapArea[]>([]);

  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [areasError, setAreasError] = useState<string | null>(null);

  const A = area ?? {};
  const geo = A.geometry ?? {};
  const flightArea = geo.flightArea ?? {};
  const safetyArea = geo.safetyArea ?? {};
  // const flight = A.flight_area ?? {};
  const droneCnt = A.drone_count ?? {};
  const actions = A.actions ?? {};
  // 行レイアウトを統一（最低/最高高度の行間に合わせる）
  const rowCls = "mt-2 pl-4 md:pl-6 flex items-center gap-2";
  // 横幅を一括管理
  const inputW = "!w-[55px]";
  // 数値欄は中央寄せ
  const numericInputW = `${inputW} text-center`;
  const turn = geo.turn;
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

  // uuid を受け取って、area_uuid / area_name 両方更新
  const handleAreaUuidChange = (uuid: string) => {
    const found = rdMapAreas.find((a) => a.uuid === uuid);
    const areaName = found?.areaName ?? "";

    const next = {
      ...(A ?? {}),
      area_uuid: uuid,
      area_name: areaName,
    };
    onPatchArea(next);

    onChangeAreaName?.(areaName);
  };

  const handleAreaNameChange = (value: string) => {
    patch(["area_name"], value);
    // 親側にも通知
    onChangeAreaName?.(value);
  };

  const num = (s: string) => {
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  };

  // x / y 機体数の更新
  const setXCount = (v: string) => {
    const next = {
      ...(area ?? {}),
      drone_count: { ...(area?.drone_count ?? {}), x_count: num(v) },
    };
    onPatchArea(next);
  };
  const setYCount = (v: string) => {
    const next = {
      ...(area ?? {}),
      drone_count: { ...(area?.drone_count ?? {}), y_count: num(v) },
    };
    onPatchArea(next);
  };

  //
  useEffect(() => {
    let cancelled = false;

    const fetchAreas = async () => {
      setIsLoadingAreas(true);
      setAreasError(null);
      try {
        const res = await fetch(AREAS_JSON_URL);
        if (!res.ok) {
          throw new Error(`Failed to fetch areas: ${res.status}`);
        }

        const data = (await res.json()) as RDMapArea[];

        if (cancelled) return;
        setRdMapAreas(data);

        // areaName 昇順に並べる（任意）
        const sorted = [...data].sort((a, b) =>
          a.areaName.localeCompare(b.areaName, "ja")
        );

        // 今は value=areaName で RDHub 側の area_name と紐づけ
        // 将来的に uuid を保存したくなったらここを value: area.uuid に変更
        const options: SelectOption[] = sorted.map((area) => ({
          value: area.uuid,
          label: area.areaName,
        }));

        setAreaOptions(options);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAreasError("開催地一覧の取得に失敗しました");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAreas(false);
        }
      }
    };

    fetchAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-1">
      {/* 開催地 */}
      <div className="mt-5">
        <SectionTitle title="開催地" compact />
        <div className="pl-4 md:pl-6">
          <DisplayOrSelect
            edit={edit}
            value={A.area_uuid ?? ""}
            onChange={(e) => handleAreaUuidChange(e.target.value)}
            options={areaOptions}
            placeholder={
              areasError
                ? "エリア取得エラー"
                : isLoadingAreas
                ? "読込中..."
                : "未設定"
            }
            className="max-w-[260px]"
            isLoading={isLoadingAreas}
            isDisabled={!!areasError}
          />
        </div>
      </div>

      {/* 機体配置 */}
      <div className="mt-5">
        <SectionTitle title="機体数" />

        {/* 機種 & 総機体数 */}
        <div className={rowCls}>
          <div className="w-24">
            <DisplayOrInput
              edit={edit}
              value={droneCnt.model ?? ""}
              onChange={(e) => patch(["drone_count", "model"], e.target.value)}
              placeholder="機種"
              className="w-full text-center"
            />
          </div>

          {/* コロン列（全行で同じ幅） */}
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>

          {/* 値列（数値入力） */}
          <DisplayOrInput
            edit={edit}
            value={(droneCnt.count ?? "").toString()}
            onChange={(e) =>
              patch(["drone_count", "count"], num(e.target.value))
            }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">機</span>
        </div>

        {/* x機体数 */}
        <div className={rowCls}>
          <span className="w-24 text-sm">x機体数</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={edit}
            value={(area?.drone_count?.x_count ?? "").toString()}
            onChange={(e) => setXCount(e.target.value)}
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">機</span>
        </div>

        {/* y機体数 */}
        <div className={rowCls}>
          <span className="w-24 text-sm">y機体数</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={edit}
            value={(area?.drone_count?.y_count ?? "").toString()}
            onChange={(e) => setYCount(e.target.value)}
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">機</span>
        </div>
      </div>

      {/* 離陸アクション移動 */}
      <div className="mt-5">
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

      {/* 障害物 */}
      <div className="mt-5">
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
      <div className="mt-5">
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

      {/* 旋回 */}
      <div className="mt-5">
        <SectionTitle title="旋回" />
        <div className="pl-4 md:pl-6">
          <DisplayOrInput
            edit={false}
            value={
              turn
                ? turn.direction === "ccw"
                  ? `反時計回りに${turn.angle_deg}度回転`
                  : `時計回りに${turn.angle_deg}度回転`
                : "—"
            }
            className="max-w-[260px]"
          />
        </div>{" "}
      </div>

      {/* 観客からの距離 */}
      <div className="mt-5">
        <SectionTitle title="観客からの距離" />
        <div className={rowCls}>
          <span className="w-33 text-sm text-right">約</span>
          <DisplayOrInput
            edit={false}
            value={(A.distance_from_viewers_m ?? "").toString()}
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6">m</span>
        </div>
      </div>

      {/* 最低・最高高度・保安エリア */}
      <div className="mt-5">
        <SectionTitle title="最低・最高高度" />
        <div className={rowCls}>
          <span className="w-24 text-sm">最低高度</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={false}
            value={(geo.flightAltitude_min_m ?? "").toString()}
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
        <div className={rowCls}>
          <span className="w-24 text-sm">最高高度</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={false}
            value={(geo.flightAltitude_Max_m ?? "").toString()}
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
        <div className={rowCls}>
          <span className="w-24 text-sm">保安エリア</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={false}
            value={(safetyArea.buffer_m ?? "").toString()}
            // onChange={(e) =>
            //   patch(["geometry", "safetyArea", "buffer_m"], num(e.target.value))
            // }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />{" "}
          <span className="w-6 ml-1">m</span>
        </div>
      </div>

      {/* アニメーションサイズ */}
      <div className="mt-5">
        <SectionTitle title="アニメーションサイズ" />
        <div className={rowCls}>
          <span className="w-24 text-sm">横幅</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={false}
            value={
              flightArea.radiusX_m != null
                ? String(flightArea.radiusX_m * 2) // ← 表示は×2
                : ""
            }
            // onChange={(e) =>
            //   patch(
            //     ["geometry", "flightArea", "radiusX_m"],
            //     num(e.target.value)
            //   )
            // }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>

        <div className={rowCls}>
          <span className="w-24 text-sm">奥行</span>
          <span className="w-4 text-2xl leading-none text-center mr-3">:</span>
          <DisplayOrInput
            edit={false}
            value={
              flightArea.radiusY_m != null
                ? String(flightArea.radiusY_m * 2) // ← 表示は×2
                : ""
            }
            // onChange={(e) =>
            //   patch(
            //     ["geometry", "flightArea", "radiusY_m"],
            //     num(e.target.value)
            //   )
            // }
            inputMode="numeric"
            type="number"
            className={numericInputW}
          />
          <span className="w-6 ml-1">m</span>
        </div>
      </div>
    </div>
  );
}
