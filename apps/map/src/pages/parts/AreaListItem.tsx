import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import { DeleteIconButton } from "@/components";
import type { Point } from "@/features/types";
import {
  AREA_KIND_LABEL,
  areaKindFlagList,
  type AreaKindFlags,
} from "./detailBar/helpers";

type Props = {
  area: string;
  indices: number[];
  grouped: boolean;
  isActive: boolean;
  isOn: boolean;
  displayLabel: string;
  editing: boolean;
  editingTempName: string;
  editingInputRef: RefObject<HTMLInputElement | null>;
  points: Point[];
  kindCache: Record<string, AreaKindFlags>;
  onActivate: (area: string) => void;
  onBeginEdit: (area: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onEditingTempName: (value: string) => void;
  onDelete: (area: string, displayLabel: string) => void;
};

export function AreaListItem({
  area,
  indices,
  grouped,
  isActive,
  isOn,
  displayLabel,
  editing,
  editingTempName,
  editingInputRef,
  points,
  kindCache,
  onActivate,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onEditingTempName,
  onDelete,
}: Props) {
  const handleClick = (e: MouseEvent<HTMLLIElement>) => {
    if (editing) return;
    if (isOn && e.detail === 2) {
      e.preventDefault();
      e.stopPropagation();
      onBeginEdit(area);
      return;
    }
    onActivate(area);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (editing) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelEdit();
      }
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate(area);
    }
  };

  const firstPoint = points[indices[0]];
  const flags = firstPoint?.areaUuid
    ? kindCache[firstPoint.areaUuid]
    : undefined;
  const kinds = areaKindFlagList(flags);

  return (
    <li
      data-indices={indices.join(",")}
      data-area={area}
      tabIndex={0}
      className={
        grouped
          ? isActive
            ? "active location-item-grouped"
            : "location-item-grouped"
          : isActive
            ? "active"
            : undefined
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {editing ? (
        <input
          ref={editingInputRef}
          type="text"
          value={editingTempName}
          onChange={(e) => onEditingTempName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommitEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancelEdit();
            }
          }}
        />
      ) : (
        <>
          {kinds.length === 0 ? null : (
            <span
              className="area-kind-dots"
              aria-label={kinds.map((kind) => AREA_KIND_LABEL[kind]).join("、")}
            >
              {kinds.map((kind) => (
                <span
                  key={kind}
                  className={`area-kind-dot area-kind-dot--${kind}`}
                  aria-hidden="true"
                />
              ))}
            </span>
          )}
          <span className="location-label">
            {displayLabel}
            {indices.length > 1 ? `（${indices.length}）` : null}
          </span>
          {isOn && (
            <span
              className="location-delete"
              onClick={(e) => e.stopPropagation()}
            >
              <DeleteIconButton
                title="このエリアを削除"
                tabIndex={0}
                onClick={() => {
                  void onDelete(area, displayLabel);
                }}
              />
            </span>
          )}
        </>
      )}
    </li>
  );
}
