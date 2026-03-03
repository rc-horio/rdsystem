import { useState, useEffect } from "react";
import { parseCSV } from "@/lib/parseCsv";
import { ASSETS_BASE } from "@/lib/assetsBase";
import type { MotifData } from "@/types/stock";

function toTimestamp(str: string): number {
  if (!str || str === "-") return 0;
  const iso = str.replace(/\//g, "-");
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function parseMotifData(csvArray: string[][]): MotifData[] {
  const [, ...rows] = csvArray;
  return rows
    .map(
      ([
        id,
        date,
        name,
        ,
        droneType,
        h,
        w,
        d,
        len,
        truncate,
        season,
        category,
        popular,
      ]) => {
        const rawId = id?.trim() || "";
        const safeId = rawId ? String(rawId).padStart(4, "0") : "";
        const rawName = name?.trim() || "";
        const safeName = rawName && rawName !== "-" ? rawName : "";
        const fileName = [safeId, safeName].filter(Boolean).join("_");

        return {
          skip: fileName === "",
          id: safeId || "-",
          dateValue: toTimestamp(date || ""),
          motifName: safeName || "-",
          planeNum: truncate || "-",
          droneType: droneType || "-",
          fileName,
          height: h || "-",
          width: w || "-",
          depth: d || "-",
          length: len || "-",
          season: season || "-",
          category: category || "-",
          popular: popular || "-",
        };
      }
    )
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
        const parsed = parseCSV(text);
        setData(parseMotifData(parsed));
      })
      .catch((e) => {
        setError(String(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
