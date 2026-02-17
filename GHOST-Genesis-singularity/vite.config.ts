import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// GHOST SYSTEM CONFIGURATION
// Mode: Stealth | Performance: High
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080, // Porta Tática Padrão
  },
  plugins: [
    react(),

  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));