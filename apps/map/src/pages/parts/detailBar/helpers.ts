import type {
  Candidate,
  ConsideringInfo,
  DetailMeta,
  OtherFlightFigure,
  OtherRecord,
  TabKey,
  TabUpdates,
  TabUpdateStamp,
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
  tabUpdates: undefined,
};

export const DETAIL_TAB_KEYS: TabKey[] = [
  "basic",
  "own",
  "other",
  "considering",
];

export function parseTabUpdates(raw: unknown): TabUpdates {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Record<string, unknown>;
  const out: TabUpdates = {};
  for (const key of DETAIL_TAB_KEYS) {
    const row = src[key];
    if (!row || typeof row !== "object") continue;
    const stamp = row as Record<string, unknown>;
    const updated_at =
      typeof stamp.updated_at === "string" ? stamp.updated_at : undefined;
    const updated_by =
      typeof stamp.updated_by === "string" ? stamp.updated_by : undefined;
    if (updated_at || updated_by) {
      out[key] = { updated_at, updated_by };
    }
  }
  return out;
}

/** タブ専用の記録がまだ無い場合、エリア単位の最終更新を仮の値として埋める */
export function seedMissingTabUpdates(
  prev: TabUpdates,
  areaAt?: string,
  areaBy?: string
): TabUpdates {
  if (!(areaAt || areaBy?.trim())) return prev;
  const next: TabUpdates = { ...prev };
  const fallback: TabUpdateStamp = {
    updated_at: areaAt,
    updated_by: areaBy,
  };
  for (const key of DETAIL_TAB_KEYS) {
    if (next[key]?.updated_at || next[key]?.updated_by) continue;
    next[key] = fallback;
  }
  return next;
}

export function applyTabUpdateStamps(
  prev: TabUpdates,
  dirty: readonly TabKey[],
  now: string,
  by: string
): TabUpdates {
  if (dirty.length === 0) return prev;
  const next: TabUpdates = { ...prev };
  const stamp: TabUpdateStamp = { updated_at: now, updated_by: by };
  for (const key of dirty) {
    next[key] = stamp;
  }
  return next;
}

function asText(value: unknown): string {
  return value == null ? "" : String(value);
}

function asDroneRecord(value: unknown): 0 | 1 {
  if (value === 1 || value === "1" || value === "あり") return 1;
  return 0;
}

/** 基本情報タブに相当する index.json の比較用スナップショット */
export function areaBasicSnapshot(info: {
  areaName?: unknown;
  overview?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
}) {
  const ov = info.overview ?? {};
  const dt = info.details ?? {};
  return {
    areaName: asText(info.areaName),
    address: asText(ov.address),
    companyName: asText(ov.companyName),
    administrator: asText(ov.administrator),
    contact: asText(ov.contact),
    prefecture: asText(ov.prefecture),
    manager: asText(ov.manager),
    droneRecord: asDroneRecord(ov.droneRecord),
    aircraftCount: asText(ov.droneCountEstimate),
    altitudeLimit: asText(ov.heightLimitM),
    availability: asText(ov.availability),
    statusMemo: asText(dt.statusMemo),
    permitMemo: asText(dt.permitMemo ?? dt.permitInfo),
    restrictionsMemo: asText(dt.restrictionsMemo ?? dt.restrictions),
    remarks: asText(dt.remarks),
  };
}

export function areaConsideringSnapshot(
  info: Partial<ConsideringInfo> | undefined
) {
  const c = info ?? EMPTY_CONSIDERING_INFO;
  return {
    status: asText(c.status),
    statusDetail: asText(c.statusDetail),
    manager: asText(c.manager),
    channel: asText(c.channel),
    feasibility: asText(c.feasibility),
    costEstimate: asText(c.costEstimate),
    memo: asText(c.memo),
  };
}

export function historyPairsKey(
  pairs: Array<{ projectUuid: string; scheduleUuid: string }>
): string {
  return pairs
    .map((p) => `${p.projectUuid}::${p.scheduleUuid}`)
    .sort()
    .join("\n");
}

export function collectDirtyAreaTabs(input: {
  basicChanged: boolean;
  ownHistoryChanged: boolean;
  consideringChanged: boolean;
  candidateFiguresChanged?: boolean;
  otherChanged: boolean;
  figureTab?: TabKey | null;
}): TabKey[] {
  const dirty = new Set<TabKey>();
  if (input.basicChanged) dirty.add("basic");
  if (input.ownHistoryChanged) dirty.add("own");
  if (input.candidateFiguresChanged) dirty.add("own");
  if (input.consideringChanged) dirty.add("considering");
  if (input.otherChanged) dirty.add("other");
  if (input.figureTab) dirty.add(input.figureTab);
  return Array.from(dirty);
}

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
export const CONSIDERING_STATUS_UNSET_LABEL = "未選択";

export function isPresetConsideringStatus(name: string): boolean {
  return (CONSIDERING_STATUS_PRESETS as readonly string[]).includes(name);
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

export const AREA_KIND_LABEL: Record<AreaKind, string> = {
  own: "RC",
  considering: "候補",
  other: "他社",
};

export type AreaAxis = "own" | "other";
export type AreaAxisChoice = "any" | "yes" | "no";
export type AreaAxisFilter = Record<AreaAxis, AreaAxisChoice>;

export const AREA_AXIS_ORDER: readonly AreaAxis[] = ["own", "other"];

export const AREA_AXIS_LABEL: Record<AreaAxis, string> = {
  own: "RC",
  other: "他社",
};

export const AREA_AXIS_TOGGLE_ORDER = ["yes", "no"] as const;

export const AREA_AXIS_CHOICE_LABEL: Record<
  (typeof AREA_AXIS_TOGGLE_ORDER)[number],
  string
> = {
  yes: "あり",
  no: "なし",
};

export const EMPTY_AREA_AXIS_FILTER: AreaAxisFilter = {
  own: "any",
  other: "any",
};

export function isAreaAxisFilterActive(filter: AreaAxisFilter): boolean {
  return filter.own !== "any" || filter.other !== "any";
}

export function areaKindFlagList(
  flags: AreaKindFlags | undefined
): AreaKind[] {
  if (!flags) return [];
  return AREA_AXIS_ORDER.filter((kind) => flags[kind]);
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

  const otherRecords = Array.isArray(row.otherRecords) ? row.otherRecords : [];
  const other = otherRecords.some(
    (record) =>
      !!record &&
      typeof record === "object" &&
      !isEmptyOtherRecord(record as OtherRecord)
  );

  return { own, considering: false, other };
}

/** 指定なしは問わない。あり/なしはその軸の有無と一致するエリアだけ残す */
export function areaMatchesKindFilter(
  flags: AreaKindFlags | undefined,
  filter: AreaAxisFilter
): boolean {
  if (!isAreaAxisFilterActive(filter)) return true;
  if (!flags) return false;
  if (filter.own === "yes" && !flags.own) return false;
  if (filter.own === "no" && flags.own) return false;
  if (filter.other === "yes" && !flags.other) return false;
  if (filter.other === "no" && flags.other) return false;
  return true;
}
