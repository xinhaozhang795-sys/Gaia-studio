import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const buildVersion = process.env.npm_package_version ?? '0.0.0';
const buildDate = new Date().toISOString().slice(0, 10);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildVersion),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
