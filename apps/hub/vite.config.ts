// vite.config.ts
/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/hub/',
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
    port: 5174,

    //　TODO:検証用。本番では不要
    proxy: {
      // Hub(5174) から /map/ を叩いたら Map(5175) に流す
      "/map": {
        target: "http://localhost:5175",
        changeOrigin: true,
        // ViteのWS(HMR)を通したい場合（Map側のHMRを使うなら）
        ws: true,
      },
      // 念のため /@vite /@react-refresh 等を Map 側に流したい場合は追加
      // ただし通常は iframe 内の Map が直接 5174 経由で配信されるので、上の /map だけで足ります
    },

    // ファイルを監視して保存されたら自動でブラウザをリロード/差し替え（HMR）
    watch: {
      usePolling: true,   // ★ ポーリング方式
      interval: 150,      //   監視間隔 (ms) 好みで調整
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
