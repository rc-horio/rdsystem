import type { RefObject } from "react";
import type { Candidate } from "@/features/types";
import { CandidateSection } from "./CandidateSection";

type Props = {
  candidates: Candidate[];
  selectedCandidateIdx: number | null;
  editingCandidateIdx: number | null;
  editingCandidateTitle: string;
  editingCandidateInputRef: RefObject<HTMLInputElement | null>;
  candidateDeletionLocked: boolean;
  editable: boolean;
  onSelectCandidate: (idx: number) => void;
  onStartEditCandidate: (idx: number) => void;
  onEditingTitleChange: (value: string) => void;
  onCommitCandidateTitle: () => boolean;
  onCancelCandidateEdit: () => void;
  onDuplicateCandidate: (idx: number) => void;
  onDeleteCandidate: (idx: number, candidate: Candidate) => void;
  onAddCandidate: () => void;
  pendingNewCandidateIdx: number | null;
};

export function ConsideringPanel(props: Props) {
  return (
    <section role="tabpanel" aria-label="検討中">
      <CandidateSection
        candidates={props.candidates}
        selectedCandidateIdx={props.selectedCandidateIdx}
        editingCandidateIdx={props.editingCandidateIdx}
        editingCandidateTitle={props.editingCandidateTitle}
        editingCandidateInputRef={props.editingCandidateInputRef}
        candidateDeletionLocked={props.candidateDeletionLocked}
        editable={props.editable}
        onSelect={props.onSelectCandidate}
        onStartEdit={props.onStartEditCandidate}
        onEditingTitleChange={props.onEditingTitleChange}
        onCommitTitle={props.onCommitCandidateTitle}
        onCancelEdit={props.onCancelCandidateEdit}
        onDuplicate={props.onDuplicateCandidate}
        onDelete={props.onDeleteCandidate}
        onAdd={props.onAddCandidate}
        pendingNewCandidateIdx={props.pendingNewCandidateIdx}
      />
    </section>
  );
}
