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
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router'],
            charts: ['recharts'],
            ui: ['lucide-react', 'motion'],
            utils: ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
