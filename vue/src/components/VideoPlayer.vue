<template>
  <div class="player-container">
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

    <div class="video-controls" v-if="videoReady && !videoError">
      <button
        class="btn btn-playpause"
        @click="handlePlayClick"
        :title="hasEnded ? $t('rewatch') : (isPaused ? $t('play') : $t('pause'))"
      >
        <span v-if="hasEnded" class="material-symbols">replay</span>
        <span v-else-if="isPaused" class="material-symbols">play_arrow</span>
        <span v-else class="material-symbols">pause</span>
      </button>

      <span :title="$t('currentTime')" class="video-time">{{ formatTime(displayedCurrentTime) }}</span>
      <span class="seekbar-wrapper" @mousemove="onSeekbarHover" @mouseleave="onSeekbarLeave">
        <span class="seekbar-visual">
          <div class="seekbar-fill" :style="{ width: video && video.duration > 0 && effectiveMax > effectiveMin ? ((currentTime - effectiveMin) / (effectiveMax - effectiveMin) * 100) + '%' : '0%' }"></div>
          <div v-if="displayChapters.length" class="seekbar-chapters">
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
          step="1"
          v-model="currentTime"
          @input="seekTo(currentTime)"
          aria-label="Video seekbar"
        />
      </span>
      <span :title="$t('duration')" class="video-time">{{ formatTime(displayedDuration) }}</span>

      <button
        class="btn btn-mute"
        @click="toggleMute"
        :title="isMuted || volume === 0 ? $t('unmute') : $t('mute')"
      >
        <span v-if="isMuted || volume === 0" class="material-symbols">volume_off</span>
        <span v-else-if="volume < 0.5" class="material-symbols">volume_down</span>
        <span v-else class="material-symbols">volume_up</span>
      </button>

      <input
        type="range"
        class="volume-slider"
        min="0"
        max="1"
        step="0.05"
        :value="isMuted ? 0 : volume"
        :style="{ '--volume-fill': (isMuted ? 0 : volume) * 100 + '%' }"
        @input="onVolumeChange"
        aria-label="Volume"
      />

      <button
        class="btn btn-fullscreen"
        @click="toggleFullscreen"
        :title="isFullscreen ? $t('exit_fullscreen') : $t('fullscreen')"
      >
        <span v-if="!isFullscreen" class="material-symbols">fullscreen</span>
        <span v-else class="material-symbols">fullscreen_exit</span>
      </button>
    </div>
  </div>
</template>

<script>
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
  },
  emits: [
    'play',
    'pause',
    'seeked',
    'ended',
    'playback',
    'chapter-seek',
    'timeupdate',
    'ready',
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
    };
  },
  mounted() {
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    document.addEventListener("keydown", this.onKeydown);
    this.videoid = "videoid" + Math.floor(Math.random() * 1000);
  },
  beforeUnmount() {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    document.removeEventListener("keydown", this.onKeydown);
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
        this.$emit('chapter-seek', {
          context: "player",
          action: "chapter-seek",
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
    // Handle spacebar play/pause, but only if the user isn't focused on an input field or other editable element.
    onKeydown(e) {
      if (e.key !== " " && e.code !== "Space") return;
      if (!this.videoReady || this.videoError) return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag === "button" ||
        document.activeElement?.isContentEditable;

      if (isEditable) return;

      e.preventDefault();
      this.handlePlayClick();
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
      } else {
        this.prevVolume = this.volume;
        this.isMuted = true;
        this.video.muted = true;
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
  },
};
</script>

<style scoped>
.player-container {
  width: fit-content;
  position: relative;
}

.hypervideo-error {
  margin-top: 1rem;
}

.hypervideo-player {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 8px;
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
  background-color: #eee8;
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
  background: #ccc;
  border-radius: 3px;
}

.seekbar-fill {
  height: 6px;
  background-color: #4a90d9;
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
  box-shadow: 0 0 0 2px #86b7fe;
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

.seekbar-chapter--even {
  background: rgba(74, 144, 217, 0.08);
}

.seekbar-chapter--odd {
  background: rgba(74, 144, 217, 0.18);
}

.seekbar-chapter-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  font-size: 0.75rem;
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
  color: #333;
  min-width: 3.5rem;
  text-align: center;
  user-select: none;
}

.btn-fullscreen,
.btn-playpause,
.btn-mute {
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 4px 10px;
  color: #555;
  transition: background 0.15s, color 0.15s;
}

.btn-playpause {
  margin-right: 2px;
  line-height: 0;
}

.btn-fullscreen {
  margin-left: auto;
  line-height: 0;
}

.btn-fullscreen:hover,
.btn-playpause:hover,
.btn-mute:hover,
.btn-fullscreen:focus-visible,
.btn-playpause:focus-visible,
.btn-mute:focus-visible {
  background: #e9ecef;
  color: #222;
  outline: none;
}

.btn-fullscreen:focus-visible,
.btn-playpause:focus-visible,
.btn-mute:focus-visible {
  box-shadow: 0 0 0 2px #86b7fe;
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
  background: linear-gradient(to right, #4a90d9 0%, #4a90d9 var(--volume-fill, 100%), #ccc var(--volume-fill, 100%), #ccc 100%);
}

.volume-slider::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: #ccc;
}

.volume-slider::-moz-range-progress {
  height: 6px;
  border-radius: 3px;
  background: #4a90d9;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a90d9;
  cursor: pointer;
  margin-top: -4px;
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a90d9;
  cursor: pointer;
  border: none;
}

.volume-slider:focus-visible {
  box-shadow: 0 0 0 2px #86b7fe;
  border-radius: 3px;
}
</style>