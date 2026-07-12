import { test, expect } from '@playwright/test';

async function setupVideo(page) {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.removeItem('mod_hypervideo_survey_1');
  });

  await page.fill('#vid-url', '/test-video.mp4');
  await page.fill('#vid-chapters', '0:00 Chapter 1\n0:10 Chapter 2\n0:20 Chapter 3');
  await page.selectOption('#vid-variant', '3');

  const loadBtn = page.locator('#btn-load');
  await expect(loadBtn).toBeVisible();
  await loadBtn.click();

  // Wait for the player to render and the video to be ready.
  await page.waitForSelector('#app .hypervideo', { timeout: 10000 });
  await page.waitForSelector('.video-controls', { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function hideControlsAndWait(page) {
  // Hide the test fixture's controls panel so the player gets the full width.
  await page.locator('.controls').evaluate(el => el.style.display = 'none');
  await page.waitForTimeout(300);
}

async function assertAspectRatioAndContainment(page) {
  const videoEl = page.locator('video');
  const videoBox = await videoEl.boundingBox();
  expect(videoBox, 'video element should have a bounding box').not.toBeNull();
  const videoAspectRatio = videoBox.width / videoBox.height;
  console.log(`[${page.viewportSize().width}x${page.viewportSize().height}] Video: ${videoBox.width}x${videoBox.height} → AR=${videoAspectRatio.toFixed(3)}`);

  const outerPlayer = page.locator('.hypervideo .player-wrapper');
  const outerBox = await outerPlayer.boundingBox();
  expect(outerBox, '.player-wrapper should have a bounding box').not.toBeNull();
  const outerAspectRatio = outerBox.width / outerBox.height;
  console.log(`[${page.viewportSize().width}x${page.viewportSize().height}] .player-wrapper: ${outerBox.width}x${outerBox.height} → AR=${outerAspectRatio.toFixed(3)}`);

  // Aspect ratios must match within 1 decimal place (0.1 tolerance).
  expect(outerAspectRatio, '.player-wrapper aspect ratio should match the video').toBeCloseTo(videoAspectRatio, 1);

  // The .player-wrapper should fully contain the video element.
  expect(outerBox.x, 'player-wrapper left edge ≤ video left edge').toBeLessThanOrEqual(videoBox.x + 0.5);
  expect(outerBox.y, 'player-wrapper top edge ≤ video top edge').toBeLessThanOrEqual(videoBox.y + 0.5);
  expect(outerBox.x + outerBox.width, 'player-wrapper right edge ≥ video right edge').toBeGreaterThanOrEqual(videoBox.x + videoBox.width - 0.5);
  expect(outerBox.y + outerBox.height, 'player-wrapper bottom edge ≥ video bottom edge').toBeGreaterThanOrEqual(videoBox.y + videoBox.height - 0.5);
}

async function assertEqualHeights(page) {
  const playerContainer = page.locator('.hypervideo .player-wrapper');
  const chaptersSidebar = page.locator('.hypervideo .chapters-sidebar');

  const playerBox = await playerContainer.boundingBox();
  const chaptersBox = await chaptersSidebar.boundingBox();

  expect(playerBox, 'player-wrapper should have a bounding box').not.toBeNull();
  expect(chaptersBox, 'chapters-sidebar should have a bounding box').not.toBeNull();

  console.log(`[${page.viewportSize().width}x${page.viewportSize().height}] .player-wrapper height: ${playerBox.height.toFixed(1)}px`);
  console.log(`[${page.viewportSize().width}x${page.viewportSize().height}] .chapters-sidebar height: ${chaptersBox.height.toFixed(1)}px`);

  const heightDiff = Math.abs(playerBox.height - chaptersBox.height);
  expect(heightDiff, 'player-wrapper and chapters-sidebar should have the same height').toBeLessThanOrEqual(1);
}

// ---- Wide viewport (1920×1080) ----

test('wide viewport: player-container maintains the same aspect ratio as the video element', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await setupVideo(page);
  await hideControlsAndWait(page);
  await assertAspectRatioAndContainment(page);
});

test('wide viewport: VideoPlayer and ChapterOverview sidebar have the same height', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await setupVideo(page);
  await hideControlsAndWait(page);
  await assertEqualHeights(page);
});

// ---- Narrow viewport (1024×768) ----

test('narrow viewport: player-container maintains the same aspect ratio as the video element', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await setupVideo(page);
  await hideControlsAndWait(page);
  await assertAspectRatioAndContainment(page);
});

test('narrow viewport: VideoPlayer and ChapterOverview sidebar have the same height', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await setupVideo(page);
  await hideControlsAndWait(page);
  await assertEqualHeights(page);
});