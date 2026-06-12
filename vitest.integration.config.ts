import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["dotenv/config"], // loads .env so DATABASE_URL / APP_DATABASE_URL resolve locally
    hookTimeout: 30000,
    fileParallelism: false, // integration tests share one database — run files serially
  },
});
