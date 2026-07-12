<template>
  <nav
    v-if="chapters.length"
    class="hypervideo-chapters"
    :aria-label="$t('chapters_nav')"
  >
    <h4 class="hypervideo-chapters-heading">{{ $t("chapters_title") }}</h4>
    <div class="hypervideo-chapters-grid" role="list">
      <button
        v-for="(chapter, index) in chapters"
        :key="index"
        type="button"
        class="hypervideo-chapters-tile"
        :class="{ 'is-active': index === activeIndex }"
        :aria-label="$t('chapters_goto') + ' ' + chapter.title"
        :aria-current="index === activeIndex ? 'true' : undefined"
        role="listitem"
        @click="selectChapter(index, chapter.time)"
      >
        <div class="hypervideo-chapters-thumb">
          <canvas
            v-show="thumbnails[index]"
            :ref="(el) => { if (el) thumbCanvasRefs[index] = el }"
            class="hypervideo-chapters-thumb-canvas"
            aria-hidden="true"
          />
          <svg
            v-if="!thumbnails[index]"
            class="hypervideo-chapters-thumb-svg"
            viewBox="0 0 16 9"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="16" height="9" fill="#e0e0e0" />
          </svg>
          <span class="hypervideo-chapters-duration">{{
            segmentDurationText(index)
          }}</span>
        </div>
        <span class="hypervideo-chapters-label">{{ chapter.title }}</span>
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  props: {
    chapters: {
      type: Array,
      default: () => [],
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    range: {
      type: Object,
      default: null,
    },
    videoUrl: {
      type: String,
      default: '',
    },
  },
  emits: ["seek"],
  data() {
    return {
      activeIndex: 0,
      /** Array of booleans: true when thumbnail canvas is drawn */
      thumbnails: [],
      /** Array populated by template ref callbacks – the <canvas> elements */
      thumbCanvasRefs: [],
    };
  },
  computed: {
    segmentDurations() {
      return this.chapters.map((ch, i) => {
        if (i < this.chapters.length - 1) {
          return this.chapters[i + 1].time - ch.time;
        }
        return this.duration > 0 ? this.duration - ch.time : null;
      });
    },
  },
  mounted() {
    this.updateActiveIndex();
    this.generateThumbnails();
  },
  beforeUnmount() {
    this.cancelThumbnails();
  },
  watch: {
    currentTime() {
      this.updateActiveIndex();
    },
    chapters() {
      this.updateActiveIndex();
      this.generateThumbnails();
    },
    videoUrl() {
      this.generateThumbnails();
    },
    range: {
      handler() {
        this.updateActiveIndex();
      },
      deep: true,
    },
  },
  methods: {
    updateActiveIndex() {
      if (!this.chapters.length) {
        this.activeIndex = 0;
        return;
      }
      // Use range.start as the authoritative chapter when a range is active,
      // so the highlight stays on the current chapter even after reaching
      // the segment boundary (where currentTime equals the next chapter's start).
      const refTime = this.range ? this.range.start : this.currentTime;
      for (let i = this.chapters.length - 1; i >= 0; i--) {
        if (refTime >= this.chapters[i].time) {
          this.activeIndex = i;
          return;
        }
      }
      this.activeIndex = 0;
    },
    selectChapter(index, time) {
      this.activeIndex = index;
      this.$emit("seek", time);
    },
    segmentDurationText(index) {
      const dur = this.segmentDurations[index];
      if (dur == null) return "";
      return this.formatTime(Math.round(dur));
    },
    generateThumbnails() {
      this.cancelThumbnails();
      this.thumbnails = this.chapters.map(() => false);
      this.thumbCanvasRefs = [];

      if (!this.videoUrl || !this.chapters.length) return;

      const timestamps = this.chapters.map((c) => c.time);
      this._cancelled = false;

      const video = document.createElement('video');
      // Do NOT set crossOrigin – the CDN doesn't send CORS headers.
      // The canvas will be tainted but still renders the frame visually;
      // we never call toDataURL, we keep the canvas elements in the DOM.
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.style.position = 'absolute';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';

      let currentIndex = 0;

      video.addEventListener('loadedmetadata', () => {
        if (this._cancelled) {
          cleanup();
          return;
        }
        const aspectHeight = Math.round(
          (video.videoHeight / video.videoWidth) * 160
        );
        // Size the template canvases once we know the aspect ratio
        this.thumbCanvasRefs.forEach((c) => {
          if (c) {
            c.width = 160;
            c.height = aspectHeight;
          }
        });
        seekToNext();
      });

      video.addEventListener('seeked', () => {
        if (this._cancelled) return;
        const canvas = this.thumbCanvasRefs[currentIndex];
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        // Mark ready so v-show reveals the canvas and v-if hides the SVG
        this.thumbnails = this.thumbnails.map((v, i) =>
          i === currentIndex ? true : v
        );
        currentIndex++;
        if (currentIndex < timestamps.length) {
          seekToNext();
        } else {
          cleanup();
        }
      });

      video.addEventListener('error', () => {
        cleanup();
      });

      document.body.appendChild(video);
      video.src = this.videoUrl;
      video.load();
      this._videoEl = video;

      const seekToNext = () => {
        video.currentTime = timestamps[currentIndex];
      };

      const cleanup = () => {
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        video.removeAttribute('src');
        this._videoEl = null;
      };
    },
    cancelThumbnails() {
      this._cancelled = true;
      if (this._videoEl) {
        if (this._videoEl.parentNode) {
          this._videoEl.parentNode.removeChild(this._videoEl);
        }
        this._videoEl.removeAttribute('src');
        this._videoEl = null;
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
  },
};
</script>

<style scoped>
.hypervideo-chapters {
  border-radius: var(--border-radius);
  background-color: var(--light-bg);
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

.hypervideo-chapters-heading {
  font-size: 1rem;
  font-weight: 600;
  padding: 10px;
  margin: 0;
  position: sticky;
  top: 0;
  background-color: var(--light-bg);
  z-index: 1;
}

.hypervideo-chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding: 5px;
}

.hypervideo-chapters-tile {
  display: flex;
  flex-direction: column;
  padding: 5px;
  gap: 0.35rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  color: inherit;
  border-radius: 4px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.hypervideo-chapters-tile:hover,
.hypervideo-chapters-tile:focus-visible
.hypervideo-chapters-tile.is-active:hover
.hypervideo-chapters-tile.is-active:focus-visible {
  box-shadow: 0 0 0 2px var(--accent-color);
  outline: none;
}

.hypervideo-chapters-tile.is-active {
  box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.5);
}

.hypervideo-chapters-thumb {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  /* aspect-ratio: 16 / 9; */
  background-color: #e0e0e0;
}

.hypervideo-chapters-thumb-canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hypervideo-chapters-thumb-svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hypervideo-chapters-duration {
  font-family: monospace;
  position: absolute;
  bottom: 5px;
  right: 5px;
  padding: 0.1rem 0.3rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: #000;
  background-color: var(--overlay-bg);
  border-radius: 5px;
}

.hypervideo-chapters-label {
  padding: 0 0.15rem;
  line-height: 1.3;
}
</style>