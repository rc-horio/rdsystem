import type {
  ScheduleLinkExtra,
  ScheduleLinks,
} from "@/features/hub/types/resource";

export const LINK_URL_SCHEME_ERROR = "https:// から始まるURLにしてください";
export const LINK_NAME_ERROR = "名前を入力してください";
export const LINK_MISSING_URL_ERROR = "URLを入力してください";

export type LinkFieldError = {
  name: string | null;
  url: string | null;
};

export type InspectedScheduleLinks = {
  links: ScheduleLinks;
  slackError: string | null;
  driveError: string | null;
  /** 入力中のその他行と同じ順。空行はエラーなし */
  extraErrors: LinkFieldError[];
  hasError: boolean;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 空は空のまま。スキームが無く、空白なしでドットがあるものだけ https:// を足す */
function urlForSave(raw: string): { url: string; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: "", error: null };
  if (/^https?:\/\//i.test(trimmed)) return { url: trimmed, error: null };
  if (!/\s/.test(trimmed) && trimmed.includes(".")) {
    return { url: `https://${trimmed}`, error: null };
  }
  return { url: trimmed, error: LINK_URL_SCHEME_ERROR };
}

/** 保存するリンク。空のその他行は捨て、URL は trim した文字列のまま残す */
export function scheduleLinksForSave(raw: unknown): ScheduleLinks {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const extras: ScheduleLinkExtra[] = [];
  if (Array.isArray(src.extras)) {
    for (const item of src.extras) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const name = text(row.name);
      const url = text(row.url);
      if (!name && !url) continue;
      extras.push({ name, url });
    }
  }
  return { slack: text(src.slack), drive: text(src.drive), extras };
}

/** 保存前の検査。問題がなければ links は保存してよい形 */
export function inspectScheduleLinks(raw: unknown): InspectedScheduleLinks {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const slack = urlForSave(text(src.slack));
  const drive = urlForSave(text(src.drive));
  const extraErrors: LinkFieldError[] = [];
  const extras: ScheduleLinkExtra[] = [];
  const rows = Array.isArray(src.extras) ? src.extras : [];
  for (const item of rows) {
    if (!item || typeof item !== "object") {
      extraErrors.push({ name: null, url: null });
      continue;
    }
    const row = item as Record<string, unknown>;
    const name = text(row.name);
    const urlResult = urlForSave(text(row.url));
    if (!name && !urlResult.url && !urlResult.error) {
      extraErrors.push({ name: null, url: null });
      continue;
    }
    const nameError = urlResult.url && !name ? LINK_NAME_ERROR : null;
    const urlError =
      urlResult.error ??
      (name && !urlResult.url ? LINK_MISSING_URL_ERROR : null);
    extraErrors.push({ name: nameError, url: urlError });
    if (!nameError && !urlError) extras.push({ name, url: urlResult.url });
  }
  const hasError = Boolean(
    slack.error ||
      drive.error ||
      extraErrors.some((error) => error.name || error.url)
  );
  return {
    links: {
      slack: slack.error ? text(src.slack) : slack.url,
      drive: drive.error ? text(src.drive) : drive.url,
      extras,
    },
    slackError: slack.error,
    driveError: drive.error,
    extraErrors,
    hasError,
  };
}
