<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="row mt-3">
      <div class="col-12">
        <VideoPlayer
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          @play="onPlayerPlay"
          @pause="onPlayerPause"
          @seeked="onPlayerSeeked"
          @ended="onPlayerEnded"
          @playback="onPlayerPlayback"
          @timeline-seek="onPlayerTimelineSeek"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
          @survey-response="onSurveyResponse"
        />
        <div class="variant-indicator variant-1">
          You are looking at variant 1
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logger from "./scripts/logger";
import Communication from "./scripts/communication";
import VideoPlayer from "./components/VideoPlayer.vue";

export default {
  // Register child components
  components: {
    VideoPlayer,
  },
  data() {
    return {
      logger: null,
      headingId: "hypervideo-title-" + Math.floor(Math.random() * 10000),
    }
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
  },
  mounted() {
    // this.headingId = ;
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "player1",
        outputType: 1,
        url: this.$store.state.url,
      },
    );
    this.logger.init();
    this.getVideoProgress();
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
    onPlayerTimelineSeek(details) {
      this.log("timeline-seek", details);
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      // Time info available if needed by parent
    },
    onPlayerReady({ duration }) {
      // Duration available if needed by parent
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

.hypervideo-title {
  margin-bottom: 0;
}

.variant-indicator {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
}

.variant-1 {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
</style>