import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@opentelemetry/api': path.resolve(root, 'src/optional-opentelemetry.js'),
    },
  },
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        index: path.resolve(root, "index.html"),
        grade: path.resolve(root, "grade.html"),
        "grade-1": path.resolve(root, "grade-1.html"),
        "grade-2": path.resolve(root, "grade-2.html"),
        "grade-3": path.resolve(root, "grade-3.html"),
        "grade-4": path.resolve(root, "grade-4.html"),
        "grade-5": path.resolve(root, "grade-5.html"),
        login: path.resolve(root, "login.html"),
        topic: path.resolve(root, "topic.html"),
        practice: path.resolve(root, "practice.html"),
        "daily-challenge": path.resolve(root, "daily-challenge.html"),
        "mistake-notebook": path.resolve(root, "mistake-notebook.html"),
        "vexflow-cadence-proof": path.resolve(root, "vexflow-cadence-proof.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
