import { useState, useEffect } from "react";
import { parseMotifCsv } from "@/lib/motifCsv";
import { ASSETS_BASE } from "@/lib/assetsBase";
import type { MotifData } from "@/types/stock";

function toTimestamp(str: string): number {
  if (!str || str === "-") return 0;
  const iso = str.replace(/\//g, "-");
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function parseMotifData(text: string): MotifData[] {
  return parseMotifCsv(text)
    .map((row) => {
      return {
        skip: row.fileName === "",
        id: row.id || "-",
        dateValue: toTimestamp(row.date),
        motifName: row.name || "-",
        planeNum: row.planeNum,
        droneType: row.droneType,
        fileName: row.fileName,
        height: row.height,
        width: row.width,
        depth: row.depth,
        length: row.length,
        season: row.season,
        category: row.category,
        popular: "-",
      };
    })
    .filter((m) => {
      if (m.skip) return false;
      const values = Object.values({
        ...m,
        skip: undefined,
        fileName: undefined,
      });
      const allEmpty = values.every((v) => v === "-");
      const onlyIdExists =
        m.id !== "-" && values.slice(1).every((v) => v === "-");
      return !(allEmpty || onlyIdExists);
    }) as MotifData[];
}

export function useMotifData() {
  const [data, setData] = useState<MotifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${ASSETS_BASE}/csv/motifs.csv`)
      .then((r) => r.text())
      .then((text) => {
        setData(parseMotifData(text));
      })
      .catch(() => {
        setError("データの読み込みができませんでした。しばらく時間をおいて、もう一度お試しください。");
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
