import type { Candidate, DetailMeta, OtherFlightFigure } from "@/features/types";

export const EMPTY_DETAIL_META: DetailMeta = {
  overview: "",
  address: "",
  companyName: "",
  manager: "",
  prefecture: "",
  droneRecord: 0,
  aircraftCount: "",
  altitudeLimit: "",
  availability: "",
  statusMemo: "",
  permitMemo: "",
  restrictionsMemo: "",
  remarks: "",
  candidate: [],
  otherRecords: [],
  candidateDeletionLocked: false,
  updated_at: undefined,
  updated_by: undefined,
};

export function buildHubUrl(
  projectUuid?: string,
  date?: string,
  scheduleUuid?: string
): string | null {
  if (!projectUuid) return null;

  const { protocol, hostname } = window.location;
  const isLocalLike =
    hostname === "localhost" || hostname.startsWith("192.168.");

  const yearFromDate =
    typeof date === "string" && /^\d{4}/.test(date)
      ? date.slice(0, 4)
      : String(new Date().getFullYear());

  const tabParam = "tab=エリア";
  const scheduleParam =
    scheduleUuid && scheduleUuid.trim()
      ? `&scheduleUuid=${encodeURIComponent(scheduleUuid)}`
      : "";

  if (isLocalLike) {
    return `${protocol}//${hostname}:5174/hub/${projectUuid}?source=s3&year=${yearFromDate}&${tabParam}${scheduleParam}`;
  }

  const base = String(import.meta.env.VITE_HUB_BASE_URL || "").replace(
    /\/+$/,
    ""
  );
  if (!base) return null;

  return `${base}/${projectUuid}?source=s3&year=${yearFromDate}&${tabParam}${scheduleParam}`;
}

export function fmtDate(isoLike: string) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return isoLike;
  const yy = String(d.getFullYear()).slice(-2);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const da = `${d.getDate()}`.padStart(2, "0");
  return `${yy}/${m}/${da}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hasDuplicateCandidateTitle(
  candidates: Candidate[],
  title: string,
  selfIndex: number | null
) {
  const normalized = title.trim();
  if (!normalized) return false;
  return candidates.some((c, idx) => {
    if (idx === selfIndex) return false;
    return (c.title ?? "").trim() === normalized;
  });
}

export function makeUniqueCandidateCopyTitle(
  candidates: Candidate[],
  baseTitle: string
): string {
  const source = baseTitle.trim() || "候補地ラベル";
  const first = `${source} (コピー)`;
  if (!hasDuplicateCandidateTitle(candidates, first, null)) return first;

  let n = 2;
  while (true) {
    const next = `${source} (コピー${n})`;
    if (!hasDuplicateCandidateTitle(candidates, next, null)) return next;
    n += 1;
  }
}

export function geometryFromFigure(
  figure: Candidate | OtherFlightFigure
) {
  return {
    flightAltitude_min_m: figure.flightAltitude_min_m,
    flightAltitude_Max_m: figure.flightAltitude_Max_m,
    takeoffArea: figure.takeoffArea,
    flightArea: figure.flightArea,
    safetyArea: figure.safetyArea,
    audienceArea: figure.audienceArea,
  };
}

export function isEmptyOtherRecord(record: {
  companyName?: string;
  eventName?: string;
  date?: string;
  aircraftCount?: string;
  referenceUrl?: string;
  memo?: string;
  figures?: OtherFlightFigure[];
}): boolean {
  const textEmpty =
    !(record.eventName ?? "").trim() &&
    !(record.companyName ?? "").trim() &&
    !(record.date ?? "").trim() &&
    !(record.aircraftCount ?? "").trim() &&
    !(record.referenceUrl ?? "").trim() &&
    !(record.memo ?? "").trim();
  if (!textEmpty) return false;
  return !Array.isArray(record.figures) || record.figures.length === 0;
}
