// apps/auth/src/components/FullHeightSelect.tsx
import { useMemo, useRef, type ReactNode } from "react";
import Select, {
  components,
  type GroupBase,
  type GroupHeadingProps,
  type MenuListProps,
  type StylesConfig,
} from "react-select";
import { PROJECT_SELECT_DIVIDER_LABEL } from "@/lib/sortProjectsForDropdown";

export type SelectOption = { value: string; label: string };

export type SelectOptionGroup = {
  label: string;
  options: SelectOption[];
};

type Props = {
  /** フラットな選択肢（optionGroups 未指定時） */
  options?: SelectOption[];
  /** グループ化された選択肢（アクティブ / Old 区切りなど） */
  optionGroups?: SelectOptionGroup[];
  /** 選択中の値（option.value） */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  /** メニュー上部の余白（px） */
  menuTop?: number;
  /** メニュー下部の余白（px） */
  menuBottom?: number;
  /** メニュー幅（CSS値） */
  menuWidth?: string;
  /** メニュー位置（right=検索入力と重ならないよう右寄せ） */
  menuAlign?: "center" | "right";
  /** menuAlign=right 時の中央からの右オフセット（px）※画面サイズに依存しない */
  menuOffsetFromCenter?: number;
  /** false=通常のプルダウン（SP向け） */
  fullHeight?: boolean;
  /** メニュー先頭に固定するツールバー（並べ替え・フィルターなど） */
  menuToolbar?: ReactNode;
  isLoading?: boolean;
  noOptionsMessage?: string;
};

function findOption(
  value: string,
  options?: SelectOption[],
  optionGroups?: SelectOptionGroup[]
): SelectOption | null {
  if (options) {
    return options.find((o) => o.value === value) ?? null;
  }
  if (optionGroups) {
    for (const group of optionGroups) {
      const found = group.options.find((o) => o.value === value);
      if (found) return found;
    }
  }
  return null;
}

function DividerGroupHeading(
  props: GroupHeadingProps<SelectOption, false, GroupBase<SelectOption>>
) {
  if (props.data.label !== PROJECT_SELECT_DIVIDER_LABEL) return null;
  return (
    <div
      className="mx-3 my-2 flex items-center gap-2"
      role="separator"
      aria-label="Old"
    >
      <span className="shrink-0 text-xs font-medium text-slate-500">
        old
      </span>
      <div className="min-w-0 flex-1 border-t border-slate-600" />
    </div>
  );
}

/** プルダウン：画面上部〜下部まで伸ばして表示 */
function createFullHeightMenu(
  config: {
    top: number;
    bottom: number;
    width: string;
    align: "center" | "right";
    offsetFromCenter: number;
  },
  toolbarRef: { current: ReactNode }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function FullHeightMenu(props: any) {
    const positionStyle =
      config.align === "right"
        ? {
            left: `calc(50% + ${config.offsetFromCenter}px)`,
            right: "auto" as const,
          }
        : { left: "50%", transform: "translateX(-50%)", right: "auto" as const };

    return (
      <div
        ref={props.innerRef}
        {...props.innerProps}
        style={{
          position: "fixed",
          top: config.top,
          bottom: config.bottom,
          ...positionStyle,
          width: config.width,
          backgroundColor: "#020617",
          borderRadius: 4,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          zIndex: 50,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {toolbarRef.current}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {props.children}
        </div>
      </div>
    );
  };
}

function createMenuList(toolbarRef: { current: ReactNode }) {
  return function MenuList(
    props: MenuListProps<SelectOption, false, GroupBase<SelectOption>>
  ) {
    return (
      <>
        {toolbarRef.current}
        <components.MenuList {...props} />
      </>
    );
  };
}

const createStyles = (fullHeight: boolean): StylesConfig<SelectOption, false> => ({
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderColor: state.isFocused ? "#dc2626" : "#475569",
    boxShadow: state.isFocused ? "0 0 0 1px #dc2626" : "none",
    "&:hover": { borderColor: "#dc2626" },
  }),
  menu: (base) => ({ ...base, backgroundColor: "#020617" }),
  menuList: (base) => ({
    ...base,
    maxHeight: fullHeight ? "100%" : 300,
  }),
  groupHeading: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  option: (base, state) => ({
    ...base,
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: 1.4,
    backgroundColor: state.isFocused ? "#1e293b" : "transparent",
    color: "#e5e7eb",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  singleValue: (base) => ({ ...base, color: "#e5e7eb" }),
  placeholder: (base) => ({ ...base, color: "#64748b" }),
  input: (base) => ({ ...base, color: "#e5e7eb" }),
});

export function FullHeightSelect({
  options,
  optionGroups,
  value,
  onChange,
  placeholder = "-- Select --",
  isClearable = true,
  isSearchable = true,
  menuTop = 72,
  menuBottom = 24,
  menuWidth = "min(380px, 92vw)",
  menuAlign = "right",
  menuOffsetFromCenter = 200,
  fullHeight = true,
  menuToolbar,
  isLoading = false,
  noOptionsMessage = "該当する案件がありません",
}: Props) {
  const selected = useMemo(
    () => findOption(value, options, optionGroups),
    [value, options, optionGroups]
  );

  const toolbarRef = useRef<ReactNode>(null);
  toolbarRef.current = menuToolbar ?? null;

  const Menu = useMemo(
    () =>
      fullHeight
        ? createFullHeightMenu(
            {
              top: menuTop,
              bottom: menuBottom,
              width: menuWidth,
              align: menuAlign,
              offsetFromCenter: menuOffsetFromCenter,
            },
            toolbarRef
          )
        : undefined,
    [
      fullHeight,
      menuTop,
      menuBottom,
      menuWidth,
      menuAlign,
      menuOffsetFromCenter,
    ]
  );

  const MenuList = useMemo(
    () => (fullHeight ? undefined : createMenuList(toolbarRef)),
    [fullHeight]
  );

  const selectOptions = optionGroups ?? options ?? [];
  const useGroups = !!optionGroups;

  const extraComponents = {
    ...(Menu ? { Menu } : {}),
    ...(MenuList ? { MenuList } : {}),
    ...(useGroups ? { GroupHeading: DividerGroupHeading } : {}),
  };

  return (
    <Select<SelectOption, false, GroupBase<SelectOption>>
      options={selectOptions}
      value={selected}
      onChange={(opt) =>
        onChange((opt as SelectOption | null)?.value ?? "")
      }
      placeholder={placeholder}
      isClearable={isClearable}
      isSearchable={isSearchable}
      isLoading={isLoading}
      noOptionsMessage={() => noOptionsMessage}
      menuPortalTarget={fullHeight ? document.body : undefined}
      menuPosition={fullHeight ? "fixed" : undefined}
      components={
        Object.keys(extraComponents).length > 0 ? extraComponents : undefined
      }
      styles={createStyles(fullHeight)}
    />
  );
}
