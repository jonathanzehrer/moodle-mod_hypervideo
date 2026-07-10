<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="variant">
      <div class="player-container">
        <VideoPlayer
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          :range="range"
          :chapters="chapters"
          :current-chapter-title="currentChapterTitle"
          :show-chapter-marks="false"
          :enable-survey="enableSurvey"
          :on-previous="goToPreviousChapter"
          :on-next="goToNextChapter"
          :on-overview="null"
          :logger="logger"
          fullscreen-sidebar-position="right"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
        >
          <template #fullscreen-sidebar>
            <ChapterOverview
              :chapters="chapters"
              :current-time="currentTime"
              :duration="duration"
              :range="range"
              :video-url="url"
              @seek="onChapterSeek"
            />
          </template>
        </VideoPlayer>
      </div>

      <!-- Chapter Overview sidebar: always visible on the right -->
      <div v-if="chapters.length" class="chapters-sidebar">
        <ChapterOverview
          :chapters="chapters"
          :current-time="currentTime"
          :duration="duration"
          :range="range"
          :video-url="url"
          @seek="onChapterSeek"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Logger from "./scripts/logger";
import Communication from "./scripts/communication";
import VideoPlayer from "./components/VideoPlayer.vue";
import ChapterOverview from "./components/ChapterOverview.vue";

export default {
  components: {
    VideoPlayer,
    ChapterOverview,
  },
  data() {
    return {
      logger: null,
      headingId: "",
      currentTime: 0,
      duration: 0,
      range: { start: 0, end: null },
      rangeSet: false,
    };
  },
  computed: {
    url() {
      return this.$store.state.url;
    },
    title() {
      return this.$store.state.title;
    },
    chapters() {
      return this.$store.state.chapters;
    },
    enableSurvey() {
      // No chapters: full video mode — survey shows at the end
      if (this.chapters.length === 0) {
        return true;
      }
      // Chapters: survey only on the last chapter
      const lastChapter = this.chapters[this.chapters.length - 1];
      return this.range.start === lastChapter.time;
    },
    currentChapter() {
      if (!this.range || !this.chapters.length) return null;
      return this.chapters.find(ch => ch.time === this.range.start) || null;
    },
    currentChapterTitle() {
      return this.currentChapter ? this.currentChapter.title : '';
    },
  },
  watch: {
    chapters: {
      immediate: true,
      handler(chaps) {
        if (chaps && chaps.length && !this.rangeSet) {
          this.selectFirstChapter();
        }
      },
    },
  },
  mounted() {
    this.headingId = "hypervideo-title-" + Math.floor(Math.random() * 10000);
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "player3",
        outputType: 1,
        url: this.$store.state.url,
      },
    );
    this.logger.init();
    this.getVideoProgress();
    this.preloadVideoDuration();
  },
  methods: {
    async getVideoProgress() {
      const response = await Communication.webservice("get_video_progress", {
        data: {
          course: parseInt(this.$store.getters.getCourseid, 10),
          hypervideo: parseInt(this.$store.getters.getHypervideoid, 10),
        },
      });
      if (response.success) {
        const parsed = JSON.parse(response.data);
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.setInitialProgress(parsed.videoprogress);
        }
      }
    },
    selectFirstChapter() {
      if (!this.chapters.length) return;
      this.onChapterSeek(this.chapters[0].time);
    },
    onChapterSeek(time) {
      const idx = this.chapters.findIndex(ch => ch.time === time);
      if (idx === -1) return;
      const start = time;
      const nextChapter = this.chapters[idx + 1];
      const end = nextChapter ? nextChapter.time : null;
      this.rangeSet = true;
      this.range = { start, end };
      if (this.logger) {
        this.logger.add("chapter-seek", {
          context: "player3",
          action: "chapter-seek",
          values: time,
          currenttime: time,
          duration: this.duration,
        });
      }
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    onPlayerReady({ duration }) {
      this.duration = duration;
      if (this.range && this.range.end == null) {
        this.rangeSet = true;
        this.range = { ...this.range, end: duration };
      }
    },
    preloadVideoDuration() {
      if (!this.url) return;
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = this.url;
      video.addEventListener('loadedmetadata', () => {
        if (video.duration > 0) {
          this.duration = video.duration;
        }
        video.remove();
      });
      video.addEventListener('error', () => {
        video.remove();
      });
    },
    goToPreviousChapter() {
      const sorted = [...this.chapters].sort((a, b) => a.time - b.time);
      const currentStart = this.range ? this.range.start : 0;
      let prevChapter = null;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].time < currentStart - 0.5) {
          prevChapter = sorted[i];
          break;
        }
      }
      if (prevChapter) {
        this.onChapterSeek(prevChapter.time);
      }
    },
    goToNextChapter() {
      const sorted = [...this.chapters].sort((a, b) => a.time - b.time);
      const currentStart = this.range ? this.range.start : 0;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time > currentStart + 0.5) {
          this.onChapterSeek(sorted[i].time);
          return;
        }
      }
    },
  },
};
</script>

<style scoped>

.variant {
  display: flex;
  gap: 1rem;
}

.chapters-sidebar {
  width: 220px;
  position: relative;
}

.hypervideo-title {
  margin-bottom: 1rem;
}

</style>