/**
 * ビルド時に dist から不要なファイルを除外するプラグイン。
 * - assets/csv, assets/image, json: 全てのアプリで除外（別バケットで配信）
 * - dance-spec--templates: hub 以外で除外（hub のみ使用）
 */
import path from "path";
import fs from "fs";

export interface ExcludeStaticAssetsOptions {
  /** true の場合、dance-spec--templates を残す（hub 用） */
  keepDanceSpec?: boolean;
}

export function excludeStaticAssets(options: ExcludeStaticAssetsOptions = {}) {
  const { keepDanceSpec = false } = options;
  let distDir: string | undefined;
  return {
    name: "exclude-static-assets-from-build",
    configResolved(config: { root: string; build: { outDir: string } }) {
      distDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      if (!distDir) return;
      // assets 配下: csv, image
      ["csv", "image"].forEach((sub) => {
        const dir = path.join(distDir!, "assets", sub);
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      });
      // dist 直下: json
      const jsonDir = path.join(distDir, "json");
      if (fs.existsSync(jsonDir)) {
        fs.rmSync(jsonDir, { recursive: true });
      }
      // dist 直下: dance-spec--templates（hub 以外で除外）
      if (!keepDanceSpec) {
        const danceSpecDir = path.join(distDir, "dance-spec--templates");
        if (fs.existsSync(danceSpecDir)) {
          fs.rmSync(danceSpecDir, { recursive: true });
        }
      }
    },
  };
}
