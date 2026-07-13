import { test, expect } from '@playwright/test';

async function setupVideo(page) {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.removeItem('mod_hypervideo_survey_1');
  });

  await page.fill('#vid-url', '/test-video.mp4');

  await page.fill('#vid-chapters', '0:00 Chapter 1\n0:10 Chapter 2\n0:20 Chapter 3');

  await page.selectOption('#vid-variant', '2');

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

test('load player button renders the video player (Variant 2)', async ({ page }) => {

  await setupVideo(page);

  // Take a screenshot and compare against the stored reference.
  await expect(page.locator("#app")).toHaveScreenshot('player.png', {
    fullPage: true,
  });
});

// ---------------------------------------------------------------------------
// Chapter bar
// ---------------------------------------------------------------------------

test('chapter bar: selection, seek, and playback tracking work correctly', async ({ page }) => {
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

  // Verify that the first chapter is selected (active) initially.
  const firstChapterItem = page.locator('.hypervideo-chapters-item').first();
  await expect(firstChapterItem).toHaveClass(/is-active/);

  // Navigate to ~0:05.
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 5;
  });
  await page.waitForTimeout(500);

  // Click the first chapter ("Chapter 1") to seek back to 0:00.
  const firstChapterBtn = page.locator('.hypervideo-chapters-button').first();
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
  expect(timeAfterChapterSeek, 'Video time should be 0 after clicking chapter 1').toBeLessThan(1);

  // Navigate to ~0:09 and play the video for ~2s.
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 9;
  });


  const video = page.locator('.player-container video');
  await video.hover();

  await page.waitForTimeout(300);
  await page.click('.btn-playpause');
  await page.waitForTimeout(2500);

  // Verify the selected chapter has changed to chapter 2 (second item is active).
  const secondChapterItem = page.locator('.hypervideo-chapters-item').nth(1);
  await expect(secondChapterItem).toHaveClass(/is-active/);
});

// ---------------------------------------------------------------------------
// Chapter buttons
// ---------------------------------------------------------------------------

test('chapter previous/next buttons navigate correctly and log events', async ({ page }) => {
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

  const prevBtn = page.locator('button:has(.material-symbols:text-is("skip_previous"))');
  const nextBtn = page.locator('button:has(.material-symbols:text-is("skip_next"))');

  // Verify the previous chapter button is disabled at the start (time 0:00).
  await expect(prevBtn).toBeVisible();
  await expect(prevBtn).toBeDisabled();

  // Navigate to ~0:05.
  await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    if (video) video.currentTime = 5;
  });
  await page.waitForTimeout(500);

  // Click the previous chapter button.
  await prevBtn.click();
  await page.waitForTimeout(500);

  // Verify a 'button-seek' event has been logged.
  let buttonSeekEvents = logEntries.filter(e => e.action === 'button-seek');
  expect(buttonSeekEvents.length, 'Expected at least one button-seek event').toBeGreaterThanOrEqual(1);

  // Verify the event value contains "previous".
  const prevSeekValue = JSON.parse(buttonSeekEvents[0].entry).value.values;
  expect(prevSeekValue, 'Button-seek event should indicate previous').toContain('previous');

  // Verify the time is 0:00 again.
  const timeAfterPrev = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterPrev, 'Video time should be 0 after clicking previous chapter').toBeLessThan(1);

  // Click the next chapter button.
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Verify a second button-seek event has been logged.
  buttonSeekEvents = logEntries.filter(e => e.action === 'button-seek');
  expect(buttonSeekEvents.length, 'Expected at least two button-seek events').toBeGreaterThanOrEqual(2);
  const nextSeekValue = JSON.parse(buttonSeekEvents[1].entry).value.values;
  expect(nextSeekValue, 'Button-seek event should indicate next').toContain('next');

  // Verify the time is 0:10.
  const timeAfterNext = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterNext, 'Video time should be ~10s after clicking next').toBeCloseTo(10, 0);

  // Click the next chapter button again.
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Verify the time is 0:20.
  const timeAfterNext2 = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(timeAfterNext2, 'Video time should be ~20s after second next-click').toBeCloseTo(20, 0);

  // Verify the next chapter button is now disabled.
  await expect(nextBtn).toBeDisabled();
});

// ---------------------------------------------------------------------------
// Annotated timeline
// ---------------------------------------------------------------------------

test('annotated timeline shows chapter segments and tooltip on hover', async ({ page }) => {
  await setupVideo(page);

  // Verify the timeline is split into three segments (one per chapter).
  const chapterSegments = page.locator('.seekbar-chapter');
  await expect(chapterSegments).toHaveCount(3);

  // Hover the middle segment of the seekbar.
  const seekbarWrapper = page.locator('.seekbar-wrapper');
  const box = await seekbarWrapper.boundingBox();
  expect(box, 'Seekbar wrapper should be visible').not.toBeNull();

  // Hover at ~50% of the seekbar width (middle of chapter 2).
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.waitForTimeout(400);

  // Verify the chapter name tooltip is visible and shows "Chapter 2".
  const tooltip = page.locator('.seekbar-chapter-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('Chapter 2');

  // Move mouse out and verify the tooltip disappears.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await expect(tooltip).toBeHidden();
});

// ---------------------------------------------------------------------------
// Fullscreen chapter view
// ---------------------------------------------------------------------------

test('fullscreen chapter sidebar opens and allows chapter navigation', async ({ page }) => {
  await setupVideo(page);

  // Switch to fullscreen.
  const fullscreenBtn = page.locator('button:has(.material-symbols:text-is("fullscreen"))');
  await expect(fullscreenBtn).toBeVisible();
  await fullscreenBtn.click();
  await page.waitForTimeout(500);

  // Verify the player entered fullscreen.
  const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
  expect(isFullscreen, 'Player should be in fullscreen mode').toBe(true);

  // Hover the left sidebar trigger.
  const sidebarTrigger = page.locator('.fullscreen-sidebar-trigger');
  await expect(sidebarTrigger).toBeVisible();
  await sidebarTrigger.hover();
  await page.waitForTimeout(500);

  // Verify that the chapter menu (sidebar content) is shown.
  const sidebarContent = page.locator('.fullscreen-sidebar-content');
  await expect(sidebarContent).toBeVisible();

  // Click the second chapter ("Chapter 2") in the sidebar.
  const secondChapterBtn = sidebarContent.locator('.hypervideo-chapters-button').nth(1);
  await secondChapterBtn.click();
  await page.waitForTimeout(500);

  // Verify the video time is 0:10.
  const currentTime = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(currentTime, 'Video time should be ~10s after clicking chapter 2').toBeCloseTo(10, 0);
});
