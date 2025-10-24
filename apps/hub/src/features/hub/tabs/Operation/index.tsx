import { useEffect, useRef, useState } from "react";
import { DesktopPanel, MobilePanel } from "./sections";
import { useGrid } from "./hooks/useGrid";
import { parseNums, normalizeInput } from "./utils/format";

/* =========================
   入力中は未変換／未同期
   フォーカスアウトで正規化 → そのフィールドだけグリッド＆JSON反映
   ========================= */
export default function OperationTab({
  edit,
  setEdit,
  area,
  operation,
  onPatchOperation,
}: {
  edit: boolean;
  setEdit: (v: boolean) => void;
  area: any | null;
  operation: any | null;
  onPatchOperation: (v: any) => void;
}) {
  // ★ フルスクリーン状態を永続化して、回転・リサイズ後に復元
  const [full, setFull] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("op_full") === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("op_full", full ? "1" : "0");
  }, [full]);

  useEffect(() => {
    const reOpenIfNeeded = () => {
      // 回転/リサイズでアンマウントされた場合でも、開いていたら即復元
      const wasOpen = sessionStorage.getItem("op_full") === "1";
      if (wasOpen) setFull(true);
    };
    window.addEventListener("orientationchange", reOpenIfNeeded);
    window.addEventListener("resize", reOpenIfNeeded);
    return () => {
      window.removeEventListener("orientationchange", reOpenIfNeeded);
      window.removeEventListener("resize", reOpenIfNeeded);
    };
  }, []);

  const [memoValue, setMemoValue] = useState("");

  // グリッド
  const {
    inputX,
    inputY,
    inputSpacing,
    setInputX,
    setInputY,
    setInputSpacing,
    countX,
    countY,
    spacing,
    applyGridSize: _applyGridSize,
  } = useGrid({ x: 100, y: 10, spacing: 1 });

  // ★ AreaInfo を唯一のソースにする：AreaInfo 変更→即適用
  // AreaInfo の x/y（と間隔）が利用可能になったら初回から即反映
  useEffect(() => {
    const toNum = (v: unknown) =>
      v === "" || v === undefined || v === null ? NaN : Number(v);

    const ax = toNum(area?.drone_count?.x_count);
    const ay = toNum(area?.drone_count?.y_count);
    // 間隔は必要なら平均化（または片方優先など、運用に合わせて）
    const sx = toNum(area?.spacing_between_drones_m?.vertical);
    const sy = toNum(area?.spacing_between_drones_m?.horizontal);
    const valids = [sx, sy].filter((n) => Number.isFinite(n)) as number[];
    const sAvg = valids.length
      ? valids.reduce((a, b) => a + b, 0) / valids.length
      : NaN;

    // x または y が妥当なら適用
    if (Number.isFinite(ax) || Number.isFinite(ay) || Number.isFinite(sAvg)) {
      _applyGridSize({
        x: Number.isFinite(ax) ? Number(ax) : undefined,
        y: Number.isFinite(ay) ? Number(ay) : undefined,
        spacing: Number.isFinite(sAvg) ? Number(sAvg) : undefined,
      });
      // （必要なら）operation へも保存
      onPatchOperation({
        placement: {
          x: Number.isFinite(ax) ? Number(ax) : inputX,
          y: Number.isFinite(ay) ? Number(ay) : inputY,
          spacing_m: Number.isFinite(sAvg) ? Number(sAvg) : inputSpacing,
        },
      });
    }
  }, [
    area?.drone_count?.x_count,
    area?.drone_count?.y_count,
    area?.spacing_between_drones_m?.vertical,
    area?.spacing_between_drones_m?.horizontal,
  ]);

  const spacingXY = {
    x: area?.spacing_between_drones_m?.vertical ?? "", // 下部距離 → x
    y: area?.spacing_between_drones_m?.horizontal ?? "", // 中央距離 → y
  };

  // CSV文字列を数値配列に（空/不正は除外）
  const parseSeq = (v: unknown): number[] => {
    if (typeof v !== "string") return [];
    return v
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  };
  // x=vertical, y=horizontal のルールを踏襲
  const spacingSeqX = parseSeq(spacingXY.x); // 例: [1,0.8,1,0.8]
  const spacingSeqY = parseSeq(spacingXY.y);

  // エリア情報から表示用の機体数を取り出し
  const dc = (area?.drone_count ?? {}) as {
    count?: number | string | null;
    x_count?: number | string | null;
    y_count?: number | string | null;
  };
  const counts = {
    total: typeof dc.count === "number" ? dc.count : Number(dc.count ?? NaN),
    x: typeof dc.x_count === "number" ? dc.x_count : Number(dc.x_count ?? NaN),
    y: typeof dc.y_count === "number" ? dc.y_count : Number(dc.y_count ?? NaN),
  };
  const safeCounts = {
    total: Number.isFinite(counts.total) ? counts.total : undefined,
    x: Number.isFinite(counts.x) ? counts.x : undefined,
    y: Number.isFinite(counts.y) ? counts.y : undefined,
  };

  // 計測は即時OK
  const [measureNum, setMeasureNum] = useState<number | "">("");
  const commitMeasurement = (targetId: number | "", result: string | null) => {
    onPatchOperation({
      measurement: {
        target_id: targetId === "" ? "" : Number(targetId),
        result,
      },
    });
  };

  // 入力欄（自由入力）
  const [m1Title, setM1Title] = useState("モジュール1");
  const [m1Input, setM1Input] = useState("");
  const [m2Title, setM2Title] = useState("モジュール2");
  const [m2Input, setM2Input] = useState("");

  // 表示用（グリッド色）
  const [appliedM1, setAppliedM1] = useState<number[]>([]);
  const [appliedM2, setAppliedM2] = useState<number[]>([]);

  // ---- フォーカスアウト完了（正規化済み）を受け取って、そのフィールドだけ更新 ----
  const handleNumbersBlurM1 = (normalized: string) => {
    const norm = normalizeInput(normalized); // 念のため二重適用でも安定
    const ids = parseNums(norm);
    setM1Input(norm); // 表示値も正規化済みに
    setAppliedM1(ids); // グリッド更新（片側のみ）
    onPatchOperation({
      modules: [
        { name: m1Title, ids },
        { name: m2Title, ids: parseNums(normalizeInput(m2Input)) },
      ],
    });
  };
  const handleNumbersBlurM2 = (normalized: string) => {
    const norm = normalizeInput(normalized);
    const ids = parseNums(norm);
    setM2Input(norm);
    setAppliedM2(ids);
    onPatchOperation({
      modules: [
        { name: m1Title, ids: parseNums(normalizeInput(m1Input)) },
        { name: m2Title, ids },
      ],
    });
  };

  // タイトルは即時同期してOK（入力制約に影響しない）
  const handleM1Title = (v: string) => {
    setM1Title(v);
    onPatchOperation({
      modules: [
        { name: v, ids: parseNums(normalizeInput(m1Input)) },
        { name: m2Title, ids: parseNums(normalizeInput(m2Input)) },
      ],
    });
  };
  const handleM2Title = (v: string) => {
    setM2Title(v);
    onPatchOperation({
      modules: [
        { name: m1Title, ids: parseNums(normalizeInput(m1Input)) },
        { name: v, ids: parseNums(normalizeInput(m2Input)) },
      ],
    });
  };

  // ---- operation → ローカル初期化（スケジュール切替時のみ） ----
  const lastInitRef = useRef<string>("");
  useEffect(() => {
    const p = operation?.placement;
    if (p) {
      setInputX(Number(p.x) || 0);
      setInputY(Number(p.y) || 0);
      setInputSpacing(Number(p.spacing_m) || 0);
    }

    const mods: { name: string; ids: number[] }[] = Array.isArray(
      operation?.modules
    )
      ? operation!.modules
      : [];
    const m1 = mods[0] ?? { name: "モジュール1", ids: [] };
    const m2 = mods[1] ?? { name: "モジュール2", ids: [] };

    const snapshot = JSON.stringify({
      m1,
      m2,
      meas: operation?.measurement ?? null,
      memo: operation?.memo ?? "",
    });

    if (snapshot !== lastInitRef.current) {
      lastInitRef.current = snapshot;

      setM1Title(m1.name || "");
      setM2Title(m2.name || "");

      const m1Str = (m1.ids ?? []).join(" ");
      const m2Str = (m2.ids ?? []).join(" ");
      setM1Input(m1Str);
      setM2Input(m2Str);

      setAppliedM1(m1.ids ?? []);
      setAppliedM2(m2.ids ?? []);

      const meas = operation?.measurement;
      setMeasureNum(
        typeof meas?.target_id === "number" || meas?.target_id === ""
          ? (meas.target_id as number | "")
          : ""
      );

      setMemoValue(operation?.memo ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  // AreaInfo → useGrid 入力同期（x/y の機体数が変わったら反映）
  useEffect(() => {
    const ax = Number(area?.drone_count?.x_count);
    const ay = Number(area?.drone_count?.y_count);
    if (Number.isFinite(ax)) setInputX(ax);
    if (Number.isFinite(ay)) setInputY(ay);
    // ここでは即 apply はしない（ユーザーが「更新」ボタンで確定する設計）
  }, [area?.drone_count?.x_count, area?.drone_count?.y_count]);

  // メモは即時OK
  const handleChangeMemo = (v: string) => {
    setMemoValue(v);
    onPatchOperation({ memo: v });
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <DesktopPanel
        edit={edit}
        setEdit={setEdit}
        full={full}
        setFull={setFull}
        grid={{
          inputX,
          inputY,
          inputSpacing,
          setInputX,
          setInputY,
          setInputSpacing,
          countX,
          countY,
          spacing,
          applyGridSize: _applyGridSize,
        }}
        measure={{ measureNum, setMeasureNum }}
        counts={safeCounts}
        memoValue={memoValue}
        setMemoValue={handleChangeMemo}
        appliedM1={appliedM1}
        appliedM2={appliedM2}
        setAppliedM1={setAppliedM1}
        setAppliedM2={setAppliedM2}
        module1={{
          title: m1Title,
          setTitle: handleM1Title,
          input: m1Input,
          setInput: setM1Input, // 入力中はローカルのみ
          onNumbersBlur: handleNumbersBlurM1, // ← フィールド個別に処理
        }}
        module2={{
          title: m2Title,
          setTitle: handleM2Title,
          input: m2Input,
          setInput: setM2Input,
          onNumbersBlur: handleNumbersBlurM2,
        }}
        onCommitMeasurement={commitMeasurement}
        spacingXY={spacingXY}
        spacingSeqX={spacingSeqX}
        spacingSeqY={spacingSeqY}
      />

      <MobilePanel
        edit={edit}
        setEdit={setEdit}
        full={full}
        setFull={setFull}
        grid={{
          inputX,
          inputY,
          inputSpacing,
          setInputX,
          setInputY,
          setInputSpacing,
          countX,
          countY,
          spacing,
          applyGridSize: _applyGridSize,
        }}
        measure={{ measureNum, setMeasureNum }}
        counts={safeCounts}
        memoValue={memoValue}
        setMemoValue={handleChangeMemo}
        appliedM1={appliedM1}
        appliedM2={appliedM2}
        setAppliedM1={setAppliedM1}
        setAppliedM2={setAppliedM2}
        module1={{
          title: m1Title,
          setTitle: handleM1Title,
          input: m1Input,
          setInput: setM1Input,
          onNumbersBlur: handleNumbersBlurM1,
        }}
        module2={{
          title: m2Title,
          setTitle: handleM2Title,
          input: m2Input,
          setInput: setM2Input,
          onNumbersBlur: handleNumbersBlurM2,
        }}
        onCommitMeasurement={commitMeasurement}
        spacingXY={spacingXY}
        spacingSeqX={spacingSeqX}
        spacingSeqY={spacingSeqY}
      />
    </div>
  );
}
