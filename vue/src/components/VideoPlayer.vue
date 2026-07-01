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

      <span class="video-time">{{ formatTime(currentTime) }}</span>
      <span class="seekbar-wrapper" @mousemove="onSeekbarHover" @mouseleave="onSeekbarLeave">
        <span class="seekbar-visual">
          <div class="seekbar-fill" :style="{ width: video && video.duration > 0 ? (currentTime / video.duration * 100) + '%' : '0%' }"></div>
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
          :min="0"
          :max="video ? video.duration : 0"
          step="1"
          v-model="currentTime"
          @input="seekTo(currentTime)"
          aria-label="Video seekbar"
        />
      </span>
      <span class="video-time">{{ formatTime(video ? video.duration : 0) }}</span>
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
      video: null,
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
      isPaused: true,
      isFullscreen: false,
      hasEnded: false,
      hoveredChapter: null,
      hoveredChapterX: 0,
    };
  },
  mounted() {
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    this.videoid = "videoid" + Math.floor(Math.random() * 1000);
  },
  beforeUnmount() {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  computed: {
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
  methods: {
    setInitialProgress(videoprogressValue) {
      this.videoprogress = parseInt(videoprogressValue * this.interval, 10);
    },
    onCanPlay() {
      this.video = this.$refs.videoEl;
      this.video.setAttribute("id", this.videoid);
      this.videoReady = true;
      this.duration = this.video.duration;
      this.$emit('ready', { duration: this.duration });
    },
    onTimeUpdate() {
      if (this.video) {
        if (!this.isSeeking) {
          this.seekStart = this.video.currentTime;
        }
        this.currentTime = this.video.currentTime;
        this.$emit('timeupdate', { currentTime: this.currentTime, duration: this.duration });
      }
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
      if (this.video) {
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
        this.video.currentTime = 0;
        this.video.play();
      } else if (this.isPaused) {
        this.video.play();
      } else {
        this.video.pause();
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
    },
    onSeekbarHover(e) {
      if (!this.displayChapters.length) {
        this.hoveredChapter = null;
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const timeAtCursor = ratio * this.video.duration;

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
  overflow: hidden;
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

.seekbar-input:focus-visible ~ .seekbar-visual {
  outline: 2px solid #86b7fe;
  outline-offset: 4px;
  border-radius: 3px;
}

.seekbar-chapters {
  position: absolute;
  inset: 0;
  pointer-events: none;
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
.btn-playpause {
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
.btn-fullscreen:focus-visible,
.btn-playpause:focus-visible {
  background: #e9ecef;
  color: #222;
  outline: none;
}

.btn-fullscreen:focus-visible,
.btn-playpause:focus-visible {
  box-shadow: 0 0 0 2px #86b7fe;
}
</style>