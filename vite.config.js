import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Permite importar modelos .glb como URL de asset (assets/environment/*).
  assetsInclude: ["**/*.glb"],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    // Los GLB son binarios; que no intente inlinearlos como base64.
    assetsInlineLimit: 0,
  },
});
