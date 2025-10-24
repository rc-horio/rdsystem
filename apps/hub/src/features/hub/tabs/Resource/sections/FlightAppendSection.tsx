import { AddItemButton } from "@/components";

/* ───────────────────────── */
/* フライト日程追加 */
/* ───────────────────────── */
export function FlightAppendSection({
  edit,
  onAdd,
  // isMobile,
}: {
  edit: boolean;
  onAdd: () => void;
  // isMobile: boolean;
}) {
  if (!edit) return null;
  return (
    <div className="flex items-center gap-2">
      <AddItemButton
        onClick={onAdd}
        title="フライト日程追加"
        className="px-2 py-1 text-sm"
      />
    </div>
  );
}
