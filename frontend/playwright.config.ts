import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  use: { baseURL: process.env.QA_ISOLATED_BASE_URL || "http://127.0.0.1:5175", channel: "chrome", headless: true },
  workers: 1,
  reporter: "list",
  outputDir: process.env.QA_TEST_OUTPUT_DIR || "../.local/test-results",
});
