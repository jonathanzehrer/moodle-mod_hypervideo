<template>
  <div class="speed-control">
    <button
      class="btn btn-speed"
      @click="toggleSpeedMenu"
      @keydown="onSpeedTriggerKeydown"
      :title="$t('playback_speed')"
      aria-haspopup="true"
      :aria-expanded="speedMenuOpen"
      aria-label="Playback speed"
    >
      <span class="speed-label">{{ playbackSpeed }}x</span>
    </button>
    <transition name="speed-fade">
      <div
        v-if="speedMenuOpen"
        class="speed-menu"
        role="menu"
        @keydown="onSpeedMenuKeydown"
      >
        <button
          v-for="speed in speedOptions"
          :key="speed"
          class="speed-option"
          :class="{ 'speed-option--active': playbackSpeed === speed }"
          role="menuitem"
          @click="setPlaybackSpeed(speed)"
        >
          {{ speed }}x
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    video: {
      type: HTMLVideoElement,
      default: null,
    },
  },
  emits: ['speed-change'],
  data() {
    return {
      playbackSpeed: 1,
      speedMenuOpen: false,
      speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
    };
  },
  mounted() {
    document.addEventListener('click', this.closeSpeedMenu);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeSpeedMenu);
  },
  methods: {
    toggleSpeedMenu() {
      this.speedMenuOpen = !this.speedMenuOpen;
      if (this.speedMenuOpen) {
        this.$nextTick(() => {
          const menu = this.$el.querySelector('.speed-menu');
          if (menu) {
            const active = menu.querySelector('.speed-option--active');
            (active || menu.querySelector('.speed-option'))?.focus();
          }
        });
      }
    },
    setPlaybackSpeed(speed) {
      const oldSpeed = this.playbackSpeed;
      this.playbackSpeed = speed;
      if (this.video) {
        this.video.playbackRate = speed;
      }
      this.speedMenuOpen = false;
      this.$nextTick(() => {
        this.$el.querySelector('.btn-speed')?.focus();
      });
      this.$emit('speed-change', {
        context: 'player',
        action: 'speed-change',
        values: JSON.stringify({ from: oldSpeed, to: speed }),
        currenttime: this.video ? this.video.currentTime : 0,
        duration: this.video ? this.video.duration : 0,
      });
    },
    onSpeedTriggerKeydown(e) {
      if (!this.speedMenuOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.speedMenuOpen = false;
        this.$nextTick(() => {
          this.$el.querySelector('.btn-speed')?.focus();
        });
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        this.$nextTick(() => {
          const menu = this.$el.querySelector('.speed-menu');
          if (menu) {
            const active = menu.querySelector('.speed-option--active');
            (active || menu.querySelector('.speed-option'))?.focus();
          }
        });
      }
    },
    onSpeedMenuKeydown(e) {
      const items = Array.from(this.$el.querySelectorAll('.speed-option'));
      if (!items.length) return;
      const current = items.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (current < items.length - 1) {
            items[current + 1].focus();
          } else {
            items[0].focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (current > 0) {
            items[current - 1].focus();
          } else {
            items[items.length - 1].focus();
          }
          break;
        case 'Home':
          e.preventDefault();
          items[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case 'Escape':
          e.preventDefault();
          this.speedMenuOpen = false;
          this.$nextTick(() => {
            this.$el.querySelector('.btn-speed')?.focus();
          });
          break;
        case 'Tab':
          this.speedMenuOpen = false;
          break;
      }
    },
    closeSpeedMenu(e) {
      if (this.speedMenuOpen && !this.$el.contains(e.target)) {
        this.speedMenuOpen = false;
      }
    },
  },
};
</script>

<style scoped>
.speed-control {
  position: relative;
  display: flex;
  align-items: center;
}

.speed-label {
  display: inline-block;
}

.btn-speed {
  display: flex;
  background: none;
  border: none;
  padding: 5px;
  color: #444;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: monospace;
  min-width: 3rem;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.btn-speed:hover {
  background: #e9ecef;
  color: #222;
}

.btn-speed:focus-visible {
  outline: 2px solid #004C97;
}

.speed-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 20;
  min-width: 72px;
}

.speed-option {
  display: block;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: none;
  font-size: 0.85rem;
  font-family: monospace;
  text-align: center;
  cursor: pointer;
  color: #333;
  transition: background 0.1s, color 0.1s;
}

.speed-option:hover {
  background: #f0f0f0;
}

.speed-option--active {
  color: #004C97;
  background-color: #004C9730;
  font-weight: 600;
}

.speed-fade-enter-active,
.speed-fade-leave-active {
  transition: opacity 0.15s ease;
}

.speed-fade-enter-from,
.speed-fade-leave-to {
  opacity: 0;
}
</style>