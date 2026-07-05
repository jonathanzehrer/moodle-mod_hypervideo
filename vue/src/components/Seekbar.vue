<template>
  <span class="seekbar-wrapper" @mousemove="onHover" @mouseleave="onLeave">
    <span class="seekbar-visual">
      <div class="seekbar-fill" :style="{ width: fillPercent + '%' }"></div>
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
    <input
      type="range"
      class="seekbar-input"
      :min="min"
      :max="max"
      step="any"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
      aria-label="Video seekbar"
    />
  </span>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 0,
    },
    showChapterMarks: {
      type: Boolean,
      default: true,
    },
    displayChapters: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'seek'],
  data() {
    return {
      hoveredChapter: null,
      hoveredChapterX: 0,
    };
  },
  computed: {
    fillPercent() {
      return this.max > this.min
        ? ((this.modelValue - this.min) / (this.max - this.min)) * 100
        : 0;
    },
  },
  methods: {
    onInput(e) {
      const time = parseFloat(e.target.value);
      this.$emit('update:modelValue', time);
      this.$emit('seek', time);
    },
    onKeydown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowRight' ? 5 : -5;
        const newTime = this.modelValue + delta;
        this.$emit('update:modelValue', newTime);
        this.$emit('seek', newTime);
      }
    },
    onHover(e) {
      if (!this.displayChapters.length) {
        this.hoveredChapter = null;
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const timeAtCursor = this.min + ratio * (this.max - this.min);

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
    onLeave() {
      this.hoveredChapter = null;
    },
  },
};
</script>

<style scoped>
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
</style>