import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: ['discord-frontend-virid.vercel.app'],
    proxy: {
      '/api': {
        target: 'https://discordbackend-xggi.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  define: {
    // Ensure environment variables are properly defined for the client
    'import.meta.env.VITE_DISCORD_CLIENT_ID': JSON.stringify(process.env.VITE_DISCORD_CLIENT_ID),
  }
});
