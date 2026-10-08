import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(
    mode,
    process.cwd(),
    ""
  );

  const backendTarget =
    env.VITE_BACKEND_PROXY_TARGET ||
    "http://localhost";

  return {
    plugins: [
      react(),
    ],

    server: {
      host: "localhost",

      port: 5173,

      proxy: {
        "/backend": {
          target: backendTarget,

          changeOrigin: true,

          secure: false,

          configure: proxy => {
            proxy.on(
              "error",
              error => {
                console.error(
                  "PHP backend proxy error:",
                  error.message
                );
              }
            );
          },
        },
      },
    },

    preview: {
      host: "localhost",

      port: 4173,

      proxy: {
        "/backend": {
          target: backendTarget,

          changeOrigin: true,

          secure: false,
        },
      },
    },
  };
});