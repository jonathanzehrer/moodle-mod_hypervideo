<template>
  <button
    class="btn btn-mute"
    @click="toggleMute"
    :title="isMuted || volume === 0 ? $t('unmute') : $t('mute')"
    :aria-label="isMuted || volume === 0 ? $t('unmute') : $t('mute')"
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
      :aria-label="$t('volume') || 'Volume'"
    />
  </span>
</template>

<script>
export default {
  props: {
    video: {
      type: HTMLVideoElement,
      default: null,
    },
    initialVolume: {
      type: Number,
      default: 1,
    },
    initialMuted: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['volume-change', 'mute-change'],
  data() {
    return {
      volume: this.initialVolume,
      isMuted: this.initialMuted,
      prevVolume: this.initialVolume,
    };
  },
  watch: {
    initialVolume(val) {
      this.volume = val;
    },
    initialMuted(val) {
      this.isMuted = val;
    },
  },
  methods: {
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
        if (this.video) {
          this.video.muted = false;
        }
      } else {
        this.isMuted = true;
        if (this.video) {
          this.video.muted = true;
        }
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
  },
};
</script>

<style scoped>

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

.btn:hover{
  background: #e9ecef;
  color: #222;
}

.btn:focus-visible{
  background: #e9ecef;
  color: #222;
  outline: 2px solid #004C97;
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
</style>