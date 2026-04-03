import { useEffect, useMemo, useState } from "react";
import { BaseModal } from "@/components";
import type { Candidate, Geometry } from "@/features/types";

type Props = {
  open: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onNewCreate: () => void;
  onCopyFromCandidate: (params: {
    candidateIndex: number;
    deleteAllCandidatesAfterCopy: boolean;
  }) => void;
};

export function FlightAreaCreateModeModal({
  open,
  onClose,
  candidates,
  onNewCreate,
  onCopyFromCandidate,
}: Props) {
  const [mode, setMode] = useState<"new" | "copy">("new");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [deleteAllAfterCopy, setDeleteAllAfterCopy] = useState(true);

  const hasCandidates = candidates.length > 0;

  useEffect(() => {
    if (!open) return;
    setMode("new");
    setSelectedIdx(0);
    setDeleteAllAfterCopy(true);
  }, [open]);

  const candidateLabel = (idx: number) => {
    const c = candidates[idx];
    const t = (c?.title ?? "").trim();
    return t || `候補${idx + 1}`;
  };

  const selectedCandidateGeometry = useMemo<Geometry | null>(() => {
    const c = candidates[selectedIdx];
    if (!c) return null;

    return {
      flightAltitude_min_m: c.flightAltitude_min_m,
      flightAltitude_Max_m: c.flightAltitude_Max_m,
      takeoffArea: c.takeoffArea,
      flightArea: c.flightArea,
      safetyArea: c.safetyArea,
      audienceArea: c.audienceArea,
    };
  }, [candidates, selectedIdx]);

  const canCopy = hasCandidates && !!selectedCandidateGeometry;

  if (!open) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="飛行エリア作図"
      backdropClassName="map-modal-backdrop"
      containerClassName="map-modal-container"
    >
      <div className="no-caret" style={{ paddingBottom: 6 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: mode === "new" ? "2px solid #2563eb" : "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => {
              onNewCreate();
              onClose();
            }}
          >
            新規作成
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: mode === "copy" ? "2px solid #2563eb" : "1px solid #ccc",
              background: hasCandidates ? "#fff" : "#f3f4f6",
              cursor: hasCandidates ? "pointer" : "not-allowed",
              opacity: hasCandidates ? 1 : 0.8,
            }}
            disabled={!hasCandidates}
            onClick={() => setMode("copy")}
          >
            候補からコピー
          </button>
        </div>

        {mode === "copy" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>コピー元</span>
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="register-project-modal__input register-project-modal__select"
                >
                  {candidates.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {candidateLabel(idx)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={deleteAllAfterCopy}
                onChange={(e) => setDeleteAllAfterCopy(e.target.checked)}
              />
              <span>コピー後にこのエリアの候補をすべて削除する</span>
            </label>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="register-project-modal__btn register-project-modal__btn--ok"
                disabled={!canCopy}
                onClick={() => {
                  onCopyFromCandidate({
                    candidateIndex: selectedIdx,
                    deleteAllCandidatesAfterCopy: deleteAllAfterCopy,
                  });
                  onClose();
                }}
              >
                実行
              </button>
            </div>
          </>
        )}

        {!hasCandidates && (
          <p style={{ margin: "10px 0 0", color: "#666" }}>
            候補がありません。新規作成を選択してください。
          </p>
        )}
      </div>
    </BaseModal>
  );
}

