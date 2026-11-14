import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // Assuming you run the dev server on port 3000 locally
    baseURL: process.env.BASE_URL || 'http://localhost:4003',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    
    // CRITICAL FOR WEBRTC:
    // These flags bypass the camera/microphone permission prompts
    // and feed a fake video/audio stream into the browser.
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
