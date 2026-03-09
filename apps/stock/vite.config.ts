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
        // /apple-touch-icon.png または /stock/apple-touch-icon.png を配信
        const match = ROOT_ASSETS.find(
          (name) => urlPath === `/${name}` || urlPath === `/stock/${name}`
        );
        if (match) {
          const filePath = path.join(staticDir, match);
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

import { excludeStaticAssets } from "../../vite-plugin-exclude-static-assets";

export default defineConfig({
  plugins: [serveStockAssets(), react(), excludeStaticAssets()],
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
