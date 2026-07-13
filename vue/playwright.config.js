import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      // Allow a small pixel difference (anti-aliasing, font rendering vary across OS).
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
