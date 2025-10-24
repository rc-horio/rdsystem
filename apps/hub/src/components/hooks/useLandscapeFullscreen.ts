// src/features/hub/tabs/Operation/hooks/useLandscapeFullscreen.ts
import { useCallback, useEffect, useRef, useState } from "react";

/** 物理向きの粗判定 */
function detectPhysicalOrientation(
  beta: number | null,
  gamma: number | null
): {
  posture: "portrait" | "landscape-0" | "landscape-180" | "unknown";
} {
  if (beta == null || gamma == null) return { posture: "unknown" };
  // ざっくり判定: landscape…|gamma|が大きい / portrait…|beta|が大きい（端末により差あり）
  const absB = Math.abs(beta);
  const absG = Math.abs(gamma);

  if (absG >= 45 && absB <= 60) {
    // 右倒し(gamma>0) = landscape-0 / 左倒し(gamma<0) = landscape-180 程度の運用
    return { posture: gamma > 0 ? "landscape-0" : "landscape-180" };
  }
  if (absB >= 45 && absG <= 45) {
    return { posture: "portrait" };
  }
  return { posture: "unknown" };
}

type OrientationLock = (
  type: "landscape" | "landscape-primary" | "landscape-secondary"
) => Promise<void>;

export function useLandscapeFullscreen({
  onRequestExit, // 縦向きに戻った/×押下などで終了したい時に呼ばれる
}: {
  onRequestExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotationDeg, setRotationDeg] = useState<number>(90); // 開始時は横固定のため90deg回転で強制横表示
  const [locked, setLocked] = useState(false);
  const [fsActive, setFsActive] = useState(false);

  // ---- Fullscreen helpers ----
  const enterFullscreen = useCallback(async () => {
    const el = (containerRef.current ??
      document.documentElement) as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    if (document.fullscreenElement) {
      setFsActive(true);
      return;
    }
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      setFsActive(true);
    } catch {
      // 無視（iOS Safari 等）
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    const doc: any = document as any;
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } finally {
      setFsActive(false);
    }
  }, []);

  // ---- Orientation lock helpers ----
  const lockLandscape = useCallback(async () => {
    const ori: any =
      (screen as any).orientation ||
      (screen as any).msOrientation ||
      (screen as any).mozOrientation ||
      (screen as any).webkitOrientation;

    const lock: OrientationLock | undefined = ori?.lock;
    if (typeof lock === "function") {
      try {
        // 端末により 'landscape' / 'landscape-primary' が有効
        await lock("landscape").catch(() => lock("landscape-primary"));
        setLocked(true);
        return;
      } catch {
        /* iOS Safari など未対応 */
      }
    }
    setLocked(false);
  }, []);

  const unlockLandscape = useCallback(() => {
    const ori: any =
      (screen as any).orientation ||
      (screen as any).msOrientation ||
      (screen as any).mozOrientation ||
      (screen as any).webkitOrientation;
    try {
      if (ori && typeof ori.unlock === "function") ori.unlock();
    } catch {
      /* noop */
    }
    setLocked(false);
  }, []);

  // ---- Device orientation permission (iOS) ----
  const requestMotionPermission = useCallback(async () => {
    const AnyDeviceOrientationEvent: any = (window as any)
      .DeviceOrientationEvent;
    if (
      AnyDeviceOrientationEvent &&
      typeof AnyDeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const res = await AnyDeviceOrientationEvent.requestPermission();
        return res === "granted";
      } catch {
        return false;
      }
    }
    return true; // Android/デスクトップなどは不要
  }, []);

  // ---- Start (call when fullscreen open) ----
  const startLandscapeMode = useCallback(async () => {
    // 1) まずフルスクリーン（対応端末は lock を効かせやすくするため）
    await enterFullscreen();
    // 2) 横固定を試みる（Android Chrome 等）
    await lockLandscape();
    // 3) センサー権限（iOS）
    await requestMotionPermission();
    // 4) 初期は端末の物理向きに関係なく横表示にしたいので 90deg を当てておく
    setRotationDeg(90);
  }, [enterFullscreen, lockLandscape, requestMotionPermission]);

  // ---- Stop (call when leaving) ----
  const stopLandscapeMode = useCallback(async () => {
    unlockLandscape();
    await exitFullscreen();
  }, [unlockLandscape, exitFullscreen]);

  // ---- Device motion listener：物理回転に追従 ＆ 縦向きで終了 ----
  useEffect(() => {
    const onDO = (e: DeviceOrientationEvent) => {
      const beta = typeof e.beta === "number" ? e.beta : null; // x軸
      const gamma = typeof e.gamma === "number" ? e.gamma : null; // y軸
      const det = detectPhysicalOrientation(beta, gamma);

      if (det.posture === "landscape-0") {
        // 物理的に横(右倒し)：画面は 0°
        setRotationDeg(0);
      } else if (det.posture === "landscape-180") {
        // 物理的に横(左倒し)：画面は 180°
        setRotationDeg(180);
      } else if (det.posture === "portrait") {
        // 物理が縦：終了要求
        onRequestExit();
      }
      // unknown は無視
    };

    // 追加フック：Screen Orientation の変化にも追従（対応端末）
    const onSOChange = () => {
      const type =
        (screen.orientation && (screen.orientation as any).type) || "";
      if (typeof type === "string") {
        if (type.startsWith("landscape")) {
          setRotationDeg(0); // OSが横判定ならCSS回転は無しでOK
        } else if (type.startsWith("portrait")) {
          onRequestExit();
        }
      }
    };

    window.addEventListener("deviceorientation", onDO);
    if ((screen as any).orientation?.addEventListener) {
      (screen as any).orientation.addEventListener("change", onSOChange);
    } else {
      window.addEventListener("orientationchange", onSOChange as any);
    }

    return () => {
      window.removeEventListener("deviceorientation", onDO);
      if ((screen as any).orientation?.removeEventListener) {
        (screen as any).orientation.removeEventListener("change", onSOChange);
      } else {
        window.removeEventListener("orientationchange", onSOChange as any);
      }
    };
  }, [onRequestExit]);

  return {
    containerRef,
    rotationDeg, // 0 / 90 / 180（開始直後は 90、横持ちで 0 or 180）
    locked,
    fsActive,
    startLandscapeMode, // 全画面ボタン押下時に呼ぶ
    stopLandscapeMode, // 終了時に呼ぶ（×/縦向き）
  };
}
