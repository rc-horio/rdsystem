// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'RDMap',
    //     short_name: 'RDMap',
    //     theme_color: '#111827',
    //     background_color: '#111827',
    //     display: 'standalone',
    //     // ★ ここを / に
    //     start_url: '/',
    //     scope: '/',
    //     icons: [
    //       // 必要ならここに pwa-192.png / pwa-512.png などを追加
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   }
    // })
  ],
  base: '/map/',
  envDir: __dirname,
  publicDir: path.resolve(__dirname, '../../static'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
  },

  /** 開発時の設定（pnpm dev 用） */
  server: {
    host: '0.0.0.0',
    port: 5175,

    proxy: {
      "/__gstatic": {
        target: "https://maps.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__gstatic/, ""),
      },
      "/__gtile": {
        target: "https://tile.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__gtile/, ""),
      },
      // 開発時のみ: Lambda への CORS 回避用プロキシ
      "/__catalog-write": {
        target: "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__catalog-write/, ""),
      },
      // rdsystem-common-catalog-delete Lambda（デプロイ後に VITE_CATALOG_DELETE_URL を設定）
      "/__catalog-delete": {
        target:
          process.env.VITE_CATALOG_DELETE_URL ||
          "https://u64h3yye227qjsnem7yyydakpu0vpkxn.lambda-url.ap-northeast-1.on.aws",
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
})
