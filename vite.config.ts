import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The API runs on :8000. Proxying /api (including the live-monitor WebSocket) keeps the
// session cookie same-origin, so no CORS or SameSite=None cookies are needed in development.
const API = process.env.TRUSTPRO_API_URL ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Listen on the network too, so a shared recruiter link (http://<this PC's IP>:5173/...) opens
    // on other devices; allowedHosts lets a tunnel URL (PUBLIC_APP_URL) reach it as well.
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": { target: API, changeOrigin: true, ws: true },
    },
  },
  test: {
    environment: "jsdom",
  },
});
