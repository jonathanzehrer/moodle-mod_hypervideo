<template>
  <div
    class="player-container"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Overview back button overlay -->
    <button
      v-if="onOverview"
      class="overview-back-btn"
      :class="{ 'controls-hidden': !controlsVisible }"
      :title="$t('back_to_overview')"
      :aria-label="$t('back_to_overview')"
      @click.stop="onOverview"
    >
      <span class="material-symbols" aria-hidden="true">arrow_back</span>
    </button>

    <!-- Player error -->
    <div
      v-if="videoError"
      class="hypervideo-error alert alert-danger"
      role="alert"
      aria-live="assertive"
    >
      {{ $t("player_error") }}
    </div>

    <!-- Player loading -->
    <div
      v-if="!videoError && !videoReady"
      class="hypervideo-loading"
      aria-live="polite"
    >
      <span role="status">{{ $t("player_loading") }}</span>
    </div>

    <video
      v-show="!videoError"
      ref="videoEl"
      :src="url"
      preload="metadata"
      class="hypervideo-player"
      :aria-label="title || $t('aria_videoplayer')"
      :aria-describedby="headingId"
      @click="handlePlayClick"
      @play="onPlay"
      @pause="onPause"
      @loadeddata="onCanPlay"
      @timeupdate="onTimeUpdate"
      @seeked="onSeeked"
      @seeking="onSeeking"
      @ended="onEnded"
      @error="onError"
    >
      <p>{{ $t("aria_videonotsupported") }}</p>
    </video>

    <div
      class="video-controls"
      :class="{ 'controls-hidden': !controlsVisible }"
      v-if="videoReady && !videoError"
    >
      <button
        class="btn btn-playpause"
        @click="handlePlayClick"
        :title="hasEnded ? $t('rewatch') : (isPaused ? $t('play') : $t('pause'))"
      >
        <span v-if="hasEnded" class="material-symbols" aria-hidden="true">replay</span>
        <span v-else-if="isPaused" class="material-symbols" aria-hidden="true">play_arrow</span>
        <span v-else class="material-symbols" aria-hidden="true">pause</span>
      </button>

      <span :title="$t('currentTime')" class="video-time">{{ formatTime(displayedCurrentTime) }}</span>
      <button
        v-if="showPrevNext"
        class="btn btn-prevnext"
        :disabled="!hasPrevious"
        :title="$t('previous_' + prevNextTitle)"
        @click="goToPrevious"
      >
        <span class="material-symbols" aria-hidden="true">skip_previous</span>
      </button>
      <span class="seekbar-wrapper" @mousemove="onSeekbarHover" @mouseleave="onSeekbarLeave">
        <span class="seekbar-visual">
          <div class="seekbar-fill" :style="{ width: video && video.duration > 0 && effectiveMax > effectiveMin ? ((currentTime - effectiveMin) / (effectiveMax - effectiveMin) * 100) + '%' : '0%' }"></div>
          <div v-if="showChapterMarks && displayChapters.length" class="seekbar-chapters">
            <div
              v-for="(ch, index) in displayChapters"
              :key="index"
              class="seekbar-chapter"
              :class="'seekbar-chapter--' + (index % 2 === 0 ? 'even' : 'odd')"
              :style="{ left: ch.startPercent + '%', width: ch.widthPercent + '%' }"
            ></div>
          </div>
        </span>
        <transition name="tooltip-fade">
          <span
            v-if="hoveredChapter"
            class="seekbar-chapter-tooltip"
            :style="{ left: hoveredChapterX + 'px' }"
          >
            {{ hoveredChapter }}
          </span>
        </transition>
        <input type="range"
          class="seekbar-input"
          :min="effectiveMin"
          :max="effectiveMax"
          step="any"
          v-model="currentTime"
          @input="seekTo(currentTime)"
          @keydown="onSeekbarKeydown"
          aria-label="Video seekbar"
        />
      </span>
      <span :title="$t('duration')" class="video-time">{{ formatTime(displayedDuration) }}</span>
      <button
        v-if="showPrevNext"
        class="btn btn-prevnext"
        :disabled="!hasNext"
        :title="$t('next_' + prevNextTitle)"
        @click="goToNext"
      >
        <span class="material-symbols" aria-hidden="true">skip_next</span>
      </button>

      <button
        class="btn btn-mute"
        @click="toggleMute"
        :title="isMuted || volume === 0 ? $t('unmute') : $t('mute')"
      >
        <span v-if="isMuted || volume === 0" class="material-symbols" aria-hidden="true">volume_off</span>
        <span v-else-if="volume < 0.5" class="material-symbols" aria-hidden="true">volume_down</span>
        <span v-else class="material-symbols" aria-hidden="true">volume_up</span>
      </button>

      <span class="volume-slider-wrapper">
        <input
          type="range"
          class="volume-slider"
          min="0"
          max="1"
          step="0.05"
          :value="isMuted ? 0 : volume"
          :style="{ '--volume-fill': (isMuted ? 0 : volume) * 100 + '%' }"
          @input="onVolumeChange"
          @change="onVolumeChangeLog"
          aria-label="Volume"
        />
      </span>

      <PlaybackSpeedControl
        :video="video"
        @speed-change="(e) => $emit('speed-change', e)"
      />

      <button
        class="btn btn-fullscreen"
        @click="toggleFullscreen"
        :title="isFullscreen ? $t('exit_fullscreen') : $t('fullscreen')"
      >
        <span v-if="!isFullscreen" class="material-symbols" aria-hidden="true">fullscreen</span>
        <span v-else class="material-symbols" aria-hidden="true">fullscreen_exit</span>
      </button>
    </div>

    <!-- Ended overlay -->
    <div v-if="hasEnded && videoReady" class="ended-overlay">
      <div class="ended-overlay-content">
        <button
          class="ended-replay-btn"
          @click.stop="handlePlayClick"
          :title="$t('rewatch')"
          :aria-label="$t('rewatch')"
        >
          <span class="material-symbols" aria-hidden="true">replay</span>
        </button>
        <div v-if="showOverlayPrevNext" class="ended-nav">
          <button
            class="ended-nav-btn"
            :disabled="!hasPrevious"
            :title="$t('previous_' + prevNextTitle)"
            :aria-label="$t('previous_' + prevNextTitle)"
            @click.stop="goToPrevious"
          >
            <span class="material-symbols" aria-hidden="true">skip_previous</span>
          </button>
          <button
            class="ended-nav-btn"
            :disabled="!hasNext"
            :title="$t('next_' + prevNextTitle)"
            :aria-label="$t('next_' + prevNextTitle)"
            @click.stop="goToNext"
          >
            <span class="material-symbols" aria-hidden="true">skip_next</span>
          </button>
        </div>
      </div>
    </div>

    <Survey
      :show="showSurvey"
      :question="$t('survey_question')"
      :submit-label="$t('survey_submit')"
      @submit="onSurveySubmit"
      @close="onSurveyDismiss"
    />
  </div>
</template>

<script>
import Survey from "./Survey.vue";
import PlaybackSpeedControl from "./PlaybackSpeedControl.vue";

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    headingId: {
      type: String,
      default: '',
    },
    chapters: {
      type: Array,
      default: () => [],
    },
    range: {
      type: Object,
      default: null,
    },
    enableSurvey: {
      type: Boolean,
      default: true,
    },
    onPrevious: {
      type: Function,
      default: null,
    },
    onNext: {
      type: Function,
      default: null,
    },
    onOverview: {
      type: Function,
      default: null,
    },
    showChapterMarks: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    Survey,
    PlaybackSpeedControl,
  },
  emits: [
    'play',
    'pause',
    'seeked',
    'ended',
    'playback',
    'timeline-seek',
    'timeupdate',
    'ready',
    'survey-response',
    'speed-change',
    'fullscreen-change',
    'volume-change',
    'mute-change',
  ],
  data() {
    return {
      video: null, // Reference to the <video> element
      seekStart: 0,
      videoid: 0,
      videoprogress: 0,
      duration: 0,
      interval: 2,
      lastposition: -1,
      timer: null,
      videoError: false,
      videoReady: false,
      currentTime: 0,
      isSeeking: false,
      isPaused: true, // Whether the video is currently paused (true) or playing (false)
      isFullscreen: false,
      hasEnded: false,
      hoveredChapter: null,
      hoveredChapterX: 0,
      volume: 1, // Represents `video.volume`, the current volume level (1 = 100%)
      isMuted: false, // Represents `video.muted`, whether the video is muted
      prevVolume: 1, // To restore volume after unmuting
      showSurvey: false,
      isHovering: false,
      isFocused: false,
      controlsVisible: true,
    };
  },
  mounted() {
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    document.addEventListener("keydown", this.onKeydown);
    this.$el.addEventListener("focusin", this.onFocusIn);
    this.$el.addEventListener("focusout", this.onFocusOut);
    this.videoid = "videoid" + Math.floor(Math.random() * 1000);
  },
  beforeUnmount() {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    document.removeEventListener("keydown", this.onKeydown);
    this.$el.removeEventListener("focusin", this.onFocusIn);
    this.$el.removeEventListener("focusout", this.onFocusOut);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  computed: {
    effectiveMin() {
      return this.range ? this.range.start : 0;
    },
    effectiveMax() {
      if (!this.video || !this.video.duration) return 0;
      if (this.range && this.range.end != null) {
        return Math.min(this.range.end, this.video.duration);
      }
      return this.video.duration;
    },
    displayedCurrentTime() {
      if (this.range) {
        return Math.max(0, this.currentTime - this.effectiveMin);
      }
      return this.currentTime;
    },
    displayedDuration() {
      if (this.range) {
        return this.effectiveMax - this.effectiveMin;
      }
      return this.effectiveMax;
    },
    displayChapters() {
      if (!this.chapters || !this.chapters.length || !this.video) return [];
      const duration = this.video.duration;
      if (!duration || duration <= 0) return [];

      const sorted = [...this.chapters].sort((a, b) => a.time - b.time);

      return sorted.map((ch, i) => {
        const start = Math.max(0, ch.time);
        const end = i < sorted.length - 1 ? sorted[i + 1].time : duration;
        const startPercent = (start / duration) * 100;
        const widthPercent = ((end - start) / duration) * 100;
        return { ...ch, start, end, startPercent, widthPercent };
      });
    },
    sortedChapters() {
      if (!this.chapters || !this.chapters.length) return [];
      return [...this.chapters].sort((a, b) => a.time - b.time);
    },
    showPrevNext() {
      return (this.chapters && this.chapters.length > 0) || (this.onPrevious && this.onNext);
    },
    showOverlayPrevNext() {
      return (this.onPrevious && this.onNext);
    },
    prevNextTitle() {
      if (this.chapters && this.chapters.length > 0) {
        return 'chapter';
      }
      return 'video';
    },
    hasPrevious() {
      if (this.chapters && this.chapters.length > 0) {
        const sorted = this.sortedChapters;
        const ref = this.range ? this.range.start : this.currentTime;
        return sorted.some(ch => ch.time < ref - 0.5);
      }
      // No chapters: disable if at or near the start of the video.
      return this.currentTime > 0.5;
    },
    hasNext() {
      if (this.chapters && this.chapters.length > 0) {
        const sorted = this.sortedChapters;
        const ref = this.range ? this.range.start : this.currentTime;
        return sorted.some(ch => ch.time > ref + 0.5);
      }
      // No chapters: disable if at or near the end of the video.
      return this.video && this.currentTime < this.video.duration - 0.5;
    },
  },
  watch: {
    range: {
      handler(newRange) {
        if (newRange && this.video && this.videoReady) {
          this.video.currentTime = newRange.start;
          this.currentTime = newRange.start;
          this.hasEnded = false;
        }
      },
      deep: true,
    },
  },
  methods: {
    updateControlsVisibility() {
      this.controlsVisible = this.isHovering || this.isFocused;
    },
    onMouseEnter() {
      this.isHovering = true;
      this.updateControlsVisibility();
    },
    onMouseLeave() {
      this.isHovering = false;
      this.updateControlsVisibility();
    },
    onFocusIn() {
      this.isFocused = true;
      this.updateControlsVisibility();
    },
    onFocusOut(e) {
      if (!this.$el.contains(e.relatedTarget)) {
        this.isFocused = false;
        this.updateControlsVisibility();
      }
    },
    setInitialProgress(videoprogressValue) {
      this.videoprogress = parseInt(videoprogressValue * this.interval, 10);
    },
    onCanPlay() {
      this.video = this.$refs.videoEl;
      this.video.setAttribute("id", this.videoid);
      this.videoReady = true;
      this.duration = this.video.duration;
      this.volume = this.video.volume;
      this.isMuted = this.video.muted;
      if (this.range && this.range.start > 0) {
        this.video.currentTime = this.range.start;
        this.currentTime = this.range.start;
      }
      this.$emit('ready', { duration: this.duration });
    },
    onTimeUpdate() {
      if (!this.video) return;

      // Keep the reactive currentTime in sync *before* range clamping,
      // so the seekbar fill always reflects the video's real position.
      this.currentTime = this.video.currentTime;

      if (this.range) {
        if (this.video.currentTime < this.range.start) {
          this._rangeClamping = true;
          this.video.currentTime = this.range.start;
          this.currentTime = this.range.start;
        }
        // Guard with !this.hasEnded to break the infinite loop:
        // setting video.currentTime = range.end fires another timeupdate,
        // which would re-enter this block and spam pause/ended/playback forever.
        if (this.range.end != null && this.video.currentTime >= this.range.end && !this.hasEnded) {
          this._rangeClamping = true;
          this.video.currentTime = this.range.end;
          this.currentTime = this.range.end;
          this.video.pause();
          this.onEnded();
          return;
        }
      }
      if (!this.isSeeking) {
        this.seekStart = this.video.currentTime;
      }
      this.$emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
    },
    loop() {
      if (!this.video) {
        return;
      }
      const curr = this.video.currentTime || 0;
      const currentinterval = curr > 0 ? Math.round(curr / this.interval) : 0;
      if (currentinterval !== this.lastposition) {
        this.$emit('playback', {
          context: "player",
          action: "playback",
          values: currentinterval,
          currenttime: this.video.currentTime,
          duration: this.video.duration,
        });
        this.videoprogress += this.interval;
        this.lastposition = currentinterval;
      }
    },
    onPlay() {
      this.video = this.$refs.videoEl;
      this.isPaused = false;
      this.hasEnded = false;
      this.$emit('play', {
        context: "player",
        action: "play",
        values: "",
        currenttime: this.video ? this.video.currentTime : 0,
        duration: this.video ? this.video.duration : 0,
      });
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.timer = setInterval(this.loop, this.interval * 1000);
      setTimeout(this.loop, 100);
    },
    onPause() {
      if (!this.video) {
        return;
      }
      this.isPaused = true;
      this.$emit('pause', {
        context: "player",
        action: "pause",
        values: "",
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      clearInterval(this.timer);
      this.timer = null;
      this.loop();
    },
    onSeeking() {
      this.isSeeking = true;
    },
    seekTo(time) {
      if (this.range) {
        time = Math.max(this.range.start, time);
        if (this.range.end != null) {
          time = Math.min(this.range.end, time);
        }
      }
      if (this.video) {
        // User-initiated seek means they want to keep watching;
        // reset the ended state so the replay button reverts to play/pause.
        this.hasEnded = false;
        this.video.currentTime = time;
        this.currentTime = time;
        this.$emit('timeline-seek', {
          context: "player",
          action: "timeline-seek",
          values: time,
          currenttime: time,
          duration: this.video.duration,
        });
      }
    },
    onError() {
      this.videoError = true;
    },
    onSeeked() {
      if (!this.video) {
        return;
      }
      // Only clear ended state for user-initiated seeks.
      // Programmatic range-clamp seeks (from onTimeUpdate) must
      // let onEnded's hasEnded=true stand so the replay icon appears.
      if (!this._rangeClamping) {
        this.hasEnded = false;
      }
      this._rangeClamping = false;
      const from = this.seekStart;
      const to = this.video.currentTime;
      const distance = to - from;
      const direction = distance >= 0 ? "forward" : "backward";
      this.$emit('seeked', {
        context: "player",
        action: "seeked",
        values: JSON.stringify({
          from: from,
          to: to,
          distance: distance,
          direction: direction,
        }),
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      this.seekStart = this.video.currentTime;
      this.isSeeking = false;
    },
    onEnded() {
      if (!this.video) {
        return;
      }
      this.hasEnded = true;
      this.isPaused = true;
      this.$emit('ended', {
        context: "player",
        action: "ended",
        values: "",
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      clearInterval(this.timer);
      this.timer = null;
      this.loop();
      this.maybeShowSurvey();
    },
    handlePlayClick() {
      if (this.hasEnded) {
        this.video.currentTime = this.range ? this.range.start : 0;
        this.video.play();
      } else if (this.isPaused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    },
    // Global keyboard shortcuts: spacebar for play/pause, left/right arrows for ±5s seek.
    onKeydown(e) {
      if (!this.videoReady || this.videoError) return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag === "button" ||
        document.activeElement?.isContentEditable;

      // Spacebar: play/pause (skip when editable elements are focused)
      if ((e.key === " " || e.code === "Space") && !isEditable) {
        e.preventDefault();
        this.handlePlayClick();
        return;
      }

      // Left/Right arrows: seek ±5 seconds (skip when editable elements are focused)
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isEditable) {
        e.preventDefault();
        const delta = e.key === "ArrowRight" ? 5 : -5;
        const newTime = this.currentTime + delta;
        this.seekTo(newTime);
      }
    },
    toggleFullscreen() {
      const el = this.$el;
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
        this.isFullscreen = true;
      } else {
        document.exitFullscreen().catch(() => {});
        this.isFullscreen = false;
      }
    },
    formatTime(seconds) {
      if (isNaN(seconds) || seconds === Infinity || seconds === 0) {
        return "0:00";
      }
      const s = Math.floor(seconds);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, "0")}`;
    },
    onFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
      this.$emit('fullscreen-change', {
        context: 'player',
        action: 'fullscreen-change',
        values: this.isFullscreen ? 'enter' : 'exit',
        currenttime: this.video ? this.video.currentTime : 0,
        duration: this.video ? this.video.duration : 0,
      });
    },
    // Keyboard navigation on the seekbar input: left/right arrows seek ±5 seconds.
    onSeekbarKeydown(e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const delta = e.key === "ArrowRight" ? 5 : -5;
        const newTime = this.currentTime + delta;
        this.seekTo(newTime);
      }
    },
    onSeekbarHover(e) {
      if (!this.displayChapters.length) {
        this.hoveredChapter = null;
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const timeAtCursor = this.effectiveMin + ratio * (this.effectiveMax - this.effectiveMin);

      for (let i = 0; i < this.displayChapters.length; i++) {
        const ch = this.displayChapters[i];
        if (timeAtCursor >= ch.start && timeAtCursor < ch.end) {
          this.hoveredChapter = ch.title;
          this.hoveredChapterX = e.clientX - rect.left;
          return;
        }
      }
      this.hoveredChapter = null;
    },
    onSeekbarLeave() {
      this.hoveredChapter = null;
    },
    toggleMute() {
      if (!this.video) return;
      if (this.isMuted || this.volume === 0) {
        this.isMuted = false;
        this.video.muted = false;
        this.volume = this.prevVolume || 1;
        this.video.volume = this.volume;
        this.$emit('mute-change', {
          context: 'player',
          action: 'mute-change',
          values: 'unmute',
          currenttime: this.video.currentTime,
          duration: this.video.duration,
        });
      } else {
        this.prevVolume = this.volume;
        this.isMuted = true;
        this.video.muted = true;
        this.$emit('mute-change', {
          context: 'player',
          action: 'mute-change',
          values: 'mute',
          currenttime: this.video.currentTime,
          duration: this.video.duration,
        });
      }
    },
    onVolumeChange(e) {
      const val = parseFloat(e.target.value);
      this.volume = val;
      if (this.video) {
        this.video.volume = val;
      }
      if (val > 0) {
        this.isMuted = false;
        this.video.muted = false;
      } else {
        // Volume dragged to zero: reflect it as muted so toggleMute works correctly.
        this.isMuted = true;
        this.video.muted = true;
      }
    },

    onVolumeChangeLog(e) {
      const val = parseFloat(e.target.value);
      if (this.video) {
        this.$emit('volume-change', {
          context: 'player',
          action: 'volume-change',
          values: val,
          currenttime: this.video.currentTime,
          duration: this.video.duration,
        });
      }
    },

    // ---------- Survey ----------

    maybeShowSurvey() {
      if (!this.enableSurvey) {
        return;
      }
      const storageKey = 'mod_hypervideo_survey_' + this.$store.state.hypervideoid;
      try {
        const answered = window.localStorage.getItem(storageKey);
        if (answered) {
          return;
        }
      } catch (e) {
        // localStorage unavailable — still show survey
      }
      this.showSurvey = true;
    },

    onSurveySubmit(rating) {
      const storageKey = 'mod_hypervideo_survey_' + this.$store.state.hypervideoid;
      try {
        window.localStorage.setItem(storageKey, String(rating));
      } catch (e) {
        // storage full or unavailable — silently ignore
      }
      this.showSurvey = false;
      this.$emit('survey-response', rating);
    },

    goToPrevious() {
      if (this.onPrevious) {
        this.onPrevious();
        this.playAfterNavigate();
        return;
      }
      // Fallback: navigate to previous chapter internally
      if (!this.chapters || !this.chapters.length || !this.video) return;
      const sorted = this.sortedChapters;
      const currentTime = this.currentTime;
      let prevChapter = null;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].time < currentTime - 0.5) {
          prevChapter = sorted[i];
          break;
        }
      }
      if (prevChapter) {
        this.video.currentTime = prevChapter.time;
        this.currentTime = prevChapter.time;
        this.hasEnded = false;
      }
    },
    goToNext() {
      if (this.onNext) {
        this.onNext();
        this.playAfterNavigate();
        return;
      }
      // Fallback: navigate to next chapter internally
      if (!this.chapters || !this.chapters.length || !this.video) return;
      const sorted = this.sortedChapters;
      const currentTime = this.currentTime;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time > currentTime + 0.5) {
          this.video.currentTime = sorted[i].time;
          this.currentTime = sorted[i].time;
          this.hasEnded = false;
          return;
        }
      }
    },
    playAfterNavigate() {
      // After the parent updates the range, hasEnded will be reset by the
      // range watcher. Auto-play so the next segment starts immediately.
      this.$nextTick(() => {
        if (this.video && this.video.paused) {
          this.video.play().catch(() => {});
        }
      });
    },
    onSurveyDismiss() {
      this.showSurvey = false;
    },
  },
};
</script>

<style scoped>
.player-container {
  width: fit-content;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

/* ---------- Overview Back Button ---------- */

.overview-back-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: #fffa;
  backdrop-filter: blur(4px);
  color: #444;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, opacity 0.3s ease;
}

.overview-back-btn:hover,
.overview-back-btn:focus-visible {
  background: #fff;
  color: #000;
  transform: scale(1.1);
  /* outline: 2px solid #fff; */
}

.overview-back-btn .material-symbols {
  font-size: 1.25rem;
}

.hypervideo-error {
  margin-top: 1rem;
}

.hypervideo-player {
  width: 100%;
  height: 100%;
  display: block;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 5px;
  padding: 5px;
  align-items: center;
  background-color: #fffa;
  backdrop-filter: blur(4px);
  z-index: 6;
  transition: opacity 0.3s ease;
}

.seekbar-wrapper {
  flex: 1;
  position: relative;
  height: 24px;
  margin: 0 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.seekbar-visual {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 6px;
  transform: translateY(-50%);
  pointer-events: none;
  background: #fff;
  border-radius: 3px;
}

.seekbar-fill {
  height: 6px;
  background-color: #004C97;
  border-radius: 3px;
  transition: width 0.2s linear;
}

.seekbar-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  z-index: 1;
}

.seekbar-input:focus-visible {
  outline: none;
}

.seekbar-wrapper::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 10px;
  transform: translateY(-50%);
  border-radius: 5px;
  pointer-events: none;
  z-index: 2;
}

.seekbar-wrapper:focus-within::after {
  box-shadow: 0 0 0 2px #004C97;
}

.seekbar-chapters {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 3px;
  overflow: hidden;
}

.seekbar-chapter {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 2px solid rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.seekbar-chapter:last-child {
  border-right: none;
}

.seekbar-chapter-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  background: #fff;
  color: #000;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

.video-time {
  font-size: 0.85rem;
  font-family: monospace;
  color: #444;
  min-width: 3.5rem;
  text-align: center;
  user-select: none;
}

.btn {
  display: flex;
  background: none;
  border: none;
  padding: 5px;
  color: #444;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

  transition: background 0.15s, color 0.15s;
}

.btn:hover,
.btn:focus-visible,
.btn-prevnext:hover,
.btn-prevnext:focus-visible {
  background: #e9ecef;
  color: #222;
}

.btn:focus-visible,
.btn-prevnext:focus-visible {
  background: #e9ecef;
  color: #222;
  outline: 2px solid #004C97;
}

.btn-prevnext:disabled {
  opacity: 0.35;
  cursor: default;
}

.btn-prevnext:disabled:hover {
  background: none;
  color: #444;
}

.volume-slider {
  width: 80px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #004C97 0%, #004C97 var(--volume-fill, 100%), #fff var(--volume-fill, 100%), #ccc 100%);
}

.volume-slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: #fff;
}

.volume-slider::-moz-range-progress {
  height: 6px;
  border-radius: 3px;
  background: #004C97;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #004C97;
  cursor: pointer;
  margin-top: -4px;
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #004C97;
  cursor: pointer;
  border: none;
}

.volume-slider:focus-visible {
  outline: none;
}

.volume-slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 4px;
  padding: 4px;
  border-radius: 6px;
}

.volume-slider-wrapper:focus-within {
  outline: 2px solid #004C97;
  outline-offset: 0;
}

/* ---------- Ended Overlay ---------- */

.ended-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 8px;
  z-index: 5;
}

.ended-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.ended-replay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #222;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

.ended-replay-btn:hover,
.ended-replay-btn:focus-visible {
  background: #fff;
  transform: scale(1.08);
  outline: 2px solid #004C97;
}

.ended-replay-btn .material-symbols {
  font-size: 2.5rem;
}

.ended-nav {
  display: flex;
  gap: 1rem;
}

.ended-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #222;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ended-nav-btn:hover:not(:disabled),
.ended-nav-btn:focus-visible:not(:disabled) {
  background: #fff;
  transform: scale(1.08);
  outline: 2px solid #004C97;
}

.ended-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.ended-nav-btn .material-symbols {
  font-size: 1.5rem;
}

/* ---------- Controls visibility ---------- */

.controls-hidden {
  opacity: 0;
  pointer-events: none;
}
</style>