import { test, expect } from '@playwright/test';

async function setupVideo(page) {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.removeItem('mod_hypervideo_survey_1');
  });

  await page.fill('#vid-url', '/test-video.mp4');

  await page.fill('#vid-chapters', '0:00 Chapter 1\n0:10 Chapter 2\n0:20 Chapter 3');

  await page.selectOption('#vid-variant', '3');

  // Verify the page loaded with the load button.
  const loadBtn = page.locator('#btn-load');
  await expect(loadBtn).toBeVisible();

  // Click "Load Player" to mount the Vue app.
  await loadBtn.click();

  // Wait for the player to render and the video to be ready (controls appear).
  await page.waitForSelector('#app .hypervideo', { timeout: 10000 });

  await page.waitForTimeout(1200);

  const video = page.locator('video');
  await video.hover();

  await page.waitForTimeout(500);

  await page.waitForSelector('.video-controls', { timeout: 10000 });
}

test('visually inspect the video player (Variant 3)', async ({ page }) => {

  await setupVideo(page);

  // Take a screenshot and compare against the stored reference.
  await expect(page.locator("#app")).toHaveScreenshot('player.png', {
    fullPage: true,
  });
});

// ---------------------------------------------------------------------------
// Chapter bar
// ---------------------------------------------------------------------------

test('chapter bar: selection, seek, and chapter navigation work correctly', async ({ page }) => {
  await setupVideo(page);

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

  // Verify that the first chapter tile is selected (active) initially.
  const firstTile = page.locator('.chapters-sidebar .hypervideo-chapters-tile').first();
  await expect(firstTile).toHaveClass(/is-active/);

  // Navigate to ~0:05 within the first chapter (range 0-10, underlying time ~5).
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 5;
  });
  await page.waitForTimeout(500);

  // Click the first chapter tile to seek back to chapter 1 start.
  const firstChapterBtn = page.locator('.chapters-sidebar .hypervideo-chapters-tile').first();
  await firstChapterBtn.click();
  await page.waitForTimeout(500);

  // Verify a 'chapter-seek' event has been logged.
  const chapterSeekEvents = logEntries.filter(e => e.action === 'chapter-seek');
  expect(chapterSeekEvents.length, 'Expected at least one chapter-seek event').toBeGreaterThanOrEqual(1);

  // Verify the logged chapter-seek value is 0 (time = 0:00).
  const seekValue = JSON.parse(chapterSeekEvents[0].entry).value.values;
  expect(seekValue, 'Chapter-seek should target time 0').toBe(0);

  // Verify the video time is back at 0:00.
  const timeAfterChapterSeek = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterChapterSeek, 'Underlying video time should be 0 after clicking chapter 1').toBeLessThan(1);

  // Click the second chapter tile.
  const secondChapterBtn = page.locator('.chapters-sidebar .hypervideo-chapters-tile').nth(1);
  await secondChapterBtn.click();
  await page.waitForTimeout(500);

  // Verify the timeline displayed time is 0:00 (since it's range-relative).
  const timelineTime = await page.textContent('.current-time');
  expect(timelineTime, 'Timeline displayed time should be 0:00').toBe('0:00');

  // Verify the underlying video time is 0:10.
  const underlyingTime = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(underlyingTime, 'Underlying video time should be ~10s').toBeCloseTo(10, 0);
});

// ---------------------------------------------------------------------------
// Chapter buttons
// ---------------------------------------------------------------------------

test('chapter previous/next buttons navigate correctly and update state', async ({ page }) => {
  await setupVideo(page);

  const prevBtn = page.locator('button:has(.material-symbols:text-is("skip_previous"))');
  const nextBtn = page.locator('button:has(.material-symbols:text-is("skip_next"))');

  // Navigate to ~0:05 within the first chapter.
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 5;
  });
  await page.waitForTimeout(500);

  // Verify the previous chapter button is disabled (hasPrevious checks range.start, which is still 0).
  await expect(prevBtn).toBeVisible();
  await expect(prevBtn).toBeDisabled();

  // Click the next chapter button.
  await nextBtn.click();
  await page.waitForTimeout(800);

  // Verify the timeline displayed time is 0:00.
  const timelineAfterNext = await page.textContent('.current-time');
  expect(timelineAfterNext, 'Timeline displayed time should be 0:00 after going to chapter 2').toBe('0:00');

  // Verify the underlying video time is 0:10.
  const timeAfterNext = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterNext, 'Underlying video time should be ~10s').toBeCloseTo(10, 0);

  // Verify the second chapter in the sidebar is selected.
  const secondTile = page.locator('.chapters-sidebar .hypervideo-chapters-tile').nth(1);
  await expect(secondTile).toHaveClass(/is-active/);

  // Verify the previous button is now enabled.
  await expect(prevBtn).toBeEnabled();

  // Click the previous chapter button.
  await prevBtn.click();
  await page.waitForTimeout(800);

  // Verify the timeline displayed time is 0:00.
  const timelineAfterPrev = await page.textContent('.current-time');
  expect(timelineAfterPrev, 'Timeline displayed time should be 0:00 after going back to chapter 1').toBe('0:00');

  // Verify the underlying video time is 0:00.
  const timeAfterPrev = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterPrev, 'Underlying video time should be ~0s').toBeCloseTo(0, 0);

  // Verify the first chapter in the sidebar is selected.
  const firstTile = page.locator('.chapters-sidebar .hypervideo-chapters-tile').first();
  await expect(firstTile).toHaveClass(/is-active/);

  // Verify the previous button is disabled again.
  await expect(prevBtn).toBeDisabled();

  // Click the next chapter button twice to reach chapter 3.
  await nextBtn.click();
  await page.waitForTimeout(800);
  await nextBtn.click();
  await page.waitForTimeout(800);

  // Verify the underlying video time is 0:20.
  const timeAfterDoubleNext = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterDoubleNext, 'Underlying video time should be ~20s').toBeCloseTo(20, 0);

  // Verify the third chapter in the sidebar is selected.
  const thirdTile = page.locator('.chapters-sidebar .hypervideo-chapters-tile').nth(2);
  await expect(thirdTile).toHaveClass(/is-active/);

  // Verify the next button is now disabled.
  await expect(nextBtn).toBeDisabled();
});

// ---------------------------------------------------------------------------
// End overlay
// ---------------------------------------------------------------------------

test('end overlay shows correct navigation buttons per chapter', async ({ page }) => {
  await setupVideo(page);

  // --- Part 1: End of chapter 1 (first chapter, range 0-10) ---

  // Navigate almost to the end of chapter 1 (seek to ~8, range.end is 10).
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 8;
  });
  await page.waitForTimeout(300);

  // Play the video and wait for the ended overlay.
  await page.click('.btn-playpause');
  await page.waitForSelector('.ended-overlay', { timeout: 15000 });

  // Verify the overlay is shown with correct button states.
  const replayBtn = page.locator('.ended-replay-btn');
  await expect(replayBtn).toBeVisible();

  const overlayPrevBtn = page.locator('.ended-nav-btn:has(.material-symbols:text-is("skip_previous"))');
  const overlayNextBtn = page.locator('.ended-nav-btn:has(.material-symbols:text-is("skip_next"))');

  // At the end of chapter 1: previous should be disabled, next enabled.
  await expect(overlayPrevBtn).toBeDisabled();
  await expect(overlayNextBtn).toBeEnabled();

  // --- Part 2: Navigate to chapter 3 and repeat ---

  // Click replay to dismiss overlay, then navigate to chapter 3.
  await replayBtn.click();
  await page.waitForTimeout(500);

  // Click the third chapter tile in the sidebar to go to chapter 3.
  const thirdTile = page.locator('.chapters-sidebar .hypervideo-chapters-tile').nth(2);
  await thirdTile.click();
  await page.waitForTimeout(500);

  // Get video duration for seeking to end.
  const duration = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.duration : 0;
  });

  // Navigate almost to the end of the video (chapter 3 has no range.end, plays to duration).
  await page.evaluate((d) => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = d - 2;
  }, duration);
  await page.waitForTimeout(300);

  // Play and wait for the video to end.
  // If the video paused during seek, click play.
  const isPaused = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.paused : null;
  });
  if (isPaused) {
    await page.click('.btn-playpause');
  }

  // Chapter 3 is the last chapter, so the survey will appear.
  // Answer the survey to dismiss it.
  await page.waitForSelector('.hypervideo-survey-overlay', { timeout: 15000 });
  await page.locator('.hypervideo-survey-btn').nth(2).click();      // value 3
  await page.locator('.hypervideo-survey-submit').click();
  await page.waitForTimeout(500);

  // Now the ended overlay should be visible underneath.
  await expect(replayBtn).toBeVisible();

  // At the end of chapter 3: next disabled, previous enabled.
  await expect(overlayPrevBtn).toBeEnabled();
  await expect(overlayNextBtn).toBeDisabled();
});

// ---------------------------------------------------------------------------
// Fullscreen chapter view
// ---------------------------------------------------------------------------

test('fullscreen chapter sidebar opens on the right and allows chapter navigation', async ({ page }) => {
  await setupVideo(page);

  // Switch to fullscreen.
  const fullscreenBtn = page.locator('button:has(.material-symbols:text-is("fullscreen"))');
  await expect(fullscreenBtn).toBeVisible();
  await fullscreenBtn.click();
  await page.waitForTimeout(500);

  // Verify the player entered fullscreen.
  const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
  expect(isFullscreen, 'Player should be in fullscreen mode').toBe(true);

  // Hover the right sidebar trigger.
  const sidebarTrigger = page.locator('.fullscreen-sidebar-trigger');
  await expect(sidebarTrigger).toBeVisible();
  await sidebarTrigger.hover();
  await page.waitForTimeout(500);

  // Verify that the chapter menu (sidebar content) is shown.
  const sidebarContent = page.locator('.fullscreen-sidebar-content');
  await expect(sidebarContent).toBeVisible();

  // Click the second chapter ("Chapter 2") tile in the sidebar.
  const secondChapterTile = sidebarContent.locator('.hypervideo-chapters-tile').nth(1);
  await secondChapterTile.click();
  await page.waitForTimeout(500);

  // Verify the underlying video time is 0:10.
  const currentTime = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(currentTime, 'Underlying video time should be ~10s after clicking chapter 2').toBeCloseTo(10, 0);
});