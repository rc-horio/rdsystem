import { InputBox, SectionTitle } from "@/components";
import type {
  ScheduleDetail,
  ScheduleLinkExtra,
  ScheduleLinks,
} from "@/features/hub/types/resource";

function readLinks(schedule: ScheduleDetail | null | undefined): ScheduleLinks {
  const links = schedule?.links;
  const extras = Array.isArray(links?.extras) ? links.extras : [];
  return {
    slack: typeof links?.slack === "string" ? links.slack : "",
    drive: typeof links?.drive === "string" ? links.drive : "",
    extras: extras.map((extra) => ({
      name: typeof extra?.name === "string" ? extra.name : "",
      url: typeof extra?.url === "string" ? extra.url : "",
    })),
  };
}

function canOpen(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/** redclifftalk のチームID。archives のURLには含まれない */
const SLACK_TEAM_ID = "T04MFPSKB0F";

/** Slack の枠だけ、チャンネルURLをアプリで開く。保存する文字列は変えない */
function slackAppHref(url: string): string | null {
  const trimmed = url.trim();
  const client = trimmed.match(
    /app\.slack\.com\/client\/(T[A-Z0-9]+)\/([CDG][A-Z0-9]+)/i
  );
  if (client) {
    return `slack://channel?team=${client[1]}&id=${client[2]}`;
  }
  const archives = trimmed.match(/\.slack\.com\/archives\/([CDG][A-Z0-9]+)/i);
  if (archives) {
    return `slack://channel?team=${SLACK_TEAM_ID}&id=${archives[1]}`;
  }
  return null;
}

const fieldShell =
  "flex h-9 min-w-0 items-center rounded border-[0.5px] border-[#707070] px-3 text-sm";

export default function RelatedInfoTab({
  edit,
  currentSchedule,
  updateSchedule,
}: {
  edit: boolean;
  currentSchedule: ScheduleDetail | null | undefined;
  updateSchedule: (id: string, updates: Partial<ScheduleDetail>) => void;
}) {
  const links = readLinks(currentSchedule);

  const write = (next: ScheduleLinks) => {
    if (!currentSchedule) return;
    updateSchedule(currentSchedule.id, { links: next });
  };

  const patchExtra = (index: number, patch: Partial<ScheduleLinkExtra>) => {
    write({
      ...links,
      extras: links.extras.map((extra, i) =>
        i === index ? { ...extra, ...patch } : extra
      ),
    });
  };

  if (!edit) {
    const fixed = [
      links.slack.trim()
        ? { key: "slack", label: "Slack", url: links.slack }
        : null,
      links.drive.trim()
        ? { key: "drive", label: "Googleドライブ", url: links.drive }
        : null,
    ].filter((row) => row != null);
    const extras = links.extras.flatMap((extra, index) => {
      const name = extra.name.trim();
      const url = extra.url.trim();
      if (!name && !url) return [];
      return [{ key: `extra-${index}`, name, url }];
    });
    const empty = fixed.length === 0 && extras.length === 0;

    return (
      <div className="min-w-0 space-y-5">
        <SectionTitle title="リンク" />
        {empty ? (
          <p className="text-sm text-slate-400">リンクは登録されていません</p>
        ) : (
          <>
            {fixed.map((row) => (
              <div key={row.key} className="flex min-w-0 items-center gap-2">
                <span className="w-28 shrink-0 text-sm text-slate-300 sm:w-36">
                  {row.label}
                </span>
                <UrlValue
                  url={row.url}
                  href={row.key === "slack" ? slackAppHref(row.url) ?? undefined : undefined}
                />
              </div>
            ))}
            {extras.map((row) => (
              <div key={row.key} className="flex min-w-0 items-center gap-2">
                <span className={`${fieldShell} flex-1 text-slate-200`}>
                  <span className="truncate">{row.name}</span>
                </span>
                <UrlValue url={row.url} className="flex-2" />
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <SectionTitle title="リンク" />
      <LinkField
        label="Slack"
        value={links.slack}
        onChange={(url) => write({ ...links, slack: url })}
      />
      <LinkField
        label="Googleドライブ"
        value={links.drive}
        onChange={(url) => write({ ...links, drive: url })}
      />
      {links.extras.length > 0 && (
        <ul className="space-y-5">
          {links.extras.map((extra, index) => (
            <li key={index} className="flex min-w-0 items-center gap-2">
              <InputBox
                value={extra.name}
                placeholder="名前"
                aria-label="リンクの名前"
                onChange={(e) => patchExtra(index, { name: e.target.value })}
                className="min-w-0 flex-1"
              />
              <InputBox
                value={extra.url}
                placeholder="https://"
                aria-label="リンクのURL"
                onChange={(e) => patchExtra(index, { url: e.target.value })}
                className="min-w-0 flex-2"
              />
              <button
                type="button"
                onClick={() =>
                  write({
                    ...links,
                    extras: links.extras.filter((_, i) => i !== index),
                  })
                }
                aria-label="このリンクを削除"
                className="inline-flex h-9 w-6 shrink-0 cursor-pointer items-center justify-center text-base leading-none text-slate-300 hover:text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            write({ ...links, extras: [...links.extras, { name: "", url: "" }] })
          }
          className="cursor-pointer text-sm text-slate-300 hover:text-white"
        >
          ＋ 追加
        </button>
      </div>
    </div>
  );
}

function UrlValue({
  url,
  href,
  className = "",
}: {
  url: string;
  href?: string;
  className?: string;
}) {
  const stored = url.trim();
  const openHref = (href ?? stored).trim();
  const text = stored || " ";
  const shell = `${fieldShell} text-slate-100 ${className || "flex-1"}`;
  const appLink = openHref.startsWith("slack://");
  if (!appLink && !canOpen(stored)) {
    return (
      <span className={shell}>
        <span className="truncate">{text}</span>
      </span>
    );
  }
  return (
    <a
      href={openHref}
      {...(appLink
        ? {}
        : { target: "_blank", rel: "noopener noreferrer" })}
      title={stored || openHref}
      className={`${shell} cursor-pointer hover:border-red-600 hover:text-white`}
    >
      <span className="truncate">{text}</span>
    </a>
  );
}

function LinkField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-28 shrink-0 text-sm text-slate-300 sm:w-36">
        {label}
      </span>
      <InputBox
        value={value}
        placeholder="https://"
        aria-label={`${label}のURL`}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1"
      />
    </div>
  );
}
