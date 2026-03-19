// src/features/hub/tabs/Operation/index.tsx
import { useEffect, useRef, useState } from "react";
import { DesktopPanel, MobilePanel } from "./sections";
import { useGrid } from "./hooks/useGrid";
import { parseNums, normalizeInput } from "./utils/format";

type UiModule = {
  name: string;
  input: string;
  appliedIds: number[];
  validationMessage?: string;
};

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

  // モジュール（0〜5件）
  const [modules, setModules] = useState<UiModule[]>([]);

  const maxIdExclusive = (() => {
    const t = safeCounts.total;
    if (typeof t === "number" && Number.isFinite(t) && t > 0) return t;
    const approx = countX * countY;
    return Number.isFinite(approx) && approx > 0 ? approx : undefined;
  })();

  const validateIds = (ids: number[]) => {
    const filtered = ids.filter((n) => Number.isInteger(n) && n >= 0);
    const unique: number[] = [];
    const seen = new Set<number>();
    let dupCount = 0;
    for (const n of filtered) {
      if (seen.has(n)) {
        dupCount++;
        continue;
      }
      seen.add(n);
      unique.push(n);
    }

    let outOfRangeCount = 0;
    const bounded =
      typeof maxIdExclusive === "number"
        ? unique.filter((n) => {
            const ok = n < maxIdExclusive;
            if (!ok) outOfRangeCount++;
            return ok;
          })
        : unique;

    return {
      ids: bounded,
      removed: {
        nonIntegerOrNegative: ids.length - filtered.length,
        duplicates: dupCount,
        outOfRange: outOfRangeCount,
      },
      maxIdExclusive,
    };
  };

  const patchModulesToOperation = (nextModules: UiModule[]) => {
    const payload = nextModules.map((m) => ({
      name: m.name,
      ids: parseNums(normalizeInput(m.input ?? "")),
    }));
    onPatchOperation({ modules: payload });
  };

  const handleAddModule = () => {
    setModules((prev) => {
      if (prev.length >= 5) return prev;
      const nextIndex = prev.length + 1;
      const next = [
        ...prev,
        { name: `モジュール${nextIndex}`, input: "", appliedIds: [] },
      ];
      patchModulesToOperation(next);
      return next;
    });
  };

  const handleRemoveModule = (index: number) => {
    setModules((prev) => {
      const next = prev.filter((_, i) => i !== index);
      patchModulesToOperation(next);
      return next;
    });
  };

  const handleChangeModuleName = (index: number, v: string) => {
    setModules((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], name: v };
      patchModulesToOperation(next);
      return next;
    });
  };

  const handleChangeModuleInput = (index: number, v: string) => {
    setModules((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], input: v };
      return next;
    });
  };

  const handleNumbersBlurModule = (index: number, normalized: string) => {
    const norm = normalizeInput(normalized);
    const rawIds = parseNums(norm);
    const v = validateIds(rawIds);
    const ids = v.ids;
    const removedTotal =
      v.removed.nonIntegerOrNegative + v.removed.duplicates + v.removed.outOfRange;
    const validationMessage =
      removedTotal > 0
        ? [
            v.removed.duplicates > 0
              ? `重複${v.removed.duplicates}件`
              : null,
            v.removed.outOfRange > 0 && typeof v.maxIdExclusive === "number"
              ? `範囲外${v.removed.outOfRange}件（0〜${v.maxIdExclusive - 1}）`
              : v.removed.outOfRange > 0
                ? `範囲外${v.removed.outOfRange}件`
                : null,
            v.removed.nonIntegerOrNegative > 0
              ? `不正${v.removed.nonIntegerOrNegative}件`
              : null,
          ]
            .filter(Boolean)
            .join(" / ") + " を除外しました"
        : undefined;

    const normalizedForDisplay = ids.join(" ");
    setModules((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        input: normalizedForDisplay,
        appliedIds: ids,
        validationMessage,
      };
      patchModulesToOperation(next);
      return next;
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

    const snapshot = JSON.stringify({
      mods: operation?.modules ?? null,
      meas: operation?.measurement ?? null,
      memo: operation?.memo ?? "",
    });

    if (snapshot !== lastInitRef.current) {
      lastInitRef.current = snapshot;

      const mods: { name?: string; ids?: number[] }[] = Array.isArray(
        operation?.modules
      )
        ? operation!.modules
        : [];
      setModules(
        mods.slice(0, 5).map((m, idx) => ({
          name: typeof m?.name === "string" ? m.name : `モジュール${idx + 1}`,
          input: Array.isArray(m?.ids) ? m.ids.join(" ") : "",
          appliedIds: Array.isArray(m?.ids) ? m.ids : [],
          validationMessage: undefined,
        }))
      );

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

  const appliedM1 = modules[0]?.appliedIds ?? [];
  const appliedM2 = modules[1]?.appliedIds ?? [];

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
        modules={modules}
        onAddModule={handleAddModule}
        onRemoveModule={handleRemoveModule}
        onChangeModuleName={handleChangeModuleName}
        onChangeModuleInput={handleChangeModuleInput}
        onNumbersBlurModule={handleNumbersBlurModule}
        appliedM1={appliedM1}
        appliedM2={appliedM2}
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
        modules={modules}
        onAddModule={handleAddModule}
        onRemoveModule={handleRemoveModule}
        onChangeModuleName={handleChangeModuleName}
        onChangeModuleInput={handleChangeModuleInput}
        onNumbersBlurModule={handleNumbersBlurModule}
        appliedM1={appliedM1}
        appliedM2={appliedM2}
        onCommitMeasurement={commitMeasurement}
        spacingXY={spacingXY}
        spacingSeqX={spacingSeqX}
        spacingSeqY={spacingSeqY}
      />
    </div>
  );
}
