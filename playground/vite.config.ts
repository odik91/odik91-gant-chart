import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// Alias ke source library agar hot reload tanpa rebuild `npm run build` di root
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@odik91/gantt-task-react": path.resolve(__dirname, "../src/index.tsx"),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
});
