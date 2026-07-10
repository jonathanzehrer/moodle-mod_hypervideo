import { test, expect } from '@playwright/test';

test('load player button renders the video player (Variant 2)', async ({ page }) => {
  await page.goto('/');

  // Select Variant 2 from the Override Variant dropdown.
  await page.selectOption('#vid-variant', '2');

  // Verify the page loaded with the load button.
  const loadBtn = page.locator('#btn-load');
  await expect(loadBtn).toBeVisible();

  // Click "Load Player" to mount the Vue app.
  await loadBtn.click();

  // Wait for the player to render and the video to be ready (controls appear).
  await page.waitForSelector('#app .hypervideo', { timeout: 10000 });
  await page.waitForSelector('.video-controls', { timeout: 10000 });

  await page.waitForTimeout(4000); // Wait for thumbnail to render

  // Take a screenshot and compare against the stored reference.
  await expect(page.locator("#app")).toHaveScreenshot('player-loaded-variant2.png', {
    fullPage: true,
  });
});
