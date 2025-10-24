import {
  SectionTitle,
  Drone1Icon,
  Drone2Icon,
  DisplayOrInput,
} from "@/components";

type Props = {
  edit: boolean;
  area: any | null;
  onPatchArea: (patch: any) => void;
};

export function LandingAreaFigure({ edit, area, onPatchArea }: Props) {
  const horizontal = area?.spacing_between_drones_m?.horizontal ?? "";
  const vertical = area?.spacing_between_drones_m?.vertical ?? "";

  // 累積回転（%360 しない）
  const rotation =
    typeof area?.drone_orientation_deg === "number" &&
    Number.isFinite(area.drone_orientation_deg)
      ? (area.drone_orientation_deg as number)
      : 0;

  // 数値パース
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

  const setHorizontal = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        horizontal: v,
      },
    };
    onPatchArea(next);
  };

  const setVertical = (v: string) => {
    const next = {
      ...(area ?? {}),
      spacing_between_drones_m: {
        ...(area?.spacing_between_drones_m ?? {}),
        vertical: v,
      },
    };
    onPatchArea(next);
  };

  // 90°単位で回転（累積）
  const rotateBy = (delta: number) => {
    const current =
      typeof rotation === "number" && Number.isFinite(rotation) ? rotation : 0;
    const next = current + delta; // 正規化しない
    const patched = { ...(area ?? {}), drone_orientation_deg: next };
    onPatchArea(patched);
  };

  // 回転に基づいてAntennaの位置を変更
  const antennaPosition = () => {
    const radius = 75; // アイコン1から文字の距離（円周半径）
    const angleInRadians = ((rotation + 90) % 360) * (Math.PI / 180); // 0度を下に配置するため +90度
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);

    // 初期位置（0度）の場合、y位置だけ下げる
    const yOffset = 35; // yオフセットを追加して、文字を下に位置させる
    return { x, y: y + yOffset }; // yにオフセットを追加
  };

  const { x, y } = antennaPosition(); // Aantennaの位置を算出

  // バッテリーの反対側の位置
  const batteryPosition = () => {
    const radius = 75; // アイコン1から文字の距離（円周半径）
    const angleInRadians = ((rotation + 270) % 360) * (Math.PI / 180); // 逆方向(270度)に配置
    const x = radius * Math.cos(angleInRadians);
    const y = radius * Math.sin(angleInRadians);

    // 初期位置（270度）の場合、y位置だけ下げる
    const yOffset = 35; // yオフセットを追加して、文字を下に位置させる
    return { x, y: y + yOffset }; // yにオフセットを追加
  };

  const { x: batteryX, y: batteryY } = batteryPosition(); // Batteryの位置を算出

  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア 図" />

      {/* プレースホルダー（高さは任意） */}
      <div className="my-4 h-105 w-full border border-slate-600 grid place-content-center text-slate-400 text-sm">
        離発着エリア図 (SVG / 画像)
      </div>

      {/* x / y 機体数（横並び） */}
      <div className="mt-2 mb-4 flex items-center justify-center gap-4">
        <span className="text-sm w-auto">x機体数</span>
        <DisplayOrInput
          edit={edit}
          value={(area?.drone_count?.x_count ?? "").toString()}
          onChange={(e) => setXCount(e.target.value)}
          inputMode="numeric"
          type="number"
          className="w-[70px] text-center"
        />
        <span className="text-sm w-auto">y機体数</span>
        <DisplayOrInput
          edit={edit}
          value={(area?.drone_count?.y_count ?? "").toString()}
          onChange={(e) => setYCount(e.target.value)}
          inputMode="numeric"
          type="number"
          className="w-[70px] text-center"
        />
      </div>

      {/* 簡易図：縦並び（外枠 h-120） */}
      <div className="my-4 h-120 w-full relative flex flex-col items-center justify-center border border-slate-600">
        {/* ラベル */}
        <span className="absolute top-2 left-3 text-white text-sm font-semibold">
          機体の向き
        </span>

        {/* ===== アイコン1セット（中のレイアウトはそのまま） ===== */}
        <div className="relative flex flex-col items-center justify-center">
          {/* 左セット（元の absolute 配置のまま） */}
          <div className="flex flex-col items-center gap-1">
            {/* Batteryの位置（削除した部分） */}
            {/* <span className="text-sm text-slate-100">Battery</span> */}

            {/* 回転対応（累積）— 画像要素特定のため class を付与 */}
            <Drone1Icon
              className="w-24 h-24 drone1-img"
              rotationDeg={rotation}
            />

            {/* 回転ボタン（アイコンと“Antenna”の間） */}
            <div className="mt-12 flex items-center gap-3">
              <button
                type="button"
                onClick={() => rotateBy(-90)}
                disabled={!edit}
                className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                aria-label="左へ90度回転"
                title="左へ90°"
              >
                ↶
              </button>
              <button
                type="button"
                onClick={() => rotateBy(90)}
                disabled={!edit}
                className="px-2 py-1 rounded-md border border-slate-600 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                aria-label="右へ90度回転"
                title="右へ90°"
              >
                ↷
              </button>
            </div>

            {/* Aantennaの位置調整 */}
            <div
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                transformOrigin: "center",
                transition: "transform 0.2s ease-out", // スムーズなアニメーションを追加
              }}
            >
              <span className="text-sm text-red-500">Antenna</span>
            </div>

            {/* Batteryの位置（対極の位置） */}
            <div
              className="absolute"
              style={{
                transform: `translate(${batteryX}px, ${batteryY}px)`, // Aantennaと対極の位置に配置
                transformOrigin: "center",
                transition: "transform 0.2s ease-out", // スムーズなアニメーションを追加
              }}
            >
              <span className="text-sm text-white">Battery</span>
            </div>
          </div>
        </div>

        {/* ===== セット間の余白 ===== */}
        <div className="h-10" />

        {/* ===== アイコン2セット（中のレイアウトはそのまま） ===== */}
        <div className="relative flex flex-col items-center justify-center">
          {/* 中央距離（horizontal）— アイコン2の左側に配置 */}
          <div className="absolute left-[-100px] flex items-center gap-2">
            <DisplayOrInput
              edit={edit}
              value={horizontal}
              onChange={(e) => setHorizontal(e.target.value)}
              className="w-[70px] text-center"
            />
            <span className="text-slate-100 text-sm">m</span>
          </div>

          {/* 右側アイコン（Drone2）— 元の座標のまま（画像要素特定のため class 付与） */}
          <div>
            <Drone2Icon className="w-24 h-24 drone2-img" />
          </div>

          {/* 下部距離（vertical）— 位置を下げて、右に配置 */}
          <div
            className="absolute flex items-center gap-2"
            style={{
              top: "110px", // 下に配置
              left: "10px", // 右に配置
            }}
          >
            <DisplayOrInput
              edit={edit}
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-[70px] text-center"
            />
            <span className="text-slate-100 text-sm">m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
