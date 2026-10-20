import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
        hmr: {
            overlay: false,
        },
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("leaflet") || id.includes("react-leaflet")) {
                            return "map-vendors";
                        }
                        if (id.includes("@supabase")) {
                            return "supabase-vendors";
                        }
                        if (id.includes("recharts")) {
                            return "charts-vendors";
                        }
                        if (id.includes("@radix-ui") || id.includes("class-variance-authority") || id.includes("tailwind-merge")) {
                            return "ui-vendors";
                        }
                        if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                            return "react-vendors";
                        }
                        return "misc-vendors";
                    }
                },
            },
        },
    },
}));
