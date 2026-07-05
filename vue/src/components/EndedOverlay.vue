<template>
  <div class="ended-overlay">
    <div class="ended-overlay-content">
      <button
        class="ended-replay-btn"
        @click.stop="$emit('replay')"
        :title="$t('rewatch')"
        :aria-label="$t('rewatch')"
      >
        <span class="material-symbols" aria-hidden="true">replay</span>
      </button>
      <div v-if="showPrevNext" class="ended-nav">
        <button
          class="ended-nav-btn"
          :disabled="!hasPrevious"
          :title="$t('previous_' + prevNextTitle)"
          :aria-label="$t('previous_' + prevNextTitle)"
          @click.stop="$emit('previous')"
        >
          <span class="material-symbols" aria-hidden="true">skip_previous</span>
        </button>
        <button
          class="ended-nav-btn"
          :disabled="!hasNext"
          :title="$t('next_' + prevNextTitle)"
          :aria-label="$t('next_' + prevNextTitle)"
          @click.stop="$emit('next')"
        >
          <span class="material-symbols" aria-hidden="true">skip_next</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    showPrevNext: {
      type: Boolean,
      default: false,
    },
    prevNextTitle: {
      type: String,
      default: 'video',
    },
    hasPrevious: {
      type: Boolean,
      default: false,
    },
    hasNext: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['replay', 'previous', 'next'],
};
</script>

<style scoped>
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
</style>