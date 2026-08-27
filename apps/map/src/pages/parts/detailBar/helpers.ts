import type {
  Candidate,
  ConsideringInfo,
  DetailMeta,
  OtherFlightFigure,
  OtherRecord,
} from "@/features/types";

export const EMPTY_CONSIDERING_INFO: ConsideringInfo = {
  status: "",
  statusDetail: "",
  manager: "",
  channel: "",
  feasibility: "",
  costEstimate: "",
  memo: "",
};

export const EMPTY_DETAIL_META: DetailMeta = {
  overview: "",
  address: "",
  companyName: "",
  administrator: "",
  contact: "",
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
  considering: { ...EMPTY_CONSIDERING_INFO },
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
  const yyyy = String(d.getFullYear());
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const da = `${d.getDate()}`.padStart(2, "0");
  return `${yyyy}/${m}/${da}`;
}

/** 日付の新しい順。空・不正は末尾。 */
export function compareDateDesc(a: string, b: string) {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  const na = Number.isNaN(ta) ? 0 : ta;
  const nb = Number.isNaN(tb) ? 0 : tb;
  return nb - na;
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

export const OTHER_COMPANY_PRESETS = [
  "ドローンショー・ジャパン",
  "VISIONOID",
  "ENCORE",
  "協和産業",
  "White Crow",
  "AlterSky",
  "SKYTEK",
] as const;

export const OTHER_COMPANY_FREE_LABEL = "その他";

export function isPresetOtherCompany(name: string): boolean {
  return (OTHER_COMPANY_PRESETS as readonly string[]).includes(name);
}

export function hasConsideringGeometry(candidate: Candidate): boolean {
  return !!(
    candidate.takeoffArea ||
    candidate.flightArea ||
    candidate.safetyArea ||
    candidate.audienceArea ||
    candidate.flightAltitude_min_m != null ||
    candidate.flightAltitude_Max_m != null
  );
}

export function isEmptyConsideringCandidate(candidate: Candidate): boolean {
  return !(candidate.title ?? "").trim() && !hasConsideringGeometry(candidate);
}

export const CONSIDERING_STATUS_PRESETS = ["OK", "交渉中", "NG"] as const;
export const CONSIDERING_STATUS_UNSET_LABEL = "未交渉";
export const CONSIDERING_STATUS_REQUIRED_ALERT =
  "未交渉のまま候補地の内容を変更することはできません。ステータスを選択してください。";
export const CONSIDERING_STATUS_OK_CONFIRM =
  "このエリアの交渉ステータスを「OK」に変更しますか？";

export function isPresetConsideringStatus(name: string): boolean {
  return (CONSIDERING_STATUS_PRESETS as readonly string[]).includes(name);
}

export function consideringStatusLabel(status: string): string {
  const trimmed = status.trim();
  if (isPresetConsideringStatus(trimmed)) return trimmed;
  return CONSIDERING_STATUS_UNSET_LABEL;
}

function normalizeConsideringInfo(
  info: Partial<ConsideringInfo> | null | undefined
): ConsideringInfo {
  return {
    status: (info?.status ?? "").trim(),
    statusDetail: (info?.statusDetail ?? "").trim(),
    manager: (info?.manager ?? "").trim(),
    channel: (info?.channel ?? "").trim(),
    feasibility: (info?.feasibility ?? "").trim(),
    costEstimate: (info?.costEstimate ?? "").trim(),
    memo: (info?.memo ?? "").trim(),
  };
}

function consideringNonStatusEqual(
  a: ConsideringInfo,
  b: ConsideringInfo
): boolean {
  return (
    a.statusDetail === b.statusDetail &&
    a.manager === b.manager &&
    a.channel === b.channel &&
    a.feasibility === b.feasibility &&
    a.costEstimate === b.costEstimate &&
    a.memo === b.memo
  );
}

export type ConsideringSaveSnapshot = {
  considering: ConsideringInfo;
  candidates: Candidate[];
};

export function snapshotConsideringState(
  info: ConsideringInfo | null | undefined,
  candidates: Candidate[] | null | undefined
): ConsideringSaveSnapshot {
  return {
    considering: normalizeConsideringInfo(info),
    candidates: JSON.parse(JSON.stringify(candidates ?? [])),
  };
}

/** 未交渉のまま、候補地タブのステータス以外が前回SAVEから変わっていれば止める */
export function shouldBlockUnsetConsideringStatusSave(args: {
  current: ConsideringInfo;
  currentCandidates: Candidate[];
  saved: ConsideringSaveSnapshot | null;
  consideringFigureChanged?: boolean;
}): boolean {
  const current = normalizeConsideringInfo(args.current);
  if (isPresetConsideringStatus(current.status)) return false;

  const saved = args.saved
    ? {
        considering: normalizeConsideringInfo(args.saved.considering),
        candidates: args.saved.candidates,
      }
    : snapshotConsideringState(EMPTY_CONSIDERING_INFO, []);

  // OK / 交渉中 / NG から未交渉へ戻す操作は通す
  if (isPresetConsideringStatus(saved.considering.status)) return false;

  if (!consideringNonStatusEqual(current, saved.considering)) return true;
  if (
    JSON.stringify(args.currentCandidates ?? []) !==
    JSON.stringify(saved.candidates ?? [])
  ) {
    return true;
  }
  return !!args.consideringFigureChanged;
}

export function needsConsideringStatusDetail(status: string): boolean {
  return isPresetConsideringStatus(status);
}

export const CONSIDERING_CHANNEL_PRESETS = [
  "代理店",
  "直販",
  "問い合わせ",
  "照会",
] as const;

export const CONSIDERING_CHANNEL_FREE_LABEL = "その他";

export function isPresetConsideringChannel(name: string): boolean {
  return (CONSIDERING_CHANNEL_PRESETS as readonly string[]).includes(name);
}

export function hasConsideringContent(
  info: ConsideringInfo,
  candidates: Candidate[]
): boolean {
  if (
    (info.status ?? "").trim() ||
    (info.statusDetail ?? "").trim() ||
    (info.channel ?? "").trim() ||
    (info.feasibility ?? "").trim() ||
    (info.costEstimate ?? "").trim() ||
    (info.memo ?? "").trim() ||
    (info.manager ?? "").trim()
  ) {
    return true;
  }
  return candidates.some((candidate) => !isEmptyConsideringCandidate(candidate));
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

export type AreaKind = "own" | "considering" | "other";

export type AreaKindFlags = {
  own: boolean;
  considering: boolean;
  other: boolean;
};

export const AREA_KIND_ORDER: readonly AreaKind[] = [
  "own",
  "considering",
  "other",
];

export const AREA_KIND_LABEL: Record<AreaKind, string> = {
  own: "RC",
  considering: "候補地",
  other: "他社",
};

export function areaKindFlagList(
  flags: AreaKindFlags | undefined
): AreaKind[] {
  if (!flags) return [];
  return AREA_KIND_ORDER.filter((kind) => flags[kind]);
}

function readHistoryPair(entry: unknown): {
  projectUuid: string;
  scheduleUuid: string;
} | null {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const projectUuid =
    typeof row.projectuuid === "string"
      ? row.projectuuid
      : typeof row.projectUuid === "string"
        ? row.projectUuid
        : "";
  const scheduleUuid =
    typeof row.scheduleuuid === "string"
      ? row.scheduleuuid
      : typeof row.scheduleUuid === "string"
        ? row.scheduleUuid
        : "";
  if (!projectUuid || !scheduleUuid) return null;
  return { projectUuid, scheduleUuid };
}

/** エリア index.json（または保存ペイロード）からフィルター用タグを判定する */
export function getAreaKindFlags(raw: unknown): AreaKindFlags {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const history = Array.isArray(row.history) ? row.history : [];
  const own = history.some((entry) => readHistoryPair(entry) != null);

  const consideringRaw =
    row.considering && typeof row.considering === "object"
      ? (row.considering as Record<string, unknown>)
      : {};
  const considering = isPresetConsideringStatus(
    typeof consideringRaw.status === "string" ? consideringRaw.status : ""
  );

  const otherRecords = Array.isArray(row.otherRecords) ? row.otherRecords : [];
  const other = otherRecords.some(
    (record) =>
      !!record &&
      typeof record === "object" &&
      !isEmptyOtherRecord(record as OtherRecord)
  );

  return { own, considering, other };
}

function readConsideringStatus(raw: unknown): string {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const consideringRaw =
    row.considering && typeof row.considering === "object"
      ? (row.considering as Record<string, unknown>)
      : {};
  return typeof consideringRaw.status === "string"
    ? consideringRaw.status.trim()
    : "";
}

/** 案件が紐づいていてステータスが空なら、既存データの一括で OK にする対象 */
export function shouldSetConsideringOkFromOwnHistory(raw: unknown): boolean {
  return getAreaKindFlags(raw).own && readConsideringStatus(raw) === "";
}

/** considering.status だけ OK にする。他のフィールドと updated_at は触らない */
export function withConsideringStatusOk(raw: unknown): Record<string, unknown> {
  const row =
    raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
  const consideringRaw =
    row.considering && typeof row.considering === "object"
      ? { ...(row.considering as Record<string, unknown>) }
      : {};
  consideringRaw.status = "OK";
  row.considering = consideringRaw;
  return row;
}

/** 未選択（空集合）はすべて表示。選択中は1つでも含むエリアを残す。excludeOwn は自社ありを除外 */
export function areaMatchesKindFilter(
  flags: AreaKindFlags | undefined,
  selected: ReadonlySet<AreaKind>,
  opts?: { excludeOwn?: boolean }
): boolean {
  if (opts?.excludeOwn) {
    if (!flags || flags.own) return false;
  }
  if (selected.size === 0) return true;
  if (!flags) return false;
  if (selected.has("own") && flags.own) return true;
  if (selected.has("considering") && flags.considering) return true;
  if (selected.has("other") && flags.other) return true;
  return false;
}
