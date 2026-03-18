import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import type { ConfigEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig((config: ConfigEnv) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  preview: {
  host: true,
  allowedHosts: [".onrender.com"],
},

  build: {
    outDir: "dist",
    sourcemap: config.mode === "development",
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));