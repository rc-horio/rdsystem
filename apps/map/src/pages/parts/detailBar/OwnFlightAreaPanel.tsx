import type { HistoryItem } from "@/features/types";
import { ProjectHistorySection } from "./ProjectHistorySection";

type Props = {
  history: HistoryItem[];
  selectedHistoryIdx: number | null;
  editable: boolean;
  onSelectHistory: (item: HistoryItem, idx: number) => void;
  onDeleteHistory: (idx: number, item: HistoryItem) => boolean;
  onRegisterProject: () => void;
};

export function OwnFlightAreaPanel({
  history,
  selectedHistoryIdx,
  editable,
  onSelectHistory,
  onDeleteHistory,
  onRegisterProject,
}: Props) {
  return (
    <section role="tabpanel" aria-label="自社">
      <ProjectHistorySection
        history={history}
        selectedHistoryIdx={selectedHistoryIdx}
        editable={editable}
        onSelect={onSelectHistory}
        onDelete={onDeleteHistory}
        onRegisterProject={onRegisterProject}
      />
    </section>
  );
}
