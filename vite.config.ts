/// <reference types="vitest/config" />

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, "apps/web"),
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          framework: ["react", "react-dom", "react-router"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "apps/web/src/test/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: true,
  },
})