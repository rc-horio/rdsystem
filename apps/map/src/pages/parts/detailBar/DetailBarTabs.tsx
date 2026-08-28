import type { TabKey } from "@/features/types";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "基本情報" },
  { key: "own", label: "RC" },
  { key: "other", label: "他社" },
  { key: "considering", label: "営業" },
];

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export function DetailBarTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="詳細バータブ"
      className={`detailbar-tabs detailbar-tabs--${active}`}
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`tab-btn tab-btn--${tab.key} ${active === tab.key ? "is-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
