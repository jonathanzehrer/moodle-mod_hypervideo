<template>
  <div v-if="show" class="hypervideo-survey-overlay" ref="overlayEl">
    <div class="hypervideo-survey">
      <button class="hypervideo-survey-close" @click="dismiss" aria-label="Close survey">&times;</button>
      <p class="hypervideo-survey-question">{{ question }}</p>
      <div class="hypervideo-survey-options">
        <button
          v-for="opt in translatedOptions"
          :key="opt.value"
          class="hypervideo-survey-btn"
          :class="{ active: selectedValue === opt.value }"
          @click="select(opt.value)"
          :aria-label="opt.label"
        >
          <span class="hypervideo-survey-btn-value">{{ opt.value }}</span>
          <span class="hypervideo-survey-btn-label">{{ opt.label }}</span>
        </button>
      </div>
      <button
        v-if="selectedValue !== null"
        class="btn btn-primary hypervideo-survey-submit"
        @click="submit"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    question: {
      type: String,
      default: '',
    },
    submitLabel: {
      type: String,
      default: 'Submit',
    },
  },
  emits: ['submit', 'close'],
  data() {
    return {
      selectedValue: null,
    };
  },
  computed: {
    translatedOptions() {
      return [
        { value: 1, label: this.$t('survey_label_1') },
        { value: 2, label: this.$t('survey_label_2') },
        { value: 3, label: this.$t('survey_label_3') },
        { value: 4, label: this.$t('survey_label_4') },
        { value: 5, label: this.$t('survey_label_5') },
      ];
    },
  },
  methods: {
    select(value) {
      this.selectedValue = value;
    },
    submit() {
      if (this.selectedValue !== null) {
        this.$emit('submit', this.selectedValue);
        this.selectedValue = null;
      }
    },
    dismiss() {
      this.$emit('close');
    },
    onKeydown(e) {
      if (e.key === 'Escape') {
        this.dismiss();
      }
    },
  },
  watch: {
    show(val) {
      if (val) {
        this.selectedValue = null;
        document.addEventListener('keydown', this.onKeydown);
      } else {
        document.removeEventListener('keydown', this.onKeydown);
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown);
  },
};
</script>

<style scoped>
.hypervideo-survey-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 8px;
  z-index: 10;
}

.hypervideo-survey {
  position: relative;
  max-width: 480px;
  width: 90%;
  padding: 1.5rem;
  padding-top: 2rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.hypervideo-survey-close {
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
}

.hypervideo-survey-close:hover {
  color: #222;
}

.hypervideo-survey-question {
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
  text-align: center;
  color: #222;
}

.hypervideo-survey-options {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.hypervideo-survey-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.3rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  text-align: center;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  line-height: 1.2;
}

.hypervideo-survey-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.hypervideo-survey-btn.active {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}

.hypervideo-survey-btn-value {
  font-size: 1rem;
  font-weight: 700;
}

.hypervideo-survey-btn-label {
  font-size: 0.65rem;
  white-space: nowrap;
}

.hypervideo-survey-submit {
  display: block;
  margin: 0 auto;
}
</style>