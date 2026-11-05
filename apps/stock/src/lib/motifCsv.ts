import { parseCSV } from "./parseCsv";

/** 画面とPDFが読む見出し。担当者・実機体数・備考・サイト反映は使わない。 */
const COLUMN = {
  id: "番号",
  date: "追加日",
  name: "モチーフ名",
  droneType: "機体名",
  height: "縦(m)",
  width: "横(m)",
  depth: "奥行(m)",
  length: "総尺(s)",
  planeNum: "機体数(切上げ)",
  season: "季節",
  category: "カテゴリー",
} as const;

export interface MotifCsvRow {
  id: string;
  date: string;
  name: string;
  droneType: string;
  height: string;
  width: string;
  depth: string;
  length: string;
  planeNum: string;
  season: string;
  category: string;
  fileName: string;
}

function orDash(value: string): string {
  return value || "-";
}

function cell(row: string[], indexByHeader: Map<string, number>, header: string): string {
  const index = indexByHeader.get(header);
  if (index === undefined) return "";
  return row[index]?.trim() ?? "";
}

/** 見出し名で motifs.csv を読む。番号は4桁に補う。 */
export function parseMotifCsv(text: string): MotifCsvRow[] {
  const table = parseCSV(text.replace(/^\uFEFF/, ""));
  if (table.length === 0) return [];

  const indexByHeader = new Map<string, number>();
  table[0].forEach((header, index) => {
    const name = header.trim();
    if (name && !indexByHeader.has(name)) indexByHeader.set(name, index);
  });

  return table.slice(1).map((row) => {
    const rawId = cell(row, indexByHeader, COLUMN.id);
    const id = rawId ? rawId.padStart(4, "0") : "";
    const rawName = cell(row, indexByHeader, COLUMN.name);
    const name = rawName && rawName !== "-" ? rawName : "";
    const fileName = [id, name].filter(Boolean).join("_");

    return {
      id,
      date: cell(row, indexByHeader, COLUMN.date),
      name,
      droneType: orDash(cell(row, indexByHeader, COLUMN.droneType)),
      height: orDash(cell(row, indexByHeader, COLUMN.height)),
      width: orDash(cell(row, indexByHeader, COLUMN.width)),
      depth: orDash(cell(row, indexByHeader, COLUMN.depth)),
      length: orDash(cell(row, indexByHeader, COLUMN.length)),
      planeNum: orDash(cell(row, indexByHeader, COLUMN.planeNum)),
      season: orDash(cell(row, indexByHeader, COLUMN.season)),
      category: orDash(cell(row, indexByHeader, COLUMN.category)),
      fileName,
    };
  });
}
