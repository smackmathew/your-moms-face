import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // `firebase emulators:start` serves the functions behind the same /api paths as production.
    proxy: { "/api": "http://127.0.0.1:5000" },
  },
});
