import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategy: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      registerType: "autoUpdate",
      injectRegister: 'auto',
      includeAssets: ["easy-attendance-logo.png", "favicon.ico"],
      manifest: {
        name: "ClassConnect – Student Portal",
        short_name: "ClassConnect",
        description: "Attendance & Marks Management System",
        theme_color: "#2563eb",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/login",
        icons: [
          {
            src: "easy-attendance-logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "easy-attendance-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "Student Login",
            short_name: "Login",
            url: "/login",
            description: "Go to Login",
          },
          {
            name: "Dashboard",
            short_name: "Dashboard",
            url: "/student-dashboard",
            description: "Go to Student Dashboard",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      devOptions: {
        enabled: true,
        type: 'module', // Required for injectManifest in dev mode
      },
    }),

  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
