import { useEffect, useRef } from "react";
import type { MotifData } from "@/types/stock";

import { ASSETS_BASE } from "@/lib/assetsBase";

interface MotifModalProps {
  motif: MotifData | null;
  open: boolean;
  onClose: () => void;
  onAddToFooter: () => void;
}

export function MotifModal({
  motif,
  open,
  onClose,
  onAddToFooter,
}: MotifModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open || !motif || !videoRef.current) return;
    const videoPath = `${ASSETS_BASE}/image/motif/video/sc_${motif.fileName}.mp4`;
    const source = videoRef.current.querySelector("source");
    if (source) {
      source.src = videoPath;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [open, motif]);

  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  if (!open) return null;

  const info = motif
    ? `縦:${motif.height} / 横:${motif.width} / 奥行:${motif.depth} / 総尺:${motif.length}`
    : "";

  return (
    <>
      <div
        className="stock-modal-mask"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="閉じる"
      />
      <section className="stock-modal motif-modal">
        <div className="motifModalHeader">
          <div className="motifLabel">
            {motif ? `No.${motif.id}  ${motif.motifName}` : ""}
          </div>
          <div
            className="motifModalClose"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClose();
              }
            }}
            role="button"
            tabIndex={0}
          >
            &times;
          </div>
        </div>
        <div className="motifModalBody">
          <div className="motifVideoContainer">
            <video ref={videoRef} autoPlay muted loop playsInline>
              <source src="" type="video/mp4" />
            </video>
          </div>
        </div>
        <div className="motifModalFooter">
          <div className="motifInfoText">{info}</div>
          <div
            className="motifModalInput"
            onClick={onAddToFooter}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAddToFooter();
              }
            }}
            role="button"
            tabIndex={0}
          >
            ＋フッターに追加
          </div>
        </div>
      </section>
    </>
  );
}
