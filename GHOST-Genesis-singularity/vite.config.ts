import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import electron from 'vite-plugin-electron/simple'

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8083,
    // Adicionando o túnel para o seu Gateway GHOST
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Remove o prefixo /api antes de enviar para o Gateway, 
        // caso o seu Gateway não espere o /api na URL
        rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      },
      // Caso queira que o renderer recarregue ao mudar o main do electron
      renderer: {}, 
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));