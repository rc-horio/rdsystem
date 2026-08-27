import type { TabKey } from "@/features/types";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "基本情報" },
  { key: "own", label: "自社" },
  { key: "considering", label: "交渉" },
  { key: "other", label: "他社" },
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
      className="detailbar-tabs"
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`tab-btn ${active === tab.key ? "is-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
