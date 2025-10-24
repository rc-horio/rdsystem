// features/hub/tabs/Operation/sections/MemoSection.tsx
import { BlackCard, SectionTitle } from "@/components";
import { DisplayOrTextarea } from "./DisplayOrTextarea";

type Props = {
  edit: boolean;
  value: string;
  onChange: (v: string) => void;
  title?: string;
  label?: string | React.ReactNode;
  className?: string;
  withCard?: boolean;
  showTitle?: boolean;
};

export function MemoSection({
  edit,
  value,
  onChange,
  title = "memo",
  label = "メモ",
  className = "",
  withCard = true,
  showTitle = true,
}: Props) {
  const Content = (
    <>
      {showTitle && <SectionTitle title={title} />}
      <DisplayOrTextarea
        edit={edit}
        value={value}
        onChange={onChange}
        size="md"
        label={label}
      />
    </>
  );

  return withCard ? (
    <BlackCard className={className}>{Content}</BlackCard>
  ) : (
    <div className={className}>{Content}</div>
  );
}
