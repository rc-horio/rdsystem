import type {
  Candidate,
  FlightFigure,
  Geometry,
  HistoryItem,
  OtherFlightFigure,
  OtherRecord,
} from "@/features/types";
import { compareDateDesc, fmtDate, geometryFromFigure } from "./helpers";

function formatSourceDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${year}/${month}/${day}`;
  }
  return fmtDate(value);
}

export type CopySourceItem = {
  title: string;
  geometry: Geometry;
};

export type OwnScheduleSource = {
  name: string;
  date: string;
  figures: CopySourceItem[];
};

export type OwnProjectSource = {
  name: string;
  schedules: OwnScheduleSource[];
};

export type OtherRecordSource = {
  eventName: string;
  companyName: string;
  date: string;
  figures: CopySourceItem[];
};

export type CopySourceTree = {
  own: OwnProjectSource[];
  considering: CopySourceItem[];
  sales: CopySourceItem[];
  other: OtherRecordSource[];
};

export function cloneGeometry(geometry: Geometry | undefined): Geometry {
  return JSON.parse(JSON.stringify(geometry ?? {})) as Geometry;
}

export function geometryToFlatFields(geometry: Geometry): {
  flightAltitude_min_m?: number;
  flightAltitude_Max_m?: number;
  takeoffArea?: Geometry["takeoffArea"];
  flightArea?: Geometry["flightArea"];
  safetyArea?: Geometry["safetyArea"];
  audienceArea?: Geometry["audienceArea"];
} {
  const g = cloneGeometry(geometry);
  return {
    flightAltitude_min_m: g.flightAltitude_min_m,
    flightAltitude_Max_m: g.flightAltitude_Max_m,
    takeoffArea: g.takeoffArea,
    flightArea: g.flightArea,
    safetyArea: g.safetyArea,
    audienceArea: g.audienceArea,
  };
}

export function makeUniqueCopyTitle(
  existingTitles: string[],
  baseTitle: string,
  emptyFallback: string
): string {
  const source = baseTitle.trim() || emptyFallback;
  const used = new Set(
    existingTitles.map((title) => title.trim()).filter(Boolean)
  );
  const first = `${source} (コピー)`;
  if (!used.has(first)) return first;
  let n = 2;
  while (used.has(`${source} (コピー${n})`)) n += 1;
  return `${source} (コピー${n})`;
}

export function hasAnyCopySource(
  tree: CopySourceTree,
  destinationKind?: "own" | "considering" | "other"
): boolean {
  const includeConsidering = destinationKind !== "other";
  return (
    tree.own.length > 0 ||
    (includeConsidering && tree.considering.length > 0) ||
    tree.sales.length > 0 ||
    tree.other.length > 0
  );
}

function figureSource(figure: FlightFigure): CopySourceItem {
  return {
    title: figure.title ?? "",
    geometry: cloneGeometry(figure.geometry),
  };
}

function flatSource(
  figure: Candidate | OtherFlightFigure
): CopySourceItem {
  return {
    title: figure.title ?? "",
    geometry: cloneGeometry(geometryFromFigure(figure)),
  };
}

export function buildCopySourceTree(
  history: HistoryItem[],
  candidates: Candidate[],
  otherRecords: OtherRecord[],
  sales: Candidate[] = []
): CopySourceTree {
  const own: OwnProjectSource[] = [];
  const projectIndex = new Map<string, number>();

  for (const item of history) {
    const figures = (item.flight_figures ?? []).map(figureSource);
    if (figures.length === 0) continue;
    const key = item.projectUuid?.trim() || `name:${item.projectName}`;
    let project = own[projectIndex.get(key) ?? -1];
    if (!project) {
      project = { name: item.projectName, schedules: [] };
      projectIndex.set(key, own.length);
      own.push(project);
    }
    project.schedules.push({
      name: item.scheduleName,
      date: item.date ? formatSourceDate(item.date) : "",
      figures,
    });
  }

  for (const project of own) {
    project.schedules.sort((a, b) => compareDateDesc(a.date, b.date));
  }

  const considering = candidates.map(flatSource);

  const other: OtherRecordSource[] = [];
  for (const record of otherRecords) {
    const figures = (record.figures ?? []).map(flatSource);
    if (figures.length === 0) continue;
    other.push({
      eventName: record.eventName,
      companyName: record.companyName,
      date: record.date ? formatSourceDate(record.date) : "",
      figures,
    });
  }

  other.sort((a, b) => compareDateDesc(a.date, b.date));

  return { own, considering, sales: sales.map(flatSource), other };
}
