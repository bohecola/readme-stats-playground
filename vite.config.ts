import path from "node:path"
import react from "@vitejs/plugin-react"
import AutoImport from "unplugin-auto-import/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    // React hooks (useState, useEffect, …) are available without importing.
    // src/auto-imports.d.ts is generated from this and is committed.
    AutoImport({
      imports: ["react"],
      dts: "src/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
