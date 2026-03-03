const TL_CHOICES = {
  takeoff: [
    { name: "レインボー", file: "0231_離陸" },
    { name: "無点灯", file: "" },
  ],
  landing: [
    { name: "レインボー", file: "0232_着陸" },
    { name: "無点灯", file: "" },
  ],
};

export type TLType = "takeoff" | "landing";

interface TLChoice {
  name: string;
  file: string;
}

interface TakeoffLandingModalProps {
  type: TLType;
  open: boolean;
  onClose: () => void;
  onSelect: (choice: TLChoice) => void;
}

export function TakeoffLandingModal({
  type,
  open,
  onClose,
  onSelect,
}: TakeoffLandingModalProps) {
  if (!open) return null;

  const choices = TL_CHOICES[type];
  const heading =
    type === "takeoff"
      ? "離陸アニメーションを選択してください"
      : "着陸アニメーションを選択してください";

  return (
    <>
      <div
        className="stock-modal-mask"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="閉じる"
      />
      <section className="stock-modal tl-modal">
        <div className="transitionModalHeader">
          <div
            className="tlModalClose"
            onClick={onClose}
            role="button"
            tabIndex={0}
          >
            &times;
          </div>
        </div>
        <h3 className="tlModalHeading" style={{ color: "#fff", textAlign: "center", margin: "6px 0" }}>
          {heading}
        </h3>
        <div className="tlModalBody">
          {choices.map((c) => (
            <button
              key={c.name}
              type="button"
              className={c.name === "無点灯" ? "tlTextBtn tlPlainBtn" : "tlTextBtn"}
              onClick={() => {
                onSelect(c);
                onClose();
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
