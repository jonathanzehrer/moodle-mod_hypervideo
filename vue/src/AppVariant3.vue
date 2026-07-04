<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="row mt-3">
      <div v-if="chapters.length" class="col-md-3">
        <ChapterOverview
          :chapters="chapters"
          :current-time="currentTime"
          :duration="duration"
          @seek="onChapterSeek"
        />
      </div>
      <div :class="chapters.length ? 'col-md-9' : 'col-12'">
        <VideoPlayer
          v-if="range"
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          :range="range"
          :enable-survey="enableSurvey"
          @play="onPlayerPlay"
          @pause="onPlayerPause"
          @seeked="onPlayerSeeked"
          @ended="onPlayerEnded"
          @playback="onPlayerPlayback"
          @chapter-seek="onPlayerChapterSeek"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
          @survey-response="onSurveyResponse"
        />
        <div v-if="!range" class="chapter-placeholder">
          Select a chapter to start watching
        </div>
        <div class="variant-indicator variant-3">
          You are looking at variant 3
        </div>
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
      range: null,
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
      if (!this.range || this.chapters.length === 0) {
        return false;
      }
      const lastChapter = this.chapters[this.chapters.length - 1];
      return this.range.start === lastChapter.time;
    },
  },
  mounted() {
    this.headingId = "hypervideo-title-" + Math.floor(Math.random() * 10000);
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "media_hypervideo",
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
    onChapterSeek(time) {
      const idx = this.chapters.findIndex(ch => ch.time === time);
      if (idx === -1) return;
      const start = time;
      const nextChapter = this.chapters[idx + 1];
      const end = nextChapter ? nextChapter.time : null;
      this.range = { start, end };
    },
    onPlayerPlay(details) {
      this.log("play", details);
    },
    onPlayerPause(details) {
      this.log("pause", details);
    },
    onPlayerSeeked(details) {
      this.log("seeked", details);
    },
    onPlayerEnded(details) {
      this.log("ended", details);
    },
    onPlayerPlayback(details) {
      this.log("playback", details);
    },
    onPlayerChapterSeek(details) {
      this.log("chapter-seek", details);
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    onPlayerReady({ duration }) {
      this.duration = duration;
      if (this.range && this.range.end == null) {
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
    onSurveyResponse(rating) {
      this.log('survey_response', {
        context: 'media_hypervideo',
        action: 'survey_response',
        values: rating,
        currenttime: 0,
        duration: 0,
      });
    },
    log(key, values) {
      if (this.logger) {
        this.logger.add(key, values);
      }
    },
  },
};
</script>

<style>
.hypervideo {
  position: relative;
}

.player-container {
  width: 100%;
  height: auto;
}

.hypervideo-title {
  margin-bottom: 0;
}

.hypervideo-error {
  margin-top: 1rem;
}

.hypervideo-player {
  width: 100%;
  height: auto;
}

.chapter-placeholder {
  padding: 2rem;
  text-align: center;
  color: #666;
  border: 2px dashed #ccc;
  border-radius: 8px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.variant-indicator {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
}

.variant-3 {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
</style>
