import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": process.env.QA_API_TARGET || "http://127.0.0.1:8087",
      "/uploads": process.env.QA_API_TARGET || "http://127.0.0.1:8087",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom", "react-router-dom"] },
      },
    },
  },
});
