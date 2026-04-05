import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy-policy.html'),
        terms: resolve(__dirname, 'terms-of-service.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: ['discord-frontend-v2.vercel.app'],
    proxy: {
      '/api/events': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api': {
        target: 'https://discordbackend-v2.onrender.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  define: {
    // Ensure environment variables are properly defined for the client
    'import.meta.env.VITE_DISCORD_CLIENT_ID': JSON.stringify(process.env.VITE_DISCORD_CLIENT_ID),
  }
});
