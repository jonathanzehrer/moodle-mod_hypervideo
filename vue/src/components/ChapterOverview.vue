<template>
  <nav
    v-if="chapters.length"
    class="hypervideo-chapters"
    :aria-label="$t('chapters_nav')"
  >
    <h4 class="hypervideo-chapters-heading">{{ $t("chapters_title") }}</h4>
    <ol class="hypervideo-chapters-list" role="list">
      <li
        v-for="(chapter, index) in chapters"
        :key="index"
        class="hypervideo-chapters-item"
        :class="{ 'is-active': index === activeIndex }"
        :aria-current="index === activeIndex ? 'true' : undefined"
      >
        <button
          type="button"
          class="hypervideo-chapters-button"
          :aria-label="$t('chapters_goto') + ' ' + chapter.title"
          @click="selectChapter(index, chapter.time)"
        >
          <span class="hypervideo-chapters-label">{{ chapter.title }}</span>
          <span class="hypervideo-chapters-duration">{{
            segmentDurationText(index)
          }}</span>
        </button>
      </li>
    </ol>
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
  },
  emits: ["seek"],
  data() {
    return {
      activeIndex: 0,
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
  },
  watch: {
    currentTime() {
      this.updateActiveIndex();
    },
    chapters() {
      this.updateActiveIndex();
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
      return Math.round(dur) + "s";
    },
  },
};
</script>

<style>
.hypervideo-chapters {
  margin-top: 0;
}

.hypervideo-chapters-heading {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.hypervideo-chapters-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hypervideo-chapters-item {
  border-left: 3px solid transparent;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.hypervideo-chapters-item.is-active {
  border-left-color: #0f6cbf;
  background-color: rgba(15, 108, 191, 0.06);
}

.hypervideo-chapters-button {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
  color: inherit;
}

.hypervideo-chapters-button:hover,
.hypervideo-chapters-button:focus-visible {
  background-color: rgba(0, 0, 0, 0.05);
  outline: 2px solid #0f6cbf;
  outline-offset: -2px;
}

.hypervideo-chapters-label {
  flex: 1;
}

.hypervideo-chapters-duration {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: #666;
}
</style>