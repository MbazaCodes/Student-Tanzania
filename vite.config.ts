import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
    }),
    nitro(),
    react(),
  ],

  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-start",
    ],
  },

  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },

  build: {
    outDir: "dist",
    sourcemap: true
  }
});


