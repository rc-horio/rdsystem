import { useEffect, useState, useRef } from "react";
import type { TransitionData } from "@/types/stock";
import { ASSETS_BASE } from "@/lib/assetsBase";

interface TransitionModalProps {
  transitions: TransitionData[];
  open: boolean;
  onClose: () => void;
  onSelect: (t: TransitionData) => void;
}

export function TransitionModal({
  transitions,
  open,
  onClose,
  onSelect,
}: TransitionModalProps) {
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setHasBeenOpened(true);
  }, [open]);

  useEffect(() => {
    if (!bodyRef.current) return;
    const videos = bodyRef.current.querySelectorAll("video");
    if (open) {
      videos.forEach((v) => v.play().catch(() => {}));
    } else {
      videos.forEach((v) => v.pause());
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!hasBeenOpened) return null;

  return (
    <>
      <div
        className="stock-modal-mask"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="閉じる"
        style={{
          display: open ? undefined : "none",
          pointerEvents: open ? undefined : "none",
        }}
      />
      <section
        className="stock-modal transition-modal"
        aria-hidden={!open}
        style={{
          display: open ? undefined : "none",
          pointerEvents: open ? undefined : "none",
        }}
      >
        <div className="transitionModalHeader">
          <div
            className="transitionModalClose"
            onClick={onClose}
            role="button"
            tabIndex={0}
          >
            &times;
          </div>
        </div>
        <h3 className="transitionModalHeading">トランジションを選択してください</h3>
        <div ref={bodyRef} className="transitionModalBody transition-grid">
          {transitions.map((t) => (
            <div key={t.filename} className="transCard">
              <video
                className="transPreview"
                muted
                autoPlay={open}
                loop
                playsInline
                preload="metadata"
                onClick={() => onSelect(t)}
              >
                <source
                  src={`${ASSETS_BASE}/image/transition/video/sc_${t.filename}.mp4`}
                  type="video/mp4"
                />
              </video>
              <div className="transitionName">{t.name}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
