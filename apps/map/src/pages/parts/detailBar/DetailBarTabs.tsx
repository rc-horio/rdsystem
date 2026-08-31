import type { TabKey } from "@/features/types";
import type { AreaKind, AreaKindFlags } from "./helpers";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "基本情報" },
  { key: "own", label: "RC" },
  { key: "other", label: "他社" },
  { key: "considering", label: "営業" },
];

const TAB_KIND: Partial<Record<TabKey, AreaKind>> = {
  own: "own",
  other: "other",
  considering: "considering",
};

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
  kindFlags?: AreaKindFlags;
};

export function DetailBarTabs({ active, onChange, kindFlags }: Props) {
  return (
    <div
      role="tablist"
      aria-label="詳細バータブ"
      className={`detailbar-tabs detailbar-tabs--${active}`}
    >
      {TABS.map((tab) => {
        const kind = TAB_KIND[tab.key];
        const showDot = !!kind && !!kindFlags?.[kind];
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={`tab-btn tab-btn--${tab.key} ${active === tab.key ? "is-active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            {showDot && kind ? (
              <span
                className={`area-kind-dot area-kind-dot--${kind}`}
                aria-hidden="true"
              />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
