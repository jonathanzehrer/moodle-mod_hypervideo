import { test, expect } from '@playwright/test';

test('load player button renders the video player (Variant 1)', async ({ page }) => {
  await page.goto('/');

  // Fill in the local test video URL (avoids CORS / external dependency).
  // await page.fill('#vid-url', '/test-video.mp4');
  await page.selectOption('#vid-variant', '1');

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
  await expect(page.locator("#app")).toHaveScreenshot('player-loaded-variant1.png', {
    fullPage: true,
  });
});

test('play and pause events are logged correctly', async ({ page }) => {
  await page.goto('/');

  await page.selectOption('#vid-variant', '1');

  const loadBtn = page.locator('#btn-load');
  await expect(loadBtn).toBeVisible();
  await loadBtn.click();

  // Wait for the player to render and the video to be ready.
  await page.waitForSelector('#app .hypervideo', { timeout: 10000 });
  await page.waitForSelector('.video-controls', { timeout: 10000 });

  // Collect mock AJAX log calls that go through console.log.
  const logEntries = [];
  page.on('console', async (msg) => {
    try {
      const firstArg = await msg.args()[0]?.jsonValue();
      if (typeof firstArg === 'string' && firstArg.includes('mod_hypervideo_log')) {
        const args = await msg.args()[1]?.jsonValue();
        if (args && args.data) {
          logEntries.push(args.data);
        }
      }
    } catch (e) {
      // Ignore unserializable args.
    }
  });

  // Click the play/pause button to start playback.
  await page.click('.btn-playpause');

  // Wait 2 seconds while the video plays.
  await page.waitForTimeout(2000);

  // Click the play/pause button again to pause.
  await page.click('.btn-playpause');

  // Allow time for async log dispatches to complete.
  await page.waitForTimeout(500);

  // Extract the action field from each log entry.
  const actions = logEntries.map(e => e.action);

  // Verify that play and pause events were emitted.
  expect(actions, 'Expected at least one log entry').not.toHaveLength(0);
  expect(actions).toContain('play');
  expect(actions).toContain('pause');

  // The play event should come before the pause event.
  const playIndex = actions.indexOf('play');
  const pauseIndex = actions.indexOf('pause');
  expect(playIndex, 'play event should be logged before pause').toBeLessThan(pauseIndex);

  // Verify at least one playback event was fired during the 2 s of playback.
  const playbackCount = actions.filter(a => a === 'playback').length;
  expect(playbackCount, 'Expected at least one playback event').toBeGreaterThanOrEqual(1);
});
