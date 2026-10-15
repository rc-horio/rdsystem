import React, { type RefObject } from "react";
import type { Point } from "@/features/types";
import type { AreaKindFlags } from "./detailBar/helpers";
import type { SidebarAreaGroup } from "./sideListSort";
import { AreaListItem } from "./AreaListItem";

type Props = {
  visibleAreaGroups: SidebarAreaGroup[];
  deletedAreas: Set<string>;
  groupedByPrefecture: Array<{
    prefecture: string;
    areas: SidebarAreaGroup[];
  }> | null;
  groupedByUpdatedAt: Array<{
    groupLabel: string;
    areas: SidebarAreaGroup[];
  }> | null;
  groupedByDroneCount: Array<{
    groupLabel: string;
    areas: SidebarAreaGroup[];
  }> | null;
  activeKey: string | null;
  isOn: boolean;
  areaLabelOverrides: Record<string, string>;
  editingAreaKey: string | null;
  editingTempName: string;
  editingInputRef: RefObject<HTMLInputElement>;
  points: Point[];
  kindCache: Record<string, AreaKindFlags>;
  onActivate: (area: string) => void;
  onBeginEdit: (area: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onEditingTempName: (value: string) => void;
  onDelete: (area: string, displayLabel: string) => void;
};

export function AreaList({
  visibleAreaGroups,
  deletedAreas,
  groupedByPrefecture,
  groupedByUpdatedAt,
  groupedByDroneCount,
  activeKey,
  isOn,
  areaLabelOverrides,
  editingAreaKey,
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
  const renderItem = (area: string, indices: number[], grouped: boolean) => (
    <AreaListItem
      key={area}
      area={area}
      indices={indices}
      grouped={grouped}
      isActive={activeKey === area}
      isOn={isOn}
      displayLabel={areaLabelOverrides[area] ?? area}
      editing={editingAreaKey === area}
      editingTempName={editingTempName}
      editingInputRef={editingInputRef}
      points={points}
      kindCache={kindCache}
      onActivate={onActivate}
      onBeginEdit={onBeginEdit}
      onCommitEdit={onCommitEdit}
      onCancelEdit={onCancelEdit}
      onEditingTempName={onEditingTempName}
      onDelete={onDelete}
    />
  );

  const renderGroup = (
    key: string,
    ariaLabel: string,
    areas: SidebarAreaGroup[],
    headerText: (count: number) => string,
  ) => {
    const filteredAreas = areas.filter(({ area }) => !deletedAreas.has(area));
    if (filteredAreas.length === 0) return null;
    return (
      <React.Fragment key={key}>
        <li className="location-prefecture-header" aria-label={ariaLabel}>
          {headerText(filteredAreas.length)}
        </li>
        {filteredAreas.map(({ area, indices }) =>
          renderItem(area, indices, true)
        )}
      </React.Fragment>
    );
  };

  const filteredGroups = visibleAreaGroups.filter(
    ({ area }) => !deletedAreas.has(area)
  );

  return (
    <ul id="locationList" className="no-caret">
      {filteredGroups.length === 0 ? (
        <li className="location-empty" aria-live="polite">
          該当するエリアはありません
        </li>
      ) : groupedByPrefecture ? (
        groupedByPrefecture.map((group) =>
          renderGroup(
            group.prefecture,
            group.prefecture,
            group.areas,
            (count) =>
              `ー${group.prefecture.replace(/[県府都]$/, "")}(${count})`,
          )
        )
      ) : groupedByUpdatedAt ? (
        groupedByUpdatedAt.map((group) =>
          renderGroup(
            group.groupLabel,
            group.groupLabel,
            group.areas,
            () => `-  ${group.groupLabel}`,
          )
        )
      ) : groupedByDroneCount ? (
        groupedByDroneCount.map((group) =>
          renderGroup(
            group.groupLabel,
            group.groupLabel,
            group.areas,
            () => `-  ${group.groupLabel}`,
          )
        )
      ) : (
        filteredGroups.map(({ area, indices }) =>
          renderItem(area, indices, false)
        )
      )}
    </ul>
  );
}
