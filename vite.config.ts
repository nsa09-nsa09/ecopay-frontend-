import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
        '/v3/api-docs': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/swagger-ui': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/swagger-ui.html': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Recharts is deliberately NOT a manual chunk: forcing it into its
          // own chunk pulled shared helpers into it, so the anonymous home page
          // modulepreloaded ~545 kB of chart code. Left to Rollup it stays with
          // the lazily loaded admin dashboard.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router'],
            ui: ['lucide-react', 'motion'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
