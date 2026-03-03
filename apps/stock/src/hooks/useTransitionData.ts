import { useState, useEffect } from "react";
import { parseCSV } from "@/lib/parseCsv";
import { ASSETS_BASE } from "@/lib/assetsBase";
import type { TransitionData } from "@/types/stock";

export function useTransitionData() {
  const [data, setData] = useState<TransitionData[]>([]);

  useEffect(() => {
    fetch(`${ASSETS_BASE}/csv/transitions.csv`)
      .then((r) => r.text())
      .then((text) => {
        const [, ...rows] = parseCSV(text);
        setData(
          rows
            .map(([id, name]) => ({
              id,
              name: name || "",
              filename: `${id}_${name}`,
            }))
            .filter((t) => t.id)
        );
      })
      .catch(() => setData([]));
  }, []);

  return data;
}
