// vite.config.ts
/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/auth/',
  envDir: __dirname,
  publicDir: path.resolve(__dirname, '../../static'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  /** 開発時の設定（pnpm dev 用） */
  server: {
    host: '0.0.0.0',   // ← これはあってもなくても OK
    port: 5173,

    // 開発時のみ: Lambda への CORS 回避用プロキシ
    proxy: {
      "/__catalog-write": {
        target: "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__catalog-write/, ""),
      },
      "/__catalog-delete": {
        target: "https://xfrtw5rsebwcgc6hyvhtvdlor40ornnm.lambda-url.ap-northeast-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__catalog-delete/, ""),
      },
    },

    // ファイルを監視して保存されたら自動でブラウザをリロード/差し替え（HMR）
    watch: {
      usePolling: true,   // ★ ポーリング方式
      interval: 150,      //   監視間隔 (ms) 好みで調整
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
