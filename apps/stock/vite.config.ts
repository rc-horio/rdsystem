// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const staticDir = path.resolve(__dirname, "../../static");
const ROOT_ASSETS = ["apple-touch-icon.png", "apple-touch-icon-152x152.png", "apple-touch-icon-120x120.png"];

/** ローカル開発時: apple-touch-icon を static から配信。アセットは VITE_STOCK_ASSETS_BASE_URL で S3/CloudFront 直接参照 */
function serveStockAssets() {
  return {
    name: "serve-stock-assets",
    enforce: "pre" as const,
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        const urlPath = req.url?.split("?")[0] ?? "";
        if (ROOT_ASSETS.some((name) => urlPath === `/${name}`)) {
          const filePath = path.join(staticDir, urlPath.slice(1));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader("Content-Type", "image/png");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        return next();
      });
    },
  };
}

/** ビルド時に stock アセット（csv, image）を dist から除外するプラグイン（アセットは別バケットで配信） */
function excludeStockAssetsFromBuild() {
  return {
    name: "exclude-stock-assets-from-build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const toRemove = ["csv", "image"];
      toRemove.forEach((sub) => {
        const dir = path.join(distDir, "assets", sub);
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [serveStockAssets(), react(), excludeStockAssetsFromBuild()],
  base: "/stock/",
  envDir: __dirname,
  publicDir: path.resolve(__dirname, "../../static"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5176,

    watch: {
      usePolling: true,
      interval: 150,
    },
  },
  build: { outDir: "dist", sourcemap: true },
});
