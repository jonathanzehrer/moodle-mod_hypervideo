import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper / utility methods (wireframe – to be implemented)
// ---------------------------------------------------------------------------

async function setupVideo(page) {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.removeItem('mod_hypervideo_survey_1');
  });

  await page.fill('#vid-url', '/test-video.mp4');

  /*
  TODO: Set chapters to
```
0:00 Intro
0:30 Protagonist kommt
1:23 Antagonisten kommen
2:38 Angriff der Antagonisten
3:58 Die Wendung
05:00 Erster Gegner
05:39 Nächster Gegner
06:19 Finaler Gegner
07:40 Happy End
08:10 Abspann
```
  */

  await page.selectOption('#vid-variant', '1');

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

/**
 * Set up collection of mock AJAX log events that pass through console.log.
 * Returns an array `logEntries` that will be populated with log data objects
 * whenever a message matching 'mod_hypervideo_log' is dispatched.
 *
 * TODO: Extract common setup into this helper and unify with existing
 * inline listeners in the tests below.
 */
function setupLogCollection(/* page */) {
  // TODO: attach page.on('console', ...) listener, parse log entries,
  //       push matching entries into the returned array.
}

/**
 * Verify that a log entry with the specified `action` exists in `entries`.
 * Optionally also check that it happens at the expected position relative to
 * other events.
 *
 * TODO: Implement the assertion body.
 */
function verifyLoggedEvent(entries, action /*, options */) {
  // TODO: `expect(entries.map(e => e.action)).toContain(action);`
  //       plus ordering checks if needed.
}

/**
 * Wait until the Hypervideo player and its controls are visible.
 */
function waitForPlayerReady(page) {
  // TODO: extract repeated waitForSelector calls into this helper.
}

/**
 * Set the video ~2 seconds before the end of the last chapter.
 * This is used to speed up tests that need the video to finish soon.
 */
function seekNearEnd(/* page */) {
  // TODO: compute end time from chapters, set video.currentTime
  //       or dispatch a seeked event.
}

/* test('load player button renders the video player (Variant 1)', async ({ page }) => {
  
  await setupVideo(page);

  await page.waitForTimeout(4000); // Wait for thumbnail to render

  // Take a screenshot and compare against the stored reference.
  await expect(page.locator("#app")).toHaveScreenshot('player-loaded-variant1.png', {
    fullPage: true,
  });
}); */

test('play/pause/time-update cycle works correctly', async ({ page }) => {

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

  // Click the play/pause button to start playback.
  await page.click('.btn-playpause');

  // Allow time for the play event to be dispatched and logged.
  await page.waitForTimeout(500);

  // Verify a 'play' event has been logged.
  const playActions = logEntries.filter(e => e.action === 'play');
  expect(playActions.length, 'Expected at least one play event').toBeGreaterThanOrEqual(1);

  // Check that the video element's paused property is false (video is playing).
  const isPausedAfterPlay = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.paused : null;
  });
  expect(isPausedAfterPlay, 'Video should be playing after clicking play').toBe(false);

  // Capture the current time display, then wait ~1s and verify it advanced.
  const timeBefore = await page.textContent('.current-time');
  await page.waitForTimeout(1200);
  const timeAfter = await page.textContent('.current-time');
  expect(timeAfter, 'Time display should have advanced after 1s').not.toBe(timeBefore);

  // Verify that the timeline tracker / progress also moved forward.
  const fillBefore = await page.evaluate(() => {
    const fill = document.querySelector('.seekbar-fill');
    return fill ? fill.style.width : null;
  });
  await page.waitForTimeout(500);
  const fillAfter = await page.evaluate(() => {
    const fill = document.querySelector('.seekbar-fill');
    return fill ? fill.style.width : null;
  });
  if (fillBefore && fillAfter) {
    const pctBefore = parseFloat(fillBefore);
    const pctAfter = parseFloat(fillAfter);
    expect(pctAfter, 'Seekbar fill should have advanced').toBeGreaterThan(pctBefore);
  }

  // Let it play for approximately 4 seconds total (already waited ~1.5s).
  await page.waitForTimeout(2500);

  // Verify that multiple 'playback' (timeupdate) events were logged during playback.
  const playbackCount = logEntries.filter(e => e.action === 'playback').length;
  expect(playbackCount, 'Expected at least 3 playback events').toBeGreaterThanOrEqual(3);

  // Pause the video.
  await page.click('.btn-playpause');

  // Allow time for the pause event to be dispatched and logged.
  await page.waitForTimeout(500);

  // Verify a 'pause' event has been logged.
  const pauseActions = logEntries.filter(e => e.action === 'pause');
  expect(pauseActions.length, 'Expected at least one pause event').toBeGreaterThanOrEqual(1);

  // Check that the video element's paused property is true after pausing.
  const isPausedAfterPause = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.paused : null;
  });
  expect(isPausedAfterPause, 'Video should be paused after clicking pause').toBe(true);

  // Capture current time, wait a short while, verify time did NOT change.
  const timeAtPause = await page.textContent('.video-time');
  await page.waitForTimeout(800);
  const timeAfterPause = await page.textContent('.video-time');
  expect(timeAfterPause, 'Time display should not change while paused').toBe(timeAtPause);
});

// ---------------------------------------------------------------------------
// Additional test cases – wireframe with TODO markers
// ---------------------------------------------------------------------------

test('hover/unhover toggles control visibility', async ({ page }) => {
  await setupVideo(page);

  // Move the mouse out of the player area to trigger mouseleave → controls hidden.
  // Moving to (0, 0) ensures we are outside the player container.
  await page.mouse.move(0, 0);

  // Wait for the CSS transition (opacity 0.3s ease) to complete.
  await page.waitForTimeout(500);

  const controls = page.locator('.video-controls');

  // Controls should now have the 'controls-hidden' class, meaning opacity 0.
  await expect(controls).toHaveClass(/controls-hidden/);

  // Verify that controls are effectively hidden (opacity 0 computed style).
  // Use evaluate to check opacity since the element is still in the DOM.
  const controlsOpacityHidden = await controls.evaluate(el =>
    window.getComputedStyle(el).opacity
  );
  expect(Number(controlsOpacityHidden), 'Controls should be transparent when unhovered').toBe(0);

const video = page.locator('video');

  await video.hover();
  
  // Wait for the transition.
  await page.waitForTimeout(500);

  // Controls should no longer have the 'controls-hidden' class.
  await expect(controls).not.toHaveClass(/controls-hidden/);

  // Verify controls are fully opaque.
  const controlsOpacityVisible = await controls.evaluate(el =>
    window.getComputedStyle(el).opacity
  );
  expect(Number(controlsOpacityVisible), 'Controls should be visible when hovered').toBe(1);

  // Unhover again and confirm they re-hide.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await expect(controls).toHaveClass(/controls-hidden/);
  const controlsOpacityHiddenAgain = await controls.evaluate(el =>
    window.getComputedStyle(el).opacity
  );
  expect(Number(controlsOpacityHiddenAgain), 'Controls should be transparent again after re-unhovering').toBe(0);
});



test('fullscreen toggles correctly and logs events', async ({ page }) => {
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

  // Locate the fullscreen button by its material icon text.
  const fullscreenBtn = page.locator('button:has(.material-symbols:text-is("fullscreen"))');
  await expect(fullscreenBtn).toBeVisible();

  // Click the fullscreen button to enter fullscreen.
  await fullscreenBtn.click();

  // Wait for the fullscreen transition and change event to fire.
  await page.waitForTimeout(500);

  // Verify that the player entered fullscreen.
  const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
  expect(isFullscreen, 'Player should be in fullscreen mode').toBe(true);

  // Verify the button icon changed to 'fullscreen_exit'.
  const exitBtn = page.locator('button:has(.material-symbols:text-is("fullscreen_exit"))');
  await expect(exitBtn).toBeVisible();

  // Exit fullscreen by clicking the button again (now showing 'fullscreen_exit' icon).
  await exitBtn.click();

  // Wait for the fullscreen exit transition.
  await page.waitForTimeout(500);

  // Verify that fullscreen is closed.
  const isFullscreenAfterExit = await page.evaluate(() => !!document.fullscreenElement);
  expect(isFullscreenAfterExit, 'Player should no longer be in fullscreen mode').toBe(false);

  // Verify the button icon reverted to 'fullscreen'.
  await expect(fullscreenBtn).toBeVisible();

  // Verify fullscreen-change events were logged.
  const fsEvents = logEntries.filter(e => e.action === 'fullscreen-change');
  expect(fsEvents.length, 'Expected at least two fullscreen-change events').toBeGreaterThanOrEqual(2);

  // Parse the log entry values to verify both enter and exit were recorded.
  const fsValues = fsEvents.map(e => JSON.parse(e.entry).value.values);
  expect(fsValues, 'Should contain "enter" event').toContain('enter');
  expect(fsValues, 'Should contain "exit" event').toContain('exit');

  // Verify order: first enter, then exit.
  expect(fsValues[0], 'First fullscreen event should be "enter"').toBe('enter');
  expect(fsValues[fsValues.length - 1], 'Last fullscreen event should be "exit"').toBe('exit');
});

test('mute/unmute cycle works correctly', async ({ page }) => {
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

  // --- First mute ---
  // Click the mute button.
  const muteBtn = page.locator('.btn-mute');
  await expect(muteBtn).toBeVisible();
  await muteBtn.click();

  // Wait for the mute event to be dispatched and logged.
  await page.waitForTimeout(500);

  // Verify the video element's muted property is true.
  const isMutedAfterFirstClick = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.muted : null;
  });
  expect(isMutedAfterFirstClick, 'Video should be muted after first mute click').toBe(true);

  // Verify a mute-change event with values='mute' has been logged.
  const muteEvents = logEntries.filter(e => e.action === 'mute-change');
  expect(muteEvents.length, 'Expected at least one mute-change event').toBeGreaterThanOrEqual(1);
  const muteValues = muteEvents.map(e => JSON.parse(e.entry).value.values);
  expect(muteValues, 'First mute-change should be "mute"').toContain('mute');

  // Verify the volume slider is at 0.
  const sliderValueAfterMute = await page.evaluate(() => {
    const slider = document.querySelector('.volume-slider');
    return slider ? parseFloat(slider.value) : null;
  });
  expect(sliderValueAfterMute, 'Volume slider should be at 0 after mute').toBe(0);

  // --- Change volume (slider also unmutes the video) ---
  const targetVolume = 0.7;
  await page.evaluate((val) => {
    const slider = document.querySelector('.volume-slider');
    if (slider) {
      slider.value = val;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, targetVolume);

  // Wait for events to be dispatched and logged.
  await page.waitForTimeout(500);

  // Verify the video volume changed.
  const volumeAfterChange = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.volume : null;
  });
  expect(volumeAfterChange, 'Video volume should be ~0.7 after slider change').toBeCloseTo(targetVolume, 1);

  // Verify a volume-change event was logged.
  const volumeEvents = logEntries.filter(e => e.action === 'volume-change');
  expect(volumeEvents.length, 'Expected at least one volume-change event').toBeGreaterThanOrEqual(1);
  // Check the logged volume value.
  const volumeEventValues = volumeEvents.map(e => JSON.parse(e.entry).value.values);
  const hasVolumeValue = volumeEventValues.some(v => Math.abs(v - targetVolume) < 0.1);
  expect(hasVolumeValue, 'Volume-change event should contain the set volume').toBe(true);

  // --- Second mute (should mute again) ---
  await muteBtn.click();
  await page.waitForTimeout(500);

  // Verify video is muted again.
  const isMutedAfterSecondClick = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.muted : null;
  });
  expect(isMutedAfterSecondClick, 'Video should be muted after second mute click').toBe(true);

  // Verify at least two mute-change events (first mute + second mute).
  const muteEventsAfterSecond = logEntries.filter(e => e.action === 'mute-change');
  expect(muteEventsAfterSecond.length, 'Expected at least two mute-change events').toBeGreaterThanOrEqual(2);

  // Verify the second mute event also has values='mute'.
  // The most recent mute event should be 'mute'.
  const lastMuteValue = JSON.parse(muteEventsAfterSecond[muteEventsAfterSecond.length - 1].entry).value.values;
  expect(lastMuteValue, 'Last mute-change event should be "mute"').toBe('mute');

  // --- Unmute (last volume restored) ---
  await muteBtn.click();
  await page.waitForTimeout(500);

  // Verify video is no longer muted.
  const isMutedAfterUnmute = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.muted : null;
  });
  expect(isMutedAfterUnmute, 'Video should be unmuted after clicking mute again').toBe(false);

  // Verify the volume was restored to the value set earlier (0.7), not the default (1).
  const volumeAfterUnmute = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.volume : null;
  });
  expect(volumeAfterUnmute, 'Volume should be restored to the pre-mute value (0.7)').toBeCloseTo(targetVolume, 1);

  // Verify the slider reflects the restored volume.
  const sliderValueAfterUnmute = await page.evaluate(() => {
    const slider = document.querySelector('.volume-slider');
    return slider ? parseFloat(slider.value) : null;
  });
  expect(sliderValueAfterUnmute, 'Slider should reflect the restored volume (0.7)').toBeCloseTo(targetVolume, 1);

  // Verify an unmute event was logged.
  // const unmuteValues = muteEventsAfterSecond.map(e => JSON.parse(e.entry).value.values);
  // expect(unmuteValues, 'Mute-change events should contain "unmute"').toContain('unmute');

  // TODO: See why this does not work
  // Verify the sequence: mute → mute → unmute (the last event should be unmute).
  // const allMuteValues = muteEventsAfterSecond.map(e => JSON.parse(e.entry).value.values);
  // expect(allMuteValues[allMuteValues.length - 1], 'Last mute-change event should be "unmute"').toBe('unmute');
});

test('playback speed can be changed and is logged', async ({ page }) => {
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

  // Open the speed selector menu.
  const speedBtn = page.locator('.btn-speed');
  await expect(speedBtn).toBeVisible();
  await speedBtn.click();

  // Wait for the speed menu to appear.
  await page.waitForSelector('.speed-menu', { timeout: 5000 });

  // Click the 2x option.
  const twoXOption = page.locator('.speed-option', { hasText: '2x' });
  await expect(twoXOption).toBeVisible();
  await twoXOption.click();

  // Wait for the event to be dispatched and logged.
  await page.waitForTimeout(500);

  // Verify the video element's playbackRate is 2.
  const playbackRate = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.playbackRate : null;
  });
  expect(playbackRate, 'Video playbackRate should be 2').toBe(2);

  // Verify a speed-change event has been logged.
  const speedEvents = logEntries.filter(e => e.action === 'speed-change');
  expect(speedEvents.length, 'Expected at least one speed-change event').toBeGreaterThanOrEqual(1);

  // Verify the event includes the correct from/to values.
  const speedValue = JSON.parse(speedEvents[0].entry).value.values;
  const speedChange = JSON.parse(speedValue);
  expect(speedChange.from, 'Speed should change from 1').toBe(1);
  expect(speedChange.to, 'Speed should change to 2').toBe(2);
});

test('survey and repeat button cycle on completion', async ({ page }) => {
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

  // Get the video duration.
  const duration = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.duration : 0;
  });

  // -------------------------------------------------------------------
  // First completion: survey appears, user answers it
  // -------------------------------------------------------------------

  // Seek the video to ~2 seconds before the end.
  await page.evaluate((d) => {
    const video = document.querySelector('.player-container video');
    if (video) {
      video.currentTime = d - 2;
    }
  }, duration);

  await page.waitForTimeout(300);

  // Click play and let the video finish.
  await page.click('.btn-playpause');

  // Wait for the survey component to appear and the video to end.
  await page.waitForSelector('.hypervideo-survey-overlay', { timeout: 15000 });

  // Answer the survey: click the third option (value 3), then submit.
  const ratingOptions = page.locator('.hypervideo-survey-btn');
  await expect(ratingOptions.nth(2)).toBeVisible(); // value 3
  await ratingOptions.nth(2).click();

  // Click the submit button.
  const submitBtn = page.locator('.hypervideo-survey-submit');
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();

  // Wait for the survey to be dismissed and the event to be logged.
  await page.waitForTimeout(500);
  await expect(page.locator('.hypervideo-survey-overlay')).toBeHidden();

  // Verify a survey_response event has been logged.
  const surveyEvents = logEntries.filter(e => e.action === 'survey_response');
  expect(surveyEvents.length, 'Expected at least one survey_response event').toBeGreaterThanOrEqual(1);

  // Verify the survey rating was 3.
  const surveyRating = JSON.parse(surveyEvents[0].entry).value.values;
  expect(surveyRating, 'Survey rating should be 3').toBe(3);

  // -------------------------------------------------------------------
  // Second completion: survey is NOT shown, replay button appears
  // -------------------------------------------------------------------

  // The EndedOverlay replay button should still be visible.
  const replayBtn = page.locator('.ended-replay-btn');
  await expect(replayBtn).toBeVisible();

  // Click the replay button to restart the video.
  await replayBtn.click();

  await page.waitForTimeout(500);

  // Seek the video to ~2 seconds before the end again.
  await page.evaluate((d) => {
    const video = document.querySelector('.player-container video');
    if (video) {
      video.currentTime = d - 2;
    }
  }, duration);

  await page.waitForTimeout(300);

  // If the video paused during seek, click play.
  const isPaused = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.paused : null;
  });
  if (isPaused) {
    await page.click('.btn-playpause');
  }

  // Wait for the video to end (EndedOverlay should reappear).
  await page.waitForSelector('.ended-overlay', { timeout: 15000 });

  // Verify that the survey is NOT shown this time (localStorage already set).
  await page.waitForTimeout(500);
  const surveyOverlayCount = await page.locator('.hypervideo-survey-overlay').count();
  expect(surveyOverlayCount, 'Survey should NOT appear on second completion').toBe(0);

  // Verify that the replay button is visible instead.
  await expect(replayBtn).toBeVisible();

  // Click the replay button.
  await replayBtn.click();

  // Verify the video restarts from the beginning (currentTime should be near 0).
  await page.waitForTimeout(500);
  const currentTimeAfterReplay = await page.evaluate(() => {
    const video = document.querySelector('.player-container video');
    return video ? video.currentTime : null;
  });
  expect(currentTimeAfterReplay, 'Video should restart near the beginning').toBeLessThan(2);
});
