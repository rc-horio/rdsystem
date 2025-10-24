// vite.config.ts
/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/hub/',
  envDir: path.resolve(__dirname, '../../'),
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

    // ファイルを監視して保存されたら自動でブラウザをリロード/差し替え（HMR）
    watch: {
      usePolling: true,   // ★ ポーリング方式
      interval: 150,      //   監視間隔 (ms) 好みで調整
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
