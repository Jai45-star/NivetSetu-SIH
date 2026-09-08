import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 90000, workers: 1,
  globalSetup: './tests/setup.mjs',
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome', headless: true },
  reporter: 'list',
});
