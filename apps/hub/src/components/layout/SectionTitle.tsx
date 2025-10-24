import { Dot } from "./Dot";

/* =========================
   セクションタイトル（改行防止）
   ========================= */
export function SectionTitle({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <h2
      className={`flex items-center gap-2 ${
        compact ? "" : "mb-2"
      } shrink-0 whitespace-nowrap`}
    >
      <Dot />
      <span>{title}</span>
    </h2>
  );
}
