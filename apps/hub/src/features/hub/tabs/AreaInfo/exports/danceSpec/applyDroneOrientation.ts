// src/features/hub/tabs/AreaInfo/exports/danceSpec/applyDroneOrientation.ts

/**
 * 2ページ目クローンに「機体の向き」Drone1Icon の回転と Antenna/Battery ラベル位置を反映する。
 * PDF/PPTX で共通利用。デフォルトは LandingAreaFigure.tsx と同じ 180（アンテナが上）に揃える。
 */
export function applyDroneOrientationToPage2(
    p2clone: HTMLElement,
    area: Record<string, unknown> | undefined | null
): void {
    const orientationDeg =
        typeof area?.drone_orientation_deg === "number" && Number.isFinite(area.drone_orientation_deg)
            ? (area.drone_orientation_deg as number)
            : 180;

    const drone1Icon = p2clone.querySelector("#drone1-orientation-icon") as HTMLImageElement | null;
    if (drone1Icon) {
        drone1Icon.style.transform = `rotate(${orientationDeg}deg)`;
        drone1Icon.style.transformOrigin = "50% 50%";
    }

    // テンプレのアイコンは 130px、UI は 96px のためスケール
    const iconScale = 130 / 96;
    const radius = 75 * iconScale;
    const yOffset = 35 * iconScale;
    const antennaAngle = ((orientationDeg + 90) % 360) * (Math.PI / 180);
    const batteryAngle = ((orientationDeg + 270) % 360) * (Math.PI / 180);
    let antennaX = radius * Math.cos(antennaAngle);
    let antennaY = radius * Math.sin(antennaAngle) + yOffset;
    let batteryX = radius * Math.cos(batteryAngle);
    let batteryY = radius * Math.sin(batteryAngle) + yOffset;

    // 向きごとにラベルを上方向へ微調整（パターン1〜4）
    const norm = ((orientationDeg % 360) + 360) % 360;
    const up = (px: number) => -px; // 上方向は負
    if (norm === 0) {
        // パターン1: アンテナが下
        antennaY += up(70);
        batteryY += up(3);
    } else if (norm === 90) {
        // パターン2: アンテナが右
        antennaY += up(55);
        batteryY += up(20);
    } else if (norm === 180) {
        // パターン3: アンテナが上
        antennaY += up(33);
        batteryY += up(33);
    } else if (norm === 270) {
        // パターン4: アンテナが左
        antennaY += up(58);
        batteryY += up(22);
    }

    const antennaLabel = p2clone.querySelector(".drone-label--antenna") as HTMLElement | null;
    const batteryLabel = p2clone.querySelector(".drone-label--battery") as HTMLElement | null;
    if (antennaLabel) {
        antennaLabel.style.left = "50%";
        antennaLabel.style.top = "50%";
        antennaLabel.style.bottom = "";
        antennaLabel.style.transform = `translate(calc(-50% + ${antennaX}px), calc(-50% + ${antennaY}px))`;
    }
    if (batteryLabel) {
        batteryLabel.style.left = "50%";
        batteryLabel.style.top = "50%";
        batteryLabel.style.bottom = "";
        batteryLabel.style.transform = `translate(calc(-50% + ${batteryX}px), calc(-50% + ${batteryY}px))`;
    }
}
